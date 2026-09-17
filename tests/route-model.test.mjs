import assert from "node:assert/strict";
import test from "node:test";

import {
  candidateReviewStatusSchema,
  reviewerNoteMaxLength,
  reviewerNoteSchema,
  routeActionSchema,
  routeModelSchema,
} from "../lib/route-model.ts";
import {
  allowedImageMimeTypes,
  maxImageUploadBytes,
  validateImageUpload,
} from "../lib/image-upload.ts";
import {
  extractVisionCandidateModel,
  parseVisionCandidateText,
} from "../lib/gemini-vision.ts";
import {
  confirmRouteModel,
  isRehearsalAvailable,
  isRouteModelConfirmable,
} from "../lib/route-confirmation.ts";
import {
  applyRouteAction,
  expectedNextPhase,
  presentPrimaryExitBlockage,
  startBlockedExitRehearsal,
} from "../lib/rehearsal.ts";
import {
  createSessionEvidence,
  evaluateFailedRoutePersistence,
  markSessionConfounded,
  patternResultSchema,
  recordActionResult,
  recordBlockage,
} from "../lib/event-trace.ts";

const validRouteModel = {
  scenario: "SIMULATED SCHOOL",
  status: "Unconfirmed",
  nodes: [
    { id: "classroom-a", label: "Classroom A", reviewStatus: "Confirmed" },
  ],
  exits: [
    { id: "primary-exit", label: "Primary Exit", reviewStatus: "Suggested" },
  ],
  connections: [
    {
      id: "classroom-a-primary-exit",
      from: "classroom-a",
      to: "primary-exit",
      label: "Classroom A → Primary Exit",
      reviewStatus: "Needs review",
    },
  ],
  labels: [
    {
      id: "simulation-boundary",
      text: "SIMULATED SCHOOL",
      reviewStatus: "Confirmed",
    },
  ],
};

const validVisionOutput = {
  nodes: [
    { id: "classroom-a", label: "Classroom A", reviewStatus: "Suggested" },
  ],
  exits: [
    { id: "primary-exit", label: "Primary Exit", reviewStatus: "Needs review" },
  ],
  connections: [
    {
      id: "classroom-a-primary-exit",
      from: "classroom-a",
      to: "primary-exit",
      label: "Classroom A → Primary Exit",
      reviewStatus: "Needs review",
    },
  ],
  labels: [
    { id: "school-label", text: "SIMULATED SCHOOL", reviewStatus: "Suggested" },
  ],
};

const resolvedRouteModel = {
  ...validRouteModel,
  exits: validRouteModel.exits.map((exit) => ({ ...exit, reviewStatus: "Confirmed" })),
  connections: validRouteModel.connections.map((connection) => ({
    ...connection,
    reviewStatus: "Confirmed",
  })),
};

test("valid route model passes", () => {
  assert.equal(routeModelSchema.safeParse(validRouteModel).success, true);
});

test("malformed or incomplete route model fails", () => {
  const incompleteModel = {
    scenario: "SIMULATED SCHOOL",
    status: "Unconfirmed",
    nodes: validRouteModel.nodes,
  };

  assert.equal(routeModelSchema.safeParse(incompleteModel).success, false);
});

test("invalid candidate review status fails", () => {
  assert.equal(candidateReviewStatusSchema.safeParse("Approved").success, false);
});

test("valid locked route action passes", () => {
  assert.equal(routeActionSchema.safeParse("Backtrack and reassess").success, true);
});

test("action outside the allowlist fails", () => {
  assert.equal(routeActionSchema.safeParse("Find the shortest route").success, false);
});

test("reviewer-note maximum length is enforced", () => {
  assert.equal(reviewerNoteSchema.safeParse("x".repeat(reviewerNoteMaxLength)).success, true);
  assert.equal(reviewerNoteSchema.safeParse("x".repeat(reviewerNoteMaxLength + 1)).success, false);
});

test("valid image MIME types are accepted", () => {
  for (const type of allowedImageMimeTypes) {
    assert.doesNotThrow(() => validateImageUpload({ type, size: 100 }));
  }
});

test("valid simulated-map upload returns a validated Unconfirmed candidate model", async () => {
  let providerRequest;
  const candidateModel = await extractVisionCandidateModel({
    bytes: new Uint8Array([137, 80, 78, 71]),
    mimeType: "image/png",
    apiKey: "test-key",
    fetchImplementation: async (url, init) => {
      providerRequest = { url, init };
      return Response.json({
        candidates: [{ content: { parts: [{ text: JSON.stringify(validVisionOutput) }] } }],
      });
    },
  });

  assert.equal(candidateModel.status, "Unconfirmed");
  assert.match(String(providerRequest.url), /gemini-3\.5-flash-lite/);
  assert.equal(providerRequest.init.headers["x-goog-api-key"], "test-key");
});

test("invalid image type is rejected before a provider call", async () => {
  let providerCalls = 0;

  await assert.rejects(() => extractVisionCandidateModel({
    bytes: new Uint8Array([1]),
    mimeType: "text/plain",
    apiKey: "test-key",
    fetchImplementation: async () => {
      providerCalls += 1;
      return new Response();
    },
  }));
  assert.equal(providerCalls, 0);
});

test("oversized image is rejected", () => {
  assert.throws(() => validateImageUpload({
    type: "image/png",
    size: maxImageUploadBytes + 1,
  }));
});

test("oversized image is rejected before a provider call", async () => {
  let providerCalls = 0;

  await assert.rejects(() => extractVisionCandidateModel({
    bytes: new Uint8Array(maxImageUploadBytes + 1),
    mimeType: "image/jpeg",
    apiKey: "test-key",
    fetchImplementation: async () => {
      providerCalls += 1;
      return new Response();
    },
  }));
  assert.equal(providerCalls, 0);
});

test("schema-valid candidate response is accepted as Unconfirmed", () => {
  const candidateModel = parseVisionCandidateText(JSON.stringify(validVisionOutput));

  assert.equal(candidateModel.status, "Unconfirmed");
  assert.equal(candidateModel.nodes[0].reviewStatus, "Suggested");
});

test("malformed Gemini JSON is rejected", () => {
  assert.throws(() => parseVisionCandidateText("not-json"));
});

test("incomplete or incorrectly typed candidate response is rejected", () => {
  assert.throws(() => parseVisionCandidateText(JSON.stringify({
    ...validVisionOutput,
    connections: "Classroom A to Primary Exit",
  })));
  assert.throws(() => parseVisionCandidateText(JSON.stringify({
    nodes: validVisionOutput.nodes,
  })));
});

test("provider failure leaves no usable candidate model", async () => {
  let candidateModel;

  await assert.rejects(async () => {
    candidateModel = await extractVisionCandidateModel({
      bytes: new Uint8Array([1, 2, 3]),
      mimeType: "image/png",
      apiKey: "test-key",
      fetchImplementation: async () => new Response("provider unavailable", { status: 503 }),
    });
  });
  assert.equal(candidateModel, undefined);
});

test("provider output cannot automatically create a Confirmed route model", () => {
  const attemptedConfirmedOutput = {
    ...validVisionOutput,
    nodes: [
      { id: "classroom-a", label: "Classroom A", reviewStatus: "Confirmed" },
    ],
  };

  assert.throws(() => parseVisionCandidateText(JSON.stringify(attemptedConfirmedOutput)));
  assert.equal(parseVisionCandidateText(JSON.stringify(validVisionOutput)).status, "Unconfirmed");
});

test("Suggested required item blocks confirmation", () => {
  assert.equal(isRouteModelConfirmable(validRouteModel), false);
});

test("Needs review required item blocks confirmation", () => {
  const model = {
    ...resolvedRouteModel,
    nodes: resolvedRouteModel.nodes.map((node) => ({ ...node, reviewStatus: "Needs review" })),
  };

  assert.equal(isRouteModelConfirmable(model), false);
});

test("invalid required item blocks confirmation", () => {
  const model = {
    ...resolvedRouteModel,
    nodes: resolvedRouteModel.nodes.map((node) => ({ ...node, label: "" })),
  };

  assert.equal(isRouteModelConfirmable(model), false);
});

test("resolved required elements enable confirmation", () => {
  assert.equal(isRouteModelConfirmable(resolvedRouteModel), true);
});

test("only explicit confirmation creates a Confirmed model", () => {
  assert.equal(resolvedRouteModel.status, "Unconfirmed");
  assert.equal(confirmRouteModel(resolvedRouteModel).status, "Confirmed");
});

test("Rejected elements do not enter the confirmed route model", () => {
  const model = {
    ...resolvedRouteModel,
    labels: [
      ...resolvedRouteModel.labels,
      { id: "rejected-label", text: "Unsupported label", reviewStatus: "Rejected" },
    ],
  };
  const confirmed = confirmRouteModel(model);

  assert.equal(confirmed.labels.some((label) => label.id === "rejected-label"), false);
});

test("rehearsal availability requires a Confirmed model", () => {
  assert.equal(isRehearsalAvailable(null), false);
  assert.equal(isRehearsalAvailable(resolvedRouteModel), false);
  assert.equal(isRehearsalAvailable(confirmRouteModel(resolvedRouteModel)), true);
});

test("Unconfirmed model cannot start rehearsal", () => {
  assert.equal(startBlockedExitRehearsal(resolvedRouteModel), null);
});

test("Confirmed model starts with the expected route", () => {
  const state = startBlockedExitRehearsal(confirmRouteModel(resolvedRouteModel));

  assert.equal(state?.phase, "route-presented");
  assert.equal(state?.message, "Classroom A → Hallway A → Primary Exit");
});

test("Primary Exit becomes visibly blocked before actions are accepted", () => {
  const started = startBlockedExitRehearsal(confirmRouteModel(resolvedRouteModel));
  assert.ok(started);
  const blocked = presentPrimaryExitBlockage(started);

  assert.equal(blocked?.phase, "primary-exit-blocked");
  assert.match(blocked?.heading ?? "", /Primary Exit is blocked/);
});

test("each allowed action produces its exact deterministic next state", () => {
  const started = startBlockedExitRehearsal(confirmRouteModel(resolvedRouteModel));
  assert.ok(started);
  const blocked = presentPrimaryExitBlockage(started);
  assert.ok(blocked);

  assert.deepEqual(
    applyRouteAction(blocked, "Continue toward Primary Exit"),
    {
      phase: "attempted-blocked-primary",
      selectedAction: "Continue toward Primary Exit",
      heading: "Primary Exit remains blocked",
      message: "You attempted to continue toward the already-blocked Primary Exit.",
    },
  );
  assert.equal(applyRouteAction(blocked, "Backtrack and reassess")?.phase, "reassessing");
  assert.equal(
    applyRouteAction(blocked, "Use Alternate Exit via Hallway B")?.phase,
    "moving-to-alternate-exit",
  );
});

test("invalid action cannot create an arbitrary next state", () => {
  const started = startBlockedExitRehearsal(confirmRouteModel(resolvedRouteModel));
  assert.ok(started);
  const blocked = presentPrimaryExitBlockage(started);
  assert.ok(blocked);

  assert.equal(applyRouteAction(blocked, "Run through another exit"), null);
});

test("deterministic next-state copy contains no judgment language", () => {
  const started = startBlockedExitRehearsal(confirmRouteModel(resolvedRouteModel));
  assert.ok(started);
  const blocked = presentPrimaryExitBlockage(started);
  assert.ok(blocked);
  const copy = [
    "Continue toward Primary Exit",
    "Backtrack and reassess",
    "Use Alternate Exit via Hallway B",
  ].map((action) => JSON.stringify(applyRouteAction(blocked, action))).join(" ");

  assert.doesNotMatch(copy, /correct|incorrect|good|bad|prepared|competent|score/i);
});

function completedEvidence(action) {
  const started = createSessionEvidence("2026-09-17T14:00:00.000Z");
  const blocked = recordBlockage(started, "2026-09-17T14:00:01.000Z");
  return recordActionResult(
    blocked,
    action,
    expectedNextPhase(action),
    "2026-09-17T14:00:02.000Z",
    "2026-09-17T14:00:03.000Z",
  );
}

test("event trace matches the actual selected action and resulting state", () => {
  const evidence = completedEvidence("Backtrack and reassess");

  assert.deepEqual(evidence.events.map((event) => event.type), [
    "rehearsal_started",
    "blockage_presented",
    "route_action_selected",
    "next_state_presented",
  ]);
  assert.equal(evidence.events[2].action, "Backtrack and reassess");
  assert.equal(evidence.events[3].nextState, "reassessing");
});

test("blockage must precede any persistence detection", () => {
  const evidence = completedEvidence("Continue toward Primary Exit");
  const outOfOrder = {
    ...evidence,
    events: [evidence.events[0], evidence.events[2], evidence.events[1], evidence.events[3]],
  };

  assert.equal(evaluateFailedRoutePersistence(outOfOrder), "Indeterminate");
});

test("continuing toward Primary Exit after blockage detects the pattern", () => {
  assert.equal(
    evaluateFailedRoutePersistence(completedEvidence("Continue toward Primary Exit")),
    "Pattern detected",
  );
});

test("valid backtrack path does not detect the pattern", () => {
  assert.equal(
    evaluateFailedRoutePersistence(completedEvidence("Backtrack and reassess")),
    "Pattern not detected",
  );
});

test("valid Alternate Exit path does not detect the pattern", () => {
  assert.equal(
    evaluateFailedRoutePersistence(completedEvidence("Use Alternate Exit via Hallway B")),
    "Pattern not detected",
  );
});

test("incomplete trace is Indeterminate", () => {
  assert.equal(
    evaluateFailedRoutePersistence(createSessionEvidence("2026-09-17T14:00:00.000Z")),
    "Indeterminate",
  );
});

test("invalid or confounded session is Indeterminate", () => {
  const evidence = completedEvidence("Continue toward Primary Exit");
  const confounded = markSessionConfounded(evidence, "Interface did not render consistently.");

  assert.equal(evaluateFailedRoutePersistence(confounded), "Indeterminate");
  assert.equal(evaluateFailedRoutePersistence({ nonsense: true }), "Indeterminate");
});

test("unsupported pattern result strings are rejected", () => {
  assert.equal(patternResultSchema.safeParse("Participant is prepared").success, false);
  assert.equal(patternResultSchema.safeParse("Pattern detected").success, true);
  assert.equal(patternResultSchema.safeParse("Pattern not detected").success, true);
  assert.equal(patternResultSchema.safeParse("Indeterminate").success, true);
});
