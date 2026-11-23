/** Duraciones que ofrece el selector (en minutos). La base de datos acepta de 5 a 480. */
export const DURACIONES = [10, 15, 20, 30, 40, 45, 60, 75, 90, 120, 150, 180, 240] as const;

export type Servicio = {
  id: string;
  nombre: string;
  duracion_min: number;
  precio: number | null;
  activo: boolean;
};

/**
 * Lee el precio como lo escribe un dueño en Perú.
 *   "25" -> 25 · "25.5" -> 25.5 · "25,50" -> 25.5 · "S/ 25" -> 25 · "" -> null
 * Devuelve NaN si no es un precio válido (negativo, letras, más de 2 decimales,
 * o más de lo que admite la columna numeric(8,2)).
 */
export function parsearPrecio(texto: string): number | null {
  const limpio = texto.replace(/s\/|\s/gi, "").replace(",", ".");
  if (limpio === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(limpio)) return Number.NaN;
  const valor = Number(limpio);
  return valor <= 999999.99 ? valor : Number.NaN;
}

const formatoSoles = (decimales: number) =>
  new Intl.NumberFormat("es-PE", { minimumFractionDigits: decimales, maximumFractionDigits: 2 });

/** 25 -> "S/ 25" · 25.5 -> "S/ 25.50" · 1200 -> "S/ 1,200" · null -> "Sin precio" */
export function formatearPrecio(precio: number | null): string {
  if (precio === null) return "Sin precio";
  return `S/ ${formatoSoles(Number.isInteger(precio) ? 0 : 2).format(precio)}`;
}

/** "30 min · S/ 25" (sin el precio si no tiene). */
export function resumenServicio(servicio: Pick<Servicio, "duracion_min" | "precio">): string {
  const duracion = `${servicio.duracion_min} min`;
  return servicio.precio === null ? duracion : `${duracion} · ${formatearPrecio(servicio.precio)}`;
}
