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
