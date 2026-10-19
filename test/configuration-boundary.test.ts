import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ModelRegistry, SessionManager } from "@earendil-works/pi-coding-agent";
import { fauxAssistantMessage, getSupportedThinkingLevels } from "@earendil-works/pi-ai";
import { afterEach, expect, test, vi } from "vitest";
import { resolveRoute, validateConfiguration, type Configuration } from "../src/policy.ts";
import { writeSettings } from "../src/settings.ts";
import { createFixture, type Fixture } from "./support/session.ts";
import { createUI } from "./support/ui.ts";

const io = vi.hoisted(() => ({ beforeRename: undefined as undefined | ((destination: string) => Promise<void>) }));
vi.mock("node:fs/promises", async (original) => {
  const actual = await original<typeof import("node:fs/promises")>();
  return {
    ...actual,
    rename: async (...args: Parameters<typeof actual.rename>) => {
      await io.beforeRename?.(String(args[1]));
      return actual.rename(...args);
    },
  };
});

afterEach(() => { io.beforeRename = undefined; vi.restoreAllMocks(); });
const small = { name: "small", description: "Small", tier: "trivial" };
const hard = { name: "hard", description: "Hard", tier: "complex" };
const last = (f: Fixture) => f.session.messages.filter((message) => message.role === "assistant").at(-1)!;
const pause = (ms: number) => new Promise<void>((resolve) => { setTimeout(resolve, ms); });
const until = async (check: () => boolean) => { await expect.poll(check, { timeout: 2000 }).toBe(true); };
function gate() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => { release = resolve; });
  return { promise, release };
}
async function select(f: Fixture) { await f.session.setModel(f.runtime.getModel("pi-auto-model", "auto")!); }
function configuration(mode: Configuration["mode"] = "model-and-effort", provider = "github-copilot") {
  const raw = validateConfiguration(undefined, { find: () => undefined, getAvailable: () => [], hasConfiguredAuth: () => false });
  raw.mode = mode;
  for (const pair of Object.values(raw.tiers)) pair.provider = provider;
  raw.classifier.provider = provider;
  return raw;
}
function chooseSol(display: ReturnType<typeof createUI>) {
  display.answers.push("trivial: github-copilot/gpt-6-luna (medium)", "gpt-6.1-sol",
    "github-copilot/gpt-6.1-sol — gpt-6.1-sol", "high", "Review and save", true);
}
async function waitForMode(f: Fixture, mode: Configuration["mode"]) {
  await until(() => f.session.sessionManager.getBranch().some((entry) => entry.type === "custom"
    && entry.customType === "pi-auto-model.controls" && (entry.data as { mode?: unknown })?.mode === mode));
}

test.each(
  (["policy", "mode"] as const).flatMap((kind) => ["classifier", "main"].map((stage) => ({ kind, stage }))),
)("a delayed $kind save cannot cancel new $stage work or activate during its task", async ({ kind, stage }) => {
  const display = createUI(), entered = gate(), disk = gate(), classified = gate(), answer = gate();
  const f = await createFixture({ mode: "tui", ui: display.ui, skills: [small, hard] });
  let save: Promise<void> | undefined, run: Promise<void> | undefined;
  try {
    await select(f);
    const path = join(f.dir, kind === "policy" ? "pi-auto-model.json" : "pi-auto-model-state.json");
    io.beforeRename = async (destination) => { if (destination === path) { entered.release(); await disk.promise; } };
    if (kind === "policy") chooseSol(display);
    save = f.session.prompt(kind === "policy" ? "/automodel configure" : "/automodel mode effort-only");
    await entered.promise;
    const requests: { model: string; effort?: string }[] = [];
    f.faux.setResponses([
      async (_context, options, _state, model) => {
        requests.push({ model: model.id, effort: options?.reasoning }); classified.release();
        await answer.promise; return fauxAssistantMessage(stage === "classifier" ? "trivial" : "main");
      },
      ...stage === "classifier" ? [
        (_context: unknown,
          options: { reasoning?: string } | undefined, _state: unknown, model: { id: string }) => {
          requests.push({ model: model.id, effort: options?.reasoning }); return fauxAssistantMessage("main");
        },
      ] : [],
    ]);
    run = f.session.prompt(stage === "classifier" ? "write a short heading" : "/skill:small"); await classified.promise;
    disk.release(); await save;
    expect(existsSync(path)).toBe(true); expect(f.session.isStreaming).toBe(true);
    await f.session.prompt("/automodel status");
    expect(display.notices.at(-1)?.text).toMatch(/mode: model-and-effort; pending: 1/);
    answer.release(); await run;
    expect(last(f).stopReason).toBe("stop");
    expect(requests).toEqual(stage === "classifier" ? [{ model: "gpt-6-luna", effort: "low" }, { model: "gpt-6-luna", effort: "medium" }] : [{ model: "gpt-6-luna", effort: "medium" }]);
    if (kind === "mode") await waitForMode(f, "effort-only");
    else await until(() => display.notices.some((notice) => notice.text.startsWith("Saved model mappings.")));
    f.respond(); await f.session.prompt(kind === "mode" ? "/skill:hard" : "/skill:small");
    expect(last(f).model).toBe(kind === "mode" ? "gpt-6-luna" : "gpt-6.1-sol");
    expect(last(f).thinkingLevel).toBe(kind === "mode" ? "xhigh" : "high");
    expect(f.faux.state.callCount).toBe(stage === "classifier" ? 3 : 2); expect(f.errors).toEqual([]);
    expect(f.session.model?.id).toBe("auto");
  } finally {
    disk.release(); answer.release(); await save?.catch(() => {}); await run?.catch(() => {});
    await f.owner.dispose(); f.close();
  }
});

test("mode persistence finishing during input transformation preserves that task's classification ownership", async () => {
  const display = createUI(), entered = gate(), disk = gate(), input = gate(), continueInput = gate();
  const f = await createFixture({ mode: "tui", ui: display.ui, extensions: [(pi) => {
    pi.on("input", async (event) => {
      if (event.text === "a fresh typed task") { input.release(); await continueInput.promise; }
    });
  }] });
  let save: Promise<void> | undefined, run: Promise<void> | undefined;
  try {
    await select(f);
    io.beforeRename = async (destination) => { if (destination.endsWith("pi-auto-model-state.json")) { entered.release(); await disk.promise; } };
    save = f.session.prompt("/automodel mode effort-only"); await entered.promise;
    f.faux.setResponses([fauxAssistantMessage("trivial"), fauxAssistantMessage("main")]);
    run = f.session.prompt("a fresh typed task"); await input.promise;
    disk.release(); await save; continueInput.release(); await run;
    expect(last(f).stopReason).toBe("stop"); expect(last(f).model).toBe("gpt-6.1-sol");
    expect(last(f).thinkingLevel).toBe("medium"); expect(f.faux.state.callCount).toBe(2);
    expect(f.errors).toEqual([]);
  } finally {
    disk.release(); continueInput.release(); await save?.catch(() => {}); await run?.catch(() => {});
    await f.owner.dispose(); f.close();
  }
});

test.each(["mode", "policy"] as const)("queued %s still activates after a slower compaction observer finishes", async (kind) => {
  const display = createUI(), before = gate(), finishCompact = gate(), observer = gate(), finishObserver = gate();
  const f = await createFixture({ mode: "tui", ui: display.ui, skills: [small, hard], extensions: [(pi) => {
    pi.on("session_before_compact", async (event) => {
      before.release(); await finishCompact.promise;
      return { compaction: { summary: "offline compacted", firstKeptEntryId: event.preparation.firstKeptEntryId,
        tokensBefore: event.preparation.tokensBefore } };
    });
    pi.on("session_compact", async () => { observer.release(); await finishObserver.promise; });
  }] });
  let compact: ReturnType<typeof f.session.compact> | undefined;
  try {
    await select(f);
    f.respond("older ".repeat(100)); await f.session.prompt("/skill:small");
    f.respond("newer ".repeat(100)); await f.session.prompt("/skill:small");
    f.session.settingsManager.applyOverrides({ compaction: { enabled: false, keepRecentTokens: 10 } });
    compact = f.session.compact(); await before.promise;
    if (kind === "policy") chooseSol(display);
    await f.session.prompt(kind === "mode" ? "/automodel mode effort-only" : "/automodel configure");
    finishCompact.release(); await observer.promise; await pause(75);
    expect(f.session.isIdle).toBe(false);
    expect(existsSync(join(f.dir, kind === "mode" ? "pi-auto-model-state.json" : "pi-auto-model.json"))).toBe(false);
    finishObserver.release(); await compact;
    if (kind === "mode") await waitForMode(f, "effort-only");
    else await until(() => display.notices.some((notice) => notice.text.startsWith("Saved model mappings.")));
    await f.session.prompt("/automodel status"); expect(display.notices.at(-1)?.text).toContain("pending: 0");
    f.respond(); await f.session.prompt(kind === "mode" ? "/skill:hard" : "/skill:small");
    expect(last(f).model).toBe(kind === "mode" ? "gpt-6-luna" : "gpt-6.1-sol");
    expect(last(f).thinkingLevel).toBe(kind === "mode" ? "xhigh" : "high");
    expect(f.faux.state.callCount).toBe(3); expect(f.errors).toEqual([]);
  } finally {
    finishCompact.release(); finishObserver.release(); await compact?.catch(() => {});
    await f.owner.dispose(); f.close();
  }
});

test("queued mode controls preserve ordering and do not leave an idle wake-up running", async () => {
  const display = createUI(), entered = gate(), finish = gate();
  const f = await createFixture({ mode: "tui", ui: display.ui, skills: [small] });
  let run: Promise<void> | undefined;
  try {
    await select(f);
    f.faux.setResponses([async () => { entered.release(); await finish.promise; return fauxAssistantMessage("main"); }]);
    run = f.session.prompt("/skill:small"); await entered.promise;
    await f.session.prompt("/automodel mode effort-only");
    await f.session.prompt("/automodel mode model-and-effort");
    finish.release(); await run;
    await waitForMode(f, "model-and-effort");
    const modes = f.session.sessionManager.getBranch().filter((entry) => entry.type === "custom" && entry.customType === "pi-auto-model.controls")
      .map((entry) => (entry as { data: { mode: string } }).data.mode);
    expect(modes).toEqual(["effort-only", "model-and-effort"]);
    const entries = structuredClone(f.session.sessionManager.getBranch());
    await pause(75); expect(f.session.sessionManager.getBranch()).toEqual(entries);
    expect(JSON.parse(readFileSync(join(f.dir, "pi-auto-model-state.json"), "utf8"))).toEqual({ version: 2, mode: "model-and-effort" });
    expect(f.session.model?.id).toBe("auto"); expect(f.errors).toEqual([]);
  } finally { finish.release(); await run?.catch(() => {}); await f.owner.dispose(); f.close(); }
});

test.each(["physical-selection", "replacement"] as const)("%s cancels a queued mode activation without changing the new selection", async (boundary) => {
  const display = createUI(), entered = gate(), finish = gate();
  const f = await createFixture({ mode: "tui", ui: display.ui, skills: [small] });
  let run: Promise<void> | undefined;
  try {
    await select(f);
    f.faux.setResponses([async (_context, options) => {
      const stop = () => finish.release();
      options?.signal?.addEventListener("abort", stop, { once: true });
      try { entered.release(); await finish.promise; return fauxAssistantMessage("main"); }
      finally { options?.signal?.removeEventListener("abort", stop); }
    }]);
    run = f.session.prompt("/skill:small"); await entered.promise;
    await f.session.prompt("/automodel mode effort-only");
    if (boundary === "physical-selection") await f.session.setModel(f.faux.getModel("gpt-6.1-sol")!);
    else await f.owner.newSession();
    finish.release(); await run;
    await pause(75);
    expect(existsSync(join(f.dir, "pi-auto-model-state.json"))).toBe(false);
    expect(f.session.model?.provider).toBe("github-copilot"); expect(f.session.model?.id).toBe("gpt-6.1-sol");
    await f.session.prompt("/automodel status");
    expect(display.notices.at(-1)?.text).toMatch(/mode: model-and-effort; pending: 0/);
    expect(f.errors).toEqual([]);
  } finally { finish.release(); await run?.catch(() => {}); await f.owner.dispose(); f.close(); }
});

test.each(
  (["model-and-effort", "effort-only"] as const).flatMap((mode) => ["github-copilot", "offline-other"].map((provider) => ({ mode, provider }))),
)("$mode summary uses the configured $provider physical pair and exact effort without changing main state", async ({ mode, provider }) => {
  const display = createUI(), f = await createFixture({ configuration: configuration(mode, provider), physicalProvider: provider,
    mode: "tui", ui: display.ui, skills: [hard] });
  try {
    await select(f); f.respond(); await f.session.prompt("/skill:hard");
    expect(last(f).model).toBe("gpt-6.1-sol"); expect(last(f).thinkingLevel).toBe("xhigh");
    const branch = structuredClone(f.session.sessionManager.getBranch()), messages = structuredClone(f.session.messages);
    const popupCount = display.overlays.length;
    const requests: { provider: string; model: string; effort?: string }[] = [];
    f.faux.setResponses([(_context, options, _state, model) => {
      requests.push({ provider: model.provider, model: model.id, effort: options?.reasoning }); return fauxAssistantMessage("summary");
    }]);
    const summary = await new ModelRegistry(f.runtime).streamSimple(f.runtime.getModel("pi-auto-model", "auto")!, {
      messages: [{ role: "user", content: "direct summary", timestamp: 0 }],
    }).result();
    expect(requests).toEqual([{ provider, model: "gpt-6-luna", effort: "medium" }]);
    expect(summary.provider).toBe(provider); expect(summary.model).toBe("gpt-6-luna");
    expect(f.session.sessionManager.getBranch()).toEqual(branch); expect(f.session.messages).toEqual(messages);
    expect(display.overlays).toHaveLength(popupCount);
    f.respond(); await f.session.prompt("yes");
    expect(last(f).model).toBe("gpt-6.1-sol"); expect(last(f).thinkingLevel).toBe("xhigh");
    expect(f.faux.state.callCount).toBe(3); expect(f.errors).toEqual([]);
  } finally { await f.owner.dispose(); f.close(); }
});

test.each(["model-and-effort", "effort-only"] as const)("%s direct summaries need no captured main model and retain exact fallback effort", async (mode) => {
  const raw = configuration(mode); raw.summaryTier = "complex"; raw.tiers.complex.model = "absent";
  const manager = SessionManager.inMemory(); manager.appendModelChange("pi-auto-model", "auto"); manager.appendThinkingLevelChange("high");
  manager.appendMessage({ role: "user", content: "Persisted conversation without a physical selection", timestamp: 0 });
  const f = await createFixture({ configuration: raw, restore: true, sessionManager: manager });
  try {
    expect(f.session.model?.provider).toBe("pi-auto-model"); expect(f.session.model?.id).toBe("auto");
    expect(manager.getBranch().filter((entry) => entry.type === "model_change")
      .map((entry) => ({ provider: entry.provider, model: entry.modelId }))).toEqual([{ provider: "pi-auto-model", model: "auto" }]);
    const branch = structuredClone(manager.getBranch());
    const requests: { model: string; effort?: string }[] = [];
    f.faux.setResponses([(_context, options, _state, model) => {
      requests.push({ model: model.id, effort: options?.reasoning }); return fauxAssistantMessage("summary");
    }]);
    const summary = await new ModelRegistry(f.runtime).streamSimple(f.runtime.getModel("pi-auto-model", "auto")!, {
      messages: [{ role: "user", content: "direct summary", timestamp: 0 }],
    }).result();
    expect(summary.stopReason).toBe("stop"); expect(summary.model).toBe("gpt-6-luna");
    expect(requests).toEqual([{ model: "gpt-6-luna", effort: "xhigh" }]);
    expect(f.faux.state.callCount).toBe(1); expect(manager.getBranch()).toEqual(branch);
    if (mode === "effort-only") {
      await f.session.prompt("Main request still needs its own captured physical identity");
      expect(last(f).stopReason).toBe("error"); expect(last(f).errorMessage).toMatch(/no captured model/);
      expect(f.faux.state.callCount).toBe(1);
    }
  } finally { await f.owner.dispose(); f.close(); }
});

test("summary policy in effort-only mode does not require or mutate a captured main pair", async () => {
  const f = await createFixture();
  try {
    const raw = configuration("effort-only"), registry = new ModelRegistry(f.runtime);
    const decision = resolveRoute(raw, { direct: true }, registry);
    expect(decision.model.id).toBe("gpt-6-luna"); expect(decision.thinkingLevel).toBe("medium");
    expect(() => resolveRoute(raw, { classifiedTier: "trivial" }, registry)).toThrow(/no captured model/);
  } finally { await f.owner.dispose(); f.close(); }
});

test("Auto's native offered thinking levels exclude max", async () => {
  const f = await createFixture();
  try {
    expect(getSupportedThinkingLevels(f.runtime.getModel("pi-auto-model", "auto")!))
      .toEqual(["off", "minimal", "low", "medium", "high", "xhigh"]);
    expect(f.session.model?.id).toBe("gpt-6.1-sol"); expect(f.faux.state.callCount).toBe(0);
  } finally { await f.owner.dispose(); f.close(); }
});

test.each(["configure", "status", "on"] as const)("headless %s returns observable file/selection/syntax guidance without work", async (command) => {
  const output: string[] = [], errors: string[] = [], f = await createFixture();
  const stdout = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => { output.push(String(chunk)); return true; });
  const stderr = vi.spyOn(process.stderr, "write").mockImplementation((chunk) => { errors.push(String(chunk)); return true; });
  try {
    const files = readdirSync(f.dir); await f.session.prompt("/automodel " + command);
    const text = [...output, ...errors].join("");
    if (command === "configure") expect(text).toContain(join(f.dir, "pi-auto-model.json"));
    if (command === "status") {
      expect(text).toContain("Selection: github-copilot/gpt-6.1-sol"); expect(text).toContain("pending: 0");
      expect(text).toContain("classifier: github-copilot/gpt-6-luna (low)"); expect(text).toContain("/model");
    }
    if (command === "on") expect(text).toMatch(/Use \/model.*\/automodel status\|configure/);
    expect(readdirSync(f.dir)).toEqual(files); expect(f.session.model?.id).toBe("gpt-6.1-sol"); expect(f.faux.state.callCount).toBe(0);
  } finally { stdout.mockRestore(); stderr.mockRestore(); await f.owner.dispose(); f.close(); }
});

test("valid tree controls clear only the malformed-branch failure and restore the branch's exact mode", async () => {
  const display = createUI(), f = await createFixture({ mode: "tui", ui: display.ui, skills: [small] });
  try {
    await f.session.prompt("/automodel mode effort-only");
    const good = f.session.sessionManager.getLeafId()!;
    const bad = f.session.sessionManager.appendCustomEntry("pi-auto-model.controls", { version: 99, mode: "absent" });
    f.session.sessionManager.branch(good);
    await f.session.navigateTree(bad, { summarize: false });
    await f.session.prompt("/automodel status"); expect(display.notices.at(-1)?.text).toContain("branch entry " + bad);
    await f.session.navigateTree(good, { summarize: false });
    await f.session.prompt("/automodel status"); expect(display.notices.at(-1)?.text).toContain("mode: effort-only");
    await select(f); f.respond(); await f.session.prompt("/skill:small");
    expect(last(f).model).toBe("gpt-6.1-sol"); expect(last(f).thinkingLevel).toBe("medium"); expect(f.errors).toEqual([]);
  } finally { await f.owner.dispose(); f.close(); }
});

test.each(["policy", "preferences"] as const)("invalid %s identifies its file and is not cleared by valid tree navigation", async (kind) => {
  const display = createUI(), raw = kind === "policy" ? { ...configuration(), version: 99 } : { version: 99, mode: "effort-only" };
  const filename = kind === "policy" ? "pi-auto-model.json" : "pi-auto-model-state.json";
  const f = await createFixture({ mode: "tui", ui: display.ui, setup: (dir) => writeFileSync(join(dir, filename), JSON.stringify(raw)) });
  try {
    const first = f.session.sessionManager.appendCustomEntry("test.marker", { value: 1 });
    const second = f.session.sessionManager.appendCustomEntry("test.marker", { value: 2 });
    await f.session.navigateTree(first, { summarize: false }); await f.session.navigateTree(second, { summarize: false });
    await f.session.prompt("/automodel status"); expect(display.notices.at(-1)?.text).toContain(join(f.dir, filename));
    expect(display.notices.at(-1)?.text).toContain(kind === "policy" ? "Invalid routing configuration" : "Invalid Auto preferences");
    expect(f.session.model?.id).toBe("gpt-6.1-sol"); expect(f.faux.state.callCount).toBe(0);
  } finally { await f.owner.dispose(); f.close(); }
});

test("failed preferences persistence leaves both active mode and the previous file intact", async () => {
  const display = createUI(), f = await createFixture({ mode: "tui", ui: display.ui });
  try {
    await f.session.prompt("/automodel mode model-and-effort");
    const path = join(f.dir, "pi-auto-model-state.json"), previous = readFileSync(path, "utf8");
    io.beforeRename = async (destination) => { if (destination === path) throw new Error("offline disk failure"); };
    await f.session.prompt("/automodel mode effort-only");
    expect(display.notices.at(-1)?.text).toContain(path); expect(display.notices.at(-1)?.text).toContain("Previous settings are unchanged");
    await f.session.prompt("/automodel status"); expect(display.notices.at(-1)?.text).toContain("mode: model-and-effort");
    expect(readFileSync(path, "utf8")).toBe(previous); expect(readdirSync(f.dir).some((name) => name.endsWith(".tmp"))).toBe(false);
    expect(f.session.model?.id).toBe("gpt-6.1-sol"); expect(f.faux.state.callCount).toBe(0);
  } finally { await f.owner.dispose(); f.close(); }
});

test("settings parent-path failure identifies the destination and preserves the previous parent file", async () => {
  const f = await createFixture();
  try {
    const parent = join(f.dir, "not-a-directory"); writeFileSync(parent, "keep");
    const destination = join(parent, "settings.json");
    await expect(writeSettings(destination, { version: 2, mode: "effort-only" })).rejects.toThrow(destination);
    expect(readFileSync(parent, "utf8")).toBe("keep"); expect(f.faux.state.callCount).toBe(0);
  } finally { await f.owner.dispose(); f.close(); }
});

test("a newer mode command cannot be overtaken by an older post-write activation", async () => {
  const display = createUI(), diskEntered = gate(), disk = gate(), started = gate(), finish = gate();
  const f = await createFixture({ mode: "tui", ui: display.ui, skills: [small] });
  let older: Promise<void> | undefined, newer: Promise<void> | undefined, run: Promise<void> | undefined;
  try {
    await select(f);
    io.beforeRename = async (destination) => {
      if (destination.endsWith("pi-auto-model-state.json")) { diskEntered.release(); await disk.promise; }
    };
    older = f.session.prompt("/automodel mode effort-only"); await diskEntered.promise;
    newer = f.session.prompt("/automodel mode model-and-effort");
    f.faux.setResponses([async () => { started.release(); await finish.promise; return fauxAssistantMessage("main"); }]);
    run = f.session.prompt("/skill:small"); await started.promise;
    disk.release(); await older; await newer;
    finish.release(); await run;
    await until(() => f.session.sessionManager.getBranch().filter((entry) => entry.type === "custom"
      && entry.customType === "pi-auto-model.controls").length === 2);
    const modes = f.session.sessionManager.getBranch().filter((entry) => entry.type === "custom" && entry.customType === "pi-auto-model.controls")
      .map((entry) => (entry as { data: { mode: string } }).data.mode);
    expect(modes).toEqual(["effort-only", "model-and-effort"]);
    await f.session.prompt("/automodel status"); expect(display.notices.at(-1)?.text).toContain("mode: model-and-effort; pending: 0");
    expect(JSON.parse(readFileSync(join(f.dir, "pi-auto-model-state.json"), "utf8"))).toEqual({ version: 2, mode: "model-and-effort" });
    expect(last(f).stopReason).toBe("stop"); expect(f.faux.state.callCount).toBe(1); expect(f.errors).toEqual([]);
    expect(f.session.model?.id).toBe("auto");
  } finally {
    disk.release(); finish.release(); await older?.catch(() => {}); await newer?.catch(() => {}); await run?.catch(() => {});
    await f.owner.dispose(); f.close();
  }
});

test.each(["mode", "policy"] as const)("a %s save remains ahead of a queued command through two busy intervals", async (kind) => {
  const display = createUI(), diskEntered = gate(), disk = gate(), firstEntered = gate(), first = gate(), secondEntered = gate(), second = gate();
  const f = await createFixture({ mode: "tui", ui: display.ui, skills: [small, hard] });
  let save: Promise<void> | undefined, run1: Promise<void> | undefined, run2: Promise<void> | undefined;
  try {
    await select(f);
    const filename = kind === "mode" ? "pi-auto-model-state.json" : "pi-auto-model.json";
    io.beforeRename = async (destination) => { if (destination.endsWith(filename)) { diskEntered.release(); await disk.promise; } };
    if (kind === "policy") chooseSol(display);
    save = f.session.prompt(kind === "mode" ? "/automodel mode effort-only" : "/automodel configure"); await diskEntered.promise;
    f.faux.setResponses([async (_context, options) => {
      const abort = () => first.release(); options?.signal?.addEventListener("abort", abort, { once: true });
      try { firstEntered.release(); await first.promise; return fauxAssistantMessage("first"); }
      finally { options?.signal?.removeEventListener("abort", abort); }
    }]);
    run1 = f.session.prompt("/skill:small"); await firstEntered.promise;
    if (kind === "policy") display.answers.push("Review and save", true);
    await f.session.prompt(kind === "mode" ? "/automodel mode model-and-effort" : "/automodel configure");
    first.release(); await run1;
    await pause(75);
    f.faux.setResponses([async (_context, options) => {
      const abort = () => second.release(); options?.signal?.addEventListener("abort", abort, { once: true });
      try { secondEntered.release(); await second.promise; return fauxAssistantMessage("second"); }
      finally { options?.signal?.removeEventListener("abort", abort); }
    }]);
    run2 = f.session.prompt("/skill:small"); await secondEntered.promise;
    disk.release(); await save; second.release(); await run2;
    if (kind === "mode") {
      await until(() => f.session.sessionManager.getBranch().filter((entry) => entry.type === "custom" && entry.customType === "pi-auto-model.controls").length === 2);
      const modes = f.session.sessionManager.getBranch().filter((entry) => entry.type === "custom" && entry.customType === "pi-auto-model.controls")
        .map((entry) => (entry as { data: { mode: string } }).data.mode);
      expect(modes).toEqual(["effort-only", "model-and-effort"]);
      expect(JSON.parse(readFileSync(join(f.dir, filename), "utf8"))).toEqual({ version: 2, mode: "model-and-effort" });
    } else {
      await until(() => display.notices.filter((notice) => notice.text.startsWith("Saved model mappings.")).length === 2);
      const saved = JSON.parse(readFileSync(join(f.dir, filename), "utf8"));
      expect(saved.tiers.trivial).toEqual({ provider: "github-copilot", model: "gpt-6.1-sol", effort: "high" });
    }
    await f.session.prompt("/automodel status"); expect(display.notices.at(-1)?.text).toContain("pending: 0");
    f.respond(); await f.session.prompt(kind === "mode" ? "/skill:hard" : "/skill:small");
    expect(last(f).model).toBe("gpt-6.1-sol"); expect(last(f).thinkingLevel).toBe(kind === "mode" ? "xhigh" : "high");
    expect(f.faux.state.callCount).toBe(3); expect(f.errors).toEqual([]); expect(f.session.model?.id).toBe("auto");
  } finally {
    disk.release(); first.release(); second.release(); await save?.catch(() => {}); await run1?.catch(() => {}); await run2?.catch(() => {});
    await f.owner.dispose(); f.close();
  }
});

test.each([false, true])("three commands preserve arrival order when the middle command arrives idle=%s", async (middleIdle) => {
  const display = createUI(), diskEntered = gate(), disk = gate(), entered = gate(), finish = gate();
  const f = await createFixture({ mode: "tui", ui: display.ui, skills: [small, hard] });
  let older: Promise<void> | undefined, middle: Promise<void> | undefined, run: Promise<void> | undefined;
  try {
    await select(f);
    io.beforeRename = async (destination) => { if (destination.endsWith("pi-auto-model-state.json")) { diskEntered.release(); await disk.promise; } };
    older = f.session.prompt("/automodel mode effort-only"); await diskEntered.promise;
    if (middleIdle) middle = f.session.prompt("/automodel mode model-and-effort");
    f.faux.setResponses([async (_context, options) => {
      const abort = () => finish.release(); options?.signal?.addEventListener("abort", abort, { once: true });
      try { entered.release(); await finish.promise; return fauxAssistantMessage("main"); }
      finally { options?.signal?.removeEventListener("abort", abort); }
    }]);
    run = f.session.prompt("/skill:small"); await entered.promise;
    if (!middleIdle) middle = f.session.prompt("/automodel mode model-and-effort");
    await f.session.prompt("/automodel mode effort-only");
    disk.release(); await older; await middle; finish.release(); await run;
    await until(() => f.session.sessionManager.getBranch().filter((entry) => entry.type === "custom" && entry.customType === "pi-auto-model.controls").length === 3);
    const modes = f.session.sessionManager.getBranch().filter((entry) => entry.type === "custom" && entry.customType === "pi-auto-model.controls")
      .map((entry) => (entry as { data: { mode: string } }).data.mode);
    expect(modes).toEqual(["effort-only", "model-and-effort", "effort-only"]);
    expect(JSON.parse(readFileSync(join(f.dir, "pi-auto-model-state.json"), "utf8"))).toEqual({ version: 2, mode: "effort-only" });
    await f.session.prompt("/automodel status"); expect(display.notices.at(-1)?.text).toContain("mode: effort-only; pending: 0");
    f.respond(); await f.session.prompt("/skill:hard");
    expect(last(f).model).toBe("gpt-6-luna"); expect(last(f).thinkingLevel).toBe("xhigh");
    expect(f.faux.state.callCount).toBe(2); expect(f.errors).toEqual([]); expect(f.session.model?.id).toBe("auto");
  } finally {
    disk.release(); finish.release(); await older?.catch(() => {}); await middle?.catch(() => {}); await run?.catch(() => {});
    await f.owner.dispose(); f.close();
  }
});

test("a canceled old disk operation cannot unblock or activate a newer session's pending operation", async () => {
  const display = createUI(), oldEntered = gate(), oldDisk = gate(), newEntered = gate(), newDisk = gate();
  const f = await createFixture({ mode: "tui", ui: display.ui });
  let old: Promise<void> | undefined, newer: Promise<void> | undefined, lastCommand: Promise<void> | undefined;
  try {
    let writes = 0;
    io.beforeRename = async (destination) => {
      if (!destination.endsWith("pi-auto-model-state.json")) return;
      if (++writes === 1) { oldEntered.release(); await oldDisk.promise; }
      else { newEntered.release(); await newDisk.promise; }
    };
    old = f.session.prompt("/automodel mode effort-only"); await oldEntered.promise;
    await f.owner.newSession();
    newer = f.session.prompt("/automodel mode model-and-effort"); await newEntered.promise;
    lastCommand = f.session.prompt("/automodel mode effort-only");
    oldDisk.release(); await old;
    await pause(75);
    expect(f.session.sessionManager.getBranch().filter((entry) => entry.type === "custom" && entry.customType === "pi-auto-model.controls")).toHaveLength(0);
    newDisk.release(); await newer; await lastCommand;
    await until(() => f.session.sessionManager.getBranch().filter((entry) => entry.type === "custom" && entry.customType === "pi-auto-model.controls").length === 2);
    const modes = f.session.sessionManager.getBranch().filter((entry) => entry.type === "custom" && entry.customType === "pi-auto-model.controls")
      .map((entry) => (entry as { data: { mode: string } }).data.mode);
    expect(modes).toEqual(["model-and-effort", "effort-only"]);
    expect(JSON.parse(readFileSync(join(f.dir, "pi-auto-model-state.json"), "utf8"))).toEqual({ version: 2, mode: "effort-only" });
    expect(f.session.model?.provider).toBe("github-copilot"); expect(f.faux.state.callCount).toBe(0); expect(f.errors).toEqual([]);
  } finally { oldDisk.release(); newDisk.release(); await old?.catch(() => {}); await newer?.catch(() => {}); await lastCommand?.catch(() => {}); await f.owner.dispose(); f.close(); }
});

test.each(["main", "classifier"] as const)("an approved configuration form retains its arrival slot when %s work starts", async (stage) => {
  const display = createUI(), formEntered = gate(), returnForm = gate(), taskEntered = gate(), finish = gate();
  const f = await createFixture({ mode: "tui", ui: display.ui, skills: [small] });
  const originalSelect = display.ui.select, originalConfirm = display.ui.confirm;
  let menus = 0, confirmations = 0;
  const commands: Promise<void>[] = [], requests: { provider: string; model: string; effort?: string }[] = [];
  let run: Promise<void> | undefined;
  display.ui.select = async (title, choices, options) => {
    if (title.startsWith("Auto mappings") && ++menus === 3) {
      display.answers.push(choices.find((choice) => choice.startsWith("trivial:")), "gpt-6-luna",
        "github-copilot/gpt-6-luna — gpt-6-luna", "medium", "Review and save", true);
    }
    return originalSelect(title, choices, options);
  };
  display.ui.confirm = async (...args) => {
    const confirmed = await originalConfirm(...args);
    if (++confirmations === 1) { expect(confirmed).toBe(true); formEntered.release(); await returnForm.promise; }
    return confirmed;
  };
  try {
    await select(f);
    const origin = f.session.sessionManager.getSessionId();
    chooseSol(display);
    commands.push(f.session.prompt("/automodel configure")); await formEntered.promise;
    expect(f.session.isIdle).toBe(true);
    commands.push(f.session.prompt("/automodel configure"));
    f.faux.setResponses([
      async (_context, options, _state, model) => {
        requests.push({ provider: model.provider, model: model.id, effort: options?.reasoning });
        const abort = () => finish.release(); options?.signal?.addEventListener("abort", abort, { once: true });
        try { taskEntered.release(); await finish.promise; return fauxAssistantMessage(stage === "classifier" ? "trivial" : "main"); }
        finally { options?.signal?.removeEventListener("abort", abort); }
      },
      ...stage === "classifier" ? [(_context: unknown, options: { reasoning?: string } | undefined, _state: unknown, model: { provider: string; id: string }) => {
        requests.push({ provider: model.provider, model: model.id, effort: options?.reasoning }); return fauxAssistantMessage("main");
      }] : [],
    ]);
    run = f.session.prompt(stage === "classifier" ? "new typed task during configuration" : "/skill:small"); await taskEntered.promise;
    returnForm.release(); await commands[0]; await pause(75);
    expect(f.session.isStreaming).toBe(true); expect(existsSync(join(f.dir, "pi-auto-model.json"))).toBe(false);
    finish.release(); await run; await Promise.all(commands);
    await until(() => display.notices.filter((notice) => notice.text.startsWith("Saved model mappings.")).length === 2);
    const expected = { provider: "github-copilot", model: "gpt-6-luna", effort: "medium" };
    const saved = JSON.parse(readFileSync(join(f.dir, "pi-auto-model.json"), "utf8"));
    expect(saved.tiers.trivial).toEqual(expected);
    await f.session.prompt("/automodel status");
    expect(display.notices.at(-1)?.text).toContain("trivial: github-copilot/gpt-6-luna (medium)");
    expect(display.notices.at(-1)?.text).toContain("pending: 0");
    const initial = stage === "classifier" ? 2 : 1;
    expect(requests).toEqual(stage === "classifier"
      ? [{ provider: "github-copilot", model: "gpt-6-luna", effort: "low" }, { provider: "github-copilot", model: "gpt-6-luna", effort: "medium" }]
      : [{ provider: "github-copilot", model: "gpt-6-luna", effort: "medium" }]);
    f.faux.setResponses([(_context, options, _state, model) => {
      requests.push({ provider: model.provider, model: model.id, effort: options?.reasoning }); return fauxAssistantMessage("next");
    }]);
    await f.session.prompt("/skill:small");
    expect(requests.at(-1)).toEqual(expected); expect(last(f).model).toBe(expected.model);
    expect(last(f).thinkingLevel).toBe(expected.effort); expect(last(f).stopReason).toBe("stop");
    await pause(75); expect(JSON.parse(readFileSync(join(f.dir, "pi-auto-model.json"), "utf8"))).toEqual(saved);
    expect(f.faux.state.callCount).toBe(initial + 1); expect(f.errors).toEqual([]);
    expect(f.session.model?.id).toBe("auto"); expect(f.session.sessionManager.getSessionId()).toBe(origin);
  } finally {
    returnForm.release(); finish.release(); await Promise.allSettled([...commands, ...(run ? [run] : [])]);
    await f.owner.dispose(); f.close();
  }
});
