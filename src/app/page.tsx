import { Countdown } from "@/components/Countdown";
import { HomeAccess } from "@/components/HomeAccess";

const WEDDING_DATE = process.env.NEXT_PUBLIC_WEDDING_DATE ?? "2027-06-26T14:00:00";
const WEDDING_LOCATION = process.env.NEXT_PUBLIC_WEDDING_LOCATION ?? "Location folgt in Kürze";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-stone-50 to-stone-100 px-4 py-16 text-center">
      <p className="mb-4 font-sans text-sm uppercase tracking-[0.3em] text-stone-500">Wir heiraten</p>
      <h1 className="mb-6 font-serif text-5xl text-stone-900 sm:text-6xl">
        Stephanie <span className="text-stone-400">&amp;</span> Clemens
      </h1>
      <p className="mb-1 font-sans text-lg text-stone-700">26. Juni 2027</p>
      <p className="mb-10 font-sans text-lg text-stone-500">{WEDDING_LOCATION}</p>

      <Countdown targetDate={WEDDING_DATE} />

      <div className="mt-12">
        <HomeAccess />
      </div>
    </main>
  );
}
