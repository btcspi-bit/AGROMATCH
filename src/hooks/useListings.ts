import { useCallback, useEffect, useMemo, useState } from "react";
import type { Listing } from "@/types";

import {
  deleteListing,
  loadListings as loadListingsService,
  updateListingStatus,
} from "@/services/listings";

type ListingStatus = "Disponível" | "Pausado" | "Vendido";

export function useListings(userId?: string) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadListings = useCallback(async () => {
    try {
      setIsLoadingListings(true);

      const data = await loadListingsService();

      setListings(Array.isArray(data) ? data : []);

      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      console.error("Erro ao carregar feed:", error);
      setListings([]);
      return [];
    } finally {
      setIsLoadingListings(false);
    }
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const isMyListing = useCallback(
    (listing?: Listing | null) => {
      return !!userId && !!listing?.user_id && listing.user_id === userId;
    },
    [userId]
  );

  const removeListing = useCallback(
    async (listing: Listing) => {
      if (!userId || !isMyListing(listing)) {
  alert("Você só pode excluir seus próprios anúncios.");
  return false;
}

      const confirmed = confirm("Excluir este anúncio definitivamente?");
      if (!confirmed) return false;

      try {
        setIsActionLoading(true);

        await deleteListing(Number(listing.id), userId);

        setListings((prev) =>
          prev.filter((item) => String(item.id) !== String(listing.id))
        );

        alert("Anúncio excluído com sucesso.");
        return true;
      } catch (error: any) {
        console.error("Erro ao excluir anúncio:", error);
        alert("Erro ao excluir anúncio: " + error.message);
        return false;
      } finally {
        setIsActionLoading(false);
      }
    },
    [isMyListing]
  );

  const changeListingStatus = useCallback(
    async (listing: Listing, status: ListingStatus) => {
      if (!userId || !isMyListing(listing)) {
  alert("Você só pode alterar seus próprios anúncios.");
  return null;
}

      try {
        setIsActionLoading(true);

        await updateListingStatus(Number(listing.id), userId, status);

        const updatedListing = {
          ...listing,
          status,
        };

        setListings((prev) =>
          prev.map((item) =>
            String(item.id) === String(listing.id) ? updatedListing : item
          )
        );

        return updatedListing;
      } catch (error: any) {
        console.error("Erro ao alterar status:", error);
        alert("Erro ao alterar status: " + error.message);
        return null;
      } finally {
        setIsActionLoading(false);
      }
    },
    [isMyListing]
  );

  const enhancedListings = useMemo(() => {
    const now = Date.now();
    let availableRank = 0;

    return listings.map((listing) => {
      const createdTime = listing.created_at
        ? new Date(listing.created_at).getTime()
        : 0;

      const hoursDiff = createdTime
        ? (now - createdTime) / (1000 * 60 * 60)
        : 9999;

      const isRecent = hoursDiff <= 48;
      const isAvailable = !listing.status || listing.status === "Disponível";

      const trustScore = [
        listing.whatsapp,
        listing.profile_image,
        listing.owner,
        listing.city,
        listing.verified,
      ].filter(Boolean).length;

      if (isAvailable) {
        availableRank += 1;
      }

      return {
        ...listing,
        is_recent: isRecent,
        is_highlighted: isAvailable && availableRank <= 3,
        trust_score: trustScore,
        account_label:
          trustScore >= 4
            ? "Perfil confiável"
            : trustScore >= 2
            ? "Perfil ativo"
            : undefined,
      };
    });
  }, [listings]);

  const feedStats = useMemo(() => {
    const availableListings = enhancedListings.filter(
      (listing) => !listing.status || listing.status === "Disponível"
    );

    const completed = enhancedListings.filter(
      (listing) => listing.status === "Vendido"
    ).length;

    const paused = enhancedListings.filter(
      (listing) => listing.status === "Pausado"
    ).length;

    const recent = availableListings.filter((listing) => listing.is_recent).length;

    const highlighted = availableListings.filter(
      (listing) => listing.is_highlighted
    ).length;

    return {
      available: availableListings.length,
      completed,
      paused,
      recent,
      highlighted,
    };
  }, [enhancedListings]);

  return {
    listings,
    setListings,
    enhancedListings,
    feedStats,
    isLoadingListings,
    isActionLoading,
    loadListings,
    isMyListing,
    removeListing,
    changeListingStatus,
  };
}