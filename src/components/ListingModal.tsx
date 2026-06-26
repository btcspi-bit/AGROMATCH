import { useEffect, useState } from "react";

type ListingStatus = "Disponível" | "Pausado" | "Vendido";

export function ListingModal({
  open,
  onClose,
  title,
  image,
  images,
  weight,
  quantity,
  city,
  road,
  category,
  gender,
  breed,
  age,
  price,
  owner,
  status,
  isOwner,
  isActionLoading,
  onEdit,
  onChangeStatus,
  onDelete,
  onWhatsApp,
}: any) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const galleryImages = Array.isArray(images)
    ? images.filter((item: string) => Boolean(item))
    : [];

  const normalizedImages =
    galleryImages.length > 0 ? galleryImages : [image || "/boi1.jpg"];

  const currentImage =
    normalizedImages[currentImageIndex] || normalizedImages[0] || "/boi1.jpg";

  const hasMultipleImages = normalizedImages.length > 1;
  useEffect(() => {
  if (currentImageIndex > normalizedImages.length - 1) {
    setCurrentImageIndex(0);
  }
}, [currentImageIndex, normalizedImages.length]);

  if (!open) return null;

  const isSold = status === "Vendido";
  const isPaused = status === "Pausado";
  const isAvailable = !status || status === "Disponível";

  function goToPreviousImage(event: any) {
    event.stopPropagation();

    setCurrentImageIndex((current) =>
      current === 0 ? normalizedImages.length - 1 : current - 1
    );
  }

  function goToNextImage(event: any) {
    event.stopPropagation();

    setCurrentImageIndex((current) =>
      current === normalizedImages.length - 1 ? 0 : current + 1
    );
  }

  function handleSold() {
    const confirmed = window.confirm(
      "Marcar este lote como vendido? Depois disso, ele ficará como negócio concluído."
    );

    if (!confirmed) return;

    onChangeStatus?.("Vendido");
  }

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} style={modal}>
        <div style={imageBox}>
          <img
  src={currentImage}
  alt={title || "Lote"}
  loading="eager"
  decoding="async"
  style={{
    ...imageStyle,
    filter: isSold ? "brightness(0.72)" : "none",
  }}
  onError={(e) => {
    e.currentTarget.src = "/boi1.jpg";
  }}
/>

          {hasMultipleImages && (
            <>
              <button type="button" onClick={goToPreviousImage} style={leftArrowButton}>
                ‹
              </button>

              <button type="button" onClick={goToNextImage} style={rightArrowButton}>
                ›
              </button>

              <div style={photoCounter}>
                {currentImageIndex + 1} / {normalizedImages.length}
              </div>

              <div style={dotsRow}>
                {normalizedImages.map((item: string, index: number) => (
                  <button
                    key={`${item}-${index}`}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    style={{
                      ...dot,
                      opacity: index === currentImageIndex ? 1 : 0.45,
                      transform:
                        index === currentImageIndex ? "scale(1.2)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {isSold && <div style={soldOverlay}>Negócio realizado</div>}
          {isPaused && <div style={pausedOverlay}>Anúncio pausado</div>}
        </div>

        <div style={content}>
          <span style={isSold ? soldBadge : isPaused ? pausedBadge : badge}>
            {isSold ? "Lote vendido" : isPaused ? "Pausado" : "Oferta de venda"}
          </span>

          <h2 style={titleStyle}>{title || "Lote sem título"}</h2>

          <div style={summaryBox}>
            <strong style={animalLine}>
              {breed || "Raça não informada"} • {gender || "Sexo não informado"} •{" "}
              {category || "Categoria não informada"}
            </strong>

            <span style={cityLine}>📍 {city || "Cidade não informada"}</span>
          </div>

          {isSold && (
            <div style={successBox}>
              <strong>Esse lote já encontrou comprador.</strong>
              <p style={successText}>Novos negócios continuam acontecendo no AgroMatch.</p>
            </div>
          )}

          {isPaused && (
            <div style={pausedBox}>
              Esse anúncio foi pausado temporariamente pelo anunciante.
            </div>
          )}

          <div style={grid}>
            <Info label="Peso médio" value={weight || "—"} />
            <Info label="Cabeças" value={quantity || "—"} />
            <Info label="Idade" value={age || "—"} />
            <Info label="Valor" value={price || "A combinar"} highlight />
          </div>

          <Section title="Informações do lote">
            <InfoLine label="Raça" value={breed || "Não informada"} />
            <InfoLine label="Sexo" value={gender || "Não informado"} />
            <InfoLine label="Categoria" value={category || "Não informada"} />
            <InfoLine label="Peso médio" value={weight || "Não informado"} />
            <InfoLine label="Quantidade" value={`${quantity || "—"} cabeças`} />
            <InfoLine label="Idade" value={age || "Não informada"} />
          </Section>

          <Section title="Localização e acesso">
            <InfoLine label="Cidade" value={city || "Não informada"} />
            <InfoLine label="Acesso" value={road || "Não informado"} />
          </Section>

          <Section title="Negociação">
            <InfoLine label="Valor" value={price || "A combinar"} />
            <InfoLine label="Anunciante" value={owner || "Não informado"} />
            <InfoLine
              label="Status"
              value={isSold ? "Vendido" : isPaused ? "Pausado" : "Disponível"}
            />
          </Section>

          {isOwner && (
            <Section title={isSold ? "Negócio concluído ✅" : "Gerenciar anúncio"}>
              {isSold ? (
                <div style={doneBox}>
                  <strong>Venda concluída</strong>
                  <span>Esse lote foi marcado como vendido e agora fica como histórico.</span>
                </div>
              ) : (
                <>
                  <button disabled={isActionLoading} onClick={onEdit} style={editButton}>
                    ✏️ Editar anúncio
                  </button>

                  <div style={statusGrid}>
                    <button
                      disabled={isActionLoading}
                      onClick={() => onChangeStatus?.("Disponível" as ListingStatus)}
                      style={{
                        ...statusButton,
                        ...(isAvailable ? activeAvailableButton : {}),
                      }}
                    >
                      Ativo
                    </button>

                    <button
                      disabled={isActionLoading}
                      onClick={() => onChangeStatus?.("Pausado" as ListingStatus)}
                      style={{
                        ...statusButton,
                        ...(isPaused ? activePausedButton : {}),
                      }}
                    >
                      Pausar
                    </button>

                    <button disabled={isActionLoading} onClick={handleSold} style={statusButton}>
                      Vendido
                    </button>
                  </div>
                </>
              )}

              <button disabled={isActionLoading} onClick={onDelete} style={deleteButton}>
                Excluir anúncio
              </button>
            </Section>
          )}

          {!isOwner && !isSold && !isPaused && (
            <button onClick={onWhatsApp} style={whatsappButton}>
              Tenho interesse nesse lote
            </button>
          )}

          <button onClick={onClose} style={closeButton}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, highlight }: any) {
  return (
    <div style={highlight ? infoHighlight : infoBox}>
      <span style={infoLabel}>{label}</span>
      <strong style={infoValue}>{value}</strong>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div style={section}>
      <h3 style={sectionTitle}>{title}</h3>
      {children}
    </div>
  );
}

function InfoLine({ label, value }: any) {
  return (
    <div style={infoLine}>
      <span style={lineLabel}>{label}</span>
      <strong style={lineValue}>{value}</strong>
    </div>
  );
}

const overlay = {
  position: "fixed" as const,
  inset: 0,
  background: "rgba(15,23,42,0.50)",
  zIndex: 9999,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  overflow: "hidden",
  backdropFilter: "blur(2px)",
};

const modal = {
  width: "100%",
  maxWidth: "560px",
  maxHeight: "94dvh",
  background: "#ffffff",
  borderRadius: "28px 28px 0 0",
  overflowY: "auto" as const,
  overscrollBehavior: "contain" as const,
  boxShadow: "0 -18px 44px rgba(15,23,42,0.22)",
};

const imageBox = {
  width: "100%",
  aspectRatio: "1 / 1",
  background: "#f6faf7",
  position: "relative" as const,
  overflow: "hidden",
};

const imageStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover" as const,
  display: "block",
};

const leftArrowButton = {
  position: "absolute" as const,
  left: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  width: "42px",
  height: "42px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.20)",
  background: "rgba(15,23,42,0.62)",
  color: "#ffffff",
  fontSize: "32px",
  lineHeight: "38px",
  fontWeight: 700,
  cursor: "pointer",
  zIndex: 5,
  backdropFilter: "blur(8px)",
};

const rightArrowButton = {
  ...leftArrowButton,
  left: "auto",
  right: "12px",
};

const photoCounter = {
  position: "absolute" as const,
  right: "14px",
  top: "14px",
  zIndex: 5,
  background: "rgba(15,23,42,0.70)",
  color: "#ffffff",
  borderRadius: "999px",
  padding: "7px 11px",
  fontSize: "12px",
  fontWeight: 750,
  backdropFilter: "blur(8px)",
};

const dotsRow = {
  position: "absolute" as const,
  left: 0,
  right: 0,
  bottom: "14px",
  zIndex: 5,
  display: "flex",
  justifyContent: "center",
  gap: "8px",
};

const dot = {
  width: "9px",
  height: "9px",
  borderRadius: "999px",
  border: "none",
  background: "#ffffff",
  padding: 0,
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(0,0,0,0.20)",
};

const soldOverlay = {
  position: "absolute" as const,
  left: "14px",
  right: "14px",
  top: "14px",
  background: "rgba(20,83,45,0.92)",
  color: "#ffffff",
  borderRadius: "16px",
  padding: "12px",
  fontWeight: 800,
  textAlign: "center" as const,
  fontSize: "14px",
  backdropFilter: "blur(8px)",
};

const pausedOverlay = {
  position: "absolute" as const,
  left: "14px",
  top: "14px",
  background: "rgba(138,75,19,0.92)",
  color: "#ffffff",
  borderRadius: "999px",
  padding: "8px 14px",
  fontWeight: 800,
  fontSize: "12px",
  backdropFilter: "blur(8px)",
};

const content = {
  padding: "20px 16px 30px",
};

const badge = {
  display: "inline-block",
  background: "#e7f6ec",
  color: "#14532d",
  borderRadius: "999px",
  padding: "6px 10px",
  fontSize: "12px",
  fontWeight: 750,
  marginBottom: "10px",
};

const soldBadge = {
  ...badge,
  background: "#eefaf2",
  color: "#14532d",
  border: "1px solid #b7e5c2",
};

const pausedBadge = {
  ...badge,
  background: "#fff7df",
  color: "#8a4b13",
};

const titleStyle = {
  fontSize: "24px",
  lineHeight: 1.15,
  margin: "0 0 14px",
  color: "#102019",
  fontWeight: 850,
  letterSpacing: "-0.35px",
  wordBreak: "break-word" as const,
};

const summaryBox = {
  background: "#f8faf9",
  border: "1px solid #e4ebe6",
  borderRadius: "18px",
  padding: "14px",
  marginBottom: "14px",
};

const animalLine = {
  display: "block",
  fontSize: "15px",
  color: "#102019",
  marginBottom: "8px",
  fontWeight: 750,
};

const cityLine = {
  fontSize: "14px",
  color: "#647067",
  fontWeight: 650,
};

const successBox = {
  background: "#eefaf2",
  border: "1px solid #b7e5c2",
  borderRadius: "18px",
  padding: "16px",
  marginBottom: "16px",
  color: "#14532d",
};

const successText = {
  margin: "6px 0 0",
  fontSize: "14px",
  lineHeight: 1.5,
};

const pausedBox = {
  background: "#fff7df",
  border: "1px solid #f4d78c",
  borderRadius: "18px",
  padding: "16px",
  marginBottom: "16px",
  color: "#8a4b13",
  fontWeight: 700,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
  marginBottom: "16px",
};

const infoBox = {
  border: "1px solid #e4ebe6",
  borderRadius: "15px",
  padding: "12px",
  background: "#ffffff",
};

const infoHighlight = {
  ...infoBox,
  background: "#eefaf2",
  border: "1px solid #c7ead0",
};

const infoLabel = {
  display: "block",
  color: "#647067",
  fontSize: "12px",
  fontWeight: 700,
  marginBottom: "4px",
};

const infoValue = {
  color: "#102019",
  fontSize: "15px",
  fontWeight: 800,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
};

const section = {
  border: "1px solid #e4ebe6",
  borderRadius: "18px",
  padding: "14px",
  marginBottom: "12px",
  background: "#ffffff",
  boxShadow: "0 4px 14px rgba(15,23,42,0.025)",
};

const sectionTitle = {
  margin: "0 0 10px",
  fontSize: "16px",
  fontWeight: 800,
  color: "#102019",
  letterSpacing: "-0.2px",
};

const infoLine = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "9px 0",
  borderTop: "1px solid #eef3ef",
};

const lineLabel = {
  color: "#647067",
  fontSize: "14px",
  fontWeight: 650,
};

const lineValue = {
  color: "#102019",
  fontSize: "14px",
  fontWeight: 750,
  textAlign: "right" as const,
};

const whatsappButton = {
  width: "100%",
  marginTop: "12px",
  background: "#146c3a",
  color: "#ffffff",
  textAlign: "center" as const,
  padding: "16px",
  borderRadius: "16px",
  border: "none",
  fontWeight: 800,
  fontSize: "16px",
  cursor: "pointer",
  boxShadow: "0 10px 22px rgba(20,108,58,0.20)",
};

const editButton = {
  width: "100%",
  border: "none",
  borderRadius: "14px",
  padding: "13px",
  background: "#14532d",
  color: "#ffffff",
  fontWeight: 800,
  cursor: "pointer",
  marginBottom: "10px",
};

const statusGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: "8px",
  marginBottom: "10px",
};

const statusButton = {
  border: "1px solid #c7ead0",
  borderRadius: "12px",
  padding: "11px 8px",
  background: "#f3fbf5",
  color: "#14532d",
  fontWeight: 750,
  cursor: "pointer",
};

const activeAvailableButton = {
  background: "#14532d",
  color: "#ffffff",
  border: "1px solid #14532d",
};

const activePausedButton = {
  background: "#d9901e",
  color: "#ffffff",
  border: "1px solid #d9901e",
};

const doneBox = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "4px",
  marginBottom: "10px",
  padding: "13px",
  borderRadius: "14px",
  background: "#eefaf2",
  border: "1px solid #b7e5c2",
  color: "#14532d",
  fontSize: "13px",
  fontWeight: 700,
};

const deleteButton = {
  width: "100%",
  border: "none",
  borderRadius: "14px",
  padding: "12px",
  background: "#fff1f1",
  color: "#9f1d1d",
  fontWeight: 800,
  cursor: "pointer",
};

const closeButton = {
  width: "100%",
  marginTop: "10px",
  background: "transparent",
  border: "none",
  padding: "12px",
  color: "#647067",
  fontWeight: 700,
  cursor: "pointer",
};