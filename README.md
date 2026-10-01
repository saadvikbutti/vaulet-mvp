# Vaulet

Vaulet is a shared wallet for trips and experiences. A group creates a Vaulet, adds existing members, records contributions and expenses, and keeps photos and a simple trip plan together. Wallet totals are calculated from the transaction history; they are never edited as a separate balance field.

This rebuild keeps the original MVP's product flows while replacing its Next.js/TypeScript/Prisma implementation with a beginner-readable JavaScript stack:

- **Client:** HTML, CSS, JavaScript, React, Vite, React Router
- **API:** Node.js, Express, REST, Mongoose
- **Database:** MongoDB Atlas
- **Authentication:** bcrypt password hashes, signed JWT in an HTTP-only cookie
- **Media:** Cloudinary adapter (credentials required for actual uploads)
- **Deployment target:** Vercel for the client; Render for the API; Atlas for MongoDB

Read [the architecture guide](docs/architecture.md) first, then [local setup and deployment](docs/deployment.md).

## Run locally

Requirements: Node.js 20 or newer and npm.

1. Copy the server example and configure a reachable MongoDB database:

   ```sh
   cp server/.env.example server/.env
   ```

   Set `MONGODB_URI` to a reachable transaction-capable MongoDB Atlas deployment, and replace `JWT_SECRET` with a long random value. The API starts only when MongoDB is reachable.

2. Install dependencies and start both applications:

   ```sh
   npm install
   npm run dev
   ```

3. Open <http://localhost:5173>. The API listens at <http://localhost:5000>; health check: `/api/health`.

   The client defaults to `http://localhost:5000/api`. To override it, put `VITE_API_URL=http://localhost:5000/api` in `client/.env.local`.

4. Sign up, create a Vaulet, and add another signed-up person's email from the Members tab.

Cloudinary and AI credentials are optional for local development. Without an AI key, the planner returns a deterministic sample plan. Without Cloudinary credentials, image upload returns a configuration error rather than saving permanent files on an ephemeral server disk.

## Useful commands

- `npm run dev` — run Vite and Express together
- `npm run build` — build the client
- `npm run check` — syntax-check the API and build-check the Vite client
- `npm start` — start the API server

See `docs/` for the request flow, MongoDB model relationships, API contract, authentication, and Vercel/Render deployment setup.
