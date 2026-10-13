# Pi Auto Model — Slice 1 Task List

- **Status:** In progress; Task 1 verified, Tasks 2–5 awaiting compilation
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
approved. Tasks 2–5 remain contracts, not executable instructions; each needs
its own compiled payload and per-edit approval. Whole-slice acceptance stays
separate from these task gates.

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
- **Supports:** M1.2, M1.4; R02–R06, R11–R19, R22, R48, R50
- **Location:** `src/policy.ts`, `test/policy.test.ts`,
  `test/support/session.ts`, `test/tier-routing.test.ts`

**Stub / Signature:** Compile exact exported TypeScript types for the four
ordered tiers; scalar physical pair; version-1 policy; captured physical pair;
classifier result; eligible intent; and one route-decision function. Keep
parsing, confirmation, candidate lookup and error details private unless an
actual caller needs them. Validation receives unknown JSON, not a trusted cast.

**Test (red):** Use concrete policy-call expectations for AC001–AC004,
AC010–AC011, AC023–AC028, including:

| Input / condition | Required result |
| --- | --- |
| Each valid scalar tier | Exact default pair |
| `"  CoMpLeX  "` | Complex tier |
| Missing/empty/unknown/list/number metadata | Absent tier; classifier path remains eligible |
| Familiar skill named commit, metadata complex | Sol/xhigh; no name override |
| Complex absent, moderate available | Moderate pair; never frontier |
| Frontier/complex/moderate absent, trivial present | Trivial configured pair |
| Trivial absent, known current Sol/xhigh | Keep current; never step up |
| Fixed Sol, complex effort unsupported, moderate high supported | Sol/high |
| No active/captured physical evidence and no usable tier | Actionable physical-selection error |
| `max` in tier/classifier; invalid summary tier/mode/schema/bounds | Actionable config error before dispatch |
| Virtual target, conflicting or malformed exact pair | Actionable config error |
| Unsupported exact effort | Unavailable candidate, not a silently clamped request |

**Implementation (green):** Validate every configuration field and reject
unknown/conflicting structures. Normalize valid strings with trim/lowercase;
other metadata types are absent. Read raw frontmatter with the public parser.
Resolve only configured physical pairs with catalog/auth availability and exact
supported effort. In effort-only mode substitute the captured model before
checking each effort. Walk the ordered tier list downward only. Do not perform
live entitlement probes. Keep-current uses physical evidence, not Auto.

**Verify:** `make test` and `make typecheck` exit 0. Public-boundary dispatch
cases independently assert exact model and effort after Task 4 integration.
Unit tests must not assert helper-call choreography.

**Compiler completion:** Supply verbatim types, validation/route implementation,
stubs, table-driven tests and exact expected assertion-red failures. Confirm
all later tasks use identical exported names and signatures.

- [ ] Task 2 complete

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

Task 1's first worker stopped at npm dependency resolution with the empty
extension stub and nine scaffold files retained. The user-approved one-off
npm 11.21.0 diagnostic resolved the unchanged manifest without weakening peer
checks. Global npm remains unchanged. See
[the execution record](./execution.md#task-1-partial-outcome) for evidence.

Local install, missing-Auto assertion-red and baseline green source are now
present. The user approved correcting the two tests to await the SDK's
`Promise<void>` setter and assert selected Auto. The matching snippets above
are corrected; keep all physical dispatch assertions unchanged.

The approved setter correction is applied and the native unit test passes.
Cucumber's ESM config has an extra default-profile wrapper, so normal discovery
imports no step files. An explicit-import diagnostic passes the existing
scenario unchanged. The user approved flattening `cucumber.mjs`; its matching
snippet is corrected above. Keep assertions and permanent Make commands
unchanged.

Task 1's config correction is applied and all normal checks pass. Commit the
verified Task 1 source/tests/toolchain and evidence, then compile Task 2's
payload against these actual interfaces. Task 2 code needs its own edit
approval. No later task, future slice or global activation is approved.
