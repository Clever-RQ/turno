import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { crearClienteServidor } from "@/lib/supabase/server";
import { iniciales } from "@/lib/texto";
import { cerrarSesion } from "../../(auth)/acciones";

// Secciones del panel (se activan en los próximos sprints)
const SECCIONES = ["Agenda", "Servicios", "Horarios", "Clientes", "Asistente IA", "Métricas"];

/**
 * Quién protege el panel:
 * 1. proxy.ts redirige a /login si no hay sesión (rápido, antes de renderizar).
 * 2. TarjetaNegocio vuelve a verificar con getClaims() y exige que el dueño tenga negocio.
 * 3. RLS: aunque algo fallara arriba, la base de datos no devuelve datos ajenos.
 */
export default function LayoutPanel({ children }: LayoutProps<"/panel">) {
  return (
    <div className="relative isolate flex min-h-dvh flex-1 flex-col gap-4 bg-fondo p-4 lg:flex-row lg:gap-8 lg:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 size-[36rem] rounded-full bg-esmeralda/20 blur-[140px]" />
        <div className="absolute -bottom-48 -right-24 size-[30rem] rounded-full bg-esmeralda/10 blur-[140px]" />
      </div>

      <aside className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5 lg:w-72 lg:shrink-0 lg:p-6">
        <Logo className="h-8 w-auto self-start lg:ml-4 lg:mt-2" />

        <nav aria-label="Secciones del panel" className="hidden lg:block">
          <ul className="space-y-1">
            {SECCIONES.map((seccion, i) => (
              <li
                key={seccion}
                aria-current={i === 0 ? "page" : undefined}
                className={
                  i === 0
                    ? "rounded-xl border border-esmeralda/40 bg-esmeralda/15 px-4 py-3 font-semibold text-white"
                    : "px-4 py-3 text-white/40"
                }
              >
                {seccion}
              </li>
            ))}
          </ul>
        </nav>

        {/* La sesión se lee en la petición: con cacheComponents va dentro de Suspense */}
        <Suspense fallback={<div className="h-[4.25rem] rounded-2xl bg-white/[0.05] lg:mt-auto" />}>
          <TarjetaNegocio />
        </Suspense>
      </aside>

      <main className="flex-1 lg:py-2">{children}</main>
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

  // Por RLS solo puede volver el negocio de este dueño (y hay uno como máximo: unique owner_id).
  const { data: negocio } = await supabase.from("negocios").select("nombre").maybeSingle();
  if (!negocio) redirect("/onboarding");

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/[0.05] p-3 lg:mt-auto">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-menta font-titulo font-bold text-tinta">
        {iniciales(negocio.nombre)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-white">{negocio.nombre}</p>
        <p className="truncate text-sm text-white/60">{data.claims.email}</p>
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
