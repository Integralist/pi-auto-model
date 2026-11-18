@controls_acceptance
Feature: First-release picker controls and portable saved mappings
  Users enter and leave Auto through Pi's picker, without host changes.
  Saved mode and mappings do not select models or rewrite active tasks.

  Background:
    Given a native offline session has a saved policy and mode-only preferences

  Scenario: Virtual thinking does not change the next tier dispatch
    When I enter Auto, choose medium virtual thinking, and submit a trivial skill
    Then Auto remains selected and the request uses Luna at high

  @AC018 @AC019 @AC029
  Scenario: Explicit physical selection preserves manual model and effort
    When I enter Auto, route a task, then choose physical Sol at high
    Then the physical choice stays selected and its next request stays manual
    And configuration feedback adds no chat message or provider probe

  @AC021
  Scenario: Saved mode cannot activate a fresh conversation
    When I start a fresh native conversation after saving effort-only mode
    Then the fresh conversation retains mode but starts with physical Sol
    And configuration feedback adds no chat message or provider probe

  @AC045
  Scenario Outline: Search the real catalog without exposing virtual targets
    Given two physical providers and another virtual model are registered
    When I search the mapping catalog for "<query>"
    Then the offered choices are exactly "<choice>"
    And the saved policy, preferences and selection remain unchanged

    Examples:
      | query                  | choice                                          |
      | acceptance-alt         | acceptance-alt/portable-writer — Portable Writer |
      | portable-writer        | acceptance-alt/portable-writer — Portable Writer |
      | Portable Writer        | acceptance-alt/portable-writer — Portable Writer |
      | github-copilot gpt-6-luna | github-copilot/gpt-6-luna — gpt-6-luna         |

  @AC045
  Scenario: Blank catalog search excludes every registered virtual target
    Given two physical providers and another virtual model are registered
    When I search the mapping catalog for ""
    Then the complete choice list contains only the registered physical models
    And the saved policy, preferences and selection remain unchanged

  @AC046
  Scenario: The native effort menu does not clamp or offer unsupported values
    Given a physical catalog model supports only off and high
    When I save that model as the classifier at high
    Then the offered automatic efforts were exactly off and high
    And the saved classifier and next classifier request use that exact pair

  @AC047
  Scenario: Replace every Copilot mapping and retain it after native reload
    Given two physical providers and another virtual model are registered
    When I save the alternate physical pair for all five mappings and reload
    Then four declared tiers, classification and summary use only the alternate pair
    And non-mapping settings and mode-only preferences remain unchanged

  @AC048
  Scenario Outline: An edited draft cannot partially replace valid settings
    When an edited mapping cannot be saved because of "<reason>"
    Then the saved policy, preferences and selection remain unchanged
    And the next automatic request still uses the original physical pair
    And configuration feedback adds no chat message or provider probe

    Examples:
      | reason             |
      | cancel             |
      | decline review     |
      | invalid effort     |
      | write failure      |
      | disappeared model  |

  @AC049 @AC050
  Scenario Outline: Absent catalog choices give guidance without inventing a model
    When I request configuration with "<condition>"
    Then actionable Pi provider guidance is shown without dispatch or settings changes

    Examples:
      | condition          |
      | no matching model  |
      | no physical models |

  @AC052
  Scenario Outline: Noninteractive configuration gives file guidance only
    When I request configuration in native "<mode>" mode
    Then the policy-file guidance is observable and no dialog or settings change occurs

    Examples:
      | mode  |
      | print |
      | json  |
      | rpc   |

  @AC022 @AC051
  Scenario: Busy configuration returns before completion and affects only the next task
    When I request an edited mapping during an active task
    Then that task keeps Luna at high and the later fresh task uses Sol at high
    And non-mapping settings and mode-only preferences remain unchanged
