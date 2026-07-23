"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (!response.ok) {
      setError("Falsches Passwort.");
      return;
    }

    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-lg border border-stone-200 bg-white p-8 shadow-sm"
    >
      <h1 className="mb-6 font-serif text-2xl text-stone-900">Admin-Login</h1>
      <label className="mb-1 block text-sm text-stone-600" htmlFor="password">
        Passwort
      </label>
      <input
        id="password"
        type="password"
        required
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-4 w-full rounded-md border border-stone-300 px-3 py-2 focus:border-stone-500 focus:outline-none"
      />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-stone-900 px-4 py-2 text-white transition hover:bg-stone-700 disabled:opacity-50"
      >
        {loading ? "Wird geprüft…" : "Anmelden"}
      </button>
    </form>
  );
}
