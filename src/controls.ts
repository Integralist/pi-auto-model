import { join } from "node:path";
import { getSupportedThinkingLevels, type Api, type Model } from "@earendil-works/pi-ai";
import { getAgentDir, VIRTUAL_MODEL_STATE_ENTRY, type ExtensionAPI, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import { configureMappings } from "./configure.ts";
import { validateConfiguration, type Configuration, type PhysicalPair } from "./policy.ts";
import { formatPair, readSettings, validateMappings, validatePreferences, writeSettings, type Preferences } from "./settings.ts";

type ControlState = Preferences & { fixed?: PhysicalPair };
type Action = { kind: "configure" } | { kind: "mode"; mode: Preferences["mode"] } | { kind: "save"; policy: Configuration }
  | { kind: "activate-policy"; policy: Configuration } | { kind: "activate-mode"; preferences: Preferences }
  | { kind: "temp"; group: "bedrock" | undefined };
type Hooks = {
  directory?: string;
  readPolicy(): unknown;
  setPolicy(raw: unknown): void;
  current(ctx: ExtensionContext): PhysicalPair | undefined;
  capture(pair: PhysicalPair | undefined): void;
  invalidate(): void;
  clearPopup(): void;
};

const entryType = "pi-auto-model.controls";
const temporaryEntryType = "pi-auto-model.temp";
const bedrock = {
  tiers: {
    trivial: { provider: "amazon-bedrock", model: "anthropic.claude-haiku-5-5", effort: "medium" },
    moderate: { provider: "amazon-bedrock", model: "anthropic.claude-haiku-5-5", effort: "high" },
    complex: { provider: "amazon-bedrock", model: "anthropic.claude-opus-5-5", effort: "high" },
    frontier: { provider: "amazon-bedrock", model: "anthropic.claude-opus-5-5", effort: "xhigh" },
  },
  classifier: { provider: "amazon-bedrock", model: "anthropic.claude-haiku-5-5", effort: "low" },
} satisfies { tiers: Configuration["tiers"]; classifier: PhysicalPair };

function temporaryPolicy(config: Configuration, group: "bedrock" | undefined): Configuration {
  if (!group) return config;
  const mappings = structuredClone(bedrock);
  return { ...config, tiers: mappings.tiers, classifier: { ...config.classifier, ...mappings.classifier } };
}

const isAuto = (model: Model<Api> | undefined) => model?.provider === "pi-auto-model" && model.id === "auto" && model.api === "pi-virtual";

function branchState(ctx: ExtensionContext): ControlState | undefined {
  const entry = ctx.sessionManager.getBranch().findLast((entry) => entry.type === "custom" && entry.customType === entryType);
  if (entry?.type !== "custom") return undefined;
  const raw = entry.data as Partial<ControlState> | null;
  try {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)
      || Object.keys(raw).some((key) => !["version", "mode", "fixed"].includes(key))) {
      throw new Error("Expected version 2, mode and optional fixed physical pair.");
    }
    const preferences = validatePreferences({ version: raw.version, mode: raw.mode });
    if (raw.fixed === undefined) return preferences;
    const fixed = raw.fixed;
    const model = typeof fixed?.provider === "string" && typeof fixed?.model === "string"
      ? ctx.modelRegistry.find(fixed.provider, fixed.model) : undefined;
    if (!model || model.api === "pi-virtual" || Object.keys(fixed).sort().join(",") !== "effort,model,provider"
      || !["off", "minimal", "low", "medium", "high", "xhigh"].includes(fixed.effort)) {
      throw new Error("Expected a catalogued physical model with a non-max effort.");
    }
    return { ...preferences, fixed: { provider: model.provider, model: model.id, effort: fixed.effort } };
  } catch (error) {
    throw new Error("Invalid Auto controls at branch entry " + entry.id + ": " + String(error));
  }
}

export function registerControls(pi: ExtensionAPI, hooks: Hooks) {
  const directory = hooks.directory ?? getAgentDir();
  const policyPath = join(directory, "pi-auto-model.json"), preferencesPath = join(directory, "pi-auto-model-state.json");
  let preferences: Preferences = { version: 2, mode: "model-and-effort" };
  let control: ControlState = { ...preferences }, initialized = false;
  let configurationFailure: string | undefined, branchFailure: string | undefined;
  let temporaryGroup: "bedrock" | undefined, temporaryFailure: string | undefined;
  let sessionId: string | undefined, epoch = 0;
  let queue: Action[] = [], timer: ReturnType<typeof setTimeout> | undefined;
  let active: object | undefined;

  const valid = (ctx: ExtensionContext, owner: number) => initialized && epoch === owner && sessionId === ctx.sessionManager.getSessionId();
  const report = (ctx: ExtensionContext, message: string, type: "info" | "error" = "info") => {
    if (ctx.hasUI) ctx.ui.notify(message, type);
    else (type === "error" ? process.stderr : process.stdout).write("Auto: " + message + "\n");
  };
  function status(ctx: ExtensionContext) {
    const current = hooks.current(ctx);
    ctx.ui.setStatus("pi-auto-model", isAuto(ctx.model)
      ? "Auto · " + control.mode + (temporaryGroup ? " · temp " + temporaryGroup : "")
        + (current ? " → " + formatPair(current) : " · no physical dispatch yet") : undefined);
  }
  function cancel() {
    epoch++; queue = []; active = undefined; if (timer) clearTimeout(timer); timer = undefined;
    hooks.invalidate(); hooks.clearPopup();
  }
  function restoreBranch(ctx: ExtensionContext) {
    branchFailure = undefined;
    try {
      control = branchState(ctx) ?? { ...preferences };
      const branch = ctx.sessionManager.getBranch();
      const controlIndex = branch.findLastIndex((entry) => entry.type === "custom" && entry.customType === entryType);
      const newerRoute = branch.slice(controlIndex + 1).some((entry) => entry.type === "custom"
        && entry.customType === VIRTUAL_MODEL_STATE_ENTRY && entry.data && typeof entry.data === "object"
        && (entry.data as { provider?: unknown; modelId?: unknown }).provider === "pi-auto-model"
        && (entry.data as { modelId?: unknown }).modelId === "auto");
      // Native route capture is newer evidence, including its historical effort.
      if (control.fixed && !newerRoute) hooks.capture(control.fixed);
    } catch (error) {
      branchFailure = error instanceof Error ? error.message : String(error);
      report(ctx, branchFailure, "error");
    }
    temporaryGroup = undefined; temporaryFailure = undefined;
    const entry = ctx.sessionManager.getBranch().findLast((entry) => entry.type === "custom" && entry.customType === temporaryEntryType);
    if (entry?.type === "custom") {
      const raw = entry.data as { version?: unknown; group?: unknown } | null;
      if (!raw || typeof raw !== "object" || Array.isArray(raw) || raw.version !== 1
        || Object.keys(raw).sort().join(",") !== "group,version" || (raw.group !== "bedrock" && raw.group !== null)) {
        temporaryFailure = "Invalid temporary Auto preset at branch entry " + entry.id + ": expected version 1 and group bedrock or null. Use /automodel temp clear.";
        report(ctx, temporaryFailure, "error");
      } else temporaryGroup = raw.group ?? undefined;
    }
    status(ctx);
  }
  async function apply(action: Action, ctx: ExtensionContext, owner: number) {
    if (!valid(ctx, owner)) return;
    if (!ctx.isIdle() || ctx.hasPendingMessages()) { queue.unshift(action); flush(ctx); return; }
    if (configurationFailure) throw new Error(configurationFailure);
    if (action.kind === "temp") {
      if (action.group) validateMappings(temporaryPolicy(validateConfiguration(hooks.readPolicy(), ctx.modelRegistry), action.group), ctx.modelRegistry);
      pi.appendEntry(temporaryEntryType, { version: 1, group: action.group ?? null });
      temporaryGroup = action.group; temporaryFailure = undefined;
      hooks.clearPopup(); status(ctx);
      report(ctx, (temporaryGroup ? "Temporary preset " + temporaryGroup + " is active for this session; /automodel temp clear restores saved mappings."
        : "Temporary preset cleared; using saved/default mappings.") + " Model selection and mode preference are unchanged.");
      return;
    }
    if (action.kind === "configure") {
      if (ctx.mode !== "tui") { report(ctx, "Edit " + policyPath + " and /reload; interactive model picking requires terminal mode."); return; }
      const draft = await configureMappings(ctx, validateConfiguration(hooks.readPolicy(), ctx.modelRegistry), () => valid(ctx, owner));
      if (draft) {
        if (!ctx.isIdle() || ctx.hasPendingMessages()) { queue.unshift({ kind: "save", policy: draft }); flush(ctx); return; }
        await apply({ kind: "save", policy: draft }, ctx, owner);
      }
      return;
    }
    if (action.kind === "save") {
      const draft = validateMappings(action.policy, ctx.modelRegistry);
      await writeSettings(policyPath, draft, () => valid(ctx, owner));
      if (valid(ctx, owner)) await apply({ kind: "activate-policy", policy: draft }, ctx, owner);
      return;
    }
    if (action.kind === "activate-policy") {
      hooks.setPolicy(action.policy); hooks.clearPopup();
      status(ctx); report(ctx, "Saved model mappings. Model selection and mode preference are unchanged."
        + (temporaryGroup ? " Temporary preset " + temporaryGroup + " remains active; use /automodel temp clear to use the saved mappings." : ""));
      return;
    }
    if (action.kind === "mode") {
      if (isAuto(ctx.model) && action.mode === "effort-only" && !hooks.current(ctx)) {
        throw new Error("No known physical route. Select a physical model with /model before effort-only mode.");
      }
      const next: Preferences = { version: 2, mode: action.mode };
      await writeSettings(preferencesPath, next, () => valid(ctx, owner));
      if (valid(ctx, owner)) await apply({ kind: "activate-mode", preferences: next }, ctx, owner);
      return;
    }
    const fixed = action.preferences.mode === "effort-only" ? hooks.current(ctx) : undefined;
    if (isAuto(ctx.model) && action.preferences.mode === "effort-only" && !fixed) {
      throw new Error("Saved effort-only mode cannot activate without a known physical route. Select one with /model.");
    }
    preferences = action.preferences; control = { ...preferences, fixed }; branchFailure = undefined;
    // Configuration does not cancel an accepted task; routing snapshots its policy.
    hooks.clearPopup();
    if (fixed) hooks.capture(fixed);
    pi.appendEntry(entryType, structuredClone(control)); status(ctx);
  }
  async function run(action: Action, ctx: ExtensionContext) {
    const owner = epoch, token = {};
    active = token;
    try { await apply(action, ctx, owner); }
    catch (error) { if (valid(ctx, owner)) report(ctx, error instanceof Error ? error.message : String(error), "error"); }
    finally {
      if (active === token) { active = undefined; if (valid(ctx, owner)) flush(ctx); }
    }
  }
  function defer(action: Action, ctx: ExtensionContext) {
    if (active || queue.length || !ctx.isIdle() || ctx.hasPendingMessages()) {
      queue.push(action); flush(ctx);
      report(ctx, "Configuration queued for this session's safe idle boundary."); return Promise.resolve();
    }
    return run(action, ctx);
  }
  function flush(ctx: ExtensionContext) {
    if (active || timer || !queue.length) return;
    const owner = epoch;
    timer = setTimeout(() => {
      timer = undefined;
      if (!valid(ctx, owner) || active) return;
      if (!ctx.isIdle() || ctx.hasPendingMessages()) { flush(ctx); return; }
      const next = queue.shift();
      if (next) void run(next, ctx);
    }, 25);
    timer.unref();
  }
  function policy(ctx: ExtensionContext): Configuration {
    if (configurationFailure || branchFailure || temporaryFailure) throw new Error(configurationFailure ?? branchFailure ?? temporaryFailure);
    return { ...temporaryPolicy(validateConfiguration(hooks.readPolicy(), ctx.modelRegistry), temporaryGroup), mode: control.mode };
  }

  pi.registerCommand("automodel", {
    description: "Auto status/mode/configure/temp — select Auto or a physical model through /model",
    getArgumentCompletions: (prefix) => ["status", "configure", "mode model-and-effort", "mode effort-only", "temp bedrock", "temp clear"]
      .filter((value) => value.startsWith(prefix)).map((value) => ({ value, label: value })),
    handler: async (args, ctx) => {
      const words = args.trim().split(/\s+/), verb = words[0] || "status";
      if (verb === "status" && words.length === 1) {
        try {
          const config = policy(ctx), available = ctx.modelRegistry.getAvailable();
          const label = (pair: PhysicalPair) => formatPair(pair) + (available.some((model) => model.api !== "pi-virtual"
            && model.provider === pair.provider && model.id === pair.model && getSupportedThinkingLevels(model).includes(pair.effort)) ? "" : " [unavailable]");
          report(ctx, "Selection: " + (isAuto(ctx.model) ? "Auto" : ctx.model?.provider + "/" + ctx.model?.id)
            + "; mode: " + control.mode + "; pending: " + queue.length + "; policy: " + policyPath
            + "; mappings: " + (temporaryGroup ? "session preset " + temporaryGroup : "saved/default") + "\n"
            + Object.entries(config.tiers).map(([tier, pair]) => tier + ": " + label(pair)).join("\n")
            + "\nclassifier: " + label(config.classifier) + "; configured availability is not live entitlement."
            + "\nUse /model to select Auto or leave it for a physical model.");
        } catch (error) { report(ctx, String(error), "error"); }
        return;
      }
      if (verb === "configure" && words.length === 1) { await defer({ kind: "configure" }, ctx); return; }
      if (verb === "mode" && words.length === 2 && ["model-and-effort", "effort-only"].includes(words[1]!)) {
        await defer({ kind: "mode", mode: words[1] as Preferences["mode"] }, ctx); return;
      }
      if (verb === "temp" && words.length === 2 && ["bedrock", "clear"].includes(words[1]!)) {
        await defer({ kind: "temp", group: words[1] === "bedrock" ? "bedrock" : undefined }, ctx); return;
      }
      report(ctx, "Use /model to enter or leave Auto. Use /automodel status|configure or /automodel mode model-and-effort|effort-only or /automodel temp bedrock|clear.", "error");
    },
  });
  pi.on("session_start", async (_event, ctx) => {
    cancel(); initialized = false; configurationFailure = undefined; branchFailure = undefined;
    sessionId = ctx.sessionManager.getSessionId();
    try {
      const raw = await readSettings(policyPath);
      if (raw !== undefined) hooks.setPolicy(raw);
      let config: Configuration;
      try { config = validateConfiguration(hooks.readPolicy(), ctx.modelRegistry); }
      catch (error) { throw new Error(policyPath + ": " + String(error)); }
      const saved = await readSettings(preferencesPath);
      try { preferences = saved === undefined ? { version: 2, mode: config.mode } : validatePreferences(saved); }
      catch (error) { throw new Error(preferencesPath + ": " + String(error)); }
      initialized = true; restoreBranch(ctx);
    } catch (error) {
      initialized = true; configurationFailure = error instanceof Error ? error.message : String(error);
      report(ctx, configurationFailure, "error");
    }
  });
  pi.on("model_select", (event, ctx) => {
    cancel();
    if (valid(ctx, epoch) && !configurationFailure && !branchFailure && event.source !== "restore"
      && control.mode === "effort-only" && event.model.api !== "pi-virtual" && ctx.thinkingLevel !== "max") {
      const fixed = hooks.current(ctx);
      if (fixed && fixed.provider === event.model.provider && fixed.model === event.model.id) {
        // Observe the user's choice; this identity never selects or restores a model.
        control = { ...control, fixed };
        pi.appendEntry(entryType, structuredClone(control));
      }
    }
    status(ctx);
  });
  pi.on("message_end", (event, ctx) => { if (event.message.role === "assistant") status(ctx); });
  pi.on("agent_settled", (_event, ctx) => { flush(ctx); });
  pi.on("session_compact", (_event, ctx) => { flush(ctx); status(ctx); });
  pi.on("session_compact_failed", (_event, ctx) => { flush(ctx); });
  pi.on("session_tree", (_event, ctx) => { cancel(); restoreBranch(ctx); });
  pi.on("session_shutdown", () => { cancel(); initialized = false; sessionId = undefined; });
  return { policy };
}
