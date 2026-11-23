import { describe, expect, it } from "vitest";
import { servicioSchema } from "../../src/domain/esquemas";
import { formatearPrecio, parsearPrecio, resumenServicio } from "../../src/domain/servicios";

describe("parsearPrecio", () => {
  it.each([
    ["25", 25],
    ["25.5", 25.5],
    ["25,50", 25.5],
    ["S/ 25", 25],
    [" s/35.00 ", 35],
    ["0", 0],
  ])("%s -> %s", (texto, esperado) => {
    expect(parsearPrecio(texto)).toBe(esperado);
  });

  it("vacío es null (servicio sin precio)", () => {
    expect(parsearPrecio("")).toBeNull();
    expect(parsearPrecio("  ")).toBeNull();
  });

  it.each(["-5", "abc", "25.555", "1000000", "25.5.5"])("rechaza %s", (texto) => {
    expect(parsearPrecio(texto)).toBeNaN();
  });
});

describe("formatearPrecio y resumenServicio", () => {
  it("muestra soles sin decimales si es entero", () => {
    expect(formatearPrecio(25)).toBe("S/ 25");
    expect(formatearPrecio(25.5)).toBe("S/ 25.50");
    expect(formatearPrecio(1200)).toBe("S/ 1,200");
    expect(formatearPrecio(null)).toBe("Sin precio");
  });

  it("arma el resumen de la tarjeta", () => {
    expect(resumenServicio({ duracion_min: 30, precio: 25 })).toBe("30 min · S/ 25");
    expect(resumenServicio({ duracion_min: 45, precio: null })).toBe("45 min");
  });
});

describe("servicioSchema", () => {
  const base = { id: "", nombre: "Corte clásico", duracion_min: "30", precio: "25", activo: "on" };

  it("convierte los datos del formulario", () => {
    expect(servicioSchema.parse(base)).toEqual({
      id: undefined,
      nombre: "Corte clásico",
      duracion_min: 30,
      precio: 25,
      activo: true,
    });
  });

  it("sin checkbox queda inactivo y sin precio queda null", () => {
    const { activo: _a, ...sinActivo } = base;
    void _a;
    const r = servicioSchema.parse({ ...sinActivo, precio: "" });
    expect(r.activo).toBe(false);
    expect(r.precio).toBeNull();
  });

  it.each([
    ["duracion_min", "7", "Usa múltiplos de 5 minutos."],
    ["duracion_min", "500", "La duración máxima es 8 horas."],
    ["precio", "-3", "Escribe un precio válido, por ejemplo 25 o 25.50."],
    ["nombre", " ", "Escribe el nombre del servicio."],
  ])("rechaza %s = %s", (campo, valor, mensaje) => {
    const r = servicioSchema.safeParse({ ...base, [campo]: valor });
    expect(r.error?.issues[0].message).toBe(mensaje);
  });

  it("rechaza un id que no es uuid", () => {
    expect(servicioSchema.safeParse({ ...base, id: "123" }).success).toBe(false);
  });
});

describe("personaSchema", () => {
  it("acepta un nombre y el checkbox activo", async () => {
    const { personaSchema } = await import("../../src/domain/esquemas");
    expect(personaSchema.parse({ id: "", nombre: "  Carlos  ", activo: "on" })).toEqual({
      id: undefined,
      nombre: "Carlos",
      activo: true,
    });
  });

  it("rechaza nombres muy cortos", async () => {
    const { personaSchema } = await import("../../src/domain/esquemas");
    const r = personaSchema.safeParse({ nombre: "C" });
    expect(r.error?.issues[0].message).toBe("Escribe el nombre de la persona.");
  });
});

describe("formatearDuracion", () => {
  it("usa horas y minutos", async () => {
    const { formatearDuracion, resumenServicio } = await import("../../src/domain/servicios");
    expect(formatearDuracion(30)).toBe("30 min");
    expect(formatearDuracion(60)).toBe("1 h");
    expect(formatearDuracion(90)).toBe("1 h 30 min");
    expect(formatearDuracion(240)).toBe("4 h");
    expect(resumenServicio({ duracion_min: 90, precio: 60 })).toBe("1 h 30 min · S/ 60");
  });
});
