# Raise Default Classifier Timeout — Specification

- **Status:** Complete
- **Author:** Integralist
- **Created:** 2026-11-19
- **Language:** TypeScript

## Problem Statement

The default classifier deadline of `6000` ms is too short for slower Vertex
Gemini models such as `google-vertex/gemini-4-hydrogen`, which routinely exceed
6 seconds during spikes. When a session starts directly on Auto with no prior
physical model, a classifier timeout leaves Auto with no fallback pair and
fails the turn.

## Solution

- Raise the default classifier deadline from `6000` ms to `15000` ms while
  keeping `maxInputChars: 12000`, `maxOutputTokens: 256`, and `effort: "low"`.

User-saved routing policies are unchanged.

## Acceptance Criteria

```gherkin
Feature: Default classifier timeout

  Scenario: Built-in default classifier uses a 15,000 ms deadline
    Given Auto uses its built-in default routing configuration
    When the classifier configuration is validated
    Then the classifier deadline is 15000 ms
```

## Behavioural Delta

**Baseline:** `docs/specs/automatic-routing.md` at
`2e3b18b0c566c5b689fef612c99cca208fd44348`

### MODIFIED

**Baseline:**

Users can configure all four tier mappings and the classifier pair. The default
classifier uses `github-copilot/gpt-6-luna` at `low`, with a 12,000-character
input bound, a 256-token output bound, and a 6,000 ms deadline.

**Updated:**

Users can configure all four tier mappings and the classifier pair. The default
classifier uses `github-copilot/gpt-6-luna` at `low`, with a 12,000-character
input bound, a 256-token output bound, and a 15,000 ms deadline.

## Living Specifications

- [Automatic Model Routing](../../../docs/specs/automatic-routing.md) — owns the
  default tier mappings, classifier bounds, and task-routing contract.
