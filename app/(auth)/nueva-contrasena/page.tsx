import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AvisoError, TarjetaAuth, claseEnlace } from "@/components/auth/avisos";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FormularioNuevaContrasena } from "./formulario";

export const metadata: Metadata = { title: "Nueva contraseña · Turno" };

export default function PaginaNuevaContrasena() {
  return (
    <Suspense fallback={<TarjetaAuth titulo="Crea una nueva contraseña" subtitulo="Cargando…">{null}</TarjetaAuth>}>
      <Contenido />
    </Suspense>
  );
}

/**
 * Se llega aquí desde el enlace del correo de recuperación:
 * /auth/confirm ya verificó el token y creó una sesión temporal.
 * Sin esa sesión, el enlace venció o se abrió directo.
 */
async function Contenido() {
  // Igual que en el panel: la sesión se valida solo en la visita real.
  await connection();
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email;

  if (!email) {
    return (
      <TarjetaAuth titulo="El enlace venció">
        <AvisoError>Este enlace ya no es válido. Los enlaces duran poco y solo se pueden usar una vez.</AvisoError>
        <p className="text-white/80">
          <Link href="/recuperar" className={claseEnlace}>
            Pide un enlace nuevo
          </Link>
        </p>
      </TarjetaAuth>
    );
  }

  return (
    <TarjetaAuth
      titulo="Crea una nueva contraseña"
      subtitulo={
        <>
          Es para la cuenta <span className="text-white">{email}</span>. Al guardarla entrarás directo
          a tu panel.
        </>
      }
    >
      <FormularioNuevaContrasena />
      <p className="text-white/80">
        ¿El enlace venció?{" "}
        <Link href="/recuperar" className={claseEnlace}>
          Pide uno nuevo
        </Link>
      </p>
    </TarjetaAuth>
  );
}
