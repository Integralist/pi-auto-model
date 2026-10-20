import { fauxProvider, type Api, type Model } from "@earendil-works/pi-ai";
import { describe, expect, test } from "vitest";
import {
  resolveRoute,
  validateConfiguration,
  type PhysicalPair,
  type RouteDecision,
  type RoutingRegistry,
} from "../src/policy.ts";

const luna: PhysicalPair = {
  provider: "github-copilot", model: "gpt-6-luna", effort: "medium",
};
const lunaHigh: PhysicalPair = { ...luna, effort: "high" };
const lunaXhigh: PhysicalPair = { ...luna, effort: "xhigh" };
const solHigh: PhysicalPair = {
  provider: "github-copilot", model: "gpt-6.1-sol", effort: "high",
};
const sol: PhysicalPair = {
  provider: "github-copilot", model: "gpt-6.1-sol", effort: "xhigh",
};

function configuration() {
  return {
    version: 1,
    mode: "model-and-effort",
    summaryTier: "trivial",
    tiers: {
      trivial: { ...luna }, moderate: { ...lunaXhigh },
      complex: { ...sol }, frontier: { ...sol },
    },
    classifier: {
      ...luna, maxInputChars: 12000, maxOutputTokens: 256, timeoutMs: 10000,
    },
  };
}

function fixture() {
  const provider = fauxProvider({
    provider: "github-copilot",
    models: ["gpt-6-luna", "gpt-6.1-sol", "tiny", "small", "large", "huge"]
      .map((id) => ({ id, reasoning: true })),
  });
  const catalog = new Map<string, Model<Api>>();
  for (const model of provider.models) {
    model.thinkingLevelMap = { low: "low", high: "high", xhigh: "xhigh" };
    catalog.set(`${model.provider}/${model.id}`, model);
  }
  const authenticated = new Set(["github-copilot"]);
  const registry: RoutingRegistry = {
    find: (name, id) => catalog.get(`${name}/${id}`),
    hasConfiguredAuth: (model) => authenticated.has(model.provider),
    getAvailable: () => [...catalog.values()].filter((model) => authenticated.has(model.provider)),
  };
  return { catalog, authenticated, registry };
}

function view(decision: RouteDecision) {
  return {
    provider: decision.model.provider,
    model: decision.model.id,
    effort: decision.thinkingLevel,
    tier: decision.tier,
    source: decision.source,
  };
}

function skill(value: unknown) {
  return `---\nname: commit\nmetadata:\n  model-tier: ${JSON.stringify(value)}\n---\nInstructions are task data.`;
}

function altered(path: string, value: unknown) {
  const raw = configuration();
  let parent: Record<string, unknown> = raw;
  const keys = path.split(".");
  for (const key of keys.slice(0, -1)) {
    parent = parent[key] as Record<string, unknown>;
  }
  parent[keys.at(-1)!] = value;
  return raw;
}

function orderedConfiguration() {
  const raw = configuration();
  raw.tiers.trivial.model = "tiny";
  raw.tiers.moderate.model = "small";
  raw.tiers.complex.model = "large";
  raw.tiers.frontier.model = "huge";
  return raw;
}

function route(input: Parameters<typeof resolveRoute>[1], raw: unknown = undefined) {
  return view(resolveRoute(raw, input, fixture().registry));
}

describe("first-release defaults", () => {
  test("use the trivial summary tier and bounded Luna/low classifier", () => {
    const config = validateConfiguration(undefined, fixture().registry);
    expect(config.summaryTier).toBe("trivial");
    expect(config.tiers).toEqual({ trivial: luna, moderate: lunaHigh, complex: solHigh, frontier: sol });
    expect(config.classifier).toEqual({
      ...luna, effort: "low", maxInputChars: 12000, maxOutputTokens: 256, timeoutMs: 6000,
    });
  });
});

describe("portable tiers", () => {
  test.each<[string, PhysicalPair]>([
    ["trivial", luna], ["moderate", lunaHigh], ["complex", solHigh], ["frontier", sol],
  ])("declared %s selects its exact default pair", (tier, pair) => {
    expect(route({ skillContent: skill(tier), classifiedTier: "frontier" }))
      .toEqual({ ...pair, tier, source: "tier" });
  });

  test("trimmed metadata wins over the familiar commit name and classification", () => {
    expect(route({ skillContent: skill("  CoMpLeX  "), classifiedTier: "trivial" }))
      .toEqual({ ...solHigh, tier: "complex", source: "tier" });
  });

  test.each(["", "unknown", ["trivial"], 4, null, true, { tier: "complex" }]
    .map((value) => ({ value })))(
    "invalid scalar metadata $value allows the classified tier", ({ value }) => {
      expect(route({ skillContent: skill(value), classifiedTier: "moderate" }))
        .toEqual({ ...lunaHigh, tier: "moderate", source: "tier" });
    },
  );

  test.each([
    "No frontmatter", "---\nname: commit\n---\nbody",
    "---\nmetadata: null\n---", "---\nmetadata: []\n---",
    "---\nmetadata: 3\n---", "---\n[]\n---",
    "---\nmetadata: [unterminated\n---",
    "---\nmetadata: {}\n---\nmodel-tier: frontier",
  ])("absent or malformed frontmatter is non-fatal: %s", (skillContent) => {
    expect(route({ skillContent, classifiedTier: "complex" }))
      .toEqual({ ...solHigh, tier: "complex", source: "tier" });
  });

  test("typed input uses its own supplied classifier result", () => {
    expect(route({ classifiedTier: "moderate", current: sol }))
      .toEqual({ ...lunaHigh, tier: "moderate", source: "tier" });
  });

  test.each([undefined, "unknown", "complex because", ["complex"], 2, null]
    .map((classifiedTier) => ({ classifiedTier })))(
    "unusable supplied classifier result $classifiedTier retains physical evidence", ({ classifiedTier }) => {
      expect(route({ classifiedTier, current: sol }))
        .toEqual({ ...sol, tier: undefined, source: "current" });
    },
  );
});

describe("ordered exact availability", () => {
  test("chooses the nearest smaller tier instead of the available larger tier", () => {
    const f = fixture();
    f.catalog.delete("github-copilot/large");
    const raw = orderedConfiguration();
    expect(view(resolveRoute(raw, { classifiedTier: "complex" }, f.registry)))
      .toEqual({ ...lunaXhigh, model: "small", tier: "moderate", source: "tier" });
  });

  test("steps past every unavailable smaller tier", () => {
    const f = fixture();
    for (const id of ["huge", "large", "small"]) f.catalog.delete(`github-copilot/${id}`);
    expect(view(resolveRoute(orderedConfiguration(), { classifiedTier: "frontier" }, f.registry)))
      .toEqual({ ...luna, model: "tiny", tier: "trivial", source: "tier" });
  });

  test("trivial failure never steps up or invents a pair", () => {
    const f = fixture();
    f.catalog.delete("github-copilot/tiny");
    expect(view(resolveRoute(orderedConfiguration(), { classifiedTier: "trivial", current: sol }, f.registry)))
      .toEqual({ ...sol, tier: undefined, source: "current" });
  });

  test("missing auth makes a candidate unavailable without an access probe", () => {
    const f = fixture();
    const locked = { ...f.catalog.get("github-copilot/large")!, provider: "locked", id: "large" };
    f.catalog.set("locked/large", locked);
    const raw = configuration();
    raw.tiers.complex = { provider: "locked", model: "large", effort: "xhigh" };
    expect(view(resolveRoute(raw, { classifiedTier: "complex" }, f.registry)))
      .toEqual({ ...lunaXhigh, tier: "moderate", source: "tier" });
  });

  test("unsupported exact xhigh steps down rather than clamping", () => {
    const f = fixture();
    f.catalog.get("github-copilot/gpt-6.1-sol")!.thinkingLevelMap = { xhigh: null };
    expect(view(resolveRoute(undefined, { classifiedTier: "frontier" }, f.registry)))
      .toEqual({ ...solHigh, tier: "complex", source: "tier" });
  });

  test("non-reasoning targets do not silently accept high effort", () => {
    const f = fixture();
    f.catalog.get("github-copilot/gpt-6-luna")!.reasoning = false;
    expect(view(resolveRoute(undefined, { classifiedTier: "trivial", current: sol }, f.registry)))
      .toEqual({ ...sol, tier: undefined, source: "current" });
  });

  test.each(["off", "minimal", "low", "medium", "high", "xhigh"] as const)(
    "honors explicitly configured supported %s without adding it as a default", (effort) => {
      const raw = configuration();
      raw.tiers.trivial = { ...sol, effort };
      expect(route({ classifiedTier: "trivial" }, raw))
        .toEqual({ ...sol, effort, tier: "trivial", source: "tier" });
    },
  );

  test("an unavailable classifier is not itself invalid configuration", () => {
    const raw = configuration();
    raw.classifier.model = "not-in-catalog";
    expect(route({ classifiedTier: "trivial" }, raw))
      .toEqual({ ...luna, tier: "trivial", source: "tier" });
  });
});

describe("warm prompt cache", () => {
  test("a smaller classified tier keeps the current pair", () => {
    expect(route({ classifiedTier: "trivial", current: solHigh, warmTier: "complex" }))
      .toEqual({ ...solHigh, tier: "complex", source: "current" });
  });

  test("a smaller classified tier keeps the warm model at its configured effort when only effort changed", () => {
    expect(route({ classifiedTier: "moderate", current: sol, warmTier: "complex" }))
      .toEqual({ ...solHigh, tier: "complex", source: "current" });
  });

  test("a bigger tier still steps up", () => {
    expect(route({ classifiedTier: "complex", current: luna, warmTier: "trivial" }))
      .toEqual({ ...solHigh, tier: "complex", source: "tier" });
  });

  test("a changed mapping for the warm tier routes as usual", () => {
    const raw = configuration();
    raw.tiers.complex = { ...sol, model: "huge" };
    expect(route({ classifiedTier: "trivial", current: sol, warmTier: "complex" }, raw))
      .toEqual({ ...luna, tier: "trivial", source: "tier" });
  });

  test("a direct summary ignores the warm tier", () => {
    expect(route({ direct: true, current: sol, warmTier: "complex" }))
      .toEqual({ ...luna, tier: "trivial", source: "tier" });
  });
});

describe("physical evidence and effort-only", () => {
  test("current evidence takes precedence over captured evidence", () => {
    expect(route({ current: luna, captured: sol }))
      .toEqual({ ...luna, tier: undefined, source: "current" });
  });

  test.each([
    undefined, { ...sol, model: "missing" }, { ...sol, model: "auto" },
    { ...sol, effort: "max" }, { ...sol, provider: "" },
  ])("invalid current evidence %j falls back to valid captured evidence", (current) => {
    const f = fixture();
    f.catalog.set("github-copilot/auto", {
      ...f.catalog.get("github-copilot/gpt-6-luna")!, id: "auto", api: "pi-virtual",
    });
    expect(view(resolveRoute(undefined, {
      current: current as PhysicalPair | undefined, captured: luna,
    }, f.registry))).toEqual({ ...luna, tier: undefined, source: "captured" });
  });

  test("unsupported evidence effort is not silently clamped", () => {
    const f = fixture();
    f.catalog.get("github-copilot/gpt-6.1-sol")!.thinkingLevelMap = { xhigh: null };
    expect(view(resolveRoute(undefined, { current: sol, captured: luna }, f.registry)))
      .toEqual({ ...luna, tier: undefined, source: "captured" });
  });

  test("all-unavailable retention does not introduce speculative auth fallback", () => {
    const f = fixture();
    f.authenticated.clear();
    expect(view(resolveRoute(undefined, { classifiedTier: "frontier", current: sol }, f.registry)))
      .toEqual({ ...sol, tier: undefined, source: "current" });
  });

  test.each([{}, { current: { ...sol, model: "missing" } }])(
    "unknown physical evidence %j requires an actionable selection", (input) => {
      expect(() => resolveRoute(undefined, input, fixture().registry))
        .toThrow(/Select an available physical model and effort/);
    },
  );

  test("effort-only uses the captured model instead of the mapped model", () => {
    const raw = configuration();
    raw.mode = "effort-only";
    expect(route({ classifiedTier: "moderate", captured: sol }, raw))
      .toEqual({ ...sol, effort: "xhigh", tier: "moderate", source: "tier" });
  });

  test("effort-only tests exact effort against the fixed model", () => {
    const f = fixture();
    f.catalog.get("github-copilot/gpt-6.1-sol")!.thinkingLevelMap = { xhigh: null };
    const raw = configuration();
    raw.mode = "effort-only";
    expect(view(resolveRoute(raw, { classifiedTier: "complex", captured: sol }, f.registry)))
      .toEqual({ ...sol, effort: "medium", tier: "trivial", source: "tier" });
  });

  test("effort-only does not retain another model's current evidence", () => {
    const raw = configuration();
    raw.mode = "effort-only";
    expect(route({ current: luna, captured: sol }, raw))
      .toEqual({ ...sol, tier: undefined, source: "captured" });
  });

  test("effort-only requires the captured model even with a mapped candidate", () => {
    const raw = configuration();
    raw.mode = "effort-only";
    expect(() => resolveRoute(raw, { classifiedTier: "trivial", current: sol }, fixture().registry))
      .toThrow(/physical model.*effort-only/);
  });

  test("direct summary tier ignores task metadata without changing its input", () => {
    const input = { direct: true, skillContent: skill("frontier"), classifiedTier: "complex", current: sol, captured: sol };
    const before = structuredClone(input);
    expect(route(input)).toEqual({ ...luna, tier: "trivial", source: "tier" });
    expect(input).toEqual(before);
  });

  test("a custom summary tier uses the same availability policy", () => {
    const f = fixture();
    const raw = orderedConfiguration();
    raw.summaryTier = "complex";
    f.catalog.delete("github-copilot/large");
    expect(view(resolveRoute(raw, { direct: true, current: sol }, f.registry)))
      .toEqual({ ...lunaXhigh, model: "small", tier: "moderate", source: "tier" });
  });
});

describe("strict version-1 configuration", () => {
  test("an explicit complete configuration matches the defaults", () => {
    expect(route({ classifiedTier: "complex" }, configuration()))
      .toEqual({ ...sol, tier: "complex", source: "tier" });
  });

  test.each([null, [], 1, "config", {}].map((raw) => ({ raw })))(
    "invalid root $raw is actionable", ({ raw }) => {
      expect(() => resolveRoute(raw, { current: sol }, fixture().registry))
        .toThrow(/Invalid routing configuration at config/);
    },
  );

  test.each<[string, unknown]>([
    ["version", 2], ["version", "1"], ["mode", "automatic"],
    ["summaryTier", "unknown"], ["summaryTier", "max"],
    ["tiers", null], ["tiers", []], ["tiers.trivial", null],
    ["tiers.trivial", { ...luna, extra: true }],
    ["tiers.trivial.provider", ""], ["tiers.trivial.provider", " github-copilot"],
    ["tiers.trivial.model", 4], ["tiers.trivial.model", "two words"],
    ["tiers.trivial.effort", "max"], ["tiers.trivial.effort", "unknown"],
    ["classifier", null], ["classifier.effort", "max"],
    ["classifier.provider", false], ["classifier.model", ""],
    ["classifier.maxInputChars", 0], ["classifier.maxInputChars", 1.5],
    ["classifier.maxOutputTokens", -1], ["classifier.maxOutputTokens", "64"],
    ["classifier.timeoutMs", Infinity], ["classifier.timeoutMs", Number.MAX_SAFE_INTEGER + 1],
  ])("rejects invalid %s = %j", (path, value) => {
    expect(() => resolveRoute(altered(path, value), { current: sol }, fixture().registry))
      .toThrow(`Invalid routing configuration at config.${path}`);
  });

  test.each(["version", "tiers", "classifier", "summaryTier", "mode"])(
    "rejects missing root field %s", (key) => {
      const raw: Record<string, unknown> = configuration();
      delete raw[key];
      expect(() => resolveRoute(raw, { current: sol }, fixture().registry))
        .toThrow(`config.${key}`);
    },
  );

  test.each(["trivial", "moderate", "complex", "frontier"])(
    "rejects missing tier %s", (key) => {
      const raw = configuration();
      delete (raw.tiers as Record<string, unknown>)[key];
      expect(() => resolveRoute(raw, { current: sol }, fixture().registry))
        .toThrow(`config.tiers.${key}`);
    },
  );

  test.each(["provider", "model", "effort"])("rejects missing pair field %s", (key) => {
    const raw = configuration();
    delete (raw.tiers.trivial as Record<string, unknown>)[key];
    expect(() => resolveRoute(raw, { current: sol }, fixture().registry))
      .toThrow(`config.tiers.trivial.${key}`);
  });

  test.each(["maxInputChars", "maxOutputTokens", "timeoutMs"])(
    "rejects missing classifier bound %s", (key) => {
      const raw = configuration();
      delete (raw.classifier as Record<string, unknown>)[key];
      expect(() => resolveRoute(raw, { current: sol }, fixture().registry))
        .toThrow(`config.classifier.${key}`);
    },
  );

  test.each<[string, unknown]>([
    ["skillProfiles", {}], ["tiers.extra", luna], ["classifier.extra", true],
  ])("rejects conflicting or unknown field %s", (path, value) => {
    expect(() => resolveRoute(altered(path, value), { current: sol }, fixture().registry))
      .toThrow(`config.${path}`);
  });

  test.each(["tiers.frontier", "classifier"])(
    "rejects a virtual %s target even when the requested tier is trivial", (path) => {
      const f = fixture();
      f.catalog.set("github-copilot/virtual-target", {
        ...f.catalog.get("github-copilot/gpt-6.1-sol")!, id: "virtual-target", api: "pi-virtual",
      });
      const raw = altered(`${path}.model`, "virtual-target");
      expect(() => resolveRoute(raw, { classifiedTier: "trivial" }, f.registry))
        .toThrow(`Invalid routing configuration at config.${path}: virtual target`);
    },
  );
});
