import { Logo } from "@/components/ui/logo";

const TOTAL_PASOS = 2;

/** Logo + "Paso N de 2" con la barra de progreso. */
export function EncabezadoOnboarding({ paso }: { paso: 1 | 2 }) {
  return (
    <header className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-8 lg:pt-10">
      <div className="flex items-center justify-between gap-6">
        <Logo className="h-8 w-auto lg:h-10" />
        <div className="hidden items-center gap-4 lg:flex">
          <span className="text-white/80">
            Paso {paso} de {TOTAL_PASOS}
          </span>
          <BarraProgreso paso={paso} />
        </div>
        <span className="text-white/80 lg:hidden">
          Paso {paso} de {TOTAL_PASOS}
        </span>
      </div>
      <div className="mt-4 lg:hidden">
        <BarraProgreso paso={paso} />
      </div>
    </header>
  );
}

function BarraProgreso({ paso }: { paso: number }) {
  return (
    <div
      role="progressbar"
      aria-label="Progreso de la configuración"
      aria-valuemin={1}
      aria-valuemax={TOTAL_PASOS}
      aria-valuenow={paso}
      className="flex w-full gap-2 lg:w-56"
    >
      {Array.from({ length: TOTAL_PASOS }, (_, i) => (
        <span key={i} className={`h-1.5 flex-1 rounded-full ${i < paso ? "bg-esmeralda" : "bg-white/15"}`} />
      ))}
    </div>
  );
}
