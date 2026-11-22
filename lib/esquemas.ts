import { z } from "zod";

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
