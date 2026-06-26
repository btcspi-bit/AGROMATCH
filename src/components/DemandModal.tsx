type ListingStatus = "Disponível" | "Pausado" | "Vendido";

export function DemandModal({
  open,
  onClose,
  title,
  weight,
  quantity,
  city,
  distance,
  road,
  owner,
  category,
  gender,
  breed,
  age,
  price,
  status,
  isOwner,
  isActionLoading,
  onEdit,
  onChangeStatus,
  onDelete,
  onWhatsApp,
}: any) {
  if (!open) return null;

  const isDone = status === "Vendido";
  const isPaused = status === "Pausado";
  const isActive = !status || status === "Disponível";

  function handleDone() {
    const confirmed = window.confirm(
      "Marcar esta compra como atendida? Depois disso, ela sai das oportunidades ativas e fica no histórico."
    );

    if (!confirmed) return;

    onChangeStatus?.("Vendido" as ListingStatus);
  }

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} style={modal}>
        <div style={content}>
          <span style={isDone ? doneBadge : isPaused ? pausedBadge : badge}>
            {isDone ? "Compra atendida" : isPaused ? "Pausada" : "Pedido de compra"}
          </span>

          <h2 style={titleStyle}>{title || "Compra sem título"}</h2>

          <div style={summaryBox}>
            <strong style={animalLine}>
              {breed || "Raça aberta"} • {gender || "Sexo aberto"} •{" "}
              {category || "Categoria aberta"}
            </strong>

            <span style={cityLine}>📍 {city || "Cidade não informada"}</span>
          </div>

          {isDone && (
            <div style={successBox}>
              <strong>Essa compra já foi atendida.</strong>
              <p style={successText}>
                Ela saiu das oportunidades ativas e agora fica salva no histórico.
              </p>
            </div>
          )}

          {isPaused && (
            <div style={pausedBox}>
              Esse comprador pausou temporariamente essa procura.
            </div>
          )}

          <div style={grid}>
            <Info label="Peso médio" value={weight || "—"} />
            <Info label="Cabeças" value={quantity || "—"} />
            <Info label="Idade" value={age || "—"} />
            <Info label="Valor" value={price || "A combinar"} highlight />
          </div>

          <Section title="O que o comprador procura">
            <InfoLine label="Raça" value={breed || "Aberta"} />
            <InfoLine label="Sexo" value={gender || "Aberto"} />
            <InfoLine label="Categoria" value={category || "Aberta"} />
            <InfoLine label="Peso médio" value={weight || "Não informado"} />
            <InfoLine label="Quantidade" value={`${quantity || "—"} cabeças`} />
            <InfoLine label="Idade" value={age || "Não informada"} />
          </Section>

          <Section title="Localização da compra">
            <InfoLine label="Cidade" value={city || "Não informada"} />
            <InfoLine label="Raio de compra" value={distance || "Não informado"} />
            <InfoLine label="Condição" value={road || distance || "Não informada"} />
          </Section>

          <Section title="Negociação">
            <InfoLine label="Valor" value={price || "A combinar"} />
            <InfoLine label="Comprador" value={owner || "Não informado"} />
            <InfoLine
              label="Status"
              value={isDone ? "Atendida" : isPaused ? "Pausada" : "Ativa"}
            />
          </Section>

          {isOwner && (
            <Section title={isDone ? "Compra atendida ✅" : "Gerenciar procura"}>
              {isDone ? (
                <div style={doneBox}>
                  <strong>Compra concluída</strong>
                  <span>Essa procura foi marcada como atendida e fica como histórico.</span>
                </div>
              ) : (
                <>
                  <button disabled={isActionLoading} onClick={onEdit} style={editButton}>
                    ✏️ Editar procura
                  </button>

                  <div style={statusGrid}>
                    <button
                      disabled={isActionLoading}
                      onClick={() => onChangeStatus?.("Disponível" as ListingStatus)}
                      style={{
                        ...statusButton,
                        ...(isActive ? activeAvailableButton : {}),
                      }}
                    >
                      Ativa
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

                    <button disabled={isActionLoading} onClick={handleDone} style={statusButton}>
                      Comprado
                    </button>
                  </div>
                </>
              )}

              <button disabled={isActionLoading} onClick={onDelete} style={deleteButton}>
                Excluir procura
              </button>
            </Section>
          )}

          {!isOwner && !isDone && !isPaused && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onWhatsApp?.();
              }}
              style={whatsappButton}
            >
              Tenho algo parecido
            </button>
          )}

          {isDone && <div style={doneFooter}>Compra concluída com sucesso.</div>}

          {isPaused && (
            <div style={pausedFooter}>
              O comprador pausou essa demanda temporariamente.
            </div>
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

const content = {
  padding: "20px 16px 30px",
};

const badge = {
  display: "inline-block",
  background: "#eef5ff",
  color: "#2851a3",
  borderRadius: "999px",
  padding: "6px 10px",
  fontSize: "12px",
  fontWeight: 750,
  marginBottom: "10px",
};

const doneBadge = {
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
  color: "#6b7280",
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
  border: "1px solid #fde68a",
  borderRadius: "18px",
  padding: "16px",
  marginBottom: "16px",
  color: "#8a4b13",
  fontWeight: 650,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
  marginBottom: "16px",
};

const infoBox = {
  border: "1px solid #e4ebe6",
  borderRadius: "16px",
  padding: "12px",
  background: "#ffffff",
};

const infoHighlight = {
  ...infoBox,
  background: "#f0f8f2",
  border: "1px solid #c7e8cf",
};

const infoLabel = {
  display: "block",
  color: "#6b7280",
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
};

const sectionTitle = {
  margin: "0 0 10px",
  fontSize: "16px",
  fontWeight: 800,
  color: "#102019",
};

const infoLine = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "9px 0",
  borderTop: "1px solid #f2f5f3",
};

const lineLabel = {
  color: "#6b7280",
  fontSize: "14px",
  fontWeight: 650,
};

const lineValue = {
  color: "#102019",
  fontSize: "14px",
  fontWeight: 800,
  textAlign: "right" as const,
};

const whatsappButton = {
  width: "100%",
  marginTop: "12px",
  background: "#145f35",
  color: "#ffffff",
  textAlign: "center" as const,
  padding: "16px",
  borderRadius: "16px",
  border: "none",
  fontWeight: 800,
  fontSize: "16px",
  cursor: "pointer",
  boxShadow: "0 10px 20px rgba(20,95,53,0.20)",
};

const editButton = {
  width: "100%",
  border: "none",
  borderRadius: "14px",
  padding: "13px",
  background: "#145f35",
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
  border: "1px solid #c7e8cf",
  borderRadius: "12px",
  padding: "11px 8px",
  background: "#f0f8f2",
  color: "#145f35",
  fontWeight: 800,
  cursor: "pointer",
};

const activeAvailableButton = {
  background: "#145f35",
  color: "#ffffff",
  border: "1px solid #145f35",
};

const activePausedButton = {
  background: "#d97706",
  color: "#ffffff",
  border: "1px solid #d97706",
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
  fontWeight: 750,
};

const deleteButton = {
  width: "100%",
  border: "none",
  borderRadius: "14px",
  padding: "12px",
  background: "#fee2e2",
  color: "#991b1b",
  fontWeight: 800,
  cursor: "pointer",
};

const doneFooter = {
  marginTop: "16px",
  background: "#eefaf2",
  borderRadius: "14px",
  padding: "14px",
  color: "#14532d",
  textAlign: "center" as const,
  fontWeight: 800,
};

const pausedFooter = {
  marginTop: "16px",
  background: "#fff7df",
  borderRadius: "14px",
  padding: "14px",
  color: "#8a4b13",
  textAlign: "center" as const,
  fontWeight: 800,
};

const closeButton = {
  width: "100%",
  marginTop: "10px",
  background: "transparent",
  border: "none",
  padding: "12px",
  color: "#6b7280",
  fontWeight: 750,
  cursor: "pointer",
};
