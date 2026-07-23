import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
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
  const adapter = new PrismaLibSQL({
    url: resolveDatabaseUrl(process.env.DATABASE_URL ?? "file:./dev.db"),
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}
