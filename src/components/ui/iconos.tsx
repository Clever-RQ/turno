// Íconos de línea (24x24). Decorativos: el texto o aria-label del botón da el significado.
import type { ReactNode } from "react";
type Props = { className?: string };

function Icono({ className = "size-5", children }: Props & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const IconoEnlace = (p: Props) => (
  <Icono {...p}>
    <path d="M10 14a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1 1" />
    <path d="M14 10a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1-1" />
  </Icono>
);

export const IconoLapiz = (p: Props) => (
  <Icono {...p}>
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
  </Icono>
);

export const IconoPapelera = (p: Props) => (
  <Icono {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </Icono>
);

export const IconoCerrar = (p: Props) => (
  <Icono {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icono>
);

export const IconoMenu = (p: Props) => (
  <Icono {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icono>
);

// --- Navegación del panel ---
export const IconoAgenda = (p: Props) => (
  <Icono {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
    <path d="M8 14h3" />
  </Icono>
);

export const IconoServicios = (p: Props) => (
  <Icono {...p}>
    <circle cx="6.5" cy="7" r="2.5" />
    <circle cx="6.5" cy="17" r="2.5" />
    <path d="M8.6 8.4 20 17M8.6 15.6 20 7" />
  </Icono>
);

export const IconoEquipo = (p: Props) => (
  <Icono {...p}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
    <path d="M15.5 5.6a3.2 3.2 0 0 1 0 6M17 14.2a5.5 5.5 0 0 1 3.5 5.3" />
  </Icono>
);

export const IconoHorarios = (p: Props) => (
  <Icono {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Icono>
);

export const IconoClientes = (p: Props) => (
  <Icono {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
    <circle cx="9.5" cy="11" r="2.2" />
    <path d="M6 16.5a3.5 3.5 0 0 1 7 0M15 10h3M15 13.5h3" />
  </Icono>
);

export const IconoAsistente = (p: Props) => (
  <Icono {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 12V7a5 5 0 0 1 4.3 2.5Z" />
    <path d="M9.5 15h.01M14.5 15h.01" />
  </Icono>
);

export const IconoMetricas = (p: Props) => (
  <Icono {...p}>
    <path d="M4 19.5h16" />
    <path d="M7 16v-4M12 16V7M17 16v-6.5" />
  </Icono>
);

export const IconoSalir = (p: Props) => (
  <Icono {...p}>
    <path d="M14 4.5h3.5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H14" />
    <path d="M10 8 6 12l4 4M6 12h9" />
  </Icono>
);

export const IconoCopiar = (p: Props) => (
  <Icono {...p}>
    <rect x="8" y="8" width="12" height="12" rx="2.5" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </Icono>
);

export const IconoCheck = (p: Props) => (
  <Icono {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icono>
);

export const IconoFlecha = (p: Props) => (
  <Icono {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icono>
);
