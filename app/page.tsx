import { redirect } from "next/navigation";

// Por ahora la raíz lleva al login (la landing de Turno viene después).
// Si ya hay sesión, proxy.ts manda de /login al panel.
export default function Inicio() {
  redirect("/login");
}
