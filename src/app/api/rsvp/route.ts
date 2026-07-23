import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureSchema } from "@/lib/prisma";
import { rsvpSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Bitte überprüfe deine Eingaben.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { website, ...rest } = parsed.data;

  // Honeypot: Bots füllen dieses versteckte Feld aus. Wir täuschen Erfolg
  // vor, speichern die Anmeldung aber nicht.
  if (website) {
    return NextResponse.json({ success: true });
  }

  try {
    await prisma.rsvp.create({ data: rest });
  } catch (firstError) {
    // Falls die Tabelle noch fehlt (frische Turso-Datenbank), einmal
    // anlegen und erneut versuchen. Andere Fehler -> sauberer 503.
    try {
      await ensureSchema();
      await prisma.rsvp.create({ data: rest });
    } catch {
      console.error("RSVP konnte nicht gespeichert werden:", firstError);
      return NextResponse.json(
        { error: "Die Anmeldung kann gerade nicht gespeichert werden. Bitte versuche es später erneut." },
        { status: 503 }
      );
    }
  }

  return NextResponse.json({ success: true });
}
