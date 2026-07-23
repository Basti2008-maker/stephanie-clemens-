"use client";

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { rsvpSchema } from "@/lib/validation";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  zipCode: string;
  city: string;
  country: string;
  website: string;
};

const initialState: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  street: "",
  zipCode: "",
  city: "",
  country: "",
  website: "",
};

const inputClass =
  "w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 focus:border-stone-500 focus:outline-none";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-stone-600">
        {label} <span className="text-stone-400">*</span>
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function RsvpForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    const parsed = rsvpSchema.safeParse(form);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        throw new Error("Absenden fehlgeschlagen");
      }

      router.push("/rsvp/success");
    } catch {
      setSubmitError("Da ist etwas schiefgelaufen. Bitte versuche es erneut.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-6 rounded-lg border border-stone-200 bg-white p-8 shadow-sm"
    >
      {/* Honeypot-Feld: für Menschen unsichtbar, Bots füllen es oft trotzdem aus. */}
      <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => update("website", e.target.value)}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Vorname" error={errors.firstName}>
          <input
            className={inputClass}
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
          />
        </Field>
        <Field label="Nachname" error={errors.lastName}>
          <input
            className={inputClass}
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
          />
        </Field>
      </div>

      <Field label="E-Mail" error={errors.email}>
        <input
          type="email"
          className={inputClass}
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />
      </Field>

      <Field label="Telefonnummer" error={errors.phone}>
        <input
          type="tel"
          className={inputClass}
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Straße & Hausnummer" error={errors.street}>
          <input className={inputClass} value={form.street} onChange={(e) => update("street", e.target.value)} />
        </Field>
        <Field label="PLZ" error={errors.zipCode}>
          <input className={inputClass} value={form.zipCode} onChange={(e) => update("zipCode", e.target.value)} />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Ort" error={errors.city}>
          <input className={inputClass} value={form.city} onChange={(e) => update("city", e.target.value)} />
        </Field>
        <Field label="Land" error={errors.country}>
          <input className={inputClass} value={form.country} onChange={(e) => update("country", e.target.value)} />
        </Field>
      </div>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-stone-900 px-6 py-3 font-sans text-sm uppercase tracking-wide text-white transition hover:bg-stone-700 disabled:opacity-50"
      >
        {submitting ? "Wird gesendet…" : "Anmeldung absenden"}
      </button>
    </form>
  );
}
