import { z } from "zod";
import {
  connectionSchema,
  exitSchema,
  routeLabelSchema,
  routeModelSchema,
  routeNodeSchema,
} from "./route-model.ts";

export const visionReviewStatusSchema = z.enum(["Suggested", "Needs review"]);

export const visionRouteNodeSchema = routeNodeSchema.extend({
  reviewStatus: visionReviewStatusSchema,
}).strict();

export const visionExitSchema = exitSchema.extend({
  reviewStatus: visionReviewStatusSchema,
}).strict();

export const visionConnectionSchema = connectionSchema.extend({
  reviewStatus: visionReviewStatusSchema,
}).strict();

export const visionRouteLabelSchema = routeLabelSchema.extend({
  reviewStatus: visionReviewStatusSchema,
}).strict();

export const visionCandidateOutputSchema = z.object({
  nodes: z.array(visionRouteNodeSchema).min(1),
  exits: z.array(visionExitSchema).min(1),
  connections: z.array(visionConnectionSchema).min(1),
  labels: z.array(visionRouteLabelSchema).min(1),
}).strict();

export const visionCandidateModelSchema = routeModelSchema.extend({
  scenario: z.literal("SIMULATED SCHOOL"),
  status: z.literal("Unconfirmed"),
  nodes: z.array(visionRouteNodeSchema).min(1),
  exits: z.array(visionExitSchema).min(1),
  connections: z.array(visionConnectionSchema).min(1),
  labels: z.array(visionRouteLabelSchema).min(1),
}).strict();

export const visionApiSuccessSchema = z.object({
  candidateModel: visionCandidateModelSchema,
}).strict();

export type VisionCandidateModel = z.infer<typeof visionCandidateModelSchema>;
