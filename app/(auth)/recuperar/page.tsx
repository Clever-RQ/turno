import type { Metadata } from "next";
import { FormularioRecuperar } from "./formulario";

export const metadata: Metadata = { title: "Recuperar contraseña · Turno" };

export default function PaginaRecuperar() {
  return <FormularioRecuperar />;
}
