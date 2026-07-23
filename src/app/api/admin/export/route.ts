import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { getIsAuthenticated } from "@/lib/auth";

const ORDER_BY: Record<string, Prisma.RsvpOrderByWithRelationInput | Prisma.RsvpOrderByWithRelationInput[]> = {
  "date-desc": { createdAt: "desc" },
  "date-asc": { createdAt: "asc" },
  "name-asc": [{ lastName: "asc" }, { firstName: "asc" }],
  "name-desc": [{ lastName: "desc" }, { firstName: "desc" }],
  "city-asc": { city: "asc" },
};

export async function GET(request: NextRequest) {
  const authenticated = await getIsAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  const sort = request.nextUrl.searchParams.get("sort") ?? "date-desc";
  const orderBy = ORDER_BY[sort] ?? ORDER_BY["date-desc"];
  const rsvps = await prisma.rsvp.findMany({ orderBy });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Anmeldungen");

  sheet.columns = [
    { header: "Vorname", key: "firstName", width: 18 },
    { header: "Nachname", key: "lastName", width: 18 },
    { header: "E-Mail", key: "email", width: 28 },
    { header: "Telefon", key: "phone", width: 18 },
    { header: "Straße", key: "street", width: 24 },
    { header: "PLZ", key: "zipCode", width: 10 },
    { header: "Ort", key: "city", width: 18 },
    { header: "Land", key: "country", width: 16 },
    { header: "Zeitstempel", key: "createdAt", width: 20 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const rsvp of rsvps) {
    sheet.addRow({
      firstName: rsvp.firstName,
      lastName: rsvp.lastName,
      email: rsvp.email,
      phone: rsvp.phone,
      street: rsvp.street,
      zipCode: rsvp.zipCode,
      city: rsvp.city,
      country: rsvp.country,
      createdAt: rsvp.createdAt.toLocaleString("de-AT"),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rsvps-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
