"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

import { AuthModal } from "@/components/AuthModal";
import { BottomNavigation } from "@/components/BottomNavigation";
import { CreateOpportunityModal } from "@/components/CreateOpportunityModal";
import { DemandCard } from "@/components/DemandCard";
import { DemandModal } from "@/components/DemandModal";
import { EditProfileModal } from "@/components/EditProfileModal";
import { FeedCard } from "@/components/FeedCard";
import { ListingModal } from "@/components/ListingModal";
import { MatchResultsModal } from "@/components/MatchResultsModal";
import { ProfileModal } from "@/components/ProfileModal";
import { QuickFilters } from "@/components/QuickFilters";
import { SearchModal } from "@/components/SearchModal";
import { WhatsAppModal } from "@/components/WhatsAppModal";

import { useAuthProfile } from "@/hooks/useAuthProfile";
import { useFilteredListings } from "@/hooks/useFilteredListings";
import { useListings } from "@/hooks/useListings";

import {
  createOpportunity as createOpportunityService,
  updateOpportunity as updateOpportunityService,
} from "@/services/listings";

import {
  loadSuggestedOpportunityIds,
  saveListingMatches,
} from "@/services/listingMatches";

import { findCompatibleListings } from "@/services/matches";
import { loadPublicProfile as loadPublicProfileService } from "@/services/profiles";

import type { Listing, UserProfile } from "@/types";
import type { MatchResult } from "@/types/match";

type ListingStatus = "Disponível" | "Pausado" | "Vendido";

function normalizeProfileText(value: any) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getProfilePhone(profile: any) {
  return (
    String(profile.whatsapp || "").replace(/\D/g, "") ||
    String(profile.phone || "").replace(/\D/g, "")
  );
}

function isDefaultProfileValue(value: any, blockedValues: string[]) {
  const normalizedValue = normalizeProfileText(value);

  if (!normalizedValue) return true;

  return blockedValues.some(
    (blockedValue) => normalizedValue === normalizeProfileText(blockedValue)
  );
}

function getMissingProfileFields(profile: UserProfile) {
  const currentProfile = profile as any;

  const missingFields: string[] = [];

  const name = String(currentProfile.name || "").trim();

  const farm =
    String(currentProfile.farm || "").trim() ||
    String(currentProfile.farm_name || "").trim() ||
    String(currentProfile.ranch || "").trim();

  const description =
    String(currentProfile.description || "").trim() ||
    String(currentProfile.bio || "").trim();

  const whatsapp = getProfilePhone(currentProfile);

  const city = String(currentProfile.city || "").trim();

  const profileImage = String(currentProfile.profile_image || "").trim();

  const defaultNames = ["Meu Perfil", "Perfil", "Usuário", "Usuario"];
  const defaultFarms = [
    "AgroMatch Operacional",
    "Minha Fazenda",
    "Fazenda",
    "Empresa",
  ];
  const defaultDescriptions = [
    "Perfil do usuário dentro do AgroMatch. Aqui futuramente ficarão publicações, histórico e negociações.",
    "Perfil do usuario dentro do AgroMatch. Aqui futuramente ficarao publicacoes, historico e negociacoes.",
    "Perfil do usuário dentro do AgroMatch.",
    "Perfil do usuario dentro do AgroMatch.",
  ];

  if (name.length < 3 || isDefaultProfileValue(name, defaultNames)) {
    missingFields.push("nome");
  }

  if (!profileImage || profileImage === "/profile_image1.jpg") {
    missingFields.push("foto de perfil");
  }

  if (farm.length < 2 || isDefaultProfileValue(farm, defaultFarms)) {
    missingFields.push("fazenda");
  }

  if (
    description.length < 10 ||
    isDefaultProfileValue(description, defaultDescriptions)
  ) {
    missingFields.push("descrição");
  }

  if (city.length < 2) {
    missingFields.push("cidade");
  }

  if (whatsapp.length !== 11) {
    missingFields.push("telefone/WhatsApp com DDD");
  }

  return missingFields;
}

function isProfileComplete(profile: UserProfile) {
  return getMissingProfileFields(profile).length === 0;
}

function isListingAvailable(listing: Listing) {
  return !listing.status || listing.status === "Disponível";
}
function getListingKey(listing: Listing) {
  return `${listing.post_type || "listing"}-${listing.id}`;
}

function removeDuplicatedListings(listings: Listing[]) {
  const seen = new Set<string>();

  return listings.filter((listing) => {
    const key = getListingKey(listing);

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function removeDuplicatedMatches(matches: MatchResult[]) {
  const seen = new Set<string>();

  return matches.filter((match) => {
    const key = getListingKey(match.listing);

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function getCompletedKind(listing: Listing) {
  return listing.post_type === "demand" ? "Compra atendida" : "Venda realizada";
}

function CompletedListingRow({ listing }: { listing: Listing }) {
  const mainInfo = [
    listing.weight,
    listing.gender,
    listing.quantity ? `${listing.quantity} cabeça(s)` : "",
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <div style={completedRow}>
      <div style={completedRowIcon}>✅</div>

      <div style={completedRowBody}>
        <div style={completedRowTop}>
          <span style={completedRowKind}>{getCompletedKind(listing)}</span>
          <span style={completedRowStatus}>Concluído</span>
        </div>

        <strong style={completedRowTitle}>
          {listing.title ||
            (listing.post_type === "demand" ? "Compra sem título" : "Lote sem título")}
        </strong>

        <span style={completedRowMeta}>
          {[listing.breed, listing.category].filter(Boolean).join(" • ") ||
            "Dados do lote não informados"}
        </span>

        <span style={completedRowMeta}>
          {mainInfo || "Resumo não informado"}
        </span>

        <span style={completedRowLocation}>
          {listing.price || "Valor não informado"}
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [search, setSearch] = useState("");

  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(
    null
  );

  const [selectedWhatsApp, setSelectedWhatsApp] = useState<Listing | null>(
    null
  );

  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);

  const [matchedListings, setMatchedListings] = useState<MatchResult[]>([]);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);

  const [suggestedOpportunities, setSuggestedOpportunities] = useState<
    MatchResult[]
  >([]);

  const [completedListingFeedback, setCompletedListingFeedback] =
    useState<Listing | null>(null);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const lastNavigationKeyRef = useRef("root");
  const suppressNextHistoryPushRef = useRef(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { user, userProfile, saveProfile, logout } = useAuthProfile();

  const {
    enhancedListings,
    feedStats,
    isLoadingListings,
    isActionLoading,
    loadListings,
    isMyListing,
    removeListing,
    changeListingStatus,
  } = useListings(user?.id);

  const cleanEnhancedListings = useMemo(() => {
    return removeDuplicatedListings(enhancedListings);
  }, [enhancedListings]);

  const filteredListings = useFilteredListings({
    enhancedListings: cleanEnhancedListings,
    activeFilter,
    search,
    userId: user?.id,
  });

  const loadSuggestedOpportunities = useCallback(async () => {
    if (!user?.id || cleanEnhancedListings.length === 0) {
      setSuggestedOpportunities([]);
      return;
    }

    try {
      const savedMatches = await loadSuggestedOpportunityIds(user.id);

      const opportunities = savedMatches
        .map((savedMatch: any) => {
          const listing = cleanEnhancedListings.find(
            (item) => String(item.id) === String(savedMatch.target_listing_id)
          );

          if (!listing) return null;

          if (listing.status && listing.status !== "Disponível") {
            return null;
          }

          return {
            listing,
            score: Number(savedMatch.score || 0),
          };
        })
        .filter((item): item is MatchResult => item !== null)
        .sort((a, b) => b.score - a.score);

      setSuggestedOpportunities(removeDuplicatedMatches(opportunities));
    } catch (error) {
      console.error("Erro ao carregar oportunidades sugeridas:", error);
      setSuggestedOpportunities([]);
    }
  }, [user?.id, cleanEnhancedListings]);

  const refreshAppData = useCallback(async () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    await loadListings();
  }, [loadListings]);

  useEffect(() => {
    loadSuggestedOpportunities();
  }, [loadSuggestedOpportunities]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);
  useEffect(() => {
  if (typeof window === "undefined") return;

  async function handleAppResume() {
    await refreshAppData();
  }

  function handleVisibilityChange() {
    if (document.visibilityState === "visible") {
      handleAppResume();
    }
  }

  window.addEventListener("focus", handleAppResume);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    window.removeEventListener("focus", handleAppResume);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}, [refreshAppData]);

  const visibleListings = useMemo(() => {
    if (activeFilter === "Oportunidades") {
      return removeDuplicatedListings(
        suggestedOpportunities
          .map((item) => item.listing)
          .filter((listing): listing is Listing =>
            Boolean(listing) && isListingAvailable(listing)
          )
      );
    }

    if (activeFilter === "Todos" && !search.trim()) {
      return removeDuplicatedListings(
        cleanEnhancedListings.filter(isListingAvailable)
      );
    }

    return removeDuplicatedListings(filteredListings.filter(Boolean));
  }, [
    activeFilter,
    search,
    suggestedOpportunities,
    cleanEnhancedListings,
    filteredListings,
  ]);

  const emptyMessage = useMemo(() => {
    if (activeFilter === "Oportunidades") {
      return "Ainda não encontramos oportunidades compatíveis para você.";
    }

    if (activeFilter === "Meus anúncios") {
      return "Você ainda não publicou nenhum anúncio.";
    }

    if (activeFilter === "Realizados") {
      return "Ainda não há negócios realizados no AgroMatch.";
    }

    return "Nenhuma oportunidade encontrada nessa região.";
  }, [activeFilter]);

  const selectedOffer =
    selectedListing?.post_type === "offer" ? selectedListing : null;

  const selectedDemand =
    selectedListing?.post_type === "demand" ? selectedListing : null;

  const currentNavigationKey = useMemo(() => {
    if (completedListingFeedback) return "completed-feedback";
    if (selectedWhatsApp) return `whatsapp-${selectedWhatsApp.id}`;
    if (selectedProfile) return "profile-modal";
    if (isMatchModalOpen) return "match-modal";
    if (selectedListing)
      return `listing-${selectedListing.post_type}-${selectedListing.id}`;
    if (isSearchOpen) return "search-modal";
    if (isCreateOpen) return "create-modal";
    if (isEditProfileOpen) return "edit-profile-modal";
    if (isAuthOpen) return "auth-modal";

    if (activeFilter !== "Todos" || search.trim()) {
      return `feed-filter-${activeFilter}-${search}`;
    }

    return "root";
  }, [
    completedListingFeedback,
    selectedWhatsApp,
    selectedProfile,
    isMatchModalOpen,
    selectedListing,
    isSearchOpen,
    isCreateOpen,
    isEditProfileOpen,
    isAuthOpen,
    activeFilter,
    search,
  ]);

  const closeTopAppLayer = useCallback(() => {
    if (completedListingFeedback) {
      setCompletedListingFeedback(null);
      return true;
    }

    if (selectedWhatsApp) {
      setSelectedWhatsApp(null);
      return true;
    }

    if (selectedProfile) {
      setSelectedProfile(null);
      return true;
    }

    if (isMatchModalOpen) {
      setIsMatchModalOpen(false);
      setMatchedListings([]);
      return true;
    }

    if (selectedListing) {
      setSelectedListing(null);
      return true;
    }

    if (isSearchOpen) {
      setIsSearchOpen(false);
      return true;
    }

    if (isCreateOpen) {
      setIsCreateOpen(false);
      setEditingListing(null);
      return true;
    }

    if (isEditProfileOpen) {
      setIsEditProfileOpen(false);
      return true;
    }

    if (isAuthOpen) {
      setIsAuthOpen(false);
      return true;
    }

    if (activeFilter !== "Todos" || search.trim()) {
      setActiveFilter("Todos");
      setSearch("");
      return true;
    }

    return false;
  }, [
    completedListingFeedback,
    selectedWhatsApp,
    selectedProfile,
    isMatchModalOpen,
    selectedListing,
    isSearchOpen,
    isCreateOpen,
    isEditProfileOpen,
    isAuthOpen,
    activeFilter,
    search,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.history.replaceState(
      { agroMatchRoot: true },
      "",
      window.location.href
    );
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (currentNavigationKey === "root") {
      lastNavigationKeyRef.current = "root";
      return;
    }

    if (suppressNextHistoryPushRef.current) {
      suppressNextHistoryPushRef.current = false;
      lastNavigationKeyRef.current = currentNavigationKey;
      return;
    }

    if (lastNavigationKeyRef.current !== currentNavigationKey) {
      window.history.pushState(
        { agroMatchLayer: currentNavigationKey },
        "",
        window.location.href
      );

      lastNavigationKeyRef.current = currentNavigationKey;
    }
  }, [currentNavigationKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function handleBrowserBack() {
      const closedLayer = closeTopAppLayer();

      if (closedLayer) {
        suppressNextHistoryPushRef.current = true;
      }
    }

    window.addEventListener("popstate", handleBrowserBack);

    return () => {
      window.removeEventListener("popstate", handleBrowserBack);
    };
  }, [closeTopAppLayer]);

  async function handleSaveProfile(updatedProfile: UserProfile) {
    if (!user) {
      setIsAuthOpen(true);
      alert("Entre na sua conta para editar o perfil.");
      return;
    }

    const saved = await saveProfile(updatedProfile);

    if (saved) {
      setIsEditProfileOpen(false);
      await refreshAppData();
    }
  }

  async function handleCreateOpportunity(newOpportunity: any) {
    if (!user) {
      setIsAuthOpen(true);
      alert("Entre na sua conta para publicar.");
      return;
    }

    if (!isProfileComplete(userProfile)) {
      const missingFields = getMissingProfileFields(userProfile);

      alert(
        `Finalize seu perfil antes de publicar.\n\nFalta preencher: ${missingFields.join(
          ", "
        )}.`
      );

      setIsCreateOpen(false);
      setEditingListing(null);
      setIsEditProfileOpen(true);
      return;
    }

    try {
      const createdListing = await createOpportunityService(
        newOpportunity,
        user.id,
        userProfile
      );

      const compatibleListings = removeDuplicatedMatches(
        findCompatibleListings(createdListing, cleanEnhancedListings)
      );

      setMatchedListings(compatibleListings);

      await saveListingMatches(
        String(createdListing.id),
        user.id,
        compatibleListings
      );

      setIsCreateOpen(false);
      setEditingListing(null);
      setActiveFilter("Todos");
      setSearch("");

      await refreshAppData();

      if (compatibleListings.length > 0) {
        setIsMatchModalOpen(true);
      }
    } catch (error) {
      console.error("Erro ao publicar:", error);
      alert("Não foi possível publicar agora. Tente novamente.");
    }
  }

  async function handleUpdateOpportunity(updatedOpportunity: any) {
    if (!user || !editingListing) {
      setIsAuthOpen(true);
      alert("Entre na sua conta para editar.");
      return;
    }

    try {
      const updatedListing = await updateOpportunityService(
        Number(editingListing.id),
        updatedOpportunity,
        user.id,
        userProfile
      );

      setSelectedListing(updatedListing);
      setEditingListing(null);
      setIsCreateOpen(false);

      await refreshAppData();
    } catch (error) {
      console.error("Erro ao editar anúncio:", error);
      alert("Não foi possível salvar as alterações agora.");
    }
  }

  async function openProfile(listing: Listing) {
    try {
      const profile = await loadPublicProfileService(listing);
      setSelectedProfile(profile);
    } catch (error) {
      console.error("Erro ao abrir perfil:", error);
      alert("Não foi possível abrir esse perfil agora.");
    }
  }

  async function handleOpenCreate() {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    if (!isProfileComplete(userProfile)) {
      const missingFields = getMissingProfileFields(userProfile);

      alert(
        `Finalize seu perfil antes de publicar.\n\nFalta preencher: ${missingFields.join(
          ", "
        )}.`
      );

      setIsEditProfileOpen(true);
      return;
    }

    setEditingListing(null);
    setIsCreateOpen(true);
  }

  function handleEditListing(listing: Listing) {
    setEditingListing(listing);
    setIsCreateOpen(true);
  }

  async function handleOpenMyProfile() {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    setIsEditProfileOpen(true);
  }

  function openWhatsAppForListing(listing: Listing) {
    const cleanWhatsApp = String(listing.whatsapp || "").replace(/\D/g, "");

    if (cleanWhatsApp.length !== 11) {
      alert(
        "Este anúncio não possui WhatsApp completo com DDD. Exemplo: 94991186237, 91999999999 ou 11999999999."
      );
      return;
    }

    setSelectedWhatsApp({
      ...listing,
      whatsapp: cleanWhatsApp,
    });
  }

  async function handleDeleteListing(listing: Listing) {
    const deleted = await removeListing(listing);

    if (deleted) {
    setSelectedListing(null);
    setEditingListing(null);
    setIsCreateOpen(false);
    setIsMatchModalOpen(false);
    setMatchedListings([]);
    setSelectedWhatsApp(null);
    setSelectedProfile(null);

    setActiveFilter("Todos");
    setSearch("");

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.history.replaceState(
        { agroMatchRoot: true },
        "",
        window.location.href
      );
    }

    await refreshAppData();
    }
  }

  async function handleChangeListingStatus(
    listing: Listing,
    status: ListingStatus
  ) {
    const updatedListing = await changeListingStatus(listing, status);

    if (updatedListing) {
      if (status === "Vendido") {
        setSelectedListing(null);
        setEditingListing(null);
        setIsCreateOpen(false);
        setIsMatchModalOpen(false);
        setMatchedListings([]);
        setSelectedWhatsApp(null);
        setSelectedProfile(null);
        setActiveFilter("Meus anúncios");
        setSearch("");
        setCompletedListingFeedback(updatedListing);
      } else {
        setSelectedListing(updatedListing);
      }

      await refreshAppData();
    }
  }

  function closeSelectedListing() {
    setSelectedListing(null);

    if (matchedListings.length > 0) {
      setIsMatchModalOpen(true);
      return;
    }

    setMatchedListings([]);
  }

  function handleGoHome() {
    setActiveFilter("Todos");
    setSearch("");
  }

  function handleOpenDeals() {
    setActiveFilter("Oportunidades");
    setSearch("");
  }

  function handleOpenMyListings() {
    setActiveFilter("Meus anúncios");
    setSearch("");
  }

  function handleOpenListing(listing: Listing) {
    setSelectedListing(listing);
  }

  if (!user) {
    return (
      <main style={authPage}>
        <div style={authCard}>
          <div style={authIcon}>🐂</div>

          <h1 style={authTitle}>AgroMatch</h1>

          <p style={authText}>
            Entre para comprar, vender e negociar gado com mais segurança.
          </p>

          <button onClick={() => setIsAuthOpen(true)} style={primaryButton}>
            Entrar ou criar conta
          </button>
        </div>

        <AuthModal
          open={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          userEmail={undefined}
        />
      </main>
    );
  }

  return (
    <main style={page}>
      <style>{`
        html, body {
          background: #f6faf7;
        }

        body, button, input, select, textarea {
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <header style={hero}>
        <div style={heroGlowTop} />
        <div style={heroGlowBottom} />

        <div style={heroContent}>
          <div>
            <span style={heroEyebrow}>Mercado Agropecuário</span>

            <h1 style={heroTitle}>AgroMatch</h1>

            <p style={heroSubtitle}>
              {activeFilter === "Meus anúncios"
                ? "Gerencie seus anúncios publicados."
                : userProfile.city || "Conectando produtores e compradores."}
            </p>
          </div>

          <button
            onClick={() => setIsSearchOpen(true)}
            style={searchButton}
            aria-label="Abrir busca"
          >
            🔍
          </button>
        </div>
      </header>

      <section style={movementBox}>
        <div>
          <strong style={movementTitle}>Mercado em movimento</strong>

          <p style={movementText}>
            {feedStats.recent > 0
              ? `${feedStats.recent} anúncio(s) novo(s) nas últimas 48h`
              : "Acompanhe novas oportunidades no feed"}
          </p>
        </div>

        <div style={movementStats}>
          <div style={movementNumbers}>
            <span style={movementNumberValue}>{feedStats.available}</span>
            <small style={movementNumberLabel}>ativos</small>
          </div>

          <div style={movementNumbersSecondary}>
            <span style={movementNumberValue}>{feedStats.completed || 0}</span>
            <small style={movementNumberLabel}>realizados</small>
          </div>
        </div>
      </section>

      <QuickFilters
        activeFilter={activeFilter}
        setActiveFilter={(filter: string) => {
          setActiveFilter(filter);
          setSearch("");
        }}
      />

      <button onClick={handleOpenMyListings} style={myListingsButton}>
        Meus anúncios
      </button>

      {!isLoadingListings && visibleListings.length > 0 && (
        <div style={sectionHeader}>
          <strong>
            {activeFilter === "Todos"
              ? "Oportunidades do feed"
              : activeFilter === "Realizados"
              ? "Negócios realizados"
              : activeFilter}
          </strong>

          <span>
            {activeFilter === "Oportunidades"
              ? `${visibleListings.length} compatível(eis)`
              : activeFilter === "Realizados"
              ? `${visibleListings.length} concluído(s)`
              : feedStats.highlighted > 0
              ? `${feedStats.highlighted} em destaque`
              : `${visibleListings.length} resultado(s)`}
          </span>
        </div>
      )}

      {isLoadingListings && (
        <div style={loadingBox}>
          <div style={spinner} />
          Buscando oportunidades do mercado...
        </div>
      )}

      {!isLoadingListings && visibleListings.length === 0 && (
        <div style={emptyBox}>
          <div style={emptyIcon}>🌾</div>

          <strong style={emptyTitle}>Nada encontrado</strong>

          <p style={emptyText}>{emptyMessage}</p>
        </div>
      )}

      {!isLoadingListings &&
        activeFilter === "Realizados" &&
        visibleListings.map((listing: Listing) => (
          <CompletedListingRow
            key={getListingKey(listing)}
            listing={listing}
          />
        ))}

      {!isLoadingListings &&
        activeFilter !== "Realizados" &&
        visibleListings.map((listing: Listing) => {
          const key = getListingKey(listing);

          if (listing.post_type === "demand") {
            return (
              <DemandCard
                key={key}
                id={listing.id}
                post_type={listing.post_type}
                title={listing.title}
                weight={listing.weight}
                quantity={listing.quantity}
                city={listing.city}
                distance={listing.distance}
                road={listing.road}
                badge={listing.badge}
                time={listing.created_at}
                owner={listing.owner}
                verified={listing.verified}
                profile_image={listing.profile_image}
                category={listing.category}
                gender={listing.gender}
                breed={listing.breed}
                age={listing.age}
                price={listing.price}
                status={listing.status}
                is_recent={listing.is_recent}
                is_highlighted={listing.is_highlighted}
                trust_score={listing.trust_score}
                account_label={listing.account_label}
                whatsapp={listing.whatsapp}
                onClick={() => handleOpenListing(listing)}
                onProfileClick={() => openProfile(listing)}
              />
            );
          }

          return (
            <FeedCard
              key={key}
              id={listing.id}
              post_type={listing.post_type}
              title={listing.title}
              weight={listing.weight}
              quantity={listing.quantity}
              city={listing.city}
              distance={listing.distance}
              road={listing.road}
              image={listing.image}
              images={listing.images}
              badge={listing.badge}
              time={listing.created_at}
              owner={listing.owner}
              verified={listing.verified}
              status={listing.status}
              profile_image={listing.profile_image}
              category={listing.category}
              gender={listing.gender}
              breed={listing.breed}
              age={listing.age}
              price={listing.price}
              is_recent={listing.is_recent}
              is_highlighted={listing.is_highlighted}
              trust_score={listing.trust_score}
              account_label={listing.account_label}
              whatsapp={listing.whatsapp}
              onClick={() => handleOpenListing(listing)}
              onProfileClick={() => openProfile(listing)}
            />
          );
        })}

      {selectedOffer && (
  <ListingModal
  open={!!selectedOffer}
  onClose={closeSelectedListing}
  title={selectedOffer.title}
  image={selectedOffer.image}
  images={selectedOffer.images}
  weight={selectedOffer.weight}
  quantity={selectedOffer.quantity}
  city={selectedOffer.city}
  road={selectedOffer.road}
  category={selectedOffer.category}
  gender={selectedOffer.gender}
  breed={selectedOffer.breed}
  age={selectedOffer.age}
  price={selectedOffer.price}
  owner={selectedOffer.owner}
  status={selectedOffer.status}
  isOwner={isMyListing(selectedOffer)}
  isActionLoading={isActionLoading}
  onEdit={() => handleEditListing(selectedOffer)}
  onChangeStatus={(status: ListingStatus) =>
  handleChangeListingStatus(selectedOffer, status)
}
  onDelete={() => handleDeleteListing(selectedOffer)}
  onWhatsApp={() => openWhatsAppForListing(selectedOffer)}
/>
)}
      {selectedDemand && (
        <DemandModal
          open={!!selectedDemand}
          onClose={closeSelectedListing}
          title={selectedDemand.title}
          weight={selectedDemand.weight}
          quantity={selectedDemand.quantity}
          city={selectedDemand.city}
          distance={selectedDemand.distance}
          road={selectedDemand.road}
          category={selectedDemand.category}
          gender={selectedDemand.gender}
          breed={selectedDemand.breed}
          age={selectedDemand.age}
          price={selectedDemand.price}
          owner={selectedDemand.owner}
          status={selectedDemand.status}
          isOwner={isMyListing(selectedDemand)}
          isActionLoading={isActionLoading}
          onEdit={() => handleEditListing(selectedDemand)}
          onChangeStatus={(status: ListingStatus) =>
            handleChangeListingStatus(selectedDemand, status)
          }
          onDelete={() => handleDeleteListing(selectedDemand)}
          onWhatsApp={() => openWhatsAppForListing(selectedDemand)}
        />
      )}

      

      <ProfileModal
        profile={selectedProfile}
        onClose={() => {
          setSelectedProfile(null);
        }}
      />

      <CreateOpportunityModal
        open={isCreateOpen}
        editingListing={editingListing}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingListing(null);
        }}
        onCreate={handleCreateOpportunity}
        onUpdate={handleUpdateOpportunity}
      />

      <MatchResultsModal
        open={isMatchModalOpen}
        matches={matchedListings}
        onClose={() => {
          setIsMatchModalOpen(false);
          setMatchedListings([]);
        }}
        onOpenListing={async (listing) => {
          setIsMatchModalOpen(false);
          setMatchedListings([]);
          setSelectedListing(listing);
        }}
        onOpenWhatsApp={(listing) => {
          setIsMatchModalOpen(false);
          setMatchedListings([]);
          openWhatsAppForListing(listing);
        }}
      />

      <SearchModal
        open={isSearchOpen}
        onClose={() => {
          setIsSearchOpen(false);
        }}
        search={search}
        setSearch={setSearch}
      />

      <EditProfileModal
        open={isEditProfileOpen}
        onClose={() => {
          setIsEditProfileOpen(false);
        }}
        profile={userProfile}
        onSave={handleSaveProfile}
        onLogout={logout}
      />

      <WhatsAppModal
        open={!!selectedWhatsApp}
        onClose={() => {
          setSelectedWhatsApp(null);
        }}
        data={selectedWhatsApp}
      />

      <AuthModal
        open={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        userEmail={user?.email}
      />


      {completedListingFeedback && (
        <div
          onClick={() => setCompletedListingFeedback(null)}
          style={completionOverlay}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={completionCard}
          >
            <div style={completionIcon}>✅</div>

            <h2 style={completionTitle}>Negócio realizado</h2>

            <p style={completionText}>
              {completedListingFeedback.post_type === "demand"
                ? "Sua compra foi marcada como atendida e saiu das oportunidades ativas."
                : "Seu lote foi marcado como vendido e saiu do feed principal."}
            </p>

            <p style={completionHint}>
              Ele continua salvo em Meus anúncios como histórico do AgroMatch.
            </p>

            <button
              type="button"
              onClick={() => {
                setCompletedListingFeedback(null);
                setActiveFilter("Meus anúncios");
                setSearch("");
              }}
              style={completionPrimaryButton}
            >
              Ver meus anúncios
            </button>

            <button
              type="button"
              onClick={() => {
                setCompletedListingFeedback(null);
                setEditingListing(null);
                setIsCreateOpen(true);
              }}
              style={completionSecondaryButton}
            >
              Publicar nova oportunidade
            </button>

            <button
              type="button"
              onClick={() => {
                setCompletedListingFeedback(null);
                setActiveFilter("Todos");
                setSearch("");
              }}
              style={completionCloseButton}
            >
              Voltar ao início
            </button>
          </div>
        </div>
      )}

      <BottomNavigation
        activeTab={activeFilter === "Oportunidades" ? "deals" : "home"}
        opportunityCount={suggestedOpportunities.length}
        onHome={handleGoHome}
        onSearch={() => setIsSearchOpen(true)}
        onCreate={handleOpenCreate}
        onDeals={handleOpenDeals}
        onProfile={handleOpenMyProfile}
      />
    </main>
  );
}

const page: CSSProperties = {
  width: "100%",
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
  background: "#f6faf7",
  maxWidth: "560px",
  minHeight: "100dvh",
  margin: "0 auto",
  padding: "12px",
  paddingBottom: "110px",
  boxSizing: "border-box",
  overflowX: "hidden",
};

const authPage: CSSProperties = {
  position: "relative",
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
  zIndex: 1,
  width: "100%",
  minHeight: "100dvh",
  maxWidth: "520px",
  margin: "0 auto",
  padding: "24px 18px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  boxSizing: "border-box",
  overflowX: "hidden",
  pointerEvents: "auto",
};

const authCard: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "28px",
  padding: "28px 22px",
  boxShadow: "0 12px 32px rgba(0,0,0,0.08)",
  textAlign: "center",
};

const authIcon: CSSProperties = {
  fontSize: "46px",
  marginBottom: "14px",
};

const authTitle: CSSProperties = {
  margin: "0 0 10px",
  fontSize: "28px",
  fontWeight: 900,
  color: "#111827",
};

const authText: CSSProperties = {
  margin: "0 0 22px",
  color: "#6b7280",
  fontSize: "15px",
  lineHeight: 1.5,
  fontWeight: 700,
};

const primaryButton: CSSProperties = {
  width: "100%",
  border: "none",
  borderRadius: "18px",
  padding: "16px",
  background: "#157a3d",
  color: "#ffffff",
  fontWeight: 800,
  fontSize: "16px",
  cursor: "pointer",
  boxShadow: "0 10px 20px rgba(21,128,61,0.22)",
};

const hero: CSSProperties = {
  position: "relative",
  marginBottom: "18px",
  padding: "22px 18px",
  borderRadius: "28px",
  overflow: "hidden",
  background:
    "linear-gradient(135deg, rgba(11,47,36,0.98) 0%, rgba(16,66,47,0.96) 58%, rgba(31,93,64,0.94) 100%)",
  boxShadow: "0 18px 38px rgba(11,47,36,0.20)",
};

const heroGlowTop: CSSProperties = {
  position: "absolute",
  top: "-120px",
  right: "-60px",
  width: "220px",
  height: "220px",
  borderRadius: "999px",
  background: "rgba(255,214,102,0.10)",
  filter: "blur(18px)",
};

const heroGlowBottom: CSSProperties = {
  position: "absolute",
  bottom: "-70px",
  left: "-40px",
  width: "140px",
  height: "140px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.04)",
  filter: "blur(12px)",
};

const heroContent: CSSProperties = {
  position: "relative",
  zIndex: 2,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
};

const heroEyebrow: CSSProperties = {
  display: "inline-block",
  marginBottom: "10px",
  fontSize: "11px",
  fontWeight: 800,
  letterSpacing: "1.4px",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.72)",
};

const heroTitle: CSSProperties = {
  margin: "0 0 8px",
  fontSize: "32px",
  fontWeight: 900,
  color: "#ffffff",
  lineHeight: 1,
  letterSpacing: "-1px",
};

const heroSubtitle: CSSProperties = {
  maxWidth: "240px",
  margin: 0,
  fontSize: "14px",
  color: "rgba(255,255,255,0.76)",
  lineHeight: 1.45,
  fontWeight: 700,
};

const searchButton: CSSProperties = {
  width: "52px",
  height: "52px",
  borderRadius: "18px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.10)",
  backdropFilter: "blur(10px)",
  color: "#ffffff",
  fontSize: "20px",
  cursor: "pointer",
  flexShrink: 0,
  boxShadow: "0 10px 24px rgba(0,0,0,0.14)",
};

const movementBox: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginBottom: "14px",
  padding: "14px",
  background: "rgba(255,255,255,0.94)",
  border: "1px solid #d8f3df",
  borderRadius: "20px",
  boxShadow: "0 10px 26px rgba(15,52,40,0.07)",
};

const movementTitle: CSSProperties = {
  display: "block",
  marginBottom: "4px",
  fontSize: "15px",
  fontWeight: 800,
  color: "#166534",
};

const movementText: CSSProperties = {
  margin: 0,
  fontSize: "13px",
  color: "#6b7280",
  fontWeight: 700,
};


const movementStats: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexShrink: 0,
};

const movementNumbers: CSSProperties = {
  width: "62px",
  height: "62px",
  borderRadius: "18px",
  background: "#e8f8ed",
  color: "#14532d",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const movementNumbersSecondary: CSSProperties = {
  ...movementNumbers,
  background: "#f8faf9",
  border: "1px solid #d8f3df",
  color: "#103428",
};

const movementNumberValue: CSSProperties = {
  fontSize: "20px",
  fontWeight: 800,
  lineHeight: 1,
};

const movementNumberLabel: CSSProperties = {
  marginTop: "4px",
  fontSize: "11px",
  fontWeight: 800,
  textTransform: "uppercase",
};

const myListingsButton: CSSProperties = {
  width: "100%",
  marginBottom: "14px",
  border: "1px solid #d8f3df",
  borderRadius: "16px",
  padding: "13px",
  background: "rgba(255,255,255,0.94)",
  color: "#14532d",
  fontWeight: 800,
  cursor: "pointer",
};

const sectionHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  margin: "2px 0 12px",
  color: "#111827",
  fontSize: "14px",
};

const loadingBox: CSSProperties = {
  marginTop: "12px",
  padding: "22px",
  background: "rgba(255,255,255,0.94)",
  borderRadius: "20px",
  border: "1px solid #e5eee8",
  textAlign: "center",
  color: "#6b7280",
  fontWeight: 700,
};

const spinner: CSSProperties = {
  width: "38px",
  height: "38px",
  margin: "0 auto 14px",
  borderRadius: "999px",
  border: "4px solid #dcfce7",
  borderTop: "4px solid #16a34a",
  animation: "spin 1s linear infinite",
};

const emptyBox: CSSProperties = {
  marginTop: "12px",
  padding: "28px 20px",
  background: "rgba(255,255,255,0.94)",
  border: "1px solid #e5eee8",
  borderRadius: "22px",
  textAlign: "center",
};

const emptyIcon: CSSProperties = {
  fontSize: "42px",
  marginBottom: "12px",
};

const emptyTitle: CSSProperties = {
  display: "block",
  marginBottom: "8px",
  fontSize: "16px",
  color: "#111827",
};

const emptyText: CSSProperties = {
  margin: 0,
  fontSize: "14px",
  color: "#6b7280",
  lineHeight: 1.5,
};


const completedRow: CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  marginBottom: "12px",
  padding: "14px",
  border: "1px solid #d8f3df",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.96)",
  boxShadow: "0 10px 24px rgba(15,52,40,0.06)",
  textAlign: "left",
  boxSizing: "border-box",
};

const completedRowIcon: CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "999px",
  background: "#dcfce7",
  color: "#145f35",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  fontSize: "18px",
};

const completedRowBody: CSSProperties = {
  minWidth: 0,
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const completedRowTop: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  alignItems: "center",
  marginBottom: "2px",
};

const completedRowKind: CSSProperties = {
  color: "#145f35",
  fontSize: "12px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.4px",
};

const completedRowStatus: CSSProperties = {
  color: "#69766e",
  fontSize: "12px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const completedRowTitle: CSSProperties = {
  color: "#10251b",
  fontSize: "16px",
  fontWeight: 800,
  lineHeight: 1.25,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const completedRowMeta: CSSProperties = {
  color: "#33443a",
  fontSize: "13px",
  fontWeight: 700,
  lineHeight: 1.35,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const completedRowLocation: CSSProperties = {
  color: "#69766e",
  fontSize: "13px",
  fontWeight: 650,
  lineHeight: 1.35,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const completionOverlay: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 10020,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "18px",
  background: "rgba(15, 23, 42, 0.56)",
  boxSizing: "border-box",
};

const completionCard: CSSProperties = {
  width: "100%",
  maxWidth: "420px",
  borderRadius: "28px",
  padding: "24px 18px 18px",
  background: "#ffffff",
  boxShadow: "0 24px 70px rgba(15, 23, 42, 0.24)",
  textAlign: "center",
  boxSizing: "border-box",
};

const completionIcon: CSSProperties = {
  width: "62px",
  height: "62px",
  margin: "0 auto 14px",
  borderRadius: "999px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#dcfce7",
  color: "#145f35",
  fontSize: "30px",
};

const completionTitle: CSSProperties = {
  margin: "0 0 8px",
  color: "#10271d",
  fontSize: "24px",
  fontWeight: 850,
  letterSpacing: "-0.4px",
};

const completionText: CSSProperties = {
  margin: "0 auto 8px",
  maxWidth: "330px",
  color: "#34463a",
  fontSize: "15px",
  lineHeight: 1.5,
  fontWeight: 650,
};

const completionHint: CSSProperties = {
  margin: "0 auto 18px",
  maxWidth: "330px",
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: 1.45,
  fontWeight: 600,
};

const completionPrimaryButton: CSSProperties = {
  width: "100%",
  border: "none",
  borderRadius: "16px",
  padding: "15px",
  background: "#145f35",
  color: "#ffffff",
  fontWeight: 800,
  fontSize: "15px",
  cursor: "pointer",
  boxShadow: "0 12px 24px rgba(20,95,53,0.22)",
};

const completionSecondaryButton: CSSProperties = {
  width: "100%",
  marginTop: "10px",
  border: "1px solid #bbf7d0",
  borderRadius: "16px",
  padding: "14px",
  background: "#f0fdf4",
  color: "#145f35",
  fontWeight: 800,
  fontSize: "14px",
  cursor: "pointer",
};

const completionCloseButton: CSSProperties = {
  width: "100%",
  marginTop: "8px",
  border: "none",
  borderRadius: "16px",
  padding: "12px",
  background: "transparent",
  color: "#6b7280",
  fontWeight: 750,
  cursor: "pointer",
};
