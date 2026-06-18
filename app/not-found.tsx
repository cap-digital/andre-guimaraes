import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-navy px-6 text-center">
      <Compass className="h-10 w-10 text-cyan-light" />
      <h1 className="text-2xl font-semibold text-white">Página não encontrada</h1>
      <p className="max-w-sm text-sm text-white/60">
        O endereço acessado não existe ou foi movido.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-white/90"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
