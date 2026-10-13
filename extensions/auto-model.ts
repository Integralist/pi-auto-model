import { readFileSync } from "node:fs";
import { dirname } from "node:path";
import { getSupportedThinkingLevels, type Model, type Api, type ModelThinkingLevel } from "@earendil-works/pi-ai";
import {
  stripFrontmatter,
  VIRTUAL_MODEL_STATE_ENTRY,
  type ExtensionAPI,
  type ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { resolveRoute, resolveTaskRoute, type AutomaticEffort, type PhysicalPair, type TaskInput } from "../src/policy.ts";

type State = { version: 1; current: PhysicalPair; captured?: PhysicalPair };
type Candidate = {
  expected: string;
  task?: TaskInput["task"];
  path?: string;
  sessionId: string;
  lastUserId?: string;
  generation: number;
};
const provider = "github-copilot";
const modelId = "auto";
const efforts: readonly AutomaticEffort[] = ["off", "minimal", "low", "medium", "high", "xhigh"];

function text(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.map((block) => block?.type === "text" && typeof block.text === "string" ? block.text : "").join("");
}

function physical(model: Model<Api> | undefined, level: ModelThinkingLevel | undefined): PhysicalPair | undefined {
  if (!model || model.api === "pi-virtual" || !level || !efforts.includes(level as AutomaticEffort)) return undefined;
  if (!getSupportedThinkingLevels(model).includes(level)) return undefined;
  return { provider: model.provider, model: model.id, effort: level as AutomaticEffort };
}

function pair(value: unknown, ctx: ExtensionContext): PhysicalPair | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.provider !== "string" || typeof candidate.model !== "string" || typeof candidate.effort !== "string") return undefined;
  return physical(ctx.modelRegistry.find(candidate.provider, candidate.model), candidate.effort as ModelThinkingLevel);
}

function state(value: unknown, ctx: ExtensionContext): State | undefined {
  if (!value || typeof value !== "object" || (value as { version?: unknown }).version !== 1) return undefined;
  const raw = value as { current?: unknown; captured?: unknown };
  const current = pair(raw.current, ctx);
  return current ? { version: 1, current, captured: pair(raw.captured, ctx) } : undefined;
}

function branchState(ctx: ExtensionContext): State | undefined {
  for (const entry of ctx.sessionManager.getBranch().toReversed()) {
    if (entry.type !== "custom" || entry.customType !== VIRTUAL_MODEL_STATE_ENTRY || !entry.data || typeof entry.data !== "object") continue;
    const raw = entry.data as { provider?: unknown; modelId?: unknown; state?: unknown };
    if (raw.provider === provider && raw.modelId === modelId) return state(raw.state, ctx);
  }
  return undefined;
}

function lastUser(ctx: ExtensionContext) {
  return ctx.sessionManager.getBranch().findLast((entry) => entry.type === "message" && entry.message.role === "user");
}

function selectedPhysical(ctx: ExtensionContext): PhysicalPair | undefined {
  let model: Model<Api> | undefined;
  let effort: ModelThinkingLevel | undefined;
  let captured: PhysicalPair | undefined;
  for (const entry of ctx.sessionManager.getBranch()) {
    if (entry.type === "thinking_level_change") effort = entry.thinkingLevel as ModelThinkingLevel;
    if (entry.type === "model_change") {
      const next = ctx.modelRegistry.find(entry.provider, entry.modelId);
      model = next?.api === "pi-virtual" ? undefined : next;
    }
    captured = physical(model, effort) ?? captured;
  }
  return captured;
}

function confirmation(value: string) {
  return /^(yes|y|ok|okay|go|continue|proceed|approve|approved|sounds good)[.!]*$/i.test(value.trim());
}

export default function autoModel(pi: ExtensionAPI, configuration?: unknown): void {
  let raw: Candidate | undefined;
  let accepted: Candidate | undefined;
  let captured: PhysicalPair | undefined;
  let generation = 0;
  let lifecycle = new AbortController();
  let activeSession = "";
  const invalidate = () => {
    lifecycle.abort(); lifecycle = new AbortController(); generation++;
    raw = undefined; accepted = undefined;
  };
  const restore = (ctx: ExtensionContext) => {
    invalidate(); activeSession = ctx.sessionManager.getSessionId();
    captured = physical(ctx.model, ctx.thinkingLevel) ?? branchState(ctx)?.captured ?? selectedPhysical(ctx);
  };

  pi.registerVirtualModel<State>({
    provider, id: modelId, name: "Auto", thinkingLevels: ["high", "xhigh"],
    async route(request, ctx) {
      const saved = state(request.state, ctx) ?? branchState(ctx);
      const current = physical(request.previous?.model, request.previous?.thinkingLevel) ?? saved?.current;
      const startup = saved?.captured ?? captured;
      if (request.reason === "direct") {
        return resolveRoute(configuration, { direct: true, current, captured: startup }, ctx.modelRegistry);
      }
      const failed = request.reason === "retry" ? request.failed : undefined;
      const sticky = failed ?? (request.reason === "continuation" ? request.previous : undefined);
      const stickyPair = physical(sticky?.model, sticky?.thinkingLevel);
      if (sticky && stickyPair) {
        request.signal?.throwIfAborted();
        return { model: sticky.model, thinkingLevel: stickyPair.effort, state: request.state };
      }
      const candidate = request.reason === "user" ? accepted : undefined;
      accepted = undefined;
      const entry = lastUser(ctx);
      const latest = request.messages.findLast((message) => message.role === "user");
      const owned = candidate && candidate.generation === generation && candidate.sessionId === activeSession
        && activeSession === ctx.sessionManager.getSessionId() && entry?.type === "message"
        && entry.message.role === "user" && entry.id !== candidate.lastUserId
        && text(entry.message.content) === candidate.expected
        && text(latest?.content) === candidate.expected;
      const version = generation;
      const sessionId = ctx.sessionManager.getSessionId();
      const userEntryId = owned ? entry.id : undefined;
      const originSignal = lifecycle.signal;
      const result = await resolveTaskRoute(configuration, {
        task: owned ? candidate.task : undefined, current, captured: startup,
      }, ctx.modelRegistry, {
        signal: request.signal, lifecycleSignal: originSignal,
        onClassifierUsage(record) {
          if (!userEntryId || version !== generation || sessionId !== activeSession || sessionId !== ctx.sessionManager.getSessionId()) return;
          if (!ctx.sessionManager.getBranch().some((item) => item.id === userEntryId)) return;
          pi.appendEntry("pi-auto-model.classifier-usage", { sessionId, userEntryId, pair: record.pair, usage: record.usage });
        },
      });
      request.signal?.throwIfAborted();
      if (originSignal.aborted || version !== generation || sessionId !== activeSession) {
        throw new Error("Auto task was canceled before dispatch; submit it in the active session.");
      }
      const chosen = physical(result.model, result.thinkingLevel)!;
      return { model: result.model, thinkingLevel: result.thinkingLevel, state: { version: 1, current: chosen, captured: startup } };
    },
  });

  pi.on("session_start", (_event, ctx) => restore(ctx));
  pi.on("session_tree", (_event, ctx) => restore(ctx));
  pi.on("session_before_tree", () => { invalidate(); });
  pi.on("session_before_switch", () => { invalidate(); });
  pi.on("session_before_fork", () => { invalidate(); });
  pi.on("session_shutdown", () => { invalidate(); activeSession = ""; captured = undefined; });
  pi.on("agent_end", () => { raw = undefined; accepted = undefined; });
  pi.on("model_select", (event, ctx) => {
    invalidate(); activeSession = ctx.sessionManager.getSessionId();
    captured = physical(event.model, ctx.thinkingLevel) ?? selectedPhysical(ctx)
      ?? physical(event.previousModel, ctx.thinkingLevel) ?? branchState(ctx)?.captured ?? captured;
  });

  pi.on("input", (event, ctx) => {
    raw = undefined;
    if (ctx.model?.provider !== provider || ctx.model.id !== modelId || ctx.model.api !== "pi-virtual") return;
    if (event.source === "extension" || event.streamingBehavior || !ctx.isIdle() || ctx.hasPendingMessages()) return;
    let expected = event.text;
    let task: TaskInput["task"];
    let path: string | undefined;
    if (event.text.startsWith("/skill:")) {
      const split = event.text.indexOf(" ");
      const name = split < 0 ? event.text.slice(7) : event.text.slice(7, split);
      const args = split < 0 ? "" : event.text.slice(split + 1).trim();
      const command = pi.getCommands().find((item) => item.source === "skill" && item.name === `skill:${name}`);
      path = command?.sourceInfo?.path;
      if (!path || !command) return;
      try {
        const content = readFileSync(path, "utf8");
        const block = `<skill name="${name}" location="${path}">\nReferences are relative to ${dirname(path)}.\n\n${stripFrontmatter(content).trim()}\n</skill>`;
        expected = args ? `${block}\n\n${args}` : block;
        task = { kind: "skill", name, description: command.description ?? "", content };
      } catch { return; }
    } else if (event.text.startsWith("/")) return;
    else if (!confirmation(event.text) && event.text.trim()) task = { kind: "typed", text: event.text };
    raw = { expected, task, path, sessionId: ctx.sessionManager.getSessionId(), lastUserId: lastUser(ctx)?.id, generation };
  });

  pi.on("before_agent_start", (event, ctx) => {
    accepted = undefined;
    const candidate = raw; raw = undefined;
    if (event.messageType !== "user" || !candidate || candidate.expected !== event.prompt) return;
    if (candidate.generation !== generation || candidate.sessionId !== ctx.sessionManager.getSessionId()) return;
    if (candidate.path && candidate.task?.kind === "skill") {
      try { if (readFileSync(candidate.path, "utf8") !== candidate.task.content) return; }
      catch { return; }
    }
    accepted = candidate;
  });
}
