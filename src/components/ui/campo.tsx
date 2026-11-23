import type { InputHTMLAttributes, ReactNode } from "react";

export const claseInput =
  "w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-white placeholder:text-white/40 outline-none transition focus:border-esmeralda focus:ring-2 focus:ring-esmeralda/30 aria-[invalid=true]:border-red-400/70";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  etiqueta: string;
  name: string;
  errores?: string[];
  ayuda?: string;
  /** Algo a la derecha de la etiqueta, por ejemplo "¿Olvidaste tu contraseña?" */
  extra?: ReactNode;
  /** Algo dentro del input a la derecha, por ejemplo el botón "Mostrar" */
  adorno?: ReactNode;
};

export function Campo({ etiqueta, name, errores, ayuda, extra, adorno, ...input }: Props) {
  const idAyuda = `${name}-ayuda`;
  const idError = `${name}-error`;
  const hayError = Boolean(errores?.length);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={name} className="font-medium text-white">
          {etiqueta}
        </label>
        {extra}
      </div>
      <div className="relative">
        <input
          id={name}
          name={name}
          aria-invalid={hayError}
          aria-describedby={[ayuda && idAyuda, hayError && idError].filter(Boolean).join(" ") || undefined}
          className={`${claseInput} ${adorno ? "pr-24" : ""}`}
          {...input}
        />
        {adorno && <div className="absolute inset-y-0 right-3 flex items-center">{adorno}</div>}
      </div>
      {ayuda && (
        <p id={idAyuda} className="text-sm text-white/60">
          {ayuda}
        </p>
      )}
      {hayError && (
        <p id={idError} className="text-sm text-red-300">
          {errores![0]}
        </p>
      )}
    </div>
  );
}
