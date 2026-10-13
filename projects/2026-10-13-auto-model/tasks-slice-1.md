# Pi Auto Model — Slice 1 Task List

- **Status:** In progress; Tasks 1–2 committed and verified, Tasks 3–5 pending
- **Author:** Integralist
- **Created:** 2026-10-13
- **Language:** TypeScript
- **Source:** [Slice 1 plan](./plan.md#slice-1-native-main-conversation-routing)
- **Contract:** [Specification](./spec.md)
- **Evidence:** [Execution record](./execution.md)

## Summary

Users should be able to invoke unfamiliar skills without maintaining model-name
rules. This slice resolves portable skill tiers or classifies new task intent,
then uses Pi's native router to dispatch an exact physical model/effort pair.
Active work keeps its route, and unavailable candidates step down safely.

## Pull Request Delivery

- **Mode:** Single review unit in this repository; no cross-repository stack
- **Authorized branch:** `integralist/auto-model`
- **Base:** Unborn `main` at execution startup; setup is `f0baef3`
- **Scope:** Tasks 1–5, Slice 1 only

Creating or publishing a PR, changing branches, and later slices need separate
approval. Commit each verified task before launching the next task. Do not
infer acceptance of a milestone from its task commits.

## How to execute this list

Work top to bottom, one task at a time; do not skip ahead. For each task:

1. Find its layer in `Pull Request Delivery`. Complete every task assigned to
   that layer on the same branch. Create or switch stack branches only when
   crossing a layer boundary.
2. Add the **Test (red)** exactly as written, run its command, and confirm it
   fails with the stated failure.
3. Add the **Implementation (green)** as written.
4. Run **Verify** and confirm it passes.
5. Tick the task's checkbox only then.

For coordinated `execute-plan`, apply this protocol only to the assigned task;
return evidence before another task. The coordinator owns checkbox updates and
commits. A task's completion does not itself complete any supported milestone.

The passing test is the contract. If the implementation does not pass, fix the
implementation — never edit the test or weaken the check to force it green.

Before marking the whole list done:

- **Consistency** — if you changed a signature or pattern, `grep` every call
  site and apply the identical change.
- **Scope** — change nothing beyond these tasks.
- **Verification** — run the full test package these tasks live in, not only the
  tests you expected to flip.

The user approved a task-at-a-time workflow after recovery: compile and approve
one complete task payload, implement it, verify it, and commit it before
compiling the next task. Task 1's payload and local dependency installation are
approved and verified. Task 2's complete payload was separately approved and
its implementation is now verified. Tasks 3–5 remain contracts awaiting
compilation and approval. Whole-slice acceptance stays separate from these task gates.

## Context for the executor

### Verified repository and runtime

There is no implementation, package manifest, Makefile, or task commit at this
checkpoint. Preserve the existing execution-record hash update. The plan and
spec hashes still match the values in the execution record; original snapshots
remain in `/tmp/pi-auto-model-execution.A45nHV`.

The coordinator remains `github-copilot/gpt-6.1-sol`, `xhigh`. The authorized
implementation worker is `github-copilot/gpt-6-luna`, `xhigh`, with
`allow_model_fallback: false`, 60 turns and one budget-limited retry at 120.
Worker effort is not the router's Luna/high main-conversation mapping.

Use absolute repository paths in worker packets. Workers may edit only the
assigned task's approved files; they may not stage, commit, change branches,
update task checkboxes, or accept milestones. Installed Pi/configuration paths
and sibling repositories are read-only for this slice.

### Public API contracts

Installed SDK evidence below refers to Pi 1.2.0, not uncommitted upstream code.
The root of each `dist/` path is the installed
`@earendil-works/pi-coding-agent` package. These paths are inspection evidence,
not edit targets or published upstream permalinks.

| Boundary | Verified signature or behavior | Installed evidence |
| --- | --- | --- |
| Registration | `pi.registerVirtualModel<TState>(model)`; route gets request and extension context | `dist/core/extensions/types.d.ts:1402–1411` |
| Route request | `reason`, `previous`, `failed`, `state`, `messages`, `signal` | `dist/core/virtual-models.d.ts:31–63` |
| Route result | Physical `model`, exact `thinkingLevel`, optional JSON state | `dist/core/virtual-models.d.ts:65–76` |
| Input | Source is interactive/RPC/extension; busy delivery has `streamingBehavior` | `dist/core/extensions/types.d.ts:908–931` |
| Idle | `ctx.isIdle()`; `ctx.hasPendingMessages()` | `dist/core/extensions/types.d.ts:236–245` |
| Loaded skill | `pi.getCommands()` exposes `source: skill`, description and `sourceInfo.path` | `dist/core/agent-session.js:2713–2733` |
| Skill expansion | Explicit `/skill:name`; expanded block includes name, location, body and arguments | `dist/core/agent-session.js:1697–1722` |
| Accepted run | `before_agent_start` distinguishes user/custom and exposes expanded prompt | `dist/core/extensions/types.d.ts:727–744` |
| Parsing | Public `parseFrontmatter`; discovered skills do not carry arbitrary metadata | `dist/index.d.ts:39`; `dist/core/skills.d.ts` |
| Physical dispatch | `ctx.modelRegistry.streamSimple(model, context, options)` | `dist/core/model-registry.d.ts:39` |
| Availability | `find`, `getAvailable`, `hasConfiguredAuth` | `dist/core/model-registry.d.ts:27–32` |
| Exact effort | `getSupportedThinkingLevels` and `clampThinkingLevel` from pi-ai | pi-ai `dist/models.d.ts:267–268` |
| Session ownership | `getSessionId`, `getLeafId`, active `getBranch` | `dist/core/session-manager.d.ts:178` |

The prior session's final offline probe succeeded: virtual selection `auto`,
physical `gpt-6-luna`, effort `high`, one fake provider call, no extension
errors. Its important setup correction was to await
`runtime.refresh({ allowNetwork: false })` after native fake-provider and
virtual registration. Catalog registration alone left the availability
snapshot stale. Reuse this discovery; do not repeat exploratory probes.

### Compile-time choices

1. Keep one deep `src/policy.ts` boundary for validation, metadata, bounded
   classification, confirmation detection, availability, and route decisions.
   Put host event ownership and registration in `extensions/auto-model.ts`.
2. Use an explicitly physical classifier request, strict scalar text output
   from the four-tier vocabulary, no tools, bounded input/output and a deadline.
   Do not depend on unverified provider structured-output support.
3. Match actual loaded command name and source path. Skill classification gets
   its name and description, not its body or arguments. Unknown slash commands
   and copied skill blocks are not verified skill invocations.
4. Bind raw eligible input to the accepted expanded user run before consuming
   it in routing. A handled/transformed/canceled input must not leave intent
   available to an unrelated request. Busy input must not replace active intent.
5. Resolve continuation/retry first from physical evidence and native branch
   state. Direct summaries use the summary tier without consuming pending intent
   or returning new main task state. Cancellation/lifecycle generation guards
   must discard late classifier results.

Default pairs: trivial/moderate → Copilot GPT-6 Luna/high;
complex/frontier → Copilot GPT-6.1 Sol/xhigh. Classifier starts on Luna/high.
Automatic configuration must never use `max`; manual effort choices are not
reinterpreted as tiers. Slice 2 owns controls, preference files and popup UI.

### Dependency pins recovered from preflight

| Package | Pin | Scope |
| --- | --- | --- |
| `@earendil-works/pi-coding-agent` | `1.2.0` | Development SDK; runtime peer `*` |
| `vitest` | `4.1.11` | Development tests |
| `typescript` | `7.0.2` | Development typecheck |
| `@cucumber/cucumber` | `13.3.0` | Development executable acceptance |
| `tsx` | `4.23.15` | Development TypeScript execution |
| `@types/node` | `24.19.2` | Development types matching the Node 24 runtime |

The first four pins were verified in the prior session. The last two were
verified during recovery. Host-provided pi-ai/pi-agent-core/coding-agent
packages are peers, never bundled runtime `dependencies`. Pin development
copies to `1.2.0` consistently with the verified SDK release.

## Milestone coverage

| Source milestone | Compiled tasks | Outcome verification |
| --- | --- | --- |
| M1.1 | Tasks 1, 5 | Runnable Vitest/Cucumber public-boundary harness; assertion-red evidence; full `make test` |
| M1.2 | Tasks 2, 3, 4, 5 | AC001–AC009 through loaded-skill fixtures and observed physical provider requests |
| M1.3 | Tasks 3, 4, 5 | AC012–AC017, AC030; queue/cancel/handled/transform/session/tree ownership cases |
| M1.4 | Tasks 2, 3, 4, 5 | AC010–AC011, AC023–AC028; exact-effort, invalid-config and keep-current error cases |

Source scenarios are stable keys in [the execution record](./execution.md).
All task, milestone and scenario outcomes are unverified. This table records
coverage, not completion.

## Tasks

### Task 1: Establish executable offline boundaries

- **Key:** `slice-1/task-1`
- **Delivers:** A local test/typecheck/load-check toolchain and a real Pi SDK
  session harness that dispatches only to a native fake provider.
- **Supports:** M1.1; R01, R48–R49, R51–R52
- **Location:** `package.json`, `package-lock.json`, `.gitignore`, `Makefile`,
  `tsconfig.json`, `vitest.config.ts`, `cucumber.mjs`, `test/support/session.ts`,
  `test/native-boundary.test.ts`, `features/native-boundary.feature`,
  `features/steps/native-boundary.ts`, `extensions/auto-model.ts`
- **Requires approval:** Exact file proposal and local dependency installation.

**Stub / Signature:** Export the default extension factory with the public
`ExtensionAPI` type. The initial stub loads but does not register Auto. The
harness returns a created SDK session, runtime, fake provider observations,
errors, and idempotent cleanup. Use isolated temporary cwd/agentDir and in-memory
credential/model/session/settings stores. Disable network refresh, default
extensions, context files, cache warming, retries and compaction.

**Test (red):** At the public SDK boundary, load the stub and assert that
`runtime.getModel("github-copilot", "auto")` exists. This must fail on that
assertion, not import/type errors, authentication, or a real provider request.
Record the failing assertion output before implementing registration.

**Implementation (green):** Register Auto and route the baseline request to a
configured known physical startup pair. Refresh fake-provider availability
before dispatch. Supply a test session that selects Auto explicitly; extension
load alone must not select it. Keep this baseline factory minimal until Task 4.

**Verify:** `make test`, `make typecheck`, `make load-check` must exit 0.
Observe selected Auto separately from assistant physical provider/model/effort.
Confirm one baseline fake call and no real credentials or network access.

### Task 1 exact payload

The user approved these Task 1 files and local development dependency
installation. Runtime verification is pending. Later tasks remain
compiler-blocked and require their own edit approvals.

Create `package.json`:

```json
{
  "name": "pi-auto-model",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=24.6.0 <25" },
  "keywords": ["pi-package"],
  "pi": { "extensions": ["./extensions/auto-model.ts"] },
  "peerDependencies": {
    "@earendil-works/pi-ai": "*",
    "@earendil-works/pi-coding-agent": "*"
  },
  "devDependencies": {
    "@cucumber/cucumber": "13.3.0",
    "@earendil-works/pi-ai": "1.2.0",
    "@earendil-works/pi-coding-agent": "1.2.0",
    "@types/node": "24.19.2",
    "tsx": "4.23.15",
    "typescript": "7.0.2",
    "vitest": "4.1.11"
  }
}
```

Create `.gitignore`:

```gitignore
node_modules/
coverage/
*.tsbuildinfo
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["extensions/**/*.ts", "src/**/*.ts", "test/**/*.ts", "features/**/*.ts", "vitest.config.ts"]
}
```

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});
```

Create `cucumber.mjs`:

```javascript
export default {
  paths: ["features/**/*.feature"],
  import: ["features/steps/**/*.ts"],
  format: ["progress"],
  parallel: 0,
};
```

Create `Makefile`. Recipe indentation is a literal tab:

<!-- markdownlint-disable MD010 -->

```makefile
.PHONY: deps test test-unit test-acceptance typecheck load-check

deps:
	npm install --ignore-scripts

test: test-unit test-acceptance

test-unit:
	./node_modules/.bin/vitest run $(TEST_FILTER)

test-acceptance:
	NODE_OPTIONS="--import tsx" ./node_modules/.bin/cucumber-js

typecheck:
	./node_modules/.bin/tsc --noEmit

load-check:
	node --import tsx --input-type=module -e 'const m = await import("./extensions/auto-model.ts"); if (typeof m.default !== "function") throw new Error("Missing extension factory"); console.log("Extension module loads");'
```

<!-- markdownlint-enable MD010 -->

`make deps` generates the lockfile locally. Inspect install output and stop if
native runtime loading requires dependency scripts; propose the smallest
required follow-up separately rather than enabling scripts globally. This
command installs development dependencies here only, not a global Pi package.

Add the compiling red stub to `extensions/auto-model.ts`:

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function autoModel(_pi: ExtensionAPI): void {}
```

Create `test/support/session.ts`:

```typescript
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createAgentSession,
  DefaultResourceLoader,
  ModelRuntime,
  SessionManager,
  SettingsManager,
} from "@earendil-works/pi-coding-agent";
import {
  fauxAssistantMessage,
  fauxProvider,
  InMemoryCredentialStore,
  InMemoryModelsStore,
} from "@earendil-works/pi-ai";
import autoModel from "../../extensions/auto-model.ts";

export async function createFixture() {
  const dir = mkdtempSync(join(tmpdir(), "pi-auto-model-test-"));
  const faux = fauxProvider({
    provider: "github-copilot",
    models: [
      { id: "gpt-6.1-sol", reasoning: true },
      { id: "gpt-6-luna", reasoning: true },
    ],
    tokensPerSecond: 1000000,
  });
  for (const model of faux.models) {
    model.thinkingLevelMap = { high: "high", xhigh: "xhigh" };
  }
  const runtime = await ModelRuntime.create({
    credentials: new InMemoryCredentialStore(),
    modelsStore: new InMemoryModelsStore(),
    modelsPath: null,
    refreshOnCreate: false,
    allowModelNetwork: false,
  });
  runtime.registerNativeProvider(faux.provider);
  const settings = SettingsManager.inMemory({
    compaction: { enabled: false },
    retry: { enabled: false },
    cacheWarming: "off",
  });
  const errors: string[] = [];
  const loader = new DefaultResourceLoader({
    cwd: dir,
    agentDir: dir,
    settingsManager: settings,
    noExtensions: true,
    noSkills: true,
    noPromptTemplates: true,
    noThemes: true,
    noContextFiles: true,
    extensionFactories: [autoModel],
  });
  try {
    await loader.reload();
    const { session } = await createAgentSession({
      cwd: dir,
      agentDir: dir,
      modelRuntime: runtime,
      resourceLoader: loader,
      settingsManager: settings,
      sessionManager: SessionManager.inMemory(dir),
      model: faux.getModel("gpt-6.1-sol")!,
      thinkingLevel: "xhigh",
      tools: [],
    });
    try {
      await session.bindExtensions({
        mode: "print",
        onError: (error) => errors.push(error.error),
      });
      await runtime.refresh({ allowNetwork: false });
      let closed = false;
      return {
        session, runtime, faux, errors, dir,
        respond(text = "offline") {
          faux.setResponses([fauxAssistantMessage(text)]);
        },
        close() {
          if (closed) return;
          closed = true;
          session.dispose();
          rmSync(dir, { recursive: true, force: true });
        },
      };
    } catch (error) {
      session.dispose();
      throw error;
    }
  } catch (error) {
    rmSync(dir, { recursive: true, force: true });
    throw error;
  }
}

export type Fixture = Awaited<ReturnType<typeof createFixture>>;
```

Create `test/native-boundary.test.ts`:

```typescript
import { expect, test } from "vitest";
import { createFixture } from "./support/session.ts";

test("native Auto is opt-in and dispatches a physical baseline pair", async () => {
  const fixture = await createFixture();
  try {
    expect(fixture.session.model?.id).toBe("gpt-6.1-sol");
    const auto = fixture.runtime.getModel("github-copilot", "auto");
    expect(auto, "registered native Auto").toBeDefined();
    if (!auto) return;
    await fixture.session.setModel(auto);
    expect(fixture.session.model?.id).toBe("auto");
    fixture.respond();
    await fixture.session.prompt("offline boundary proof");
    const response = fixture.session.messages
      .filter((message) => message.role === "assistant").at(-1);
    expect(fixture.session.model?.id).toBe("auto");
    expect(response?.provider).toBe("github-copilot");
    expect(response?.model).toBe("gpt-6.1-sol");
    expect(response?.thinkingLevel).toBe("xhigh");
    expect(response?.stopReason).toBe("stop");
    expect(fixture.faux.state.callCount).toBe(1);
    expect(fixture.errors).toEqual([]);
  } finally {
    fixture.close();
  }
});
```

Run `make test-unit TEST_FILTER=test/native-boundary.test.ts` with the stub.
Expect the `registered native Auto` assertion to fail because Auto is absent.
If the harness fails before that assertion, fix only harness/setup errors and
repeat the red check. Do not count a type/import/provider failure as TDD proof.

Replace the stub with this temporary baseline green factory:

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function autoModel(pi: ExtensionAPI): void {
  pi.on("session_start", (_event, ctx) => {
    if (ctx.modelRegistry.find("github-copilot", "auto")) {
      throw new Error("github-copilot/auto already exists; choose a free ID");
    }
    pi.registerVirtualModel({
      provider: "github-copilot",
      id: "auto",
      name: "Auto",
      thinkingLevels: ["high", "xhigh"],
      route(_request, routeContext) {
        const model = routeContext.modelRegistry.find(
          "github-copilot", "gpt-6.1-sol",
        );
        if (!model || model.api === "pi-virtual") {
          throw new Error("Select an available physical startup model");
        }
        return { model, thinkingLevel: "xhigh" };
      },
    });
  });
}
```

This factory proves native wiring only. It is not tier routing, and Task 4
replaces it; no milestone is accepted from this baseline.

Create `features/native-boundary.feature`:

```gherkin
Feature: Offline native dispatch boundary
  Scenario: Auto dispatches physical settings without selecting itself on load
    Given an isolated Pi session starts on physical Sol at xhigh
    When I explicitly select native Auto and send an offline request
    Then selection is Auto and the physical response is Sol at xhigh
    And no extension error or live provider request occurs
```

Create `features/steps/native-boundary.ts`:

```typescript
import assert from "node:assert/strict";
import { After, Given, Then, When } from "@cucumber/cucumber";
import { createFixture, type Fixture } from "../../test/support/session.ts";

type World = { fixture?: Fixture };

After(function (this: World) {
  this.fixture?.close();
});

Given("an isolated Pi session starts on physical Sol at xhigh", async function (this: World) {
  this.fixture = await createFixture();
  assert.equal(this.fixture.session.model?.id, "gpt-6.1-sol");
  assert.equal(this.fixture.session.thinkingLevel, "xhigh");
});

When("I explicitly select native Auto and send an offline request", async function (this: World) {
  const fixture = this.fixture!;
  const auto = fixture.runtime.getModel("github-copilot", "auto");
  assert.ok(auto, "registered native Auto");
  await fixture.session.setModel(auto);
  assert.equal(fixture.session.model?.id, "auto");
  fixture.respond();
  await fixture.session.prompt("offline boundary proof");
});

Then("selection is Auto and the physical response is Sol at xhigh", function (this: World) {
  const fixture = this.fixture!;
  const response = fixture.session.messages
    .filter((message) => message.role === "assistant").at(-1);
  assert.equal(fixture.session.model?.id, "auto");
  assert.equal(response?.provider, "github-copilot");
  assert.equal(response?.model, "gpt-6.1-sol");
  assert.equal(response?.thinkingLevel, "xhigh");
  assert.equal(response?.stopReason, "stop");
});

Then("no extension error or live provider request occurs", function (this: World) {
  assert.deepEqual(this.fixture!.errors, []);
  assert.equal(this.fixture!.faux.state.callCount, 1);
});
```

**Task 1 final checks:** Run `make test`, `make typecheck`, `make load-check`.
Expected: one passing native Vitest test, one passing Cucumber scenario, no type
errors and `Extension module loads`. Runtime evidence is still pending until
these commands execute after approval.

- [x] Task 1 complete

**Coordinator verification:** `make test typecheck load-check` exited 0. One
native Vitest test and one Cucumber scenario passed through the normal Make
commands; Cucumber reports five steps including cleanup. The original
missing-Auto assertion-red proof is preserved in the execution record. This
accepts Task 1's offline scaffold only, not M1.1 or any slice milestone.

### Task 2: Resolve validated tiers and exact availability

- **Key:** `slice-1/task-2`
- **Delivers:** One policy boundary that normalizes skill tiers and selects the
  nearest available smaller physical pair, or safely retains a known pair.
- **Supports:** M1.2, M1.4; R02–R04, R06, R12–R17, R19, R22, R48, R50
- **Location:** New `src/policy.ts` and `test/policy.test.ts` only
- **Status:** Complete; approved payload committed and verified at `50f8af9`

The original four-file location was an upper bound. This task needs only two
new files: native-dispatch integration belongs to Task 4. Keep the verified
extension, session harness, feature files, manifests and dependency pins intact.
Requirements shared with classification, retries or ownership remain pending
in Tasks 3–5; these unit tests do not accept their native-dispatch scenarios.

**Public boundary:** `resolveRoute(configuration, input, registry)` returns a
physical model, exact effort, selected fallback tier or retained-evidence
source. It receives unknown configuration, raw content from an already resolved
loaded skill, an already obtained classifier result, and current/captured
physical evidence. All parsing, validation and downward selection are private.
Task 3 owns obtaining the classifier result; Task 4 owns input eligibility and
loaded-skill resolution. Do not add speculative classifier/ownership types now.

**Configuration choices:** Undefined configuration uses the spec's default
pairs. An explicitly supplied version-1 object must contain exactly `version`,
`tiers`, `classifier`, `summaryTier` and `mode`, with all four tiers present.
This prevents a typo or legacy per-skill override from silently taking effect.
Pairs use separate `provider`, `model`, and `effort` fields. Classifier bounds
are positive safe integers: `maxInputChars`, `maxOutputTokens`, `timeoutMs`.
Default bounds are 12,000 characters, 64 output tokens and 10,000 milliseconds;
they are configuration limits, not estimates or classifier execution here.
Automatic efforts may be Pi-supported levels other than `max`; defaults remain
high/xhigh. Direct summaries derive effort from `summaryTier`, not a separate
conflicting summary pair.

**Evidence:** Pi 1.2.0 publicly exports `parseFrontmatter` and `ModelRegistry`.
`ModelRegistry.find` and `hasConfiguredAuth` are synchronous catalog/auth checks
(`dist/core/model-registry.d.ts:27–32`). Pi-ai's
`getSupportedThinkingLevels` lists exact accepted efforts
(`dist/models.d.ts:267`; `dist/models.js:680–690`). Use that membership check,
not clamping. Missing catalog/auth makes a candidate unavailable; a known
virtual target is an actionable configuration error even in an unused tier.
No live entitlement probe or new dependency is involved.

**Retained evidence:** Prefer valid current physical evidence over valid
captured evidence. Evidence must resolve to a non-virtual catalog model and an
exact supported non-max effort; an invalid current pair may fall back to valid
captured evidence. Retention does not speculate about fresh entitlement or
quota. In effort-only mode the captured model identity is required; check each
tier effort against that model, not the configured tier model. Current evidence
from a different model cannot replace that fixed model. These guards do not
implement lifecycle or branch ownership; Task 4 must supply owned evidence.

### Task 2 stub and assertion-red

Create `src/policy.ts` with these public types and the compiling stub:

```typescript
import type { Api, Model, ModelThinkingLevel } from "@earendil-works/pi-ai";
import type { ModelRegistry } from "@earendil-works/pi-coding-agent";

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

export function resolveRoute(
  _configuration: unknown,
  _input: RouteInput,
  registry: RoutingRegistry,
): RouteDecision {
  return {
    model: registry.find("github-copilot", "gpt-6.1-sol")!,
    thinkingLevel: "xhigh",
    source: "current",
  };
}
```

Add the complete test file below, then run:

```bash
make test-unit TEST_FILTER=test/policy.test.ts
```

Required red proof: `declared trivial selects its exact default pair` reaches
`resolveRoute` and asserts Luna/high/trivial/tier, but the stub returns
Sol/xhigh/current. Preserve that assertion failure and real exit code.
Import/type/parser setup errors do not count. Run `make typecheck` before the
red check if needed to distinguish compilation from behavior.

### Task 2 exact tests

Create `test/policy.test.ts`:

```typescript
import { fauxProvider, type Api, type Model } from "@earendil-works/pi-ai";
import { describe, expect, test } from "vitest";
import {
  resolveRoute,
  type PhysicalPair,
  type RouteDecision,
  type RoutingRegistry,
} from "../src/policy.ts";

const luna: PhysicalPair = {
  provider: "github-copilot", model: "gpt-6-luna", effort: "high",
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
      trivial: { ...luna }, moderate: { ...luna },
      complex: { ...sol }, frontier: { ...sol },
    },
    classifier: {
      ...luna, maxInputChars: 12000, maxOutputTokens: 64, timeoutMs: 10000,
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
    model.thinkingLevelMap = { high: "high", xhigh: "xhigh" };
    catalog.set(`${model.provider}/${model.id}`, model);
  }
  const authenticated = new Set(["github-copilot"]);
  const registry: RoutingRegistry = {
    find: (name, id) => catalog.get(`${name}/${id}`),
    hasConfiguredAuth: (model) => authenticated.has(model.provider),
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

describe("portable tiers", () => {
  test.each<[string, PhysicalPair]>([
    ["trivial", luna], ["moderate", luna], ["complex", sol], ["frontier", sol],
  ])("declared %s selects its exact default pair", (tier, pair) => {
    expect(route({ skillContent: skill(tier), classifiedTier: "frontier" }))
      .toEqual({ ...pair, tier, source: "tier" });
  });

  test("trimmed metadata wins over the familiar commit name and classification", () => {
    expect(route({ skillContent: skill("  CoMpLeX  "), classifiedTier: "trivial" }))
      .toEqual({ ...sol, tier: "complex", source: "tier" });
  });

  test.each(["", "unknown", ["trivial"], 4, null, true, { tier: "complex" }]
    .map((value) => ({ value })))(
    "invalid scalar metadata $value allows the classified tier", ({ value }) => {
      expect(route({ skillContent: skill(value), classifiedTier: "moderate" }))
        .toEqual({ ...luna, tier: "moderate", source: "tier" });
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
      .toEqual({ ...sol, tier: "complex", source: "tier" });
  });

  test("typed input uses its own supplied classifier result", () => {
    expect(route({ classifiedTier: "moderate", current: sol }))
      .toEqual({ ...luna, tier: "moderate", source: "tier" });
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
      .toEqual({ ...luna, model: "small", tier: "moderate", source: "tier" });
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
      .toEqual({ ...luna, tier: "moderate", source: "tier" });
  });

  test("unsupported exact xhigh steps down rather than clamping", () => {
    const f = fixture();
    f.catalog.get("github-copilot/gpt-6.1-sol")!.thinkingLevelMap = { xhigh: null };
    expect(view(resolveRoute(undefined, { classifiedTier: "complex" }, f.registry)))
      .toEqual({ ...luna, tier: "moderate", source: "tier" });
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
      .toEqual({ ...sol, effort: "high", tier: "moderate", source: "tier" });
  });

  test("effort-only tests exact effort against the fixed model", () => {
    const f = fixture();
    f.catalog.get("github-copilot/gpt-6.1-sol")!.thinkingLevelMap = { xhigh: null };
    const raw = configuration();
    raw.mode = "effort-only";
    expect(view(resolveRoute(raw, { classifiedTier: "complex", captured: sol }, f.registry)))
      .toEqual({ ...sol, effort: "high", tier: "moderate", source: "tier" });
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
      .toEqual({ ...luna, model: "small", tier: "moderate", source: "tier" });
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
```

### Task 2 exact green implementation

Replace the stub in `src/policy.ts` with this complete file. The public types
match the stub exactly. Keep the red tests unchanged.

```typescript
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
```

### Task 2 verification and approval gate

Run all checks through the unchanged Makefile:

```bash
make test-unit TEST_FILTER=test/policy.test.ts
make test
make typecheck
make load-check
```

Expected: all new policy tests plus the existing native Vitest test and Cucumber
scenario pass; typecheck and module load exit 0. Keep Task 1's native route at
its committed baseline until Task 4. Before implementation, both stub-plus-tests
and green-plus-tests passed TypeScript 7.0.2's in-memory preflight; that was not
behavioral proof.

The approved strict Luna/xhigh worker then added the exact stub and tests,
proved the required Luna/high versus Sol/xhigh assertion-red, and implemented
the exact green payload without deviations. The coordinator inspected both
files, matched them to the compiled snippets and reran all checks:

- Policy unit target: 107 passing tests; original behavioral red preserved.
- Full `make test`: 108 Vitest tests and one Cucumber scenario pass.
- `make typecheck` and `make load-check`: exit 0.
- Protected source/manifest/lockfile/plan/spec hashes: unchanged.
- Independent downward-selection check: all 64 availability combinations pass.

Logs are indexed in the execution record. Public classifier/native request
scenarios and slice milestones remain unaccepted. Commit this verified task
before Task 3.

- [x] Task 2 complete

### Task 3: Bound and isolate dynamic classification

- **Key:** `slice-1/task-3`
- **Delivers:** Best-effort classification of a skill's name/description or a
  typed task, without tools, chat messages or recursive virtual dispatch.
- **Supports:** M1.2–M1.4; R05, R07, R09–R10, R14, R19, R45, R50, R52
- **Location:** `src/policy.ts`, `test/classifier.test.ts`,
  `test/support/session.ts`, `test/classifier-boundary.test.ts`

**Stub / Signature:** Extend the Task 2 boundary with a classifier outcome
containing an optional tier and separately observable request usage. Accept an
explicit physical registry adapter and originating abort signal. Set finite
positive input-size, output-token and deadline bounds in validated policy.

**Test (red):** Observe the native fake provider's actual classifier request.
Cover AC005–AC009 and the classifier-failure portions of AC006/AC028:

1. Valid metadata produces no classifier request; absent/invalid metadata
   sends loaded name/description only. Poison body/argument fixtures must not
   reach classifier input.
2. Typed task classification sends only that task's bounded text; a prior
   skill's tier is not reused. Include the plan's five typed-task examples.
3. Classifier is a configured physical model at exact high effort, with no
   tools. Main selected model/route state and transcript stay unchanged during
   classification. Request usage is observable separately from main dispatch.
4. Empty/unknown/malformed/tool-call/error/aborted response, missing catalog,
   missing auth, unsupported effort, thrown stream errors and deadline expiry
   return no usable tier; main routing retains known current physical evidence.
5. Origin cancellation and session replacement cancel classifier work. A
   provider that resolves late cannot select a route for the replacement task.

**Implementation (green):** Use `ctx.modelRegistry.streamSimple` on the exact
physical classifier. Supply a fixed tier-definition system instruction and a
serialized bounded payload treated as task data. Require a successful response
with one valid scalar tier; reject explanations and additional output. Combine
request/lifecycle abort signals with a deadline; clean timer/listeners in a
`finally` block. Bound the wait even if a provider ignores its signal. Account
usage without inserting assistant/chat messages or changing main state.

**Verify:** `make test` and `make typecheck` exit 0. Fake clock cancellation
checks finish deterministically. No paid classifier or model probes occur.

**Compiler completion:** Supply verbatim bounded implementation and provider
fixtures, usage evidence shape, all failure tests and assertion-red commands.
Do not let a worker invent the classifier prompt, timeout mechanics or parser.

- [ ] Task 3 complete

### Task 4: Bind intent to native request ownership

- **Key:** `slice-1/task-4`
- **Delivers:** Opt-in registered Auto routing with eligible input provenance,
  sticky physical routes and lifecycle-safe pending intent.
- **Supports:** M1.2–M1.4; R01, R04, R07–R08, R15, R18, R20–R22, R45, R50
- **Location:** `extensions/auto-model.ts`, `src/policy.ts`,
  `test/request-ownership.test.ts`, `test/tier-routing.test.ts`,
  `test/support/session.ts`

**Stub / Signature:** Replace Task 1's baseline factory with the composed
policy. Native router state must be JSON-serializable and contain only the
physical/captured task data required by later requests. Keep transient pending
input/controller/generation state outside durable route state.

**Test (red):** Through registered events and actual SDK session requests,
cover AC001–AC017, AC024–AC028 and AC030 plus these explicit ownership cases:

| Sequence | Required observation |
| --- | --- |
| Idle explicit loaded skill command | Metadata or skill-name/description classification |
| Idle typed task after frontier skill | New classification; previous metadata discarded |
| `yes` after Sol/xhigh | Sticky Sol/xhigh; no classifier |
| `debug authentication` after Sol/xhigh | New task classification despite short text |
| Quoted skill example, copied skill listing or internal skill read | Not a slash metadata invocation |
| Busy steer/followUp, then queue delivery | Active route; no new classification |
| Extension-origin/custom-triggered work | Active route; no new classification |
| Tool results/automatic retry/live provider error | Previous/failed physical pair; no tier probe |
| Direct summary between input and main dispatch | Summary-tier pair; pending intent/main state unchanged |
| Later input handler consumes or transforms captured input | No stale original intent applied |
| Abort before dispatch or during classification | No later request uses canceled intent |
| Session replacement/reload/shutdown/tree/fork boundary | Old generation cannot mutate new state |
| Resume a different branch | Active branch evidence; no abandoned-branch route leakage |
| Auto registration ID already belongs to a catalog model | Actionable collision error; do not replace it |
| Auto loaded but physical model selected | No classification or model-selection mutation |

**Implementation (green):** Register on a context-bearing session lifecycle
boundary and detect collision before registration. Capture eligible raw user
input only when idle and unqueued, before expansion. Resolve actual loaded
skill commands from public command metadata and raw frontmatter. Bind captured
intent to the accepted expanded user prompt; never infer eligibility merely
from native `reason: user`. Check originating session and generation before and
after awaits. Invalidate owned pending work on cancellation and lifecycle
changes, without replacing an active task's intent with busy input.

Direct requests are separate: select summary-tier availability without
classification or main-state mutation. Retry keeps `failed`; continuation keeps
`previous`; otherwise use native physical state or captured physical startup.
Reject virtual/unknown keep-current evidence. Do not add preference files,
on/off commands or popup UI here; those are Slice 2. Do not select Auto merely
because the extension loads.

**Verify:** `make test`, `make typecheck`, `make load-check` exit 0.
Native assistant metadata, not selected/requested labels, is dispatch evidence.
Verify that unknown-origin requests cannot consume another input's pending
intent. Ensure provider failures do not trigger speculative tier fallback.

**Compiler completion:** Supply verbatim event registration, intent identity,
state reconstruction/cancellation, exact tests and code. Verify event names,
public source path and transformed-input matching against installed Pi. If a
public boundary cannot prove identity, return to the coordinator; do not loosen
ownership or delegate that design decision.

- [ ] Task 4 complete

### Task 5: Verify the complete slice through executable acceptance

- **Key:** `slice-1/task-5`
- **Delivers:** A full offline acceptance gate for the shared skill contract and
  Pi-specific routing, with reviewable requirement/scenario outcome evidence.
- **Supports:** M1.1–M1.4; R01–R22, R45–R52, R54, R56, R59–R60
- **Location:** `features/portable-tiers.feature`,
  `features/main-routing.feature`, `features/routing-safety.feature`,
  `features/steps/routing.ts`, `test/support/session.ts`,
  `test/load-check.test.ts`; coordinator-only updates to this task list and
  `execution.md`

**Test (red):** Port every example of AC001–AC017, AC023–AC028 and AC030 to
executable Cucumber scenarios. Include all extra Slice 1 ownership/config/error
cases above. At least one positive dispatch scenario must fail on an assertion
with routing deliberately stubbed; no scenario may pass through a no-op step,
skipped hook or mocked routing result. Keep tools/providers/classifier transport
fake, while running the real SDK, registered extension, loaded resources and
native dispatch. The application boundary itself is not mocked.

**Implementation (green):** Supply exact feature text and step definitions
using the Task 1 harness and final registered extension. Assert concrete
physical provider/model/effort, classifier payload isolation, ordered fallback,
request counts only where contract-relevant, transcript isolation and native
state lifetime. Cover each public validation/error branch. Do not weaken an
assertion to match the current code. Corrections go through the coordinator and
same authorized worker with task-linked correction commits.

**Verify:** Run `make test`, `make typecheck`, `make load-check` and the unchanged
worker-policy check:

```bash
make -C /Users/mmcdonnell/code/agent-skills check-execute-plan
```

Record command exit codes, baseline comparisons and unavailable checks.
Inspect the cumulative slice diff and protected source state. Obtain independent
read-only premium review before accepting M1.1–M1.4. No live model/classifier,
global installation, settings or popup probes are authorized by this slice.

**Compiler completion:** Supply all verbatim feature/step files and exact final
commands before launch. Verify each scenario key/example and every M1 outcome
has executable evidence. Mark tasks only after checks and commits; mark plan
milestones only after independent review and slice acceptance.

- [ ] Task 5 complete

## Compiler gate and next action

The approved recovery workflow compiles and executes one bounded task at a
time; it no longer requires all five green implementations before Task 1.
A worker may execute only a task with a complete payload and explicit approval.
Keep the stable IDs, milestone coverage, coordinator verification/commit gate
and final independent slice review unchanged.

Task 1 is verified and committed at `3b68e86`; Task 2's approved policy and
107-test payload are verified and committed at `50f8af9`. The extension and
existing harness remain unchanged.

Compile Task 3's bounded classifier payload against the committed policy
interface. Task 3 code needs its own edit approval. No later
task implementation, future slice, global activation or live provider probe is
approved. The execution record owns hashes, check evidence and worker telemetry.
