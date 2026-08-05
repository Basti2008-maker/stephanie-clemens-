import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureSchemaOnce } from "@/lib/prisma";
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

  const { website, isCouple, partnerFirstName, partnerLastName, ...rest } = parsed.data;

  // Honeypot: Bots füllen dieses versteckte Feld aus. Wir täuschen Erfolg
  // vor, speichern die Anmeldung aber nicht.
  if (website) {
    return NextResponse.json({ success: true });
  }

  // Die zweite Person wird nur gespeichert, wenn die Paar-Option aktiv ist.
  const data = {
    ...rest,
    partnerFirstName: isCouple && partnerFirstName ? partnerFirstName : null,
    partnerLastName: isCouple && partnerLastName ? partnerLastName : null,
  };

  try {
    await ensureSchemaOnce();
    await prisma.rsvp.create({ data });
  } catch (error) {
    console.error("RSVP konnte nicht gespeichert werden:", error);
    return NextResponse.json(
      { error: "Die Anmeldung kann gerade nicht gespeichert werden. Bitte versuche es später erneut." },
      { status: 503 }
    );
  }

  return NextResponse.json({ success: true });
}
