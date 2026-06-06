import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { and, asc, eq } from "drizzle-orm";
import { attendants } from "../src/db/schema";
import type { Attendant, AttendantFormValues, AvailabilityStatus } from "../src/domain/types";
import { db } from "./api/db";
import { isAuthorized, readJson, requireText, setCorsHeaders, writeJson } from "./api/http";

const host = process.env.C3BOT_API_HOST ?? "127.0.0.1";
const port = Number(process.env.C3BOT_API_PORT ?? 3922);

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
  console.log(`C3Bot API listening at http://${host}:${port}`);
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
