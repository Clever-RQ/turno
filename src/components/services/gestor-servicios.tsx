"use client";

import { useOptimistic, useState, useTransition } from "react";
import { AvatarAtento } from "@/components/brand/avatar-atento";
import { useConfirmar } from "@/components/brand/confirmar";
import { AccionesDialogo, DialogoLateral } from "@/components/panel/dialogo-lateral";
import { FormularioServicio } from "@/components/services/formulario-servicio";
import { RelojDuracion } from "@/components/services/reloj-duracion";
import { AvisoError } from "@/components/ui/avisos";
import { IconoLapiz } from "@/components/ui/iconos";
import { Interruptor } from "@/components/ui/interruptor";
import { formatearDuracion, formatearPrecio, type Servicio } from "@/domain/servicios";
import { cambiarActivoServicio, eliminarServicio } from "@/server/actions/servicios";

/** Qué muestra el diálogo: nada, un servicio nuevo o uno existente. */
type Edicion = null | "nuevo" | Servicio;
type Filtro = "todos" | "visibles" | "ocultos";

const FILTROS: { clave: Filtro; texto: string }[] = [
  { clave: "todos", texto: "Todos" },
  { clave: "visibles", texto: "Visibles" },
  { clave: "ocultos", texto: "Ocultos" },
];

export function GestorServicios({ servicios }: { servicios: Servicio[] }) {
  const [edicion, setEdicion] = useState<Edicion>(null);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [error, setError] = useState<string | null>(null);
  const [, iniciar] = useTransition();
  const [confirmar, dialogoConfirmar] = useConfirmar();

  // El interruptor cambia al instante; si el servidor falla, refresh() lo devuelve a su valor real.
  const [visibles, cambiarVisible] = useOptimistic(
    servicios,
    (lista, cambio: { id: string; activo: boolean }) =>
      lista.map((s) => (s.id === cambio.id ? { ...s, activo: cambio.activo } : s)),
  );

  const cuentas = {
    todos: visibles.length,
    visibles: visibles.filter((s) => s.activo).length,
    ocultos: visibles.filter((s) => !s.activo).length,
  };
  const lista = visibles.filter((s) => filtro === "todos" || (filtro === "visibles" ? s.activo : !s.activo));

  function alternar(servicio: Servicio, activo: boolean) {
    iniciar(async () => {
      cambiarVisible({ id: servicio.id, activo });
      await cambiarActivoServicio(servicio.id, activo);
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {dialogoConfirmar}

      <header className="anim-titular flex flex-wrap items-end justify-between gap-4 pt-1">
        <div>
          <h1 className="font-titulo text-[2rem] font-bold leading-tight tracking-tight text-white sm:text-[2.5rem]">Servicios</h1>
          <p className="mt-1.5 text-white/65">Lo que tus clientes pueden reservar. Los ocultos no aparecen en tu página.</p>
        </div>
        {visibles.length > 0 && <BotonNuevo alAgregar={() => setEdicion("nuevo")} />}
      </header>

      {error && <AvisoError>{error}</AvisoError>}

      {visibles.length === 0 ? (
        <EstadoVacio alAgregar={() => setEdicion("nuevo")} />
      ) : (
        <section aria-label="Lista de servicios" className="vidrio anim-entrar rounded-3xl p-2 sm:p-3" style={{ animationDelay: "60ms" }}>
          <div className="flex items-center justify-between gap-3 px-2 pb-2 pt-1 sm:px-3">
            <SelectorFiltro filtro={filtro} cuentas={cuentas} alCambiar={setFiltro} />
          </div>

          {lista.length === 0 ? (
            <p className="px-4 py-10 text-center text-white/55">
              {filtro === "ocultos" ? "No tienes servicios ocultos." : "No tienes servicios visibles."}
            </p>
          ) : (
            <ul className="space-y-1">
              {lista.map((s, i) => (
                <FilaServicio
                  key={s.id}
                  servicio={s}
                  indice={i}
                  alEditar={() => setEdicion(s)}
                  alAlternar={(activo) => alternar(s, activo)}
                />
              ))}
            </ul>
          )}
        </section>
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

/**
 * Una fila: toda la parte izquierda abre la edición; el interruptor va aparte
 * (un botón no puede contener otro control).
 */
function FilaServicio({
  servicio: s,
  indice,
  alEditar,
  alAlternar,
}: {
  servicio: Servicio;
  indice: number;
  alEditar: () => void;
  alAlternar: (activo: boolean) => void;
}) {
  return (
    <li
      className="anim-entrar group flex items-center gap-2 rounded-2xl pr-3 transition-colors duration-200 hover:bg-white/[0.045] sm:gap-4 sm:pr-4"
      style={{ animationDelay: `${120 + indice * 45}ms` }}
    >
      <button
        type="button"
        onClick={alEditar}
        aria-label={`Editar ${s.nombre}`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl py-3 pl-3 text-left transition active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-esmeralda sm:gap-4 sm:pl-4"
      >
        <RelojDuracion minutos={s.duracion_min} activo={s.activo} className="size-10 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-[20deg] sm:size-11" />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="flex items-center gap-2">
            <span className={`truncate font-semibold ${s.activo ? "text-white" : "text-white/50"}`}>{s.nombre}</span>
            {!s.activo && <span className="shrink-0 rounded-full border border-white/10 px-2 py-px text-[11px] font-medium text-white/50">Oculto</span>}
          </span>
          <span className={`mt-0.5 block text-sm ${s.activo ? "text-white/55" : "text-white/35"}`}>
            {formatearDuracion(s.duracion_min)}
            {/* En celular el precio va aquí, para que el nombre no se corte */}
            <span className="sm:hidden"> · {formatearPrecio(s.precio)}</span>
          </span>
        </span>
        <span
          className={`hidden shrink-0 text-right font-titulo text-lg font-bold tabular-nums sm:block ${
            s.precio === null ? "text-sm font-normal text-white/40" : s.activo ? "text-white" : "text-white/45"
          }`}
        >
          {formatearPrecio(s.precio)}
        </span>
        <IconoLapiz className="hidden size-4 shrink-0 text-white/0 transition duration-200 group-hover:text-white/60 sm:block" />
      </button>

      <Interruptor
        checked={s.activo}
        onChange={alAlternar}
        etiqueta={`${s.nombre} visible para tus clientes`}
        textoActivo=""
        textoInactivo=""
      />
    </li>
  );
}

/** Todos / Visibles / Ocultos, con una pastilla que se desliza a la opción elegida. */
function SelectorFiltro({
  filtro,
  cuentas,
  alCambiar,
}: {
  filtro: Filtro;
  cuentas: Record<Filtro, number>;
  alCambiar: (f: Filtro) => void;
}) {
  const indice = FILTROS.findIndex((f) => f.clave === filtro);
  return (
    <div role="tablist" aria-label="Filtrar servicios" className="relative grid grid-cols-3 rounded-xl border border-white/10 bg-black/20 p-1">
      <span
        aria-hidden="true"
        className="pastilla-nav absolute inset-y-1 left-1 rounded-lg transition-transform duration-[420ms] ease-[cubic-bezier(0.34,1.32,0.64,1)] before:hidden motion-reduce:transition-none"
        style={{ width: "calc((100% - 0.5rem) / 3)", transform: `translateX(${indice * 100}%)` }}
      />
      {FILTROS.map(({ clave, texto }) => (
        <button
          key={clave}
          type="button"
          role="tab"
          aria-selected={filtro === clave}
          onClick={() => alCambiar(clave)}
          className={`relative z-10 flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition active:scale-95 focus-visible:outline-2 focus-visible:outline-esmeralda ${
            filtro === clave ? "text-white" : "text-white/55 hover:text-white"
          }`}
        >
          {texto}
          <span className={`tabular-nums text-xs ${filtro === clave ? "text-enlace" : "text-white/40"}`}>{cuentas[clave]}</span>
        </button>
      ))}
    </div>
  );
}

function BotonNuevo({ alAgregar, texto = "Nuevo servicio" }: { alAgregar: () => void; texto?: string }) {
  return (
    <button
      type="button"
      onClick={alAgregar}
      className="group flex items-center gap-2 rounded-xl bg-esmeralda px-4 py-2.5 font-semibold text-tinta shadow-[0_10px_30px_-10px_rgba(16,185,129,0.8)] transition hover:bg-emerald-400 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-enlace"
    >
      <svg viewBox="0 0 24 24" className="size-[1.1rem] transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
      {texto}
    </button>
  );
}

function EstadoVacio({ alAgregar }: { alAgregar: () => void }) {
  return (
    <div className="vidrio anim-entrar flex flex-col items-center rounded-3xl px-6 py-14 text-center" style={{ animationDelay: "60ms" }}>
      <AvatarAtento />
      <h2 className="mt-6 font-titulo text-2xl font-bold text-white sm:text-3xl">Aún no tienes servicios</h2>
      <p className="mt-3 max-w-md text-white/65">
        Agrega lo que ofreces, con su duración y precio. Así tus clientes y el asistente podrán reservarlo.
      </p>
      <div className="mt-6">
        <BotonNuevo alAgregar={alAgregar} texto="Agregar mi primer servicio" />
      </div>
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
