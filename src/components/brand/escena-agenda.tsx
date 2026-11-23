/**
 * Escena del login: el asistente en el centro de un reloj y, a su lado,
 * las citas que van llegando una tras otra. Es el titular hecho animación:
 * "Mientras atiendes, tu agenda se llena sola".
 *
 * Solo CSS (sin JavaScript): la entrada se orquesta con retrasos y,
 * después, la franja gira como radar, el asistente parpadea y las citas flotan.
 * Con "reducir movimiento" todo queda quieto (ver globals.css).
 */
const MARCAS = Array.from({ length: 60 }, (_, i) => i);

const CITAS = [
  { hora: "3:00 p. m.", servicio: "Corte clásico", origen: "Web", desfase: "ml-0", retraso: "1.0s" },
  { hora: "4:30 p. m.", servicio: "Corte + barba", origen: "Asistente", desfase: "ml-6", retraso: "1.6s" },
  { hora: "6:00 p. m.", servicio: "Barba", origen: "QR", desfase: "ml-2", retraso: "2.2s" },
] as const;

export function EscenaAgenda() {
  return (
    <div aria-hidden="true" className="flex items-center gap-4 xl:gap-6">
      <svg viewBox="0 0 400 400" className="anim-escena size-56 shrink-0 overflow-visible xl:size-64">
        <defs>
          <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0.55" stopColor="#10B981" stopOpacity="0.18" />
            <stop offset="1" stopColor="#10B981" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="200" cy="200" r="200" fill="url(#halo)" />

        {/* Esfera del reloj: 60 marcas, las de cada hora más largas */}
        {MARCAS.map((i) => {
          const hora = i % 5 === 0;
          return (
            <line
              key={i}
              x1="200"
              y1={hora ? 22 : 28}
              x2="200"
              y2="38"
              stroke={hora ? "#10B981" : "#FFFFFF"}
              strokeOpacity={hora ? 0.55 : 0.14}
              strokeWidth={hora ? 3.5 : 1.8}
              strokeLinecap="round"
              transform={`rotate(${i * 6} 200 200)`}
            />
          );
        })}

        {/* El asistente: la "o" del logo con ojos */}
        <circle cx="200" cy="200" r="128" fill="#0B1F1A" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
        <circle cx="200" cy="200" r="100" fill="#FFFFFF" />
        <circle cx="200" cy="200" r="70" fill="#0B1F1A" />

        {/* Franja: gira como radar, con estela */}
        <g className="anim-radar-escena">
          <path d="M200 200 L200 138 A62 62 0 0 1 253.7 169 Z" fill="#10B981" opacity="0.14" transform="rotate(-48 200 200)" />
          <path d="M200 200 L200 138 A62 62 0 0 1 253.7 169 Z" fill="#10B981" opacity="0.32" transform="rotate(-24 200 200)" />
          <path d="M200 200 L200 138 A62 62 0 0 1 253.7 169 Z" fill="#10B981" />
        </g>

        {/* Ojos: miran hacia las citas y el formulario, y parpadean */}
        <g className="anim-parpadeo">
          <circle cx="190" cy="224" r="10" fill="#FFFFFF" />
          <circle cx="232" cy="224" r="10" fill="#FFFFFF" />
        </g>
      </svg>

      {/* Las citas que van llegando, como una agenda que se llena */}
      <ul className="space-y-3.5">
        {CITAS.map((cita, i) => (
          <li
            key={cita.hora}
            className={`anim-cita ${cita.desfase}`}
            style={{ animationDelay: `${cita.retraso}, calc(${cita.retraso} + 0.6s)`, ["--flotar" as string]: `${5 + i}s` }}
          >
            <div
              className={`flex w-max items-center gap-3.5 rounded-2xl border px-4 py-3 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9)] backdrop-blur-md ${
                cita.origen === "Asistente" ? "border-esmeralda/60 bg-[#0F2E24]/90" : "border-white/10 bg-[#0B1F1A]/85"
              }`}
            >
              <span
                className="anim-check grid size-7 shrink-0 place-items-center rounded-full bg-esmeralda text-tinta"
                style={{ animationDelay: `calc(${cita.retraso} + 0.25s)` }}
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12.5 4.5 4.5L19 7.5" />
                </svg>
              </span>
              <div className="leading-tight">
                <p className="text-base font-semibold whitespace-nowrap text-white">{cita.hora}</p>
                <p className="text-sm whitespace-nowrap text-white/65">{cita.servicio}</p>
              </div>
              <span
                className={`ml-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${
                  cita.origen === "Asistente" ? "bg-esmeralda/20 text-menta" : "bg-white/[0.07] text-white/70"
                }`}
              >
                {cita.origen}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
