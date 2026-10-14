# Model configuration — approved Slice 2 scope addition

- **Status:** Scope approved; implementation and acceptance pending
- **Approved:** 2026-10-13, during Task 4 execution
- **Slice:** Slice 2, after Slice 1 acceptance
- **Sources:** [Original spec](./spec.md#pi-tier-mapping),
  [original Slice 2 plan](./plan.md#slice-2-quiet-controls-persistence-and-restoration)
- **Evidence:** [Execution record](./execution.md#configuration-scope-addition)

## Current first-release scope

[The extension-only release scope](./release-scope.md) supersedes earlier
on/off, automatic restoration, saved-enabled and manual-thinking activation
clauses. Use Pi's `/model` picker to enter and leave Auto. No Pi host changes
or host-release dependency are part of this release; other behavior remains
unchanged.

## User outcome

Users can use their own providers and models without editing extension code.
Copilot Luna/high and Sol/xhigh remain defaults, not required accounts or
hidden fallbacks. A user can replace every task-tier mapping and the classifier
with physical pairs from Pi's configured model catalog.

The user requested a model list similar to Pi's `/models` experience and
approved adding `/automodel configure` to Slice 2. The original plan already
provides the policy file and safe controls; this addition provides an interactive
way to edit those mappings. It does not change Task 4 or authorize installation,
account changes, provider configuration, live probes or additional code edits.

## Configuration flow

1. Run `/automodel configure` and choose `trivial`, `moderate`, `complex`,
   `frontier` or the classifier. Show each slot's current physical pair.
2. Search Pi's available physical models by provider, model ID or display name.
   Show provider labels; exclude Auto and every other virtual model.
3. Choose an effort supported by that physical model. Do not offer automatic
   `max`, or treat a silently clamped effort as the selected exact effort.
4. Review the complete draft mappings and explicitly save, or cancel without
   changing the policy. The same physical pair may serve multiple tiers.
5. Save validated policy atomically to `~/.pi/agent/pi-auto-model.json`.
   Preserve unrelated policy settings and the separate enabled/mode preference
   file. Apply routing changes at the existing safe idle boundary, not mid-task.

The classifier's provider/model/effort is independently configurable. Preserve
its bounded input/output/deadline settings. Summary requests use the selected
`summaryTier` mapping; do not create a hidden separate Copilot summary pair.
Task tiers and skill metadata keep their existing meanings when mappings change.

## Requirements

These append R61–R65 to the execution ledger. They do not renumber or replace
R01–R60, AC001–AC044, or M2.1–M2.4. M2.1 covers the configuration command and
safe application; M2.2 covers persistence. The source plan/spec remain frozen;
this approved addendum is an additional input when compiling Slice 2.

| Key | Required behavior |
| --- | --- |
| R61 | `/automodel configure` edits all four task-tier mappings and the classifier through a searchable provider-labeled list of Pi's available physical models; virtual targets are excluded. |
| R62 | The effort selector offers only exact efforts supported by the chosen model, excluding automatic `max`; save uses existing strict policy validation and preserves classifier bounds and unrelated settings. |
| R63 | Explicit save persists validated mappings atomically in the existing policy file, without credentials or changes to Pi's provider setup, `/models` selection scope, or separate enabled/mode preferences; cancel/write failure preserves the previous policy. |
| R64 | Users can replace every default Copilot mapping, including classifier and summary-tier dispatch, with catalog-backed physical pairs; configured routing never inserts a hidden Copilot fallback or changes task-tier meanings. |
| R65 | Availability is Pi's configured catalog/auth/exact-effort evidence, not proof of live entitlement; empty/stale/headless/busy cases are actionable, perform no paid probe, and cannot switch an active task or implicitly enable Auto. |

## Provider boundaries

Use the public Pi registry, not a second hardcoded provider/model list. Installed
Pi 1.2.0 exposes `getAvailable`, `find` and `hasConfiguredAuth` in
`dist/core/model-registry.d.ts:27–32`. Its model selector uses the available
snapshot, provider labels and search. Availability still does not prove account
entitlement, quota or that a later request will succeed.

The user's Gemini-via-AWS-Bedrock example is a desired configuration, not a
verified provider offering. Offer only combinations that actually exist in
that user's Pi catalog and configured providers. If a combination is absent,
explain that it cannot be selected here and direct the user to Pi's provider
configuration. Do not invent a model ID, proxy model availability, provision
credentials or add a new account as part of the picker.

If no physical model is available, give an actionable provider-setup message
and leave the draft and saved policy unchanged. Revalidate selected exact pairs
before saving. A saved pair that later disappears follows the existing ordered
step-down/keep-current policy and appears as unavailable in configuration/status;
it is not silently replaced with a built-in default.

Interactive configuration requires Pi's UI. Headless/RPC invocation must return
plain-text guidance for the same policy file without opening a dialog, writing
credentials or blocking routing. Busy control requests use Slice 2's existing
safe-boundary/deferred-control contract; the command handler does not await idle
or replace the active physical pair. Opening or saving configuration does not
select Auto, change the manual selected pair or enable automation.

## Acceptance criteria

These are boundary scenarios for later executable Cucumber coverage. They are
not `.feature` files or completed tests yet. Keep AC045–AC052 stable in the
Slice 2 compiler and use a fake catalog/provider fixture for offline evidence.

```gherkin
Feature: Configure automatic routing with the user's physical models
  As a Pi user
  I want to assign my available physical models to task tiers and the classifier
  So that automatic routing does not require Copilot

  @AC045
  Scenario: Search physical catalog entries by provider
    Given Pi has available physical models from two configured providers
    And Pi has an Auto virtual model
    When I search for one provider in /automodel configure
    Then I see matching physical models with exact provider and model labels
    And I cannot select Auto or another virtual model
    And the extension does not change Pi's model selection scope

  @AC046
  Scenario: Choose only supported automatic effort
    Given the selected physical model supports off and high but not xhigh
    When I choose its automatic effort
    Then the offered efforts are off and high
    And xhigh and max are not offered
    And the saved pair is not silently clamped

  @AC047
  Scenario: Replace every Copilot default and retain mappings after reload
    Given a non-Copilot provider has available physical models and supported efforts
    When I assign its physical pairs to every task tier and the classifier
    And I explicitly save and reload the extension
    Then all five mappings retain the chosen provider, model and effort
    And classified and declared tasks use the configured tier pairs
    And summaries use the configured summary tier pair
    And no routing or classifier request silently uses a Copilot default

  @AC048
  Scenario Outline: An incomplete configuration operation preserves prior policy
    Given I have a saved policy and separate enabled and mode preferences
    When a draft configuration is not saved because of <reason>
    Then the previous policy and preferences remain unchanged
    And provider credentials and unrelated policy settings remain unchanged

    Examples:
      | reason                     |
      | user cancellation          |
      | policy validation failure  |
      | atomic policy write failure |
      | selected pair disappearing |

  @AC049
  Scenario: An absent provider-model combination is not invented
    Given Pi has no available physical model for the provider-model combination I want
    When I open /automodel configure
    Then I cannot select that absent combination
    And I receive guidance for Pi's provider configuration
    And no live entitlement probe or account change occurs

  @AC050
  Scenario: No configured physical models leaves saved policy unchanged
    Given Pi has no available physical models
    When I run /automodel configure
    Then I receive actionable provider-setup guidance
    And no empty mapping or new default is saved
    And the extension makes no provider request

  @AC051
  Scenario: Configuration changes wait until an active task is safe
    Given an active task uses a physical pair
    When I request a configuration change while the session is busy
    Then the command follows the deferred-control contract without awaiting idle
    And the active task retains its physical pair
    And an applied change affects only later eligible fresh tasks
    And configuration does not implicitly enable Auto or replace a manual selection

  @AC052
  Scenario: Headless configuration gives file guidance without a dialog
    Given Pi runs without interactive UI
    When I run /automodel configure
    Then I receive guidance for ~/.pi/agent/pi-auto-model.json
    And no model picker opens
    And saved policy, credentials and the selected pair remain unchanged
```

## Implementation and verification gate

Compile this addition with Slice 2, after Slice 1's independent review and
acceptance. Extend the existing command/configuration boundary rather than add
another model registry or settings file. Propose exact files and tests before
editing code. Reuse the normal `make test` entry point for executable acceptance;
unit tests cover filtering, effort validation and atomic persistence errors.

Observe model dispatch through the fake provider and native request metadata,
not requested UI labels. Full provider portability must be tested with a
non-Copilot fixture, including classifier and summary paths. A live provider or
terminal UI smoke check needs separate approval; the approved scope addition
alone does not authorize paid requests or global activation.
