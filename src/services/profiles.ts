import type { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

import type { Listing, UserProfile } from "@/types";

import { defaultUserProfile } from "@/data/defaults";

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function normalizeProfile(profile: any, fallback?: Partial<UserProfile>) {
  return {
    name:
      cleanText(profile?.name) ||
      cleanText(fallback?.name) ||
      defaultUserProfile.name,
    farm:
      cleanText(profile?.farm) ||
      cleanText(fallback?.farm) ||
      defaultUserProfile.farm,
    city:
      cleanText(profile?.city) ||
      cleanText(fallback?.city) ||
      defaultUserProfile.city,
    profile_image:
      cleanText(profile?.profile_image) ||
      cleanText(fallback?.profile_image) ||
      defaultUserProfile.profile_image,
    badge:
      cleanText(profile?.badge) ||
      cleanText(fallback?.badge) ||
      defaultUserProfile.badge,
    description:
      cleanText(profile?.description) ||
      cleanText(fallback?.description) ||
      defaultUserProfile.description,
    whatsapp:
      cleanText(profile?.whatsapp) ||
      cleanText(fallback?.whatsapp) ||
      defaultUserProfile.whatsapp,
  };
}

export async function loadOrCreateProfile(currentUser: User) {
  const { data: existingProfile, error } = await supabase
    .from("profiles")
    .select(
      `
      id,
      name,
      farm,
      city,
      profile_image,
      badge,
      description,
      whatsapp
    `
    )
    .eq("id", currentUser.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!existingProfile) {
    const newProfile = {
      id: currentUser.id,
      ...defaultUserProfile,
    };

    const { error: insertError } = await supabase
      .from("profiles")
      .insert([newProfile]);

    if (insertError) {
      throw insertError;
    }

    return defaultUserProfile;
  }

  return normalizeProfile(existingProfile);
}

export async function saveProfile(userId: string, updatedProfile: UserProfile) {
  const cleanProfile = normalizeProfile(updatedProfile);

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    ...cleanProfile,
  });

  if (profileError) {
    throw profileError;
  }

  const { error: listingsError } = await supabase
    .from("listings")
    .update({
      owner: cleanProfile.name,
      city: cleanProfile.city,
      profile_image: cleanProfile.profile_image,
      whatsapp: cleanProfile.whatsapp,
    })
    .eq("user_id", userId);

  if (listingsError) {
    throw listingsError;
  }
}

export async function loadPublicProfile(listing: Listing) {
  if (!listing.user_id) {
    return {
      name: listing.owner || "Perfil AgroMatch",
      farm: "Fazenda cadastrada",
      city: listing.city || "Cidade não informada",
      profile_image:
        listing.profile_image || defaultUserProfile.profile_image,
      badge: listing.verified ? "Perfil verificado" : "Perfil operacional",
      description: "Produtor ou comprador ativo na região.",
      whatsapp: listing.whatsapp || defaultUserProfile.whatsapp,
      active_listings: 1,
      done_listings: 0,
      total_listings: 1,
    };
  }

  const [{ data: profileData, error: profileError }, { count: totalListings, error: totalError }, { count: activeListings, error: activeError }, { count: doneListings, error: doneError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          `
          id,
          name,
          farm,
          city,
          profile_image,
          badge,
          description,
          whatsapp
        `
        )
        .eq("id", listing.user_id)
        .maybeSingle(),

      supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", listing.user_id),

      supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", listing.user_id)
        .not("status", "in", '("Vendido","Pausado")'),

      supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", listing.user_id)
        .eq("status", "Vendido"),
    ]);

  if (profileError) {
    throw profileError;
  }

  if (totalError) {
    throw totalError;
  }

  if (activeError) {
    throw activeError;
  }

  if (doneError) {
    throw doneError;
  }

  const profile = normalizeProfile(profileData, {
    name: listing.owner || "Perfil AgroMatch",
    farm: "Fazenda cadastrada",
    city: listing.city || "Cidade não informada",
    profile_image:
      listing.profile_image || defaultUserProfile.profile_image,
    badge: "Perfil verificado",
    description: "Produtor ou comprador ativo na região.",
    whatsapp: listing.whatsapp || defaultUserProfile.whatsapp,
  });

  return {
    ...profile,
    active_listings: activeListings || 0,
    done_listings: doneListings || 0,
    total_listings: totalListings || 0,
  };
}