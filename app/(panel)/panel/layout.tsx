import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { MenuMovil, NavegacionPanel } from "@/components/panel/navegacion";
import { obtenerNegocio } from "@/lib/negocio";
import { crearClienteServidor } from "@/lib/supabase/server";
import { iniciales } from "@/lib/texto";
import { cerrarSesion } from "../../(auth)/acciones";

/**
 * Quién protege el panel:
 * 1. proxy.ts redirige a /login si no hay sesión (rápido, antes de renderizar).
 * 2. TarjetaNegocio vuelve a verificar con getClaims() y exige que el dueño tenga negocio.
 * 3. RLS: aunque algo fallara arriba, la base de datos no devuelve datos ajenos.
 */
export default function LayoutPanel({ children }: LayoutProps<"/panel">) {
  const tarjeta = (
    <Suspense fallback={<div className="h-[4.75rem] rounded-2xl bg-white/[0.05]" />}>
      <TarjetaNegocio />
    </Suspense>
  );

  return (
    <div className="relative isolate flex min-h-dvh flex-1 flex-col gap-4 bg-fondo p-4 lg:flex-row lg:gap-8 lg:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 size-[36rem] rounded-full bg-esmeralda/20 blur-[140px]" />
        <div className="absolute -bottom-48 -right-24 size-[30rem] rounded-full bg-esmeralda/10 blur-[140px]" />
      </div>

      {/* Computadora: barra lateral */}
      <aside className="hidden flex-col gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 lg:flex lg:w-72 lg:shrink-0">
        <Logo className="ml-4 mt-2 h-8 w-auto self-start" />
        <NavegacionPanel />
        <div className="mt-auto">{tarjeta}</div>
      </aside>

      {/* Celular: barra superior con menú */}
      <MenuMovil tarjeta={tarjeta} />

      <main className="min-w-0 flex-1 lg:py-2">{children}</main>
    </div>
  );
}

async function TarjetaNegocio() {
  // getClaims() compara la hora actual con el vencimiento del token.
  // connection() hace que esto se calcule solo en la visita real, no en un prefetch.
  await connection();
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const negocio = await obtenerNegocio(supabase);
  if (!negocio) redirect("/onboarding");

  const dominio = (await headers()).get("host") ?? "turno-eta-seven.vercel.app";

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/[0.05] p-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-menta font-titulo font-bold text-tinta">
        {iniciales(negocio.nombre)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-white">{negocio.nombre}</p>
        <p className="truncate text-sm text-white/60">
          {dominio}/{negocio.slug}
        </p>
      </div>
      <form action={cerrarSesion}>
        <button
          type="submit"
          className="rounded-lg px-2 py-1 text-sm font-medium text-enlace hover:text-menta focus-visible:outline-2 focus-visible:outline-esmeralda"
        >
          Salir
        </button>
      </form>
    </div>
  );
}
