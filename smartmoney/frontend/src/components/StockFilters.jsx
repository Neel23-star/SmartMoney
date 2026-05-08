import React from "react";

export const FILTERS = [
  { id: "all",          label: "🔍 All",           color: "emerald" },
  { id: "Nifty50",      label: "📊 Nifty 50",      color: "blue" },
  { id: "Nifty100",     label: "📈 Nifty 100",     color: "blue" },
  { id: "PSU Banks",    label: "🏛️ PSU Banks",     color: "orange" },
  { id: "Private Banks",label: "🏦 Private Banks", color: "purple" },
  { id: "IT",           label: "💻 IT",            color: "cyan" },
  { id: "Pharma",       label: "💊 Pharma",        color: "pink" },
  { id: "Auto",         label: "🚗 Auto",          color: "yellow" },
  { id: "Petroleum",    label: "🛢️ Petroleum",     color: "red" },
  { id: "FMCG",         label: "🛒 FMCG",          color: "lime" },
  { id: "Metal",        label: "⚙️ Metal",         color: "gray" },
  { id: "Infra",        label: "🏗️ Infra",         color: "amber" },
  { id: "Power",        label: "⚡ Power",          color: "yellow" },
  { id: "Evergreen",    label: "🌿 Evergreen",     color: "green" },
  { id: "Dividend",     label: "💰 Dividend",      color: "emerald" },
  { id: "gainers",      label: "🟢 Top Gainers",   color: "green" },
  { id: "losers",       label: "🔴 Top Losers",    color: "red" },
];

const COLOR_MAP = {
  emerald: "bg-emerald-600 text-white",
  blue:    "bg-blue-600 text-white",
  orange:  "bg-orange-600 text-white",
  purple:  "bg-purple-600 text-white",
  cyan:    "bg-cyan-600 text-white",
  pink:    "bg-pink-600 text-white",
  yellow:  "bg-yellow-500 text-black",
  red:     "bg-red-600 text-white",
  lime:    "bg-lime-600 text-white",
  gray:    "bg-slate-500 text-white",
  amber:   "bg-amber-600 text-white",
  green:   "bg-green-600 text-white",
};

export default function StockFilters({ active, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
      {FILTERS.map((f) => {
        const isActive = active === f.id;
        const activeStyle = COLOR_MAP[f.color] || COLOR_MAP.emerald;
        return (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap border ${
              isActive
                ? `${activeStyle} border-transparent`
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:border-slate-500"
            }`}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
