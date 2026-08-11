# ERP-CRM API Documentation

Base URL: `/api/v1`

All authenticated endpoints require a valid JWT either as an `HttpOnly` cookie (`token`) or an `Authorization: Bearer <token>` header.

---

## Response Format

**Success (GET list)**
```json
{ "success": true, "statusCode": 200, "data": { "data": [...], "pagination": { "page": 1, "limit": 10, "total": 50, "totalPages": 5 } } }
```

**Success (GET single / CREATE / UPDATE)**
```json
{ "success": true, "statusCode": 200, "data": { ... }, "message": "..." }
```

**Error**
```json
{ "success": false, "statusCode": 400, "message": "...", "errors": [] }
```

> All `Decimal` fields (`unitPrice`, `totalAmount`, `total`) are serialized as strings with 2 decimal places (e.g. `"149.99"`).

---

## Health

### GET /api/health

No authentication required. Used for deployment health checks.

**Response 200**
```json
{ "success": true, "message": "ERP API is running", "data": { "database": "connected" } }
```

**Response 503** — database unreachable
```json
{ "success": false, "message": "ERP API is running but the database is unavailable", "data": { "database": "unavailable" } }
```

---

## Authentication

### POST /api/v1/auth/login

No auth required.

**Body**
```json
{ "email": "user@example.com", "password": "secret" }
```

**Response 200** — sets `token` HttpOnly cookie
```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "user": { "id": "...", "name": "...", "email": "...", "role": "ADMIN" }
  },
  "message": "Login successful"
}
```

**Errors:** `400` validation, `401` invalid credentials, `403` account deactivated

---

### POST /api/v1/auth/logout

Auth required. Clears the `token` HttpOnly cookie.

**Response 200**
```json
{ "success": true, "data": null, "message": "Logged out successfully" }
```

---

### GET /api/v1/auth/me

Auth required.

**Response 200**
```json
{
  "success": true,
  "data": {
    "id": "...", "name": "...", "email": "...", "role": "SALES",
    "isActive": true, "createdAt": "...", "updatedAt": "..."
  }
}
```

---

### PATCH /api/v1/auth/me

Auth required. At least one field required.

**Body** (all optional)
```json
{ "name": "New Name", "email": "new@example.com" }
```

| Field | Constraints |
|-------|-------------|
| `name` | string, 2–100 chars |
| `email` | valid email, max 255 chars |

**Response 200** — updated user object + `"message": "Profile updated successfully"`

**Errors:** `400` validation, `409` email already in use

---

### PATCH /api/v1/auth/password

Auth required.

**Body**
```json
{ "currentPassword": "old", "newPassword": "new123", "confirmPassword": "new123" }
```

| Field | Constraints |
|-------|-------------|
| `currentPassword` | required |
| `newPassword` | 6–100 chars |
| `confirmPassword` | must match `newPassword` |

**Response 200**
```json
{ "success": true, "data": { "message": "Password updated successfully" }, "message": "Password updated successfully" }
```

**Errors:** `400` validation or passwords don't match, `401` wrong current password

> Changing password sets `passwordChangedAt` to now, invalidating all previously issued JWTs.

---

### POST /api/v1/auth/forgot-password

No auth required.

**Body**
```json
{ "email": "user@example.com" }
```

**Response 200** — always returns 200 to prevent user enumeration. Reset token expires in **1 hour**.

```json
{
  "success": true,
  "data": {
    "message": "Password reset request created successfully",
    "expiresAt": "2025-01-01T01:00:00.000Z"
  }
}
```

> In non-production environments, `resetToken` is also included in `data` (no email provider is configured). In production, the token is never returned in the response.

---

### POST /api/v1/auth/reset-password

No auth required.

**Body**
```json
{ "token": "<reset_token>", "newPassword": "new123", "confirmPassword": "new123" }
```

| Field | Constraints |
|-------|-------------|
| `token` | required |
| `newPassword` | 6–100 chars |
| `confirmPassword` | must match `newPassword` |

**Response 200**
```json
{ "success": true, "data": { "message": "Password reset successfully" }, "message": "Password reset successfully" }
```

**Errors:** `400` invalid/expired token, passwords don't match

---

## Users

All endpoints require auth + `ADMIN` role.

### GET /api/v1/users

**Query**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number (max 100) | 20 | Items per page |
| search | string | — | Search by name or email |
| role | `ADMIN`\|`SALES`\|`WAREHOUSE`\|`ACCOUNTS` | — | Filter by role |
| isActive | boolean | — | Filter by active status |

**Response 200** — paginated list of users (no `passwordHash`)

---

### GET /api/v1/users/:id

**Response 200** — single user object

**Errors:** `400` invalid UUID, `404` not found

---

### POST /api/v1/users

**Body**
```json
{ "name": "Jane Doe", "email": "jane@example.com", "password": "secret123", "role": "SALES" }
```

| Field | Constraints |
|-------|-------------|
| `name` | 2–100 chars |
| `email` | valid email |
| `password` | 6–100 chars |
| `role` | `SALES`, `WAREHOUSE`, or `ACCOUNTS` — `ADMIN` cannot be assigned here |

**Response 201** — created user + `"message": "User created successfully"`

**Errors:** `400` validation, `409` email already exists

---

### PATCH /api/v1/users/:id

**Body** (all optional)
```json
{ "name": "...", "email": "...", "role": "WAREHOUSE", "isActive": false }
```

> Unlike `POST /users`, `PATCH` allows assigning the `ADMIN` role.

**Response 200** — updated user + `"message": "User updated successfully"`

**Errors:** `400` validation, `404` not found, `409` email conflict

---

### DELETE /api/v1/users/:id

Soft-deletes (sets `isActive: false`).

**Response 200** — updated user + `"message": "User deleted successfully"`

**Errors:** `404` not found, `409` already inactive

---

## Customers

Auth required. Roles: `ADMIN`, `SALES`, `ACCOUNTS` (read); `ADMIN`, `SALES` (write).

### GET /api/v1/customers

**Query**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | |
| limit | number (max 100) | 10 | |
| search | string (max 100) | — | Name, business name, mobile, or email |
| status | `LEAD`\|`ACTIVE`\|`INACTIVE` | — | |
| customerType | `RETAIL`\|`WHOLESALE`\|`DISTRIBUTOR` | — | |

**Response 200** — paginated customer list

---

### GET /api/v1/customers/:id

**Response 200** — customer object with `followUpNotes[]`

**Errors:** `400` invalid UUID, `404` not found

---

### POST /api/v1/customers

Roles: `ADMIN`, `SALES`

**Body**
```json
{
  "name": "Acme Corp",
  "mobile": "9876543210",
  "email": "acme@example.com",
  "businessName": "Acme Pvt Ltd",
  "customerType": "WHOLESALE",
  "address": "123 Main St",
  "status": "LEAD",
  "gstNumber": "22AAAAA0000A1Z5",
  "followUpDate": "2025-12-01T00:00:00.000Z",
  "notes": "Referred by partner"
}
```

| Field | Required | Constraints |
|-------|----------|-------------|
| `name` | ✅ | 2–100 chars |
| `mobile` | ✅ | 7–20 chars, unique |
| `email` | ✅ | valid email, max 255 chars |
| `businessName` | ✅ | 2–150 chars |
| `customerType` | ✅ | `RETAIL`, `WHOLESALE`, or `DISTRIBUTOR` |
| `address` | ✅ | 5–255 chars |
| `status` | — | `LEAD` (default), `ACTIVE`, or `INACTIVE` |
| `gstNumber` | — | max 20 chars |
| `followUpDate` | — | ISO date string |
| `notes` | — | max 1000 chars |

**Response 201** — created customer + `"message": "Customer created successfully"`

**Errors:** `400` validation, `409` mobile already exists

---

### PATCH /api/v1/customers/:id

Roles: `ADMIN`, `SALES`. All body fields optional (at least one required). Same field constraints as `POST`.

> `gstNumber` and `followUpDate` accept `null` to clear the value.

**Response 200** — updated customer + `"message": "Customer updated successfully"`

**Errors:** `400` validation, `404` not found, `409` mobile conflict

---

### POST /api/v1/customers/:id/follow-ups

Roles: `ADMIN`, `SALES`

**Body**
```json
{ "content": "Called customer, interested in bulk order." }
```

| Field | Constraints |
|-------|-------------|
| `content` | 3–1000 chars |

**Response 201** — follow-up note + `"message": "Follow-up note added successfully"`

**Errors:** `400` validation, `404` customer not found

---

### GET /api/v1/customers/:id/follow-ups

Roles: `ADMIN`, `SALES`, `ACCOUNTS`

**Response 200** — array of follow-up notes ordered by `createdAt` descending

---

### GET /api/v1/customers/:id/activity

Roles: `ADMIN`, `SALES`, `ACCOUNTS`

**Response 200**
```json
{ "success": true, "data": { "customer": { ... }, "auditLogs": [...] } }
```

---

## Products

Auth required. Roles: all (read); `ADMIN`, `WAREHOUSE` (write).

### GET /api/v1/products

**Query**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | |
| limit | number (max 100) | 10 | |
| search | string (max 100) | — | Name, SKU, or category |
| category | string (max 100) | — | Exact match |
| isActive | boolean | — | |
| lowStock | boolean | — | Only products where `currentStock <= minimumStock` |

**Response 200** — paginated product list (`unitPrice` serialized as string with 2 decimal places)

---

### GET /api/v1/products/:id

**Response 200** — single product

**Errors:** `404` not found

---

### POST /api/v1/products

Roles: `ADMIN`, `WAREHOUSE`

**Body**
```json
{
  "name": "Widget A",
  "sku": "WGT-001",
  "category": "Widgets",
  "unitPrice": "149.99",
  "currentStock": 100,
  "minimumStock": 10,
  "warehouseLocation": "Rack B-3",
  "isActive": true
}
```

| Field | Required | Constraints |
|-------|----------|-------------|
| `name` | ✅ | 1–150 chars |
| `sku` | ✅ | 1–60 chars, unique |
| `category` | ✅ | 1–100 chars |
| `unitPrice` | ✅ | string or number, ≥ 0 |
| `minimumStock` | ✅ | integer ≥ 0 |
| `warehouseLocation` | ✅ | 1–150 chars |
| `currentStock` | — | integer ≥ 0, default `0` |
| `isActive` | — | boolean, default `true` |

> `currentStock` can only be set at creation time. After creation, use the inventory endpoints to adjust stock.

**Response 201** — created product + `"message": "Product created successfully"`

**Errors:** `400` validation, `409` SKU already exists

---

### PATCH /api/v1/products/:id

Roles: `ADMIN`, `WAREHOUSE`. All fields optional. `currentStock` cannot be updated via this endpoint.

| Field | Constraints |
|-------|-------------|
| `name` | 1–150 chars |
| `sku` | 1–60 chars |
| `category` | 1–100 chars |
| `unitPrice` | string or number, ≥ 0 |
| `minimumStock` | integer ≥ 0 |
| `warehouseLocation` | 1–150 chars |
| `isActive` | boolean |

**Response 200** — updated product + `"message": "Product updated successfully"`

**Errors:** `400` validation, `404` not found, `409` SKU conflict

---

## Inventory

Auth required.

### POST /api/v1/inventory/stock-in

Roles: `ADMIN`, `WAREHOUSE`

**Body**
```json
{ "productId": "<uuid>", "quantity": 50, "reason": "Purchase order #123" }
```

| Field | Constraints |
|-------|-------------|
| `productId` | valid UUID |
| `quantity` | positive integer |
| `reason` | 3–255 chars, required |

**Response 200**
```json
{
  "success": true,
  "data": { "product": { ... }, "movement": { ... } },
  "message": "Stock added successfully"
}
```

**Errors:** `404` product not found, `409` product inactive

---

### POST /api/v1/inventory/stock-out

Roles: `ADMIN`, `WAREHOUSE`

**Body**
```json
{ "productId": "<uuid>", "quantity": 10, "reason": "Manual adjustment" }
```

Same field constraints as `stock-in`.

**Response 200** — same shape as stock-in

**Errors:** `404` product not found, `409` insufficient stock or product inactive

---

### GET /api/v1/inventory/movements

Roles: all

**Query**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | |
| limit | number (max 100) | 10 | |
| productId | UUID | — | |
| type | `IN`\|`OUT` | — | |
| createdBy | UUID | — | Filter by actor user ID |
| from | ISO date | — | `createdAt >= from` |
| to | ISO date | — | `createdAt <= to` |

**Response 200** — paginated movement list with nested `product` (`id`, `name`, `sku`) and `createdByUser` (`id`, `name`, `email`, `role`)

---

### GET /api/v1/inventory/products/:productId

Roles: all

**Response 200**
```json
{
  "success": true,
  "data": {
    "product": { ... },
    "isLowStock": false,
    "recentMovements": [...]
  }
}
```

**Errors:** `404` product not found

---

### GET /api/v1/inventory/low-stock

Roles: all

**Query:** `page` (default 1), `limit` (max 100, default 10)

**Response 200** — paginated list of active products where `currentStock <= minimumStock`

---

## Challans

Auth required.

### GET /api/v1/challans

Roles: all

**Query**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | |
| limit | number (max 100) | 10 | |
| search | string (max 100) | — | Challan number (case-insensitive contains) |
| customerId | UUID | — | |
| status | `DRAFT`\|`CONFIRMED`\|`CANCELLED` | — | |
| createdBy | UUID | — | |
| from | ISO date | — | `createdAt >= from` |
| to | ISO date | — | `createdAt <= to` |

**Response 200** — paginated challan list. Each item includes `customer` and `createdByUser` but **no** `items[]` array. Use `GET /:id` for line items.

---

### GET /api/v1/challans/:id

Roles: all

**Response 200** — full challan with `items[]`, `customer`, `createdByUser`

```json
{
  "id": "...",
  "challanNumber": "CH-000001",
  "customerId": "...",
  "totalQuantity": 10,
  "totalAmount": "1499.90",
  "status": "DRAFT",
  "createdBy": "...",
  "createdAt": "...",
  "updatedAt": "...",
  "customer": { "id": "...", "name": "...", "mobile": "...", "email": "...", "businessName": "...", "customerType": "...", "status": "..." },
  "createdByUser": { "id": "...", "name": "...", "email": "...", "role": "..." },
  "items": [
    {
      "id": "...", "challanId": "...", "productId": "...",
      "productName": "Widget A", "sku": "WGT-001",
      "unitPrice": "149.99", "quantity": 10, "total": "1499.90"
    }
  ]
}
```

**Errors:** `404` not found

---

### POST /api/v1/challans

Roles: `ADMIN`, `SALES`

**Body**
```json
{
  "customerId": "<uuid>",
  "items": [
    { "productId": "<uuid>", "quantity": 5 }
  ]
}
```

| Field | Constraints |
|-------|-------------|
| `customerId` | valid UUID, customer must not be `INACTIVE` |
| `items` | array, min 1 item, no duplicate `productId` values |
| `items[].productId` | valid UUID, product must be active |
| `items[].quantity` | positive integer |

Creates a `DRAFT` challan. Stock is **not** deducted at this stage. `ChallanItem` stores a snapshot of `productName`, `sku`, and `unitPrice` at creation time.

**Response 201** — created challan (full detail with `items[]`) + `"message": "Challan created successfully"`

**Errors:** `400` validation or duplicate productId, `404` customer/product not found, `409` customer inactive or product inactive

---

### PATCH /api/v1/challans/:id

Roles: `ADMIN`, `SALES`. Only `DRAFT` challans can be updated.

**Body** (all optional, but at least one field should be provided)
```json
{ "customerId": "<uuid>", "items": [...] }
```

> Providing `items` replaces all existing line items. Product snapshots are refreshed at update time.

**Response 200** — updated challan (full detail with `items[]`) + `"message": "Challan updated successfully"`

**Errors:** `400` validation, `404` not found, `409` challan not in `DRAFT` status

---

### POST /api/v1/challans/:id/confirm

Roles: `ADMIN`, `SALES`

Atomically confirms the challan and deducts stock for each line item inside a single database transaction.

**Response 200**
```json
{
  "success": true,
  "data": { "challan": { ... }, "stockMovements": [...] },
  "message": "Challan confirmed successfully"
}
```

**Errors:** `404` not found, `409` already confirmed, already cancelled, or insufficient stock for any item

---

### POST /api/v1/challans/:id/cancel

Roles: `ADMIN`, `SALES`. Only `DRAFT` challans can be cancelled. `CONFIRMED` challans cannot be cancelled.

**Response 200** — cancelled challan (full detail) + `"message": "Challan cancelled successfully"`

**Errors:** `404` not found, `409` already confirmed or already cancelled

---

### GET /api/v1/challans/:id/history

Roles: `ADMIN`, `SALES`, `ACCOUNTS` — `WAREHOUSE` is explicitly excluded.

**Response 200**
```json
{
  "success": true,
  "data": {
    "challan": { "id": "...", "challanNumber": "...", "status": "...", "createdAt": "...", "updatedAt": "..." },
    "auditLogs": [...],
    "stockMovements": [...]
  }
}
```

> `stockMovements` are matched by `reason = "Sales Challan <challanNumber>"` — only movements created by challan confirmation are included.

**Errors:** `404` not found

---

## Dashboard

Auth required. Response shape varies by role.

### GET /api/v1/dashboard/overview

All roles receive `counts` and `upcomingFollowUps`.

**`counts` object (all roles)**
```json
{
  "activeCustomers": 42,
  "activeProducts": 18,
  "totalUsers": 5,
  "draftChallans": 3,
  "confirmedChallans": 120,
  "lowStockProducts": 2
}
```

> `totalUsers` counts only active users. `lowStockProducts` counts active products where `currentStock <= minimumStock`.

**`upcomingFollowUps`** — customers with `followUpDate >= now` and status not `INACTIVE`, ordered by `followUpDate` ascending (max 10).

**Role-specific additional fields**

| Role | Additional fields |
|------|-------------------|
| `ADMIN` | `lowStockProducts[]` (top 10), `recentAuditLogs[]` (top 10), `recentMovements[]` (top 10), `recentChallans[]` (top 10), `recentUsers[]` (top 10) |
| `SALES` | `recentCustomers[]` (top 10), `recentChallans[]` (own, top 10), `followUps[]` (own follow-up notes, top 10), `recentActivity[]` (own audit logs, top 10, no nested `user`) |
| `WAREHOUSE` | `lowStockProducts[]` (top 10), `recentMovements[]` (top 10), `recentProducts[]` (top 10) |
| `ACCOUNTS` | `confirmedChallans[]` (top 10 most recent confirmed), `recentCustomers[]` (top 10), `salesSummary` (last 30 days) |

**`salesSummary` shape (ACCOUNTS only)**
```json
{ "count": 15, "totalAmount": "22499.85" }
```

---

## Audit Logs

Auth required. Role: `ADMIN` only.

### GET /api/v1/audit-logs

**Query**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | |
| limit | number (max 100) | 20 | |
| userId | UUID | — | Filter by actor |
| action | string | — | e.g. `CREATE`, `UPDATE`, `STOCK_IN`, `CONFIRM`, `CANCEL` |
| entityType | string | — | e.g. `USER`, `CUSTOMER`, `PRODUCT`, `CHALLAN` |
| entityId | string | — | Entity UUID |
| from | ISO date | — | `createdAt >= from` |
| to | ISO date | — | `createdAt <= to` |

**Response 200** — paginated audit log list with nested `user` (`id`, `name`, `email`, `role`)

**Audited actions**

| Action | entityType | Trigger |
|--------|-----------|---------|
| `CREATE` | `USER` | Admin creates a user |
| `UPDATE` | `USER` | Admin updates a user |
| `DELETE` | `USER` | Admin soft-deletes a user |
| `CREATE` | `CUSTOMER` | Customer created |
| `UPDATE` | `CUSTOMER` | Customer updated |
| `ADD_FOLLOW_UP` | `CUSTOMER` | Follow-up note added to a customer |
| `CREATE` | `PRODUCT` | Product created |
| `UPDATE` | `PRODUCT` | Product updated |
| `STOCK_IN` | `PRODUCT` | Manual stock in |
| `STOCK_OUT` | `PRODUCT` | Manual stock out (also triggered per item on challan confirm) |
| `CREATE` | `CHALLAN` | Challan created |
| `UPDATE` | `CHALLAN` | Draft challan updated |
| `CONFIRM` | `CHALLAN` | Challan confirmed |
| `CANCEL` | `CHALLAN` | Challan cancelled |

> Audit logs never contain passwords, password hashes, JWTs, or other secrets. All audit log writes are inside the same database transaction as the triggering operation — if the operation rolls back, the log is also rolled back.

---

## Roles Reference

| Role | Description |
|------|-------------|
| `ADMIN` | Full access — user management, audit logs, all modules |
| `SALES` | Customer CRM, follow-ups, challan create/confirm/cancel |
| `WAREHOUSE` | Product management, stock IN/OUT, inventory monitoring |
| `ACCOUNTS` | Read-only — customers, products, inventory, confirmed challans |

---

## Error Codes

| Status | Meaning |
|--------|---------|
| 400 | Validation failed or bad request |
| 401 | Unauthenticated or wrong password |
| 403 | Insufficient role permissions or account deactivated |
| 404 | Resource not found |
| 409 | Conflict — duplicate value, wrong status, or insufficient stock |
| 500 | Internal server error |
| 503 | Database unavailable |
