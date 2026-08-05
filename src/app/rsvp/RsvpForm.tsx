"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { rsvpSchema } from "@/lib/validation";

type FormState = {
  firstName: string;
  lastName: string;
  isCouple: boolean;
  partnerFirstName: string;
  partnerLastName: string;
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
  isCouple: false,
  partnerFirstName: "",
  partnerLastName: "",
  email: "",
  phone: "",
  street: "",
  zipCode: "",
  city: "",
  country: "",
  website: "",
};

const inputBase =
  "w-full border-0 border-b bg-transparent px-1 py-2 text-primary focus:outline-none focus:ring-0";

// "Anmelden": gleiche Typografie, aber ohne Flaeche – nur gruene Schrift mit Rand.
const anmeldenKlasse =
  "rounded-full border border-primary px-10 py-3 text-sm uppercase tracking-[0.18em] text-primary transition hover:bg-primary/10";

// "Absenden": Schreibschrift und Farbe wie der Namenszug, ohne Flaeche, mit Rand.
// Bewusst ohne Versalien und Sperrung – eine Schreibschrift wirkt sonst gebrochen.
const absendenKlasse =
  "font-medusa w-full rounded-full border border-primary px-6 py-2 text-4xl leading-tight text-primary transition hover:bg-primary/10 disabled:opacity-50";

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm text-primary">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
}

export function RsvpForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  // Die Felder werden erst gerendert, wenn der Button geklickt wurde.
  const [showForm, setShowForm] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Nach dem Einblenden den Fokus ins erste Feld setzen.
  useEffect(() => {
    if (showForm) firstFieldRef.current?.focus();
  }, [showForm]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function fieldClass(key: keyof FormState) {
    return `${inputBase} ${errors[key] ? "border-error focus:border-error" : "border-line focus:border-primary"}`;
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

      setSubmitted(true);
    } catch {
      setSubmitError("Da ist etwas schiefgelaufen. Bitte versuche es erneut.");
      setSubmitting(false);
    }
  }

  // Nach erfolgreichem Absenden ersetzt die Dankesnachricht das Formular
  // samt der Einleitungstexte, die dann nicht mehr zutreffen.
  if (submitted) {
    return (
      <div className="flex min-h-[45vh] flex-col items-center justify-center text-center">
        <p className="max-w-md text-xl leading-relaxed text-primary sm:text-2xl">
          Wir freuen uns riesig, diesen besonderen Tag gemeinsam mit euch zu feiern!
        </p>
        <p className="mt-8 text-lg text-primary sm:text-xl">Stephanie &amp; Clemens</p>
      </div>
    );
  }

  return (
    <>
      <p className="mx-auto mb-6 max-w-md text-center text-primary">
        Um euch unsere Einladung mit weiteren Details zukommen zu lassen, bitten wir euch, einmal
        eure Adresse einzugeben.
      </p>

      {/* Der Button bleibt stehen; die Felder klappen darunter auf. */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setShowForm((offen) => !offen)}
          aria-expanded={showForm}
          aria-controls="adressformular"
          className={anmeldenKlasse}
        >
          {showForm ? "Zuklappen" : "Anmelden"}
        </button>
      </div>

      {showForm && (
        <div id="adressformular" className="formular-einblenden mt-4">
          <div className="overflow-hidden">
            {/* Erscheint gemeinsam mit den Feldern, direkt unter dem Button. */}
            <p className="mx-auto mb-8 max-w-md text-center text-sm text-primary">
              Bei Paaren reicht es aus, wenn eine Person die gemeinsame Adresse eingibt. Bitte gebt
              aber beide Vornamen an.
            </p>

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
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
        <Field label="Vorname" htmlFor="firstName" error={errors.firstName}>
          <input
            id="firstName"
            ref={firstFieldRef}
            autoComplete="given-name"
            className={fieldClass("firstName")}
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
          />
        </Field>
        <Field label="Nachname" htmlFor="lastName" error={errors.lastName}>
          <input
            id="lastName"
            autoComplete="family-name"
            className={fieldClass("lastName")}
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
          />
        </Field>
      </div>

      <label htmlFor="isCouple" className="flex cursor-pointer items-center gap-3 text-sm text-primary">
        <input
          id="isCouple"
          type="checkbox"
          checked={form.isCouple}
          onChange={(e) => {
            const checked = e.target.checked;
            setForm((prev) => ({
              ...prev,
              isCouple: checked,
              // Beim Abwählen die Felder der zweiten Person leeren.
              partnerFirstName: checked ? prev.partnerFirstName : "",
              partnerLastName: checked ? prev.partnerLastName : "",
            }));
            if (!checked) {
              setErrors((prev) => {
                const next = { ...prev };
                delete next.partnerFirstName;
                delete next.partnerLastName;
                return next;
              });
            }
          }}
          className="h-4 w-4 accent-[color:var(--color-primary)]"
        />
        Wir melden uns als Paar an
      </label>

      {form.isCouple && (
        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="Vorname der zweiten Person"
            htmlFor="partnerFirstName"
            error={errors.partnerFirstName}
          >
            <input
              id="partnerFirstName"
              autoComplete="off"
              className={fieldClass("partnerFirstName")}
              value={form.partnerFirstName}
              onChange={(e) => update("partnerFirstName", e.target.value)}
            />
          </Field>
          <Field
            label="Nachname der zweiten Person"
            htmlFor="partnerLastName"
            error={errors.partnerLastName}
          >
            <input
              id="partnerLastName"
              autoComplete="off"
              className={fieldClass("partnerLastName")}
              value={form.partnerLastName}
              onChange={(e) => update("partnerLastName", e.target.value)}
            />
          </Field>
        </div>
      )}

      <Field label="E-Mail" htmlFor="email" error={errors.email}>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className={fieldClass("email")}
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />
      </Field>

      <Field label="Telefonnummer" htmlFor="phone" error={errors.phone}>
        <input
          id="phone"
          type="tel"
          autoComplete="tel"
          className={fieldClass("phone")}
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Straße & Hausnummer" htmlFor="street" error={errors.street}>
          <input
            id="street"
            autoComplete="street-address"
            className={fieldClass("street")}
            value={form.street}
            onChange={(e) => update("street", e.target.value)}
          />
        </Field>
        <Field label="PLZ" htmlFor="zipCode" error={errors.zipCode}>
          <input
            id="zipCode"
            autoComplete="postal-code"
            className={fieldClass("zipCode")}
            value={form.zipCode}
            onChange={(e) => update("zipCode", e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Ort" htmlFor="city" error={errors.city}>
          <input
            id="city"
            autoComplete="address-level2"
            className={fieldClass("city")}
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
          />
        </Field>
        <Field label="Land" htmlFor="country" error={errors.country}>
          <input
            id="country"
            autoComplete="country-name"
            className={fieldClass("country")}
            value={form.country}
            onChange={(e) => update("country", e.target.value)}
          />
        </Field>
      </div>

      {submitError && <p className="text-sm text-error">{submitError}</p>}

              <button type="submit" disabled={submitting} className={absendenKlasse}>
                {submitting ? "Wird gesendet…" : "Absenden"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
