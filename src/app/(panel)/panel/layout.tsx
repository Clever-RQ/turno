import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { MenuMovil, NavegacionPanel } from "@/components/panel/navegacion";
import { IconoSalir } from "@/components/ui/iconos";
import { Logo } from "@/components/ui/logo";
import { iniciales } from "@/domain/texto";
import { cerrarSesion } from "@/server/actions/auth";
import { obtenerNegocio } from "@/server/data/negocio";
import { crearClienteServidor } from "@/server/supabase/server";

/**
 * Quién protege el panel:
 * 1. proxy.ts redirige a /login si no hay sesión (rápido, antes de renderizar).
 * 2. TarjetaNegocio vuelve a verificar con getClaims() y exige que el dueño tenga negocio.
 * 3. RLS: aunque algo fallara arriba, la base de datos no devuelve datos ajenos.
 */
export default function LayoutPanel({ children }: LayoutProps<"/panel">) {
  const tarjeta = (
    <Suspense fallback={<div className="h-[4.25rem] animate-pulse rounded-2xl bg-white/[0.05]" />}>
      <TarjetaNegocio />
    </Suspense>
  );

  return (
    <div className="relative isolate flex min-h-dvh flex-1 flex-col gap-4 bg-fondo p-3 sm:p-4 lg:flex-row lg:gap-6 lg:p-5">
      {/* Fondo: brillos que el vidrio desenfoca */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-48 -top-48 size-[40rem] rounded-full bg-esmeralda/25 blur-[150px]" />
        <div className="absolute left-[30%] top-[55%] size-[26rem] rounded-full bg-esmeralda/[0.07] blur-[140px]" />
        <div className="absolute -bottom-56 -right-32 size-[34rem] rounded-full bg-esmeralda/12 blur-[150px]" />
      </div>

      {/* Computadora: barra lateral de vidrio, fija al hacer scroll */}
      <aside className="vidrio sticky top-5 hidden h-[calc(100dvh-2.5rem)] flex-col gap-7 rounded-3xl p-4 lg:flex lg:w-64 lg:shrink-0 xl:w-[17rem]">
        <Logo className="ml-3 mt-3 h-7 w-auto self-start" />
        <NavegacionPanel />
        <div className="mt-auto">{tarjeta}</div>
      </aside>

      {/* Celular: barra superior con menú */}
      <MenuMovil tarjeta={tarjeta} />

      <main className="min-w-0 flex-1 px-1 pb-6 sm:px-2 lg:py-3 lg:pr-3">{children}</main>
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

  return (
    <div className="vidrio-suave group flex items-center gap-3 rounded-2xl p-2.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-menta font-titulo text-sm font-bold text-tinta ring-2 ring-esmeralda/40 ring-offset-2 ring-offset-tinta">
        {iniciales(negocio.nombre)}
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-[0.9rem] font-semibold text-white">{negocio.nombre}</p>
        <p className="truncate text-[0.8rem] text-white/55">/{negocio.slug}</p>
      </div>
      <form action={cerrarSesion}>
        <button
          type="submit"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="grid size-9 place-items-center rounded-xl text-white/55 transition hover:bg-white/10 hover:text-white active:scale-90 focus-visible:outline-2 focus-visible:outline-esmeralda [&:hover>svg]:translate-x-0.5"
        >
          <IconoSalir className="size-[1.15rem] transition-transform duration-200" />
        </button>
      </form>
    </div>
  );
}
