"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AvisoCorreo, AvisoError, TarjetaAuth } from "@/components/auth/avisos";
import { BotonEnviar } from "@/components/auth/botones";
import { Campo } from "@/components/auth/campo";
import { enviarEnlaceRecuperacion, type EstadoFormulario } from "../acciones";

export function FormularioRecuperar() {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(enviarEnlaceRecuperacion, {});

  return (
    <TarjetaAuth
      titulo="Recupera tu contraseña"
      subtitulo="Escribe el correo de tu cuenta. Te enviaremos un enlace para crear una nueva contraseña."
      arriba={
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-sm font-medium text-enlace hover:text-menta focus-visible:outline-2 focus-visible:outline-esmeralda"
        >
          <span aria-hidden="true">‹</span> Volver a iniciar sesión
        </Link>
      }
    >
      <form action={accion} noValidate className="space-y-6">
        {estado.mensaje && <AvisoError>{estado.mensaje}</AvisoError>}

        <Campo
          etiqueta="Correo"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@negocio.com"
          defaultValue={estado.email}
          errores={estado.errores?.email}
          required
        />

        <BotonEnviar texto="Enviar enlace" enviando="Enviando…" />
      </form>

      {estado.ok && (
        <AvisoCorreo titulo="Revisa tu correo">
          Si hay una cuenta con ese correo, te llegará el enlace en unos minutos. Si no lo ves,
          revisa la carpeta de spam.
        </AvisoCorreo>
      )}
    </TarjetaAuth>
  );
}
