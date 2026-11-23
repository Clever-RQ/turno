"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Luz esmeralda que sigue al mouse con un poco de retraso (como una estela),
 * y que además "enciende" lo que reciba como children (los relojes del fondo)
 * solo cerca del cursor.
 *
 * Solo con mouse o trackpad: en pantallas táctiles y con "reducir movimiento"
 * no se activa. Escribe dos variables CSS (--luz-x, --luz-y); el dibujo es CSS.
 */
const SUAVIDAD = 0.12; // 0..1: cuánto avanza la luz hacia el cursor en cada cuadro

export function LuzCursor({ children }: { children?: ReactNode }) {
  const capa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = capa.current;
    if (!el) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const contenedor = el.parentElement ?? document.body;
    let objetivoX = 0;
    let objetivoY = 0;
    let x = 0;
    let y = 0;
    let cuadro = 0;
    let visible = false;

    const pintar = () => {
      x += (objetivoX - x) * SUAVIDAD;
      y += (objetivoY - y) * SUAVIDAD;
      el.style.setProperty("--luz-x", `${x.toFixed(1)}px`);
      el.style.setProperty("--luz-y", `${y.toFixed(1)}px`);
      // Sigue animando hasta alcanzar al cursor; después descansa.
      cuadro = Math.abs(objetivoX - x) + Math.abs(objetivoY - y) > 0.5 ? requestAnimationFrame(pintar) : 0;
    };

    const mover = (e: PointerEvent) => {
      const caja = contenedor.getBoundingClientRect();
      objetivoX = e.clientX - caja.left;
      objetivoY = e.clientY - caja.top;
      if (!visible) {
        // Primera vez: aparece donde está el cursor, sin viajar desde la esquina.
        x = objetivoX;
        y = objetivoY;
        visible = true;
        el.dataset.activa = "true";
      }
      if (!cuadro) cuadro = requestAnimationFrame(pintar);
    };

    const salir = () => {
      visible = false;
      delete el.dataset.activa;
    };

    window.addEventListener("pointermove", mover, { passive: true });
    document.documentElement.addEventListener("pointerleave", salir);
    return () => {
      window.removeEventListener("pointermove", mover);
      document.documentElement.removeEventListener("pointerleave", salir);
      cancelAnimationFrame(cuadro);
    };
  }, []);

  return (
    <div ref={capa} aria-hidden="true" className="luz-cursor pointer-events-none absolute inset-0">
      <div className="luz-cursor-brillo absolute inset-0" />
      {children && <div className="luz-cursor-revelado absolute inset-0">{children}</div>}
    </div>
  );
}
