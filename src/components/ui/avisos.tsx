import type { ReactNode } from "react";

/** Error general del formulario (por ejemplo "Correo o contraseña incorrectos"). */
export function AvisoError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      {children}
    </p>
  );
}

/** Tarjeta verde con sobre: "Revisa tu correo". */
export function AvisoCorreo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div role="status" className="flex gap-4 rounded-2xl border border-esmeralda/40 bg-esmeralda/10 p-5">
      <svg viewBox="0 0 24 24" className="mt-0.5 size-6 shrink-0 text-enlace" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
      <div className="space-y-1">
        <p className="font-titulo text-lg font-semibold text-white">{titulo}</p>
        <div className="text-white/80">{children}</div>
      </div>
    </div>
  );
}

/** Línea con texto en el medio: "o con tu correo". */
export function Separador({ texto }: { texto: string }) {
  return (
    <div className="flex items-center gap-4 text-sm text-white/60">
      <span className="h-px flex-1 bg-white/15" />
      {texto}
      <span className="h-px flex-1 bg-white/15" />
    </div>
  );
}

/** Tarjeta de vidrio donde va cada formulario. */
export function TarjetaAuth({
  titulo,
  subtitulo,
  arriba,
  children,
}: {
  titulo: string;
  subtitulo?: ReactNode;
  /** Algo sobre el título, por ejemplo "‹ Volver a iniciar sesión" */
  arriba?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="anim-tarjeta rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
      {arriba && <div className="mb-6">{arriba}</div>}
      <h1 className="font-titulo text-[1.75rem] font-bold leading-tight tracking-tight text-white">{titulo}</h1>
      {subtitulo && <p className="mt-2 text-white/70">{subtitulo}</p>}
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

export const claseEnlace =
  "font-medium text-enlace underline underline-offset-4 hover:text-menta focus-visible:outline-2 focus-visible:outline-esmeralda rounded-sm";
