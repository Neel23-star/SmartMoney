import React from "react";

const NAV_ITEMS = [
  { id: "home",        icon: "🏠", label: "Home" },
  { id: "stocks",      icon: "📈", label: "Stocks" },
  { id: "options",     icon: "🎯", label: "Options" },
  { id: "etf",         icon: "📦", label: "ETF" },
  { id: "commodity",   icon: "🥇", label: "Commodity" },
  { id: "search",      icon: "🔎", label: "Search" },
  { id: "mutualfunds", icon: "🏦", label: "MF" },
];

export default function BottomNav({ page, stockFilter, onSelect }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-900/95 backdrop-blur-md border-t border-slate-700 safe-area-bottom">
      <div className="grid h-16" style={{ gridTemplateColumns: `repeat(${NAV_ITEMS.length}, minmax(0, 1fr))` }}>
        {NAV_ITEMS.map((item) => {
          const active = item.id === "etf"
            ? page === "stocks" && stockFilter === "ETF"
            : page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 transition-all ${
                active
                  ? "text-emerald-400"
                  : "text-slate-500 active:text-slate-300"
              }`}
            >
              <span className={`text-xl leading-none transition-transform ${active ? "scale-110" : ""}`}>
                {item.icon}
              </span>
              <span className={`text-[10px] font-medium leading-none ${active ? "text-emerald-400" : "text-slate-500"}`}>
                {item.label}
              </span>
              {active && (
                <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
