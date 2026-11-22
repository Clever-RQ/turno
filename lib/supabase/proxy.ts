import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const RUTAS_PRIVADAS = ["/panel"];
const RUTAS_SOLO_INVITADOS = ["/login", "/registro"];

/**
 * Se ejecuta antes de cada página (desde proxy.ts):
 * 1. Renueva la sesión si el token venció y guarda las cookies nuevas.
 * 2. Manda a /login a quien entra al panel sin sesión.
 * 3. Manda al panel a quien ya tiene sesión y abre /login o /registro.
 *
 * Es una comprobación rápida. La protección real está en el layout del
 * panel (que vuelve a verificar) y en RLS (que filtra los datos).
 */
export async function actualizarSesion(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers ?? {}).forEach(([clave, valor]) =>
            response.headers.set(clave, valor),
          );
        },
      },
    },
  );

  // getClaims() valida el token. No uses getSession() en el servidor:
  // lee la cookie sin verificarla.
  const { data } = await supabase.auth.getClaims();
  const hayUsuario = Boolean(data?.claims);
  const ruta = request.nextUrl.pathname;

  if (!hayUsuario && RUTAS_PRIVADAS.some((r) => ruta.startsWith(r))) {
    return redirigir(request, response, "/login");
  }

  if (hayUsuario && RUTAS_SOLO_INVITADOS.includes(ruta)) {
    return redirigir(request, response, "/panel");
  }

  return response;
}

// Redirige sin perder las cookies de sesión que se acaban de renovar.
function redirigir(request: NextRequest, response: NextResponse, destino: string) {
  const url = request.nextUrl.clone();
  url.pathname = destino;
  url.search = "";
  const redireccion = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redireccion.cookies.set(cookie));
  return redireccion;
}
