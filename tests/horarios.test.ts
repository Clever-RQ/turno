import { describe, expect, it } from "vitest";
import { aInstante, desfaseMinutos, enZona, fechaCorta, hoyEn, sumarDias } from "../lib/fechas";
import {
  filasASemana,
  hayErrores,
  horarioTipico,
  resumenDia,
  semanaATramos,
  semanaVacia,
  siguienteTramo,
  validarSemana,
} from "../lib/horarios";

describe("validarSemana", () => {
  it("acepta el horario típico y un turno partido contiguo", () => {
    const semana = horarioTipico();
    semana[3] = [
      { abre: "09:00", cierra: "13:00" },
      { abre: "13:00", cierra: "20:00" },
    ];
    expect(hayErrores(validarSemana(semana))).toBe(false);
  });

  it("marca un cierre antes de la apertura en ese tramo", () => {
    const semana = semanaVacia();
    semana[6] = [{ abre: "10:00", cierra: "09:30" }];
    expect(validarSemana(semana)).toEqual({ 6: { 0: "El cierre debe ser después de la apertura." } });
  });

  it("marca el segundo tramo si se cruza con otro", () => {
    const semana = semanaVacia();
    semana[1] = [
      { abre: "09:00", cierra: "13:00" },
      { abre: "12:00", cierra: "18:00" },
    ];
    expect(validarSemana(semana)).toEqual({ 1: { 1: "Este turno se cruza con otro." } });
  });
});

describe("conversiones de semana", () => {
  it("convierte filas de la base de datos (con segundos) y las ordena", () => {
    const semana = filasASemana([
      { dia_semana: 3, abre: "15:00:00", cierra: "20:00:00" },
      { dia_semana: 3, abre: "09:00:00", cierra: "13:00:00" },
    ]);
    expect(semana[3]).toEqual([
      { abre: "09:00", cierra: "13:00" },
      { abre: "15:00", cierra: "20:00" },
    ]);
    expect(semana[0]).toEqual([]);
  });

  it("arma los tramos para guardar_horario", () => {
    const semana = semanaVacia();
    semana[1] = [{ abre: "09:00", cierra: "19:00" }];
    expect(semanaATramos(semana)).toEqual([{ dia_semana: 1, abre: "09:00", cierra: "19:00" }]);
  });

  it("resume un día", () => {
    expect(resumenDia([])).toBe("Cerrado");
    expect(
      resumenDia([
        { abre: "09:00", cierra: "13:00" },
        { abre: "15:00", cierra: "20:00" },
      ]),
    ).toBe("09:00 – 13:00 y 15:00 – 20:00");
  });

  it("propone el siguiente turno una hora después del último", () => {
    expect(siguienteTramo([])).toEqual({ abre: "09:00", cierra: "19:00" });
    expect(siguienteTramo([{ abre: "09:00", cierra: "13:00" }])).toEqual({ abre: "14:00", cierra: "18:00" });
    expect(siguienteTramo([{ abre: "09:00", cierra: "22:30" }])).toEqual({ abre: "23:00", cierra: "23:30" });
  });
});

describe("fechas en la zona del negocio", () => {
  const LIMA = "America/Lima";

  it("Lima está en UTC-5", () => {
    expect(desfaseMinutos(new Date("2026-12-15T12:00:00Z"), LIMA)).toBe(-300);
  });

  it("15:00 en Lima son las 20:00 UTC", () => {
    expect(aInstante("2026-12-15", "15:00", LIMA).toISOString()).toBe("2026-12-15T20:00:00.000Z");
  });

  it("la medianoche de Lima son las 05:00 UTC del mismo día", () => {
    expect(aInstante("2026-12-15", "00:00", LIMA).toISOString()).toBe("2026-12-15T05:00:00.000Z");
  });

  it("vuelve a la hora local y respeta el cambio de día", () => {
    expect(enZona(new Date("2026-12-16T03:30:00Z"), LIMA)).toEqual({ fecha: "2026-12-15", hora: "22:30" });
    expect(hoyEn(LIMA, new Date("2026-12-16T03:30:00Z"))).toBe("2026-12-15");
  });

  it("suma días y formatea fechas cortas", () => {
    expect(sumarDias("2026-12-31", 1)).toBe("2027-01-01");
    expect(fechaCorta("2026-12-08")).toBe("Mar 8 dic");
  });
});

describe("bloqueoSchema", () => {
  const base = { desde: "2026-12-15", hasta: "", todo_el_dia: "on", aplica: "negocio", motivo: "" };

  it("acepta un día completo para todo el negocio", async () => {
    const { bloqueoSchema } = await import("../lib/esquemas");
    expect(bloqueoSchema.parse(base)).toMatchObject({ desde: "2026-12-15", hasta: undefined, todo_el_dia: true, motivo: null });
  });

  it("exige horas en orden si no es todo el día", async () => {
    const { bloqueoSchema } = await import("../lib/esquemas");
    const sinTodoElDia = { ...base, todo_el_dia: undefined };
    expect(bloqueoSchema.safeParse({ ...sinTodoElDia, hora_desde: "17:00", hora_hasta: "15:00" }).error?.issues[0].message).toBe(
      "La hora final debe ser después de la inicial.",
    );
    expect(bloqueoSchema.safeParse({ ...sinTodoElDia, hora_desde: "15:00", hora_hasta: "17:00" }).success).toBe(true);
  });

  it("rechaza «Hasta» antes de «Desde» y un «aplica» inválido", async () => {
    const { bloqueoSchema } = await import("../lib/esquemas");
    expect(bloqueoSchema.safeParse({ ...base, hasta: "2026-12-10" }).error?.issues[0].path).toEqual(["hasta"]);
    expect(bloqueoSchema.safeParse({ ...base, aplica: "cualquiera" }).success).toBe(false);
  });
});
