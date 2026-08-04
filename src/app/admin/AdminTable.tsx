"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Rsvp = {
  id: string;
  firstName: string;
  lastName: string;
  partnerFirstName: string | null;
  partnerLastName: string | null;
  email: string;
  phone: string;
  street: string;
  zipCode: string;
  city: string;
  country: string;
  createdAt: string;
};

type SortKey = "date-desc" | "date-asc" | "name-asc" | "name-desc" | "city-asc";

const SORTERS: Record<SortKey, (a: Rsvp, b: Rsvp) => number> = {
  "date-desc": (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  "date-asc": (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  "name-asc": (a, b) => (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName, "de"),
  "name-desc": (a, b) => (b.lastName + b.firstName).localeCompare(a.lastName + a.firstName, "de"),
  "city-asc": (a, b) => a.city.localeCompare(b.city, "de"),
};

export function AdminTable({ rsvps }: { rsvps: Rsvp[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("date-desc");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = rsvps.filter((r) => {
      if (!term) return true;
      const haystack =
        `${r.firstName} ${r.lastName} ${r.partnerFirstName ?? ""} ${r.partnerLastName ?? ""} ${r.email}`.toLowerCase();
      return haystack.includes(term);
    });
    return [...filtered].sort(SORTERS[sort]);
  }, [rsvps, search, sort]);

  async function handleReset() {
    setResetting(true);
    try {
      const response = await fetch("/api/admin/reset", { method: "POST" });
      if (!response.ok) throw new Error("Reset fehlgeschlagen");
      setConfirmOpen(false);
      router.refresh();
    } catch {
      setResetting(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Suche nach Name oder E-Mail…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-md border border-line px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-md border border-line px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="date-desc">Anmeldedatum (neueste zuerst)</option>
          <option value="date-asc">Anmeldedatum (älteste zuerst)</option>
          <option value="name-asc">Name (A–Z)</option>
          <option value="name-desc">Name (Z–A)</option>
          <option value="city-asc">Ort (A–Z)</option>
        </select>
        <div className="ml-auto flex gap-2">
          <a
            href={`/api/admin/export?sort=${sort}`}
            className="rounded-md bg-primary px-4 py-2 text-sm text-bg transition hover:opacity-85"
          >
            Als Excel exportieren
          </a>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="rounded-md border border-line px-4 py-2 text-sm text-primary transition hover:border-error hover:text-error"
          >
            Anmeldungen zurücksetzen
          </button>
        </div>
      </div>

      <p className="mb-3 text-sm text-primary/70">{visible.length} Anmeldung(en)</p>

      <div className="overflow-x-auto rounded-lg border border-line bg-bg">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-line/20 text-primary/80">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">E-Mail</th>
              <th className="px-4 py-3 font-medium">Telefon</th>
              <th className="px-4 py-3 font-medium">Adresse</th>
              <th className="px-4 py-3 font-medium">Zeitstempel</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} className="border-t border-line/60">
                <td className="px-4 py-3">
                  {r.firstName} {r.lastName}
                  {r.partnerFirstName && (
                    <span className="block text-primary/70">
                      &amp; {r.partnerFirstName} {r.partnerLastName}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">{r.email}</td>
                <td className="px-4 py-3">{r.phone}</td>
                <td className="px-4 py-3">
                  {r.street}, {r.zipCode} {r.city}, {r.country}
                </td>
                <td className="px-4 py-3 text-primary/70">{new Date(r.createdAt).toLocaleString("de-AT")}</td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-primary/60">
                  Keine Anmeldungen gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary/30 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmOpen(false);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="reset-title"
            className="w-full max-w-sm rounded-lg border border-line bg-bg p-6 shadow-lg"
          >
            <h2 id="reset-title" className="mb-2 text-xl text-primary">
              Bist du sicher?
            </h2>
            <p className="mb-6 text-sm text-primary/80">
              {rsvps.length === 0
                ? "Es sind aktuell keine Anmeldungen vorhanden."
                : `Dadurch werden alle ${rsvps.length} Anmeldung(en) unwiderruflich gelöscht.`}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-md border border-line px-4 py-2 text-sm text-primary transition hover:bg-line/20"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={resetting}
                className="rounded-md bg-error px-4 py-2 text-sm text-bg transition hover:opacity-85 disabled:opacity-50"
              >
                {resetting ? "Wird gelöscht…" : "Endgültig löschen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
