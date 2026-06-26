import { supabase } from "@/lib/supabase";
import type { MatchResult } from "@/types/match";

const MAX_MATCHES_PER_LISTING = 20;
const MAX_SUGGESTED_OPPORTUNITIES = 60;

export async function saveListingMatches(
  sourceListingId: string,
  sourceUserId: string,
  matches: MatchResult[]
) {
  const normalizedSourceListingId = String(sourceListingId);

  await supabase
    .from("listing_matches")
    .delete()
    .eq("source_listing_id", normalizedSourceListingId)
    .eq("source_user_id", sourceUserId);

  if (!matches.length) return;

  const rows = matches
    .slice(0, MAX_MATCHES_PER_LISTING)
    .map(({ listing, score }) => ({
      source_listing_id: normalizedSourceListingId,
      target_listing_id: String(listing.id),
      source_user_id: sourceUserId,
      target_user_id: (listing as any).user_id || null,
      score: Number(score || 0),
    }));

  const { error } = await supabase.from("listing_matches").insert(rows);

  if (error) {
    console.error("Erro ao salvar oportunidades:", error);
  }
}

export async function loadSuggestedOpportunityIds(userId: string) {
  const { data, error } = await supabase
    .from("listing_matches")
    .select("target_listing_id, score, created_at")
    .eq("source_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(MAX_SUGGESTED_OPPORTUNITIES);

  if (error) {
    console.error("Erro ao carregar oportunidades:", error);
    return [];
  }

  return data || [];
}