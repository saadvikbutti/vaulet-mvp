# Authentication

Vaulet uses a small explicit authentication flow: bcrypt for passwords, a signed JWT for the session, and an HTTP-only cookie for browser transport. React never reads the token and does not store it in `localStorage`.

## Signup and login

1. The React form sends email/password (and name for signup) to `/api/auth/signup` or `/api/auth/login`.
2. Express validates the input with Zod and rate-limits signup/login attempts.
3. Signup normalizes the email and hashes the password with bcrypt (12 rounds) before inserting the User. Login loads the password hash and compares the submitted password with `bcrypt.compare`.
4. Login issues a signed JWT whose payload contains the user id and whose expiry is seven days.
5. The controller sets that JWT as the `vaulet_session` cookie by default. It is `httpOnly`, uses `path=/`, and has the same seven-day lifetime.
6. The API response returns only the public user fields, never the password hash or JWT.

## Cookie and browser behavior

- **Local HTTP:** `secure: false`, `SameSite=Lax`, which works for the two localhost ports.
- **Production HTTPS:** `secure: true`, `SameSite=None`, required because the Vercel client and Render API are separate sites. Configure exact `CLIENT_URL` and send API requests with `credentials: "include"`.
- `SameSite=None` requires HTTPS. Some browsers or privacy settings may block third-party cookies even with these attributes; using a same-site custom API domain is a future way to avoid relying on third-party-cookie exceptions.
- CORS only allows configured frontend origins. A separate origin guard requires a present `Origin` header on every state-changing request and accepts only an exact value listed in `CLIENT_URL`. `CLIENT_URL` may be a comma-separated list for approved frontends. Non-browser API clients must send an approved `Origin` value too.

## Protected request

1. `requireAuth` reads the named cookie and verifies the JWT with the server-only `JWT_SECRET`.
2. It reloads the User so deleted accounts cannot continue using an old token and compares the JWT `sessionVersion` with the current account value.
3. It attaches the public Mongoose user document to `req.user`.
4. A Vaulet-specific route then runs `requireVauletMember`; update/delete also check the stored membership role is `owner`.
5. Controllers derive the actor from `req.user.id`, not any user id provided in request JSON.

The client `AuthProvider` calls `/api/auth/me` after the page loads and keeps the public user object in React context. Protected routes show a loading state while that lookup is in flight. The token remains only in the cookie jar.

## Logout

`POST /api/auth/logout` increments the user's hidden `sessionVersion` and clears the cookie using the same `secure`, `sameSite`, and `path` attributes that were used when it was set. Protected requests compare the JWT's version with the current account version, so copied tokens are rejected immediately after a successful logout. This simple design signs out **all active sessions for that account** rather than maintaining a separate revocation record for each browser. If the database cannot save the new version, the browser cookie is still cleared and the API returns an error.

## Secrets

`JWT_SECRET` and AI/Cloudinary keys live in `server/.env` locally or in Render's server environment. They must not be placed in `client/.env`, committed, returned in API responses, or prefixed with `VITE_`. `VITE_API_URL` is a public API address, not a secret.
