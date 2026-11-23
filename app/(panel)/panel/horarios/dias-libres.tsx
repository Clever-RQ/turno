"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { AvisoError } from "@/components/auth/avisos";
import { claseInput } from "@/components/auth/campo";
import { IconoPapelera } from "@/components/iconos";
import { AccionesDialogo, DialogoLateral } from "@/components/panel/dialogo-lateral";
import { useConfirmar } from "@/components/panel/confirmar";
import { Interruptor } from "@/components/servicios/formulario-servicio";
import { eliminarBloqueo, guardarBloqueo, type EstadoBloqueo } from "@/lib/acciones/horarios";
import { enZona, fechaCorta, hoyEn, partesFecha, sumarDias } from "@/lib/fechas";
import { HORAS } from "@/lib/horarios";
import type { Bloqueo, Persona } from "@/lib/negocio";
import { iniciales } from "@/lib/texto";

type Props = { bloqueos: Bloqueo[]; personal: Persona[]; zona: string; seleccion: string };

/** Cómo se lee un bloqueo en la hora del negocio. */
function describir(b: Bloqueo, zona: string) {
  const inicio = enZona(new Date(b.inicio), zona);
  const fin = enZona(new Date(b.fin), zona);
  const todoElDia = inicio.hora === "00:00" && fin.hora === "00:00";
  // Día completo: el fin es las 00:00 del día siguiente al último día libre.
  const ultimoDia = todoElDia ? sumarDias(fin.fecha, -1) : fin.fecha;
  const fechas = ultimoDia === inicio.fecha ? fechaCorta(inicio.fecha) : `${fechaCorta(inicio.fecha)} – ${fechaCorta(ultimoDia)}`;
  return { primerDia: inicio.fecha, fechas, horas: todoElDia ? "Todo el día" : `${inicio.hora} – ${fin.hora}` };
}

export function DiasLibres({ bloqueos, personal, zona, seleccion }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eliminando, iniciar] = useTransition();
  const [confirmar, dialogoConfirmar] = useConfirmar();

  // Con una persona elegida: los días libres de todo el negocio + los suyos.
  const visibles = seleccion === "negocio" ? bloqueos : bloqueos.filter((b) => b.personal_id === null || b.personal_id === seleccion);
  const nombreDe = (id: string | null) => personal.find((p) => p.id === id)?.nombre;

  async function eliminar(b: Bloqueo) {
    const si = await confirmar({
      titulo: "¿Eliminar este día libre?",
      texto: "Ese horario volverá a estar disponible para reservar.",
      confirmar: "Eliminar",
      peligro: true,
    });
    if (!si) return;
    iniciar(async () => setError(await eliminarBloqueo(b.id)));
  }

  return (
    <div className="space-y-6">
      {dialogoConfirmar}
      {error && <AvisoError>{error}</AvisoError>}

      {visibles.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-14 text-center">
          <svg viewBox="0 0 24 24" className="size-16 text-enlace" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" rx="3" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          </svg>
          <h2 className="mt-5 font-titulo text-2xl font-bold text-white sm:text-3xl">No tienes días libres programados.</h2>
          <p className="mt-3 max-w-md text-white/70">
            Agrega feriados, vacaciones o unas horas libres. Esos días nadie podrá reservar.
          </p>
          <BotonAgregar alAgregar={() => setAbierto(true)} />
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
            <h2 className="font-titulo text-xl font-bold text-white">Próximos días libres</h2>
            <button
              type="button"
              onClick={() => setAbierto(true)}
              className="rounded-xl bg-esmeralda px-4 py-2.5 font-medium text-tinta transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-enlace"
            >
              + Agregar
            </button>
          </div>
          <ul>
            {visibles.map((b) => {
              const { primerDia, fechas, horas } = describir(b, zona);
              const { dia, mes } = partesFecha(primerDia);
              const persona = nombreDe(b.personal_id);
              return (
                <li key={b.id} className="flex items-center gap-4 border-b border-white/5 px-4 py-4 last:border-0 sm:px-6">
                  <div className="grid size-16 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-center">
                    <span className="font-titulo text-2xl font-bold leading-none text-white">{dia}</span>
                    <span className="text-sm text-enlace">{mes}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">{fechas}</p>
                    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/70">
                      <span>{horas}</span>
                      {persona ? (
                        <span className="flex items-center gap-1.5">
                          <span className="grid size-5 place-items-center rounded-full bg-menta text-[10px] font-bold text-tinta">{iniciales(persona)}</span>
                          {persona}
                        </span>
                      ) : (
                        <span>Todo el negocio</span>
                      )}
                      {b.motivo && <span className="text-white/50">{b.motivo}</span>}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => eliminar(b)}
                    disabled={eliminando}
                    aria-label={`Eliminar día libre del ${fechas}`}
                    className="grid size-11 shrink-0 place-items-center rounded-xl text-white/70 hover:bg-red-500/15 hover:text-red-200 focus-visible:outline-2 focus-visible:outline-esmeralda disabled:opacity-50"
                  >
                    <IconoPapelera />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <DialogoLateral abierto={abierto} titulo="Nuevo día libre" alCerrar={() => setAbierto(false)}>
        <FormularioBloqueo
          personal={personal}
          zona={zona}
          aplicaInicial={seleccion}
          alGuardar={() => setAbierto(false)}
          alCancelar={() => setAbierto(false)}
        />
      </DialogoLateral>
    </div>
  );
}

function BotonAgregar({ alAgregar }: { alAgregar: () => void }) {
  return (
    <button
      type="button"
      onClick={alAgregar}
      className="mt-6 rounded-xl bg-esmeralda px-8 py-3.5 font-medium text-tinta shadow-[0_10px_40px_-8px_rgba(16,185,129,0.6)] transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-enlace"
    >
      + Agregar día libre
    </button>
  );
}

function FormularioBloqueo({
  personal,
  zona,
  aplicaInicial,
  alGuardar,
  alCancelar,
}: {
  personal: Persona[];
  zona: string;
  aplicaInicial: string;
  alGuardar: () => void;
  alCancelar: () => void;
}) {
  const [estado, accion, guardando] = useActionState<EstadoBloqueo, FormData>(guardarBloqueo, {});
  const [todoElDia, setTodoElDia] = useState(true);
  const [aplica, setAplica] = useState(aplicaInicial);
  const hoy = hoyEn(zona);

  const guardados = estado.guardados ?? 0;
  useEffect(() => {
    if (guardados > 0) alGuardar();
    // Solo debe reaccionar a un nuevo guardado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guardados]);

  const error = (campo: string) =>
    estado.errores?.[campo]?.[0] ? <p className="text-sm text-red-300">{estado.errores[campo]![0]}</p> : null;

  return (
    <form action={accion} noValidate className="space-y-5">
      {estado.mensaje && <AvisoError>{estado.mensaje}</AvisoError>}

      <div className={`grid gap-4 ${todoElDia ? "grid-cols-2" : "grid-cols-1"}`}>
        <div className="space-y-2">
          <label htmlFor="bloqueo-desde" className="font-medium text-white">
            {todoElDia ? "Desde" : "Día"}
          </label>
          <input id="bloqueo-desde" name="desde" type="date" min={hoy} defaultValue={hoy} className={`${claseInput} [color-scheme:dark]`} required />
          {error("desde")}
        </div>
        {todoElDia && (
          <div className="space-y-2">
            <label htmlFor="bloqueo-hasta" className="font-medium text-white">
              Hasta <span className="font-normal text-white/60">(opcional)</span>
            </label>
            <input id="bloqueo-hasta" name="hasta" type="date" min={hoy} className={`${claseInput} [color-scheme:dark]`} />
            {error("hasta")}
          </div>
        )}
      </div>

      <label className="flex cursor-pointer items-center justify-between gap-4">
        <span>
          <span className="block font-medium text-white">Todo el día</span>
          <span className="block text-sm text-white/60">Apágalo para bloquear solo unas horas de un día.</span>
        </span>
        <Interruptor name="todo_el_dia" checked={todoElDia} onChange={setTodoElDia} textoActivo="Sí" textoInactivo="No" />
      </label>

      {!todoElDia && (
        <div className="space-y-2">
          <p className="font-medium text-white">Horas</p>
          <div className="flex items-center gap-3">
            <SelectHora name="hora_desde" defecto="15:00" etiqueta="Desde la hora" />
            <span aria-hidden="true" className="text-white/60">–</span>
            <SelectHora name="hora_hasta" defecto="17:00" etiqueta="Hasta la hora" />
          </div>
          {error("hora_hasta")}
        </div>
      )}

      <fieldset className="space-y-2">
        <legend className="mb-2 font-medium text-white">Aplica a</legend>
        <input type="hidden" name="aplica" value={aplica} />
        <div className="flex flex-wrap gap-2">
          {[{ id: "negocio", nombre: "Todo el negocio" }, ...personal.filter((p) => p.activo)].map((op) => (
            <button
              key={op.id}
              type="button"
              aria-pressed={aplica === op.id}
              onClick={() => setAplica(op.id)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2.5 transition focus-visible:outline-2 focus-visible:outline-esmeralda ${
                aplica === op.id ? "border-esmeralda/60 bg-esmeralda/15 font-semibold text-white" : "border-white/15 text-white/80 hover:bg-white/[0.06]"
              }`}
            >
              {op.id !== "negocio" && (
                <span className="grid size-7 place-items-center rounded-full bg-menta text-xs font-bold text-tinta">{iniciales(op.nombre)}</span>
              )}
              {op.nombre}
            </button>
          ))}
        </div>
        {error("aplica")}
      </fieldset>

      <div className="space-y-2">
        <label htmlFor="bloqueo-motivo" className="font-medium text-white">
          Motivo <span className="font-normal text-white/60">(opcional)</span>
        </label>
        <input id="bloqueo-motivo" name="motivo" maxLength={80} placeholder="Feriado, vacaciones…" className={claseInput} />
        {error("motivo")}
      </div>

      <button
        type="submit"
        disabled={guardando}
        className="w-full rounded-xl bg-esmeralda py-4 text-lg font-medium text-tinta shadow-[0_10px_40px_-8px_rgba(16,185,129,0.6)] transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-enlace disabled:opacity-60"
      >
        {guardando ? "Guardando…" : "Guardar"}
      </button>
      <AccionesDialogo alCancelar={alCancelar} />
    </form>
  );
}

function SelectHora({ name, defecto, etiqueta }: { name: string; defecto: string; etiqueta: string }) {
  return (
    <div className="relative flex-1">
      <select
        name={name}
        defaultValue={defecto}
        aria-label={etiqueta}
        className="w-full appearance-none rounded-xl border border-white/15 bg-white/[0.06] py-3.5 pl-4 pr-9 text-lg font-semibold text-white outline-none focus:border-esmeralda focus:ring-2 focus:ring-esmeralda/30"
      >
        {HORAS.map((h) => (
          <option key={h} value={h} className="bg-tinta">
            {h}
          </option>
        ))}
      </select>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-white/70" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}
