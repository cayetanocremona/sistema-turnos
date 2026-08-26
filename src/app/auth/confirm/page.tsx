"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { APP_NAME } from "@/lib/constants";

const VALID_TYPES: EmailOtpType[] = ["magiclink", "email", "signup", "recovery", "invite", "email_change"];

type Status = "idle" | "verifying" | "error";

/**
 * Reemplaza al viejo flujo de /auth/callback?code=... para el magic link.
 * Ver AGENTS.md "Fix del magic link (prefetch de Gmail)": la verificación
 * del token de un solo uso ahora requiere este click explícito -- así un
 * escaneo automático del link (que solo hace un GET a esta página) no lo
 * consume, y el token sigue disponible cuando el usuario clickea de verdad.
 */
export default function ConfirmLoginPage() {
  return (
    <Suspense>
      <ConfirmLoginContent />
    </Suspense>
  );
}

function ConfirmLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const tokenHash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const type = rawType && VALID_TYPES.includes(rawType as EmailOtpType) ? (rawType as EmailOtpType) : null;
  const tokenParams = tokenHash && type ? { tokenHash, type } : null;
  const linkInvalid = !tokenParams && status === "idle";

  async function handleConfirm() {
    if (!tokenParams) return;
    setStatus("verifying");
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenParams.tokenHash,
      type: tokenParams.type,
    });

    if (error) {
      setStatus("error");
      setError("Este link ya fue usado o expiró. Pedí uno nuevo desde el login.");
      return;
    }

    router.replace("/admin");
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-white text-neutral-900">
      <header className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        <Link href="/" className="text-base font-extrabold">
          {APP_NAME}
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 animate-fade-in-up flex-col justify-center px-4 py-12 sm:px-6">
        <Card className="p-8">
          <h1 className="text-2xl font-extrabold">Confirmar inicio de sesión</h1>

          {status === "error" || linkInvalid ? (
            <>
              <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error ?? "Este link no es válido."}
              </p>
              <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-neutral-600 hover:text-neutral-900">
                Volver al login
              </Link>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-neutral-500">
                Confirmá para terminar de iniciar sesión en tu cuenta.
              </p>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={status === "verifying" || !tokenParams}
                className="mt-6 w-full"
              >
                {status === "verifying" ? "Verificando..." : "Confirmar e iniciar sesión"}
              </Button>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}
