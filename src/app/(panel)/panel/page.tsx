import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { AvatarAsistente } from "@/components/brand/avatar-asistente";
import { BannerBienvenida } from "@/components/panel/banner-bienvenida";
import { BotonCopiar } from "@/components/ui/boton-copiar";
import { IconoCheck, IconoEnlace, IconoFlecha } from "@/components/ui/iconos";
import { diaDeSemana, enZona, fechaLarga, saludo } from "@/domain/fechas";
import { aMinutos, filasASemana } from "@/domain/horarios";
import { primerNombre } from "@/domain/texto";
import { obtenerHorarios, obtenerNegocio } from "@/server/data/negocio";
import { crearClienteServidor } from "@/server/supabase/server";

export const metadata: Metadata = { title: "Agenda · Turno" };

/**
 * Portada del panel. El planificador de citas llega en el Sprint 3;
 * por ahora muestra el día de hoy (con el horario real del negocio)
 * y lo que falta configurar para empezar a recibir reservas.
 */
export default function PaginaAgenda({ searchParams }: PageProps<"/panel">) {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Suspense fallback={null}>
        <Bienvenida searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<Esqueleto />}>
        <Contenido />
      </Suspense>
    </div>
  );
}

async function Contenido() {
  await connection();
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  const negocio = await obtenerNegocio(supabase);
  if (!negocio) redirect("/onboarding");

  const [servicios, personal, horarios] = await Promise.all([
    supabase.from("servicios").select("id", { count: "exact", head: true }).eq("activo", true),
    supabase.from("personal").select("id", { count: "exact", head: true }).eq("activo", true),
    obtenerHorarios(supabase),
  ]);

  const ahora = new Date();
  const zona = negocio.zona_horaria;
  const local = enZona(ahora, zona);
  const tramosHoy = filasASemana(horarios.filter((h) => h.personal_id === null))[diaDeSemana(local.fecha)];

  const metadatos = (data.claims.user_metadata ?? {}) as { nombre?: string; full_name?: string };
  const nombre = primerNombre(metadatos.nombre ?? metadatos.full_name ?? "");
  const dominio = (await headers()).get("host") ?? "turno-eta-seven.vercel.app";

  const pasos = [
    {
      hecho: Boolean(servicios.count),
      titulo: "Servicios",
      detalle: servicios.count ? `${servicios.count} ${servicios.count === 1 ? "servicio activo" : "servicios activos"}` : "Agrega lo que ofreces",
      href: "/panel/servicios",
    },
    {
      hecho: Boolean(personal.count),
      titulo: "Equipo",
      detalle: personal.count ? `${personal.count} ${personal.count === 1 ? "persona recibe" : "personas reciben"} citas` : "Elige quién atiende",
      href: "/panel/equipo",
    },
    {
      hecho: horarios.some((h) => h.personal_id === null),
      titulo: "Horario",
      detalle: horarios.some((h) => h.personal_id === null) ? "Horario semanal configurado" : "Define cuándo atiendes",
      href: "/panel/horarios",
    },
  ];
  const listos = pasos.filter((p) => p.hecho).length;
  const completo = listos === pasos.length;

  return (
    <>
      <header className="anim-titular flex flex-wrap items-end justify-between gap-4 pt-1">
        <div>
          <p className="text-[0.95rem] text-white/55">{fechaLarga(ahora, zona)}</p>
          <h1 className="mt-1 font-titulo text-[2rem] font-bold leading-tight tracking-tight text-white sm:text-[2.5rem]">
            {saludo(ahora, zona)}
            {nombre ? `, ${nombre}` : ""}
          </h1>
          <p className="mt-1.5 text-white/65">
            {completo ? "Tu negocio está listo para recibir reservas." : "Deja todo listo para empezar a recibir reservas."}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
        {/* Tu día */}
        <section aria-labelledby="titulo-dia" className="vidrio anim-entrar order-2 rounded-3xl p-5 sm:p-6 lg:order-1" style={{ animationDelay: "120ms" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="titulo-dia" className="font-titulo text-xl font-bold text-white">
              Tu día
            </h2>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-white/70">
              {tramosHoy.length ? tramosHoy.map((t) => `${t.abre}–${t.cierra}`).join(" · ") : "Hoy no atiendes"}
            </span>
          </div>
          <LineaDelDia tramos={tramosHoy} ahora={local.hora} />
        </section>

        <div className="order-1 space-y-5 lg:order-2">
          {/* Prepara tu negocio */}
          <section aria-labelledby="titulo-pasos" className="vidrio anim-entrar rounded-3xl p-5 sm:p-6" style={{ animationDelay: "60ms" }}>
            <div className="flex items-center gap-4">
              <Progreso listos={listos} total={pasos.length} />
              <div>
                <h2 id="titulo-pasos" className="font-titulo text-lg font-bold leading-tight text-white">
                  {completo ? "Todo listo" : "Prepara tu negocio"}
                </h2>
                <p className="text-sm text-white/60">
                  {listos} de {pasos.length} pasos completos
                </p>
              </div>
            </div>
            <ul className="mt-5 space-y-2">
              {pasos.map((p) => (
                <li key={p.titulo}>
                  <Link
                    href={p.href}
                    className="group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 transition hover:border-white/10 hover:bg-white/[0.05] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-esmeralda"
                  >
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-full ${
                        p.hecho ? "bg-esmeralda text-tinta" : "border border-dashed border-white/30 text-transparent"
                      }`}
                    >
                      <IconoCheck className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block font-semibold text-white">{p.titulo}</span>
                      <span className={`block text-sm ${p.hecho ? "text-white/55" : "text-amber-200/85"}`}>{p.detalle}</span>
                    </span>
                    <IconoFlecha className="size-4 text-white/35 transition duration-200 group-hover:translate-x-1 group-hover:text-enlace" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* Tu link */}
          <section aria-labelledby="titulo-link" className="vidrio anim-entrar rounded-3xl p-5 sm:p-6" style={{ animationDelay: "180ms" }}>
            <h2 id="titulo-link" className="font-titulo text-lg font-bold text-white">
              Tu link para reservar
            </h2>
            <p className="mt-1 text-sm text-white/60">Compártelo por WhatsApp, Instagram o imprímelo en tu local.</p>
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-2 pl-3.5">
              <IconoEnlace className="size-4 shrink-0 text-enlace" />
              <span className="min-w-0 flex-1 truncate text-sm text-white/60">
                {dominio}/<span className="font-semibold text-white">{negocio.slug}</span>
              </span>
              <BotonCopiar texto={`https://${dominio}/${negocio.slug}`} />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

/**
 * Línea de tiempo de hoy: horas del día, el horario de atención sombreado
 * y una marca de "ahora". Las citas se dibujarán aquí en el Sprint 3.
 */
function LineaDelDia({ tramos, ahora }: { tramos: { abre: string; cierra: string }[]; ahora: string }) {
  const inicioHora = Math.min(8, ...tramos.map((t) => Math.floor(aMinutos(t.abre) / 60)));
  const finHora = Math.max(20, ...tramos.map((t) => Math.ceil(aMinutos(t.cierra) / 60)));
  const inicio = inicioHora * 60;
  const total = finHora * 60 - inicio;
  const pos = (minutos: number) => `${((minutos - inicio) / total) * 100}%`;
  const horas = Array.from({ length: finHora - inicioHora + 1 }, (_, i) => inicioHora + i);
  const minutosAhora = aMinutos(ahora);
  const mostrarAhora = minutosAhora >= inicio && minutosAhora <= inicio + total;

  return (
    <div className="relative mt-5 h-[26rem] sm:h-[30rem]">
      {/* Horas */}
      {horas.map((h) => (
        <div key={h} className="absolute inset-x-0 flex items-center gap-3" style={{ top: pos(h * 60) }}>
          <span className="w-12 -translate-y-1/2 text-right text-xs tabular-nums text-white/40">
            {h % 12 === 0 ? 12 : h % 12} {h < 12 ? "a. m." : "p. m."}
          </span>
          <span className="h-px flex-1 -translate-y-1/2 bg-white/[0.06]" />
        </div>
      ))}

      {/* Horario de atención */}
      {tramos.map((t) => (
        <div
          key={t.abre}
          className="absolute left-[3.75rem] right-0 rounded-xl border border-esmeralda/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.12),rgba(16,185,129,0.04))]"
          style={{ top: pos(aMinutos(t.abre)), height: `calc(${pos(aMinutos(t.cierra))} - ${pos(aMinutos(t.abre))})` }}
        >
          <span className="absolute right-3 top-2 text-xs font-medium text-enlace/80">Abierto</span>
        </div>
      ))}

      {/* Ahora */}
      {mostrarAhora && (
        <div className="absolute left-[3.25rem] right-0 z-10 flex items-center" style={{ top: pos(minutosAhora) }}>
          <span className="size-2.5 -translate-y-1/2 rounded-full bg-enlace shadow-[0_0_12px_#10b981]" />
          <span className="h-[2px] flex-1 -translate-y-1/2 bg-gradient-to-r from-enlace to-esmeralda/0" />
          <span className="absolute left-4 -translate-y-[130%] rounded-full bg-tinta/80 px-2 py-0.5 text-[11px] font-semibold text-enlace">
            Ahora {ahora}
          </span>
        </div>
      )}

      {/* Sin citas todavía */}
      <div className="absolute inset-0 left-[3.75rem] grid place-items-center">
        <div className="vidrio-suave flex max-w-xs flex-col items-center rounded-3xl px-6 py-6 text-center backdrop-blur-md">
          <AvatarAsistente estado="atento" className="size-14" />
          <p className="mt-3 font-titulo text-lg font-bold text-white">Todavía no hay citas</p>
          <p className="mt-1 text-sm text-white/60">Cuando tus clientes reserven, sus citas aparecerán aquí, en su hora.</p>
        </div>
      </div>
    </div>
  );
}

/** Anillo de progreso: cuántos pasos de configuración están listos. */
function Progreso({ listos, total }: { listos: number; total: number }) {
  const radio = 22;
  const circunferencia = 2 * Math.PI * radio;
  return (
    <div className="relative grid size-14 shrink-0 place-items-center">
      <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="28" cy="28" r={radio} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
        <circle
          cx="28"
          cy="28"
          r={radio}
          fill="none"
          stroke="#10B981"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={circunferencia * (1 - listos / total)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="font-titulo text-sm font-bold text-white">
        {listos}/{total}
      </span>
    </div>
  );
}

function Esqueleto() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="h-24 w-80 animate-pulse rounded-2xl bg-white/[0.04]" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="h-[34rem] animate-pulse rounded-3xl bg-white/[0.04]" />
        <div className="h-[30rem] animate-pulse rounded-3xl bg-white/[0.04]" />
      </div>
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

