import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ModelRegistry, SessionManager } from "@earendil-works/pi-coding-agent";
import { fauxAssistantMessage, fauxProvider } from "@earendil-works/pi-ai";
import { expect, test, vi } from "vitest";
import { validateConfiguration } from "../src/policy.ts";
import { createFixture, type Fixture } from "./support/session.ts";
import { createUI } from "./support/ui.ts";

const provider = "amazon-bedrock";
const haiku = "anthropic.claude-haiku-5-5", opus = "anthropic.claude-opus-5-5";
const geminiProvider = "google-vertex";
const flash = "gemini-3.8-flash", argon = "gemini-4-argon";
const skills = ["trivial", "moderate", "complex", "frontier"].map((tier) => ({ name: tier, description: tier + " work", tier }));
const last = (f: Fixture) => f.session.messages.filter((message) => message.role === "assistant").at(-1)!;

function globalPolicy() {
  const config = validateConfiguration(undefined, { find: () => undefined, getAvailable: () => [], hasConfiguredAuth: () => false });
  config.switchPopup = { enabled: false, durationMs: 1234 };
  config.summaryTier = "moderate";
  config.classifier.maxInputChars = 4321; config.classifier.maxOutputTokens = 48; config.classifier.timeoutMs = 2000;
  return config;
}

async function fixture(options: Parameters<typeof createFixture>[0] = {}) {
  const display = createUI();
  const f = await createFixture({ skills, mode: "tui", ui: options.mode === "print" || options.mode === "json" ? undefined : display.ui, ...options });
  const bedrock = fauxProvider({ provider, models: [{ id: haiku, reasoning: true }, { id: opus, reasoning: true }], tokensPerSecond: 1000000 });
  for (const model of bedrock.models) model.thinkingLevelMap = { low: "low", medium: "medium", high: "high", xhigh: "xhigh" };
  f.runtime.registerNativeProvider(bedrock.provider);
  await f.runtime.refresh({ allowNetwork: false });
  return { ...f, get session() { return f.session; }, display, bedrock };
}

async function addGeminiProvider(f: Fixture) {
  const gemini = fauxProvider({ provider: geminiProvider, models: [{ id: flash, reasoning: true }, { id: argon, reasoning: false }], tokensPerSecond: 1000000 });
  f.runtime.registerNativeProvider(gemini.provider); await f.runtime.refresh({ allowNetwork: false });
  return gemini;
}

async function selectAuto(f: Fixture) { await f.session.setModel(f.runtime.getModel("pi-auto-model", "auto")!); }
async function status(f: Awaited<ReturnType<typeof fixture>>) {
  await f.session.prompt("/automodel status"); return f.display.notices.at(-1)!.text;
}
function gate() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => { release = resolve; });
  return { promise, release };
}

test("the Gemini preset uses the exact screenshot mappings only in this session", async () => {
  const f = await fixture();
  try {
    const gemini = await addGeminiProvider(f), files = readdirSync(f.dir), selected = f.session.model;
    await f.session.prompt("/automodel temp gemini");
    const text = await status(f);
    expect(text).toContain("mappings: session preset gemini");
    expect(text).toContain("trivial: google-vertex/" + flash + " (medium)");
    expect(text).toContain("moderate: google-vertex/" + flash + " (high)");
    expect(text).toContain("complex: google-vertex/" + argon + " (off)");
    expect(text).toContain("frontier: google-vertex/" + argon + " (off)");
    expect(text).toContain("classifier: google-vertex/" + flash + " (medium)");
    expect(f.session.model).toEqual(selected); expect(readdirSync(f.dir)).toEqual(files);
    expect(f.faux.state.callCount + f.bedrock.state.callCount + gemini.state.callCount).toBe(0);
  } finally { await f.owner.dispose(); f.close(); }
});

test.each([
  ["trivial", flash, "medium"], ["moderate", flash, "high"],
  ["complex", argon, "off"], ["frontier", argon, "off"],
])("Gemini temporary %s dispatch uses exactly %s at %s", async (tier, model, effort) => {
  const f = await fixture();
  try {
    const gemini = await addGeminiProvider(f);
    await f.session.prompt("/automodel temp gemini"); await selectAuto(f);
    gemini.setResponses([fauxAssistantMessage("main")]); await f.session.prompt("/skill:" + tier);
    expect(last(f).provider).toBe(geminiProvider); expect(last(f).model).toBe(model); expect(last(f).thinkingLevel).toBe(effort);
    expect(f.display.statuses.get("pi-auto-model")).toContain("temp gemini");
    expect(f.faux.state.callCount).toBe(0); expect(f.bedrock.state.callCount).toBe(0);
    expect(gemini.state.callCount).toBe(1); expect(f.errors).toEqual([]);
  } finally { await f.owner.dispose(); f.close(); }
});

test.each(["provider missing", "off unsupported"])("an unavailable Gemini preset (%s) leaves the active preset unchanged", async (reason) => {
  const f = await fixture();
  try {
    await f.session.prompt("/automodel temp bedrock");
    let gemini: Awaited<ReturnType<typeof addGeminiProvider>> | undefined;
    if (reason === "off unsupported") {
      gemini = await addGeminiProvider(f);
      const model = gemini.getModel(argon)!; model.reasoning = true; model.thinkingLevelMap = { off: null };
    }
    const leaf = f.session.sessionManager.getLeafId(); await f.session.prompt("/automodel temp gemini");
    expect(f.display.notices.at(-1)?.text).toContain("Unavailable exact Auto mapping");
    expect(f.session.sessionManager.getLeafId()).toBe(leaf);
    expect(await status(f)).toContain("mappings: session preset bedrock");
    expect(f.faux.state.callCount + f.bedrock.state.callCount + (gemini?.state.callCount ?? 0)).toBe(0);
  } finally { await f.owner.dispose(); f.close(); }
});

test("Gemini temporary classifier dispatch uses Flash at medium effort", async () => {
  const f = await fixture();
  try {
    const gemini = await addGeminiProvider(f), requests: { model: string; effort?: string }[] = [];
    await f.session.prompt("/automodel temp gemini"); await selectAuto(f);
    gemini.setResponses(["trivial", "main"].map((reply) => (_context, options, _state, model) => {
      requests.push({ model: model.id, effort: options?.reasoning }); return fauxAssistantMessage(reply);
    }));
    await f.session.prompt("write a short helper");
    expect(last(f).provider).toBe(geminiProvider); expect(last(f).model).toBe(flash); expect(last(f).thinkingLevel).toBe("medium");
    expect(requests).toEqual([{ model: flash, effort: "medium" }, { model: flash, effort: "medium" }]);
    expect(f.faux.state.callCount + f.bedrock.state.callCount).toBe(0); expect(f.errors).toEqual([]);
  } finally { await f.owner.dispose(); f.close(); }
});

test("Gemini preset survives reload, then a clear restores global mappings", async () => {
  const f = await fixture();
  try {
    const gemini = await addGeminiProvider(f);
    await f.session.prompt("/automodel temp gemini"); await f.session.reload();
    expect(await status(f)).toContain("mappings: session preset gemini");
    await selectAuto(f); gemini.setResponses([fauxAssistantMessage("main")]); await f.session.prompt("/skill:complex");
    expect(last(f).provider).toBe(geminiProvider); expect(last(f).model).toBe(argon); expect(last(f).thinkingLevel).toBe("off");
    await f.session.prompt("/automodel temp clear"); expect(await status(f)).toContain("mappings: saved/default");
  } finally { await f.owner.dispose(); f.close(); }
});

test("the Bedrock preset changes all five mappings without selecting Auto or writing settings", async () => {
  const f = await fixture({ configuration: globalPolicy() });
  try {
    const files = readdirSync(f.dir), selected = f.session.model, level = f.session.thinkingLevel;
    await f.session.prompt("/automodel temp bedrock");
    const text = await status(f);
    expect(text).toContain("mappings: session preset bedrock");
    expect(text).toContain("trivial: amazon-bedrock/" + haiku + " (medium)");
    expect(text).toContain("moderate: amazon-bedrock/" + haiku + " (high)");
    expect(text).toContain("complex: amazon-bedrock/" + opus + " (high)");
    expect(text).toContain("frontier: amazon-bedrock/" + opus + " (xhigh)");
    expect(text).toContain("classifier: amazon-bedrock/" + haiku + " (low)");
    expect(f.session.model).toEqual(selected); expect(f.session.thinkingLevel).toBe(level);
    expect(readdirSync(f.dir)).toEqual(files); expect(f.display.dialogs).toEqual([]);
    expect(f.faux.state.callCount + f.bedrock.state.callCount).toBe(0);
    expect(f.session.messages.some((message) => message.role === "custom")).toBe(false);
  } finally { await f.owner.dispose(); f.close(); }
});

test.each([
  ["trivial", haiku, "medium"], ["moderate", haiku, "high"],
  ["complex", opus, "high"], ["frontier", opus, "xhigh"],
])("temporary %s dispatch uses exactly %s at %s", async (tier, model, effort) => {
  const f = await fixture();
  try {
    await f.session.prompt("/automodel temp bedrock"); await selectAuto(f);
    f.bedrock.setResponses([fauxAssistantMessage("main")]); await f.session.prompt("/skill:" + tier);
    expect(last(f).provider).toBe(provider); expect(last(f).model).toBe(model); expect(last(f).thinkingLevel).toBe(effort);
    expect(f.display.statuses.get("pi-auto-model")).toContain("temp bedrock");
    expect(f.faux.state.callCount).toBe(0); expect(f.bedrock.state.callCount).toBe(1); expect(f.errors).toEqual([]);
  } finally { await f.owner.dispose(); f.close(); }
});

test("classification and summaries use the temporary pairs while preserving bounds and summary tier", async () => {
  const f = await fixture({ configuration: globalPolicy() });
  try {
    await f.session.prompt("/automodel temp bedrock"); await selectAuto(f);
    const requests: { model: string; effort?: string; maxTokens?: number }[] = [];
    f.bedrock.setResponses(["frontier", "main", "summary"].map((reply) => (_context, options, _state, model) => {
      requests.push({ model: model.id, effort: options?.reasoning, maxTokens: options?.maxTokens }); return fauxAssistantMessage(reply);
    }));
    await f.session.prompt("design a new compiler");
    expect(last(f).model).toBe(opus); expect(last(f).thinkingLevel).toBe("xhigh");
    const summary = await new ModelRegistry(f.runtime).streamSimple(f.runtime.getModel("pi-auto-model", "auto")!, {
      messages: [{ role: "user", content: "summary", timestamp: 0 }],
    }).result();
    expect(summary.model).toBe(haiku);
    expect(requests.map(({ model, effort }) => ({ model, effort }))).toEqual([
      { model: haiku, effort: "low" }, { model: opus, effort: "xhigh" }, { model: haiku, effort: "high" },
    ]);
    expect(requests[0]!.maxTokens).toBe(48);
    expect(f.faux.state.callCount).toBe(0); expect(f.errors).toEqual([]);
  } finally { await f.owner.dispose(); f.close(); }
});

test("sessions in two repos sharing the same global settings can route through different providers", async () => {
  const raw = JSON.stringify(globalPolicy()), preferences = '{"version":2,"mode":"model-and-effort"}';
  const first = await fixture({ setup: (dir) => {
    writeFileSync(join(dir, "pi-auto-model.json"), raw); writeFileSync(join(dir, "pi-auto-model-state.json"), preferences);
  } });
  let second: Awaited<ReturnType<typeof fixture>> | undefined;
  try {
    second = await fixture({ policyDirectory: first.dir });
    expect(second.dir).not.toBe(first.dir);
    await first.session.prompt("/automodel temp bedrock"); await selectAuto(first); await selectAuto(second);
    first.bedrock.setResponses([fauxAssistantMessage("Bedrock")]); second.respond("Copilot");
    await Promise.all([first.session.prompt("/skill:moderate"), second.session.prompt("/skill:moderate")]);
    expect(last(first).provider).toBe(provider); expect(last(first).model).toBe(haiku); expect(last(first).thinkingLevel).toBe("high");
    expect(last(second).provider).toBe("github-copilot"); expect(last(second).model).toBe("gpt-6-luna"); expect(last(second).thinkingLevel).toBe("xhigh");
    expect(await status(second)).toContain("mappings: saved/default");
    expect(readFileSync(join(first.dir, "pi-auto-model.json"), "utf8")).toBe(raw);
    expect(readFileSync(join(first.dir, "pi-auto-model-state.json"), "utf8")).toBe(preferences);
    expect(first.faux.state.callCount).toBe(0); expect(second.bedrock.state.callCount).toBe(0);
  } finally { await second?.owner.dispose(); second?.close(); await first.owner.dispose(); first.close(); }
});

test("clearing a temporary preset restores saved mappings and stays clear after reload", async () => {
  const raw = globalPolicy(); raw.tiers.trivial.effort = "xhigh";
  const f = await fixture({ configuration: raw });
  try {
    await f.session.prompt("/automodel temp bedrock"); await f.session.prompt("/automodel temp clear"); await f.session.reload();
    expect(await status(f)).toContain("mappings: saved/default");
    await selectAuto(f); f.respond(); await f.session.prompt("/skill:trivial");
    expect(last(f).provider).toBe("github-copilot"); expect(last(f).thinkingLevel).toBe("xhigh");
    expect(f.bedrock.state.callCount).toBe(0);
    expect(readdirSync(f.dir)).not.toContain("pi-auto-model.json"); expect(readdirSync(f.dir)).not.toContain("pi-auto-model-state.json");
  } finally { await f.owner.dispose(); f.close(); }
});

test("temporary mappings survive reload, but a genuinely new session starts without them", async () => {
  const f = await fixture();
  try {
    await f.session.prompt("/automodel temp bedrock"); await f.session.reload();
    expect(await status(f)).toContain("mappings: session preset bedrock");
    await selectAuto(f); f.bedrock.setResponses([fauxAssistantMessage("main")]); await f.session.prompt("/skill:trivial");
    expect(last(f).provider).toBe(provider); expect(last(f).thinkingLevel).toBe("medium");
    await f.owner.newSession();
    expect(await status(f)).toContain("mappings: saved/default");
    await selectAuto(f); f.respond(); await f.session.prompt("/skill:trivial");
    expect(last(f).provider).toBe("github-copilot"); expect(last(f).thinkingLevel).toBe("high");
  } finally { await f.owner.dispose(); f.close(); }
});

test("resuming a session from disk restores its temporary preset without a global policy file", async () => {
  const directory = mkdtempSync(join(tmpdir(), "auto-temp-resume-"));
  const first = await fixture({ sessionManager: SessionManager.create(directory, directory) });
  let resumed: Awaited<ReturnType<typeof fixture>> | undefined;
  try {
    await first.session.prompt("/automodel temp bedrock"); await selectAuto(first);
    first.bedrock.setResponses([fauxAssistantMessage("main")]); await first.session.prompt("/skill:trivial");
    const path = first.session.sessionManager.getSessionFile()!;
    await first.owner.dispose();
    resumed = await fixture({ restore: true, sessionManager: SessionManager.open(path) });
    expect(await status(resumed)).toContain("mappings: session preset bedrock");
    expect(resumed.session.model?.id).toBe("auto");
    resumed.bedrock.setResponses([fauxAssistantMessage("main")]); await resumed.session.prompt("/skill:frontier");
    expect(last(resumed).provider).toBe(provider); expect(last(resumed).thinkingLevel).toBe("xhigh");
    expect(readdirSync(resumed.dir)).not.toContain("pi-auto-model.json"); expect(resumed.errors).toEqual([]);
  } finally { await resumed?.owner.dispose(); resumed?.close(); await first.owner.dispose(); first.close(); rmSync(directory, { recursive: true, force: true }); }
});

test("temporary mappings follow the active branch and a clear does not erase the earlier preset", async () => {
  const f = await fixture();
  try {
    const original = f.session.sessionManager.getLeafId()!;
    await f.session.prompt("/automodel temp bedrock"); const preset = f.session.sessionManager.getLeafId()!;
    await f.session.prompt("/automodel temp clear"); const cleared = f.session.sessionManager.getLeafId()!;
    await f.session.navigateTree(preset, { summarize: false });
    expect(await status(f)).toContain("mappings: session preset bedrock");
    await f.session.navigateTree(original, { summarize: false });
    expect(await status(f)).toContain("mappings: saved/default");
    await f.session.navigateTree(cleared, { summarize: false });
    expect(await status(f)).toContain("mappings: saved/default");
  } finally { await f.owner.dispose(); f.close(); }
});

test("mode changes and manual model selection do not clear or save temporary mappings", async () => {
  const f = await fixture();
  try {
    await f.session.prompt("/automodel temp bedrock"); await f.session.prompt("/automodel mode effort-only");
    await f.session.setModel(f.faux.getModel("gpt-6-luna")!); await selectAuto(f); await f.session.reload();
    expect(await status(f)).toContain("mappings: session preset bedrock");
    f.respond(); await f.session.prompt("/skill:trivial");
    expect(last(f).provider).toBe("github-copilot"); expect(last(f).model).toBe("gpt-6-luna"); expect(last(f).thinkingLevel).toBe("medium");
    expect(JSON.parse(readFileSync(join(f.dir, "pi-auto-model-state.json"), "utf8"))).toEqual({ version: 2, mode: "effort-only" });
    expect(readdirSync(f.dir)).not.toContain("pi-auto-model.json");
  } finally { await f.owner.dispose(); f.close(); }
});

test("configure still edits global mappings without copying the active temporary preset", async () => {
  const f = await fixture();
  try {
    await f.session.prompt("/automodel temp bedrock");
    f.display.answers.push("Review and save", true); await f.session.prompt("/automodel configure");
    const saved = JSON.parse(readFileSync(join(f.dir, "pi-auto-model.json"), "utf8"));
    expect(saved.tiers.moderate).toEqual({ provider: "github-copilot", model: "gpt-6-luna", effort: "xhigh" });
    expect(saved.classifier.provider).toBe("github-copilot");
    expect(await status(f)).toContain("mappings: session preset bedrock");
    await f.session.prompt("/automodel temp clear"); expect(await status(f)).toContain("mappings: saved/default");
  } finally { await f.owner.dispose(); f.close(); }
});

test.each(["missing", "filtered", "unsupported", "no auth"])("an unavailable preset (%s) leaves the current policy unchanged without probing auth", async (reason) => {
  const f = await fixture();
  try {
    const check = vi.fn(async () => reason === "no auth" ? undefined : { type: "api_key" as const, source: "offline" });
    const available = f.bedrock.models.filter((model) => model.id !== opus);
    if (reason === "unsupported") f.bedrock.getModel(opus)!.thinkingLevelMap = { high: "high", xhigh: null };
    else f.runtime.registerNativeProvider({
      ...f.bedrock.provider,
      ...reason === "missing" ? { getModels: () => available, getAllModels: () => available } : {},
      ...reason === "filtered" ? { filterModels: () => [] } : {},
      auth: { apiKey: { name: "offline", resolve: async () => reason === "no auth" ? undefined : { auth: {} }, check } },
    });
    await f.runtime.refresh({ allowNetwork: false }); check.mockClear();
    const before = f.session.sessionManager.getLeafId(); await f.session.prompt("/automodel temp bedrock");
    expect(f.display.notices.at(-1)?.text).toContain("Unavailable exact Auto mapping");
    expect(f.session.sessionManager.getLeafId()).toBe(before);
    expect(await status(f)).toContain("mappings: saved/default");
    expect(f.faux.state.callCount + f.bedrock.state.callCount).toBe(0); expect(check).not.toHaveBeenCalled();
  } finally { await f.owner.dispose(); f.close(); }
});

test("an active preset can be cleared even after its provider becomes unavailable", async () => {
  const f = await fixture();
  try {
    await f.session.prompt("/automodel temp bedrock");
    f.runtime.registerNativeProvider({ ...f.bedrock.provider, filterModels: () => [] }); await f.runtime.refresh({ allowNetwork: false });
    await f.session.reload();
    const text = await status(f);
    expect(text).toContain("mappings: session preset bedrock"); expect(text).toContain("(medium) [unavailable]");
    const before = f.session.sessionManager.getLeafId();
    await f.session.prompt("/automodel temp bedrock");
    expect(f.display.notices.at(-1)?.text).toContain("Unavailable exact Auto mapping");
    expect(f.session.sessionManager.getLeafId()).toBe(before);
    expect(await status(f)).toContain("mappings: session preset bedrock");
    await f.session.prompt("/automodel temp clear"); await selectAuto(f); f.respond(); await f.session.prompt("/skill:trivial");
    expect(last(f).provider).toBe("github-copilot"); expect(f.bedrock.state.callCount).toBe(0);
  } finally { await f.owner.dispose(); f.close(); }
});

test.each([null, [], { version: 2, group: "bedrock" }, { version: 1, group: "absent" },
  { version: 1 }, { version: 1, group: "bedrock", extra: true },
])("malformed temporary history %j blocks routing until cleared", async (raw) => {
  const f = await fixture();
  try {
    const bad = f.session.sessionManager.appendCustomEntry("pi-auto-model.temp", raw);
    await f.session.reload();
    expect(await status(f)).toContain("Invalid temporary Auto preset at branch entry " + bad);
    await f.session.prompt("/automodel mode model-and-effort");
    expect(await status(f)).toContain("Invalid temporary Auto preset at branch entry " + bad);
    await selectAuto(f); f.respond("must not dispatch"); await f.session.prompt("/skill:trivial");
    expect(last(f).stopReason).toBe("error"); expect(f.faux.state.callCount).toBe(0);
    await f.session.prompt("/automodel temp clear");
    expect(await status(f)).toContain("mappings: saved/default");
    await f.session.prompt("/skill:trivial"); expect(last(f).provider).toBe("github-copilot"); expect(last(f).stopReason).toBe("stop");
  } finally { await f.owner.dispose(); f.close(); }
});

test("clearing temporary history does not hide malformed global settings", async () => {
  const f = await fixture({ setup: (dir) => writeFileSync(join(dir, "pi-auto-model.json"), "{") });
  try {
    const before = f.session.sessionManager.getLeafId();
    await f.session.prompt("/automodel temp clear");
    expect(f.session.sessionManager.getLeafId()).toBe(before);
    expect(await status(f)).toContain("Cannot read Auto settings at " + join(f.dir, "pi-auto-model.json"));
    expect(readFileSync(join(f.dir, "pi-auto-model.json"), "utf8")).toBe("{");
  } finally { await f.owner.dispose(); f.close(); }
});

test.each(["temp", "temp absent", "temp bedrock extra", "temp clear extra"])("invalid command %s gives preset guidance without changing state", async (args) => {
  const f = await fixture();
  try {
    await f.session.prompt("/automodel temp bedrock");
    const before = f.session.sessionManager.getLeafId(); await f.session.prompt("/automodel " + args);
    expect(f.display.notices.at(-1)?.text).toContain("/automodel temp bedrock|gemini|clear");
    expect(f.session.sessionManager.getLeafId()).toBe(before);
    expect(await status(f)).toContain("mappings: session preset bedrock");
  } finally { await f.owner.dispose(); f.close(); }
});

test.each(["main", "classifier"])("busy temporary activation leaves the active %s task unchanged until safe idle", async (stage) => {
  const f = await fixture(), started = gate(), finish = gate();
  let pending: Promise<void> | undefined;
  try {
    await selectAuto(f);
    f.faux.setResponses([
      async () => { started.release(); await finish.promise; return fauxAssistantMessage(stage === "classifier" ? "trivial" : "main"); },
      ...stage === "classifier" ? [fauxAssistantMessage("main")] : [],
    ]);
    pending = f.session.prompt(stage === "classifier" ? "write a small helper" : "/skill:trivial"); await started.promise;
    await f.session.prompt("/automodel temp bedrock");
    expect(await status(f)).toContain("mappings: saved/default"); expect(f.session.isStreaming).toBe(true);
    finish.release(); await pending;
    expect(last(f).provider).toBe("github-copilot"); expect(last(f).thinkingLevel).toBe("high");
    await expect.poll(async () => status(f)).toContain("mappings: session preset bedrock");
    f.bedrock.setResponses([fauxAssistantMessage("next")]); await f.session.prompt("/skill:trivial");
    expect(last(f).provider).toBe(provider); expect(last(f).thinkingLevel).toBe("medium"); expect(f.errors).toEqual([]);
  } finally { finish.release(); await pending?.catch(() => {}); await f.owner.dispose(); f.close(); }
});

test("a queued temporary change is canceled when the user leaves Auto", async () => {
  const f = await fixture(), started = gate(), finish = gate();
  let pending: Promise<void> | undefined;
  try {
    await selectAuto(f);
    f.faux.setResponses([async () => { started.release(); await finish.promise; return fauxAssistantMessage("main"); }]);
    pending = f.session.prompt("/skill:trivial"); await started.promise;
    await f.session.prompt("/automodel temp bedrock"); await f.session.setModel(f.faux.getModel("gpt-6.1-sol")!);
    finish.release(); await pending;
    expect(await status(f)).toContain("pending: 0"); expect(await status(f)).toContain("mappings: saved/default");
    expect(f.session.sessionManager.getBranch().some((entry) => entry.type === "custom" && entry.customType === "pi-auto-model.temp")).toBe(false);
    expect(f.bedrock.state.callCount).toBe(0);
  } finally { finish.release(); await pending?.catch(() => {}); await f.owner.dispose(); f.close(); }
});

test.each(["print", "json", "rpc"] as const)("temporary presets work in %s mode without dialogs or global files", async (mode) => {
  const out = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  const err = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  const f = await fixture({ mode });
  try {
    await f.session.prompt("/automodel temp bedrock"); await f.session.prompt("/automodel status");
    const text = mode === "rpc" ? f.display.notices.at(-1)?.text : out.mock.calls.flat().join("");
    expect(text).toContain("mappings: session preset bedrock");
    expect(f.display.dialogs).toEqual([]); expect(readdirSync(f.dir)).not.toContain("pi-auto-model.json");
    expect(readdirSync(f.dir)).not.toContain("pi-auto-model-state.json");
    expect(f.faux.state.callCount + f.bedrock.state.callCount).toBe(0);
  } finally { out.mockRestore(); err.mockRestore(); await f.owner.dispose(); f.close(); }
});
