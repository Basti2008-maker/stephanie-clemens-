"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

const RSVP_CODE = process.env.NEXT_PUBLIC_RSVP_CODE ?? "26.6.27";

export function HomeAccess() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const value = code.trim();

    // Öffentlicher Gäste-Code führt direkt zum Anmeldeformular.
    if (value === RSVP_CODE) {
      router.push("/rsvp");
      return;
    }

    // Andernfalls als Admin-Passwort prüfen (serverseitig, sicher).
    setLoading(true);
    let serverError: string | null = null;
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: value }),
      });

      if (response.ok) {
        router.push("/admin");
        return;
      }

      // Konfigurationsfehler (z. B. ADMIN_PASSWORD fehlt auf dem Server)
      // klar anzeigen statt eines irreführenden "Ungültiger Code".
      if (response.status !== 401) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        serverError = data?.error ?? null;
      }
    } catch {
      serverError = "Server nicht erreichbar. Bitte später erneut versuchen.";
    }

    setLoading(false);
    setError(serverError ?? "Ungültiger Code, bitte erneut versuchen.");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col items-center gap-3">
      <div className="flex gap-2">
        <label htmlFor="access-code" className="sr-only">
          Code
        </label>
        <input
          id="access-code"
          type="text"
          autoComplete="off"
          placeholder="Code eingeben"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-56 rounded-full border border-stone-300 px-4 py-3 text-center text-stone-900 focus:border-stone-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-stone-900 px-6 py-3 font-sans text-sm uppercase tracking-wide text-white transition hover:bg-stone-700 disabled:opacity-50"
        >
          {loading ? "…" : "Weiter"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
