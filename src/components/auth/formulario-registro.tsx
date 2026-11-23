"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useVibrarConError } from "@/components/ui/vibrar";
import { AvisoCorreo, AvisoError, Separador, TarjetaAuth, claseEnlace } from "@/components/ui/avisos";
import { BotonEnviar, BotonGoogle } from "@/components/auth/botones";
import { Campo } from "@/components/ui/campo";
import { CampoContrasena } from "@/components/ui/campo-contrasena";
import { iniciarConGoogle, registrarse, type EstadoFormulario } from "@/server/actions/auth";

export function FormularioRegistro() {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(registrarse, {});
  const refFormulario = useVibrarConError(estado);

  // Pantalla "Revisa tu correo" después de registrarse
  if (estado.ok) {
    return (
      <TarjetaAuth titulo="Confirma tu correo" subtitulo="Ya casi está lista tu cuenta.">
        <AvisoCorreo titulo="Revisa tu correo">
          Te enviamos un enlace a <strong className="text-white">{estado.email}</strong>. Ábrelo para
          confirmar tu cuenta y entrar a tu panel. Si no lo ves, revisa la carpeta de spam.
        </AvisoCorreo>
        <p className="text-center text-white/80">
          ¿Ya la confirmaste?{" "}
          <Link href="/login" className={claseEnlace}>
            Inicia sesión
          </Link>
        </p>
      </TarjetaAuth>
    );
  }

  return (
    <TarjetaAuth
      titulo="Crea tu cuenta"
      subtitulo="Después te pedimos el nombre de tu negocio y tus horarios."
    >
      <form action={iniciarConGoogle}>
        <BotonGoogle texto="Registrarte con Google" />
      </form>

      <Separador texto="o con tu correo" />

      <form ref={refFormulario} action={accion} noValidate className="space-y-6">
        {estado.mensaje && <AvisoError>{estado.mensaje}</AvisoError>}

        <Campo
          etiqueta="Tu nombre"
          name="nombre"
          autoComplete="name"
          placeholder="Luis Ramírez"
          errores={estado.errores?.nombre}
          required
        />

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
          autoComplete="new-password"
          ayuda="Usa al menos 8 caracteres, con una letra y un número."
          errores={estado.errores?.password}
          required
        />

        <div className="space-y-2">
          <label className="flex items-start gap-3 text-white">
            <input
              type="checkbox"
              name="terminos"
              aria-invalid={Boolean(estado.errores?.terminos)}
              className="mt-1 size-5 shrink-0 accent-esmeralda"
            />
            <span>
              Acepto los{" "}
              <Link href="/terminos" target="_blank" className={claseEnlace}>
                términos de uso
              </Link>{" "}
              y la{" "}
              <Link href="/privacidad" target="_blank" className={claseEnlace}>
                política de privacidad
              </Link>
              .
            </span>
          </label>
          {estado.errores?.terminos && (
            <p className="text-sm text-red-300">{estado.errores.terminos[0]}</p>
          )}
        </div>

        <BotonEnviar texto="Crear cuenta" enviando="Creando tu cuenta…" />
      </form>

      <p className="text-center text-white/80">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className={claseEnlace}>
          Inicia sesión
        </Link>
      </p>
    </TarjetaAuth>
  );
}
