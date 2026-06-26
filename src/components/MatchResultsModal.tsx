"use client";

import { useEffect, useMemo } from "react";
import type { CSSProperties } from "react";
import type { MatchResult } from "@/types/match";

type MatchResultsModalProps = {
  open: boolean;
  matches: MatchResult[];
  onClose: () => void;
  onViewLater?: () => void;
  onOpenListing: (listing: MatchResult["listing"]) => void;
  onOpenWhatsApp: (listing: MatchResult["listing"]) => void;
};

function getMatchLabel(score: number) {
  if (score >= 85) {
    return {
      text: "🔥 Muito compatível",
      description: "Bem próximo do que você procura.",
      style: highMatchBadge,
    };
  }

  if (score >= 70) {
    return {
      text: "🤝 Boa oportunidade",
      description: "Pode encaixar bem na negociação.",
      style: goodMatchBadge,
    };
  }

  return {
    text: "👀 Pode valer a pena",
    description: "Não é perfeito, mas merece avaliação.",
    style: possibleMatchBadge,
  };
}

export function MatchResultsModal({
  open,
  matches,
  onClose,
  onViewLater,
  onOpenListing,
  onOpenWhatsApp,
}: MatchResultsModalProps) {
  const visibleMatches = useMemo(() => {
    return matches.slice(0, 5);
  }, [matches]);

  useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      document.body.style.overflow = "";

      window.scrollTo(0, scrollY);
    };
  }, [open]);

  if (!open) return null;

  const hasMatches = visibleMatches.length > 0;

  function handleViewLater() {
    if (onViewLater) {
      onViewLater();
      return;
    }

    onClose();
  }

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={(event) => event.stopPropagation()} style={sheet}>
        <div style={handleBar} />

        <div style={header}>
          <strong style={title}>
            {hasMatches
              ? "Encontramos oportunidades para você."
              : "Sua publicação está ativa."}
          </strong>

          <p style={subtitle}>
            {hasMatches
              ? "O AgroMatch classificou as opções pela proximidade com sua necessidade."
              : "Vamos buscar oportunidades compatíveis para você."}
          </p>
        </div>

        <div style={content}>
          {visibleMatches.map(({ listing, score }) => {
            const matchLabel = getMatchLabel(Number(score || 0));

            return (
              <div key={`${listing.post_type}-${listing.id}`} style={matchCard}>
                <div style={matchHeader}>
                  <span style={matchLabel.style}>{matchLabel.text}</span>
                  <small style={matchDescription}>
                    {matchLabel.description}
                  </small>
                </div>

                <strong style={listingTitle}>{listing.title}</strong>

                <p style={listingMeta}>
                  {listing.category || "Categoria não informada"} ·{" "}
                  {listing.gender || "Gênero não informado"} ·{" "}
                  {listing.weight || "Peso não informado"}
                </p>

                <p style={listingLocation}>
                  {listing.city || "Cidade não informada"}
                  {listing.price ? ` · ${listing.price}` : ""}
                </p>

                <div style={actions}>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenListing(listing);
                    }}
                    style={detailsButton}
                  >
                    Ver detalhes
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenWhatsApp(listing);
                    }}
                    style={whatsappButton}
                  >
                    WhatsApp
                  </button>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleViewLater();
            }}
            style={laterButton}
          >
            Ver depois
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  background: "rgba(15,23,42,0.50)",
  touchAction: "none",
};

const sheet: CSSProperties = {
  width: "100%",
  maxWidth: "560px",
  maxHeight: "88dvh",
  background: "#ffffff",
  borderRadius: "26px 26px 0 0",
  padding: "12px 16px 18px",
  boxShadow: "0 -18px 46px rgba(15,23,42,0.22)",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  touchAction: "auto",
};

const handleBar: CSSProperties = {
  width: "44px",
  height: "5px",
  borderRadius: "999px",
  background: "#d1d5db",
  margin: "0 auto 14px",
  flexShrink: 0,
};

const header: CSSProperties = {
  marginBottom: "14px",
  flexShrink: 0,
};

const title: CSSProperties = {
  display: "block",
  fontSize: "18px",
  color: "#111827",
  fontWeight: 600,
  marginBottom: "6px",
};

const subtitle: CSSProperties = {
  margin: 0,
  fontSize: "14px",
  color: "#6b7280",
  lineHeight: 1.45,
  fontWeight: 600,
};

const content: CSSProperties = {
  overflowY: "auto",
  overscrollBehavior: "contain",
  WebkitOverflowScrolling: "touch",
  paddingBottom: "4px",
};

const matchCard: CSSProperties = {
  border: "1px solid #e7eee9",
  borderRadius: "18px",
  padding: "14px",
  marginBottom: "12px",
  background: "#ffffff",
};

const matchHeader: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "5px",
  marginBottom: "10px",
};

const highMatchBadge: CSSProperties = {
  display: "inline-block",
  borderRadius: "999px",
  padding: "6px 10px",
  background: "#eef8f1",
  color: "#14532d",
  fontSize: "12px",
  fontWeight: 600,
};

const goodMatchBadge: CSSProperties = {
  ...highMatchBadge,
  background: "#eef6ff",
  color: "#1d4ed8",
};

const possibleMatchBadge: CSSProperties = {
  ...highMatchBadge,
  background: "#fff7db",
  color: "#92400e",
};

const matchDescription: CSSProperties = {
  fontSize: "12px",
  color: "#6b7280",
  fontWeight: 600,
};

const listingTitle: CSSProperties = {
  display: "block",
  fontSize: "15px",
  color: "#111827",
  fontWeight: 600,
  marginBottom: "6px",
};

const listingMeta: CSSProperties = {
  margin: "0 0 10px",
  fontSize: "13px",
  color: "#6b7280",
  fontWeight: 600,
  lineHeight: 1.45,
};

const listingLocation: CSSProperties = {
  margin: "0 0 12px",
  fontSize: "13px",
  color: "#374151",
  fontWeight: 600,
};

const actions: CSSProperties = {
  display: "flex",
  gap: "10px",
};

const detailsButton: CSSProperties = {
  flex: 1,
  border: "1px solid #cfe8d8",
  borderRadius: "14px",
  padding: "11px",
  background: "#eef8f1",
  color: "#14532d",
  fontWeight: 600,
  cursor: "pointer",
  touchAction: "manipulation",
};

const whatsappButton: CSSProperties = {
  flex: 1,
  border: "none",
  borderRadius: "14px",
  padding: "11px",
  background: "#166534",
  color: "#ffffff",
  fontWeight: 600,
  cursor: "pointer",
  touchAction: "manipulation",
};

const laterButton: CSSProperties = {
  width: "100%",
  marginTop: "6px",
  border: "1px solid #e7eee9",
  borderRadius: "16px",
  padding: "13px",
  background: "#ffffff",
  color: "#374151",
  fontWeight: 600,
  cursor: "pointer",
  touchAction: "manipulation",
};
