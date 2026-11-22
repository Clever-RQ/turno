/**
 * Teléfonos de Perú: celular o fijo, normalizados a formato internacional (E.164).
 *
 *   celular:           987654321   -> +51987654321
 *   fijo de Lima:      01 234 5678 -> +5112345678
 *   fijo de provincia: 044 123456  -> +5144123456
 *
 * Acepta espacios, guiones, paréntesis, el 0 inicial y un +51 escrito por el usuario.
 * Devuelve null si no es un número válido.
 * La base de datos tiene el mismo patrón (check negocios_telefono_formato).
 */
const NUMERO_NACIONAL = /^(9\d{8}|1\d{7}|[4-8]\d{7})$/;

export function normalizarTelefono(texto: string): string | null {
  let digitos = texto.replace(/[\s\-().]/g, "");

  if (digitos.startsWith("+51")) digitos = digitos.slice(3);
  else if (digitos.startsWith("0051")) digitos = digitos.slice(4);
  // El 0 es el prefijo para llamar de una ciudad a otra (01 Lima, 044 Trujillo).
  if (digitos.startsWith("0")) digitos = digitos.slice(1);

  return NUMERO_NACIONAL.test(digitos) ? `+51${digitos}` : null;
}

/** +51987654321 -> "+51 987 654 321" · +5112345678 -> "+51 1 234 5678" · +5144123456 -> "+51 44 123 456" */
export function formatearTelefono(e164: string): string {
  const n = e164.replace(/^\+51/, "");
  if (n.startsWith("9")) return `+51 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
  if (n.startsWith("1")) return `+51 1 ${n.slice(1, 4)} ${n.slice(4)}`;
  return `+51 ${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5)}`;
}
