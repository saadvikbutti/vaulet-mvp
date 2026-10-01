import { HttpError } from "../utils/HttpError.js";

export function validate(schema, source = "body") {
  return function validateRequest(req, res, next) {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return next(new HttpError(400, details[0]?.message || "Invalid request.", details));
    }
    req.validated = result.data;
    next();
  };
}
