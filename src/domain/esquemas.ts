import { z } from "zod";
import { FORMATO_SLUG, esSlugReservado } from "@/domain/slug";
import { parsearPrecio } from "@/domain/servicios";
import { normalizarTelefono } from "@/domain/telefono";

// -------------------------------------------------------------
// Autenticación
// La misma regla de contraseña está configurada en Supabase
// (Authentication > Policies): mínimo 8, letras y números.
// Validamos aquí también para mostrar el error antes de enviar.
// -------------------------------------------------------------

export const correoSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Escribe un correo válido." }));

export const contrasenaSchema = z
  .string()
  .min(8, { error: "Usa al menos 8 caracteres." })
  .regex(/[A-Za-z]/, { error: "Incluye al menos una letra." })
  .regex(/\d/, { error: "Incluye al menos un número." });

export const loginSchema = z.object({
  email: correoSchema,
  // En el login no se aplica la regla completa: solo que no esté vacía.
  password: z.string().min(1, { error: "Escribe tu contraseña." }),
});

export const registroSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, { error: "Escribe tu nombre." })
    .max(80, { error: "El nombre es muy largo." }),
  email: correoSchema,
  password: contrasenaSchema,
  // Un checkbox marcado llega como "on"; sin marcar, no llega.
  terminos: z.literal("on", {
    error: "Debes aceptar los términos para continuar.",
  }),
});

export const recuperarSchema = z.object({
  email: correoSchema,
});

export const nuevaContrasenaSchema = z
  .object({
    password: contrasenaSchema,
    confirmacion: z.string(),
  })
  .refine((datos) => datos.password === datos.confirmacion, {
    error: "Las contraseñas no coinciden.",
    path: ["confirmacion"],
  });

// -------------------------------------------------------------
// Onboarding del negocio (#4)
// -------------------------------------------------------------

export const MENSAJES_SLUG = {
  corto: "Usa al menos 3 caracteres: letras, números y guiones.",
  formato: "Solo letras minúsculas, números y guiones (sin guion al inicio ni al final).",
  reservado: "Ese link está reservado, elige otro.",
} as const;

export const slugSchema = z
  .string()
  .trim()
  .min(3, { error: MENSAJES_SLUG.corto })
  .max(60, { error: "Usa como máximo 60 caracteres." })
  .regex(FORMATO_SLUG, { error: MENSAJES_SLUG.formato })
  .refine((slug) => !esSlugReservado(slug), { error: MENSAJES_SLUG.reservado });

export const onboardingSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, { error: "Escribe el nombre de tu negocio." })
    .max(80, { error: "El nombre es muy largo." }),
  slug: slugSchema,
  // Opcional: vacío -> null; con texto -> +51… o error.
  telefono: z
    .string()
    .optional()
    .transform((valor, ctx) => {
      if (!valor?.trim()) return null;
      const normalizado = normalizarTelefono(valor);
      if (!normalizado) {
        ctx.addIssue({
          code: "custom",
          message: "Escribe un celular de 9 dígitos o un fijo con su código (por ejemplo 01 234 5678).",
        });
        return z.NEVER;
      }
      return normalizado;
    }),
});

// -------------------------------------------------------------
// Servicios (#5)
// -------------------------------------------------------------

export const servicioSchema = z.object({
  // Vacío al crear; con valor al editar.
  id: z.uuid().optional().or(z.literal("").transform(() => undefined)),
  nombre: z
    .string()
    .trim()
    .min(2, { error: "Escribe el nombre del servicio." })
    .max(60, { error: "Usa como máximo 60 caracteres." }),
  duracion_min: z.coerce
    .number({ error: "Elige una duración." })
    .int()
    .min(5, { error: "La duración mínima es 5 minutos." })
    .max(480, { error: "La duración máxima es 8 horas." })
    .multipleOf(5, { error: "Usa múltiplos de 5 minutos." }),
  precio: z
    .string()
    .optional()
    .transform((valor, ctx) => {
      const precio = parsearPrecio(valor ?? "");
      if (Number.isNaN(precio)) {
        ctx.addIssue({ code: "custom", message: "Escribe un precio válido, por ejemplo 25 o 25.50." });
        return z.NEVER;
      }
      return precio;
    }),
  // Un checkbox marcado llega como "on"; sin marcar, no llega.
  activo: z
    .literal("on")
    .optional()
    .transform((valor) => valor === "on"),
});

// -------------------------------------------------------------
// Equipo / personal (#6)
// -------------------------------------------------------------

export const personaSchema = z.object({
  id: z.uuid().optional().or(z.literal("").transform(() => undefined)),
  nombre: z
    .string()
    .trim()
    .min(2, { error: "Escribe el nombre de la persona." })
    .max(60, { error: "Usa como máximo 60 caracteres." }),
  activo: z
    .literal("on")
    .optional()
    .transform((valor) => valor === "on"),
});

// -------------------------------------------------------------
// Días libres / bloqueos (#7)
// -------------------------------------------------------------

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * El formulario de "Nuevo día libre". Las fechas y horas están en la zona
 * del negocio; el servidor las convierte a instantes UTC al guardar.
 * Si no es "todo el día", las horas aplican a un solo día (Desde).
 */
export const bloqueoSchema = z
  .object({
    desde: z.string().regex(FECHA, { error: "Elige la fecha." }),
    hasta: z
      .string()
      .optional()
      .transform((v) => (v ? v : undefined))
      .pipe(z.string().regex(FECHA).optional()),
    todo_el_dia: z
      .literal("on")
      .optional()
      .transform((v) => v === "on"),
    hora_desde: z.string().optional(),
    hora_hasta: z.string().optional(),
    // "negocio" o el id de una persona.
    aplica: z.union([z.literal("negocio"), z.uuid()], { error: "Elige a quién aplica." }),
    motivo: z
      .string()
      .trim()
      .max(80, { error: "Usa como máximo 80 caracteres." })
      .optional()
      .transform((v) => v || null),
  })
  .superRefine((d, ctx) => {
    if (d.hasta && d.hasta < d.desde) {
      ctx.addIssue({ code: "custom", path: ["hasta"], message: "Debe ser igual o posterior a «Desde»." });
    }
    if (!d.todo_el_dia) {
      if (!d.hora_desde || !HORA.test(d.hora_desde) || !d.hora_hasta || !HORA.test(d.hora_hasta)) {
        ctx.addIssue({ code: "custom", path: ["hora_hasta"], message: "Elige las horas." });
      } else if (d.hora_hasta <= d.hora_desde) {
        ctx.addIssue({ code: "custom", path: ["hora_hasta"], message: "La hora final debe ser después de la inicial." });
      }
    }
  });

/** Una semana que llega del navegador: 7 días, hasta 6 turnos por día, horas "HH:MM". */
export const semanaSchema = z.record(
  z.enum(["0", "1", "2", "3", "4", "5", "6"]),
  z.array(z.object({ abre: z.string().regex(HORA), cierra: z.string().regex(HORA) })).max(6),
);
