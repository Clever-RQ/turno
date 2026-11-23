/**
 * Fechas con zona horaria del negocio (por defecto America/Lima).
 *
 * La base de datos guarda instantes en UTC (timestamptz). El dueño piensa
 * en su hora local: "15 de diciembre a las 15:00 en Lima" = 20:00 UTC.
 * Lima no tiene horario de verano (siempre UTC-5), pero se calcula con la
 * zona real para que funcione con cualquier zona_horaria.
 */

/** Minutos de diferencia de la zona respecto a UTC en ese instante (Lima: -300). */
export function desfaseMinutos(instante: Date, zona: string): number {
  const parte = new Intl.DateTimeFormat("en-US", { timeZone: zona, timeZoneName: "longOffset" })
    .formatToParts(instante)
    .find((p) => p.type === "timeZoneName")?.value; // "GMT-05:00" o "GMT"
  const coincidencia = parte?.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!coincidencia) return 0;
  const [, signo, h, m] = coincidencia;
  return (signo === "-" ? -1 : 1) * (Number(h) * 60 + Number(m));
}

/** "2026-12-15" + "15:00" en Lima -> Date (2026-12-15T20:00:00Z). */
export function aInstante(fecha: string, hora: string, zona: string): Date {
  const [a, mes, d] = fecha.split("-").map(Number);
  const [h, min] = hora.split(":").map(Number);
  const comoSiFueraUtc = Date.UTC(a, mes - 1, d, h, min);
  const desfase = desfaseMinutos(new Date(comoSiFueraUtc), zona);
  return new Date(comoSiFueraUtc - desfase * 60_000);
}

/** "2026-12-15" -> "2026-12-16" */
export function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

/** Fecha y hora locales de un instante: { fecha: "2026-12-15", hora: "15:00" }. */
export function enZona(instante: Date, zona: string): { fecha: string; hora: string } {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: zona,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(instante)
      .map((p) => [p.type, p.value]),
  );
  return { fecha: `${partes.year}-${partes.month}-${partes.day}`, hora: `${partes.hour}:${partes.minute}` };
}

/** Hoy en la zona del negocio: "2026-11-22". */
export function hoyEn(zona: string, ahora = new Date()): string {
  return enZona(ahora, zona).fecha;
}

const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "2026-12-08" -> "Mar 8 dic" */
export function fechaCorta(fecha: string): string {
  const [a, m, d] = fecha.split("-").map(Number);
  const dia = new Date(Date.UTC(a, m - 1, d)).getUTCDay();
  return `${DIAS_CORTOS[dia]} ${d} ${MESES_CORTOS[m - 1]}`;
}

export function partesFecha(fecha: string): { dia: number; mes: string } {
  const [, m, d] = fecha.split("-").map(Number);
  return { dia: d, mes: MESES_CORTOS[m - 1] };
}
