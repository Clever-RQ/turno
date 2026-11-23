"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { MENSAJE_GENERICO } from "@/domain/errores-auth";
import { personaSchema } from "@/domain/esquemas";
import { obtenerNegocio } from "@/server/data/negocio";
import { crearClienteServidor } from "@/server/supabase/server";

/**
 * Acciones del equipo (tabla personal). Igual que en servicios:
 * negocio_id sale de la sesión y RLS lo vuelve a comprobar.
 */

export type EstadoPersona = {
  errores?: Record<string, string[] | undefined>;
  mensaje?: string;
  guardados?: number;
};

async function clienteYNegocio() {
  const supabase = await crearClienteServidor();
  const negocio = await obtenerNegocio(supabase);
  if (!negocio) redirect("/onboarding");
  return { supabase, negocio };
}

export async function guardarPersona(previo: EstadoPersona, formData: FormData): Promise<EstadoPersona> {
  const datos = personaSchema.safeParse(Object.fromEntries(formData));
  if (!datos.success) {
    return { ...previo, errores: z.flattenError(datos.error).fieldErrors as EstadoPersona["errores"] };
  }

  const { supabase, negocio } = await clienteYNegocio();
  const { id, ...campos } = datos.data;

  const { error } = id
    ? await supabase.from("personal").update(campos).eq("id", id)
    : await supabase.from("personal").insert({ ...campos, negocio_id: negocio.id });

  if (error) return { ...previo, errores: undefined, mensaje: MENSAJE_GENERICO };

  refresh();
  return { guardados: (previo.guardados ?? 0) + 1 };
}

export async function cambiarActivoPersona(id: string, activo: boolean) {
  const { supabase } = await clienteYNegocio();
  await supabase.from("personal").update({ activo }).eq("id", z.uuid().parse(id));
  refresh();
}

/** Devuelve un mensaje si no se pudo eliminar. */
export async function eliminarPersona(id: string): Promise<string | null> {
  const { supabase } = await clienteYNegocio();
  const { error } = await supabase.from("personal").delete().eq("id", z.uuid().parse(id));

  if (error) {
    // 23503 = tiene reservas (la foreign key de reservas no permite borrarla).
    return error.code === "23503"
      ? "Esta persona ya tiene reservas, así que no se puede eliminar. Desactívala para que no reciba citas nuevas."
      : MENSAJE_GENERICO;
  }

  refresh();
  return null;
}
