"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AvatarAsistente } from "./avatar-asistente";

export type OpcionesConfirmar = {
  titulo: string;
  texto?: string;
  /** Texto del botón que confirma: "Eliminar", "Borrar horario"… */
  confirmar: string;
  cancelar?: string;
  /** Acción destructiva: botón rojo y el foco empieza en "Cancelar". */
  peligro?: boolean;
};

type Pedido = OpcionesConfirmar & { responder: (si: boolean) => void };

/**
 * Reemplazo de window.confirm con el estilo de Turno.
 *   const [confirmar, dialogo] = useConfirmar();
 *   if (!(await confirmar({ titulo: "¿Eliminar?", confirmar: "Eliminar", peligro: true }))) return;
 *   ...y renderizar {dialogo} en el componente.
 */
export function useConfirmar() {
  const [pedido, setPedido] = useState<Pedido | null>(null);

  const confirmar = useCallback(
    (opciones: OpcionesConfirmar) =>
      new Promise<boolean>((resolver) => setPedido({ ...opciones, responder: resolver })),
    [],
  );

  const responder = useCallback(
    (si: boolean) => {
      pedido?.responder(si);
      setPedido(null);
    },
    [pedido],
  );

  return [confirmar, <DialogoConfirmar key="confirmar" pedido={pedido} alResponder={responder} />] as const;
}

function DialogoConfirmar({ pedido, alResponder }: { pedido: Pedido | null; alResponder: (si: boolean) => void }) {
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (pedido) dialogo.current?.showModal();
    else dialogo.current?.close();
  }, [pedido]);

  return (
    <dialog
      ref={dialogo}
      // Esc o clic fuera de la tarjeta = cancelar
      onCancel={(e) => {
        e.preventDefault();
        alResponder(false);
      }}
      onClick={(e) => {
        if (e.target === dialogo.current) alResponder(false);
      }}
      aria-labelledby="confirmar-titulo"
      aria-describedby="confirmar-texto"
      className="anim-fondo m-auto w-[calc(100%-2rem)] max-w-md bg-transparent p-0 text-white backdrop:bg-[#030907]/70 backdrop:backdrop-blur-sm"
    >
      {pedido && (
        <div className="anim-dialogo rounded-3xl border border-white/10 bg-tinta p-7 text-center shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] sm:p-8">
          <AvatarAsistente estado="pensando" className="mx-auto size-20" />
          <h2 id="confirmar-titulo" className="mt-5 font-titulo text-2xl font-bold">
            {pedido.titulo}
          </h2>
          {pedido.texto && (
            <p id="confirmar-texto" className="mx-auto mt-2 max-w-sm text-white/70">
              {pedido.texto}
            </p>
          )}
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              autoFocus={pedido.peligro}
              onClick={() => alResponder(false)}
              className="flex-1 rounded-xl border border-white/15 py-3.5 font-medium text-white/85 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-enlace"
            >
              {pedido.cancelar ?? "Cancelar"}
            </button>
            <button
              type="button"
              autoFocus={!pedido.peligro}
              onClick={() => alResponder(true)}
              className={`flex-1 rounded-xl py-3.5 font-medium text-tinta transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-enlace ${
                pedido.peligro ? "bg-red-400 hover:bg-red-300" : "bg-esmeralda hover:bg-emerald-400"
              }`}
            >
              {pedido.confirmar}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
