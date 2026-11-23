"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { MENSAJE_GENERICO } from "@/lib/errores-auth";
import { bloqueoSchema, semanaSchema } from "@/lib/esquemas";
import { aInstante, sumarDias } from "@/lib/fechas";
import { hayErrores, horarioTipico, semanaATramos, validarSemana, type Semana } from "@/lib/horarios";
import { obtenerNegocio } from "@/lib/negocio";
import { crearClienteServidor } from "@/lib/supabase/server";

async function clienteYNegocio() {
  const supabase = await crearClienteServidor();
  const negocio = await obtenerNegocio(supabase);
  if (!negocio) redirect("/onboarding");
  return { supabase, negocio };
}

const idPersona = z.uuid().nullable();

// -------------------------------------------------------------
// Horario semanal
// -------------------------------------------------------------

/**
 * Guarda la semana completa (del negocio si personalId es null, o de una persona).
 * La función SQL guardar_horario borra e inserta en una sola transacción.
 */
export async function guardarHorario(personalId: string | null, semanaRecibida: Semana): Promise<string | null> {
  // Viene del navegador: primero se comprueba la forma, después las reglas.
  const validacion = semanaSchema.safeParse(semanaRecibida);
  if (!validacion.success) return MENSAJE_GENERICO;
  const semana = validacion.data as unknown as Semana;

  // Mismas reglas que la base de datos, para no mandar algo que va a fallar.
  if (hayErrores(validarSemana(semana))) return "Revisa los turnos marcados en rojo.";

  const { supabase } = await clienteYNegocio();
  const { error } = await supabase.rpc("guardar_horario", {
    p_personal_id: idPersona.parse(personalId),
    p_tramos: semanaATramos(semana),
    p_propio: true,
  });

  if (error) {
    // 23P01 = exclude (tramos cruzados) · 23514 = check (cierre antes de la apertura)
    if (error.code === "23P01") return "Hay turnos que se cruzan el mismo día.";
    if (error.code === "23514") return "Hay un turno que cierra antes de abrir.";
    return MENSAJE_GENERICO;
  }

  refresh();
  return null;
}

/** La persona vuelve a atender en el horario del negocio (se borran sus tramos propios). */
export async function usarHorarioDelNegocio(personalId: string): Promise<string | null> {
  const { supabase } = await clienteYNegocio();
  const { error } = await supabase.rpc("guardar_horario", {
    p_personal_id: z.uuid().parse(personalId),
    p_tramos: [],
    p_propio: false,
  });
  if (error) return MENSAJE_GENERICO;
  refresh();
  return null;
}

/** Botón "Usar horario típico": lunes a sábado de 9:00 a 19:00 para todo el negocio. */
export async function aplicarHorarioTipico(): Promise<string | null> {
  return guardarHorario(null, horarioTipico());
}

// -------------------------------------------------------------
// Días libres (tabla bloqueos)
// -------------------------------------------------------------

export type EstadoBloqueo = {
  errores?: Record<string, string[] | undefined>;
  mensaje?: string;
  guardados?: number;
};

export async function guardarBloqueo(previo: EstadoBloqueo, formData: FormData): Promise<EstadoBloqueo> {
  const datos = bloqueoSchema.safeParse(Object.fromEntries(formData));
  if (!datos.success) {
    return { ...previo, errores: z.flattenError(datos.error).fieldErrors as EstadoBloqueo["errores"] };
  }

  const { supabase, negocio } = await clienteYNegocio();
  const d = datos.data;
  const zona = negocio.zona_horaria;

  // El dueño eligió fechas y horas de su ciudad: se convierten a instantes UTC.
  // Día completo: desde las 00:00 del primer día hasta las 00:00 del día siguiente al último.
  const inicio = d.todo_el_dia ? aInstante(d.desde, "00:00", zona) : aInstante(d.desde, d.hora_desde!, zona);
  const fin = d.todo_el_dia
    ? aInstante(sumarDias(d.hasta ?? d.desde, 1), "00:00", zona)
    : aInstante(d.desde, d.hora_hasta!, zona);

  if (fin.getTime() <= Date.now()) {
    return { ...previo, errores: { desde: ["Esa fecha ya pasó."] } };
  }

  const { error } = await supabase.from("bloqueos").insert({
    negocio_id: negocio.id,
    personal_id: d.aplica === "negocio" ? null : d.aplica,
    inicio: inicio.toISOString(),
    fin: fin.toISOString(),
    motivo: d.motivo,
  });
  if (error) return { ...previo, errores: undefined, mensaje: MENSAJE_GENERICO };

  refresh();
  return { guardados: (previo.guardados ?? 0) + 1 };
}

export async function eliminarBloqueo(id: string): Promise<string | null> {
  const { supabase } = await clienteYNegocio();
  const { error } = await supabase.from("bloqueos").delete().eq("id", z.uuid().parse(id));
  if (error) return MENSAJE_GENERICO;
  refresh();
  return null;
}
