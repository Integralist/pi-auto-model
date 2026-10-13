Feature: Offline native dispatch boundary
  Scenario: Auto dispatches physical settings without selecting itself on load
    Given an isolated Pi session starts on physical Sol at xhigh
    When I explicitly select native Auto and send an offline request
    Then selection is Auto and the physical response is Sol at xhigh
    And no extension error or live provider request occurs
