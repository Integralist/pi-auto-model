@slice1
Feature: Main-conversation routing
  Background:
    Given offline Auto is enabled in "model-and-effort" mode

  @AC009
  Scenario Outline: Typed tasks use classified difficulty
    Given the offline classifier returns "<tier>"
    When I submit "<request>" while idle
    Then the main request uses "<model>" at "<effort>"
    And 1 classifier requests are made
    And classification receives only that typed task

    Examples:
      | request                          | tier     | model       | effort |
      | plan a new feature               | complex  | gpt-6.1-sol | xhigh  |
      | implement the approved task list | complex  | gpt-6.1-sol | xhigh  |
      | debug authentication             | complex  | gpt-6.1-sol | xhigh  |
      | draft a short PR description     | moderate | gpt-6-luna  | high   |
      | summarize the completed work    | trivial  | gpt-6-luna  | high   |

  @AC010
  Scenario: Effort-only preserves its fixed physical model
    Given offline Auto is enabled in "effort-only" mode
    And the offline classifier returns "moderate"
    When I submit "draft a short PR description" while idle
    Then the main request uses "gpt-6.1-sol" at "high"
    And 1 classifier requests are made

  @AC011
  Scenario: Effort-only checks effort against its fixed model
    Given offline Auto is enabled in "effort-only" mode
    And the fixed Sol model supports high but not xhigh
    And the offline classifier returns "complex"
    When I submit "debug authentication" while idle
    Then the main request uses "gpt-6.1-sol" at "high"
    And 1 classifier requests are made

  @AC012
  Scenario Outline: Tool follow-ups and retries retain their route
    Given a loaded skill declares model-tier "trivial"
    When a "<event>" requires another native request for that skill
    Then every main request uses "gpt-6-luna" at "high"
    And exactly 2 main requests were observed
    And 0 classifier requests are made

    Examples:
      | event           |
      | tool result     |
      | automatic retry |

  @AC013
  Scenario: Confirmation retains its route
    Given a completed declared complex task used Sol at xhigh
    When I submit "yes" while idle
    Then the main request uses "gpt-6.1-sol" at "xhigh"
    And 0 classifier requests are made

  @AC014
  Scenario: Short task intent is not a confirmation
    Given a completed declared complex task used Sol at xhigh
    And the offline classifier returns "moderate"
    When I submit "debug authentication" while idle
    Then the main request uses "gpt-6-luna" at "high"
    And 1 classifier requests are made
    And classification receives only that typed task

  @AC015
  Scenario Outline: Busy and queued input retain the active route
    Given a loaded skill declares model-tier "complex"
    When a routine request is queued as "<delivery>" during that task
    Then every main request uses "gpt-6.1-sol" at "xhigh"
    And exactly 2 main requests were observed
    And 0 classifier requests are made

    Examples:
      | delivery |
      | steer    |
      | followUp |

  @AC016
  Scenario Outline: Extension-origin work retains the active route
    Given a completed declared trivial task used Luna at high
    When an extension submits "<delivery>" work
    Then the main request uses "gpt-6-luna" at "high"
    And 0 classifier requests are made

    Examples:
      | delivery     |
      | message      |
      | custom event |

  @AC017
  Scenario: Direct summary requests do not alter main task state
    Given a completed declared complex task used Sol at xhigh
    When a summary uses native virtual-aware dispatch
    Then the direct summary request uses physical Luna at high
    And the main branch and restore target are unchanged
    And a confirmation still uses Sol at xhigh without classification
