import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { BannerBienvenida } from "@/components/panel/banner-bienvenida";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Panel · Turno" };

// Página temporal del panel. La agenda real llega en el Sprint 3.
export default function PaginaPanel({ searchParams }: PageProps<"/panel">) {
  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <Bienvenida searchParams={searchParams} />
      </Suspense>

      <h1 className="font-titulo text-4xl font-bold tracking-tight text-white sm:text-5xl">
        Bienvenido a Turno
      </h1>
      <Suspense fallback={null}>
        <AvisosConfiguracion />
      </Suspense>
      <section className="max-w-2xl rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <p className="text-lg text-white/80">
          Tu negocio está creado. Pronto podrás configurar tus horarios y ver tu agenda desde aquí.
        </p>
      </section>
    </div>
  );
}

// Sin servicios activos o sin personal activo no se puede reservar: se lo recordamos al dueño.
async function AvisosConfiguracion() {
  await connection();
  const supabase = await crearClienteServidor();
  const [servicios, personal] = await Promise.all([
    supabase.from("servicios").select("id", { count: "exact", head: true }).eq("activo", true),
    supabase.from("personal").select("id", { count: "exact", head: true }).eq("activo", true),
  ]);

  return (
    <>
      {!servicios.count && (
        <Aviso
          titulo="Agrega tus servicios para recibir reservas"
          texto="Tus clientes necesitan elegir un servicio activo para reservar contigo."
          href="/panel/servicios"
          boton="Agregar servicios"
        />
      )}
      {!personal.count && (
        <Aviso
          titulo="Nadie de tu equipo recibe citas"
          texto="Cada cita se reserva con una persona. Agrega o activa a alguien de tu equipo."
          href="/panel/equipo"
          boton="Ir a Equipo"
        />
      )}
    </>
  );
}

function Aviso({ titulo, texto, href, boton }: { titulo: string; texto: string; href: string; boton: string }) {
  return (
    <div role="status" className="flex flex-col gap-4 rounded-3xl border border-amber-300/30 bg-amber-300/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div>
        <p className="font-titulo text-lg font-bold text-white">{titulo}</p>
        <p className="mt-1 text-white/75">{texto}</p>
      </div>
      <Link
        href={href}
        className="shrink-0 rounded-xl bg-esmeralda px-5 py-3 text-center font-medium text-tinta transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-enlace"
      >
        {boton}
      </Link>
    </div>
  );
}

// Banner solo al llegar desde el onboarding (/panel?bienvenida=1).
async function Bienvenida({ searchParams }: Pick<PageProps<"/panel">, "searchParams">) {
  const { bienvenida } = await searchParams;
  if (bienvenida !== "1") return null;

  await connection();
  const supabase = await crearClienteServidor();
  const { data: negocio } = await supabase.from("negocios").select("slug").maybeSingle();
  if (!negocio) return null;

  const dominio = (await headers()).get("host") ?? "turno-eta-seven.vercel.app";
  return <BannerBienvenida dominio={dominio} slug={negocio.slug} />;
}
