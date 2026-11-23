import { describe, expect, it } from "vitest";
import {
  contrasenaSchema,
  correoSchema,
  nuevaContrasenaSchema,
  registroSchema,
} from "../../src/domain/esquemas";
import { MENSAJE_GENERICO, mensajeErrorAuth } from "../../src/domain/errores-auth";

describe("contrasenaSchema", () => {
  it("acepta 8+ caracteres con letra y número", () => {
    expect(contrasenaSchema.safeParse("barberia1").success).toBe(true);
  });

  it.each([
    ["corta1", "Usa al menos 8 caracteres."],
    ["12345678", "Incluye al menos una letra."],
    ["solotexto", "Incluye al menos un número."],
  ])("rechaza %s", (valor, mensaje) => {
    const resultado = contrasenaSchema.safeParse(valor);
    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0].message).toBe(mensaje);
  });
});

describe("correoSchema", () => {
  it("quita espacios y pasa a minúsculas", () => {
    expect(correoSchema.parse("  Luis@BarberiaDonLucho.pe ")).toBe(
      "luis@barberiadonlucho.pe",
    );
  });

  it("rechaza un correo inválido", () => {
    expect(correoSchema.safeParse("luis@").success).toBe(false);
  });
});

describe("registroSchema", () => {
  const valido = {
    nombre: "Luis Ramírez",
    email: "luis@barberiadonlucho.pe",
    password: "barberia1",
    terminos: "on",
  };

  it("acepta datos completos", () => {
    expect(registroSchema.safeParse(valido).success).toBe(true);
  });

  it("exige aceptar los términos", () => {
    const resultado = registroSchema.safeParse({ ...valido, terminos: undefined });
    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0].path).toEqual(["terminos"]);
  });
});

describe("nuevaContrasenaSchema", () => {
  it("marca el error en 'confirmacion' si no coinciden", () => {
    const resultado = nuevaContrasenaSchema.safeParse({
      password: "barberia1",
      confirmacion: "barberia2",
    });
    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0].path).toEqual(["confirmacion"]);
  });
});

describe("mensajeErrorAuth", () => {
  it("traduce un código conocido", () => {
    expect(mensajeErrorAuth("invalid_credentials")).toBe("Correo o contraseña incorrectos.");
  });

  it("usa un mensaje genérico si no conoce el código", () => {
    expect(mensajeErrorAuth("codigo_raro")).toBe(MENSAJE_GENERICO);
    expect(mensajeErrorAuth(undefined)).toBe(MENSAJE_GENERICO);
  });
});
