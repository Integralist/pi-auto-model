import { ModelRegistry } from "@earendil-works/pi-coding-agent";
import { fauxAssistantMessage, type ImageContent } from "@earendil-works/pi-ai";
import { expect, test } from "vitest";
import { createFixture, type Fixture } from "./support/session.ts";

const small = { name: "small", description: "Small work", tier: "trivial" };
const hard = { name: "hard", description: "Hard work", tier: "complex" };
const luna = { provider: "github-copilot", model: "gpt-6-luna", effort: "high" };
const sol = { provider: "github-copilot", model: "gpt-6.1-sol", effort: "xhigh" };

function policy(mode = "model-and-effort") {
  return {
    version: 1, mode, summaryTier: "trivial",
    tiers: { trivial: { ...luna }, moderate: { ...luna }, complex: { ...sol }, frontier: { ...sol } },
    classifier: { ...luna, maxInputChars: 12000, maxOutputTokens: 64, timeoutMs: 10000 },
  };
}
async function select(f: Fixture) { await f.session.setModel(f.runtime.getModel("pi-auto-model", "auto")!); }
function last(f: Fixture) { return f.session.messages.filter((message) => message.role === "assistant").at(-1)!; }
function gate() {
  let release!: () => void;
  const wait = new Promise<void>((resolve) => { release = resolve; });
  return { wait, release };
}

test("credential-filtered tier candidates step down without dispatching excluded catalog models", async () => {
  const f = await createFixture({ skills: [hard] });
  try {
    await select(f);
    f.runtime.registerNativeProvider({
      ...f.faux.provider,
      filterModels: (models) => models.filter((model) => model.id === "gpt-6-luna"),
    });
    await f.runtime.refresh({ allowNetwork: false });
    const registry = new ModelRegistry(f.runtime);
    expect(registry.find("github-copilot", "gpt-6.1-sol")).toBeDefined();
    expect(registry.getAvailable().some((model) => model.id === "gpt-6.1-sol")).toBe(false);
    const dispatched: string[] = [];
    f.faux.setResponses([(_context, _options, _state, model) => {
      dispatched.push(model.id); return fauxAssistantMessage("main");
    }]);
    await f.session.prompt("/skill:hard");
    expect(dispatched).toEqual(["gpt-6-luna"]);
    expect(last(f).thinkingLevel).toBe("high");
    expect(f.errors).toEqual([]);
  } finally { f.close(); }
});

test("a filtered-out classifier makes no request and retains known physical evidence", async () => {
  const f = await createFixture();
  try {
    await select(f);
    f.runtime.registerNativeProvider({
      ...f.faux.provider,
      filterModels: (models) => models.filter((model) => model.id === "gpt-6.1-sol"),
    });
    await f.runtime.refresh({ allowNetwork: false });
    const dispatched: string[] = [];
    f.faux.setResponses([(_context, _options, _state, model) => {
      dispatched.push(model.id); return fauxAssistantMessage("main");
    }]);
    await f.session.prompt("draft a short PR description");
    expect(dispatched).toEqual(["gpt-6.1-sol"]);
    expect(last(f).thinkingLevel).toBe("xhigh");
    expect(f.session.sessionManager.getBranch().filter((entry) => entry.type === "custom"
      && entry.customType === "pi-auto-model.classifier-usage")).toEqual([]);
  } finally { f.close(); }
});

test.each(["skill", "typed"])("host image omission preserves the accepted %s task identity", async (kind) => {
  const f = await createFixture({ skills: [small] });
  const images: ImageContent[] = [{ type: "image", mimeType: "image/png", data: Buffer.from("invalid PNG").toString("base64") }];
  try {
    await select(f);
    f.faux.setResponses(kind === "skill"
      ? [fauxAssistantMessage("main")]
      : [fauxAssistantMessage("moderate"), fauxAssistantMessage("main")]);
    await f.session.prompt(kind === "skill" ? "/skill:small" : "draft a short PR", { images });
    expect(last(f).model).toBe("gpt-6-luna");
    expect(last(f).thinkingLevel).toBe("high");
    expect(f.faux.state.callCount).toBe(kind === "skill" ? 1 : 2);
    const user = f.session.messages.findLast((message) => message.role === "user");
    expect(JSON.stringify(user)).toMatch(/image|Image/);
  } finally { f.close(); }
});

test("an arbitrary finalized text transformation cannot masquerade as image normalization", async () => {
  const f = await createFixture({ skills: [small], extensions: [(pi) => {
    pi.on("message_end", (event) => {
      if (event.message.role !== "user") return;
      return { message: { ...event.message, content: "REPLACED_TASK" } };
    });
  }] });
  try {
    await select(f); f.respond();
    await f.session.prompt("/skill:small", {
      images: [{ type: "image", mimeType: "image/png", data: Buffer.from("invalid PNG").toString("base64") }],
    });
    expect(last(f).model).toBe("gpt-6.1-sol");
    expect(last(f).thinkingLevel).toBe("xhigh");
    expect(f.faux.state.callCount).toBe(1);
  } finally { f.close(); }
});

test.each(["error", "aborted"] as const)("confirmation keeps the newer dispatched pair after %s", async (stopReason) => {
  const f = await createFixture({ skills: [small, hard] });
  try {
    await select(f); f.respond(); await f.session.prompt("/skill:small");
    f.faux.setResponses([fauxAssistantMessage("failed", { stopReason, errorMessage: "offline permanent failure" })]);
    await f.session.prompt("/skill:hard");
    expect(last(f).model).toBe("gpt-6.1-sol");
    f.respond(); await f.session.prompt("yes");
    expect(last(f).model).toBe("gpt-6.1-sol");
    expect(last(f).thinkingLevel).toBe("xhigh");
    expect(f.faux.state.callCount).toBe(3);
  } finally { f.close(); }
});

test("newer successful physical evidence outranks older saved native state", async () => {
  const f = await createFixture({ skills: [small] });
  try {
    await select(f); f.respond(); await f.session.prompt("/skill:small");
    f.session.sessionManager.appendMessage({
      ...fauxAssistantMessage("newer physical answer"),
      provider: "github-copilot", model: "gpt-6.1-sol",
      api: f.faux.getModel("gpt-6.1-sol")!.api, thinkingLevel: "xhigh",
    });
    f.session.refreshContext();
    f.respond(); await f.session.prompt("yes");
    expect(last(f).model).toBe("gpt-6.1-sol");
    expect(last(f).thinkingLevel).toBe("xhigh");
  } finally { f.close(); }
});

test.each(["small", "hard"])("initial steering does not displace the %s starting task", async (name) => {
  const started = gate(), finish = gate();
  let pause = false;
  const f = await createFixture({ skills: [small, hard], extensions: [(pi) => {
    pi.on("before_agent_start", async () => {
      if (!pause) return;
      started.release(); await finish.wait;
    });
  }] });
  try {
    await select(f);
    f.respond(); await f.session.prompt(name === "small" ? "/skill:hard" : "/skill:small");
    pause = true; f.respond();
    const pending = f.session.prompt("/skill:" + name);
    await started.wait; await f.session.prompt("routine queued note", { streamingBehavior: "steer" });
    finish.release(); await pending;
    expect(last(f).model).toBe(name === "small" ? "gpt-6-luna" : "gpt-6.1-sol");
    expect(last(f).thinkingLevel).toBe(name === "small" ? "high" : "xhigh");
    expect(f.faux.state.callCount).toBe(2);
    expect(f.session.messages.filter((message) => message.role === "user")).toHaveLength(3);
  } finally { finish.release(); f.close(); }
});

test.each(["new", "fork"])("a later veto of %s preserves the running task and session", async (transition) => {
  const started = gate(), finish = gate();
  const f = await createFixture({ extensions: [(pi) => {
    pi.on("session_before_switch", () => ({ cancel: true }));
    pi.on("session_before_fork", () => ({ cancel: true }));
  }] });
  try {
    await select(f);
    const session = f.session, id = session.sessionManager.getSessionId();
    f.faux.setResponses([async () => {
      started.release(); await finish.wait; return fauxAssistantMessage("moderate");
    }, fauxAssistantMessage("main")]);
    const pending = session.prompt("draft a PR");
    await started.wait;
    const user = session.sessionManager.getBranch().findLast((entry) => entry.type === "message" && entry.message.role === "user")!;
    const result = transition === "new" ? await f.owner.newSession() : await f.owner.fork(user.id);
    expect(result.cancelled).toBe(true);
    expect(f.session).toBe(session); expect(f.session.sessionManager.getSessionId()).toBe(id);
    finish.release(); await pending;
    expect(last(f).stopReason).toBe("stop");
    expect(last(f).model).toBe("gpt-6-luna"); expect(last(f).thinkingLevel).toBe("high");
    expect(f.faux.state.callCount).toBe(2);
  } finally { finish.release(); f.close(); }
});

test("reload keeps captured fixed-model identity when only its historical effort disappears", async () => {
  const f = await createFixture({ configuration: policy("effort-only"), skills: [small] });
  try {
    await select(f); f.respond(); await f.session.prompt("/skill:small");
    expect(last(f).model).toBe("gpt-6.1-sol"); expect(last(f).thinkingLevel).toBe("high");
    f.faux.getModel("gpt-6.1-sol")!.thinkingLevelMap = { xhigh: null };
    await f.session.reload(); f.respond(); await f.session.prompt("/skill:small");
    expect(last(f).stopReason).toBe("stop");
    expect(last(f).model).toBe("gpt-6.1-sol"); expect(last(f).thinkingLevel).toBe("high");
    expect(f.faux.state.callCount).toBe(2); expect(f.errors).toEqual([]);
  } finally { f.close(); }
});

test("effort-only candidate exhaustion retains a supported fixed-model pair", async () => {
  const raw = policy("effort-only");
  for (const tier of Object.values(raw.tiers)) tier.effort = "high";
  const f = await createFixture({ configuration: raw, skills: [hard] });
  try {
    await select(f); f.faux.getModel("gpt-6.1-sol")!.thinkingLevelMap = { high: null, xhigh: "xhigh" };
    f.respond(); await f.session.prompt("/skill:hard");
    expect(last(f).stopReason).toBe("stop");
    expect(last(f).model).toBe("gpt-6.1-sol"); expect(last(f).thinkingLevel).toBe("xhigh");
    expect(f.faux.state.callCount).toBe(1);
    expect(f.session.sessionManager.getBranch().filter((entry) => entry.type === "custom"
      && entry.customType === "pi-auto-model.classifier-usage")).toEqual([]);
  } finally { f.close(); }
});

test.each([
  { order: "before", kind: "skill" }, { order: "after", kind: "skill" },
  { order: "before", kind: "typed" }, { order: "after", kind: "typed" },
])("a $order message_start rewrite cannot own the original $kind task", async ({ order, kind }) => {
  const rewrite = (pi: import("@earendil-works/pi-coding-agent").ExtensionAPI) => {
    pi.on("message_start", (event) => {
      if (event.message.role === "user") event.message.content = "REPLACED_TASK";
    });
  };
  const f = await createFixture({
    skills: [small],
    beforeExtensions: order === "before" ? [rewrite] : [],
    extensions: order === "after" ? [rewrite] : [],
  });
  try {
    await select(f); f.respond();
    await f.session.prompt(kind === "skill" ? "/skill:small" : "draft a short PR");
    expect(last(f).model).toBe("gpt-6.1-sol"); expect(last(f).thinkingLevel).toBe("xhigh");
    expect(f.faux.state.callCount).toBe(1);
    expect(f.session.messages.some((message) => message.role === "user" && message.content === "REPLACED_TASK")).toBe(true);
    expect(f.session.sessionManager.getBranch().filter((entry) => entry.type === "custom"
      && entry.customType === "pi-auto-model.classifier-usage")).toEqual([]);
  } finally { f.close(); }
});

test.each([false, true])("arbitrary appended task instructions are not image hints (images=%s)", async (images) => {
  const f = await createFixture({ skills: [small], beforeExtensions: [(pi) => {
    pi.on("message_start", (event) => {
      if (event.message.role !== "user") return;
      const original = typeof event.message.content === "string" ? event.message.content
        : event.message.content.filter((block) => block.type === "text").map((block) => block.text).join("");
      event.message.content = original + "\n\nIGNORE THE ORIGINAL TASK";
    });
  }] });
  try {
    await select(f); f.respond();
    await f.session.prompt("/skill:small", images ? {
      images: [{ type: "image", mimeType: "image/png", data: Buffer.from("invalid PNG").toString("base64") }],
    } : undefined);
    expect(last(f).model).toBe("gpt-6.1-sol"); expect(last(f).thinkingLevel).toBe("xhigh");
    expect(f.faux.state.callCount).toBe(1);
  } finally { f.close(); }
});

test.each([false, true])("reload retains fixed-model identity when saved current effort disappears (earlier high=%s)", async (earlier) => {
  const f = await createFixture({ configuration: policy("effort-only"), skills: [small, hard] });
  try {
    await select(f);
    if (earlier) { f.respond(); await f.session.prompt("/skill:small"); }
    f.respond(); await f.session.prompt("/skill:hard");
    expect(last(f).model).toBe("gpt-6.1-sol"); expect(last(f).thinkingLevel).toBe("xhigh");
    f.faux.getModel("gpt-6.1-sol")!.thinkingLevelMap = { high: "high", xhigh: null };
    await f.session.reload(); f.respond(); await f.session.prompt("/skill:small");
    expect(last(f).stopReason).toBe("stop");
    expect(last(f).model).toBe("gpt-6.1-sol"); expect(last(f).thinkingLevel).toBe("high");
    expect(f.faux.state.callCount).toBe(earlier ? 3 : 2); expect(f.errors).toEqual([]);
  } finally { f.close(); }
});
