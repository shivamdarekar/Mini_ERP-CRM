# Mini ERP + CRM Operations Portal
### Full-Stack Engineering Case Study — Fundsroom Infotech Pvt. Ltd.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Multi--stage-2496ED?logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-CI%2FCD-2088FF?logo=githubactions&logoColor=white)
![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?logo=vercel&logoColor=white)
![Railway](https://img.shields.io/badge/Backend-Railway-0B0D0E?logo=railway&logoColor=white)

A full-stack enterprise operations portal engineered for a wholesale/distribution company. The platform centralises customer CRM, product inventory, stock movements, sales challans, role-based security, and PDF invoice generation.

---

## Live Deployments & Case Study Links

| Resource | URL / Location |
|----------|----------------|
| **Frontend Application** | `https://flow-erp-crm.vercel.app/` |
| **Backend Production API** | `https://mini-erp-backend-production-e23a.up.railway.app/` |
| **GitHub Repository** | `https://github.com/shivamdarekar/Mini_ERP-CRM` |
| **REST API Documentation** | [docs/API.md](./docs/API.md) |
| **System Architecture Specs** | [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) |

## Demo Credentials

> ⚠️ **For evaluation/testing only. Not production credentials.**

| Role | Email | Password | Name |
|------|-------|----------|------|
| ADMIN | admin@erp.com | Admin@123 | Super Admin |
| SALES | sales@erp.com | Sales@123 | Rahul Sharma |
| WAREHOUSE | warehouse@erp.com | Warehouse@123 | Amit Verma |
| ACCOUNTS | accounts@erp.com | Accounts@123 | Priya Mehta |

---

## 1. Project Overview

This is an internal operations portal for a wholesale/distribution company. It is used by four internal teams:

- **Admin** — full system access, user management, audit trail
- **Sales** — customer CRM, follow-ups, challan creation
- **Warehouse** — product management, stock IN/OUT, inventory monitoring
- **Accounts** — read access to customers, products, inventory, and confirmed challans

There is **no public registration**. Users are created by an Admin. The public-facing side is a landing page that explains the platform and links to the login page.

---

## 2. Key Features

### Authentication & Access
- JWT authentication (httpOnly cookie + Bearer header support)
- Role-based access control (RBAC) enforced at the API layer
- Admin-managed user creation — no self-registration
- Protected routes on the frontend with role-aware navigation
- Password change, forgot password, and reset password flows

### Customer CRM
- Create, read, update customers
- Customer types: Retail, Wholesale, Distributor
- Customer statuses: Lead, Active, Inactive
- Search by name, business name, mobile, email
- Filter by status and customer type
- Follow-up date scheduling
- Follow-up notes with full history per customer
- Customer activity log (audit trail per customer)

### Products
- Create, read, update products
- SKU, category, unit price, warehouse location
- Minimum stock threshold for low-stock detection
- Active/inactive product lifecycle
- Search by name, SKU, category; filter by category, active status, low-stock flag

### Inventory
- Current stock tracked on each product
- Manual Stock IN and Stock OUT operations
- Every stock change creates a `StockMovement` record
- Low-stock detection: products where `currentStock <= minimumStock`
- Inventory detail view per product with recent movement history
- Paginated movement log with filters (product, type, date range, user)

### Sales Challans
- Create challan with customer + multiple products
- Challan statuses: Draft → Confirmed → (or) Cancelled
- Automatic challan number generation (`CH-000001` format)
- Draft challans do **not** reduce stock
- Confirming a challan atomically deducts stock for all items
- Insufficient stock returns a `409` error — stock never goes negative
- ChallanItem stores product snapshot (name, SKU, unit price) at creation time
- Edit draft challans (customer, items)
- Cancel draft challans
- Challan history: audit log events + triggered stock movements
- **PDF invoice/challan download** via browser print dialog

### Role-Specific Dashboards
- **Admin**: system counts, low-stock alert, recent challans, recent audit logs, recent users, upcoming follow-ups
- **Sales**: customer counts, own recent challans, own follow-up notes, upcoming follow-ups
- **Warehouse**: product counts, low-stock alert, recent stock movements, recent products
- **Accounts**: confirmed challan list, recent customers, 30-day sales summary

### Audit Trail
Every create, update, confirm, cancel, stock-in, and stock-out operation writes an `AuditLog` record with the actor, entity type, entity ID, action, description, and timestamp.

### DevOps
- Multi-stage Docker build for the backend
- Docker Hub image publishing
- GitHub Actions CI/CD — builds and pushes on backend changes
- Frontend deployed to Vercel
- Backend deployed to Railway via Docker container

---

## 3. Tech Stack

### Frontend
| Library | Version | Purpose |
|---------|---------|---------|
| React | 19 | UI framework |
| TypeScript | ~6 | Type safety |
| Vite | 8 | Build tool |
| React Router | 7 | Client-side routing |
| Axios | 1 | HTTP client |
| TanStack Query | 5 | Server state management |
| React Hook Form | 7 | Form state |
| Zod | 4 | Schema validation |
| Tailwind CSS | 4 | Styling |

### Backend
| Library | Version | Purpose |
|---------|---------|---------|
| Node.js | 22 | Runtime |
| Express | 5 | HTTP framework |
| TypeScript | 7 | Type safety |
| Prisma | 7 | ORM |
| PostgreSQL | — | Database (Neon) |
| `@prisma/adapter-pg` | 7 | Prisma PostgreSQL adapter |
| jsonwebtoken | 9 | JWT generation/verification |
| bcrypt | 6 | Password hashing |
| Zod | 4 | Request validation |
| Helmet | 8 | HTTP security headers |
| CORS | 2 | Cross-origin configuration |
| cookie-parser | 1 | Cookie handling |
| dotenv | 17 | Environment variables |

### DevOps
| Tool | Purpose |
|------|---------|
| Docker | Backend containerisation (multi-stage) |
| Docker Hub | Container image registry |
| GitHub Actions | CI/CD pipeline |
| Vercel | Frontend hosting |
| Railway | Backend container hosting |
| Neon | Managed PostgreSQL |

---

## 4. Architecture Overview

```
Browser
  └── Vercel (React SPA)
        └── REST API calls
              └── Railway (Docker Container)
                    └── Express + Prisma
                          └── Neon PostgreSQL

GitHub Push (backend/**)
  └── GitHub Actions
        └── Docker Build (multi-stage)
              └── Docker Hub (image push)
                    └── Railway (pulls & redeploys)
```

---

## 5. Repository Structure

```
ERP-CRM/
├── backend/                  # Node.js + Express + Prisma API
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   ├── migrations/       # Prisma migration history
│   │   └── seed.ts           # Demo data seeder
│   ├── src/
│   │   ├── common/           # Shared middleware, utils, types
│   │   ├── config/           # Prisma client, env validation
│   │   └── modules/          # Feature modules (auth, customers, products, ...)
│   ├── Dockerfile            # Multi-stage production build
│   ├── .env.example          # Environment variable template
│   └── package.json
│
├── frontend/                 # React + Vite SPA
│   ├── src/
│   │   ├── components/       # Reusable UI + layout + feature components
│   │   ├── context/          # AuthContext
│   │   ├── hooks/            # useAuth, useRole, usePageTitle
│   │   ├── pages/            # Route-level page components
│   │   ├── routes/           # AppRouter, ProtectedRoute, RoleRoute
│   │   ├── services/         # Axios API service layer
│   │   ├── types/            # Shared TypeScript types
│   │   └── utils/            # cn, format, constants
│   ├── .env.example
│   └── package.json
│
├── docs/
│   ├── API.md                # Full REST API reference
│   └── ARCHITECTURE.md       # Detailed technical architecture
│
└── .github/
    └── workflows/
        └── backend-docker.yml  # CI/CD pipeline
```

---

## 6. Role Permissions

### Customer Module
| Action | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
|--------|-------|-------|-----------|----------|
| Read | ✅ | ✅ | ❌ | ✅ |
| Create | ✅ | ✅ | ❌ | ❌ |
| Update | ✅ | ✅ | ❌ | ❌ |
| Add follow-up | ✅ | ✅ | ❌ | ❌ |

### Product Module
| Action | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
|--------|-------|-------|-----------|----------|
| Read | ✅ | ✅ | ✅ | ✅ |
| Create | ✅ | ❌ | ✅ | ❌ |
| Update | ✅ | ❌ | ✅ | ❌ |

### Inventory Module
| Action | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
|--------|-------|-------|-----------|----------|
| Stock IN | ✅ | ❌ | ✅ | ❌ |
| Stock OUT | ✅ | ❌ | ✅ | ❌ |
| View movements | ✅ | ✅ | ✅ | ✅ |
| Inventory detail | ✅ | ✅ | ✅ | ✅ |
| Low-stock list | ✅ | ✅ | ✅ | ✅ |

### Sales Challan Module
| Action | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
|--------|-------|-------|-----------|----------|
| Read | ✅ | ✅ | ✅ | ✅ |
| Create | ✅ | ✅ | ❌ | ❌ |
| Update draft | ✅ | ✅ | ❌ | ❌ |
| Confirm | ✅ | ✅ | ❌ | ❌ |
| Cancel | ✅ | ✅ | ❌ | ❌ |
| View history | ✅ | ✅ | ❌ | ✅ |

> **Note:** WAREHOUSE can read challan list and detail but cannot access challan history (`GET /:id/history`). This is enforced at the API route level.

### User Management
| Action | ADMIN | All others |
|--------|-------|------------|
| All CRUD | ✅ | ❌ |

### Audit Logs
| Action | ADMIN | All others |
|--------|-------|------------|
| Read | ✅ | ❌ |

---

## 7. Local Setup

### Prerequisites
- Node.js 22+
- npm 10+
- PostgreSQL database (local or cloud — Neon recommended)

### Backend

```bash
cd backend
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET, CORS_ORIGIN

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed demo data
npm run seed

# Start development server
npm run dev
```

Backend runs on `http://localhost:5000` by default.

### Frontend

```bash
cd frontend
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env — set VITE_API_BASE_URL

# Start development server
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

---

## 8. Environment Variables

### Backend (`.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret key for JWT signing (use a long random string) |
| `JWT_EXPIRES_IN` | ✅ | Token expiry e.g. `7d` |
| `PORT` | — | Server port (default: `5000`) |
| `NODE_ENV` | — | `development` / `production` |
| `CORS_ORIGIN` | ✅ in prod | Comma-separated allowed origins |
| `CLIENT_URL` | — | Fallback CORS origin |
| `BACKEND_URL` | — | Used in startup log output |

### Frontend (`.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | ✅ | Backend API base URL e.g. `https://api.example.com/api/v1` |

> `.env` files are never committed. `.env.example` contains variable names with placeholder values. Production secrets are configured directly in Railway (backend) and Vercel (frontend) environment settings.

---

## 9. Docker

The backend uses a **multi-stage Docker build**.

**Stage 1 — Builder:**
- Installs all dependencies (including devDependencies)
- Generates the Prisma client
- Compiles TypeScript to JavaScript

**Stage 2 — Production:**
- Installs production dependencies only
- Copies compiled `dist/` and Prisma client from builder
- Runs as a non-root user (`appuser`)
- Exposes port `5000`
- Includes a health check on `GET /api/health`

```bash
# Build image
docker build -t mini-erp-backend ./backend

# Run container
docker run -p 5000:5000 \
  -e DATABASE_URL="..." \
  -e JWT_SECRET="..." \
  -e JWT_EXPIRES_IN="7d" \
  -e NODE_ENV="production" \
  -e CORS_ORIGIN="https://your-frontend.com" \
  mini-erp-backend
```

---

## 10. CI/CD

The GitHub Actions workflow (`.github/workflows/backend-docker.yml`) triggers on:
- Push to `main`, `master`, or `develop` branches **when files under `backend/**` change**
- Push of `v*` version tags
- Manual dispatch

**Pipeline steps:**
1. Checkout repository
2. Set up Docker Buildx
3. Log in to Docker Hub
4. Extract metadata (tags: branch name, commit SHA, `latest` on default branch, semver on tags)
5. Build and push multi-stage Docker image with layer caching
6. Output image digest

Frontend-only changes do **not** trigger the backend Docker workflow due to the `paths: backend/**` filter.

---

## 12. API Reference

Full API documentation is in [`docs/API.md`](./docs/API.md).

**Base URL:** `/api/v1`

| Module | Endpoints |
|--------|-----------|
| Health | `GET /api/health` |
| Auth | `POST /login`, `GET /me`, `PATCH /me`, `PATCH /password`, `POST /logout`, `POST /forgot-password`, `POST /reset-password` |
| Users | `GET /users`, `POST /users`, `GET /users/:id`, `PATCH /users/:id`, `DELETE /users/:id` |
| Customers | `GET /customers`, `POST /customers`, `GET /customers/:id`, `PATCH /customers/:id`, `POST /customers/:id/follow-ups`, `GET /customers/:id/follow-ups`, `GET /customers/:id/activity` |
| Products | `GET /products`, `POST /products`, `GET /products/:id`, `PATCH /products/:id` |
| Inventory | `POST /inventory/stock-in`, `POST /inventory/stock-out`, `GET /inventory/movements`, `GET /inventory/products/:productId`, `GET /inventory/low-stock` |
| Challans | `GET /challans`, `POST /challans`, `GET /challans/:id`, `PATCH /challans/:id`, `POST /challans/:id/confirm`, `POST /challans/:id/cancel`, `GET /challans/:id/history` |
| Dashboard | `GET /dashboard/overview` |
| Audit Logs | `GET /audit-logs` |

---

## 13. Bonus Features

| Feature | Status |
|---------|--------|
| Docker multi-stage build | ✅ Implemented |
| GitHub Actions CI/CD | ✅ Implemented |
| PDF invoice/challan download | ✅ Implemented (browser print dialog) |
---

## 14. Assumptions

1. The system is for internal company users only — no public self-registration.
2. Admin creates and manages all user accounts.
3. A product belongs to a single warehouse location (string field, not a separate entity).
4. Challans represent sales/dispatch documents, not full accounting invoices.
5. `Product.currentStock` is the authoritative current stock level; `StockMovement` is the historical audit trail.
6. ChallanItem stores a snapshot of product name, SKU, and unit price at the time of challan creation so historical challans remain accurate even if product data changes later.
7. The PDF export uses the browser's native print dialog (`window.print()`). A dedicated PDF generation library (e.g. jsPDF) was not used.
8. GST calculation in the invoice modal uses a fixed 18% rate for display purposes only.
9. Password reset in non-production environments returns the reset token in the API response (no email provider is configured).

---

## 15. Known Limitations

1. **No email delivery** — forgot-password flow returns the reset token in the API response in non-production. A real email provider (SES, SendGrid) is not integrated.
2. **No refresh token rotation** — JWT tokens expire after 7 days with no silent refresh mechanism.
3. **Challan number generation** — uses `pg_advisory_xact_lock` + `COUNT(*)`. If a challan is deleted, the count-based sequence could produce a duplicate number.
4. **Confirmed challans cannot be cancelled** — there is no stock reversal path for confirmed challans. This is a business logic limitation.
5. **No automated test suite** — no unit or integration tests are implemented.
6. **No multi-warehouse support** — warehouse location is a free-text string per product, not a relational entity.
7. **No S3 product image upload** — not implemented.
8. **No advanced accounting ledger** — challans are dispatch documents, not full accounting invoices with debit/credit entries.
9. **No rate limiting** — the login and forgot-password endpoints have no brute-force protection.
10. **Admin self-modification** — there is no guard preventing an admin from changing their own role or deactivating their own account.

---

## 16. Architecture Document

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for detailed technical architecture including:
- System and request flow diagrams
- Authentication and RBAC design
- Database schema and design decisions
- Challan confirmation transaction design
- Concurrency considerations
- Engineering design decision Q&A
