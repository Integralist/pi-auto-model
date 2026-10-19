import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ModelRegistry, SessionManager } from "@earendil-works/pi-coding-agent";
import { fauxAssistantMessage } from "@earendil-works/pi-ai";
import { expect, test, vi } from "vitest";
import { validateConfiguration } from "../src/policy.ts";
import { createFixture, type Fixture } from "./support/session.ts";
import { createUI } from "./support/ui.ts";

const small = { name: "small", description: "Small work", tier: "trivial" };
const hard = { name: "hard", description: "Hard work", tier: "complex" };
const last = (f: Fixture) => f.session.messages.filter((message) => message.role === "assistant").at(-1)!;
const wait = async (check: () => boolean) => { await expect.poll(check).toBe(true); };
async function selectAuto(f: Fixture) { await f.session.setModel(f.runtime.getModel("pi-auto-model", "auto")!); }
function gate() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => { release = resolve; });
  return { promise, release };
}

test("only Pi model selection enters or leaves Auto; routing does not write an enabled preference", async () => {
  const f = await createFixture({ skills: [small] });
  try {
    expect(f.session.model?.id).toBe("gpt-6.1-sol"); expect(f.faux.state.callCount).toBe(0);
    await selectAuto(f);
    f.respond(); await f.session.prompt("/skill:small");
    expect(last(f).model).toBe("gpt-6-luna"); expect(last(f).thinkingLevel).toBe("medium");
    await f.session.setModel(f.faux.getModel("gpt-6.1-sol")!);
    f.session.setThinkingLevel("xhigh");
    expect(f.session.model?.id).toBe("gpt-6.1-sol"); expect(f.session.thinkingLevel).toBe("xhigh");
    expect(readdirSync(f.dir)).not.toContain("pi-auto-model-state.json");
    expect(f.session.messages.some((message) => message.role === "custom")).toBe(false);
  } finally { await f.owner.dispose(); f.close(); }
});

test("leaving Auto preserves the chosen physical model and effort without restoring an old pair", async () => {
  const f = await createFixture();
  try {
    await selectAuto(f);
    await f.session.setModel(f.faux.getModel("gpt-6-luna")!);
    f.session.setThinkingLevel("high");
    f.respond(); await f.session.prompt("new physical task");
    expect(f.session.model?.id).toBe("gpt-6-luna"); expect(last(f).thinkingLevel).toBe("high");
    expect(f.faux.state.callCount).toBe(1);
    expect(readdirSync(f.dir)).not.toContain("pi-auto-model-state.json");
  } finally { await f.owner.dispose(); f.close(); }
});

test("a thinking choice on Auto does not issue a model switch; choose a physical model before manual effort", async () => {
  const f = await createFixture({ skills: [small] });
  try {
    await selectAuto(f); f.respond(); await f.session.prompt("/skill:small");
    f.session.setThinkingLevel("medium");
    expect(f.session.model?.id).toBe("auto"); expect(f.session.thinkingLevel).toBe("medium");
    await f.session.setModel(f.faux.getModel("gpt-6-luna")!);
    f.session.setThinkingLevel("xhigh");
    f.respond(); await f.session.prompt("new physical task");
    expect(last(f).model).toBe("gpt-6-luna"); expect(last(f).thinkingLevel).toBe("xhigh");
    expect(f.faux.state.callCount).toBe(2);
  } finally { await f.owner.dispose(); f.close(); }
});

test("fresh sessions retain only mode and never automatically select Auto", async () => {
  const f = await createFixture({ skills: [small] });
  try {
    await f.session.prompt("/automodel mode effort-only"); await selectAuto(f);
    f.respond(); await f.session.prompt("/skill:small");
    expect(last(f).model).toBe("gpt-6.1-sol"); expect(last(f).thinkingLevel).toBe("medium");
    expect(JSON.parse(readFileSync(join(f.dir, "pi-auto-model-state.json"), "utf8")))
      .toEqual({ version: 2, mode: "effort-only" });
    await f.owner.newSession();
    expect(f.session.model?.provider).toBe("github-copilot"); expect(f.session.model?.id).toBe("gpt-6.1-sol");
    await selectAuto(f); f.respond(); await f.session.prompt("/skill:small");
    expect(last(f).model).toBe("gpt-6.1-sol"); expect(last(f).thinkingLevel).toBe("medium");
  } finally { await f.owner.dispose(); f.close(); }
});

test.each([false, true])("legacy enabled=%s preferences never select Auto or write a restore target", async (enabled) => {
  const f = await createFixture({ setup: (dir) => writeFileSync(join(dir, "pi-auto-model-state.json"),
    JSON.stringify({ version: 1, enabled, mode: "effort-only" })) });
  try {
    expect(f.session.model?.id).toBe("gpt-6.1-sol"); expect(f.faux.state.callCount).toBe(0);
    await f.session.prompt("/automodel mode model-and-effort");
    expect(JSON.parse(readFileSync(join(f.dir, "pi-auto-model-state.json"), "utf8")))
      .toEqual({ version: 2, mode: "model-and-effort" });
    expect(f.session.sessionManager.getBranch().filter((entry) => entry.type === "custom" && entry.customType === "pi-auto-model.controls")
      .every((entry) => entry.type === "custom" && !Object.hasOwn(entry.data as object, "restore") && !Object.hasOwn(entry.data as object, "enabled"))).toBe(true);
  } finally { await f.owner.dispose(); f.close(); }
});

test("resume retains Pi's native Auto selection and the branch's portable mode", async () => {
  const first = await createFixture({ skills: [small] }); let restored: Fixture | undefined;
  try {
    await first.session.prompt("/automodel mode effort-only");
    await selectAuto(first); first.respond(); await first.session.prompt("/skill:small");
    const manager = SessionManager.inMemory(undefined, undefined,
      [first.session.sessionManager.getHeader()!, ...JSON.parse(JSON.stringify(first.session.sessionManager.getEntries()))]);
    restored = await createFixture({ restore: true, sessionManager: manager, skills: [small] });
    expect(restored.session.model?.provider).toBe("pi-auto-model");
    restored.respond(); await restored.session.prompt("/skill:small");
    expect(last(restored).model).toBe("gpt-6.1-sol"); expect(last(restored).thinkingLevel).toBe("medium");
    expect(restored.faux.state.callCount).toBe(1);
  } finally { await restored?.owner.dispose(); restored?.close(); await first.owner.dispose(); first.close(); }
});

test("busy mode changes return promptly and leave the active task's physical pair unchanged", async () => {
  const started = gate(), finish = gate();
  const f = await createFixture({ skills: [small, hard] });
  try {
    await selectAuto(f);
    f.faux.setResponses([async () => { started.release(); await finish.promise; return fauxAssistantMessage("main"); }]);
    const pending = f.session.prompt("/skill:small"); await started.promise;
    await f.session.prompt("/automodel mode effort-only");
    expect(f.session.model?.id).toBe("auto"); expect(f.session.isStreaming).toBe(true);
    finish.release(); await pending;
    expect(last(f).model).toBe("gpt-6-luna"); expect(last(f).thinkingLevel).toBe("medium");
    await wait(() => readdirSync(f.dir).includes("pi-auto-model-state.json"));
    await f.session.prompt("/automodel status");
    f.respond(); await f.session.prompt("/skill:hard");
    expect(last(f).model).toBe("gpt-6-luna"); expect(last(f).thinkingLevel).toBe("xhigh");
    expect(f.faux.state.callCount).toBe(2);
  } finally { finish.release(); await f.owner.dispose(); f.close(); }
});

test("corrupt policy reports its path and sends no automatic request", async () => {
  const display = createUI(), f = await createFixture({ ui: display.ui, mode: "tui", setup: (dir) => writeFileSync(join(dir, "pi-auto-model.json"), "{") });
  try {
    await f.session.prompt("/automodel status");
    expect(f.session.model?.id).toBe("gpt-6.1-sol"); expect(f.faux.state.callCount).toBe(0);
    expect(display.notices.map((notice) => notice.text).join("\n")).toMatch(/pi-auto-model.json.*Correct or remove/);
    expect(readdirSync(f.dir)).not.toContain("pi-auto-model-state.json");
  } finally { await f.owner.dispose(); f.close(); }
});

test.each(["on", "off", "toggle", "mode absent"])("obsolete or invalid command %s reports picker guidance without auth or selection", async (args) => {
  const display = createUI(), f = await createFixture({ ui: display.ui, mode: "tui" });
  try {
    const checked = vi.fn(async () => { throw new Error("An extension control attempted native selection auth."); });
    f.runtime.registerNativeProvider({ ...f.faux.provider, auth: { apiKey: { name: "No selection", resolve: async () => undefined, check: checked } } });
    await f.session.prompt("/automodel " + args);
    expect(display.notices.at(-1)?.text).toMatch(/Use \/model.*enter or leave Auto/);
    expect(f.session.model?.id).toBe("gpt-6.1-sol"); expect(f.session.thinkingLevel).toBe("xhigh");
    expect(checked).not.toHaveBeenCalled(); expect(f.faux.state.callCount).toBe(0);
    expect(readdirSync(f.dir)).not.toContain("pi-auto-model-state.json");
  } finally { await f.owner.dispose(); f.close(); }
});

test("headless configuration gives file guidance without selecting or writing anything", async () => {
  const f = await createFixture();
  try {
    const before = readdirSync(f.dir);
    await f.session.prompt("/automodel configure");
    expect(readdirSync(f.dir)).toEqual(before);
    expect(f.session.model?.id).toBe("gpt-6.1-sol"); expect(f.faux.state.callCount).toBe(0);
  } finally { await f.owner.dispose(); f.close(); }
});

test("interactive model mapping cancel preserves policy and mode-only preferences", async () => {
  const display = createUI(), f = await createFixture({ ui: display.ui, mode: "tui" });
  try {
    await f.session.prompt("/automodel mode effort-only");
    const state = readFileSync(join(f.dir, "pi-auto-model-state.json"), "utf8");
    display.answers.push("Cancel");
    await f.session.prompt("/automodel configure");
    expect(readFileSync(join(f.dir, "pi-auto-model-state.json"), "utf8")).toBe(state);
    expect(readdirSync(f.dir)).not.toContain("pi-auto-model.json");
    expect(f.session.model?.id).toBe("gpt-6.1-sol"); expect(f.faux.state.callCount).toBe(0);
  } finally { await f.owner.dispose(); f.close(); }
});

test("all five catalog mappings save without credentials or hidden Copilot dispatch, including summaries and reload", async () => {
  const display = createUI(), physicalProvider = "offline-other";
  const f = await createFixture({ physicalProvider, ui: display.ui, mode: "tui", skills: [small, hard] });
  try {
    const raw = validateConfiguration(undefined, new ModelRegistry(f.runtime));
    const pair = { provider: physicalProvider, model: "gpt-6-luna", effort: "high" as const };
    for (const slot of ["trivial", "moderate", "complex", "frontier", "classifier"] as const) {
      const label = slot + ": " + (slot === "classifier" ? raw.classifier.provider + "/" + raw.classifier.model + " (" + raw.classifier.effort + ")"
        : raw.tiers[slot].provider + "/" + raw.tiers[slot].model + " (" + raw.tiers[slot].effort + ")");
      display.answers.push(label, physicalProvider, physicalProvider + "/gpt-6-luna — gpt-6-luna", "high");
    }
    display.answers.push("Review and save", true);
    await f.session.prompt("/automodel configure");
    const saved = JSON.parse(readFileSync(join(f.dir, "pi-auto-model.json"), "utf8"));
    expect(Object.values(saved.tiers)).toEqual([pair, pair, pair, pair]);
    expect(saved.classifier).toEqual({ ...pair, maxInputChars: 12000, maxOutputTokens: 256, timeoutMs: 10000 });
    expect(saved.switchPopup).toEqual({ enabled: true, durationMs: 10000 }); expect(saved.summaryTier).toBe("trivial");
    expect(f.session.model?.provider).toBe(physicalProvider); expect(f.faux.state.callCount).toBe(0);
    expect(f.runtime.hasConfiguredAuth("github-copilot")).toBe(false);
    await selectAuto(f); f.respond(); await f.session.prompt("/skill:hard");
    expect(last(f).provider).toBe(physicalProvider); expect(last(f).model).toBe(pair.model);
    await f.session.reload();
    f.faux.setResponses([fauxAssistantMessage("complex"), fauxAssistantMessage("main")]);
    await f.session.prompt("implement a parser");
    expect(last(f).provider).toBe(physicalProvider); expect(last(f).thinkingLevel).toBe("high");
    const summaryRequests: { provider: string; model: string; effort?: string }[] = [];
    f.faux.setResponses([(_context, options, _state, model) => {
      summaryRequests.push({ provider: model.provider, model: model.id, effort: options?.reasoning });
      return fauxAssistantMessage("summary");
    }]);
    const summary = await new ModelRegistry(f.runtime).streamSimple(f.runtime.getModel("pi-auto-model", "auto")!, {
      messages: [{ role: "user", content: "summary", timestamp: 0 }],
    }).result();
    expect(summary.provider).toBe(physicalProvider); expect(summary.model).toBe(pair.model);
    expect(summaryRequests).toEqual([{ provider: physicalProvider, model: pair.model, effort: "high" }]);
    expect(f.faux.state.callCount).toBe(4);
  } finally { await f.owner.dispose(); f.close(); }
});

test("empty configured catalog and stale selected pair never save a draft", async () => {
  const display = createUI(), f = await createFixture({ ui: display.ui, mode: "tui" });
  try {
    f.runtime.registerNativeProvider({ ...f.faux.provider, filterModels: () => [] });
    await f.runtime.refresh({ allowNetwork: false });
    await f.session.prompt("/automodel configure");
    expect(display.notices.at(-1)?.text).toMatch(/No physical models are available/);
    expect(readdirSync(f.dir)).not.toContain("pi-auto-model.json"); expect(f.faux.state.callCount).toBe(0);
  } finally { await f.owner.dispose(); f.close(); }
});

test("failed policy save preserves separate preferences and does not implicitly select Auto", async () => {
  const display = createUI(), f = await createFixture({ ui: display.ui, mode: "tui" });
  try {
    await f.session.prompt("/automodel mode effort-only");
    const prefs = readFileSync(join(f.dir, "pi-auto-model-state.json"), "utf8");
    mkdirSync(join(f.dir, "pi-auto-model.json"));
    display.answers.push("Review and save", true);
    await f.session.prompt("/automodel configure");
    expect(display.notices.at(-1)?.text).toMatch(/Previous settings are unchanged/);
    expect(readFileSync(join(f.dir, "pi-auto-model-state.json"), "utf8")).toBe(prefs);
    expect(f.session.model?.id).toBe("gpt-6.1-sol"); expect(f.faux.state.callCount).toBe(0);
    expect(readdirSync(f.dir).some((name) => name.endsWith(".tmp"))).toBe(false);
  } finally { await f.owner.dispose(); f.close(); }
});

test("tree navigation retains branch evidence; leaving Auto uses the explicit physical choice", async () => {
  const f = await createFixture({ skills: [small, hard] });
  try {
    await selectAuto(f); f.respond(); await f.session.prompt("/skill:small");
    const branch = f.session.sessionManager.getBranch().findLast((entry) => entry.type === "message" && entry.message.role === "assistant")!;
    f.respond(); await f.session.prompt("/skill:hard");
    await f.session.navigateTree(branch.id, { summarize: false });
    f.respond(); await f.session.prompt("yes"); expect(last(f).model).toBe("gpt-6-luna");
    await f.session.setModel(f.faux.getModel("gpt-6.1-sol")!);
    f.session.setThinkingLevel("xhigh");
    expect(f.session.model?.id).toBe("gpt-6.1-sol"); expect(f.session.thinkingLevel).toBe("xhigh");
  } finally { await f.owner.dispose(); f.close(); }
});

test("busy configuration opens only after settling and cannot replace the active route or enable Auto", async () => {
  const started = gate(), finish = gate(), display = createUI();
  const f = await createFixture({ ui: display.ui, mode: "tui", skills: [small] });
  try {
    f.faux.setResponses([async () => { started.release(); await finish.promise; return fauxAssistantMessage("main"); }]);
    const pending = f.session.prompt("manual active task"); await started.promise;
    display.answers.push("Cancel");
    await f.session.prompt("/automodel configure");
    expect(display.dialogs).toEqual([]); expect(f.session.model?.id).toBe("gpt-6.1-sol");
    finish.release(); await pending;
    await wait(() => display.dialogs.length === 1);
    expect(f.session.model?.id).toBe("gpt-6.1-sol"); expect(last(f).thinkingLevel).toBe("xhigh");
    expect(readdirSync(f.dir)).not.toContain("pi-auto-model.json"); expect(f.faux.state.callCount).toBe(1);
  } finally { finish.release(); await f.owner.dispose(); f.close(); }
});

test("a no-match catalog search directs the user to Pi rather than inventing a provider/model", async () => {
  const display = createUI(), f = await createFixture({ ui: display.ui, mode: "tui" });
  try {
    display.answers.push("trivial: github-copilot/gpt-6-luna (medium)", "absent-provider/absent-model", "Cancel");
    await f.session.prompt("/automodel configure");
    expect(display.notices.at(-1)?.text).toMatch(/No matching physical model.*Configure/);
    expect(display.dialogs.flatMap((dialog) => dialog.choices ?? []).some((label) => label.includes("absent-model"))).toBe(false);
    expect(readdirSync(f.dir)).not.toContain("pi-auto-model.json"); expect(f.faux.state.callCount).toBe(0);
  } finally { await f.owner.dispose(); f.close(); }
});

test("catalog mappings preserve the original policy mode, popup and bounds despite a different mode preference", async () => {
  const display = createUI(), f = await createFixture({ ui: display.ui, mode: "tui" });
  try {
    await f.session.prompt("/automodel mode effort-only");
    display.answers.push("Review and save", true);
    await f.session.prompt("/automodel configure");
    const saved = JSON.parse(readFileSync(join(f.dir, "pi-auto-model.json"), "utf8"));
    expect(saved.mode).toBe("model-and-effort");
    expect(saved.switchPopup).toEqual({ enabled: true, durationMs: 10000 });
    expect(saved.classifier.maxOutputTokens).toBe(256);
    expect(JSON.parse(readFileSync(join(f.dir, "pi-auto-model-state.json"), "utf8")).mode).toBe("effort-only");
    expect(f.session.model?.id).toBe("gpt-6.1-sol"); expect(f.faux.state.callCount).toBe(0);
  } finally { await f.owner.dispose(); f.close(); }
});

test("selected pairs disappearing during review preserve the complete previous policy and preferences", async () => {
  const display = createUI(), f = await createFixture({ ui: display.ui, mode: "tui" });
  try {
    const original = validateConfiguration(undefined, new ModelRegistry(f.runtime));
    writeFileSync(join(f.dir, "pi-auto-model.json"), JSON.stringify(original));
    await f.session.reload(); await f.session.prompt("/automodel mode effort-only");
    const policy = readFileSync(join(f.dir, "pi-auto-model.json"), "utf8");
    const preferences = readFileSync(join(f.dir, "pi-auto-model-state.json"), "utf8");
    const confirm = display.ui.confirm;
    display.ui.confirm = async (...args) => {
      const answer = await confirm(...args);
      f.runtime.registerNativeProvider({ ...f.faux.provider, filterModels: () => [] });
      await f.runtime.refresh({ allowNetwork: false });
      return answer;
    };
    display.answers.push("Review and save", true);
    await f.session.prompt("/automodel configure");
    expect(display.notices.at(-1)?.text).toMatch(/Unavailable exact Auto mapping/);
    expect(readFileSync(join(f.dir, "pi-auto-model.json"), "utf8")).toBe(policy);
    expect(readFileSync(join(f.dir, "pi-auto-model-state.json"), "utf8")).toBe(preferences);
    expect(f.session.model?.id).toBe("gpt-6.1-sol"); expect(f.faux.state.callCount).toBe(0);
  } finally { await f.owner.dispose(); f.close(); }
});

test("corrupt saved preferences are actionable rather than silently enabled or overwritten", async () => {
  const display = createUI(), f = await createFixture({
    ui: display.ui, mode: "tui",
    setup: (dir) => writeFileSync(join(dir, "pi-auto-model-state.json"),
      '{"version":1,"enabled":"yes","mode":"model-and-effort"}'),
  });
  try {
    const before = readFileSync(join(f.dir, "pi-auto-model-state.json"), "utf8");
    await f.session.prompt("/automodel status");
    expect(display.notices.at(-1)?.text).toMatch(/pi-auto-model-state\.json.*Invalid Auto preferences/);
    expect(readFileSync(join(f.dir, "pi-auto-model-state.json"), "utf8")).toBe(before);
    expect(f.session.model?.id).toBe("gpt-6.1-sol"); expect(f.faux.state.callCount).toBe(0);
  } finally { await f.owner.dispose(); f.close(); }
});

test.each(
  (["reload", "resume", "tree"] as const).flatMap((lifecycle) => [
    ...[false, true].flatMap((dispatched) => ["gpt-6-luna", "gpt-6.1-sol"]
      .map((target) => ({ lifecycle, dispatched, target, explicitMode: true }))),
    { lifecycle, dispatched: false, target: "gpt-6-luna", explicitMode: false },
  ]),
)("new $target capture survives $lifecycle (new route=$dispatched, explicit mode=$explicitMode)", async ({ lifecycle, dispatched, target, explicitMode }) => {
  const configuration = explicitMode ? undefined : {
    ...validateConfiguration(undefined, { find: () => undefined, getAvailable: () => [], hasConfiguredAuth: () => false }),
    mode: "effort-only",
  };
  const f = await createFixture({ configuration, skills: [small, hard] }); let resumed: Fixture | undefined;
  try {
    const previous = target === "gpt-6-luna" ? "gpt-6.1-sol" : "gpt-6-luna";
    await f.session.setModel(f.faux.getModel(previous)!);
    if (explicitMode) await f.session.prompt("/automodel mode effort-only");
    await selectAuto(f); f.respond(); await f.session.prompt("/skill:small");
    expect(last(f).model).toBe(previous); expect(last(f).thinkingLevel).toBe("medium");
    await f.session.setModel(f.faux.getModel(target)!);
    f.session.setThinkingLevel("high");
    await selectAuto(f);
    if (dispatched) {
      f.respond(); await f.session.prompt("/skill:small");
      expect(last(f).model).toBe(target); expect(last(f).thinkingLevel).toBe("medium");
    }
    const checkpoint = f.session.sessionManager.getLeafId()!;
    let active = f;
    if (lifecycle === "reload") await f.session.reload();
    else if (lifecycle === "resume") {
      const manager = SessionManager.inMemory(undefined, undefined,
        [f.session.sessionManager.getHeader()!, ...JSON.parse(JSON.stringify(f.session.sessionManager.getEntries()))]);
      resumed = await createFixture({ configuration, restore: true, sessionManager: manager, skills: [small, hard] }); active = resumed;
    } else {
      f.respond(); await f.session.prompt("/skill:hard");
      await f.session.navigateTree(checkpoint, { summarize: false });
    }
    if (dispatched) {
      active.respond(); await active.session.prompt("yes");
      expect(last(active).model).toBe(target); expect(last(active).thinkingLevel).toBe("medium");
    }
    active.respond(); await active.session.prompt("/skill:small");
    expect(last(active).model).toBe(target); expect(last(active).thinkingLevel).toBe("medium");
    expect(active.session.model?.provider).toBe("pi-auto-model");
    if (lifecycle === "resume") expect(active.faux.state.callCount).toBe(1 + Number(dispatched));
    else expect(active.faux.state.callCount).toBe(2 + 2 * Number(dispatched) + Number(lifecycle === "tree"));
    expect(active.errors).toEqual([]);
    if (explicitMode) {
      const mode = JSON.parse(readFileSync(join(f.dir, "pi-auto-model-state.json"), "utf8"));
      expect(mode).toEqual({ version: 2, mode: "effort-only" });
    } else expect(readdirSync(f.dir)).not.toContain("pi-auto-model-state.json");
  } finally { await resumed?.owner.dispose(); resumed?.close(); await f.owner.dispose(); f.close(); }
});

test.each(["gpt-6-luna", "gpt-6.1-sol"])("a newer explicit mode capture of %s still overrides older native route evidence", async (target) => {
  const f = await createFixture({ skills: [small] });
  try {
    const previous = target === "gpt-6-luna" ? "gpt-6.1-sol" : "gpt-6-luna";
    await f.session.setModel(f.faux.getModel(previous)!);
    await selectAuto(f); f.respond(); await f.session.prompt("/skill:small");
    await f.session.setModel(f.faux.getModel(target)!);
    await f.session.prompt("/automodel mode effort-only");
    await selectAuto(f); await f.session.reload();
    f.respond(); await f.session.prompt("/skill:small");
    expect(last(f).model).toBe(target); expect(last(f).thinkingLevel).toBe("medium");
    expect(f.faux.state.callCount).toBe(2); expect(f.errors).toEqual([]);
    expect(f.session.model?.provider).toBe("pi-auto-model");
  } finally { await f.owner.dispose(); f.close(); }
});

test.each(["reload", "resume"] as const)("older mode effort cannot replace unsupported newer native capture after %s", async (lifecycle) => {
  const f = await createFixture({ skills: [small, hard] }); let resumed: Fixture | undefined;
  try {
    await f.session.prompt("/automodel mode effort-only");
    await selectAuto(f); f.respond(); await f.session.prompt("/skill:small");
    await f.session.setModel(f.faux.getModel("gpt-6-luna")!);
    f.session.setThinkingLevel("high"); await selectAuto(f);
    f.respond(); await f.session.prompt("/skill:small");
    expect(last(f).model).toBe("gpt-6-luna"); expect(last(f).thinkingLevel).toBe("medium");
    let active = f;
    if (lifecycle === "reload") {
      f.faux.getModel("gpt-6-luna")!.thinkingLevelMap = { medium: null, high: null, xhigh: "xhigh" };
      await f.session.reload();
    } else {
      const manager = SessionManager.inMemory(undefined, undefined,
        [f.session.sessionManager.getHeader()!, ...JSON.parse(JSON.stringify(f.session.sessionManager.getEntries()))]);
      resumed = await createFixture({ restore: true, sessionManager: manager, skills: [small, hard] }); active = resumed;
      active.faux.getModel("gpt-6-luna")!.thinkingLevelMap = { medium: null, high: null, xhigh: "xhigh" };
    }
    const before = active.faux.state.callCount;
    active.respond("Unexpected dispatch");
    await active.session.prompt("yes");
    expect(last(active).stopReason).toBe("error");
    expect(last(active).errorMessage).toMatch(/no usable active or captured physical pair/);
    expect(active.faux.state.callCount).toBe(before);
    await active.session.prompt("/skill:hard");
    expect(last(active).model).toBe("gpt-6-luna"); expect(last(active).thinkingLevel).toBe("xhigh");
    expect(active.faux.state.callCount).toBe(before + 1);
  } finally { await resumed?.owner.dispose(); resumed?.close(); await f.owner.dispose(); f.close(); }
});
