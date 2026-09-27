import { NextResponse } from "next/server";

// Wrap a route handler body in this so requireUser()/ensureMember()/ensureOwner()
// throws turn into proper 401/403 responses instead of a generic 500.
export function handleApiError(err: unknown) {
  if (err instanceof Error) {
    if (err.name === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
    }
    if (err.name === "FORBIDDEN") {
      return NextResponse.json({ error: "You don't have access to this Vaulet" }, { status: 403 });
    }
  }
  console.error(err);
  return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
}
