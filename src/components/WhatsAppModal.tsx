function normalizeWhatsapp(value: string) {
  let numbers = String(value || "").replace(/\D/g, "");

  if (!numbers) return null;

  if (numbers.startsWith("0")) {
    numbers = numbers.replace(/^0+/, "");
  }

  if (numbers.startsWith("55")) {
    const nationalNumber = numbers.slice(2);

    if (nationalNumber.length !== 11) {
      return null;
    }

    return numbers;
  }

  if (numbers.length !== 11) {
    return null;
  }

  return `55${numbers}`;
}

export function WhatsAppModal({ open, onClose, data }: any) {
  if (!open || !data) return null;

  const isDemand = data.post_type === "demand" || data.postType === "demand";

  const message = isDemand
    ? `Olá, vi no AgroMatch que você está procurando ${data.title}, quantidade ${data.quantity}, peso ${data.weight}, em ${data.city}. Tenho algo parecido para oferecer.`
    : `Olá, vi no AgroMatch o lote ${data.title}, quantidade ${data.quantity}, peso médio ${data.weight}, em ${data.city}. Tenho interesse em negociar.`;

  const whatsapp = normalizeWhatsapp(data.whatsapp);

  const whatsappUrl = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`
    : "";

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} style={modal}>
        <h2 style={title}>Mensagem pronta</h2>

        <p style={description}>
          Confira a mensagem antes de abrir o WhatsApp.
        </p>

        <div style={messageBox}>{message}</div>

        {!whatsapp && (
          <div style={warningBox}>
            Este anúncio não possui WhatsApp completo com DDD. Peça ao usuário
            para cadastrar o número no formato DDD + número, exemplo:
            94991186237, 21999999999 ou 11999999999.
          </div>
        )}

        {whatsapp ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            style={whatsappButton}
          >
            Abrir no WhatsApp
          </a>
        ) : (
          <button type="button" disabled style={disabledWhatsappButton}>
            WhatsApp indisponível
          </button>
        )}

        <button onClick={onClose} style={closeButton}>
          Fechar
        </button>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed" as const,
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  zIndex: 10000,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
};

const modal = {
  width: "100%",
  maxWidth: "560px",
  background: "#fff",
  borderRadius: "24px 24px 0 0",
  padding: "22px 16px 28px",
  boxShadow: "0 -10px 30px rgba(0,0,0,0.14)",
};

const title = {
  fontSize: "22px",
  margin: "0 0 8px",
  color: "#111827",
  fontWeight: 900,
};

const description = {
  margin: "0 0 14px",
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: 1.45,
  fontWeight: 700,
};

const messageBox = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "14px",
  color: "#374151",
  lineHeight: 1.5,
  fontSize: "15px",
  fontWeight: 700,
};

const warningBox = {
  marginTop: "14px",
  background: "#fff7ed",
  border: "1px solid #fed7aa",
  borderRadius: "16px",
  padding: "14px",
  color: "#9a3412",
  lineHeight: 1.5,
  fontSize: "14px",
  fontWeight: 800,
};

const whatsappButton = {
  display: "block",
  marginTop: "18px",
  background: "#15803d",
  color: "#fff",
  textAlign: "center" as const,
  padding: "16px",
  borderRadius: "16px",
  textDecoration: "none",
  fontWeight: 900,
  fontSize: "16px",
  boxShadow: "0 10px 20px rgba(21,128,61,0.22)",
};

const disabledWhatsappButton = {
  display: "block",
  width: "100%",
  marginTop: "18px",
  background: "#9ca3af",
  color: "#fff",
  textAlign: "center" as const,
  padding: "16px",
  border: "none",
  borderRadius: "16px",
  fontWeight: 900,
  fontSize: "16px",
  cursor: "not-allowed",
};

const closeButton = {
  width: "100%",
  marginTop: "10px",
  border: "none",
  background: "transparent",
  padding: "12px",
  color: "#6b7280",
  fontWeight: 800,
  cursor: "pointer",
};
