import { z } from "zod";
import { validateImageUpload } from "./image-upload.ts";
import {
  visionCandidateModelSchema,
  visionCandidateOutputSchema,
  type VisionCandidateModel,
} from "./vision-contract.ts";

const geminiModel = "gemini-2.5-flash-lite";
const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;
const providerTimeoutMs = 15_000;

const boundedVisionPrompt = `You are inspecting one fictional SIMULATED SCHOOL map for a browser prototype.
Return only candidate structural elements visible in the image: nodes, exits, connections, and simple labels.
Do not evaluate safety. Do not recommend routes. Do not infer emergency correctness or preparedness.
Do not invent unsupported nodes, exits, connections, or labels. When uncertain, omit the unsupported element or mark the candidate as "Needs review" instead of making a confident claim.
Use "Suggested" only for clearly visible candidates. Never use "Confirmed" or "Rejected".
Use short lowercase kebab-case IDs and reference those IDs in connection from/to fields.`;

export const geminiResponseSchema = {
  type: "OBJECT",
  properties: {
    nodes: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          label: { type: "STRING" },
          reviewStatus: { type: "STRING", enum: ["Suggested", "Needs review"] },
        },
        required: ["id", "label", "reviewStatus"],
      },
    },
    exits: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          label: { type: "STRING" },
          reviewStatus: { type: "STRING", enum: ["Suggested", "Needs review"] },
        },
        required: ["id", "label", "reviewStatus"],
      },
    },
    connections: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          from: { type: "STRING" },
          to: { type: "STRING" },
          label: { type: "STRING" },
          reviewStatus: { type: "STRING", enum: ["Suggested", "Needs review"] },
        },
        required: ["id", "from", "to", "label", "reviewStatus"],
      },
    },
    labels: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          text: { type: "STRING" },
          reviewStatus: { type: "STRING", enum: ["Suggested", "Needs review"] },
        },
        required: ["id", "text", "reviewStatus"],
      },
    },
  },
  required: ["nodes", "exits", "connections", "labels"],
} as const;

const geminiEnvelopeSchema = z.object({
  candidates: z.array(z.object({
    content: z.object({
      parts: z.array(z.object({ text: z.string().optional() }).passthrough()),
    }).passthrough(),
  }).passthrough()).min(1),
}).passthrough();

export class VisionProviderError extends Error {
  constructor(message = "Candidate extraction is unavailable.") {
    super(message);
    this.name = "VisionProviderError";
  }
}

export function parseVisionCandidateText(text: string): VisionCandidateModel {
  let candidateOutput: unknown;

  try {
    candidateOutput = JSON.parse(text);
  } catch {
    throw new VisionProviderError("The provider returned malformed candidate data.");
  }

  const parsedOutput = visionCandidateOutputSchema.safeParse(candidateOutput);

  if (!parsedOutput.success) {
    throw new VisionProviderError("The provider returned incomplete candidate data.");
  }

  return visionCandidateModelSchema.parse({
    scenario: "SIMULATED SCHOOL",
    status: "Unconfirmed",
    ...parsedOutput.data,
  });
}

type FetchImplementation = typeof fetch;

export async function extractVisionCandidateModel({
  bytes,
  mimeType,
  apiKey,
  fetchImplementation = fetch,
}: {
  bytes: Uint8Array;
  mimeType: string;
  apiKey: string | undefined;
  fetchImplementation?: FetchImplementation;
}): Promise<VisionCandidateModel> {
  validateImageUpload({ type: mimeType, size: bytes.byteLength });

  if (!apiKey) {
    throw new VisionProviderError("Candidate extraction is not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), providerTimeoutMs);

  try {
    const response = await fetchImplementation(geminiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inlineData: {
                mimeType,
                data: Buffer.from(bytes).toString("base64"),
              },
            },
            { text: boundedVisionPrompt },
          ],
        }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: geminiResponseSchema,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new VisionProviderError();
    }

    const envelope = geminiEnvelopeSchema.safeParse(await response.json());
    const text = envelope.success
      ? envelope.data.candidates[0]?.content.parts.find((part) => part.text)?.text
      : undefined;

    if (!text) {
      throw new VisionProviderError("The provider returned no candidate data.");
    }

    return parseVisionCandidateText(text);
  } catch (error) {
    if (error instanceof VisionProviderError) throw error;
    throw new VisionProviderError();
  } finally {
    clearTimeout(timeout);
  }
}
