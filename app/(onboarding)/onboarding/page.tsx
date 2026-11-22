import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { crearClienteServidor } from "@/lib/supabase/server";
import { primerNombre } from "@/lib/texto";
import { EncabezadoOnboarding } from "../encabezado";
import { FormularioOnboarding } from "./formulario";

export const metadata: Metadata = { title: "Crea tu negocio · Turno" };

export default function PaginaOnboarding() {
  return (
    <>
      <EncabezadoOnboarding paso={1} />
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
  const claims = data?.claims;
  if (!claims) redirect("/login");

  // Por RLS, esta consulta solo puede devolver el negocio de este dueño.
  const { data: negocio } = await supabase.from("negocios").select("id").maybeSingle();
  if (negocio) redirect("/panel");

  const metadatos = (claims.user_metadata ?? {}) as { nombre?: string; full_name?: string };
  const nombre = primerNombre(metadatos.nombre ?? metadatos.full_name ?? "");
  // El dominio sale de la petición: cambia solo cuando haya un dominio propio.
  const dominio = (await headers()).get("host") ?? "turno-eta-seven.vercel.app";

  return <FormularioOnboarding nombreDueno={nombre} dominio={dominio} />;
}
