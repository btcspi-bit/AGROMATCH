export function BottomNavigation({
  activeTab,
  opportunityCount = 0,
  onHome,
  onSearch,
  onCreate,
  onDeals,
  onProfile,
}: any) {
  return (
    <nav style={nav}>
      <div style={navInner}>
        <NavItem active={activeTab === "home"} label="Início" onClick={onHome} />

        <NavItem active={activeTab === "search"} label="Buscar" onClick={onSearch} />

        <button
          type="button"
          onClick={onCreate}
          style={createButton}
          aria-label="Publicar oportunidade"
        >
          +
        </button>

        <NavItem
          active={activeTab === "deals"}
          label="Oportunidades"
          onClick={onDeals}
          badgeCount={opportunityCount}
        />

        <NavItem active={activeTab === "profile"} label="Perfil" onClick={onProfile} />
      </div>
    </nav>
  );
}

function NavItem({ active, label, onClick, badgeCount = 0 }: any) {
  return (
    <button type="button" onClick={onClick} style={navButtonStyle(active)}>
      <span>{label}</span>

      {badgeCount > 0 && <small style={badge}>{badgeCount}</small>}
    </button>
  );
}

const nav = {
  position: "fixed" as const,
  bottom: 0,
  left: 0,
  width: "100%",
  background: "rgba(255,255,255,0.96)",
  borderTop: "1px solid rgba(15,23,42,0.08)",
  display: "flex",
  justifyContent: "center",
  padding: "9px 10px calc(9px + env(safe-area-inset-bottom))",
  zIndex: 999,
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  boxShadow: "0 -10px 28px rgba(15,23,42,0.06)",
};

const navInner = {
  width: "100%",
  maxWidth: "560px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "7px",
};

const navButtonStyle = (active: boolean) => ({
  flex: 1,
  minHeight: "46px",
  border: active ? "1px solid #bbf7d0" : "1px solid transparent",
  background: active ? "#ecfdf5" : "transparent",
  color: active ? "#14532d" : "#64748b",
  borderRadius: "16px",
  fontSize: "12px",
  fontWeight: 760,
  cursor: "pointer",
  position: "relative" as const,
  transition: "background 0.18s ease, color 0.18s ease, border 0.18s ease",
  touchAction: "manipulation",
});

const badge = {
  position: "absolute" as const,
  top: "4px",
  right: "7px",
  minWidth: "18px",
  height: "18px",
  padding: "0 5px",
  borderRadius: "999px",
  background: "#15803d",
  color: "#ffffff",
  fontSize: "10px",
  fontWeight: 850,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box" as const,
  boxShadow: "0 4px 10px rgba(21,128,61,0.22)",
};

const createButton = {
  width: "56px",
  height: "56px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.34)",
  background: "linear-gradient(135deg, #103428 0%, #166534 100%)",
  color: "#ffffff",
  fontSize: "30px",
  lineHeight: "52px",
  fontWeight: 760,
  cursor: "pointer",
  boxShadow: "0 12px 26px rgba(16,52,40,0.28)",
  flexShrink: 0,
  touchAction: "manipulation",
};
