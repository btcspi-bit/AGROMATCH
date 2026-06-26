"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { BottomNavigation } from "@/components/BottomNavigation";
import { CreateOpportunityModal } from "@/components/CreateOpportunityModal";
import { DemandCard } from "@/components/DemandCard";
import { DemandModal } from "@/components/DemandModal";
import { EditProfileModal } from "@/components/EditProfileModal";
import { FeedCard } from "@/components/FeedCard";
import { ListingModal } from "@/components/ListingModal";
import { ProfileModal } from "@/components/ProfileModal";
import { QuickFilters } from "@/components/QuickFilters";
import { SearchModal } from "@/components/SearchModal";
import { WhatsAppModal } from "@/components/WhatsAppModal";
import { AuthModal } from "@/components/AuthModal";

import { supabase } from "@/lib/supabase";

const defaultUserProfile = {
  name: "Meu Perfil",
  farm: "AgroMatch Operacional",
  city: "Eldorado do Carajás/PA",
  avatar: "/avatar1.jpg",
  badge: "Usuário ativo",
  description:
    "Perfil do usuário dentro do AgroMatch. Aqui futuramente ficarão publicações, histórico e negociações.",
  whatsapp: "5594999999999",
};

export default function Home() {
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [selectedWhatsApp, setSelectedWhatsApp] = useState<any>(null);
  const [userProfile, setUserProfile] = useState(defaultUserProfile);

  const [user, setUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [localListings, setLocalListings] = useState<any[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);

  useEffect(() => {
    loadListings();

    const savedProfile = localStorage.getItem("agromatch_user_profile");

    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
    }

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "agromatch_user_profile",
      JSON.stringify(userProfile)
    );
  }, [userProfile]);

  async function loadListings() {
    setIsLoadingListings(true);

    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("Erro ao carregar feed: " + error.message);
      console.error(error);
      setIsLoadingListings(false);
      return;
    }

    setLocalListings(data || []);
    setIsLoadingListings(false);
  }

  const filteredListings = useMemo(() => {
    let listings = [...localListings];

    if (activeFilter !== "Todos" && activeFilter !== "Outros") {
      if (activeFilter === "Comprando") {
        listings = listings.filter((listing) => listing.post_type === "demand");
      } else if (activeFilter === "Vendendo") {
        listings = listings.filter((listing) => listing.post_type === "offer");
      } else if (activeFilter === "Macho" || activeFilter === "Fêmea") {
        listings = listings.filter((listing) => listing.gender === activeFilter);
      } else {
        listings = listings.filter((listing) => listing.category === activeFilter);
      }
    }

    if (search.trim()) {
      const query = search.toLowerCase();

      listings = listings.filter((listing) => {
        return (
          listing.title?.toLowerCase().includes(query) ||
          listing.city?.toLowerCase().includes(query) ||
          listing.owner?.toLowerCase().includes(query) ||
          listing.weight?.toLowerCase().includes(query) ||
          listing.category?.toLowerCase().includes(query) ||
          listing.gender?.toLowerCase().includes(query) ||
          listing.breed?.toLowerCase().includes(query) ||
          listing.age?.toLowerCase().includes(query) ||
          listing.price?.toLowerCase().includes(query) ||
          listing.badge?.toLowerCase().includes(query)
        );
      });
    }

    return listings;
  }, [activeFilter, localListings, search]);

  async function handleCreateOpportunity(newOpportunity: any) {
    if (!user) {
      setIsAuthOpen(true);
      alert("Entre na sua conta para publicar.");
      return;
    }

    const opportunityWithUser = {
      ...newOpportunity,
      owner: userProfile.name,
      city: userProfile.city,
      avatar: userProfile.avatar,
      verified: true,
      whatsapp: userProfile.whatsapp,
      user_id: user.id,
    };

    const { error } = await supabase
      .from("listings")
      .insert([opportunityWithUser]);

    if (error) {
      alert("Erro ao publicar: " + error.message);
      console.error(error);
      return;
    }

    await loadListings();
    setActiveFilter("Todos");
    setSearch("");
    alert("Oportunidade publicada com sucesso.");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "14px",
        paddingBottom: "110px",
        maxWidth: "520px",
        margin: "0 auto",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "14px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: "800",
              color: "#111827",
              lineHeight: 1,
            }}
          >
            AgroMatch
          </h1>

          <p
            style={{
              fontSize: "13px",
              color: "#6b7280",
              marginTop: "4px",
            }}
          >
            {userProfile.city}
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={() => setIsSearchOpen(true)}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "14px",
              border: "none",
              background: "#ffffff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              cursor: "pointer",
              fontSize: "18px",
            }}
          >
            🔍
          </button>

          <button
            onClick={() => setIsAuthOpen(true)}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "14px",
              border: "none",
              background: user ? "#dcfce7" : "#ffffff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              cursor: "pointer",
              fontSize: "18px",
            }}
          >
            👤
          </button>
        </div>
      </header>

      <QuickFilters
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
      />

      {isLoadingListings && (
        <p style={{ color: "#6b7280", padding: "18px 4px" }}>
          Carregando oportunidades...
        </p>
      )}

      {!isLoadingListings && filteredListings.length === 0 && (
        <p style={{ color: "#6b7280", padding: "18px 4px" }}>
          Nenhuma oportunidade encontrada.
        </p>
      )}

      {filteredListings.map((listing) => {
        const profile = {
          name: listing.owner,
          farm: "Fazenda cadastrada",
          city: listing.city,
          avatar: listing.avatar,
          badge: listing.verified ? "Perfil verificado" : "Perfil operacional",
          description:
            "Produtor ou comprador ativo na região, com atuação em negociação de bovinos.",
          whatsapp: listing.whatsapp || "5594999999999",
        };

        if (listing.post_type === "demand") {
          return (
            <DemandCard
              key={listing.id}
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
              avatar={listing.avatar}
              category={listing.category}
              gender={listing.gender}
              breed={listing.breed}
              age={listing.age}
              price={listing.price}
              onClick={() => setSelectedListing(listing)}
              onProfileClick={() => setSelectedProfile(profile)}
            />
          );
        }

        return (
          <FeedCard
            key={listing.id}
            title={listing.title}
            weight={listing.weight}
            quantity={listing.quantity}
            city={listing.city}
            distance={listing.distance}
            road={listing.road}
            image={listing.image}
            badge={listing.badge}
            time={listing.created_at}
            owner={listing.owner}
            verified={listing.verified}
            status={listing.status}
            avatar={listing.avatar}
            category={listing.category}
            gender={listing.gender}
            breed={listing.breed}
            age={listing.age}
            price={listing.price}
            onClick={() => setSelectedListing(listing)}
            onProfileClick={() => setSelectedProfile(profile)}
          />
        );
      })}

      {selectedListing && selectedListing.post_type === "offer" && (
        <ListingModal
          open={!!selectedListing}
          onClose={() => setSelectedListing(null)}
          title={selectedListing.title}
          image={selectedListing.image}
          weight={selectedListing.weight}
          quantity={selectedListing.quantity}
          city={selectedListing.city}
          road={selectedListing.road}
          category={selectedListing.category}
          gender={selectedListing.gender}
          breed={selectedListing.breed}
          age={selectedListing.age}
          price={selectedListing.price}
          owner={selectedListing.owner}
          onWhatsApp={() =>
            setSelectedWhatsApp({
              ...selectedListing,
              whatsapp: selectedListing.whatsapp || "5594999999999",
            })
          }
        />
      )}

      {selectedListing && selectedListing.post_type === "demand" && (
        <DemandModal
          open={!!selectedListing}
          onClose={() => setSelectedListing(null)}
          title={selectedListing.title}
          weight={selectedListing.weight}
          quantity={selectedListing.quantity}
          city={selectedListing.city}
          distance={selectedListing.distance}
          road={selectedListing.road}
          owner={selectedListing.owner}
          onWhatsApp={() =>
            setSelectedWhatsApp({
              ...selectedListing,
              whatsapp: selectedListing.whatsapp || "5594999999999",
            })
          }
        />
      )}

      <ProfileModal
        profile={selectedProfile}
        onClose={() => setSelectedProfile(null)}
      />

      <CreateOpportunityModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateOpportunity}
      />

      <SearchModal
        open={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        search={search}
        setSearch={setSearch}
      />

      <EditProfileModal
        open={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        profile={userProfile}
        setProfile={setUserProfile}
      />

      <WhatsAppModal
        open={!!selectedWhatsApp}
        onClose={() => setSelectedWhatsApp(null)}
        data={selectedWhatsApp}
      />

      <AuthModal
        open={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        userEmail={user?.email}
      />

      <BottomNavigation
        activeTab={activeFilter === "Comprando" ? "deals" : "home"}
        onHome={() => {
          setActiveFilter("Todos");
          setSearch("");
          loadListings();
        }}
        onSearch={() => setIsSearchOpen(true)}
        onCreate={() => {
          if (!user) {
            setIsAuthOpen(true);
            return;
          }

          setIsCreateOpen(true);
        }}
        onDeals={() => setActiveFilter("Comprando")}
        onProfile={() => {
          if (!user) {
            setIsAuthOpen(true);
            return;
          }

          setIsEditProfileOpen(true);
        }}
      />
    </main>
  );
}