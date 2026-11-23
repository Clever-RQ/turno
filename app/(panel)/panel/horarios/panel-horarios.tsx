"use client";

import { useState, useTransition, type ReactNode } from "react";
import { AvisoError } from "@/components/auth/avisos";
import { AvatarAtento } from "@/components/panel/avatar-atento";
import { useConfirmar } from "@/components/panel/confirmar";
import { Interruptor } from "@/components/servicios/formulario-servicio";
import { aplicarHorarioTipico, usarHorarioDelNegocio } from "@/lib/acciones/horarios";
import { DIAS, filasASemana, resumenDia, semanaVacia, type FilaHorario } from "@/lib/horarios";
import type { Bloqueo, Persona } from "@/lib/negocio";
import { iniciales } from "@/lib/texto";
import { DiasLibres } from "./dias-libres";
import { EditorSemana } from "./editor-semana";

type Props = { personal: Persona[]; horarios: FilaHorario[]; bloqueos: Bloqueo[]; zona: string };

export function PanelHorarios({ personal, horarios, bloqueos, zona }: Props) {
  // "negocio" o el id de una persona.
  const [seleccion, setSeleccion] = useState<string>("negocio");
  const [pestana, setPestana] = useState<"semanal" | "libres">("semanal");

  const persona = personal.find((p) => p.id === seleccion);
  const filasNegocio = horarios.filter((h) => h.personal_id === null);
  const semanaNegocio = filasASemana(filasNegocio);

  return (
    <div className="space-y-6 pb-28">
      <div>
        <h1 className="font-titulo text-4xl font-bold tracking-tight text-white sm:text-5xl">Horarios</h1>
        <p className="mt-2 text-white/70">Cuándo pueden reservar tus clientes.</p>
      </div>

      {/* Horario de: Todo el negocio / Carlos / Ana */}
      <div className="space-y-2">
        <p id="horario-de" className="text-sm text-white/70">
          Horario de:
        </p>
        <div role="radiogroup" aria-labelledby="horario-de" className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
          <Chip activo={seleccion === "negocio"} alElegir={() => setSeleccion("negocio")}>
            <IconoCasa /> Todo el negocio
          </Chip>
          {personal.map((p) => (
            <Chip key={p.id} activo={seleccion === p.id} alElegir={() => setSeleccion(p.id)} apagado={!p.activo}>
              <span className="grid size-7 place-items-center rounded-full bg-menta text-xs font-bold text-tinta">
                {iniciales(p.nombre)}
              </span>
              {p.nombre}
            </Chip>
          ))}
        </div>
      </div>

      {/* Pestañas */}
      <div role="tablist" aria-label="Secciones de horarios" className="grid w-full grid-cols-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 sm:inline-grid sm:w-auto">
        {(
          [
            ["semanal", "Horario semanal"],
            ["libres", "Días libres"],
          ] as const
        ).map(([clave, texto]) => (
          <button
            key={clave}
            type="button"
            role="tab"
            aria-selected={pestana === clave}
            onClick={() => setPestana(clave)}
            className={`rounded-xl px-5 py-2.5 font-medium transition focus-visible:outline-2 focus-visible:outline-esmeralda ${
              pestana === clave ? "bg-white/10 text-white" : "text-white/65 hover:text-white"
            }`}
          >
            {texto}
          </button>
        ))}
      </div>

      {pestana === "libres" ? (
        <DiasLibres bloqueos={bloqueos} personal={personal} zona={zona} seleccion={seleccion} />
      ) : persona ? (
        <HorarioPersona
          key={persona.id}
          persona={persona}
          filas={horarios.filter((h) => h.personal_id === persona.id)}
          semanaNegocio={semanaNegocio}
        />
      ) : filasNegocio.length === 0 ? (
        <SinHorario key="vacio" />
      ) : (
        <EditorSemana key={`negocio-${JSON.stringify(filasNegocio)}`} personalId={null} inicial={semanaNegocio} />
      )}
    </div>
  );
}

function Chip({
  activo,
  apagado,
  alElegir,
  children,
}: {
  activo: boolean;
  apagado?: boolean;
  alElegir: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={activo}
      onClick={alElegir}
      className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 transition focus-visible:outline-2 focus-visible:outline-esmeralda ${
        activo ? "border-esmeralda/60 bg-esmeralda/15 font-semibold text-white" : "border-white/15 text-white/80 hover:bg-white/[0.06]"
      } ${apagado ? "opacity-60" : ""}`}
    >
      {children}
    </button>
  );
}

/** Estado vacío del negocio: "Usar horario típico" o configurar a mano. */
function SinHorario() {
  const [aMano, setAMano] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aplicando, iniciar] = useTransition();

  if (aMano) return <EditorSemana personalId={null} inicial={semanaVacia()} />;

  return (
    <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-14 text-center">
      <AvatarAtento />
      <h2 className="mt-6 font-titulo text-2xl font-bold text-white sm:text-3xl">Aún no tienes horario</h2>
      <p className="mt-3 max-w-md text-white/70">
        Sin horario, tus clientes no pueden reservar. Empieza con el típico y ajústalo en segundos.
      </p>
      {error && <div className="mt-4"><AvisoError>{error}</AvisoError></div>}
      <button
        type="button"
        disabled={aplicando}
        onClick={() => iniciar(async () => setError(await aplicarHorarioTipico()))}
        className="mt-6 rounded-xl bg-esmeralda px-8 py-3.5 font-medium text-tinta shadow-[0_10px_40px_-8px_rgba(16,185,129,0.6)] transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-enlace disabled:opacity-60"
      >
        {aplicando ? "Aplicando…" : "Usar horario típico (Lun–Sáb 9:00–19:00)"}
      </button>
      <button type="button" onClick={() => setAMano(true)} className="mt-4 font-medium text-enlace underline underline-offset-4 hover:text-menta">
        Configurar a mano
      </button>
    </div>
  );
}

/** Persona: "Usa el horario del negocio" (solo lectura) o su propio horario. */
function HorarioPersona({
  persona,
  filas,
  semanaNegocio,
}: {
  persona: Persona;
  filas: FilaHorario[];
  semanaNegocio: ReturnType<typeof filasASemana>;
}) {
  // Apagar el interruptor muestra el editor con una copia del horario del negocio (sin guardar aún).
  const [propio, setPropio] = useState(persona.horario_propio);
  const [error, setError] = useState<string | null>(null);
  const [, iniciar] = useTransition();
  const [confirmar, dialogoConfirmar] = useConfirmar();
  const nombre = persona.nombre.split(" ")[0];

  async function cambiar(usaNegocio: boolean) {
    if (!usaNegocio) return setPropio(true);
    if (!persona.horario_propio) return setPropio(false); // aún no había guardado nada propio
    const si = await confirmar({
      titulo: "¿Volver al horario del negocio?",
      texto: `Se borrará el horario propio de ${nombre}.`,
      confirmar: "Usar horario del negocio",
      peligro: true,
    });
    if (!si) return;
    iniciar(async () => {
      const mensaje = await usarHorarioDelNegocio(persona.id);
      setError(mensaje);
      if (!mensaje) setPropio(false);
    });
  }

  return (
    <div className="space-y-6">
      {dialogoConfirmar}
      <div className="flex flex-col gap-4 rounded-3xl border border-esmeralda/40 bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-menta font-titulo text-lg font-bold text-tinta">
            {iniciales(persona.nombre)}
          </span>
          <div>
            <p className="font-titulo text-xl font-bold text-white">Horario de {nombre}</p>
            <p className="text-white/70">
              {propio ? `${nombre} tiene su propio horario.` : `${nombre} atiende en el horario del negocio.`}
            </p>
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-3">
          <Interruptor
            checked={!propio}
            onChange={cambiar}
            etiqueta="Usa el horario del negocio"
            textoActivo="Usa el horario del negocio"
            textoInactivo="Horario propio"
          />
        </label>
      </div>

      {error && <AvisoError>{error}</AvisoError>}

      {propio ? (
        <EditorSemana
          key={`persona-${persona.id}-${JSON.stringify(filas)}`}
          personalId={persona.id}
          inicial={persona.horario_propio ? filasASemana(filas) : semanaNegocio}
          sinGuardarAlInicio={!persona.horario_propio}
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          <p className="border-b border-white/10 px-6 py-4 text-sm text-white/70">
            Horario del negocio · solo lectura. Apaga el interruptor para darle a {nombre} un horario propio.
          </p>
          <ul>
            {DIAS.map(({ dia, nombre: nombreDia }) => (
              <li key={dia} className="flex items-center justify-between gap-4 border-b border-white/5 px-6 py-4 last:border-0">
                <span className="font-semibold text-white/60">{nombreDia}</span>
                <span className="text-right text-white/60">{resumenDia(semanaNegocio[dia])}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function IconoCasa() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 10.5 12 4l8 6.5V20h-5v-6H9v6H4Z" />
    </svg>
  );
}
