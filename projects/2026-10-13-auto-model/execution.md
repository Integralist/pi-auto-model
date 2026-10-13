# Pi Auto Model — Execution Record

- **Status:** Task 1 committed and verified; Tasks 2–5 pending, Slice 1 unaccepted.
- **Plan:** [Implementation plan](./plan.md)
- **Specification:** [Behavior contract](./spec.md)
- **Started:** 2026-10-13
- **Coordinator:** selected Copilot GPT-6.1 Sol/xhigh, unchanged.
- **Delivery branch:** `integralist/auto-model`
- **Baseline HEAD:** none; the repository had an unborn `main` branch.
- **Current slice:** Slice 1; [task document](./tasks-slice-1.md), Task 1 authorized.
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

## Scenario ledger

These keys enumerate all 44 scenarios in the original spec snapshot, in source
order. Scenario outlines include every example. No scenario is accepted based
on this inventory; compiled tasks will name the keys they cover.

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

## Milestone ledger

Keys and outcomes remain distinct from executable task IDs. All source
checkboxes remain unchecked; no milestone has verified implementation evidence.

| Key | Slice | Source outcome | Task/evidence mapping |
| --- | --- | --- | --- |
| M1.1 | S1 | Runnable boundary acceptance and assertion-red proof | Task 1 baseline verified; Task 5's full tier/classifier boundary evidence pending |
| M1.2 | S1 | Portable tiers, classification and independent task dispatch | Tasks 2–5; scope mapped, payloads/evidence pending |
| M1.3 | S1 | Sticky routes, ownership/cancellation and direct summaries | Tasks 3–5; scope mapped, payloads/evidence pending |
| M1.4 | S1 | Availability/effort/error safety in both modes | Tasks 2–5; scope mapped, payloads/evidence pending |
| M2.1 | S2 | Controls/manual choice/busy deferral | Not compiled |
| M2.2 | S2 | Persistence and physical restoration | Not compiled |
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
payloads. Tasks 2–5 are bounded contracts awaiting their verbatim payloads.
The user subsequently authorized Task 1 execution under task-at-a-time gates.
Task 1's exact source/tests/toolchain and approved compiler corrections are
verified and committed. No slice milestone is accepted.

| Task key | Supports | Scenario coverage after integration | Compiler state |
| --- | --- | --- | --- |
| `slice-1/task-1` | M1.1 | Baseline native registration/dispatch; positive control | Verified and committed: original assertion-red plus normal unit/acceptance/type/load checks |
| `slice-1/task-2` | M1.2, M1.4 | AC001–AC004, AC010–AC011, AC023–AC028 | Contract only |
| `slice-1/task-3` | M1.2–M1.4 | AC005–AC009; classifier portions of AC006/AC028 | Contract only |
| `slice-1/task-4` | M1.2–M1.4 | AC001–AC017, AC024–AC028, AC030; ownership cases | Contract only |
| `slice-1/task-5` | M1.1–M1.4 | All Slice 1 scenarios/examples and public error branches | Contract only |

No scenario ledger row changes from Unverified until checks actually run.

| Kind | Task key | Actual hash/subject | Verification |
| --- | --- | --- | --- |
| Bookkeeping | `setup/bookkeeping` | `f0baef3161d577487228beb004c2c16d93f3fdba` — docs: preserve routing intent and execution evidence | Docs lint, scope, snapshots and ledger inventory checked |
| Implementation | `slice-1/task-1` | `3b68e8642106f6825da833a154d65f067b1049d2` — test: verify native virtual dispatch without live model calls | Parent `f0baef3`; assertion-red verified; normal unit/acceptance/type/load checks and scoped review passed |

Task 1's pre-commit compiler corrections are included in its implementation
commit; there are no later correction commits. This record's post-commit hash
update is bounded bookkeeping, indexed by its Git trailers rather than a
self-recording hash loop.

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

## Next action

Compile/propose only Task 2 in `tasks-slice-1.md`, against committed Task 1
interfaces at `3b68e8642106f6825da833a154d65f067b1049d2`. Its tier policy,
normalization, configuration/availability/error tests and exact payload need
coordinator compilation and per-edit approval before a new editing worker.
The implementation checkpoint and original setup are indexed above; the
bounded hash-evidence commit is discoverable through the same plan/task
trailers. Do not create a self-recording hash loop.

Task 1 is the offline native-wiring scaffold: selected Auto dispatches physical
Sol/xhigh after explicit opt-in. It does not implement tier classification,
ordered availability, ownership/lifecycle safety, controls or popups. M1.1–M1.4
and all original scenarios remain unaccepted until later tasks and independent
slice review prove them. Public error-branch/full-slice coverage remains in
Tasks 2–5; this baseline check is not release acceptance.

No later task implementation, push, global installation, activation or paid
model/classifier smoke probe is authorized. Original plan/spec hashes and
startup snapshots remain unchanged; no archival action is authorized.
