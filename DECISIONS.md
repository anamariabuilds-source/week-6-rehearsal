# Commit 7 decisions

- Show the bounded result as `Indeterminate` when no complete valid session evidence exists.
- Keep the Human Reviewer surface separate from the Brigadista experience and show the scenario version, validity, event trace, and bounded result together.
- Store the human-authored reviewer note only in the shared in-memory session context and validate it against the locked 500-character schema before saving.
- Provide one reset action that clears candidate changes, confirmation, rehearsal state, evidence, result, and reviewer note without creating history.
- Use the existing three-value result contract directly in the review UI without adding scores, ratings, recommendations, or automated conclusions.
- Extend regression coverage through a mocked successful Gemini request and explicit pre-provider oversized-upload rejection.

## Next session’s first move

Prepare Deploy 1 and run the formal Mechanical Pass against the deployed application.
