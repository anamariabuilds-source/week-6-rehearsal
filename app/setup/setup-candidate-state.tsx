"use client";

import { useState, type FormEvent } from "react";
import {
  candidateReviewStatuses,
  candidateReviewStatusSchema,
  routeLabelSchema,
  routeModelSchema,
  routeNodeSchema,
  exitSchema,
  type CandidateReviewStatus,
  type RouteModel,
} from "../../lib/route-model";
import { simulatedRouteModel } from "../../lib/simulated-route-model";
import { visionApiSuccessSchema } from "../../lib/vision-contract";

type CandidateKind = "nodes" | "exits";

function ReviewStatusSelect({
  value,
  onChange,
  label,
}: {
  value: CandidateReviewStatus;
  onChange: (value: CandidateReviewStatus) => void;
  label: string;
}) {
  return (
    <label className="statusField">
      <span className="visuallyHidden">Review status for {label}</span>
      <select
        className={`candidateStatus status-${value.toLowerCase().replace(" ", "-")}`}
        onChange={(event) => onChange(candidateReviewStatusSchema.parse(event.target.value))}
        value={value}
      >
        {candidateReviewStatuses.map((status) => (
          <option key={status} value={status}>{status}</option>
        ))}
      </select>
    </label>
  );
}

export function SetupCandidateState() {
  const [model, setModel] = useState<RouteModel>(() => routeModelSchema.parse(simulatedRouteModel));
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  async function extractCandidates(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsExtracting(true);
    setUploadError(null);
    setUploadMessage(null);

    try {
      const response = await fetch("/api/vision/extract", {
        method: "POST",
        body: formData,
      });
      const body: unknown = await response.json();

      if (!response.ok) {
        const message = typeof body === "object" && body !== null && "error" in body
          && typeof body.error === "string"
          ? body.error
          : "Candidate extraction is unavailable. Continue with the editable local candidates.";
        throw new Error(message);
      }

      const parsedResponse = visionApiSuccessSchema.safeParse(body);

      if (!parsedResponse.success) {
        throw new Error("The candidate response could not be validated. Existing local candidates were kept.");
      }

      setModel(parsedResponse.data.candidateModel);
      setUploadMessage("Validated candidate structure loaded for human review. The route model remains Unconfirmed.");
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "Candidate extraction is unavailable. Continue with the editable local candidates.",
      );
    } finally {
      setIsExtracting(false);
    }
  }

  function updateCandidateLabel(kind: CandidateKind, id: string, label: string) {
    const current = model[kind].find((candidate) => candidate.id === id);
    const schema = kind === "nodes" ? routeNodeSchema : exitSchema;
    const result = current ? schema.safeParse({ ...current, label }) : null;

    if (!result?.success) return;

    setModel((currentModel) => ({
      ...currentModel,
      [kind]: currentModel[kind].map((candidate) =>
        candidate.id === id ? result.data : candidate,
      ),
    }));
  }

  function updateCandidateStatus(kind: CandidateKind, id: string, reviewStatus: CandidateReviewStatus) {
    setModel((currentModel) => routeModelSchema.parse({
      ...currentModel,
      [kind]: currentModel[kind].map((candidate) =>
        candidate.id === id ? { ...candidate, reviewStatus } : candidate,
      ),
    }));
  }

  function updateConnectionStatus(id: string, reviewStatus: CandidateReviewStatus) {
    setModel((currentModel) => routeModelSchema.parse({
      ...currentModel,
      connections: currentModel.connections.map((connection) =>
        connection.id === id ? { ...connection, reviewStatus } : connection,
      ),
    }));
  }

  function updateRouteLabel(text: string) {
    const current = model.labels[0];
    const result = routeLabelSchema.safeParse({ ...current, text });

    if (!result.success) return;

    setModel((currentModel) => routeModelSchema.parse({
      ...currentModel,
      labels: [result.data],
    }));
  }

  return (
    <>
      <header className="surfaceHeading">
        <div>
          <p className="eyebrow">Consultant/Admin surface</p>
          <h1>Route Setup &amp; Human Confirmation</h1>
          <p className="lede">Review editable candidate data for one fictional school route.</p>
        </div>
        <span className="status statusWarning">Route model: {model.status}</span>
      </header>

      <aside className="notice noticeWarning">
        <strong>Candidate data only.</strong>
        <span>Editing a candidate does not confirm it or establish that a route is safe.</span>
      </aside>

      <div className="setupGrid">
        <section className="panel routeSummary" aria-labelledby="environment-title">
          <div className="panelHeader">
            <div>
              <p className="panelKicker">{model.scenario}</p>
              <h2 id="environment-title">Candidate structure</h2>
            </div>
            <span className="placeholderTag">Vision-assisted</span>
          </div>
          <form className="visionUpload" onSubmit={extractCandidates}>
            <label htmlFor="simulated-map">
              <strong>Simulated-school map</strong>
              <span>PNG or JPEG · maximum 4 MB</span>
            </label>
            <input
              accept="image/png,image/jpeg"
              disabled={isExtracting}
              id="simulated-map"
              name="image"
              required
              type="file"
            />
            <button disabled={isExtracting} type="submit">
              {isExtracting ? "Extracting candidates…" : "Propose candidate structure"}
            </button>
            {uploadError ? <p className="uploadFeedback uploadError" role="alert">{uploadError}</p> : null}
            {uploadMessage ? <p className="uploadFeedback uploadSuccess" role="status">{uploadMessage}</p> : null}
          </form>
          <dl className="candidateSummary" aria-label="Current candidate counts">
            <div><dt>Nodes</dt><dd>{model.nodes.length}</dd></div>
            <div><dt>Exits</dt><dd>{model.exits.length}</dd></div>
            <div><dt>Connections</dt><dd>{model.connections.length}</dd></div>
            <div><dt>Labels</dt><dd>{model.labels.length}</dd></div>
          </dl>
          <p className="routeBoundary">Fictional candidate structure only. No route-safety, compliance, or emergency recommendation is provided.</p>
        </section>

        <section className="panel" aria-labelledby="elements-title">
          <div className="panelHeader">
            <div>
              <p className="panelKicker">LOCAL EDITS</p>
              <h2 id="elements-title">Candidate route elements</h2>
            </div>
          </div>
          <div className="candidateGroups">
            <CandidateGroup title="Route nodes">
              {model.nodes.map((node) => (
                <CandidateRow key={node.id}>
                  <label className="candidateLabel">
                    <span className="visuallyHidden">Label for {node.label}</span>
                    <input
                      maxLength={80}
                      onChange={(event) => updateCandidateLabel("nodes", node.id, event.target.value)}
                      required
                      value={node.label}
                    />
                  </label>
                  <ReviewStatusSelect
                    label={node.label}
                    onChange={(status) => updateCandidateStatus("nodes", node.id, status)}
                    value={node.reviewStatus}
                  />
                </CandidateRow>
              ))}
            </CandidateGroup>

            <CandidateGroup title="Exits">
              {model.exits.map((exit) => (
                <CandidateRow key={exit.id}>
                  <label className="candidateLabel">
                    <span className="visuallyHidden">Label for {exit.label}</span>
                    <input
                      maxLength={80}
                      onChange={(event) => updateCandidateLabel("exits", exit.id, event.target.value)}
                      required
                      value={exit.label}
                    />
                  </label>
                  <ReviewStatusSelect
                    label={exit.label}
                    onChange={(status) => updateCandidateStatus("exits", exit.id, status)}
                    value={exit.reviewStatus}
                  />
                </CandidateRow>
              ))}
            </CandidateGroup>

            <CandidateGroup title="Allowed connections">
              {model.connections.map((connection) => (
                <CandidateRow key={connection.id}>
                  <span className="connectionLabel">{connection.label}</span>
                  <ReviewStatusSelect
                    label={connection.label}
                    onChange={(status) => updateConnectionStatus(connection.id, status)}
                    value={connection.reviewStatus}
                  />
                </CandidateRow>
              ))}
            </CandidateGroup>

            <CandidateGroup title="Simple label">
              <CandidateRow>
                <label className="candidateLabel candidateLabelWide">
                  <span className="visuallyHidden">Simulation boundary label</span>
                  <input
                    maxLength={160}
                    onChange={(event) => updateRouteLabel(event.target.value)}
                    required
                    value={model.labels[0].text}
                  />
                </label>
                <ReviewStatusSelect
                  label="Simulation boundary label"
                  onChange={(reviewStatus) => {
                    setModel((currentModel) => routeModelSchema.parse({
                      ...currentModel,
                      labels: [{ ...currentModel.labels[0], reviewStatus }],
                    }));
                  }}
                  value={model.labels[0].reviewStatus}
                />
              </CandidateRow>
            </CandidateGroup>
          </div>
        </section>
      </div>

      <div className="actionBar">
        <p>Candidate edits remain local. Confirmation is not implemented in this commit.</p>
        <button disabled type="button">Confirm route model</button>
      </div>
    </>
  );
}

function CandidateGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="candidateGroup">
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  );
}

function CandidateRow({ children }: { children: React.ReactNode }) {
  return <div className="candidateRow">{children}</div>;
}
