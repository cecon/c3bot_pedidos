import type { IncomingMessage, ServerResponse } from "node:http";

// Shared HTTP helpers for the dev API (CORS, auth, JSON read/write, body limit), extracted
// from attendant-api.ts so route modules reuse identical behavior.

export const allowedOrigin = process.env.C3BOT_API_ALLOWED_ORIGIN ?? "*";
const apiToken = process.env.C3BOT_API_TOKEN;
const maxBodyBytes = Number(process.env.C3BOT_API_MAX_BODY_BYTES ?? 1_500_000);

export function setCorsHeaders(response: ServerResponse): void {
  response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
}

export function isAuthorized(request: IncomingMessage): boolean {
  if (!apiToken) return true;
  return request.headers.authorization === `Bearer ${apiToken}`;
}

export function writeJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

export async function readJson<T>(request: IncomingMessage, optional = false): Promise<T> {
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

export function requireText(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`Campo obrigatorio: ${field}`);
  return value.trim();
}
