import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ModelRegistry } from "@earendil-works/pi-coding-agent";
import { fauxAssistantMessage, fauxProvider } from "@earendil-works/pi-ai";
import { expect, test, vi } from "vitest";
import { validateConfiguration } from "../src/policy.ts";
import { createFixture, type Fixture } from "./support/session.ts";
import { createUI } from "./support/ui.ts";

const bedrockProvider = "amazon-bedrock";
const haiku = "anthropic.claude-haiku-5-5", sonnet = "anthropic.claude-sonnet-5-5", opus = "anthropic.claude-opus-5-5";
const geminiProvider = "google-vertex";
const hydrogen = "gemini-4-hydrogen", neon = "gemini-4-neon";
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
  const bedrock = fauxProvider({ provider: bedrockProvider, models: [{ id: haiku, reasoning: true }, { id: sonnet, reasoning: true }, { id: opus, reasoning: true }], tokensPerSecond: 1000000 });
  for (const model of bedrock.models) model.thinkingLevelMap = { low: "low", medium: "medium", high: "high", xhigh: "xhigh" };
  const gemini = fauxProvider({ provider: geminiProvider, models: [{ id: hydrogen, reasoning: true }, { id: neon, reasoning: true }], tokensPerSecond: 1000000 });
  for (const id of [hydrogen, neon]) gemini.getModel(id)!.thinkingLevelMap = { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: id === neon ? "xhigh" : null, max: null };
  f.runtime.registerNativeProvider(bedrock.provider);
  f.runtime.registerNativeProvider(gemini.provider);
  await f.runtime.refresh({ allowNetwork: false });
  return { ...f, get session() { return f.session; }, display, bedrock, gemini };
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

test("persisted provider saves to pi-auto-model-provider.json without changing selection, mode, or other settings", async () => {
  const f = await fixture();
  try {
    const selected = f.session.model, level = f.session.thinkingLevel;
    await f.session.prompt("/automodel provider gemini");
    expect(JSON.parse(readFileSync(join(f.dir, "pi-auto-model-provider.json"), "utf8"))).toEqual({ version: 1, provider: "gemini" });
    expect(readdirSync(f.dir)).not.toContain("pi-auto-model.json");
    expect(readdirSync(f.dir)).not.toContain("pi-auto-model-state.json");
    const text = await status(f);
    expect(text).toContain("mappings: persisted provider gemini");
    expect(text).toContain("trivial: google-vertex/" + hydrogen + " (medium)");
    expect(text).toContain("moderate: google-vertex/" + hydrogen + " (high)");
    expect(text).toContain("complex: google-vertex/" + neon + " (high)");
    expect(text).toContain("frontier: google-vertex/" + neon + " (xhigh)");
    expect(text).toContain("classifier: google-vertex/" + hydrogen + " (low)");
    expect(f.session.model).toEqual(selected); expect(f.session.thinkingLevel).toBe(level);
    expect(f.faux.state.callCount + f.bedrock.state.callCount + f.gemini.state.callCount).toBe(0);
  } finally { await f.owner.dispose(); f.close(); }
});

test.each([
  ["gpt", "github-copilot", "gpt-6.2-sol", "low"],
  ["bedrock", bedrockProvider, sonnet, "high"],
  ["gemini", geminiProvider, hydrogen, "high"],
] as const)("persisted provider %s routes moderate tasks to %s/%s at %s and shows in status bar", async (name, provider, model, effort) => {
  const f = await fixture();
  try {
    await f.session.prompt("/automodel provider " + name);
    await selectAuto(f);
    if (name === "gpt") f.respond("main");
    else if (name === "bedrock") f.bedrock.setResponses([fauxAssistantMessage("main")]);
    else f.gemini.setResponses([fauxAssistantMessage("main")]);
    await f.session.prompt("/skill:moderate");
    expect(last(f).provider).toBe(provider); expect(last(f).model).toBe(model); expect(last(f).thinkingLevel).toBe(effort);
    expect(f.display.statuses.get("pi-auto-model")).toContain("· " + name + " →");
    expect(f.errors).toEqual([]);
  } finally { await f.owner.dispose(); f.close(); }
});

test("persisted provider preserves classifier bounds and summary tier while routing classification and summaries", async () => {
  const f = await fixture({ configuration: globalPolicy() });
  try {
    await f.session.prompt("/automodel provider bedrock"); await selectAuto(f);
    const requests: { model: string; effort?: string; maxTokens?: number }[] = [];
    f.bedrock.setResponses(["frontier", "main", "summary"].map((reply) => (_context, options, _state, model) => {
      requests.push({ model: model.id, effort: options?.reasoning, maxTokens: options?.maxTokens }); return fauxAssistantMessage(reply);
    }));
    await f.session.prompt("design a new compiler");
    expect(last(f).model).toBe(opus); expect(last(f).thinkingLevel).toBe("xhigh");
    const summary = await new ModelRegistry(f.runtime).streamSimple(f.runtime.getModel("pi-auto-model", "auto")!, {
      messages: [{ role: "user", content: "summary", timestamp: 0 }],
    }).result();
    expect(summary.model).toBe(sonnet);
    expect(requests.map(({ model, effort }) => ({ model, effort }))).toEqual([
      { model: haiku, effort: "low" }, { model: opus, effort: "xhigh" }, { model: sonnet, effort: "high" },
    ]);
    expect(requests[0]!.maxTokens).toBe(48);
    expect(f.faux.state.callCount + f.gemini.state.callCount).toBe(0);
  } finally { await f.owner.dispose(); f.close(); }
});

test("persisted provider survives reload, newSession, and is picked up by separate sessions sharing the agent directory", async () => {
  const first = await fixture();
  let second: Awaited<ReturnType<typeof fixture>> | undefined;
  try {
    await first.session.prompt("/automodel provider gemini");
    await first.session.reload();
    expect(await status(first)).toContain("mappings: persisted provider gemini");
    await first.owner.newSession();
    expect(await status(first)).toContain("mappings: persisted provider gemini");
    await selectAuto(first); first.gemini.setResponses([fauxAssistantMessage("first")]);
    await first.session.prompt("/skill:complex");
    expect(last(first).provider).toBe(geminiProvider); expect(last(first).model).toBe(neon); expect(last(first).thinkingLevel).toBe("high");

    second = await fixture({ policyDirectory: first.dir });
    expect(await status(second)).toContain("mappings: persisted provider gemini");
    await selectAuto(second); second.gemini.setResponses([fauxAssistantMessage("second")]);
    await second.session.prompt("/skill:trivial");
    expect(last(second).provider).toBe(geminiProvider); expect(last(second).model).toBe(hydrogen); expect(last(second).thinkingLevel).toBe("medium");
    expect(first.faux.state.callCount + second.faux.state.callCount).toBe(0);
  } finally { await second?.owner.dispose(); second?.close(); await first.owner.dispose(); first.close(); }
});

test("temp preset overrides persisted provider for the current session and temp clear restores the persisted provider", async () => {
  const f = await fixture();
  try {
    await f.session.prompt("/automodel provider gemini");
    await f.session.prompt("/automodel temp gpt");
    const overridden = await status(f);
    expect(overridden).toContain("mappings: session preset gpt (overrides persisted provider gemini)");
    await selectAuto(f);
    expect(f.display.statuses.get("pi-auto-model")).toContain("temp gpt");
    f.respond("gpt reply"); await f.session.prompt("/skill:trivial");
    expect(last(f).provider).toBe("github-copilot"); expect(last(f).model).toBe("gpt-6-luna"); expect(last(f).thinkingLevel).toBe("high");
    expect(f.gemini.state.callCount).toBe(0);

    await f.session.prompt("/automodel temp clear");
    expect(f.display.notices.at(-1)?.text).toContain("persisted provider gemini");
    expect(await status(f)).toContain("mappings: persisted provider gemini");
    f.gemini.setResponses([fauxAssistantMessage("gemini reply")]); await f.session.prompt("/skill:trivial");
    expect(last(f).provider).toBe(geminiProvider); expect(last(f).model).toBe(hydrogen); expect(last(f).thinkingLevel).toBe("medium");
  } finally { await f.owner.dispose(); f.close(); }
});

test("saving a persisted provider while temp is active persists for new sessions without replacing the active temp preset", async () => {
  const f = await fixture();
  try {
    await f.session.prompt("/automodel temp gemini");
    await f.session.prompt("/automodel provider bedrock");
    expect(JSON.parse(readFileSync(join(f.dir, "pi-auto-model-provider.json"), "utf8"))).toEqual({ version: 1, provider: "bedrock" });
    expect(f.display.notices.at(-1)?.text).toContain("Temporary preset gemini remains active");
    expect(await status(f)).toContain("mappings: session preset gemini (overrides persisted provider bedrock)");
    await selectAuto(f); f.gemini.setResponses([fauxAssistantMessage("still gemini")]);
    await f.session.prompt("/skill:trivial");
    expect(last(f).provider).toBe(geminiProvider);

    await f.session.prompt("/automodel temp clear");
    expect(await status(f)).toContain("mappings: persisted provider bedrock");
    f.bedrock.setResponses([fauxAssistantMessage("now bedrock")]);
    await f.session.prompt("/skill:trivial");
    expect(last(f).provider).toBe(bedrockProvider);
  } finally { await f.owner.dispose(); f.close(); }
});

test("persisted provider overrides saved pi-auto-model.json mappings and provider clear restores them", async () => {
  const custom = globalPolicy(); custom.tiers.trivial.effort = "xhigh";
  const f = await fixture({ setup: (dir) => writeFileSync(join(dir, "pi-auto-model.json"), JSON.stringify(custom)) });
  try {
    await f.session.prompt("/automodel provider gemini");
    await selectAuto(f); f.gemini.setResponses([fauxAssistantMessage("gemini")]);
    await f.session.prompt("/skill:trivial");
    expect(last(f).provider).toBe(geminiProvider); expect(last(f).thinkingLevel).toBe("medium");

    await f.session.prompt("/automodel provider clear");
    expect(JSON.parse(readFileSync(join(f.dir, "pi-auto-model-provider.json"), "utf8"))).toEqual({ version: 1, provider: null });
    expect(await status(f)).toContain("mappings: saved/default");
    await f.session.reload();
    expect(await status(f)).toContain("mappings: saved/default");
    f.respond("custom"); await f.session.prompt("/skill:trivial");
    expect(last(f).provider).toBe("github-copilot"); expect(last(f).thinkingLevel).toBe("xhigh");
  } finally { await f.owner.dispose(); f.close(); }
});

test("a persisted provider can be cleared even after its provider becomes unavailable", async () => {
  const f = await fixture();
  try {
    await f.session.prompt("/automodel provider bedrock");
    f.runtime.registerNativeProvider({ ...f.bedrock.provider, filterModels: () => [] });
    await f.runtime.refresh({ allowNetwork: false });
    await f.session.reload();
    const text = await status(f);
    expect(text).toContain("mappings: persisted provider bedrock"); expect(text).toContain("(high) [unavailable]");
    await f.session.prompt("/automodel provider clear");
    expect(await status(f)).toContain("mappings: saved/default");
    await selectAuto(f); f.respond(); await f.session.prompt("/skill:trivial");
    expect(last(f).provider).toBe("github-copilot"); expect(f.bedrock.state.callCount).toBe(0);
  } finally { await f.owner.dispose(); f.close(); }
});

test.each(["missing", "filtered", "unsupported", "no auth"])("an unavailable persisted provider (%s) leaves files and state unchanged without probing auth", async (reason) => {
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
    await f.session.prompt("/automodel provider bedrock");
    expect(f.display.notices.at(-1)?.text).toContain("Unavailable exact Auto mapping");
    expect(readdirSync(f.dir)).not.toContain("pi-auto-model-provider.json");
    expect(await status(f)).toContain("mappings: saved/default");
    expect(f.faux.state.callCount + f.bedrock.state.callCount).toBe(0); expect(check).not.toHaveBeenCalled();
  } finally { await f.owner.dispose(); f.close(); }
});

test.each(["{", '{"version":2,"provider":"gemini"}', '{"version":1,"provider":"anthropic"}', '{"version":1,"provider":"gemini","extra":true}'])(
  "malformed pi-auto-model-provider.json (%s) reports actionable error and blocks routing without overwriting",
  async (raw) => {
    const f = await fixture({ setup: (dir) => writeFileSync(join(dir, "pi-auto-model-provider.json"), raw) });
    try {
      expect(await status(f)).toContain("pi-auto-model-provider.json");
      await selectAuto(f); f.respond("must not dispatch"); await f.session.prompt("/skill:trivial");
      expect(last(f).stopReason).toBe("error");
      expect(f.faux.state.callCount + f.bedrock.state.callCount + f.gemini.state.callCount).toBe(0);
      expect(readFileSync(join(f.dir, "pi-auto-model-provider.json"), "utf8")).toBe(raw);
    } finally { await f.owner.dispose(); f.close(); }
  },
);

test("clearing persisted provider does not hide malformed global policy", async () => {
  const f = await fixture({ setup: (dir) => writeFileSync(join(dir, "pi-auto-model.json"), "{") });
  try {
    await f.session.prompt("/automodel provider clear");
    expect(await status(f)).toContain("Cannot read Auto settings at " + join(f.dir, "pi-auto-model.json"));
    expect(readdirSync(f.dir)).not.toContain("pi-auto-model-provider.json");
  } finally { await f.owner.dispose(); f.close(); }
});

test("configure still edits pi-auto-model.json without copying or clearing the persisted provider", async () => {
  const f = await fixture();
  try {
    await f.session.prompt("/automodel provider gemini");
    f.display.answers.push("Review and save", true); await f.session.prompt("/automodel configure");
    const saved = JSON.parse(readFileSync(join(f.dir, "pi-auto-model.json"), "utf8"));
    expect(saved.tiers.moderate).toEqual({ provider: "github-copilot", model: "gpt-6.2-sol", effort: "low" });
    expect(f.display.notices.at(-1)?.text).toContain("Persisted provider gemini remains active");
    expect(await status(f)).toContain("mappings: persisted provider gemini");
  } finally { await f.owner.dispose(); f.close(); }
});

test("effort-only mode keeps captured physical model and uses persisted provider tier efforts", async () => {
  const f = await fixture();
  try {
    await f.session.prompt("/automodel provider gemini");
    await f.session.prompt("/automodel mode effort-only");
    await f.session.setModel(f.faux.getModel("gpt-6-luna")!); await selectAuto(f);
    f.respond("effort-only"); await f.session.prompt("/skill:trivial");
    expect(last(f).provider).toBe("github-copilot"); expect(last(f).model).toBe("gpt-6-luna"); expect(last(f).thinkingLevel).toBe("medium");
    expect(JSON.parse(readFileSync(join(f.dir, "pi-auto-model-provider.json"), "utf8"))).toEqual({ version: 1, provider: "gemini" });
    expect(JSON.parse(readFileSync(join(f.dir, "pi-auto-model-state.json"), "utf8"))).toEqual({ version: 2, mode: "effort-only" });
  } finally { await f.owner.dispose(); f.close(); }
});

test("busy provider change waits for safe idle before saving and applying", async () => {
  const f = await fixture(), started = gate(), finish = gate();
  let pending: Promise<void> | undefined;
  try {
    await selectAuto(f);
    f.faux.setResponses([async () => { started.release(); await finish.promise; return fauxAssistantMessage("main"); }]);
    pending = f.session.prompt("/skill:trivial"); await started.promise;
    await f.session.prompt("/automodel provider bedrock");
    expect(readdirSync(f.dir)).not.toContain("pi-auto-model-provider.json");
    expect(f.session.isStreaming).toBe(true);
    finish.release(); await pending;
    await expect.poll(async () => status(f)).toContain("mappings: persisted provider bedrock");
    expect(JSON.parse(readFileSync(join(f.dir, "pi-auto-model-provider.json"), "utf8"))).toEqual({ version: 1, provider: "bedrock" });
    f.bedrock.setResponses([fauxAssistantMessage("next")]); await f.session.prompt("/skill:trivial");
    expect(last(f).provider).toBe(bedrockProvider); expect(last(f).thinkingLevel).toBe("high");
  } finally { finish.release(); await pending?.catch(() => {}); await f.owner.dispose(); f.close(); }
});

test.each(["provider", "provider absent", "provider gemini extra", "provider clear extra"])("invalid command %s gives guidance without changing state", async (args) => {
  const f = await fixture();
  try {
    await f.session.prompt("/automodel " + args);
    expect(f.display.notices.at(-1)?.text).toContain("/automodel provider gpt|bedrock|gemini|clear");
    expect(readdirSync(f.dir)).not.toContain("pi-auto-model-provider.json");
    expect(await status(f)).toContain("mappings: saved/default");
  } finally { await f.owner.dispose(); f.close(); }
});

test("failed provider write preserves active state and cleans up temp files", async () => {
  const f = await fixture();
  try {
    mkdirSync(join(f.dir, "pi-auto-model-provider.json"));
    await f.session.prompt("/automodel provider gemini");
    expect(f.display.notices.at(-1)?.text).toMatch(/Previous settings are unchanged/);
    expect(await status(f)).toContain("mappings: saved/default");
    expect(readdirSync(f.dir).some((name) => name.endsWith(".tmp"))).toBe(false);
  } finally { await f.owner.dispose(); f.close(); }
});

test("switching persisted provider takes effect immediately even within the warm cache window", async () => {
  const f = await fixture();
  try {
    await selectAuto(f);
    f.respond("gpt complex"); await f.session.prompt("/skill:complex");
    expect(last(f).provider).toBe("github-copilot");
    await f.session.prompt("/automodel provider gemini");
    f.gemini.setResponses([fauxAssistantMessage("gemini trivial")]);
    await f.session.prompt("/skill:trivial");
    expect(last(f).provider).toBe(geminiProvider); expect(last(f).model).toBe(hydrogen); expect(last(f).thinkingLevel).toBe("medium");
  } finally { await f.owner.dispose(); f.close(); }
});

test.each(["print", "json"] as const)("persisted provider works in %s mode without UI", async (mode) => {
  const f = await fixture({ mode });
  const writes: string[] = [];
  const spy = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => { writes.push(String(chunk)); return true; });
  try {
    await f.session.prompt("/automodel provider gemini");
    await f.session.prompt("/automodel status");
    expect(writes.join("")).toContain("mappings: persisted provider gemini");
    expect(JSON.parse(readFileSync(join(f.dir, "pi-auto-model-provider.json"), "utf8"))).toEqual({ version: 1, provider: "gemini" });
  } finally { spy.mockRestore(); await f.owner.dispose(); f.close(); }
});
