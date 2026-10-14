# First release — extension-only scope

- **Status:** Items1–4 and isolated package rollback verified; Git install
  confirmation after push remains.
- **Source:** Latest user scope decision supersedes the original restoration
  and saved-enabled requirements.
- **Host:** Existing Pi1.2.0 public extension APIs; no harness changes, source
  checkout, fork, new host API or host release dependency.

## Use Auto

Select `pi-auto-model/auto` through Pi's `/model` picker. Leave Auto by selecting
a physical model there. To set manual effort, first select the physical model,
then use Pi's normal thinking control.

The extension never calls model or thinking setters. Changing a virtual
thinking level does not leave Auto or override its task policy. This replaces
the earlier promise that a thinking command automatically selects a physical
route. Explicit physical selection remains under Pi's ownership.

Keep these commands:

- `/automodel configure`: edit all four tier mappings and the classifier.
- `/automodel mode model-and-effort|effort-only`: save the routing mode.
- `/automodel status`: show selection, mappings, availability and guidance.

There is no extension on/off command, toggle shortcut, automatic restoration
or saved-enabled preference. Obsolete commands give `/model` guidance without
changing selection or authenticating another model. Pi can restore Auto's own
native selection when resuming that conversation; a fresh session does not
activate Auto merely because preferences exist.

## Settings and routing state

Policy mappings stay in `pi-auto-model.json`. The separate preferences file
stores only `{ "version": 2, "mode": "…" }`. Legacy development preferences
may retain valid mode, but their enabled value cannot select Auto. Invalid
preferences still report an actionable file error.

Native route state continues to hold physical evidence and follows the branch.
Mode entries may hold an explicit fixed physical identity; they are not
selected-model snapshots or restoration instructions. Classification,
availability step-down, exact non-max automatic effort and sticky request
ownership are unchanged by this scope reduction.

## Original requirement disposition

| Original requirement or criterion | First-release replacement |
| --- | --- |
| R23, AC019, AC029: manual choices automatically disable routing | The user selects a physical model through Pi; thinking changes on a physical model remain manual. A virtual thinking choice alone does not switch models. |
| R24: on/off and toggle shortcut | Configure/status/mode remain; enter and leave using `/model`. Busy configuration still obeys safe-boundary rules. |
| R25, AC018: off restores both original settings | Removed. Leaving Auto preserves the explicitly chosen physical pair, not a pre-enable snapshot. |
| R26, AC021: fresh-session enabled preference | Save only mode. Fresh sessions make no extension-issued selection; native conversation resume remains supported. |
| R27, R63: separate enabled/mode preferences | Separate mode-only preferences; atomic policy-save and cancellation rules remain. |
| M2.1–M2.3 control/restoration clauses | Verify the picker-only control contract, mode persistence, branch state and actionable configuration errors. Accepted M1 outcomes stay intact. |

Original stable IDs remain historical pointers, not permission to enforce the
removed behavior. Unchanged mapping/popup/plugin/release requirements remain in
[the specification](./spec.md),
[the configuration addendum](./configuration-addendum.md) and
[the plan](./plan.md). Their conflicting selection/restoration clauses yield
to this document; no scenario is silently counted as passed.

## Remaining work — tick only after verification

1. [x] Complete picker-only simplification.
   - [x] Remove extension switching/restoration, shortcut and enabled preferences.
   - [x] Update scope/tests; normal338 tests/57 scenarios/type/load checks pass.
   - [x] Preserve newer fixed-model capture across reload/resume/tree; focused review clears PICKER-F01.
2. [x] Finish configuration/routing fixes.
   - [x] Apply safe settings activation, summary routing, offered-effort and error fixes;365 tests/57 scenarios pass.
   - [x] Clear mixed idle/busy disk-save ordering and strengthen capture-free summary tests;370 tests/57 scenarios pass.
   - [x] Preserve an open configuration form's save before younger queued commands;372 tests/57 scenarios pass, focused review clears CONFIG-F01.
3. [x] Complete acceptance, popup checks and review.
   - [x] Apply monotonic popup timing/render isolation and native acceptance tests;396 tests/76 scenarios pass.
   - [x] Clear all three acceptance-test gaps;396 tests/77 scenarios pass, focused review reports no findings.
   - [x] Verify approved live regular/fullscreen input, expiry, dialog focus, rendering and cleanup; independent evidence audit passes.
4. [x] Verify standalone peer-plugin compatibility, preserving explicit settings.
   - [x] Audit all four plugins and prepare tested, unapplied compatibility diffs.
   - [x] Apply approved34-file peer batch on feature branches;12 isolated combined checks pass.
   - [x] Clear five verified review findings and the statusbar branch-test assumption; all host checks pass.
   - [x] Preserve the current settings baseline, document the unknown historical delta, and clear focused review/combined checks.
5. [ ] Finish package/docs release and verify the documented Git install.
   Global activation is separate.
   - [x] Add a package allowlist and Git-install README; keep npm publication disabled.
   - [x] Verify the packed tarball with offline isolated install, load, removal
     and rollback; preserve isolated model defaults and portable
     policy/preferences.
   - [x] Review the living spec, package docs and new acceptance coverage.
   - [ ] Commit and merge this repository to `main`, then push.
   - [ ] User confirms Git installation from the pushed repository.

Item1's [verified correction evidence](./execution.md#capture-correction-outcome--verified)
records assertion-red, normal checks and independent native review. It is not
whole-controls acceptance or an installation-ready release.

Item2's [verified outcome](./execution.md#configuration-form-correction-outcome--verified)
clears settings activation, drain wake-up, summary routing and ordering findings.
Item3's [applied automation and review](./execution.md#stage3-popupacceptance-batch--applied-and-reviewed)
fix popup timing/render failures. The [test-only follow-up is verified](./execution.md#stage3-test-only-correction--verified-outcome);
[Live terminal acceptance is verified](./execution.md#stage3-live-terminal-acceptance--verified),
completing item3. [Plugin compatibility is verified](./execution.md#stage4-follow-up--verified-outcome),
completing item4. Isolated package installation/removal/rollback is verified;
item5 remains open for this repository's merge/push and the user's Git-install
check. No completed item claims registry publication, global activation, or host
API work.
