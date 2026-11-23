"use client";

import { useState } from "react";
import { IconoCheck, IconoCopiar } from "./iconos";

/** Copia un texto al portapapeles y confirma con un check por 2 segundos. */
export function BotonCopiar({ texto, etiqueta = "Copiar" }: { texto: string; etiqueta?: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso para el portapapeles: el texto igual está visible para copiarlo a mano.
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className="flex shrink-0 items-center gap-2 rounded-xl bg-esmeralda px-3.5 py-2.5 text-sm font-semibold text-tinta shadow-[0_8px_24px_-10px_rgba(16,185,129,0.8)] transition hover:bg-emerald-400 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-enlace"
    >
      {copiado ? <IconoCheck className="size-4" /> : <IconoCopiar className="size-4" />}
      <span aria-live="polite">{copiado ? "¡Copiado!" : etiqueta}</span>
    </button>
  );
}
