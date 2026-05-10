import React from "react";

export default function InfoHint({ text }) {
  return (
    <span className="relative inline-flex items-center group/infohint align-middle ml-1">
      <span
        tabIndex={0}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-slate-500 text-slate-300 text-[10px] cursor-help outline-none focus:ring-1 focus:ring-sky-400"
        aria-label={text}
      >
        i
      </span>
      <span className="pointer-events-none absolute z-20 left-1/2 -translate-x-1/2 top-5 w-52 rounded-md border border-slate-600 bg-slate-900 text-[10px] text-slate-200 p-2 opacity-0 group-hover/infohint:opacity-100 group-focus-within/infohint:opacity-100 transition-opacity">
        {text}
      </span>
    </span>
  );
}
