import Image from "next/image";
import { RsvpForm } from "./RsvpForm";
import { Blumen } from "@/components/Blumen";

export default function RsvpPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden px-6 py-12">
      {/* Bleiben beim Scrollen an ihrer Bildschirmecke stehen. */}
      <Blumen corner="bottom-left" fixed />
      <Blumen corner="top-right" fixed />

      <div className="relative z-10 mx-auto w-full max-w-xl">
        <Image
          src="/images/SC_mit_Savethedate_Wien.svg"
          alt="Save the Date – Stephanie & Clemens, 26. Juni 2027, Wien"
          width={792}
          height={612}
          priority
          className="mx-auto h-auto w-full max-w-[600px]"
        />

        <h1 className="mt-6 text-center text-3xl text-primary sm:text-4xl">
          Stephanie &amp; Clemens
        </h1>

        <div className="mt-6">
          <RsvpForm />
        </div>
      </div>
    </main>
  );
}
