# Pi Auto Model — Implementation Plan

- **Status:** Planning
- **Author:** Integralist
- **Created:** 2026-10-13
- **Language:** TypeScript
- **Target source:** `/Users/mmcdonnell/code/pi-auto-model` (no code yet)
- **Verified host:** Pi 1.2.0

## Summary

Build an opt-in extension on Pi's native virtual-model API. Share the portable
`metadata.model-tier` vocabulary with the Claude Code auto-model mod, and use
bounded dynamic classification when skill metadata is absent or invalid.
Map trivial/moderate to Luna/high and complex/frontier to Sol/xhigh; complex
includes software implementation as well as planning. Improve existing plugins'
generic virtual-model compatibility without adding a router dependency.

This is a planning handoff, not authorization to change repositories, install
packages, update live settings, run paid probes, commit, or push. Follow each
repository's instructions and obtain the required edit approvals.

## Specification

The [specification](./spec.md) owns behavior and acceptance criteria. This
plan owns implementation choices, source ownership, milestones, and rollout.

## Architectural Decision — Native Routing

Use `pi.registerVirtualModel()` inside `pi-auto-model`; do not build another
provider, session harness, or routing service. Register `github-copilot/auto`
with collision detection, while dispatching to the two configured physical
Copilot models. Confirm the identifier is free in the live catalog first.

Pi separates selected virtual settings from physical dispatch, records the
physical pair on assistant messages, persists routing state per branch, and
checks the routed model's context limit. The router supplies policy and
controls; Pi owns dispatch. See [the pinned native routing contract][pi-vm].

| Approach | Benefits | Costs / limitations |
| --- | --- | --- |
| Native virtual model, chosen | Request-level dispatch; branch-persisted state; physical request metadata; routed context checks | Existing plugins must handle virtual selection separately from physical dispatch; requires the verified native API |
| Input-hook physical switching | Smaller first rollout; existing plugins see a physical selection | Policy mutates session selection; requires more bookkeeping around overrides, restoration, and eligible input |
| Separate classifier-first router | Duplicates native policy | Extra runtime |

Both model-routing approaches can change effort as well as model. Physical
model switches lose prompt-cache reuse; retain routes through tool follow-ups
and ordinary retries. Native routing is not a promise of zero cache misses.

Classification is part of the chosen native router's policy, not a separate
provider or routing architecture. Valid skill metadata avoids classifier calls;
missing or invalid metadata triggers bounded inference on name and description.
The shared field, normalization, precedence, fallback, and invocation lifetime
follow the user-supplied Claude mod contract in [the specification](./spec.md).
The shared-contract approval did not change the Claude mod or skills. The
[execution record](./execution.md) owns subsequent execution authorization.

This choice is recorded in
[the proposed native-routing ADR](../../docs/adr/ADR-0001.md).
Its [repository-wide index](../../docs/adr/README.md) is the decision registry.
A PRD is unnecessary for this personal tooling project.

## Prerequisites & Dependencies

1. Verify the installed Pi API and declarations, not just a copied example.
   Read its complete extension, virtual-model, skills, settings, package, and
   relevant SDK/TUI documentation before implementing their integration.
2. Use host-provided Pi packages as peer dependencies, not bundled runtime
   copies. The new router requires the native virtual-model API verified in
   Pi 1.2.0. See [Pi's package dependency contract][pi-packages].
3. Use Vitest for unit/integration tests, following the existing personal
   extension precedent, and Cucumber.js for executable feature acceptance.
   Wire both into the new repository's `make test`; choose compatible versions
   during task compilation, not from an unverified version guess.
4. Use fake providers and classifier responses for automated tests. Verify
   public skill resolution, raw metadata parsing, and physical classification
   dispatch during task compilation. Live classifier/model access and exact
   efforts need separately approved probes; catalog presence is not entitlement.
5. Recheck user-owned source revisions and preserve unrelated changes before
   editing. Third-party `pi-intercom` is unchanged and is not a prerequisite;
   the user accepts its unused handover limitation.

## Source Ownership

Edit the paths below directly. Installed copies under `~/.pi/agent/git/` and
`~/.pi/agent/npm/` are inspection references only, never edit targets.

| Package | Verified source checkout | Inspected revision | Planned action |
| --- | --- | --- | --- |
| New router | `/Users/mmcdonnell/code/pi-auto-model` | No commits at execution start | Implement approved tasks |
| `pi-statusbar` | `/Users/mmcdonnell/code/pi-statusbar` | `c7a3d3462ce4b3c946da931470e8646b6eac4c0a` | Generic virtual-selection display |
| `pi-subagents` | `/Users/mmcdonnell/code/pi-subagents` | `fb6a54caf28fc7bf8e0a163c8dc80986bc17dee5` | Physical inheritance and fallback |
| `pi-btw` | `/Users/mmcdonnell/code/pi-btw` | `9643b67d8b2850c33a32824b145dc0bcd6c43a8c` | Physical child defaults and SDK compatibility |
| `pi-context-shake` | `/Users/mmcdonnell/code/pi-context-shake` | `c4cdabc7ca35cc501e6f897a2756ff1753424f5e` | Safe virtual-model guards |
| `pi-transcript-enhancer` | `/Users/mmcdonnell/code/pi-transcript-enhancer` | `7d6afe38086b31340b26cd790a5e30f6e0030198` | Regression check; no model-dependent change found |
| `pi-skill-argument-hints` | `/Users/mmcdonnell/code/pi-skill-argument-hints` | `ed00e07a8ba5cdb8a5f8c58c87310d479624255a` | Regression check; no model-dependent change found |
| `pi-intercom` | Third-party npm installation; no edit target | Installed npm version `0.17.0` | Leave unchanged; accepted unused handover limitation |
| Personal configuration / skills | `/Users/mmcdonnell/code/agent-skills` | `fb4a51ae5000f0989519df49dac643e23d7e6b25` plus unrelated local changes | Scoped Pi integration only |
| Internal skill package | `/Users/mmcdonnell/code/fastly/agent-skills-internal` | Not audited for this change | No routing changes required |

`pi-intercom` is not the user's extension. Source acquisition, patches, forks,
uninstallation, and upstream changes are outside this project's edit boundary.
The user does not use it and accepts generated handovers being unavailable with
Auto selected. It remains installed; this limitation does not block native
routing or rollout. Any later removal requires separate approval and consistent
changes to the Makefile and repo-owned package settings.

The handoff's original dirty-file inventory is historical. Recheck live source
before each later slice; [the execution record](./execution.md) captures startup
revisions and protected changes. Preserve unrelated work, including
independently committed Claude-mod and skill changes. Pinned research
references below retain the inspected historical revision, not a claim about
the current working tree.

## Standalone Plugin Contract

This is a release gate for every existing plugin change:

- Add no dependency, peer dependency, import, shared service, or required event
  listener from `pi-auto-model`.
- Use Pi's public context, catalog, events, and assistant metadata. Do not read
  this router's custom entries or tier configuration from another plugin.
- With a physical model and no router installed, preserve existing behavior,
  explicit overrides, rendering, strict fallback settings, and errors.
- Test generic virtual-model support using a tiny synthetic router fixture
  owned by each plugin's tests. Do not install the new router in those tests.
- Review host-version support separately from router independence. Preserve
  existing supported host versions where possible; widening or raising a Pi
  version range must be supported by tests and disclosed, not guessed.

There is no new shared compatibility package in V1. Keep each plugin's small
physical-resolution helper local to its own module boundary. Do not introduce
router-specific coupling to save a few lines of independently testable logic.

## Implementation

### Slice 1: Native main-conversation routing

- **Blocked by:** None; implementation still needs the required approvals.
- **Delivers:** Portable tier metadata and dynamic classification for arbitrary
  loaded skills, with exact physical dispatch and ordered availability fallback.
- **Consumes:** Pi's `ExtensionAPI`, `ModelRouteRequest`, `ModelRoute`, input
  event, loaded skills, catalog lookup, and physical assistant metadata.
- **Produces:** `github-copilot/auto`; validated tier/classifier configuration;
  runnable acceptance for the shared contract and Pi-specific dispatch.

Own these files in the new repository: `package.json`, `Makefile`,
`extensions/auto-model.ts`, `src/policy.ts`, `test/`, and `features/`.
Keep the policy module deep: callers provide eligible intent and state and
receive one route decision. Metadata parsing, bounded classification, and
availability resolution stay behind that boundary; avoid per-skill modules.

Use these configuration concepts:

| Key | Contract |
| --- | --- |
| `version` | Schema version, initially `1` |
| `tiers` | Four ordered tiers mapped to exact physical model/effort pairs |
| `classifier` | Exact physical model/effort and bounded request settings |
| `summaryTier` | Trivial by default; direct calls do not change task state |
| `mode` | `model-and-effort` or `effort-only` |

Default tier pairs are owned by [the specification](./spec.md#pi-tier-mapping).
Remove the former `skillProfiles`, profile-name defaults, and unmatched-prompt
Development fallback. There is no baked-in skill-name map or per-skill override.
The portable `metadata.model-tier` contract takes precedence over
classification; configuration maps tiers, not names, to physical settings.
Any future per-skill override needs a decision shared with the Claude mod.

#### Skill resolution and classification

Observe eligible input before skill expansion. Resolve an explicit
`/skill:name` against the session's loaded skills and read its frontmatter.
Verify the public resource API and parser during task compilation; do not
assume Pi's discovered skill records retain arbitrary metadata.

Normalize string values by trimming and matching without case. Valid tiers
bypass classification. Missing, empty, unknown, list, and numeric values are
absent metadata, not request failures. Classify the resolved skill's name and
description only; neither its instruction body nor slash arguments are input.
The classifier returns one of the four shared tiers or no usable result.

For the configured classifier, start with the existing physical Copilot
Luna/high pair, subject to catalog/authentication/API verification during task
compilation. Use a physical request through Pi's public registry dispatch,
without tools or a virtual selection. See [the dispatch contract][pi-streams].
Verify structured-output support before choosing an output format; reject
malformed or unknown tiers. Set bounded request/response sizes and a deadline;
wire cancellation to the originating session/request. No new provider account
or external classification service is required.

Classifier unavailability, timeouts, errors, and indeterminate output retain the
current physical pair. Classification is best-effort, not a guarantee of
correct difficulty assessment. Account for its request usage separately from
main dispatch; it must not generate a chat entry, change native main-route
state, or trigger a main switch popup. Fake classifier responses drive tests;
paid classifier probes need separate approval.

An explicit skill invocation wins over confirmation detection. Built-in
controls are not task prompts, and extension commands may be handled before
input interception. Do not claim generic routing for every slash command or
unverified plain `/name` aliases. Pi expands skills into named skill blocks;
see [the expansion contract][pi-input].

On the next eligible typed task, discard the previous skill's metadata and
classify the new prompt's difficulty using the same tiers. Short confirmations
retain the preceding pair as a continuation safeguard. Skills read internally
after the task begins never reroute it. Treat copied skill listings, quoted
examples, system text, and tool output as data, not slash invocations.

#### Availability and request lifetime

Resolve the selected tier's exact pair before dispatch. If it is unavailable,
walk toward smaller tiers in order and use the nearest available configured
pair. Never step up or invent a provider, model, effort, or credentials. If
none is available, retain the known current physical pair. In effort-only mode,
retain the captured model and check each tier's effort against that model.

Keep-current resolution uses active physical metadata or a captured physical
startup/restore pair, not `ctx.model` when selection is virtual. If neither
physical pair is known, ask for a physical selection. Reject malformed
configuration, `max`, virtual targets, and registration collisions. An
unsupported exact effort makes a tier candidate unavailable; Pi's clamping is
not proof that the configured effort was honored.

`reason: user` includes steering and follow-ups, so it alone is insufficient
as the eligibility guard. Combine input provenance/busy metadata with native
request state. Ignore busy and extension-origin submissions for rerouting and
classification. Test queued messages, cancellation, handled input, retries,
session replacement, and resumed branches so stale intent or classifier results
cannot select a route for an unrelated request. See
[the input types][pi-input-type].

Continuations retain the current physical pair; retries retain the failed pair.
Tier step-down is pre-dispatch availability policy, not runtime entitlement or
quota switching. Direct requests use the configured summary tier and its
availability fallback without reclassifying the main task, consuming pending
intent, or changing task state. Manual model/effort choices disable automation.

#### Slice 1 Milestones

- [ ] **M1.1:** Boundary acceptance runs via `make test` with fake provider and
  classifier responses; prove an assertion failure before implementation.
- [ ] **M1.2:** Metadata-first precedence, scalar normalization, arbitrary skill
  names, absent-metadata classification, and independent typed tasks satisfy
  the shared contract and dispatch to the configured tier pairs.
- [ ] **M1.3:** Continuations, retries, confirmations, busy/extension input,
  canceled classification, and direct summaries preserve request ownership.
- [ ] **M1.4:** Ordered step-down, all-unavailable keep-current, classifier
  failure, and exact-effort checks pass in both modes. Cover invalid settings
  and public error branches; automatic requests never use `max`.

### Slice 2: Quiet controls, persistence, and restoration

- **Blocked by:** Slice 1, for tier/configuration and dispatch contracts.
- **Delivers:** Safe on/off/status/mode controls, correct branch/session
  restoration, and a non-blocking ten-second model/effort switch popup.
- **Consumes:** Slice 1's configuration and native selection/dispatch boundary.
- **Produces:** `/automodel on`, `/automodel off`, `/automodel status`, and
  `/automodel mode model-and-effort|effort-only`.

Persist policy configuration outside the package at
`~/.pi/agent/pi-auto-model.json`. Persist enabled/mode preferences separately
at `~/.pi/agent/pi-auto-model-state.json`, using validated, atomic updates.
Do not overwrite user policy when toggling a preference. Missing files mean
built-in defaults with automation off; malformed files produce actionable
errors. Keep runtime/session restore data in non-context session entries and
native routing state, reconstructed from the active branch.

Capture a physical restore pair on enable. On resume, recover that pair;
do not replace it with the virtual selection. Manual model choice disables
routing without undoing the choice. Manual effort choice resolves the active
physical route and applies the requested effort. Distinguish controller-owned
selection changes from manual changes; avoid recursive selection handlers.

While busy, defer mode/off controls to a safe idle boundary without awaiting
idle in the command handler. Apply deferred state only to the session that
requested it. Explicit failures/status requests can report plain text; routine
switches create no chat entry. Exclude `max` from offered virtual thinking
choices.

#### Switch popup

Own popup behavior inside `pi-auto-model`, not in the status-bar extension.
Add a policy setting `switchPopup` with `enabled: true` and `durationMs: 10000`
as defaults; validate a positive, finite duration and allow disabling it.

Use Pi's native terminal overlay API with `overlay: true` and
`nonCapturing: true`; see [the UI contract][pi-tui] and
[the passive overlay example][pi-passive-overlay]. Render a small, static,
width-safe popup using the active theme, with the previous and new physical
model/effort pairs. A top-right position is the initial choice; test narrow and
wide terminal sizes. Do not introduce an OS notification, sound, animation,
clickable panel, or transcript message.

Trigger once when reliable main-request metadata establishes a changed physical
pair, including an effort-only change. Do not present the virtual selection or
an unverified target as observed dispatch. Unchanged tool follow-ups, retries,
and direct helper calls produce no switch popup.

Start the popup without awaiting its ten-second lifetime in routing or command
handlers. Keep editor focus and ongoing model/tool work intact. A newer change
replaces the existing popup and resets its timer; generation guards prevent an
old callback from closing a newer popup or affecting another session. Close
custom overlays through their completion callback, not their handle's `hide()`.
Ensure expiration cannot dismiss another active overlay or dialog; test this
against the installed Pi runtime rather than assuming stack cleanup is safe.

Use timers only from session/event operations, never during rendering or factory
load. Clean up on replacement, reload, and shutdown. Render only in interactive
mode (`ctx.mode === "tui"`); headless/RPC routing continues without a popup.
UI errors must not abort the request; the status bar remains the fallback.
Use fake timers for lifetime/replacement/cleanup tests and a live focus/overlay
smoke check after approval. This replaces the previous status-only requirement.

#### Slice 2 Milestones

- [ ] **M2.1:** Controls, manual choices, and busy-control deferral satisfy their
  acceptance scenarios without recursive switching or blocked commands.
- [ ] **M2.2:** New sessions, resume, compaction, reload, and tree navigation
  preserve valid state and restore both original physical settings on off.
- [ ] **M2.3:** Missing/corrupt state, failed restoration, shutdown, and canceled
  pending work have behavior-level tests and actionable failures.
- [ ] **M2.4:** Model-only and effort-only changes show one ten-second popup;
  focus, ongoing work, other dialogs, replacement timers, non-interactive
  operation, and lifecycle cleanup satisfy the popup acceptance scenarios.

### Slice 3: Independently installable plugin compatibility

- **Blocked by:** Verified Pi 1.2.0 contracts. May start alongside Slice 1 using
  synthetic native routers; no third-party source or upstream update is needed.
- **Delivers:** Existing plugins work independently with physical or generic
  virtual selections, and preserve explicit child settings.
- **Consumes:** Pi's public APIs and physical assistant-message metadata only.
- **Produces:** Standalone compatibility guarantees in each plugin's own tests
  and documentation; no router-specific shared interface.

| Source repository | Owned files / boundary | Required behavior |
| --- | --- | --- |
| `pi-statusbar` | `extensions/pi-statusbar.ts`, relevant tests and docs | Physical selections retain existing rendering. Virtual selections show selected vs observed physical settings honestly. Initialize from active-branch metadata; refresh on live assistant events, selection changes, and tree navigation. Render generic extension status text if needed without knowing a router key. |
| `pi-subagents` | `src/runner.ts`, `src/spawn.ts`, relevant selection/registry helpers, tests, `package.json` and lockfile if required | Explicit child overrides win. Inherited startup, UI records, resumptions, and allowed fallback use a physical parent pair, never an unregistered virtual target. Preserve strict no-fallback behavior and keep the child extension-free. |
| `pi-btw` | `extensions/btw.ts`, tests, docs, `package.json` and lockfile if required | Resolve inherited/default/fallback models and efforts to a physical pair for side conversations and their summary sessions. Preserve explicit BTW settings. Main routing never mutates a live BTW session or its identity text. |
| `pi-context-shake` | `index.ts`, tests and docs | Preserve signed thinking when virtual target compatibility is unknown. Do not cancel compaction using an assumed virtual context limit. Use trustworthy context usage or let Pi decide. Keep ordinary physical behavior unchanged. |

Resolve physical inheritance from a selected physical model or the latest
successful physical assistant metadata on the active branch, with catalog
lookup. Preserve the matching effort from that same source; do not combine a
physical model with the virtual selection's effort. Ignore failed/aborted
responses as inheritance evidence. If there is no known physical pair, use an
explicit physical override or return an actionable selection requirement.
Do not reach into Pi's private runtime or invoke a parent router in a child.

The status bar currently reads selected settings; see [its source][statusbar].
Subagents currently inherit `ctx.model` while disabling extension loading;
see [child creation][subagents] and [loader isolation][child-loader]. BTW has
similar inheritance and child-session creation; see [defaults][btw-defaults]
and [child creation][btw-child]. Context shaking assumes physical API/limits;
see [the signature predicate][shake-signatures] and [compaction guard][shake-size].

`pi-subagents` tests currently pin Pi packages to 0.84.2. `pi-btw` advertises
`>=0.85.1 <1` peers. Make those declarations/testing reflect verified host
compatibility rather than silently claiming support; see [subagent package
metadata][subagent-package] and [BTW package metadata][btw-package]. This is
separate from requiring `pi-auto-model`, which remains prohibited.

#### Accepted third-party intercom limitation

Installed `pi-intercom` 0.17.0 calls `complete(ctx.model, ...)` in
`~/.pi/agent/npm/node_modules/pi-intercom/handover.ts:57`. This inspected
published source is not pinned to a verified upstream commit. Pi's `complete()`
uses the non-routing stream path, while `streamSimple()` handles virtual direct
requests; see [the verified runtime][pi-streams]. Generated handovers through
both the tool and `/handover` therefore fail while a native virtual model is
selected. Select a physical model first if handovers are ever needed.

Ordinary send/ask/reply/list operations use message-transport paths rather than
this handover model call; this specific defect does not establish that they
are broken. Full live virtual-model intercom compatibility is not verified.
Its presence label follows selection and may report Auto rather than physical
dispatch (`~/.pi/agent/npm/node_modules/pi-intercom/index.ts:2158`).

Do not patch, monkey-patch, wrap, fork, uninstall, or acquire intercom source
for this project. Do not promise handover success with Auto or require an
upstream change. Any upstream fix would address native Pi virtual models in
general, not this particular extension. The user does not use intercom and
accepts the limitation; it is neither a milestone nor a release gate.

#### Slice 3 Milestones

- [ ] **M3.1:** Every changed plugin passes its established physical-model
  behavior tests with no router package or handler present.
- [ ] **M3.2:** Synthetic native routers pass the plugin's virtual-selection,
  physical metadata, inheritance, summary, or context-safety scenarios.
- [ ] **M3.3:** Explicit child overrides, strict fallback, prior host support,
  and selected-vs-effective status are verified and documented honestly.
- [ ] **M3.4:** Unchanged user-owned plugins pass their applicable regression/
  load checks, and the third-party intercom limitation is documented without
  any intercom edit or upstream-update requirement.

### Slice 4: Personal configuration and controlled rollout

- **Blocked by:** Slices 1–3 for the router and user-owned plugins only.
- **Delivers:** A reproducible personal install, clear model roles, and a
  reversible activation that leaves other harnesses and worker policies alone.
- **Consumes:** The tested package and standalone plugin releases.
- **Produces:** Repo-owned Pi configuration, documented opt-in activation, and
  a verified rollback procedure.

Own these paths only within `/Users/mmcdonnell/code/agent-skills`:

| File | Scoped change |
| --- | --- |
| `.pi/agent/settings.json` | Add the new package and virtual model to the applicable scope; retain both physical IDs; set the main Luna preference to `high`; keep Sol/xhigh as the physical startup fallback during rollout |
| `.pi/agent/pi-auto-model.json` | Add reproducible user routing policy; do not commit mutable runtime enabled state |
| `Makefile` | Install the new extension and copy its policy in the existing Pi block, preserving unrelated Claude-mod work |
| `.agents/AGENTS.md` | With approval, document user-enabled tier routing; preserve engineering downgrade and per-edit approval gates |
| `README.md` / focused Pi docs | Explain source ownership, controls, independence, rollout, observed settings, and rollback |

The installed configuration is generated from this repository; see
[settings][agent-settings] and [the committed Pi installation block][agent-install].
Do not edit installed settings as the permanent source of truth.

The existing downgrade rule prompts before lower-tier engineering; see
[canonical instructions][agent-instructions]. Complex engineering now defaults
to Sol/xhigh, not Luna/high. Classification or availability step-down does not
waive that rule: Luna-routed engineering still needs the required approval.
Any instruction exception needs a separately approved, narrow change. Per-edit
approvals remain separate; configuration approval grants neither a rule change
nor permission to implement.

Do not change `.agents/skills/shared/EXECUTION-MODELS.md`, the `execute-plan`
worker adapters/tests/evals, or Claude worker definitions in this project.
Their explicit worker efforts are `xhigh`; see [the scoped worker policy][workers].
This router controls the main conversation, not those workers. Premium
coordination should resolve to complex/frontier via metadata or classification,
not a baked-in `execute-plan` map. Keep its resolved route sticky during
its run.
Any later worker-policy change needs separate approval and consistent updates.

Keep Claude Code and OpenCode defaults, catalogs, favorites, and credentials
unchanged. Do not copy credentials or add new provider accounts. No physical
catalog/pricing changes are needed merely to add a routing entry.

#### Slice 4 Milestones

- [ ] **M4.1:** Repo-owned policy/install changes are approved, verified, and
  preserve unrelated working-copy changes and explicit worker settings.
- [ ] **M4.2:** A fresh opt-in session dispatches metadata-free classification
  and trivial/moderate versus complex/frontier work to the observed expected
  pairs; tier fallback and off restoration satisfy their acceptance scenarios.
- [ ] **M4.3:** User-owned plugin-only installations and the owned plugin suite
  pass smoke checks, including child sessions, context shaking, and popup focus/
  lifetime. Accepted third-party intercom handover behavior does not block
  rollout.
- [ ] **M4.4:** Rollback restores the physical session/default behavior without
  reverting standalone plugin compatibility improvements.

### Documentation

- [ ] Seed `docs/specs/automatic-routing.md` in the new extension repository
  when implemented; use `spec-delta` before touching a living-spec path.
- [ ] Document native virtual-model compatibility in each changed plugin's
  own README; state supported Pi versions and independent install behavior.
- [ ] Keep this handoff index, spec links, and source ownership current. Store
  acceptance evidence in execution records, not in milestone descriptions.

### Verification

- [ ] Use the owning repository's Makefile targets where available. For the
  new extension, provide `make test`, `make typecheck`, and `make load-check`.
- [ ] Existing available targets include `make -C <pi-subagents> verify` and
  `make -C <pi-statusbar> test lint`; recheck targets before execution.
  Repositories without a Makefile use their existing test scripts.
- [ ] Run `make -C /Users/mmcdonnell/code/agent-skills check-execute-plan` to
  ensure the unchanged explicit worker policy still matches its contracts.
- [ ] Assert every specified feature through registered public boundaries and
  provider/child-session observations; cover every public error branch.
- [ ] Obtain approval before paid live probes; report requested, dispatched,
  and provider-observed model/effort separately and disclose missing evidence.

## File Changes and Delivery

The source-ownership table and slice-owned file lists define the edit boundary.
The new repository's exact test filenames and implementation signatures are
compiled just-in-time after source/API inspection, not invented upfront.

Use separate reviewable changes in each owning repository. Plugin compatibility
changes depend only on Pi's native contracts and can merge independently of
the router. Personal activation waits for all required compatibility changes.
Do not turn this multi-repository delivery into a cross-repository PR stack.
Confirm branch/PR choices with the user before performing Git operations.

## Parallel Execution

The router work in Slices 1–2 is sequential. Slice 3's plugin changes can be
reviewed independently, and their read-only investigation can overlap Slice 1.
Slice 4 waits for router and user-owned plugin compatibility, not intercom.
Prefer main-thread edits or chat-able teammates while interfaces remain
unsettled.

> [!IMPORTANT]
> Delegate editing only when a stream is independent, fully specified, owns
> files no other stream touches, and will not need interactive steering.
> Otherwise use read-only proposed-change reports and apply edits in the main
> thread with user approval. Verify subagent completion and retry incomplete
> work with a larger budget; a completed process is not acceptance evidence.

Compile only the next slice with Sol/xhigh. Approved complex implementation
also uses Sol/xhigh under the revised tier mapping; lower-tier manual overrides
retain their existing approval requirements. Reinspect source before compiling
later slices. Do not precompile all slices or use the `execute-plan` worker
adapter as though main-session routing changed its explicit worker policy.

## Risks and Remaining Gates

- The unused third-party intercom handover limitation is accepted and is not
  an activation gate. No plugin-only dependency on the new router is permitted.
- Native routing occurs per request, including direct summaries. Child and
  summary sessions must not accidentally execute parent-session policy.
- Context hooks may run before dispatch is resolved. Unknown-target guards
  must preserve signed thinking and let Pi handle uncertain compaction.
- Classification adds latency, cost, and possible misclassification. Metadata
  avoids that call; classifier failure keeps the physical route. Verify bounded
  calls, usage accounting, stale-result cancellation, and shared-contract cases.
- Four difficulty tiers initially map to two physical pairs. Complex includes
  implementation, so expecting every implementation request to use Luna would
  contradict the approved mapping. Future tier/provider changes need approval.
- Live model access, effective effort, and old-host compatibility remain
  unverified until their specified tests/probes run. Existing dirty source must
  be preserved; draft artifacts are not implementation acceptance.

## Research References

External repository references are pinned to inspected full revisions.
Local editable paths appear only as execution ownership or explicitly unpinned
installed-source evidence. Reverify source before using line references.

[pi-vm]: https://github.com/earendil-works/pi/blob/06a466935536f8c9bcacb2d5efc0fc021be1bdff/packages/coding-agent/docs/virtual-models.md
[pi-packages]: https://github.com/earendil-works/pi/blob/06a466935536f8c9bcacb2d5efc0fc021be1bdff/packages/coding-agent/docs/packages.md
[pi-input]: https://github.com/earendil-works/pi/blob/06a466935536f8c9bcacb2d5efc0fc021be1bdff/packages/coding-agent/src/core/agent-session.ts
[pi-input-type]: https://github.com/earendil-works/pi/blob/06a466935536f8c9bcacb2d5efc0fc021be1bdff/packages/coding-agent/src/core/extensions/types.ts
[pi-streams]: https://github.com/earendil-works/pi/blob/06a466935536f8c9bcacb2d5efc0fc021be1bdff/packages/coding-agent/src/core/model-runtime.ts
[pi-tui]: https://github.com/earendil-works/pi/blob/06a466935536f8c9bcacb2d5efc0fc021be1bdff/packages/coding-agent/docs/tui.md
[pi-passive-overlay]: https://github.com/earendil-works/pi/blob/06a466935536f8c9bcacb2d5efc0fc021be1bdff/packages/coding-agent/examples/extensions/overlay-qa-tests.ts#L939-L964
[statusbar]: https://github.com/Integralist/pi-statusbar/blob/c7a3d3462ce4b3c946da931470e8646b6eac4c0a/extensions/pi-statusbar.ts#L514-L518
[subagents]: https://github.com/Integralist/pi-subagents/blob/fb6a54caf28fc7bf8e0a163c8dc80986bc17dee5/src/runner.ts#L420-L431
[child-loader]: https://github.com/Integralist/pi-subagents/blob/fb6a54caf28fc7bf8e0a163c8dc80986bc17dee5/src/runner.ts#L262-L272
[btw-defaults]: https://github.com/Integralist/pi-btw/blob/9643b67d8b2850c33a32824b145dc0bcd6c43a8c/extensions/btw.ts#L1996-L2068
[btw-child]: https://github.com/Integralist/pi-btw/blob/9643b67d8b2850c33a32824b145dc0bcd6c43a8c/extensions/btw.ts#L2245-L2262
[shake-signatures]: https://github.com/Integralist/pi-context-shake/blob/c4cdabc7ca35cc501e6f897a2756ff1753424f5e/index.ts#L490-L500
[shake-size]: https://github.com/Integralist/pi-context-shake/blob/c4cdabc7ca35cc501e6f897a2756ff1753424f5e/index.ts#L631-L650
[subagent-package]: https://github.com/Integralist/pi-subagents/blob/fb6a54caf28fc7bf8e0a163c8dc80986bc17dee5/package.json#L32-L49
[btw-package]: https://github.com/Integralist/pi-btw/blob/9643b67d8b2850c33a32824b145dc0bcd6c43a8c/package.json#L44-L52
[agent-settings]: https://github.com/Integralist/agent-skills/blob/fb4a51ae5000f0989519df49dac643e23d7e6b25/.pi/agent/settings.json#L1-L40
[agent-install]: https://github.com/Integralist/agent-skills/blob/fb4a51ae5000f0989519df49dac643e23d7e6b25/Makefile#L42-L59
[agent-instructions]: https://github.com/Integralist/agent-skills/blob/fb4a51ae5000f0989519df49dac643e23d7e6b25/.agents/AGENTS.md#L56
[workers]: https://github.com/Integralist/agent-skills/blob/fb4a51ae5000f0989519df49dac643e23d7e6b25/.agents/skills/shared/EXECUTION-MODELS.md
