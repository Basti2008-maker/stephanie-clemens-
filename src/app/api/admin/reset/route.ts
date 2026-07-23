import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIsAuthenticated } from "@/lib/auth";

export async function POST() {
  const authenticated = await getIsAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  const result = await prisma.rsvp.deleteMany();
  return NextResponse.json({ success: true, deleted: result.count });
}
