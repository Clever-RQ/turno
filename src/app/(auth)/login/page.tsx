import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AvisoError, Separador, TarjetaAuth, claseEnlace } from "@/components/ui/avisos";
import { BotonGoogle } from "@/components/auth/botones";
import { iniciarConGoogle } from "@/server/actions/auth";
import { FormularioLogin } from "@/components/auth/formulario-login";

export const metadata: Metadata = { title: "Iniciar sesión · Turno" };

export default function PaginaLogin({ searchParams }: PageProps<"/login">) {
  return (
    <TarjetaAuth titulo="Entra a tu panel" subtitulo="Revisa tus citas, servicios y métricas.">
      {/* Leer la URL es un dato de la petición: con cacheComponents va dentro de Suspense
          para que el resto de la página se sirva al instante. */}
      <Suspense fallback={null}>
        <ErrorDeUrl searchParams={searchParams} />
      </Suspense>

      <form action={iniciarConGoogle}>
        <BotonGoogle texto="Continuar con Google" />
      </form>

      <Separador texto="o con tu correo" />

      <FormularioLogin />

      <p className="text-center text-white/80">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/registro" className={claseEnlace}>
          Crea una
        </Link>
      </p>
    </TarjetaAuth>
  );
}

// Errores que llegan por la URL desde /auth/confirm y /auth/callback
const ERRORES_URL: Record<string, string> = {
  enlace: "El enlace venció o ya se usó. Inicia sesión o pide uno nuevo.",
  google: "No pudimos iniciar sesión con Google. Inténtalo otra vez.",
};

async function ErrorDeUrl({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { error } = await searchParams;
  const mensaje = typeof error === "string" ? ERRORES_URL[error] : undefined;
  return mensaje ? <AvisoError>{mensaje}</AvisoError> : null;
}
