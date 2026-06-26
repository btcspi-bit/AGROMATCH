import { supabase } from "@/lib/supabase";

import type { Listing, UserProfile } from "@/types";

type ListingStatus = "Disponível" | "Pausado" | "Vendido";

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function normalizeImages(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 3);
}

function buildListingPayload(
  opportunity: any,
  userId: string,
  userProfile: UserProfile,
  mode: "create" | "update"
) {
  const announcementWhatsapp = cleanText(opportunity.whatsapp);
  const profileWhatsapp = cleanText((userProfile as any).whatsapp);

  const images = normalizeImages(opportunity.images);
  const mainImage = cleanText(opportunity.image) || images[0] || "";

  const payload: any = {
    post_type: opportunity.post_type,
    title: cleanText(opportunity.title),
    weight: cleanText(opportunity.weight),
    quantity: Number(opportunity.quantity || 0),
    city: cleanText(opportunity.city) || cleanText((userProfile as any).city),
    distance: cleanText(opportunity.distance),
    road: cleanText(opportunity.road),
    image: mainImage,
    images,
    badge: opportunity.badge,
    owner: cleanText((userProfile as any).name),
    verified: true,
    category: cleanText(opportunity.category),
    gender: cleanText(opportunity.gender),
    breed: cleanText(opportunity.breed),
    age: cleanText(opportunity.age),
    price: cleanText(opportunity.price),
    profile_image: cleanText((userProfile as any).profile_image),
    whatsapp: announcementWhatsapp || profileWhatsapp,
  };

  if (mode === "create") {
    payload.user_id = userId;
    payload.status = "Disponível";
  }

  return payload;
}

export async function loadListings() {
  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      id,
      user_id,
      post_type,
      title,
      weight,
      quantity,
      city,
      distance,
      road,
      image,
      images,
      badge,
      owner,
      verified,
      status,
      category,
      gender,
      breed,
      age,
      price,
      profile_image,
      whatsapp,
      created_at
    `
    )
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) throw error;

  return (data || []) as Listing[];
}

export async function loadUserListings(userId: string) {
  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      id,
      user_id,
      post_type,
      title,
      weight,
      quantity,
      city,
      distance,
      road,
      image,
      images,
      badge,
      owner,
      verified,
      status,
      category,
      gender,
      breed,
      age,
      price,
      profile_image,
      whatsapp,
      created_at
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) throw error;

  return (data || []) as Listing[];
}

export async function createOpportunity(
  newOpportunity: any,
  userId: string,
  userProfile: UserProfile
) {
  const payload = buildListingPayload(
    newOpportunity,
    userId,
    userProfile,
    "create"
  );

  const { data, error } = await supabase
    .from("listings")
    .insert([payload])
    .select("*")
    .single();

  if (error) throw error;

  return data as Listing;
}

export async function updateOpportunity(
  listingId: number,
  updatedOpportunity: any,
  userId: string,
  userProfile: UserProfile
) {
  const payload = buildListingPayload(
    updatedOpportunity,
    userId,
    userProfile,
    "update"
  );

  const { data, error } = await supabase
    .from("listings")
    .update(payload)
    .eq("id", listingId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;

  return data as Listing;
}

export async function updateListingStatus(
  listingId: number,
  userId: string,
  status: ListingStatus
) {
  const { error } = await supabase
    .from("listings")
    .update({ status })
    .eq("id", listingId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteListing(listingId: number, userId: string) {
  const { error } = await supabase
    .from("listings")
    .delete()
    .eq("id", listingId)
    .eq("user_id", userId);

  if (error) throw error;
}