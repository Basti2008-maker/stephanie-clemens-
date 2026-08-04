import Image from "next/image";

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

/**
 * Der Ausschnitt zeigt eine Ecke oben links. Durch Spiegeln bzw. Drehen
 * schmiegt sich dieselbe Grafik an jede beliebige Ecke.
 */
const POSITION: Record<Corner, string> = {
  "top-left": "top-0 left-0",
  "top-right": "top-0 right-0 -scale-x-100",
  "bottom-left": "bottom-0 left-0 -scale-y-100",
  "bottom-right": "bottom-0 right-0 rotate-180",
};

/**
 * Dezente Blumen-Dekoration aus dem Brandkit.
 * Die Illustration hat einen weissen Hintergrund – mix-blend-multiply laesst
 * dieses Weiss im creme Seitenhintergrund verschwinden, sodass nur die
 * Blumen sichtbar bleiben. Liegt immer hinter dem Inhalt und ist nie klickbar.
 *
 * Mit `fixed` bleibt die Dekoration beim Scrollen an ihrer Bildschirmecke
 * stehen, statt mit der Seite wegzuscrollen.
 */
export function Blumen({ corner, fixed = false }: { corner: Corner; fixed?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`${fixed ? "fixed" : "absolute"} pointer-events-none z-0 w-44 select-none mix-blend-multiply sm:w-64 lg:w-80 ${POSITION[corner]}`}
    >
      <Image
        src="/images/blumen-ecke.jpg"
        alt=""
        width={950}
        height={950}
        className="h-auto w-full opacity-70"
        priority={false}
      />
    </div>
  );
}
