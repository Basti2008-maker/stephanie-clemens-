import { NextResponse } from "next/server";
import { prisma, ensureSchema, getDatabaseConfig } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Konfigurations-Check für das Deployment. Gibt nur an, OB etwas gesetzt
 * ist – niemals die Werte selbst. Aufrufbar unter /api/health.
 * Legt außerdem die Datenbanktabelle an, falls sie noch fehlt (idempotent),
 * damit eine frisch verbundene Turso-Datenbank sofort einsatzbereit ist.
 */
export async function GET() {
  const adminPasswordGesetzt = Boolean(process.env.ADMIN_PASSWORD);

  const { url } = getDatabaseConfig();
  let datenbank: string;
  if (url.startsWith("libsql://")) {
    datenbank = "turso";
  } else if (url.startsWith("file:")) {
    datenbank = "lokale-datei";
  } else {
    datenbank = "nicht-gesetzt";
  }

  let datenbankErreichbar = false;
  let anmeldungen: number | null = null;
  try {
    await ensureSchema();
    anmeldungen = await prisma.rsvp.count();
    datenbankErreichbar = true;
  } catch {
    // Datenbank nicht erreichbar
  }

  const ok = adminPasswordGesetzt && datenbankErreichbar;

  return NextResponse.json({
    status: ok ? "ok" : "konfiguration-unvollstaendig",
    adminPasswortGesetzt: adminPasswordGesetzt,
    datenbank,
    datenbankErreichbar,
    anmeldungen,
    hinweis: ok
      ? "Alles bereit."
      : "Auf Vercel unter Settings -> Environment Variables setzen: ADMIN_PASSWORD sowie eine Turso-Datenbank verbinden (DATABASE_URL + DATABASE_AUTH_TOKEN oder Turso-Integration aus dem Vercel-Marketplace). Danach neu deployen und diese Seite erneut aufrufen.",
  });
}
