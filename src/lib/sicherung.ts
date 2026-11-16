import { prisma } from "@/lib/prisma";

/**
 * Speichert alle Anmeldungen (Adressen) als Sicherung in der Datenbank.
 * Wird vor jedem Zuruecksetzen aufgerufen. Sicherungen werden nie
 * automatisch geloescht.
 */
export async function anmeldungenSichern(grund: string): Promise<number> {
  const rsvps = await prisma.rsvp.findMany();
  if (rsvps.length === 0) return 0;
  await prisma.sicherung.create({
    data: { grund, anzahl: rsvps.length, daten: JSON.stringify(rsvps) },
  });
  return rsvps.length;
}

/**
 * Stellt die Anmeldungen einer Sicherung wieder her. Vorhandene Eintraege
 * bleiben unberuehrt, es werden nur fehlende ergaenzt.
 */
export async function sicherungWiederherstellen(id: string): Promise<number> {
  const sicherung = await prisma.sicherung.findUnique({ where: { id } });
  if (!sicherung) return 0;
  const zeilen = JSON.parse(sicherung.daten) as Array<Record<string, unknown> & { id: string; createdAt: string }>;
  const vorhanden = new Set((await prisma.rsvp.findMany({ select: { id: true } })).map((r) => r.id));
  let wiederhergestellt = 0;
  for (const z of zeilen) {
    if (vorhanden.has(z.id)) continue;
    await prisma.rsvp.create({
      data: {
        id: z.id,
        firstName: String(z.firstName ?? ""),
        lastName: String(z.lastName ?? ""),
        partnerFirstName: (z.partnerFirstName as string | null) ?? null,
        partnerLastName: (z.partnerLastName as string | null) ?? null,
        email: String(z.email ?? ""),
        phone: String(z.phone ?? ""),
        street: String(z.street ?? ""),
        zipCode: String(z.zipCode ?? ""),
        city: String(z.city ?? ""),
        country: String(z.country ?? ""),
        createdAt: new Date(z.createdAt),
      },
    });
    wiederhergestellt++;
  }
  return wiederhergestellt;
}
