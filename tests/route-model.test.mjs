import assert from "node:assert/strict";
import test from "node:test";

import {
  candidateReviewStatusSchema,
  reviewerNoteMaxLength,
  reviewerNoteSchema,
  routeActionSchema,
  routeModelSchema,
} from "../lib/route-model.ts";

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
