/**
 * Condición de terminado del Sprint 1:
 * "Dos cuentas de prueba no ven los datos de la otra".
 *
 * A y B son dueños reales y temporales. Cada prueba usa la sesión de A
 * (rol authenticated, como el navegador) e intenta tocar lo de B.
 * Con "admin" (clave secreta) solo se verifica que lo de B siga intacto.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { admin, borrarDueno, crearDueno, publico, type Dueno } from "./ayudantes";

let A: Dueno;
let B: Dueno;

beforeAll(async () => {
  [A, B] = await Promise.all([crearDueno("a"), crearDueno("b")]);
});

afterAll(async () => {
  await Promise.all([borrarDueno(A), borrarDueno(B)]);
});

describe("cada dueño ve solo lo suyo", () => {
  it("A ve su negocio y solo su negocio", async () => {
    const { data } = await A.cliente.from("negocios").select("id");
    expect(data).toEqual([{ id: A.negocioId }]);
  });

  it.each(["servicios", "personal", "horarios", "bloqueos"])("A no ve %s de B", async (tabla) => {
    const { data, error } = await A.cliente.from(tabla).select("negocio_id");
    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThan(0); // sí ve lo suyo…
    expect(data!.every((fila) => fila.negocio_id === A.negocioId)).toBe(true); // …y nada más
  });

  it("A no encuentra el servicio de B ni buscándolo por id", async () => {
    const { data } = await A.cliente.from("servicios").select("id").eq("id", B.servicioId);
    expect(data).toEqual([]);
  });
});

describe("A no puede modificar ni borrar lo de B", () => {
  it("actualizar un servicio de B no afecta ninguna fila", async () => {
    const { data } = await A.cliente.from("servicios").update({ nombre: "Hackeado" }).eq("id", B.servicioId).select();
    expect(data).toEqual([]);

    const { data: real } = await admin.from("servicios").select("nombre").eq("id", B.servicioId).single();
    expect(real?.nombre).toBe("Corte");
  });

  it("borrar un día libre de B no lo borra", async () => {
    await A.cliente.from("bloqueos").delete().eq("id", B.bloqueoId);

    const { data } = await admin.from("bloqueos").select("id").eq("id", B.bloqueoId);
    expect(data).toHaveLength(1);
  });
});

describe("A no puede crear cosas a nombre de B", () => {
  it("no puede agregar un servicio al negocio de B (RLS)", async () => {
    const { error } = await A.cliente.from("servicios").insert({ negocio_id: B.negocioId, nombre: "Intruso", duracion_min: 30 });
    expect(error?.code).toBe("42501");
  });

  it("no puede crear un negocio con B como dueño", async () => {
    const { error } = await A.cliente.from("negocios").insert({ owner_id: B.userId, nombre: "Falso", slug: `falso-${Date.now()}` });
    expect(error?.code).toBe("42501");
  });

  it("no puede usar al personal de B en su propio horario (FK compuesta)", async () => {
    const { error } = await A.cliente
      .from("horarios")
      .insert({ negocio_id: A.negocioId, personal_id: B.personaId, dia_semana: 2, abre: "09:00", cierra: "10:00" });
    expect(error?.code).toBe("23503");
  });

  it("no puede cambiar el horario de una persona de B con guardar_horario", async () => {
    const { error } = await A.cliente.rpc("guardar_horario", {
      p_personal_id: B.personaId,
      p_tramos: [{ dia_semana: 2, abre: "09:00", cierra: "10:00" }],
    });
    expect(error?.message).toContain("Persona no encontrada");
  });
});

describe("visitante sin cuenta (página pública)", () => {
  it("ve el negocio pero no quién es su dueño", async () => {
    const { data } = await publico.from("negocios").select("nombre").eq("id", B.negocioId);
    expect(data).toHaveLength(1);

    const { error } = await publico.from("negocios").select("owner_id").eq("id", B.negocioId);
    expect(error?.code).toBe("42501");
  });

  it("ve los servicios activos pero no los inactivos", async () => {
    const { data } = await publico.from("servicios").select("id").eq("negocio_id", B.negocioId);
    const ids = data!.map((s) => s.id);
    expect(ids).toContain(B.servicioId);
    expect(ids).not.toContain(B.servicioInactivoId);
  });

  it("no puede leer días libres ni crear negocios", async () => {
    expect((await publico.from("bloqueos").select("id")).error?.code).toBe("42501");
    expect((await publico.from("negocios").insert({ nombre: "x", slug: `x-${Date.now()}` })).error?.code).toBe("42501");
  });
});

describe("más intentos de A sobre lo de B", () => {
  it("A no puede borrar el negocio de B", async () => {
    // Si esto funcionara, el cascade borraría TODO lo de B: es el peor caso posible.
    const { data } = await A.cliente.from("negocios").delete().eq("id", B.negocioId).select();
    expect(data).toEqual([]);

    const { data: sigue } = await admin.from("negocios").select("id").eq("id", B.negocioId);
    expect(sigue).toHaveLength(1);
  });

  it("A no puede renombrar a una persona del equipo de B", async () => {
    const { data } = await A.cliente.from("personal").update({ nombre: "Hackeado" }).eq("id", B.personaId).select();
    expect(data).toEqual([]);

    const { data: real } = await admin.from("personal").select("nombre").eq("id", B.personaId).single();
    expect(real?.nombre).toBe("Carlos");
  });

  it.each(["reservas", "clientes", "visitas"])("el visitante sin cuenta no puede leer %s", async (tabla) => {
    const { error } = await publico.from(tabla).select("id");
    expect(error?.code).toBe("42501");
  });
});
