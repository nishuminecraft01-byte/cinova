/**
 * Reusable Prisma Client Singleton for CINOVA (Server-side only)
 * Prevents multiple PrismaClient instances during Next.js hot reload in development
 * and safely handles unconfigured or unreachable PostgreSQL environments.
 */

import { PrismaClient } from "@prisma/client";
import { isDatabaseConfigured } from "@/lib/env";

declare global {
  // eslint-disable-next-line no-var
  var __cinovaPrisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

/**
 * Returns the singleton PrismaClient if DATABASE_URL is configured; otherwise null.
 * Callers can gracefully fall back or return a 503 when the DB is not provisioned yet.
 */
export function getPrismaClient(): PrismaClient | null {
  if (!isDatabaseConfigured()) {
    return null;
  }

  if (process.env.NODE_ENV !== "production") {
    if (!globalThis.__cinovaPrisma) {
      globalThis.__cinovaPrisma = createPrismaClient();
    }
    return globalThis.__cinovaPrisma;
  }

  if (!globalThis.__cinovaPrisma) {
    globalThis.__cinovaPrisma = createPrismaClient();
  }
  return globalThis.__cinovaPrisma;
}

/**
 * Returns the PrismaClient or throws a safe, sanitized error without leaking credentials.
 */
export function requirePrismaClient(): PrismaClient {
  const client = getPrismaClient();
  if (!client) {
    throw new Error(
      "Database is not configured. Set a valid PostgreSQL DATABASE_URL in server environment variables."
    );
  }
  return client;
}

export interface DatabaseHealthResult {
  configured: boolean;
  connected: boolean;
  latencyMs?: number;
  error?: string;
}

/**
 * Safe database connectivity check that never leaks connection strings or secrets.
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealthResult> {
  if (!isDatabaseConfigured()) {
    return {
      configured: false,
      connected: false,
      error: "DATABASE_URL is not configured.",
    };
  }

  const client = getPrismaClient();
  if (!client) {
    return {
      configured: false,
      connected: false,
      error: "Unable to initialize Prisma client.",
    };
  }

  const start = Date.now();
  try {
    await client.$queryRaw`SELECT 1`;
    return {
      configured: true,
      connected: true,
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    const rawMsg = err instanceof Error ? err.message : "Database connection failed";
    // Strip any potential credential URI fragments before returning
    const safeMsg = rawMsg.replace(/postgres(?:ql)?:\/\/[^\s'"]+/gi, "[REDACTED_DB_URL]");
    return {
      configured: true,
      connected: false,
      latencyMs: Date.now() - start,
      error: safeMsg.slice(0, 200),
    };
  }
}
