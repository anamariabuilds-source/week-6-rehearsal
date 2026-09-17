export const allowedImageMimeTypes = ["image/png", "image/jpeg"] as const;
export const maxImageUploadBytes = 4 * 1024 * 1024;

export class ImageUploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageUploadValidationError";
  }
}

export function validateImageUpload(image: { type: string; size: number }) {
  if (!allowedImageMimeTypes.includes(image.type as (typeof allowedImageMimeTypes)[number])) {
    throw new ImageUploadValidationError("Choose a PNG or JPEG image.");
  }

  if (image.size <= 0) {
    throw new ImageUploadValidationError("Choose a non-empty image.");
  }

  if (image.size > maxImageUploadBytes) {
    throw new ImageUploadValidationError("The image must be 4 MB or smaller.");
  }
}
