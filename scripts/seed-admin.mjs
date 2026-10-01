#!/usr/bin/env node

import { mkdir, readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import crypto from "node:crypto";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { PGlite } from "@electric-sql/pglite";
import { hashPassword } from "better-auth/crypto";

import { pendingMigrations } from "./migration-plan.mjs";

const projectRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
);

const dataDir = join(projectRoot, ".data");
const databaseDir = join(dataDir, "relay-desk-pglite");
const migrationsDir = join(projectRoot, "migrations");

function now() {
  return new Date();
}

function createId() {
  return crypto.randomUUID();
}

async function readPassword(question) {
  return new Promise((resolvePassword) => {
    const rl = readline.createInterface({
      input,
      output,
      terminal: true,
    });

    output.write(question);

    const stdin = process.stdin;

    if (!stdin.isTTY) {
      rl.question("").then((answer) => {
        rl.close();
        resolvePassword(answer);
      });
      return;
    }

    stdin.setRawMode(true);

    let password = "";

    const onData = (chunk) => {
      const char = chunk.toString();

      if (char === "\r" || char === "\n") {
        output.write("\n");
        cleanup();
        resolvePassword(password);
        return;
      }

      if (char === "\u0003") {
        cleanup();
        process.exit(130);
      }

      if (char === "\u007f") {
        if (password.length > 0) {
          password = password.slice(0, -1);
          output.write("\b \b");
        }
        return;
      }

      password += char;
      output.write("*");
    };

    function cleanup() {
      stdin.removeListener("data", onData);
      stdin.setRawMode(false);
      rl.close();
    }

    stdin.on("data", onData);
  });
}

async function applyMigrations(pg) {
  await pg.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const entries = await readdir(migrationsDir);
  const sqlFiles = entries.filter((name) => name.endsWith(".sql"));

  const appliedRows = await pg.query(
    "SELECT name FROM _migrations",
  );

  const applied = appliedRows.rows.map((row) => row.name);

  const pending = pendingMigrations(sqlFiles, applied);

  for (const { name, path } of pending) {
    const sql = await readFile(join(migrationsDir, name), "utf8");

    await pg.transaction(async (tx) => {
      await tx.exec(sql);
      await tx.query(
        "INSERT INTO _migrations (name) VALUES ($1)",
        [name],
      );
    });

    console.log(`[seed-admin] applied migration: ${name}`);
  }
}

async function main() {
  await mkdir(dataDir, { recursive: true });

  const pg = new PGlite(databaseDir);

  try {
    await pg.waitReady;
    await applyMigrations(pg);

    const rl = readline.createInterface({
      input,
      output,
    });

    const name = (
      await rl.question("Admin name: ")
    ).trim();

    const email = (
      await rl.question("Admin email: ")
    ).trim().toLowerCase();

    rl.close();

    const password = await readPassword(
      "Admin password: ",
    );

    if (!name) {
      throw new Error("Admin name cannot be empty.");
    }

    if (!email) {
      throw new Error("Admin email cannot be empty.");
    }

    if (!email.includes("@")) {
      throw new Error("Please enter a valid email address.");
    }

    if (password.length < 8) {
      throw new Error(
        "Password must be at least 8 characters.",
      );
    }

    const existingUsers = await pg.query(
      `SELECT
        "id",
        "name",
        "email"
      FROM "user"
      WHERE lower("email") = $1
      LIMIT 1`,
      [email],
    );

    let userId;

    if (existingUsers.rows.length > 0) {
      userId = existingUsers.rows[0].id;

      await pg.query(
        `UPDATE "user"
         SET
           "name" = $1,
           "role" = 'admin',
           "banned" = false,
           "banReason" = NULL,
           "banExpires" = NULL,
           "updatedAt" = $2
         WHERE "id" = $3`,
        [name, now(), userId],
      );

      console.log(
        `[seed-admin] existing user found: ${email}`,
      );
    } else {
      userId = createId();

      await pg.query(
        `INSERT INTO "user" (
          "id",
          "name",
          "email",
          "emailVerified",
          "image",
          "createdAt",
          "updatedAt",
          "role",
          "banned"
        )
        VALUES (
          $1,
          $2,
          $3,
          false,
          NULL,
          $4,
          $5,
          'admin',
          false
        )`,
        [userId, name, email, now(), now()],
      );

      console.log(
        `[seed-admin] created new admin user: ${email}`,
      );
    }

    const passwordHash = await hashPassword(password);

    const existingAccounts = await pg.query(
      `SELECT "id"
       FROM "account"
       WHERE "userId" = $1
         AND "providerId" = 'credential'
       LIMIT 1`,
      [userId],
    );

    if (existingAccounts.rows.length > 0) {
      await pg.query(
        `UPDATE "account"
         SET
           "password" = $1,
           "updatedAt" = $2
         WHERE "id" = $3`,
        [
          passwordHash,
          now(),
          existingAccounts.rows[0].id,
        ],
      );

      console.log(
        "[seed-admin] credential password updated.",
      );
    } else {
      await pg.query(
        `INSERT INTO "account" (
          "id",
          "accountId",
          "providerId",
          "userId",
          "accessToken",
          "refreshToken",
          "idToken",
          "accessTokenExpiresAt",
          "refreshTokenExpiresAt",
          "scope",
          "password",
          "createdAt",
          "updatedAt"
        )
        VALUES (
          $1,
          $2,
          'credential',
          $3,
          NULL,
          NULL,
          NULL,
          NULL,
          NULL,
          NULL,
          $4,
          $5,
          $6
        )`,
        [
          createId(),
          userId,
          userId,
          passwordHash,
          now(),
          now(),
        ],
      );

      console.log(
        "[seed-admin] credential account created.",
      );
    }

    console.log("");
    console.log("======================================");
    console.log(" ADMIN SEED COMPLETED");
    console.log("======================================");
    console.log(`Email: ${email}`);
    console.log("Role:  admin");
    console.log("======================================");
    console.log("");
  } finally {
    await pg.close();
  }
}

main().catch((error) => {
  console.error("");
  console.error("[seed-admin] FAILED");
  console.error(error?.message || error);
  process.exit(1);
});