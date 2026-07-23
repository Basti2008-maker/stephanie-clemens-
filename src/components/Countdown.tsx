"use client";

import { useEffect, useState } from "react";

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
};

function getTimeLeft(targetDate: string): TimeLeft {
  const diff = new Date(targetDate).getTime() - Date.now();
  const clamped = Math.max(diff, 0);
  return {
    days: Math.floor(clamped / (1000 * 60 * 60 * 24)),
    hours: Math.floor((clamped / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((clamped / (1000 * 60)) % 60),
    seconds: Math.floor((clamped / 1000) % 60),
    isPast: diff <= 0,
  };
}

export function Countdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setTimeLeft(getTimeLeft(targetDate));
    const interval = setInterval(() => setTimeLeft(getTimeLeft(targetDate)), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) {
    // Verhindert Hydration-Mismatch: Server rendert nichts, Client übernimmt sofort.
    return <div className="h-24" aria-hidden="true" />;
  }

  if (timeLeft.isPast) {
    return <p className="font-sans text-lg text-stone-600">Wir haben geheiratet! 🎉</p>;
  }

  const units = [
    { label: "Tage", value: timeLeft.days },
    { label: "Stunden", value: timeLeft.hours },
    { label: "Minuten", value: timeLeft.minutes },
    { label: "Sekunden", value: timeLeft.seconds },
  ];

  return (
    <div className="flex gap-4 sm:gap-8" role="timer" aria-live="off">
      {units.map((unit) => (
        <div key={unit.label} className="flex flex-col items-center">
          <span className="font-serif text-4xl text-stone-900 sm:text-5xl">
            {String(unit.value).padStart(2, "0")}
          </span>
          <span className="mt-1 text-xs uppercase tracking-wide text-stone-500">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}
