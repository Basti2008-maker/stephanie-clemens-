import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Konfigurations-Check für das Deployment. Gibt nur an, OB etwas gesetzt
 * ist – niemals die Werte selbst. Aufrufbar unter /api/health.
 */
export async function GET() {
  const adminPasswordGesetzt = Boolean(process.env.ADMIN_PASSWORD);

  const dbUrl = process.env.DATABASE_URL ?? "";
  let datenbank: string;
  if (dbUrl.startsWith("libsql://")) {
    datenbank = "turso";
  } else if (dbUrl.startsWith("file:")) {
    datenbank = "lokale-datei";
  } else {
    datenbank = "nicht-gesetzt";
  }

  let datenbankErreichbar = false;
  let anmeldungen: number | null = null;
  try {
    anmeldungen = await prisma.rsvp.count();
    datenbankErreichbar = true;
  } catch {
    // Datenbank nicht erreichbar oder Schema fehlt
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
      : "Auf Vercel unter Settings -> Environment Variables setzen: ADMIN_PASSWORD, DATABASE_URL und DATABASE_AUTH_TOKEN (Turso), optional NEXT_PUBLIC_RSVP_CODE. Danach neu deployen.",
  });
}
