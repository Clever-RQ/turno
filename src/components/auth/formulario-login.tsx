"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AvisoError, claseEnlace } from "@/components/ui/avisos";
import { BotonEnviar } from "@/components/auth/botones";
import { Campo } from "@/components/ui/campo";
import { CampoContrasena } from "@/components/ui/campo-contrasena";
import { iniciarSesion, type EstadoFormulario } from "@/server/actions/auth";

export function FormularioLogin() {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(iniciarSesion, {});

  return (
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

      <CampoContrasena
        etiqueta="Contraseña"
        name="password"
        autoComplete="current-password"
        errores={estado.errores?.password}
        extra={
          <Link href="/recuperar" className={`${claseEnlace} text-sm sm:text-base`}>
            ¿Olvidaste tu contraseña?
          </Link>
        }
        required
      />

      <BotonEnviar texto="Iniciar sesión" enviando="Entrando…" />
    </form>
  );
}
