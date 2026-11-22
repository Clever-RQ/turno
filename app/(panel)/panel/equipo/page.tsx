import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { obtenerPersonal } from "@/lib/negocio";
import { crearClienteServidor } from "@/lib/supabase/server";
import { GestorEquipo } from "./gestor-equipo";

export const metadata: Metadata = { title: "Equipo · Turno" };

export default function PaginaEquipo() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-white/[0.03]" />}>
      <Contenido />
    </Suspense>
  );
}

async function Contenido() {
  await connection();
  const supabase = await crearClienteServidor();
  const personal = await obtenerPersonal(supabase);
  return <GestorEquipo personal={personal} />;
}
