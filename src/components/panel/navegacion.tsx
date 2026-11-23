"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import {
  IconoAgenda,
  IconoAsistente,
  IconoCerrar,
  IconoClientes,
  IconoEquipo,
  IconoHorarios,
  IconoMenu,
  IconoMetricas,
  IconoServicios,
} from "@/components/ui/iconos";
import { Logo } from "@/components/ui/logo";

type Seccion = { nombre: string; href?: string; Icono: ComponentType<{ className?: string }> };

// Las secciones sin href llegan en los próximos sprints.
const SECCIONES: Seccion[] = [
  { nombre: "Agenda", href: "/panel", Icono: IconoAgenda },
  { nombre: "Servicios", href: "/panel/servicios", Icono: IconoServicios },
  { nombre: "Equipo", href: "/panel/equipo", Icono: IconoEquipo },
  { nombre: "Horarios", href: "/panel/horarios", Icono: IconoHorarios },
  { nombre: "Clientes", Icono: IconoClientes },
  { nombre: "Asistente IA", Icono: IconoAsistente },
  { nombre: "Métricas", Icono: IconoMetricas },
];

/**
 * Navegación del panel con una pastilla de vidrio que sigue al mouse (o al foco
 * del teclado) y vuelve a la página actual al salir. Al hacer clic se queda ahí.
 * La posición se escribe directo en el DOM: moverla no vuelve a renderizar la lista.
 */
export function NavegacionPanel({ alNavegar }: { alNavegar?: () => void }) {
  const ruta = usePathname();
  const [enfocada, setEnfocada] = useState<string | null>(null);
  // Clic hecho antes de que cambie la ruta: solo vale mientras la ruta sea la misma de ese momento.
  const [clic, setClic] = useState<{ nombre: string; desde: string } | null>(null);
  const pastilla = useRef<HTMLDivElement>(null);
  const items = useRef<Record<string, HTMLLIElement | null>>({});

  const activa = SECCIONES.find((s) => s.href === ruta)?.nombre ?? null;
  const clicVigente = clic && clic.desde === ruta ? clic.nombre : null;
  const objetivo = enfocada ?? clicVigente ?? activa;

  const objetivoActual = useRef(objetivo);
  const lista = useRef<HTMLUListElement>(null);

  // Mueve la pastilla al ítem objetivo. Si la lista está oculta (menú del celular
  // cerrado), mide 0: la pastilla se esconde y se ubica al volverse visible.
  const posicionar = useCallback(() => {
    const el = pastilla.current;
    const nombre = objetivoActual.current;
    const item = nombre ? items.current[nombre] : null;
    if (!el) return;
    if (!item || item.offsetHeight === 0) {
      el.style.opacity = "0";
      delete el.dataset.lista;
      return;
    }
    el.style.transform = `translateY(${item.offsetTop}px)`;
    el.style.height = `${item.offsetHeight}px`;
    el.style.opacity = "1";
    el.dataset.proxima = SECCIONES.find((s) => s.nombre === nombre)?.href ? "false" : "true";
    // La primera vez aparece en su lugar, sin viajar desde arriba.
    if (!el.dataset.lista) requestAnimationFrame(() => (el.dataset.lista = "true"));
  }, []);

  useLayoutEffect(() => {
    objetivoActual.current = objetivo;
    posicionar();
  }, [objetivo, posicionar]);

  // Se vuelve a ubicar si la lista cambia de tamaño o pasa de oculta a visible.
  useEffect(() => {
    if (!lista.current) return;
    const observador = new ResizeObserver(posicionar);
    observador.observe(lista.current);
    return () => observador.disconnect();
  }, [posicionar]);

  return (
    <nav aria-label="Secciones del panel">
      <ul ref={lista} className="relative space-y-1" onMouseLeave={() => setEnfocada(null)}>
        <div ref={pastilla} aria-hidden="true" className="pastilla-nav absolute inset-x-0 top-0 rounded-xl opacity-0" />

        {SECCIONES.map(({ nombre, href, Icono }) => {
          const resaltada = objetivo === nombre;
          const base =
            "relative z-10 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[0.95rem] font-medium tracking-[-0.005em] transition-[color,transform] duration-200";
          const icono = `size-[1.2rem] shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            resaltada ? "scale-110" : ""
          }`;

          return (
            <li key={nombre} ref={(el) => void (items.current[nombre] = el)} onMouseEnter={() => setEnfocada(nombre)}>
              {href ? (
                <Link
                  href={href}
                  aria-current={activa === nombre ? "page" : undefined}
                  onFocus={() => setEnfocada(nombre)}
                  onBlur={() => setEnfocada(null)}
                  onClick={() => {
                    setClic({ nombre, desde: ruta });
                    alNavegar?.();
                  }}
                  className={`${base} active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-enlace ${
                    resaltada ? "text-white" : activa === nombre ? "text-white/85" : "text-white/60 hover:text-white"
                  }`}
                >
                  <Icono className={`${icono} ${resaltada ? "text-enlace" : ""}`} />
                  {nombre}
                </Link>
              ) : (
                <span className={`${base} cursor-default ${resaltada ? "text-white/70" : "text-white/35"}`} title="Llega en los próximos sprints">
                  <Icono className={icono} />
                  {nombre}
                  <span className="ml-auto rounded-full border border-white/10 px-2 py-px text-[11px] font-medium text-white/45">Pronto</span>
                </span>
              )}
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
    <div className="vidrio flex items-center justify-between rounded-2xl px-4 py-3 lg:hidden">
      <Logo className="h-7 w-auto" />
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Abrir menú"
        className="grid size-11 place-items-center rounded-xl text-white transition hover:bg-white/10 active:scale-95 focus-visible:outline-2 focus-visible:outline-esmeralda"
      >
        <IconoMenu className="size-6" />
      </button>

      <dialog
        ref={dialogo}
        onClose={() => setAbierto(false)}
        aria-label="Menú del panel"
        className="anim-fondo m-0 ml-auto h-dvh max-h-none w-[85vw] max-w-sm border-l border-white/10 bg-tinta/95 p-5 text-white backdrop-blur-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        <div className="flex h-full flex-col gap-6">
          <div className="flex items-center justify-between">
            <Logo className="h-8 w-auto" />
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar menú"
              className="grid size-11 place-items-center rounded-xl transition hover:bg-white/10 active:scale-95 focus-visible:outline-2 focus-visible:outline-esmeralda"
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
