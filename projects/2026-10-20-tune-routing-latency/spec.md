# Tune Routing Latency — Specification

- **Status:** Complete
- **Author:** Integralist
- **Created:** 2026-10-20
- **Language:** TypeScript

## Problem Statement

Across 50 recent Pi sessions, automatic routing had three latency bottlenecks:

1. Default Copilot mappings ran both `moderate` (`gpt-6-luna`) and `complex`
   (`gpt-6.1-sol`) at `xhigh`, whereas the `bedrock` and `gemini` presets use
   `high` for `moderate` and `complex` and reserve `xhigh` for `frontier`.
2. Short approval replies such as `"implement"`, `"apply"`, `"1"`, `"do it"`,
   and `"show a diff"` missed the narrow confirmation pattern and ran the
   classifier, stalling up to the full 10,000 ms timeout before keeping the
   current route.
3. The living spec still stated that a skill slash command always routes by its
   tier while the prompt cache is warm, even after commit `938feed` updated
   routing to hold the current pair on same-size or smaller skills while warm.

## Solution

- Lower the default `moderate` effort on `github-copilot/gpt-6-luna` to `high`
  and the default `complex` effort on `github-copilot/gpt-6.1-sol` to `high`,
  leaving `frontier` at `xhigh`.
- Lower the default classifier deadline from `10000` ms to `6000` ms while
  keeping `maxOutputTokens: 256` and `effort: "low"`.
- Expand `confirmation()` in `extensions/auto-model.ts` to match common
  follow-up approvals (`implement`, `apply`, `do it`, `ship it`, `go ahead`,
  `carry on`, `looks good`, `lgtm`, `next`, `proceed with edits`, `show diff`,
  and numbered choices) so they keep the current physical pair without
  classification.
- Update `docs/specs/automatic-routing.md` so its warm-cache skill prose and
  scenario match the implemented behavior.

## Acceptance Criteria

```gherkin
Feature: Tuned routing latency

  Scenario: Default moderate and complex tiers use high effort
    Given Auto uses its default routing mappings
    When a task resolves to the moderate tier
    Then the request uses github-copilot/gpt-6-luna at high
    When a task resolves to the complex tier
    Then the request uses github-copilot/gpt-6.1-sol at high
    When a task resolves to the frontier tier
    Then the request uses github-copilot/gpt-6.1-sol at xhigh

  Scenario: Short action approvals keep the current route without classification
    Given a task is running on Sol at xhigh
    When I reply "implement" or "apply" or "1"
    Then the request remains on Sol at xhigh
    And it is not classified as a new task
```

## Behavioural Delta

**Baseline:** `docs/specs/automatic-routing.md` at
`f5118f24176faca7ca4d1e917a02cd057c164896`

### MODIFIED (default tier efforts and classifier deadline)

**Baseline:**

| Task tier  | Default physical model       | Default effort |
| ---------- | ---------------------------- | -------------- |
| `trivial`  | `github-copilot/gpt-6-luna`  | `medium`       |
| `moderate` | `github-copilot/gpt-6-luna`  | `xhigh`        |
| `complex`  | `github-copilot/gpt-6.1-sol` | `xhigh`        |
| `frontier` | `github-copilot/gpt-6.1-sol` | `xhigh`        |

The default classifier uses `github-copilot/gpt-6-luna` at `low`, with a
12,000-character input bound, a 256-token output bound, and a 10,000 ms
deadline.

**Updated:**

| Task tier  | Default physical model       | Default effort |
| ---------- | ---------------------------- | -------------- |
| `trivial`  | `github-copilot/gpt-6-luna`  | `medium`       |
| `moderate` | `github-copilot/gpt-6-luna`  | `high`         |
| `complex`  | `github-copilot/gpt-6.1-sol` | `high`         |
| `frontier` | `github-copilot/gpt-6.1-sol` | `xhigh`        |

The default classifier uses `github-copilot/gpt-6-luna` at `low`, with a
12,000-character input bound, a 256-token output bound, and a 6,000 ms
deadline.

### MODIFIED (warm-cache skill routing)

**Baseline:**

```gherkin
  Scenario: A skill slash command routes by its tier while the cache is warm
    Given Auto uses model-and-effort mode
    And a skill task used the complex tier within the prompt cache window
    When I invoke a skill that declares the trivial tier
    Then the trivial physical pair is used
```

**Updated:**

```gherkin
  Scenario: A smaller skill slash command keeps the current pair while the cache is warm
    Given Auto uses model-and-effort mode
    And a skill task used the complex tier within the prompt cache window
    When I invoke a skill that declares the trivial tier
    Then the complex physical pair is kept
```

## Living Specifications

- `docs/specs/automatic-routing.md` — owns the default tier mappings,
  classifier bounds, confirmation handling, and warm-cache routing behavior.
