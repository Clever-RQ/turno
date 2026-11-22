"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { MENSAJES_SLUG, onboardingSchema, slugSchema } from "@/lib/esquemas";
import { MENSAJE_GENERICO } from "@/lib/errores-auth";
import { sugerirSlugs } from "@/lib/slug";
import { crearClienteServidor } from "@/lib/supabase/server";

type ClienteSupabase = Awaited<ReturnType<typeof crearClienteServidor>>;

export type ComprobacionSlug =
  | { estado: "disponible" }
  | { estado: "ocupado"; mensaje: string; sugerencias: string[] }
  | { estado: "reservado" | "invalido"; mensaje: string }
  | { estado: "desconocido" };

/** Para el "✓ Disponible" mientras el dueño escribe su link. */
export async function comprobarSlug(slug: string): Promise<ComprobacionSlug> {
  const validacion = slugSchema.safeParse(slug);
  if (!validacion.success) {
    const mensaje = validacion.error.issues[0].message;
    return { estado: mensaje === MENSAJES_SLUG.reservado ? "reservado" : "invalido", mensaje };
  }

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("slug_disponible", { p_slug: validacion.data });
  // Si no se pudo comprobar, no bloqueamos: el unique de la base de datos decide al guardar.
  if (error) return { estado: "desconocido" };
  if (data) return { estado: "disponible" };

  return {
    estado: "ocupado",
    mensaje: "Ese link ya está en uso.",
    sugerencias: await sugerenciasLibres(supabase, validacion.data),
  };
}

// Solo muestra sugerencias que de verdad estén libres.
async function sugerenciasLibres(supabase: ClienteSupabase, base: string) {
  const candidatas = sugerirSlugs(base);
  const respuestas = await Promise.all(
    candidatas.map((slug) => supabase.rpc("slug_disponible", { p_slug: slug })),
  );
  return candidatas.filter((_, i) => respuestas[i].data === true);
}

export type EstadoOnboarding = {
  errores?: Record<string, string[] | undefined>;
  mensaje?: string;
  /** El link que se intentó guardar, para mostrar su error solo mientras no cambie. */
  slugEnviado?: string;
  sugerencias?: string[];
};

export async function crearNegocio(
  _previo: EstadoOnboarding,
  formData: FormData,
): Promise<EstadoOnboarding> {
  const datos = onboardingSchema.safeParse(Object.fromEntries(formData));
  const slugEnviado = String(formData.get("slug") ?? "");
  if (!datos.success) {
    return {
      errores: z.flattenError(datos.error).fieldErrors as Record<string, string[] | undefined>,
      slugEnviado,
    };
  }

  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  // owner_id sale de la sesión, nunca del formulario. RLS además exige owner_id = auth.uid().
  const { data: negocio, error } = await supabase
    .from("negocios")
    .insert({
      owner_id: data.claims.sub,
      nombre: datos.data.nombre,
      slug: datos.data.slug,
      telefono: datos.data.telefono,
    })
    .select("id")
    .single();

  if (error) {
    // 23505 = unique: otro negocio tomó el link justo antes, o este dueño ya tiene negocio.
    if (error.code === "23505") {
      if (error.message.includes("negocios_owner_id_key")) redirect("/panel");
      return {
        errores: { slug: ["Ese link ya está en uso."] },
        slugEnviado,
        sugerencias: await sugerenciasLibres(supabase, datos.data.slug),
      };
    }
    return { mensaje: MENSAJE_GENERICO, slugEnviado };
  }

  // El dueño es la primera persona del equipo (muchos negocios son de una sola persona).
  // Si fallara, no bloqueamos: el panel avisa que no hay personal y lo puede agregar.
  const metadatos = (data.claims.user_metadata ?? {}) as { nombre?: string; full_name?: string };
  await supabase.from("personal").insert({
    negocio_id: negocio.id,
    nombre: metadatos.nombre?.trim() || metadatos.full_name?.trim() || "Yo",
  });

  // Paso 2: agregar servicios.
  redirect("/onboarding/servicios");
}
