# 🚀 DevPulse API

A RESTful backend API for managing software issues and feature requests. DevPulse allows users to register, authenticate, create issues, update issue status, and manage issue tracking securely using JWT authentication and PostgreSQL.

---

## 🌐 Live URL

> https://devpulse-leq1m3835-mariajahanchowdhury27-3511s-projects.vercel.app/

---
#Vercel Link
>https://vercel.com/mariajahanchowdhury27-3511s-projects/devpulse/Eve1rC9XVNghpeLYK8bq2qjP36cv

## ✨ Features

- 🔐 User Registration & Login
- 🔑 JWT Authentication
- 👤 Role-Based Authorization
- 📝 Create Issues
- 📋 View All Issues
- 🔍 View Single Issue
- ✏️ Update Issues
- 🗑️ Delete Issues (Role Protected)
- 🛡️ Password Hashing with bcrypt
- ⚠️ Centralized Error Handling
- ✅ Request Validation
- 🗄️ PostgreSQL Database

---

## 🛠️ Tech Stack

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- JWT (JSON Web Token)
- bcrypt
- dotenv

---

# 📁 Project Structure

```text
src/
│
├── config/
│   ├── database.ts
│   └── env.ts
│
├── middleware/
│   ├── authenticate.middleware.ts
│   ├── requireRole.middleware.ts
│   └── error.middleware.ts
│
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.routes.ts
│   │   ├── auth.service.ts
│   │   └── auth.repository.ts
│   │
│   └── issues/
│       ├── issues.controller.ts
│       ├── issues.routes.ts
│       ├── issues.service.ts
│       └── issues.repository.ts
│
├── utils/
├── types/
├── app.ts
└── server.ts
```

---

# ⚙️ Start development server

```bash
npm run dev
```

The server will run at

```
http://localhost:5000
```

# 📡 API Endpoints

## Authentication

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/auth/signup | Register a new user |
| POST | /api/auth/login | Login user |

---

## Issues

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/issues | Get all issues |
| GET | /api/issues/:id | Get issue by ID |
| POST | /api/issues | Create a new issue |
| PATCH | /api/issues/:id | Update an issue |
| DELETE | /api/issues/:id | Delete an issue |

---

# 🗄️ Database Summary

## Users

| Field | Type |
|--------|------|
| id | Integer |
| name | String |
| email | String |
| password | String |
| role | Enum |
| created_at | Timestamp |
| updated_at | Timestamp |

---

## Issues

| Field | Type |
|--------|------|
| id | Integer |
| title | String |
| description | Text |
| type | Enum |
| status | Enum |
| reporter_id | Integer |
| created_at | Timestamp |
| updated_at | Timestamp |

---

# 📌 HTTP Status Codes

| Status | Description |
|--------|-------------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal Server Error |

---

# 🚀 Running the Project

Development

```bash
npm run dev
```

Production

```bash
npm run build
npm start
```

---

# 🔒 Security

- JWT Authentication
- Password Hashing using bcrypt
- Role-Based Authorization
- Environment Variable Protection
- Centralized Error Handling


