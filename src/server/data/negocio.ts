import "server-only";
import type { FilaHorario } from "@/domain/horarios";
import type { Servicio } from "@/domain/servicios";
import type { crearClienteServidor } from "@/server/supabase/server";

type ClienteSupabase = Awaited<ReturnType<typeof crearClienteServidor>>;

export type Negocio = { id: string; nombre: string; slug: string; telefono: string | null; zona_horaria: string };

/**
 * El negocio del usuario con sesión. Por RLS solo puede volver el suyo,
 * y hay uno como máximo (unique owner_id).
 */
export async function obtenerNegocio(supabase: ClienteSupabase): Promise<Negocio | null> {
  const { data } = await supabase.from("negocios").select("id, nombre, slug, telefono, zona_horaria").maybeSingle();
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

export type Persona = { id: string; nombre: string; activo: boolean; horario_propio: boolean };

/** Equipo del negocio del usuario: activos primero, después por nombre. */
export async function obtenerPersonal(supabase: ClienteSupabase): Promise<Persona[]> {
  const { data } = await supabase
    .from("personal")
    .select("id, nombre, activo, horario_propio")
    .order("activo", { ascending: false })
    .order("nombre");
  return data ?? [];
}

/** Todos los tramos del negocio: los generales (personal_id null) y los de cada persona. */
export async function obtenerHorarios(supabase: ClienteSupabase): Promise<FilaHorario[]> {
  const { data } = await supabase.from("horarios").select("personal_id, dia_semana, abre, cierra");
  return data ?? [];
}

export type Bloqueo = { id: string; personal_id: string | null; inicio: string; fin: string; motivo: string | null };

/** Días libres que todavía no terminaron, del más próximo al más lejano. */
export async function obtenerBloqueos(supabase: ClienteSupabase): Promise<Bloqueo[]> {
  const { data } = await supabase
    .from("bloqueos")
    .select("id, personal_id, inicio, fin, motivo")
    .gte("fin", new Date().toISOString())
    .order("inicio");
  return data ?? [];
}
