"use client";

import { vibrar } from "./vibrar";

// iPhone no tiene navigator.vibrate: ahí la vibración la da el atributo "switch" del input.

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
