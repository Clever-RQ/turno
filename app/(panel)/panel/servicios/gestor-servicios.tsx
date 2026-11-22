"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { AvisoError } from "@/components/auth/avisos";
import { IconoCerrar, IconoLapiz } from "@/components/iconos";
import { FormularioServicio, Interruptor } from "@/components/servicios/formulario-servicio";
import { cambiarActivoServicio, eliminarServicio } from "@/lib/acciones/servicios";
import { formatearPrecio, resumenServicio, type Servicio } from "@/lib/servicios";

/** Qué muestra el diálogo: nada, un servicio nuevo o uno existente. */
type Edicion = null | "nuevo" | Servicio;

export function GestorServicios({ servicios }: { servicios: Servicio[] }) {
  const [edicion, setEdicion] = useState<Edicion>(null);
  const [error, setError] = useState<string | null>(null);
  const [, iniciar] = useTransition();

  // El interruptor cambia al instante; si el servidor falla, refresh() lo devuelve a su valor real.
  const [visibles, cambiarVisible] = useOptimistic(
    servicios,
    (lista, cambio: { id: string; activo: boolean }) =>
      lista.map((s) => (s.id === cambio.id ? { ...s, activo: cambio.activo } : s)),
  );

  function alternar(servicio: Servicio, activo: boolean) {
    iniciar(async () => {
      cambiarVisible({ id: servicio.id, activo });
      await cambiarActivoServicio(servicio.id, activo);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-titulo text-4xl font-bold tracking-tight text-white sm:text-5xl">Servicios</h1>
          <p className="mt-2 text-white/70">
            Lo que tus clientes pueden reservar.
            <span className="hidden sm:inline"> Los inactivos no aparecen en tu página.</span>
          </p>
        </div>
        {visibles.length > 0 && (
          <button
            type="button"
            onClick={() => setEdicion("nuevo")}
            className="rounded-xl bg-esmeralda px-5 py-3 font-medium text-tinta shadow-[0_10px_40px_-8px_rgba(16,185,129,0.6)] transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-enlace"
          >
            + Nuevo<span className="hidden sm:inline"> servicio</span>
          </button>
        )}
      </div>

      {error && <AvisoError>{error}</AvisoError>}

      {visibles.length === 0 ? (
        <EstadoVacio alAgregar={() => setEdicion("nuevo")} />
      ) : (
        <>
          {/* Computadora: tabla */}
          <div className="hidden overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] md:block">
            <table className="w-full text-left">
              <thead className="text-sm text-white/60">
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 font-normal">Servicio</th>
                  <th className="px-6 py-4 font-normal">Duración</th>
                  <th className="px-6 py-4 font-normal">Precio</th>
                  <th className="px-6 py-4 font-normal">Estado</th>
                  <th className="px-6 py-4"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((s) => (
                  <tr key={s.id} className={`border-b border-white/5 last:border-0 ${s.activo ? "" : "text-white/45"}`}>
                    <td className={`px-6 py-4 font-semibold ${s.activo ? "text-white" : ""}`}>{s.nombre}</td>
                    <td className="px-6 py-4">{s.duracion_min} min</td>
                    <td className="px-6 py-4">{formatearPrecio(s.precio)}</td>
                    <td className="px-6 py-4">
                      <Interruptor
                        checked={s.activo}
                        onChange={(activo) => alternar(s, activo)}
                        etiqueta={`${s.nombre} visible para tus clientes`}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <BotonEditar servicio={s} alEditar={setEdicion} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Celular: tarjetas */}
          <ul className="space-y-4 md:hidden">
            {visibles.map((s) => (
              <li key={s.id} className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <p className={`truncate font-titulo text-xl font-bold ${s.activo ? "text-white" : "text-white/50"}`}>{s.nombre}</p>
                    <p className="text-white/70">{resumenServicio(s)}</p>
                  </div>
                  <Interruptor
                    checked={s.activo}
                    onChange={(activo) => alternar(s, activo)}
                    etiqueta={`${s.nombre} visible para tus clientes`}
                  />
                </div>
                <BotonEditar servicio={s} alEditar={setEdicion} />
              </li>
            ))}
          </ul>
        </>
      )}

      <DialogoServicio
        edicion={edicion}
        alCerrar={() => setEdicion(null)}
        alEliminar={(s) => {
          if (!window.confirm(`¿Eliminar "${s.nombre}"? Esta acción no se puede deshacer.`)) return;
          iniciar(async () => {
            const mensaje = await eliminarServicio(s.id);
            setError(mensaje);
            setEdicion(null);
          });
        }}
      />
    </div>
  );
}

function BotonEditar({ servicio, alEditar }: { servicio: Servicio; alEditar: (s: Servicio) => void }) {
  return (
    <button
      type="button"
      onClick={() => alEditar(servicio)}
      aria-label={`Editar ${servicio.nombre}`}
      className="grid size-11 place-items-center rounded-xl text-white/80 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-esmeralda"
    >
      <IconoLapiz />
    </button>
  );
}

function EstadoVacio({ alAgregar }: { alAgregar: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-14 text-center">
      <AvatarAtento />
      <h2 className="mt-6 font-titulo text-2xl font-bold text-white sm:text-3xl">Aún no tienes servicios</h2>
      <p className="mt-3 max-w-md text-white/70">
        Agrega lo que ofreces, con su duración y precio. Así tus clientes y el asistente podrán reservarlo.
      </p>
      <button
        type="button"
        onClick={alAgregar}
        className="mt-6 rounded-xl bg-esmeralda px-8 py-3.5 font-medium text-tinta shadow-[0_10px_40px_-8px_rgba(16,185,129,0.6)] transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-enlace"
      >
        + Agregar mi primer servicio
      </button>
    </div>
  );
}

/**
 * Panel lateral (computadora) u hoja inferior (celular).
 * Usa <dialog> nativo: atrapa el foco, se cierra con Esc y oscurece el fondo.
 */
function DialogoServicio({
  edicion,
  alCerrar,
  alEliminar,
}: {
  edicion: Edicion;
  alCerrar: () => void;
  alEliminar: (s: Servicio) => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const servicio = edicion && edicion !== "nuevo" ? edicion : undefined;

  useEffect(() => {
    if (edicion) dialogo.current?.showModal();
    else dialogo.current?.close();
  }, [edicion]);

  return (
    <dialog
      ref={dialogo}
      onClose={alCerrar}
      aria-labelledby="titulo-dialogo-servicio"
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none rounded-t-3xl border border-white/10 bg-tinta p-6 text-white backdrop:bg-black/60 md:ml-auto md:mr-4 md:my-4 md:h-[calc(100dvh-2rem)] md:max-h-none md:w-[28rem] md:rounded-3xl md:p-8"
    >
      {edicion && (
        <div className="flex h-full flex-col">
          <div aria-hidden="true" className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/20 md:hidden" />
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 id="titulo-dialogo-servicio" className="font-titulo text-2xl font-bold sm:text-3xl">
              {servicio ? "Editar servicio" : "Nuevo servicio"}
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

          <FormularioServicio
            key={servicio?.id ?? "nuevo"}
            servicio={servicio}
            variante="dialogo"
            textoBoton={servicio ? "Guardar cambios" : "Guardar servicio"}
            alGuardar={alCerrar}
          >
            <div className={`flex items-center pt-1 ${servicio ? "justify-between" : "justify-center"}`}>
              {servicio && (
                <button
                  type="button"
                  onClick={() => alEliminar(servicio)}
                  className="py-2 font-medium text-red-300 hover:text-red-200 focus-visible:outline-2 focus-visible:outline-esmeralda"
                >
                  Eliminar servicio
                </button>
              )}
              <button type="button" onClick={alCerrar} className="py-2 text-white/80 hover:text-white">
                Cancelar
              </button>
            </div>
          </FormularioServicio>
        </div>
      )}
    </dialog>
  );
}

// El asistente en estado "Atento" (la "o" del logo con ojos).
function AvatarAtento() {
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
