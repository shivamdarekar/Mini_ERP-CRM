# Technical Architecture Specification — Mini ERP + CRM Operations Portal
### Enterprise Full-Stack System Design — Fundsroom Infotech Pvt. Ltd.

---

## 1. System Overview

The system is a full-stack internal operations portal for a wholesale/distribution company. It is composed of three independently deployed services:

```
Browser (React SPA)
  └── Vercel CDN
        └── HTTPS REST calls
              └── Railway (Docker Container)
                    └── Express 5 + Prisma 7
                          └── Neon PostgreSQL (managed)

GitHub Push (backend/**)
  └── GitHub Actions CI/CD
        └── Docker multi-stage build
              └── Docker Hub (image registry)
                    └── Railway (pulls & redeploys)
```

- **Frontend** — React 19 SPA, deployed to Vercel as static files. All routing is client-side.
- **Backend** — Node.js 22 + Express 5 REST API, running inside a Docker container on Railway.
- **Database** — PostgreSQL hosted on Neon (serverless managed Postgres). Accessed exclusively through Prisma ORM.

---

## 2. Request Flow

A typical authenticated API request follows this path:

```
1. Browser sends request
   - Cookie: token=<jwt>  (set by login)
   - OR Authorization: Bearer <jwt>  (set by Axios interceptor from localStorage)

2. Express router matches route

3. verifyJWT middleware
   - Extracts token from cookie or Authorization header
   - Verifies JWT signature and expiry
   - Fetches user from DB (id, email, role, isActive, passwordChangedAt)
   - Checks isActive === true
   - Checks token iat >= passwordChangedAt (invalidates tokens issued before password change)
   - Attaches req.user = { id, userId, email, role, name }

4. authorizeRoles(...roles) middleware
   - Checks req.user.role is in the allowed roles list
   - Returns 403 if not

5. Zod validation middleware
   - Validates req.body / req.query / req.params against schema
   - Returns 400 with field-level errors on failure

6. Controller
   - Calls service function
   - Returns JSON response

7. Service
   - Executes business logic
   - Calls Prisma (inside $transaction where needed)
   - Writes AuditLog record
   - Returns serialized data

8. Global error handler
   - Catches ApiError instances → returns { success: false, message }
   - Catches unhandled errors → returns 500
```

---

## 3. Authentication Design

### JWT Strategy

- On login, the server signs a JWT containing `{ id, email, role, name }` with `JWT_SECRET`.
- The token is delivered two ways simultaneously:
  - **httpOnly cookie** (`token`) — prevents JavaScript access, protects against XSS.
  - **Response body** — the frontend stores it in `localStorage` and attaches it as a `Bearer` header via an Axios request interceptor.
- The `verifyJWT` middleware accepts either source, checking the cookie first.

### Token Invalidation

There is no token blacklist or refresh token mechanism. Tokens are invalidated by two passive checks on every request:

1. **Account deactivation** — `isActive` is checked against the live DB record. A deactivated user is rejected immediately even with a valid token.
2. **Password change** — `passwordChangedAt` is stored on the User record. If `token.iat * 1000 < passwordChangedAt`, the token was issued before the password change and is rejected.

### Password Reset Flow

1. `POST /api/v1/forgot-password` — generates a `crypto.randomBytes` reset token, hashes it, stores the hash + expiry on the User record, and returns the raw token in the response body (non-production only — no email provider is integrated).
2. `POST /api/v1/reset-password` — accepts the raw token, hashes it, looks up the matching User record, verifies expiry, updates `passwordHash`, clears the reset fields, and sets `passwordChangedAt` to now (invalidating all existing sessions).

---

## 4. Role-Based Access Control (RBAC)

RBAC is enforced at the route level using the `authorizeRoles` middleware. There is no frontend-only enforcement — every protected action is validated server-side.

### Roles

| Role | Description |
|------|-------------|
| `ADMIN` | Full system access, user management, audit log access |
| `SALES` | Customer CRM, follow-ups, challan create/confirm/cancel |
| `WAREHOUSE` | Product management, stock IN/OUT, inventory monitoring |
| `ACCOUNTS` | Read-only access to customers, products, inventory, confirmed challans |

### Route-Level Enforcement

Each module's router applies `verifyJWT` globally, then `authorizeRoles` per route or route group:

- **Customers** — read: ADMIN, SALES, ACCOUNTS; write + follow-ups: ADMIN, SALES
- **Products** — read: all roles; create/update: ADMIN, WAREHOUSE
- **Inventory** — stock-in/out: ADMIN, WAREHOUSE; read movements/detail/low-stock: all roles
- **Challans** — read list + detail: all roles; create/update/confirm/cancel: ADMIN, SALES; history: ADMIN, SALES, ACCOUNTS (WAREHOUSE excluded)
- **Users** — all operations: ADMIN only
- **Audit Logs** — read: ADMIN only
- **Dashboard** — all authenticated users (response content varies by role)

---

## 5. Database Schema

All models use UUID primary keys (`@id @default(uuid())`). Timestamps use `@default(now())` and `@updatedAt`.

### Entity Relationship Summary

```
User ──< StockMovement
User ──< Challan
User ──< FollowUpNote
User ──< AuditLog

Customer ──< Challan
Customer ──< FollowUpNote

Product ──< StockMovement
Product ──< ChallanItem

Challan ──< ChallanItem
```

### Models

**User**
- `id`, `email` (unique), `passwordHash`, `passwordResetToken` (unique, nullable), `passwordResetExpiresAt`, `passwordChangedAt`, `name`, `role` (enum), `isActive` (default true)
- Indexes: `role`, `isActive`

**Customer**
- `id`, `name`, `mobile` (unique), `email`, `businessName`, `gstNumber` (nullable), `customerType` (enum), `address`, `status` (enum, default LEAD), `followUpDate` (nullable), `notes` (nullable)
- Indexes: `status`, `customerType`, `mobile`

**FollowUpNote**
- `id`, `customerId` (FK → Customer, cascade delete), `content`, `createdBy` (FK → User)
- Indexes: `customerId`, `createdBy`

**Product**
- `id`, `name`, `sku` (unique), `category`, `unitPrice` (Decimal 12,2), `currentStock` (Int, default 0), `minimumStock` (Int, default 0), `warehouseLocation`, `isActive` (default true)
- Indexes: `category`, `isActive`

**StockMovement**
- `id`, `productId` (FK → Product), `quantity`, `type` (enum: IN/OUT), `reason`, `createdBy` (FK → User)
- Indexes: `productId`, `createdBy`, `type`, `createdAt`

**Challan**
- `id`, `challanNumber` (unique), `customerId` (FK → Customer), `totalQuantity`, `totalAmount` (Decimal 14,2), `status` (enum, default DRAFT), `createdBy` (FK → User)
- Indexes: `customerId`, `createdBy`, `status`, `createdAt`

**ChallanItem**
- `id`, `challanId` (FK → Challan, cascade delete), `productId` (FK → Product), `productName` (snapshot), `sku` (snapshot), `unitPrice` (snapshot, Decimal 12,2), `quantity`, `total` (Decimal 14,2)
- Indexes: `challanId`, `productId`

**AuditLog**
- `id`, `userId` (FK → User), `action`, `entityType`, `entityId` (nullable), `description` (nullable), `metadata` (Json, nullable)
- Indexes: `userId`, `(entityType, entityId)`, `createdAt`

### Design Decisions

- **`Product.currentStock` is the authoritative stock level.** `StockMovement` is the historical audit trail. There is no derived/computed stock — `currentStock` is updated directly on every stock operation.
- **ChallanItem stores product snapshots.** `productName`, `sku`, and `unitPrice` are copied from the Product at challan creation time. This ensures historical challans remain accurate even if the product is later renamed or repriced.
- **`warehouseLocation` is a free-text string**, not a relational entity. Multi-warehouse support is not implemented.
- **User delete is a soft delete.** `isActive` is set to `false`. The User record is never removed, preserving referential integrity for AuditLog, StockMovement, Challan, and FollowUpNote records.
- **`mobile` is unique on Customer.** Used as a natural deduplication key.

---

## 6. Challan Confirmation Transaction

Confirming a challan is the most complex operation in the system. It is fully atomic inside a single `prisma.$transaction`.

### Steps (inside one transaction)

```
1. Fetch challan + items (status check: must be DRAFT)
2. For each ChallanItem:
   a. reduceStockAtomically(tx, { productId, quantity })
      → tx.product.updateMany WHERE id = productId
                                AND isActive = true
                                AND currentStock >= quantity
        SET currentStock = currentStock - quantity
      → if result.count === 0 → throw ApiError(409, 'Insufficient stock')
   b. tx.stockMovement.create (type: OUT, reason: "Sales Challan CH-XXXXXX")
3. tx.challan.update → status: CONFIRMED
4. createAuditLog (action: CONFIRM, entityType: CHALLAN)
5. Return confirmed challan + stock movements
```

### Concurrency Safety

The `updateMany` with `currentStock >= quantity` condition is the concurrency guard. Under PostgreSQL's default `READ COMMITTED` isolation, two concurrent transactions attempting to deduct stock from the same product will serialize at the row lock level. The second transaction will see the updated `currentStock` from the first and will either succeed (if stock remains sufficient) or return `count === 0` (triggering a 409). Stock can never go negative.

### Challan Number Generation

```sql
SELECT pg_advisory_xact_lock(20260810);
-- then:
SELECT COUNT(*) FROM "Challan";
-- number = 'CH-' + (count + 1).padStart(6, '0')
```

`pg_advisory_xact_lock` serializes all concurrent challan creations. The lock is released when the transaction commits or rolls back. This prevents duplicate challan numbers under concurrent creation.

**Known limitation:** If a challan record is ever deleted, the count-based sequence could produce a duplicate number. Challan deletion is not exposed in the current API, so this is not a practical risk.

### Cancellation Constraint

Only `DRAFT` challans can be cancelled. `CONFIRMED` challans cannot be cancelled — there is no stock reversal path. This is an intentional business logic constraint.

---

## 7. Inventory Stock Operations

### Stock IN

```
1. Verify product exists and isActive
2. prisma.$transaction:
   a. product.update → currentStock: { increment: quantity }
   b. stockMovement.create (type: IN)
   c. createAuditLog (action: STOCK_IN)
3. Return updated product + movement
```

### Stock OUT (manual)

```
1. Verify product exists and isActive
2. prisma.$transaction:
   a. product.updateMany WHERE id = productId
                           AND isActive = true
                           AND currentStock >= quantity
      SET currentStock = currentStock - quantity
   b. if count === 0 → throw 409 Insufficient stock
   c. stockMovement.create (type: OUT)
   d. createAuditLog (action: STOCK_OUT)
3. Return updated product + movement
```

### Low-Stock Detection

Low-stock is defined as `currentStock <= minimumStock` (not strictly less than — a product at exactly its minimum threshold is considered low-stock). Queried via raw SQL:

```sql
WHERE "isActive" = true AND "currentStock" <= "minimumStock"
```

---

## 8. Audit Trail

Every mutating operation writes an `AuditLog` record via the shared `createAuditLog(tx, {...})` utility, called inside the same transaction as the mutation. This guarantees the audit log is written atomically with the operation — if the transaction rolls back, the audit log is also rolled back.

### Logged Actions

| Action | Entity Type | Trigger |
|--------|-------------|---------|
| `CREATE` | `USER` | Admin creates a user |
| `UPDATE` | `USER` | Admin updates a user |
| `DELETE` | `USER` | Admin deactivates a user |
| `CREATE` | `CUSTOMER` | Customer created |
| `UPDATE` | `CUSTOMER` | Customer updated |
| `ADD_FOLLOW_UP` | `CUSTOMER` | Follow-up note added |
| `CREATE` | `PRODUCT` | Product created |
| `UPDATE` | `PRODUCT` | Product updated |
| `STOCK_IN` | `PRODUCT` | Manual stock in |
| `STOCK_OUT` | `PRODUCT` | Manual stock out |
| `CREATE` | `CHALLAN` | Challan created |
| `UPDATE` | `CHALLAN` | Draft challan updated |
| `CONFIRM` | `CHALLAN` | Challan confirmed |
| `CANCEL` | `CHALLAN` | Challan cancelled |

---

## 9. Dashboard — Role-Aware Response

`GET /api/v1/dashboard/overview` is a single endpoint that returns different data shapes based on `req.user.role`. All roles receive `baseCounts` (active customers, active products, total users, draft/confirmed challan counts, low-stock product count) and `upcomingFollowUps`.

| Role | Additional Data |
|------|----------------|
| ADMIN | `lowStockProducts`, `recentAuditLogs`, `recentMovements`, `recentChallans`, `recentUsers` |
| SALES | `recentCustomers`, `recentChallans` (own only), `followUps` (own only), `recentActivity` (own audit logs) |
| WAREHOUSE | `lowStockProducts`, `recentMovements`, `recentProducts` |
| ACCOUNTS | `confirmedChallans`, `recentCustomers`, `salesSummary` (30-day confirmed challan count + total amount) |

---

## 10. Backend Module Structure

```
backend/src/
├── config/
│   └── prisma.ts           # Prisma client singleton
├── common/
│   ├── middleware/
│   │   ├── auth.middleware.ts      # verifyJWT
│   │   ├── authorize.middleware.ts # authorizeRoles
│   │   ├── validate.middleware.ts  # Zod request validation
│   │   └── errorHandler.ts        # Global error handler
│   ├── utils/
│   │   ├── apiError.ts     # ApiError class
│   │   ├── apiResponse.ts  # Standardised response wrapper
│   │   ├── asyncHandler.ts # try/catch wrapper for async route handlers
│   │   └── jwt.ts          # signToken / verifyToken
│   └── services/
│       └── audit.service.ts  # createAuditLog utility
└── modules/
    ├── auth/               # login, me, password, logout, forgot/reset password
    ├── users/              # CRUD + soft-delete (ADMIN only)
    ├── customers/          # CRM + follow-ups + activity
    ├── products/           # Product lifecycle
    ├── inventory/          # Stock IN/OUT, movements, low-stock
    ├── challans/           # Challan lifecycle + history
    ├── dashboard/          # Role-aware dashboard aggregation
    └── audit-logs/         # Paginated audit log read (ADMIN only)
```

Each module follows the pattern: `router.ts` → `controller.ts` → `service.ts` + `validation.ts`.

---

## 11. Frontend Architecture

### Routing

React Router 7 with a nested route structure in `AppRouter.tsx`:

- `/` — public landing page
- `/login`, `/forgot-password`, `/reset-password` — public auth pages
- All other routes are wrapped in `ProtectedRoute` (redirects to `/login` if unauthenticated) and `RoleRoute` (redirects to `/dashboard` if role is not permitted)

The `/challans/create` route is declared **before** `/challans/:id` to prevent the router from matching `create` as a dynamic segment.

### State Management

- **Server state** — TanStack Query v5 (`useQuery`, `useMutation`) for all API data. Provides caching, background refetch, and loading/error states.
- **Auth state** — React Context (`AuthContext`) stores the current user and token. Token is persisted in `localStorage` and attached to all Axios requests via a request interceptor.
- **Form state** — React Hook Form v7 with Zod resolvers for all forms.

### Service Layer

All API calls are centralised in `frontend/src/services/`. Each module has its own service file (e.g. `challan.service.ts`, `customer.service.ts`) that wraps Axios calls. This keeps API logic out of components and pages.

### PDF Export

The invoice/challan PDF export is implemented via `window.print()` in `InvoiceModal.tsx`. The modal contains embedded `@media print` CSS that hides all UI chrome and renders only the invoice layout. No external PDF library is used. The modal renders either a "Tax Invoice" (for confirmed challans) or a "Delivery Challan" (for draft challans), with a fixed 18% GST calculation for display purposes only.

---

## 12. Docker — Multi-Stage Build

The backend uses a two-stage Docker build to produce a lean production image.

### Stage 1 — Builder (`node:22-alpine`)

```
COPY package*.json → npm ci (all deps including devDeps)
COPY prisma/ → npx prisma generate (generates Prisma client into node_modules)
COPY tsconfig.json, prisma.config.ts, src/ → npm run build (tsc → dist/)
```

### Stage 2 — Production (`node:22-alpine`)

```
npm ci --omit=dev (production deps only)
COPY --from=builder /app/prisma → ./prisma
COPY --from=builder /app/node_modules/.prisma → ./node_modules/.prisma  (after npm ci)
COPY --from=builder /app/node_modules/@prisma → ./node_modules/@prisma  (after npm ci)
COPY --from=builder /app/dist → ./dist
USER appuser (non-root, uid 1001)
HEALTHCHECK GET /api/health (curl, 30s interval)
EXPOSE 5000
CMD ["node", "dist/server.js"]
```

**Critical ordering:** `.prisma` and `@prisma` are copied from the builder **after** `npm ci` runs in the production stage. If copied before, `npm ci` would overwrite the generated client with an empty stub.

---

## 13. CI/CD Pipeline

File: `.github/workflows/backend-docker.yml`

### Triggers

- Push to `main`, `master`, or `develop` with changes under `backend/**`
- Push of `v*` version tags
- Manual workflow dispatch

Frontend-only changes do not trigger the backend workflow due to the `paths: backend/**` filter.

### Steps

```
1. actions/checkout@v4
2. docker/setup-buildx-action@v3
3. docker/login-action@v3  (Docker Hub credentials from GitHub secrets)
4. docker/metadata-action@v5
   → branch name tag
   → short commit SHA tag
   → 'latest' tag on default branch push
   → semver tags on v* tag push
5. docker/build-push-action@v6
   → context: ./backend
   → Dockerfile: ./backend/Dockerfile
   → push: true
   → cache-from/cache-to: registry layer caching
6. Output image digest
```

---

## 14. Engineering Design Decisions

**Q: Why is `currentStock` stored on the Product rather than computed from StockMovement history?**

Computed stock would require summing all movement records on every read — expensive at scale. Storing `currentStock` directly gives O(1) reads. The `StockMovement` table serves as the audit trail, not the source of truth for current levels.

**Q: Why does ChallanItem store product name, SKU, and unit price as snapshots?**

Products can be renamed or repriced after a challan is created. Storing snapshots ensures historical challans always reflect the data at the time of creation, which is essential for accurate dispatch records.

**Q: Why use `updateMany` with a stock guard instead of `SELECT FOR UPDATE`?**

`updateMany` with a conditional `WHERE currentStock >= quantity` is a single atomic SQL statement. Under PostgreSQL's default isolation, it acquires a row-level write lock, performs the check and update atomically, and returns the affected row count. If `count === 0`, the condition failed (insufficient stock). This avoids the overhead of explicit `SELECT FOR UPDATE` + separate `UPDATE` while achieving the same safety guarantee.

**Q: Why use `pg_advisory_xact_lock` for challan number generation?**

Challan numbers are generated from `COUNT(*) + 1`. Without serialization, two concurrent transactions could read the same count and generate the same number. The advisory lock serializes all challan creations without requiring a separate sequence table or a `SERIAL` column on the challan number.

**Q: Why is there no refresh token?**

Scope decision for this assessment. The JWT expires after 7 days. Adding refresh token rotation would require a token store (Redis or DB table), a rotation endpoint, and silent refresh logic on the frontend — significant complexity for an internal tool with a small user base.

**Q: Why can confirmed challans not be cancelled?**

Stock has already been deducted. Reversing a confirmed challan would require a stock reversal (a new Stock IN movement) and potentially re-numbering or voiding the challan. This is a business process decision — in a real deployment, a credit note or return challan workflow would handle this case.

**Q: Why does the forgot-password endpoint return the reset token in the response?**

No email provider (SES, SendGrid) is integrated. In a production deployment, the token would be emailed to the user and never returned in the API response. The current behaviour is explicitly non-production and documented as a known limitation.
