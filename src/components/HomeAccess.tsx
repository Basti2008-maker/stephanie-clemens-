"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

const RSVP_CODE = process.env.NEXT_PUBLIC_RSVP_CODE ?? "26062027";

export function HomeAccess() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const value = code.trim();

    // Gäste-Passwort führt direkt zum Anmeldeformular.
    if (value === RSVP_CODE.trim()) {
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
      // klar anzeigen statt eines irreführenden "Ungültiges Passwort".
      if (response.status !== 401) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        serverError = data?.error ?? null;
      }
    } catch {
      serverError = "Server nicht erreichbar. Bitte später erneut versuchen.";
    }

    setLoading(false);
    setError(serverError ?? "Ungültiges Passwort, bitte erneut versuchen.");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col items-center">
      <label htmlFor="access-code" className="sr-only">
        Passwort eingeben
      </label>
      <input
        id="access-code"
        type="password"
        autoComplete="off"
        placeholder="Passwort eingeben"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        aria-invalid={error ? true : undefined}
        className={`w-full max-w-xs border-0 border-b bg-transparent px-1 py-2 text-center text-primary focus:outline-none focus:ring-0 ${
          error ? "border-error focus:border-error" : "border-line focus:border-primary"
        }`}
      />

      {error && <p className="mt-3 text-sm text-error">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-8 bg-primary px-10 py-3 text-sm uppercase tracking-[0.18em] text-bg transition hover:opacity-85 disabled:opacity-50"
      >
        {loading ? "Moment…" : "Weiter"}
      </button>
    </form>
  );
}
