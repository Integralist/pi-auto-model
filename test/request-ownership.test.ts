import { readFileSync, writeFileSync } from "node:fs";
import { ModelRegistry, type ExtensionFactory } from "@earendil-works/pi-coding-agent";
import { fauxAssistantMessage } from "@earendil-works/pi-ai";
import { expect, test } from "vitest";
import { createFixture, type Fixture } from "./support/session.ts";

async function select(f: Fixture) { await f.session.setModel(f.runtime.getModel("pi-auto-model", "auto")!); }
function last(f: Fixture) { return f.session.messages.filter((message) => message.role === "assistant").at(-1)!; }
function small() { return { name: "small", description: "Small work", tier: "trivial" }; }
function hard() { return { name: "hard", description: "Hard work", tier: "frontier" }; }
function gate() {
  let release!: () => void;
  const wait = new Promise<void>((resolve) => { release = resolve; });
  return { wait, release };
}

function usage(f: Fixture) {
  return f.session.sessionManager.getBranch().filter((entry) => entry.type === "custom" && entry.customType === "pi-auto-model.classifier-usage");
}

test.each(["handled", "transform"])("later input handler %s cannot reuse the original skill candidate", async (action) => {
  const handler: ExtensionFactory = (pi) => {
    pi.on("input", (event) => {
      if (event.text !== "/skill:small") return;
      return action === "handled" ? { action: "handled" } : { action: "transform", text: "different task" };
    });
  };
  const f = await createFixture({ skills: [small()], extensions: [handler] });
  try {
    await select(f); f.respond(); await f.session.prompt("/skill:small");
    if (action === "handled") expect(f.faux.state.callCount).toBe(0);
    else { expect(last(f).model).toBe("gpt-6.1-sol"); expect(f.faux.state.callCount).toBe(1); }
    f.respond(); await f.session.prompt("extension continuation", { source: "extension" });
    expect(last(f).model).toBe("gpt-6.1-sol");
    expect(usage(f)).toEqual([]);
  } finally { f.close(); }
});

test("a skill changed during input handling cannot route using its old declared tier", async () => {
  let file = "";
  const mutate: ExtensionFactory = (pi) => {
    pi.on("input", () => { writeFileSync(file, readFileSync(file, "utf8").replace("trivial", "frontier")); });
  };
  const f = await createFixture({ skills: [small()], extensions: [mutate] });
  file = f.skills[0]!.filePath;
  try {
    await select(f); f.respond(); await f.session.prompt("/skill:small");
    expect(last(f).model).toBe("gpt-6.1-sol"); expect(f.faux.state.callCount).toBe(1);
    expect(usage(f)).toEqual([]);
  } finally { f.close(); }
});

test("an unknown slash skill cannot impersonate a loaded resource", async () => {
  const f = await createFixture({ skills: [small()] });
  try {
    await select(f); f.respond(); await f.session.prompt("/skill:unknown");
    expect(last(f).model).toBe("gpt-6.1-sol"); expect(f.faux.state.callCount).toBe(1);
    expect(usage(f)).toEqual([]);
  } finally { f.close(); }
});

test.each(["steer", "followUp"] as const)("busy %s delivery keeps the active physical pair", async (streamingBehavior) => {
  const f = await createFixture({ skills: [hard()] });
  const started = gate(); const finish = gate();
  try {
    await select(f);
    f.faux.setResponses([async () => { started.release(); await finish.wait; return fauxAssistantMessage("active answer"); }, fauxAssistantMessage("queued answer")]);
    const running = f.session.prompt("/skill:hard");
    await started.wait;
    await f.session.prompt("draft a new PR", { streamingBehavior });
    finish.release(); await running;
    expect(last(f).model).toBe("gpt-6.1-sol"); expect(last(f).thinkingLevel).toBe("xhigh");
    expect(f.faux.state.callCount).toBe(2); expect(usage(f)).toEqual([]);
  } finally { finish.release(); f.close(); }
});

test("an extension-origin idle message keeps the physical route", async () => {
  const f = await createFixture({ skills: [small()] });
  try {
    await select(f); f.respond(); await f.session.prompt("/skill:small");
    f.respond(); await f.session.prompt("debug authentication", { source: "extension" });
    expect(last(f).model).toBe("gpt-6-luna"); expect(last(f).thinkingLevel).toBe("medium");
    expect(f.faux.state.callCount).toBe(2); expect(usage(f)).toEqual([]);
  } finally { f.close(); }
});

test("a custom-triggered run cannot consume a handled input's candidate", async () => {
  const custom: ExtensionFactory = (pi) => {
    pi.on("input", (event) => {
      if (event.text === "/skill:small") {
        pi.sendMessage({ customType: "offline-event", content: "background update", display: false }, { triggerTurn: true });
        return { action: "handled" };
      }
    });
  };
  const f = await createFixture({ skills: [small()], extensions: [custom] });
  try {
    await select(f); f.respond(); await f.session.prompt("/skill:small");
    await f.session.waitForIdle();
    expect(last(f).model).toBe("gpt-6.1-sol"); expect(f.faux.state.callCount).toBe(1);
    expect(usage(f)).toEqual([]);
  } finally { f.close(); }
});

test("a direct call between accepted input and main dispatch does not consume intent", async () => {
  const calls: string[] = [];
  const direct: ExtensionFactory = (pi) => {
    pi.on("before_agent_start", async (_event, ctx) => {
      const model = ctx.modelRegistry.find("pi-auto-model", "auto")!;
      const reply = await ctx.modelRegistry.streamSimple(model, { messages: [{ role: "user", content: "summary", timestamp: Date.now() }] }).result();
      calls.push(reply.model);
    });
  };
  const f = await createFixture({ skills: [small()], extensions: [direct] });
  try {
    await select(f);
    f.faux.setResponses([fauxAssistantMessage("summary"), fauxAssistantMessage("main")]);
    await f.session.prompt("/skill:small");
    expect(calls).toEqual(["gpt-6-luna"]); expect(last(f).model).toBe("gpt-6-luna");
    expect(f.faux.state.callCount).toBe(2); expect(usage(f)).toEqual([]);
  } finally { f.close(); }
});

test("abort while starting cannot leave declared intent for a later extension message", async () => {
  let first = true;
  const cancel: ExtensionFactory = (pi) => {
    pi.on("before_agent_start", (_event, ctx) => { if (first) { first = false; ctx.abort(); } });
  };
  const f = await createFixture({ skills: [small()], extensions: [cancel] });
  try {
    await select(f); f.respond(); await f.session.prompt("/skill:small");
    expect(f.faux.state.callCount).toBe(0);
    f.respond(); await f.session.prompt("later", { source: "extension" });
    expect(last(f).model).toBe("gpt-6.1-sol"); expect(f.faux.state.callCount).toBe(1);
  } finally { f.close(); }
});

test("aborted classification cannot route a later task or attribute usage to it", async () => {
  const f = await createFixture();
  const started = gate(); const finish = gate();
  try {
    await select(f);
    f.faux.setResponses([async () => { started.release(); await finish.wait; return fauxAssistantMessage("trivial"); }]);
    const pending = f.session.prompt("new task");
    await started.wait; await f.session.abort(); await pending;
    f.respond(); await f.session.prompt("later task", { source: "extension" });
    const later = structuredClone(f.session.sessionManager.getBranch());
    finish.release(); await Promise.resolve(); await Promise.resolve();
    expect(last(f).model).toBe("gpt-6.1-sol"); expect(last(f).thinkingLevel).toBe("xhigh");
    const laterUser = later.findLast((entry) => entry.type === "message" && entry.message.role === "user")!;
    expect(JSON.stringify(usage(f))).not.toContain(laterUser.id);
    expect(f.session.messages.filter((message) => message.role === "assistant" && message.stopReason === "stop")).toHaveLength(1);
  } finally { finish.release(); f.close(); }
});

test.each(["reload", "new", "shutdown"])("%s invalidates pending intent and restores a clean runtime boundary", async (kind) => {
  const f = await createFixture({ skills: [small()] });
  try {
    await select(f); f.respond(); await f.session.prompt("/skill:small");
    if (kind === "reload") {
      await f.session.reload();
      expect(f.session.model?.id).toBe("auto");
      f.respond(); await f.session.prompt("yes");
      expect(last(f).model).toBe("gpt-6-luna");
    } else if (kind === "new") {
      await f.owner.newSession();
      expect(f.session.model?.provider).toBe("github-copilot");
      expect(f.session.model?.id).toBe("gpt-6.1-sol");
      await select(f); f.respond(); await f.session.prompt("background", { source: "extension" });
      expect(last(f).model).toBe("gpt-6.1-sol"); expect(usage(f)).toEqual([]);
    } else {
      await f.owner.dispose();
      expect(usage(f)).toEqual([]);
    }
    expect(f.errors).toEqual([]);
  } finally { f.close(); }
});

test("tree navigation and fork retain only the selected branch's physical evidence", async () => {
  const f = await createFixture({ skills: [small(), hard()] });
  try {
    await select(f); f.respond(); await f.session.prompt("/skill:small");
    const smallAnswer = f.session.sessionManager.getBranch().findLast((entry) => entry.type === "message" && entry.message.role === "assistant")!;
    f.respond(); await f.session.prompt("/skill:hard");
    expect(last(f).model).toBe("gpt-6.1-sol");
    await f.session.navigateTree(smallAnswer.id, { summarize: false });
    f.respond(); await f.session.prompt("yes");
    expect(last(f).model).toBe("gpt-6-luna"); expect(last(f).thinkingLevel).toBe("medium");
    await f.owner.fork(smallAnswer.id, { position: "at" });
    expect(f.session.model?.id).toBe("auto");
    f.respond(); await f.session.prompt("yes");
    expect(last(f).model).toBe("gpt-6-luna"); expect(f.errors).toEqual([]);
  } finally { f.close(); }
});

test("session replacement during classification cannot commit into the new session", async () => {
  const f = await createFixture(); const started = gate(); const finish = gate();
  try {
    await select(f);
    f.faux.setResponses([async () => { started.release(); await finish.wait; return fauxAssistantMessage("trivial"); }]);
    const pending = f.session.prompt("new task");
    await started.wait; await f.owner.newSession(); await pending;
    expect(f.session.model?.provider).toBe("github-copilot");
    expect(f.session.model?.id).toBe("gpt-6.1-sol");
    await select(f); f.respond(); await f.session.prompt("background", { source: "extension" });
    const before = structuredClone(f.session.sessionManager.getEntries());
    finish.release(); await Promise.resolve(); await Promise.resolve();
    expect(f.session.sessionManager.getEntries()).toEqual(before);
    expect(last(f).model).toBe("gpt-6.1-sol"); expect(usage(f)).toEqual([]);
  } finally { finish.release(); f.close(); }
});

test("shutdown during classification discards late route and usage writes", async () => {
  const f = await createFixture();
  const started = gate(); const finish = gate();
  try {
    await select(f);
    f.faux.setResponses([async () => { started.release(); await finish.wait; return fauxAssistantMessage("trivial"); }]);
    const pending = f.session.prompt("new task");
    await started.wait; await f.owner.dispose(); await pending;
    const before = structuredClone(f.session.sessionManager.getEntries());
    finish.release(); await Promise.resolve(); await Promise.resolve();
    expect(f.session.sessionManager.getEntries()).toEqual(before);
    expect(f.faux.state.callCount).toBe(1);
  } finally { finish.release(); f.close(); }
});
