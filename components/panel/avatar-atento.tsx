// El asistente en estado "Atento" (la "o" del logo con ojos).
export function AvatarAtento() {
  return (
    <svg viewBox="0 0 64 64" className="size-24" aria-hidden="true">
      <circle cx="32" cy="32" r="31" fill="#0B1F1A" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      <circle cx="32" cy="32" r="24" fill="#FFFFFF" />
      <circle cx="32" cy="32" r="17" fill="#0B1F1A" />
      <path d="M32 32 L32 17 A15 15 0 0 1 45 24.5 Z" fill="#10B981" />
      <circle cx="26" cy="38" r="2.6" fill="#FFFFFF" />
      <circle cx="38" cy="38" r="2.6" fill="#FFFFFF" />
    </svg>
  );
}
