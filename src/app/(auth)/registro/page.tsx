import type { Metadata } from "next";
import { FormularioRegistro } from "@/components/auth/formulario-registro";

export const metadata: Metadata = { title: "Crear cuenta · Turno" };

export default function PaginaRegistro() {
  return <FormularioRegistro />;
}
