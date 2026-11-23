import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServidor } from "@/server/supabase/server";

/**
 * Aquí vuelve el usuario después de elegir su cuenta en Google.
 * Google -> Supabase -> /auth/callback?code=...
 * Cambiamos ese código por una sesión (flujo PKCE) y entramos al panel.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const codigo = searchParams.get("code");

  if (codigo) {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    if (!error) return NextResponse.redirect(`${origin}/panel`);
  }

  return NextResponse.redirect(`${origin}/login?error=google`);
}
