# Pi Auto Model — Handoff

- **Status:** Implementation in progress; Slice 1 has not been accepted.
- **Owner:** Integralist
- **Created:** 2026-10-13
- **Language:** TypeScript

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
| [Specification](./spec.md) | Behavior and acceptance criteria | Draft |
| [Implementation plan](./plan.md) | Architecture, source ownership, slices, rollout | Planning |
| [Execution record](./execution.md) | Authorization, requirements, checks, commits | Active |
| [Slice 1 tasks](./tasks-slice-1.md) | Stable task scope, coverage and implementation payloads | In progress |
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

## Next action

Resume from [the saved Slice 1 task list](./tasks-slice-1.md), not from another
baseline preflight. The user approved task-at-a-time execution and Task 1's
scaffold/test payload with local development dependencies. Tasks 2–5 still need
compiled payloads and per-edit approval. The
[execution record](./execution.md#next-action) owns current authorization
and verification/commit gates. Keep the feature opt-in until plugin
compatibility and rollback are verified.
