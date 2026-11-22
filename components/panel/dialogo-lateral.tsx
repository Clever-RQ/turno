"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { IconoCerrar } from "@/components/iconos";

/**
 * Panel lateral (computadora) u hoja inferior (celular) para crear y editar.
 * Usa <dialog> nativo: atrapa el foco, se cierra con Esc y oscurece el fondo.
 */
export function DialogoLateral({
  abierto,
  titulo,
  alCerrar,
  children,
}: {
  abierto: boolean;
  titulo: string;
  alCerrar: () => void;
  children: ReactNode;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    if (abierto) dialogo.current?.showModal();
    else dialogo.current?.close();
  }, [abierto]);

  return (
    <dialog
      ref={dialogo}
      onClose={alCerrar}
      aria-labelledby={idTitulo}
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none rounded-t-3xl border border-white/10 bg-tinta p-6 text-white backdrop:bg-black/60 md:my-4 md:ml-auto md:mr-4 md:h-[calc(100dvh-2rem)] md:max-h-none md:w-[28rem] md:rounded-3xl md:p-8"
    >
      {abierto && (
        <div className="flex h-full flex-col">
          <div aria-hidden="true" className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/20 md:hidden" />
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 id={idTitulo} className="font-titulo text-2xl font-bold sm:text-3xl">
              {titulo}
            </h2>
            <button
              type="button"
              onClick={alCerrar}
              aria-label="Cerrar"
              className="hidden size-11 place-items-center rounded-xl hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-esmeralda md:grid"
            >
              <IconoCerrar className="size-6" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

/** Fila inferior del formulario: "Eliminar …" a la izquierda (si aplica) y "Cancelar". */
export function AccionesDialogo({
  textoEliminar,
  alEliminar,
  alCancelar,
}: {
  textoEliminar?: string;
  alEliminar?: () => void;
  alCancelar: () => void;
}) {
  return (
    <div className={`flex items-center pt-1 ${alEliminar ? "justify-between" : "justify-center"}`}>
      {alEliminar && (
        <button
          type="button"
          onClick={alEliminar}
          className="py-2 font-medium text-red-300 hover:text-red-200 focus-visible:outline-2 focus-visible:outline-esmeralda"
        >
          {textoEliminar}
        </button>
      )}
      <button type="button" onClick={alCancelar} className="py-2 text-white/80 hover:text-white">
        Cancelar
      </button>
    </div>
  );
}
