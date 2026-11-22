"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { AvisoError } from "@/components/auth/avisos";
import { claseInput } from "@/components/auth/campo";
import { generarSlug } from "@/lib/slug";
import { formatearTelefono, normalizarTelefono } from "@/lib/telefono";
import { iniciales } from "@/lib/texto";
import { comprobarSlug, crearNegocio, type ComprobacionSlug, type EstadoOnboarding } from "../acciones";

type EstadoLink = ComprobacionSlug | { estado: "vacio" } | { estado: "comprobando" };

const ESPERA_MS = 400; // se comprueba el link cuando el dueño deja de escribir

export function FormularioOnboarding({ nombreDueno, dominio }: { nombreDueno: string; dominio: string }) {
  const [estado, accion, enviando] = useActionState<EstadoOnboarding, FormData>(crearNegocio, {});

  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  // Cuando el dueño toca el link a mano, deja de seguir al nombre (no le pisamos lo que escribió).
  const [slugEditado, setSlugEditado] = useState(false);
  const [telefono, setTelefono] = useState("");
  const [link, setLink] = useState<EstadoLink>({ estado: "vacio" });

  function cambiarSlug(nuevo: string) {
    setSlug(nuevo);
    setLink(nuevo ? { estado: "comprobando" } : { estado: "vacio" });
  }

  function cambiarNombre(nuevo: string) {
    setNombre(nuevo);
    if (!slugEditado) cambiarSlug(generarSlug(nuevo));
  }

  function editarSlug(nuevo: string) {
    setSlugEditado(true);
    cambiarSlug(nuevo.toLowerCase().replace(/\s+/g, "-"));
  }

  // Comprobación con espera: solo pregunta al servidor 400 ms después de la última tecla.
  useEffect(() => {
    if (!slug) return;
    let vigente = true; // si el slug cambia antes de que responda, se ignora la respuesta vieja
    const temporizador = setTimeout(async () => {
      const resultado = await comprobarSlug(slug);
      if (vigente) setLink(resultado);
    }, ESPERA_MS);
    return () => {
      vigente = false;
      clearTimeout(temporizador);
    };
  }, [slug]);

  // Si el servidor rechazó este mismo link al guardar, su error manda.
  const errorServidorSlug = estado.slugEnviado === slug ? estado.errores?.slug?.[0] : undefined;
  const sugerencias =
    errorServidorSlug ? estado.sugerencias ?? [] : link.estado === "ocupado" ? link.sugerencias : [];
  const telefonoValido = normalizarTelefono(telefono);
  const linkBloqueado = ["ocupado", "reservado", "invalido"].includes(link.estado) || Boolean(errorServidorSlug);

  return (
    <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-20">
      {/* Vista previa grande (solo computadora) */}
      <section aria-label="Vista previa" className="hidden space-y-6 lg:block lg:pt-24">
        <p className="text-lg text-enlace">Así te verán tus clientes</p>
        <div className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <CabeceraNegocio
            nombre={nombre}
            detalle={telefonoValido ? formatearTelefono(telefonoValido) : undefined}
            grande
          />
          <p className="font-medium text-white">Elige un servicio</p>
          <div aria-hidden="true" className="space-y-3">
            {[60, 70, 45].map((ancho) => (
              <div key={ancho} className="flex items-center justify-between rounded-xl border border-dashed border-white/15 px-6 py-5">
                <span className="h-3 rounded-full bg-white/10" style={{ width: `${ancho}%` }} />
                <span className="h-3 w-16 rounded-full bg-white/10" />
              </div>
            ))}
          </div>
          <p className="text-white/70">Tus servicios aparecerán aquí en el siguiente paso.</p>
        </div>
        <div className="rounded-3xl border border-esmeralda/40 bg-esmeralda/[0.08] px-7 py-5">
          <p className="text-enlace">Tu link para compartir</p>
          <LinkNegocio dominio={dominio} slug={slug} className="mt-1 text-xl" />
        </div>
      </section>

      {/* Formulario */}
      <form
        action={accion}
        noValidate
        className="space-y-7 pb-28 lg:rounded-3xl lg:border lg:border-white/10 lg:bg-white/[0.04] lg:p-10 lg:pb-10 lg:shadow-2xl lg:backdrop-blur-xl"
      >
        <div>
          {nombreDueno && <p className="text-lg text-enlace">Hola, {nombreDueno}</p>}
          <h1 className="mt-1 font-titulo text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Crea tu negocio
          </h1>
          <p className="mt-3 text-lg text-white/70">
            Así te verán tus clientes cuando reserven. Lo puedes cambiar después.
          </p>
        </div>

        {/* Vista previa compacta (celular) */}
        <div className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] p-6 lg:hidden">
          <p className="text-white/70">Así te verán tus clientes</p>
          <CabeceraNegocio nombre={nombre} detalle={<LinkNegocio dominio={dominio} slug={slug} />} />
        </div>

        {estado.mensaje && <AvisoError>{estado.mensaje}</AvisoError>}

        {/* Nombre */}
        <div className="space-y-2">
          <label htmlFor="nombre" className="font-medium text-white">
            Nombre del negocio
          </label>
          <input
            id="nombre"
            name="nombre"
            value={nombre}
            onChange={(e) => cambiarNombre(e.target.value)}
            placeholder="Barbería Don Lucho"
            autoComplete="organization"
            maxLength={80}
            aria-invalid={Boolean(estado.errores?.nombre)}
            aria-describedby="nombre-ayuda"
            className={claseInput}
            required
          />
          <p id="nombre-ayuda" className={estado.errores?.nombre ? "text-sm text-red-300" : "text-sm text-white/60"}>
            {estado.errores?.nombre?.[0] ?? "Es lo que verán tus clientes al reservar."}
          </p>
        </div>

        {/* Link */}
        <div className="space-y-2">
          <label htmlFor="slug" className="font-medium text-white">
            Tu link
          </label>
          <div
            className={`rounded-xl border bg-white/[0.06] px-4 py-2.5 transition focus-within:ring-2 ${
              linkBloqueado
                ? "border-red-400/70 focus-within:ring-red-400/30"
                : link.estado === "disponible"
                  ? "border-esmeralda/70 focus-within:ring-esmeralda/30"
                  : "border-white/15 focus-within:border-esmeralda focus-within:ring-esmeralda/30"
            }`}
          >
            <span className="block text-sm text-white/50">{dominio}/</span>
            <input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => editarSlug(e.target.value)}
              placeholder="tu-negocio"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={60}
              aria-invalid={linkBloqueado}
              aria-describedby="slug-estado"
              className="w-full bg-transparent text-lg font-semibold text-white placeholder:text-white/40 outline-none"
              required
            />
          </div>
          <EstadoDelLink id="slug-estado" link={link} errorServidor={errorServidorSlug} />

          {sugerencias.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-sm text-white/70">Prueba con uno de estos:</p>
              <div className="flex flex-wrap gap-2">
                {sugerencias.map((sugerencia) => (
                  <button
                    key={sugerencia}
                    type="button"
                    onClick={() => editarSlug(sugerencia)}
                    className="rounded-xl border border-esmeralda/50 bg-esmeralda/10 px-4 py-2 font-medium text-menta transition hover:bg-esmeralda/20 focus-visible:outline-2 focus-visible:outline-esmeralda"
                  >
                    {sugerencia}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Teléfono */}
        <div className="space-y-2">
          <label htmlFor="telefono" className="font-medium text-white">
            Teléfono o WhatsApp <span className="font-normal text-white/60">(opcional)</span>
          </label>
          <div className="relative">
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-white/50">
              +51
            </span>
            <input
              id="telefono"
              name="telefono"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="987 654 321"
              aria-invalid={Boolean(estado.errores?.telefono)}
              aria-describedby="telefono-ayuda"
              className={`${claseInput} pl-14`}
            />
          </div>
          <p id="telefono-ayuda" className={estado.errores?.telefono ? "text-sm text-red-300" : "text-sm text-white/60"}>
            {estado.errores?.telefono?.[0] ?? "Aparecerá en tu página para que te contacten."}
          </p>
        </div>

        {/* Botón: fijo abajo en celular, normal en computadora */}
        <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-fondo via-fondo/95 to-transparent px-4 pb-4 pt-8 lg:static lg:bg-none lg:p-0">
          <button
            type="submit"
            disabled={enviando || linkBloqueado}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-esmeralda py-4 text-lg font-medium text-tinta shadow-[0_10px_40px_-8px_rgba(16,185,129,0.6)] transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-enlace disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando && (
              <span aria-hidden="true" className="size-5 animate-spin rounded-full border-[3px] border-tinta/30 border-t-tinta" />
            )}
            {enviando ? "Creando tu negocio…" : "Crear mi negocio"}
          </button>
        </div>
      </form>
    </div>
  );
}

function EstadoDelLink({ id, link, errorServidor }: { id: string; link: EstadoLink; errorServidor?: string }) {
  const error = errorServidor ?? ("mensaje" in link ? link.mensaje : undefined);

  if (error) {
    return (
      <p id={id} role="alert" className="flex items-start gap-2 text-red-300">
        <IconoAlerta /> {error}
      </p>
    );
  }
  if (link.estado === "disponible") {
    return (
      <p id={id} className="flex items-start gap-2 text-enlace">
        <IconoCheck /> Disponible. Solo letras minúsculas, números y guiones.
      </p>
    );
  }
  return (
    <p id={id} aria-live="polite" className="text-sm text-white/60">
      {link.estado === "comprobando"
        ? "Comprobando si está libre…"
        : "Se arma solo con el nombre. Solo letras minúsculas, números y guiones."}
    </p>
  );
}

function CabeceraNegocio({ nombre, detalle, grande }: { nombre: string; detalle?: ReactNode; grande?: boolean }) {
  const vacio = !nombre.trim();
  return (
    <div className="flex items-center gap-4">
      <span
        className={`grid shrink-0 place-items-center rounded-full font-titulo font-bold ${
          grande ? "size-20 text-2xl" : "size-14 text-lg"
        } ${vacio ? "bg-white/10 text-white/50" : "bg-menta text-tinta"}`}
      >
        {vacio ? "TN" : iniciales(nombre)}
      </span>
      <div className="min-w-0">
        <p className={`truncate font-titulo font-bold ${grande ? "text-3xl" : "text-xl"} ${vacio ? "text-white/50" : "text-white"}`}>
          {vacio ? "Tu negocio" : nombre}
        </p>
        {detalle && <div className="truncate text-white/70">{detalle}</div>}
      </div>
    </div>
  );
}

function LinkNegocio({ dominio, slug, className = "" }: { dominio: string; slug: string; className?: string }) {
  return (
    <p className={`flex min-w-0 items-center gap-2 ${className}`}>
      <IconoEnlace />
      <span className="truncate text-white/60">
        {dominio}/<span className="font-semibold text-white">{slug || "tu-negocio"}</span>
      </span>
    </p>
  );
}

function IconoEnlace() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-enlace" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M10 14a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1 1" />
      <path d="M14 10a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1-1" />
    </svg>
  );
}

function IconoCheck() {
  return (
    <svg viewBox="0 0 24 24" className="mt-0.5 size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </svg>
  );
}

function IconoAlerta() {
  return (
    <svg viewBox="0 0 24 24" className="mt-0.5 size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6M12 16.5v.5" />
    </svg>
  );
}
