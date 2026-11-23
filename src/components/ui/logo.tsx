import Image from "next/image";

type Props = {
  variante?: "blanco" | "tinta";
  className?: string;
};

// Proporción del SVG: 2372 x 743
export function Logo({ variante = "blanco", className = "h-10 w-auto" }: Props) {
  return (
    <Image
      src={`/brand/turno-logo-${variante}.svg`}
      alt="Turno"
      width={2372}
      height={743}
      className={className}
      priority
      unoptimized
    />
  );
}
