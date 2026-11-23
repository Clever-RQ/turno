"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { AvisoError } from "@/components/auth/avisos";
import { IconoCerrar, IconoPapelera } from "@/components/iconos";
import { AvisoAsistente } from "@/components/panel/aviso-asistente";
import { useConfirmar } from "@/components/panel/confirmar";
import { Interruptor } from "@/components/servicios/formulario-servicio";
import { guardarHorario } from "@/lib/acciones/horarios";
import { DIAS, HORAS, hayErrores, siguienteTramo, validarSemana, type Semana, type Tramo } from "@/lib/horarios";

const RETRASO_MS = 45; // entre la salida de un día y el siguiente

type Props = {
  /** null = horario del negocio. */
  personalId: string | null;
  inicial: Semana;
  /** true cuando lo que se muestra todavía no está guardado (copia del horario del negocio). */
  sinGuardarAlInicio?: boolean;
};

export function EditorSemana({ personalId, inicial, sinGuardarAlInicio = false }: Props) {
  const [semana, setSemana] = useState<Semana>(inicial);
  const [error, setError] = useState<string | null>(null);
  const [guardando, iniciar] = useTransition();
  const [confirmar, dialogoConfirmar] = useConfirmar();
  const [borrando, setBorrando] = useState(false);
  // La semana antes de borrarla, mientras se muestra el aviso con "Deshacer".
  const [paraDeshacer, setParaDeshacer] = useState<Semana | null>(null);
  const cerrarAviso = useCallback(() => setParaDeshacer(null), []);

  const errores = useMemo(() => validarSemana(semana), [semana]);
  const hayCambios = sinGuardarAlInicio || JSON.stringify(semana) !== JSON.stringify(inicial);

  function cambiarDia(dia: number, tramos: Tramo[]) {
    setSemana((s) => ({ ...s, [dia]: tramos }));
  }

  function copiarATodos(dia: number) {
    setSemana((s) => Object.fromEntries(Object.keys(s).map((d) => [d, s[dia].map((t) => ({ ...t }))])) as Semana);
  }

  const semanaVacia = Object.values(semana).every((tramos) => tramos.length === 0);

  /** Cierra los 7 días de una vez. No se guarda hasta "Guardar cambios" (y se puede deshacer). */
  async function borrarTodo() {
    const si = await confirmar({
      titulo: "¿Borrar todo el horario?",
      texto: "Se cierran los 7 días. No se guarda hasta que presiones «Guardar cambios».",
      confirmar: "Borrar horario",
      peligro: true,
    });
    if (!si) return;

    const anterior = semana;
    const sinAnimar = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Los turnos salen de lunes a domingo, uno tras otro; después se vacía la semana.
    setBorrando(true);
    setTimeout(() => {
      setSemana(Object.fromEntries(Object.keys(anterior).map((d) => [d, []])) as Semana);
      setBorrando(false);
      setParaDeshacer(anterior);
    }, sinAnimar ? 0 : 300 + (DIAS.length - 1) * RETRASO_MS);
  }

  function deshacer() {
    if (paraDeshacer) setSemana(paraDeshacer);
    setParaDeshacer(null);
  }

  function guardar() {
    setParaDeshacer(null);
    iniciar(async () => setError(await guardarHorario(personalId, semana)));
  }

  return (
    <>
      {error && <AvisoError>{error}</AvisoError>}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={borrarTodo}
          disabled={semanaVacia || borrando}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-medium text-red-300 transition hover:bg-red-500/10 hover:text-red-200 focus-visible:outline-2 focus-visible:outline-esmeralda disabled:pointer-events-none disabled:opacity-40"
        >
          <IconoPapelera className="size-5" />
          Borrar horario
        </button>
      </div>

      <ul className="space-y-4 lg:space-y-0 lg:overflow-hidden lg:rounded-3xl lg:border lg:border-white/10 lg:bg-white/[0.03]">
        {DIAS.map(({ dia, nombre }, posicion) => {
          const tramos = semana[dia];
          const abierto = tramos.length > 0;
          return (
            <li
              key={dia}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 lg:grid lg:grid-cols-[12rem_1fr_auto] lg:gap-6 lg:rounded-none lg:border-0 lg:border-b lg:border-white/5 lg:bg-transparent lg:p-6 lg:last:border-0"
            >
              <div className="flex items-center justify-between gap-4 lg:block lg:space-y-3">
                <p className={`font-titulo text-lg font-bold ${abierto ? "text-white" : "text-white/50"}`}>{nombre}</p>
                <Interruptor
                  checked={abierto}
                  onChange={(abrir) => cambiarDia(dia, abrir ? [siguienteTramo([])] : [])}
                  etiqueta={`${nombre} abierto`}
                  textoActivo="Abierto"
                  textoInactivo="Cerrado"
                />
              </div>

              <div
                className={`mt-4 space-y-3 lg:mt-0 ${borrando && abierto ? "anim-salir-tramo" : ""}`}
                style={borrando ? { animationDelay: `${posicion * RETRASO_MS}ms` } : undefined}
              >
                {!abierto && <p className="anim-aparecer pt-2 text-white/50">Cerrado</p>}
                {tramos.map((tramo, i) => {
                  const mensaje = errores[dia]?.[i];
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <SelectorHora
                          valor={tramo.abre}
                          etiqueta={`${nombre}, turno ${i + 1}, apertura`}
                          alCambiar={(abre) => cambiarDia(dia, tramos.map((t, j) => (j === i ? { ...t, abre } : t)))}
                        />
                        <span aria-hidden="true" className="text-white/60">–</span>
                        <SelectorHora
                          valor={tramo.cierra}
                          etiqueta={`${nombre}, turno ${i + 1}, cierre`}
                          error={Boolean(mensaje)}
                          alCambiar={(cierra) => cambiarDia(dia, tramos.map((t, j) => (j === i ? { ...t, cierra } : t)))}
                        />
                        {tramos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => cambiarDia(dia, tramos.filter((_, j) => j !== i))}
                            aria-label={`Quitar turno ${i + 1} del ${nombre}`}
                            className="grid size-10 shrink-0 place-items-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-esmeralda"
                          >
                            <IconoCerrar />
                          </button>
                        )}
                      </div>
                      {mensaje && (
                        <p role="alert" className="text-sm text-red-300">
                          {mensaje}
                        </p>
                      )}
                    </div>
                  );
                })}

                {abierto && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => cambiarDia(dia, [...tramos, siguienteTramo(tramos)])}
                      disabled={tramos.length >= 6}
                      className="rounded-lg py-1 font-medium text-enlace hover:text-menta focus-visible:outline-2 focus-visible:outline-esmeralda disabled:opacity-40"
                    >
                      + Agregar turno
                    </button>
                    {dia === 1 && <BotonCopiar alCopiar={() => copiarATodos(dia)} className="lg:hidden" />}
                  </div>
                )}
              </div>

              <div className="hidden lg:block">{dia === 1 && abierto && <BotonCopiar alCopiar={() => copiarATodos(dia)} />}</div>
            </li>
          );
        })}
      </ul>

      {dialogoConfirmar}

      {/* Aviso del asistente + barra de cambios sin guardar: fijos abajo */}
      {(hayCambios || paraDeshacer) && (
        <div className="sticky bottom-4 z-10 space-y-3">
          {paraDeshacer && (
            <AvisoAsistente
              titulo="Listo, vacié tu semana."
              texto="Guarda los cambios para aplicarlo."
              accion="Deshacer"
              alAccion={deshacer}
              alCerrar={cerrarAviso}
            />
          )}
          {hayCambios && (
          <div className="flex flex-col gap-3 rounded-3xl border border-white/15 bg-tinta/95 p-4 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="flex items-center justify-center gap-2 text-amber-200 sm:justify-start">
              <span aria-hidden="true" className="size-2 rounded-full bg-amber-300" /> Tienes cambios sin guardar
            </p>
            <div className="flex items-center gap-3">
              {!sinGuardarAlInicio && (
                <button
                  type="button"
                  onClick={() => {
                    setSemana(inicial);
                    setParaDeshacer(null);
                  }}
                  className="hidden px-4 py-3 text-white/80 hover:text-white sm:block"
                >
                  Descartar
                </button>
              )}
              <button
                type="button"
                onClick={guardar}
                disabled={guardando || hayErrores(errores)}
                className="w-full rounded-xl bg-esmeralda px-8 py-3.5 font-medium text-tinta transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-enlace disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {guardando ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
          )}
        </div>
      )}
    </>
  );
}

function SelectorHora({
  valor,
  etiqueta,
  error,
  alCambiar,
}: {
  valor: string;
  etiqueta: string;
  error?: boolean;
  alCambiar: (hora: string) => void;
}) {
  return (
    <div className="relative w-32 sm:w-36">
      <select
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        aria-label={etiqueta}
        aria-invalid={error}
        className={`w-full appearance-none rounded-xl border bg-white/[0.06] py-3 pl-4 pr-9 text-lg font-semibold text-white outline-none transition focus:ring-2 ${
          error ? "border-red-400/70 focus:ring-red-400/30" : "border-white/15 focus:border-esmeralda focus:ring-esmeralda/30"
        }`}
      >
        {/* Si la hora guardada no está en la lista de 30 min, igual se muestra */}
        {[...new Set([...HORAS, valor])].sort().map((h) => (
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

function BotonCopiar({ alCopiar, className = "" }: { alCopiar: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={alCopiar}
      className={`flex items-center gap-2 rounded-xl border border-esmeralda/40 px-4 py-2.5 font-medium text-menta transition hover:bg-esmeralda/10 focus-visible:outline-2 focus-visible:outline-esmeralda ${className}`}
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
      </svg>
      Copiar a todos<span className="hidden lg:inline"> los días</span>
    </button>
  );
}
