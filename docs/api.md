# REST API

The Express API is mounted at `/api`. Local origin: `http://localhost:5000/api`. Production origin is supplied to the client as `VITE_API_URL`. JSON success responses use `{ "data": ... }`; errors use `{ "error": { "message": "...", "details": [...] } }`.

The browser sends requests with `credentials: "include"` so the HTTP-only session cookie accompanies API calls. The API accepts browser origins listed in `CLIENT_URL` and requires a present, exact-match `Origin` header on every state-changing request; non-browser API clients must send an allowed origin too.

## Endpoint catalog

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Render health check |
| POST | `/api/auth/signup` | Public, rate-limited | Create a user and sign in |
| POST | `/api/auth/login` | Public, rate-limited | Verify password and sign in |
| POST | `/api/auth/logout` | Public | Revoke all signed-in sessions for the account in the cookie and clear it |
| GET | `/api/auth/me` | Signed in | Return the current user for auth-context restoration |
| GET | `/api/auth/profile` | Signed in | Return profile and membership count |
| GET | `/api/users/me` | Signed in | Return current profile for the Profile screen |
| GET, POST | `/api/vaulets` | Signed in | List memberships / create a Vaulet and owner membership |
| GET, PATCH, DELETE | `/api/vaulets/:id` | Member; edit/delete is owner-only | Read overview / edit fields / remove wallet and its records |
| GET, POST | `/api/vaulets/:id/members` | Member | List members / add an existing account by email |
| GET, POST | `/api/vaulets/:id/transactions` | Member | Read ledger / add contribution or expense |
| GET, POST | `/api/vaulets/:id/memories` | Member | List photos / multipart upload with caption and location |
| POST | `/api/planner` | Signed in | Return a budget-constrained trip plan |

## Common request bodies

Signup: `{ "name": "Rae", "email": "rae@example.com", "password": "at-least-8-chars" }`

Create Vaulet: `{ "name": "Goa, together", "description": "Optional context", "currency": "INR", "budget": 40000 }`. Currency must be one of INR, USD, EUR, GBP, CAD, AUD, NZD, SGD, AED, JPY, CNY, or CHF. Send `budget: null` when there is no target budget.

Add member: `{ "email": "friend@example.com" }`. The account must already exist. Duplicate memberships return 409.

Add contribution or expense:

```json
{
  "type": "expense",
  "amount": 1250.5,
  "description": "Dinner",
  "category": "Food",
  "merchant": "Local restaurant"
}
```

The acting `user` id is taken from the signed-in session. The client must not supply it. Amounts must be between 0.01 and 1,000,000,000 major units and use at most two decimal places. An expense cannot exceed the ledger-derived available balance; concurrent ledger writes serialize through a MongoDB transaction.

Memory upload is `multipart/form-data` with `file` (JPEG, PNG, WEBP, or GIF; maximum 8 MB) and optional `caption`, `location`, and a complete ISO timestamp `takenAt` that is not in the future. The API verifies file signatures, sends the file to Cloudinary, and stores its HTTPS URL/public id. Failed MongoDB persistence triggers best-effort asset cleanup.

Planner: `{ "destination": "Goa", "people": 4, "days": 4, "budget": 40000, "interests": "beaches, food" }`. `people` is 1–50, `days` is 1–30, budget follows the same two-decimal and 1,000,000,000 maximum, and the plan total must stay at or below `budget`. Planning is limited to 20 valid requests per client IP per fixed hour, shared across API workers by an atomic MongoDB counter keyed with a SHA-256 hash. Counter documents expire automatically. Provider calls time out after 20 seconds, and nested response fields, item counts, day coverage, and costs are validated before the result is returned.

## Status codes

- **400** — malformed/invalid values, invalid ObjectId, or expense above current balance
- **401** — absent, expired, or invalid session
- **403** — authenticated user is not a member, user lacks owner role, or Origin is absent/not permitted
- **404** — route, Vaulet, or invited email account not found
- **409** — email or membership conflict
- **429** — signup/login or planner rate limit reached
- **413** — request/image exceeds a configured size limit
- **500** — unexpected API/server error
- **503** — Cloudinary is not configured for uploads

## Request path in code

Follow the `POST /api/vaulets/:id/transactions` flow in `docs/architecture.md`. The complete journey is:

```text
React form state → service → fetch() → Express route
→ authentication / membership / validation middleware
→ controller → business service → Mongoose → MongoDB
→ JSON response → React refresh → updated UI
```
