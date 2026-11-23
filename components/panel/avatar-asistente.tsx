/**
 * El asistente: la "o" del logo con ojos. Su franja verde muestra lo que está haciendo.
 *   atento    -> espera (franja quieta, mira al frente)
 *   pensando  -> la franja gira como un segundero y los ojos miran a un lado
 *   confirmo  -> la franja llena el reloj y sonríe
 */
export type EstadoAsistente = "atento" | "pensando" | "confirmo";

export function AvatarAsistente({ estado, className = "size-24" }: { estado: EstadoAsistente; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`${className} ${estado === "confirmo" ? "anim-pop" : ""}`} aria-hidden="true">
      <circle cx="32" cy="32" r="31" fill="#0B1F1A" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      <circle cx="32" cy="32" r="24" fill="#FFFFFF" />

      {estado === "confirmo" ? (
        <>
          <circle cx="32" cy="32" r="17" fill="#0B1F1A" />
          <circle cx="32" cy="32" r="14" fill="#10B981" />
          <path d="M23.5 35q3-4 6 0M34.5 35q3-4 6 0" fill="none" stroke="#0B1F1A" strokeWidth="2.6" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="32" cy="32" r="17" fill="#0B1F1A" />
          <path
            d="M32 32 L32 17 A15 15 0 0 1 45 24.5 Z"
            fill="#10B981"
            className={estado === "pensando" ? "anim-segundero" : undefined}
          />
          {estado === "pensando" ? (
            <>
              <circle cx="28.5" cy="37" r="2.6" fill="#FFFFFF" />
              <circle cx="38.5" cy="37" r="2.6" fill="#FFFFFF" />
            </>
          ) : (
            <>
              <circle cx="26" cy="38" r="2.6" fill="#FFFFFF" />
              <circle cx="38" cy="38" r="2.6" fill="#FFFFFF" />
            </>
          )}
        </>
      )}
    </svg>
  );
}
