import React from "react";
import { motion } from "framer-motion";

export default function TrustRing({ score = 0, size = 72, stroke = 5, label }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color = score >= 80 ? "#e63946" : score >= 60 ? "#1d4ed8" : score >= 40 ? "#f4c542" : "#7a7466";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} data-testid="trust-ring">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#0a0a0a" strokeOpacity="0.12" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="display font-black text-[#0a0a0a]" style={{ fontSize: size * 0.32 }}>{score}</span>
        {label && <span className="mono text-[9px] text-[#7a7466] uppercase tracking-widest">{label}</span>}
      </div>
    </div>
  );
}
