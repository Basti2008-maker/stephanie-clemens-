import Link from "next/link";

export default function RsvpSuccessPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 text-center">
      <h1 className="mb-4 font-serif text-4xl text-stone-900">Vielen Dank!</h1>
      <p className="mb-8 max-w-md font-sans text-stone-600">
        Deine Rückmeldung ist bei uns eingegangen. Danke, dass du dir die Zeit genommen hast zu
        antworten – wir melden uns, sobald es weitere Neuigkeiten gibt.
      </p>
      <Link
        href="/"
        className="rounded-full border border-stone-300 px-6 py-3 font-sans text-sm uppercase tracking-wide text-stone-700 transition hover:bg-stone-100"
      >
        Zurück zur Startseite
      </Link>
    </main>
  );
}
