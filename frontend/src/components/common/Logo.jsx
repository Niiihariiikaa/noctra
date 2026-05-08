import React from "react";

// Noctra wordmark — uses uploaded logo image with fallback to rendered text
export default function Logo({ size = "md", withTagline = false, color = "#e63946", className = "" }) {
  const sizeMap = {
    sm: { h: "h-6", txt: "text-xl" },
    md: { h: "h-10", txt: "text-3xl" },
    lg: { h: "h-20 md:h-28", txt: "text-6xl md:text-7xl" },
    xl: { h: "h-32 md:h-56", txt: "text-7xl md:text-9xl" },
  };
  const s = sizeMap[size];

  return (
    <div className={`inline-flex flex-col items-center ${className}`} data-testid="noctra-logo">
      <img
        src="/brand/noctra-logo.png"
        alt="Noctra"
        className={`${s.h} w-auto object-contain`}
        style={{ filter: color === "#e63946" ? "none" : `drop-shadow(0 0 0 ${color})` }}
      />
      {withTagline && (
        <span
          className="mono uppercase tracking-[0.3em] mt-1"
          style={{ color, fontSize: size === "xl" ? "0.85rem" : "0.55rem" }}
        >
          Collaborative Hub
        </span>
      )}
    </div>
  );
}

export function LogoMini({ color = "#e63946" }) {
  return (
    <span className="noctra-mark-tight text-[17px] md:text-xl" style={{ color }}>
      NOCTRA
    </span>
  );
}
