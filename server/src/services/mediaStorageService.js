import { configureCloudinary, isCloudinaryConfigured } from "../config/cloudinary.js";
import { HttpError } from "../utils/HttpError.js";

export async function uploadImage(buffer, { folder = "vaulet/memories" } = {}) {
  if (!isCloudinaryConfigured()) {
    throw new HttpError(503, "Photo storage is not configured yet. Set the Cloudinary environment variables on the API server.");
  }

  const cloudinary = configureCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image", allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"] },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

export async function deleteImage(publicId) {
  if (!publicId || !isCloudinaryConfigured()) return;
  const cloudinary = configureCloudinary();
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}
