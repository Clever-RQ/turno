import type { Metadata } from "next";
import { FormularioRegistro } from "./formulario";

export const metadata: Metadata = { title: "Crear cuenta · Turno" };

export default function PaginaRegistro() {
  return <FormularioRegistro />;
}
