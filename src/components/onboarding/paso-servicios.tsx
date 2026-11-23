"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { AvisoError } from "@/components/ui/avisos";
import { useConfirmar } from "@/components/brand/confirmar";
import { IconoEnlace, IconoLapiz, IconoPapelera } from "@/components/ui/iconos";
import { FormularioServicio } from "@/components/services/formulario-servicio";
import { eliminarServicio } from "@/server/actions/servicios";
import type { Negocio } from "@/server/data/negocio";
import { formatearPrecio, resumenServicio, type Servicio } from "@/domain/servicios";
import { formatearTelefono } from "@/domain/telefono";
import { iniciales } from "@/domain/texto";

type Props = { negocio: Negocio; servicios: Servicio[]; dominio: string };

export function PasoServicios({ negocio, servicios, dominio }: Props) {
  const [editando, setEditando] = useState<Servicio | null>(null);
  // Cambia después de cada guardado para montar un formulario limpio.
  const [versionFormulario, setVersionFormulario] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [eliminando, iniciarEliminacion] = useTransition();
  const [confirmar, dialogoConfirmar] = useConfirmar();

  function terminarEdicion() {
    setEditando(null);
    setVersionFormulario((v) => v + 1);
  }

  async function eliminar(servicio: Servicio) {
    const si = await confirmar({
      titulo: `¿Eliminar «${servicio.nombre}»?`,
      texto: "Tus clientes ya no podrán reservarlo.",
      confirmar: "Eliminar",
      peligro: true,
    });
    if (!si) return;
    iniciarEliminacion(async () => {
      setError(await eliminarServicio(servicio.id));
      if (editando?.id === servicio.id) terminarEdicion();
    });
  }

  return (
    <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-20">
      {dialogoConfirmar}
      {/* Vista previa (solo computadora): ya con sus servicios reales */}
      <section aria-label="Vista previa" className="hidden space-y-6 lg:block lg:pt-24">
        <p className="text-lg text-enlace">Así te verán tus clientes</p>
        <div className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <div className="flex items-center gap-4">
            <span className="grid size-20 shrink-0 place-items-center rounded-full bg-menta font-titulo text-2xl font-bold text-tinta">
              {iniciales(negocio.nombre)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-titulo text-3xl font-bold text-white">{negocio.nombre}</p>
              {negocio.telefono && <p className="text-white/70">{formatearTelefono(negocio.telefono)}</p>}
            </div>
          </div>
          <p className="font-medium text-white">Elige un servicio</p>
          {servicios.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/15 px-6 py-5 text-white/60">
              Tus servicios aparecerán aquí.
            </p>
          ) : (
            <ul className="space-y-3">
              {servicios.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-4">
                  <span>
                    <span className="block font-semibold text-white">{s.nombre}</span>
                    <span className="text-sm text-white/60">{s.duracion_min} min</span>
                  </span>
                  {s.precio !== null && <span className="font-semibold text-enlace">{formatearPrecio(s.precio)}</span>}
                </li>
              ))}
            </ul>
          )}
          <div aria-hidden="true" className="rounded-xl bg-esmeralda py-3.5 text-center font-medium text-tinta">
            Reservar
          </div>
        </div>
        <div className="rounded-3xl border border-esmeralda/40 bg-esmeralda/[0.08] px-7 py-5">
          <p className="text-enlace">Tu link para compartir</p>
          <p className="mt-1 flex min-w-0 items-center gap-2 text-xl">
            <IconoEnlace className="size-5 shrink-0 text-enlace" />
            <span className="truncate text-white/60">
              {dominio}/<span className="font-semibold text-white">{negocio.slug}</span>
            </span>
          </p>
        </div>
      </section>

      {/* Lista + formulario */}
      <section className="space-y-6 lg:rounded-3xl lg:border lg:border-white/10 lg:bg-white/[0.04] lg:p-10 lg:shadow-2xl lg:backdrop-blur-xl">
        <div>
          <h1 className="font-titulo text-4xl font-bold tracking-tight text-white sm:text-5xl">Agrega tus servicios</h1>
          <p className="mt-3 text-lg text-white/70">
            Tus clientes eligen uno al reservar. Puedes agregar más o cambiarlos desde el panel.
          </p>
        </div>

        {error && <AvisoError>{error}</AvisoError>}

        {servicios.length > 0 && (
          <div className="space-y-3">
            <p className="text-white/70">
              Agregaste {servicios.length} {servicios.length === 1 ? "servicio" : "servicios"}
            </p>
            <ul className="space-y-3">
              {servicios.map((s) => (
                <li
                  key={s.id}
                  className={`flex items-center gap-2 rounded-2xl border px-5 py-3 ${
                    editando?.id === s.id ? "border-esmeralda/60 bg-esmeralda/10" : "border-white/10 bg-white/[0.04]"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">{s.nombre}</p>
                    <p className="text-sm text-white/70">{resumenServicio(s)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditando(s)}
                    aria-label={`Editar ${s.nombre}`}
                    className="grid size-11 place-items-center rounded-xl text-white/80 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-esmeralda"
                  >
                    <IconoLapiz />
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminar(s)}
                    disabled={eliminando}
                    aria-label={`Eliminar ${s.nombre}`}
                    className="grid size-11 place-items-center rounded-xl text-white/80 hover:bg-red-500/15 hover:text-red-200 focus-visible:outline-2 focus-visible:outline-esmeralda disabled:opacity-50"
                  >
                    <IconoPapelera />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 sm:p-6">
          <p className="mb-4 font-semibold text-white">{editando ? `Editar "${editando.nombre}"` : "Nuevo servicio"}</p>
          <FormularioServicio
            key={editando?.id ?? `nuevo-${versionFormulario}`}
            servicio={editando ?? undefined}
            variante="tarjeta"
            textoBoton={editando ? "Guardar cambios" : "+ Agregar servicio"}
            alGuardar={terminarEdicion}
          >
            {editando && (
              <button type="button" onClick={terminarEdicion} className="w-full py-2 text-white/70 hover:text-white">
                Cancelar edición
              </button>
            )}
          </FormularioServicio>
        </div>

        <div className="space-y-2 pt-2">
          {servicios.length > 0 ? (
            <Link
              href="/panel?bienvenida=1"
              className="block w-full rounded-xl bg-esmeralda py-4 text-center text-lg font-medium text-tinta shadow-[0_10px_40px_-8px_rgba(16,185,129,0.6)] transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-enlace"
            >
              Continuar al panel
            </Link>
          ) : null}
          <Link
            href="/panel?bienvenida=1"
            className="block w-full py-3 text-center text-white/80 hover:text-white focus-visible:outline-2 focus-visible:outline-esmeralda"
          >
            Lo haré después
          </Link>
        </div>
      </section>
    </div>
  );
}
