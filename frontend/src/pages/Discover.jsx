import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";
import CreatorCard from "../components/common/CreatorCard";
import EmptyState from "../components/common/EmptyState";
import { getCreators } from "../lib/api";

const NICHES = ["Fashion", "Fitness", "Food", "Tech", "Lifestyle", "Travel", "Beauty", "Gaming"];
const CITIES = ["Mumbai", "Delhi NCR", "Bangalore", "Pune", "Hyderabad", "Chennai", "Jaipur", "Kolkata", "Ahmedabad", "Chandigarh"];

export default function Discover() {
  const [params, setParams] = useSearchParams();
  const initialNiche = params.get("niche");
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.get("search") || "");
  const [niches, setNiches] = useState(initialNiche ? [initialNiche] : []);
  const [cities, setCities] = useState([]);
  const [followersMin, setFollowersMin] = useState(0);
  const [engagementMin, setEngagementMin] = useState(0);
  const [priceMax, setPriceMax] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const query = useMemo(() => {
    const q = {};
    if (search) q.search = search;
    if (niches.length) q.niche = niches.join(",");
    if (cities.length) q.city = cities.join(",");
    if (followersMin) q.followers_min = followersMin;
    if (engagementMin) q.engagement_min = engagementMin;
    if (priceMax) q.price_max = priceMax;
    return q;
  }, [search, niches, cities, followersMin, engagementMin, priceMax]);

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
    setSearch("");
    setNiches([]);
    setCities([]);
    setFollowersMin(0);
    setEngagementMin(0);
    setPriceMax(0);
    setParams({});
  };

  const activeCount = (search ? 1 : 0) + niches.length + cities.length + (followersMin ? 1 : 0) + (engagementMin ? 1 : 0) + (priceMax ? 1 : 0);

  return (
    <div className="min-h-screen bg-[#efe8d8] text-[#0a0a0a]" data-testid="discover-page">
      <Navbar />

      <section className="max-w-7xl mx-auto px-5 md:px-10 pt-8 md:pt-12 pb-10">
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-3">§ Discover — 3,200+ creators</div>
        <h1 className="display text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] mb-6">
          Find your<br/><span className="italic text-[#e63946]">people</span>.
        </h1>

        {/* Search + filter trigger */}
        <div className="flex gap-3 items-center mt-8">
          <div className="flex-1 flex items-center gap-3 border border-[#0a0a0a] bg-[#efe8d8] px-4 py-3">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, niche, bio…"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-[#7a7466]"
              data-testid="search-input"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-[#7a7466] hover:text-[#e63946]" aria-label="Clear">
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

        {/* Active chips */}
        {activeCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 items-center">
            {niches.map((n) => (
              <Chip key={n} onClear={() => toggle(niches, n, setNiches)}>{n}</Chip>
            ))}
            {cities.map((c) => (
              <Chip key={c} onClear={() => toggle(cities, c, setCities)}>{c}</Chip>
            ))}
            {followersMin ? <Chip onClear={() => setFollowersMin(0)}>{followersMin / 1000}K+ followers</Chip> : null}
            {engagementMin ? <Chip onClear={() => setEngagementMin(0)}>{engagementMin}%+ engagement</Chip> : null}
            {priceMax ? <Chip onClear={() => setPriceMax(0)}>Under ₹{priceMax / 1000}K</Chip> : null}
            <button onClick={clearAll} className="mono text-[10px] uppercase tracking-widest text-[#e63946] underline ml-2" data-testid="clear-filters">Clear all</button>
          </div>
        )}
      </section>

      <section className="max-w-7xl mx-auto px-5 md:px-10 grid lg:grid-cols-[260px_1fr] gap-8 pb-32">
        {/* Filter rail (desktop) */}
        <aside className={`${showFilters ? "block" : "hidden"} lg:block border border-[#0a0a0a] p-5 h-fit lg:sticky lg:top-6`} data-testid="filters-panel">
          <FilterGroup title="Niche">
            <div className="flex flex-wrap gap-2">
              {NICHES.map((n) => (
                <button
                  key={n}
                  onClick={() => toggle(niches, n, setNiches)}
                  className={`px-3 py-1 mono text-[10px] uppercase tracking-widest border ${niches.includes(n) ? "bg-[#0a0a0a] text-[#efe8d8] border-[#0a0a0a]" : "border-[#0a0a0a]/40 hover:border-[#0a0a0a]"}`}
                  data-testid={`niche-${n.toLowerCase()}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="City">
            <div className="flex flex-wrap gap-2">
              {CITIES.map((c) => (
                <button
                  key={c}
                  onClick={() => toggle(cities, c, setCities)}
                  className={`px-3 py-1 mono text-[10px] uppercase tracking-widest border ${cities.includes(c) ? "bg-[#0a0a0a] text-[#efe8d8] border-[#0a0a0a]" : "border-[#0a0a0a]/40 hover:border-[#0a0a0a]"}`}
                  data-testid={`city-${c.toLowerCase().replace(/\s/g, "-")}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title={`Followers ${followersMin ? `· ${followersMin / 1000}K+` : ""}`}>
            <input type="range" min={0} max={500000} step={10000} value={followersMin} onChange={(e) => setFollowersMin(+e.target.value)} className="w-full accent-[#e63946]" data-testid="followers-min" />
          </FilterGroup>

          <FilterGroup title={`Min engagement ${engagementMin ? `· ${engagementMin}%` : ""}`}>
            <input type="range" min={0} max={10} step={0.5} value={engagementMin} onChange={(e) => setEngagementMin(+e.target.value)} className="w-full accent-[#e63946]" data-testid="engagement-min" />
          </FilterGroup>

          <FilterGroup title={`Reel price ${priceMax ? `≤ ₹${priceMax / 1000}K` : ""}`}>
            <input type="range" min={0} max={200000} step={5000} value={priceMax} onChange={(e) => setPriceMax(+e.target.value)} className="w-full accent-[#e63946]" data-testid="price-max" />
          </FilterGroup>
        </aside>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#7a7466]" data-testid="results-count">
              {loading ? "Loading…" : `${creators.length} ${creators.length === 1 ? "creator" : "creators"}`}
            </div>
          </div>

          {!loading && creators.length === 0 ? (
            <EmptyState title="No creators match" subtitle="Loosen your filters or try a different niche." />
          ) : (
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5" layout>
              {creators.map((c, i) => (
                <CreatorCard key={c.id} creator={c} index={i} />
              ))}
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
      <BottomNav />
    </div>
  );
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
