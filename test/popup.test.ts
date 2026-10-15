import { ModelRegistry, SessionManager, type ExtensionAPI, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import { fauxAssistantMessage, fauxProvider, fauxToolCall } from "@earendil-works/pi-ai";
import { visibleWidth } from "@earendil-works/pi-tui";
import { afterEach, expect, test, vi } from "vitest";
import { validateConfiguration, type PhysicalPair } from "../src/policy.ts";
import { registerPopups } from "../src/popup.ts";
import { createFixture } from "./support/session.ts";
import { createUI } from "./support/ui.ts";

const sol: PhysicalPair = { provider: "github-copilot", model: "gpt-6.1-sol", effort: "xhigh" };
const luna: PhysicalPair = { provider: "github-copilot", model: "gpt-6-luna", effort: "high" };
function app(mode: "regular" | "fullscreen" = "regular") {
  const display = createUI(mode), handlers = new Map<string, (event: any, ctx: ExtensionContext) => unknown>();
  const fake = fauxProvider({ provider: "github-copilot", models: [{ id: sol.model, reasoning: true }, { id: luna.model, reasoning: true }] });
  const registry = { find: (provider: string, id: string) => fake.models.find((model) => model.provider === provider && model.id === id), getAvailable: () => fake.models, hasConfiguredAuth: () => true };
  const config = validateConfiguration(undefined, registry);
  let sessionId = "original";
  const ctx = {
    mode: "tui", hasUI: true, ui: display.ui,
    model: { provider: "pi-auto-model", id: "auto", api: "pi-virtual" },
    modelRegistry: registry, sessionManager: { getSessionId: () => sessionId },
  } as unknown as ExtensionContext;
  const pi = { on(name: string, handler: (event: any, ctx: ExtensionContext) => unknown) { handlers.set(name, handler); return () => {}; } } as unknown as ExtensionAPI;
  const popup = registerPopups(pi, { policy: () => config, current: () => sol });
  const emit = (event: string, data: unknown = {}) => handlers.get(event)?.(data, ctx);
  const response = (pair: PhysicalPair) => emit("message_end", {
    message: { ...fauxAssistantMessage("reply"), provider: pair.provider, model: pair.model, thinkingLevel: pair.effort },
  });
  return { ...display, ctx, config, popup, emit, response, replaceSession() { sessionId = "next"; } };
}
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

test.each(["regular", "fullscreen"] as const)("a %s popup expires without stealing focus or closing a later dialog", (mode) => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date", "performance"] });
  const a = app(mode);
  let typed = "";
  a.tui.setFocus({ invalidate() {}, render: () => ["Editor"], handleInput: (data) => { typed += data; } });
  a.tui.start();
  try {
    a.emit("session_start"); a.response(luna);
    expect(a.overlays).toHaveLength(1);
    expect(a.overlays[0]!.options?.nonCapturing).toBe(true);
    expect(a.overlays[0]!.handle.isFocused()).toBe(false);
    a.sendInput("x"); expect(typed).toBe("x");
    const dialog = a.tui.showOverlay({ invalidate() {}, render: () => ["Another dialog"], handleInput() {} });
    expect(dialog.isFocused()).toBe(true);
    vi.advanceTimersByTime(9999); expect(a.tui.hasOverlay()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(dialog.isFocused()).toBe(true);
    a.overlays[0]!.handle.focus(); expect(a.overlays[0]!.handle.isFocused()).toBe(false);
    dialog.hide(); expect(a.tui.hasOverlay()).toBe(false);
  } finally { a.popup.clear(); a.tui.stop(); }
});

test("an unchanged route is silent and a replacement resets only its own timer", () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date", "performance"] }); const a = app();
  a.emit("session_start"); a.response(sol); expect(a.overlays).toHaveLength(0);
  a.response(luna); expect(a.overlays).toHaveLength(1);
  vi.advanceTimersByTime(5000); a.response(sol); expect(a.overlays).toHaveLength(2);
  vi.advanceTimersByTime(5000); expect(a.tui.hasOverlay()).toBe(true);
  expect(a.overlays[0]!.handle.isFocused()).toBe(false);
  vi.advanceTimersByTime(5000); expect(a.tui.hasOverlay()).toBe(false);
  a.popup.clear();
});

test.each([8, 12, 30, 80, 160])("popup output fits %s terminal columns and includes exact pairs when space allows", (width) => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date", "performance"] }); const a = app();
  a.emit("session_start"); a.response(luna);
  const lines = a.overlays[0]!.component.render(width);
  for (const line of lines) expect(visibleWidth(line)).toBeLessThanOrEqual(width);
  if (width === 160) {
    expect(lines.join("\n")).toContain("github-copilot/gpt-6.1-sol (xhigh)");
    expect(lines.join("\n")).toContain("github-copilot/gpt-6-luna (high)");
  }
  a.popup.clear();
});

test.each(["print", "json", "rpc"] as const)("popup skips %s even when UI callbacks exist", (mode) => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date", "performance"] }); const a = app(); a.ctx.mode = mode;
  a.emit("session_start"); a.response(luna);
  expect(a.widgets.size).toBe(0); expect(a.overlays).toHaveLength(0); expect(vi.getTimerCount()).toBe(0);
});

test("disabled popup leaves the route alone and creates no timer or overlay", () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date", "performance"] }); const a = app(); a.config.switchPopup.enabled = false;
  a.emit("session_start"); a.response(luna);
  expect(a.overlays).toHaveLength(0); expect(vi.getTimerCount()).toBe(0);
});

test.each(["session_shutdown", "session_tree", "model_select"])("%s cleans its popup without leaking old expiry into a replacement session", (event) => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date", "performance"] }); const a = app();
  a.emit("session_start"); a.response(luna); a.emit(event);
  expect(a.tui.hasOverlay()).toBe(false);
  a.replaceSession(); a.emit("session_start"); a.response(luna);
  expect(a.overlays).toHaveLength(2);
  vi.advanceTimersByTime(10000); expect(a.tui.hasOverlay()).toBe(false); expect(vi.getTimerCount()).toBe(0);
});

test("an unavailable or failing renderer cannot fail routing or create a notification", () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date", "performance"] }); const a = app();
  a.emit("session_start"); a.tui.showOverlay = () => { throw new Error("render unavailable"); };
  expect(() => a.response(luna)).not.toThrow();
  expect(a.notices).toEqual([]); expect(vi.getTimerCount()).toBe(0);
});

test("native main metadata creates feedback, while direct summaries create no popup or chat entry", async () => {
  const ui = createUI(), f = await createFixture({ ui: ui.ui, mode: "tui", skills: [{ name: "small", description: "Small", tier: "trivial" }] });
  try {
    await f.session.setModel(f.runtime.getModel("pi-auto-model", "auto")!); f.respond(); await f.session.prompt("/skill:small");
    expect(ui.overlays).toHaveLength(1);
    expect(ui.statuses.get("pi-auto-model")).toContain("gpt-6-luna (high)");
    expect(ui.notices).toEqual([]);
    expect(f.session.messages.some((message) => message.role === "custom")).toBe(false);
    const before = structuredClone(f.session.sessionManager.getBranch());
    f.respond("summary");
    const summary = await new ModelRegistry(f.runtime).streamSimple(f.runtime.getModel("pi-auto-model", "auto")!, {
      messages: [{ role: "user", content: "summary", timestamp: 0 }],
    }).result();
    expect(summary.model).toBe("gpt-6-luna");
    expect(ui.overlays).toHaveLength(1);
    expect(f.session.sessionManager.getBranch()).toEqual(before);
  } finally { await f.owner.dispose(); f.close(); expect(ui.tui.hasOverlay()).toBe(false); }
});

test.each(["regular", "fullscreen"] as const)("%s popup lifetime uses elapsed time despite wall-clock changes", (mode) => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date", "performance"] });
  const a = app(mode);
  try {
    a.emit("session_start"); a.response(luna);
    vi.advanceTimersByTime(5000); vi.setSystemTime(Date.now() - 3600000);
    vi.advanceTimersByTime(4999); expect(a.tui.hasOverlay()).toBe(true);
    vi.advanceTimersByTime(1); expect(a.tui.hasOverlay()).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  } finally { a.popup.clear(); }
});

test.each([37, 2147483647 + 37])("configured duration %s expires exactly once across timer chunks and a forward wall-clock jump", (durationMs) => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date", "performance"] });
  const a = app(); a.config.switchPopup.durationMs = durationMs;
  try {
    a.emit("session_start"); a.response(luna);
    vi.setSystemTime(Date.now() + 86400000);
    vi.advanceTimersByTime(durationMs - 1); expect(a.tui.hasOverlay()).toBe(true);
    vi.advanceTimersByTime(1); expect(a.tui.hasOverlay()).toBe(false); expect(vi.getTimerCount()).toBe(0);
  } finally { a.popup.clear(); }
});

test.each(["replacement", "session"] as const)("an already-delivered expiry callback cannot close a new %s popup", (boundary) => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date", "performance"] });
  const calls = vi.spyOn(globalThis, "setTimeout"), a = app();
  try {
    a.emit("session_start"); a.response(luna);
    const callback = calls.mock.calls.find((call) => call[1] === 10000)?.[0]; expect(typeof callback).toBe("function");
    vi.advanceTimersByTime(5000);
    if (boundary === "replacement") a.response(sol);
    else { a.replaceSession(); a.emit("session_start"); a.response(luna); }
    (callback as () => void)(); expect(a.tui.hasOverlay()).toBe(true);
    vi.advanceTimersByTime(9999); expect(a.tui.hasOverlay()).toBe(true);
    vi.advanceTimersByTime(1); expect(a.tui.hasOverlay()).toBe(false);
  } finally { a.popup.clear(); }
});

test("widget replacement disposes the old popup before binding its new host", () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date", "performance"] });
  const a = app();
  try {
    a.emit("session_start"); a.response(luna); expect(a.tui.hasOverlay()).toBe(true);
    a.replaceSession(); a.emit("session_start"); expect(a.tui.hasOverlay()).toBe(false);
    a.response(luna); expect(a.tui.hasOverlay()).toBe(true);
    a.ui.setWidget("pi-auto-model.popup-host", undefined);
    expect(a.tui.hasOverlay()).toBe(false); expect(vi.getTimerCount()).toBe(0);
    a.response(sol); expect(a.overlays).toHaveLength(2);
  } finally { a.popup.clear(); }
});

const small = { name: "popup-small", description: "Small", tier: "trivial" };
const hard = { name: "popup-hard", description: "Hard", tier: "complex" };
const lastResponse = (f: Awaited<ReturnType<typeof createFixture>>) => f.session.messages.filter((message) => message.role === "assistant").at(-1)!;
const popupPolicy = () => validateConfiguration(undefined, { find: () => undefined, getAvailable: () => [], hasConfiguredAuth: () => false });
const wait = (ms: number) => new Promise<void>((resolve) => { setTimeout(resolve, ms); });
function barrier() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => { release = resolve; });
  return { promise, release };
}

test.each(["tool", "retry", "classifier"] as const)("native %s work never manufactures or repeats popup feedback", async (kind) => {
  const display = createUI(), entered = barrier(), finish = barrier();
  const f = await createFixture({ mode: "tui", ui: display.ui, skills: [small], tools: ["read"], retry: true });
  let running: Promise<void> | undefined;
  try {
    await f.session.setModel(f.runtime.getModel("pi-auto-model", "auto")!);
    const first = kind === "tool" ? fauxAssistantMessage([fauxToolCall("read", { path: f.skills[0]!.filePath })], { stopReason: "toolUse" })
      : kind === "retry" ? fauxAssistantMessage("retry", { stopReason: "error", errorMessage: "429 rate limit" }) : fauxAssistantMessage("trivial");
    const requests: { model: string; effort?: string }[] = [];
    const capture = (model: { id: string }, options?: { reasoning?: string }) => requests.push({ model: model.id, effort: options?.reasoning });
    f.faux.setResponses(kind === "classifier" ? [
      async (_context, options, _state, model) => { capture(model, options); entered.release(); await finish.promise; return first; },
      (_context, options, _state, model) => { capture(model, options); return fauxAssistantMessage("main"); },
    ] : [
      (_context, options, _state, model) => { capture(model, options); return first; },
      async (_context, options, _state, model) => { capture(model, options); entered.release(); await finish.promise; return fauxAssistantMessage("main"); },
    ]);
    running = f.session.prompt(kind === "classifier" ? "write a short heading" : "/skill:popup-small"); await entered.promise;
    expect(display.overlays).toHaveLength(kind === "classifier" ? 0 : 1);
    expect(f.session.isStreaming).toBe(true);
    finish.release(); await running;
    expect(display.overlays).toHaveLength(1);
    expect(requests).toEqual([{ model: "gpt-6-luna", effort: kind === "classifier" ? "low" : "high" }, { model: "gpt-6-luna", effort: "high" }]);
    expect(lastResponse(f).stopReason).toBe("stop"); expect(lastResponse(f).thinkingLevel).toBe("high");
    expect(f.session.messages.some((message) => message.role === "custom")).toBe(false);
    expect(display.notices).toEqual([]); expect(f.errors).toEqual([]);
  } finally { finish.release(); await running?.catch(() => {}); await f.owner.dispose(); f.close(); }
});

test.each(["regular", "fullscreen"] as const)("native work and %s editor input continue while only the popup expires", async (screen) => {
  const display = createUI(screen), entered = barrier(), finish = barrier(), config = popupPolicy(); config.switchPopup.durationMs = 40;
  const f = await createFixture({ mode: "tui", ui: display.ui, configuration: config, skills: [small], tools: ["read"] });
  let typed = "", running: Promise<void> | undefined;
  display.tui.setFocus({ invalidate() {}, render: () => ["Editor"], handleInput(data) { typed += data; } }); display.tui.start();
  try {
    await f.session.setModel(f.runtime.getModel("pi-auto-model", "auto")!);
    f.faux.setResponses([
      fauxAssistantMessage([fauxToolCall("read", { path: f.skills[0]!.filePath })], { stopReason: "toolUse" }),
      async () => { entered.release(); await finish.promise; return fauxAssistantMessage("main"); },
    ]);
    running = f.session.prompt("/skill:popup-small"); await entered.promise;
    expect(display.overlays).toHaveLength(1); display.sendInput("draft"); expect(typed).toBe("draft");
    let dialogInput = "";
    const dialog = display.tui.showOverlay({ invalidate() {}, render: () => ["Later dialog"], handleInput(data) { dialogInput += data; } });
    display.sendInput("x"); expect(dialogInput).toBe("x"); expect(typed).toBe("draft");
    await wait(80); expect(f.session.isStreaming).toBe(true); expect(dialog.isFocused()).toBe(true);
    dialog.hide(); expect(display.tui.hasOverlay()).toBe(false);
    display.sendInput(" kept"); expect(typed).toBe("draft kept");
    finish.release(); await running;
    expect(lastResponse(f).model).toBe("gpt-6-luna"); expect(lastResponse(f).thinkingLevel).toBe("high");
    expect(lastResponse(f).stopReason).toBe("stop"); expect(f.faux.state.callCount).toBe(2); expect(f.errors).toEqual([]);
  } finally { finish.release(); await running?.catch(() => {}); await f.owner.dispose(); f.close(); display.tui.stop(); }
});

test.each(["disabled", "print", "json", "rpc"] as const)("native %s routing succeeds without popup feedback", async (kind) => {
  const display = createUI(), config = popupPolicy(); config.switchPopup.enabled = kind !== "disabled";
  const f = await createFixture({ mode: kind === "disabled" ? "tui" : kind, ui: display.ui, configuration: config, skills: [small] });
  try {
    await f.session.setModel(f.runtime.getModel("pi-auto-model", "auto")!); f.respond(); await f.session.prompt("/skill:popup-small");
    expect(lastResponse(f).model).toBe("gpt-6-luna"); expect(lastResponse(f).thinkingLevel).toBe("high"); expect(lastResponse(f).stopReason).toBe("stop");
    expect(display.overlays).toHaveLength(0); expect(display.tui.hasOverlay()).toBe(false); expect(f.faux.state.callCount).toBe(1); expect(f.errors).toEqual([]);
  } finally { await f.owner.dispose(); f.close(); }
});

test("native effort-only feedback shows an observed effort change on the same physical model", async () => {
  const display = createUI(), config = popupPolicy(); config.mode = "effort-only";
  const f = await createFixture({ mode: "tui", ui: display.ui, configuration: config, skills: [small, hard] });
  try {
    await f.session.setModel(f.runtime.getModel("pi-auto-model", "auto")!); f.respond(); await f.session.prompt("/skill:popup-small");
    let text = display.overlays.at(-1)!.component.render(160).join("\n");
    expect(text).toContain("From github-copilot/gpt-6.1-sol (xhigh)"); expect(text).toContain("To   github-copilot/gpt-6.1-sol (high)");
    f.respond(); await f.session.prompt("/skill:popup-hard");
    text = display.overlays.at(-1)!.component.render(160).join("\n");
    expect(text).toContain("From github-copilot/gpt-6.1-sol (high)"); expect(text).toContain("To   github-copilot/gpt-6.1-sol (xhigh)");
    expect(lastResponse(f).model).toBe("gpt-6.1-sol"); expect(lastResponse(f).thinkingLevel).toBe("xhigh"); expect(display.overlays).toHaveLength(2);
    expect(f.faux.state.callCount).toBe(2); expect(f.errors).toEqual([]);
  } finally { await f.owner.dispose(); f.close(); }
});

test.each(["reload", "replacement", "resume", "tree", "manual"] as const)("a visible native popup is cleaned by %s without disturbing the next session or route", async (boundary) => {
  const display = createUI(), f = await createFixture({ mode: "tui", ui: display.ui, skills: [small, hard] });
  let resumed: Awaited<ReturnType<typeof createFixture>> | undefined;
  try {
    await f.session.setModel(f.runtime.getModel("pi-auto-model", "auto")!); f.respond(); await f.session.prompt("/skill:popup-small");
    const leaf = f.session.sessionManager.getLeafId()!; expect(display.tui.hasOverlay()).toBe(true);
    let active = f;
    if (boundary === "reload") await f.session.reload();
    else if (boundary === "replacement") await f.owner.newSession();
    else if (boundary === "manual") await f.session.setModel(f.faux.getModel("gpt-6.1-sol")!);
    else if (boundary === "tree") {
      f.respond(); await f.session.prompt("/skill:popup-hard"); await f.session.navigateTree(leaf, { summarize: false });
    } else {
      const manager = SessionManager.inMemory(undefined, undefined, [f.session.sessionManager.getHeader()!, ...JSON.parse(JSON.stringify(f.session.sessionManager.getEntries()))]);
      await f.owner.dispose();
      resumed = await createFixture({ mode: "tui", ui: display.ui, skills: [small, hard], restore: true, sessionManager: manager }); active = resumed;
    }
    expect(display.tui.hasOverlay()).toBe(false);
    if (active.session.model?.api !== "pi-virtual") {
      expect(active.session.model?.id).toBe("gpt-6.1-sol"); await active.session.setModel(active.runtime.getModel("pi-auto-model", "auto")!);
    }
    active.respond(); await active.session.prompt(boundary === "replacement" ? "/skill:popup-small" : "/skill:popup-hard");
    expect(display.tui.hasOverlay()).toBe(true); expect(display.overlays.at(-1)!.handle.isFocused()).toBe(false);
    expect(lastResponse(active).model).toBe(boundary === "replacement" ? "gpt-6-luna" : "gpt-6.1-sol");
    expect(active.errors).toEqual([]);
  } finally { await resumed?.owner.dispose(); resumed?.close(); await f.owner.dispose(); f.close(); expect(display.tui.hasOverlay()).toBe(false); }
});

test.each(["admission", "render"] as const)("native %s failure cannot break routing or its status fallback", async (phase) => {
  const display = createUI(), f = await createFixture({ mode: "tui", ui: display.ui, skills: [small] });
  try {
    await f.session.setModel(f.runtime.getModel("pi-auto-model", "auto")!);
    if (phase === "admission") display.tui.showOverlay = () => { throw new Error("offline overlay failure"); };
    f.respond(); await f.session.prompt("/skill:popup-small");
    if (phase === "render") {
      const themed = vi.spyOn(display.ui.theme, "fg").mockImplementation((_color, text) => "UPDATED " + text);
      expect(display.overlays[0]!.component.render(160).join("\n")).toContain("UPDATED From github-copilot/gpt-6.1-sol (xhigh)");
      for (const width of [0, 1, 8, 30]) for (const line of display.overlays[0]!.component.render(width)) expect(visibleWidth(line)).toBeLessThanOrEqual(width);
      themed.mockImplementation(() => { throw new Error("late render failure"); });
      expect(() => display.overlays[0]!.component.render(160)).not.toThrow(); expect(display.overlays[0]!.component.render(160)).toEqual([]);
    }
    expect(lastResponse(f).model).toBe("gpt-6-luna"); expect(lastResponse(f).thinkingLevel).toBe("high"); expect(lastResponse(f).stopReason).toBe("stop");
    expect(display.statuses.get("pi-auto-model")).toContain("gpt-6-luna (high)"); expect(display.notices).toEqual([]);
    expect(f.session.messages.some((message) => message.role === "custom")).toBe(false); expect(f.errors).toEqual([]); expect(f.faux.state.callCount).toBe(1);
  } finally { vi.restoreAllMocks(); await f.owner.dispose(); f.close(); }
});
