import type { Metadata } from "next";
import { FormularioRecuperar } from "@/components/auth/formulario-recuperar";

export const metadata: Metadata = { title: "Recuperar contraseña · Turno" };

export default function PaginaRecuperar() {
  return <FormularioRecuperar />;
}
