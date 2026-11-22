// Solo para el servidor (Server Components y Server Actions).
import type { Servicio } from "./servicios";
import type { crearClienteServidor } from "./supabase/server";

type ClienteSupabase = Awaited<ReturnType<typeof crearClienteServidor>>;

export type Negocio = { id: string; nombre: string; slug: string; telefono: string | null };

/**
 * El negocio del usuario con sesión. Por RLS solo puede volver el suyo,
 * y hay uno como máximo (unique owner_id).
 */
export async function obtenerNegocio(supabase: ClienteSupabase): Promise<Negocio | null> {
  const { data } = await supabase.from("negocios").select("id, nombre, slug, telefono").maybeSingle();
  return data;
}

/** Servicios del negocio del usuario: activos primero, después por nombre. */
export async function obtenerServicios(supabase: ClienteSupabase): Promise<Servicio[]> {
  const { data } = await supabase
    .from("servicios")
    .select("id, nombre, duracion_min, precio, activo")
    .order("activo", { ascending: false })
    .order("nombre");
  return data ?? [];
}

export type Persona = { id: string; nombre: string; activo: boolean };

/** Equipo del negocio del usuario: activos primero, después por nombre. */
export async function obtenerPersonal(supabase: ClienteSupabase): Promise<Persona[]> {
  const { data } = await supabase
    .from("personal")
    .select("id, nombre, activo")
    .order("activo", { ascending: false })
    .order("nombre");
  return data ?? [];
}
