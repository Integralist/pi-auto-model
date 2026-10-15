@slice1
Feature: Exact and safe automatic routing
  Background:
    Given offline Auto is enabled in "model-and-effort" mode

  @AC023
  Scenario Outline: Automatic configuration rejects max
    Given the automatic "<slot>" setting is max
    When I submit "new task" while idle
    Then routing reports an actionable error containing "<field>"
    And no physical request is dispatched

    Examples:
      | slot       | field                         |
      | tier       | config.tiers.trivial.effort   |
      | classifier | config.classifier.effort      |
      | summary    | config.summaryTier           |

  @AC024
  Scenario: An unavailable tier steps down to the nearest smaller pair
    Given a loaded skill declares model-tier "complex"
    And the configured complex pair is absent
    When I invoke that skill as an idle slash command
    Then the main request uses "gpt-6-luna" at "xhigh"
    And 0 classifier requests are made

  @AC025
  Scenario: Step-down continues past unavailable smaller tiers
    Given a loaded skill declares model-tier "frontier"
    And only trivial is configured to available Sol at high
    When I invoke that skill as an idle slash command
    Then the main request uses "gpt-6.1-sol" at "high"
    And 0 classifier requests are made

  @AC026
  Scenario: No available smaller tier keeps the current physical pair
    Given a loaded skill declares model-tier "trivial"
    And trivial is absent while every larger tier maps to Luna at high
    When I invoke that skill as an idle slash command
    Then the main request uses "gpt-6.1-sol" at "xhigh"
    And 0 classifier requests are made

  @AC027
  Scenario: Invalid routing configuration remains an actionable error
    Given a physical tier target is the virtual Auto model
    When I submit "new task" while idle
    Then routing reports an actionable error containing "virtual target"
    And no physical request is dispatched

  @AC028
  Scenario: Keep-current requires a known physical pair
    Given saved Auto has no active or captured physical evidence
    And the offline classifier returns "unknown"
    When I submit "new task" while idle
    Then routing reports an actionable error containing "Select an available physical model and effort"
    And no main request is dispatched
    And 1 classifier requests are made

  @AC030
  Scenario: A live provider failure does not speculate about tier availability
    Given a loaded skill declares model-tier "complex"
    When a "automatic retry" requires another native request for that skill
    Then every main request uses "gpt-6.1-sol" at "xhigh"
    And exactly 2 main requests were observed
    And 0 classifier requests are made

  @S1_ACCEPTED_INPUT
  Scenario Outline: A changed or consumed input cannot claim an earlier candidate
    Given a loaded skill declares model-tier "trivial"
    And a later input handler "<change>"
    When I invoke that skill as an idle slash command
    Then no stale candidate is used after "<change>"

    Examples:
      | change               |
      | handles the input    |
      | transforms the input |
      | changes the resource |
      | removes the resource |

  @S1_PUBLIC_CONFIG
  Scenario Outline: Public configuration errors fail before dispatch
    Given the routing configuration has "<problem>"
    When I submit "new task" while idle
    Then routing reports an actionable error containing "<field>"
    And no physical request is dispatched

    Examples:
      | problem           | field                          |
      | wrong version     | config.version                 |
      | unknown mode      | config.mode                    |
      | zero deadline     | config.classifier.timeoutMs    |
      | unknown root key  | config.legacySkills            |
      | missing tier pair | config.tiers.frontier          |

  @S1_CLASSIFIER_BOTH_MODES
  Scenario Outline: Classifier failure retains owned evidence in both modes
    Given offline Auto is enabled in "<mode>" mode
    And classification "fails"
    When I submit "new task" while idle
    Then the main request uses "gpt-6.1-sol" at "xhigh"
    And 1 classifier requests are made

    Examples:
      | mode             |
      | model-and-effort |
      | effort-only      |
