/**
 * Traduce los códigos de error de Supabase Auth a mensajes en español.
 * Códigos: https://supabase.com/docs/guides/auth/debugging/error-codes
 */
const MENSAJES: Record<string, string> = {
  invalid_credentials: "Correo o contraseña incorrectos.",
  email_not_confirmed:
    "Aún no confirmaste tu correo. Revisa tu bandeja de entrada (y la de spam).",
  user_already_exists: "Ya existe una cuenta con ese correo. Inicia sesión.",
  email_exists: "Ya existe una cuenta con ese correo. Inicia sesión.",
  weak_password: "La contraseña es muy débil. Usa al menos 8 caracteres, con letras y números.",
  same_password: "La nueva contraseña debe ser distinta a la anterior.",
  over_email_send_rate_limit:
    "Enviamos demasiados correos. Espera unos minutos e inténtalo otra vez.",
  over_request_rate_limit: "Demasiados intentos. Espera unos minutos e inténtalo otra vez.",
  otp_expired: "El enlace venció o ya se usó. Pide uno nuevo.",
  session_not_found: "Tu sesión venció. Vuelve a iniciar sesión.",
  provider_disabled: "El inicio con Google todavía no está activado.",
  validation_failed: "Revisa los datos e inténtalo otra vez.",
};

export const MENSAJE_GENERICO = "Algo salió mal. Inténtalo otra vez en unos segundos.";

export function mensajeErrorAuth(codigo: string | undefined): string {
  if (!codigo) return MENSAJE_GENERICO;
  return MENSAJES[codigo] ?? MENSAJE_GENERICO;
}
