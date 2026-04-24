import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Bookmark, MapPin, ArrowUpRight } from "lucide-react";
import TrustRing from "./TrustRing";
import { formatFollowers, formatINR, trustBadge } from "../../lib/format";

export default function CreatorCard({ creator, onBookmark, index = 0 }) {
  const badge = trustBadge(creator.trust_score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 6) * 0.03 }}
      whileHover={{ y: -4 }}
      className="group relative border border-[#0a0a0a] bg-[#efe8d8] hover:shadow-[6px_6px_0_0_#0a0a0a] transition-all"
      data-testid={`creator-card-${creator.id}`}
    >
      {/* Index strip */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#0a0a0a]">
        <span className="mono text-[10px] uppercase tracking-[0.25em]">
          No. {String(index + 1).padStart(2, "0")} / {creator.niche}
        </span>
        <button
          onClick={(e) => { e.preventDefault(); onBookmark?.(creator); }}
          className="w-6 h-6 flex items-center justify-center hover:text-[#e63946] transition"
          data-testid={`bookmark-${creator.id}`}
          aria-label="Bookmark"
        >
          <Bookmark size={12} />
        </button>
      </div>

      {/* Portrait */}
      <div className="relative aspect-[4/5] overflow-hidden bg-[#e8e0cd]">
        <img
          src={creator.avatar}
          alt={creator.name}
          className="w-full h-full object-cover group-hover:scale-[1.04] transition duration-500"
        />
        {/* Trust ring overlay */}
        <div className="absolute top-3 right-3 bg-[#efe8d8] rounded-full p-1 border border-[#0a0a0a]">
          <TrustRing score={creator.trust_score} size={40} stroke={3} />
        </div>
        {/* Badge */}
        <div
          className="absolute bottom-3 left-3 px-2.5 py-1 mono text-[9px] uppercase tracking-widest border border-[#0a0a0a]"
          style={{ background: badge.color === "#00d4c8" ? "#e63946" : badge.color === "#4f8ef7" ? "#1d4ed8" : badge.color === "#ff8c42" ? "#f4c542" : "#0a0a0a", color: badge.color === "#ff8c42" ? "#0a0a0a" : "#efe8d8" }}
        >
          {badge.label}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-4 border-t border-[#0a0a0a]">
        <div className="flex items-start justify-between gap-2">
          <h3 className="display text-2xl leading-[0.95] font-black truncate" data-testid={`creator-name-${creator.id}`}>
            {creator.name}
          </h3>
        </div>

        <div className="flex items-center gap-2 mt-1 mono text-[10px] uppercase tracking-[0.2em] text-[#7a7466]">
          <MapPin size={10} /> {creator.city}
          <span>·</span>
          <span>{formatFollowers(creator.followers)}</span>
          <span>·</span>
          <span>{creator.engagement_rate}%</span>
        </div>

        <p className="text-sm text-[#0a0a0a]/70 mt-2 line-clamp-2 min-h-[2.5rem]">{creator.bio}</p>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#0a0a0a]/15">
          <div>
            <div className="mono text-[9px] uppercase tracking-[0.25em] text-[#7a7466]">Reel from</div>
            <div className="display text-xl font-black text-[#e63946]">{formatINR(creator.pricing?.reel || 0)}</div>
          </div>
          <Link
            to={`/creators/${creator.id}`}
            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold uppercase tracking-widest border border-[#0a0a0a] hover:bg-[#e63946] hover:text-[#efe8d8] transition"
            data-testid={`view-profile-${creator.id}`}
          >
            View <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
