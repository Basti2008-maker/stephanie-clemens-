import Image from "next/image";

type Corner = "top-left" | "bottom-right" | "bottom-left";

const POSITION: Record<Corner, string> = {
  "top-left": "top-0 left-0",
  "bottom-right": "bottom-0 right-0 rotate-180",
  "bottom-left": "bottom-0 left-0 -scale-y-100",
};

/**
 * Dezente Blumen-Dekoration aus dem Brandkit.
 * Die Illustration hat einen weissen Hintergrund – mix-blend-multiply laesst
 * dieses Weiss im creme Seitenhintergrund verschwinden, sodass nur die
 * Blumen sichtbar bleiben. Liegt immer hinter dem Inhalt und ist nie klickbar.
 */
export function Blumen({ corner }: { corner: Corner }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute z-0 w-40 select-none mix-blend-multiply sm:w-64 lg:w-80 ${POSITION[corner]}`}
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
