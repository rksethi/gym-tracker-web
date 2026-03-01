const express = require("express");
const path = require("path");
const crypto = require("crypto");
const Database = require("better-sqlite3");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { seedExercises } = require("./seed");

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === "production";
app.set("trust proxy", 1);
if (IS_PROD && !process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is required in production");
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret-change-in-production";
const JWT_EXPIRY = "7d";
const COOKIE_NAME = "gymtracker_token";
const SALT_ROUNDS = 12;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const INVITE_CODE_EXPIRY_DAYS = 7;

// ---------------------------------------------------------------------------
// Security middleware
// ---------------------------------------------------------------------------

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    frameguard: { action: "deny" },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

const SKIP_RATE_LIMIT = process.env.DISABLE_RATE_LIMIT === "1";

const apiLimiter = SKIP_RATE_LIMIT ? (_req, _res, next) => next() : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api", apiLimiter);

const loginLimiter = SKIP_RATE_LIMIT ? (_req, _res, next) => next() : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again later." },
});

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// T2139: Prevent caching of API responses containing sensitive data
app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  next();
});

// T29: CSRF protection — require X-Requested-With header on state-changing requests
// Combined with SameSite=strict cookies, this blocks cross-origin form submissions
app.use((req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) && req.path.startsWith("/api")) {
    const ct = req.headers["content-type"] || "";
    if (!ct.includes("application/json")) {
      return res.status(415).json({ error: "Content-Type must be application/json" });
    }
    if (!req.headers["x-requested-with"]) {
      return res.status(403).json({ error: "Missing X-Requested-With header" });
    }
  }
  next();
});

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const VALID_CATEGORIES = ["push", "pull", "legs", "shoulders", "arms", "core", "cardio", "fullBody"];
const VALID_UNITS = ["kg", "lbs"];

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.status = 400;
  }
}

function requireInt(val, fieldName) {
  const n = Number(val);
  if (!Number.isFinite(n) || !Number.isInteger(n)) throw new ValidationError(`${fieldName} must be an integer`);
  return n;
}

function requirePositiveInt(val, fieldName) {
  const n = requireInt(val, fieldName);
  if (n <= 0) throw new ValidationError(`${fieldName} must be a positive integer`);
  return n;
}

function requireString(val, fieldName, maxLen = 200) {
  if (typeof val !== "string" || val.trim().length === 0) throw new ValidationError(`${fieldName} is required`);
  if (val.trim().length > maxLen) throw new ValidationError(`${fieldName} must be at most ${maxLen} characters`);
  return val.trim();
}

function requireEnum(val, allowed, fieldName) {
  if (!allowed.includes(val)) throw new ValidationError(`${fieldName} must be one of: ${allowed.join(", ")}`);
  return val;
}

function optionalNumber(val, fieldName, min = 0, max = 100000) {
  if (val === undefined || val === null) return undefined;
  const n = Number(val);
  if (!Number.isFinite(n)) throw new ValidationError(`${fieldName} must be a number`);
  if (n < min || n > max) throw new ValidationError(`${fieldName} must be between ${min} and ${max}`);
  return n;
}

function validateEmail(email) {
  const trimmed = requireString(email, "email", 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) throw new ValidationError("Invalid email address");
  return trimmed.toLowerCase();
}

function validatePassword(password) {
  if (typeof password !== "string" || password.length < 8) throw new ValidationError("Password must be at least 8 characters");
  if (!/[A-Z]/.test(password)) throw new ValidationError("Password must contain at least one uppercase letter");
  if (!/[a-z]/.test(password)) throw new ValidationError("Password must contain at least one lowercase letter");
  if (!/[0-9]/.test(password)) throw new ValidationError("Password must contain at least one number");
  return password;
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, "gymtracker.db");
const db = new Database(DB_PATH);
if (!IS_PROD) console.log(`Database: ${DB_PATH}`);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    is_custom INTEGER NOT NULL DEFAULT 0,
    user_id INTEGER REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS workout_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL DEFAULT (datetime('now')),
    duration INTEGER NOT NULL DEFAULT 0,
    is_completed INTEGER NOT NULL DEFAULT 0,
    user_id INTEGER NOT NULL REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS workout_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id),
    order_num INTEGER NOT NULL,
    max_heart_rate INTEGER
  );
  CREATE TABLE IF NOT EXISTS exercise_sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER NOT NULL REFERENCES workout_entries(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    reps INTEGER NOT NULL DEFAULT 0,
    weight REAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'lbs',
    is_completed INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS workout_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS template_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id),
    order_num INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS invite_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    used_by INTEGER REFERENCES users(id),
    used_at TEXT
  );
  CREATE TABLE IF NOT EXISTS access_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    email TEXT NOT NULL,
    action TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Migrations for existing databases
try { db.exec("ALTER TABLE exercises ADD COLUMN user_id INTEGER REFERENCES users(id)"); } catch {}
try { db.exec("ALTER TABLE workout_sessions ADD COLUMN user_id INTEGER REFERENCES users(id)"); } catch {}
try { db.exec("ALTER TABLE workout_templates ADD COLUMN user_id INTEGER REFERENCES users(id)"); } catch {}
try { db.exec("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0"); } catch {}

seedExercises(db);

if (ADMIN_EMAIL) {
  db.prepare("UPDATE users SET is_admin = 1 WHERE email = ? COLLATE NOCASE").run(ADMIN_EMAIL.toLowerCase());
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

function cookieOptions() {
  return {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

function issueToken(res, user) {
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  res.cookie(COOKIE_NAME, token, cookieOptions());
  return { id: user.id, email: user.email, is_admin: user.is_admin || 0 };
}

function logAccess(action, email, userId, req) {
  db.prepare("INSERT INTO access_logs (user_id, email, action, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)").run(
    userId, email, action, req.ip || req.connection?.remoteAddress || "unknown", (req.headers["user-agent"] || "").slice(0, 500)
  );
}

function generateInviteCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.userId, email: payload.email };
    next();
  } catch {
    res.clearCookie(COOKIE_NAME);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Verify the authenticated user owns the session
function requireSessionOwner(req, res, next) {
  const id = requirePositiveInt(req.params.id, "id");
  const session = db.prepare("SELECT id, user_id FROM workout_sessions WHERE id = ?").get(id);
  if (!session) return res.status(404).json({ error: "Session not found" });
  if (session.user_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });
  req.sessionId = id;
  next();
}

// ---------------------------------------------------------------------------
// Auth routes (public — no requireAuth)
// ---------------------------------------------------------------------------

app.post("/api/auth/register", loginLimiter, async (req, res) => {
  const email = validateEmail(req.body.email);
  const password = validatePassword(req.body.password);
  const code = requireString(req.body.inviteCode, "invite code", 20);

  const invite = db.prepare(
    "SELECT * FROM invite_codes WHERE code = ? AND used_by IS NULL AND expires_at > datetime('now')"
  ).get(code);
  if (!invite) throw new ValidationError("Invalid or expired invite code");

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) throw new ValidationError("Email already registered");
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const info = db.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)").run(email, hash);
  const userId = info.lastInsertRowid;

  db.prepare("UPDATE invite_codes SET used_by = ?, used_at = datetime('now') WHERE id = ?").run(userId, invite.id);

  logAccess("register", email, userId, req);
  res.json(issueToken(res, { id: userId, email, is_admin: 0 }));
});

app.post("/api/auth/login", loginLimiter, async (req, res) => {
  const email = validateEmail(req.body.email);
  const password = requireString(req.body.password, "password", 200);
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  logAccess("login", user.email, user.id, req);
  res.json(issueToken(res, { id: user.id, email: user.email, is_admin: user.is_admin }));
});

app.post("/api/auth/logout", (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      logAccess("logout", payload.email, payload.userId, req);
    } catch {}
  }
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.set("Clear-Site-Data", '"cookies", "storage"');
  res.json({ ok: true });
});

app.post("/api/auth/recover", loginLimiter, async (req, res) => {
  const recoveryToken = process.env.ADMIN_RECOVERY_TOKEN;
  if (!recoveryToken) return res.status(404).json({ error: "Recovery not enabled" });
  const token = requireString(req.body.token, "token", 200);
  if (token !== recoveryToken) return res.status(401).json({ error: "Invalid recovery token" });
  const email = validateEmail(req.body.email);
  const password = validatePassword(req.body.password);
  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
  if (!adminEmail || email.toLowerCase() !== adminEmail) {
    return res.status(403).json({ error: "Recovery is only available for the configured ADMIN_EMAIL" });
  }
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  let user = db.prepare("SELECT id FROM users WHERE email = ? COLLATE NOCASE").get(email);
  if (user) {
    db.prepare("UPDATE users SET password_hash = ?, is_admin = 1 WHERE id = ?").run(hash, user.id);
  } else {
    const info = db.prepare("INSERT INTO users (email, password_hash, is_admin) VALUES (?, ?, 1)").run(email, hash);
    user = { id: info.lastInsertRowid };
  }
  logAccess("password_reset_recovery", email, user.id, req);
  res.json({ ok: true });
});

app.get("/api/auth/me", (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare("SELECT id, email, is_admin FROM users WHERE id = ?").get(payload.userId);
    if (!user) { res.clearCookie(COOKIE_NAME); return res.status(401).json({ error: "User not found" }); }
    res.json(user);
  } catch {
    res.clearCookie(COOKIE_NAME);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
});

// ---------------------------------------------------------------------------
// All routes below require authentication
// ---------------------------------------------------------------------------

app.use("/api", requireAuth);

// ---------------------------------------------------------------------------
// Admin middleware & routes
// ---------------------------------------------------------------------------

function requireAdmin(req, res, next) {
  const user = db.prepare("SELECT is_admin FROM users WHERE id = ?").get(req.user.id);
  if (!user || !user.is_admin) return res.status(403).json({ error: "Admin access required" });
  next();
}

app.get("/api/admin/invite-codes", requireAdmin, (req, res) => {
  const codes = db.prepare(`
    SELECT ic.*, u1.email as created_by_email, u2.email as used_by_email
    FROM invite_codes ic
    JOIN users u1 ON u1.id = ic.created_by
    LEFT JOIN users u2 ON u2.id = ic.used_by
    ORDER BY ic.created_at DESC
  `).all();
  res.json(codes);
});

app.post("/api/admin/invite-codes", requireAdmin, (req, res) => {
  const code = generateInviteCode();
  const expiresAt = new Date(Date.now() + INVITE_CODE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString().replace("T", " ").slice(0, 19);
  db.prepare("INSERT INTO invite_codes (code, created_by, expires_at) VALUES (?, ?, ?)").run(code, req.user.id, expiresAt);
  res.json({ code, expires_at: expiresAt });
});

app.delete("/api/admin/invite-codes/:id", requireAdmin, (req, res) => {
  const id = requirePositiveInt(req.params.id, "id");
  const code = db.prepare("SELECT id FROM invite_codes WHERE id = ?").get(id);
  if (!code) return res.status(404).json({ error: "Invite code not found" });
  db.prepare("DELETE FROM invite_codes WHERE id = ?").run(id);
  res.json({ ok: true });
});

app.get("/api/admin/access-logs", requireAdmin, (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const logs = db.prepare("SELECT * FROM access_logs ORDER BY created_at DESC LIMIT ? OFFSET ?").all(limit, offset);
  const total = db.prepare("SELECT COUNT(*) as count FROM access_logs").get();
  res.json({ logs, total: total.count });
});

app.get("/api/admin/users", requireAdmin, (req, res) => {
  const users = db.prepare("SELECT id, email, is_admin, created_at FROM users ORDER BY created_at DESC").all();
  res.json(users);
});

app.post("/api/admin/reset-password", requireAdmin, async (req, res) => {
  const userId = requirePositiveInt(req.body.userId, "userId");
  const password = validatePassword(req.body.password);
  const user = db.prepare("SELECT id, email FROM users WHERE id = ?").get(userId);
  if (!user) throw new ValidationError("User not found");
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, userId);
  logAccess("password_reset_admin", user.email, req.user.id, req);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Exercises (preset exercises shared; custom scoped to user)
// ---------------------------------------------------------------------------

app.get("/api/exercises", (req, res) => {
  const rows = db.prepare("SELECT * FROM exercises WHERE user_id IS NULL OR user_id = ? ORDER BY name").all(req.user.id);
  res.json(rows);
});

app.post("/api/exercises", (req, res) => {
  const name = requireString(req.body.name, "name", 100);
  const category = requireEnum(req.body.category, VALID_CATEGORIES, "category");
  const existing = db.prepare("SELECT id FROM exercises WHERE name = ? AND (user_id IS NULL OR user_id = ?)").get(name, req.user.id);
  if (existing) return res.status(409).json({ error: "Exercise already exists" });
  const info = db.prepare("INSERT INTO exercises (name, category, is_custom, user_id) VALUES (?, ?, 1, ?)").run(name, category, req.user.id);
  res.json({ id: info.lastInsertRowid, name, category, is_custom: 1 });
});

// ---------------------------------------------------------------------------
// Sessions (scoped to user)
// ---------------------------------------------------------------------------

app.get("/api/sessions", (req, res) => {
  const rows = db.prepare(`
    SELECT s.*, COUNT(DISTINCT e.id) as exercise_count,
           SUM(CASE WHEN es.is_completed = 1 THEN es.weight * es.reps ELSE 0 END) as total_volume,
           SUM(CASE WHEN es.is_completed = 1 THEN 1 ELSE 0 END) as total_sets
    FROM workout_sessions s
    LEFT JOIN workout_entries e ON e.session_id = s.id
    LEFT JOIN exercise_sets es ON es.entry_id = e.id
    WHERE s.is_completed = 1 AND s.user_id = ?
    GROUP BY s.id ORDER BY s.date DESC
  `).all(req.user.id);
  res.json(rows);
});

app.post("/api/sessions", (req, res) => {
  const sessionName = req.body.name ? requireString(req.body.name, "name", 100) : "Workout";
  const templateId = req.body.templateId ? requirePositiveInt(req.body.templateId, "templateId") : null;

  if (templateId) {
    const tmpl = db.prepare("SELECT id FROM workout_templates WHERE id = ? AND user_id = ?").get(templateId, req.user.id);
    if (!tmpl) throw new ValidationError("Template not found");
  }

  const info = db.prepare("INSERT INTO workout_sessions (name, user_id) VALUES (?, ?)").run(sessionName, req.user.id);
  const sessionId = info.lastInsertRowid;

  if (templateId) {
    const templateExercises = db.prepare("SELECT exercise_id, order_num FROM template_exercises WHERE template_id = ? ORDER BY order_num").all(templateId);
    const insertEntry = db.prepare("INSERT INTO workout_entries (session_id, exercise_id, order_num) VALUES (?, ?, ?)");
    const insertSet = db.prepare("INSERT INTO exercise_sets (entry_id, set_number) VALUES (?, 1)");
    for (const te of templateExercises) {
      const entryInfo = insertEntry.run(sessionId, te.exercise_id, te.order_num);
      insertSet.run(entryInfo.lastInsertRowid);
    }
  }
  res.json(getFullSession(sessionId, req.user.id));
});

app.get("/api/sessions/:id", requireSessionOwner, (req, res) => {
  res.json(getFullSession(req.sessionId, req.user.id));
});

app.put("/api/sessions/:id", requireSessionOwner, (req, res) => {
  const id = req.sessionId;
  if (req.body.name !== undefined) {
    db.prepare("UPDATE workout_sessions SET name = ? WHERE id = ?").run(requireString(req.body.name, "name", 100), id);
  }
  if (req.body.duration !== undefined) {
    db.prepare("UPDATE workout_sessions SET duration = ? WHERE id = ?").run(optionalNumber(req.body.duration, "duration", 0, 86400), id);
  }
  if (req.body.is_completed !== undefined) {
    db.prepare("UPDATE workout_sessions SET is_completed = ? WHERE id = ?").run(req.body.is_completed ? 1 : 0, id);
  }
  res.json(getFullSession(id, req.user.id));
});

app.delete("/api/sessions/:id", requireSessionOwner, (req, res) => {
  db.prepare("DELETE FROM workout_sessions WHERE id = ?").run(req.sessionId);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Entries (ownership verified through session)
// ---------------------------------------------------------------------------

app.post("/api/sessions/:id/entries", requireSessionOwner, (req, res) => {
  const sessionId = req.sessionId;
  const { exerciseIds } = req.body;
  if (!Array.isArray(exerciseIds) || exerciseIds.length === 0 || exerciseIds.length > 50) {
    throw new ValidationError("exerciseIds must be a non-empty array (max 50)");
  }
  for (const exId of exerciseIds) requirePositiveInt(exId, "exerciseId");

  const maxOrder = db.prepare("SELECT COALESCE(MAX(order_num), -1) as m FROM workout_entries WHERE session_id = ?").get(sessionId);
  let order = (maxOrder?.m ?? -1) + 1;
  const insertEntry = db.prepare("INSERT INTO workout_entries (session_id, exercise_id, order_num) VALUES (?, ?, ?)");
  const insertSet = db.prepare("INSERT INTO exercise_sets (entry_id, set_number) VALUES (?, 1)");

  for (const exId of exerciseIds) {
    const exercise = db.prepare("SELECT id FROM exercises WHERE id = ? AND (user_id IS NULL OR user_id = ?)").get(exId, req.user.id);
    if (!exercise) throw new ValidationError(`Exercise ${exId} not found`);
    const entryInfo = insertEntry.run(sessionId, exId, order++);
    insertSet.run(entryInfo.lastInsertRowid);
  }
  res.json(getFullSession(sessionId, req.user.id));
});

app.put("/api/entries/:id", (req, res) => {
  const id = requirePositiveInt(req.params.id, "id");
  const entry = db.prepare(`
    SELECT we.id, we.session_id, ws.user_id FROM workout_entries we
    JOIN workout_sessions ws ON ws.id = we.session_id WHERE we.id = ?
  `).get(id);
  if (!entry) return res.status(404).json({ error: "Entry not found" });
  if (entry.user_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });

  if (req.body.max_heart_rate !== undefined) {
    const hr = req.body.max_heart_rate === null ? null : optionalNumber(req.body.max_heart_rate, "max_heart_rate", 30, 250);
    db.prepare("UPDATE workout_entries SET max_heart_rate = ? WHERE id = ?").run(hr ?? null, id);
  }
  res.json(getFullSession(entry.session_id, req.user.id));
});

app.delete("/api/entries/:id", (req, res) => {
  const id = requirePositiveInt(req.params.id, "id");
  const entry = db.prepare(`
    SELECT we.id, we.session_id, ws.user_id FROM workout_entries we
    JOIN workout_sessions ws ON ws.id = we.session_id WHERE we.id = ?
  `).get(id);
  if (!entry) return res.status(404).json({ error: "Entry not found" });
  if (entry.user_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });
  db.prepare("DELETE FROM workout_entries WHERE id = ?").run(id);
  res.json(getFullSession(entry.session_id, req.user.id));
});

// ---------------------------------------------------------------------------
// Sets (ownership verified through entry → session)
// ---------------------------------------------------------------------------

function getSetOwnership(setId) {
  return db.prepare(`
    SELECT es.id, we.session_id, ws.user_id FROM exercise_sets es
    JOIN workout_entries we ON we.id = es.entry_id
    JOIN workout_sessions ws ON ws.id = we.session_id WHERE es.id = ?
  `).get(setId);
}

app.post("/api/entries/:id/sets", (req, res) => {
  const entryId = requirePositiveInt(req.params.id, "entryId");
  const entry = db.prepare(`
    SELECT we.id, we.session_id, ws.user_id FROM workout_entries we
    JOIN workout_sessions ws ON ws.id = we.session_id WHERE we.id = ?
  `).get(entryId);
  if (!entry) return res.status(404).json({ error: "Entry not found" });
  if (entry.user_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });

  const lastSet = db.prepare("SELECT set_number, weight, reps, unit FROM exercise_sets WHERE entry_id = ? ORDER BY set_number DESC LIMIT 1").get(entryId);
  const nextNum = (lastSet?.set_number ?? 0) + 1;
  const w = lastSet?.weight ?? 0;
  const r = lastSet?.reps ?? 0;
  const u = lastSet?.unit ?? "lbs";
  db.prepare("INSERT INTO exercise_sets (entry_id, set_number, weight, reps, unit) VALUES (?, ?, ?, ?, ?)").run(entryId, nextNum, w, r, u);
  res.json(getFullSession(entry.session_id, req.user.id));
});

app.put("/api/sets/:id", (req, res) => {
  const id = requirePositiveInt(req.params.id, "id");
  const setRow = getSetOwnership(id);
  if (!setRow) return res.status(404).json({ error: "Set not found" });
  if (setRow.user_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });

  if (req.body.reps !== undefined) {
    const reps = requireInt(req.body.reps, "reps");
    if (reps < 0 || reps > 9999) throw new ValidationError("reps must be between 0 and 9999");
    db.prepare("UPDATE exercise_sets SET reps = ? WHERE id = ?").run(reps, id);
  }
  if (req.body.weight !== undefined) {
    db.prepare("UPDATE exercise_sets SET weight = ? WHERE id = ?").run(optionalNumber(req.body.weight, "weight", 0, 99999), id);
  }
  if (req.body.unit !== undefined) {
    db.prepare("UPDATE exercise_sets SET unit = ? WHERE id = ?").run(requireEnum(req.body.unit, VALID_UNITS, "unit"), id);
  }
  if (req.body.is_completed !== undefined) {
    db.prepare("UPDATE exercise_sets SET is_completed = ? WHERE id = ?").run(req.body.is_completed ? 1 : 0, id);
  }
  res.json(getFullSession(setRow.session_id, req.user.id));
});

app.delete("/api/sets/:id", (req, res) => {
  const id = requirePositiveInt(req.params.id, "id");
  const setRow = getSetOwnership(id);
  if (!setRow) return res.status(404).json({ error: "Set not found" });
  if (setRow.user_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });
  db.prepare("DELETE FROM exercise_sets WHERE id = ?").run(id);
  res.json(getFullSession(setRow.session_id, req.user.id));
});

// ---------------------------------------------------------------------------
// Templates (scoped to user)
// ---------------------------------------------------------------------------

app.get("/api/templates", (req, res) => {
  const templates = db.prepare("SELECT * FROM workout_templates WHERE user_id = ? ORDER BY name").all(req.user.id);
  for (const t of templates) {
    t.exercises = db.prepare(`
      SELECT e.* FROM template_exercises te JOIN exercises e ON e.id = te.exercise_id
      WHERE te.template_id = ? ORDER BY te.order_num
    `).all(t.id);
  }
  res.json(templates);
});

app.post("/api/templates", (req, res) => {
  const name = requireString(req.body.name, "name", 100);
  const { exerciseIds } = req.body;
  if (!Array.isArray(exerciseIds) || exerciseIds.length === 0 || exerciseIds.length > 50) {
    throw new ValidationError("exerciseIds must be a non-empty array (max 50)");
  }
  for (const exId of exerciseIds) {
    requirePositiveInt(exId, "exerciseId");
    const exercise = db.prepare("SELECT id FROM exercises WHERE id = ? AND (user_id IS NULL OR user_id = ?)").get(exId, req.user.id);
    if (!exercise) throw new ValidationError(`Exercise ${exId} not found`);
  }
  const info = db.prepare("INSERT INTO workout_templates (name, user_id) VALUES (?, ?)").run(name, req.user.id);
  const templateId = info.lastInsertRowid;
  const insert = db.prepare("INSERT INTO template_exercises (template_id, exercise_id, order_num) VALUES (?, ?, ?)");
  exerciseIds.forEach((exId, i) => insert.run(templateId, exId, i));
  res.json({ id: templateId, name, exercises: [] });
});

app.delete("/api/templates/:id", (req, res) => {
  const id = requirePositiveInt(req.params.id, "id");
  const tmpl = db.prepare("SELECT id FROM workout_templates WHERE id = ? AND user_id = ?").get(id, req.user.id);
  if (!tmpl) return res.status(404).json({ error: "Template not found" });
  db.prepare("DELETE FROM workout_templates WHERE id = ?").run(id);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFullSession(id, userId) {
  const session = db.prepare("SELECT * FROM workout_sessions WHERE id = ? AND user_id = ?").get(id, userId);
  if (!session) return null;
  session.entries = db.prepare(`
    SELECT we.*, e.name as exercise_name, e.category as exercise_category
    FROM workout_entries we JOIN exercises e ON e.id = we.exercise_id
    WHERE we.session_id = ? ORDER BY we.order_num
  `).all(id);
  for (const entry of session.entries) {
    entry.sets = db.prepare("SELECT * FROM exercise_sets WHERE entry_id = ? ORDER BY set_number").all(entry.id);
  }
  return session;
}

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------

app.use((err, _req, res, _next) => {
  if (err instanceof ValidationError) return res.status(err.status).json({ error: err.message });
  if (!IS_PROD) console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

for (const layer of app._router.stack) {
  if (layer.route) {
    for (const routeLayer of layer.route.stack) {
      const original = routeLayer.handle;
      if (original.length < 4) {
        routeLayer.handle = function (req, res, next) {
          try {
            const result = original(req, res, next);
            if (result && typeof result.catch === "function") result.catch(next);
          } catch (err) { next(err); }
        };
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Static files (production)
// ---------------------------------------------------------------------------

if (IS_PROD) {
  app.use(express.static(path.join(__dirname, "..", "dist")));
  app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "..", "dist", "index.html")));
}

app.listen(PORT, () => { if (!IS_PROD) console.log(`GymTracker API running on http://localhost:${PORT}`); });
