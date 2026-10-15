# Automatic Model Routing

- **Status:** Current
- **Author:** Integralist
- **Created:** 2026-10-14

## Purpose

Pi users can select Auto as the model for the main conversation. Auto resolves a
task tier, then routes the request through a configured physical model and
effort pair. Pi remains responsible for model selection.

A **task tier** describes difficulty, not a model. A **selected pair** is the
model and effort selected for the conversation. A **physical pair** is the
model and effort used for a provider request.

## Tier routing

The four tiers are ordered from smallest to hardest:

| Task tier  | Default physical model       | Default effort |
| ---------- | ---------------------------- | -------------- |
| `trivial`  | `github-copilot/gpt-6-luna`  | `high`         |
| `moderate` | `github-copilot/gpt-6-luna`  | `high`         |
| `complex`  | `github-copilot/gpt-6.1-sol` | `xhigh`        |
| `frontier` | `github-copilot/gpt-6.1-sol` | `xhigh`        |

Users can configure all four tier mappings and the classifier pair. The default
classifier uses `github-copilot/gpt-6-luna` at `low`, with a 12,000-character
input bound, a 256-token output bound, and a 10,000 ms deadline. The policy also
names a summary tier, which selects one of the tier mappings; the default is
`trivial`. Configured physical pairs must name a physical model and an exact
supported effort. Automatic routing does not use `max`.

### Determine the task tier

For an explicit skill slash command, valid `metadata.model-tier` skill metadata
wins. Normalize a string by trimming it and matching without case. Missing,
empty, unknown, list, or numeric values are treated as absent. In that case,
classify the loaded skill's name and description. Do not classify its
instructions or slash arguments.

Classify each new typed task independently. Do not reuse a prior skill's tier.
A confirmation, active task, retry, or extension-origin continuation keeps the
current physical pair.

Classification is bounded and best-effort. If it returns no usable tier or
fails, keep the current physical pair. Classification does not use tools, route
through Auto, add a conversation entry, or change the main task state.

### Choose the physical pair

Use the configured physical pair for the resolved tier. If it is unavailable,
step down through smaller configured tiers and use the nearest available pair.
Never step up. Availability checks do not probe live provider entitlement. A
provider failure uses Pi's normal retry behavior on the same physical pair.

If no smaller configured pair is available, keep the known current physical
pair. If no physical pair is known, require the user to select one. Never treat
the selected virtual model as evidence of a physical dispatch.

Effort-only mode keeps its fixed physical model and selects a supported effort
for the task tier. A direct summary request uses the configured summary tier
without changing the main task's route or branch state.

## User control and state

Enter Auto by selecting `pi-auto-model/auto` in Pi's `/model` picker. Leave Auto
by selecting a physical model there. Leaving Auto keeps the pair the user
selected; it does not restore an earlier model or effort. Changing a virtual
thinking level does not leave Auto or override its task policy. To change effort
manually, first select a physical model and use Pi's normal thinking control.

The extension provides these commands:

- `/automodel configure` edits the four tier mappings and classifier.
- `/automodel mode model-and-effort|effort-only` saves the routing mode.
- `/automodel status` reports the selection, mappings, availability, and
  guidance.

Policy mappings and preferences are separate. Preferences store only the
version and mode; they do not store an enabled state. Saving a mode does not
select Auto in a fresh conversation. Pi may restore its native Auto selection
when the user resumes that conversation.

Routing state follows the active session branch and keeps physical evidence.
It is not a pre-enable snapshot or restoration instruction. Invalid
configuration and preferences report actionable errors before unsafe dispatch.

Configuration requires Pi's interactive terminal. In print, JSON, and RPC modes,
configuration returns policy-file guidance and does not open a dialog or save
changes.

There is no extension on/off command, toggle shortcut, automatic restoration,
or saved-enabled preference.

## Acceptance Criteria

```gherkin
Feature: Native Auto routing
  As a Pi user
  I want Auto to route eligible main-conversation work
  So that task difficulty selects a configured physical pair

  Scenario: Saved mode does not activate a fresh conversation
    Given saved preferences contain "effort-only" mode
    And a fresh conversation starts on physical Sol at xhigh
    When the conversation starts
    Then physical Sol at xhigh remains selected
    And Auto is not selected

  Scenario: The user enters Auto with Pi's model picker
    Given Auto is available in Pi's model picker
    When I select Auto
    Then Auto becomes the selected model
    And the next eligible request uses its configured physical pair

  Scenario: Physical selection leaves Auto without restoring an older pair
    Given Auto is selected and a task used Luna at high
    When I select physical Sol at xhigh
    Then Sol at xhigh remains selected
    And the earlier physical pair is not restored

  Scenario: Virtual thinking does not change the next tier dispatch
    When I enter Auto, choose medium virtual thinking, and submit a trivial skill
    Then Auto remains selected and the request uses Luna at high

  Scenario Outline: A declared tier selects its configured pair
    Given a loaded skill declares "<tier>"
    When I invoke the skill as a slash command
    Then the request uses the configured pair for "<tier>"
    And classification is not called

    Examples:
      | tier     |
      | trivial  |
      | moderate |
      | complex  |
      | frontier |

  Scenario: Missing or invalid skill metadata uses classification
    Given a loaded skill has no valid model-tier metadata
    When I invoke it as a slash command
    Then classification receives only the loaded name and description
    And the configured pair for the classified tier is used

  Scenario: Each new typed task is classified independently
    Given Auto uses model-and-effort mode
    And a skill task used the complex tier
    When I submit a new typed task that classifies as moderate
    Then the moderate physical pair is used
    And the skill's tier is not reused

  Scenario: An unusable classification keeps the current physical pair
    Given the current physical pair is Sol at xhigh
    And classification fails or returns no usable tier
    When I submit a new eligible task
    Then the request remains on Sol at xhigh

  Scenario: An unavailable tier steps down to a smaller pair
    Given a task resolves to complex
    And the complex pair is unavailable
    And the moderate pair is available
    When the request is dispatched
    Then the moderate pair is used
    And no larger tier is selected

  Scenario: No available smaller tier keeps the known physical pair
    Given a task resolves to complex
    And the complex and smaller configured pairs are unavailable
    And the current physical pair is Sol at xhigh
    When the request is dispatched
    Then Sol at xhigh is used

  Scenario: A known physical pair is required before dispatch
    Given no physical pair is current or captured
    And no configured tier pair is available
    When an eligible request has no usable classified tier
    Then Pi asks for a physical selection
    And no request is dispatched

  Scenario: Invalid automatic settings fail before dispatch
    Given an automatic mapping uses a virtual target or max effort
    When the configuration is loaded
    Then Pi reports an actionable error
    And no request is dispatched through that mapping

  Scenario: Active task continuations keep their physical pair
    Given a task is running on Sol at xhigh
    When a retry, confirmation, or extension continuation needs a request
    Then the request remains on Sol at xhigh
    And it is not classified as a new task

  Scenario: A direct summary does not change the main task route
    Given the main task is running on Sol at xhigh
    And the default summary tier is trivial
    When Pi requests a summary through Auto
    Then the summary uses Luna at high
    And the main task route and branch state remain unchanged

  Scenario: Explicit child settings remain independent
    Given Auto is selected in the main conversation
    And a child session has an explicit physical model and effort
    When the child session starts
    Then it keeps its explicit physical pair
    And the main task route is unchanged

  Scenario: Noninteractive configuration gives file guidance
    Given Pi runs in print, JSON, or RPC mode
    When I request Auto configuration
    Then Pi shows policy-file guidance
    And no dialog opens or settings change

  Scenario: Controls save mappings and mode without saving enabled state
    Given Auto is available
    When I configure mappings or save a routing mode
    Then the mappings and mode are saved separately
    And preferences contain no enabled state
    And a fresh conversation does not select Auto from those preferences
```

## Testing Seams

Observe selection through Pi's native `/model` picker, controls through the
registered `/automodel` commands, and routing through physical requests from
offline fake providers. Use fake classification responses to verify metadata
precedence, task-tier resolution, and failure handling. Do not require live
provider credentials or entitlement checks.

## Implementation Decisions

- Use Pi 1.2.0's public native virtual-model API; newer host versions are not
  verified by this contract.
- Keep task-tier policy in the Auto extension. Pi owns selected-model state and
  physical dispatch.
- Keep explicit child model and effort settings independent of Auto.
- Keep companion-plugin virtual-model compatibility independent of Auto.

## Out of Scope

- An extension on/off command, toggle shortcut, saved-enabled preference, or
  automatic restoration of a prior physical pair.
- Editing the user's live Pi settings or automatically selecting Auto.
- Runtime quota switching, new provider accounts, or host API changes.
- Changes to other harnesses or dependencies from companion plugins on Auto.
- Third-party intercom handover compatibility.
