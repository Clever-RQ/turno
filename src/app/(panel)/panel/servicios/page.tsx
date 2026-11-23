import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { obtenerServicios } from "@/server/data/negocio";
import { crearClienteServidor } from "@/server/supabase/server";
import { GestorServicios } from "@/components/services/gestor-servicios";

export const metadata: Metadata = { title: "Servicios · Turno" };

export default function PaginaServicios() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-white/[0.03]" />}>
      <Contenido />
    </Suspense>
  );
}

async function Contenido() {
  await connection();
  const supabase = await crearClienteServidor();
  const servicios = await obtenerServicios(supabase);
  return <GestorServicios servicios={servicios} />;
}
