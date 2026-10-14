# Auto Model Controls — Slice 2 Historical Task List

- **Status:** Historical checkpoint — the initial review was blocked by eleven
  findings; its on/off, restoration and enabled-state scope is superseded by
  `release-scope.md`.
- **Author:** Integralist
- **Created:** 2026-10-14
- **Language:** TypeScript
- **Source:** [Slice2](./plan.md#slice-2-quiet-controls-persistence-and-restoration),
  [specification](./spec.md), [approved configuration addendum](./configuration-addendum.md)
- **Stable keys:** `slice-2/task-1`, `slice-2/task-2`
- **Approved payload:** /tmp/pi-auto-model-controls-implementation.y7f8rh/proposal.json
- **Approved baseline:** `3031a1d6fec44a5e31953d6af323dbb4ee7feb77`

> [!IMPORTANT]
> This list records an earlier controls design. The current release uses Pi's
> `/model` picker and the scope in `release-scope.md`. Do not use these task
> checkboxes or original control requirements as the current release gate.
> Consult the execution record's current stage and verification outcomes.

## Summary

Users need to turn routing on or off without losing their manual selection.
This slice adds saved controls and model mappings, exact physical restoration
and quiet switch feedback. Routing can use configured providers without a
Copilot account; controls never replace an active task's physical pair.

## Pull Request Delivery

- **Mode:** Single PR for router work; peer compatibility has independent delivery.
- **Branch:** `integralist/auto-model`
- **Base:** Existing authorized feature branch, parent3031a1d.
- **Tasks:** Task1 implementation, Task2 verification.
- **No Git changes:** Workers do not stage/commit, switch, push or submit.

## How to execute this list

Work top to bottom, one task at a time; do not skip ahead. For each task:

1. Find its layer in Pull Request Delivery. Use the recorded branch; return
   branch/index mismatches before editing.
2. Add the Test (red) exactly as written and confirm assertion failure.
3. Add the Implementation (green) as written.
4. Run Verify and confirm it passes.
5. Return evidence. Only the coordinator updates task checkboxes or commits.

For coordinated execution, apply this protocol only to the assigned task.
Reading the document does not authorize later tasks, markers or live probes.

The passing test is the contract. Do not change test expectations to match
the code. Material fixes outside the approved payload return to the coordinator
for a concrete per-diff approval. Preserve partial work and logs if blocked.

## Context for the executor

- `extensions/auto-model.ts:126`: native virtual registration and route;
  active branch/owned-input controls from Slice1 are accepted.
- `src/policy.ts:56`: strict configuration validation; actual route pairs keep
  exact supported non-max effort and known-pair retention.
- `test/support/session.ts:31`: native SDK/SessionOwner/faux-provider fixture.
  New optional setup/UI/physicalProvider seams are in the approved payload.
- `package.json`: pi extension manifest. Pi-tui1.2.0 is already installed
  through the host; add only the approved peer metadata root entry.
- The exact21-file final payload and source hashes are frozen in the checkpoint.
  Existing files match `before.json`; use Edit with precise replacements.
  New files use Write. Large package-lock changes are expressly excluded.
- Source plan/spec/addendum, other tests, Makefile and installed SDK are protected.
  The coordinator's two pending evidence documents are pre-existing changes.
- Use one strict Copilot Luna/xhigh worker at80 turns, no fallback, only Task1.
  Sol/xhigh owns design, diagnosis, task acceptance and independent review.
- Native offline provider calls are allowed; real credentials/network, global
  settings, installs, live terminal UI and other repos are not.
- Popup handles are directly owned public TUI entries, not custom completion
  callbacks. No private renderer/host field or host patch is authorized.
- Policy JSON and enabled/mode JSON are separate; session branch entries store
  portable physical restore identities, never provider objects or credentials.

## Milestone coverage

| Source | Tasks | Outcome verification |
| --- | --- | --- |
| M2.1 | Task1, Task2 | Native on/off/mode/status/configure, manual model/effort, deferred controls and terminal shortcut; reject new active-task ownership |
| M2.2 | Task1, Task2 | Exact atomic files, saved fresh/resume/tree/reload/compaction state and original physical restoration |
| M2.3 | Task1, Task2 | Corrupt/missing/invalid state, unavailable exact restore, cancellation/shutdown and stale-origin safe failure |
| M2.4 | Task1, Task2 | Model/effort-only popup, replacement/expiry, input/focus and newer-dialog isolation, headless/disabled/failure cleanup; separately approved live terminal gate |
| R61–R65 | Task1, Task2 | Provider-labeled physical search, exact effort, atomic review/save/cancel, all-five non-Copilot mappings plus summary/classifier, empty/stale/headless/busy guidance |

Accepted M1.1–M1.4 outcomes remain protected. Task1 checks alone do not accept
M2 milestones. All22 S2/addendum criteria keep their original ledger IDs.

## Tasks

### Task1: Implement controls, saved mappings and scoped popups

- **Key:** `slice-2/task-1`
- **Supports:** M2.1–M2.4, R61–R65
- **Delivers:** Native controls/model configuration, durable exact restoration
  and quiet physical-pair feedback without implicit enabling or provider setup.
- **Location:** Exactly the21 files in checkpoint `manifest.json`.
- **Payload authority:** Verbatim `proposal.json.files` plus its one precise
  `exactEdits` package-lock root replacement; immutable `final/` copies.
- **Approval:** User approved the1482-line combined diff plus60 new cases;
  the previous plan design gate is not being reused as code approval.
- **Excluded:** Task2 acceptance, source milestones, compatibility and release.

#### Stub/signature and assertion-red

1. Add the new UI helper and60 tests below, approved existing test namespace
   and fresh-enabled expectation changes, optional fixture hooks, package peer
   metadata and policy/schema/export/extension wiring.
2. Add the four inert stubs below instead of their final implementations.
   Commands must be registered and neutral Auto selectable, so red exercises
   caller behavior rather than undefined symbols/model/import/compilation.
3. Run `make typecheck`, then
   `make test-unit TEST_FILTER='test/settings.test.ts test/controls.test.ts test/popup.test.ts'`.
   Prove representative assertions reach native controls, settings files,
   catalog filtering, exact restoration and owned overlays. Missing imports,
   unregistered commands or unknown models do not establish red.
4. Record actual counts/exits, not the expected60-case total as a substitute.

### `test/settings.test.ts`

```typescript
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fauxProvider } from "@earendil-works/pi-ai";
import { expect, test } from "vitest";
import { validateConfiguration, type RoutingRegistry } from "../src/policy.ts";
import { automaticEfforts, formatPair, physicalCatalog, readSettings, validateMappings, validatePreferences, writeSettings } from "../src/settings.ts";

function registry(): RoutingRegistry {
  const one = fauxProvider({ provider: "one", models: [{ id: "alpha", name: "Alpha writer", reasoning: true }] });
  const two = fauxProvider({ provider: "two", models: [{ id: "beta", name: "Beta thinker", reasoning: true }] });
  one.models[0]!.thinkingLevelMap = { high: "high", xhigh: null };
  two.models[0]!.thinkingLevelMap = { high: "high", xhigh: "xhigh" };
  const virtual = { ...one.models[0]!, provider: "pi-auto-model", id: "auto", api: "pi-virtual" };
  const models = [...one.models, ...two.models, virtual];
  return {
    getAvailable: () => models,
    find: (provider, id) => models.find((model) => model.provider === provider && model.id === id),
    hasConfiguredAuth: (model) => model.provider !== "missing",
  };
}

test.each(["one", "alpha", "writer", "one alpha"])("physical catalog search matches %s and excludes virtual entries", (search) => {
  const r = registry();
  expect(physicalCatalog(r, search).map((model) => model.provider + "/" + model.id)).toEqual(["one/alpha"]);
  expect(physicalCatalog(r).map((model) => model.id)).toEqual(["alpha", "beta"]);
  expect(physicalCatalog(r, "absent")).toEqual([]);
});

test("automatic effort offers exact supported non-max values", () => {
  expect(automaticEfforts(registry().find("one", "alpha")!)).toEqual(["off", "high"]);
  expect(formatPair({ provider: "one", model: "alpha", effort: "high" })).toBe("one/alpha (high)");
});

test.each([null, [], {}, { version: 2, enabled: true, mode: "effort-only" },
  { version: 1, enabled: "true", mode: "model-and-effort" },
  { version: 1, enabled: false, mode: "other" },
  { version: 1, enabled: false, mode: "effort-only", extra: true }])("invalid preferences are actionable (%j)", (raw) => {
  expect(() => validatePreferences(raw)).toThrow(/Invalid Auto preferences/);
});

test.each(["model-and-effort", "effort-only"])("preferences retain enabled and %s mode exactly", (mode) => {
  expect(validatePreferences({ version: 1, enabled: true, mode })).toEqual({ version: 1, enabled: true, mode });
});

test.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, "10000"])("popup duration rejects %s", (durationMs) => {
  const r = registry(), raw = { ...validateConfiguration(undefined, r), switchPopup: { enabled: true, durationMs } };
  expect(() => validateConfiguration(raw, r)).toThrow(/switchPopup.durationMs/);
});

test("popup defaults are opt-out and unchanged by loading legacy policy", () => {
  const r = registry(), raw = validateConfiguration(undefined, r);
  expect(raw.switchPopup).toEqual({ enabled: true, durationMs: 10000 });
  const { switchPopup: _popup, ...old } = raw;
  expect(validateConfiguration(old, r).switchPopup).toEqual(raw.switchPopup);
  expect(() => validateConfiguration({ ...raw, switchPopup: { enabled: "yes", durationMs: 10000 } }, r)).toThrow(/switchPopup.enabled/);
});

test("validated catalog-backed mappings preserve summary, bounds, mode and popup", () => {
  const r = registry(), raw = validateConfiguration(undefined, r), pair = { provider: "two", model: "beta", effort: "high" };
  for (const tier of Object.keys(raw.tiers) as (keyof typeof raw.tiers)[]) raw.tiers[tier] = { ...pair, effort: "high" };
  raw.classifier = { ...raw.classifier, ...pair, effort: "high" };
  expect(validateMappings(raw, r)).toEqual(raw);
  raw.classifier.effort = "xhigh";
  expect(validateMappings(raw, r).classifier.effort).toBe("xhigh");
  raw.classifier.model = "missing";
  expect(() => validateMappings(raw, r)).toThrow(/Unavailable exact Auto mapping/);
});

test("settings reads distinguish absence, bad JSON and inaccessible file types", async () => {
  const dir = mkdtempSync(join(tmpdir(), "auto-settings-"));
  try {
    expect(await readSettings(join(dir, "absent.json"))).toBeUndefined();
    writeFileSync(join(dir, "bad.json"), "{");
    await expect(readSettings(join(dir, "bad.json"))).rejects.toThrow(/Correct or remove/);
    await expect(readSettings(dir)).rejects.toThrow(/Correct or remove/);
    writeFileSync(join(dir, "valid.json"), '{"a":1}');
    expect(await readSettings(join(dir, "valid.json"))).toEqual({ a: 1 });
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("atomic settings save replaces the complete file with restrictive permissions and cleans temporary files", async () => {
  const dir = mkdtempSync(join(tmpdir(), "auto-settings-")), path = join(dir, "policy.json");
  try {
    writeFileSync(path, '{"old":true}');
    await writeSettings(path, { next: true });
    expect(JSON.parse(readFileSync(path, "utf8"))).toEqual({ next: true });
    expect(statSync(path).mode & 0o777).toBe(0o600);
    expect(readdirSync(dir)).toEqual(["policy.json"]);
    await expect(writeSettings(path, { bad: true }, () => false)).rejects.toThrow(/Previous settings are unchanged/);
    expect(JSON.parse(readFileSync(path, "utf8"))).toEqual({ next: true });
    expect(readdirSync(dir)).toEqual(["policy.json"]);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("atomic rename failure preserves the previous path and removes its temporary file", async () => {
  const dir = mkdtempSync(join(tmpdir(), "auto-settings-")), path = join(dir, "destination");
  try {
    mkdirSync(path); writeFileSync(join(path, "old"), "keep");
    await expect(writeSettings(path, { bad: true })).rejects.toThrow(/Previous settings are unchanged/);
    expect(readFileSync(join(path, "old"), "utf8")).toBe("keep");
    expect(readdirSync(dir)).toEqual(["destination"]);
    await expect(writeSettings(join(path, "old", "nested.json"), {})).rejects.toThrow();
    expect(readFileSync(join(path, "old"), "utf8")).toBe("keep");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
```

### `test/controls.test.ts`

```typescript
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ModelRegistry, SessionManager } from "@earendil-works/pi-coding-agent";
import { fauxAssistantMessage } from "@earendil-works/pi-ai";
import { expect, test } from "vitest";
import { validateConfiguration } from "../src/policy.ts";
import { createFixture, type Fixture } from "./support/session.ts";
import { createUI } from "./support/ui.ts";

const small = { name: "small", description: "Small work", tier: "trivial" };
const hard = { name: "hard", description: "Hard work", tier: "complex" };
const last = (f: Fixture) => f.session.messages.filter((message) => message.role === "assistant").at(-1)!;
const wait = async (check: () => boolean) => { await expect.poll(check).toBe(true); };
function gate() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => { release = resolve; });
  return { promise, release };
}

test("controls are opt-in and disabling restores both pre-enable settings", async () => {
  const f = await createFixture({ skills: [small] });
  try {
    expect(f.session.model?.id).toBe("gpt-6.1-sol"); expect(f.faux.state.callCount).toBe(0);
    await f.session.prompt("/automodel on"); expect(f.session.model?.provider).toBe("pi-auto-model");
    f.respond(); await f.session.prompt("/skill:small");
    expect(last(f).model).toBe("gpt-6-luna"); expect(last(f).thinkingLevel).toBe("high");
    await f.session.prompt("/automodel off");
    expect(f.session.model?.id).toBe("gpt-6.1-sol"); expect(f.session.thinkingLevel).toBe("xhigh");
    expect(JSON.parse(readFileSync(join(f.dir, "pi-auto-model-state.json"), "utf8")))
      .toEqual({ version: 1, enabled: false, mode: "model-and-effort" });
    expect(f.session.messages.some((message) => message.role === "custom")).toBe(false);
  } finally { f.close(); }
});

test("manual physical selection disables Auto without overwriting the new choice", async () => {
  const f = await createFixture();
  try {
    await f.session.prompt("/automodel on");
    await f.session.setModel(f.faux.getModel("gpt-6-luna")!);
    f.session.setThinkingLevel("high");
    f.respond(); await f.session.prompt("new physical task");
    expect(f.session.model?.id).toBe("gpt-6-luna"); expect(last(f).thinkingLevel).toBe("high");
    expect(f.faux.state.callCount).toBe(1);
    expect(JSON.parse(readFileSync(join(f.dir, "pi-auto-model-state.json"), "utf8")).enabled).toBe(false);
  } finally { f.close(); }
});

test("manual effort disables Auto on its current physical model, not its original restore model", async () => {
  const f = await createFixture({ skills: [small] });
  try {
    await f.session.prompt("/automodel on"); f.respond(); await f.session.prompt("/skill:small");
    f.session.setThinkingLevel("xhigh");
    await wait(() => f.session.model?.id === "gpt-6-luna" && f.session.thinkingLevel === "xhigh");
    f.respond(); await f.session.prompt("new physical task");
    expect(last(f).model).toBe("gpt-6-luna"); expect(last(f).thinkingLevel).toBe("xhigh");
    expect(f.faux.state.callCount).toBe(2);
  } finally { f.close(); }
});

test("mode controls capture the known physical model and fresh sessions retain enabled/mode preferences", async () => {
  const f = await createFixture({ skills: [small] });
  try {
    await f.session.prompt("/automodel mode effort-only"); await f.session.prompt("/automodel on");
    f.respond(); await f.session.prompt("/skill:small");
    expect(last(f).model).toBe("gpt-6.1-sol"); expect(last(f).thinkingLevel).toBe("high");
    await f.owner.newSession();
    expect(f.session.model?.provider).toBe("pi-auto-model");
    f.respond(); await f.session.prompt("/skill:small");
    expect(last(f).model).toBe("gpt-6.1-sol"); expect(last(f).thinkingLevel).toBe("high");
    await f.session.prompt("/automodel off");
    expect(f.session.model?.id).toBe("gpt-6.1-sol"); expect(f.session.thinkingLevel).toBe("xhigh");
  } finally { f.close(); }
});

test("resume keeps JSON-portable physical restore state rather than recapturing the virtual selection", async () => {
  const first = await createFixture({ skills: [small] }); let restored: Fixture | undefined;
  try {
    await first.session.prompt("/automodel on"); first.respond(); await first.session.prompt("/skill:small");
    const manager = SessionManager.inMemory(undefined, undefined,
      [first.session.sessionManager.getHeader()!, ...JSON.parse(JSON.stringify(first.session.sessionManager.getEntries()))]);
    restored = await createFixture({ restore: true, sessionManager: manager, skills: [small] });
    expect(restored.session.model?.provider).toBe("pi-auto-model");
    await restored.session.prompt("/automodel off");
    expect(restored.session.model?.id).toBe("gpt-6.1-sol"); expect(restored.session.thinkingLevel).toBe("xhigh");
    expect(restored.faux.state.callCount).toBe(0);
  } finally { restored?.close(); first.close(); }
});

test("busy controls return without waiting and apply only after the task has safely settled", async () => {
  const started = gate(), finish = gate();
  const f = await createFixture({ skills: [small] });
  try {
    await f.session.prompt("/automodel on");
    f.faux.setResponses([async () => { started.release(); await finish.promise; return fauxAssistantMessage("main"); }]);
    const pending = f.session.prompt("/skill:small"); await started.promise;
    await f.session.prompt("/automodel off");
    expect(f.session.model?.id).toBe("auto"); expect(f.session.isStreaming).toBe(true);
    finish.release(); await pending;
    expect(last(f).model).toBe("gpt-6-luna"); expect(last(f).thinkingLevel).toBe("high");
    await wait(() => f.session.model?.id === "gpt-6.1-sol");
    expect(f.session.thinkingLevel).toBe("xhigh"); expect(f.faux.state.callCount).toBe(1);
  } finally { finish.release(); f.close(); }
});

test("corrupt policy reports its path and sends no automatic request", async () => {
  const display = createUI(), f = await createFixture({ ui: display.ui, mode: "tui", setup: (dir) => writeFileSync(join(dir, "pi-auto-model.json"), "{") });
  try {
    await f.session.prompt("/automodel on");
    expect(f.session.model?.id).toBe("gpt-6.1-sol"); expect(f.faux.state.callCount).toBe(0);
    expect(display.notices.map((notice) => notice.text).join("\n")).toMatch(/pi-auto-model.json.*Correct or remove/);
    expect(readdirSync(f.dir)).not.toContain("pi-auto-model-state.json");
  } finally { f.close(); }
});

test("unavailable exact restoration is actionable and never selects another pair", async () => {
  const display = createUI(), f = await createFixture({ ui: display.ui, mode: "tui", skills: [small] });
  try {
    await f.session.prompt("/automodel on"); f.respond(); await f.session.prompt("/skill:small");
    f.faux.getModel("gpt-6.1-sol")!.thinkingLevelMap = { xhigh: null, high: "high" };
    await f.session.prompt("/automodel off");
    expect(f.session.model?.id).toBe("auto");
    expect(display.notices.at(-1)?.text).toMatch(/Cannot restore exact.*xhigh/);
    expect(f.faux.state.callCount).toBe(1);
  } finally { f.close(); }
});

test("headless configuration gives file guidance without selecting or writing anything", async () => {
  const f = await createFixture();
  try {
    const before = readdirSync(f.dir);
    await f.session.prompt("/automodel configure");
    expect(readdirSync(f.dir)).toEqual(before);
    expect(f.session.model?.id).toBe("gpt-6.1-sol"); expect(f.faux.state.callCount).toBe(0);
  } finally { f.close(); }
});

test("interactive model mapping cancel preserves policy and enabled/mode preferences", async () => {
  const display = createUI(), f = await createFixture({ ui: display.ui, mode: "tui" });
  try {
    await f.session.prompt("/automodel mode effort-only");
    const state = readFileSync(join(f.dir, "pi-auto-model-state.json"), "utf8");
    display.answers.push("Cancel");
    await f.session.prompt("/automodel configure");
    expect(readFileSync(join(f.dir, "pi-auto-model-state.json"), "utf8")).toBe(state);
    expect(readdirSync(f.dir)).not.toContain("pi-auto-model.json");
    expect(f.session.model?.id).toBe("gpt-6.1-sol"); expect(f.faux.state.callCount).toBe(0);
  } finally { f.close(); }
});

test("all five catalog mappings save without credentials or hidden Copilot dispatch, including summaries and reload", async () => {
  const display = createUI(), physicalProvider = "offline-other";
  const f = await createFixture({ physicalProvider, ui: display.ui, mode: "tui", skills: [small, hard] });
  try {
    const raw = validateConfiguration(undefined, new ModelRegistry(f.runtime));
    const pair = { provider: physicalProvider, model: "gpt-6-luna", effort: "high" as const };
    for (const slot of ["trivial", "moderate", "complex", "frontier", "classifier"] as const) {
      const label = slot + ": " + (slot === "classifier" ? raw.classifier.provider + "/" + raw.classifier.model + " (" + raw.classifier.effort + ")"
        : raw.tiers[slot].provider + "/" + raw.tiers[slot].model + " (" + raw.tiers[slot].effort + ")");
      display.answers.push(label, physicalProvider, physicalProvider + "/gpt-6-luna — gpt-6-luna", "high");
    }
    display.answers.push("Review and save", true);
    await f.session.prompt("/automodel configure");
    const saved = JSON.parse(readFileSync(join(f.dir, "pi-auto-model.json"), "utf8"));
    expect(Object.values(saved.tiers)).toEqual([pair, pair, pair, pair]);
    expect(saved.classifier).toEqual({ ...pair, maxInputChars: 12000, maxOutputTokens: 64, timeoutMs: 10000 });
    expect(saved.switchPopup).toEqual({ enabled: true, durationMs: 10000 }); expect(saved.summaryTier).toBe("trivial");
    expect(f.session.model?.provider).toBe(physicalProvider); expect(f.faux.state.callCount).toBe(0);
    expect(f.runtime.hasConfiguredAuth("github-copilot")).toBe(false);
    await f.session.prompt("/automodel on"); f.respond(); await f.session.prompt("/skill:hard");
    expect(last(f).provider).toBe(physicalProvider); expect(last(f).model).toBe(pair.model);
    await f.session.reload();
    f.faux.setResponses([fauxAssistantMessage("complex"), fauxAssistantMessage("main")]);
    await f.session.prompt("implement a parser");
    expect(last(f).provider).toBe(physicalProvider); expect(last(f).thinkingLevel).toBe("high");
    f.respond("summary");
    const summary = await new ModelRegistry(f.runtime).streamSimple(f.runtime.getModel("pi-auto-model", "auto")!, {
      messages: [{ role: "user", content: "summary", timestamp: 0 }],
    }).result();
    expect(summary.provider).toBe(physicalProvider); expect(summary.model).toBe(pair.model);
    expect(f.faux.state.callCount).toBe(4);
  } finally { f.close(); }
});

test("empty configured catalog and stale selected pair never save a draft", async () => {
  const display = createUI(), f = await createFixture({ ui: display.ui, mode: "tui" });
  try {
    f.runtime.registerNativeProvider({ ...f.faux.provider, filterModels: () => [] });
    await f.runtime.refresh({ allowNetwork: false });
    await f.session.prompt("/automodel configure");
    expect(display.notices.at(-1)?.text).toMatch(/No physical models are available/);
    expect(readdirSync(f.dir)).not.toContain("pi-auto-model.json"); expect(f.faux.state.callCount).toBe(0);
  } finally { f.close(); }
});

test("failed policy save preserves separate preferences and does not implicitly select Auto", async () => {
  const display = createUI(), f = await createFixture({ ui: display.ui, mode: "tui" });
  try {
    await f.session.prompt("/automodel mode effort-only");
    const prefs = readFileSync(join(f.dir, "pi-auto-model-state.json"), "utf8");
    mkdirSync(join(f.dir, "pi-auto-model.json"));
    display.answers.push("Review and save", true);
    await f.session.prompt("/automodel configure");
    expect(display.notices.at(-1)?.text).toMatch(/Previous settings are unchanged/);
    expect(readFileSync(join(f.dir, "pi-auto-model-state.json"), "utf8")).toBe(prefs);
    expect(f.session.model?.id).toBe("gpt-6.1-sol"); expect(f.faux.state.callCount).toBe(0);
    expect(readdirSync(f.dir).some((name) => name.endsWith(".tmp"))).toBe(false);
  } finally { f.close(); }
});

test("tree navigation restores the branch's original physical target and current evidence", async () => {
  const f = await createFixture({ skills: [small, hard] });
  try {
    await f.session.prompt("/automodel on"); f.respond(); await f.session.prompt("/skill:small");
    const branch = f.session.sessionManager.getBranch().findLast((entry) => entry.type === "message" && entry.message.role === "assistant")!;
    f.respond(); await f.session.prompt("/skill:hard");
    await f.session.navigateTree(branch.id, { summarize: false });
    f.respond(); await f.session.prompt("yes"); expect(last(f).model).toBe("gpt-6-luna");
    await f.session.prompt("/automodel off");
    expect(f.session.model?.id).toBe("gpt-6.1-sol"); expect(f.session.thinkingLevel).toBe("xhigh");
  } finally { f.close(); }
});

test("busy configuration opens only after settling and cannot replace the active route or enable Auto", async () => {
  const started = gate(), finish = gate(), display = createUI();
  const f = await createFixture({ ui: display.ui, mode: "tui", skills: [small] });
  try {
    f.faux.setResponses([async () => { started.release(); await finish.promise; return fauxAssistantMessage("main"); }]);
    const pending = f.session.prompt("manual active task"); await started.promise;
    display.answers.push("Cancel");
    await f.session.prompt("/automodel configure");
    expect(display.dialogs).toEqual([]); expect(f.session.model?.id).toBe("gpt-6.1-sol");
    finish.release(); await pending;
    await wait(() => display.dialogs.length === 1);
    expect(f.session.model?.id).toBe("gpt-6.1-sol"); expect(last(f).thinkingLevel).toBe("xhigh");
    expect(readdirSync(f.dir)).not.toContain("pi-auto-model.json"); expect(f.faux.state.callCount).toBe(1);
  } finally { finish.release(); f.close(); }
});

test("a no-match catalog search directs the user to Pi rather than inventing a provider/model", async () => {
  const display = createUI(), f = await createFixture({ ui: display.ui, mode: "tui" });
  try {
    display.answers.push("trivial: github-copilot/gpt-6-luna (high)", "absent-provider/absent-model", "Cancel");
    await f.session.prompt("/automodel configure");
    expect(display.notices.at(-1)?.text).toMatch(/No matching physical model.*Configure/);
    expect(display.dialogs.flatMap((dialog) => dialog.choices ?? []).some((label) => label.includes("absent-model"))).toBe(false);
    expect(readdirSync(f.dir)).not.toContain("pi-auto-model.json"); expect(f.faux.state.callCount).toBe(0);
  } finally { f.close(); }
});

test("catalog mappings preserve the original policy mode, popup and bounds despite a different mode preference", async () => {
  const display = createUI(), f = await createFixture({ ui: display.ui, mode: "tui" });
  try {
    await f.session.prompt("/automodel mode effort-only");
    display.answers.push("Review and save", true);
    await f.session.prompt("/automodel configure");
    const saved = JSON.parse(readFileSync(join(f.dir, "pi-auto-model.json"), "utf8"));
    expect(saved.mode).toBe("model-and-effort");
    expect(saved.switchPopup).toEqual({ enabled: true, durationMs: 10000 });
    expect(saved.classifier.maxOutputTokens).toBe(64);
    expect(JSON.parse(readFileSync(join(f.dir, "pi-auto-model-state.json"), "utf8")).mode).toBe("effort-only");
    expect(f.session.model?.id).toBe("gpt-6.1-sol"); expect(f.faux.state.callCount).toBe(0);
  } finally { f.close(); }
});

test("selected pairs disappearing during review preserve the complete previous policy and preferences", async () => {
  const display = createUI(), f = await createFixture({ ui: display.ui, mode: "tui" });
  try {
    const original = validateConfiguration(undefined, new ModelRegistry(f.runtime));
    writeFileSync(join(f.dir, "pi-auto-model.json"), JSON.stringify(original));
    await f.session.reload(); await f.session.prompt("/automodel mode effort-only");
    const policy = readFileSync(join(f.dir, "pi-auto-model.json"), "utf8");
    const preferences = readFileSync(join(f.dir, "pi-auto-model-state.json"), "utf8");
    const confirm = display.ui.confirm;
    display.ui.confirm = async (...args) => {
      const answer = await confirm(...args);
      f.runtime.registerNativeProvider({ ...f.faux.provider, filterModels: () => [] });
      await f.runtime.refresh({ allowNetwork: false });
      return answer;
    };
    display.answers.push("Review and save", true);
    await f.session.prompt("/automodel configure");
    expect(display.notices.at(-1)?.text).toMatch(/Unavailable exact Auto mapping/);
    expect(readFileSync(join(f.dir, "pi-auto-model.json"), "utf8")).toBe(policy);
    expect(readFileSync(join(f.dir, "pi-auto-model-state.json"), "utf8")).toBe(preferences);
    expect(f.session.model?.id).toBe("gpt-6.1-sol"); expect(f.faux.state.callCount).toBe(0);
  } finally { f.close(); }
});

test("corrupt saved preferences are actionable rather than silently enabled or overwritten", async () => {
  const display = createUI(), f = await createFixture({
    ui: display.ui, mode: "tui",
    setup: (dir) => writeFileSync(join(dir, "pi-auto-model-state.json"),
      '{"version":1,"enabled":"yes","mode":"model-and-effort"}'),
  });
  try {
    const before = readFileSync(join(f.dir, "pi-auto-model-state.json"), "utf8");
    await f.session.prompt("/automodel on");
    expect(display.notices.at(-1)?.text).toMatch(/Invalid Auto preferences/);
    expect(readFileSync(join(f.dir, "pi-auto-model-state.json"), "utf8")).toBe(before);
    expect(f.session.model?.id).toBe("gpt-6.1-sol"); expect(f.faux.state.callCount).toBe(0);
  } finally { f.close(); }
});
```

### `test/popup.test.ts`

```typescript
import { ModelRegistry, type ExtensionAPI, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import { fauxAssistantMessage, fauxProvider } from "@earendil-works/pi-ai";
import { visibleWidth } from "@earendil-works/pi-tui";
import { afterEach, expect, test, vi } from "vitest";
import { validateConfiguration, type PhysicalPair } from "../src/policy.ts";
import { registerPopups } from "../src/popup.ts";
import { createFixture } from "./support/session.ts";
import { createUI } from "./support/ui.ts";

const sol: PhysicalPair = { provider: "github-copilot", model: "gpt-6.1-sol", effort: "xhigh" };
const luna: PhysicalPair = { provider: "github-copilot", model: "gpt-6-luna", effort: "high" };
function app(mode: "regular" | "fullscreen" = "regular") {
  const display = createUI(mode), handlers = new Map<string, (event: any, ctx: ExtensionContext) => unknown>();
  const fake = fauxProvider({ provider: "github-copilot", models: [{ id: sol.model, reasoning: true }, { id: luna.model, reasoning: true }] });
  const registry = { find: (provider: string, id: string) => fake.models.find((model) => model.provider === provider && model.id === id), getAvailable: () => fake.models, hasConfiguredAuth: () => true };
  const config = validateConfiguration(undefined, registry);
  let sessionId = "original";
  const ctx = {
    mode: "tui", hasUI: true, ui: display.ui,
    model: { provider: "pi-auto-model", id: "auto", api: "pi-virtual" },
    modelRegistry: registry, sessionManager: { getSessionId: () => sessionId },
  } as unknown as ExtensionContext;
  const pi = { on(name: string, handler: (event: any, ctx: ExtensionContext) => unknown) { handlers.set(name, handler); return () => {}; } } as unknown as ExtensionAPI;
  const popup = registerPopups(pi, { policy: () => config, current: () => sol });
  const emit = (event: string, data: unknown = {}) => handlers.get(event)?.(data, ctx);
  const response = (pair: PhysicalPair) => emit("message_end", {
    message: { ...fauxAssistantMessage("reply"), provider: pair.provider, model: pair.model, thinkingLevel: pair.effort },
  });
  return { ...display, ctx, config, popup, emit, response, replaceSession() { sessionId = "next"; } };
}
afterEach(() => { vi.useRealTimers(); });

test.each(["regular", "fullscreen"] as const)("a %s popup expires without stealing focus or closing a later dialog", (mode) => {
  vi.useFakeTimers();
  const a = app(mode);
  let typed = "";
  a.tui.setFocus({ invalidate() {}, render: () => ["Editor"], handleInput: (data) => { typed += data; } });
  a.tui.start();
  try {
    a.emit("session_start"); a.response(luna);
    expect(a.overlays).toHaveLength(1);
    expect(a.overlays[0]!.options?.nonCapturing).toBe(true);
    expect(a.overlays[0]!.handle.isFocused()).toBe(false);
    a.sendInput("x"); expect(typed).toBe("x");
    const dialog = a.tui.showOverlay({ invalidate() {}, render: () => ["Another dialog"], handleInput() {} });
    expect(dialog.isFocused()).toBe(true);
    vi.advanceTimersByTime(9999); expect(a.tui.hasOverlay()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(dialog.isFocused()).toBe(true);
    a.overlays[0]!.handle.focus(); expect(a.overlays[0]!.handle.isFocused()).toBe(false);
    dialog.hide(); expect(a.tui.hasOverlay()).toBe(false);
  } finally { a.popup.clear(); a.tui.stop(); }
});

test("an unchanged route is silent and a replacement resets only its own timer", () => {
  vi.useFakeTimers(); const a = app();
  a.emit("session_start"); a.response(sol); expect(a.overlays).toHaveLength(0);
  a.response(luna); expect(a.overlays).toHaveLength(1);
  vi.advanceTimersByTime(5000); a.response(sol); expect(a.overlays).toHaveLength(2);
  vi.advanceTimersByTime(5000); expect(a.tui.hasOverlay()).toBe(true);
  expect(a.overlays[0]!.handle.isFocused()).toBe(false);
  vi.advanceTimersByTime(5000); expect(a.tui.hasOverlay()).toBe(false);
  a.popup.clear();
});

test.each([8, 12, 30, 80, 160])("popup output fits %s terminal columns and includes exact pairs when space allows", (width) => {
  vi.useFakeTimers(); const a = app();
  a.emit("session_start"); a.response(luna);
  const lines = a.overlays[0]!.component.render(width);
  for (const line of lines) expect(visibleWidth(line)).toBeLessThanOrEqual(width);
  if (width === 160) {
    expect(lines.join("\n")).toContain("github-copilot/gpt-6.1-sol (xhigh)");
    expect(lines.join("\n")).toContain("github-copilot/gpt-6-luna (high)");
  }
  a.popup.clear();
});

test.each(["print", "json", "rpc"] as const)("popup skips %s even when UI callbacks exist", (mode) => {
  vi.useFakeTimers(); const a = app(); a.ctx.mode = mode;
  a.emit("session_start"); a.response(luna);
  expect(a.widgets.size).toBe(0); expect(a.overlays).toHaveLength(0); expect(vi.getTimerCount()).toBe(0);
});

test("disabled popup leaves the route alone and creates no timer or overlay", () => {
  vi.useFakeTimers(); const a = app(); a.config.switchPopup.enabled = false;
  a.emit("session_start"); a.response(luna);
  expect(a.overlays).toHaveLength(0); expect(vi.getTimerCount()).toBe(0);
});

test.each(["session_shutdown", "session_tree", "model_select"])("%s cleans its popup without leaking old expiry into a replacement session", (event) => {
  vi.useFakeTimers(); const a = app();
  a.emit("session_start"); a.response(luna); a.emit(event);
  expect(a.tui.hasOverlay()).toBe(false);
  a.replaceSession(); a.emit("session_start"); a.response(luna);
  expect(a.overlays).toHaveLength(2);
  vi.advanceTimersByTime(10000); expect(a.tui.hasOverlay()).toBe(false); expect(vi.getTimerCount()).toBe(0);
});

test("an unavailable or failing renderer cannot fail routing or create a notification", () => {
  vi.useFakeTimers(); const a = app();
  a.emit("session_start"); a.tui.showOverlay = () => { throw new Error("render unavailable"); };
  expect(() => a.response(luna)).not.toThrow();
  expect(a.notices).toEqual([]); expect(vi.getTimerCount()).toBe(0);
});

test("native main metadata creates feedback, while direct summaries create no popup or chat entry", async () => {
  const ui = createUI(), f = await createFixture({ ui: ui.ui, mode: "tui", skills: [{ name: "small", description: "Small", tier: "trivial" }] });
  try {
    await f.session.prompt("/automodel on"); f.respond(); await f.session.prompt("/skill:small");
    expect(ui.overlays).toHaveLength(1);
    expect(ui.statuses.get("pi-auto-model")).toContain("gpt-6-luna (high)");
    expect(ui.notices).toEqual([]);
    expect(f.session.messages.some((message) => message.role === "custom")).toBe(false);
    const before = structuredClone(f.session.sessionManager.getBranch());
    f.respond("summary");
    const summary = await new ModelRegistry(f.runtime).streamSimple(f.runtime.getModel("pi-auto-model", "auto")!, {
      messages: [{ role: "user", content: "summary", timestamp: 0 }],
    }).result();
    expect(summary.model).toBe("gpt-6-luna");
    expect(ui.overlays).toHaveLength(1);
    expect(f.session.sessionManager.getBranch()).toEqual(before);
  } finally { f.close(); expect(ui.tui.hasOverlay()).toBe(false); }
});
```

### `test/support/ui.ts`

```typescript
import { Theme, type ExtensionUIContext } from "@earendil-works/pi-coding-agent";
import { TuiMainScreen, TuiAltScreen, type Component, type OverlayOptions, type OverlayHandle, type TUI, type Terminal } from "@earendil-works/pi-tui";

export function createUI(mode: "regular" | "fullscreen" = "regular") {
  const output: string[] = [];
  let input: ((data: string) => void) | undefined;
  const terminal: Terminal = {
    columns: 100, rows: 30, kittyProtocolActive: false,
    start(onInput) { input = onInput; }, stop() {}, drainInput: async () => {}, write: (text) => { output.push(text); },
    moveBy() {}, hideCursor() {}, showCursor() {}, clearLine() {}, clearFromCursor() {},
    clearScreen() {}, setTitle() {}, setProgress() {}, setProgramStatus() {},
  };
  const tui: TUI = mode === "regular" ? new TuiMainScreen(terminal) : new TuiAltScreen(terminal);
  const theme = new Theme({ accent: "#7a9cff", muted: "#888888" } as ConstructorParameters<typeof Theme>[0], {} as ConstructorParameters<typeof Theme>[1], "truecolor");
  const notices: { text: string; type?: string }[] = [], statuses = new Map<string, string | undefined>();
  const dialogs: { title: string; choices?: string[] }[] = [], answers: (string | boolean | undefined)[] = [];
  const widgets = new Map<string, Component & { dispose?(): void }>();
  const overlays: { component: Component; options?: OverlayOptions; handle: OverlayHandle }[] = [];
  const showOverlay = tui.showOverlay.bind(tui);
  tui.showOverlay = (component, options) => {
    const handle = showOverlay(component, options);
    overlays.push({ component, options, handle }); return handle;
  };
  const ui: ExtensionUIContext = {
    theme,
    select: async (title, choices) => { dialogs.push({ title, choices }); return answers.shift() as string | undefined; },
    input: async (title) => { dialogs.push({ title }); return answers.shift() as string | undefined; },
    confirm: async (title) => { dialogs.push({ title }); return answers.shift() === true; },
    notify: (text, type) => { notices.push({ text, type }); },
    setStatus: (key, value) => { statuses.set(key, value); },
    setWidget(key, content) {
      widgets.get(key)?.dispose?.(); widgets.delete(key);
      if (typeof content === "function") widgets.set(key, content(tui, theme));
    },
    custom: async () => { throw new Error("Passive Auto popup must not use custom UI."); },
    onTerminalInput: () => () => {}, setWorkingMessage() {}, setWorkingVisible() {},
    setWorkingIndicator() {}, setHiddenThinkingLabel() {}, setFooter() {}, setHeader() {},
    setTitle() {}, pasteToEditor() {}, setEditorText() {}, getEditorText: () => "",
    editor: async () => undefined, addAutocompleteProvider() {}, setEditorComponent() {},
    getEditorComponent: () => undefined, getAllThemes: () => [], getTheme: () => undefined,
    setTheme: () => ({ success: true }), getToolsExpanded: () => false, setToolsExpanded() {},
  };
  return { ui, tui, terminal, notices, statuses, dialogs, answers, widgets, overlays, output, sendInput(data: string) { input?.(data); } };
}
```

#### Implementation-green

Apply the following four exact implementations after valid behavioral red.
All other final files use their exact frozen checkpoint copies; they include
current native routing logic and approved namespace/schema/harness integration.
Only the named source boundaries may change; do not weaken existing assertions.

### `src/settings.ts` compiling stub

```typescript
import { getSupportedThinkingLevels, type Api, type Model } from "@earendil-works/pi-ai";
import { validateConfiguration, type Configuration, type PhysicalPair, type RoutingRegistry } from "./policy.ts";
export type Preferences = { version: 1; enabled: boolean; mode: Configuration["mode"] };
export const initialPreferences: Preferences = { version: 1, enabled: false, mode: "model-and-effort" };
export function validatePreferences(_raw: unknown): Preferences { return { ...initialPreferences }; }
export async function readSettings(_path: string): Promise<unknown> { return undefined; }
export async function writeSettings(_path: string, _value: unknown, _valid: () => boolean = () => true): Promise<void> {}
export function physicalCatalog(registry: RoutingRegistry, _search = ""): Model<Api>[] { return registry.getAvailable(); }
export function automaticEfforts(model: Model<Api>) { return getSupportedThinkingLevels(model).filter((level) => level !== "max"); }
export function validateMappings(raw: unknown, registry: RoutingRegistry): Configuration { return validateConfiguration(raw, registry); }
export function formatPair(pair: { provider: string; model: string; effort: string }) { return pair.provider + "/" + pair.model + " (" + pair.effort + ")"; }
```

### `src/settings.ts` exact implementation

```typescript
import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import { getSupportedThinkingLevels, type Api, type Model } from "@earendil-works/pi-ai";
import { validateConfiguration, type Configuration, type PhysicalPair, type RoutingRegistry } from "./policy.ts";

export type Preferences = { version: 1; enabled: boolean; mode: Configuration["mode"] };
export const initialPreferences: Preferences = { version: 1, enabled: false, mode: "model-and-effort" };

export function validatePreferences(raw: unknown): Preferences {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Invalid Auto preferences: expected an object.");
  const value = raw as Record<string, unknown>;
  if (Object.keys(value).sort().join(",") !== "enabled,mode,version" || value.version !== 1
    || typeof value.enabled !== "boolean" || typeof value.mode !== "string"
    || !["model-and-effort", "effort-only"].includes(value.mode)) {
    throw new Error("Invalid Auto preferences: expected version 1, enabled boolean and a supported mode.");
  }
  return { version: 1, enabled: value.enabled, mode: value.mode as Preferences["mode"] };
}

export async function readSettings(path: string): Promise<unknown> {
  try { return JSON.parse(await readFile(path, "utf8")); }
  catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return undefined;
    throw new Error("Cannot read Auto settings at " + path + ". Correct or remove this file.", { cause: error });
  }
}

export async function writeSettings(path: string, value: unknown, valid: () => boolean = () => true): Promise<void> {
  const data = JSON.stringify(value, null, 2) + "\n";
  await mkdir(dirname(path), { recursive: true });
  const temporary = join(dirname(path), "." + path.split(/[\\/]/).at(-1) + "." + randomUUID() + ".tmp");
  let created = false;
  try {
    const handle = await open(temporary, "wx", 0o600);
    created = true;
    try { await handle.writeFile(data, "utf8"); await handle.sync(); }
    finally { await handle.close(); }
    if (!valid()) throw new Error("Originating Auto control was canceled before save.");
    await rename(temporary, path);
  } catch (error) {
    throw new Error("Cannot save Auto settings at " + path + ". Previous settings are unchanged.", { cause: error });
  } finally {
    if (created) await unlink(temporary).catch(() => undefined);
  }
}

export function physicalCatalog(registry: RoutingRegistry, search = ""): Model<Api>[] {
  const terms = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return registry.getAvailable().filter((model) => model.api !== "pi-virtual" && registry.hasConfiguredAuth(model)
    && terms.every((term) => [model.provider, model.id, model.name].join(" ").toLowerCase().includes(term)))
    .sort((a, b) => (a.provider + "/" + a.id).localeCompare(b.provider + "/" + b.id));
}

export function automaticEfforts(model: Model<Api>) {
  return getSupportedThinkingLevels(model).filter((level) => level !== "max");
}

export function validateMappings(raw: unknown, registry: RoutingRegistry): Configuration {
  const config = validateConfiguration(raw, registry);
  const available = physicalCatalog(registry);
  for (const pair of [...Object.values(config.tiers), config.classifier]) {
    const model = available.find((model) => model.provider === pair.provider && model.id === pair.model);
    if (!model || !automaticEfforts(model).includes(pair.effort)) {
      throw new Error("Unavailable exact Auto mapping " + formatPair(pair) + ". Configure this physical provider/model/effort in Pi first.");
    }
  }
  return config;
}

export function formatPair(pair: { provider: string; model: string; effort: string }) { return pair.provider + "/" + pair.model + " (" + pair.effort + ")"; }
```

### `src/configure.ts` compiling stub

```typescript
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { Configuration } from "./policy.ts";
export async function configureMappings(_ctx: ExtensionContext, _config: Configuration, _valid: () => boolean): Promise<Configuration | undefined> { return undefined; }
```

### `src/configure.ts` exact implementation

```typescript
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { Configuration, PhysicalPair, Tier } from "./policy.ts";
import { automaticEfforts, formatPair, physicalCatalog, validateMappings } from "./settings.ts";

const slots: readonly (Tier | "classifier")[] = ["trivial", "moderate", "complex", "frontier", "classifier"];

export async function configureMappings(
  ctx: ExtensionContext, config: Configuration, valid: () => boolean,
): Promise<Configuration | undefined> {
  if (ctx.mode !== "tui") throw new Error("Use the policy JSON file for headless/RPC configuration.");
  if (!physicalCatalog(ctx.modelRegistry).length) throw new Error("No physical models are available. Configure a provider in Pi before /automodel configure.");
  const draft = structuredClone(config);
  while (valid()) {
    const labels = slots.map((slot) => slot + ": " + formatPair(slot === "classifier" ? draft.classifier : draft.tiers[slot]));
    const selection = await ctx.ui.select("Auto mappings — configured availability, not live entitlement", [...labels, "Review and save", "Cancel"]);
    if (!valid() || selection === undefined || selection === "Cancel") return undefined;
    if (selection === "Review and save") {
      if (!await ctx.ui.confirm("Save all Auto mappings?", labels.join("\n"))) return undefined;
      if (!valid()) return undefined;
      return validateMappings(draft, ctx.modelRegistry);
    }
    const index = labels.indexOf(selection);
    if (index < 0) continue;
    const slot = slots[index]!;
    const search = await ctx.ui.input("Search provider, model ID or display name", "Blank lists all available physical models");
    if (!valid() || search === undefined) return undefined;
    const models = physicalCatalog(ctx.modelRegistry, search);
    if (!models.length) {
      ctx.ui.notify("No matching physical model. Configure the requested combination in Pi; Auto cannot create providers.", "warning");
      continue;
    }
    const modelLabels = models.map((model) => model.provider + "/" + model.id + " — " + model.name);
    const selected = await ctx.ui.select("Choose a physical model", modelLabels);
    if (!valid() || selected === undefined) return undefined;
    const model = models[modelLabels.indexOf(selected)];
    if (!model) continue;
    const chosen = await ctx.ui.select("Choose exact automatic effort (no max)", automaticEfforts(model));
    if (!valid() || chosen === undefined) return undefined;
    if (!automaticEfforts(model).includes(chosen as PhysicalPair["effort"])) throw new Error("Selected effort is no longer supported. Choose an exact effort again.");
    const pair: PhysicalPair = { provider: model.provider, model: model.id, effort: chosen as PhysicalPair["effort"] };
    if (slot === "classifier") draft.classifier = { ...draft.classifier, ...pair };
    else draft.tiers[slot] = pair;
  }
  return undefined;
}
```

### `src/controls.ts` compiling stub

```typescript
import { validateConfiguration, type Configuration, type PhysicalPair } from "./policy.ts";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
export function registerControls(pi: ExtensionAPI, hooks: {
  directory?: string; readPolicy(): unknown; setPolicy(raw: unknown): void;
  current(ctx: ExtensionContext): PhysicalPair | undefined; capture(pair: PhysicalPair | undefined): void;
  invalidate(): void; clearPopup(): void;
}) {
  pi.registerCommand("automodel", { description: "Auto stub", handler: async () => {} });
  return { policy: (ctx: ExtensionContext): Configuration => validateConfiguration(hooks.readPolicy(), ctx.modelRegistry) };
}
```

### `src/controls.ts` exact implementation

```typescript
import { join } from "node:path";
import { getSupportedThinkingLevels, type Api, type Model, type ModelThinkingLevel } from "@earendil-works/pi-ai";
import { getAgentDir, type ExtensionAPI, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import { configureMappings } from "./configure.ts";
import { validateConfiguration, type Configuration, type PhysicalPair } from "./policy.ts";
import { formatPair, readSettings, validateMappings, validatePreferences, writeSettings, type Preferences } from "./settings.ts";

type RestorePair = { provider: string; model: string; effort: ModelThinkingLevel };
type ControlState = Preferences & { restore?: RestorePair; fixed?: PhysicalPair };
type Action = { kind: "on" } | { kind: "off" } | { kind: "configure" } | { kind: "mode"; mode: Preferences["mode"] }
  | { kind: "save"; policy: Configuration } | { kind: "effort"; pair: RestorePair };
type Hooks = {
  directory?: string;
  readPolicy(): unknown;
  setPolicy(raw: unknown): void;
  current(ctx: ExtensionContext): PhysicalPair | undefined;
  capture(pair: PhysicalPair | undefined): void;
  invalidate(): void;
  clearPopup(): void;
};

const entryType = "pi-auto-model.controls";
const isAuto = (model: Model<Api> | undefined) => model?.provider === "pi-auto-model" && model.id === "auto" && model.api === "pi-virtual";
const levels: readonly ModelThinkingLevel[] = ["off", "minimal", "low", "medium", "high", "xhigh", "max"];

function identity(raw: unknown, ctx: ExtensionContext): RestorePair | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const pair = raw as RestorePair;
  if (Object.keys(pair).sort().join(",") !== "effort,model,provider") return undefined;
  const model = typeof pair.provider === "string" && typeof pair.model === "string" ? ctx.modelRegistry.find(pair.provider, pair.model) : undefined;
  return model && model.api !== "pi-virtual" && levels.includes(pair.effort)
    ? { provider: model.provider, model: model.id, effort: pair.effort } : undefined;
}
function selected(ctx: ExtensionContext, effort: ModelThinkingLevel): RestorePair | undefined {
  return ctx.model && ctx.model.api !== "pi-virtual" ? { provider: ctx.model.provider, model: ctx.model.id, effort } : undefined;
}
function branchState(ctx: ExtensionContext): ControlState | undefined {
  const entry = ctx.sessionManager.getBranch().findLast((entry) => entry.type === "custom" && entry.customType === entryType);
  if (entry?.type !== "custom") return undefined;
  const raw = entry.data as Partial<ControlState> | null;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)
    || Object.keys(raw).some((key) => !["version", "enabled", "mode", "restore", "fixed"].includes(key))) {
    throw new Error("Invalid saved Auto controls. Select a physical model and re-enable Auto.");
  }
  const preferences = validatePreferences({ version: raw.version, enabled: raw.enabled, mode: raw.mode });
  const restore = identity(raw.restore, ctx), fixed = identity(raw.fixed, ctx);
  if (raw.restore !== undefined && !restore || raw.fixed !== undefined && (!fixed || fixed.effort === "max")
    || preferences.enabled && (!restore || !fixed)) {
    throw new Error("Invalid saved Auto restore/fixed pair. Select a physical model and re-enable Auto.");
  }
  return { ...preferences, restore, fixed: fixed as PhysicalPair | undefined };
}

export function registerControls(pi: ExtensionAPI, hooks: Hooks) {
  const directory = hooks.directory ?? getAgentDir();
  const policyPath = join(directory, "pi-auto-model.json"), preferencesPath = join(directory, "pi-auto-model-state.json");
  let control: ControlState = { version: 1, enabled: false, mode: "model-and-effort" };
  let lastPhysical: RestorePair | undefined, internal = 0, initialized = false;
  let failure: string | undefined, sessionId: string | undefined, epoch = 0;
  let queue: Action[] = [], timer: ReturnType<typeof setTimeout> | undefined;
  let serial: Promise<void> = Promise.resolve();

  const valid = (ctx: ExtensionContext, owner: number) => initialized && epoch === owner && sessionId === ctx.sessionManager.getSessionId();
  const report = (ctx: ExtensionContext, message: string, type: "info" | "error" = "info") => {
    if (ctx.hasUI) ctx.ui.notify(message, type);
    else (type === "error" ? process.stderr : process.stdout).write("Auto: " + message + "\n");
  };
  function status(ctx: ExtensionContext) {
    const current = isAuto(ctx.model) ? hooks.current(ctx) : selected(ctx, pi.getThinkingLevel());
    ctx.ui.setStatus("pi-auto-model", isAuto(ctx.model)
      ? "Auto · " + control.mode + (current ? " → " + formatPair(current) : " · no physical dispatch yet") : undefined);
  }
  function record(ctx: ExtensionContext) { pi.appendEntry(entryType, structuredClone(control)); status(ctx); }
  const persist = (ctx: ExtensionContext, owner: number) => writeSettings(preferencesPath,
    { version: 1, enabled: control.enabled, mode: control.mode }, () => valid(ctx, owner));
  function cancel() {
    epoch++; queue = []; if (timer) clearTimeout(timer); timer = undefined;
    hooks.invalidate(); hooks.clearPopup();
  }
  async function selectPair(ctx: ExtensionContext, pair: RestorePair) {
    const model = ctx.modelRegistry.find(pair.provider, pair.model);
    if (!model || model.api === "pi-virtual" || !ctx.modelRegistry.hasConfiguredAuth(model)
      || !ctx.modelRegistry.getAvailable().some((item) => item.provider === pair.provider && item.id === pair.model)
      || !getSupportedThinkingLevels(model).includes(pair.effort)) {
      throw new Error("Cannot restore exact " + formatPair(pair) + ". Select an available physical model and supported effort.");
    }
    internal++;
    try {
      if (!await pi.setModel(model)) throw new Error("Pi could not select the physical restore model.");
      pi.setThinkingLevel(pair.effort);
      if (pi.getThinkingLevel() !== pair.effort) throw new Error("Pi did not honor the exact restore effort.");
      lastPhysical = pair;
    } finally { internal--; }
  }
  async function apply(action: Action, ctx: ExtensionContext, owner: number) {
    if (!valid(ctx, owner)) return;
    if (!ctx.isIdle() || ctx.hasPendingMessages()) { queue.unshift(action); return; }
    if (action.kind === "configure") {
      if (ctx.mode !== "tui") { report(ctx, "Edit " + policyPath + " and /reload; interactive model picking requires terminal mode."); return; }
      if (failure) throw new Error(failure);
      const draft = await configureMappings(ctx, validateConfiguration(hooks.readPolicy(), ctx.modelRegistry), () => valid(ctx, owner));
      if (draft) {
        if (!ctx.isIdle() || ctx.hasPendingMessages()) { queue.push({ kind: "save", policy: draft }); return; }
        await apply({ kind: "save", policy: draft }, ctx, owner);
      }
      return;
    }
    if (action.kind === "save") {
      const draft = validateMappings(action.policy, ctx.modelRegistry);
      await writeSettings(policyPath, draft, () => valid(ctx, owner));
      if (!valid(ctx, owner)) return;
      hooks.setPolicy(draft); hooks.invalidate(); hooks.clearPopup();
      status(ctx); report(ctx, "Saved model mappings. Selection and enabled/mode preferences are unchanged.");
      return;
    }
    if (action.kind === "on") {
      if (isAuto(ctx.model) && control.enabled) return;
      if (failure) throw new Error(failure);
      validateConfiguration(hooks.readPolicy(), ctx.modelRegistry);
      const restore = selected(ctx, pi.getThinkingLevel());
      if (!restore || restore.effort === "max") throw new Error("Select a physical model with a non-max effort before enabling Auto.");
      const model = ctx.modelRegistry.find("pi-auto-model", "auto");
      if (!model || model.api !== "pi-virtual") throw new Error("Auto is not registered. Reload this extension.");
      internal++;
      try { if (!await pi.setModel(model)) throw new Error("Auto could not be selected. Reload this extension."); }
      finally { internal--; }
      if (!valid(ctx, owner)) return;
      control = { ...control, enabled: true, restore, fixed: restore as PhysicalPair };
    } else if (action.kind === "off") {
      if (isAuto(ctx.model)) {
        if (!control.restore) throw new Error("No pre-enable physical restore pair is known. Select a physical model manually.");
        await selectPair(ctx, control.restore);
      }
      control = { ...control, enabled: false };
    } else if (action.kind === "effort") {
      await selectPair(ctx, action.pair);
      control = { ...control, enabled: false };
    } else {
      if (failure) throw new Error(failure);
      const fixed = action.mode === "effort-only" && isAuto(ctx.model) ? hooks.current(ctx) : control.fixed;
      if (isAuto(ctx.model) && action.mode === "effort-only" && !fixed) throw new Error("No known physical route. Select a physical model before effort-only mode.");
      control = { ...control, mode: action.mode, fixed };
    }
    if (!valid(ctx, owner)) return;
    hooks.invalidate(); hooks.clearPopup();
    if (control.enabled) hooks.capture(control.fixed);
    record(ctx);
    await persist(ctx, owner);
  }
  function enqueue(action: Action, ctx: ExtensionContext) {
    const owner = epoch;
    serial = serial.catch(() => undefined).then(async () => {
      if (!valid(ctx, owner)) return;
      try { await apply(action, ctx, owner); }
      catch (error) { if (valid(ctx, owner)) report(ctx, error instanceof Error ? error.message : String(error), "error"); }
    });
    return serial;
  }
  function defer(action: Action, ctx: ExtensionContext) {
    if (!ctx.isIdle() || ctx.hasPendingMessages()) {
      queue.push(action); report(ctx, "Control queued for this session's safe idle boundary."); return Promise.resolve();
    }
    return enqueue(action, ctx);
  }
  function flush(ctx: ExtensionContext) {
    if (timer || !queue.length) return;
    const owner = epoch;
    timer = setTimeout(() => {
      timer = undefined;
      if (!valid(ctx, owner) || !ctx.isIdle() || ctx.hasPendingMessages()) return;
      for (const action of queue.splice(0)) void enqueue(action, ctx);
    }, 0);
    timer.unref();
  }
  function policy(ctx: ExtensionContext): Configuration {
    if (failure) throw new Error(failure);
    return { ...validateConfiguration(hooks.readPolicy(), ctx.modelRegistry), mode: control.mode };
  }

  pi.registerCommand("automodel", {
    description: "Auto on/off/status/mode/configure — physical catalog mappings",
    getArgumentCompletions: (prefix) => ["on", "off", "status", "configure", "mode model-and-effort", "mode effort-only"]
      .filter((value) => value.startsWith(prefix)).map((value) => ({ value, label: value })),
    handler: async (args, ctx) => {
      const words = args.trim().split(/\s+/), verb = words[0] || "status";
      if (verb === "status" && words.length === 1) {
        try {
          const config = policy(ctx), available = ctx.modelRegistry.getAvailable();
          const label = (pair: PhysicalPair) => formatPair(pair) + (available.some((model) => model.api !== "pi-virtual"
            && model.provider === pair.provider && model.id === pair.model && getSupportedThinkingLevels(model).includes(pair.effort)) ? "" : " [unavailable]");
          report(ctx, "Selection: " + (isAuto(ctx.model) ? "Auto" : ctx.model?.provider + "/" + ctx.model?.id)
            + "; mode: " + control.mode + "; pending: " + queue.length + "; policy: " + policyPath + "\n"
            + Object.entries(config.tiers).map(([tier, pair]) => tier + ": " + label(pair)).join("\n")
            + "\nclassifier: " + label(config.classifier) + "; configured availability is not live entitlement.");
        } catch (error) { report(ctx, String(error), "error"); }
        return;
      }
      if (["on", "off", "configure"].includes(verb) && words.length === 1) {
        await defer({ kind: verb as "on" | "off" | "configure" }, ctx); return;
      }
      if (verb === "mode" && words.length === 2 && ["model-and-effort", "effort-only"].includes(words[1]!)) {
        await defer({ kind: "mode", mode: words[1] as Preferences["mode"] }, ctx); return;
      }
      report(ctx, "Use /automodel on|off|status|configure or /automodel mode model-and-effort|effort-only.", "error");
    },
  });
  pi.registerShortcut("ctrl+alt+a", {
    description: "Toggle Auto at a safe idle boundary",
    handler: async (ctx) => { await defer({ kind: isAuto(ctx.model) ? "off" : "on" }, ctx); },
  });
  pi.on("session_start", async (event, ctx) => {
    cancel(); initialized = false; failure = undefined; sessionId = ctx.sessionManager.getSessionId();
    try {
      const raw = await readSettings(policyPath);
      if (raw !== undefined) hooks.setPolicy(raw);
      const config = validateConfiguration(hooks.readPolicy(), ctx.modelRegistry);
      const saved = await readSettings(preferencesPath), branch = branchState(ctx);
      const preferences = saved === undefined ? { version: 1 as const, enabled: false, mode: config.mode } : validatePreferences(saved);
      control = branch ?? preferences; initialized = true;
      lastPhysical = selected(ctx, pi.getThinkingLevel());
      if (isAuto(ctx.model)) {
        if (control.fixed) hooks.capture(control.fixed);
      } else if (control.enabled && !branch && (event.reason === "new" || event.reason === "startup")
        && !ctx.sessionManager.getBranch().some((entry) => entry.type === "message" || entry.type === "custom" || entry.type === "compaction")
        && ctx.sessionManager.getBranch().filter((entry) => entry.type === "model_change").length <= 1) {
        control.enabled = false;
        await enqueue({ kind: "on" }, ctx);
      }
      status(ctx);
    } catch (error) {
      initialized = true; failure = error instanceof Error ? error.message : String(error);
      report(ctx, failure, "error");
    }
  });
  pi.on("model_select", async (event, ctx) => {
    if (!initialized || internal || event.source === "restore" || isAuto(event.model) && isAuto(event.previousModel)) return;
    cancel();
    if (isAuto(event.model)) {
      const restore = lastPhysical?.provider === event.previousModel?.provider && lastPhysical?.model === event.previousModel?.id ? lastPhysical : undefined;
      if (!restore || restore.effort === "max") {
        failure = "Auto needs a pre-enable physical model/non-max effort. Select a physical model and /automodel on.";
        report(ctx, failure, "error"); return;
      }
      control = { ...control, enabled: true, restore, fixed: restore as PhysicalPair };
      hooks.capture(control.fixed);
    } else {
      control = { ...control, enabled: false }; lastPhysical = selected(ctx, pi.getThinkingLevel()); failure = undefined;
    }
    const owner = epoch; record(ctx);
    await persist(ctx, owner).catch((error) => report(ctx, String(error), "error"));
  });
  pi.on("thinking_level_select", (event, ctx) => {
    if (!initialized || internal) return;
    if (!isAuto(ctx.model)) { lastPhysical = selected(ctx, event.level); return; }
    const current = hooks.current(ctx);
    if (!current) { report(ctx, "No physical route is known. Select a physical model before changing effort.", "error"); return; }
    void defer({ kind: "effort", pair: { ...current, effort: event.level } }, ctx);
  });
  pi.on("message_end", (event, ctx) => { if (event.message.role === "assistant") status(ctx); });
  pi.on("agent_settled", (_event, ctx) => { flush(ctx); });
  pi.on("session_compact", (_event, ctx) => { flush(ctx); status(ctx); });
  pi.on("session_compact_failed", (_event, ctx) => { flush(ctx); });
  pi.on("session_tree", (_event, ctx) => {
    cancel();
    try {
      control = branchState(ctx) ?? { ...control, enabled: isAuto(ctx.model), restore: undefined, fixed: undefined };
      if (control.fixed) hooks.capture(control.fixed);
      status(ctx);
    } catch (error) { failure = String(error); report(ctx, failure, "error"); }
  });
  pi.on("session_shutdown", () => { cancel(); initialized = false; sessionId = undefined; });
  return { policy };
}
```

### `src/popup.ts` compiling stub

```typescript
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { Configuration, PhysicalPair } from "./policy.ts";
export function registerPopups(_pi: ExtensionAPI, _hooks: { policy(ctx: ExtensionContext): Configuration; current(ctx: ExtensionContext): PhysicalPair | undefined }) { return { clear() {} }; }
```

### `src/popup.ts` exact implementation

```typescript
import type { ExtensionAPI, ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, type OverlayHandle, type TUI } from "@earendil-works/pi-tui";
import type { Configuration, PhysicalPair } from "./policy.ts";
import { formatPair } from "./settings.ts";

const auto = (ctx: ExtensionContext) => ctx.model?.provider === "pi-auto-model" && ctx.model.id === "auto" && ctx.model.api === "pi-virtual";
const key = (pair: PhysicalPair) => pair.provider + "\0" + pair.model + "\0" + pair.effort;

export function registerPopups(pi: ExtensionAPI, hooks: {
  policy(ctx: ExtensionContext): Configuration;
  current(ctx: ExtensionContext): PhysicalPair | undefined;
}) {
  let tui: TUI | undefined, theme: Theme | undefined, prior: PhysicalPair | undefined;
  let handle: OverlayHandle | undefined, timer: ReturnType<typeof setTimeout> | undefined;
  let generation = 0, sessionId: string | undefined;
  function clear() {
    generation++; if (timer) clearTimeout(timer); timer = undefined;
    const old = handle; handle = undefined;
    try { old?.hide(); } catch { /* Rendering failures cannot change routing. */ }
  }
  function observe(pair: PhysicalPair, ctx: ExtensionContext) {
    const previous = prior; prior = pair;
    if (!previous || key(previous) === key(pair) || !auto(ctx) || ctx.mode !== "tui" || !tui || !theme) return;
    clear();
    try {
      const settings = hooks.policy(ctx).switchPopup;
      if (!settings.enabled) return;
      const owner = generation, origin = sessionId, deadline = Date.now() + settings.durationMs;
      const localTui = tui;
      handle = localTui.showOverlay({
        invalidate() {},
        render(width) {
          const activeTheme = ctx.ui.theme ?? theme!;
          return ["Auto switch", "From " + formatPair(previous), "To   " + formatPair(pair)]
            .map((line, index) => truncateToWidth(activeTheme.fg(index === 0 ? "accent" : "muted", line), Math.max(0, width)));
        },
      }, { nonCapturing: true, anchor: "top-right", width: "70%", margin: 1 });
      const expire = () => {
        if (owner !== generation || origin !== sessionId) return;
        const remaining = deadline - Date.now();
        if (remaining <= 0) { clear(); return; }
        timer = setTimeout(expire, Math.min(remaining, 2147483647)); timer.unref();
      };
      expire();
    } catch { clear(); }
  }
  pi.on("session_start", (_event, ctx) => {
    clear(); prior = hooks.current(ctx); sessionId = ctx.sessionManager.getSessionId();
    tui = undefined; theme = undefined;
    if (ctx.mode !== "tui") return;
    ctx.ui.setWidget("pi-auto-model.popup-host", (injectedTui, injectedTheme) => {
      tui = injectedTui; theme = injectedTheme;
      return { render: () => [], invalidate() {}, dispose() { clear(); tui = undefined; theme = undefined; } };
    });
  });
  pi.on("message_end", (event, ctx) => {
    if (!auto(ctx) || event.message.role !== "assistant") return;
    const model = ctx.modelRegistry.find(event.message.provider, event.message.model);
    const effort = event.message.thinkingLevel;
    if (!model || model.api === "pi-virtual" || !effort || effort === "max") return;
    observe({ provider: model.provider, model: model.id, effort }, ctx);
  });
  pi.on("model_select", (_event, ctx) => { clear(); prior = hooks.current(ctx); });
  pi.on("session_tree", (_event, ctx) => { clear(); prior = hooks.current(ctx); });
  pi.on("session_shutdown", () => { clear(); prior = undefined; tui = undefined; theme = undefined; sessionId = undefined; });
  return { clear };
}
```

#### Exact existing integration files

- `src/policy.ts`: /tmp/pi-auto-model-controls-implementation.y7f8rh/final/src/policy.ts
- `extensions/auto-model.ts`: /tmp/pi-auto-model-controls-implementation.y7f8rh/final/extensions/auto-model.ts
- `test/support/session.ts`: /tmp/pi-auto-model-controls-implementation.y7f8rh/final/test/support/session.ts
- `test/load-check.test.ts`: /tmp/pi-auto-model-controls-implementation.y7f8rh/final/test/load-check.test.ts
- `test/classifier-boundary.test.ts`: /tmp/pi-auto-model-controls-implementation.y7f8rh/final/test/classifier-boundary.test.ts
- `test/native-boundary.test.ts`: /tmp/pi-auto-model-controls-implementation.y7f8rh/final/test/native-boundary.test.ts
- `test/request-ownership.test.ts`: /tmp/pi-auto-model-controls-implementation.y7f8rh/final/test/request-ownership.test.ts
- `test/review-regressions.test.ts`: /tmp/pi-auto-model-controls-implementation.y7f8rh/final/test/review-regressions.test.ts
- `test/tier-routing.test.ts`: /tmp/pi-auto-model-controls-implementation.y7f8rh/final/test/tier-routing.test.ts
- `features/steps/native-boundary.ts`: /tmp/pi-auto-model-controls-implementation.y7f8rh/final/features/steps/native-boundary.ts
- `features/steps/routing.ts`: /tmp/pi-auto-model-controls-implementation.y7f8rh/final/features/steps/routing.ts
- `package.json`: /tmp/pi-auto-model-controls-implementation.y7f8rh/final/package.json
- `package-lock.json`: /tmp/pi-auto-model-controls-implementation.y7f8rh/final/package-lock.json

#### Verify

1. Run the targeted three suites again.
2. Run `make test`, `make typecheck`, `make load-check`.
3. Run `make -C /Users/mmcdonnell/code/agent-skills check-execute-plan`.
4. Compare every final file byte-for-byte with checkpoint `final/`.
   Verify protected hashes/index/HEAD/branch and unchanged resolution graph.
5. Return COMPLETE only if real checks pass. Expected314 Vitest/57 Cucumber/
   497 steps/19 worker-policy checks are estimates; report actual outcomes.
   Otherwise return BLOCKED with failing assertions and exact source/logs.

- [ ] Task1 complete

#### Task1 blocked checkpoint

The exact21-file payload is applied, not committed. Current Make reports282/314
Vitest and48/57 acceptance passing; type/load/19 worker checks pass. One runtime
error-shadowing branch and five fixture preconditions are verified in
[the result checkpoint](./execution.md#slice2-task1-result--blocked).

The six-file230-line correction is now explicitly approved and applied at
`/tmp/pi-auto-model-controls-correction.BvM6YI/proposed.diff`. It preserves all
assertions, fixes native shutdown/test capability/default/theme/environment
setup and preserves the original configuration error. In-memory diagnostic
substitutions pass314 tests/57 scenarios; that is not real applied acceptance.
The popup inert-stub control reaches valid assertions with the corrected fixture;
reproduce/preserve it after approval. The verbatim payload above records what
was approved/applied, not an assertion that it passed. Do not rewrite it or
advance Task2 until the concrete follow-up gate and full checks/review are done.

#### Applied correction and independent review

Actual Make now passes314 Vitest/57 scenarios/497 steps/type/load/19 worker checks.
The corrected fixture establishes valid popup red (12 assertions fail/5 controls
pass against the inert stub); assertions are unchanged. All five review dimensions
and three adversarial verification batches completed, retaining eleven findings
(seven Medium/four Low) despite green tests. All24 files/43 source hashes were
accounted for; no reviewer changed code. See
[the verified review](./execution.md#slice2-independent-review--verified-findings)
for stable S2F01–S2F11 and the two unknown behaviors.

S2F04 requires a public host commit-point ownership/cancellation capability not
present in Pi1.2's setModel. Extension-local admission/teardown coordination alone
cannot guarantee bounded strict latest-choice behavior. Ask for the changed
scope before any host acquisition/edit/dependency decision. Existing host code,
M2 criteria and installed SDK remain untouched. No correction or Task1 commit
beyond the approved six-file batch is authorized by this task document.

### Task2: Verify the whole Slice2 boundary before milestone acceptance

- **Key:** `slice-2/task-2`
- **Supports:** M2.1–M2.4, R61–R65
- **Delivers:** Criterion-by-criterion acceptance through installed Pi/TUI,
  not internal handler assertions or the implementation task count.
- **Location:** Existing approved code/tests, source spec/addendum/ledger;
  no additional writes, activation or public provider probe in this task.
- **Prerequisite:** Task1 verified/committed; independent read-only review and
  any concrete correction approvals completed.
- **Execution:** Coordinator-owned verification, no later editing worker.
- **Status:** Not authorized for delegation. Verify against green source.

#### Criterion verification matrix

| Criteria | Existing boundary cases to inspect and execute |
| --- | --- |
| AC018, AC019, AC029 | Controls on/off exact pair; manual physical and manual effort current-model behavior |
| AC020, AC021 | JSON-portable resume, tree original target, reload and fresh enabled/mode cases; require compaction evidence separately |
| AC022, AC051 | Busy off/configure return without idle await; active main exact pair/count; require origin cancellation/queued-task gaps explicitly |
| AC031 | Native popup/main metadata, no custom chat entry, direct summary branch isolation |
| AC038–AC044 | Actual TuiMainScreen/TuiAltScreen focus/input, exact10s/replacement, newer dialog, width, disabled/RPC/print/json, shutdown/tree/failure |
| AC045, AC046 | Catalog terms and virtual exclusion, exact supported effort/no max, UI full save revalidation |
| AC047 | Non-Copilot all-five saved/reloaded mappings, declared/classified/direct summary exact dispatch |
| AC048 | Cancellation, validation, atomic rename failure, stale pair preserve policy/preferences; require complete native variant matrix |
| AC049, AC050 | No-match and empty catalog guidance, no saved defaults/no request |
| AC052 | Headless configure file guidance/no dialog/write/implicit selection |

#### Verify and gates

1. Run full `make test typecheck load-check` and preserve real output.
2. Execute the named native/TUI positive and negative controls; require observed
   caller behavior for every criterion. Source/grep or a test name is not
   acceptance evidence. Record unavailable/missing cases as unverified.
3. Compile any missing tagged Cucumber criteria/native variants as a separate
   exact acceptance-only proposal before edits; Task1 approval does not cover
   unlisted test files or expectation changes.
4. Verify the shortcut as a terminal input control and valid saved state through
   compaction, shutdown/origin-canceled pending controls, corrupt branch identities
   and failed preference I/O. Missing evidence blocks the supported milestone,
   not permission to drop its criterion or invent a fallback.
5. Obtain explicit approval before live terminal focus/expiry smoke. Its gate
   checks editor input while provider work continues and a later active dialog
   survives popup expiry. No paid provider is required; no credential/install
   change is implied. Offline TUI evidence does not substitute for this gate.

#### Completion contract

All22 stable criteria must have passing native boundary evidence, required
variant matrices/remaining control/error branches reviewed, completed premium
review, and the live focus gate satisfied or explicitly deferred with M2.4 open.
Check-only verification makes no empty commit. Original M2 source checkbox edits
need their concrete approval after full outcomes pass.

- [ ] Task2 complete
