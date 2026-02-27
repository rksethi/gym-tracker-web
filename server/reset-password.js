#!/usr/bin/env node
const path = require("path");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const readline = require("readline");

const db = new Database(path.join(__dirname, "gymtracker.db"));
const SALT_ROUNDS = 12;

const email = process.argv[2];
if (!email) {
  console.error("Usage: node server/reset-password.js <email>");
  process.exit(1);
}

const user = db.prepare("SELECT id, email FROM users WHERE email = ? COLLATE NOCASE").get(email);
if (!user) {
  console.error(`No user found with email: ${email}`);
  process.exit(1);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question(`New password for ${user.email}: `, async (password) => {
  rl.close();
  if (password.length < 8) {
    console.error("Password must be at least 8 characters");
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, user.id);
  console.log(`Password updated for ${user.email}`);
});
