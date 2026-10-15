# Moderate Tier Luna/xhigh — Specification

- **Status:** Complete
- **Author:** Integralist
- **Created:** 2026-10-15
- **Language:** TypeScript

## Problem Statement

The default moderate tier currently uses Luna at the same high effort as trivial
tasks. Users want moderate tasks to receive more reasoning effort without
changing the physical model selected for that tier.

## Solution

Set the default moderate pair to GitHub Copilot GPT-6 Luna at xhigh. Keep the
trivial, complex, frontier, and classifier defaults unchanged. User-saved
routing configurations remain in control of their own mappings.

## User Stories

1. As a user, I want moderate tasks to use Luna at xhigh, so that this tier gets
   more reasoning effort without switching to a different model.

## Acceptance Criteria

```gherkin
Feature: Default moderate-tier effort

  Scenario: Moderate uses Luna at xhigh
    Given Auto uses its default routing mappings
    When a task resolves to the moderate tier
    Then the request uses github-copilot/gpt-6-luna at xhigh
    And trivial remains github-copilot/gpt-6-luna at high
    And complex and frontier remain github-copilot/gpt-6.1-sol at xhigh
```

## Behavioural Delta

**Baseline:** `docs/specs/automatic-routing.md` at
`765552ed00e8fb875bc06ff7d71b8e13d8abb76a`

### MODIFIED

**Baseline:**

```gherkin
Feature: Automatic Model Routing

  Scenario Outline: A default task tier selects its physical pair
    Given the default automatic routing configuration
    When a task resolves to "<tier>"
    Then the request uses "<model>" at "<effort>"

    Examples:
      | tier     | model       | effort |
      | trivial  | gpt-6-luna  | high   |
      | moderate | gpt-6-luna  | high   |
      | complex  | gpt-6.1-sol | xhigh  |
      | frontier | gpt-6.1-sol | xhigh  |
```

**Updated:**

```gherkin
Feature: Automatic Model Routing

  Scenario Outline: A default task tier selects its physical pair
    Given the default automatic routing configuration
    When a task resolves to "<tier>"
    Then the request uses "<model>" at "<effort>"

    Examples:
      | tier     | model       | effort |
      | trivial  | gpt-6-luna  | high   |
      | moderate | gpt-6-luna  | xhigh  |
      | complex  | gpt-6.1-sol | xhigh  |
      | frontier | gpt-6.1-sol | xhigh  |
```

## Testing Seams

- Route resolution verifies the exact default pair for each tier.
- Native request-boundary tests verify the model and reasoning effort dispatched
  for moderate tasks.

## Implementation Decisions

- Change only the default effort for moderate; retain Luna as its model.
- Continue to require the exact effort to be supported by the selected model.

## Out of Scope

- Changing the classifier, summary tier, or other tier defaults.
- Migrating existing user-saved routing configurations.

## Living Specifications

- `docs/specs/automatic-routing.md` — owns the default tier mappings and task
  routing behavior.
