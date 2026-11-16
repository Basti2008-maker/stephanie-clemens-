import { NextRequest, NextResponse } from "next/server";
import { ensureSchemaOnce } from "@/lib/prisma";
import { getIsAuthenticated } from "@/lib/auth";
import { sicherungWiederherstellen } from "@/lib/sicherung";

/** Stellt geloeschte Anmeldungen aus einer Sicherung wieder her. */
export async function POST(request: NextRequest) {
  if (!(await getIsAuthenticated())) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Sicherung fehlt." }, { status: 400 });

  try {
    await ensureSchemaOnce();
    const wiederhergestellt = await sicherungWiederherstellen(id);
    return NextResponse.json({ success: true, wiederhergestellt });
  } catch (error) {
    console.error("Wiederherstellen fehlgeschlagen:", error);
    return NextResponse.json({ error: "Wiederherstellen fehlgeschlagen." }, { status: 500 });
  }
}
