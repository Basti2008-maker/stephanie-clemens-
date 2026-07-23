import { RsvpForm } from "./RsvpForm";

export default function RsvpPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-16">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-2 text-center font-serif text-4xl text-stone-900">Anmeldung</h1>
        <p className="mb-10 text-center font-sans text-stone-500">
          Wir freuen uns riesig, diesen Tag mit dir zu teilen.
        </p>
        <RsvpForm />
      </div>
    </main>
  );
}
