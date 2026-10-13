import {
  fauxProvider, normalizeContext, type Model, type SimpleStreamOptions,
} from "@earendil-works/pi-ai";
import { githubCopilotProvider } from "@earendil-works/pi-ai/providers/github-copilot";
import { streamSimple as anthropic } from "@earendil-works/pi-ai/api/anthropic-messages";
import { streamSimple as responses } from "@earendil-works/pi-ai/api/openai-responses";
import { expect, test, vi } from "vitest";
import { resolveTaskRoute } from "../src/policy.ts";

test.each([
  { id: "claude-haiku-4.5", limit: 64, actual: 16448, sent: false },
  { id: "gpt-6-luna", limit: 1, actual: 16, sent: false },
  { id: "gpt-6-luna", limit: 64, actual: 64, sent: true },
])("the effective $id payload respects a classifier ceiling of $limit", async ({ id, limit, actual, sent }) => {
  const model = githubCopilotProvider().getModels().find((item) => item.id === id)!;
  expect(model).toBeDefined();
  const fake = fauxProvider({ provider: "offline", models: [{ id: "current", reasoning: true }] });
  const current = fake.models[0]!;
  current.thinkingLevelMap = { high: "high", xhigh: "xhigh" };
  const pair = { provider: "offline", model: "current", effort: "high" };
  const raw = {
    version: 1, mode: "model-and-effort", summaryTier: "trivial",
    tiers: { trivial: pair, moderate: pair, complex: pair, frontier: pair },
    classifier: { provider: model.provider, model: model.id, effort: "high", maxInputChars: 12000, maxOutputTokens: limit, timeoutMs: 10000 },
  };
  const fetch = vi.fn<typeof globalThis.fetch>(async () => { throw new Error("offline transport sentinel"); });
  const payloads: unknown[] = [];
  const requestedEfforts: unknown[] = [];
  const registry: Parameters<typeof resolveTaskRoute>[2] = {
    find: (provider, name) => [model, current].find((item) => item.provider === provider && item.id === name),
    hasConfiguredAuth: () => true,
    getAvailable: () => [model, current],
    streamSimple(target, context, options) {
      requestedEfforts.push(options?.reasoning);
      const guarded: SimpleStreamOptions = {
        ...options, apiKey: "offline-only", fetch, maxRetries: 0,
        onPayload(payload, physical) {
          payloads.push(structuredClone(payload));
          return options?.onPayload?.(payload, physical);
        },
      };
      return target.api === "anthropic-messages"
        ? anthropic(target as Model<"anthropic-messages">, normalizeContext(context), guarded)
        : responses(target as Model<"openai-responses">, normalizeContext(context), guarded);
    },
  };
  const result = await resolveTaskRoute(raw, {
    task: { kind: "typed", text: "draft a PR" },
    current: { ...pair, effort: "high" },
  }, registry);
  expect(requestedEfforts).toEqual(["high"]);
  expect(payloads).toHaveLength(1);
  const payload = payloads[0] as Record<string, unknown>;
  expect(payload.max_tokens ?? payload.max_output_tokens).toBe(actual);
  expect(fetch).toHaveBeenCalledTimes(sent ? 1 : 0);
  expect(result.model.id).toBe("current");
  expect(result.thinkingLevel).toBe("high");
  expect(result.classification?.tier).toBeUndefined();
});
