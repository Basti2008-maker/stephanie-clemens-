import { getIsAuthenticated } from "@/lib/auth";
import { prisma, ensureSchemaOnce } from "@/lib/prisma";
import { LoginForm } from "./LoginForm";
import { AdminTable } from "./AdminTable";
import { LogoutButton } from "./LogoutButton";
import { Sicherungen } from "./Sicherungen";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authenticated = await getIsAuthenticated();

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <LoginForm />
      </main>
    );
  }

  await ensureSchemaOnce();
  const rsvps = await prisma.rsvp.findMany({ orderBy: { createdAt: "desc" } });
  // Die gesicherten Daten selbst werden hier nicht geladen, nur die Uebersicht.
  const sicherungen = await prisma.sicherung.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, grund: true, anzahl: true, createdAt: true },
  });

  return (
    <main className="min-h-screen px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl text-primary">Anmeldungen</h1>
          <LogoutButton />
        </div>
        <AdminTable
          rsvps={rsvps.map((r) => ({
            ...r,
            createdAt: r.createdAt.toISOString(),
          }))}
        />

        <Sicherungen sicherungen={sicherungen.map((x) => ({ ...x, createdAt: x.createdAt.toISOString() }))} />
      </div>
    </main>
  );
}
