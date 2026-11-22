import { describe, expect, it } from "vitest";
import { FORMATO_SLUG, generarSlug } from "../lib/slug";

describe("generarSlug", () => {
  it("pasa a minúsculas y une las palabras con guiones", () => {
    expect(generarSlug("Barbería Don Lucho")).toBe("barberia-don-lucho");
  });

  it("quita las tildes y la diéresis", () => {
    expect(generarSlug("Clínica Ü Odontológica")).toBe("clinica-u-odontologica");
  });

  it("convierte la ñ (mayúscula y minúscula) en n", () => {
    expect(generarSlug("Peluquería Ñaña")).toBe("peluqueria-nana");
    expect(generarSlug("AÑO NUEVO")).toBe("ano-nuevo");
  });

  it("convierte símbolos en separadores, sin guiones repetidos", () => {
    expect(generarSlug("Taller  de  Autos & Co.")).toBe("taller-de-autos-co");
    expect(generarSlug("Spa 24/7")).toBe("spa-24-7");
  });

  it("no deja guiones al inicio ni al final", () => {
    expect(generarSlug("  --Clínica Dental--  ")).toBe("clinica-dental");
  });

  it("devuelve texto vacío si no hay letras ni números", () => {
    expect(generarSlug("")).toBe("");
    expect(generarSlug("¡¡!!  ")).toBe("");
  });

  it("no valida la longitud mínima (eso lo hace Zod)", () => {
    expect(generarSlug("Yo")).toBe("yo");
  });

  it("corta en 60 caracteres sin terminar en guion", () => {
    // 59 'a' + " b" -> "aaa…a-b" (61). Cortado a 60 terminaría en "-".
    expect(generarSlug(`${"a".repeat(59)} b`)).toBe("a".repeat(59));
  });

  it("siempre cumple el formato de la base de datos", () => {
    const nombres = [
      "Centro de Estética y Belleza Integral para Damas y Caballeros de San Isidro",
      "Taller Mecánico «El Rápido» S.A.C.",
      "  Café   Ñandú  ",
    ];
    for (const nombre of nombres) {
      const slug = generarSlug(nombre);
      expect(slug).toMatch(FORMATO_SLUG);
      expect(slug.length).toBeLessThanOrEqual(60);
    }
  });
});
