"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function prepareRecoverySession() {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
          window.history.replaceState({}, document.title, "/reset-password");
        }
      } finally {
        setCheckingSession(false);
      }
    }

    prepareRecoverySession();
  }, []);

  async function handleUpdatePassword() {
    if (password.length < 6) {
      alert("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      alert("As senhas não conferem.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      alert("Link inválido ou expirado. Solicite uma nova recuperação.");
      return;
    }

    alert("Senha alterada com sucesso. Agora entre normalmente.");
    window.location.href = "/";
  }

  return (
    <main style={page}>
      <div style={card}>
        <div style={icon}>🔐</div>

        <h1 style={title}>Criar nova senha</h1>

        <p style={text}>
          Digite uma nova senha para recuperar seu acesso ao AgroMatch.
        </p>

        {checkingSession ? (
          <p style={text}>Validando link de recuperação...</p>
        ) : (
          <>
            <input
              type="password"
              placeholder="Nova senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={input}
            />

            <input
              type="password"
              placeholder="Confirmar nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={input}
            />

            <button
              onClick={handleUpdatePassword}
              disabled={loading}
              style={{
                ...button,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Salvando..." : "Salvar nova senha"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}

const page = {
  minHeight: "100dvh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "18px",
  background: "#f9fafb",
};

const card = {
  width: "100%",
  maxWidth: "390px",
  background: "#ffffff",
  borderRadius: "28px",
  padding: "26px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
  textAlign: "center" as const,
};

const icon = {
  fontSize: "44px",
  marginBottom: "14px",
};

const title = {
  fontSize: "26px",
  fontWeight: 900,
  color: "#111827",
  marginBottom: "10px",
};

const text = {
  fontSize: "14px",
  color: "#6b7280",
  lineHeight: 1.5,
  marginBottom: "18px",
};

const input = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: "16px",
  padding: "14px",
  fontSize: "15px",
  marginBottom: "10px",
  boxSizing: "border-box" as const,
};

const button = {
  width: "100%",
  border: "none",
  borderRadius: "18px",
  padding: "15px",
  background: "#166534",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: 900,
  cursor: "pointer",
};