import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search, SlidersHorizontal, X, ArrowUpRight, Star, Calendar, Users,
  Dumbbell, Shirt, UtensilsCrossed, Cpu, Coffee, Plane, Clapperboard, Megaphone,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";
import CreatorCard from "../components/common/CreatorCard";
import EmptyState from "../components/common/EmptyState";
import { getCreators, getCategories, getCampaigns } from "../lib/api";
import { formatINR } from "../lib/format";
import { getUser } from "../lib/auth";

const CAT_ICONS = { Dumbbell, Shirt, UtensilsCrossed, Cpu, Coffee, Plane, Clapperboard, Megaphone };
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

const NICHES = ["Fashion", "Fitness", "Food", "Tech", "Lifestyle", "Travel", "Beauty", "Gaming"];
const CITIES = ["Mumbai", "Delhi NCR", "Bangalore", "Pune", "Hyderabad", "Chennai", "Jaipur", "Kolkata", "Ahmedabad", "Chandigarh"];

/* ── Logged-in: full search + filter layout ── */
function DiscoverAuthenticated() {
  const [params, setParams] = useSearchParams();
  const initialNiche = params.get("niche");
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.get("search") || "");
  const [niches, setNiches] = useState(initialNiche ? [initialNiche] : []);
  const [cities, setCities] = useState([]);
  const [priceMax, setPriceMax] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const query = useMemo(() => {
    const q = {};
    if (search) q.search = search;
    if (niches.length) q.niche = niches.join(",");
    if (cities.length) q.city = cities.join(",");
    if (priceMax) q.price_max = priceMax;
    return q;
  }, [search, niches, cities, priceMax]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      getCreators(query)
        .then(setCreators)
        .catch(() => setCreators([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const toggle = (arr, val, setter) =>
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const clearAll = () => {
    setSearch(""); setNiches([]); setCities([]); setPriceMax(0); setParams({});
  };

  const activeCount = (search ? 1 : 0) + niches.length + cities.length + (priceMax ? 1 : 0);

  return (
    <div className="min-h-screen bg-[#efe8d8] text-[#0a0a0a]" data-testid="discover-page">
      <Navbar />

      <section className="max-w-7xl mx-auto px-5 md:px-10 pt-8 md:pt-12 pb-10">
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-3">Discover creators</div>
        <h1 className="display text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] mb-6">
          Find your<br /><span className="italic">people</span>.
        </h1>

        <div className="flex gap-3 items-center mt-8">
          <div className="flex-1 flex items-center gap-3 border border-[#0a0a0a] bg-[#efe8d8] px-4 py-3">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, niche, bio…"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-[#5c5650]"
              data-testid="search-input"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-[#5c5650] hover:text-[#e63946]" aria-label="Clear">
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="lg:hidden inline-flex items-center gap-2 px-4 py-3 border border-[#0a0a0a] mono text-[10px] uppercase tracking-widest"
            data-testid="filter-toggle"
          >
            <SlidersHorizontal size={14} /> Filters {activeCount > 0 && <span className="bg-[#e63946] text-[#efe8d8] rounded-full w-5 h-5 text-[10px] flex items-center justify-center">{activeCount}</span>}
          </button>
        </div>

        {activeCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 items-center">
            {niches.map((n) => <Chip key={n} onClear={() => toggle(niches, n, setNiches)}>{n}</Chip>)}
            {cities.map((c) => <Chip key={c} onClear={() => toggle(cities, c, setCities)}>{c}</Chip>)}
            {priceMax ? <Chip onClear={() => setPriceMax(0)}>Under ₹{priceMax / 1000}K</Chip> : null}
            <button onClick={clearAll} className="mono text-[10px] uppercase tracking-widest text-[#e63946] underline ml-2" data-testid="clear-filters">Clear all</button>
          </div>
        )}
      </section>

      <section className="max-w-7xl mx-auto px-5 md:px-10 grid lg:grid-cols-[260px_1fr] gap-8 pb-32">
        <aside className={`${showFilters ? "block" : "hidden"} lg:block border border-[#0a0a0a] p-5 h-fit lg:sticky lg:top-6`} data-testid="filters-panel">
          <FilterGroup title="Niche">
            <div className="flex flex-wrap gap-2">
              {NICHES.map((n) => (
                <button key={n} onClick={() => toggle(niches, n, setNiches)}
                  className={`px-3 py-1 mono text-[10px] uppercase tracking-widest border ${niches.includes(n) ? "bg-[#0a0a0a] text-[#efe8d8] border-[#0a0a0a]" : "border-[#0a0a0a]/40 hover:border-[#0a0a0a]"}`}
                  data-testid={`niche-${n.toLowerCase()}`}
                >{n}</button>
              ))}
            </div>
          </FilterGroup>
          <FilterGroup title="City">
            <div className="flex flex-wrap gap-2">
              {CITIES.map((c) => (
                <button key={c} onClick={() => toggle(cities, c, setCities)}
                  className={`px-3 py-1 mono text-[10px] uppercase tracking-widest border ${cities.includes(c) ? "bg-[#0a0a0a] text-[#efe8d8] border-[#0a0a0a]" : "border-[#0a0a0a]/40 hover:border-[#0a0a0a]"}`}
                  data-testid={`city-${c.toLowerCase().replace(/\s/g, "-")}`}
                >{c}</button>
              ))}
            </div>
          </FilterGroup>
          <FilterGroup title={`Reel price ${priceMax ? `≤ ₹${priceMax / 1000}K` : ""}`}>
            <input type="range" min={0} max={200000} step={5000} value={priceMax} onChange={(e) => setPriceMax(+e.target.value)} className="w-full accent-[#e63946]" data-testid="price-max" />
          </FilterGroup>
        </aside>

        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#5c5650]" data-testid="results-count">
              {loading ? "Loading…" : `${creators.length} ${creators.length === 1 ? "creator" : "creators"}`}
            </div>
          </div>
          {!loading && creators.length === 0 ? (
            <EmptyState title="No creators match" subtitle="Loosen your filters or try a different niche." />
          ) : (
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5" layout>
              {creators.map((c, i) => <CreatorCard key={c.id} creator={c} index={i} />)}
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
      <BottomNav />
    </div>
  );
}

/* ── Logged-out: curated discovery sections ── */
function DiscoverPublic() {
  const [creators, setCreators] = useState([]);
  const [categories, setCategories] = useState([]);
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    getCreators({ limit: 8 }).then(setCreators).catch(() => {});
    getCategories().then(setCategories).catch(() => {});
    getCampaigns({ limit: 4, sort: "newest" }).then(setCampaigns).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#efe8d8] text-[#0a0a0a]" data-testid="discover-page">
      <Navbar />

      {/* ── Browse by Craft ── */}
      <section className="pt-12 md:pt-20 pb-12 md:pb-20">
        <div className="max-w-7xl mx-auto px-5 md:px-10">
          <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#0a0a0a]/40 mb-2">§ Browse by craft</div>
          <h2 className="display text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] mb-8">
            Find your<br /><span className="italic">people</span>.
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 border-t border-l border-[#0a0a0a]">
            {(categories.length ? categories : STATIC_CATEGORIES).map((cat, i) => {
              const Icon = CAT_ICONS[cat.icon] || Star;
              return (
                <motion.div
                  key={cat.slug}
                  whileHover={{ backgroundColor: "#0a0a0a", color: "#efe8d8" }}
                  transition={{ duration: 0.2 }}
                  className="group bg-[#e63946] text-[#efe8d8] border-r border-b border-[#0a0a0a] h-[140px] md:aspect-square md:h-auto relative overflow-hidden"
                >
                  <Link
                    to="/auth"
                    className="absolute inset-0 p-5 flex flex-col justify-between transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <span className="mono text-[10px] uppercase tracking-[0.25em]">No. {String(i + 1).padStart(2, "0")}</span>
                      <ArrowUpRight size={16} className="opacity-60" />
                    </div>
                    <div>
                      <Icon size={28} strokeWidth={1.5} className="mb-3" />
                      <div className="display text-3xl md:text-4xl font-black leading-none">{cat.name}</div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Fresh Briefs ── */}
      <section className="max-w-7xl mx-auto px-5 md:px-10 py-12 md:py-20">
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#0a0a0a]/40 mb-3">§ Open for applications</div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <h2 className="display text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9]">
            Fresh<br /><span className="italic">briefs.</span>
          </h2>
          <Link to="/auth?role=creator" className="inline-flex items-center gap-2 mono text-xs uppercase tracking-widest border-b border-[#0a0a0a] hover:opacity-70 transition pb-1 w-fit">
            Join to apply <ArrowUpRight size={12} />
          </Link>
        </div>
        {campaigns.length > 0 ? (
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
        ) : (
          <p className="mono text-[10px] uppercase tracking-widest text-[#0a0a0a]/30">No open campaigns yet — check back soon.</p>
        )}
      </section>

      {/* ── On the Rise ── */}
      {creators.length > 0 && (
        <section className="max-w-7xl mx-auto px-5 md:px-10 py-12 md:py-20 pb-32 lg:pb-20">
          <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#0a0a0a]/40 mb-2">§ Featured</div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <h2 className="display text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9]">
              On the <span className="italic">rise</span><br />this week.
            </h2>
            <Link to="/auth" className="mono text-xs uppercase tracking-widest text-[#0a0a0a]/50 hover:text-[#0a0a0a] transition border-b border-[#0a0a0a]/30 pb-1 w-fit">
              Sign in to connect →
            </Link>
          </div>
          <div className="flex gap-5 overflow-x-auto scroll-hidden pb-4 -mx-5 px-5 md:mx-0 md:px-0">
            {creators.map((c, i) => (
              <div key={c.id} className="min-w-[280px] max-w-[280px]">
                <CreatorCard creator={c} index={i} />
              </div>
            ))}
          </div>
        </section>
      )}

      <Footer />
      <BottomNav />
    </div>
  );
}

/* ── Root: split on auth ── */
export default function Discover() {
  const user = getUser();
  return user ? <DiscoverAuthenticated /> : <DiscoverPublic />;
}

function Chip({ children, onClear }) {
  return (
    <span className="inline-flex items-center gap-1 mono text-[10px] uppercase tracking-widest border border-[#0a0a0a] bg-[#0a0a0a] text-[#efe8d8] px-2 py-1">
      {children}
      <button onClick={onClear} className="hover:text-[#e63946]" aria-label="remove"><X size={11} /></button>
    </span>
  );
}

function FilterGroup({ title, children }) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-3">{title}</div>
      {children}
    </div>
  );
}
