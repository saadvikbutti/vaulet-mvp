import { z } from "zod";
import Memory from "../models/Memory.js";
import { addMemoryRecord } from "../services/vauletService.js";
import { deleteImage, uploadImage } from "../services/mediaStorageService.js";
import { detectImageMimeType } from "../utils/imageSignatures.js";
import { isValidIsoTimestamp } from "../utils/isoTimestamp.js";
import { HttpError } from "../utils/HttpError.js";

const memoryFields = z.object({
  caption: z.string().trim().max(500).optional().default(""),
  location: z.string().trim().max(200).optional().default(""),
  takenAt: z.string().trim().optional().default("")
    .refine((value) => !value || isValidIsoTimestamp(value), "Photo date must be a real complete ISO timestamp.")
    .refine((value) => !value || (!Number.isNaN(Date.parse(value)) && new Date(value).getTime() <= Date.now()), "Photo date cannot be in the future."),
});

export async function listMemories(req, res) {
  const memories = await Memory.find({ vaulet: req.params.id })
    .sort({ createdAt: -1 })
    .populate("user", "name");
  res.json({ data: { memories } });
}

export async function uploadMemory(req, res) {
  if (!req.file) throw new HttpError(400, "Choose a photo first.");
  const detectedMimeType = detectImageMimeType(req.file.buffer);
  if (!detectedMimeType) {
    throw new HttpError(400, "Only JPEG, PNG, WEBP, or GIF images are allowed.");
  }

  const fields = memoryFields.safeParse(req.body);
  if (!fields.success) throw fields.error;
  const uploaded = await uploadImage(req.file.buffer);
  let memory;
  try {
    memory = await addMemoryRecord(req.params.id, {
      user: req.user.id,
      imageUrl: uploaded.url,
      storagePublicId: uploaded.publicId,
      caption: fields.data.caption,
      location: fields.data.location,
      takenAt: fields.data.takenAt ? new Date(fields.data.takenAt) : null,
    });
  } catch (error) {
    try {
      await deleteImage(uploaded.publicId);
    } catch (cleanupError) {
      console.error("Could not remove an unreferenced Cloudinary upload:", cleanupError);
    }
    throw error;
  }
  await memory.populate("user", "name");
  res.status(201).json({ data: { memory } });
}
