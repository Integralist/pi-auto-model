import assert from "node:assert/strict";
import { chmodSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { After, Before, Given, Then, When } from "@cucumber/cucumber";
import { ModelRegistry } from "@earendil-works/pi-coding-agent";
import { fauxAssistantMessage, fauxProvider } from "@earendil-works/pi-ai";
import { validateConfiguration, type PhysicalPair } from "../../src/policy.ts";
import { createFixture, type Fixture } from "../../test/support/session.ts";
import { createUI } from "../../test/support/ui.ts";

const alternate: PhysicalPair = { provider: "acceptance-alt", model: "portable-writer", effort: "high" };
const slots = ["trivial", "moderate", "complex", "frontier", "classifier"] as const;
const skills = slots.slice(0, 4).map((tier) => ({ name: "acceptance-" + tier, description: tier, tier }));
type State = {
  f: Fixture; display: ReturnType<typeof createUI>; originalPolicy: string; originalPreferences: string;
  selected: { provider?: string; model?: string; effort: string }; selectionScope: ReturnType<typeof scope>; calls: { provider: string; model: string; effort?: string }[];
  offered?: string[]; effortMenu?: string[]; extra?: ReturnType<typeof fauxProvider>;
  priorUntouched: ReturnType<typeof untouched>; output?: string; activeDialogs?: string[]; restorePermission?: boolean;
};
type World = { acceptance?: State };
const state = (world: World) => { assert.ok(world.acceptance); return world.acceptance; };
const scope = (f: Fixture) => f.session.scopedModels.map(({ model, thinkingLevel }) => ({ provider: model.provider, model: model.id, effort: thinkingLevel }));
const selected = (f: Fixture) => ({ provider: f.session.model?.provider, model: f.session.model?.id, effort: f.session.thinkingLevel });
const policyPath = (s: State) => join(s.f.dir, "pi-auto-model.json");
const preferencesPath = (s: State) => join(s.f.dir, "pi-auto-model-state.json");
const last = (f: Fixture) => { const message = f.session.messages.filter((m) => m.role === "assistant").at(-1); assert.ok(message); return message; };
function policy() {
  const raw = validateConfiguration(undefined, { find: () => undefined, getAvailable: () => [], hasConfiguredAuth: () => false });
  raw.mode = "effort-only"; raw.summaryTier = "moderate"; raw.switchPopup = { enabled: false, durationMs: 37 };
  raw.classifier.maxInputChars = 9876; raw.classifier.maxOutputTokens = 48; raw.classifier.timeoutMs = 2000;
  return raw;
}
function untouched(raw: ReturnType<typeof policy>) {
  return { version: raw.version, mode: raw.mode, summaryTier: raw.summaryTier, switchPopup: raw.switchPopup,
    classifier: { maxInputChars: raw.classifier.maxInputChars, maxOutputTokens: raw.classifier.maxOutputTokens, timeoutMs: raw.classifier.timeoutMs } };
}
function observe(s: State, text = "main") {
  return (_context: unknown, options: { reasoning?: string } | undefined, _provider: unknown, model: { provider: string; id: string }) => {
    s.calls.push({ provider: model.provider, model: model.id, effort: options?.reasoning }); return fauxAssistantMessage(text);
  };
}
async function enter(s: State) { await s.f.session.setModel(s.f.runtime.getModel("pi-auto-model", "auto")!); }
async function prompt(s: State, task: string) { s.f.faux.setResponses([observe(s)]); await s.f.session.prompt(task); }
function edit(s: State, slot: typeof slots[number], pair = { provider: "github-copilot", model: "gpt-6.1-sol", effort: "high" }) {
  const raw = JSON.parse(s.originalPolicy), current = slot === "classifier" ? raw.classifier : raw.tiers[slot];
  const model = s.f.runtime.getModel(pair.provider, pair.model)!; assert.ok(model);
  s.display.answers.push(slot + ": " + current.provider + "/" + current.model + " (" + current.effort + ")",
    pair.provider + " " + pair.model, pair.provider + "/" + pair.model + " — " + model.name, pair.effort);
}
function stableFiles(s: State) {
  assert.equal(readFileSync(policyPath(s), "utf8"), s.originalPolicy);
  assert.equal(readFileSync(preferencesPath(s), "utf8"), s.originalPreferences);
  assert.deepEqual(selected(s.f), s.selected);
  assert.equal(readdirSync(s.f.dir).some((name) => name.endsWith(".tmp")), false);
}
function barrier() { let release!: () => void; const wait = new Promise<void>((resolve) => { release = resolve; }); return { wait, release }; }

Before({ tags: "@controls_acceptance" }, async function (this: World) {
  const raw = policy(), display = createUI(), prefs = { version: 2, mode: "model-and-effort" };
  const f = await createFixture({ mode: "tui", ui: display.ui, skills, setup(dir) {
    writeFileSync(join(dir, "pi-auto-model.json"), JSON.stringify(raw, null, 2) + "\n");
    writeFileSync(join(dir, "pi-auto-model-state.json"), JSON.stringify(prefs, null, 2) + "\n");
  }, extensions: [(pi) => pi.registerVirtualModel({ provider: "acceptance-virtual", id: "other", name: "Other Virtual", route() { throw new Error("Virtual catalog target must not dispatch"); } })] });
  f.session.setScopedModels([{ model: f.faux.getModel("gpt-6.1-sol")!, thinkingLevel: "xhigh" }, { model: f.faux.getModel("gpt-6-luna")!, thinkingLevel: "high" }]);
  this.acceptance = { f, display, originalPolicy: readFileSync(join(f.dir, "pi-auto-model.json"), "utf8"),
    originalPreferences: readFileSync(join(f.dir, "pi-auto-model-state.json"), "utf8"), selected: selected(f), selectionScope: scope(f), calls: [], priorUntouched: untouched(raw) };
});
After({ tags: "@controls_acceptance" }, async function (this: World) {
  const s = this.acceptance;
  if (s) { if (s.restorePermission) chmodSync(s.f.dir, 0o700); await s.f.owner.dispose(); s.f.close(); }
});
Given("a native offline session has a saved policy and mode-only preferences", function (this: World) { stableFiles(state(this)); });
Given("two physical providers and another virtual model are registered", async function (this: World) {
  const s = state(this); s.extra = fauxProvider({ provider: alternate.provider, models: [{ id: alternate.model, name: "Portable Writer", reasoning: true }], tokensPerSecond: 1000000 });
  s.extra.models[0]!.thinkingLevelMap = { high: "high", xhigh: "xhigh" };
  s.f.runtime.registerNativeProvider(s.extra.provider); await s.f.runtime.refresh({ allowNetwork: false });
  assert.ok(s.f.runtime.getModel("acceptance-virtual", "other"));
});
Given("a physical catalog model supports only off and high", async function (this: World) {
  const s = state(this), model = s.f.faux.getModel("gpt-6-luna")!;
  model.thinkingLevelMap = { minimal: null, low: null, medium: null, high: "high", xhigh: null, max: null };
  const raw = JSON.parse(s.originalPolicy); raw.tiers.trivial.effort = "high"; raw.tiers.moderate.effort = "high"; raw.classifier.effort = "off";
  s.originalPolicy = JSON.stringify(raw, null, 2) + "\n"; writeFileSync(policyPath(s), s.originalPolicy);
  await s.f.session.reload();
  assert.equal(JSON.parse(readFileSync(policyPath(s), "utf8")).classifier.effort, "off");
});
When("I enter Auto, choose medium virtual thinking, and submit a trivial skill", async function (this: World) {
  const s = state(this); await enter(s); s.f.session.setThinkingLevel("medium");
  await prompt(s, "/skill:acceptance-trivial");
});
Then("Auto remains selected and the request uses Luna at medium", function (this: World) {
  const s = state(this); assert.equal(s.f.session.model?.id, "auto");
  assert.equal(last(s.f).model, "gpt-6-luna"); assert.equal(last(s.f).thinkingLevel, "medium");
});
When("I enter Auto, route a task, then choose physical Sol at high", async function (this: World) {
  const s = state(this); await enter(s); await prompt(s, "/skill:acceptance-trivial");
  await s.f.session.setModel(s.f.faux.getModel("gpt-6.1-sol")!); s.f.session.setThinkingLevel("high");
});
Then("the physical choice stays selected and its next request stays manual", async function (this: World) {
  const s = state(this); assert.deepEqual(selected(s.f), { provider: "github-copilot", model: "gpt-6.1-sol", effort: "high" });
  await prompt(s, "/skill:acceptance-trivial"); assert.deepEqual(s.calls.at(-1), { provider: "github-copilot", model: "gpt-6.1-sol", effort: "high" });
  assert.equal(last(s.f).thinkingLevel, "high");
});
When("I start a fresh native conversation after saving effort-only mode", async function (this: World) {
  const s = state(this); await s.f.session.prompt("/automodel mode effort-only"); await s.f.owner.newSession();
});
Then("the fresh conversation retains mode but starts with physical Sol", async function (this: World) {
  const s = state(this); assert.deepEqual(selected(s.f), { provider: "github-copilot", model: "gpt-6.1-sol", effort: "xhigh" });
  assert.deepEqual(JSON.parse(readFileSync(preferencesPath(s), "utf8")), { version: 2, mode: "effort-only" });
  await s.f.session.prompt("/automodel status"); assert.match(s.display.notices.at(-1)!.text, /mode: effort-only/); assert.equal(s.calls.length, 0);
});
When("I search the mapping catalog for {string}", async function (this: World, query: string) {
  const s = state(this), original = s.display.ui.select;
  s.display.ui.select = async (...args) => { if (args[0] === "Choose a physical model") s.offered = [...args[1]]; return original(...args); };
  const pair = policy().tiers.trivial;
  s.display.answers.push("trivial: " + pair.provider + "/" + pair.model + " (" + pair.effort + ")", query, undefined);
  await s.f.session.prompt("/automodel configure");
});
Then("the complete choice list contains only the registered physical models", function (this: World) {
  const s = state(this);
  assert.deepEqual(s.offered, ["acceptance-alt/portable-writer — Portable Writer",
    "github-copilot/gpt-6-luna — gpt-6-luna", "github-copilot/gpt-6.1-sol — gpt-6.1-sol"]);
  assert.deepEqual(scope(s.f), s.selectionScope); assert.equal(s.f.faux.state.callCount, 0); assert.equal(s.extra?.state.callCount, 0);
});
Then("the offered choices are exactly {string}", function (this: World, choice: string) {
  const s = state(this); assert.deepEqual(s.offered, [choice]); assert.deepEqual(scope(s.f), s.selectionScope); assert.equal(s.f.faux.state.callCount, 0); assert.equal(s.extra?.state.callCount, 0);
});
When("I save that model as the classifier at high", async function (this: World) {
  const s = state(this), original = s.display.ui.select;
  s.display.ui.select = async (...args) => { if (args[0].startsWith("Choose exact automatic effort")) s.effortMenu = [...args[1]]; return original(...args); };
  edit(s, "classifier", { provider: "github-copilot", model: "gpt-6-luna", effort: "high" }); s.display.answers.push("Review and save", true);
  await s.f.session.prompt("/automodel configure");
});
Then("the offered automatic efforts were exactly off and high", function (this: World) { assert.deepEqual(state(this).effortMenu, ["off", "high"]); });
Then("the saved classifier and next classifier request use that exact pair", async function (this: World) {
  const s = state(this), saved = JSON.parse(readFileSync(policyPath(s), "utf8"));
  assert.deepEqual(saved.classifier, { ...policy().classifier, effort: "high" }); await enter(s);
  s.f.faux.setResponses([observe(s, "trivial"), observe(s)]); await s.f.session.prompt("write a short title");
  assert.deepEqual(s.calls, [{ provider: "github-copilot", model: "gpt-6-luna", effort: "high" }, { provider: "github-copilot", model: "gpt-6-luna", effort: "high" }]);
  assert.equal(last(s.f).stopReason, "stop");
});
When("I save the alternate physical pair for all five mappings and reload", async function (this: World) {
  const s = state(this); for (const slot of slots) edit(s, slot, alternate); s.display.answers.push("Review and save", true);
  await s.f.session.prompt("/automodel configure"); await s.f.session.reload();
  const raw = JSON.parse(readFileSync(policyPath(s), "utf8"));
  for (const slot of slots.slice(0, 4)) assert.deepEqual(raw.tiers[slot], alternate);
  assert.deepEqual(raw.classifier, { ...policy().classifier, ...alternate });
});
Then("four declared tiers, classification and summary use only the alternate pair", async function (this: World) {
  const s = state(this); assert.ok(s.extra); await enter(s);
  for (const skill of skills) { s.extra.setResponses([observe(s)]); await s.f.session.prompt("/skill:" + skill.name); assert.equal(last(s.f).provider, alternate.provider); }
  s.extra.setResponses([observe(s, "complex"), observe(s)]); await s.f.session.prompt("a new task requiring classification");
  s.extra.setResponses([observe(s, "summary")]);
  const summary = await new ModelRegistry(s.f.runtime).streamSimple(s.f.runtime.getModel("pi-auto-model", "auto")!, { messages: [{ role: "user", content: "summary", timestamp: 0 }] }).result();
  assert.equal(summary.provider, alternate.provider); assert.equal(summary.model, alternate.model);
  assert.deepEqual(s.calls, Array.from({ length: 7 }, () => alternate)); assert.equal(s.extra.state.callCount, 7); assert.equal(s.f.faux.state.callCount, 0);
});
Then("non-mapping settings and mode-only preferences remain unchanged", function (this: World) {
  const s = state(this); assert.deepEqual(untouched(JSON.parse(readFileSync(policyPath(s), "utf8"))), s.priorUntouched);
  assert.equal(readFileSync(preferencesPath(s), "utf8"), s.originalPreferences); assert.deepEqual(scope(s.f), s.selectionScope); assert.deepEqual(s.f.errors, []);
});
When("an edited mapping cannot be saved because of {string}", async function (this: World, reason: string) {
  const s = state(this); edit(s, "trivial");
  if (reason === "cancel") s.display.answers.push("Cancel");
  else s.display.answers.push("Review and save", reason !== "decline review");
  const originalConfirm = s.display.ui.confirm, model = s.f.faux.getModel("gpt-6.1-sol")!, supported = structuredClone(model.thinkingLevelMap);
  s.display.ui.confirm = async (...args) => {
    const accepted = await originalConfirm(...args);
    if (reason === "invalid effort") model.thinkingLevelMap = { ...supported, high: null };
    if (reason === "disappeared model") {
      s.f.runtime.registerNativeProvider({ ...s.f.faux.provider, filterModels: (models) => models.filter((m) => m.id !== "gpt-6.1-sol") });
      await s.f.runtime.refresh({ allowNetwork: false });
    }
    if (reason === "write failure") { chmodSync(s.f.dir, 0o500); s.restorePermission = true; }
    return accepted;
  };
  try { await s.f.session.prompt("/automodel configure"); }
  finally {
    if (s.restorePermission) { chmodSync(s.f.dir, 0o700); s.restorePermission = false; }
    model.thinkingLevelMap = supported;
    if (reason === "disappeared model") { s.f.runtime.registerNativeProvider(s.f.faux.provider); await s.f.runtime.refresh({ allowNetwork: false }); }
  }
  if (!["cancel", "decline review"].includes(reason)) assert.equal(s.display.notices.at(-1)?.type, "error");
});
Then("the saved policy, preferences and selection remain unchanged", function (this: World) { stableFiles(state(this)); });
Then("the next automatic request still uses the original physical pair", async function (this: World) {
  const s = state(this); await enter(s); await prompt(s, "/skill:acceptance-trivial");
  assert.deepEqual(s.calls, [{ provider: "github-copilot", model: "gpt-6-luna", effort: "medium" }]); assert.equal(last(s.f).stopReason, "stop");
});
Then("configuration feedback adds no chat message or provider probe", function (this: World) {
  const s = state(this); assert.equal(s.f.session.messages.some((m) => m.role === "custom"), false); assert.equal(s.display.overlays.length, 0); assert.deepEqual(s.f.errors, []);
  assert.equal(s.f.faux.state.callCount, s.calls.length);
});
When("I request configuration with {string}", async function (this: World, condition: string) {
  const s = state(this);
  if (condition === "no physical models") {
    s.f.runtime.registerNativeProvider({ ...s.f.faux.provider, filterModels: () => [] }); await s.f.runtime.refresh({ allowNetwork: false });
  }
  else { assert.equal(condition, "no matching model"); const pair = policy().tiers.trivial;
    s.display.answers.push("trivial: " + pair.provider + "/" + pair.model + " (" + pair.effort + ")", "ABSENT_PROVIDER_MODEL", "Cancel"); }
  await s.f.session.prompt("/automodel configure");
});
Then("actionable Pi provider guidance is shown without dispatch or settings changes", function (this: World) {
  const s = state(this); assert.match(s.display.notices.at(-1)!.text, /Configure.*Pi/); stableFiles(s); assert.equal(s.f.faux.state.callCount, 0);
});
When("I request configuration in native {string} mode", async function (this: World, mode: string) {
  const s = state(this); assert.ok(["print", "json", "rpc"].includes(mode));
  await s.f.owner.dispose(); s.f.close();
  s.display = createUI(); s.activeDialogs = [];
  s.f = await createFixture({ mode: mode as "print" | "json" | "rpc", ui: mode === "rpc" ? s.display.ui : undefined, skills,
    extensions: [(pi) => { pi.on("session_start", (_event, ctx) => {
      const select = ctx.ui.select, input = ctx.ui.input, confirm = ctx.ui.confirm;
      ctx.ui.select = async (...args) => { s.activeDialogs!.push("select"); return select(...args); };
      ctx.ui.input = async (...args) => { s.activeDialogs!.push("input"); return input(...args); };
      ctx.ui.confirm = async (...args) => { s.activeDialogs!.push("confirm"); return confirm(...args); };
    }); }], setup(dir) {
      writeFileSync(join(dir, "pi-auto-model.json"), s.originalPolicy);
      writeFileSync(join(dir, "pi-auto-model-state.json"), s.originalPreferences);
    } });
  const original = process.stdout.write; let output = "";
  process.stdout.write = ((chunk: unknown) => { output += String(chunk); return true; }) as typeof process.stdout.write;
  try { await s.f.session.prompt("/automodel configure"); } finally { process.stdout.write = original; }
  s.output = mode === "rpc" ? s.display.notices.map((notice) => notice.text).join("\n") : output;
});
Then("the policy-file guidance is observable and no dialog or settings change occurs", function (this: World) {
  const s = state(this); assert.ok(s.output?.includes(policyPath(s))); assert.deepEqual(s.activeDialogs, []); assert.equal(s.display.dialogs.length, 0); stableFiles(s); assert.equal(s.f.faux.state.callCount, 0);
});
When("I request an edited mapping during an active task", async function (this: World) {
  const s = state(this), entered = barrier(), finish = barrier(); await enter(s);
  s.f.faux.setResponses([async (_context, options, _provider, model) => { s.calls.push({ provider: model.provider, model: model.id, effort: options?.reasoning }); entered.release(); await finish.wait; return fauxAssistantMessage("main"); }]);
  const running = s.f.session.prompt("/skill:acceptance-trivial");
  try {
    await entered.wait; edit(s, "trivial"); s.display.answers.push("Review and save", true);
    await s.f.session.prompt("/automodel configure"); assert.equal(s.f.session.isStreaming, true); assert.equal(s.display.dialogs.length, 0);
    finish.release(); await running;
    for (let i = 0; i < 100 && !s.display.notices.some((notice) => notice.text.startsWith("Saved model mappings.")); i++) await new Promise((resolve) => setTimeout(resolve, 10));
    assert.ok(s.display.notices.some((notice) => notice.text.startsWith("Saved model mappings.")));
  } finally { finish.release(); await running.catch(() => {}); }
});
Then("that task keeps Luna at medium and the later fresh task uses Sol at high", async function (this: World) {
  const s = state(this); assert.equal(last(s.f).model, "gpt-6-luna"); assert.equal(last(s.f).thinkingLevel, "medium");
  await prompt(s, "/skill:acceptance-trivial"); assert.deepEqual(s.calls, [
    { provider: "github-copilot", model: "gpt-6-luna", effort: "medium" }, { provider: "github-copilot", model: "gpt-6.1-sol", effort: "high" },
  ]); assert.equal(last(s.f).stopReason, "stop"); assert.equal(s.f.session.model?.id, "auto");
});
