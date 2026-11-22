import type { Metadata } from "next";

export const metadata: Metadata = { title: "Términos de uso · Turno" };

// BORRADOR: revisar antes del piloto (Sprint 6).
export default function PaginaTerminos() {
  return (
    <>
      <h1>Términos de uso</h1>
      <p className="text-sm text-white/50">Versión preliminar · noviembre de 2026</p>

      <h2>1. Qué es Turno</h2>
      <p>
        Turno es una herramienta para que negocios en Perú reciban reservas en línea, desde su link,
        su código QR o un asistente con inteligencia artificial.
      </p>

      <h2>2. Tu cuenta</h2>
      <ul>
        <li>Debes dar datos reales y mantener tu contraseña en secreto.</li>
        <li>Eres responsable de lo que se haga desde tu cuenta.</li>
        <li>Puedes pedir que eliminemos tu cuenta en cualquier momento.</li>
      </ul>

      <h2>3. Uso correcto</h2>
      <p>
        No uses Turno para fines ilegales, para enviar spam ni para cargar datos de personas sin su
        autorización.
      </p>

      <h2>4. Estado del servicio</h2>
      <p>
        Turno está en etapa de prueba. Puede tener cambios, interrupciones o errores. No garantizamos
        disponibilidad continua durante esta etapa.
      </p>

      <h2>5. Cambios</h2>
      <p>Si cambiamos estos términos, lo avisaremos en esta página.</p>
    </>
  );
}
