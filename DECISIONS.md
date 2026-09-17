# Commit 7 decisions

- Show the bounded result as `Indeterminate` when no complete valid session evidence exists.
- Keep the Human Reviewer surface separate from the Brigadista experience and show the scenario version, validity, event trace, and bounded result together.
- Store the human-authored reviewer note only in the shared in-memory session context and validate it against the locked 500-character schema before saving.
- Provide one reset action that clears candidate changes, confirmation, rehearsal state, evidence, result, and reviewer note without creating history.
- Use the existing three-value result contract directly in the review UI without adding scores, ratings, recommendations, or automated conclusions.
- Extend regression coverage through a mocked successful Gemini request and explicit pre-provider oversized-upload rejection.

## Pre-Deploy-1 provider compatibility

Gemini 2.5 Flash-Lite returned 404 NOT_FOUND for generateContent because it is unavailable to new API users. The provider explicitly instructed migration to gemini-3.5-flash-lite. We changed only the model identifier; the vision contract, human-validation gate, and product scope remain unchanged.

Real Gemini extraction returned valid structural data but empty connection labels because the provider response schema did not enforce the same non-empty label constraint as the application Zod contract. We aligned the Gemini structured-output schema and prompt with the existing validation contract rather than weakening application validation.

The standalone `public/assets/simulated-school-map.png` is now the tracked demo/test asset. The accidental `app/review/page 2.tsx` duplicate was removed.

## Mechanical Pass — Deploy 1

Deploy 1 → bug observed: distinct extracted connections were rendered with the same generic “connects” label, preventing the Consultant/Admin from knowing which connection was being reviewed.

Fix: render connection identity from validated from/to endpoints rather than depending on a generic provider label.

Deploy 2 pending.

## Next session’s first move

Prepare Deploy 2; do not begin the Persona Test yet.
