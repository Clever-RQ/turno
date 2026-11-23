"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { AvisoError } from "@/components/ui/avisos";
import { claseInput } from "@/components/ui/campo";
import { Interruptor } from "@/components/ui/interruptor";
import { guardarServicio, type EstadoServicio } from "@/server/actions/servicios";
import { DURACIONES, type Servicio } from "@/domain/servicios";

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
