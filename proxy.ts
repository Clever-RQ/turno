import type { NextRequest } from "next/server";
import { actualizarSesion } from "@/lib/supabase/proxy";

// En Next.js 16, "middleware.ts" pasó a llamarse "proxy.ts".
export async function proxy(request: NextRequest) {
  return actualizarSesion(request);
}

export const config = {
  // Todo menos archivos estáticos e imágenes.
  matcher: [
    "/((?!_next/static|_next/image|icon.svg|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
