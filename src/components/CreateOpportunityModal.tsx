"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CSSProperties,
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
} from "react";
import { supabase } from "@/lib/supabase";
import type { Listing } from "@/types";

const categories = [
  "Bezerro",
  "Bezerra",
  "Garrote",
  "Novilha",
  "Boi",
  "Boi magro",
  "Boi gordo",
  "Vaca",
  "Vaca magra",
  "Vaca gorda",
  "Vaca parida",
  "Matriz",
  "Touro",
  "Lote de cria",
  "Lote de recria",
  "Lote de engorda",
];

const breeds = [
  "Nelore",
  "Nelore PO",
  "Nelore cruzado",
  "Angus",
  "Brangus",
  "Brahman",
  "Tabapuã",
  "Guzerá",
  "Girolando",
  "Senepol",
  "Hereford",
  "Simental",
  "Caracu",
  "Canchim",
  "Cruzado",
  "Mestiço",
];

const roads = ["🟢 Acesso fácil", "🟡 Acesso médio", "🔴 Acesso difícil"];

const distanceOptions = [
  "Até 20km",
  "Até 50km",
  "Até 100km",
  "Até 200km",
  "Acima de 200km",
];

const radiusOptions = [
  "Até 20km",
  "Até 50km",
  "Até 100km",
  "Até 200km",
  "Qualquer distância",
];

type PostType = "offer" | "demand";
type SuggestionField = "category" | "breed" | null;

type CreateOpportunityModalProps = {
  open: boolean;
  editingListing?: Listing | null;
  onClose: () => void | Promise<void>;
  onCreate: (newOpportunity: any) => void | Promise<void>;
  onUpdate?: (updatedOpportunity: any) => void | Promise<void>;
};

const DEFAULT_IMAGE = "/boi1.jpg";
const MAX_IMAGES = 3;
const MAX_INPUT_IMAGE_SIZE_MB = 15;
const MAX_OUTPUT_IMAGE_SIZE = 1280;
const IMAGE_QUALITY = 0.72;

type PreparedImage = {
  file: File;
  previewUrl: string;
};

function getFileSizeMb(file: File) {
  return file.size / 1024 / 1024;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Não foi possível carregar a imagem."));
    };

    image.src = objectUrl;
  });
}

function canvasToJpegFile(
  canvas: HTMLCanvasElement,
  originalFileName: string
): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Não foi possível comprimir a imagem."));
          return;
        }

        const cleanName =
          originalFileName.replace(/\.[^/.]+$/, "") || "foto-lote";

        const compressedFile = new File([blob], `${cleanName}.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        });

        resolve(compressedFile);
      },
      "image/jpeg",
      IMAGE_QUALITY
    );
  });
}

async function prepareImageForUpload(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Escolha apenas imagens válidas.");
  }

  const sizeMb = getFileSizeMb(file);

  if (sizeMb > MAX_INPUT_IMAGE_SIZE_MB) {
    throw new Error(
      `Uma das fotos está muito pesada (${sizeMb.toFixed(
        1
      )} MB). Escolha uma foto menor.`
    );
  }

  const image = await loadImageFromFile(file);

  const originalWidth = image.naturalWidth || image.width;
  const originalHeight = image.naturalHeight || image.height;

  if (!originalWidth || !originalHeight) {
    throw new Error("Não foi possível identificar o tamanho da imagem.");
  }

  let targetWidth = originalWidth;
  let targetHeight = originalHeight;

  if (originalWidth >= originalHeight && originalWidth > MAX_OUTPUT_IMAGE_SIZE) {
    targetWidth = MAX_OUTPUT_IMAGE_SIZE;
    targetHeight = Math.round(
      (originalHeight * MAX_OUTPUT_IMAGE_SIZE) / originalWidth
    );
  }

  if (originalHeight > originalWidth && originalHeight > MAX_OUTPUT_IMAGE_SIZE) {
    targetHeight = MAX_OUTPUT_IMAGE_SIZE;
    targetWidth = Math.round(
      (originalWidth * MAX_OUTPUT_IMAGE_SIZE) / originalHeight
    );
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Não foi possível preparar a imagem.");
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);

  const compressedFile = await canvasToJpegFile(canvas, file.name);
  const previewUrl = URL.createObjectURL(compressedFile);

  return {
    file: compressedFile,
    previewUrl,
  };
}

async function prepareImagesForUpload(files: File[]) {
  const selectedFiles = files.slice(0, MAX_IMAGES);
  const preparedImages: PreparedImage[] = [];

  for (const file of selectedFiles) {
    const preparedImage = await prepareImageForUpload(file);
    preparedImages.push(preparedImage);
  }

  return preparedImages;
}
function onlyNumbers(value: string) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeWhatsapp(value: string) {
  const numbers = onlyNumbers(value);

  if (numbers.length === 13 && numbers.startsWith("55")) {
    return numbers.slice(2);
  }

  return numbers;
}

function isValidWhatsapp(value: string) {
  const normalizedNumbers = normalizeWhatsapp(value);

  return normalizedNumbers.length === 11;
}

function formatCurrency(value: string) {
  const numbers = onlyNumbers(value);

  if (!numbers) return "";

  const amount = Number(numbers) / 100;

  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function normalizeText(value: string) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getSuggestions(options: string[], value: string) {
  const typed = normalizeText(value.trim());

  if (!typed) return options.slice(0, 6);

  return options
    .filter((option) => normalizeText(option).includes(typed))
    .slice(0, 6);
}

function inferGender(category: string, isMixed: boolean) {
  if (isMixed) return "Lote misto";

  const normalized = category.toLowerCase();

  if (
    normalized.includes("vaca") ||
    normalized.includes("novilha") ||
    normalized.includes("bezerra") ||
    normalized.includes("matriz")
  ) {
    return "Fêmea";
  }

  if (
    normalized.includes("boi") ||
    normalized.includes("garrote") ||
    normalized.includes("bezerro") ||
    normalized.includes("touro")
  ) {
    return "Macho";
  }

  return "Não informado";
}

function removeKg(value: any) {
  return onlyNumbers(String(value || "").replace("kg", ""));
}

function removeMonths(value: any) {
  return onlyNumbers(String(value || "").replace("meses", ""));
}

function normalizeAcceptedAccess(value: any) {
  const text = String(value || "");

  if (text.includes("Aceita qualquer acesso")) return roads;

  const selected = roads.filter((road) => text.includes(road));

  return selected.length > 0 ? selected : ["🟢 Acesso fácil"];
}

function getInitialForm() {
  return {
    title: "",
    category: "",
    is_mixed: false,
    breed: "",
    age: "",
    price: "",
    weight: "",
    quantity: "",
    city: "Eldorado do Carajás/PA",
    road: "🟢 Acesso fácil",
    distance: "Até 100km",
    accepted_access: ["🟢 Acesso fácil"],
    whatsapp: "",
  };
}

export function CreateOpportunityModal({
  open,
  editingListing = null,
  onClose,
  onCreate,
  onUpdate,
}: CreateOpportunityModalProps) {
  const isEditing = Boolean(editingListing);

  const [postType, setPostType] = useState<PostType | null>(null);
  const [loading, setLoading] = useState(false);
const [preparingImages, setPreparingImages] = useState(false);
const [selectedImages, setSelectedImages] = useState<File[]>([]);
const [previewImages, setPreviewImages] = useState<string[]>([DEFAULT_IMAGE]);
  const [suggestionField, setSuggestionField] =
    useState<SuggestionField>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState(getInitialForm());

  useEffect(() => {
    if (!open) return;

    if (editingListing) {
      const listingPostType =
        editingListing.post_type === "demand" ? "demand" : "offer";

      setPostType(listingPostType);
      setSelectedImages([]);
      setPreviewImages(
        editingListing.images?.length
          ? editingListing.images.slice(0, 3)
          : [editingListing.image || DEFAULT_IMAGE]
      );
      setSuggestionField(null);

      setForm({
        title: editingListing.title || "",
        category: editingListing.category || "",
        is_mixed: editingListing.gender === "Lote misto",
        breed: editingListing.breed || "",
        age: removeMonths(editingListing.age),
        price:
          editingListing.price === "Valor a combinar" ||
          editingListing.price === "Negociação aberta"
            ? ""
            : editingListing.price || "",
        weight: removeKg(editingListing.weight),
        quantity: onlyNumbers(String(editingListing.quantity || "")),
        city: editingListing.city || "Eldorado do Carajás/PA",
        road:
          listingPostType === "offer"
            ? editingListing.road || "🟢 Acesso fácil"
            : "🟢 Acesso fácil",
        distance: editingListing.distance || "Até 100km",
        accepted_access:
          listingPostType === "demand"
            ? normalizeAcceptedAccess(editingListing.road)
            : ["🟢 Acesso fácil"],
        whatsapp: onlyNumbers(editingListing.whatsapp || ""),
      });

      return;
    }

    resetForm();
  }, [open, editingListing]);

  useEffect(() => {
    return () => {
      previewImages.forEach((preview) => {
        if (preview.startsWith("blob:")) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [previewImages]);

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

  const categorySuggestions = useMemo(
    () => getSuggestions(categories, form.category),
    [form.category]
  );

  const breedSuggestions = useMemo(
    () => getSuggestions(breeds, form.breed),
    [form.breed]
  );

  if (!open) return null;

  function updateField(field: string, value: string | boolean | string[]) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function blurKeyboard() {
    const activeElement = document.activeElement as HTMLElement | null;

    if (activeElement && typeof activeElement.blur === "function") {
      activeElement.blur();
    }
  }

  function handleEnterToBlur(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      setSuggestionField(null);
      blurKeyboard();
    }
  }

  function selectSuggestion(field: "category" | "breed", value: string) {
  updateField(field, value);
  setSuggestionField(null);
}

  function toggleAcceptedAccess(access: string) {
    blurKeyboard();

    const alreadySelected = form.accepted_access.includes(access);

    if (alreadySelected) {
      const nextAccess = form.accepted_access.filter((item) => item !== access);

      updateField(
        "accepted_access",
        nextAccess.length > 0 ? nextAccess : ["🟢 Acesso fácil"]
      );

      return;
    }

    updateField("accepted_access", [...form.accepted_access, access]);
  }

  function resetForm() {
    setPostType(null);
    setSelectedImages([]);
    setPreviewImages([DEFAULT_IMAGE]);
    setSuggestionField(null);
    setForm(getInitialForm());
  }

  function hasDraftContent() {
    if (isEditing) return false;

    return Boolean(
      postType !== null ||
        form.title.trim() ||
        form.breed.trim() ||
        form.age ||
        form.price ||
        form.weight ||
        form.quantity ||
        form.whatsapp ||
        selectedImages.length > 0
    );
  }

  function handleClose() {
  if (loading || preparingImages) return;

    setSuggestionField(null);
    blurKeyboard();

    if (hasDraftContent()) {
      const shouldDiscard = window.confirm(
        "Você já começou uma publicação. Deseja descartar e sair?"
      );

      if (!shouldDiscard) return;
    }

    resetForm();
    onClose();
  }

  function validateForm() {
    if (!postType) {
      alert("Escolha o tipo do anúncio.");
      return false;
    }

    if (postType === "offer") {
      const hasNewPhoto = selectedImages.length > 0;
      const hasExistingRealPhoto = Boolean(
        isEditing &&
          previewImages.some(
            (preview) => preview && preview !== DEFAULT_IMAGE
          )
      );

      if (!hasNewPhoto && !hasExistingRealPhoto) {
        alert("Adicione pelo menos uma foto real do lote antes de publicar.");
        return false;
      }
    }

    if (form.title.trim().length < 5) {
      alert("Informe um título mais completo.");
      return false;
    }

    if (form.category.trim().length < 2) {
      alert("Informe a categoria do gado.");
      return false;
    }

    if (form.breed.trim().length < 2) {
      alert("Informe a raça do gado.");
      return false;
    }

    if (!form.weight) {
      alert("Informe o peso médio.");
      return false;
    }

    if (!form.quantity || Number(form.quantity) <= 0) {
      alert("Informe a quantidade de cabeças.");
      return false;
    }

    if (postType === "demand" && form.accepted_access.length === 0) {
      alert("Informe pelo menos uma condição de acesso aceita.");
      return false;
    }

    if (!isValidWhatsapp(form.whatsapp)) {
      alert(
        "Informe um WhatsApp válido com DDD. Ex: 94991234567, 91991234567 ou 11991234567."
      );
      return false;
    }

    return true;
  }
   async function uploadImages() {
    if (selectedImages.length === 0) {
      if (isEditing && editingListing?.images?.length) {
        return editingListing.images.slice(0, MAX_IMAGES);
      }

      if (isEditing && editingListing?.image) {
        return [editingListing.image];
      }

      return [DEFAULT_IMAGE];
    }

    const uploadedUrls: string[] = [];

    for (const image of selectedImages.slice(0, MAX_IMAGES)) {
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.jpg`;

      const { error } = await supabase.storage
        .from("listing-images")
        .upload(fileName, image, {
          contentType: "image/jpeg",
          cacheControl: "86400",
          upsert: false,
        });

      if (error) {
        throw new Error(error.message);
      }

      const { data } = supabase.storage
        .from("listing-images")
        .getPublicUrl(fileName);

      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls.length > 0 ? uploadedUrls : [DEFAULT_IMAGE];
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
  const files = Array.from(event.target.files || []);

  if (files.length === 0) return;

  if (files.length > MAX_IMAGES) {
    alert("Escolha no máximo 3 fotos do lote.");
    event.target.value = "";
    return;
  }

  const invalidFile = files.find((file) => !file.type.startsWith("image/"));

  if (invalidFile) {
    alert("Escolha apenas imagens válidas.");
    event.target.value = "";
    return;
  }

  try {
    setPreparingImages(true);

    previewImages.forEach((preview) => {
      if (preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    });

    const preparedImages = await prepareImagesForUpload(files);

    setSelectedImages(preparedImages.map((item) => item.file));
    setPreviewImages(preparedImages.map((item) => item.previewUrl));
  } catch (error) {
    console.error(error);

    alert(
      error instanceof Error
        ? error.message
        : "Não foi possível preparar as fotos."
    );

    setSelectedImages([]);
    setPreviewImages([DEFAULT_IMAGE]);
  } finally {
    setPreparingImages(false);
    event.target.value = "";
  }
}

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (loading) return;
    if (!validateForm()) return;

    setSuggestionField(null);
    blurKeyboard();

    try {
      setLoading(true);

      const imageUrls =
        postType === "offer" ? await uploadImages() : [DEFAULT_IMAGE];

      const mainImageUrl = imageUrls[0] || DEFAULT_IMAGE;

      const inferredGender = inferGender(form.category, form.is_mixed);

      const buyerAccessText =
        form.accepted_access.length === roads.length
          ? "Aceita qualquer acesso"
          : form.accepted_access.join(" • ");
      const normalizedWhatsapp = normalizeWhatsapp(form.whatsapp);

      const opportunityPayload = {
        post_type: postType,
        title: form.title.trim(),
        weight: form.weight ? `${form.weight} kg` : "",
        quantity: Number(form.quantity),
        city: form.city.trim(),
        distance: form.distance,
        road: postType === "offer" ? form.road : buyerAccessText,
        image: mainImageUrl,
        images: imageUrls,
        badge: postType === "offer" ? "Venda" : "Compra",
        owner: "Meu Perfil",
        verified: true,
        status: editingListing?.status || "Disponível",
        category: form.category,
        gender: inferredGender,
        breed: form.breed.trim(),
        age: form.age ? `${form.age} meses` : "",
        price:
          postType === "demand"
            ? form.price || "Negociação aberta"
            : form.price || "Valor a combinar",
        profile_image: editingListing?.profile_image || "/profile_image1.jpg",
        whatsapp: normalizedWhatsapp,
      };

      if (isEditing) {
        if (!onUpdate) {
          alert("Função de edição não encontrada.");
          return;
        }

        await onUpdate(opportunityPayload);
      } else {
        await onCreate(opportunityPayload);
      }

            resetForm();
    } catch (error) {
      console.error(error);
      alert(
        isEditing
          ? "Não foi possível salvar as alterações agora."
          : "Não foi possível publicar agora. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div onClick={handleClose} style={overlay}>
      <div onClick={(event) => event.stopPropagation()} style={modal}>
                <button
          type="button"
          onClick={handleClose}
          style={handleBar}
          aria-label="Fechar publicação"
        />

        {!postType ? (
          <div style={modalContent}>
            <h2 style={title}>Publicar oportunidade</h2>

            <p style={description}>
              Você quer anunciar venda ou procurar gado?
            </p>

            <button
              type="button"
              onClick={() => setPostType("offer")}
              style={mainButton}
            >
              Tenho gado para vender
            </button>

            <button
              type="button"
              onClick={() => setPostType("demand")}
              style={secondaryButton}
            >
              Estou procurando gado
            </button>

            <button type="button" onClick={handleClose} style={closeButton}>
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={formStyle}>
            <div style={modalContent}>
              <h2 style={title}>
                {isEditing
                  ? "Editar anúncio"
                  : postType === "offer"
                  ? "Vender lote"
                  : "Comprar gado"}
              </h2>

              <p style={description}>
                {isEditing
                  ? "Ajuste as informações e salve as alterações."
                  : postType === "offer"
                  ? "Informe os dados principais do lote."
                  : "Informe o que procura e sua flexibilidade logística."}
              </p>

              {postType === "offer" && (
  <>
    <div style={photoSectionHeader}>
      <strong>{isEditing ? "Trocar fotos do lote" : "Fotos do lote"}</strong>
      <span>até 3 fotos</span>
    </div>

    <button
      type="button"
      style={photoPickerButton}
      disabled={loading || preparingImages}
      onClick={() => {
        if (loading || preparingImages) return;
        fileInputRef.current?.click();
      }}
    >
      {previewImages.filter((preview) => preview !== DEFAULT_IMAGE).length >
      0 ? (
        previewImages
          .filter((preview) => preview !== DEFAULT_IMAGE)
          .slice(0, 3)
          .map((preview, index) => (
            <div key={`${preview}-${index}`} style={previewBox}>
              <img
                src={preview}
                alt={`Foto ${index + 1}`}
                style={previewImageStyle}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />

              <span style={photoCounter}>{index + 1}</span>
            </div>
          ))
      ) : (
        <div style={emptyPhotoState}>
          <div style={emptyPhotoIcon}>＋</div>

          <strong>
            {preparingImages ? "Preparando fotos..." : "Adicionar fotos"}
          </strong>

          <span>Toque aqui para escolher até 3 fotos do lote</span>
        </div>
      )}
    </button>

    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      multiple
      style={hiddenFileInput}
      onChange={handleImageChange}
      disabled={loading || preparingImages}
    />
  </>
)}

              <label style={label}>
                Título
                <input
                  required
                  style={input}
                  value={form.title}
                  disabled={loading}
                  maxLength={80}
                  onFocus={() => setSuggestionField(null)}
                  onKeyDown={handleEnterToBlur}
                  onChange={(event) => updateField("title", event.target.value)}
                  placeholder={
                    postType === "offer"
                      ? "Ex: 20 bezerros nelore"
                      : "Ex: Procuro bezerros nelore"
                  }
                />
              </label>

              <label style={label}>
                Categoria

                <div style={suggestionWrapper}>
                  <input
                    required
                    style={input}
                    value={form.category}
                    disabled={loading}
                    maxLength={40}
                    onFocus={() => setSuggestionField("category")}
                    onKeyDown={handleEnterToBlur}
                    onChange={(event) => {
                      updateField("category", event.target.value);
                      setSuggestionField("category");
                    }}
                    placeholder="Ex: Bezerro"
                  />

                  {suggestionField === "category" &&
                    categorySuggestions.length > 0 && (
                      <div style={suggestionBox}>
                        {categorySuggestions.map((item) => (
                          <button
                            key={item}
                            type="button"
                            style={suggestionItem}
                            onPointerDown={(event) => {
                              event.preventDefault();
                              selectSuggestion("category", item);
                            }}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              </label>

              <label style={checkLabel}>
                <input
                  type="checkbox"
                  checked={form.is_mixed}
                  disabled={loading}
                  onChange={(event) =>
                    updateField("is_mixed", event.target.checked)
                  }
                />
                Lote misto
              </label>

              <label style={label}>
                Raça

                <div style={suggestionWrapper}>
                  <input
                    required
                    style={input}
                    value={form.breed}
                    disabled={loading}
                    maxLength={40}
                    onFocus={() => setSuggestionField("breed")}
                    onKeyDown={handleEnterToBlur}
                    onChange={(event) => {
                      updateField("breed", event.target.value);
                      setSuggestionField("breed");
                    }}
                    placeholder="Ex: Nelore"
                  />

                  {suggestionField === "breed" &&
                    breedSuggestions.length > 0 && (
                      <div style={suggestionBox}>
                        {breedSuggestions.map((item) => (
                          <button
                            key={item}
                            type="button"
                            style={suggestionItem}
                            onPointerDown={(event) => {
                              event.preventDefault();
                              selectSuggestion("breed", item);
                            }}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              </label>

              <div style={twoColumns}>
                <label style={label}>
                  Idade
                  <input
                    inputMode="numeric"
                    style={input}
                    value={form.age}
                    disabled={loading}
                    onFocus={() => setSuggestionField(null)}
                    onKeyDown={handleEnterToBlur}
                    onChange={(event) =>
                      updateField("age", onlyNumbers(event.target.value))
                    }
                    placeholder="12"
                  />
                </label>

                <label style={label}>
                  Peso médio
                  <input
                    required
                    inputMode="numeric"
                    style={input}
                    value={form.weight}
                    disabled={loading}
                    onFocus={() => setSuggestionField(null)}
                    onKeyDown={handleEnterToBlur}
                    onChange={(event) =>
                      updateField("weight", onlyNumbers(event.target.value))
                    }
                    placeholder="350"
                  />
                </label>
              </div>

              <div style={twoColumns}>
                <label style={label}>
                  Quantidade
                  <input
                    required
                    inputMode="numeric"
                    style={input}
                    value={form.quantity}
                    disabled={loading}
                    onFocus={() => setSuggestionField(null)}
                    onKeyDown={handleEnterToBlur}
                    onChange={(event) =>
                      updateField("quantity", onlyNumbers(event.target.value))
                    }
                    placeholder="20"
                  />
                </label>

                <label style={label}>
                  {postType === "demand"
                    ? "Referência de valor"
                    : "Valor do lote"}
                  <input
                    inputMode="numeric"
                    style={input}
                    value={form.price}
                    disabled={loading}
                    onFocus={() => setSuggestionField(null)}
                    onKeyDown={handleEnterToBlur}
                    onChange={(event) =>
                      updateField("price", formatCurrency(event.target.value))
                    }
                    placeholder={postType === "demand" ? "Opcional" : "R$ 0,00"}
                  />
                </label>
              </div>

              <label style={label}>
                Cidade
                <input
                  required
                  style={input}
                  value={form.city}
                  disabled={loading}
                  onFocus={() => setSuggestionField(null)}
                  onKeyDown={handleEnterToBlur}
                  onChange={(event) => updateField("city", event.target.value)}
                />
              </label>

              {postType === "offer" ? (
                <>
                  <label style={label}>
                    Distância do lote até a cidade
                    <select
                      style={input}
                      value={form.distance}
                      disabled={loading}
                      onFocus={() => setSuggestionField(null)}
                      onChange={(event) => {
                        updateField("distance", event.target.value);
                        blurKeyboard();
                      }}
                    >
                      {distanceOptions.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>

                  <label style={label}>
                    Condição de acesso do lote
                    <select
                      style={input}
                      value={form.road}
                      disabled={loading}
                      onFocus={() => setSuggestionField(null)}
                      onChange={(event) => {
                        updateField("road", event.target.value);
                        blurKeyboard();
                      }}
                    >
                      {roads.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                </>
              ) : (
                <>
                  <label style={label}>
                    Até onde consegue buscar?
                    <select
                      style={input}
                      value={form.distance}
                      disabled={loading}
                      onFocus={() => setSuggestionField(null)}
                      onChange={(event) => {
                        updateField("distance", event.target.value);
                        blurKeyboard();
                      }}
                    >
                      {radiusOptions.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>

                  <div style={label}>
                    Quais acessos você aceita?

                    <div style={accessGrid}>
                      {roads.map((road) => {
                        const active = form.accepted_access.includes(road);

                        return (
                          <button
                            key={road}
                            type="button"
                            disabled={loading}
                            onClick={() => toggleAcceptedAccess(road)}
                            style={{
                              ...accessButton,
                              background: active ? "#166534" : "#ffffff",
                              color: active ? "#ffffff" : "#166534",
                              border: active
                                ? "1px solid #166534"
                                : "1px solid #bbf7d0",
                            }}
                          >
                            {road}
                          </button>
                        );
                      })}
                    </div>

                    <p style={accessHint}>
                      Se marcar os três, o acesso deixa de limitar o match.
                    </p>
                  </div>
                </>
              )}

              <label style={label}>
                WhatsApp
                <input
                  required
                  inputMode="numeric"
                  style={input}
                  value={form.whatsapp}
                  disabled={loading}
                  onFocus={() => setSuggestionField(null)}
                  onKeyDown={handleEnterToBlur}
                  onChange={(event) =>
                    updateField("whatsapp", onlyNumbers(event.target.value))
                  }
                  placeholder="Ex: 94991234567"
                />

                <p style={accessHint}>
                  Digite o número completo com DDD. O app não adiciona DDD automaticamente.
                </p>
              </label>

              <button
                type="submit"
                disabled={loading || preparingImages}
                style={{
                  ...mainButton,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading
                  ? isEditing
                    ? "Salvando alterações..."
                    : "Publicando anúncio..."
                  : isEditing
                  ? "Salvar alterações"
                  : "Publicar anúncio"}
              </button>

              {!isEditing && (
                <button
                  type="button"
                  disabled={loading || preparingImages}
                  onClick={() => {
                    setSuggestionField(null);
                    blurKeyboard();
                    setPostType(null);
                  }}
                  style={secondaryButton}
                >
                  Voltar
                </button>
              )}

              <button
                type="button"
                disabled={loading || preparingImages}
                onClick={handleClose}
                style={closeButton}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
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
  background: "rgba(0,0,0,0.52)",
  overflow: "hidden",
  overscrollBehavior: "none",
  touchAction: "none",
};

const modal: CSSProperties = {
  width: "100%",
  maxWidth: "520px",
  height: "92dvh",
  maxHeight: "92dvh",
  background: "#ffffff",
  borderRadius: "24px 24px 0 0",
  padding: "10px 14px 0",
  boxSizing: "border-box",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 -12px 30px rgba(0,0,0,0.22)",
  transform: "translateZ(0)",
  WebkitTransform: "translateZ(0)",
  touchAction: "auto",
};

const handleBar: CSSProperties = {
  width: "42px",
  height: "5px",
  border: "none",
  borderRadius: "999px",
  background: "#d1d5db",
  margin: "0 auto 12px",
  padding: 0,
  flexShrink: 0,
  cursor: "pointer",
};

const modalContent: CSSProperties = {
  overflowY: "auto",
  overscrollBehavior: "contain",
  WebkitOverflowScrolling: "touch",
  padding: "0 2px 28px",
  boxSizing: "border-box",
  flex: 1,
};

const formStyle: CSSProperties = {
  minHeight: 0,
  flex: 1,
  display: "flex",
  flexDirection: "column",
};

const previewGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "10px",
  marginBottom: "16px",
};

const previewBox: CSSProperties = {
  width: "100%",
  aspectRatio: "1 / 1",
  borderRadius: "18px",
  overflow: "hidden",
  background: "#f3f4f6",
  position: "relative",
};

const previewImageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const photoCounter: CSSProperties = {
  position: "absolute",
  right: "8px",
  top: "8px",
  width: "24px",
  height: "24px",
  borderRadius: "999px",
  background: "rgba(17,24,39,0.78)",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
  fontWeight: 900,
};

const title: CSSProperties = {
  fontSize: "24px",
  fontWeight: 900,
  margin: "0 0 8px",
  color: "#111827",
};

const description: CSSProperties = {
  color: "#6b7280",
  margin: "0 0 22px",
  fontSize: "14px",
};

const label: CSSProperties = {
  display: "block",
  fontWeight: 800,
  fontSize: "14px",
  marginBottom: "14px",
  color: "#111827",
};

const checkLabel: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  fontWeight: 900,
  fontSize: "14px",
  marginBottom: "14px",
  color: "#166534",
  background: "#dcfce7",
  border: "1px solid #86efac",
  borderRadius: "14px",
  padding: "12px",
};

const twoColumns: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
  gap: "12px",
};

const input: CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  marginTop: "6px",
  border: "1px solid #d1d5db",
  borderRadius: "14px",
  padding: "13px",
  fontSize: "16px",
  outline: "none",
  background: "#ffffff",
  color: "#111827",
};

const suggestionWrapper: CSSProperties = {
  position: "relative",
  width: "100%",
};

const suggestionBox: CSSProperties = {
  position: "absolute",
  top: "calc(100% + 6px)",
  left: 0,
  right: 0,
  zIndex: 80,
  background: "#ffffff",
  border: "1px solid #bbf7d0",
  borderRadius: "14px",
  boxShadow: "0 12px 28px rgba(0,0,0,0.16)",
  overflow: "hidden",
};

const suggestionItem: CSSProperties = {
  width: "100%",
  border: "none",
  borderBottom: "1px solid #f3f4f6",
  background: "#ffffff",
  padding: "13px",
  textAlign: "left",
  color: "#111827",
  fontSize: "15px",
  fontWeight: 800,
  cursor: "pointer",
  touchAction: "manipulation",
};

const accessGrid: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
  marginTop: "10px",
};

const accessButton: CSSProperties = {
  borderRadius: "999px",
  padding: "11px 14px",
  fontSize: "13px",
  fontWeight: 900,
  cursor: "pointer",
  transition: "0.2s",
  touchAction: "manipulation",
};

const accessHint: CSSProperties = {
  margin: "8px 0 0",
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: 1.35,
  fontWeight: 700,
};

const mainButton: CSSProperties = {
  width: "100%",
  border: "none",
  borderRadius: "16px",
  padding: "16px",
  background: "#15803d",
  color: "#ffffff",
  fontWeight: 900,
  fontSize: "16px",
  marginBottom: "12px",
  cursor: "pointer",
  boxShadow: "0 10px 20px rgba(21,128,61,0.22)",
  touchAction: "manipulation",
};

const secondaryButton: CSSProperties = {
  ...mainButton,
  background: "#255d3b",
};

const closeButton: CSSProperties = {
  width: "100%",
  border: "none",
  background: "transparent",
  padding: "12px",
  color: "#6b7280",
  fontWeight: 800,
  cursor: "pointer",
  touchAction: "manipulation",
};

const photoSectionHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  marginBottom: "10px",
  color: "#111827",
  fontSize: "14px",
};

const photoPickerButton: CSSProperties = {
  width: "100%",
  minHeight: "136px",
  marginBottom: "16px",
  border: "1px dashed #86efac",
  borderRadius: "20px",
  padding: "10px",
  background: "#f9fafb",
  cursor: "pointer",
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "10px",
  textAlign: "left",
  boxSizing: "border-box",
  touchAction: "manipulation",
};

const emptyPhotoState: CSSProperties = {
  gridColumn: "1 / -1",
  minHeight: "112px",
  borderRadius: "16px",
  background: "#f3f4f6",
  color: "#166534",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "5px",
  textAlign: "center",
  padding: "12px",
  boxSizing: "border-box",
};

const emptyPhotoIcon: CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "999px",
  background: "#dcfce7",
  color: "#166534",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "26px",
  fontWeight: 900,
};

const hiddenFileInput: CSSProperties = {
  display: "none",
};