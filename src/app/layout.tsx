import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Instrument_Serif } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stephanie & Clemens – Unsere Hochzeit",
  description: "26. Juni 2027 – Wir freuen uns, mit euch zu feiern.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" className={instrumentSerif.variable}>
      <body className="bg-bg text-primary antialiased">{children}</body>
    </html>
  );
}
