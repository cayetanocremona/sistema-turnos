import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";

export default function ForbiddenPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-extrabold text-neutral-900">No tenés acceso a este negocio</h1>
      <p className="text-sm text-neutral-500">
        Este negocio no está asociado a tu cuenta. Si es un error, iniciá sesión con la cuenta
        correcta o volvé a tus propios negocios.
      </p>
      <Link href="/admin" className={buttonClassName("solid", "md", "mt-2")}>
        Ir a mis negocios
      </Link>
    </div>
  );
}
