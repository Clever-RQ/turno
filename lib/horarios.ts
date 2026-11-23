/**
 * Horarios semanales: tipos y funciones puras (sin base de datos).
 * dia_semana: 0 = domingo ... 6 = sábado (igual que Date.getDay()).
 * En pantalla la semana empieza en lunes.
 */

export type Tramo = { abre: string; cierra: string }; // "09:00"
export type Semana = Record<number, Tramo[]>; // dia_semana -> tramos (vacío = cerrado)
export type FilaHorario = { personal_id: string | null; dia_semana: number; abre: string; cierra: string };

export const DIAS: { dia: number; nombre: string; corto: string }[] = [
  { dia: 1, nombre: "Lunes", corto: "Lun" },
  { dia: 2, nombre: "Martes", corto: "Mar" },
  { dia: 3, nombre: "Miércoles", corto: "Mié" },
  { dia: 4, nombre: "Jueves", corto: "Jue" },
  { dia: 5, nombre: "Viernes", corto: "Vie" },
  { dia: 6, nombre: "Sábado", corto: "Sáb" },
  { dia: 0, nombre: "Domingo", corto: "Dom" },
];

/** Horas cada 30 minutos: "00:00", "00:30", … "23:30". */
export const HORAS = Array.from({ length: 48 }, (_, i) => aHora(i * 30));

export function aMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

export function aHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function semanaVacia(): Semana {
  return { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
}

/** Lunes a sábado de 9:00 a 19:00, domingo cerrado. */
export function horarioTipico(): Semana {
  const semana = semanaVacia();
  for (const dia of [1, 2, 3, 4, 5, 6]) semana[dia] = [{ abre: "09:00", cierra: "19:00" }];
  return semana;
}

/** Filas de la base de datos ("09:00:00") -> semana ordenada ("09:00"). */
export function filasASemana(filas: Pick<FilaHorario, "dia_semana" | "abre" | "cierra">[]): Semana {
  const semana = semanaVacia();
  for (const f of filas) {
    semana[f.dia_semana].push({ abre: f.abre.slice(0, 5), cierra: f.cierra.slice(0, 5) });
  }
  for (const dia of Object.keys(semana)) {
    semana[Number(dia)].sort((a, b) => aMinutos(a.abre) - aMinutos(b.abre));
  }
  return semana;
}

/** Semana -> lo que recibe la función guardar_horario. */
export function semanaATramos(semana: Semana) {
  return Object.entries(semana).flatMap(([dia, tramos]) =>
    tramos.map((t) => ({ dia_semana: Number(dia), abre: t.abre, cierra: t.cierra })),
  );
}

export type ErroresSemana = Record<number, Record<number, string>>; // dia -> índice de tramo -> mensaje

/**
 * Revisa cada día: cierre después de la apertura y tramos que no se crucen.
 * Son las mismas reglas que la base de datos (check y exclude), para
 * mostrar el error antes de guardar.
 */
export function validarSemana(semana: Semana): ErroresSemana {
  const errores: ErroresSemana = {};
  const marcar = (dia: number, i: number, mensaje: string) => {
    errores[dia] ??= {};
    errores[dia][i] ??= mensaje;
  };

  for (const [diaTexto, tramos] of Object.entries(semana)) {
    const dia = Number(diaTexto);
    tramos.forEach((t, i) => {
      if (aMinutos(t.cierra) <= aMinutos(t.abre)) marcar(dia, i, "El cierre debe ser después de la apertura.");
    });
    tramos.forEach((a, i) => {
      tramos.forEach((b, j) => {
        if (i >= j) return;
        const seCruzan = aMinutos(a.abre) < aMinutos(b.cierra) && aMinutos(b.abre) < aMinutos(a.cierra);
        if (seCruzan) marcar(dia, j, "Este turno se cruza con otro.");
      });
    });
  }
  return errores;
}

export function hayErrores(errores: ErroresSemana): boolean {
  return Object.values(errores).some((d) => Object.keys(d).length > 0);
}

/** "09:00 – 13:00 y 15:00 – 20:00" o "Cerrado". */
export function resumenDia(tramos: Tramo[]): string {
  if (tramos.length === 0) return "Cerrado";
  return tramos.map((t) => `${t.abre} – ${t.cierra}`).join(" y ");
}

/** Un turno nuevo justo después del último (por defecto 4 horas, sin pasar de 23:30). */
export function siguienteTramo(tramos: Tramo[]): Tramo {
  if (tramos.length === 0) return { abre: "09:00", cierra: "19:00" };
  const fin = Math.max(...tramos.map((t) => aMinutos(t.cierra)));
  const abre = Math.min(fin + 60, 23 * 60);
  return { abre: aHora(abre), cierra: aHora(Math.min(abre + 240, 23 * 60 + 30)) };
}
