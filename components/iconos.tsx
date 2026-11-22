// Íconos de línea (24x24). Decorativos: el texto o aria-label del botón da el significado.
type Props = { className?: string };

function Icono({ className = "size-5", children }: Props & { children: React.ReactNode }) {
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
