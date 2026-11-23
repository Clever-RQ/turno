"use client";

import { useActionState, useEffect, useOptimistic, useState, useTransition } from "react";
import { AvisoError } from "@/components/ui/avisos";
import { claseInput } from "@/components/ui/campo";
import { IconoLapiz } from "@/components/ui/iconos";
import { AvatarAtento } from "@/components/brand/avatar-atento";
import { AccionesDialogo, DialogoLateral } from "@/components/panel/dialogo-lateral";
import { useConfirmar } from "@/components/brand/confirmar";
import { Interruptor } from "@/components/ui/interruptor";
import {
  cambiarActivoPersona,
  eliminarPersona,
  guardarPersona,
  type EstadoPersona,
} from "@/server/actions/equipo";
import type { Persona } from "@/server/data/negocio";
import { iniciales } from "@/domain/texto";

type Edicion = null | "nueva" | Persona;

export function GestorEquipo({ personal }: { personal: Persona[] }) {
  const [edicion, setEdicion] = useState<Edicion>(null);
  const [error, setError] = useState<string | null>(null);
  const [, iniciar] = useTransition();
  const [confirmar, dialogoConfirmar] = useConfirmar();

  // El interruptor cambia al instante; refresh() trae el valor real del servidor.
  const [visibles, cambiarVisible] = useOptimistic(
    personal,
    (lista, cambio: { id: string; activo: boolean }) =>
      lista.map((p) => (p.id === cambio.id ? { ...p, activo: cambio.activo } : p)),
  );

  const hayActivos = visibles.some((p) => p.activo);

  function alternar(persona: Persona, activo: boolean) {
    iniciar(async () => {
      cambiarVisible({ id: persona.id, activo });
      await cambiarActivoPersona(persona.id, activo);
    });
  }

  async function eliminar(persona: Persona) {
    const si = await confirmar({
      titulo: `¿Eliminar a ${persona.nombre}?`,
      texto: "Esta acción no se puede deshacer. Si solo no va a atender un tiempo, mejor desactívala.",
      confirmar: "Eliminar",
      peligro: true,
    });
    if (!si) return;
    iniciar(async () => {
      setError(await eliminarPersona(persona.id));
      setEdicion(null);
    });
  }

  const persona = edicion && edicion !== "nueva" ? edicion : undefined;

  return (
    <div className="space-y-6">
      {dialogoConfirmar}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-titulo text-4xl font-bold tracking-tight text-white sm:text-5xl">Equipo</h1>
          <p className="mt-2 text-white/70">
            Quién atiende en tu negocio.
            <span className="hidden sm:inline"> Cada cita se reserva con una persona.</span>
          </p>
        </div>
        {visibles.length > 0 && (
          <button
            type="button"
            onClick={() => setEdicion("nueva")}
            className="rounded-xl bg-esmeralda px-5 py-3 font-medium text-tinta shadow-[0_10px_40px_-8px_rgba(16,185,129,0.6)] transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-enlace"
          >
            + Agregar<span className="hidden sm:inline"> persona</span>
          </button>
        )}
      </div>

      {error && <AvisoError>{error}</AvisoError>}

      {visibles.length > 0 && !hayActivos && (
        <p role="status" className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-5 py-4 text-white/85">
          No hay nadie activo. Sin personal activo tus clientes no podrán reservar.
        </p>
      )}

      {visibles.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-14 text-center">
          <AvatarAtento />
          <h2 className="mt-6 font-titulo text-2xl font-bold text-white sm:text-3xl">Tu equipo está vacío</h2>
          <p className="mt-3 max-w-md text-white/70">
            Agrega a quienes atienden. Si trabajas solo, agrégate a ti: cada cita necesita a alguien que la atienda.
          </p>
          <button
            type="button"
            onClick={() => setEdicion("nueva")}
            className="mt-6 rounded-xl bg-esmeralda px-8 py-3.5 font-medium text-tinta shadow-[0_10px_40px_-8px_rgba(16,185,129,0.6)] transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-enlace"
          >
            + Agregar persona
          </button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map((p) => (
            <li key={p.id} className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <span
                className={`grid size-14 shrink-0 place-items-center rounded-full font-titulo text-lg font-bold ${
                  p.activo ? "bg-menta text-tinta" : "bg-white/10 text-white/50"
                }`}
              >
                {iniciales(p.nombre)}
              </span>
              <div className="min-w-0 flex-1 space-y-2">
                <p className={`truncate font-titulo text-lg font-bold ${p.activo ? "text-white" : "text-white/50"}`}>{p.nombre}</p>
                <Interruptor
                  checked={p.activo}
                  onChange={(activo) => alternar(p, activo)}
                  etiqueta={`${p.nombre} recibe citas`}
                />
              </div>
              <button
                type="button"
                onClick={() => setEdicion(p)}
                aria-label={`Editar a ${p.nombre}`}
                className="grid size-11 shrink-0 place-items-center rounded-xl text-white/80 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-esmeralda"
              >
                <IconoLapiz />
              </button>
            </li>
          ))}
        </ul>
      )}

      <DialogoLateral
        abierto={Boolean(edicion)}
        titulo={persona ? "Editar persona" : "Nueva persona"}
        alCerrar={() => setEdicion(null)}
      >
        <FormularioPersona
          key={persona?.id ?? "nueva"}
          persona={persona}
          alGuardar={() => setEdicion(null)}
          alEliminar={persona ? () => eliminar(persona) : undefined}
          alCancelar={() => setEdicion(null)}
        />
      </DialogoLateral>
    </div>
  );
}

function FormularioPersona({
  persona,
  alGuardar,
  alEliminar,
  alCancelar,
}: {
  persona?: Persona;
  alGuardar: () => void;
  alEliminar?: () => void;
  alCancelar: () => void;
}) {
  const [estado, accion, guardando] = useActionState<EstadoPersona, FormData>(guardarPersona, {});

  const guardados = estado.guardados ?? 0;
  useEffect(() => {
    if (guardados > 0) alGuardar();
    // Solo debe reaccionar a un nuevo guardado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guardados]);

  return (
    <form action={accion} noValidate className="space-y-5">
      <input type="hidden" name="id" value={persona?.id ?? ""} />
      {estado.mensaje && <AvisoError>{estado.mensaje}</AvisoError>}

      <div className="space-y-2">
        <label htmlFor="persona-nombre" className="font-medium text-white">
          Nombre
        </label>
        <input
          id="persona-nombre"
          name="nombre"
          defaultValue={persona?.nombre}
          placeholder="Carlos"
          autoComplete="off"
          maxLength={60}
          aria-invalid={Boolean(estado.errores?.nombre)}
          className={claseInput}
          required
        />
        {estado.errores?.nombre ? (
          <p className="text-sm text-red-300">{estado.errores.nombre[0]}</p>
        ) : (
          <p className="text-sm text-white/60">Así lo verán tus clientes al elegir con quién reservar.</p>
        )}
      </div>

      <label className="flex cursor-pointer items-center justify-between gap-4">
        <span>
          <span className="block font-medium text-white">Recibe citas</span>
          <span className="block text-sm text-white/60">Si lo apagas, no se le podrá reservar.</span>
        </span>
        <Interruptor name="activo" defaultChecked={persona?.activo ?? true} />
      </label>

      <button
        type="submit"
        disabled={guardando}
        className="w-full rounded-xl bg-esmeralda py-4 text-lg font-medium text-tinta shadow-[0_10px_40px_-8px_rgba(16,185,129,0.6)] transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-enlace disabled:opacity-60"
      >
        {guardando ? "Guardando…" : persona ? "Guardar cambios" : "Agregar persona"}
      </button>

      <AccionesDialogo textoEliminar="Eliminar persona" alEliminar={alEliminar} alCancelar={alCancelar} />
    </form>
  );
}
