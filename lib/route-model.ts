import { z } from "zod";

export const candidateReviewStatuses = [
  "Confirmed",
  "Suggested",
  "Needs review",
  "Rejected",
] as const;

export const candidateReviewStatusSchema = z.enum(candidateReviewStatuses);

export const routeModelStatuses = ["Unconfirmed", "Confirmed"] as const;

export const routeModelStatusSchema = z.enum(routeModelStatuses);

const idSchema = z.string().trim().min(1).max(64);
const labelTextSchema = z.string().trim().min(1).max(80);

export const routeNodeSchema = z.object({
  id: idSchema,
  label: labelTextSchema,
  reviewStatus: candidateReviewStatusSchema,
});

export const exitSchema = z.object({
  id: idSchema,
  label: labelTextSchema,
  reviewStatus: candidateReviewStatusSchema,
});

export const connectionSchema = z.object({
  id: idSchema,
  from: idSchema,
  to: idSchema,
  label: labelTextSchema,
  reviewStatus: candidateReviewStatusSchema,
});

export const routeLabelSchema = z.object({
  id: idSchema,
  text: z.string().trim().min(1).max(160),
  reviewStatus: candidateReviewStatusSchema,
});

export const routeModelSchema = z.object({
  scenario: z.literal("SIMULATED SCHOOL"),
  status: routeModelStatusSchema,
  nodes: z.array(routeNodeSchema).min(1),
  exits: z.array(exitSchema).min(1),
  connections: z.array(connectionSchema).min(1),
  labels: z.array(routeLabelSchema).min(1),
});

export const routeActions = [
  "Continue toward Primary Exit",
  "Backtrack and reassess",
  "Use Alternate Exit via Hallway B",
] as const;

export const routeActionSchema = z.enum(routeActions);

export const reviewerNoteMaxLength = 500;

export const reviewerNoteSchema = z
  .string()
  .trim()
  .max(reviewerNoteMaxLength);

export type CandidateReviewStatus = z.infer<typeof candidateReviewStatusSchema>;
export type RouteNode = z.infer<typeof routeNodeSchema>;
export type RouteExit = z.infer<typeof exitSchema>;
export type Connection = z.infer<typeof connectionSchema>;
export type RouteLabel = z.infer<typeof routeLabelSchema>;
export type RouteModel = z.infer<typeof routeModelSchema>;
export type RouteAction = z.infer<typeof routeActionSchema>;
