"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  evaluateFailedRoutePersistence,
  scenarioVersion,
  type TraceEvent,
} from "../../lib/event-trace";
import { reviewerNoteMaxLength } from "../../lib/route-model";
import { useRehearsalSession } from "../rehearsal-session-context";

const eventLabels: Record<TraceEvent["type"], string> = {
  rehearsal_started: "Rehearsal started",
  blockage_presented: "Blockage presented: Primary Exit",
  route_action_selected: "Route action selected",
  next_state_presented: "Resulting next state presented",
};

function eventDetail(event: TraceEvent) {
  if (event.type === "route_action_selected") return event.action;
  if (event.type === "next_state_presented") return event.nextState;
  if (event.type === "blockage_presented") return event.blockedExit;
  return "Controlled session initialized";
}

export default function ReviewPage() {
  const router = useRouter();
  const {
    sessionEvidence,
    patternResult,
    reviewerNote,
    saveReviewerNote,
    resetSession,
  } = useRehearsalSession();
  const [draftNote, setDraftNote] = useState(reviewerNote);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const displayedResult = patternResult
    ?? (sessionEvidence ? evaluateFailedRoutePersistence(sessionEvidence) : "Indeterminate");

  function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const accepted = saveReviewerNote(draftNote);
    setNoteError(accepted ? null : `Reviewer note must be ${reviewerNoteMaxLength} characters or fewer.`);
    setSaved(accepted);
  }

  function resetAndReturn() {
    resetSession();
    router.push("/setup");
  }

  return (
    <div className="stack">
      <header className="surfaceHeading">
        <div>
          <p className="eyebrow">Human Reviewer surface</p>
          <h1>Trace &amp; Human Review</h1>
          <p className="lede">Inspect bounded evidence from one controlled simulated session.</p>
        </div>
        <span className={`status ${sessionEvidence ? "statusWarning" : "statusNeutral"}`}>
          Human review: {sessionEvidence ? "Required" : "Awaiting session"}
        </span>
      </header>

      <div className="reviewMeta">
        <span><strong>Scenario/version</strong> {sessionEvidence?.scenarioVersion ?? scenarioVersion}</span>
        <span><strong>Session validity</strong> {sessionEvidence?.validity ?? "Incomplete"}</span>
      </div>

      <section className="panel" aria-labelledby="trace-title">
        <div className="panelHeader">
          <div>
            <p className="panelKicker">STRUCTURED EVIDENCE</p>
            <h2 id="trace-title">Event trace</h2>
          </div>
          <span className="placeholderTag">In memory only</span>
        </div>
        {sessionEvidence?.events.length ? (
          <div className="traceTableWrap">
            <table className="traceTable">
              <thead><tr><th>#</th><th>Timestamp</th><th>Event</th><th>Detail</th></tr></thead>
              <tbody>
                {sessionEvidence.events.map((event, index) => (
                  <tr key={`${event.type}-${event.timestamp}-${index}`}>
                    <td>{index + 1}</td>
                    <td><time dateTime={event.timestamp}>{event.timestamp}</time></td>
                    <td>{eventLabels[event.type]}</td>
                    <td>{eventDetail(event)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="emptyState compactEmptyState">
            <strong>No completed session evidence</strong>
            <p>The bounded result remains Indeterminate until a valid rehearsal path is completed.</p>
          </div>
        )}
      </section>

      <section className="panel evaluationPanel" aria-labelledby="evaluation-title">
        <div>
          <p className="panelKicker">BOUNDED EVALUATION</p>
          <h2 id="evaluation-title">FAILED-ROUTE PERSISTENCE</h2>
          <p>Result applies only to this controlled simulated session.</p>
        </div>
        <strong className={`resultBadge result-${displayedResult.toLowerCase().replaceAll(" ", "-")}`}>
          {displayedResult}
        </strong>
      </section>

      <section className="panel" aria-labelledby="human-review-title">
        <div className="panelHeader">
          <div>
            <p className="panelKicker">HUMAN REVIEWER</p>
            <h2 id="human-review-title">Human-authored note</h2>
          </div>
          <span className="placeholderTag">{saved ? "Saved in memory" : "Needs review"}</span>
        </div>
        <form className="reviewForm" onSubmit={submitNote}>
          <label htmlFor="reviewer-note">Reviewer note</label>
          <textarea
            aria-describedby="note-help note-error"
            id="reviewer-note"
            onChange={(event) => {
              setDraftNote(event.target.value);
              setSaved(false);
            }}
            rows={5}
            value={draftNote}
          />
          <div className="noteMeta">
            <span id="note-help">Human-authored, in memory only · maximum {reviewerNoteMaxLength} characters</span>
            <span>{draftNote.length}/{reviewerNoteMaxLength}</span>
          </div>
          {noteError ? <p className="formError" id="note-error" role="alert">{noteError}</p> : null}
          <button type="submit">Save review note</button>
        </form>
      </section>

      <aside className="notice noticeWarning">
        <strong>Human review required.</strong>
        <span>This result does not establish preparedness, competence, safety, or physical transfer.</span>
      </aside>

      <div className="actionBar">
        <p>Reset removes this in-memory session, result, and reviewer note.</p>
        <button className="secondaryButton" onClick={resetAndReturn} type="button">Reset session</button>
      </div>
    </div>
  );
}
