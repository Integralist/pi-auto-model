# Pi Auto Model Glossary

Terms for task difficulty and native model routing. The specification owns
tier values, routing rules, and physical defaults.

## Difficulty

**Task tier**:
A harness-independent category of task difficulty. It expresses the demand of
the work, not a provider, model, price, or reasoning level.
_Avoid_: Model size, model name

**Declared tier**:
The task tier explicitly supplied in a skill's portable metadata.
_Avoid_: Skill-name default

**Classified tier**:
The task tier inferred dynamically when valid metadata is absent, or when a
fresh typed task needs its own decision.
_Avoid_: Guaranteed difficulty

## Routing

**Selected pair**:
The model and effort selected for the conversation, which may name a virtual
model. It is not evidence of the physical request sent to a provider.
_Avoid_: Observed dispatch

**Physical pair**:
The physical model and effort used for a provider request.
_Avoid_: Virtual selection

**Tier step-down**:
Pre-dispatch selection of the nearest smaller configured tier whose pair is
available. It is distinct from retrying a failed provider request.
_Avoid_: Entitlement recovery
