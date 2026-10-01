# Architecture

## What changed from the MVP

The repository originally combined browser pages and HTTP handlers inside **Next.js App Router**, used **TypeScript**, **Tailwind CSS**, and **Prisma/Postgres**, and stored uploaded photos on the application filesystem. The useful product model was already clear: a shared trip wallet called a Vaulet, member roles, a contribution/expense ledger, grouped memories, and a budget-aware trip planner.

This rebuild preserves those product concepts and the original page vocabulary, but makes the browser/server boundary visible:

```text
Browser
  React + React Router (Vite client)
       │ HTTPS REST + credentialed fetch()
       ▼
  Node.js + Express API (Render)
       ├── auth middleware → controllers → services → Mongoose models
       ├── MongoDB Atlas
       ├── Cloudinary media adapter
       └── backend-only AI planner adapter
```

Vercel, Render, Atlas, and Cloudinary are configuration/deployment choices, not dependencies in the product's business rules. The API URL, database URL, cookies, media credentials, and AI key are supplied with environment variables.

## Request flow to follow in the code

A transaction form is a compact example of the full flow:

1. `client/src/pages/WalletPage.jsx` renders a `TransactionForm` and passes its Vaulet id as a prop.
2. `client/src/components/TransactionForm.jsx` owns the amount and form state with `useState`, handles the submit event, disables itself during the request, and displays an error if one occurs.
3. `client/src/services/vauletService.js` calls the common `request()` function in `client/src/services/api.js`. That function adds the API base URL, `credentials: "include"`, JSON headers, and consistent error parsing.
4. `server/src/routes/vauletRoutes.js` matches `POST /api/vaulets/:id/transactions`, authenticates the cookie, checks membership, and validates the request body.
5. `server/src/controllers/transactionsController.js` translates the HTTP request into a service call and chooses the HTTP response status.
6. `server/src/services/vauletService.js` verifies the expense does not exceed the computed available balance, takes the user id from `req.user`, and creates the transaction.
7. `server/src/models/Transaction.js` describes the MongoDB document and indexes.
8. Express returns `{ "data": { "transaction": ... } }`. The client service unwraps `data`; the form asks the Vaulet layout to reload its data; React renders the new balance and ledger.

Authentication is similar, except the controller sets an HTTP-only cookie. The browser does not read or store the JWT in React state or `localStorage`.

## Folder map

```text
client/
  index.html                 Vite's HTML document
  src/
    components/              Reusable UI and forms
    context/                 Cross-page authentication state
    hooks/                   Small React hooks for loading data
    layouts/                 Shared navigation, auth frame, Vaulet tabs, route guards
    pages/                   Route-level product screens
    services/                HTTP request functions grouped by product area
    styles/                  Plain CSS design system and page styles
    utils/                   Display and ID helpers
  vite.config.js             Local Vite development server

server/
  .env.example               API-only environment variable names
  src/
    config/                  MongoDB and Cloudinary configuration
    controllers/             HTTP request/response handling
    middleware/              Authentication, Vaulet authorization, validation, errors
    models/                  Mongoose schemas and collection indexes
    routes/                  REST endpoint definitions
    services/                Authentication, wallet rules, media, and planner logic
    utils/                   Reusable errors, cookie settings, async handler
    app.js                   Express app composition; importable without listening
    server.js                Environment loading, database connection, process lifecycle

docs/                        Architecture, data model, API, auth, deployment guides
```

Each folder has one purpose. Pages/components do not query MongoDB. Routes do not contain wallet calculations. A service owns a product rule when a rule is reused or is important to explain.

## Product pages retained

The React Router paths keep the old MVP's shape: `/dashboard`, `/vaulets`, `/vaulets/new`, `/vaulets/:id`, and nested `wallet`, `transactions`, `memories`, and `members` tabs, plus `/planner`, `/profile`, `/login`, and `/signup`. The cross-Vaulet balance display groups values by currency; the app does not invent exchange rates.

## Design decisions and tradeoffs

- **Separate client and API:** this makes the REST boundary and independent Vercel/Render deployments concrete. It requires CORS and correct cross-origin cookies, which are documented rather than hidden by one framework origin.
- **Plain JavaScript:** there are no TypeScript annotations, Next.js APIs, Prisma, Redux, or Tailwind. React state, props, hooks, services, and route guards are ordinary source files.
- **Mongoose references:** a separate membership collection gives roles, unique membership, and user/Vaulet lookup a visible place. It also means related records are populated or queried explicitly instead of appearing as ORM-managed nested relations.
- **Derived balance:** contributions and expenses are the ledger. Balance and category totals are recomputed from that source of truth. Values are rounded to two decimal places in service calculations; no separate editable balance field exists. A hidden Vaulet `ledgerVersion` update serializes transactional writes so concurrent expenses cannot both approve against the same old balance. The same write marker protects memory/member saves, while a hidden deletion flag prevents uploads from racing the database cascade.
- **No automatic currency conversion:** each Vaulet has one currency. Summaries keep unlike currencies separate because there is no rate source in the product.
- **Cloudinary adapter:** the API is the only caller of Cloudinary. It checks image file signatures, validates metadata before upload, and attempts to remove an uploaded asset if database persistence fails. When credentials are not present, upload returns a clear 503 response; there is no permanent local-disk fallback.
- **Planner adapter:** the API can call the configured AI adapter (Anthropic by default) only when `AI_API_KEY` is configured server-side. Provider requests time out, use an atomic MongoDB-backed quota shared across API workers, and must pass nested/semantic response validation and the hard budget ceiling; otherwise the API returns a deterministic sample plan. The browser never receives that key.
- **Session invalidation:** a hidden `sessionVersion` on each user is embedded in signed JWTs and incremented on logout. This invalidates copied tokens immediately without an external cache, while deliberately signing out all sessions for that account.
- **No email delivery or invitation links:** members are added by email only if they already have an account, preserving the existing MVP boundary.
- **No production data import:** this rebuild changes from the existing Postgres/Prisma data layout to MongoDB collections. The code does not copy user records or passwords between databases; plan and run any migration separately with an explicit data-mapping and test plan.

## Local runtime

`npm run dev` starts two processes: Vite on `localhost:5173` and Express on `localhost:5000`. The API connects to MongoDB before listening. Configure `client/.env.local` only if the default `VITE_API_URL` needs to change; put secrets in `server/.env`, never in the Vite client environment.
