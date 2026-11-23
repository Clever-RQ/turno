"use client";

import { useEffect } from "react";
import { IconoCerrar } from "@/components/iconos";
import { AvatarAsistente } from "./avatar-asistente";

/** Aviso del asistente (estado "Confirmó") con acción opcional. Se cierra solo. */
export function AvisoAsistente({
  titulo,
  texto,
  accion,
  alAccion,
  alCerrar,
  duracionMs = 7000,
}: {
  titulo: string;
  texto?: string;
  accion?: string;
  alAccion?: () => void;
  alCerrar: () => void;
  duracionMs?: number;
}) {
  useEffect(() => {
    const t = setTimeout(alCerrar, duracionMs);
    return () => clearTimeout(t);
  }, [alCerrar, duracionMs]);

  return (
    <div
      role="status"
      className="anim-aviso flex items-center gap-4 rounded-3xl border border-esmeralda/40 bg-tinta/95 p-4 pr-3 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:pr-4"
    >
      <AvatarAsistente estado="confirmo" className="size-12 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-titulo font-bold text-white">{titulo}</p>
        {texto && <p className="text-sm text-white/70">{texto}</p>}
      </div>
      {accion && alAccion && (
        <button
          type="button"
          onClick={alAccion}
          className="shrink-0 rounded-xl border border-esmeralda/50 px-4 py-2.5 font-medium text-menta transition hover:bg-esmeralda/15 focus-visible:outline-2 focus-visible:outline-esmeralda"
        >
          {accion}
        </button>
      )}
      <button
        type="button"
        onClick={alCerrar}
        aria-label="Cerrar aviso"
        className="grid size-10 shrink-0 place-items-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-esmeralda"
      >
        <IconoCerrar />
      </button>
    </div>
  );
}
