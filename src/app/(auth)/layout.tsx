import { EscenaAgenda } from "@/components/brand/escena-agenda";
import { FondoRelojes } from "@/components/brand/fondo-relojes";
import { LuzCursor } from "@/components/brand/luz-cursor";
import { Logo } from "@/components/ui/logo";

/**
 * Layout de login, registro y recuperación.
 * Computadora: titular + el asistente con la agenda llenándose sola, y el formulario.
 * Celular y tablet: la misma escena, más compacta, arriba del formulario.
 * Pensado para entrar completo en una pantalla de laptop sin hacer scroll.
 */
export default function LayoutAuth({ children }: LayoutProps<"/">) {
  return (
    <div className="relative isolate flex min-h-dvh flex-1 overflow-hidden bg-fondo">
      {/* Fondo: dos brillos verdes y el motivo de la marca, muy tenue */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-48 -top-48 size-[38rem] rounded-full bg-esmeralda/20 blur-[150px]" />
        <div className="absolute -bottom-56 -right-32 size-[32rem] rounded-full bg-esmeralda/10 blur-[150px]" />
        <FondoRelojes />
        <LuzCursor>
          <FondoRelojes intensidad="encendido" />
        </LuzCursor>
      </div>

      <div className="mx-auto grid w-full max-w-6xl items-center gap-7 px-4 py-6 sm:gap-8 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-16 lg:py-10">
        <aside className="mx-auto w-full max-w-[26rem] sm:max-w-xl lg:mx-0 lg:max-w-none">
          <Logo className="h-8 w-auto lg:h-9" />
          <p className="anim-titular mt-4 max-w-md font-titulo text-[1.625rem] font-bold leading-[1.1] tracking-tight text-white sm:mt-6 sm:text-[2rem] lg:mt-8 lg:text-4xl xl:text-[2.75rem]">
            Mientras atiendes, tu agenda se llena sola.
          </p>
          <div className="mt-5 sm:mt-6 lg:mt-10">
            <EscenaAgenda />
          </div>
        </aside>

        <main className="mx-auto w-full max-w-[26rem] sm:max-w-xl lg:max-w-[26rem]">
          {children}
        </main>
      </div>
    </div>
  );
}
