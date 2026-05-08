import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Star, ArrowUpRight, Clapperboard, Megaphone, Wrench } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";
import EmptyState from "../components/common/EmptyState";
import { getEditors } from "../lib/api";
import { formatINR } from "../lib/format";

const ROLES = ["Video Editor", "Reel Editor", "Social Media Manager", "Content Strategist"];

export default function Services() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeRoles, setActiveRoles] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => {
      const params = {};
      if (search) params.search = search;
      if (activeRoles.length) params.role = activeRoles.join(",");
      setLoading(true);
      getEditors(params)
        .then(setItems)
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [search, activeRoles]);

  const toggleRole = (r) => setActiveRoles((rs) => (rs.includes(r) ? rs.filter((x) => x !== r) : [...rs, r]));

  return (
    <div className="min-h-screen bg-[#efe8d8] text-[#0a0a0a]" data-testid="services-page">
      <Navbar />

      <section className="max-w-7xl mx-auto px-5 md:px-10 pt-8 md:pt-12 pb-10">
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-3">§ Services — Editors & SMMs</div>
        <h1 className="display text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] mb-6">
          The craft<br/>behind the<br/><span className="italic text-[#e63946]">content</span>.
        </h1>

        <div className="flex gap-3 items-center mt-8 max-w-2xl">
          <div className="flex-1 flex items-center gap-3 border border-[#0a0a0a] bg-[#efe8d8] px-4 py-3">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, skills…"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-[#7a7466]"
              data-testid="services-search"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-5">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => toggleRole(r)}
              className={`px-3 py-1.5 mono text-[10px] uppercase tracking-widest border ${activeRoles.includes(r) ? "bg-[#0a0a0a] text-[#efe8d8] border-[#0a0a0a]" : "border-[#0a0a0a]/40 hover:border-[#0a0a0a]"}`}
              data-testid={`role-${r.toLowerCase().replace(/\s/g, "-")}`}
            >
              {r}
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 md:px-10 pb-32">
        {loading ? (
          <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#7a7466]">Loading…</div>
        ) : items.length === 0 ? (
          <EmptyState title="No services match" subtitle="Try a different role or search." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="services-grid">
            {items.map((e, i) => <EditorCard key={e.id} editor={e} index={i} />)}
          </div>
        )}
      </section>

      <Footer />
      <BottomNav />
    </div>
  );
}

function EditorCard({ editor, index }) {
  const Icon = editor.role.includes("Manager") || editor.role.includes("Strategist") ? Megaphone : editor.role.includes("Reel") ? Clapperboard : Wrench;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 6) * 0.04 }}
      whileHover={{ y: -4 }}
      className="border border-[#0a0a0a] bg-[#efe8d8] hover:shadow-[6px_6px_0_0_#0a0a0a] transition-all"
      data-testid={`editor-card-${editor.id}`}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#0a0a0a] mono text-[10px] uppercase tracking-[0.25em]">
        <span>No. {String(index + 1).padStart(2, "0")} / {editor.role}</span>
        <Icon size={12} />
      </div>
      <div className="aspect-[16/9] overflow-hidden bg-[#e8e0cd]">
        <img src={editor.cover} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="px-4 py-4 border-t border-[#0a0a0a]">
        <div className="flex items-center gap-3 mb-2">
          <img src={editor.avatar} alt="" className="w-10 h-10 rounded-full border border-[#0a0a0a] object-cover" />
          <div>
            <h3 className="display text-xl font-black leading-none">{editor.name}</h3>
            <div className="mono text-[10px] uppercase tracking-[0.2em] text-[#7a7466] mt-0.5">
              <MapPin size={9} className="inline -mt-0.5 mr-1" />{editor.city}
            </div>
          </div>
        </div>
        <p className="text-sm text-[#0a0a0a]/70 mt-2 line-clamp-2 min-h-[2.5rem]">{editor.bio}</p>
        <div className="flex flex-wrap gap-1 mt-3">
          {editor.skills?.slice(0, 3).map((s) => (
            <span key={s} className="mono text-[9px] uppercase tracking-widest border border-[#0a0a0a]/40 px-2 py-0.5">{s}</span>
          ))}
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#0a0a0a]/15">
          <div>
            <div className="mono text-[9px] uppercase tracking-[0.25em] text-[#7a7466]">From</div>
            <div className="display text-xl font-black text-[#e63946]">{formatINR(editor.price_per_project)}</div>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Star size={12} className="text-[#e63946]" fill="currentColor" />
            <span className="font-bold">{editor.rating}</span>
            <span className="text-[#7a7466]">· {editor.projects_done} projects</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
