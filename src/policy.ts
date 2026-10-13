import {
  getSupportedThinkingLevels,
  type Api,
  type Model,
  type ModelThinkingLevel,
} from "@earendil-works/pi-ai";
import { parseFrontmatter, type ModelRegistry } from "@earendil-works/pi-coding-agent";

export type Tier = "trivial" | "moderate" | "complex" | "frontier";
export type AutomaticEffort = Exclude<ModelThinkingLevel, "max">;
export type PhysicalPair = {
  provider: string;
  model: string;
  effort: AutomaticEffort;
};
export type RoutingRegistry = Pick<ModelRegistry, "find" | "hasConfiguredAuth">;
export type RouteInput = {
  skillContent?: string;
  classifiedTier?: unknown;
  current?: PhysicalPair;
  captured?: PhysicalPair;
  direct?: boolean;
};
export type RouteDecision = {
  model: Model<Api>;
  thinkingLevel: AutomaticEffort;
  tier?: Tier;
  source: "tier" | "current" | "captured";
};

type Configuration = {
  version: 1;
  mode: "model-and-effort" | "effort-only";
  summaryTier: Tier;
  tiers: Record<Tier, PhysicalPair>;
  classifier: PhysicalPair & {
    maxInputChars: number;
    maxOutputTokens: number;
    timeoutMs: number;
  };
};

const tiers: readonly Tier[] = ["trivial", "moderate", "complex", "frontier"];
const efforts: readonly AutomaticEffort[] = ["off", "minimal", "low", "medium", "high", "xhigh"];
const defaults: Configuration = {
  version: 1,
  mode: "model-and-effort",
  summaryTier: "trivial",
  tiers: {
    trivial: { provider: "github-copilot", model: "gpt-6-luna", effort: "high" },
    moderate: { provider: "github-copilot", model: "gpt-6-luna", effort: "high" },
    complex: { provider: "github-copilot", model: "gpt-6.1-sol", effort: "xhigh" },
    frontier: { provider: "github-copilot", model: "gpt-6.1-sol", effort: "xhigh" },
  },
  classifier: {
    provider: "github-copilot", model: "gpt-6-luna", effort: "high",
    maxInputChars: 12000, maxOutputTokens: 64, timeoutMs: 10000,
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalid(path: string, detail: string): never {
  throw new Error(`Invalid routing configuration at ${path}: ${detail}. Correct this setting before using Auto.`);
}

function object(value: unknown, path: string, keys: readonly string[]) {
  if (!isRecord(value)) invalid(path, "expected an object");
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) invalid(`${path}.${key}`, "unknown or conflicting field");
  }
  for (const key of keys) {
    if (!Object.hasOwn(value, key)) invalid(`${path}.${key}`, "missing required field");
  }
  return value;
}

function identifier(value: unknown, path: string): string {
  if (typeof value !== "string" || !value || /\s/.test(value)) {
    invalid(path, "expected an exact nonempty identifier without whitespace");
  }
  return value;
}

function effort(value: unknown, path: string): AutomaticEffort {
  if (typeof value !== "string" || !efforts.includes(value as AutomaticEffort)) {
    invalid(path, "expected an automatic effort other than max");
  }
  return value as AutomaticEffort;
}

function normalizeTier(value: unknown): Tier | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  return tiers.includes(normalized as Tier) ? normalized as Tier : undefined;
}

function pair(value: Record<string, unknown>, path: string, registry: RoutingRegistry): PhysicalPair {
  const result = {
    provider: identifier(value.provider, `${path}.provider`),
    model: identifier(value.model, `${path}.model`),
    effort: effort(value.effort, `${path}.effort`),
  };
  if (registry.find(result.provider, result.model)?.api === "pi-virtual") {
    invalid(path, `virtual target ${result.provider}/${result.model}; select a physical target`);
  }
  return result;
}

function positiveInteger(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    invalid(path, "expected a positive safe integer");
  }
  return value;
}

function configuration(raw: unknown, registry: RoutingRegistry): Configuration {
  const root = object(raw === undefined ? defaults : raw, "config", [
    "version", "tiers", "classifier", "summaryTier", "mode",
  ]);
  if (root.version !== 1) invalid("config.version", "expected schema version 1");
  if (root.mode !== "model-and-effort" && root.mode !== "effort-only") {
    invalid("config.mode", "expected model-and-effort or effort-only");
  }
  if (typeof root.summaryTier !== "string" || !tiers.includes(root.summaryTier as Tier)) {
    invalid("config.summaryTier", "expected an exact tier name");
  }
  const rawTiers = object(root.tiers, "config.tiers", tiers);
  const validatedTiers = {} as Record<Tier, PhysicalPair>;
  for (const tier of tiers) {
    const path = `config.tiers.${tier}`;
    validatedTiers[tier] = pair(object(rawTiers[tier], path, ["provider", "model", "effort"]), path, registry);
  }
  const rawClassifier = object(root.classifier, "config.classifier", [
    "provider", "model", "effort", "maxInputChars", "maxOutputTokens", "timeoutMs",
  ]);
  return {
    version: 1,
    mode: root.mode,
    summaryTier: root.summaryTier as Tier,
    tiers: validatedTiers,
    classifier: {
      ...pair(rawClassifier, "config.classifier", registry),
      maxInputChars: positiveInteger(rawClassifier.maxInputChars, "config.classifier.maxInputChars"),
      maxOutputTokens: positiveInteger(rawClassifier.maxOutputTokens, "config.classifier.maxOutputTokens"),
      timeoutMs: positiveInteger(rawClassifier.timeoutMs, "config.classifier.timeoutMs"),
    },
  };
}

function metadataTier(content: string | undefined): Tier | undefined {
  if (content === undefined) return undefined;
  try {
    const parsed: unknown = parseFrontmatter(content).frontmatter;
    return isRecord(parsed) && isRecord(parsed.metadata)
      ? normalizeTier(parsed.metadata["model-tier"]) : undefined;
  } catch {
    // Malformed frontmatter is absent metadata, not a failed routing request.
    return undefined;
  }
}

function physicalModel(value: PhysicalPair | undefined, registry: RoutingRegistry): Model<Api> | undefined {
  if (!value || typeof value.provider !== "string" || typeof value.model !== "string") return undefined;
  const model = registry.find(value.provider, value.model);
  return model?.api === "pi-virtual" ? undefined : model;
}

function evidence(value: PhysicalPair | undefined, registry: RoutingRegistry): RouteDecision | undefined {
  const model = physicalModel(value, registry);
  if (!model || !value || !efforts.includes(value.effort)) return undefined;
  if (!getSupportedThinkingLevels(model).includes(value.effort)) return undefined;
  return { model, thinkingLevel: value.effort, source: "current" };
}

export function resolveRoute(
  rawConfiguration: unknown,
  input: RouteInput,
  registry: RoutingRegistry,
): RouteDecision {
  const config = configuration(rawConfiguration, registry);
  const fixed = config.mode === "effort-only" ? physicalModel(input.captured, registry) : undefined;
  if (config.mode === "effort-only" && !fixed) {
    throw new Error("Select a physical model before enabling effort-only routing; no captured model is known.");
  }
  const selectedTier = input.direct ? config.summaryTier
    : metadataTier(input.skillContent) ?? normalizeTier(input.classifiedTier);
  if (selectedTier) {
    for (let index = tiers.indexOf(selectedTier); index >= 0; index--) {
      const tier = tiers[index]!;
      const candidate = config.tiers[tier];
      const model = fixed ?? registry.find(candidate.provider, candidate.model);
      if (!model || model.api === "pi-virtual" || !registry.hasConfiguredAuth(model)) continue;
      if (!getSupportedThinkingLevels(model).includes(candidate.effort)) continue;
      return { model, thinkingLevel: candidate.effort, tier, source: "tier" };
    }
  }
  for (const source of ["current", "captured"] as const) {
    const retained = evidence(input[source], registry);
    if (!retained) continue;
    if (fixed && (retained.model.provider !== fixed.provider || retained.model.id !== fixed.id)) continue;
    return { ...retained, source };
  }
  throw new Error("Select an available physical model and effort before enabling Auto; no usable active or captured physical pair is known.");
}
