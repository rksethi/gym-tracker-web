const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { seedExercises } = require("./seed");

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === "production";

// ---------------------------------------------------------------------------
// Security middleware (T35, T66, T166, T36)
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
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    frameguard: { action: "deny" },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

// Rate limiting on API routes (T1362)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api", apiLimiter);

// Body size limit (T536)
app.use(express.json({ limit: "1mb" }));

// Content-Type enforcement for mutations — mitigates CSRF on JSON APIs (T29)
app.use((req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) && req.path.startsWith("/api")) {
    const ct = req.headers["content-type"] || "";
    if (req.method !== "DELETE" && !ct.includes("application/json")) {
      return res.status(415).json({ error: "Content-Type must be application/json" });
    }
  }
  next();
});

// ---------------------------------------------------------------------------
// Validation helpers (T42, T17)
// ---------------------------------------------------------------------------

const VALID_CATEGORIES = ["push", "pull", "legs", "shoulders", "arms", "core", "cardio", "fullBody"];
const VALID_UNITS = ["kg", "lbs"];

function requireInt(val, fieldName) {
  const n = Number(val);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new ValidationError(`${fieldName} must be an integer`);
  }
  return n;
}

function requirePositiveInt(val, fieldName) {
  const n = requireInt(val, fieldName);
  if (n <= 0) throw new ValidationError(`${fieldName} must be a positive integer`);
  return n;
}

function requireString(val, fieldName, maxLen = 200) {
  if (typeof val !== "string" || val.trim().length === 0) {
    throw new ValidationError(`${fieldName} is required`);
  }
  if (val.trim().length > maxLen) {
    throw new ValidationError(`${fieldName} must be at most ${maxLen} characters`);
  }
  return val.trim();
}

function requireEnum(val, allowed, fieldName) {
  if (!allowed.includes(val)) {
    throw new ValidationError(`${fieldName} must be one of: ${allowed.join(", ")}`);
  }
  return val;
}

function optionalNumber(val, fieldName, min = 0, max = 100000) {
  if (val === undefined || val === null) return undefined;
  const n = Number(val);
  if (!Number.isFinite(n)) throw new ValidationError(`${fieldName} must be a number`);
  if (n < min || n > max) throw new ValidationError(`${fieldName} must be between ${min} and ${max}`);
  return n;
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.status = 400;
  }
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

const db = new Database(path.join(__dirname, "gymtracker.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    is_custom INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS workout_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL DEFAULT (datetime('now')),
    duration INTEGER NOT NULL DEFAULT 0,
    is_completed INTEGER NOT NULL DEFAULT 0
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
    name TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS template_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id),
    order_num INTEGER NOT NULL
  );
`);

seedExercises(db);

// ---------------------------------------------------------------------------
// Exercises
// ---------------------------------------------------------------------------

app.get("/api/exercises", (_req, res) => {
  const rows = db.prepare("SELECT * FROM exercises ORDER BY name").all();
  res.json(rows);
});

app.post("/api/exercises", (req, res) => {
  const name = requireString(req.body.name, "name", 100);
  const category = requireEnum(req.body.category, VALID_CATEGORIES, "category");
  try {
    const info = db
      .prepare("INSERT INTO exercises (name, category, is_custom) VALUES (?, ?, 1)")
      .run(name, category);
    res.json({ id: info.lastInsertRowid, name, category, is_custom: 1 });
  } catch {
    res.status(409).json({ error: "Exercise already exists" });
  }
});

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

app.get("/api/sessions", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT s.*, COUNT(DISTINCT e.id) as exercise_count,
              SUM(CASE WHEN es.is_completed = 1 THEN es.weight * es.reps ELSE 0 END) as total_volume,
              SUM(CASE WHEN es.is_completed = 1 THEN 1 ELSE 0 END) as total_sets
       FROM workout_sessions s
       LEFT JOIN workout_entries e ON e.session_id = s.id
       LEFT JOIN exercise_sets es ON es.entry_id = e.id
       WHERE s.is_completed = 1
       GROUP BY s.id
       ORDER BY s.date DESC`
    )
    .all();
  res.json(rows);
});

app.post("/api/sessions", (req, res) => {
  const sessionName = req.body.name ? requireString(req.body.name, "name", 100) : "Workout";
  const templateId = req.body.templateId ? requirePositiveInt(req.body.templateId, "templateId") : null;

  const info = db.prepare("INSERT INTO workout_sessions (name) VALUES (?)").run(sessionName);
  const sessionId = info.lastInsertRowid;

  if (templateId) {
    const tmpl = db.prepare("SELECT id FROM workout_templates WHERE id = ?").get(templateId);
    if (!tmpl) throw new ValidationError("Template not found");

    const templateExercises = db
      .prepare("SELECT exercise_id, order_num FROM template_exercises WHERE template_id = ? ORDER BY order_num")
      .all(templateId);
    const insertEntry = db.prepare("INSERT INTO workout_entries (session_id, exercise_id, order_num) VALUES (?, ?, ?)");
    const insertSet = db.prepare("INSERT INTO exercise_sets (entry_id, set_number) VALUES (?, 1)");
    for (const te of templateExercises) {
      const entryInfo = insertEntry.run(sessionId, te.exercise_id, te.order_num);
      insertSet.run(entryInfo.lastInsertRowid);
    }
  }

  res.json(getFullSession(sessionId));
});

app.get("/api/sessions/:id", (req, res) => {
  const id = requirePositiveInt(req.params.id, "id");
  const session = getFullSession(id);
  if (!session) return res.status(404).json({ error: "Session not found" });
  res.json(session);
});

app.put("/api/sessions/:id", (req, res) => {
  const id = requirePositiveInt(req.params.id, "id");
  const existing = db.prepare("SELECT id FROM workout_sessions WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "Session not found" });

  if (req.body.name !== undefined) {
    const name = requireString(req.body.name, "name", 100);
    db.prepare("UPDATE workout_sessions SET name = ? WHERE id = ?").run(name, id);
  }
  if (req.body.duration !== undefined) {
    const duration = optionalNumber(req.body.duration, "duration", 0, 86400);
    db.prepare("UPDATE workout_sessions SET duration = ? WHERE id = ?").run(duration, id);
  }
  if (req.body.is_completed !== undefined) {
    db.prepare("UPDATE workout_sessions SET is_completed = ? WHERE id = ?").run(req.body.is_completed ? 1 : 0, id);
  }
  res.json(getFullSession(id));
});

app.delete("/api/sessions/:id", (req, res) => {
  const id = requirePositiveInt(req.params.id, "id");
  db.prepare("DELETE FROM workout_sessions WHERE id = ?").run(id);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Entries
// ---------------------------------------------------------------------------

app.post("/api/sessions/:id/entries", (req, res) => {
  const sessionId = requirePositiveInt(req.params.id, "sessionId");
  const { exerciseIds } = req.body;
  if (!Array.isArray(exerciseIds) || exerciseIds.length === 0 || exerciseIds.length > 50) {
    throw new ValidationError("exerciseIds must be a non-empty array (max 50)");
  }
  for (const exId of exerciseIds) requirePositiveInt(exId, "exerciseId");

  const session = db.prepare("SELECT id FROM workout_sessions WHERE id = ?").get(sessionId);
  if (!session) return res.status(404).json({ error: "Session not found" });

  const maxOrder = db
    .prepare("SELECT COALESCE(MAX(order_num), -1) as m FROM workout_entries WHERE session_id = ?")
    .get(sessionId);
  let order = (maxOrder?.m ?? -1) + 1;

  const insertEntry = db.prepare("INSERT INTO workout_entries (session_id, exercise_id, order_num) VALUES (?, ?, ?)");
  const insertSet = db.prepare("INSERT INTO exercise_sets (entry_id, set_number) VALUES (?, 1)");

  for (const exId of exerciseIds) {
    const exercise = db.prepare("SELECT id FROM exercises WHERE id = ?").get(exId);
    if (!exercise) throw new ValidationError(`Exercise ${exId} not found`);
    const entryInfo = insertEntry.run(sessionId, exId, order++);
    insertSet.run(entryInfo.lastInsertRowid);
  }

  res.json(getFullSession(sessionId));
});

app.put("/api/entries/:id", (req, res) => {
  const id = requirePositiveInt(req.params.id, "id");
  const entry = db.prepare("SELECT session_id FROM workout_entries WHERE id = ?").get(id);
  if (!entry) return res.status(404).json({ error: "Entry not found" });

  if (req.body.max_heart_rate !== undefined) {
    const hr = req.body.max_heart_rate === null ? null : optionalNumber(req.body.max_heart_rate, "max_heart_rate", 30, 250);
    db.prepare("UPDATE workout_entries SET max_heart_rate = ? WHERE id = ?").run(hr ?? null, id);
  }
  res.json(getFullSession(entry.session_id));
});

app.delete("/api/entries/:id", (req, res) => {
  const id = requirePositiveInt(req.params.id, "id");
  const entry = db.prepare("SELECT session_id FROM workout_entries WHERE id = ?").get(id);
  if (!entry) return res.status(404).json({ error: "Entry not found" });
  db.prepare("DELETE FROM workout_entries WHERE id = ?").run(id);
  res.json(getFullSession(entry.session_id));
});

// ---------------------------------------------------------------------------
// Sets
// ---------------------------------------------------------------------------

app.post("/api/entries/:id/sets", (req, res) => {
  const entryId = requirePositiveInt(req.params.id, "entryId");
  const entry = db.prepare("SELECT session_id FROM workout_entries WHERE id = ?").get(entryId);
  if (!entry) return res.status(404).json({ error: "Entry not found" });

  const maxSet = db.prepare("SELECT COALESCE(MAX(set_number), 0) as m FROM exercise_sets WHERE entry_id = ?").get(entryId);
  db.prepare("INSERT INTO exercise_sets (entry_id, set_number) VALUES (?, ?)").run(entryId, (maxSet?.m ?? 0) + 1);
  res.json(getFullSession(entry.session_id));
});

app.put("/api/sets/:id", (req, res) => {
  const id = requirePositiveInt(req.params.id, "id");
  const setRow = db
    .prepare("SELECT es.id, we.session_id FROM exercise_sets es JOIN workout_entries we ON we.id = es.entry_id WHERE es.id = ?")
    .get(id);
  if (!setRow) return res.status(404).json({ error: "Set not found" });

  if (req.body.reps !== undefined) {
    const reps = requireInt(req.body.reps, "reps");
    if (reps < 0 || reps > 9999) throw new ValidationError("reps must be between 0 and 9999");
    db.prepare("UPDATE exercise_sets SET reps = ? WHERE id = ?").run(reps, id);
  }
  if (req.body.weight !== undefined) {
    const weight = optionalNumber(req.body.weight, "weight", 0, 99999);
    db.prepare("UPDATE exercise_sets SET weight = ? WHERE id = ?").run(weight, id);
  }
  if (req.body.unit !== undefined) {
    const unit = requireEnum(req.body.unit, VALID_UNITS, "unit");
    db.prepare("UPDATE exercise_sets SET unit = ? WHERE id = ?").run(unit, id);
  }
  if (req.body.is_completed !== undefined) {
    db.prepare("UPDATE exercise_sets SET is_completed = ? WHERE id = ?").run(req.body.is_completed ? 1 : 0, id);
  }

  res.json(getFullSession(setRow.session_id));
});

app.delete("/api/sets/:id", (req, res) => {
  const id = requirePositiveInt(req.params.id, "id");
  const setRow = db
    .prepare("SELECT we.session_id FROM exercise_sets es JOIN workout_entries we ON we.id = es.entry_id WHERE es.id = ?")
    .get(id);
  if (!setRow) return res.status(404).json({ error: "Set not found" });
  db.prepare("DELETE FROM exercise_sets WHERE id = ?").run(id);
  res.json(getFullSession(setRow.session_id));
});

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

app.get("/api/templates", (_req, res) => {
  const templates = db.prepare("SELECT * FROM workout_templates ORDER BY name").all();
  for (const t of templates) {
    t.exercises = db
      .prepare(
        `SELECT e.* FROM template_exercises te
         JOIN exercises e ON e.id = te.exercise_id
         WHERE te.template_id = ?
         ORDER BY te.order_num`
      )
      .all(t.id);
  }
  res.json(templates);
});

app.post("/api/templates", (req, res) => {
  const name = requireString(req.body.name, "name", 100);
  const { exerciseIds } = req.body;
  if (!Array.isArray(exerciseIds) || exerciseIds.length === 0 || exerciseIds.length > 50) {
    throw new ValidationError("exerciseIds must be a non-empty array (max 50)");
  }
  for (const exId of exerciseIds) requirePositiveInt(exId, "exerciseId");

  const info = db.prepare("INSERT INTO workout_templates (name) VALUES (?)").run(name);
  const templateId = info.lastInsertRowid;
  const insert = db.prepare("INSERT INTO template_exercises (template_id, exercise_id, order_num) VALUES (?, ?, ?)");
  exerciseIds.forEach((exId, i) => insert.run(templateId, exId, i));
  res.json({ id: templateId, name, exercises: [] });
});

app.delete("/api/templates/:id", (req, res) => {
  const id = requirePositiveInt(req.params.id, "id");
  db.prepare("DELETE FROM workout_templates WHERE id = ?").run(id);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFullSession(id) {
  const session = db.prepare("SELECT * FROM workout_sessions WHERE id = ?").get(id);
  if (!session) return null;

  session.entries = db
    .prepare(
      `SELECT we.*, e.name as exercise_name, e.category as exercise_category
       FROM workout_entries we
       JOIN exercises e ON e.id = we.exercise_id
       WHERE we.session_id = ?
       ORDER BY we.order_num`
    )
    .all(id);

  for (const entry of session.entries) {
    entry.sets = db.prepare("SELECT * FROM exercise_sets WHERE entry_id = ? ORDER BY set_number").all(entry.id);
  }

  return session;
}

// ---------------------------------------------------------------------------
// Global error handler — sanitizes error output in production (T2139, T49)
// ---------------------------------------------------------------------------

app.use((err, _req, res, _next) => {
  if (err instanceof ValidationError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (!IS_PROD) {
    console.error(err);
  }
  res.status(500).json({ error: "Internal server error" });
});

// Wrap all route handlers to catch sync errors and forward to error handler
for (const layer of app._router.stack) {
  if (layer.route) {
    for (const routeLayer of layer.route.stack) {
      const original = routeLayer.handle;
      routeLayer.handle = function (req, res, next) {
        try {
          const result = original(req, res, next);
          if (result && typeof result.catch === "function") {
            result.catch(next);
          }
        } catch (err) {
          next(err);
        }
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Static files (production)
// ---------------------------------------------------------------------------

if (IS_PROD) {
  app.use(express.static(path.join(__dirname, "..", "dist")));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
  });
}

app.listen(PORT, () => {
  if (!IS_PROD) {
    console.log(`GymTracker API running on http://localhost:${PORT}`);
  }
});
