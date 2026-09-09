# DevPulse

Internal Tech Issue & Feature Tracker API — a collaborative backend for software teams to report bugs, suggest features, and coordinate resolutions.

**Live URL:** `https://<your-deployment>.vercel.app` <!-- update after deploying -->

---

## Features

- JWT-based authentication with bcrypt password hashing
- Role-based access control (`contributor`, `maintainer`)
- Full CRUD for issues (bugs & feature requests) with ownership + workflow-state rules
- Filtering and sorting on the issues list (`type`, `status`, `sort`)
- Raw SQL only — no ORM, no query builder, no `JOIN`s (reporter data is batch-fetched separately)
- Centralized error handling and a consistent success/error response envelope
- Strict TypeScript (no `any`), modular architecture

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 24.x |
| Language | TypeScript (strict mode) |
| Framework | Express.js |
| Database | PostgreSQL (native `pg` driver, raw SQL) |
| Auth | JWT (`jsonwebtoken`) + `bcrypt` |
| Status codes | `http-status-codes` |

---

## Project Structure

```
src/
├── config/          # env + database pool
├── middleware/       # auth, role, centralized error handling
├── modules/
│   ├── auth/         # signup/login controller, service, routes, types
│   └── issues/        # issues controller, service, routes, types
├── utils/            # response formatting, JWT, bcrypt, validation, AppError
├── types/            # shared domain types + Express request augmentation
├── db/                # schema.sql + migration runner
├── app.ts             # Express app (middleware + route wiring)
└── server.ts           # process entry point
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@host:5432/devpulse?sslmode=require
JWT_SECRET=replace-this-with-a-long-random-secret
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
CORS_ORIGIN=*
```

Any PostgreSQL provider works — NeonDB, Supabase, ElephantSQL, or a local instance.

### 3. Run migrations

Creates the `users` and `issues` tables (raw SQL, see `src/db/schema.sql`):

```bash
npm run migrate
```

### 4. Run the server

```bash
npm run dev     # ts-node-dev, hot reload
# or
npm run build && npm start   # compiled production build
```

Server starts on `http://localhost:5000` (or your configured `PORT`).

---

## Database Schema Summary

### `users`

| Field | Type | Notes |
|---|---|---|
| id | SERIAL PK | auto-increment |
| name | VARCHAR(255) | required |
| email | VARCHAR(255) | required, unique |
| password | TEXT | bcrypt hash, never returned in responses |
| role | VARCHAR(20) | `contributor` \| `maintainer`, defaults to `contributor` |
| created_at | TIMESTAMPTZ | auto-set on insert |
| updated_at | TIMESTAMPTZ | auto-refreshed on update |

### `issues`

| Field | Type | Notes |
|---|---|---|
| id | SERIAL PK | auto-increment |
| title | VARCHAR(150) | required |
| description | TEXT | required, min 20 chars |
| type | VARCHAR(20) | `bug` \| `feature_request` |
| status | VARCHAR(20) | `open` \| `in_progress` \| `resolved`, defaults to `open` |
| reporter_id | INTEGER | no FK constraint — validated in application code |
| created_at | TIMESTAMPTZ | auto-set on insert |
| updated_at | TIMESTAMPTZ | auto-refreshed on update |

Full DDL: [`src/db/schema.sql`](./src/db/schema.sql)

---

## API Endpoints

All endpoints are prefixed `/api`. Protected routes require an `Authorization` header carrying the raw JWT (no `Bearer` prefix, per spec — a `Bearer <token>` value is also accepted).

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/signup` | Public | Register a new account |
| POST | `/auth/login` | Public | Authenticate and receive a JWT |

### Issues

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/issues` | Authenticated | Create a bug/feature request |
| GET | `/issues?sort=&type=&status=` | Public | List issues, filterable/sortable |
| GET | `/issues/:id` | Public | Get one issue |
| PATCH | `/issues/:id` | Maintainer (any) / Contributor (own, only while `open`) | Update an issue |
| DELETE | `/issues/:id` | Maintainer only | Delete an issue |

### Response envelope

```json
// success
{ "success": true, "message": "...", "data": { } }

// error
{ "success": false, "message": "...", "errors": { } }
```

### Permission rules for `PATCH /issues/:id`

- **Maintainers** may update any field (`title`, `description`, `type`, `status`) on any issue — including changing workflow `status` independently.
- **Contributors** may update `title`/`description`/`type` only on issues they reported, and only while the issue's `status` is `open`. They may not set `status` directly (`403`); attempting to edit a non-`open` issue returns `409`.

---

## Author Notes

Built to the DevPulse assignment specification: strict endpoint paths/response shapes, raw SQL with `pool.query()` only (no ORM/query builder/JOINs), modular `modules/`, `utils/`, `config/`, `middleware/` layout, and TypeScript strict mode with no `any`.
