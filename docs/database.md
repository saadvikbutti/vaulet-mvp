# Database model

Vaulet uses MongoDB through Mongoose. The API connects to MongoDB Atlas with `MONGODB_URI`; collection rules are defined in `server/src/models/`. References are explicit ObjectIds so the relationship is easy to trace. Controllers/services populate only the user fields they need.

## Collections

| Collection | What it represents | Important fields and links |
|---|---|---|
| `users` | A person who signs in | `name`, normalized unique `email`, bcrypt `passwordHash`, hidden `sessionVersion`, optional `avatar`, timestamps |
| `vaulets` | One group's shared wallet and trip context | `name`, `description`, `currency`, optional `budget`, hidden `ledgerVersion`/deletion marker, `createdBy` → User, timestamps |
| `vauletmembers` | Membership and role in one Vaulet | `vaulet` → Vaulet, `user` → User, `role` (`owner` or `member`), `joinedAt` |
| `transactions` | Append-only contribution or expense ledger item | `vaulet` → Vaulet, `user` → User, `type`, positive `amount`, category/details/receipt URL, timestamps |
| `memories` | Photo and notes contributed to a Vaulet | `vaulet` → Vaulet, `user` → User, Cloudinary secure URL and public id, caption/location/taken date, timestamps |
| `planner_rate_limits` | Short-lived, shared planner quota counters | Hashed client IP/window identifier, atomic request count, TTL expiry; no raw IP or prompt data |

## Relationships

- A **User** can own multiple Vaulets and can participate in many Vaulets through **VauletMember**.
- A **Vaulet** has one creator, many membership rows, transactions, and memories.
- A **Transaction** belongs to exactly one Vaulet and records which authenticated user entered it.
- A **Memory** belongs to exactly one Vaulet and records both its contributor and provider-neutral storage reference.
- Membership does not embed an array of members on a Vaulet. It is its own collection so the unique `(vaulet, user)` index and role are explicit.

```text
User 1 ─── * VauletMember * ─── 1 Vaulet
User 1 ─── * Transaction   * ─── 1 Vaulet
User 1 ─── * Memory        * ─── 1 Vaulet
User 1 ─── * Vaulet (createdBy)
```

## Indexes and integrity

- `users.email` is unique and stored lowercase, so case differences do not create duplicate accounts.
- `vauletmembers` has a unique compound index on `{ vaulet, user }`; a person cannot join the same wallet twice.
- Membership lookup by `{ user, joinedAt }` supports listing the current user's Vaulets.
- `transactions` and `memories` index `{ vaulet, createdAt }` for each wallet's newest-first ledger and gallery.
- `planner_rate_limits` indexes `expiresAt` with MongoDB TTL so temporary, hashed-IP counters expire; startup creates the index before listening.
- Mongoose validates role/type/category choices, bounded transaction amounts, the supported ISO currency set, required references, and text length limits.
- Every Vaulet-scoped route checks a membership record before reading or writing. An owner-only middleware protects editing/deleting the Vaulet.
- The current membership endpoint intentionally permits any existing member to add another existing account, matching the MVP's current behavior. It does not send invitation email.

## Wallet totals are derived

There is no `balance` field on a Vaulet. For each ledger row, the service converts the amount into integer cents/paise for arithmetic and then returns a rounded major-unit number:

```text
contributed = sum(amount where type = "contribution")
spent       = sum(amount where type = "expense")
balance     = contributed - spent
```

Category totals are sums over expense rows. The no-overdraft rule checks an expense against the currently derived balance inside a MongoDB transaction. Each ledger write also increments a hidden `ledgerVersion` on the parent Vaulet in that same transaction. The field is not a balance; it is a shared write-conflict point so concurrent expense transactions serialize and the retried operation recomputes its balance after the prior commit. If an expense is then too large, it is rejected. This requires a MongoDB deployment that supports multi-document transactions (configure the Atlas cluster accordingly).

The same parent write-conflict point protects memory and member creation. Vaulet deletion first sets a hidden deletion marker; new transaction, member, memory, and edit operations then fail. Existing uploads that finish after deletion begins cannot persist a Memory row and clean up their Cloudinary object. Only after the marker is set does deletion snapshot media ids and transactionally remove members, transactions, memories, and the Vaulet. Cloudinary deletion happens after that database commit.

Each Vaulet has one currency from the supported ISO code allowlist. Individual amounts/budgets are bounded to 1,000,000,000 major units and up to two decimal places. Cross-Vaulet dashboard balances are shown grouped by currency rather than incorrectly adding INR, USD, EUR, or GBP as if they were comparable.

## Media references

Image bytes are uploaded through Express to Cloudinary after the API checks their file signatures rather than trusting the browser MIME header. Calendar dates are checked component-by-component so a timestamp such as February 31 cannot normalize silently. MongoDB stores `imageUrl` and `storagePublicId` on a Memory record—not the binary data. If database persistence fails after an upload, the API attempts to remove the unreferenced Cloudinary asset; cleanup failures are logged for operator follow-up. Cloudinary calls are isolated in `server/src/services/mediaStorageService.js`, so replacing the provider changes the adapter rather than page components or wallet logic.

## Migration note

The previous MVP used Prisma with PostgreSQL. This code establishes the MongoDB model, but does not import existing data. Before moving real users, define a field-by-field migration, choose stable identifiers for membership references, validate balances against the old ledger, and test password-hash compatibility in a separate migration process. Keep the old database backup until the new data is reconciled.
