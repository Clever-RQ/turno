import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function LayoutLegal({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-8">
      <Link href="/login" aria-label="Turno, ir a iniciar sesión">
        <Logo className="h-8 w-auto" />
      </Link>
      <article className="mt-10 space-y-5 leading-relaxed text-white/80 [&_h1]:font-titulo [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:text-white [&_h2]:mt-8 [&_h2]:font-titulo [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-white [&_li]:ml-5 [&_li]:list-disc">
        {children}
      </article>
    </div>
  );
}
