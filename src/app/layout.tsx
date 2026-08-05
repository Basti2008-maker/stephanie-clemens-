import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Instrument_Serif, Alex_Brush } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: "400",
  display: "swap",
});

/*
 * Wird als Webfont mitgeliefert (nicht vom Betriebssystem geladen), damit
 * "Stephanie & Clemens" und der Absenden-Button auf jedem Geraet exakt
 * gleich aussehen. Vorher griff je nach Geraet eine andere System-
 * Schreibschrift (Windows: Brush Script MT, iOS: eine andere kursive
 * Schrift) – daher der sichtbare Unterschied zwischen Handy und Laptop.
 * Wird durch die echte Medusa-Schrift ersetzt, sobald die Datei vorliegt.
 */
const scriptFont = Alex_Brush({
  subsets: ["latin"],
  variable: "--font-script",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stephanie & Clemens – Unsere Hochzeit",
  description: "26. Juni 2027 – Wir freuen uns, mit euch zu feiern.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" className={`${instrumentSerif.variable} ${scriptFont.variable}`}>
      <body className="bg-bg text-primary antialiased">{children}</body>
    </html>
  );
}
