import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Playfair_Display, Lato } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "600", "700"],
});

const lato = Lato({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  title: "Stephanie & Clemens – Unsere Hochzeit",
  description: "26. Juni 2027 – Wir freuen uns, mit euch zu feiern.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body className={`${playfair.variable} ${lato.variable} font-sans antialiased`}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
