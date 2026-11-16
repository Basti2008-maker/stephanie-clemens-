import { NextRequest, NextResponse } from "next/server";
import {
  checkPassword,
  createSessionValue,
  isAdminConfigured,
  COOKIE_NAME,
  MAX_AGE,
} from "@/lib/auth";
import { prisma, ensureSchemaOnce } from "@/lib/prisma";
import crypto from "crypto";

// Schutz gegen Passwort-Raten: hoechstens 10 Fehlversuche pro Viertelstunde
// und Absender. Gespeichert in der Datenbank, damit es auch ueber mehrere
// Serverless-Instanzen hinweg gilt. Gespeichert wird nur ein Hash der IP.
const MAX_FEHLVERSUCHE = 10;
const FENSTER_MS = 15 * 60 * 1000;

function absender(request: NextRequest): string {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unbekannt";
  return crypto.createHash("sha256").update(`login:${ip}`).digest("hex").slice(0, 32);
}

/** true, wenn der Absender gesperrt ist. Faellt die Datenbank aus, wird nicht gesperrt. */
async function gesperrt(ipHash: string): Promise<boolean> {
  try {
    await ensureSchemaOnce();
    const seit = new Date(Date.now() - FENSTER_MS);
    return (await prisma.loginVersuch.count({ where: { ipHash, createdAt: { gte: seit } } })) >= MAX_FEHLVERSUCHE;
  } catch {
    return false;
  }
}

async function fehlversuchMerken(ipHash: string): Promise<void> {
  try {
    await prisma.loginVersuch.create({ data: { ipHash } });
    // Alte Eintraege aufraeumen (nur diese Hilfstabelle, keine Gaestedaten).
    await prisma.loginVersuch.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
  } catch {
    // Die Bremse darf den Login nie zum Absturz bringen.
  }
}

export async function POST(request: NextRequest) {
  // Klare Diagnose statt irreführendem "Falsches Passwort", wenn die
  // Umgebungsvariable im Deployment fehlt.
  if (!isAdminConfigured()) {
    console.error(
      "[admin-login] ADMIN_PASSWORD ist in diesem Deployment nicht gesetzt – Login unmöglich. " +
        "Vercel: Settings -> Environment Variables -> ADMIN_PASSWORD (Environment: Production) setzen und neu deployen."
    );
    return NextResponse.json(
      {
        error:
          "Der Admin-Zugang ist auf dem Server nicht konfiguriert (ADMIN_PASSWORD fehlt). " +
          "Bitte die Umgebungsvariable in Vercel setzen und neu deployen.",
      },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  const ipHash = absender(request);
  if (await gesperrt(ipHash)) {
    return NextResponse.json(
      { error: "Zu viele Fehlversuche. Bitte in 15 Minuten erneut versuchen." },
      { status: 429 }
    );
  }

  if (!password || !checkPassword(password)) {
    await fehlversuchMerken(ipHash);
    return NextResponse.json({ error: "Falsches Passwort." }, { status: 401 });
  }

  const session = createSessionValue();
  if (!session) {
    // Kann nach der Konfigurationsprüfung oben praktisch nicht eintreten,
    // aber wir crashen niemals mit einem rohen 500er.
    return NextResponse.json({ error: "Session konnte nicht erstellt werden." }, { status: 500 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: MAX_AGE,
    path: "/",
  });
  return response;
}
