/**
 * Palabras que no pueden ser el link de un negocio (chocarían con rutas de la app).
 * La misma lista está en la migración (privado.slug_reservado): si cambias una, cambia la otra.
 */
export const SLUGS_RESERVADOS = [
  "admin", "api", "app", "auth", "ayuda", "blog", "brand", "configuracion",
  "contacto", "cuenta", "icon", "login", "logout", "negocio", "nueva-contrasena",
  "onboarding", "panel", "precios", "privacidad", "recuperar", "registro",
  "reservas", "robots", "salir", "sitemap", "soporte", "terminos", "turno", "www",
] as const;

/** Mismo formato que exige la base de datos (check de negocios.slug). */
export const FORMATO_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function esSlugReservado(slug: string): boolean {
  return (SLUGS_RESERVADOS as readonly string[]).includes(slug);
}

/**
 * Alternativas cuando un link ya está en uso:
 *   "barberia-don-lucho" -> ["barberia-don-lucho-2", "barberia-don-lucho-3", "barberia-don-lucho-lima"]
 * Recorta la base si hace falta para no pasar de 60 caracteres.
 * Quien la usa debe comprobar que estén libres antes de mostrarlas.
 */
export function sugerirSlugs(base: string): string[] {
  return ["2", "3", "lima"].map((sufijo) => {
    const limite = 60 - sufijo.length - 1;
    const recortada = base.slice(0, limite).replace(/-+$/, "");
    return `${recortada}-${sufijo}`;
  });
}

/**
 * Convierte el nombre de un negocio en su link.
 *   "Barbería Don Lucho" -> "barberia-don-lucho"
 */
export function generarSlug(nombre: string): string {
  return (
    nombre
      // "á" se separa en "a" + tilde suelta (y "ñ" en "n" + virgulilla)...
      .normalize("NFD")
      // ...y aquí se borran esas marcas sueltas (rango Unicode de diacríticos).
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      // Todo lo que no sea letra o número (espacios, &, /, «») -> un solo guion.
      .replace(/[^a-z0-9]+/g, "-")
      // Sin guiones en los bordes.
      .replace(/^-+|-+$/g, "")
      // Máximo 60 (como la base de datos) y sin terminar en guion tras cortar.
      .slice(0, 60)
      .replace(/-+$/, "")
  );
}
