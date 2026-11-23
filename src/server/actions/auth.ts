"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { crearClienteServidor } from "@/server/supabase/server";
import { mensajeErrorAuth } from "@/domain/errores-auth";
import {
  loginSchema,
  nuevaContrasenaSchema,
  recuperarSchema,
  registroSchema,
} from "@/domain/esquemas";

/** Lo que cada formulario recibe de vuelta para mostrar errores o éxito. */
export type EstadoFormulario = {
  errores?: Record<string, string[] | undefined>;
  mensaje?: string;
  ok?: boolean;
  email?: string;
};

// URL base de la app (localhost, preview o producción) para los enlaces de los correos.
async function origen() {
  const h = await headers();
  return h.get("origin") ?? `https://${h.get("host")}`;
}

function erroresDe(error: z.ZodError) {
  return z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
}

// ---------------------------------------------------------------

export async function iniciarSesion(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const datos = loginSchema.safeParse(Object.fromEntries(formData));
  const email = String(formData.get("email") ?? "");
  if (!datos.success) return { errores: erroresDe(datos.error), email };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword(datos.data);
  if (error) return { mensaje: mensajeErrorAuth(error.code), email };

  redirect("/panel");
}

export async function registrarse(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const datos = registroSchema.safeParse(Object.fromEntries(formData));
  const email = String(formData.get("email") ?? "");
  if (!datos.success) return { errores: erroresDe(datos.error), email };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.signUp({
    email: datos.data.email,
    password: datos.data.password,
    options: {
      emailRedirectTo: `${await origen()}/auth/confirm`,
      // El nombre del dueño va en los metadatos del usuario (no hay tabla de perfiles).
      data: { nombre: datos.data.nombre },
    },
  });
  if (error) return { mensaje: mensajeErrorAuth(error.code), email };

  // Si la confirmación de correo estuviera desactivada, ya habría sesión.
  if (data.session) redirect("/panel");

  // Por seguridad, Supabase responde igual aunque el correo ya exista:
  // así nadie puede averiguar qué correos están registrados.
  return { ok: true, email: datos.data.email };
}

export async function enviarEnlaceRecuperacion(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const datos = recuperarSchema.safeParse(Object.fromEntries(formData));
  const email = String(formData.get("email") ?? "");
  if (!datos.success) return { errores: erroresDe(datos.error), email };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.resetPasswordForEmail(datos.data.email, {
    redirectTo: `${await origen()}/auth/confirm`,
  });

  // Solo avisamos del límite de envíos. Cualquier otro caso muestra el mismo
  // mensaje, exista o no la cuenta (no revelamos qué correos están registrados).
  if (error?.code === "over_email_send_rate_limit") {
    return { mensaje: mensajeErrorAuth(error.code), email };
  }
  return { ok: true, email: datos.data.email };
}

export async function guardarNuevaContrasena(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const datos = nuevaContrasenaSchema.safeParse(Object.fromEntries(formData));
  if (!datos.success) return { errores: erroresDe(datos.error) };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.updateUser({ password: datos.data.password });
  if (error) return { mensaje: mensajeErrorAuth(error.code) };

  redirect("/panel");
}

export async function iniciarConGoogle() {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await origen()}/auth/callback` },
  });
  if (error || !data.url) redirect("/login?error=google");

  redirect(data.url);
}

export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}
