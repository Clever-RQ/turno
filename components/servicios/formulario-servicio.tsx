"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { AvisoError } from "@/components/auth/avisos";
import { claseInput } from "@/components/auth/campo";
import { guardarServicio, type EstadoServicio } from "@/lib/acciones/servicios";
import { DURACIONES, type Servicio } from "@/lib/servicios";

type Props = {
  /** Si viene, se edita; si no, se crea. */
  servicio?: Servicio;
  /** "tarjeta": dentro del onboarding. "dialogo": panel lateral / hoja inferior del panel. */
  variante: "tarjeta" | "dialogo";
  textoBoton: string;
  /** Se llama después de guardar bien (para cerrar el diálogo o limpiar el formulario). */
  alGuardar?: () => void;
  children?: ReactNode;
};

export function FormularioServicio({ servicio, variante, textoBoton, alGuardar, children }: Props) {
  const [estado, accion, guardando] = useActionState<EstadoServicio, FormData>(guardarServicio, {});
  const nombreRef = useRef<HTMLInputElement>(null);

  // Cada guardado exitoso sube "guardados": avisamos al padre.
  const guardados = estado.guardados ?? 0;
  useEffect(() => {
    if (guardados > 0) alGuardar?.();
    // Solo debe reaccionar a un nuevo guardado, no a cambios de alGuardar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guardados]);

  // La duración actual siempre está en la lista, aunque no sea una de las rápidas.
  const duraciones = [...new Set([...DURACIONES, servicio?.duracion_min ?? 30])].sort((a, b) => a - b);
  const prefijo = servicio?.id ?? "nuevo";

  return (
    <form action={accion} noValidate className="space-y-5">
      <input type="hidden" name="id" value={servicio?.id ?? ""} />
      {estado.mensaje && <AvisoError>{estado.mensaje}</AvisoError>}

      <div className="space-y-2">
        <label htmlFor={`${prefijo}-nombre`} className="font-medium text-white">
          Nombre del servicio
        </label>
        <input
          ref={nombreRef}
          id={`${prefijo}-nombre`}
          name="nombre"
          defaultValue={servicio?.nombre}
          placeholder="Corte clásico"
          maxLength={60}
          aria-invalid={Boolean(estado.errores?.nombre)}
          className={claseInput}
          required
        />
        <Error mensajes={estado.errores?.nombre} />
      </div>

      <div className="grid grid-cols-[minmax(7rem,9rem)_1fr] gap-4">
        <div className="space-y-2">
          <label htmlFor={`${prefijo}-duracion`} className="font-medium text-white">
            Duración
          </label>
          <div className="relative">
          <select
            id={`${prefijo}-duracion`}
            name="duracion_min"
            defaultValue={servicio?.duracion_min ?? 30}
            className={`${claseInput} appearance-none pr-9`}
          >
            {duraciones.map((minutos) => (
              <option key={minutos} value={minutos} className="bg-tinta">
                {minutos} min
              </option>
            ))}
          </select>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-white/70" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
          </div>
          <Error mensajes={estado.errores?.duracion_min} />
        </div>

        <div className="space-y-2">
          <label htmlFor={`${prefijo}-precio`} className="font-medium text-white">
            Precio <span className="font-normal text-white/60">(opcional)</span>
          </label>
          <div className="relative">
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-white/50">
              S/
            </span>
            <input
              id={`${prefijo}-precio`}
              name="precio"
              inputMode="decimal"
              defaultValue={servicio?.precio?.toFixed(2)}
              placeholder="25.00"
              aria-invalid={Boolean(estado.errores?.precio)}
              className={`${claseInput} pl-11`}
            />
          </div>
          <Error mensajes={estado.errores?.precio} />
        </div>
      </div>

      {variante === "dialogo" ? (
        <label className="flex cursor-pointer items-center justify-between gap-4">
          <span>
            <span className="block font-medium text-white">Visible para tus clientes</span>
            <span className="block text-sm text-white/60">Si lo apagas, no se podrá reservar.</span>
          </span>
          <Interruptor name="activo" defaultChecked={servicio?.activo ?? true} />
        </label>
      ) : (
        // En el onboarding los servicios se crean siempre activos.
        <input type="hidden" name="activo" value="on" />
      )}

      <button
        type="submit"
        disabled={guardando}
        className={
          variante === "tarjeta"
            ? "w-full rounded-xl border border-dashed border-esmeralda/60 bg-esmeralda/10 py-3.5 font-semibold text-menta transition hover:bg-esmeralda/20 focus-visible:outline-2 focus-visible:outline-esmeralda disabled:opacity-60"
            : "w-full rounded-xl bg-esmeralda py-4 text-lg font-medium text-tinta shadow-[0_10px_40px_-8px_rgba(16,185,129,0.6)] transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-enlace disabled:opacity-60"
        }
      >
        {guardando ? "Guardando…" : textoBoton}
      </button>

      {children}
    </form>
  );
}

function Error({ mensajes }: { mensajes?: string[] }) {
  return mensajes?.length ? <p className="text-sm text-red-300">{mensajes[0]}</p> : null;
}

/**
 * Vibración corta al tocar el interruptor (Android y la mayoría de navegadores móviles).
 * iPhone no tiene navigator.vibrate: ahí la da el atributo "switch" del input.
 */
function vibrar() {
  try {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) navigator.vibrate?.(8);
  } catch {
    // Sin soporte: no pasa nada.
  }
}

/** Interruptor (checkbox con aspecto de switch). Accesible: es un checkbox real. */
export function Interruptor({
  name,
  defaultChecked,
  checked,
  onChange,
  etiqueta,
  textoActivo = "Activo",
  textoInactivo = "Inactivo",
}: {
  textoActivo?: string;
  textoInactivo?: string;
  name?: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (valor: boolean) => void;
  etiqueta?: string;
}) {
  return (
    <span className="relative inline-flex shrink-0 items-center gap-3">
      {/*
        El checkbox real va invisible ENCIMA de todo el interruptor (riel + texto):
        así cualquier toque lo cambia, esté o no dentro de un <label>.
        "switch" (atributo de Safari 17.4+) da vibración nativa en iPhone.
      */}
      <input
        type="checkbox"
        role="switch"
        {...{ switch: "" }}
        name={name}
        defaultChecked={defaultChecked}
        checked={checked}
        onChange={(e) => {
          vibrar();
          onChange?.(e.target.checked);
        }}
        aria-label={etiqueta}
        className="peer absolute inset-0 z-10 m-0 size-full cursor-pointer appearance-none opacity-0"
      />
      {/*
        Riel: se llena de esmeralda al prender.
        Perilla: rebote suave (curva con sobrepaso) y se estira mientras se presiona,
        hacia la izquierda si está prendido para no salirse del riel.
      */}
      <span
        aria-hidden="true"
        className={[
          "relative h-7 w-12 rounded-full bg-white/20 ring-1 ring-inset ring-white/10",
          "transition-colors duration-300 ease-out",
          "peer-hover:bg-white/25 peer-checked:bg-esmeralda peer-checked:ring-esmeralda peer-checked:peer-hover:bg-emerald-400",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-enlace",
          "after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-menta after:shadow-[0_1px_3px_rgba(0,0,0,0.35)]",
          "after:transition-[translate,width,background-color] after:duration-[420ms] after:ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          "peer-checked:after:translate-x-5 peer-checked:after:bg-white",
          "peer-active:after:w-6 peer-checked:peer-active:after:translate-x-4",
          "motion-reduce:transition-none motion-reduce:after:transition-none",
        ].join(" ")}
      />
      <span aria-hidden="true" className="text-white/60 peer-checked:hidden">
        {textoInactivo}
      </span>
      <span aria-hidden="true" className="hidden font-medium text-enlace peer-checked:inline">
        {textoActivo}
      </span>
    </span>
  );
}
