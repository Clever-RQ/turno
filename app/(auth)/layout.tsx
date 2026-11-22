import { Logo } from "@/components/logo";

/**
 * Layout de login, registro y recuperación.
 * Computadora: mensaje + agenda de ejemplo a la izquierda, formulario a la derecha.
 * Celular: solo el logo arriba y el formulario.
 */
export default function LayoutAuth({ children }: LayoutProps<"/">) {
  return (
    <div className="relative isolate flex min-h-dvh flex-1 overflow-hidden bg-fondo">
      {/* Fondo: brillos verdes y el aro del logo */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 -top-40 size-[40rem] rounded-full bg-esmeralda/25 blur-[140px]" />
        <div className="absolute -bottom-48 -right-24 size-[34rem] rounded-full bg-esmeralda/15 blur-[140px]" />
        <div className="absolute right-[-14rem] top-1/2 hidden size-[56rem] -translate-y-1/2 rounded-full border-[9rem] border-white/[0.04] lg:block" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-8 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:py-12">
        <aside className="hidden space-y-10 lg:block">
          <Logo className="h-12 w-auto" />
          <p className="font-titulo text-5xl font-bold leading-[1.1] tracking-tight text-white xl:text-6xl">
            Mientras atiendes, tu agenda se llena sola.
          </p>
          <AgendaEjemplo />
          <p className="text-lg text-white/70">Tu agenda, siempre atendida.</p>
        </aside>

        <main className="mx-auto w-full max-w-xl">
          <div className="mb-8 lg:hidden">
            <Logo className="h-9 w-auto" />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

// Decorativa: muestra cómo se ve una agenda con una cita del asistente.
function AgendaEjemplo() {
  return (
    <div aria-hidden="true" className="max-w-xl space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-enlace">Hoy, sábado 28</p>
      <div className="flex items-center gap-8 rounded-xl bg-white/[0.05] px-5 py-4 text-lg">
        <span className="font-semibold">3:00 p. m.</span>
        <span className="flex-1">Corte clásico</span>
        <span className="text-sm text-white/70">Web</span>
      </div>
      <div className="flex items-center gap-8 rounded-xl border border-esmeralda/60 bg-esmeralda/10 px-5 py-4 text-lg">
        <span className="font-semibold">4:30 p. m.</span>
        <span className="flex-1">Corte + barba</span>
        <span className="flex items-center gap-2 text-sm">
          <span className="grid size-5 place-items-center rounded-full border-2 border-white bg-tinta">
            <span className="size-2.5 rounded-full bg-esmeralda" />
          </span>
          Asistente
        </span>
      </div>
      <div className="flex items-center gap-8 rounded-xl border border-dashed border-white/20 px-5 py-4 text-lg text-white/70">
        <span className="font-semibold">6:00 p. m.</span>
        <span className="flex-1">Libre</span>
      </div>
    </div>
  );
}
