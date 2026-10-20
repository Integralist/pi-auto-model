# Tune Routing Latency

This README is the index for the project workspace. Keep it current as
artifacts are created, approved, run, or superseded. The artifacts
contain the source material; this file contains the navigation and current
state.

- **Status:** Complete
- **Owner:** Integralist
- **Created:** 2026-10-20
- **Updated:** 2026-10-20

## Summary

Lower the default `moderate` and `complex` efforts from `xhigh` to `high`
(reserving `xhigh` for `frontier`), lower the default classifier deadline from
10,000 ms to 6,000 ms, expand confirmation matching for short go-aheads and
numbered choices, and align the living spec's warm-cache skill scenario with
commit `938feed`.

## Workflow status

Engineering-led change. The spec delta, implementation, and verification are
complete.

## Artifacts

| Artifact             | Purpose                                                               | Status   |
| -------------------- | --------------------------------------------------------------------- | -------- |
| [spec.md](./spec.md) | Effort, classifier deadline, confirmation, and warm-cache spec delta. | Complete |

## Next action

Move this project to `projects/completed/` once committed.

## References

- `docs/specs/automatic-routing.md` — current automatic-routing contract.
