"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Sicherung = { id: string; grund: string; anzahl: number; createdAt: string };

/** Liste der Sicherungen. Geloeschte Anmeldungen lassen sich daraus zurueckholen. */
export function Sicherungen({ sicherungen }: { sicherungen: Sicherung[] }) {
  const router = useRouter();
  const [meldung, setMeldung] = useState<string | null>(null);
  const [laeuft, setLaeuft] = useState<string | null>(null);

  if (sicherungen.length === 0) return null;

  async function wiederherstellen(id: string) {
    setLaeuft(id);
    setMeldung(null);
    try {
      const res = await fetch("/api/admin/wiederherstellen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = (await res.json().catch(() => null)) as { wiederhergestellt?: number; error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Fehler");
      setMeldung(
        data?.wiederhergestellt
          ? `${data.wiederhergestellt} Anmeldung(en) wiederhergestellt.`
          : "Alle Anmeldungen dieser Sicherung sind bereits vorhanden."
      );
      router.refresh();
    } catch (e) {
      setMeldung(e instanceof Error ? e.message : "Wiederherstellen fehlgeschlagen.");
    } finally {
      setLaeuft(null);
    }
  }

  return (
    <div>
      <h2 className="mb-2 mt-14 text-2xl text-primary">Sicherungen</h2>
      <p className="mb-3 text-sm text-primary">
        Vor jedem Zurücksetzen werden die Anmeldungen hier gesichert. Wiederherstellen ergänzt nur fehlende
        Einträge, es überschreibt nichts.
      </p>
      {meldung && <p className="mb-3 text-sm text-primary">{meldung}</p>}
      <ul className="divide-y divide-line/60 rounded-lg border border-line bg-bg text-sm">
        {sicherungen.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span>
              {new Date(s.createdAt).toLocaleString("de-AT")} · {s.anzahl} Anmeldung(en) · {s.grund}
            </span>
            <button
              type="button"
              onClick={() => wiederherstellen(s.id)}
              disabled={laeuft !== null}
              className="ml-auto rounded-md border border-line px-3 py-1.5 text-primary transition hover:bg-line/20 disabled:opacity-50"
            >
              {laeuft === s.id ? "Moment…" : "Wiederherstellen"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
