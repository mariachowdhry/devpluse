

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import express from "express";
import cors from "cors";

// src/config/env.ts
import dotenv from "dotenv";
dotenv.config();
function getRequiredEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}
var env = {
  port: Number(process.env.PORT) || 5e3,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: getRequiredEnv("DATABASE_URL"),
  jwtSecret: getRequiredEnv("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  bcryptSaltRounds: Math.min(12, Math.max(8, Number(process.env.BCRYPT_SALT_ROUNDS) || 10)),
  corsOrigin: process.env.CORS_ORIGIN || "*"
};

// src/modules/auth/auth.routes.ts
import { Router } from "express";

// src/utils/errors.util.ts
var AppError = class _AppError extends Error {
  statusCode;
  errors;
  constructor(statusCode, message, errors) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = "AppError";
    Object.setPrototypeOf(this, _AppError.prototype);
  }
  static badRequest(message, errors) {
    return new _AppError(400, message, errors);
  }
  static unauthorized(message = "Unauthorized") {
    return new _AppError(401, message);
  }
  static forbidden(message = "Forbidden") {
    return new _AppError(403, message);
  }
  static notFound(message = "Resource not found") {
    return new _AppError(404, message);
  }
  static conflict(message) {
    return new _AppError(409, message);
  }
  static internal(message = "Internal server error") {
    return new _AppError(500, message);
  }
};
function asyncHandler(fn) {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

// src/utils/response.util.ts
function sendSuccess(res, statusCode, message, data) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}
function sendError(res, statusCode, message, errors) {
  return res.status(statusCode).json({
    success: false,
    message,
    ...errors !== void 0 ? { errors } : {}
  });
}

// src/config/db.ts
import { Pool } from "pg";
var pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.nodeEnv === "production" || env.databaseUrl.includes("sslmode=require") ? { rejectUnauthorized: false } : void 0,
  max: 10,
  idleTimeoutMillis: 3e4,
  connectionTimeoutMillis: 5e3
});
pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err);
});

// src/utils/password.util.ts
import bcrypt from "bcrypt";
async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, env.bcryptSaltRounds);
}
async function comparePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// src/utils/jwt.util.ts
import jwt from "jsonwebtoken";
function signToken(payload) {
  const options = {
    expiresIn: env.jwtExpiresIn
  };
  return jwt.sign(payload, env.jwtSecret, options);
}
function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

// src/modules/auth/auth.service.ts
function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
}
async function registerUser(body) {
  const { name, email, password } = body;
  const role = body.role ?? "contributor";
  const existing = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [email]
  );
  if (existing.rows.length > 0) {
    throw AppError.badRequest("An account with this email already exists");
  }
  const hashedPassword = await hashPassword(password);
  const result = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, password, role, created_at, updated_at`,
    [name, email, hashedPassword, role]
  );
  const user = result.rows[0];
  if (!user) {
    throw AppError.internal("Failed to create user");
  }
  return toPublicUser(user);
}
async function loginUser(body) {
  const { email, password } = body;
  const result = await pool.query(
    "SELECT id, name, email, password, role, created_at, updated_at FROM users WHERE email = $1",
    [email]
  );
  const user = result.rows[0];
  if (!user) {
    throw AppError.unauthorized("Invalid email or password");
  }
  const passwordMatches = await comparePassword(password, user.password);
  if (!passwordMatches) {
    throw AppError.unauthorized("Invalid email or password");
  }
  const token = signToken({ id: user.id, name: user.name, role: user.role });
  return { token, user: toPublicUser(user) };
}

// src/utils/validation.util.ts
var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}
function validateEmail(email) {
  if (!isNonEmptyString(email)) return "email is required";
  if (!EMAIL_REGEX.test(email)) return "email must be a valid email address";
  return null;
}
function validatePassword(password) {
  if (!isNonEmptyString(password)) return "password is required";
  if (password.length < 6) return "password must be at least 6 characters";
  return null;
}
function validateName(name) {
  if (!isNonEmptyString(name)) return "name is required";
  if (name.length > 255) return "name must be at most 255 characters";
  return null;
}
function validateRole(role) {
  if (role === void 0) return null;
  if (role !== "contributor" && role !== "maintainer") {
    return 'role must be either "contributor" or "maintainer"';
  }
  return null;
}
function validateTitle(title) {
  if (!isNonEmptyString(title)) return "title is required";
  if (title.length > 150) return "title must be at most 150 characters";
  return null;
}
function validateDescription(description) {
  if (!isNonEmptyString(description)) return "description is required";
  if (description.trim().length < 20) return "description must be at least 20 characters";
  return null;
}
function validateIssueType(type) {
  if (!isNonEmptyString(type)) return "type is required";
  if (type !== "bug" && type !== "feature_request") {
    return 'type must be either "bug" or "feature_request"';
  }
  return null;
}
function validateIssueStatus(status) {
  if (status === void 0) return null;
  if (status !== "open" && status !== "in_progress" && status !== "resolved") {
    return 'status must be one of "open", "in_progress", "resolved"';
  }
  return null;
}

// src/modules/auth/auth.controller.ts
var signup = asyncHandler(async (req, res) => {
  const body = req.body;
  const errors = {};
  const nameErr = validateName(body.name);
  const emailErr = validateEmail(body.email);
  const passwordErr = validatePassword(body.password);
  const roleErr = validateRole(body.role);
  if (nameErr) errors.name = nameErr;
  if (emailErr) errors.email = emailErr;
  if (passwordErr) errors.password = passwordErr;
  if (roleErr) errors.role = roleErr;
  if (Object.keys(errors).length > 0) {
    throw AppError.badRequest("Validation failed", errors);
  }
  const user = await registerUser({
    name: body.name.trim(),
    email: body.email.trim().toLowerCase(),
    password: body.password,
    role: body.role
  });
  sendSuccess(res, 201, "User registered successfully", user);
});
var login = asyncHandler(async (req, res) => {
  const body = req.body;
  const errors = {};
  const emailErr = validateEmail(body.email);
  if (emailErr) errors.email = emailErr;
  if (!body.password) errors.password = "password is required";
  if (Object.keys(errors).length > 0) {
    throw AppError.badRequest("Validation failed", errors);
  }
  const { token, user } = await loginUser({
    email: body.email.trim().toLowerCase(),
    password: body.password
  });
  sendSuccess(res, 200, "Login successful", { token, user });
});

// src/modules/auth/auth.routes.ts
var router = Router();
router.post("/signup", signup);
router.post("/login", login);
var auth_routes_default = router;

// src/modules/issues/issues.routes.ts
import { Router as Router2 } from "express";

// src/middleware/auth.middleware.ts
function authenticate(req, _res, next) {
  const header = req.headers.authorization;
  if (!header) {
    return next(AppError.unauthorized("Authentication token is required"));
  }
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : header.trim();
  if (!token) {
    return next(AppError.unauthorized("Authentication token is required"));
  }
  try {
    const payload = verifyToken(token);
    req.user = payload;
    return next();
  } catch (err) {
    return next(AppError.unauthorized("Invalid or expired authentication token"));
  }
}

// src/middleware/role.middleware.ts
function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized("Authentication required"));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden("You do not have permission to perform this action"));
    }
    return next();
  };
}

// src/modules/issues/issues.service.ts
async function attachReporters(issues) {
  if (issues.length === 0) return [];
  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];
  const reportersResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1::int[])`,
    [reporterIds]
  );
  const reporterMap = new Map(
    reportersResult.rows.map((reporter) => [reporter.id, reporter])
  );
  return issues.map(({ reporter_id, ...issue }) => ({
    ...issue,
    reporter: reporterMap.get(reporter_id) ?? {
      id: reporter_id,
      name: "Unknown user",
      role: "contributor"
    }
  }));
}
async function createIssue(reporterId, body) {
  const result = await pool.query(
    `INSERT INTO issues (title, description, type, reporter_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, title, description, type, status, reporter_id, created_at, updated_at`,
    [body.title, body.description, body.type, reporterId]
  );
  const issue = result.rows[0];
  if (!issue) {
    throw AppError.internal("Failed to create issue");
  }
  return issue;
}
async function getAllIssues(query) {
  const conditions = [];
  const params = [];
  if (query.type) {
    params.push(query.type);
    conditions.push(`type = $${params.length}`);
  }
  if (query.status) {
    params.push(query.status);
    conditions.push(`status = $${params.length}`);
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const sortDirection = query.sort === "oldest" ? "ASC" : "DESC";
  const result = await pool.query(
    `SELECT id, title, description, type, status, reporter_id, created_at, updated_at
     FROM issues
     ${whereClause}
     ORDER BY created_at ${sortDirection}`,
    params
  );
  return attachReporters(result.rows);
}
async function getIssueById(id) {
  const result = await pool.query(
    `SELECT id, title, description, type, status, reporter_id, created_at, updated_at
     FROM issues WHERE id = $1`,
    [id]
  );
  const issue = result.rows[0];
  if (!issue) {
    throw AppError.notFound("Issue not found");
  }
  const [withReporter] = await attachReporters([issue]);
  if (!withReporter) {
    throw AppError.internal("Failed to attach reporter to issue");
  }
  return withReporter;
}
async function getRawIssueById(id) {
  const result = await pool.query(
    `SELECT id, title, description, type, status, reporter_id, created_at, updated_at
     FROM issues WHERE id = $1`,
    [id]
  );
  const issue = result.rows[0];
  if (!issue) {
    throw AppError.notFound("Issue not found");
  }
  return issue;
}
async function updateIssue(id, requesterId, requesterRole, body) {
  const issue = await getRawIssueById(id);
  const isMaintainer = requesterRole === "maintainer";
  const isOwner = issue.reporter_id === requesterId;
  if (!isMaintainer && !isOwner) {
    throw AppError.forbidden("You can only update your own issues");
  }
  if (body.status !== void 0 && !isMaintainer) {
    throw AppError.forbidden("Only maintainers can change issue status");
  }
  if (!isMaintainer && issue.status !== "open") {
    throw AppError.conflict("This issue can no longer be edited because it is not open");
  }
  const fields = [];
  const params = [];
  if (body.title !== void 0) {
    params.push(body.title);
    fields.push(`title = $${params.length}`);
  }
  if (body.description !== void 0) {
    params.push(body.description);
    fields.push(`description = $${params.length}`);
  }
  if (body.type !== void 0) {
    params.push(body.type);
    fields.push(`type = $${params.length}`);
  }
  if (body.status !== void 0) {
    params.push(body.status);
    fields.push(`status = $${params.length}`);
  }
  if (fields.length === 0) {
    throw AppError.badRequest("No valid fields provided to update");
  }
  fields.push(`updated_at = NOW()`);
  params.push(id);
  const result = await pool.query(
    `UPDATE issues SET ${fields.join(", ")}
     WHERE id = $${params.length}
     RETURNING id, title, description, type, status, reporter_id, created_at, updated_at`,
    params
  );
  const updatedIssue = result.rows[0];
  if (!updatedIssue) {
    throw AppError.internal("Failed to update issue");
  }
  return updatedIssue;
}
async function deleteIssue(id) {
  const result = await pool.query("DELETE FROM issues WHERE id = $1 RETURNING id", [id]);
  if (result.rowCount === 0) {
    throw AppError.notFound("Issue not found");
  }
}

// src/modules/issues/issues.controller.ts
var createIssue2 = asyncHandler(async (req, res) => {
  const body = req.body;
  const errors = {};
  const titleErr = validateTitle(body.title);
  const descErr = validateDescription(body.description);
  const typeErr = validateIssueType(body.type);
  if (titleErr) errors.title = titleErr;
  if (descErr) errors.description = descErr;
  if (typeErr) errors.type = typeErr;
  if (Object.keys(errors).length > 0) {
    throw AppError.badRequest("Validation failed", errors);
  }
  const reporterId = req.user.id;
  const issue = await createIssue(reporterId, {
    title: body.title.trim(),
    description: body.description.trim(),
    type: body.type
  });
  sendSuccess(res, 201, "Issue created successfully", issue);
});
var getAllIssues2 = asyncHandler(async (req, res) => {
  const { sort, type, status } = req.query;
  if (sort !== void 0 && sort !== "newest" && sort !== "oldest") {
    throw AppError.badRequest('sort must be "newest" or "oldest"');
  }
  if (type !== void 0 && type !== "bug" && type !== "feature_request") {
    throw AppError.badRequest('type must be "bug" or "feature_request"');
  }
  if (status !== void 0 && status !== "open" && status !== "in_progress" && status !== "resolved") {
    throw AppError.badRequest('status must be "open", "in_progress", or "resolved"');
  }
  const issuesQuery = {
    sort: sort ?? "newest",
    ...type !== void 0 && { type },
    ...status !== void 0 && { status }
  };
  const issues = await getAllIssues(issuesQuery);
  sendSuccess(res, 200, "Issues retrieved successfully", issues);
});
var getIssueById2 = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw AppError.badRequest("Invalid issue id");
  }
  const issue = await getIssueById(id);
  sendSuccess(res, 200, "Issue retrieved successfully", issue);
});
var updateIssue2 = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw AppError.badRequest("Invalid issue id");
  }
  const body = req.body;
  const errors = {};
  if (body.title !== void 0) {
    const err = validateTitle(body.title);
    if (err) errors.title = err;
  }
  if (body.description !== void 0) {
    const err = validateDescription(body.description);
    if (err) errors.description = err;
  }
  if (body.type !== void 0) {
    const err = validateIssueType(body.type);
    if (err) errors.type = err;
  }
  if (body.status !== void 0) {
    const err = validateIssueStatus(body.status);
    if (err) errors.status = err;
  }
  if (Object.keys(errors).length > 0) {
    throw AppError.badRequest("Validation failed", errors);
  }
  const patch = {};
  if (body.title !== void 0) patch.title = body.title.trim();
  if (body.description !== void 0) patch.description = body.description.trim();
  if (body.type !== void 0) patch.type = body.type;
  if (body.status !== void 0) patch.status = body.status;
  if (Object.keys(patch).length === 0) {
    throw AppError.badRequest("At least one field must be provided to update");
  }
  const updated = await updateIssue(id, req.user.id, req.user.role, patch);
  sendSuccess(res, 200, "Issue updated successfully", updated);
});
var deleteIssue2 = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw AppError.badRequest("Invalid issue id");
  }
  await deleteIssue(id);
  sendSuccess(res, 200, "Issue deleted successfully", null);
});

// src/modules/issues/issues.routes.ts
var router2 = Router2();
router2.get("/", getAllIssues2);
router2.get("/:id", getIssueById2);
router2.post("/", authenticate, createIssue2);
router2.patch("/:id", authenticate, updateIssue2);
router2.delete("/:id", authenticate, requireRole("maintainer"), deleteIssue2);
var issues_routes_default = router2;

// src/middleware/error.middleware.ts
function notFoundHandler(req, res) {
  sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
}
function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.message, err.errors);
    return;
  }
  console.error("Unhandled error:", err);
  sendError(res, 500, "Internal server error");
}

// src/app.ts
var app = express();
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (_req, res) => {
  sendSuccess(res, 200, "DevPulse API is running", { status: "ok" });
});
app.get("/health", (_req, res) => {
  sendSuccess(res, 200, "Healthy", { status: "ok" });
});
app.use("/api/auth", auth_routes_default);
app.use("/api/issues", issues_routes_default);
app.use(notFoundHandler);
app.use(errorHandler);
var app_default = app;

// src/db/index.ts
import { Pool as Pool2 } from "pg";
var pool2 = new Pool2({
  connectionString: env.databaseUrl
});
var initDB = async () => {
  try {
    await pool2.query(`
      CREATE TABLE IF NOT EXISTS users (
        id             SERIAL PRIMARY KEY,
        name           VARCHAR(255) NOT NULL,
        email          VARCHAR(255) NOT NULL UNIQUE,
        password       TEXT NOT NULL,
        role           VARCHAR(20) NOT NULL DEFAULT 'contributor'
                       CHECK (role IN ('contributor', 'maintainer')),
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool2.query(`
      CREATE TABLE IF NOT EXISTS issues (
        id            SERIAL PRIMARY KEY,
        title         VARCHAR(150) NOT NULL,
        description   TEXT NOT NULL,
        type          VARCHAR(20) NOT NULL
                      CHECK (type IN ('bug', 'feature_request')),
        status        VARCHAR(20) NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open', 'in_progress', 'resolved')),
        reporter_id   INTEGER NOT NULL,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Database connected successfully!");
  } catch (error) {
    console.error("Database connection failed:", error);
  }
};

// src/server.ts
async function start() {
  try {
    await initDB();
  } catch (err) {
    console.error(" Could not connect to the database on startup:", err);
    process.exit(1);
  }
  app_default.listen(env.port, () => {
    console.log(
      `listening on port ${env.port} [${env.nodeEnv}]`
    );
  });
}
start();
//# sourceMappingURL=server.js.map