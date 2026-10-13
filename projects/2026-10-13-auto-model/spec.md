# Pi Auto Model — Specification

- **Status:** Draft
- **Author:** Integralist
- **Created:** 2026-10-13
- **Language:** TypeScript

## Problem Statement

Manual model switching interrupts work, and fixed skill-name lists cannot
route unfamiliar skills safely. Users need skill metadata that describes task
difficulty without naming a harness, provider, model, or reasoning setting.

Pi should share the skill-tier contract with the Claude Code auto-model mod.
The agreed Pi defaults use GPT-6 Luna/high for trivial and moderate work, and
GPT-6.1 Sol/xhigh for complex and frontier work. Complex work includes software
implementation as well as planning; implementation no longer defaults to Luna.

Automatic routing must preserve manual choices, active work, helper settings,
and plugins used without this router.

## Solution

Provide opt-in main-conversation routing on Pi's native virtual-model API.
Resolve a task tier from portable skill metadata or dynamic classification,
then map that tier to a configured physical model/effort pair. Effort-only mode
varies effort while retaining its fixed physical model.

Existing plugin changes support native virtual models generically. They do
not depend on the new routing extension or its private state.

## User Stories

1. As a user, I want familiar and unfamiliar skills routed by task difficulty,
   without maintaining a list of skill names or editing every skill.
2. As a skill author, I want one portable tier declaration understood by
   multiple harnesses, each with its own model and effort mapping.
3. As a user, I want manual choices, confirmations, and active work preserved.
4. As a plugin user, I want existing plugins to work without the router.

## Routing Policy

### Shared skill metadata

The field is `metadata.model-tier` in a skill's `SKILL.md` frontmatter:

```yaml
---
name: commit
description: Create git commits with intelligent file grouping.
metadata:
  model-tier: trivial
---
```

Use one string from this ordered vocabulary, smallest first:

| Tier | Task difficulty |
| --- | --- |
| `trivial` | Quick, mechanical work: commit, branch, recap, rename, reformat. |
| `moderate` | Short writing or a small contained task: PR body, email, ticket. |
| `complex` | Software work, debugging, research, planning, multi-file changes. |
| `frontier` | The hardest builds or migrations, beyond complex work. |

A tier describes task difficulty, not a model. The key and tier meanings are
shared with the user-supplied Claude Code auto-model contract; each harness
owns its physical mapping. This is extension-consumed metadata, not a claim
that Pi itself implements the routing field.

For an eligible skill slash command, apply this precedence:

1. Normalize a string metadata value by trimming and matching without case.
   A valid tier wins without a classifier call.
2. Treat missing, empty, unknown, list, or numeric values as absent. Classify
   the resolved skill's name and description dynamically; invalid tier
   metadata alone never fails the request.
3. If classification returns no usable tier, keep the current physical route.

Existing skills need no metadata changes to participate. Classifier input for
a skill invocation is its name and description, not its instructions or slash
arguments. Plain-language model instructions are not binding routing metadata.
Resolve the skill actually loaded in the session; do not assume that a skill
named `commit` has any particular tier. There is no baked-in name map or
per-skill configuration override. Adding such an override would require a
shared-contract decision across both harnesses.

Metadata applies to the person's explicit slash invocation and its task
follow-ups, not later prompts or skills loaded internally by the assistant.
The next eligible typed prompt makes its own decision without inheriting the
previous skill's metadata. A fresh task prompt without a skill is classified
by its own difficulty using the same vocabulary. Short confirmations retain
the preceding route as a continuation safeguard; word count alone cannot
identify them. Explicit skill intent takes precedence over confirmation
detection: `/skill:commit` is a new invocation, and "debug authentication" is
a new task.

Classifier errors, unavailable classifier access, malformed results, or an
indeterminate result keep the current route. Classification is best-effort,
not a guarantee of correct difficulty assessment. It must be bounded,
cancelable, and separate from the main conversation, without tools, routing
recursion, chat entries, or changes to main task state.

### Pi tier mapping

| Tier | Default physical model | Default effort |
| --- | --- | --- |
| `trivial` | `github-copilot/gpt-6-luna` | `high` |
| `moderate` | `github-copilot/gpt-6-luna` | `high` |
| `complex` | `github-copilot/gpt-6.1-sol` | `xhigh` |
| `frontier` | `github-copilot/gpt-6.1-sol` | `xhigh` |

These four semantic tiers initially share two physical pairs. A classifier
returns a tier, never an arbitrary provider/model or effort. Use configurable
exact physical identifiers and efforts, resolved against the current catalog,
credentials, and supported effort. Catalog presence alone does not prove
account entitlement or successful live access.

If the selected tier's physical pair is unavailable, step down through the
next smaller configured tiers and use the first available pair. Never step
up. If none is available, keep the current physical pair. This applies at
pre-dispatch availability checks; a live provider failure uses ordinary
sticky retries rather than speculative entitlement or quota fallback.

Keep-current behavior means the active physical route or the captured
physical startup/restore pair, never the selected virtual label. If neither
physical pair is known, require a physical selection rather than inventing
one. Unsupported exact effort makes a tier candidate unavailable; never treat
Pi's effort clamping as proof the requested effort was honored.

Fallback uses only explicitly configured tier pairs. It grants no new provider
or credential access, makes no live entitlement probes, and does not change
explicit child settings or their strict no-fallback policy.

Manual `/model` and `/thinking` choices are outside tier precedence: they
disable automation and take priority until Auto is explicitly re-enabled.
`/thinking` changes effort, not model. Model-and-effort mode may change both
settings; effort-only mode retains its captured model and uses the available
tier's effort, checked against that fixed model.

Automatic settings, including classifier and direct-summary settings, must
never use `max` or a virtual target. No lower-effort defaults are added in V1.

## Controls and State

Offer on, off, status, and mode controls, plus a compact status indicator.
Modes are model-and-effort and effort-only. In effort-only mode, preserve the
physical model captured when automation is enabled and vary its effort.

Keep routine route changes out of chat. In the interactive terminal, show a
small, static popup for 10 seconds when the automatic physical model or effort
changes, alongside the persistent status bar. Show the previous and new pair,
using reliable dispatch metadata rather than the selected virtual label.

The popup must not take keyboard focus, delay model/tool work, dismiss another
dialog, blink, play a sound, or create a chat entry or OS notification. A new
switch replaces the existing popup and restarts its timer; unchanged routes
produce no popup. Enable it by default, with a configurable duration.
Allow it to be disabled. Skip it in non-interactive modes and clean it up on
session replacement, reload, and shutdown. A popup error must not break routing.

Explicit status requests and failures requiring action may report plain text.
A clickable status control is not required for V1.

Remember the enabled setting and mode across fresh sessions. Preserve the
pre-enable physical model/effort pair per session so disabling can restore it.
Route state follows session branches and survives compaction. Restoring a
session must not capture a virtual model as the physical restore target.

Manual model selection disables automation and preserves the user's choice.
Manual effort selection also disables automation, applies that effort to the
current physical route, and does not reinterpret it as a virtual routing tier.
Controls received during an active run take effect at a safe idle boundary.

Conflicting or malformed routing configuration, forbidden automatic settings,
and failed restoration require actionable errors. Unavailable tier candidates
use the documented step-down/keep-current policy; invalid skill-tier metadata
and classifier failures use their non-fatal fallback. Ordinary provider retries
stay on the chosen physical route; runtime entitlement and quota switching are
outside V1.

## Independence and Safety

- Route only eligible main-conversation input. Messages received while busy
  and extension-origin messages do not trigger a new routing decision.
- Keep explicit child model/effort overrides and strict no-fallback settings.
  Inherited defaults resolve to a physical parent pair. If none is known,
  request an explicit physical model rather than invoking an absent router.
- Existing plugins must not import the router, inspect router-specific saved
  state, require its event handlers, or add it as a package dependency.
- Physical-model behavior remains unchanged when automation is absent or off.
  Changed user-owned plugins support generic native virtual models without
  this particular router. The unmodified third-party intercom limitation is
  documented separately below.
- Preserve signed thinking when the physical target cannot be established.
  Let Pi own compaction decisions when an extension cannot safely establish
  the target context limit.
- Keep effective model/effort distinct from selected or requested settings.
  Do not label a virtual selection as proof of a physical request.
- Model routing does not grant editing, commit, push, or credential access.
  Update any downgrade-approval exception narrowly and with approval.

## Unmodified Third-Party Intercom

The user does not use `pi-intercom`. Leave it installed and unchanged; do not
acquire source, patch it, require an upstream update, or gate release on it.
Generated handovers, including its handover command, fail with a selected native
virtual model because their model call does not route that selection. Selecting
a physical model first is the workaround. Its session listing may show Auto
rather than the dispatched physical model.

Ordinary message transport uses a separate path from handover generation.
This identifies a specific known limitation, not verified compatibility for
all intercom features. The user accepts it as non-blocking. Any future removal
or upstream change is a separate decision, not work authorized by this plan.

## Acceptance Criteria

```gherkin
Feature: Portable skill tiers
  Background:
    Given automation is enabled in model-and-effort mode
    And the default tier mappings are available

  Scenario Outline: Declared difficulty selects the configured pair
    Given a loaded skill declares model-tier "<tier>"
    When I invoke that skill as a slash command while idle
    Then the first request uses <model> at <effort>
    And no classifier request is made

    Examples:
      | tier     | model       | effort |
      | trivial  | GPT-6 Luna  | high   |
      | moderate | GPT-6 Luna  | high   |
      | complex  | GPT-6.1 Sol | xhigh  |
      | frontier | GPT-6.1 Sol | xhigh  |

  Scenario: Metadata wins over a misleading familiar name
    Given the loaded commit skill declares model-tier "complex"
    When I submit "/skill:commit" while idle
    Then the first request uses GPT-6.1 Sol at xhigh
    And no baked-in commit mapping overrides the metadata

  Scenario: Metadata strings are trimmed and matched without case
    Given a loaded skill declares model-tier "  CoMpLeX  "
    When I invoke that skill as a slash command while idle
    Then the first request uses GPT-6.1 Sol at xhigh
    And no classifier request is made

  Scenario Outline: Absent or invalid metadata still triggers classification
    Given an unfamiliar loaded skill has <metadata>
    And the classifier returns "complex" for its name and description
    When I invoke that skill as a slash command while idle
    Then the first request uses GPT-6.1 Sol at xhigh
    And the metadata alone does not fail the request

    Examples:
      | metadata                    |
      | no model-tier key           |
      | an empty model-tier string  |
      | an unknown model-tier value |
      | a list model-tier value     |
      | a numeric model-tier value  |

  Scenario: Classifier input follows the shared skill contract
    Given a loaded skill has no valid model-tier metadata
    When I invoke the skill with arguments while idle
    Then classification receives the loaded skill's name and description
    And its instructions and slash arguments are not classifier input

  Scenario Outline: An unusable classifier result retains the route
    Given the current physical route is GPT-6.1 Sol at xhigh
    And an unfamiliar skill has no valid model-tier metadata
    And classification <outcome>
    When I invoke the skill as a slash command while idle
    Then the first request remains on GPT-6.1 Sol at xhigh

    Examples:
      | outcome                        |
      | returns no tier                |
      | returns an unknown tier        |
      | returns malformed output       |
      | fails                          |
      | times out                      |
      | has no available physical model |

  Scenario: Classifier work cannot reroute itself or the conversation
    Given a skill requires dynamic classification
    When classification runs for that slash invocation
    Then its request uses an explicitly configured physical model
    And it invokes no tools or virtual router
    And it creates no chat entry or main-route switch popup

  Scenario: The next typed task is classified independently
    Given a frontier skill invocation used GPT-6.1 Sol at xhigh
    And classification of my next typed task returns "moderate"
    When I submit that task while idle
    Then its first request uses GPT-6 Luna at high
    And the previous skill's metadata is not reused
```

```gherkin
Feature: Main-conversation routing
  Scenario Outline: Typed tasks use classified difficulty
    Given automation is enabled in model-and-effort mode
    And the configured tier mappings are available
    And classification of <request> returns "<tier>"
    When I submit <request> while idle
    Then the first request uses <model> at <effort>

    Examples:
      | request                          | tier     | model       | effort |
      | plan a new feature               | complex  | GPT-6.1 Sol | xhigh  |
      | implement the approved task list | complex  | GPT-6.1 Sol | xhigh  |
      | debug authentication             | complex  | GPT-6.1 Sol | xhigh  |
      | draft a short PR description     | moderate | GPT-6 Luna  | high   |
      | summarize the completed work     | trivial  | GPT-6 Luna  | high   |

  Scenario: Effort-only preserves its fixed physical model
    Given I enabled effort-only mode on GPT-6.1 Sol at xhigh
    And classification of my request returns "moderate"
    When I submit that request while idle
    Then GPT-6.1 Sol receives the request at high

  Scenario: Effort-only checks effort against its fixed model
    Given automation is enabled in effort-only mode
    And the fixed model supports high but not xhigh
    And classification of my request returns "complex"
    When I submit that request while idle
    Then the fixed model receives the request at high
    And the unavailable xhigh candidate is stepped down
    And the physical model does not change

  Scenario: Tool follow-ups and retries retain their route
    Given a task is running on GPT-6 Luna at high
    When tool results or an automatic retry require another request
    Then the request remains on GPT-6 Luna at high
    And the task is not reclassified

  Scenario: Confirmation retains its route
    Given a complex task response used GPT-6.1 Sol at xhigh
    When I reply "yes"
    Then the next request remains on GPT-6.1 Sol at xhigh

  Scenario: Short task intent is not a confirmation
    Given the previous response used GPT-6.1 Sol at xhigh
    When I submit "debug authentication" while idle
    Then the request is evaluated as new task intent
    And its length does not force the previous route

  Scenario: Busy and queued input retain the active route
    Given a task is running on GPT-6.1 Sol at xhigh
    When I submit a routine request while it is busy
    Then that message does not trigger rerouting or classification
    And delivery of that queued message retains the active route

  Scenario: Extension-origin work retains the active route
    Given automation has selected GPT-6 Luna at high
    When an extension triggers a continuation or submits a message
    Then the router does not reclassify it as fresh user intent

  Scenario: Direct summary requests do not alter main task state
    Given the main task is routed to GPT-6.1 Sol at xhigh
    When Pi or an extension requests a summary through virtual-aware dispatch
    Then the direct request uses the configured physical summary tier
    And the main task route and restore target remain unchanged
```

```gherkin
Feature: Controls and persistence
  Scenario: Disabling restores both original settings
    Given I enabled automation on GPT-6.1 Sol at xhigh
    And a later task used GPT-6 Luna at high
    When I disable automation while idle
    Then the selected model is GPT-6.1 Sol at xhigh

  Scenario: Manual choices win
    Given automation is enabled
    When I manually choose a model or effort
    Then automation becomes disabled
    And my new choice is preserved

  Scenario: Resume and tree navigation retain branch state
    Given two session branches have different task routes
    When I resume or navigate to either branch
    Then its own routing state is restored
    And disabling automation still restores a physical model and effort

  Scenario: Fresh sessions preserve the enabled preference
    Given I saved automation as enabled in effort-only mode
    When I start a fresh session with a physical startup model
    Then automation starts enabled in effort-only mode
    And that session captures its own physical restore target

  Scenario: Controls during work wait for a safe boundary
    Given a request is running
    When I request a mode change or disable automation
    Then the command returns without waiting for the request to finish
    And the control takes effect at the next safe idle boundary

  Scenario: Automatic configuration rejects max
    Given an automatic tier, classifier, or summary is set to max effort
    When the configuration is loaded
    Then the configuration is rejected before a request is sent
    And no automatic request uses max

  Scenario: An unavailable tier steps down to the nearest smaller pair
    Given the complex tier's physical pair is unavailable
    And the moderate tier's pair is available
    And my idle request resolves to "complex"
    When the request is dispatched
    Then GPT-6 Luna receives it at high
    And no larger tier is selected

  Scenario: Step-down continues past unavailable smaller tiers
    Given frontier, complex, and moderate are unavailable
    And trivial is configured to an available physical pair
    And my idle request resolves to "frontier"
    When the request is dispatched
    Then it uses the configured trivial pair

  Scenario: No available smaller tier keeps the current physical pair
    Given the current physical route is GPT-6.1 Sol at xhigh
    And trivial is unavailable
    And my idle request resolves to "trivial"
    When the request is dispatched
    Then it remains on GPT-6.1 Sol at xhigh
    And no larger tier or unconfigured provider is selected

  Scenario: Invalid routing configuration remains an actionable error
    Given routing configuration contains a virtual physical target
    When the configuration is loaded
    Then an actionable error identifies that invalid target
    And no request is sent through that target

  Scenario: Keep-current requires a known physical pair
    Given no active or captured physical pair is known
    And an idle request produces no usable tier
    When the router needs to retain the current model
    Then it asks for a physical selection
    And it does not dispatch the virtual selection as a physical model

  Scenario: Manual thinking changes effort without selecting another model
    Given automation's active physical route is GPT-6 Luna at high
    When I manually select xhigh using "/thinking"
    Then automation becomes disabled
    And GPT-6 Luna remains selected at xhigh

  Scenario: A live provider failure does not speculate about tier availability
    Given a task was dispatched to GPT-6.1 Sol at xhigh
    When the provider reports a retryable failure
    Then the retry remains on GPT-6.1 Sol at xhigh
    And no new classification or availability probe is made

  Scenario: Switch feedback stays out of the conversation
    Given automation and the switch popup are enabled
    When a new task changes the physical route
    Then the compact model status and temporary popup show the new pair
    And no chat entry or OS notification is created
```

```gherkin
Feature: Independently installable user-owned plugins
  Scenario Outline: Each changed plugin works without the router
    Given <plugin> is installed without pi-auto-model
    And Pi has a supported physical model selected
    When I use its existing model-dependent feature
    Then its established behavior and explicit overrides are preserved
    And no router package or handler is required

    Examples:
      | plugin           |
      | pi-statusbar     |
      | pi-subagents     |
      | pi-btw           |
      | pi-context-shake |

  Scenario: Generic native virtual models are supported independently
    Given a synthetic native virtual model is registered without pi-auto-model
    When I use an affected user-owned plugin
    Then it handles selection and physical dispatch safely
    And it does not read router-specific state

  Scenario: Children do not inherit a virtual router accidentally
    Given the main selection is virtual and its physical route is known
    When I create a helper or side conversation without a model override
    Then it receives the physical parent model and effort
    And subsequent main routing does not change that child

  Scenario: Unknown inherited physical settings fail safely
    Given a virtual main selection has no known physical parent pair
    When I create a child without a physical override
    Then the plugin asks for an explicit physical model
    And it does not require the routing extension to resolve one

  Scenario: Effective status is not fabricated
    Given a virtual model is selected but has not dispatched a response
    When the status bar renders
    Then it identifies the selection or a pending route honestly
    And it does not invent a physical model or effort

  Scenario: Signed thinking is preserved for an unknown physical target
    Given signed thinking exists and the physical target is unknown
    When context shaking runs
    Then signed thinking is preserved
    And compaction is not suppressed using an unverified context limit

```

```gherkin
Feature: Timed model and effort switch popup
  Scenario Outline: A real route change is visible for ten seconds
    Given the popup is enabled with a duration of ten seconds
    And the previous physical pair is <previous>
    When the automatic physical pair changes to <next>
    Then one popup shows the previous and new pairs
    And it disappears after ten seconds without changing the route

    Examples:
      | previous            | next              |
      | GPT-6.1 Sol xhigh   | GPT-6 Luna high   |
      | GPT-6 Luna high    | GPT-6 Luna xhigh  |

  Scenario: Unchanged requests do not repeat the popup
    Given a task is running on GPT-6 Luna at high
    When a tool follow-up or retry retains that pair
    Then no new switch popup appears

  Scenario: A new switch replaces the existing popup safely
    Given a switch popup is already visible
    When another automatic physical pair change occurs
    Then one updated popup is visible with a fresh ten-second timer
    And the old timer cannot dismiss the new popup

  Scenario: The popup does not interrupt work or input
    Given the editor has focus and model work is continuing
    When a switch popup appears
    Then editor input and model work continue without waiting for dismissal
    And another dialog is not dismissed when the popup expires

  Scenario: Disabled or non-interactive popups are skipped
    Given the popup is disabled or Pi is not in interactive terminal mode
    When the automatic physical pair changes
    Then routing and status behavior continue without a popup

  Scenario: Popup cleanup cannot affect a replacement session
    Given a switch popup is visible
    When the session is replaced or the extension shuts down
    Then the popup and its timer are disposed
    And stale callbacks cannot change the replacement session

  Scenario: Popup failure does not break a model request
    Given rendering the popup reports an error
    When the automatic physical pair changes
    Then routing continues and the status bar remains the fallback
```

## Testing Seams

Observe behavior through the registered extension, fake-provider dispatch,
fake classification, loaded skill fixtures, plugin commands, child creation,
and rendered status. Cover portable metadata normalization, custom skills with
familiar names, metadata-free classification, classifier failures, ordered tier
step-down, and independent typed prompts. Maintain shared-contract fixtures for
both harnesses without importing the Claude mod into Pi or changing it here.
Use a synthetic native router for plugin compatibility without installing this
extension. Keep parsing, validation, confirmation, and restoration unit tests
behind those public-boundary tests.

## Out of Scope

Mid-task reclassification or escalation, runtime quota/entitlement switching,
clickable panes, shared routing services, new provider accounts, per-skill name
overrides, and automatic skill-file edits. Claude Code/OpenCode implementation,
model, and credential changes remain outside this project; only the portable
skill contract is shared. Explicit worker changes, an upstream Pi fork, and
editing, uninstalling, or requiring an update to third-party `pi-intercom`
remain outside scope.

## Living Specifications

There is no standing specification for this new capability. When implemented,
seed the extension's automatic-routing contract and document each plugin's
native virtual-model compatibility in its own repository.

## Research

Verified source locations, revisions, API contracts, and the accepted intercom
limitation are recorded in [the implementation plan](./plan.md).
