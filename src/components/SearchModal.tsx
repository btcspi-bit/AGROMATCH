"use client";

import { useEffect, useState } from "react";

export function SearchModal({ open, onClose, search, setSearch }: any) {
  const [draftSearch, setDraftSearch] = useState(search || "");

  useEffect(() => {
    if (open) {
      setDraftSearch(search || "");
    }
  }, [open, search]);

  if (!open) return null;

  function clearSearch() {
    setDraftSearch("");
    setSearch("");
  }

  function applySearch() {
    setSearch(draftSearch.trim());
    onClose();
  }

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} style={modal}>
        <h2 style={title}>Buscar oportunidades</h2>

        <p style={description}>
          Procure por cidade, raça, categoria, peso ou produtor.
        </p>

        <input
          autoFocus
          type="text"
          placeholder="Ex: Nelore, Marabá, bezerro..."
          value={draftSearch}
          onChange={(e) => setDraftSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              applySearch();
            }
          }}
          style={input}
        />

        {draftSearch && (
          <button type="button" onClick={clearSearch} style={clearButton}>
            Limpar busca
          </button>
        )}

        <button type="button" onClick={applySearch} style={mainButton}>
          Ver resultados
        </button>

        <button type="button" onClick={onClose} style={closeButton}>
          Fechar
        </button>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed" as const,
  inset: 0,
  background: "rgba(15,23,42,0.48)",
  zIndex: 9999,
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  padding: "72px 12px 0",
};

const modal = {
  width: "100%",
  maxWidth: "540px",
  background: "#ffffff",
  borderRadius: "24px",
  padding: "20px 16px 18px",
  margin: "0",
  boxShadow: "0 18px 46px rgba(15,23,42,0.18)",
};

const title = {
  fontSize: "22px",
  margin: "0 0 8px",
  color: "#111827",
  fontWeight: 800,
};

const description = {
  margin: "0 0 14px",
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: 1.45,
  fontWeight: 600,
};

const input = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "16px",
  borderRadius: "16px",
  border: "1px solid #d1d5db",
  outline: "none",
  fontSize: "16px",
  color: "#111827",
  fontWeight: 600,
};

const mainButton = {
  width: "100%",
  marginTop: "14px",
  padding: "15px",
  borderRadius: "16px",
  border: "none",
  background: "#166534",
  color: "#ffffff",
  fontWeight: 800,
  fontSize: "16px",
  cursor: "pointer",
  boxShadow: "0 10px 22px rgba(16,52,40,0.20)",
};

const clearButton = {
  width: "100%",
  marginTop: "12px",
  padding: "13px",
  borderRadius: "16px",
  border: "1px solid #cfe8d8",
  background: "#f6faf7",
  color: "#14532d",
  fontWeight: 800,
  cursor: "pointer",
};

const closeButton = {
  width: "100%",
  marginTop: "8px",
  padding: "12px",
  borderRadius: "16px",
  border: "none",
  background: "transparent",
  color: "#6b7280",
  fontWeight: 800,
  cursor: "pointer",
};