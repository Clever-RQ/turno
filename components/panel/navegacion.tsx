"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { IconoCerrar, IconoMenu } from "@/components/iconos";
import { Logo } from "@/components/logo";

// Las secciones sin href se activan en los próximos sprints.
const SECCIONES: { nombre: string; href?: string }[] = [
  { nombre: "Agenda", href: "/panel" },
  { nombre: "Servicios", href: "/panel/servicios" },
  { nombre: "Equipo", href: "/panel/equipo" },
  { nombre: "Horarios", href: "/panel/horarios" },
  { nombre: "Clientes" },
  { nombre: "Asistente IA" },
  { nombre: "Métricas" },
];

export function NavegacionPanel({ alNavegar }: { alNavegar?: () => void }) {
  const ruta = usePathname();

  return (
    <nav aria-label="Secciones del panel">
      <ul className="space-y-1">
        {SECCIONES.map(({ nombre, href }) => {
          if (!href) {
            return (
              <li key={nombre} className="px-4 py-3 text-white/35" title="Próximamente">
                {nombre}
              </li>
            );
          }
          const activa = ruta === href;
          return (
            <li key={nombre}>
              <Link
                href={href}
                onClick={alNavegar}
                aria-current={activa ? "page" : undefined}
                className={`block rounded-xl px-4 py-3 transition focus-visible:outline-2 focus-visible:outline-esmeralda ${
                  activa
                    ? "border border-esmeralda/40 bg-esmeralda/15 font-semibold text-white"
                    : "text-white/75 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {nombre}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Barra superior del celular con el botón ☰ que abre el menú. */
export function MenuMovil({ tarjeta }: { tarjeta: ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (abierto) dialogo.current?.showModal();
    else dialogo.current?.close();
  }, [abierto]);

  return (
    <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-4 lg:hidden">
      <Logo className="h-8 w-auto" />
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Abrir menú"
        className="grid size-11 place-items-center rounded-xl text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-esmeralda"
      >
        <IconoMenu className="size-6" />
      </button>

      <dialog
        ref={dialogo}
        onClose={() => setAbierto(false)}
        aria-label="Menú del panel"
        className="m-0 ml-auto h-dvh max-h-none w-[85vw] max-w-sm border-l border-white/10 bg-tinta p-5 text-white backdrop:bg-black/60"
      >
        <div className="flex h-full flex-col gap-6">
          <div className="flex items-center justify-between">
            <Logo className="h-8 w-auto" />
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar menú"
              className="grid size-11 place-items-center rounded-xl hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-esmeralda"
            >
              <IconoCerrar className="size-6" />
            </button>
          </div>
          <NavegacionPanel alNavegar={() => setAbierto(false)} />
          <div className="mt-auto">{tarjeta}</div>
        </div>
      </dialog>
    </div>
  );
}
