import { NextResponse } from "next/server";
import { extractVisionCandidateModel, VisionProviderError } from "../../../../lib/gemini-vision";
import { ImageUploadValidationError, validateImageUpload } from "../../../../lib/image-upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Submit the simulated-school map as multipart form data." },
      { status: 400 },
    );
  }

  const image = formData.get("image");

  if (!(image instanceof File)) {
    return NextResponse.json(
      { error: "Choose the simulated-school PNG or JPEG image." },
      { status: 400 },
    );
  }

  try {
    validateImageUpload({ type: image.type, size: image.size });

    const candidateModel = await extractVisionCandidateModel({
      bytes: new Uint8Array(await image.arrayBuffer()),
      mimeType: image.type,
      apiKey: process.env.GEMINI_API_KEY,
    });

    return NextResponse.json({ candidateModel });
  } catch (error) {
    if (error instanceof ImageUploadValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof VisionProviderError) {
      return NextResponse.json(
        { error: "Candidate extraction is unavailable. Continue with the editable local candidates or try again." },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { error: "Candidate extraction could not be completed. Continue with the editable local candidates." },
      { status: 502 },
    );
  }
}
