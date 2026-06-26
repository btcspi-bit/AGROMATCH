import type { Listing } from "@/types";
import type { MatchResult } from "@/types/match";

function normalizeValue(value: any) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getNumber(value: any) {
  if (!value) return 0;

  const cleaned = String(value).replace(/[^\d.,]/g, "").replace(",", ".");
  return Number(cleaned) || 0;
}

function isAvailable(listing: Listing) {
  return normalizeValue(listing.status || "Disponível") === "disponivel";
}

function normalizePostType(value: any) {
  const normalized = normalizeValue(value);

  if (
    normalized === "demand" ||
    normalized === "compra" ||
    normalized === "comprando" ||
    normalized === "buyer" ||
    normalized === "buy"
  ) {
    return "demand";
  }

  if (
    normalized === "offer" ||
    normalized === "venda" ||
    normalized === "vendendo" ||
    normalized === "seller" ||
    normalized === "sell"
  ) {
    return "offer";
  }

  return normalized;
}

function isOppositeType(source: Listing, target: Listing) {
  return normalizePostType(source.post_type) !== normalizePostType(target.post_type);
}

function isSameOwner(source: Listing, target: Listing) {
  const sourceUserId = (source as any).user_id;
  const targetUserId = (target as any).user_id;

  if (!sourceUserId || !targetUserId) return false;

  return sourceUserId === targetUserId;
}

function getOfferAndDemand(source: Listing, target: Listing) {
  const sourceType = normalizePostType(source.post_type);
  const targetType = normalizePostType(target.post_type);

  if (sourceType === "offer" && targetType === "demand") {
    return { offer: source, demand: target };
  }

  if (sourceType === "demand" && targetType === "offer") {
    return { offer: target, demand: source };
  }

  return null;
}

function getDistanceKm(value: any) {
  const normalized = normalizeValue(value);

  if (!normalized) return 0;

  if (normalized.includes("qualquer")) return 9999;
  if (normalized.includes("acima")) return 201;

  const number = getNumber(normalized);

  return number || 0;
}

function getAccessLevel(value: any) {
  const normalized = normalizeValue(value);

  if (normalized.includes("facil")) return "facil";
  if (normalized.includes("medio")) return "medio";
  if (normalized.includes("dificil")) return "dificil";
  if (normalized.includes("qualquer")) return "qualquer";

  return "";
}

function isMixedGender(value: any) {
  return normalizeValue(value).includes("lote misto");
}

function isGenderCompatible(source: Listing, target: Listing) {
  const sourceGender = normalizeValue(source.gender);
  const targetGender = normalizeValue(target.gender);

  if (!sourceGender || !targetGender) return true;

  if (isMixedGender(source.gender) || isMixedGender(target.gender)) return true;

  return sourceGender === targetGender;
}

function isCategoryCompatible(source: Listing, target: Listing) {
  const sourceCategory = normalizeValue(source.category);
  const targetCategory = normalizeValue(target.category);

  if (!sourceCategory || !targetCategory) return true;

  if (sourceCategory === targetCategory) return true;

  const sourceIsBoi = sourceCategory.includes("boi");
  const targetIsBoi = targetCategory.includes("boi");

  const sourceIsVaca = sourceCategory.includes("vaca");
  const targetIsVaca = targetCategory.includes("vaca");

  const sourceIsBezerro =
    sourceCategory.includes("bezerro") || sourceCategory.includes("bezerra");
  const targetIsBezerro =
    targetCategory.includes("bezerro") || targetCategory.includes("bezerra");

  const sourceIsLote = sourceCategory.includes("lote");
  const targetIsLote = targetCategory.includes("lote");

  if (sourceIsBoi && targetIsBoi) return true;
  if (sourceIsVaca && targetIsVaca) return true;
  if (sourceIsBezerro && targetIsBezerro) return true;
  if (sourceIsLote || targetIsLote) return true;

  return false;
}

function isBreedCompatible(source: Listing, target: Listing) {
  const sourceBreed = normalizeValue(source.breed);
  const targetBreed = normalizeValue(target.breed);

  if (!sourceBreed || !targetBreed) return true;

  if (sourceBreed === targetBreed) return true;

  if (sourceBreed.includes("cruzado") || targetBreed.includes("cruzado")) {
    return true;
  }

  if (sourceBreed.includes("mestico") || targetBreed.includes("mestico")) {
    return true;
  }

  if (sourceBreed.includes(targetBreed) || targetBreed.includes(sourceBreed)) {
    return true;
  }

  return false;
}

function calculateDistanceScore(offer: Listing, demand: Listing) {
  const offerDistance = getDistanceKm(offer.distance);
  const buyerRadius = getDistanceKm(demand.distance);

  if (!offerDistance || !buyerRadius) return 0;

  if (buyerRadius >= 9999) return 10;

  if (offerDistance <= buyerRadius) {
    const margin = buyerRadius - offerDistance;

    if (margin >= 50) return 10;
    if (margin >= 20) return 8;
    return 6;
  }

  const excess = offerDistance - buyerRadius;

  if (excess <= 20) return -8;

  return -30;
}

function calculateAccessScore(offer: Listing, demand: Listing) {
  const offerAccess = getAccessLevel(offer.road);
  const buyerAccessText = normalizeValue(demand.road);

  if (!offerAccess || !buyerAccessText) return 0;

  if (buyerAccessText.includes("qualquer")) return 8;

  const acceptsEasy = buyerAccessText.includes("facil");
  const acceptsMedium = buyerAccessText.includes("medio");
  const acceptsHard = buyerAccessText.includes("dificil");

  const acceptsAll = acceptsEasy && acceptsMedium && acceptsHard;

  if (acceptsAll) return 8;

  if (offerAccess === "facil" && acceptsEasy) return 8;
  if (offerAccess === "medio" && acceptsMedium) return 8;
  if (offerAccess === "dificil" && acceptsHard) return 8;

  return -25;
}

function calculateWeightScore(source: Listing, target: Listing) {
  const sourceWeight = getNumber(source.weight);
  const targetWeight = getNumber(target.weight);

  if (!sourceWeight || !targetWeight) return 0;

  const diff = Math.abs(sourceWeight - targetWeight);

  if (diff <= 30) return 16;
  if (diff <= 60) return 10;
  if (diff <= 100) return 4;

  return -12;
}

function calculateQuantityScore(source: Listing, target: Listing) {
  const sourceQuantity = getNumber(source.quantity);
  const targetQuantity = getNumber(target.quantity);

  if (!sourceQuantity || !targetQuantity) return 0;

  const diff = Math.abs(sourceQuantity - targetQuantity);

  if (diff === 0) return 8;
  if (diff <= 5) return 5;
  if (diff <= 10) return 2;

  return 0;
}

export function calculateMatchScore(source: Listing, target: Listing) {
  let score = 0;

  if (!isAvailable(target)) return 0;
  if (!isOppositeType(source, target)) return 0;
  if (String(source.id) === String(target.id)) return 0;
  if (isSameOwner(source, target)) return 0;

  const pair = getOfferAndDemand(source, target);

  if (!pair) return 0;

  const { offer, demand } = pair;

  if (!isCategoryCompatible(source, target)) return 0;
  if (!isGenderCompatible(source, target)) return 0;
  if (!isBreedCompatible(source, target)) return 0;

  score += 20;

  if (
    normalizeValue(source.category) &&
    normalizeValue(source.category) === normalizeValue(target.category)
  ) {
    score += 22;
  } else if (isCategoryCompatible(source, target)) {
    score += 10;
  }

  if (
    normalizeValue(source.gender) &&
    normalizeValue(source.gender) === normalizeValue(target.gender)
  ) {
    score += 14;
  } else if (isGenderCompatible(source, target)) {
    score += 6;
  }

  if (
    normalizeValue(source.breed) &&
    normalizeValue(source.breed) === normalizeValue(target.breed)
  ) {
    score += 16;
  } else if (isBreedCompatible(source, target)) {
    score += 7;
  }

  score += calculateWeightScore(source, target);
  score += calculateQuantityScore(source, target);

  if (
    normalizeValue(source.city) &&
    normalizeValue(source.city) === normalizeValue(target.city)
  ) {
    score += 10;
  }

  score += calculateDistanceScore(offer, demand);
  score += calculateAccessScore(offer, demand);

  return Math.max(0, score);
}

export function findCompatibleListings(
  sourceListing: Listing,
  allListings: Listing[],
  limit = 5
): MatchResult[] {
  return allListings
    .map((listing) => ({
      listing,
      score: calculateMatchScore(sourceListing, listing),
    }))
    .filter((item) => item.score >= 60)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}