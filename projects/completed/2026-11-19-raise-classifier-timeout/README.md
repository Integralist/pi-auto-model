# Raise Default Classifier Timeout

This README is the index for the project workspace. Keep it current as
artifacts are created, approved, run, or superseded. The artifacts
contain the source material; this file contains the navigation and current
state.

- **Status:** Complete
- **Owner:** Integralist
- **Created:** 2026-11-19
- **Updated:** 2026-11-19

## Summary

Raise the default classifier deadline from `6000` ms to `15000` ms so slower
Gemini models do not routinely time out during automatic classification.

## Workflow status

Engineering-led change. Spec delta, implementation, and verification are
complete.

## Artifacts

| Artifact             | Purpose                                                | Status   |
| -------------------- | ------------------------------------------------------ | -------- |
| [spec.md](./spec.md) | Default classifier timeout delta for automatic routing | Complete |

## Next action

None — ready to commit.

## References

- [Automatic Model Routing](../../../docs/specs/automatic-routing.md) — current
  automatic-routing contract.
