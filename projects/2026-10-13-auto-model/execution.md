# Pi Auto Model — Execution Record

- **Status:** Tasks 1–4 committed and verified; Task 5 pending, Slice 1 unaccepted.
- **Plan:** [Implementation plan](./plan.md)
- **Specification:** [Behavior contract](./spec.md)
- **Started:** 2026-10-13
- **Coordinator:** selected Copilot GPT-6.1 Sol/xhigh, unchanged.
- **Delivery branch:** `integralist/auto-model`
- **Baseline HEAD:** none; the repository had an unborn `main` branch.
- **Current slice:** Slice 1; [task document](./tasks-slice-1.md), Task 5 awaiting compilation.
- **Accepted slices:** none.

## Authorization

1. The user approved the portable tier contract, dynamic classification,
   pre-dispatch tier step-down, and the two physical tier pairs.
2. The user approved copying the handoff into this repository, preserving
   the temporary originals.
3. The user approved `integralist/auto-model`, Slice 1 scope, strict
   Copilot Luna/xhigh workers, one commit per verified task, and separate
   setup/bookkeeping commits.
4. The user approved this setup: execution record, proposed ADR/index,
   glossary, and handoff/README links. Per-edit approvals remain in force.
5. In the original session the user approved the task-document/README/execution
   mapping update, then explicitly said to proceed after it stalled. Recovery
   resumes those documentation edits only; no implementation approval is inferred.
6. In the resumed session the user approved task-at-a-time compilation/execution
   and Task 1's exact scaffold/test payload plus local development dependency
   installation. Existing branch, Luna/xhigh strict worker and per-task commit
   authorization remain unchanged. Tasks 2–5 still need per-edit approval.
7. The user approved a one-off npm 11.21.0 diagnostic against the unchanged
   manifest. It passed with peer checks and scripts disabled. Resume the already
   approved local Task 1 install through that client; do not upgrade global npm,
   weaken peer checks, change versions or enable dependency install scripts.
8. The user approved replacing the two incorrect SDK-setter return assertions
   with awaited selection and explicit selected-Auto assertions. All physical
   dispatch expectations remain unchanged; matching task snippets are refreshed.
9. The user approved removing Cucumber's extra ESM default-profile wrapper.
   Only `cucumber.mjs` and its matching task snippet change; tests and Make
   commands stay strict and unchanged.
10. After Task 1's verified commits, the user asked to continue Task 2
    compilation. This authorizes the task/evidence-document update, not its
    implementation edits, dependency changes or a new editing worker.
11. The user subsequently approved Task 2's exact two-file implementation.
    Only new `src/policy.ts` and `test/policy.test.ts` may be edited by its
    strict Luna/xhigh worker. Dependencies, extension and harness stay unchanged.
12. After Task 2's verified commits, the user asked to proceed with Task 3
    compilation. This authorizes its task/README/evidence-document update only;
    source/test implementation and another editing worker need explicit approval.
13. The user subsequently approved Task 3's exact three-file implementation:
    existing `src/policy.ts` plus new classifier unit/native-boundary tests.
    The strict Luna/xhigh worker may apply only that compiled payload; harness,
    dependencies, extension wiring and paid probes stay outside its authority.
14. After the verified Task 3 checkpoint, the user said approve. The preceding
    next step was Task 4 compilation and a later edit proposal, so this approves
    continuing compilation only. No Task 4 source/test payload was presented;
    no implementation or registration-contract deviation is inferred.
15. After a plain-language explanation, the user approved early extension-load
    registration, lifecycle capture/cleanup and Pi's physical-ID collision guard.
    The user accepted another `github-copilot/auto` virtual router as an
    incompatible deployment constraint. This passes the design/compiler gate
    only; the exact Task 4 implementation still needs a separate edit proposal.
16. The user subsequently approved Task 4's exact seven-file implementation.
    Only the compiled extension/harness/four origin edits/two new test suites
    are authorized. Policy modules, dependencies, host code and globals remain
    protected; the strict Luna/xhigh worker may not expand that scope.
17. During Task 4, the user approved recording `/automodel configure` for
    Slice 2: catalog-backed physical model and supported effort choices for
    every tier and classifier, persisted in the existing policy file. This
    authorizes the [configuration addendum](./configuration-addendum.md) and
    ledger/index updates only. Task 4 source/test scope remains unchanged;
    no Slice 2 implementation, provider setup or live probe is approved.
18. The user approved the single direct-summary test-observation correction:
    record fake-provider model/options.reasoning and assert the same Luna/high
    pair there. No production routing, other assertions or dependencies change.

There is no authorization to push, publish, install/enable this extension
globally, change other repositories, change explicit worker policy, or run paid
model/classifier smoke probes. Per-task code and dependency-install proposals
will be approved separately before delegation.

## Baseline and protected work

Only the three approved handoff copies existed outside Git metadata at startup.
The index was empty; no implementation, dependencies, build services, or
Makefile existed. Those copies are included in the authorized setup commit.

All sibling repositories and installed package/configuration paths stay
read-only for Slice 1. Preliminary inspection found unrelated changes in
`agent-skills`; an independent commit changed that checkout before snapshot
capture. At the recorded snapshot it was clean. No changes there were made,
staged, stashed, reset, or committed by this execution.

Private baseline directory: `/tmp/pi-auto-model-execution.A45nHV`.

- `pi-auto-model.status`: initial main-repository working-tree state.
- `agent-skills.status`: protected source working-tree state at snapshot.
- `agent-skills.changed.sha256`: changed tracked-file fingerprints, empty
  because that source checkout was clean at snapshot.

| Source checkout | Snapshot revision |
| --- | --- |
| `pi-statusbar` | `c7a3d3462ce4b3c946da931470e8646b6eac4c0a` |
| `pi-subagents` | `fb6a54caf28fc7bf8e0a163c8dc80986bc17dee5` |
| `pi-btw` | `9643b67d8b2850c33a32824b145dc0bcd6c43a8c` |
| `pi-context-shake` | `c4cdabc7ca35cc501e6f897a2756ff1753424f5e` |
| `pi-transcript-enhancer` | `7d6afe38086b31340b26cd790a5e30f6e0030198` |
| `pi-skill-argument-hints` | `ed00e07a8ba5cdb8a5f8c58c87310d479624255a` |
| `agent-skills` | `9b8a93313b6942476150fa5c154ba8f7b71fec9c` |

Source revisions are inspection evidence, not execution branches or permission
to edit. Recheck any checkout before its own later authorized slice.

## Original snapshots and document hashes

The private directory is mode 0700 and contains only approved handoff text
and source-state/fingerprint records, not credential contents. Preserve these
snapshots for the whole-plan audit.

| Document | Original snapshot | Original SHA-256 |
| --- | --- | --- |
| Plan | `plan.original.md` | `2ef88e8d0aaddafae11d8b80bf0b842c4519b48ef9026aea86672246cf9f4f0d` |
| Spec | `spec.original.md` | `4d3dd7999a99e2263eec28638dfc52823d87e39cfd6250e9b8f396feb1ba9112` |
| README | `README.original.md` | `a5dcf3506f4d08532011aa6553fb0a6a3805e43efd2f3a53661407a81639480b` |

| Current document | SHA-256 |
| --- | --- |
| Plan | `8afe813ffd0f5839993cc1b3ee98bfc2b063742dfab9e6a80a3790ccc97ac31d` |
| Spec | `4d3dd7999a99e2263eec28638dfc52823d87e39cfd6250e9b8f396feb1ba9112` |

The plan differs from its snapshot only in approved repository-owned handoff
bookkeeping. The specification is unchanged. No acceptance requirement or
milestone state was changed by setup.

## Models and delegation

| Role | Requested model | Effort | Substitution |
| --- | --- | --- | --- |
| Coordinator | `github-copilot/gpt-6.1-sol` | `xhigh` | Keep selected session |
| Task/correction worker | `github-copilot/gpt-6-luna` | `xhigh` | Forbidden |

The active inline-spawn schema exposes model, thinking, tools, max turns,
steering/stop controls, and strict no-fallback. The runtime catalog contains
the exact Copilot worker, reports configured credential availability, and maps
`xhigh` to `xhigh`. This is preflight/startup evidence, not proof of live
gateway behavior or effective effort for every request.

Worker launch budget: 60 turns; an incomplete budget-limited task may receive
one retry at 120 after inspecting partial edits. Launch one editing worker at
a time. Requested/resolved settings and observable transcript/provider metadata
will be recorded separately; substitution blocks progress.

Task 1 worker launched in the resumed session:
`e18451b3-ea28-41b9-8bb9-5e7ab31dd5c5` (`task1-scaffold`). Requested settings:
`github-copilot/gpt-6-luna`, `xhigh`, strict no fallback, 60 turns. The worker
returned BLOCKED after installing dependencies failed; its lifecycle completed,
but Task 1 did not. The saved worker transcript records Copilot GPT-6 Luna
and `xhigh` at startup and on all eight assistant turns, ending with stop rather
than an error or budget-exhaustion marker. Transcript file:
`2026-10-13T12-09-40-651Z_01a1352b-1e2b-77f6-8232-f946eb8364e0.jsonl`
in this repository's local Pi session directory. This verifies recorded worker
settings, not opaque provider gateway internals. No second implementation
worker or budget retry was launched before the diagnostic approval.

After the successful npm 11.21.0 trial, continuation worker
`90120a61-d197-463f-86d9-fc3aa75ba506` (`task1-complete`) launched with the same
strict Copilot Luna/xhigh settings and 60-turn budget. It continues only the
remaining Task 1 install/red/green/check scope. It returned BLOCKED on a
compiled test/API mismatch after completing local install, assertion-red and
green source/acceptance files. Its saved transcript records Copilot Luna/xhigh
on all 12 assistant turns, ending normally with stop. Transcript:
`2026-10-13T12-23-20-689Z_01a13537-a171-77f6-8232-f949e987bc6f.jsonl`.
No budget exhaustion or substitution was observed. This was an
environmental-block continuation, not a budget retry.

After explicit approval of the setter assertions, bounded correction worker
`e6e7ebc3-5d20-468d-89bd-07bf35815889` (`task1-setter-fix`) launched with strict
Copilot Luna/xhigh and a 60-turn budget. It applied exactly the two approved
test edits and returned BLOCKED when Cucumber discovered no step imports.
Native Vitest, typecheck and load-check passed in its report. No turn-limit
exhaustion was reported; this is the first bounded compiler-test correction.
The coordinator independently confirmed the native unit test passed. Its saved
transcript records Luna/xhigh on seven assistant turns, ending normally with
stop: `2026-10-13T12-30-46-024Z_01a1353e-6d08-77f6-8232-f94a0520b2cd.jsonl`.

After config approval, bounded worker
`d71d887b-e354-4757-ac10-ad84b50db6cf` (`task1-config-fix`) launched with strict
Copilot Luna/xhigh and 60 turns. Only the approved `cucumber.mjs` wrapper
removal was editable. It returned COMPLETE with all normal Make checks at
exit 0; only the config changed. The saved transcript records Luna/xhigh on
five assistant turns, ending normally with stop:
`2026-10-13T12-37-01-067Z_01a13544-260b-77f6-8232-f94c178784e8.jsonl`.
The coordinator reran all three normal targets and confirmed exit 0. No worker
hit its turn budget, changed models or staged/committed files. The four worker
passes used 60-turn caps; no budget retry was needed. Two compiler corrections
were individually approved and verified.

## Baseline checks

| Check | Outcome | Evidence |
| --- | --- | --- |
| Git delivery inspection | Pass | No stack; approved branch created |
| Copied handoff integrity | Pass | All three copies matched temporary originals |
| Host/tool versions | Pass | Pi 1.2.0; Node 24.6.0; npm 11.5.1; GNU Make 3.81 |
| Host APIs | Pass, inspection only | Native virtual model, input provenance, idle guard, registry dispatch, public frontmatter parser |
| Docs lint | Pass with existing table-width exclusion | `markdownlint --disable MD013 -- projects/2026-10-13-auto-model/{README,spec,plan}.md` |
| Build/test/typecheck/load-check | Unavailable | No implementation or Makefile |
| Live model/classifier/effort probes | Not run | Separate approval required |
| Vitest metadata | Verified | npm reports 4.1.11 with Node 24 support |
| TypeScript metadata | Verified | npm reports 7.0.2 |
| Cucumber metadata | Verified | npm reports 13.3.0 with Node 24 support |
| Pi test dependency metadata | Verified | npm reports coding-agent 1.2.0 |

Version metadata is not permission to install packages. Test assertions, runtime
integration and live worker behavior have not been verified.

## Requirement ledger

Stable keys below cover prose constraints and unsliced requirements. They
supplement, rather than replace, the scenario and milestone ledgers.
`S1` through `S4` name source slices; only S1 execution is authorized.
Task mappings and actual outcome evidence are pending compilation.

| Key | Scope | Original requirement | Source |
| --- | --- | --- | --- |
| R01 | S1 | Opt-in native virtual selection; no new provider, service, or Pi fork. | spec: Solution; plan: Native Routing |
| R02 | S1 | Portable metadata is one ordered difficulty string, not a model name. | spec: Shared skill metadata |
| R03 | S1 | Trim/case-normalize valid strings; invalid types/values are absent. | spec: Shared skill metadata |
| R04 | S1 | Valid metadata bypasses classification; resolve the actually loaded skill. | spec: Shared skill metadata |
| R05 | S1 | Classify an unmapped skill's name/description, not body or arguments. | spec: Shared skill metadata |
| R06 | S1 | No baked-in name map or per-skill override; shared-contract changes need review. | spec: Shared skill metadata |
| R07 | S1 | Later typed tasks decide independently; internal skill reads do not reroute. | spec: Shared skill metadata |
| R08 | S1 | New task intent outranks short-confirmation detection; confirmations stick. | spec: Shared skill metadata |
| R09 | S1 | Classifier failure/unavailability/malformed output retains the physical pair. | spec: Shared skill metadata |
| R10 | S1 | Bound and cancel physical classifier calls; no tools or routing recursion. | spec: Shared skill metadata; plan: Classification |
| R11 | S1 | Keep classifier work out of chat/main state/popups; account for its usage. | spec: Shared skill metadata; plan: Classification |
| R12 | S1 | Map trivial/moderate to Luna/high; complex/frontier to Sol/xhigh. | spec: Pi tier mapping |
| R13 | S1 | Exact configured identifiers/efforts; catalog and credentials are not entitlement proof. | spec: Pi tier mapping; plan: Prerequisites |
| R14 | S1 | Unavailable tiers step down in order, never up; otherwise retain current. | spec: Pi tier mapping |
| R15 | S1 | Keep-current uses observed/captured physical settings; unknown requires selection. | spec: Pi tier mapping |
| R16 | S1/S2 | Effort-only fixes the physical model and checks exact effort against it. | spec: Pi tier mapping; Controls and State |
| R17 | S1 | No max/virtual targets, invalid config, collisions, or silent effort clamping. | spec: Pi tier mapping; plan: Availability |
| R18 | S1 | Only pre-dispatch availability fallback; live failures retain sticky retries. | spec: Pi tier mapping |
| R19 | S1/S4 | Only configured pairs; no new provider/credential access or entitlement probes. | spec: Pi tier mapping; plan: Rollout |
| R20 | S1 | Eligible idle main input only; busy/queued/extension inputs stay sticky. | spec: Independence; plan: Availability |
| R21 | S1/S2 | Discard handled/canceled/stale intent; isolate session replacement/resumed branches. | plan: Availability; Controls and persistence |
| R22 | S1 | Direct summaries use summary-tier availability without consuming task intent/state. | spec: Main-conversation routing |
| R23 | S2 | Manual model/thinking choices disable Auto; thinking changes effort, not model. | spec: Controls and State |
| R24 | S2 | On/off/status/mode controls are safe; busy controls defer without blocking. | spec: Controls and State; plan: Slice 2 |
| R25 | S2 | Off restores the captured physical pair; resume never captures a virtual target. | spec: Controls and State |
| R26 | S2 | Preferences survive fresh sessions; branch state survives compaction/navigation. | spec: Controls and State |
| R27 | S2 | Policy and enabled state stay separate, validated and atomic; corrupt files error. | plan: Slice 2 persistence |
| R28 | S2/S3 | Quiet status uses physical evidence, not selected/requested labels. | spec: Controls and State; Independence |
| R29 | S2 | Static ten-second popup, default enabled, configurable duration/disable. | spec: Controls and State; Popup |
| R30 | S2 | Popup uses observed pair changes only; unchanged/direct requests stay quiet. | plan: Switch popup; spec: Popup |
| R31 | S2 | Popup never captures focus, blocks work, dismisses dialogs, or adds chat/OS effects. | spec: Controls and State; Popup |
| R32 | S2 | Replacement timers and lifecycle cleanup cannot affect a new popup/session. | spec: Popup; plan: Switch popup |
| R33 | S2 | Skip terminal UI in headless/RPC; popup failure leaves routing/status functional. | spec: Popup; plan: Switch popup |
| R34 | S3 | Owned plugins remain independently installable, physical behavior unchanged. | spec: Independence; plan: Standalone Plugin Contract |
| R35 | S3 | No router dependency/private state/shared compatibility package in plugins. | plan: Standalone Plugin Contract |
| R36 | S3 | Each plugin tests generic native virtual selections with its own synthetic router. | spec: Testing Seams; plan: Standalone Plugin Contract |
| R37 | S3 | Children inherit matching successful physical pair; explicit overrides/fallback gates win. | spec: Independence; plan: Slice 3 |
| R38 | S3 | Unknown physical inheritance needs an explicit selection; ignore failed responses. | spec: Independence; plan: Slice 3 |
| R39 | S3 | Preserve signed thinking/uncertain limits; let Pi decide unsafe compaction cases. | spec: Independence; plan: Slice 3 |
| R40 | S3 | Statusbar reports selected versus observed honestly across branch/lifecycle changes. | spec: Effective status; plan: Slice 3 |
| R41 | S3 | Disclose/test host compatibility; unchanged owned plugins get regression/load checks. | plan: Slice 3 |
| R42 | S3/S4 | Intercom remains untouched; accepted Auto handover limitation is non-blocking. | spec: Unmodified Third-Party Intercom |
| R43 | S3/S4 | Do not claim all intercom transport/features broken or fully compatible. | spec: Unmodified Third-Party Intercom |
| R44 | S4 | Live install/policy changes are repo-owned, scoped, opt-in, approved, and reversible. | plan: Slice 4 |
| R45 | All | Engineering downgrade/per-edit/commit/push permissions survive routing and step-down. | spec: Independence; plan: Rollout |
| R46 | All | Keep explicit worker policy and Claude/OpenCode defaults/catalogs/credentials unchanged. | plan: Slice 4; Out of Scope |
| R47 | All | Preserve unrelated source/index changes; edit checkouts, not installed packages. | plan: Source Ownership; File Changes |
| R48 | S1 | Host packages are peers, not bundled dependencies; verify actual Pi 1.2.0 API. | plan: Prerequisites |
| R49 | S1 | Vitest plus executable Cucumber acceptance run through make test; prove assertion-red. | plan: Prerequisites; Verification |
| R50 | All | Public-boundary behavior tests cover all scenarios/error branches, not helper choreography. | spec: Testing Seams; plan: Verification |
| R51 | S1/S3/S4 | Use owning Make targets; new test/typecheck/load-check and unchanged worker-policy check. | plan: Verification |
| R52 | All | Paid live model/classifier/effort probes need approval and separate observed evidence. | plan: Prerequisites; Verification |
| R53 | Final/S3 | Seed a living routing spec with spec-delta; plugin READMEs own compatibility claims. | plan: Documentation; spec: Living Specifications |
| R54 | All | Keep handoff/index/ownership current; acceptance evidence belongs in execution records. | plan: Documentation |
| R55 | All | Separate reviewable repository changes; no cross-repository stack or inferred branches. | plan: File Changes and Delivery |
| R56 | All | Compile one live slice at a time; serialize editing workers and inspect completion/retries. | plan: Parallel Execution |
| R57 | S4 | Later activation waits for owned-plugin compatibility and rollback, not intercom. | plan: Parallel Execution; Slice 4 |
| R58 | All | No runtime quota switching, mid-task escalation, new accounts, or automatic skill edits. | spec: Out of Scope |
| R59 | All | Preserve original requirements/snapshots and audit unsliced documentation/verification. | execute-plan: Whole-plan audit |
| R60 | All | Coordinator verifies/commits tasks; workers never stage, commit, or mark acceptance. | execute-plan: Task gate |
| R61 | S2 | Catalog-backed configuration command for all tier and classifier physical pairs. | configuration-addendum: R61 |
| R62 | S2 | Supported exact automatic efforts and strict validated policy updates. | configuration-addendum: R62 |
| R63 | S2 | Atomic explicit save, cancel/error preservation and no credentials/provider/preference changes. | configuration-addendum: R63 |
| R64 | S2 | Complete provider portability without hidden Copilot classifier/summary fallback. | configuration-addendum: R64 |
| R65 | S2 | Honest availability and safe empty/stale/headless/busy behavior; no paid probe or implicit enabling. | configuration-addendum: R65 |

## Scenario ledger

These keys enumerate all 44 scenarios in the original spec snapshot, in source
order. AC045–AC052 append the user-approved configuration scope; they do not
renumber the originals. Scenario outlines include every example. No scenario
is accepted based on this inventory; compiled tasks name the keys they cover.

| Key | Scope | Original scenario | Evidence |
| --- | --- | --- | --- |
| AC001 | S1 | Declared difficulty selects the configured pair | Unverified |
| AC002 | S1 | Metadata wins over a misleading familiar name | Unverified |
| AC003 | S1 | Metadata strings are trimmed and matched without case | Unverified |
| AC004 | S1 | Absent or invalid metadata still triggers classification | Unverified |
| AC005 | S1 | Classifier input follows the shared skill contract | Unverified |
| AC006 | S1 | An unusable classifier result retains the route | Unverified |
| AC007 | S1 | Classifier work cannot reroute itself or the conversation | Unverified |
| AC008 | S1 | The next typed task is classified independently | Unverified |
| AC009 | S1 | Typed tasks use classified difficulty | Unverified |
| AC010 | S1 | Effort-only preserves its fixed physical model | Unverified |
| AC011 | S1 | Effort-only checks effort against its fixed model | Unverified |
| AC012 | S1 | Tool follow-ups and retries retain their route | Unverified |
| AC013 | S1 | Confirmation retains its route | Unverified |
| AC014 | S1 | Short task intent is not a confirmation | Unverified |
| AC015 | S1 | Busy and queued input retain the active route | Unverified |
| AC016 | S1 | Extension-origin work retains the active route | Unverified |
| AC017 | S1 | Direct summary requests do not alter main task state | Unverified |
| AC018 | S2 | Disabling restores both original settings | Unverified |
| AC019 | S2 | Manual choices win | Unverified |
| AC020 | S2 | Resume and tree navigation retain branch state | Unverified |
| AC021 | S2 | Fresh sessions preserve the enabled preference | Unverified |
| AC022 | S2 | Controls during work wait for a safe boundary | Unverified |
| AC023 | S1 | Automatic configuration rejects max | Unverified |
| AC024 | S1 | An unavailable tier steps down to the nearest smaller pair | Unverified |
| AC025 | S1 | Step-down continues past unavailable smaller tiers | Unverified |
| AC026 | S1 | No available smaller tier keeps the current physical pair | Unverified |
| AC027 | S1 | Invalid routing configuration remains an actionable error | Unverified |
| AC028 | S1 | Keep-current requires a known physical pair | Unverified |
| AC029 | S2 | Manual thinking changes effort without selecting another model | Unverified |
| AC030 | S1 | A live provider failure does not speculate about tier availability | Unverified |
| AC031 | S2 | Switch feedback stays out of the conversation | Unverified |
| AC032 | S3 | Each changed plugin works without the router | Unverified |
| AC033 | S3 | Generic native virtual models are supported independently | Unverified |
| AC034 | S3 | Children do not inherit a virtual router accidentally | Unverified |
| AC035 | S3 | Unknown inherited physical settings fail safely | Unverified |
| AC036 | S3 | Effective status is not fabricated | Unverified |
| AC037 | S3 | Signed thinking is preserved for an unknown physical target | Unverified |
| AC038 | S2 | A real route change is visible for ten seconds | Unverified |
| AC039 | S2 | Unchanged requests do not repeat the popup | Unverified |
| AC040 | S2 | A new switch replaces the existing popup safely | Unverified |
| AC041 | S2 | The popup does not interrupt work or input | Unverified |
| AC042 | S2 | Disabled or non-interactive popups are skipped | Unverified |
| AC043 | S2 | Popup cleanup cannot affect a replacement session | Unverified |
| AC044 | S2 | Popup failure does not break a model request | Unverified |
| AC045 | S2/addendum | Search physical catalog entries by provider | Unverified |
| AC046 | S2/addendum | Choose only supported automatic effort | Unverified |
| AC047 | S2/addendum | Replace all Copilot defaults and retain mappings after reload | Unverified |
| AC048 | S2/addendum | Cancel/validation/write/stale selection preserves prior policy | Unverified |
| AC049 | S2/addendum | Absent provider-model combination is not invented | Unverified |
| AC050 | S2/addendum | No configured physical models leaves policy unchanged | Unverified |
| AC051 | S2/addendum | Configuration changes obey safe-boundary active-task rules | Unverified |
| AC052 | S2/addendum | Headless configuration gives file guidance without a dialog | Unverified |

## Milestone ledger

Keys and outcomes remain distinct from executable task IDs. All source
checkboxes remain unchecked; task evidence contributes to them, but no milestone
or slice has passed its complete acceptance/review gate.

| Key | Slice | Source outcome | Task/evidence mapping |
| --- | --- | --- | --- |
| M1.1 | S1 | Runnable boundary acceptance and assertion-red proof | Task 1 baseline verified; Task 5's full tier/classifier boundary evidence pending |
| M1.2 | S1 | Portable tiers, classification and independent task dispatch | Tasks 2–4 policy/classifier/owned main dispatch verified; full executable acceptance/review pending Task 5 |
| M1.3 | S1 | Sticky routes, ownership/cancellation and direct summaries | Tasks 3–4 adapter/lifecycle/branch/continuation/native state verified offline; complete acceptance/review pending Task 5 |
| M1.4 | S1 | Availability/effort/error safety in both modes | Tasks 2–4 exact-effort/fallback/classifier/integrated safety evidence verified; complete public-error acceptance/review pending Task 5 |
| M2.1 | S2 | Controls/manual choice/busy deferral | Not compiled; approved R61–R65/AC045–AC052 configuration command addition also required |
| M2.2 | S2 | Persistence and physical restoration | Not compiled; configuration addendum's atomic policy persistence also required |
| M2.3 | S2 | State/restoration/lifecycle failures | Not compiled |
| M2.4 | S2 | Popup lifetime, focus and cleanup | Not compiled |
| M3.1 | S3 | Standalone physical-model regressions | Not compiled |
| M3.2 | S3 | Generic virtual-model compatibility | Not compiled |
| M3.3 | S3 | Overrides/fallback/host support/honest status | Not compiled |
| M3.4 | S3 | Unchanged-plugin checks/intercom documentation | Not compiled |
| M4.1 | S4 | Approved repo-owned policy/install changes | Not compiled |
| M4.2 | S4 | Observed tier routing/fallback/off smoke | Not compiled |
| M4.3 | S4 | Owned-plugin suite/popup smoke | Not compiled |
| M4.4 | S4 | Verified rollback without compatibility reverts | Not compiled |

Slice 1 consumes public extension/route/input APIs, loaded skill resources,
catalog lookup and physical assistant metadata. It produces native Auto
registration, validated tier/classifier policy and public-boundary acceptance.
It has no accepted prerequisite slice. Slice 2 consumes that contract; Slice 3
can use synthetic routers independently; Slice 4 waits for Slices 1–3.

## Tasks, commits and review index

Five stable task scopes and milestone mappings are saved in
[tasks-slice-1.md](./tasks-slice-1.md). Task 1 includes proposed verbatim
scaffold, stub, red test, baseline green registration, harness and Cucumber
payloads. Task 2 now includes its exact stub, tests and green policy payload;
Task 3 now includes its exact asynchronous boundary/types/stub, classifier
unit/native tests and green payload. Task 4 now includes its approved
registration decision and exact seven-file stub/harness/origin/test/green
payload; Task 5 remains a contract awaiting compilation.
The user subsequently authorized Task 1 execution under task-at-a-time gates.
Task 1's exact source/tests/toolchain and approved compiler corrections are
verified and committed. Task 2's policy/test implementation is also verified
and committed. Task 3's classifier adapter and tests are independently verified
and committed. Task 4's owned native-routing implementation and approved
summary-observation correction are independently verified and committed.
No slice milestone is accepted.

| Task key | Supports | Scenario coverage after integration | Compiler state |
| --- | --- | --- | --- |
| `slice-1/task-1` | M1.1 | Baseline native registration/dispatch; positive control | Verified and committed: original assertion-red plus normal unit/acceptance/type/load checks |
| `slice-1/task-2` | M1.2, M1.4 | AC001–AC004, AC010–AC011, AC023–AC028; decision-only portions | Verified and committed: assertion-red, 107 policy tests, unchanged native baseline, type/load checks |
| `slice-1/task-3` | M1.2–M1.4 | AC005–AC009; classifier portions of AC006/AC028; signal-adapter safety | Verified and committed: assertion-red, 61 unit/seven native cases, full tests/type/load and source scope |
| `slice-1/task-4` | M1.2–M1.4 | AC001–AC017, AC024–AC028, AC030; ownership cases | Verified and committed: native assertion-red, 30 routing/17 ownership/223 total Vitest, Cucumber/type/load |
| `slice-1/task-5` | M1.1–M1.4 | All Slice 1 scenarios/examples and public error branches | Contract only |

No scenario ledger row changes from Unverified until checks actually run.

| Kind | Task key | Actual hash/subject | Verification |
| --- | --- | --- | --- |
| Bookkeeping | `setup/bookkeeping` | `f0baef3161d577487228beb004c2c16d93f3fdba` — docs: preserve routing intent and execution evidence | Docs lint, scope, snapshots and ledger inventory checked |
| Implementation | `slice-1/task-1` | `3b68e8642106f6825da833a154d65f067b1049d2` — test: verify native virtual dispatch without live model calls | Parent `f0baef3`; assertion-red verified; normal unit/acceptance/type/load checks and scoped review passed |
| Bookkeeping | `slice-1/task-1` | `fdc93b2471f6e2d53ba8710141cce7abba874d46` — docs: preserve the verified Task 1 review checkpoint | Bounded hash/status record, docs/whitespace/identity checks; no source changes |
| Implementation | `slice-1/task-2` | `50f8af9839720910d1267e7cf44ead269064e716` — feat: keep automatic tier choices exact and downward-only | Parent `fdc93b2`; assertion-red, 107 policy tests, 108 full Vitest tests/Cucumber, type/load, protected scope and 64 downward combinations verified |
| Bookkeeping | `slice-1/task-2` | `38f5ea3c4323289e65d4b3225158be04e1624774` — docs: preserve the verified Task 2 policy checkpoint | Bounded hash/status record; normal checks, docs and protected scope verified; no source change |
| Implementation | `slice-1/task-3` | `4d10a9ea5d48c3e7aaa020beecaa13b283bf7ca1` — feat: classify new tasks without leaking or stalling main routes | Parent `38f5ea3`; assertion-red, 61 unit/seven native/176 total Vitest and Cucumber, type/load, protected scope and 360 input-bound cases verified |
| Bookkeeping | `slice-1/task-3` | `2f3ef4037103931540bff78258a0e47d1c583b61` — docs: resume routing integration from the verified classifier | Bounded hash/status record; normal checks/docs/protected scope verified; no source change |
| Bookkeeping | `slice-2/configuration-scope` | `3ec6b35b805161bd6f3cfe9bb715eeb86951cc87` — docs: keep automatic routing open to users' own model providers | Separate approved 184-line addendum; docs/links/keys/protected source verified, implementation pending |
| Implementation | `slice-1/task-4` | `be2fdf76dc16589d8795d48533a6d2074a90c9d9` — feat: bind automatic model routes to the task that owns them | Parent `3ec6b35` is scope-only; code base `2f3ef40`; assertion-red, 30 routing/17 ownership/223 total Vitest/Cucumber/type/load/protected scope verified |

Task 1's pre-commit compiler corrections are included in its implementation
commit; there are no later correction commits. Task 2 required no compiler or
implementation correction. Task 3 also required no compiler or implementation
correction. Task 4's separately approved pre-commit summary-test observation
correction is included in its implementation commit; no production requirement
changed and no later correction commit exists. This record's Task 4 post-commit
hash/status update is bounded bookkeeping, indexed by Git trailers rather than
a self-recording hash loop.

Implementation/correction commit keys will be `slice-1/task-N`. Record real
hashes and subjects after commit success; preserve correction history and
task-to-milestone mappings. A verified-but-uncommitted task blocks the next
launch. No milestone or slice is accepted from a commit alone.

## Session recovery — 2026-10-13

Reviewed original session `01a134a3-1b0c-705b-a828-1c174ee3e2e8` and the desktop
screenshot named `Screenshot 2026-10-13 at 12.57.03.png`. Its recorded history
shows repeated read-only SDK/context calls after task-document approval, but
no task-document write and no implementation worker launch.

| Evidence | Observation |
| --- | --- |
| Original JSONL line 144 | User approved task-document/index/evidence update |
| Original JSONL lines 154–155 | Tool call finished; next assistant request ended with `Connection error.` |
| Original JSONL lines 163–165 | Offline native probe succeeded; later assistant request ended with `terminated` |
| Original JSONL lines 170–174 | No running subagents reported; task document remained unwritten |
| Original JSONL lines 175–182 | User said proceed; another read-only call finished, then user aborted the stalled turn |
| Original JSONL line 185 | User reported only a Working spinner; no later completed assistant record |

The JSONL is under the local Pi session directory for this repository. Errors
are observed request outcomes, not proof of provider/gateway root cause. The
final spinner's cause is unverified. The repeated context-reading/no-output
pattern is established; recovery should use the saved compiler checkpoint
rather than repeat that preflight.

Recovery rechecked branch `integralist/auto-model`, HEAD `f0baef3`, pre-existing
execution-record changes, current plan/spec hashes and original snapshot hashes.
All hashes match the recorded values. The successful offline probe used native
fake-provider registration and an awaited no-network runtime refresh; its
selected Auto/physical Luna-high observations are carried into the task context.
No new SDK/model requests, dependency installation or implementation tests ran
in recovery. npm metadata lookup selected Node-24 types and tsx pins only.

Task 1's proposed payload is not runtime-verified. Code snippets in the draft
are not implementation files, and documentation checks do not accept any
routing behavior. Recovery adds no implementation/correction retry attempt.

## Task 1 partial outcome

The worker created nine approved files: `package.json`, `.gitignore`,
`Makefile`, `tsconfig.json`, `vitest.config.ts`, `cucumber.mjs`,
`extensions/auto-model.ts`, `test/support/session.ts` and
`test/native-boundary.test.ts`. That first attempt left the compiling empty
stub, without a lockfile, installed dependencies or acceptance files. Protected
coordinator documents were preserved.

The second worker installed approved local dependencies through one-off npm
11.21.0, generated the lockfile, proved the required missing-Auto red assertion,
then applied baseline registration and Cucumber feature/steps. Global npm is
still 11.5.1, Node is 24.6.0 and dependency pins/peer checks are unchanged.
No staging or commit occurred; Task 1 remains unaccepted.

| Attempt/check | Outcome | Evidence |
| --- | --- | --- |
| Worker `make deps`, npm 11.5.1 | Fail: make exit 2, npm exit 1; Arborist null `edgesOut` during Vitest peer resolution | Checkpoint `worker-deps.log`; npm log `2026-10-13T12_10_18_598Z-debug-0.log` |
| Coordinator explicit Vite 7.3.7 dry-run | Fail: exit 1, same resolver error | Checkpoint `coordinator-vite-dry-run.log` |
| Coordinator original-manifest dry-run with installed npm 10.9.4, same Node 24.6.0 | Fail: exit 1, same resolver error | Checkpoint `coordinator-alternate-npm-dry-run.log` |
| User-approved one-off npm 11.21.0 dry-run, unchanged manifest | Pass: exit 0; resolved 246 packages; no install, lockfile or peer-check bypass | Checkpoint `coordinator-npm11-version.log`, `coordinator-npm11-dry-run.log` |
| Package manifest integrity after diagnostic trials | Pass: unchanged SHA-256 `dda18c82dcd3613488350d2c40485192d43ee96d65ca5ee78de5839ecbd287f1` | No lockfile/node_modules created |
| Checks before second worker | Not run | Initial dependency block was never counted as behavioral red |
| Second worker local `make deps` via one-off npm 11.21.0 | Pass: exit 0, scripts disabled, unchanged pins | Checkpoint `worker-continuation-deps.log` |
| Stub assertion-red | Verified: make exit 2; registered native Auto was undefined | Checkpoint `worker-continuation-red.log` |
| Second worker `make test` | Fail: exit 2, compiled assertion incorrectly expects SDK setModel to return true; acceptance not reached | Checkpoint `worker-continuation-test.log` |
| Coordinator `make typecheck` before setter correction | Pass: exit 0 | Checkpoint `coordinator-typecheck.log` |
| Setter correction worker `make test` | Partial: native Vitest passes; Cucumber all four steps undefined; make exits 2 | Checkpoint `worker-setter-test.log` |
| Setter correction worker `make typecheck` / `make load-check` | Pass: exit 0 each | Checkpoint `worker-setter-typecheck.log`, `worker-setter-load-check.log` |
| Coordinator native unit check after setter correction | Pass: exit 0, one native dispatch test | Checkpoint `coordinator-native-unit.log` |
| Cucumber configuration introspection | Verified: resolved importPaths is empty due to nested ESM default | Public loadConfiguration API, no file edits |
| Coordinator explicit-import acceptance diagnostic | Pass: exit 0; one scenario, five reported steps including cleanup | Checkpoint `coordinator-cucumber-explicit-import.log` |
| Coordinator `make load-check` | Pass: exit 0; Extension module loads | Checkpoint `coordinator-load-check.log` |
| Installed direct dependency inventory | Pass: approved seven pins, no peer error from npm ls | `npm ls --depth=0`, exit 0 |
| Final config worker Make checks | Pass: test/typecheck/load-check each exit 0, no CLI bypass | Checkpoint `worker-config-*.log` |
| Coordinator final normal `make test typecheck load-check` | Pass: exit 0; native test 1/1, Cucumber scenario 1/1, typecheck and module load | Checkpoint `coordinator-final-checks.log` |
| Task payload/source, dependency scope and lockfile | Pass: nine directly matched file payloads; approved corrections; seven pinned dev deps, host packages only peers, registry-only lock | Coordinator source/JSON checks |
| Coordinator docs/whitespace/secret scan and original hashes | Pass; plan/spec unchanged, no secrets or unrelated staged files | Coordinator checks before task commit |

Checkpoint/log root: `/tmp/pi-auto-model-task1.Xwg5lM`. Stack evidence locates
the exception in npm's Arborist `#loadPeerSet`, not application code. Optional
peer traversal reached a Vitest 5 browser peer while resolving the pinned
Vitest 4 set, but the exact null-parent cause is not established. The explicit
Vite-pin hypothesis did not resolve it, and alternate installed npm did not
isolate it to npm 11.5.1. After three failures, execution paused for a diagnostic
decision. The user-approved npm 11.21.0 trial then resolved the same manifest
successfully: the failing clients were npm 10.9.4/11.5.1, while 11.21.0 passed.
This isolates client-version-dependent resolution, not the exact upstream patch.

## Task 2 compiler checkpoint

Compiled against clean HEAD `fdc93b2` and Task 1's actual public SDK dependencies.
Only `tasks-slice-1.md`, this execution record and the handoff link update change
in compilation. No worker, implementation file, dependency change or new commit
was made. Task 1's checked state and source hashes remain intact.

The proposed implementation is limited to new `src/policy.ts` and
`test/policy.test.ts`. Native extension wiring and dispatch/harness changes are
explicitly deferred to Task 4; classifier execution and ownership remain in
Tasks 3–4. The two-file scope covers raw metadata, supplied tier decisions,
strict version-1 config, exact catalog/auth/effort availability, downward-only
fallback, retained physical evidence, effort-only and direct-summary selection.
The original milestone IDs/scenarios/requirements remain unchanged. No unit
outcome is being used as native-dispatch or slice acceptance evidence.

| Compiler check | Outcome | Evidence |
| --- | --- | --- |
| Public SDK exports/signatures and exact effort list | Verified from installed Pi/pi-ai 1.2.0 source/declarations | ModelRegistry `find`/`hasConfiguredAuth`, `parseFrontmatter`, `getSupportedThinkingLevels` |
| Stub, tests and green TypeScript syntax | Pass in memory | Existing esbuild parser; three task-document blocks |
| Stub-plus-tests typecheck | Pass: zero diagnostics | Installed TypeScript 7.0.2 sync API with in-memory filesystem, real compiler options and dependency declarations |
| Green-plus-tests typecheck | Pass: zero diagnostics | Same overlay; no files written, no behavior run |
| Red/green policy tests | Not run | Task 2 implementation approval still required |
| Documentation lint, links, task keys and coverage | Checked before presenting approval gate | No source/spec changes |

The preflight avoids the original Task 1 compiler/API mistakes but does not
prove runtime behavior. Required red proof remains the stub returning Sol/xhigh
when the declared trivial test expects Luna/high. Public classifier/dispatch,
lifecycle and release evidence remain pending. No subagent was spawned during
this compilation, so no worker retry or budget record changes.

## Task 2 launch checkpoint

Authorized branch: `integralist/auto-model`; parent HEAD:
`fdc93b2471f6e2d53ba8710141cce7abba874d46`. Index is empty; only previously
approved coordinator-owned task compilation/README/execution edits pre-exist.
Task 2 implementation files are absent at launch. Saved checkpoint/log root:
`/tmp/pi-auto-model-task2.jVVLsu`. The existing native unit/Cucumber,
typecheck and load-check baseline passes; source/manifest/lockfile/plan/spec
hashes are saved in `protected-source.sha256`. Worker must preserve them.

Task 2 worker launched:
`ad8e2c8c-e65d-4f6a-9915-3482d303387d` (`task2-policy`), requested strict
`github-copilot/gpt-6-luna`, `xhigh`, no fallback, 60 turns. Only the two new
files were editable. The worker returned COMPLETE: original assertion-red,
107 policy tests and all normal Make checks passed; both files match the
approved payload exactly. No deviation, dependency/source-scope expansion,
staging or commit occurred. The coordinator independently confirmed these
checks and protected-source hashes. No budget retry was needed.

Its saved session transcript records Copilot Luna/xhigh on 14 assistant turns,
ending normally with stop and no error outcomes:
`2026-10-13T12-58-02-578Z_01a13557-65d2-77f6-8232-f94eb5787c48.jsonl`
in this repository's local Pi session directory. This establishes recorded
worker settings/completion, not opaque provider gateway internals. No fallback
or turn-limit exhaustion was observed.

## Task 2 verified outcome

Added only `src/policy.ts` and `test/policy.test.ts` for the policy boundary.
The coordinator read both entire files and matched them byte-for-byte to the
approved compiled green/test payloads. Existing implementation, extension,
harness, feature files, manifest/lockfile, plan and spec remain unchanged.
Pre-existing coordinator-owned compiler/task/evidence changes are included in
this task's scoped bookkeeping; no unrelated user hunks exist in these files.

| Check | Outcome | Evidence under checkpoint root |
| --- | --- | --- |
| Compiling stub typecheck | Pass: exit 0 | `worker-typecheck-stub.log` |
| Required behavioral red | Verified: make exit 2; declared trivial expected Luna/high/trivial/tier, stub returned Sol/xhigh/current | `worker-red.log:123–147`, final `COMMAND_EXIT=2` |
| Worker policy unit/full test/type/load targets | Pass: exit 0 each, 107 policy tests; total 108 Vitest and existing Cucumber scenario | `worker-policy-unit.log`, `worker-make-test.log`, `worker-typecheck-green.log`, `worker-load-check.log` |
| Coordinator policy unit | Pass: exit 0, 107/107 | `coordinator-policy-unit.log` |
| Coordinator normal full targets | Pass: exit 0; 108 Vitest tests, one Cucumber scenario/five reported steps, typecheck and module load | `coordinator-final-checks.log` |
| Exhaustive downward availability invariant | Pass: all 64 tier/availability combinations; zero provider calls | `coordinator-downward-invariant.log` |
| Exact approved payload and protected hashes | Pass: two files match snippets; protected-source checksums all unchanged | Coordinator source comparison, `protected-source.sha256` |
| Docs/scope/whitespace/secret checks | Pass before task commit | Coordinator lint, links/task keys/milestones, complete source and staged diff inspection |

The current extension still runs Task 1's explicit-opt-in Sol/xhigh baseline.
Task 2 adds callable policy decisions, not native integration or classifier
execution. All original scenario ledger rows and M1.1–M1.4 remain unaccepted;
unit decision evidence does not substitute for Tasks 3–5's public boundaries.

## Task 3 compiler checkpoint

Compiled from clean HEAD `38f5ea3c4323289e65d4b3225158be04e1624774`, using
Task 2's committed `resolveRoute` and private config/frontmatter/physical-evidence
helpers. Only coordinator-owned task/README/execution documents change in this
pass. No source file, dependency, global setting, worker or new commit was
added. Log/snapshot root: `/tmp/pi-auto-model-task3-compile.6p4yTF`.

Proposed implementation scope is existing `src/policy.ts` plus new
`test/classifier.test.ts` and `test/classifier-boundary.test.ts`. The prior
four-file task scope was an upper bound; the public registry can wrap the
existing fixture runtime without editing its harness. Preserve all native
extension wiring and dependency pins until their own tasks/approvals.

Add the async policy entry point for an already eligible typed task or resolved
skill resource. It validates config, bypasses valid metadata/direct/absent task,
and dispatches only the exact physical classifier with no tools, retries or
session cache sharing. Bound serialized input/output/deadline, reject unusable
responses, retain physical evidence, and expose usage separately. Request and
lifecycle cancellation settle uncooperative waits and discard late tiers.
Late observed usage can still reach an isolated observer without mutating the
returned route. Observer failures are non-fatal; unknown usage is not zero.

Task 4 still owns resolving actual loaded skills/slash commands, input identity,
lifecycle-event and generation guards, and native route/state dispatch. The
Task 3 native tests exercise real ModelRegistry/fake-provider classification
while proving selection/transcript/branch state stay unchanged, not full main
router integration or live entitlement. No original requirement, scenario key
or milestone outcome is renamed, weakened or accepted here.

| Compiler check | Outcome | Evidence |
| --- | --- | --- |
| Public nested dispatch and physical/virtual behavior | Verified from installed Pi 1.2.0 registry/runtime/types; current docs cross-check | ModelRegistry `streamSimple`, pi-ai `Context`/`Usage`/result stream, virtual-model direct path |
| Stub plus both test files | Pass: zero type/syntax diagnostics | `compiler-type-preflight.log`; TypeScript 7.0.2 in-memory overlay includes existing policy/native tests and fixture |
| Green plus both test files | Pass: zero diagnostics | Same overlay; no code files written or classification requests sent |
| Existing normal Make targets | Pass: 108 Vitest tests, Cucumber scenario/five reported steps, typecheck/load | `existing-baseline-checks.log`, exit 0 |
| Protected source/dependency/spec/plan hashes | Pass: all unchanged | `protected-source.sha256` |
| Task 3 assertion-red/green/native classifier tests | Not run | Implementation approval required |
| Docs/scope/links/task keys/milestones/whitespace | Checked before approval gate | Only three coordinator documents modified |

No subagent was spawned for this compiler pass; no retry/budget record changes.
Compilation preflight does not establish runtime classification correctness or
Task 3 completion. Required red remains a typed moderate task retaining Sol
under the stub instead of routing Luna/high from classification.

## Task 3 launch checkpoint

Authorized branch: `integralist/auto-model`; parent HEAD:
`38f5ea3c4323289e65d4b3225158be04e1624774`. Index is empty; only previously
approved coordinator-owned task compilation/README/execution edits pre-exist.
The two classifier test files are absent at launch. Existing `src/policy.ts`
may receive only the approved import/types and appended stub/green addition.
Saved checkpoint/log root: `/tmp/pi-auto-model-task3.xRnmNB`.

The committed 108-test/native Cucumber/type/load baseline passes before launch.
`protected-source.before.sha256` snapshots the old policy plus protected files;
`protected-unchanged.sha256` excludes only the authorized policy edit. Worker
must preserve every existing other implementation/fixture/dependency/spec file.

Task 3 worker launched:
`764e2072-69f8-456e-8746-9bdce8894c28` (`task3-classifier`), requested strict
`github-copilot/gpt-6-luna`, `xhigh`, no fallback, 60 turns. Only the approved
three files were editable. The worker returned COMPLETE with all assigned
checks passing and no code/test deviations. The coordinator inspected actual
files, reran each target and confirmed unrelated-source preservation. No
budget retry or fallback occurred.

Its saved transcript records Copilot Luna/xhigh on all 18 assistant turns,
ending normally with stop and no error outcomes:
`2026-10-13T14-21-34-487Z_01a135a3-df97-77f6-8232-f95065123dde.jsonl`
in this repository's local Pi session directory. This verifies recorded worker
settings, not opaque gateway internals. No turn-limit exhaustion was observed.
The worker's auxiliary coordinator-document hash audit flagged execution.md
because the coordinator had appended this launch record after its initial
snapshot; the worker did not edit it. README/task snapshots and all protected
unrelated source hashes matched. This expected coordinator edit is not a test
failure or scope violation.

## Task 3 verified outcome

Changed only the authorized source/test scope: appended classifier types,
helpers and `resolveTaskRoute` to `src/policy.ts`, plus two exact new classifier
test files. Existing Task 2 implementation differs only by the approved Usage
import and appended code. The coordinator read the three files, matched their
full contents against the approved payload and found no compiler or
implementation correction needed. Existing harness/extension/dependency pins
and plan/spec hashes remain unchanged. Only the previously approved
coordinator-owned compilation/README/execution updates accompany this task.

| Check | Outcome | Evidence under checkpoint root |
| --- | --- | --- |
| Compiling stub plus full tests | Pass: typecheck exit 0 | `worker-typecheck-stub.log`, `worker-results.log` |
| Required behavioral red | Verified: make exit 2; fresh typed task expected Luna/high/moderate/tier, stub retained Sol/xhigh/current | `worker-red.log:50–74`; command result index |
| Worker unit/native/full/type/load | Pass: exit 0 each, 61 unit/seven native/176 total Vitest and Cucumber scenario | `worker-classifier-unit.log`, `worker-classifier-boundary.log`, `worker-test.log`, `worker-typecheck.log`, `worker-load-check.log` |
| Coordinator classifier unit/native targets | Pass: exit 0 each, 61/61 and 7/7 | `coordinator-classifier-unit.log`, `coordinator-classifier-boundary.log` |
| Coordinator full normal targets | Pass: exit 0; 176 Vitest tests, existing Cucumber scenario/five reported steps, typecheck/module load | `coordinator-final-checks.log` |
| Serialized-input invariant | Pass: 360 combinations over 120 caps and typed/skill escaped/Unicode data, 242 in-memory adapter responses, zero real provider calls | `coordinator-input-bound-invariant.log` |
| Exact approved additions and protected files | Pass: policy/tests match snippets byte-for-byte; all unrelated hashes unchanged | Coordinator source comparison, `protected-unchanged.sha256` |
| Docs/scope/whitespace/secret checks | Pass before task commit | Complete source/updated docs and staged-diff inspection |

This proves bounded physical classifier dispatch, strict output, usage
isolation, cancellation/deadline behavior and unchanged conversation/branch/
selection in the existing native fixture. Task 4 still owns eligibility,
loaded-resource identity, lifecycle-event/generation guards, native route
state and durable usage storage. All original scenario acceptance rows and
slice milestones remain unaccepted; these adapter results do not claim
installed/global activation, live model behavior or whole-slice acceptance.

## Task 4 compiler checkpoint — registration decision

Inspected clean HEAD `2f3ef4037103931540bff78258a0e47d1c583b61` and the actual
Pi 1.2.0 input/startup/native-routing call path. No implementation file,
dependency, worker, paid probe or new commit was created. Coordinator-owned
task/README/execution notes record one material compiler assumption instead of
starting a read-only/preflight loop or delegating an unresolved design.

The draft task required registration on `session_start`. Source proves native
recorded selection happens earlier: services apply factory-queued virtual
registrations, then `createAgentSession` restores a catalog selection, then
binding emits `session_start`. Late registration makes restored Auto unavailable
at the actual selection boundary. Forcing Auto from a later handler is not an
acceptable workaround because it can override an explicitly chosen physical
model. The uncompiled late-registration assumption must change or compilation
cannot promise native resume behavior.

Native `ModelRuntime.registerVirtualModel` rejects physical collisions before
changing its map, but intentionally replaces existing virtual definitions.
The public pre-bind extension factory lacks model-registry context for a stronger
duplicate-virtual ownership check. The original compiled collision wording is
broader than this native guarantee; the user must accept an incompatible
same-ID virtual-router deployment constraint or require a host-level boundary.
Do not silently narrow a test, patch the host or invent another model registry.

Source evidence is indexed in
[Task 4's decision gate](./tasks-slice-1.md#task-4-registration-boundary-decision):
loader `403–411`, services `98–110`, SDK `91–113`, AgentSession `2650`, native
ModelRuntime `693–703`. These are installed package paths, not edit targets.
Current documentation confirms factory registration and native branch state.

Other verified seams for the eventual payload: input handlers transform in
order and handled input short-circuits; accepted `before_agent_start` exposes
expanded prompt but no input token; user entries have stable branch IDs before
routing; busy/extension work cannot be inferred merely from `reason: user`.
Resolve commands through actual loaded `sourceInfo.path`, match the exact
accepted expansion and bind its persisted user entry. This is a proposed
ownership shape, not tested code. Task 4 still needs exact tests/green code,
compiler preflight and edit approval after this registration decision.

## Task 4 compiled payload checkpoint

The user approved the registration decision above after the simpler explanation.
The proposed seven-file payload is compiled against clean implementation HEAD
`2f3ef4037103931540bff78258a0e47d1c583b61`, with pre-existing coordinator-owned
Task 4 design notes preserved. No Task 4 source/test file, dependency, worker,
paid probe or new commit was created. Compiler log/snapshot root:
`/tmp/pi-auto-model-task4-compile.OV3Le5`.

The compiled extension uses factory registration, actual loaded command paths,
exact accepted expansion and persisted user-entry IDs. It consumes only owned
eligible idle input, handles confirmations separately from short new tasks,
uses previous/failed physical evidence for continuation/retry, and keeps direct
summaries outside main state/intent. Lifecycle signals/generation/session/branch
checks guard awaited work. Native JSON state stores physical pairs; classifier
usage is non-chat custom evidence attributed to the originating user entry.
Stale session/branch usage is not written into a replacement task. UI cost
aggregation, controls/popups and installation remain later slices/tasks.

The harness uses actual services-first registration and AgentSessionRuntime
rebind/replacement with fake providers and in-memory stores. Existing wiring
and standalone-classifier tests now explicitly propose extension-origin main
messages, keeping their one-call/selection/transcript assertions unchanged.
New tests cover metadata/classification, fallback, effort-only, configuration
errors, tools/retry, queues, handled/transformed input, direct calls, cancellation,
startup/resume, reload/new/shutdown, tree/fork and late-work guards. The complete
original Cucumber examples and public-error acceptance remain Task 5.

| Compiler check | Outcome | Evidence |
| --- | --- | --- |
| Startup/loaded-command/input/native-state seams | Verified against installed Pi 1.2.0 source | Earlier decision anchors; AgentSession user persistence at message_end before route; before_agent_start discriminates messageType |
| Stub plus seven-file test/harness/origin proposals | Pass: zero diagnostics | `compiler-type-preflight.log`, TypeScript 7.0.2 in-memory filesystem, actual SDK/compiler options |
| Green plus same tests/fixture | Pass: zero diagnostics | Same overlay; existing policy/classifier/native tests included |
| Existing normal Make checks | Pass: 176 Vitest tests, Cucumber scenario/five reported steps, typecheck/module load | `existing-baseline-checks.log`, exit 0 |
| Existing code/dependency/plan/spec hashes | Pass: unchanged | `protected-source.sha256` |
| Required trivial-skill assertion-red and Task 4 behavior | Not run | Implementation approval required; no compiled code written to repo |
| Docs/links/task keys/coverage/whitespace | Checked before approval gate | Only task/README/execution documents modified |

A compiler-only type mismatch in the new user-entry narrowing was corrected in
the document before delegation; no implementation/test expectation was changed
or run. No worker/retry/turn-limit record changes. Existing Tasks 1–3 remain
committed and verified; this preflight is not native ownership acceptance.

## Task 4 launch checkpoint

Authorized branch: `integralist/auto-model`; parent HEAD:
`2f3ef4037103931540bff78258a0e47d1c583b61`. Index is empty. Only previously
approved coordinator-owned compiler/README/execution changes pre-exist; no
Task 4 implementation edit is present. Two new test files are absent. Existing
176-test/Cucumber/type/load baseline passes. Checkpoint/log root:
`/tmp/pi-auto-model-task4.2YxMR1`.

`authorized-before.sha256` snapshots the five approved existing edit files;
`protected-unchanged.sha256` snapshots policy/unit tests/dependencies/spec/plan
and other source outside Task 4. The worker must preserve those protected files
and all coordinator docs. Save command outcomes and original assertion-red
inside the checkpoint, not as repository logs.

Task 4 worker launched:
`fc58e18e-9e34-4e98-9092-b90a6f9ef8dd` (`task4-routing`), requested strict
`github-copilot/gpt-6-luna`, `xhigh`, no fallback and 60 turns. Only the seven
approved files were editable. The worker returned BLOCKED after applying the
exact payload and proving the required trivial-skill behavioral red. Green
verification has one failing direct-summary observation; no correction was
applied. All 12 protected files remain unchanged and the index is empty.
No budget retry, dependency edit, host patch or task acceptance occurred.

Saved transcript
`2026-10-13T16-15-46-160Z_01a1360c-6bf0-77f6-8232-f953c307ddc2.jsonl`
records Copilot Luna/xhigh on 29 assistant turns, ending normally with stop and
no error outcomes. No substitution or budget exhaustion was observed. This
verifies recorded settings, not opaque provider gateway internals.

## Task 4 partial outcome — direct-summary observation

The approved seven-file implementation is present. The worker applied no
behavioral deviation and preserved all tests after the green failure. A
transcription-only quote was corrected to the exact approved source before
verification. No task checkbox, milestone, stage or commit changed.

| Check | Outcome | Evidence under Task 4 checkpoint |
| --- | --- | --- |
| Stub typecheck | Pass: exit 0 | `worker-typecheck-stub.log` |
| Required trivial-skill behavioral red | Verified: make exit 2; physical Sol returned where Luna expected | `worker-stub-red.log`, `worker-command-index.log` |
| Green tier-routing target | Partial: 29/30 pass; one direct-summary response effort field absent | `worker-tier-routing.log`, exit 2 |
| Request-ownership target | Pass: 17/17 | `worker-request-ownership.log`, exit 0 |
| Full tests | Partial: 222/223 Vitest pass; same direct-summary assertion; Cucumber not reached | `worker-make-test.log`, exit 2 |
| Green typecheck/module load | Pass: exit 0 each | `worker-typecheck-green.log`, `worker-load-check.log` |
| Protected-file hashes/index | Pass: all 12 protected files unchanged, index empty | `worker-protected-hashes.log` |
| Coordinator direct-request diagnostic | Verified: physical Copilot Luna at high, response thinkingLevel absent, branch/messages unchanged | `coordinator-direct-request-diagnostic.log`, exit 0 |

Root cause is a compiled test-observation error. Pi 1.2.0 native direct
`ModelRuntime.streamSimple` at `dist/core/model-runtime.js:494–518` passes the
routed effort as the physical provider request's `options.reasoning`, but it
does not add that field to the returned standalone AssistantMessage. The
read-only coordinator diagnostic reproduced both facts without changing code:
actual Luna/high request and absent response field, with unchanged session
branch/transcript. This is not evidence of wrong routing effort.

The user approved correcting only the direct-summary test to capture the native fake
provider's actual model/provider/options.reasoning and assert the same physical
pair there. Keep its returned model, unchanged branch/transcript and subsequent
Sol/xhigh continuation assertions. Matching compiled test text updates only
after approval and is now refreshed. No routing code or test expectation value
changes. The approved correction and full coordinator review/normal checks now
pass; the verified task is committed as indexed above.

Bounded correction worker
`b794269d-129e-4719-a55d-5de7cd0698b4` (`task4-summary-fix`) launched with
strict Copilot Luna/xhigh, no fallback and 60 turns. It applied only the
approved direct-summary observation in `test/tier-routing.test.ts` and returned
COMPLETE; every assigned check passed. Its transcript records Luna/xhigh on
13 assistant turns, ending normally with stop and no errors:
`2026-10-13T16-24-24-510Z_01a13614-54be-77f6-8232-f95408771a29.jsonl`.
No budget exhaustion, fallback, substitution, additional source change or retry
was observed. This is recorded model/effort evidence, not opaque provider
internals. The correction was a user-approved compiler-test fix, not a budget retry.

## Task 4 verified outcome

The coordinator read all seven changed source/test files, confirmed exact
approved payload/correction and reran each normal target. No routing requirement
or physical pair expectation changed. The original red assertion still shows
real native Sol dispatch where the trivial skill required Luna. The only
compiler correction changes effort observation to the actual provider request.

| Check | Outcome | Evidence under Task 4 checkpoint |
| --- | --- | --- |
| Approved correction worker routing/ownership | Pass: 30/30 and 17/17, exit 0 | `worker-summary-routing.log`, `worker-summary-ownership.log` |
| Correction worker full/type/load checks | Pass: 223 Vitest tests plus existing Cucumber, each target exit 0 | `worker-summary-test.log`, `worker-summary-typecheck.log`, `worker-summary-load-check.log` |
| Coordinator routing/ownership | Pass: 30/30 and 17/17, exit 0 | `coordinator-final-routing.log`, `coordinator-final-ownership.log` |
| Coordinator full normal targets | Pass: 223 Vitest tests, Cucumber scenario/five reported steps, typecheck/module load, exit 0 | `coordinator-final-checks.log` |
| Exact seven-file scope | Pass: approved stub-to-green, services fixture, four source-origin edits and sole observation correction | Coordinator full-source/snippet comparison |
| Protected files | Pass: all 12 hashes unchanged | `protected-unchanged.sha256`; policy/unit tests/deps/plan/spec remain untouched |
| Docs/IDs/links/whitespace/secret inspection | Pass before staged commit | Coordinator document and complete source/diff checks |

Auto now uses declared/classified tiers for eligible idle user tasks. Physical
selection remains opt-in; queued/extension/custom work, confirmations, tool
continuations and retries keep owned physical evidence. Tests exercise saved
selection, native state, direct-summary isolation and cancellation/replacement/
branch guards offline. Classifier usage is attributed through non-chat custom
entries. Neither worker exhausted its 60-turn cap; no budget retry was required.

Task 4 is verified, not complete Slice 1 acceptance. All original scenario-ledger
acceptance rows and milestone boxes stay unaccepted until Task 5's complete
executable scenarios/error coverage and independent review. No global package,
settings, live provider probe, installation or activation changed.

## Configuration scope addition

The user approved a searchable physical-model picker under `/automodel configure`
for Slice 2. The canonical behavior, appended R61–R65 and AC045–AC052 are in
[configuration-addendum.md](./configuration-addendum.md). Original source
plan/spec snapshots and hashes stay frozen; read the addendum alongside Slice 2
when compiling its controls/persistence tasks. Requirements and scenarios in
the original source retain their IDs and acceptance gates.

Users can replace every default tier pair and the classifier; summary dispatch
uses the configured summary-tier pair. Use Pi's actual configured physical
catalog and supported exact efforts, not hardcoded provider options. The desired
Gemini/Bedrock example is unverified as an offering; the picker must not fabricate
missing combinations or claim account entitlement from catalog presence.
Atomic policy saving keeps separate preferences/credentials/provider setup
unchanged and applies updates under the existing safe-idle control contract.

This records future scope, not source/test implementation. Its standalone doc
is committed at `3ec6b35`; index/evidence links accompany Task 4's coordinator
bookkeeping, not its source scope. Both Task 4 workers have completed; the
seven-file approved payload and one approved observation correction are unchanged. New doc/index/evidence changes are
coordinator-owned; workers do not edit them. No live provider query, account
change, global install or Slice 2 coding is authorized. All added acceptance
rows remain Unverified; Slice 2 still waits for independent Slice 1 acceptance.

## Next action

Compile only Task 5's complete Slice 1 acceptance and independent-review
payload against native routing at `be2fdf76dc16589d8795d48533a6d2074a90c9d9`.
Tasks 1–4 are committed and verified; preserve them when delayed worker notices
arrive. Exact feature/step/error-coverage proposals need separate edit approval
before another worker. After complete checks and independent premium review,
accept only proven M1.1–M1.4 outcomes and update source milestones under the
existing gate. No installation, activation or provider account change is implied.

The configuration addendum is separately committed at `3ec6b35`; compile it
with Slice 2 only after Slice 1 acceptance. This record's bounded Task 4 hash
update is indexed through plan/task/bookkeeping trailers rather than recording
its own hash.
The original behavioral red remains valid. Task 5 and Slice 2 coding are not
approved; the configuration addendum records future scope only.

Tasks 1–3 stay verified; do not repeat them because delayed worker notices
arrive. No install, host patch, global activation, paid probe or later task
implementation is authorized. Milestones and original scenario rows remain
unaccepted. Do not create a self-recording hash loop.

Task 4 now connects the native extension to tier/classifier decisions and
owned physical-pair state. Existing standalone wiring/classifier tests retain
their explicit extension-origin boundary, while new suites verify eligible
main tasks and lifecycle safety offline. Controls, configuration UI, popups,
compatibility and deployment remain future work. M1.1–M1.4 and original scenario
acceptance stay unaccepted until Task 5's full boundary/error coverage and
independent review; passing Task 4 does not authorize release activation.

No later task implementation, push, global installation, activation or paid
model/classifier smoke probe is authorized. Original plan/spec hashes and
startup snapshots remain unchanged; no archival action is authorized.
