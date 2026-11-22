import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { obtenerNegocio, obtenerServicios } from "@/lib/negocio";
import { crearClienteServidor } from "@/lib/supabase/server";
import { EncabezadoOnboarding } from "../../encabezado";
import { PasoServicios } from "./paso-servicios";

export const metadata: Metadata = { title: "Agrega tus servicios · Turno" };

export default function PaginaPasoServicios() {
  return (
    <>
      <EncabezadoOnboarding paso={2} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8 lg:py-12">
        <Suspense fallback={<div className="h-[36rem] animate-pulse rounded-3xl bg-white/[0.03]" />}>
          <Contenido />
        </Suspense>
      </main>
    </>
  );
}

async function Contenido() {
  await connection();
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  // Sin negocio todavía no hay a qué agregarle servicios: vuelve al paso 1.
  const negocio = await obtenerNegocio(supabase);
  if (!negocio) redirect("/onboarding");

  const servicios = await obtenerServicios(supabase);
  const dominio = (await headers()).get("host") ?? "turno-eta-seven.vercel.app";

  return <PasoServicios negocio={negocio} servicios={servicios} dominio={dominio} />;
}
