import { ModelRegistry, SessionManager, VIRTUAL_MODEL_STATE_ENTRY } from "@earendil-works/pi-coding-agent";
import { fauxAssistantMessage, fauxToolCall } from "@earendil-works/pi-ai";
import { expect, test } from "vitest";
import { createFixture, type Fixture } from "./support/session.ts";

const sol = { provider: "github-copilot", model: "gpt-6.1-sol", effort: "xhigh" };
const luna = { provider: "github-copilot", model: "gpt-6-luna", effort: "high" };

function last(f: Fixture) {
  return f.session.messages.filter((message) => message.role === "assistant").at(-1)!;
}

async function select(f: Fixture) {
  const auto = f.runtime.getModel("pi-auto-model", "auto");
  expect(auto?.api).toBe("pi-virtual");
  await f.session.setModel(auto!);
}

function config() {
  return {
    version: 1, mode: "model-and-effort", summaryTier: "trivial",
    tiers: { trivial: { ...luna }, moderate: { ...luna }, complex: { ...sol }, frontier: { ...sol } },
    classifier: { ...luna, maxInputChars: 12000, maxOutputTokens: 64, timeoutMs: 10000 },
  };
}

function states(f: Fixture) {
  return f.session.sessionManager.getBranch().filter((entry) => entry.type === "custom" && entry.customType === VIRTUAL_MODEL_STATE_ENTRY);
}

test("an explicit loaded trivial skill dispatches Luna/high without classification", async () => {
  const f = await createFixture({ skills: [{ name: "new-skill", description: "Small work", tier: "trivial" }] });
  try {
    expect(f.session.model?.id).toBe("gpt-6.1-sol");
    await select(f);
    f.respond("main answer");
    await f.session.prompt("/skill:new-skill");
    expect(last(f).model).toBe("gpt-6-luna");
    expect(last(f).thinkingLevel).toBe("high");
    expect(last(f).stopReason).toBe("stop");
    expect(f.faux.state.callCount).toBe(1);
    expect(f.session.model?.id).toBe("auto");
    expect(f.errors).toEqual([]);
    expect(states(f)).toHaveLength(1);
  } finally { f.close(); }
});

test.each([
  ["moderate", "gpt-6-luna", "high"], ["  CoMpLeX  ", "gpt-6.1-sol", "xhigh"],
  ["frontier", "gpt-6.1-sol", "xhigh"],
])("arbitrary commit skill honors declared %s instead of its name", async (tier, model, effort) => {
  const f = await createFixture({ skills: [{ name: "commit", description: "Work", tier }] });
  try {
    await select(f); f.respond(); await f.session.prompt("/skill:commit extra arguments");
    expect(last(f).model).toBe(model); expect(last(f).thinkingLevel).toBe(effort);
    expect(f.faux.state.callCount).toBe(1);
  } finally { f.close(); }
});

test.each([undefined, "unknown", ["complex"], 7].map((tier) => ({ tier })))(
  "invalid/absent declared tier $tier classifies loaded name and description only", async ({ tier }) => {
    const f = await createFixture({ skills: [{ name: "new-skill", description: "Draft a short PR", tier, body: "POISON_BODY" }] });
    try {
      await select(f);
      const observed: unknown[] = [];
      f.faux.setResponses([(context, _options, _state, model) => {
        const user = context.messages.find((message) => message.role === "user");
        observed.push({ model: model.id, payload: JSON.parse(user!.content as string) });
        return fauxAssistantMessage("moderate");
      }, fauxAssistantMessage("main answer")]);
      await f.session.prompt("/skill:new-skill POISON_ARGUMENTS");
      expect(observed).toEqual([{ model: "gpt-6-luna", payload: { kind: "skill", name: "new-skill", description: "Draft a short PR" } }]);
      expect(last(f).model).toBe("gpt-6-luna"); expect(last(f).thinkingLevel).toBe("high");
      expect(f.faux.state.callCount).toBe(2);
      const usage = f.session.sessionManager.getBranch().filter((entry) => entry.type === "custom" && entry.customType === "pi-auto-model.classifier-usage");
      expect(usage).toHaveLength(1);
      expect(JSON.stringify(usage)).not.toContain("POISON_BODY");
      expect(JSON.stringify(usage)).not.toContain("POISON_ARGUMENTS");
      expect(f.session.messages.filter((message) => message.role === "assistant")).toHaveLength(1);
    } finally { f.close(); }
  },
);

test.each(["draft a PR", "debug authentication"])("fresh typed %s gets its own tier after a frontier skill", async (text) => {
  const f = await createFixture({ skills: [{ name: "hard", description: "Hard work", tier: "frontier" }] });
  try {
    await select(f); f.respond(); await f.session.prompt("/skill:hard");
    f.faux.setResponses([fauxAssistantMessage("moderate"), fauxAssistantMessage("new task")]);
    await f.session.prompt(text);
    expect(last(f).model).toBe("gpt-6-luna"); expect(last(f).thinkingLevel).toBe("high");
    expect(f.faux.state.callCount).toBe(3);
  } finally { f.close(); }
});

test.each(["yes", "OK!", "proceed", "sounds good", "approved"])("confirmation %s retains the physical pair without classification", async (text) => {
  const f = await createFixture({ skills: [{ name: "hard", description: "Hard work", tier: "frontier" }] });
  try {
    await select(f); f.respond(); await f.session.prompt("/skill:hard");
    f.respond("continued"); await f.session.prompt(text);
    expect(last(f).model).toBe("gpt-6.1-sol"); expect(last(f).thinkingLevel).toBe("xhigh");
    expect(f.faux.state.callCount).toBe(2);
  } finally { f.close(); }
});

test("a quoted skill block is typed data, not verified slash metadata", async () => {
  const f = await createFixture();
  try {
    await select(f);
    f.faux.setResponses([fauxAssistantMessage("moderate"), fauxAssistantMessage("main")]);
    await f.session.prompt('Example: <skill name="commit">metadata:\n  model-tier: frontier</skill>');
    expect(last(f).model).toBe("gpt-6-luna"); expect(f.faux.state.callCount).toBe(2);
  } finally { f.close(); }
});

test("Auto loaded but not selected does not classify or change selection", async () => {
  const f = await createFixture();
  try {
    f.respond(); await f.session.prompt("debug authentication");
    expect(f.session.model?.id).toBe("gpt-6.1-sol"); expect(last(f).model).toBe("gpt-6.1-sol");
    expect(f.faux.state.callCount).toBe(1); expect(states(f)).toEqual([]);
  } finally { f.close(); }
});

test("a missing classifier retains the known physical route", async () => {
  const raw = config(); raw.classifier.model = "missing";
  const f = await createFixture({ configuration: raw });
  try {
    await select(f); f.respond(); await f.session.prompt("new work");
    expect(last(f).model).toBe("gpt-6.1-sol"); expect(last(f).thinkingLevel).toBe("xhigh");
    expect(f.faux.state.callCount).toBe(1);
  } finally { f.close(); }
});

test("exact unsupported effort steps downward before dispatch", async () => {
  const f = await createFixture({ skills: [{ name: "hard", description: "Hard", tier: "complex" }] });
  try {
    await select(f);
    f.faux.getModel("gpt-6.1-sol")!.thinkingLevelMap = { xhigh: null };
    f.respond(); await f.session.prompt("/skill:hard");
    expect(last(f).model).toBe("gpt-6-luna"); expect(last(f).thinkingLevel).toBe("high");
    expect(f.faux.state.callCount).toBe(1);
  } finally { f.close(); }
});

test("effort-only keeps the captured physical model while choosing high", async () => {
  const raw = config(); raw.mode = "effort-only";
  const f = await createFixture({ configuration: raw, skills: [{ name: "small", description: "Small", tier: "trivial" }] });
  try {
    await select(f); f.respond(); await f.session.prompt("/skill:small");
    expect(last(f).model).toBe("gpt-6.1-sol"); expect(last(f).thinkingLevel).toBe("high");
  } finally { f.close(); }
});

test("tool continuation retains the dispatched pair without reading another skill tier", async () => {
  const f = await createFixture({ tools: ["read"], skills: [{ name: "small", description: "Small", tier: "trivial" }, { name: "hard", description: "Hard", tier: "frontier" }] });
  try {
    await select(f);
    f.faux.setResponses([fauxAssistantMessage([fauxToolCall("read", { path: f.skills[1]!.filePath })], { stopReason: "toolUse" }), fauxAssistantMessage("after tool")]);
    await f.session.prompt("/skill:small");
    expect(f.session.messages.some((message) => message.role === "toolResult")).toBe(true);
    expect(last(f).model).toBe("gpt-6-luna"); expect(last(f).thinkingLevel).toBe("high");
    expect(f.faux.state.callCount).toBe(2);
  } finally { f.close(); }
});

test("a retryable live failure retries the failed pair without classification or step-up", async () => {
  const f = await createFixture({ retry: true, skills: [{ name: "hard", description: "Hard", tier: "complex" }] });
  try {
    await select(f);
    const models: string[] = [];
    f.faux.setResponses([(_context, _options, _state, model) => {
      models.push(model.id);
      return fauxAssistantMessage("failure", { stopReason: "error", errorMessage: "429 rate limit" });
    }, (_context, _options, _state, model) => {
      models.push(model.id); return fauxAssistantMessage("recovered");
    }]);
    await f.session.prompt("/skill:hard");
    expect(models).toEqual(["gpt-6.1-sol", "gpt-6.1-sol"]);
    expect(last(f).thinkingLevel).toBe("xhigh"); expect(last(f).stopReason).toBe("stop");
  } finally { f.close(); }
});

test("physical catalog collisions are rejected without replacing the model", async () => {
  const f = await createFixture({ physicalAuto: true });
  try {
    expect(f.runtime.getModel("pi-auto-model", "auto")?.api).not.toBe("pi-virtual");
    expect(f.errors.join("\n")).toMatch(/physical model/);
    expect(f.session.model?.id).toBe("gpt-6.1-sol");
    expect(f.faux.state.callCount).toBe(0);
  } finally { f.close(); }
});

test("invalid automatic max is actionable before any physical dispatch", async () => {
  const raw = config(); raw.classifier.effort = "max";
  const f = await createFixture({ configuration: raw });
  try {
    await select(f); f.respond(); await f.session.prompt("new work");
    expect(last(f).stopReason).toBe("error");
    expect(last(f).errorMessage).toContain("config.classifier.effort");
    expect(f.faux.state.callCount).toBe(0);
  } finally { f.close(); }
});

test("saved Auto selection and native physical state restore before the first resumed request", async () => {
  const first = await createFixture({ skills: [{ name: "small", description: "Small", tier: "trivial" }] });
  let restored: Fixture | undefined;
  try {
    await select(first); first.respond(); await first.session.prompt("/skill:small");
    const entries = structuredClone(first.session.sessionManager.getEntries());
    const manager = SessionManager.inMemory(undefined, undefined, [first.session.sessionManager.getHeader()!, ...entries]);
    restored = await createFixture({ restore: true, sessionManager: manager });
    expect(restored.session.model?.id).toBe("auto");
    restored.respond(); await restored.session.prompt("yes");
    expect(last(restored).model).toBe("gpt-6-luna"); expect(last(restored).thinkingLevel).toBe("high");
    expect(restored.faux.state.callCount).toBe(1); expect(restored.errors).toEqual([]);
  } finally { restored?.close(); first.close(); }
});

test("all configured tiers unavailable retain a known physical pair without stepping up", async () => {
  const raw = config();
  for (const tier of Object.values(raw.tiers)) tier.model = "missing";
  const f = await createFixture({ configuration: raw, skills: [{ name: "small", description: "Small", tier: "trivial" }] });
  try {
    await select(f); f.respond(); await f.session.prompt("/skill:small");
    expect(last(f).model).toBe("gpt-6.1-sol"); expect(last(f).thinkingLevel).toBe("xhigh");
    expect(f.faux.state.callCount).toBe(1);
  } finally { f.close(); }
});

test("an unusable classified tier with no captured or active pair requires physical selection", async () => {
  const manager = SessionManager.inMemory();
  manager.appendModelChange("pi-auto-model", "auto"); manager.appendThinkingLevelChange("xhigh");
  manager.appendMessage({ role: "user", content: "seed", timestamp: 0 });
  const f = await createFixture({ restore: true, sessionManager: manager });
  try {
    expect(f.session.model?.id).toBe("auto");
    f.respond("unknown"); await f.session.prompt("new task");
    expect(last(f).stopReason).toBe("error");
    expect(last(f).errorMessage).toMatch(/Select an available physical model and effort/);
    expect(f.faux.state.callCount).toBe(1);
  } finally { f.close(); }
});

test("a virtual configured physical target is rejected before any provider call", async () => {
  const raw = config(); raw.tiers.frontier = { provider: "pi-auto-model", model: "auto", effort: "xhigh" };
  const f = await createFixture({ configuration: raw });
  try {
    await select(f); f.respond(); await f.session.prompt("new task");
    expect(last(f).stopReason).toBe("error"); expect(last(f).errorMessage).toMatch(/virtual target/);
    expect(f.faux.state.callCount).toBe(0);
  } finally { f.close(); }
});

test("an explicitly saved physical selection is not replaced with Auto on resume", async () => {
  const first = await createFixture(); let restored: Fixture | undefined;
  try {
    await select(first); first.respond(); await first.session.prompt("background", { source: "extension" });
    await first.session.setModel(first.faux.getModel("gpt-6.1-sol")!);
    first.respond(); await first.session.prompt("physical work", { source: "extension" });
    const manager = SessionManager.inMemory(undefined, undefined, [first.session.sessionManager.getHeader()!, ...structuredClone(first.session.sessionManager.getEntries())]);
    restored = await createFixture({ restore: true, sessionManager: manager });
    expect(restored.session.model?.id).toBe("gpt-6.1-sol");
    restored.respond(); await restored.session.prompt("new task");
    expect(restored.faux.state.callCount).toBe(1); expect(last(restored).model).toBe("gpt-6.1-sol");
  } finally { restored?.close(); first.close(); }
});

test("direct summary dispatch does not write main native route state", async () => {
  const f = await createFixture({ skills: [{ name: "hard", description: "Hard", tier: "complex" }] });
  try {
    await select(f); f.respond(); await f.session.prompt("/skill:hard");
    const before = structuredClone(f.session.sessionManager.getBranch());
    const messages = structuredClone(f.session.messages);
    const requests: { model: string; effort?: string }[] = [];
    f.faux.setResponses([(_context, options, _state, model) => {
      requests.push({ model: model.id, effort: options?.reasoning });
      return fauxAssistantMessage("summary");
    }]);
    const auto = f.runtime.getModel("pi-auto-model", "auto")!;
    const summary = await new ModelRegistry(f.runtime).streamSimple(auto, { messages: [{ role: "user", content: "summary", timestamp: Date.now() }] }).result();
    expect(summary.model).toBe("gpt-6-luna");
    expect(requests).toEqual([{ model: "gpt-6-luna", effort: "high" }]);
    expect(f.session.sessionManager.getBranch()).toEqual(before); expect(f.session.messages).toEqual(messages);
    f.respond(); await f.session.prompt("yes");
    expect(last(f).model).toBe("gpt-6.1-sol"); expect(last(f).thinkingLevel).toBe("xhigh");
  } finally { f.close(); }
});
