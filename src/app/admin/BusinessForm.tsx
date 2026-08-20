"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { BusinessFormState } from "./actions";

export default function BusinessForm({
  action,
}: {
  action: (prevState: BusinessFormState, formData: FormData) => Promise<BusinessFormState>;
}) {
  const [state, formAction, isPending] = useActionState(action, { error: null });

  return (
    <form
      action={formAction}
      style={{ display: "flex", flexDirection: "column", gap: 8, margin: "16px 0" }}
    >
      <input name="name" placeholder="Nombre del negocio" required style={{ padding: 8 }} />
      <input name="slug" placeholder="slug (ej: mi-negocio)" required style={{ padding: 8 }} />
      <button type="submit" disabled={isPending} style={{ padding: 8, cursor: "pointer" }}>
        {isPending ? "Creando..." : "Crear negocio"}
      </button>

      {state.error && (
        <p style={{ color: "red" }}>
          {state.error}
          {state.needsLogin && (
            <>
              {" "}
              <Link href="/login">Iniciar sesión</Link>
            </>
          )}
        </p>
      )}
    </form>
  );
}
