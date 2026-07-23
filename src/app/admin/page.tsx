import { getIsAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LoginForm } from "./LoginForm";
import { AdminTable } from "./AdminTable";
import { LogoutButton } from "./LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authenticated = await getIsAuthenticated();

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
        <LoginForm />
      </main>
    );
  }

  const rsvps = await prisma.rsvp.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-serif text-3xl text-stone-900">Anmeldungen</h1>
          <LogoutButton />
        </div>
        <AdminTable
          rsvps={rsvps.map((r) => ({
            ...r,
            createdAt: r.createdAt.toISOString(),
          }))}
        />
      </div>
    </main>
  );
}
