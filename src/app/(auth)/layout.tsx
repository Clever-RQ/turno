import { EscenaAgenda } from "@/components/brand/escena-agenda";
import { Logo } from "@/components/ui/logo";

/**
 * Layout de login, registro y recuperación.
 * Computadora: titular + el asistente con la agenda llenándose sola, y el formulario.
 * Celular: solo el logo arriba y el formulario.
 * Pensado para entrar completo en una pantalla de laptop sin hacer scroll.
 */
export default function LayoutAuth({ children }: LayoutProps<"/">) {
  return (
    <div className="relative isolate flex min-h-dvh flex-1 overflow-hidden bg-fondo">
      {/* Fondo: dos brillos verdes, nada más */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-48 -top-48 size-[38rem] rounded-full bg-esmeralda/20 blur-[150px]" />
        <div className="absolute -bottom-56 -right-32 size-[32rem] rounded-full bg-esmeralda/10 blur-[150px]" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-16 lg:py-10">
        <aside className="hidden lg:block">
          <Logo className="h-9 w-auto" />
          <p className="anim-titular mt-8 max-w-md font-titulo text-4xl font-bold leading-[1.1] tracking-tight text-white xl:text-[2.75rem]">
            Mientras atiendes, tu agenda se llena sola.
          </p>
          <div className="mt-10">
            <EscenaAgenda />
          </div>
        </aside>

        <main className="mx-auto w-full max-w-[26rem]">
          <div className="mb-6 lg:hidden">
            <Logo className="h-8 w-auto" />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
