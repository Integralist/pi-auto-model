# Update Default GPT Mappings — Specification

- **Status:** Complete
- **Author:** Integralist
- **Created:** 2026-11-18
- **Language:** TypeScript

## Problem Statement

The built-in `github-copilot` default tier mappings still pointed at
`gpt-6-luna` (`medium`/`high`) and `gpt-6.1-sol` (`high`/`xhigh`). The default
tiers now need to target `gpt-6-luna` at `high` for `trivial`, `gpt-6.2-sol` at
`low` and `xhigh` for `moderate` and `complex`, and `gpt-6.2-Astra` at `high`
for `frontier`.

## Solution

- Map `trivial` to `github-copilot/gpt-6-luna` at `high`.
- Map `moderate` to `github-copilot/gpt-6.2-sol` at `low`.
- Map `complex` to `github-copilot/gpt-6.2-sol` at `xhigh`.
- Map `frontier` to `github-copilot/gpt-6.2-Astra` at `high`.
- Keep the default classifier on `github-copilot/gpt-6-luna` at `low`.

User-saved routing policies and session-only presets are unchanged.

## Acceptance Criteria

```gherkin
Feature: Updated default GPT tier mappings

  Scenario: Default GPT tiers map to the new models and efforts
    Given Auto uses its built-in default mappings
    When a task resolves to "<tier>"
    Then the request uses "<model>" at "<effort>"

    Examples:
      | tier     | model                          | effort |
      | trivial  | github-copilot/gpt-6-luna      | high   |
      | moderate | github-copilot/gpt-6.2-sol     | low    |
      | complex  | github-copilot/gpt-6.2-sol     | xhigh  |
      | frontier | github-copilot/gpt-6.2-Astra   | high   |
```

## Behavioural Delta

**Baseline:** `docs/specs/automatic-routing.md` at
`76d427551b210193c9dc3b351960e6fc8edbc3f4`

### MODIFIED

**Baseline:**

| Task tier  | Default physical model       | Default effort |
| ---------- | ---------------------------- | -------------- |
| `trivial`  | `github-copilot/gpt-6-luna`  | `medium`       |
| `moderate` | `github-copilot/gpt-6-luna`  | `high`         |
| `complex`  | `github-copilot/gpt-6.1-sol` | `high`         |
| `frontier` | `github-copilot/gpt-6.1-sol` | `xhigh`        |

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

**Updated:**

| Task tier  | Default physical model         | Default effort |
| ---------- | ------------------------------ | -------------- |
| `trivial`  | `github-copilot/gpt-6-luna`    | `high`         |
| `moderate` | `github-copilot/gpt-6.2-sol`   | `low`          |
| `complex`  | `github-copilot/gpt-6.2-sol`   | `xhigh`        |
| `frontier` | `github-copilot/gpt-6.2-Astra` | `high`         |

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

## Living Specifications

- [Automatic Model Routing](../../../docs/specs/automatic-routing.md) — owns the
  default tier mappings and task-routing contract.
