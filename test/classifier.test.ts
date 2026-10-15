import { getEventListeners } from "node:events";
import {
  createAssistantMessageEventStream,
  fauxAssistantMessage,
  fauxProvider,
  fauxThinking,
  fauxToolCall,
  type AssistantMessage,
} from "@earendil-works/pi-ai";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  resolveTaskRoute,
  type PhysicalPair,
  type TaskInput,
  type TaskResult,
} from "../src/policy.ts";

const luna: PhysicalPair = {
  provider: "github-copilot", model: "gpt-6-luna", effort: "high",
};
const sol: PhysicalPair = {
  provider: "github-copilot", model: "gpt-6.1-sol", effort: "xhigh",
};
const usage = {
  input: 12, output: 2, cacheRead: 3, cacheWrite: 4, reasoning: 1,
  totalTokens: 21,
  cost: { input: 0.01, output: 0.02, cacheRead: 0.003, cacheWrite: 0.004, total: 0.037 },
};

function configuration(classifier: Record<string, unknown> = {}) {
  return {
    version: 1, mode: "model-and-effort", summaryTier: "trivial",
    tiers: { trivial: { ...luna }, moderate: { ...luna }, complex: { ...sol }, frontier: { ...sol } },
    classifier: { ...luna, effort: "low", maxInputChars: 12000, maxOutputTokens: 256, timeoutMs: 10000, ...classifier },
  };
}

function response(content = "moderate") {
  return { ...fauxAssistantMessage(content), usage: structuredClone(usage) };
}

function fixture(message: AssistantMessage = response()) {
  const fake = fauxProvider({
    provider: "github-copilot",
    models: [{ id: "gpt-6-luna", reasoning: true }, { id: "gpt-6.1-sol", reasoning: true }],
  });
  for (const model of fake.models) model.thinkingLevelMap = { low: "low", high: "high", xhigh: "xhigh" };
  const available = new Set(fake.models.map((model) => model.id));
  const transport = vi.fn<Parameters<typeof resolveTaskRoute>[2]["streamSimple"]>(() => {
    const stream = createAssistantMessageEventStream();
    stream.end(message);
    return stream;
  });
  const registry: Parameters<typeof resolveTaskRoute>[2] = {
    find: (provider, id) => fake.models.find((model) => model.provider === provider && model.id === id),
    hasConfiguredAuth: (model) => available.has(model.id),
    getAvailable: () => fake.models.filter((model) => available.has(model.id)),
    streamSimple: transport,
  };
  return { fake, available, transport, registry };
}

function view(result: TaskResult) {
  return {
    provider: result.model.provider, model: result.model.id,
    effort: result.thinkingLevel, tier: result.tier, source: result.source,
  };
}

function task(text = "draft a short PR description"): TaskInput {
  return { task: { kind: "typed", text }, current: sol, captured: sol };
}

function skill(tier?: unknown): TaskInput {
  const metadata = tier === undefined ? "" : `metadata:\n  model-tier: ${JSON.stringify(tier)}\n`;
  return {
    task: {
      kind: "skill", name: "unfamiliar-work", description: "Design a new feature",
      content: `---\nname: unfamiliar-work\n${metadata}---\nPOISON_INSTRUCTIONS`,
    },
    current: sol, captured: sol,
  };
}

function userPayload(f: ReturnType<typeof fixture>) {
  const messages = f.transport.mock.calls[0]![1].messages;
  const user = messages.find((message) => message.role === "user");
  expect(user).toBeDefined();
  expect(typeof user!.content).toBe("string");
  return user!.content as string;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("classification and payload isolation", () => {
  test("a fresh typed task uses the physical classifier tier", async () => {
    const f = fixture();
    const result = await resolveTaskRoute(undefined, task(), f.registry);
    expect(view(result)).toEqual({ ...luna, tier: "moderate", source: "tier" });
    expect(result.classification).toEqual({ pair: { ...luna, effort: "low" }, outcome: "tier", tier: "moderate", usage });
  });

  test.each([
    ["trivial", "gpt-6-luna", "high"], ["moderate", "gpt-6-luna", "high"],
    ["complex", "gpt-6.1-sol", "xhigh"], ["frontier", "gpt-6.1-sol", "xhigh"],
  ])("valid metadata %s avoids classifier work", async (tier, model, effort) => {
    const f = fixture(response("trivial"));
    const result = await resolveTaskRoute(undefined, skill(`  ${tier.toUpperCase()}  `), f.registry);
    expect(result.model.id).toBe(model);
    expect(result.thinkingLevel).toBe(effort);
    expect(result.classification).toBeUndefined();
    expect(f.transport).not.toHaveBeenCalled();
  });

  test.each([undefined, "", "unknown", ["complex"], 3].map((value) => ({ value })))(
    "absent/invalid metadata $value classifies only name and description", async ({ value }) => {
      const f = fixture(response("complex"));
      const input = skill(value);
      const result = await resolveTaskRoute(undefined, input, f.registry);
      expect(result.tier).toBe("complex");
      expect(JSON.parse(userPayload(f))).toEqual({ kind: "skill", name: "unfamiliar-work", description: "Design a new feature" });
      expect(JSON.stringify(f.transport.mock.calls)).not.toContain("POISON_INSTRUCTIONS");
    },
  );

  test("extra slash arguments are never serialized", async () => {
    const f = fixture();
    const input = { ...skill(), task: { ...skill().task!, args: "POISON_ARGUMENTS" } };
    await resolveTaskRoute(undefined, input, f.registry);
    expect(userPayload(f)).not.toContain("POISON_ARGUMENTS");
    expect(userPayload(f)).not.toContain("POISON_INSTRUCTIONS");
  });

  test("serialized control characters and skill fields stay within the total input cap", async () => {
    for (const input of [task("\u0000".repeat(1000)), task("🚀".repeat(1000)), {
      ...skill(), task: { kind: "skill" as const, name: "n".repeat(1000), description: "\u0000".repeat(1000), content: "body" },
    }]) {
      const f = fixture();
      await resolveTaskRoute(configuration({ maxInputChars: 96 }), input, f.registry);
      const payload = userPayload(f);
      expect(payload.length).toBeLessThanOrEqual(96);
      expect(() => JSON.parse(payload)).not.toThrow();
    }
  });

  test.each([task("   "), { ...skill(), task: { kind: "skill" as const, name: "", description: "", content: "body" } }])(
    "empty task data is not sent to a provider", async (input) => {
      const f = fixture();
      const result = await resolveTaskRoute(undefined, input, f.registry);
      expect(view(result)).toEqual({ ...sol, tier: undefined, source: "current" });
      expect(f.transport).not.toHaveBeenCalled();
    },
  );

  test("a cap too small for serialized data is non-fatal and makes no request", async () => {
    const f = fixture();
    const result = await resolveTaskRoute(configuration({ maxInputChars: 1 }), task(), f.registry);
    expect(view(result)).toEqual({ ...sol, tier: undefined, source: "current" });
    expect(f.transport).not.toHaveBeenCalled();
  });

  test("tools/retries/cache sharing are off and the physical effort/output cap is exact", async () => {
    const f = fixture();
    await resolveTaskRoute(undefined, task(), f.registry);
    const [model, context, options] = f.transport.mock.calls[0]!;
    expect(model.id).toBe("gpt-6-luna");
    expect(model.api).not.toBe("pi-virtual");
    expect(context.tools ?? []).toEqual([]);
    expect(context.messages).toHaveLength(1);
    expect(options).toMatchObject({ reasoning: "low", maxTokens: 256, maxRetries: 0, toolChoice: "none", cacheRetention: "none" });
    expect(options?.sessionId).toBeUndefined();
    expect(options?.signal).toBeInstanceOf(AbortSignal);
  });

  test("honors an explicitly configured physical classifier and supported effort", async () => {
    const f = fixture(response("complex"));
    await resolveTaskRoute(configuration({ model: "gpt-6.1-sol", effort: "xhigh" }), task(), f.registry);
    expect(f.transport.mock.calls[0]![0].id).toBe("gpt-6.1-sol");
    expect(f.transport.mock.calls[0]![2]?.reasoning).toBe("xhigh");
  });

  test("off classifier effort is passed as absent provider reasoning", async () => {
    const f = fixture();
    await resolveTaskRoute(configuration({ effort: "off" }), task(), f.registry);
    expect(f.transport.mock.calls[0]![2]?.reasoning).toBeUndefined();
  });

  test("output budget also respects the known physical model limit", async () => {
    const f = fixture();
    f.fake.getModel("gpt-6-luna")!.maxTokens = 32;
    await resolveTaskRoute(configuration({ maxOutputTokens: 100 }), task(), f.registry);
    expect(f.transport.mock.calls[0]![2]?.maxTokens).toBe(32);
  });

  test("direct summaries and absent eligible tasks bypass classification", async () => {
    const f = fixture();
    expect((await resolveTaskRoute(undefined, { ...task(), direct: true }, f.registry)).tier).toBe("trivial");
    expect((await resolveTaskRoute(undefined, { current: sol }, f.registry)).source).toBe("current");
    expect(f.transport).not.toHaveBeenCalled();
  });
});

describe("unusable responses and unavailable access", () => {
  test.each(["", "unknown", "COMPLEX", "complex because it is hard", '"complex"', '{"tier":"complex"}', "complex\nfrontier"])(
    "rejects non-scalar output %j without losing usage", async (text) => {
      const f = fixture(response(text));
      const result = await resolveTaskRoute(undefined, task(), f.registry);
      expect(view(result)).toEqual({ ...sol, tier: undefined, source: "current" });
      expect(result.classification?.outcome).toBe("unusable");
      expect(result.classification?.usage).toEqual(usage);
    },
  );

  test("accepts surrounding whitespace and normal provider reasoning without exposing it", async () => {
    const f = fixture({ ...response(), content: [fauxThinking("PRIVATE_REASONING"), { type: "text", text: "  complex\n" }] });
    const result = await resolveTaskRoute(undefined, task(), f.registry);
    expect(result.tier).toBe("complex");
    expect(JSON.stringify(result.classification)).not.toContain("PRIVATE_REASONING");
  });

  test.each([
    [{ type: "text", text: "complex" }, { type: "text", text: "more" }],
    [fauxToolCall("read", { path: "secret" })],
    [fauxThinking("no answer")], [],
  ].map((content) => ({ content: content as AssistantMessage["content"] })))(
    "rejects missing/extra/tool output $content", async ({ content }) => {
      const f = fixture({ ...response(), content });
      const result = await resolveTaskRoute(undefined, task(), f.registry);
      expect(result.source).toBe("current");
      expect(result.classification?.tier).toBeUndefined();
    },
  );

  test.each(["length", "toolUse", "error", "aborted", "pending", "deferred"] as const)(
    "rejects stopReason %s even when text contains a tier", async (stopReason) => {
      const f = fixture({ ...response("complex"), stopReason });
      const result = await resolveTaskRoute(undefined, task(), f.registry);
      expect(result.source).toBe("current");
      expect(result.classification?.tier).toBeUndefined();
      expect(result.classification?.usage).toEqual(usage);
    },
  );

  test("over-budget output is not accepted even if a provider ignores its cap", async () => {
    const f = fixture({ ...response("complex"), usage: { ...usage, output: 257 } });
    expect((await resolveTaskRoute(undefined, task(), f.registry)).source).toBe("current");
  });

  test.each(["missing-model", "missing-auth", "unsupported-effort"])(
    "%s classifier access makes no physical request", async (condition) => {
      const f = fixture();
      const raw = condition === "missing-model" ? configuration({ model: "missing" }) : undefined;
      if (condition === "missing-auth") f.available.delete("gpt-6-luna");
      if (condition === "unsupported-effort") f.fake.getModel("gpt-6-luna")!.thinkingLevelMap = { low: null };
      const result = await resolveTaskRoute(raw, task(), f.registry);
      expect(result.source).toBe("current");
      expect(result.classification?.outcome).toBe("unavailable");
      expect(f.transport).not.toHaveBeenCalled();
    },
  );

  test("auth lookup errors are non-fatal", async () => {
    const f = fixture();
    f.registry.hasConfiguredAuth = () => { throw new Error("auth unavailable"); };
    expect((await resolveTaskRoute(undefined, task(), f.registry)).source).toBe("current");
  });

  test.each(["throws", "rejects"])("stream %s retains evidence without inventing usage", async (mode) => {
    const f = fixture();
    if (mode === "throws") f.transport.mockImplementation(() => { throw new Error("stream setup"); });
    else f.transport.mockImplementation(() => {
      const stream = createAssistantMessageEventStream();
      stream.result = () => Promise.reject(new Error("stream failed"));
      return stream;
    });
    const result = await resolveTaskRoute(undefined, task(), f.registry);
    expect(result.source).toBe("current");
    expect(result.classification?.outcome).toBe("error");
    expect(result.classification?.usage).toBeUndefined();
  });

  test("invalid classifier settings fail before request dispatch", async () => {
    const f = fixture();
    await expect(resolveTaskRoute(configuration({ effort: "max" }), task(), f.registry))
      .rejects.toThrow("config.classifier.effort");
    expect(f.transport).not.toHaveBeenCalled();
  });

  test("a known virtual classifier is an actionable configuration error", async () => {
    const f = fixture();
    f.fake.getModel("gpt-6-luna")!.api = "pi-virtual";
    await expect(resolveTaskRoute(undefined, task(), f.registry)).rejects.toThrow(/virtual target/);
    expect(f.transport).not.toHaveBeenCalled();
  });

  test("effort-only setup must be valid before classifier dispatch", async () => {
    const f = fixture();
    const raw = configuration();
    raw.mode = "effort-only";
    await expect(resolveTaskRoute(raw, { task: task().task, current: sol }, f.registry))
      .rejects.toThrow(/physical model.*effort-only/);
    expect(f.transport).not.toHaveBeenCalled();
  });

  test("classifier failure cannot manufacture missing physical evidence", async () => {
    const f = fixture(response("unknown"));
    await expect(resolveTaskRoute(undefined, { task: task().task }, f.registry))
      .rejects.toThrow(/Select an available physical model and effort/);
  });
});

describe("usage and bounded cancellation", () => {
  test("separately reports usage without letting an observer mutate evidence", async () => {
    const f = fixture();
    const records: unknown[] = [];
    const result = await resolveTaskRoute(undefined, task(), f.registry, {
      onClassifierUsage(record) { records.push(structuredClone(record)); record.usage.output = 999; },
    });
    expect(records).toEqual([{ pair: { ...luna, effort: "low" }, usage, outcome: "tier", tier: "moderate" }]);
    expect(result.classification?.usage).toEqual(usage);
  });

  test.each(["throws", "rejects"])("usage observer %s cannot break routing", async (mode) => {
    const f = fixture();
    const observer = mode === "throws"
      ? () => { throw new Error("usage sink"); }
      : async () => { throw new Error("usage sink"); };
    const result = await resolveTaskRoute(undefined, task(), f.registry, { onClassifierUsage: observer });
    expect(result.tier).toBe("moderate");
  });

  test.each(["signal", "lifecycleSignal"] as const)("already aborted %s makes no request", async (key) => {
    const f = fixture();
    const parent = new AbortController();
    parent.abort();
    const result = await resolveTaskRoute(undefined, task(), f.registry, { [key]: parent.signal });
    expect(result.source).toBe("current");
    expect(f.transport).not.toHaveBeenCalled();
  });

  test.each(["signal", "lifecycleSignal"] as const)(
    "%s interrupts an uncooperative transport and discards its late tier", async (key) => {
      vi.useFakeTimers();
      const f = fixture();
      const stream = createAssistantMessageEventStream();
      f.transport.mockReturnValue(stream);
      const parent = new AbortController();
      const records: unknown[] = [];
      const pending = resolveTaskRoute(undefined, task(), f.registry, {
        [key]: parent.signal, onClassifierUsage: (record) => records.push(record),
      });
      expect(f.transport).toHaveBeenCalledOnce();
      const providerSignal = f.transport.mock.calls[0]![2]!.signal!;
      parent.abort();
      const result = await pending;
      expect(result.source).toBe("current");
      expect(result.classification?.outcome).toBe("canceled");
      expect(providerSignal.aborted).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
      expect(getEventListeners(parent.signal, "abort")).toHaveLength(0);
      const before = structuredClone(view(result));
      stream.end(response("frontier"));
      await Promise.resolve();
      await Promise.resolve();
      expect(view(result)).toEqual(before);
      expect(result.classification?.usage).toBeUndefined();
      expect(records).toEqual([{ pair: { ...luna, effort: "low" }, usage, outcome: "canceled" }]);
    },
  );

  test("deadline bounds the wait and releases timers even if abort is ignored", async () => {
    vi.useFakeTimers();
    const f = fixture();
    const stream = createAssistantMessageEventStream();
    f.transport.mockReturnValue(stream);
    const pending = resolveTaskRoute(configuration({ timeoutMs: 25 }), task(), f.registry);
    await vi.advanceTimersByTimeAsync(25);
    const result = await pending;
    expect(result.source).toBe("current");
    expect(result.classification?.outcome).toBe("timeout");
    expect(f.transport.mock.calls[0]![2]!.signal!.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    stream.end(response("complex"));
    await Promise.resolve();
    expect(result.classification?.tier).toBeUndefined();
  });

  test("large safe-integer deadlines do not overflow into an immediate timeout", async () => {
    vi.useFakeTimers();
    const f = fixture();
    const stream = createAssistantMessageEventStream();
    f.transport.mockReturnValue(stream);
    const parent = new AbortController();
    const pending = resolveTaskRoute(configuration({ timeoutMs: 2147483657 }), task(), f.registry, { signal: parent.signal });
    await vi.advanceTimersByTimeAsync(2147483647);
    expect(f.transport.mock.calls[0]![2]!.signal!.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(10);
    expect((await pending).classification?.outcome).toBe("timeout");
    expect(vi.getTimerCount()).toBe(0);
    stream.end(response());
  });

  test.each(["success", "unusable", "throws"])("%s cleans both parent subscriptions and deadline", async (outcome) => {
    vi.useFakeTimers();
    const f = fixture(response(outcome === "unusable" ? "unknown" : "moderate"));
    if (outcome === "throws") f.transport.mockImplementation(() => { throw new Error("setup"); });
    const request = new AbortController();
    const lifecycle = new AbortController();
    await resolveTaskRoute(undefined, task(), f.registry, { signal: request.signal, lifecycleSignal: lifecycle.signal });
    expect(getEventListeners(request.signal, "abort")).toHaveLength(0);
    expect(getEventListeners(lifecycle.signal, "abort")).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });
});
