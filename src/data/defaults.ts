import { UserProfile } from "@/types";

export const DEFAULT_WHATSAPP = "5594999999999";

export const defaultUserProfile: UserProfile = {
  name: "Meu Perfil",
  farm: "AgroMatch Operacional",
  city: "Eldorado do Carajás/PA",
  profile_image: "/avatar1.jpg",
  badge: "Usuário ativo",
  description:
    "Perfil do usuário dentro do AgroMatch. Aqui futuramente ficarão publicações, histórico e negociações.",
  whatsapp: DEFAULT_WHATSAPP,
};