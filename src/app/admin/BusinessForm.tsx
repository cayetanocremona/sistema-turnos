"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { BusinessFormState } from "./actions";
import Button from "@/components/ui/Button";

export default function BusinessForm({
  action,
}: {
  action: (prevState: BusinessFormState, formData: FormData) => Promise<BusinessFormState>;
}) {
  const [state, formAction, isPending] = useActionState(action, { error: null });

  const fieldClass =
    "flex-1 rounded-xl border border-black/10 px-3.5 py-2.5 text-sm outline-none focus:border-[var(--brand-accent)]";

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input name="name" placeholder="Nombre del negocio" required className={fieldClass} />
        <input name="slug" placeholder="slug (ej: mi-negocio)" required className={fieldClass} />
      </div>
      <div>
        <input
          name="invite_code"
          placeholder="Código de invitación"
          required
          className={fieldClass}
        />
      </div>
      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creando..." : "Crear negocio"}
        </Button>
      </div>

      {state.error && (
        <p className="text-sm font-medium text-rose-600">
          {state.error}
          {state.needsLogin && (
            <>
              {" "}
              <Link href="/login" className="underline">
                Iniciar sesión
              </Link>
            </>
          )}
        </p>
      )}
    </form>
  );
}
