# Local development and deployment

## Local development

Requirements: Node.js 20+ and npm.

1. Copy the API environment example and edit its values:

   ```sh
   cp server/.env.example server/.env
   ```

   Set a reachable `MONGODB_URI`. Replace `JWT_SECRET` with at least 32 random characters. The API does not start until it connects to MongoDB; it does not silently substitute a local database.

2. Install both workspaces and start Vite plus Express:

   ```sh
   npm install
   npm run dev
   ```

3. Visit `http://localhost:5173`. The API is `http://localhost:5000` and its health endpoint is `/api/health`.

`client/.env.example` contains `VITE_API_URL=http://localhost:5000/api`. Copy it to `client/.env.local` only if you need to override that default. Only values prefixed with `VITE_` are bundled into the browser; never place credentials there.

The application can be explored without AI or Cloudinary credentials: the planner uses its deterministic fallback, and uploads report that Cloudinary must be configured. MongoDB is currently required for accounts and app data.

## Production architecture

```text
Vercel static client → Render Express API → MongoDB Atlas
                               ├──────────→ Cloudinary
                               └──────────→ AI provider (optional)
```

The repo includes `vercel.json` and `render.yaml` as starting deployment configuration. The owner still creates the provider resources and supplies environment values; no service was provisioned or deployed from this sandbox.

### 1. MongoDB Atlas

- Create an Atlas deployment and database user with the least permissions needed for Vaulet data writes and startup index creation. The selected MongoDB deployment must support multi-document transactions; Vaulet uses these for owner membership creation, wallet-ledger writes, and database cascades.
- Configure Atlas network access for the Render service's outbound IP ranges or another restricted network path supported by the selected plan. Avoid leaving broad access enabled as a permanent default.
- Put the connection string in Render as `MONGODB_URI`. URL-encode special characters in the database password.

### 2. Render API

Create a Node web service from the repository root (`render.yaml` describes one):

- Build command: `npm install`
- Start command: `npm start`
- Health check: `/api/health`
- Set `NODE_ENV=production`, `TRUST_PROXY_HOPS=1` for the Render reverse proxy (verify the hop count if your topology changes), `CLIENT_URL` to the exact Vercel origin, `MONGODB_URI`, and a long random `JWT_SECRET`.
- Optional media keys: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- Optional planner keys: `AI_PROVIDER=anthropic`, `AI_API_KEY`, and optionally `AI_MODEL`.

The API binds to `0.0.0.0` and Render's `PORT`. Keep all service credentials in Render's environment manager.

### 3. Vercel client

Import the repository into Vercel using the repo root:

- Build command: `npm run build`
- Output directory: `client/dist`
- Environment variable: `VITE_API_URL=https://<your-render-service>/api`

Set that variable for every Vercel environment you deploy (preview/production as appropriate) and rebuild after changes. The Vite client must call the Render URL; do not hardcode a provider URL into source files.

### 4. Cross-origin session settings

Set Render `CLIENT_URL` to the deployed frontend's exact origin, including `https://` and no trailing slash. For approved preview origins, use a comma-separated exact list. Every state-changing request must contain one of these origins; the guard also rejects writes with no Origin header. Production auth cookies use `Secure; HttpOnly; SameSite=None` because Vercel and Render are separate sites; CORS includes `Access-Control-Allow-Credentials`. Do not use wildcard CORS for credentialed sessions.

After deployment, verify in the browser's network panel that login's `Set-Cookie` is accepted, requests include credentials, and `/api/auth/me` returns the signed-in profile. Browser privacy controls may block third-party cookies; if that occurs, configure a same-site custom domain arrangement and update `CLIENT_URL` and `VITE_API_URL`.

## Migration and rollback

This code rebuild changes both the framework and database provider. The old project schema and the new MongoDB collections are not synchronized. For an eventual production cutover, export the old database, write a deliberate mapping/migration, compare user counts, memberships, and ledger-derived balances, test login hashes, and retain a backup until reconciliation is approved. Do not point the new app at production users until that work is complete.
