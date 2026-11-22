import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * Aquí llegan los enlaces de los correos de Supabase:
 *   confirmar cuenta   -> ?token_hash=...&type=email
 *   recuperar contraseña -> ?token_hash=...&type=recovery
 * Verifica el token, crea la sesión (cookies) y redirige.
 *
 * Usamos token_hash (y no ?code=) porque funciona aunque el correo
 * se abra en otro navegador o en el celular.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && tipo) {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash });

    if (!error) {
      const destino = tipo === "recovery" ? "/nueva-contrasena" : "/panel";
      return NextResponse.redirect(`${origin}${destino}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=enlace`);
}
