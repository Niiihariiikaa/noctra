import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";
import { getDeals, updateDeal, getBrands } from "../lib/api";
import { getUser } from "../lib/auth";
import { formatINR } from "../lib/format";

const COLUMNS = [
  { key: "Requested", color: "bg-[#efe8d8]" },
  { key: "Negotiating", color: "bg-[#f4c542]" },
  { key: "Confirmed", color: "bg-[#e63946] text-[#efe8d8]" },
  { key: "Live", color: "bg-[#0a0a0a] text-[#efe8d8]" },
  { key: "Completed", color: "bg-[#e8e0cd]" },
];

const NEXT_STATUS = {
  Requested: "Negotiating",
  Negotiating: "Confirmed",
  Confirmed: "Live",
  Live: "Completed",
};

export default function BrandDashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const [deals, setDeals] = useState([]);
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "brand") {
      toast.error("Sign in as a brand");
      navigate("/auth?role=brand");
      return;
    }
    refresh();
  }, []); // eslint-disable-line

  async function refresh() {
    setLoading(true);
    try {
      const [bs, ds] = await Promise.all([
        getBrands(),
        getDeals(user.brandId ? { brand_id: user.brandId } : {}),
      ]);
      const myBrand = bs.find((b) => b.id === user.brandId) || bs[0];
      setBrand(myBrand);
      // If no brand_id linked, show all deals across brands as demo
      setDeals(user.brandId ? ds : await getDeals({ brand_id: myBrand?.id }));
    } finally {
      setLoading(false);
    }
  }

  const grouped = useMemo(() => {
    const g = Object.fromEntries(COLUMNS.map((c) => [c.key, []]));
    deals.forEach((d) => g[d.status]?.push(d));
    return g;
  }, [deals]);

  const stats = useMemo(() => {
    const total = deals.length;
    const active = deals.filter((d) => ["Confirmed", "Live"].includes(d.status)).length;
    const spent = deals.filter((d) => ["Confirmed", "Live", "Completed"].includes(d.status)).reduce((s, d) => s + d.amount, 0);
    return { total, active, spent };
  }, [deals]);

  const advance = async (deal) => {
    const next = NEXT_STATUS[deal.status];
    if (!next) return;
    try {
      const updated = await updateDeal(deal.id, { status: next });
      setDeals((ds) => ds.map((d) => (d.id === deal.id ? updated : d)));
      toast.success(`Moved to ${next}`);
    } catch {
      toast.error("Failed to update");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#efe8d8] text-[#0a0a0a]" data-testid="brand-dashboard">
      <Navbar />

      <section className="max-w-7xl mx-auto px-5 md:px-10 pt-8 md:pt-12 pb-8">
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-3">§ Brand Studio · {brand?.name || "—"}</div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="display text-5xl md:text-7xl font-black leading-[0.9]">
            Your<br/><span className="italic text-[#e63946]">pipeline</span>.
          </h1>
          <Link
            to="/discover"
            className="inline-flex items-center gap-2 px-5 py-3.5 bg-[#0a0a0a] text-[#efe8d8] font-bold uppercase tracking-widest text-xs hover:bg-[#e63946] min-h-[44px]"
            data-testid="add-deal-btn"
          >
            <Plus size={14} /> New collab
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 border-t border-l border-[#0a0a0a] mt-8" data-testid="brand-stats">
          <Stat label="Total deals" value={stats.total} />
          <Stat label="Active" value={stats.active} accent />
          <Stat label="Committed spend" value={formatINR(stats.spent)} />
        </div>
      </section>

      <section className="max-w-[1600px] mx-auto px-5 md:px-10 pb-32">
        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin text-[#e63946]" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3" data-testid="kanban">
            {COLUMNS.map((col) => (
              <div key={col.key} className="border border-[#0a0a0a] flex flex-col min-h-[400px]">
                <div className={`${col.color} px-4 py-3 border-b border-[#0a0a0a] flex items-center justify-between`}>
                  <span className="mono text-[10px] uppercase tracking-[0.25em] font-bold">{col.key}</span>
                  <span className="mono text-[10px]">{grouped[col.key]?.length || 0}</span>
                </div>
                <div className="flex-1 p-3 space-y-3 bg-[#efe8d8]">
                  {grouped[col.key]?.length === 0 ? (
                    <div className="text-[#7a7466] text-xs mono uppercase tracking-widest text-center py-8">Empty</div>
                  ) : (
                    grouped[col.key].map((d) => (
                      <DealCard key={d.id} deal={d} onAdvance={() => advance(d)} hasNext={!!NEXT_STATUS[d.status]} />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
      <BottomNav />
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className={`border-r border-b border-[#0a0a0a] p-5 ${accent ? "bg-[#0a0a0a] text-[#efe8d8]" : ""}`}>
      <div className={`mono text-[10px] uppercase tracking-[0.3em] mb-1 ${accent ? "text-[#efe8d8]/60" : "text-[#7a7466]"}`}>{label}</div>
      <div className="display text-3xl md:text-4xl font-black">{value}</div>
    </div>
  );
}

function DealCard({ deal, onAdvance, hasNext }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="border border-[#0a0a0a] bg-[#efe8d8] p-3 hover:shadow-[3px_3px_0_0_#0a0a0a]"
      data-testid={`deal-${deal.id}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <img src={deal.creator_avatar} alt="" className="w-9 h-9 rounded-full border border-[#0a0a0a] object-cover" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm truncate">{deal.creator_name}</div>
          <div className="mono text-[9px] uppercase tracking-widest text-[#7a7466] truncate">{deal.deliverable}</div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#0a0a0a]/15">
        <span className="display text-lg font-black text-[#e63946]">{formatINR(deal.amount)}</span>
        {hasNext && (
          <button
            onClick={onAdvance}
            className="mono text-[9px] uppercase tracking-widest border border-[#0a0a0a] px-2 py-1 hover:bg-[#0a0a0a] hover:text-[#efe8d8] transition"
            data-testid={`advance-${deal.id}`}
          >
            Advance <ArrowUpRight size={9} className="inline" />
          </button>
        )}
      </div>
      {deal.escrow && (
        <div className="mono text-[9px] uppercase tracking-widest text-[#e63946] mt-2">◉ Escrow held</div>
      )}
    </motion.div>
  );
}
