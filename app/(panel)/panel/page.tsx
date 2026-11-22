import type { Metadata } from "next";
import { headers } from "next/headers";
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
      <section className="max-w-2xl rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <p className="text-lg text-white/80">
          Tu negocio está creado. Pronto podrás agregar tus servicios, tu personal y tus horarios
          desde aquí.
        </p>
      </section>
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
