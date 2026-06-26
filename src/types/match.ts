import type { Listing } from "@/types";

export type MatchResult = {
  listing: Listing;
  score: number;
};