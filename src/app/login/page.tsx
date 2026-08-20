"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setStatus("error");
      setError(error.message);
      return;
    }

    setStatus("sent");
  }

  return (
    <main
      style={{
        maxWidth: 400,
        margin: "80px auto",
        fontFamily: "system-ui, sans-serif",
        padding: "0 16px",
      }}
    >
      <h1>Iniciar sesión</h1>
      <p style={{ color: "#666" }}>
        Ingresá tu email y te mandamos un link para entrar, sin contraseña.
      </p>

      {status === "sent" ? (
        <p>Revisá tu email — te mandamos un link de acceso.</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 8, margin: "16px 0" }}
        >
          <input
            type="email"
            name="email"
            placeholder="tu@email.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: 8 }}
          />
          <button
            type="submit"
            disabled={status === "sending"}
            style={{ padding: 8, cursor: "pointer" }}
          >
            {status === "sending" ? "Enviando..." : "Enviarme el link de acceso"}
          </button>

          {status === "error" && error && <p style={{ color: "red" }}>{error}</p>}
        </form>
      )}
    </main>
  );
}
