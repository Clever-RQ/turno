import type { Metadata } from "next";

export const metadata: Metadata = { title: "Panel · Turno" };

// Página temporal para comprobar el login (#3).
// El siguiente paso es el onboarding del negocio (#4) y la agenda real llega en el Sprint 3.
export default function PaginaPanel() {
  return (
    <div className="space-y-6">
      <h1 className="font-titulo text-4xl font-bold tracking-tight text-white sm:text-5xl">
        Bienvenido a Turno
      </h1>
      <section className="max-w-2xl rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <p className="text-lg text-white/80">
          Tu sesión está activa. Pronto podrás crear tu negocio, tus servicios y tus horarios desde
          aquí.
        </p>
      </section>
    </div>
  );
}
