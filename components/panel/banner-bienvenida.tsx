"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** "¡Listo! Tu negocio ya tiene su link." — se muestra al terminar el onboarding. */
export function BannerBienvenida({ dominio, slug }: { dominio: string; slug: string }) {
  const router = useRouter();
  const [copiado, setCopiado] = useState(false);
  const url = `https://${dominio}/${slug}`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso para el portapapeles: el link igual está visible para copiarlo a mano.
    }
  }

  return (
    <div
      role="status"
      className="flex flex-col gap-4 rounded-3xl border border-esmeralda/40 bg-white/[0.04] p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:gap-6 sm:p-6"
    >
      <AvatarConfirmo />
      <div className="min-w-0 flex-1">
        <p className="font-titulo text-xl font-bold text-white">¡Listo! Tu negocio ya tiene su link.</p>
        <p className="mt-1 truncate text-white/60">
          {dominio}/<span className="font-semibold text-white">{slug}</span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={copiar}
          className="flex-1 rounded-xl bg-esmeralda px-6 py-3 font-medium text-tinta transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-enlace sm:flex-none"
        >
          {copiado ? "¡Copiado!" : "Copiar link"}
        </button>
        <button
          type="button"
          onClick={() => router.replace("/panel")}
          aria-label="Cerrar aviso"
          className="grid size-11 place-items-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-esmeralda"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// El asistente en estado "Confirmó": la franja llena el reloj y cierra los ojos.
function AvatarConfirmo() {
  return (
    <svg viewBox="0 0 64 64" className="size-14 shrink-0" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="#0B1F1A" />
      <circle cx="32" cy="32" r="22" fill="#FFFFFF" />
      <circle cx="32" cy="32" r="16" fill="#10B981" />
      <path d="M23 36q3-4 6 0M35 36q3-4 6 0" fill="none" stroke="#0B1F1A" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
