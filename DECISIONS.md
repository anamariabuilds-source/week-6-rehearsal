# Commit 6 decisions

- Store one typed, in-memory session evidence object with scenario version, validity, optional confound reason, and a structured event array.
- Record exactly four events for a completed path: rehearsal started, blockage presented, route action selected, and next state presented.
- Require one of each event in chronological sequence and require the next state to match the selected allowlisted action.
- Return `Indeterminate` for malformed, incomplete, duplicated, out-of-order, mismatched, or technically confounded evidence.
- Detect FAILED-ROUTE PERSISTENCE only when `Continue toward Primary Exit` follows the visible Primary Exit blockage.
- Keep the bounded evaluation in deterministic TypeScript with no Gemini participation, thresholds, scores, or additional patterns.

## Next session’s first move

Render the completed evidence and bounded result for a Human Reviewer, add the validated in-memory note and reset behavior, then run the full pre-Deploy-1 regression audit.
