import { Blumen } from "@/components/Blumen";

export default function RsvpSuccessPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
      <Blumen corner="bottom-left" />

      <div className="relative z-10">
        <p className="mx-auto max-w-md text-xl leading-relaxed text-primary sm:text-2xl">
          Wir freuen uns riesig, diesen besonderen Tag gemeinsam mit euch zu feiern!
        </p>
        <p className="mt-8 text-lg text-primary sm:text-xl">Stephanie &amp; Clemens</p>
      </div>
    </main>
  );
}
