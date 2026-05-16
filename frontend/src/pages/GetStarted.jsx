import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowUpRight, Star, Calendar, Users,
  Dumbbell, Shirt, UtensilsCrossed, Cpu, Coffee, Plane, Clapperboard, Megaphone,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";
import CreatorCard from "../components/common/CreatorCard";
import { getCreators, getCategories, getCampaigns } from "../lib/api";
import { formatINR } from "../lib/format";

const ICONS = { Dumbbell, Shirt, UtensilsCrossed, Cpu, Coffee, Plane, Clapperboard, Megaphone };

const STATIC_CATEGORIES = [
  { slug: "fashion",       name: "Fashion",       icon: "Shirt" },
  { slug: "fitness",       name: "Fitness",       icon: "Dumbbell" },
  { slug: "food",          name: "Food",          icon: "UtensilsCrossed" },
  { slug: "tech",          name: "Tech",          icon: "Cpu" },
  { slug: "lifestyle",     name: "Lifestyle",     icon: "Coffee" },
  { slug: "travel",        name: "Travel",        icon: "Plane" },
  { slug: "video-editors", name: "Video Editing", icon: "Clapperboard" },
  { slug: "smm",           name: "Social Media",  icon: "Megaphone" },
];

export default function GetStarted() {
  const [creators, setCreators] = useState([]);
  const [categories, setCategories] = useState([]);
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    getCreators({ limit: 8 }).then(setCreators).catch(() => {});
    getCategories().then(setCategories).catch(() => {});
    getCampaigns({ limit: 4, sort: "newest" }).then(setCampaigns).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#efe8d8] text-[#0a0a0a]">
      <Navbar />

      {/* ── Join strip ── */}
      <section className="border-b border-[#0a0a0a] bg-[#0a0a0a] text-[#efe8d8] mt-[34px]">
        <div className="max-w-7xl mx-auto px-5 md:px-10 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#efe8d8]/40 mb-1">Noctra — it's free</div>
            <h1 className="display text-3xl md:text-5xl font-black leading-none">
              Create your account.
            </h1>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/auth?role=brand"
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#e63946] text-[#efe8d8] font-bold uppercase tracking-widest text-xs hover:opacity-85 transition min-h-[44px]"
            >
              I'm a brand <ArrowUpRight size={13} />
            </Link>
            <Link
              to="/auth?role=creator"
              className="inline-flex items-center gap-2 px-5 py-3 border border-[#efe8d8]/30 text-[#efe8d8] font-bold uppercase tracking-widest text-xs hover:border-[#efe8d8] transition min-h-[44px]"
            >
              I'm a creator
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-5 py-3 text-[#efe8d8]/50 font-bold uppercase tracking-widest text-xs hover:text-[#efe8d8] transition min-h-[44px] mono"
            >
              Sign in →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Find Your People ── */}
      <section className="bg-[#e63946] text-[#efe8d8] py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-5 md:px-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#efe8d8]/50 mb-2">§ Browse by craft</div>
              <h2 className="display text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9]">
                Find your<br /><span className="italic">people</span>.
              </h2>
            </div>
            <Link to="/discover" className="inline-flex items-center gap-2 mono text-xs uppercase tracking-widest border-b border-[#efe8d8] hover:opacity-70 transition pb-1 w-fit">
              Explore all <ArrowUpRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 border-t border-l border-[#efe8d8]/40">
            {(categories.length ? categories : STATIC_CATEGORIES).map((cat, i) => {
              const Icon = ICONS[cat.icon] || Star;
              return (
                <motion.div
                  key={cat.slug}
                  whileHover={{ backgroundColor: "#efe8d8", color: "#0a0a0a" }}
                  transition={{ duration: 0.2 }}
                  className="group border-r border-b border-[#efe8d8]/40 h-[140px] md:aspect-square md:h-auto relative overflow-hidden"
                >
                  <Link
                    to={cat.slug === "video-editors" || cat.slug === "smm" ? "/services" : `/discover?niche=${cat.name}`}
                    className="absolute inset-0 p-5 flex flex-col justify-between group-hover:text-[#0a0a0a] transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <span className="mono text-[10px] uppercase tracking-[0.25em]">No. {String(i + 1).padStart(2, "0")}</span>
                      <ArrowUpRight size={16} className="opacity-60" />
                    </div>
                    <div>
                      <Icon size={28} strokeWidth={1.5} className="mb-3" />
                      <div className="display text-3xl md:text-4xl font-black leading-none tracking-tight">{cat.name}</div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── On the Rise ── */}
      {creators.length > 0 && (
        <section className="bg-[#0a0a0a] text-[#efe8d8] py-8 md:py-14 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div>
                <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-2">§ Featured</div>
                <h2 className="display text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9]">
                  On the <span className="italic text-[#e63946]">rise</span><br />this week.
                </h2>
              </div>
              <Link to="/discover" className="mono text-xs uppercase tracking-widest text-[#efe8d8] hover:text-[#e63946] transition border-b border-[#efe8d8]/40 pb-1 w-fit">
                Browse all creators →
              </Link>
            </div>
            <div className="flex gap-5 overflow-x-auto scroll-hidden pb-4 -mx-5 px-5 md:mx-0 md:px-0">
              {creators.map((c, i) => (
                <div key={c.id} className="min-w-[280px] max-w-[280px]">
                  <CreatorCard creator={c} index={i} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Fresh Briefs ── */}
      {campaigns.length > 0 && (
        <section className="max-w-7xl mx-auto px-5 md:px-10 py-12 md:py-20 pb-32 lg:pb-20">
          <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#0a0a0a]/40 mb-3">§ Open for applications</div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <h2 className="display text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9]">
              Fresh<br /><span className="italic">briefs.</span>
            </h2>
            <Link to="/discover" className="inline-flex items-center gap-2 mono text-xs uppercase tracking-widest border-b border-[#0a0a0a] hover:opacity-70 transition pb-1 w-fit">
              Browse all <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-[#0a0a0a]">
            {campaigns.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                <Link to={`/campaigns/${c.id}`} className="group border-r border-b border-[#0a0a0a] p-6 flex flex-col justify-between min-h-[260px] hover:bg-[#0a0a0a] hover:text-[#efe8d8] transition-colors">
                  <div>
                    <div className="mono text-[9px] uppercase tracking-[0.25em] text-[#e63946] mb-3">{c.platform} · {c.target_niche}</div>
                    <h3 className="display text-2xl font-black leading-tight mb-2 group-hover:text-[#efe8d8]">{c.name}</h3>
                    <p className="text-xs text-[#0a0a0a]/60 group-hover:text-[#efe8d8]/60 line-clamp-2 leading-relaxed">{c.description}</p>
                  </div>
                  <div className="mt-4 space-y-1.5">
                    <div className="display text-2xl font-black text-[#e63946]">{formatINR(c.budget_min)}–{formatINR(c.budget_max)}</div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 mono text-[8px] uppercase tracking-widest text-[#7a7466] group-hover:text-[#efe8d8]/50">
                        <Calendar size={9} />{new Date(c.application_deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                      <span className="flex items-center gap-1 mono text-[8px] uppercase tracking-widest text-[#7a7466] group-hover:text-[#efe8d8]/50">
                        <Users size={9} />{c.applicant_count || 0} applied
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/auth?role=creator" className="inline-flex items-center gap-2 px-6 py-3.5 border border-[#0a0a0a] mono text-[10px] uppercase tracking-widest hover:bg-[#0a0a0a] hover:text-[#efe8d8] transition">
              Join as creator to apply →
            </Link>
          </div>
        </section>
      )}

      <Footer />
      <BottomNav />
    </div>
  );
}
