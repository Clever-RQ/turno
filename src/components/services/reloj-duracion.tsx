/**
 * Reloj de la marca que muestra cuánto dura un servicio: la franja verde
 * cubre la parte de la hora que ocupa (30 min = medio reloj). Si pasa de
 * una hora, el reloj se llena y un arco exterior marca lo que sobra.
 */
const CENTRO = 22;

function punto(radio: number, fraccion: number) {
  const angulo = fraccion * 2 * Math.PI;
  return `${(CENTRO + radio * Math.sin(angulo)).toFixed(2)} ${(CENTRO - radio * Math.cos(angulo)).toFixed(2)}`;
}

/** Sector de círculo desde las 12 hasta la fracción indicada (0..1). */
function sector(radio: number, fraccion: number) {
  if (fraccion >= 1) return `M${CENTRO} ${CENTRO - radio} A${radio} ${radio} 0 1 1 ${CENTRO - 0.01} ${CENTRO - radio} Z`;
  return `M${CENTRO} ${CENTRO} L${CENTRO} ${CENTRO - radio} A${radio} ${radio} 0 ${fraccion > 0.5 ? 1 : 0} 1 ${punto(radio, fraccion)} Z`;
}

/** Arco (solo trazo) desde las 12 hasta la fracción indicada. */
function arco(radio: number, fraccion: number) {
  const f = Math.min(fraccion, 0.999);
  return `M${CENTRO} ${CENTRO - radio} A${radio} ${radio} 0 ${f > 0.5 ? 1 : 0} 1 ${punto(radio, f)}`;
}

export function RelojDuracion({ minutos, activo, className = "size-11" }: { minutos: number; activo: boolean; className?: string }) {
  const hora = Math.min(minutos / 60, 1);
  const extra = Math.max(minutos - 60, 0) / 60;
  const verde = activo ? "#10B981" : "rgba(255,255,255,0.28)";

  return (
    <svg viewBox="0 0 44 44" className={`shrink-0 ${className}`} aria-hidden="true">
      <circle cx={CENTRO} cy={CENTRO} r="15" fill="#0B1F1A" stroke={activo ? "#FFFFFF" : "rgba(255,255,255,0.35)"} strokeWidth="4" />
      <path d={sector(10, hora)} fill={verde} />
      {extra > 0 && <path d={arco(20.5, extra)} fill="none" stroke={verde} strokeWidth="2.5" strokeLinecap="round" />}
    </svg>
  );
}
