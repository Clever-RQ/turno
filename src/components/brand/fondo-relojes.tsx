/**
 * Fondo del login: unas pocas "o" de Turno sueltas, como relojes marcando
 * horas distintas. Colocadas a mano en los márgenes vacíos (nunca detrás
 * del texto ni del formulario) y muy tenues: textura, no protagonismo.
 */
const RELOJES = [
  { x: "4%", y: "10%", tam: 30, hora: 40 },
  { x: "13%", y: "86%", tam: 22, hora: 200 },
  { x: "3%", y: "56%", tam: 20, hora: 120 },
  { x: "41%", y: "6%", tam: 20, hora: 300 },
  { x: "47%", y: "90%", tam: 26, hora: 80 },
  { x: "93%", y: "8%", tam: 22, hora: 160 },
  { x: "96%", y: "48%", tam: 20, hora: 20 },
  { x: "88%", y: "92%", tam: 34, hora: 330 },
] as const;

/** "tenue": textura de fondo. "encendido": la copia que se ve cerca del cursor (LuzCursor). */
export function FondoRelojes({ intensidad = "tenue" }: { intensidad?: "tenue" | "encendido" }) {
  return (
    <div aria-hidden="true" className="absolute inset-0 hidden lg:block">
      {RELOJES.map(({ x, y, tam, hora }) => (
        <svg
          key={`${x}-${y}`}
          viewBox="0 0 24 24"
          className={`absolute -translate-x-1/2 -translate-y-1/2 ${intensidad === "encendido" ? "opacity-60" : "opacity-[0.11]"}`}
          style={{ left: x, top: y, width: tam, height: tam }}
        >
          <circle cx="12" cy="12" r="9" fill="none" stroke="#FFFFFF" strokeWidth="3" />
          <path d="M12 12 L12 6.5 A5.5 5.5 0 0 1 16.76 9.25 Z" fill="#10B981" transform={`rotate(${hora} 12 12)`} />
        </svg>
      ))}
    </div>
  );
}
