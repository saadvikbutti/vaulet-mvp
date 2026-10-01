import Vaulet from "../models/Vaulet.js";
import { deleteImage } from "../services/mediaStorageService.js";
import { createVaulet, deleteVaulet, getVauletDetails, listVauletsForUser } from "../services/vauletService.js";
import { HttpError } from "../utils/HttpError.js";

export async function listVaulets(req, res) {
  res.json({ data: { vaulets: await listVauletsForUser(req.user.id) } });
}

export async function createVauletController(req, res) {
  const vaulet = await createVaulet(req.user.id, req.validated);
  res.status(201).json({ data: { vaulet } });
}

export async function getVauletController(req, res) {
  res.json({ data: { vaulet: await getVauletDetails(req.params.id) } });
}

export async function updateVauletController(req, res) {
  const vaulet = await Vaulet.findOneAndUpdate(
    { _id: req.params.id, deleting: { $ne: true } },
    req.validated,
    { new: true, runValidators: true }
  );
  if (!vaulet) {
    const exists = await Vaulet.exists({ _id: req.params.id });
    if (!exists) throw new HttpError(404, "Vaulet not found.");
    throw new HttpError(409, "This Vaulet is being deleted. Please try again later.");
  }
  res.json({ data: { vaulet } });
}

export async function deleteVauletController(req, res) {
  const deletion = await deleteVaulet(req.params.id);
  const cleanupResults = await Promise.allSettled(deletion.memoryPublicIds.map((publicId) => deleteImage(publicId)));
  for (const result of cleanupResults) {
    if (result.status === "rejected") console.error("A deleted Vaulet left a Cloudinary asset for cleanup:", result.reason);
  }
  res.json({ data: { message: "Vaulet deleted." } });
}
