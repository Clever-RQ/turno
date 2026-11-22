import { Logo } from "@/components/logo";

export default function LayoutOnboarding({ children }: LayoutProps<"/">) {
  return (
    <div className="relative isolate flex min-h-dvh flex-1 flex-col overflow-hidden bg-fondo">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 -top-40 size-[40rem] rounded-full bg-esmeralda/25 blur-[140px]" />
        <div className="absolute -bottom-48 -right-24 size-[34rem] rounded-full bg-esmeralda/15 blur-[140px]" />
      </div>

      <header className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-8 lg:pt-10">
        <div className="flex items-center justify-between gap-6">
          <Logo className="h-8 w-auto lg:h-10" />
          <div className="hidden items-center gap-4 lg:flex">
            <span className="text-white/80">Paso 1 de 2</span>
            <BarraProgreso />
          </div>
          <span className="text-white/80 lg:hidden">Paso 1 de 2</span>
        </div>
        <div className="mt-4 lg:hidden">
          <BarraProgreso />
        </div>
      </header>

      {children}
    </div>
  );
}

function BarraProgreso() {
  return (
    <div
      role="progressbar"
      aria-label="Progreso de la configuración"
      aria-valuemin={1}
      aria-valuemax={2}
      aria-valuenow={1}
      className="flex w-full gap-2 lg:w-56"
    >
      <span className="h-1.5 flex-1 rounded-full bg-esmeralda" />
      <span className="h-1.5 flex-1 rounded-full bg-white/15" />
    </div>
  );
}
