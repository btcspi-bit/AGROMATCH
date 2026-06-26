"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  userEmail?: string | null;
};

export function AuthModal({ open, onClose, userEmail }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (!open) return null;

  function validateEmail() {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      alert("Informe o email cadastrado na sua conta.");
      return null;
    }

    return cleanEmail;
  }

  async function entrar() {
    const cleanEmail = validateEmail();
    if (!cleanEmail) return;

    if (!password || password.length < 6) {
      alert("Informe sua senha.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      alert("Email ou senha incorretos.");
      return;
    }

    alert("Login realizado.");
    onClose();
  }

  async function cadastrar() {
    const cleanEmail = validateEmail();
    if (!cleanEmail) return;

    if (!password || password.length < 6) {
      alert("Crie uma senha com pelo menos 6 caracteres.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Conta criada com sucesso. Se necessário, confirme pelo email.");
  }

  async function recuperarSenha() {
    const cleanEmail = validateEmail();
    if (!cleanEmail) return;

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      alert("Não foi possível enviar a recuperação. Verifique o email.");
      return;
    }

    alert("Enviamos um link de recuperação para seu email.");
  }

  async function sair() {
    await supabase.auth.signOut();
    alert("Sessão encerrada.");
    onClose();
  }

  return (
    <div style={overlay}>
      <div style={modal}>
        <button onClick={onClose} style={closeTopButton}>
          Fechar
        </button>

        {userEmail ? (
          <div>
            <h2 style={title}>Minha conta</h2>

            <p style={description}>Você está conectado ao AgroMatch.</p>

            <div style={accountBox}>
              <span style={accountLabel}>Email conectado</span>
              <p style={accountEmail}>{userEmail}</p>
            </div>

            <button onClick={sair} style={dangerButton}>
              Sair da conta
            </button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: "18px" }}>
              <p style={eyebrow}>ACESSO AGROMATCH</p>

              <h2 style={title}>Entre para publicar e negociar</h2>

              <p style={description}>
                Use sua conta para publicar oportunidades, responder compradores
                e manter suas negociações organizadas.
              </p>
            </div>

            <div style={inputGroup}>
              <input
                placeholder="Seu email cadastrado"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={input}
              />

              <input
                placeholder="Sua senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={input}
              />
            </div>

            <button onClick={entrar} style={primaryButton}>
              Entrar na conta
            </button>

            <button onClick={cadastrar} style={secondaryButton}>
              Criar nova conta
            </button>

            <button onClick={recuperarSenha} style={linkButton}>
              Esqueci minha senha
            </button>

            <p style={footerText}>
              Seu acesso fica salvo neste aparelho. Você pode sair da conta pelo
              botão de perfil.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed" as const,
  inset: 0,
  zIndex: 9999,
  background: "rgba(0,0,0,0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "18px",
};

const modal = {
  width: "100%",
  maxWidth: "390px",
  background: "#ffffff",
  borderRadius: "28px",
  padding: "22px",
  boxShadow: "0 24px 70px rgba(0,0,0,0.25)",
};

const closeTopButton = {
  border: "none",
  background: "#f3f4f6",
  borderRadius: "999px",
  padding: "8px 12px",
  fontWeight: 800,
  cursor: "pointer",
  marginBottom: "18px",
};

const eyebrow = {
  fontSize: "13px",
  color: "#166534",
  fontWeight: 900,
  marginBottom: "6px",
};

const title = {
  fontSize: "25px",
  fontWeight: 900,
  color: "#111827",
  lineHeight: 1.1,
  marginBottom: "8px",
};

const description = {
  fontSize: "14px",
  color: "#6b7280",
  lineHeight: 1.45,
  marginBottom: "18px",
};

const inputGroup = {
  display: "grid",
  gap: "10px",
  marginBottom: "14px",
};

const input = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: "16px",
  padding: "14px",
  fontSize: "15px",
  outline: "none",
  boxSizing: "border-box" as const,
};

const primaryButton = {
  width: "100%",
  border: "none",
  background: "#166534",
  color: "#ffffff",
  borderRadius: "18px",
  padding: "15px",
  fontSize: "16px",
  fontWeight: 900,
  cursor: "pointer",
  marginBottom: "10px",
};

const secondaryButton = {
  width: "100%",
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#111827",
  borderRadius: "18px",
  padding: "14px",
  fontSize: "15px",
  fontWeight: 900,
  cursor: "pointer",
  marginBottom: "10px",
};

const linkButton = {
  width: "100%",
  border: "none",
  background: "transparent",
  color: "#166534",
  padding: "10px",
  fontSize: "14px",
  fontWeight: 900,
  cursor: "pointer",
};

const footerText = {
  fontSize: "12px",
  color: "#6b7280",
  textAlign: "center" as const,
  marginTop: "14px",
  lineHeight: 1.4,
};

const accountBox = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "14px",
  marginBottom: "18px",
};

const accountLabel = {
  fontSize: "12px",
  color: "#6b7280",
};

const accountEmail = {
  fontWeight: 800,
  marginTop: 4,
};

const dangerButton = {
  width: "100%",
  border: "none",
  background: "#dc2626",
  color: "#ffffff",
  borderRadius: "18px",
  padding: "14px",
  fontWeight: 900,
  cursor: "pointer",
};