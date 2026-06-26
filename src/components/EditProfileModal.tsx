import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const FALLBACK_PROFILE_IMAGE = "/profile_image1.jpg";

const DEFAULT_PROFILE_VALUES = {
  name: ["Meu Perfil"],
  farm: ["AgroMatch Operacional"],
  city: ["Eldorado do Carajás/PA"],
  description: [
    "Perfil do usuário dentro do AgroMatch. Aqui futuramente ficarão publicações, histórico e negociações.",
  ],
  whatsapp: ["5594999999999", "94999999999", "999999999"],
};

function cleanText(value: any) {
  return String(value || "").trim();
}

function onlyNumbers(value: any) {
  return String(value || "").replace(/\D/g, "");
}

function isDefaultValue(field: keyof typeof DEFAULT_PROFILE_VALUES, value: any) {
  const normalizedValue = cleanText(value).toLowerCase();

  return DEFAULT_PROFILE_VALUES[field].some(
    (defaultValue) => defaultValue.toLowerCase() === normalizedValue
  );
}

function sanitizeProfile(profile: any) {
  const safeProfile = profile || {};

  const name = isDefaultValue("name", safeProfile.name) ? "" : cleanText(safeProfile.name);

  const farm = isDefaultValue("farm", safeProfile.farm) ? "" : cleanText(safeProfile.farm);

  const city = isDefaultValue("city", safeProfile.city) ? "" : cleanText(safeProfile.city);

  const description = isDefaultValue("description", safeProfile.description)
    ? ""
    : cleanText(safeProfile.description);

  const whatsappNumbers = onlyNumbers(safeProfile.whatsapp);
  const whatsapp = isDefaultValue("whatsapp", whatsappNumbers) ? "" : whatsappNumbers;

  const profileImage = cleanText(safeProfile.profile_image);

  return {
    ...safeProfile,
    name,
    farm,
    city,
    description,
    whatsapp,
    profile_image:
      !profileImage || profileImage === "/avatar1.jpg" ? FALLBACK_PROFILE_IMAGE : profileImage,
  };
}

function normalizeWhatsapp(value: string) {
  const numbers = onlyNumbers(value);

  if (numbers.length === 13 && numbers.startsWith("55")) {
    return numbers.slice(2);
  }

  return numbers;
}

export function EditProfileModal({
  open,
  onClose,
  profile,
  onSave,
  onLogout,
}: any) {
  const [draftProfile, setDraftProfile] = useState(sanitizeProfile(profile));
  const [uploading, setUploading] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDraftProfile(sanitizeProfile(profile));
    }
  }, [open, profile]);

  if (!open) return null;

  function updateField(field: string, value: string) {
    setDraftProfile((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleImageUpload(file: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Escolha apenas arquivos de imagem.");
      return;
    }

    if (file.size > 1024 * 1024 * 2) {
      alert("A imagem precisa ter no máximo 2MB.");
      return;
    }

    setUploading(true);

    const fileExtension = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExtension}`;
    const filePath = `profiles/${fileName}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      setUploading(false);
      alert("Não foi possível enviar a imagem.");
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

    updateField("profile_image", data.publicUrl);

    setUploading(false);
  }

  function validateProfile() {
    const name = cleanText(draftProfile.name);
    const farm = cleanText(draftProfile.farm);
    const city = cleanText(draftProfile.city);
    const description = cleanText(draftProfile.description);
    const whatsapp = normalizeWhatsapp(draftProfile.whatsapp);
    const profileImage = cleanText(draftProfile.profile_image);

    if (name.length < 3) {
      alert("Informe seu nome público.");
      return false;
    }

    if (farm.length < 2) {
      alert("Informe sua fazenda ou empresa.");
      return false;
    }

    if (city.length < 2) {
      alert("Informe sua cidade/região.");
      return false;
    }

    if (description.length < 10) {
      alert("Escreva uma descrição rápida sobre sua atuação no agro.");
      return false;
    }

    if (![11].includes(whatsapp.length)) {
      alert("Informe um WhatsApp válido com DDD. Ex: 94991234567, 91991234567 ou 11991234567.");
      return false;
    }

    if (!profileImage || profileImage === FALLBACK_PROFILE_IMAGE || profileImage === "/avatar1.jpg") {
      alert("Escolha uma foto real para o perfil.");
      return false;
    }

    return true;
  }

  function handleSave() {
    if (!validateProfile()) return;

    const normalizedProfile = {
      ...draftProfile,
      name: cleanText(draftProfile.name),
      farm: cleanText(draftProfile.farm),
      city: cleanText(draftProfile.city),
      description: cleanText(draftProfile.description),
      whatsapp: normalizeWhatsapp(draftProfile.whatsapp),
    };

    onSave(normalizedProfile);
  }

  async function handleLogout() {
    if (!onLogout) return;

    const confirmed = confirm("Deseja sair da sua conta?");

    if (!confirmed) return;

    try {
      setLeaving(true);
      await onLogout();
      onClose();
    } finally {
      setLeaving(false);
    }
  }

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} style={modal}>
        <h2 style={title}>Editar perfil</h2>

        <p style={description}>
          Essas informações aparecem no seu perfil e nas publicações.
        </p>

        <div style={profileRow}>
          <img
            src={draftProfile.profile_image || FALLBACK_PROFILE_IMAGE}
            alt="Foto do perfil"
            style={avatar}
            onError={(event) => {
              event.currentTarget.src = FALLBACK_PROFILE_IMAGE;
            }}
          />

          <div style={{ flex: 1 }}>
            <label style={uploadButton}>
              {uploading ? "Enviando..." : "Escolher foto"}

              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (file) {
                    handleImageUpload(file);
                  }
                }}
                style={{ display: "none" }}
              />
            </label>

            <p style={helperText}>Use uma imagem quadrada e leve.</p>
          </div>
        </div>

        <ProfileField label="Nome público">
          <input
            value={draftProfile.name || ""}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Ex: Thiago"
            style={inputStyle}
          />
        </ProfileField>

        <ProfileField label="Fazenda ou empresa">
          <input
            value={draftProfile.farm || ""}
            onChange={(e) => updateField("farm", e.target.value)}
            placeholder="Ex: Fazenda Boa Vista"
            style={inputStyle}
          />
        </ProfileField>

        <ProfileField label="Cidade / Região">
          <input
            value={draftProfile.city || ""}
            onChange={(e) => updateField("city", e.target.value)}
            placeholder="Ex: Eldorado do Carajás/PA"
            style={inputStyle}
          />
        </ProfileField>

        <ProfileField label="Descrição rápida">
          <textarea
            value={draftProfile.description || ""}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Fale rapidamente sobre sua atuação no agro."
            style={{
              ...inputStyle,
              height: "92px",
              resize: "none",
              lineHeight: 1.45,
            }}
          />
        </ProfileField>

        <ProfileField label="WhatsApp">
          <input
            inputMode="numeric"
            value={draftProfile.whatsapp || ""}
            onChange={(e) => updateField("whatsapp", onlyNumbers(e.target.value))}
            placeholder="Ex: 94991234567"
            style={inputStyle}
          />

          <p style={helperText}>
            Digite o número completo com DDD. O app não adiciona DDD automaticamente.
          </p>
        </ProfileField>

        <button
          onClick={handleSave}
          disabled={uploading || leaving}
          style={{
            ...saveButton,
            opacity: uploading || leaving ? 0.7 : 1,
          }}
        >
          {uploading ? "Aguarde..." : "Salvar perfil"}
        </button>

        <button
          onClick={handleLogout}
          disabled={uploading || leaving}
          style={{
            ...logoutButton,
            opacity: uploading || leaving ? 0.7 : 1,
          }}
        >
          {leaving ? "Saindo..." : "Sair da conta"}
        </button>

        <button onClick={onClose} disabled={uploading || leaving} style={closeButton}>
          Fechar
        </button>
      </div>
    </div>
  );
}

function ProfileField({ label, children }: any) {
  return (
    <div style={{ marginBottom: "13px" }}>
      <label style={fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

const overlay = {
  position: "fixed" as const,
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  zIndex: 9999,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
};

const modal = {
  width: "100%",
  maxWidth: "560px",
  background: "#fff",
  borderRadius: "28px 28px 0 0",
  padding: "20px 16px 30px",
  boxShadow: "0 -20px 60px rgba(0,0,0,0.22)",
  maxHeight: "92vh",
  overflowY: "auto" as const,
};

const title = {
  fontSize: "25px",
  fontWeight: 900,
  marginBottom: "6px",
  color: "#111827",
};

const description = {
  color: "#6b7280",
  fontSize: "14px",
  marginBottom: "18px",
  lineHeight: 1.45,
};

const profileRow = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  marginBottom: "18px",
};

const avatar = {
  width: "82px",
  height: "82px",
  borderRadius: "50%",
  objectFit: "cover" as const,
  border: "3px solid #e5e7eb",
  background: "#f3f4f6",
};

const fieldLabel = {
  display: "block",
  fontSize: "13px",
  fontWeight: 900,
  color: "#374151",
  marginBottom: "6px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "14px",
  borderRadius: "16px",
  border: "1px solid #d1d5db",
  fontSize: "16px",
  outline: "none",
  background: "#ffffff",
};

const helperText = {
  fontSize: "12px",
  color: "#6b7280",
  marginTop: "6px",
};

const uploadButton = {
  display: "inline-block",
  width: "100%",
  textAlign: "center" as const,
  borderRadius: "14px",
  padding: "12px",
  background: "#f3f4f6",
  color: "#111827",
  fontWeight: 900,
  fontSize: "14px",
  cursor: "pointer",
  border: "1px solid #d1d5db",
};

const saveButton = {
  width: "100%",
  border: "none",
  borderRadius: "18px",
  padding: "16px",
  background: "#15803d",
  color: "#fff",
  fontWeight: 900,
  fontSize: "16px",
  cursor: "pointer",
  marginTop: "6px",
  boxShadow: "0 10px 20px rgba(21,128,61,0.22)",
};

const logoutButton = {
  width: "100%",
  border: "1px solid #fecaca",
  borderRadius: "18px",
  padding: "15px",
  background: "#fef2f2",
  color: "#b91c1c",
  fontWeight: 900,
  fontSize: "15px",
  cursor: "pointer",
  marginTop: "10px",
};

const closeButton = {
  width: "100%",
  border: "none",
  background: "transparent",
  padding: "12px",
  color: "#6b7280",
  fontWeight: 800,
  cursor: "pointer",
  marginTop: "4px",
};
