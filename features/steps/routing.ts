import assert from "node:assert/strict";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { After, Before, Given, Then, When } from "@cucumber/cucumber";
import { ModelRegistry, SessionManager, type ExtensionFactory } from "@earendil-works/pi-coding-agent";
import {
  fauxAssistantMessage,
  fauxToolCall,
  type AssistantMessage,
  type FauxResponseFactory,
  type SimpleStreamOptions,
  type TranscriptContext,
} from "@earendil-works/pi-ai";
import { resolveTaskRoute, type PhysicalPair } from "../../src/policy.ts";
import { createFixture, type Fixture } from "../../test/support/session.ts";

const sol: PhysicalPair = { provider: "github-copilot", model: "gpt-6.1-sol", effort: "xhigh" };
const luna: PhysicalPair = { provider: "github-copilot", model: "gpt-6-luna", effort: "high" };

function mapping(pair: PhysicalPair) {
  return { provider: pair.provider, model: pair.model, effort: String(pair.effort) };
}

function policy() {
  return {
    version: 1, mode: "model-and-effort", summaryTier: "trivial",
    tiers: { trivial: mapping(luna), moderate: mapping(luna), complex: mapping(sol), frontier: mapping(sol) },
    classifier: { ...mapping(luna), maxInputChars: 12000, maxOutputTokens: 64, timeoutMs: 10000 },
  };
}

type Observation = {
  kind: "classifier" | "main" | "direct";
  provider: string;
  model: string;
  api: string;
  context: TranscriptContext;
  options?: SimpleStreamOptions;
};
type Snapshot = ReturnType<typeof snapshot>;
type State = {
  configuration: ReturnType<typeof policy>;
  name: string;
  metadata?: unknown;
  classifier: string;
  outcome?: string;
  observations: Observation[];
  lastTyped?: string;
  fixedHighOnly?: boolean;
  noEvidence?: boolean;
  intercept?: string;
  mainCount: number;
  standalone?: Snapshot;
  beforeDirect?: Snapshot;
  directReply?: AssistantMessage;
  standaloneUsage: unknown[];
  release?: () => void;
};
type World = { fixture?: Fixture; routing?: State };

function data(world: World): State {
  assert.ok(world.routing, "slice1 scenario initialized");
  return world.routing;
}

function snapshot(f: Fixture) {
  return structuredClone({
    model: f.session.model?.id, effort: f.session.thinkingLevel,
    branch: f.session.sessionManager.getBranch(), messages: f.session.messages,
  });
}

function last(f: Fixture) {
  const response = f.session.messages.filter((message) => message.role === "assistant").at(-1);
  assert.ok(response, "native assistant response reached");
  return response;
}

function main(s: State) { return s.observations.filter((request) => request.kind === "main"); }
function classifiers(s: State) { return s.observations.filter((request) => request.kind === "classifier"); }

function gate() {
  let release!: () => void;
  const wait = new Promise<void>((resolve) => { release = resolve; });
  return { wait, release };
}

function reply(s: State, kind: Observation["kind"], message = fauxAssistantMessage("MAIN_ANSWER")): FauxResponseFactory {
  return (context, options, _providerState, model) => {
    s.observations.push({ kind, provider: model.provider, model: model.id, api: model.api, context: structuredClone(context), options });
    return message;
  };
}

async function app(world: World): Promise<Fixture> {
  if (world.fixture) return world.fixture;
  const s = data(world);
  const custom: ExtensionFactory = (pi) => {
    pi.on("input", (event) => {
      if (event.text !== "__custom_event__") return;
      pi.sendMessage({ customType: "offline-acceptance", content: "extension work", display: false }, { triggerTurn: true });
      return { action: "handled" };
    });
  };
  const intercept: ExtensionFactory = (pi) => {
    pi.on("input", (event) => {
      if (!s.intercept || !event.text.startsWith(`/skill:${s.name}`)) return;
      if (s.intercept === "handles the input") return { action: "handled" };
      if (s.intercept === "transforms the input") return { action: "transform", text: "changed accepted text" };
      const file = world.fixture!.skills[0]!.filePath;
      if (s.intercept === "removes the resource") unlinkSync(file);
      else writeFileSync(file, readFileSync(file, "utf8").replace("trivial", "frontier"));
    });
  };
  let manager: SessionManager | undefined;
  if (s.noEvidence) {
    manager = SessionManager.inMemory();
    manager.appendModelChange("pi-auto-model", "auto");
    manager.appendThinkingLevelChange("xhigh");
    manager.appendMessage({ role: "user", content: "seed without physical evidence", timestamp: 0 });
  }
  world.fixture = await createFixture({
    configuration: s.configuration,
    skills: [
      { name: s.name, description: "Offline sample task", tier: s.metadata, body: "POISON_BODY" },
      { name: "seed-hard", description: "Hard work", tier: "frontier" },
      { name: "seed-small", description: "Small work", tier: "trivial" },
      { name: "seed-complex", description: "Complex work", tier: "complex" },
    ],
    extensions: [custom, intercept],
    tools: ["read"], retry: true, restore: s.noEvidence, sessionManager: manager,
  });
  const f = world.fixture;
  const auto = f.runtime.getModel("pi-auto-model", "auto");
  assert.equal(auto?.api, "pi-virtual", "real native registration");
  if (!s.noEvidence) assert.equal(f.session.model?.id, "gpt-6.1-sol", "loading is opt-in");
  await f.session.setModel(auto!);
  assert.equal(f.session.model?.id, "auto");
  if (s.fixedHighOnly) f.faux.getModel("gpt-6.1-sol")!.thinkingLevelMap = { xhigh: null };
  return f;
}

function transport(s: State): FauxResponseFactory[] {
  if (s.metadata !== undefined && typeof s.metadata === "string" && ["trivial", "moderate", "complex", "frontier"].includes(s.metadata.trim().toLowerCase())) {
    return [reply(s, "main")];
  }
  if (s.outcome === "has no available physical model") return [reply(s, "main")];
  let message = fauxAssistantMessage(s.classifier);
  if (s.outcome === "returns no tier") message = fauxAssistantMessage("");
  if (s.outcome === "returns an unknown tier") message = fauxAssistantMessage("not-a-tier");
  if (s.outcome === "returns malformed output") message = fauxAssistantMessage('{"tier":"complex"}');
  if (s.outcome === "fails") message = fauxAssistantMessage("error", { stopReason: "error", errorMessage: "offline classification failure" });
  const classify = reply(s, "classifier", message);
  if (s.outcome !== "times out") return [classify, reply(s, "main")];
  const delayed = gate(); s.release = delayed.release;
  return [async (...args) => { const response = await classify(...args); await delayed.wait; return response; }, reply(s, "main")];
}

async function submit(world: World, value: string, kind: "skill" | "typed") {
  const s = data(world), f = await app(world);
  s.mainCount = f.session.messages.filter((message) => message.role === "assistant").length;
  if (kind === "typed") s.lastTyped = value;
  const confirmation = /^(yes|ok|proceed)$/i.test(value);
  f.faux.setResponses(confirmation ? [reply(s, "main")] : transport(s));
  await f.session.prompt(value);
}

Before({ tags: "@slice1" }, function (this: World) {
  this.routing = {
    configuration: policy(), name: "sample", classifier: "complex",
    observations: [], mainCount: 0, standaloneUsage: [],
  };
});

After({ tags: "@slice1" }, function (this: World) {
  this.routing?.release?.();
  this.fixture?.close();
});

Given("offline Auto is enabled in {string} mode", function (this: World, mode: string) {
  const s = data(this); assert.equal(this.fixture, undefined, "mode set before fixture creation");
  s.configuration.mode = mode;
});
Given("a loaded skill declares model-tier {string}", function (this: World, tier: string) { data(this).metadata = tier; });
Given("the loaded commit skill declares model-tier {string}", function (this: World, tier: string) { data(this).name = "commit"; data(this).metadata = tier; });
Given("a loaded skill has {string}", function (this: World, form: string) {
  const values: Record<string, unknown> = {
    "no model-tier key": undefined, "an empty model-tier string": "",
    "an unknown model-tier value": "unknown", "a list model-tier value": ["complex"],
    "a numeric model-tier value": 7,
  };
  assert.ok(Object.hasOwn(values, form)); data(this).metadata = values[form];
});
Given("the offline classifier returns {string}", function (this: World, tier: string) { data(this).classifier = tier; });
Given("classification {string}", function (this: World, outcome: string) {
  const s = data(this); s.outcome = outcome;
  assert.ok(["returns no tier", "returns an unknown tier", "returns malformed output", "fails", "times out", "has no available physical model"].includes(outcome));
  if (outcome === "times out") s.configuration.classifier.timeoutMs = 10;
  if (outcome === "has no available physical model") s.configuration.classifier.model = "absent";
});
Given("a completed declared frontier task used Sol at xhigh", async function (this: World) {
  const s = data(this), f = await app(this);
  f.faux.setResponses([reply(s, "main")]); await f.session.prompt("/skill:seed-hard");
  assert.equal(last(f).model, "gpt-6.1-sol"); assert.equal(last(f).thinkingLevel, "xhigh"); s.observations = [];
});
Given("a completed declared complex task used Sol at xhigh", async function (this: World) {
  const s = data(this), f = await app(this);
  f.faux.setResponses([reply(s, "main")]); await f.session.prompt("/skill:seed-complex");
  assert.equal(last(f).model, "gpt-6.1-sol"); assert.equal(last(f).thinkingLevel, "xhigh"); s.observations = [];
});
Given("a completed declared trivial task used Luna at high", async function (this: World) {
  const s = data(this), f = await app(this);
  f.faux.setResponses([reply(s, "main")]); await f.session.prompt("/skill:seed-small");
  assert.equal(last(f).model, "gpt-6-luna"); assert.equal(last(f).thinkingLevel, "high"); s.observations = [];
});
Given("the fixed Sol model supports high but not xhigh", function (this: World) { data(this).fixedHighOnly = true; });
Given("the automatic {string} setting is max", function (this: World, slot: string) {
  const s = data(this);
  if (slot === "tier") s.configuration.tiers.trivial.effort = "max";
  else if (slot === "classifier") s.configuration.classifier.effort = "max";
  else { assert.equal(slot, "summary"); s.configuration.summaryTier = "max"; }
});
Given("the configured complex pair is absent", function (this: World) { data(this).configuration.tiers.complex.model = "absent"; });
Given("only trivial is configured to available Sol at high", function (this: World) {
  const s = data(this);
  for (const tier of ["frontier", "complex", "moderate"] as const) s.configuration.tiers[tier].model = "absent";
  s.configuration.tiers.trivial = { ...sol, effort: "high" };
});
Given("trivial is absent while every larger tier maps to Luna at high", function (this: World) {
  const s = data(this); s.configuration.tiers.trivial.model = "absent";
  for (const tier of ["moderate", "complex", "frontier"] as const) s.configuration.tiers[tier] = { ...luna };
});
Given("a physical tier target is the virtual Auto model", function (this: World) { data(this).configuration.tiers.frontier = { provider: "pi-auto-model", model: "auto", effort: "xhigh" }; });
Given("saved Auto has no active or captured physical evidence", function (this: World) { data(this).noEvidence = true; });
Given("a later input handler {string}", function (this: World, change: string) { data(this).intercept = change; });
Given("the routing configuration has {string}", function (this: World, problem: string) {
  const s = data(this);
  if (problem === "wrong version") s.configuration.version = 2;
  else if (problem === "unknown mode") s.configuration.mode = "unknown";
  else if (problem === "zero deadline") s.configuration.classifier.timeoutMs = 0;
  else if (problem === "unknown root key") Object.assign(s.configuration, { legacySkills: {} });
  else { assert.equal(problem, "missing tier pair"); delete (s.configuration.tiers as Record<string, unknown>).frontier; }
});

When("I invoke that skill as an idle slash command", async function (this: World) { await submit(this, `/skill:${data(this).name}`, "skill"); });
When("I invoke that skill with poison arguments while idle", async function (this: World) { await submit(this, `/skill:${data(this).name} POISON_ARGUMENTS`, "skill"); });
When("I submit {string} while idle", async function (this: World, value: string) { await submit(this, value, "typed"); });
When("standalone classification runs without starting a main conversation", async function (this: World) {
  const s = data(this), f = await app(this); s.standalone = snapshot(f);
  f.faux.setResponses([reply(s, "classifier", fauxAssistantMessage(s.classifier))]);
  await resolveTaskRoute(s.configuration, {
    task: { kind: "skill", name: s.name, description: "Offline sample task", content: readFileSync(f.skills[0]!.filePath, "utf8") },
    current: sol, captured: sol,
  }, new ModelRegistry(f.runtime), { onClassifierUsage: (record) => s.standaloneUsage.push(record) });
});
When("a {string} requires another native request for that skill", async function (this: World, event: string) {
  const s = data(this), f = await app(this);
  if (event === "tool result") {
    f.faux.setResponses([
      reply(s, "main", fauxAssistantMessage([fauxToolCall("read", { path: f.skills[1]!.filePath })], { stopReason: "toolUse" })),
      reply(s, "main"),
    ]);
  } else {
    assert.equal(event, "automatic retry");
    f.faux.setResponses([reply(s, "main", fauxAssistantMessage("failure", { stopReason: "error", errorMessage: "429 rate limit" })), reply(s, "main")]);
  }
  await f.session.prompt(`/skill:${s.name}`);
  if (event === "tool result") assert.ok(f.session.messages.some((message) => message.role === "toolResult"));
  assert.equal(last(f).stopReason, "stop");
});
When("a routine request is queued as {string} during that task", async function (this: World, delivery: string) {
  assert.ok(delivery === "steer" || delivery === "followUp");
  const s = data(this), f = await app(this), started = gate(), finish = gate(); s.release = finish.release;
  const active = reply(s, "main");
  f.faux.setResponses([async (...args) => { const response = await active(...args); started.release(); await finish.wait; return response; }, reply(s, "main")]);
  const running = f.session.prompt(`/skill:${s.name}`);
  await started.wait; await f.session.prompt("draft a short PR", { streamingBehavior: delivery });
  finish.release(); await running;
  assert.equal(last(f).stopReason, "stop");
});
When("an extension submits {string} work", async function (this: World, delivery: string) {
  const s = data(this), f = await app(this); f.faux.setResponses([reply(s, "main")]);
  if (delivery === "message") await f.session.prompt("debug authentication", { source: "extension" });
  else { assert.equal(delivery, "custom event"); await f.session.prompt("__custom_event__"); await f.session.waitForIdle(); }
});
When("a summary uses native virtual-aware dispatch", async function (this: World) {
  const s = data(this), f = await app(this); s.beforeDirect = snapshot(f);
  f.faux.setResponses([reply(s, "direct")]);
  s.directReply = await new ModelRegistry(f.runtime).streamSimple(f.runtime.getModel("pi-auto-model", "auto")!, {
    messages: [{ role: "user", content: "summary", timestamp: Date.now() }],
  }).result();
});

Then("the main request uses {string} at {string}", function (this: World, model: string, effort: string) {
  const s = data(this), f = this.fixture!;
  assert.equal(last(f).stopReason, "stop"); assert.equal(last(f).provider, "github-copilot");
  assert.equal(last(f).model, model); assert.equal(last(f).thinkingLevel, effort);
  assert.ok(main(s).length > 0, "physical main provider reached");
  const request = main(s).at(-1)!;
  assert.equal(request.provider, "github-copilot"); assert.equal(request.model, model); assert.equal(request.options?.reasoning, effort);
  assert.notEqual(request.api, "pi-virtual"); assert.deepEqual(f.errors, []);
});
Then("every main request uses {string} at {string}", function (this: World, model: string, effort: string) {
  const requests = main(data(this)); assert.ok(requests.length > 0);
  for (const request of requests) { assert.equal(request.provider, "github-copilot"); assert.equal(request.model, model); assert.equal(request.options?.reasoning, effort); assert.notEqual(request.api, "pi-virtual"); }
});
Then("exactly {int} main requests were observed", function (this: World, count: number) { assert.equal(main(data(this)).length, count); });
Then("{int} classifier requests are made", function (this: World, count: number) {
  const records = classifiers(data(this)); assert.equal(records.length, count);
  for (const record of records) {
    const user = record.context.messages.find((message) => message.role === "user"); assert.equal(typeof user?.content, "string");
    const parsed = JSON.parse(user!.content as string); assert.ok(parsed.kind === "typed" || parsed.kind === "skill");
    assert.notEqual(record.api, "pi-virtual"); assert.equal(record.model, "gpt-6-luna"); assert.equal(record.options?.reasoning, "high");
  }
});
Then("classification receives only the loaded name and description", function (this: World) {
  const s = data(this), records = classifiers(s); assert.equal(records.length, 1);
  const user = records[0]!.context.messages.find((message) => message.role === "user");
  assert.deepEqual(JSON.parse(user!.content as string), { kind: "skill", name: s.name, description: "Offline sample task" });
  assert.ok(!JSON.stringify(records[0]!.context).includes("POISON_BODY"));
  assert.ok(!JSON.stringify(records[0]!.context).includes("POISON_ARGUMENTS"));
});
Then("classification receives only that typed task", function (this: World) {
  const s = data(this), records = classifiers(s); assert.equal(records.length, 1);
  const user = records[0]!.context.messages.find((message) => message.role === "user");
  assert.deepEqual(JSON.parse(user!.content as string), { kind: "typed", text: s.lastTyped });
  assert.ok(!JSON.stringify(records[0]!.context).includes("POISON_BODY"));
});
Then("classifier usage is separate from assistant conversation entries", function (this: World) {
  const f = this.fixture!, s = data(this);
  const entries = f.session.sessionManager.getBranch().filter((entry) => entry.type === "custom" && entry.customType === "pi-auto-model.classifier-usage");
  assert.equal(entries.length, 1);
  assert.equal(f.session.messages.filter((message) => message.role === "assistant").length - s.mainCount, 1);
  assert.ok(!f.session.messages.some((message) => message.role === "assistant" && JSON.stringify(message.content).includes('"text":"complex"')));
});
Then("classification has no usable tier", function (this: World) {
  const s = data(this); assert.ok(s.outcome);
  assert.equal(classifiers(s).length, s.outcome === "has no available physical model" ? 0 : 1);
  assert.equal(main(s).length, 1);
});
Then("classification uses physical Luna at high without tools or a virtual router", function (this: World) {
  const records = classifiers(data(this)); assert.equal(records.length, 1);
  const request = records[0]!;
  assert.equal(request.model, "gpt-6-luna"); assert.equal(request.options?.reasoning, "high"); assert.notEqual(request.api, "pi-virtual");
  assert.deepEqual(request.context.messages.flatMap((message) => message.role === "system" ? message.toolsAdded ?? [] : []), []);
  assert.equal(request.options?.toolChoice, "none"); assert.equal(request.options?.maxRetries, 0);
  assert.equal(data(this).standaloneUsage.length, 1);
});
Then("selected Auto and its conversation and branch remain unchanged", function (this: World) {
  assert.deepEqual(snapshot(this.fixture!), data(this).standalone); assert.equal(this.fixture!.session.model?.id, "auto");
});
Then("the direct summary request uses physical Luna at high", function (this: World) {
  const s = data(this), requests = s.observations.filter((request) => request.kind === "direct"); assert.equal(requests.length, 1);
  assert.equal(requests[0]!.model, "gpt-6-luna"); assert.equal(requests[0]!.options?.reasoning, "high");
  assert.equal(s.directReply?.model, "gpt-6-luna"); assert.equal(s.directReply?.stopReason, "stop");
  assert.equal(classifiers(s).length, 0);
});
Then("the main branch and restore target are unchanged", function (this: World) { assert.deepEqual(snapshot(this.fixture!), data(this).beforeDirect); });
Then("a confirmation still uses Sol at xhigh without classification", async function (this: World) {
  const s = data(this), f = this.fixture!; f.faux.setResponses([reply(s, "main")]); await f.session.prompt("yes");
  assert.equal(last(f).model, "gpt-6.1-sol"); assert.equal(last(f).thinkingLevel, "xhigh"); assert.equal(classifiers(s).length, 0);
});
Then("routing reports an actionable error containing {string}", function (this: World, field: string) {
  const response = last(this.fixture!); assert.equal(response.stopReason, "error"); assert.ok(response.errorMessage?.includes(field));
});
Then("no physical request is dispatched", function (this: World) { assert.deepEqual(data(this).observations, []); assert.equal(this.fixture!.faux.state.callCount, 0); });
Then("no main request is dispatched", function (this: World) { assert.equal(main(data(this)).length, 0); });
Then("no stale candidate is used after {string}", async function (this: World, change: string) {
  const s = data(this), f = this.fixture!;
  if (change === "handles the input") assert.equal(f.faux.state.callCount, 0);
  else { assert.equal(last(f).model, "gpt-6.1-sol"); assert.equal(last(f).thinkingLevel, "xhigh"); assert.equal(f.faux.state.callCount, 1); }
  f.faux.setResponses([reply(s, "main")]); await f.session.prompt("later extension message", { source: "extension" });
  assert.equal(last(f).model, "gpt-6.1-sol"); assert.equal(last(f).thinkingLevel, "xhigh"); assert.equal(classifiers(s).length, 0);
});
