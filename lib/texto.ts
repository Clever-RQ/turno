/**
 * Iniciales para los avatares: "Barbería Don Lucho" -> "BD", "luis@correo.pe" -> "LC".
 * Usa las dos primeras palabras.
 */
export function iniciales(texto: string): string {
  return texto
    .trim()
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0].toUpperCase())
    .join("");
}

/** Primer nombre para saludar: "Luis Ramírez" -> "Luis". */
export function primerNombre(nombreCompleto: string): string {
  return nombreCompleto.trim().split(/\s+/)[0] ?? "";
}
