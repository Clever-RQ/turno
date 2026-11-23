import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { obtenerBloqueos, obtenerHorarios, obtenerNegocio, obtenerPersonal } from "@/server/data/negocio";
import { crearClienteServidor } from "@/server/supabase/server";
import { PanelHorarios } from "@/components/schedules/panel-horarios";

export const metadata: Metadata = { title: "Horarios · Turno" };

export default function PaginaHorarios() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-white/[0.03]" />}>
      <Contenido />
    </Suspense>
  );
}

async function Contenido() {
  await connection();
  const supabase = await crearClienteServidor();
  const negocio = await obtenerNegocio(supabase);
  if (!negocio) redirect("/onboarding");

  const [personal, horarios, bloqueos] = await Promise.all([
    obtenerPersonal(supabase),
    obtenerHorarios(supabase),
    obtenerBloqueos(supabase),
  ]);

  return (
    <PanelHorarios personal={personal} horarios={horarios} bloqueos={bloqueos} zona={negocio.zona_horaria} />
  );
}
