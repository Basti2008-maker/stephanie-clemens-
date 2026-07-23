import { NextRequest, NextResponse } from "next/server";
import {
  checkPassword,
  createSessionValue,
  isAdminConfigured,
  COOKIE_NAME,
  MAX_AGE,
} from "@/lib/auth";

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

  if (!password || !checkPassword(password)) {
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
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
  return response;
}
