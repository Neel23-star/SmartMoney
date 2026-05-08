import React, { useEffect, useState } from "react";
import axios from "axios";

export default function NewsTicker() {
  const [news, setNews] = useState([
    "📊 Loading market news...",
  ]);

  useEffect(() => {
    axios.get("/api/news")
      .then((r) => { if (r.data.news?.length) setNews(r.data.news); })
      .catch(() => {});
  }, []);

  // Duplicate items for seamless infinite scroll
  const items = [...news, ...news];

  return (
    <div className="bg-slate-900 border-b border-slate-700 overflow-hidden">
      <div className="flex items-center">
        {/* Label */}
        <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 uppercase tracking-wider">
          📰 Market
        </div>
        {/* Scrolling text */}
        <div className="overflow-hidden flex-1 py-1.5">
          <div className="ticker-track flex gap-0 whitespace-nowrap">
            {items.map((item, i) => (
              <span key={i} className="text-xs text-slate-300 px-8">
                {item}
                <span className="text-emerald-600 mx-6">◆</span>
              </span>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        .ticker-track {
          display: inline-flex;
          animation: ticker-scroll 40s linear infinite;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
