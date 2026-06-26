type QuickFiltersProps = {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
};

const mainFilters = ["Todos", "Vendendo", "Comprando", "Realizados"];

export function QuickFilters({
  activeFilter,
  setActiveFilter,
}: QuickFiltersProps) {
  return (
    <div style={wrapper}>
      <div style={mainRow}>
        {mainFilters.map((filter) => {
          const isActive = activeFilter === filter;

          return (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              style={filterButtonStyle(isActive)}
            >
              {filter}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const wrapper = {
  marginBottom: "16px",
};

const mainRow = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "8px",
};

const filterButtonStyle = (active: boolean) => ({
  border: active ? "1px solid #14532d" : "1px solid #e2e8f0",
  background: active ? "#103428" : "rgba(255,255,255,0.94)",
  color: active ? "#ffffff" : "#334155",
  padding: "11px 8px",
  borderRadius: "999px",
  fontSize: "13px",
  fontWeight: 760,
  cursor: "pointer",
  boxShadow: active
    ? "0 8px 18px rgba(16,52,40,0.16)"
    : "0 3px 10px rgba(15,23,42,0.04)",
  transition: "background 0.18s ease, color 0.18s ease, border 0.18s ease",
  touchAction: "manipulation",
});
