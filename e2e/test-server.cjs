/**
 * Launches the app server with a fresh test database for E2E tests.
 * - Builds the Vite client into dist/
 * - Creates a temporary SQLite DB with a seeded test user + invite code
 * - Starts the Express server in production mode on port 3001
 */
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const ROOT = path.resolve(__dirname, "..");
const DB_PATH = path.join(ROOT, "e2e", "test.db");

// Clean previous test DB
for (const ext of ["", "-shm", "-wal", "-journal"]) {
  const f = DB_PATH + ext;
  if (fs.existsSync(f)) fs.unlinkSync(f);
}

// Build client
console.log("Building client...");
execSync("npx vite build", { cwd: ROOT, stdio: "inherit" });

// Set env and start server
process.env.DATABASE_PATH = DB_PATH;
process.env.NODE_ENV = "production";
process.env.JWT_SECRET = "e2e-test-secret";
process.env.PORT = "3001";
process.env.ADMIN_EMAIL = "admin@test.com";
process.env.DISABLE_RATE_LIMIT = "1";

// Load the server (this seeds exercises via seedExercises)
require("../server/index.js");

// Now seed test data directly into the DB
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");

const db = new Database(DB_PATH);

const hash = bcrypt.hashSync("Test1234", 4); // fast rounds for tests

// Create admin user
db.prepare("INSERT OR IGNORE INTO users (email, password_hash, is_admin) VALUES (?, ?, 1)").run("admin@test.com", hash);
const adminUser = db.prepare("SELECT id FROM users WHERE email = ?").get("admin@test.com");

// Create regular user
db.prepare("INSERT OR IGNORE INTO users (email, password_hash, is_admin) VALUES (?, ?, 0)").run("user@test.com", hash);

// Create an active invite code for registration tests
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().replace("T", " ").slice(0, 19);
db.prepare("INSERT OR IGNORE INTO invite_codes (code, created_by, expires_at) VALUES (?, ?, ?)").run("TESTCODE", adminUser.id, expiresAt);
db.prepare("INSERT OR IGNORE INTO invite_codes (code, created_by, expires_at) VALUES (?, ?, ?)").run("TESTCOD2", adminUser.id, expiresAt);

db.close();

console.log("Test server ready with seeded data on port 3001");
