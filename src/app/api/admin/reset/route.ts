import { NextResponse } from "next/server";
import { prisma, ensureSchemaOnce } from "@/lib/prisma";
import { getIsAuthenticated } from "@/lib/auth";
import { anmeldungenSichern } from "@/lib/sicherung";

export async function POST() {
  const authenticated = await getIsAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  try {
    await ensureSchemaOnce();
    // Erst sichern, dann loeschen. Schlaegt die Sicherung fehl, wird nichts geloescht.
    const gesichert = await anmeldungenSichern("Vor dem Zurücksetzen");
    const result = await prisma.rsvp.deleteMany();
    return NextResponse.json({ success: true, deleted: result.count, gesichert });
  } catch (error) {
    console.error("Zuruecksetzen fehlgeschlagen:", error);
    return NextResponse.json({ error: "Zurücksetzen fehlgeschlagen. Es wurde nichts gelöscht." }, { status: 500 });
  }
}
