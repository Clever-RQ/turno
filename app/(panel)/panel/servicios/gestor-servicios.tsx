"use client";

import { useOptimistic, useState, useTransition } from "react";
import { AvisoError } from "@/components/auth/avisos";
import { IconoLapiz } from "@/components/iconos";
import { AvatarAtento } from "@/components/panel/avatar-atento";
import { AccionesDialogo, DialogoLateral } from "@/components/panel/dialogo-lateral";
import { useConfirmar } from "@/components/panel/confirmar";
import { FormularioServicio, Interruptor } from "@/components/servicios/formulario-servicio";
import { cambiarActivoServicio, eliminarServicio } from "@/lib/acciones/servicios";
import { formatearPrecio, resumenServicio, type Servicio } from "@/lib/servicios";

/** Qué muestra el diálogo: nada, un servicio nuevo o uno existente. */
type Edicion = null | "nuevo" | Servicio;

export function GestorServicios({ servicios }: { servicios: Servicio[] }) {
  const [edicion, setEdicion] = useState<Edicion>(null);
  const [error, setError] = useState<string | null>(null);
  const [, iniciar] = useTransition();
  const [confirmar, dialogoConfirmar] = useConfirmar();

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
      {dialogoConfirmar}
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
        alEliminar={async (s) => {
          const si = await confirmar({
            titulo: `¿Eliminar «${s.nombre}»?`,
            texto: "Esta acción no se puede deshacer. Si solo quieres ocultarlo, desactívalo.",
            confirmar: "Eliminar",
            peligro: true,
          });
          if (!si) return;
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

function DialogoServicio({
  edicion,
  alCerrar,
  alEliminar,
}: {
  edicion: Edicion;
  alCerrar: () => void;
  alEliminar: (s: Servicio) => void;
}) {
  const servicio = edicion && edicion !== "nuevo" ? edicion : undefined;

  return (
    <DialogoLateral abierto={Boolean(edicion)} titulo={servicio ? "Editar servicio" : "Nuevo servicio"} alCerrar={alCerrar}>
      <FormularioServicio
        key={servicio?.id ?? "nuevo"}
        servicio={servicio}
        variante="dialogo"
        textoBoton={servicio ? "Guardar cambios" : "Guardar servicio"}
        alGuardar={alCerrar}
      >
        <AccionesDialogo
          textoEliminar="Eliminar servicio"
          alEliminar={servicio ? () => alEliminar(servicio) : undefined}
          alCancelar={alCerrar}
        />
      </FormularioServicio>
    </DialogoLateral>
  );
}
