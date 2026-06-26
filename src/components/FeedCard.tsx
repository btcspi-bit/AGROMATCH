import { useEffect, useMemo, useState } from "react";

const FALLBACK_LISTING_IMAGE = "/boi1.jpg";
const FALLBACK_PROFILE_IMAGE = "/profile_image1.jpg";

export function FeedCard({
  id,
  title,
  weight,
  quantity,
  city,
  distance,
  road,
  image,
  images,
  owner,
  verified,
  profile_image,
  farm,
  category,
  gender,
  breed,
  age,
  price,
  status,
  is_recent,
  is_highlighted,
  trust_score,
  account_label,
  whatsapp,
  onClick,
  onProfileClick,
}: any) {
  const safeTitle = title || "Lote sem título";
  const safeOwner = owner || "Anunciante";

  const isSold = status === "Vendido";
  const isPaused = status === "Pausado";

  const hasPhone = !!whatsapp;
  const hasProfile = !!owner && !!city && !!profile_image;
  const trustLevel = trust_score || 0;

  const galleryImages = Array.isArray(images)
    ? images.filter((item: string) => Boolean(item))
    : [];

  const coverImage = galleryImages[0] || image || FALLBACK_LISTING_IMAGE;
  const photoCount = galleryImages.length || (image ? 1 : 0);

  const recommendationKey = useMemo(() => {
    const safeId = id ? String(id) : `${safeTitle}-${city || "sem-cidade"}`;
    return `agromatch-recommendation-offer-${safeId}`;
  }, [id, safeTitle, city]);

  const [isRecommended, setIsRecommended] = useState(false);
  const [recommendationCount, setRecommendationCount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = window.localStorage.getItem(recommendationKey);

    if (saved === "true") {
      setIsRecommended(true);
      setRecommendationCount(1);
    } else {
      setIsRecommended(false);
      setRecommendationCount(0);
    }
  }, [recommendationKey]);

  function handleRecommend(event: any) {
    event.stopPropagation();

    if (typeof window === "undefined") return;

    const nextValue = !isRecommended;

    setIsRecommended(nextValue);
    setRecommendationCount(nextValue ? 1 : 0);
    window.localStorage.setItem(recommendationKey, nextValue ? "true" : "false");
  }

  async function handleShare(event: any) {
    event.stopPropagation();

    const shareTitle = `AgroMatch - ${safeTitle}`;
    const shareText = [
      "🐂 AgroMatch",
      "",
      safeTitle,
      breed ? `Raça: ${breed}` : "",
      weight ? `Peso médio: ${weight}` : "",
      quantity ? `Cabeças: ${quantity}` : "",
      city ? `Cidade: ${city}` : "",
      price ? `Valor: ${price}` : "",
      "",
      "Confira essa oportunidade no AgroMatch.",
    ]
      .filter(Boolean)
      .join("\n");

    const shareUrl = typeof window !== "undefined" ? window.location.href : "";

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert("Anúncio copiado para compartilhar.");
      }
    } catch (error) {
      console.error("Erro ao compartilhar anúncio:", error);
    }
  }

  return (
    <div
      onClick={onClick}
      style={{
        ...card,
        opacity: isPaused ? 0.62 : 1,
        border: is_highlighted
          ? "1.5px solid #16763a"
          : isSold
          ? "1px solid #9bd8ad"
          : "1px solid #e3ebe5",
      }}
    >
      <div style={imageBox}>
        <img
  src={coverImage}
  alt={safeTitle}
  loading="lazy"
  decoding="async"
  style={{
    ...mainImage,
    filter: isSold ? "brightness(0.72)" : "none",
  }}
  onError={(e) => {
    e.currentTarget.src = FALLBACK_LISTING_IMAGE;
  }}
/>

        {photoCount > 1 && <div style={photoCountBadge}>{photoCount} fotos</div>}

        <div style={topBadges}>
          {is_highlighted && <span style={highlightBadge}>Destaque</span>}
          {is_recent && <span style={recentBadge}>Novo</span>}
        </div>

        {isSold && <div style={soldOverlay}>Negócio realizado</div>}
        {isPaused && <div style={pausedOverlay}>Anúncio pausado</div>}
      </div>

      <div style={content}>
        <div style={profileRow}>
          <img
  src={profile_image || FALLBACK_PROFILE_IMAGE}
  alt={safeOwner}
  loading="lazy"
  decoding="async"
  onClick={(e) => {
    e.stopPropagation();
    onProfileClick?.();
  }}
  style={profileImageStyle}
  onError={(e) => {
    e.currentTarget.src = FALLBACK_PROFILE_IMAGE;
  }}
/>

          <div style={{ minWidth: 0, flex: 1 }}>
            <strong
              onClick={(e) => {
                e.stopPropagation();
                onProfileClick?.();
              }}
              style={ownerStyle}
            >
              {safeOwner} {verified ? "✅" : ""}
            </strong>

            {farm && <span style={farmStyle}>{farm}</span>}

            <span style={locationStyle}>
              {city || "Cidade não informada"}
              {distance ? ` • ${distance}` : ""}
            </span>
          </div>
        </div>

        <div style={statusLine}>
          <span style={isSold ? soldBadge : isPaused ? pausedBadge : activeBadge}>
            {isSold ? "Realizado" : isPaused ? "Pausado" : "Disponível"}
          </span>

          {trustLevel >= 3 && <span style={safeBadge}>Boa confiança</span>}
        </div>

        <h2 style={titleStyle}>{safeTitle}</h2>

        <p style={animalLine}>
          {breed || "Raça não informada"} • {gender || "Sexo não informado"} •{" "}
          {category || "Categoria não informada"}
        </p>

        <div style={chipsGrid}>
          <InfoChip label="Peso médio" value={weight || "—"} />
          <InfoChip label="Cabeças" value={quantity || "—"} />
          <InfoChip label="Idade" value={age || "—"} />
          <InfoChip label="Valor" value={price || "A combinar"} highlight />
        </div>

        <div style={trustRow}>
          {hasPhone && <span style={trustBadge}>WhatsApp informado</span>}
          {hasProfile && <span style={trustBadge}>Perfil completo</span>}
          {verified && <span style={trustBadge}>Verificado</span>}
          {account_label && <span style={trustBadge}>{account_label}</span>}
        </div>

        <div style={footerLine}>
          <span style={roadStyle}>
            {isSold
              ? "Esse lote já encontrou comprador"
              : road || "Acesso não informado"}
          </span>

          <span
            style={{
              ...hint,
              color: isSold ? "#145f35" : "#16763a",
            }}
          >
            {isSold ? "Ver" : "Detalhes"}
          </span>
        </div>

        {!isSold && !isPaused && (
        <div style={actionRow}>
          <button type="button" onClick={handleRecommend} style={actionButton}>
            {isRecommended ? "🤝 Recomendado" : "🤝 Recomendar"}
            {recommendationCount > 0 ? ` ${recommendationCount}` : ""}
          </button>

          <button type="button" onClick={handleShare} style={actionButton}>
            📤 Compartilhar
          </button>
        </div>
      )}
      </div>
    </div>
  );
}

function InfoChip({ label, value, highlight }: any) {
  return (
    <div style={highlight ? chipHighlight : chip}>
      <span style={chipLabel}>{label}</span>
      <strong style={chipValue}>{value}</strong>
    </div>
  );
}

const card = {
  background: "#ffffff",
  borderRadius: "22px",
  overflow: "hidden",
  marginBottom: "16px",
  boxShadow: "0 14px 32px rgba(15,52,40,0.08)",
  cursor: "pointer",
  position: "relative" as const,
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const imageBox = {
  width: "100%",
  aspectRatio: "1 / 1",
  background: "#f3f7f4",
  position: "relative" as const,
};

const mainImage = {
  width: "100%",
  height: "100%",
  objectFit: "cover" as const,
  display: "block",
};

const photoCountBadge = {
  position: "absolute" as const,
  right: "12px",
  top: "12px",
  zIndex: 3,
  background: "rgba(16,37,27,0.84)",
  color: "#ffffff",
  borderRadius: "999px",
  padding: "7px 11px",
  fontSize: "12px",
  fontWeight: 700,
  backdropFilter: "blur(8px)",
};

const topBadges = {
  position: "absolute" as const,
  left: "12px",
  top: "12px",
  display: "flex",
  gap: "8px",
  flexWrap: "wrap" as const,
  zIndex: 2,
};

const highlightBadge = {
  background: "#16763a",
  color: "#ffffff",
  borderRadius: "999px",
  padding: "7px 11px",
  fontSize: "12px",
  fontWeight: 700,
};

const recentBadge = {
  background: "#d97706",
  color: "#ffffff",
  borderRadius: "999px",
  padding: "7px 11px",
  fontSize: "12px",
  fontWeight: 700,
};

const soldOverlay = {
  position: "absolute" as const,
  left: "12px",
  top: "54px",
  right: "12px",
  background: "rgba(20,95,53,0.92)",
  color: "#ffffff",
  padding: "10px 12px",
  borderRadius: "15px",
  fontSize: "13px",
  fontWeight: 700,
  textAlign: "center" as const,
};

const pausedOverlay = {
  position: "absolute" as const,
  left: "12px",
  top: "54px",
  background: "rgba(202,138,4,0.95)",
  color: "#ffffff",
  padding: "8px 12px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 700,
};

const content = {
  padding: "16px",
};

const profileRow = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "10px",
};

const profileImageStyle = {
  width: "44px",
  height: "44px",
  borderRadius: "50%",
  objectFit: "cover" as const,
  cursor: "pointer",
  background: "#f3f7f4",
  border: "1px solid #e3ebe5",
  flexShrink: 0,
};

const ownerStyle = {
  display: "block",
  cursor: "pointer",
  fontSize: "14px",
  color: "#10251b",
  fontWeight: 700,
  whiteSpace: "nowrap" as const,
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const farmStyle = {
  display: "block",
  fontSize: "13px",
  color: "#33443a",
  fontWeight: 700,
  whiteSpace: "nowrap" as const,
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const locationStyle = {
  display: "block",
  fontSize: "13px",
  color: "#69766e",
  whiteSpace: "nowrap" as const,
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const statusLine = {
  marginBottom: "8px",
  display: "flex",
  gap: "8px",
  flexWrap: "wrap" as const,
};

const activeBadge = {
  display: "inline-block",
  background: "#e5f6ea",
  color: "#145f35",
  borderRadius: "999px",
  padding: "5px 10px",
  fontSize: "12px",
  fontWeight: 700,
};

const safeBadge = {
  ...activeBadge,
  background: "#eff6ff",
  color: "#1d4ed8",
};

const soldBadge = {
  ...activeBadge,
  background: "#eef8f1",
  color: "#145f35",
  border: "1px solid #9bd8ad",
};

const pausedBadge = {
  ...activeBadge,
  background: "#fef3c7",
  color: "#92400e",
};

const titleStyle = {
  margin: "0 0 6px",
  fontSize: "20px",
  fontWeight: 700,
  color: "#10251b",
  lineHeight: 1.15,
  wordBreak: "break-word" as const,
};

const animalLine = {
  margin: "0 0 14px",
  fontSize: "14px",
  color: "#33443a",
  fontWeight: 700,
  lineHeight: 1.35,
};

const chipsGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "9px",
  marginBottom: "12px",
};

const chip = {
  background: "#f8faf9",
  border: "1px solid #e3ebe5",
  borderRadius: "15px",
  padding: "11px",
  display: "flex",
  flexDirection: "column" as const,
  gap: "3px",
  color: "#10251b",
  minWidth: 0,
};

const chipHighlight = {
  ...chip,
  background: "#eef8f1",
  border: "1px solid #b9dfc4",
};

const chipLabel = {
  fontSize: "12px",
  color: "#69766e",
  fontWeight: 700,
};

const chipValue = {
  fontSize: "14px",
  fontWeight: 700,
  color: "#10251b",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
};

const trustRow = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "6px",
  marginBottom: "12px",
};

const trustBadge = {
  background: "#eef8f1",
  border: "1px solid #b9dfc4",
  color: "#145f35",
  borderRadius: "999px",
  padding: "5px 9px",
  fontSize: "11px",
  fontWeight: 700,
};

const actionRow = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "8px",
  marginTop: "12px",
  paddingTop: "12px",
  borderTop: "1px solid #eef3ef",
};

const actionButton = {
  border: "1px solid #b9dfc4",
  borderRadius: "999px",
  background: "#eef8f1",
  color: "#145f35",
  padding: "11px 8px",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
  touchAction: "manipulation",
};

const footerLine = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
};

const roadStyle = {
  color: "#10251b",
  fontSize: "14px",
  fontWeight: 700,
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
};

const hint = {
  fontSize: "13px",
  color: "#16763a",
  fontWeight: 700,
  whiteSpace: "nowrap" as const,
};