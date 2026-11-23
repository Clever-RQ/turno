"use client";

import { useEffect, useRef } from "react";

const sinMovimiento = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Vibración del celular (Android y la mayoría de navegadores móviles).
 * iPhone no tiene navigator.vibrate: ahí no pasa nada.
 * Respeta "reducir movimiento".
 */
export function vibrar(patron: number | number[] = 8) {
  try {
    if (!sinMovimiento()) navigator.vibrate?.(patron);
  } catch {
    // Sin soporte: no pasa nada.
  }
}

/**
 * Hace que un formulario vibre de lado a lado cada vez que el servidor
 * devuelve un error (correo o contraseña incorrectos, campos inválidos…).
 * Se usa con el estado de useActionState: cada envío devuelve un objeto nuevo,
 * así que vibra también si el error se repite.
 *
 *   const refFormulario = useVibrarConError(estado);
 *   <form ref={refFormulario} …>
 */
export function useVibrarConError(estado: { mensaje?: string; errores?: object }) {
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const hayError = Boolean(estado.mensaje) || Boolean(estado.errores && Object.keys(estado.errores).length);
    const formulario = ref.current;
    if (!hayError || !formulario) return;

    // Reiniciar la animación aunque ya se haya usado: quitar la clase, forzar el reflujo y volver a ponerla.
    formulario.classList.remove("anim-vibrar");
    void formulario.offsetWidth;
    formulario.classList.add("anim-vibrar");
    vibrar([35, 45, 35]);
  }, [estado]);

  return ref;
}
