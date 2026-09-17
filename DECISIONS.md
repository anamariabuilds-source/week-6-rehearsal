# Commit 2 decisions

- Validate the route-model boundary at runtime with Zod and infer its TypeScript types from the same schemas.
- Keep the seed model fictional, in memory, and permanently `Unconfirmed` in this commit.
- Limit local editing to candidate names, the simple boundary label, and the four locked review statuses; every accepted edit is schema-validated.
- Keep allowed connections visible but editable only by review status, avoiding a general-purpose route editor.
- Limit a reviewer note to 500 characters: enough for one concise review paragraph without inviting long-form or personal records.
- Use Node’s built-in test runner for schema tests, avoiding an additional test-framework dependency.

## Next session’s first move

Inspect the validated candidate-state boundary and agree on the smallest server-side vision proposal contract before adding any provider integration.
