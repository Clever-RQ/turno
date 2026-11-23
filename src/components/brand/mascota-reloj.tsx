/**
 * El asistente en pequeño: la franja va y viene arriba (como el logo respirando) y parpadea.
 * Versión compacta de la escena del login, para celular y tablet.
 * Usa las mismas animaciones que EscenaAgenda (globals.css).
 */
export function MascotaReloj({ className = "size-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" aria-hidden="true" className={`anim-escena shrink-0 overflow-visible ${className}`}>
      <circle cx="200" cy="200" r="190" fill="#0B1F1A" stroke="rgba(255,255,255,0.14)" strokeWidth="6" />
      <circle cx="200" cy="200" r="148" fill="#FFFFFF" />
      <circle cx="200" cy="200" r="104" fill="#0B1F1A" />
      {/* En pequeño la franja no da la vuelta (pasaría bajo los ojos): va y viene arriba */}
      <g className="anim-vaiven">
        <path d="M200 200 L200 108 A92 92 0 0 1 279.7 154 Z" fill="#10B981" />
      </g>
      <g className="anim-parpadeo">
        <circle cx="184" cy="236" r="15" fill="#FFFFFF" />
        <circle cx="244" cy="236" r="15" fill="#FFFFFF" />
      </g>
    </svg>
  );
}
