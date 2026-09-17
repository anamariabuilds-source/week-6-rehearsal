# Commit 3 decisions

- Call `gemini-2.5-flash-lite` through native server-side `fetch`, avoiding a Gemini SDK dependency.
- Accept only PNG and JPEG uploads up to 4 MB; this covers the approved simulated map while keeping the one-image request bounded.
- Abort the provider request after 15 seconds and return a calm, generic error without provider details.
- Limit Gemini output to nodes, exits, connections, and labels whose review status is `Suggested` or `Needs review`.
- Add `SIMULATED SCHOOL` and `Unconfirmed` on the server after validating Gemini output, so the provider cannot set overall model status.
- Preserve the existing editable local candidate state whenever upload, provider, JSON, or schema validation fails.
- Reject unknown fields in vision candidate elements instead of silently accepting or forwarding them.

## Next session’s first move

Inspect the candidate review statuses and define the exact human-confirmation gate before implementing any confirmation transition or rehearsal unlock.
