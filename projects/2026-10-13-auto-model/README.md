# Pi Auto Model — Handoff

- **Status:** Items1–4 verified; `main` is pushed; user Git-install check
  remains.
- **Owner:** Integralist
- **Created:** 2026-10-13
- **Language:** TypeScript

## Current release checklist

Use [the extension-only scope and remaining-work checklist](./release-scope.md)
for the current target. Enter and leave Auto through Pi's `/model` picker.
The earlier host API proposal is retired; it is not a release dependency.

## Summary

Build `pi-auto-model` on Pi's native virtual-model API. Share portable
`metadata.model-tier` values with the Claude Code auto-model mod: `trivial`,
`moderate`, `complex`, and `frontier`. Pi maps trivial/moderate to GPT-6 Luna
at `high`, and complex/frontier to GPT-6.1 Sol at `xhigh`. Software
implementation, planning, and task compilation are complex by default.

For a skill slash command, valid metadata wins; otherwise classify the loaded
skill's name and description dynamically. Missing metadata does not disable
routing. If classification produces no usable tier, retain the current physical
pair. Unavailable tier pairs step down through smaller configured tiers, then
retain the current pair if none is available. Later typed task prompts make
their own decision; confirmations and active work retain their route. See
[the shared contract and Pi mapping](./spec.md#routing-policy).

Automatic routing must never request `max`. Show a small, non-blocking
model/effort switch popup for 10 seconds, alongside the persistent status bar.

The existing extensions must remain independently installable. Improve their
support for native virtual models without importing, installing, or requiring
`pi-auto-model`.

## Artifacts

| Artifact | Purpose | Status |
| --- | --- | --- |
| [Specification](./spec.md) | Project scope and acceptance history | Draft |
| [Living routing contract](../../docs/specs/automatic-routing.md) | Current Auto behavior | Draft |
| [Implementation plan](./plan.md) | Architecture, source ownership, slices, rollout | In progress |
| [Execution record](./execution.md) | Authorization, requirements, checks, commits | Active |
| [Slice 1 tasks](./tasks-slice-1.md) | Verified routing-core implementation and acceptance | Complete |
| [Slice 2 tasks](./tasks-slice-2.md) | Historical controls design and implementation evidence | Superseded by the current release scope |
| [Configuration addendum](./configuration-addendum.md) | Model picker, portable mappings and acceptance | Mapping UI and safe activation verified; full acceptance pending |
| [Native routing decision](../../docs/adr/ADR-0001.md) | Dispatch ownership and alternatives | Proposed |

## Start a fresh session

Create or choose the new extension's source directory, then start Pi there:

```bash
mkdir -p ~/code/pi-auto-model
cd ~/code/pi-auto-model
pi --provider github-copilot --model gpt-6.1-sol --thinking xhigh
```

Give that session this instruction:

```txt
Read projects/2026-10-13-auto-model/README.md, spec.md, and plan.md completely.
Verify the source checkouts and current Pi APIs before proposing edits.
Compile tasks for Slice 1 only using /skill:to-tasks, resolving source
paths against the repository roots in the plan. Keep compilation on
GPT-6.1 Sol/xhigh. Do not install or enable automatic routing yet.
Use GPT-6.1 Sol/xhigh for approved complex implementation under the revised
tier policy. Any manual model/effort override needs its own approval where
required. Preserve existing changes in every repo.
```

This directory is the repository-owned copy of the approved temporary
handoff. The originals under `/tmp/pi-auto-model/` remain unchanged. The
[execution record](./execution.md) owns current authorization and evidence;
this README does not track individual tasks. Copying the handoff did not
install packages or change live Pi configuration.

## Confirmed boundaries

1. Edit extension source checkouts under `~/code/`, never Pi's installed
   copies under `~/.pi/agent/git/` or `~/.pi/agent/npm/`.
2. Keep existing plugins functional with `pi-auto-model` absent. Test both
   ordinary physical-model sessions and a synthetic native virtual model.
3. Route only the main conversation. Explicit child model/effort settings stay
   independent. The existing `execute-plan` worker policy is not changed.
4. Use shared tier metadata first, then bounded dynamic classification.
   Model choices stay in Pi configuration, not skill names. Add no custom
   provider, separate routing service, or upstream Pi fork.
5. Preserve per-edit approvals, Git/push permissions, and provider boundaries.
   Enabling a routing policy is not permission to edit, commit, or push.

## Source availability

Six personal Git-installed extension checkouts were verified under `~/code/`;
the plan records each exact path and inspected revision. The internal skill
package was also found at `~/code/fastly/agent-skills-internal`; it needs no
routing change.

`pi-intercom` is a third-party npm package, not the user's extension. Leave
it untouched: no source acquisition, patch, fork, uninstall, or upstream update
is part of this project. The user does not use it and accepts its known native
virtual-model limitation; it is not an activation or rollout blocker.

Generated handovers, including `/handover`, do not work while Auto is selected.
Select a physical model first if that feature is ever needed. Ordinary message
transport uses a separate path; this limitation is not a claim that all
intercom features are broken or that full virtual-model compatibility is tested.

## Current working-copy caution

The temporary handoff's dirty-file list is historical. Recheck each source
checkout before editing; the execution record captures the inspected revision
and protected files. All unrelated work stays outside staging, resets,
stashes, and this project's edits.

## Historical implementation handoff

Resume from [the saved Slice 1 task list](./tasks-slice-1.md), not from another
baseline preflight. The user approved task-at-a-time execution and Task 1's
scaffold/test payload and Task 2's two-file policy, both now verified and
committed. Task 3's bounded classifier is also verified and committed.
Task 4's native integration and summary-test correction are verified and
committed. Task5 acceptance and all approved corrections pass254 tests and
57 scenarios; completed premium review clears all eight findings. Read
[the verified correction checkpoint](./execution.md#f2f6-follow-up-verified-outcome)
before duplicate work. Corrections are committed and all four Slice1 milestone
checkmarks are approved and marked. Slice2 boundary checks found two required
implementation adjustments: a credential-independent Auto namespace and scoped
popup cleanup. Both are explicitly approved and applied in the plan; read
[the design checkpoint](./execution.md#slice2-compiler--verified-public-boundary-decisions)
before the approved runtime payload and
[Task1 review checkpoint](./execution.md#slice2-independent-review--verified-findings).
The host proposal is retired under the picker-only scope. The
[capture correction is verified](./execution.md#capture-correction-outcome--verified);
checklist items1–2 are complete. The configuration/routing batch and follow-ups
pass372 tests/57 scenarios; [focused review clears their findings](./execution.md#configuration-form-correction-outcome--verified).
Item3's [popup/acceptance automation is applied and reviewed](./execution.md#stage3-popupacceptance-batch--applied-and-reviewed),
passing396 tests/77 scenarios with no production findings. Its
[test-only corrections are verified](./execution.md#stage3-test-only-correction--verified-outcome);
[live regular/fullscreen acceptance is verified](./execution.md#stage3-live-terminal-acceptance--verified),
completing checklist item3. [Peer compatibility and follow-up are verified](./execution.md#stage4-follow-up--verified-outcome),
clearing all findings and12 combined checks; checklist item4 is complete.

## Next action

Historical settings changes cannot be reconstructed; current settings match the
managed file and remain untouched. Package documentation and isolated tarball
install/removal/rollback are verified. Commit `a60aa4b` is on pushed `main`;
the user's Git-install check remains. No global activation or registry
publication occurred. See the [verified package outcome][package-outcome] and [execution
record](./execution.md#next-action) for current gates. Keep Auto
opt-in; global activation is separate.

[package-outcome]: ./execution.md#stage-5-package-install-verified-outcome
