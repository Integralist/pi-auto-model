@slice1
Feature: Portable skill tiers
  Background:
    Given offline Auto is enabled in "model-and-effort" mode

  @AC001
  Scenario Outline: Declared difficulty selects the configured pair
    Given a loaded skill declares model-tier "<tier>"
    When I invoke that skill as an idle slash command
    Then the main request uses "<model>" at "<effort>"
    And 0 classifier requests are made

    Examples:
      | tier     | model       | effort |
      | trivial  | gpt-6-luna  | high   |
      | moderate | gpt-6-luna  | xhigh  |
      | complex  | gpt-6.1-sol | xhigh  |
      | frontier | gpt-6.1-sol | xhigh  |

  @AC002
  Scenario: Metadata wins over a misleading familiar name
    Given the loaded commit skill declares model-tier "complex"
    When I invoke that skill as an idle slash command
    Then the main request uses "gpt-6.1-sol" at "xhigh"
    And 0 classifier requests are made

  @AC003
  Scenario: Metadata strings are trimmed and matched without case
    Given a loaded skill declares model-tier "  CoMpLeX  "
    When I invoke that skill as an idle slash command
    Then the main request uses "gpt-6.1-sol" at "xhigh"
    And 0 classifier requests are made

  @AC004
  Scenario Outline: Absent or invalid metadata still triggers classification
    Given a loaded skill has "<metadata>"
    And the offline classifier returns "complex"
    When I invoke that skill as an idle slash command
    Then the main request uses "gpt-6.1-sol" at "xhigh"
    And 1 classifier requests are made
    And classification receives only the loaded name and description

    Examples:
      | metadata                    |
      | no model-tier key           |
      | an empty model-tier string  |
      | an unknown model-tier value |
      | a list model-tier value     |
      | a numeric model-tier value  |

  @AC005
  Scenario: Classifier input follows the shared skill contract
    Given a loaded skill has "no model-tier key"
    And the offline classifier returns "complex"
    When I invoke that skill with poison arguments while idle
    Then the main request uses "gpt-6.1-sol" at "xhigh"
    And classification receives only the loaded name and description
    And classifier usage is separate from assistant conversation entries

  @AC006
  Scenario Outline: An unusable classifier result retains the route
    Given a loaded skill has "no model-tier key"
    And classification "<outcome>"
    When I invoke that skill as an idle slash command
    Then the main request uses "gpt-6.1-sol" at "xhigh"
    And classification has no usable tier

    Examples:
      | outcome                         |
      | returns no tier                 |
      | returns an unknown tier         |
      | returns malformed output        |
      | fails                           |
      | times out                       |
      | has no available physical model |

  @AC007
  Scenario: Classifier work cannot reroute itself or the conversation
    Given a loaded skill has "no model-tier key"
    And the offline classifier returns "complex"
    When standalone classification runs without starting a main conversation
    Then classification uses physical Luna at low without tools or a virtual router
    And selected Auto and its conversation and branch remain unchanged

  @AC008
  Scenario: The next typed task is classified independently
    Given a completed declared frontier task used Sol at xhigh
    And the offline classifier returns "moderate"
    When I submit "draft a short PR description" while idle
    Then the main request uses "gpt-6-luna" at "xhigh"
    And 1 classifier requests are made
    And classification receives only that typed task
