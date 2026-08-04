import Image from "next/image";
import { Countdown } from "@/components/Countdown";
import { HomeAccess } from "@/components/HomeAccess";
import { Blumen } from "@/components/Blumen";

const WEDDING_DATE = process.env.NEXT_PUBLIC_WEDDING_DATE ?? "2027-06-26T14:00:00";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16">
      <Blumen corner="top-left" />
      <Blumen corner="bottom-right" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        <h1 className="text-3xl tracking-wide text-primary sm:text-4xl">Wir heiraten!</h1>

        <Image
          src="/images/SC_Embleme.svg"
          alt="Emblem Stephanie und Clemens"
          width={220}
          height={220}
          priority
          className="mt-8 h-auto w-40 sm:w-[220px]"
        />

        <div className="mt-10">
          <Countdown targetDate={WEDDING_DATE} />
        </div>

        <div className="mt-12 w-full">
          <HomeAccess />
        </div>
      </div>
    </main>
  );
}
