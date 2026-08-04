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
 * Weiches Auslaufen zur Bildmitte hin. Der Zuschnitt aus dem Rahmen kann die
 * nach innen wachsenden Zweige nicht anders als durchschneiden – der
 * Verlauf loest die Schnittkanten auf, sodass die Aeste sanft im Hintergrund
 * verschwinden statt abrupt zu enden.
 *
 * Der Verlauf sitzt in der Ecke oben links, also in derselben Ecke, an der
 * die Grafik verankert ist. Spiegelung und Drehung nehmen ihn mit.
 */
const FADE =
  "radial-gradient(circle at top left, #000 34%, rgba(0,0,0,0.55) 56%, rgba(0,0,0,0.18) 70%, transparent 80%)";

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
      style={{ WebkitMaskImage: FADE, maskImage: FADE }}
      className={`${fixed ? "fixed" : "absolute"} pointer-events-none z-0 w-48 select-none mix-blend-multiply sm:w-72 lg:w-[22rem] ${POSITION[corner]}`}
    >
      <Image
        src="/images/blumen-ecke.jpg"
        alt=""
        width={1000}
        height={1000}
        className="h-auto w-full opacity-50"
        priority={false}
      />
    </div>
  );
}
