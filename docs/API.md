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

**Body**
```json
{ "email": "user@example.com", "password": "secret" }
```

**Response 200** — sets `token` HttpOnly cookie
```json
{ "success": true, "data": { "token": "<jwt>", "user": { "id": "...", "name": "...", "email": "...", "role": "ADMIN" } }, "message": "Login successful" }
```

**Errors:** `400` validation, `401` invalid credentials, `403` account deactivated

---

### POST /api/v1/auth/logout

Auth required.

**Response 200** — clears `token` cookie
```json
{ "success": true, "data": null, "message": "Logged out successfully" }
```

---

### GET /api/v1/auth/me

Auth required.

**Response 200**
```json
{ "success": true, "data": { "id": "...", "name": "...", "email": "...", "role": "SALES", "isActive": true, "createdAt": "...", "updatedAt": "..." } }
```

---

### PATCH /api/v1/auth/me

Auth required.

**Body** (all optional)
```json
{ "name": "New Name", "email": "new@example.com" }
```

**Response 200** — updated user object + `"message": "Profile updated successfully"`

**Errors:** `400` validation, `409` email already in use

---

### PATCH /api/v1/auth/password

Auth required.

**Body**
```json
{ "currentPassword": "old", "newPassword": "new123", "confirmPassword": "new123" }
```

**Response 200**
```json
{ "success": true, "data": { "message": "Password updated successfully" }, "message": "Password updated successfully" }
```

**Errors:** `400` validation, `401` wrong current password

---

### POST /api/v1/auth/forgot-password

No auth required.

**Body**
```json
{ "email": "user@example.com" }
```

**Response 200** — always succeeds to prevent user enumeration. In non-production, `resetToken` is included in the response.

---

### POST /api/v1/auth/reset-password

No auth required.

**Body**
```json
{ "token": "<reset_token>", "newPassword": "new123", "confirmPassword": "new123" }
```

**Response 200**
```json
{ "success": true, "data": { "message": "Password reset successfully" }, "message": "Password reset successfully" }
```

**Errors:** `400` invalid/expired token

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
| role | ADMIN\|SALES\|WAREHOUSE\|ACCOUNTS | — | Filter by role |
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

Note: `ADMIN` role cannot be assigned via this endpoint.

**Response 201** — created user + `"message": "User created successfully"`

**Errors:** `400` validation, `409` email already exists

---

### PATCH /api/v1/users/:id

**Body** (all optional)
```json
{ "name": "...", "email": "...", "role": "WAREHOUSE", "isActive": false }
```

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
| search | string | — | Name, business, mobile, email |
| status | LEAD\|ACTIVE\|INACTIVE | — | |
| customerType | RETAIL\|WHOLESALE\|DISTRIBUTOR | — | |

**Response 200** — paginated customer list

---

### GET /api/v1/customers/:id

**Response 200** — customer with `followUpNotes[]`

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

**Response 201** — created customer + `"message": "Customer created successfully"`

**Errors:** `400` validation, `409` mobile already exists

---

### PATCH /api/v1/customers/:id

Roles: `ADMIN`, `SALES`. All body fields optional (at least one required).

**Response 200** — updated customer + `"message": "Customer updated successfully"`

---

### POST /api/v1/customers/:id/follow-ups

Roles: `ADMIN`, `SALES`

**Body**
```json
{ "content": "Called customer, interested in bulk order." }
```

**Response 201** — follow-up note + `"message": "Follow-up note added successfully"`

**Errors:** `404` customer not found

---

### GET /api/v1/customers/:id/follow-ups

**Response 200** — array of follow-up notes

---

### GET /api/v1/customers/:id/activity

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
| search | string | — | Name, SKU, category |
| category | string | — | Exact match |
| isActive | boolean | — | |
| lowStock | boolean | — | Only products at or below minimum stock |

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

**Response 201** — created product + `"message": "Product created successfully"`

**Errors:** `400` validation, `409` SKU already exists

---

### PATCH /api/v1/products/:id

Roles: `ADMIN`, `WAREHOUSE`. All fields optional. `currentStock` cannot be updated directly (use inventory endpoints).

**Response 200** — updated product + `"message": "Product updated successfully"`

---

## Inventory

Auth required.

### POST /api/v1/inventory/stock-in

Roles: `ADMIN`, `WAREHOUSE`

**Body**
```json
{ "productId": "<uuid>", "quantity": 50, "reason": "Purchase order #123" }
```

**Response 200**
```json
{ "success": true, "data": { "product": { ... }, "movement": { ... } }, "message": "Stock added successfully" }
```

**Errors:** `404` product not found, `409` product inactive

---

### POST /api/v1/inventory/stock-out

Roles: `ADMIN`, `WAREHOUSE`

**Body**
```json
{ "productId": "<uuid>", "quantity": 10, "reason": "Manual adjustment" }
```

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
| type | IN\|OUT | — | |
| createdBy | UUID | — | |
| from | ISO date | — | |
| to | ISO date | — | |

**Response 200** — paginated movement list with nested `product` and `createdByUser`

---

### GET /api/v1/inventory/products/:productId

Roles: all

**Response 200**
```json
{ "success": true, "data": { "product": { ... }, "isLowStock": false, "recentMovements": [...] } }
```

---

### GET /api/v1/inventory/low-stock

Roles: all

**Query:** `page`, `limit` (max 100, default 10)

**Response 200** — paginated list of products where `currentStock <= minimumStock`

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
| search | string | — | Challan number |
| customerId | UUID | — | |
| status | DRAFT\|CONFIRMED\|CANCELLED | — | |
| createdBy | UUID | — | |
| from | ISO date | — | |
| to | ISO date | — | |

**Response 200** — paginated challan list (no items array, use GET /:id for items)

---

### GET /api/v1/challans/:id

Roles: all

**Response 200** — full challan with `items[]`, `customer`, `createdByUser`

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

Creates a `DRAFT` challan. Stock is **not** deducted at this stage.

**Response 201** — created challan + `"message": "Challan created successfully"`

**Errors:** `400` validation, `404` customer/product not found, `409` customer/product inactive

---

### PATCH /api/v1/challans/:id

Roles: `ADMIN`, `SALES`. Only `DRAFT` challans can be updated.

**Body** (all optional)
```json
{ "customerId": "<uuid>", "items": [...] }
```

**Response 200** — updated challan + `"message": "Challan updated successfully"`

**Errors:** `409` challan not in DRAFT status

---

### POST /api/v1/challans/:id/confirm

Roles: `ADMIN`, `SALES`

Confirms the challan and atomically deducts stock for each item.

**Response 200**
```json
{ "success": true, "data": { "challan": { ... }, "stockMovements": [...] }, "message": "Challan confirmed successfully" }
```

**Errors:** `409` already confirmed/cancelled, insufficient stock

---

### POST /api/v1/challans/:id/cancel

Roles: `ADMIN`, `SALES`. Only `DRAFT` challans can be cancelled.

**Response 200** — cancelled challan + `"message": "Challan cancelled successfully"`

**Errors:** `409` already confirmed or cancelled

---

### GET /api/v1/challans/:id/history

Roles: `ADMIN`, `SALES`, `ACCOUNTS`

**Response 200**
```json
{ "success": true, "data": { "challan": { ... }, "auditLogs": [...], "stockMovements": [...] } }
```

---

## Dashboard

Auth required. Response varies by role.

### GET /api/v1/dashboard/overview

Returns role-aware aggregated data. All counts are computed via database aggregation.

**Common fields (all roles)**
```json
{
  "role": "ADMIN",
  "counts": {
    "activeCustomers": 42,
    "activeProducts": 18,
    "totalUsers": 5,
    "draftChallans": 3,
    "confirmedChallans": 120,
    "lowStockProducts": 2
  },
  "upcomingFollowUps": [...]
}
```

**ADMIN** — additionally includes: `recentAuditLogs`, `recentMovements`, `recentChallans`, `recentUsers`, `lowStockProducts`

**SALES** — additionally includes: `recentCustomers`, `recentChallans` (own), `followUps` (own), `recentActivity`

**WAREHOUSE** — additionally includes: `lowStockProducts`, `recentMovements`, `recentProducts`

**ACCOUNTS** — additionally includes: `confirmedChallans`, `recentCustomers`, `salesSummary` (last 30 days count + total amount)

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
| entityType | string | — | e.g. `USER`, `CUSTOMER`, `PRODUCT`, `CHALLAN`, `FOLLOW_UP_NOTE` |
| entityId | UUID | — | |
| from | ISO date | — | |
| to | ISO date | — | |

**Response 200** — paginated audit log list with nested `user`

**Audited actions**

| Action | entityType | Trigger |
|--------|-----------|---------|
| CREATE | USER | User created by admin |
| UPDATE | USER | User updated / activated / deactivated |
| DELETE | USER | User soft-deleted |
| CREATE | CUSTOMER | Customer created |
| UPDATE | CUSTOMER | Customer updated |
| CREATE | FOLLOW_UP_NOTE | Follow-up note added |
| CREATE | PRODUCT | Product created |
| UPDATE | PRODUCT | Product updated / activated / deactivated |
| STOCK_IN | PRODUCT | Stock added |
| STOCK_OUT | PRODUCT | Stock reduced (manual or via challan confirm) |
| CREATE | CHALLAN | Challan created |
| UPDATE | CHALLAN | Draft challan updated |
| CONFIRM | CHALLAN | Challan confirmed |
| CANCEL | CHALLAN | Challan cancelled |

> Audit logs never contain passwords, password hashes, JWTs, or other secrets.

---

## Roles Reference

| Role | Description |
|------|-------------|
| ADMIN | Full access |
| SALES | Customers, challans, follow-ups |
| WAREHOUSE | Products, inventory movements |
| ACCOUNTS | Read customers, read/view confirmed challans |

---

## Error Codes

| Status | Meaning |
|--------|---------|
| 400 | Validation failed |
| 401 | Unauthenticated |
| 403 | Insufficient permissions or account deactivated |
| 404 | Resource not found |
| 409 | Conflict (duplicate, wrong state, insufficient stock) |
| 500 | Internal server error |
| 503 | Database unavailable |
