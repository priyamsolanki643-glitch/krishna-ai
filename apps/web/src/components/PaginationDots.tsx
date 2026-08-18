"use client";

import React from "react";

interface PaginationDotsProps {
  total: number;
  active: number;
}

export const PaginationDots: React.FC<PaginationDotsProps> = ({ total, active }) => {
  return (
    <div className="fixed right-3 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2 md:hidden">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === active ? "6px" : "5px",
            height: i === active ? "16px" : "5px",
            background: i === active
              ? "linear-gradient(180deg, #a855f7, #38bdf8)"
              : "rgba(255,255,255,0.2)",
          }}
        />
      ))}
    </div>
  );
};
