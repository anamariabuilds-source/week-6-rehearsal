# Commit 5 decisions

- Model the rehearsal as deterministic TypeScript phases: idle, route presented, Primary Exit blocked, and one fixed phase for each allowed action.
- Require a confirmed route model before the start transition can occur.
- Separate route presentation from blockage presentation so the controlled sequence is visible before participant actions appear.
- Accept only the three locked route-action strings and return no next state for any other value.
- Show the selected action beside its resulting state to make action-to-state causality explicit.
- Keep all next-state language descriptive and omit correctness, readiness, competence, and scoring judgments.

## Next session’s first move

Add the minimum typed in-memory events needed to evaluate only FAILED-ROUTE PERSISTENCE, including validity/confound handling.
