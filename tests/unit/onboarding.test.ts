import { describe, expect, it } from "vitest";
import { onboardingSchema } from "../../src/domain/esquemas";
import { sugerirSlugs } from "../../src/domain/slug";
import { formatearTelefono, normalizarTelefono } from "../../src/domain/telefono";
import { iniciales, primerNombre } from "../../src/domain/texto";

describe("normalizarTelefono", () => {
  it.each([
    ["987654321", "+51987654321"],
    ["987 654 321", "+51987654321"],
    ["+51 987-654-321", "+51987654321"],
    ["01 234 5678", "+5112345678"],
    ["(01) 234-5678", "+5112345678"],
    ["044 123456", "+5144123456"],
    ["0051 987654321", "+51987654321"],
  ])("%s -> %s", (entrada, esperado) => {
    expect(normalizarTelefono(entrada)).toBe(esperado);
  });

  it.each(["12345", "98765432", "9876543210", "abc", "+1 555 123 4567", "0 234 5678"])(
    "rechaza %s",
    (entrada) => {
      expect(normalizarTelefono(entrada)).toBeNull();
    },
  );
});

describe("formatearTelefono", () => {
  it("da formato a celular, fijo de Lima y de provincia", () => {
    expect(formatearTelefono("+51987654321")).toBe("+51 987 654 321");
    expect(formatearTelefono("+5112345678")).toBe("+51 1 234 5678");
    expect(formatearTelefono("+5144123456")).toBe("+51 44 123 456");
  });
});

describe("sugerirSlugs", () => {
  it("agrega -2, -3 y -lima", () => {
    expect(sugerirSlugs("barberia-don-lucho")).toEqual([
      "barberia-don-lucho-2",
      "barberia-don-lucho-3",
      "barberia-don-lucho-lima",
    ]);
  });

  it("nunca pasa de 60 caracteres ni deja guiones dobles", () => {
    const base = `${"a".repeat(54)}-bbbbb`; // 60
    for (const s of sugerirSlugs(base)) {
      expect(s.length).toBeLessThanOrEqual(60);
      expect(s).not.toContain("--");
    }
  });
});

describe("onboardingSchema", () => {
  const valido = { nombre: "Barbería Don Lucho", slug: "barberia-don-lucho", telefono: "" };

  it("acepta datos válidos y deja el teléfono vacío como null", () => {
    expect(onboardingSchema.parse(valido)).toEqual({ ...valido, telefono: null });
  });

  it("normaliza el teléfono", () => {
    expect(onboardingSchema.parse({ ...valido, telefono: "987 654 321" }).telefono).toBe("+51987654321");
  });

  it("rechaza un teléfono inválido en el campo telefono", () => {
    const r = onboardingSchema.safeParse({ ...valido, telefono: "12345" });
    expect(r.error?.issues[0].path).toEqual(["telefono"]);
  });

  it.each([
    ["panel", "Ese link está reservado, elige otro."],
    ["ab", "Usa al menos 3 caracteres: letras, números y guiones."],
    ["Barberia", "Solo letras minúsculas, números y guiones (sin guion al inicio ni al final)."],
    ["-barberia", "Solo letras minúsculas, números y guiones (sin guion al inicio ni al final)."],
  ])("rechaza el link %s", (slug, mensaje) => {
    const r = onboardingSchema.safeParse({ ...valido, slug });
    expect(r.error?.issues[0].message).toBe(mensaje);
  });
});

describe("iniciales y primerNombre", () => {
  it("toma las dos primeras palabras", () => {
    expect(iniciales("Barbería Don Lucho")).toBe("BD");
    expect(iniciales("luis@correo.pe")).toBe("LC");
    expect(iniciales("  ")).toBe("");
    expect(primerNombre("Luis Ramírez")).toBe("Luis");
  });
});
