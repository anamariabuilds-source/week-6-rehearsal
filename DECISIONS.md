# Commit 4 decisions

- Keep candidate and confirmed route models in one in-memory React provider shared by the setup and rehearsal routes.
- Treat `Confirmed` and `Rejected` as resolved review states, while excluding every rejected element from the confirmed model.
- Require at least one valid confirmed node, exit, connection, and label after rejected elements are removed.
- Require every retained connection endpoint to reference a retained node or exit before confirmation is enabled.
- Invalidate any prior confirmation whenever candidate data is edited or replaced by a vision proposal.
- Permit the `Unconfirmed` to `Confirmed` transition only through the Consultant/Admin confirmation control.

## Next session’s first move

Implement the three-action blocked-exit rehearsal as deterministic TypeScript state transitions driven only by a confirmed route model.
