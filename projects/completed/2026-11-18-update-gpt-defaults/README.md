# Update Default GPT Mappings

This README is the index for the project workspace. Keep it current as
artifacts are created, approved, run, or superseded. The artifacts
contain the source material; this file contains the navigation and current
state.

- **Status:** Complete
- **Owner:** Integralist
- **Created:** 2026-11-18
- **Updated:** 2026-11-18

## Summary

Update the built-in `github-copilot` tier defaults to route `trivial` through
`gpt-6-luna` at `high`, `moderate` through `gpt-6.2-sol` at `low`, `complex`
through `gpt-6.2-sol` at `xhigh`, and `frontier` through `gpt-6.2-Astra` at
`high`, while keeping the classifier on `gpt-6-luna` at `low`.

## Workflow status

Engineering-led change. Spec delta, implementation, and verification are
complete.

## Artifacts

| Artifact             | Purpose                                                 | Status   |
| -------------------- | ------------------------------------------------------- | -------- |
| [spec.md](./spec.md) | Default tier model and effort delta for automatic route | Complete |

## Next action

None — ready to commit.

## References

- [Automatic Model Routing](../../../docs/specs/automatic-routing.md) — current
  automatic-routing contract.
