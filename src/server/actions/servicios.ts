"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { MENSAJE_GENERICO } from "@/domain/errores-auth";
import { servicioSchema } from "@/domain/esquemas";
import { obtenerNegocio } from "@/server/data/negocio";
import { crearClienteServidor } from "@/server/supabase/server";

/**
 * Acciones de servicios, compartidas por el onboarding (paso 2) y el panel.
 * Seguridad: negocio_id sale del negocio del usuario con sesión, nunca del
 * formulario. Además RLS solo deja tocar servicios de su negocio.
 * Después de cada cambio, refresh() vuelve a pedir los datos de la pantalla.
 */

export type EstadoServicio = {
  errores?: Record<string, string[] | undefined>;
  mensaje?: string;
  /** Sube con cada guardado exitoso: el formulario lo usa para limpiarse o cerrarse. */
  guardados?: number;
};

async function clienteYNegocio() {
  const supabase = await crearClienteServidor();
  const negocio = await obtenerNegocio(supabase);
  if (!negocio) redirect("/onboarding");
  return { supabase, negocio };
}

export async function guardarServicio(
  previo: EstadoServicio,
  formData: FormData,
): Promise<EstadoServicio> {
  const datos = servicioSchema.safeParse(Object.fromEntries(formData));
  if (!datos.success) {
    return { ...previo, errores: z.flattenError(datos.error).fieldErrors as EstadoServicio["errores"] };
  }

  const { supabase, negocio } = await clienteYNegocio();
  const { id, ...campos } = datos.data;

  const { error } = id
    ? await supabase.from("servicios").update(campos).eq("id", id)
    : await supabase.from("servicios").insert({ ...campos, negocio_id: negocio.id });

  if (error) return { ...previo, errores: undefined, mensaje: MENSAJE_GENERICO };

  refresh();
  return { guardados: (previo.guardados ?? 0) + 1 };
}

export async function cambiarActivoServicio(id: string, activo: boolean) {
  const { supabase } = await clienteYNegocio();
  await supabase.from("servicios").update({ activo }).eq("id", z.uuid().parse(id));
  refresh();
}

/** Devuelve un mensaje si no se pudo eliminar. */
export async function eliminarServicio(id: string): Promise<string | null> {
  const { supabase } = await clienteYNegocio();
  const { error } = await supabase.from("servicios").delete().eq("id", z.uuid().parse(id));

  if (error) {
    // 23503 = la foreign key de reservas lo impide: este servicio tiene citas.
    return error.code === "23503"
      ? "Este servicio ya tiene reservas, así que no se puede eliminar. Desactívalo para que no se pueda reservar."
      : MENSAJE_GENERICO;
  }

  refresh();
  return null;
}
