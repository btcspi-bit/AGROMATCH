const FALLBACK_PROFILE_IMAGE = "/profile_image1.jpg";

function onlyNumbers(value: any) {
  return String(value || "").replace(/\D/g, "");
}

function getWhatsappUrl(value: any) {
  let numbers = onlyNumbers(value);

  if (numbers.startsWith("55") && numbers.length === 13) {
    numbers = numbers.slice(2);
  }

  if (numbers.length !== 11) return "";

  return `https://wa.me/55${numbers}`;
}

export function ProfileModal({ profile, onClose }: any) {
  if (!profile) return null;

  const whatsappUrl = getWhatsappUrl(profile.whatsapp);

  const activeListings = profile.active_listings ?? 0;
  const doneListings = profile.done_listings ?? 0;
  const totalListings = profile.total_listings ?? 0;

  const hasPhone = Boolean(whatsappUrl);
  const hasPhoto = !!profile.profile_image;
  const hasDescription = !!profile.description;
  const hasLocation = !!profile.city;

  const trustScore = [hasPhone, hasPhoto, hasDescription, hasLocation].filter(Boolean).length;

  const trustLabel =
    trustScore >= 4
      ? "Perfil confiável"
      : trustScore >= 2
      ? "Perfil ativo"
      : "Perfil básico";

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} style={modal}>
        <div style={cover}>
          <img
            src={profile.profile_image || FALLBACK_PROFILE_IMAGE}
            alt={profile.name || "Perfil AgroMatch"}
            style={avatar}
            onError={(e) => {
              e.currentTarget.src = FALLBACK_PROFILE_IMAGE;
            }}
          />
        </div>

        <div style={content}>
          <div style={header}>
            <h2 style={name}>{profile.name || "Perfil AgroMatch"}</h2>

            {profile.farm && <p style={farm}>{profile.farm}</p>}

            {profile.city && <p style={city}>📍 {profile.city}</p>}

            <div style={mainBadge}>{profile.badge || trustLabel}</div>
          </div>

          <div style={trustBox}>
            <strong style={trustTitle}>Confiança do perfil</strong>

            <div style={trustGrid}>
              <TrustItem active={hasPhone} label="Telefone validado" />
              <TrustItem active={hasPhoto} label="Foto de perfil" />
              <TrustItem active={hasDescription} label="Descrição preenchida" />
              <TrustItem active={hasLocation} label="Localização informada" />
            </div>
          </div>

          <div style={statsGrid}>
            <Stat label="Anúncios ativos" value={activeListings} />
            <Stat label="Concluídos" value={doneListings} />
            <Stat label="Publicados" value={totalListings} />
          </div>

          <div style={descriptionBox}>
            <p style={description}>
              {profile.description ||
                "Perfil operacional ativo dentro da plataforma AgroMatch."}
            </p>
          </div>

          <div style={activityBox}>
            <strong style={activityTitle}>Atividade comercial</strong>
            <p style={activityText}>
              {totalListings > 0
                ? `Este perfil já publicou ${totalListings} anúncio(s) no AgroMatch.`
                : "Este perfil ainda está iniciando sua atividade na plataforma."}
            </p>
          </div>

          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              style={whatsappButton}
            >
              Chamar no WhatsApp
            </a>
          ) : (
            <div style={unavailableWhatsappButton}>
              WhatsApp indisponível
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

function TrustItem({ active, label }: any) {
  return (
    <div style={active ? trustItemActive : trustItem}>
      <span>{active ? "✅" : "•"}</span>
      <strong>{label}</strong>
    </div>
  );
}

function Stat({ label, value }: any) {
  return (
    <div style={statBox}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

const overlay = {
  position: "fixed" as const,
  inset: 0,
  background: "rgba(15,23,42,0.52)",
  zIndex: 9999,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
};

const modal = {
  width: "100%",
  maxWidth: "560px",
  maxHeight: "94vh",
  background: "#ffffff",
  borderRadius: "26px 26px 0 0",
  overflowY: "auto" as const,
  boxShadow: "0 -18px 48px rgba(15,23,42,0.22)",
};

const cover = {
  height: "120px",
  background: "linear-gradient(135deg, #103428 0%, #1f6b4a 58%, #2f8f5f 100%)",
  position: "relative" as const,
};

const avatar = {
  position: "absolute" as const,
  left: "50%",
  bottom: "-54px",
  transform: "translateX(-50%)",
  width: "108px",
  height: "108px",
  borderRadius: "999px",
  objectFit: "cover" as const,
  border: "5px solid #ffffff",
  background: "#f3f4f6",
};

const content = {
  padding: "68px 20px 20px",
};

const header = {
  textAlign: "center" as const,
};

const name = {
  margin: "0 0 4px",
  fontSize: "27px",
  fontWeight: 850,
  color: "#111827",
};

const farm = {
  margin: 0,
  fontWeight: 700,
  fontSize: "16px",
  color: "#374151",
};

const city = {
  margin: "8px 0 0",
  color: "#6b7280",
  fontSize: "15px",
  fontWeight: 700,
};

const mainBadge = {
  display: "inline-block",
  marginTop: "14px",
  padding: "8px 16px",
  borderRadius: "999px",
  background: "#dcfce7",
  color: "#166534",
  fontWeight: 700,
  fontSize: "13px",
};

const trustBox = {
  marginTop: "22px",
  border: "1px solid #bbf7d0",
  background: "#f6faf7",
  borderRadius: "18px",
  padding: "16px",
};

const trustTitle = {
  display: "block",
  marginBottom: "12px",
  color: "#166534",
  fontSize: "15px",
};

const trustGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "8px",
};

const trustItem = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "10px",
  fontSize: "12px",
  color: "#6b7280",
  display: "flex",
  gap: "6px",
  alignItems: "center",
};

const trustItemActive = {
  ...trustItem,
  color: "#166534",
  border: "1px solid #bbf7d0",
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: "10px",
  marginTop: "14px",
};

const statBox = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "13px",
  textAlign: "center" as const,
  display: "flex",
  flexDirection: "column" as const,
  gap: "4px",
  color: "#111827",
};

const descriptionBox = {
  marginTop: "14px",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "16px",
};

const description = {
  margin: 0,
  color: "#374151",
  lineHeight: 1.6,
  textAlign: "center" as const,
  fontSize: "15px",
};

const activityBox = {
  marginTop: "14px",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "16px",
};

const activityTitle = {
  display: "block",
  color: "#111827",
  fontSize: "15px",
  fontWeight: 700,
  marginBottom: "6px",
};

const activityText = {
  margin: 0,
  color: "#6b7280",
  lineHeight: 1.5,
  fontSize: "14px",
  fontWeight: 700,
};

const whatsappButton = {
  display: "block",
  marginTop: "20px",
  padding: "16px",
  borderRadius: "18px",
  background: "#166534",
  color: "#ffffff",
  textAlign: "center" as const,
  fontWeight: 700,
  fontSize: "18px",
  textDecoration: "none",
  boxShadow: "0 10px 22px rgba(16,52,40,0.20)",
};

const unavailableWhatsappButton = {
  marginTop: "20px",
  padding: "16px",
  borderRadius: "18px",
  background: "#f3f4f6",
  color: "#6b7280",
  textAlign: "center" as const,
  fontWeight: 800,
  fontSize: "16px",
  border: "1px solid #e5e7eb",
};

const closeButton = {
  width: "100%",
  marginTop: "12px",
  border: "none",
  background: "transparent",
  color: "#6b7280",
  fontWeight: 700,
  padding: "12px",
  cursor: "pointer",
  fontSize: "15px",
};