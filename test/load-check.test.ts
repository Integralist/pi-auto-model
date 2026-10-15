import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { SessionManager, VIRTUAL_MODEL_STATE_ENTRY } from "@earendil-works/pi-coding-agent";
import { expect, test } from "vitest";
import { createFixture } from "./support/session.ts";

test("the manifest extension entry is importable without enabling automation", async () => {
  const manifest = JSON.parse(readFileSync("package.json", "utf8")) as { pi: { extensions: string[] }; dependencies?: unknown };
  expect(manifest.dependencies).toBeUndefined();
  expect(manifest.pi.extensions).toHaveLength(1);
  for (const entry of manifest.pi.extensions) {
    const loaded: unknown = (await import(pathToFileURL(resolve(entry)).href)).default;
    expect(typeof loaded).toBe("function");
  }
  const f = await createFixture();
  try {
    expect(f.session.model?.id).toBe("gpt-6.1-sol");
    expect(f.runtime.getModel("pi-auto-model", "auto")?.api).toBe("pi-virtual");
    expect(f.faux.state.callCount).toBe(0); expect(f.errors).toEqual([]);
  } finally { f.close(); }
});

test("successful native state is portable JSON containing physical current and captured pairs", async () => {
  const f = await createFixture({ skills: [{ name: "small", description: "Small", tier: "trivial" }] });
  try {
    await f.session.setModel(f.runtime.getModel("pi-auto-model", "auto")!);
    f.respond(); await f.session.prompt("/skill:small");
    const entry = f.session.sessionManager.getBranch().findLast((item) => item.type === "custom" && item.customType === VIRTUAL_MODEL_STATE_ENTRY);
    assert.ok(entry?.type === "custom");
    const decoded = JSON.parse(JSON.stringify(entry.data)) as { state: unknown };
    expect(decoded.state).toEqual({
      version: 1,
      current: { provider: "github-copilot", model: "gpt-6-luna", effort: "high" },
      captured: { provider: "github-copilot", model: "gpt-6.1-sol", effort: "xhigh" },
      tier: "trivial",
    });
    expect(f.session.messages.some((message) => message.role === "custom")).toBe(false);
  } finally { f.close(); }
});

test.each([
  { label: "null", value: null },
  { label: "unknown version", value: { version: 2, current: { provider: "github-copilot", model: "gpt-6.1-sol", effort: "xhigh" } } },
  { label: "virtual current", value: { version: 1, current: { provider: "pi-auto-model", model: "auto", effort: "high" } } },
  { label: "automatic max", value: { version: 1, current: { provider: "github-copilot", model: "gpt-6.1-sol", effort: "max" } } },
])("invalid saved native state $label cannot fabricate physical evidence", async ({ value }) => {
  const manager = SessionManager.inMemory();
  manager.appendModelChange("pi-auto-model", "auto");
  manager.appendThinkingLevelChange("xhigh");
  manager.appendCustomEntry(VIRTUAL_MODEL_STATE_ENTRY, { provider: "pi-auto-model", modelId: "auto", state: value });
  manager.appendMessage({ role: "user", content: "seed", timestamp: 0 });
  const f = await createFixture({ restore: true, sessionManager: manager });
  try {
    expect(f.session.model?.id).toBe("auto");
    f.respond("unknown"); await f.session.prompt("new task");
    const response = f.session.messages.filter((message) => message.role === "assistant").at(-1)!;
    expect(response.stopReason).toBe("error");
    expect(response.errorMessage).toMatch(/Select an available physical model and effort/);
    expect(f.faux.state.callCount).toBe(1);
  } finally { f.close(); }
});
