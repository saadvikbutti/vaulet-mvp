import { ZodError } from "zod";
import { HttpError } from "../utils/HttpError.js";

export function notFound(req, res, next) {
  next(new HttpError(404, `No route found for ${req.method} ${req.path}.`));
}

export function errorHandler(error, req, res, next) {
  let status = error.status || 500;
  let message = error.message || "Something went wrong.";
  let details = error.details;

  if (error instanceof ZodError) {
    status = 400;
    message = error.issues[0]?.message || "Invalid request.";
    details = error.issues;
  } else if (error.code === 11000) {
    status = 409;
    message = "A record with that value already exists.";
  } else if (error.name === "CastError") {
    status = 400;
    message = "The provided ID is not valid.";
  } else if (error.name === "ValidationError") {
    status = 400;
    message = "Some fields are not valid.";
    details = Object.values(error.errors).map((item) => ({ field: item.path, message: item.message }));
  } else if (error.type === "entity.parse.failed") {
    status = 400;
    message = "The request body is not valid JSON.";
  } else if (error.type === "entity.too.large") {
    status = 413;
    message = "The request body is too large.";
  } else if (error.name === "MulterError") {
    status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    message = error.code === "LIMIT_FILE_SIZE" ? "The image is too large. Maximum size is 8 MB." : "The image upload could not be read.";
  }

  if (status >= 500) {
    console.error(error);
    if (process.env.NODE_ENV === "production" && !(error instanceof HttpError && status === 503)) {
      message = "Something went wrong. Please try again later.";
      details = undefined;
    }
  }
  res.status(status).json({ error: { message, ...(details ? { details } : {}) } });
}
