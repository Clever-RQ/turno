import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLICA = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SECRETA = process.env.SUPABASE_SECRET_KEY;

if (!URL || !PUBLICA || !SECRETA) {
  throw new Error(
    "Faltan variables de Supabase. En tu máquina: .env.local. En el CI: secrets del repo " +
      "(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY).",
  );
}

const sinSesionGuardada = { auth: { persistSession: false, autoRefreshToken: false } };

/** Cliente con la clave secreta: se salta RLS. Solo para preparar y verificar, nunca para probar permisos. */
export const admin = createClient(URL, SECRETA, sinSesionGuardada);

/** Visitante sin cuenta (rol anon), igual que la página pública. */
export const publico = createClient(URL, PUBLICA, sinSesionGuardada);

export type Dueno = {
  userId: string;
  /** Cliente con la sesión de este dueño (rol authenticated): pasa por RLS como en el navegador. */
  cliente: SupabaseClient;
  negocioId: string;
  servicioId: string;
  servicioInactivoId: string;
  personaId: string;
  bloqueoId: string;
};

/**
 * Crea un dueño temporal y su negocio completo, usando SU propia sesión
 * (así también se prueba que un dueño sí puede crear lo suyo).
 */
export async function crearDueno(etiqueta: string): Promise<Dueno> {
  const sufijo = `${etiqueta}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const email = `rls-${sufijo}@example.com`;
  const password = `Prueba-${Math.random().toString(36).slice(2)}9`;

  const { data: creado, error: errorUsuario } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre: `Dueño ${etiqueta.toUpperCase()}` },
  });
  if (errorUsuario || !creado.user) throw errorUsuario ?? new Error("No se creó el usuario");

  const cliente = createClient(URL!, PUBLICA!, sinSesionGuardada);
  const { error: errorSesion } = await cliente.auth.signInWithPassword({ email, password });
  if (errorSesion) throw errorSesion;

  const negocio = await unico(
    cliente.from("negocios").insert({ owner_id: creado.user.id, nombre: `Negocio ${etiqueta}`, slug: `rls-${sufijo}` }).select("id"),
  );
  const servicio = await unico(
    cliente.from("servicios").insert({ negocio_id: negocio.id, nombre: "Corte", duracion_min: 30, precio: 25 }).select("id"),
  );
  const servicioInactivo = await unico(
    cliente.from("servicios").insert({ negocio_id: negocio.id, nombre: "Oculto", duracion_min: 30, activo: false }).select("id"),
  );
  const persona = await unico(cliente.from("personal").insert({ negocio_id: negocio.id, nombre: "Carlos" }).select("id"));

  const { error: errorHorario } = await cliente.rpc("guardar_horario", {
    p_personal_id: null,
    p_tramos: [{ dia_semana: 1, abre: "09:00", cierra: "19:00" }],
  });
  if (errorHorario) throw errorHorario;

  const manana = Date.now() + 24 * 3600_000;
  const bloqueo = await unico(
    cliente
      .from("bloqueos")
      .insert({ negocio_id: negocio.id, inicio: new Date(manana).toISOString(), fin: new Date(manana + 3600_000).toISOString(), motivo: "Prueba" })
      .select("id"),
  );

  return {
    userId: creado.user.id,
    cliente,
    negocioId: negocio.id,
    servicioId: servicio.id,
    servicioInactivoId: servicioInactivo.id,
    personaId: persona.id,
    bloqueoId: bloqueo.id,
  };
}

/** Borra el usuario: on delete cascade se lleva su negocio y todo lo demás. */
export async function borrarDueno(dueno: Dueno | undefined) {
  if (dueno) await admin.auth.admin.deleteUser(dueno.userId);
}

async function unico<T>(consulta: PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T> {
  const { data, error } = await consulta;
  if (error) throw error;
  if (!data?.[0]) throw new Error("La consulta no devolvió filas");
  return data[0];
}
