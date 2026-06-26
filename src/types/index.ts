export type ListingStatus = "Disponível" | "Pausado" | "Vendido";

export type Listing = {
  id: number | string;
  created_at?: string;
  user_id?: string;

  post_type: "offer" | "demand";

  title?: string;
  weight?: string;
  quantity?: number;

  city?: string;
  distance?: string;
  road?: string;

  image?: string;
  images?: string[];

  badge?: string;
  owner?: string;

  verified?: boolean;
  status?: ListingStatus;

  category?: string;
  gender?: string;

  breed?: string;
  age?: string;
  price?: string;

  profile_image?: string;
  whatsapp?: string;

  is_recent?: boolean;
  is_highlighted?: boolean;
  trust_score?: number;
  account_label?: string;
};

export type UserProfile = {
  name: string;
  farm: string;
  city: string;
  profile_image: string;
  badge: string;
  description: string;
  whatsapp: string;
};