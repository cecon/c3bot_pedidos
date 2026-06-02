import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { existsSync, mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { and, asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import type { AsyncRemoteCallback } from "drizzle-orm/sqlite-proxy";
import * as schema from "../src/db/schema";
import { attendants } from "../src/db/schema";
import type { Attendant, AttendantFormValues, AvailabilityStatus } from "../src/domain/types";
import { applyMigrations } from "./migrations";

const host = process.env.C3BOT_API_HOST ?? "127.0.0.1";
const port = Number(process.env.C3BOT_API_PORT ?? 3922);
const databasePath = path.resolve(process.env.C3BOT_DB_PATH ?? getDefaultDatabasePath());
const allowedOrigin = process.env.C3BOT_API_ALLOWED_ORIGIN ?? "*";
const apiToken = process.env.C3BOT_API_TOKEN;
const maxBodyBytes = Number(process.env.C3BOT_API_MAX_BODY_BYTES ?? 1_500_000);

if (path.dirname(databasePath) !== "." && !existsSync(path.dirname(databasePath))) {
  mkdirSync(path.dirname(databasePath), { recursive: true });
}

const sqlite = new DatabaseSync(databasePath);
sqlite.exec("PRAGMA foreign_keys = ON");
applyMigrations(sqlite, "dev-api");

const db = drizzle(createNodeSqliteProxy(sqlite), { schema });

const server = createServer(async (request, response) => {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.writeHead(204).end();
    return;
  }

  if (!isAuthorized(request)) {
    writeJson(response, 401, { message: "Unauthorized" });
    return;
  }

  try {
    await routeRequest(request, response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno.";
    writeJson(response, 500, { message });
  }
});

server.listen(port, host, () => {
  console.log(`C3Bot attendant API listening at http://${host}:${port}`);
});

async function routeRequest(request: IncomingMessage, response: ServerResponse) {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? `${host}:${port}`}`);
  const attendantId = matchAttendantId(url.pathname);

  if (request.method === "GET" && url.pathname === "/api/health") {
    writeJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/attendants") {
    const rows = await db.select().from(attendants).where(eq(attendants.active, true)).orderBy(asc(attendants.displayName));
    writeJson(response, 200, rows.map(mapAttendantRecord));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/attendants") {
    const attendant = normalizeNewAttendant(await readJson<Partial<Attendant>>(request));
    await db.insert(attendants).values(attendant);
    writeJson(response, 201, mapAttendantRecord(attendant));
    return;
  }

  if (request.method === "PATCH" && attendantId && url.pathname.endsWith("/availability")) {
    const body = await readJson<{ availabilityStatus?: AvailabilityStatus; updatedAt?: string }>(request);
    const updatedAt = body.updatedAt ?? new Date().toISOString();
    await db
      .update(attendants)
      .set({ availabilityStatus: body.availabilityStatus === "online" ? "online" : "offline", updatedAt })
      .where(and(eq(attendants.id, attendantId), eq(attendants.active, true)));
    writeJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "PATCH" && attendantId) {
    const body = await readJson<AttendantFormValues & { updatedAt?: string }>(request);
    await db
      .update(attendants)
      .set({
        displayName: requireText(body.displayName, "displayName"),
        name: requireText(body.name, "name"),
        photoBase64: body.photoBase64 ?? null,
        updatedAt: body.updatedAt ?? new Date().toISOString(),
        whatsappNumber: requireText(body.whatsappNumber, "whatsappNumber"),
      })
      .where(and(eq(attendants.id, attendantId), eq(attendants.active, true)));
    writeJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "DELETE" && attendantId) {
    const body = await readJson<{ updatedAt?: string }>(request, true);
    await db
      .update(attendants)
      .set({ active: false, availabilityStatus: "offline", updatedAt: body.updatedAt ?? new Date().toISOString() })
      .where(eq(attendants.id, attendantId));
    writeJson(response, 200, { ok: true });
    return;
  }

  writeJson(response, 404, { message: "Not found" });
}

function createNodeSqliteProxy(database: DatabaseSync): AsyncRemoteCallback {
  return async (sql, params, method) => {
    const statement = database.prepare(sql);
    const values = params.map((value) => (typeof value === "boolean" ? Number(value) : value));

    if (method === "run") {
      statement.run(...values);
      return { rows: [] };
    }

    const rows = method === "get" ? [statement.get(...values)].filter(Boolean) : statement.all(...values);
    const mappedRows = rows.map((row) => (row && typeof row === "object" ? Object.values(row) : [row]));
    return { rows: method === "get" ? (mappedRows[0] ?? undefined) : mappedRows };
  };
}

function normalizeNewAttendant(payload: Partial<Attendant>): Attendant {
  const now = new Date().toISOString();
  return {
    active: true,
    availabilityStatus: "offline",
    createdAt: payload.createdAt ?? now,
    displayName: requireText(payload.displayName, "displayName"),
    id: requireText(payload.id, "id"),
    name: requireText(payload.name, "name"),
    photoBase64: payload.photoBase64 || undefined,
    role: "attendant",
    updatedAt: payload.updatedAt ?? now,
    whatsappNumber: requireText(payload.whatsappNumber, "whatsappNumber"),
  };
}

function mapAttendantRecord(record: typeof attendants.$inferSelect): Attendant {
  return { ...record, photoBase64: record.photoBase64 ?? undefined };
}

function matchAttendantId(pathname: string): string | undefined {
  const match = /^\/api\/attendants\/([^/]+)(?:\/availability)?$/.exec(pathname);
  return match ? decodeURIComponent(match[1]) : undefined;
}

function requireText(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`Campo obrigatorio: ${field}`);
  return value.trim();
}

async function readJson<T>(request: IncomingMessage, optional = false): Promise<T> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.byteLength;
    if (size > maxBodyBytes) throw new Error("Payload muito grande.");
    chunks.push(buffer);
  }

  if (chunks.length === 0 && optional) return {} as T;
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T;
}

function isAuthorized(request: IncomingMessage): boolean {
  if (!apiToken) return true;
  return request.headers.authorization === `Bearer ${apiToken}`;
}

function setCorsHeaders(response: ServerResponse) {
  response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
}

function writeJson(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function getDefaultDatabasePath(): string {
  if (process.platform === "win32") {
    return path.join(process.env.APPDATA ?? os.homedir(), "br.com.c3bot.app", "c3bot.db");
  }
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "br.com.c3bot.app", "c3bot.db");
  }
  return path.join(process.env.XDG_DATA_HOME ?? path.join(os.homedir(), ".local", "share"), "br.com.c3bot.app", "c3bot.db");
}
