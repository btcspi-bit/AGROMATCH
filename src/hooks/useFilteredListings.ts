import { useMemo } from "react";
import type { Listing } from "@/types";

type ListingStatus = "Disponível" | "Pausado" | "Vendido";

type UseFilteredListingsParams = {
  enhancedListings: Listing[];
  activeFilter: string;
  search: string;
  userId?: string;
};

function normalizeText(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isAvailable(listing: Listing) {
  return !listing.status || listing.status === "Disponível";
}

function isCompleted(listing: Listing) {
  return listing.status === "Vendido";
}

export function useFilteredListings({
  enhancedListings,
  activeFilter,
  search,
  userId,
}: UseFilteredListingsParams) {
  return useMemo(() => {
    let result = [...enhancedListings];

    if (activeFilter === "Meus anúncios") {
      result = userId
        ? result.filter((listing) => listing.user_id === userId)
        : [];
    } else if (activeFilter === "Realizados") {
      result = result.filter(isCompleted);
    } else {
      result = result.filter(isAvailable);

      if (activeFilter === "Comprando") {
        result = result.filter((listing) => listing.post_type === "demand");
      } else if (activeFilter === "Vendendo") {
        result = result.filter((listing) => listing.post_type === "offer");
      }
    }

    const query = normalizeText(search);

    if (query) {
      result = result.filter((listing) => {
        const searchableFields = [
          listing.title,
          listing.city,
          listing.owner,
          listing.weight,
          listing.category,
          listing.gender,
          listing.breed,
          listing.age,
          listing.price,
          listing.badge,
          listing.road,
          listing.status,
        ];

        return searchableFields.some((field) =>
          normalizeText(field).includes(query)
        );
      });
    }

    result.sort((a, b) => {
      if (activeFilter !== "Realizados") {
        if (a.is_highlighted && !b.is_highlighted) return -1;
        if (!a.is_highlighted && b.is_highlighted) return 1;

        if (a.is_recent && !b.is_recent) return -1;
        if (!a.is_recent && b.is_recent) return 1;
      }

      const priority = {
        Disponível: 1,
        Pausado: 2,
        Vendido: 3,
      };

      const statusCompare =
        (priority[a.status as ListingStatus] || 1) -
        (priority[b.status as ListingStatus] || 1);

      if (statusCompare !== 0 && activeFilter !== "Realizados") {
        return statusCompare;
      }

      return (
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
      );
    });

    return result;
  }, [activeFilter, enhancedListings, search, userId]);
}
