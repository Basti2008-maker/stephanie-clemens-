import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Datenbank-URL bestimmen. Unterstützt sowohl die eigenen Variablen
 * (DATABASE_URL / DATABASE_AUTH_TOKEN) als auch die Namen, die die
 * Turso-Integration im Vercel-Marketplace automatisch setzt
 * (TURSO_DATABASE_URL / TURSO_AUTH_TOKEN).
 */
export function getDatabaseConfig(): { url: string; authToken: string | undefined } {
  const raw = process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL ?? "file:./dev.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN;
  return { url: resolveDatabaseUrl(raw), authToken };
}

/**
 * Prisma CLI (db push/migrate) resolves relative sqlite "file:" paths relative
 * to prisma/schema.prisma, but the libSQL client resolves them relative to
 * process.cwd() at runtime. Without this, the app and the CLI end up reading
 * two different database files. Remote libsql:// URLs (Turso) pass through
 * untouched.
 */
function resolveDatabaseUrl(raw: string): string {
  if (raw.startsWith("file:") && !raw.startsWith("file:/")) {
    const relativePath = raw.slice("file:".length);
    return `file:${path.resolve(process.cwd(), "prisma", relativePath)}`;
  }
  return raw;
}

function createPrismaClient() {
  const { url, authToken } = getDatabaseConfig();
  const adapter = new PrismaLibSQL({ url, authToken });
  return new PrismaClient({ adapter });
}

export const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

/**
 * Legt die Rsvp-Tabelle an, falls sie noch nicht existiert (idempotent).
 * Damit funktioniert eine frisch verbundene Turso-Datenbank sofort,
 * ohne dass manuell `prisma db push` ausgeführt werden muss.
 * Das DDL entspricht exakt dem, was Prisma für prisma/schema.prisma erzeugt.
 */
export async function ensureSchema(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Rsvp" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "firstName" TEXT NOT NULL,
      "lastName" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "phone" TEXT NOT NULL,
      "street" TEXT NOT NULL,
      "zipCode" TEXT NOT NULL,
      "city" TEXT NOT NULL,
      "country" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}
