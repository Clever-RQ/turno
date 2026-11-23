"use client";

import { useActionState } from "react";
import { useVibrarConError } from "@/components/ui/vibrar";
import { AvisoError } from "@/components/ui/avisos";
import { BotonEnviar } from "@/components/auth/botones";
import { CampoContrasena } from "@/components/ui/campo-contrasena";
import { guardarNuevaContrasena, type EstadoFormulario } from "@/server/actions/auth";

export function FormularioNuevaContrasena() {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(guardarNuevaContrasena, {});
  const refFormulario = useVibrarConError(estado);

  return (
    <form ref={refFormulario} action={accion} noValidate className="space-y-6">
      {estado.mensaje && <AvisoError>{estado.mensaje}</AvisoError>}

      <CampoContrasena
        etiqueta="Nueva contraseña"
        name="password"
        autoComplete="new-password"
        ayuda="Usa al menos 8 caracteres, con una letra y un número."
        errores={estado.errores?.password}
        required
      />

      <CampoContrasena
        etiqueta="Repite la contraseña"
        name="confirmacion"
        autoComplete="new-password"
        errores={estado.errores?.confirmacion}
        required
      />

      <BotonEnviar texto="Guardar contraseña" enviando="Guardando…" />
    </form>
  );
}
