# Re-tier Model Defaults — Specification

- **Status:** Complete
- **Author:** Integralist
- **Created:** 2026-10-19
- **Language:** TypeScript

## Problem Statement

The shared task tiers shifted down a level. Short writing such as a PR body or
ticket is now `trivial`, hands-on software work is now `moderate`, and
`complex` is reserved for project planning and big-picture thinking. The
defaults and presets were tuned for the old meanings: trivial Luna ran at
`high`, the Bedrock moderate tier used Haiku for work that is now coding, and
the Gemini classifier spent `medium` effort on a one-word answer.

## Solution

- Lower the default trivial pair to GitHub Copilot GPT-6 Luna at `medium`.
- Map the Bedrock preset's moderate tier to `anthropic.claude-sonnet-5-5` at
  `high`.
- Lower the Gemini preset's classifier to `gemini-3.8-flash` at `low`.
- Rewrite the classifier prompt's tier definitions to match the new meanings.
- While the prompt cache is warm, only switch up to a bigger tier.

Moderate, complex, frontier, and the default classifier pair are unchanged.
User-saved routing configurations keep their own mappings.

## Acceptance Criteria

```gherkin
Feature: Re-tiered model defaults

  Scenario: Trivial uses Luna at medium
    Given Auto uses its default routing mappings
    When a task resolves to the trivial tier
    Then the request uses github-copilot/gpt-6-luna at medium

  Scenario: The Bedrock preset uses Sonnet for moderate work
    Given the session uses the bedrock temporary preset
    When a task resolves to the moderate tier
    Then the request uses amazon-bedrock/anthropic.claude-sonnet-5-5 at high

  Scenario: The Gemini preset classifies at low effort
    Given the session uses the gemini temporary preset
    When a typed task is classified
    Then the classifier request uses google-vertex/gemini-3.8-flash at low
```

## Behavioural Delta

**Baseline:** `docs/specs/automatic-routing.md` at
`c9f0fef0b07070d9830992e68f1659c17f638216`

### MODIFIED

**Baseline:**

| Task tier  | Default physical model       | Default effort |
| ---------- | ---------------------------- | -------------- |
| `trivial`  | `github-copilot/gpt-6-luna`  | `high`         |

```gherkin
  Scenario: Virtual thinking does not change the next tier dispatch
    When I enter Auto, choose medium virtual thinking, and submit a trivial
    skill
    Then Auto remains selected and the request uses Luna at high

  Scenario: A direct summary does not change the main task route
    Given the main task is running on Sol at xhigh
    And the default summary tier is trivial
    When Pi requests a summary through Auto
    Then the summary uses Luna at high
    And the main task route and branch state remain unchanged
```

**Updated:**

| Task tier  | Default physical model       | Default effort |
| ---------- | ---------------------------- | -------------- |
| `trivial`  | `github-copilot/gpt-6-luna`  | `medium`       |

```gherkin
  Scenario: Virtual thinking does not change the next tier dispatch
    When I enter Auto, choose medium virtual thinking, and submit a trivial
    skill
    Then Auto remains selected and the request uses Luna at medium

  Scenario: A direct summary does not change the main task route
    Given the main task is running on Sol at xhigh
    And the default summary tier is trivial
    When Pi requests a summary through Auto
    Then the summary uses Luna at medium
    And the main task route and branch state remain unchanged
```

### MODIFIED (warm prompt cache)

A model or effort switch re-sends the whole conversation without the
provider's prompt cache. While the branch's last answer is under an hour old
and the current pair is still the configured pair for its tier, a same-size or
smaller tier keeps the current pair.

**Baseline:**

```gherkin
  Scenario: Each new typed task is classified independently
    Given Auto uses model-and-effort mode
    And a skill task used the complex tier
    When I submit a new typed task that classifies as moderate
    Then the moderate physical pair is used
    And the skill's tier is not reused
```

**Updated:**

```gherkin
  Scenario: Each new typed task is classified independently
    Given Auto uses model-and-effort mode
    And a skill task used the complex tier
    And its answer is older than the prompt cache window
    When I submit a new typed task that classifies as moderate
    Then the moderate physical pair is used
    And the skill's tier is not reused
```

### ADDED

A skill slash command is a deliberate new task, so it routes by its tier even
while the cache is warm: on Claude pricing a switch from Opus 5.5 to Sonnet 5.5
repays its one-off re-send after about 12 requests, and a long skill run makes
far more.

```gherkin
  Scenario: A smaller typed task keeps the current pair while the cache is warm
    Given Auto uses model-and-effort mode
    And a skill task used the complex tier within the prompt cache window
    When I submit a new typed task that classifies as moderate
    Then the complex physical pair is kept

  Scenario: A bigger typed task steps up while the cache is warm
    Given Auto uses model-and-effort mode
    And a skill task used the trivial tier within the prompt cache window
    When I submit a new typed task that classifies as complex
    Then the complex physical pair is used

  Scenario: A skill slash command routes by its tier while the cache is warm
    Given Auto uses model-and-effort mode
    And a skill task used the complex tier within the prompt cache window
    When I invoke a skill that declares the trivial tier
    Then the trivial physical pair is used
```

## Out of Scope

- Migrating existing user-saved routing configurations.
- Changing the moderate, complex, or frontier defaults.

## Living Specifications

- `docs/specs/automatic-routing.md` — owns the default tier mappings and task
  routing behavior.
