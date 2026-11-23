import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de privacidad · Turno" };

// BORRADOR: revisar antes del piloto (Sprint 6). Marco: Ley 29733 de Protección de Datos Personales.
export default function PaginaPrivacidad() {
  return (
    <>
      <h1>Política de privacidad</h1>
      <p className="text-sm text-white/50">Versión preliminar · noviembre de 2026</p>

      <h2>1. Qué datos guardamos</h2>
      <ul>
        <li>Del dueño del negocio: nombre, correo y los datos de su negocio.</li>
        <li>De los clientes que reservan: nombre, teléfono o correo y sus citas.</li>
        <li>Datos de uso: visitas a la página de reservas y por qué QR o link llegaron.</li>
      </ul>

      <h2>2. Para qué los usamos</h2>
      <p>
        Solo para gestionar reservas, enviar confirmaciones y recordatorios, y mostrar métricas al
        dueño del negocio. No vendemos datos personales.
      </p>

      <h2>3. Dónde se guardan</h2>
      <p>
        En servidores de Supabase (región São Paulo, Brasil). Cada negocio solo puede ver sus propios
        datos.
      </p>

      <h2>4. Tus derechos</h2>
      <p>
        Según la Ley N.° 29733, puedes pedir acceder, corregir o eliminar tus datos en cualquier
        momento escribiéndonos.
      </p>

      <h2>5. Contacto</h2>
      <p>Para cualquier consulta sobre tus datos, escríbenos al correo de soporte de Turno.</p>
    </>
  );
}
