import React from "react";

export default function GainerLoserCard({ stock }) {
  const isGainer = stock.change > 0;
  return (
    <a
      href={stock.source_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-between bg-slate-800 hover:bg-slate-700 border rounded-xl px-4 py-3 transition group ${
        isGainer ? "border-green-700/40 hover:border-green-500/50" : "border-red-700/40 hover:border-red-500/50"
      }`}
    >
      <div>
        <div className="font-bold text-white group-hover:text-slate-200">{stock.symbol}</div>
        <div className="text-xs text-slate-500">{stock.sectors?.[0] || "Stock"}</div>
      </div>
      <div className="text-right">
        <div className="text-sm text-slate-300">₹{stock.price?.toLocaleString("en-IN")}</div>
        <div className={`text-sm font-bold ${isGainer ? "text-green-400" : "text-red-400"}`}>
          {isGainer ? "▲" : "▼"} {Math.abs(stock.change)}%
        </div>
      </div>
    </a>
  );
}
