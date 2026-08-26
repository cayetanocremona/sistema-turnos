"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { APP_NAME } from "@/lib/constants";

const fieldClass =
  "rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-[var(--brand-accent)]";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    // Sin emailRedirectTo: el link del mail ya no apunta a /auth/callback
    // (flujo PKCE viejo) -- ahora usa el template de Supabase con
    // token_hash, que resuelve en /auth/confirm. Ver AGENTS.md "Fix del
    // magic link (prefetch de Gmail)".
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) {
      setStatus("error");
      setError(error.message);
      return;
    }

    setStatus("sent");
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
          <h1 className="text-2xl font-extrabold">Iniciar sesión</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Ingresá tu email y te mandamos un link para entrar, sin contraseña.
          </p>

          {status === "sent" ? (
            <p className="mt-6 rounded-xl bg-black/[0.03] px-4 py-3 text-sm text-neutral-700">
              Revisá tu email — te mandamos un link de acceso.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
              <input
                type="email"
                name="email"
                placeholder="tu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass}
              />
              <Button type="submit" disabled={status === "sending"} className="w-full">
                {status === "sending" ? "Enviando..." : "Enviarme el link de acceso"}
              </Button>

              {status === "error" && error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
              )}
            </form>
          )}
        </Card>
      </main>
    </div>
  );
}
