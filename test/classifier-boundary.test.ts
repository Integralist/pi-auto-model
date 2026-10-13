import { ModelRegistry } from "@earendil-works/pi-coding-agent";
import { fauxAssistantMessage, type SimpleStreamOptions, type TranscriptContext } from "@earendil-works/pi-ai";
import { expect, test } from "vitest";
import { resolveTaskRoute, type PhysicalPair } from "../src/policy.ts";
import { createFixture } from "./support/session.ts";

const sol: PhysicalPair = {
  provider: "github-copilot", model: "gpt-6.1-sol", effort: "xhigh",
};

function payload(messages: TranscriptContext["messages"]) {
  const user = messages.find((message) => message.role === "user");
  expect(typeof user?.content).toBe("string");
  return JSON.parse(user!.content as string);
}

test("native physical classification is isolated from selected Auto and session state", async () => {
  const fixture = await createFixture();
  try {
    const registry = new ModelRegistry(fixture.runtime);
    const auto = fixture.runtime.getModel("github-copilot", "auto");
    expect(auto).toBeDefined();
    await fixture.session.setModel(auto!);
    fixture.respond("main answer");
    await fixture.session.prompt("PRIVATE_MAIN_CONVERSATION");
    const before = {
      messages: structuredClone(fixture.session.messages),
      branch: structuredClone(fixture.session.sessionManager.getBranch()),
      model: fixture.session.model?.id,
      effort: fixture.session.thinkingLevel,
    };
    const observed: { messages: TranscriptContext["messages"]; options?: SimpleStreamOptions; model: string; api: string }[] = [];
    fixture.faux.setResponses([(context, options, _state, model) => {
      observed.push({ messages: structuredClone(context.messages), options, model: model.id, api: model.api });
      return fauxAssistantMessage("moderate");
    }]);
    const usageRecords: unknown[] = [];
    const result = await resolveTaskRoute(undefined, {
      task: { kind: "skill", name: "new-skill", description: "Draft a short PR", content: "POISON_INSTRUCTIONS" },
      current: sol, captured: sol,
    }, registry, { onClassifierUsage: (record) => usageRecords.push(record) });
    expect(result.model.id).toBe("gpt-6-luna");
    expect(result.thinkingLevel).toBe("high");
    expect(observed).toHaveLength(1);
    expect(observed[0]!.model).toBe("gpt-6-luna");
    expect(observed[0]!.api).not.toBe("pi-virtual");
    expect(observed[0]!.options).toMatchObject({ reasoning: "high", maxTokens: 64, maxRetries: 0, toolChoice: "none", cacheRetention: "none" });
    expect(payload(observed[0]!.messages)).toEqual({ kind: "skill", name: "new-skill", description: "Draft a short PR" });
    expect(observed[0]!.messages.flatMap((message) => message.role === "system" ? message.toolsAdded ?? [] : [])).toEqual([]);
    expect(JSON.stringify(observed[0]!.messages)).not.toContain("PRIVATE_MAIN_CONVERSATION");
    expect(JSON.stringify(observed[0]!.messages)).not.toContain("POISON_INSTRUCTIONS");
    expect(usageRecords).toEqual([{ pair: { provider: "github-copilot", model: "gpt-6-luna", effort: "high" }, usage: result.classification!.usage }]);
    expect(result.classification?.usage?.input).toBeGreaterThan(0);
    expect(result.classification?.usage?.output).toBeGreaterThan(0);
    expect(fixture.faux.state.callCount).toBe(2);
    expect({
      messages: fixture.session.messages,
      branch: fixture.session.sessionManager.getBranch(),
      model: fixture.session.model?.id,
      effort: fixture.session.thinkingLevel,
    }).toEqual(before);
    fixture.respond("unchanged main route");
    await fixture.session.prompt("main follow-up");
    const main = fixture.session.messages.filter((message) => message.role === "assistant").at(-1);
    expect(main?.model).toBe("gpt-6.1-sol");
    expect(main?.thinkingLevel).toBe("xhigh");
    expect(fixture.errors).toEqual([]);
  } finally {
    fixture.close();
  }
});

test.each([
  ["plan a new feature", "complex", "gpt-6.1-sol", "xhigh"],
  ["implement the approved task list", "complex", "gpt-6.1-sol", "xhigh"],
  ["debug authentication", "complex", "gpt-6.1-sol", "xhigh"],
  ["draft a short PR description", "moderate", "gpt-6-luna", "high"],
  ["summarize the completed work", "trivial", "gpt-6-luna", "high"],
])("native classifier observes only the typed task: %s", async (text, tier, model, effort) => {
  const fixture = await createFixture();
  try {
    const observed: unknown[] = [];
    fixture.faux.setResponses([(context) => {
      observed.push(payload(context.messages));
      return fauxAssistantMessage(tier);
    }]);
    const input = { task: { kind: "typed" as const, text }, current: sol, captured: sol };
    const before = structuredClone(input);
    const result = await resolveTaskRoute(undefined, input, new ModelRegistry(fixture.runtime));
    expect(result.model.id).toBe(model);
    expect(result.thinkingLevel).toBe(effort);
    expect(result.classification?.tier).toBe(tier);
    expect(observed).toEqual([{ kind: "typed", text }]);
    expect(input).toEqual(before);
    expect(fixture.session.messages).toEqual([]);
    expect(fixture.session.model?.id).toBe("gpt-6.1-sol");
    expect(fixture.faux.state.callCount).toBe(1);
  } finally {
    fixture.close();
  }
});

test("native error response retains physical evidence and separate observed usage", async () => {
  const fixture = await createFixture();
  try {
    fixture.faux.setResponses([fauxAssistantMessage("failed", { stopReason: "error", errorMessage: "offline error" })]);
    const result = await resolveTaskRoute(undefined, {
      task: { kind: "typed", text: "new task" }, current: sol,
    }, new ModelRegistry(fixture.runtime));
    expect(result.model.id).toBe("gpt-6.1-sol");
    expect(result.thinkingLevel).toBe("xhigh");
    expect(result.source).toBe("current");
    expect(result.classification?.tier).toBeUndefined();
    expect(result.classification?.usage?.input).toBeGreaterThan(0);
    expect(fixture.session.messages).toEqual([]);
  } finally {
    fixture.close();
  }
});
