import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

  await prisma.rsvp.create({ data: rest });

  return NextResponse.json({ success: true });
}
