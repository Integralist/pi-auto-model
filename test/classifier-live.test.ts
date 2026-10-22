import { ModelRegistry, ModelRuntime } from "@earendil-works/pi-coding-agent";
import { beforeAll, describe, expect, test } from "vitest";
import { resolveTaskRoute } from "../src/policy.ts";

const cases = [
  ["original link request", "moderate", "@~/Desktop/unclickable-text-links.png\n\nthe image shows something I've noticed Pi do regularly, which is display text as links which I can't click on. How can we codify a fix for that?"],
  ["bounded troubleshooting", "moderate", "Pi renders Source labels that I cannot open in Ghostty. Check how its links work and turn the fix into a reusable instruction."],
  ["targeted research", "moderate", "Research how Ghostty opens Pi's links and codify a fix for relative file targets."],
  ["wording-only instruction", "trivial", "Update AGENTS.md to say use absolute file URLs instead of relative links; no investigation needed."],
  ["commit", "trivial", "apply and commit to main"],
  ["feature planning", "complex", "Write a specification and implementation plan for per-project routing overrides, covering policy validation, persistence, migration, and tests."],
  ["architectural research", "complex", "Research alternative model-routing architectures, compare failure modes and trade-offs, and propose a design for our next implementation."],
  ["security design review", "complex", "Review the authentication boundary and threat model of a new cross-provider credential sharing system before implementation."],
] as const;

describe.skipIf(process.env.PI_AUTO_MODEL_LIVE_EVAL !== "1")("live classifier calibration", () => {
  let registry: ModelRegistry;
  beforeAll(async () => { registry = new ModelRegistry(await ModelRuntime.create()); }, 30000);

  test.each(cases.flatMap(([name, tier, text]) => [1, 2].map(attempt => ({ name, tier, text, attempt }))))(
    "$name attempt $attempt", async ({ tier, text }) => {
      const pair = { provider: "github-copilot", model: "gpt-6.1-sol", effort: "high" } as const;
      const result = await resolveTaskRoute(undefined, { task: { kind: "typed", text }, current: pair }, registry);
      expect(result.classification?.outcome).toBe("tier");
      expect(result.classification?.tier).toBe(tier);
    }, 10000,
  );
});
