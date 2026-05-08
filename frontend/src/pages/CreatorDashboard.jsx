import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, TrendingUp, Inbox, CheckCircle2, Star } from "lucide-react";
import { toast } from "sonner";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";
import TrustRing from "../components/common/TrustRing";
import { getDeals, updateDeal, getCreator } from "../lib/api";
import { getUser } from "../lib/auth";
import { formatINR, formatFollowers } from "../lib/format";

const STATUSES = ["Requested", "Negotiating", "Confirmed", "Live", "Completed"];
const ACTIONS = {
  Requested: { label: "Accept", next: "Negotiating", color: "bg-[#0a0a0a] text-[#efe8d8]" },
  Negotiating: { label: "Confirm", next: "Confirmed", color: "bg-[#e63946] text-[#efe8d8]" },
  Confirmed: { label: "Mark live", next: "Live", color: "bg-[#0a0a0a] text-[#efe8d8]" },
  Live: { label: "Mark done", next: "Completed", color: "bg-[#0a0a0a] text-[#efe8d8]" },
};

export default function CreatorDashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const [creator, setCreator] = useState(null);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    if (!user || user.role !== "creator") {
      toast.error("Sign in as a creator");
      navigate("/auth?role=creator");
      return;
    }
    refresh();
  }, []); // eslint-disable-line

  async function refresh() {
    setLoading(true);
    try {
      const c = user.creatorId ? await getCreator(user.creatorId).catch(() => null) : null;
      setCreator(c);
      const ds = c ? await getDeals({ creator_id: c.id }) : await getDeals({});
      setDeals(ds);
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const earned = deals.filter((d) => ["Confirmed", "Live", "Completed"].includes(d.status)).reduce((s, d) => s + d.amount, 0);
    return {
      earned,
      pending: deals.filter((d) => ["Requested", "Negotiating"].includes(d.status)).length,
      active: deals.filter((d) => ["Confirmed", "Live"].includes(d.status)).length,
      done: deals.filter((d) => d.status === "Completed").length,
    };
  }, [deals]);

  const filtered = filter === "All" ? deals : deals.filter((d) => d.status === filter);

  const advance = async (deal) => {
    const next = ACTIONS[deal.status]?.next;
    if (!next) return;
    try {
      const updated = await updateDeal(deal.id, { status: next });
      setDeals((ds) => ds.map((d) => (d.id === deal.id ? updated : d)));
      toast.success(`Status → ${next}`);
    } catch {
      toast.error("Failed to update");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#efe8d8] text-[#0a0a0a]" data-testid="creator-dashboard">
      <Navbar />

      <section className="max-w-7xl mx-auto px-5 md:px-10 pt-8 md:pt-12 pb-8">
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-3">§ Creator Studio</div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h1 className="display text-5xl md:text-7xl font-black leading-[0.9]">
            Hey, <span className="italic text-[#e63946]">{user.name?.split(" ")[0]}</span>.
          </h1>
          {creator && (
            <div className="flex items-center gap-3 border border-[#0a0a0a] bg-[#efe8d8] p-3">
              <TrustRing score={creator.trust_score} size={56} stroke={3} />
              <div>
                <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#7a7466]">Trust score</div>
                <div className="display text-xl font-black">{creator.trust_score}/100</div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-l border-[#0a0a0a] mt-10" data-testid="creator-stats">
          <Stat icon={TrendingUp} label="Earned (locked + paid)" value={formatINR(stats.earned)} accent />
          <Stat icon={Inbox} label="Pending requests" value={stats.pending} />
          <Stat icon={CheckCircle2} label="Active deals" value={stats.active} />
          <Stat icon={Star} label="Completed" value={stats.done} />
        </div>

        {creator && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Mini label="Followers" v={formatFollowers(creator.followers)} />
            <Mini label="Engagement" v={`${creator.engagement_rate}%`} />
            <Mini label="Niche" v={creator.niche} />
            <Mini label="City" v={creator.city} />
          </div>
        )}
      </section>

      {/* Filter tabs */}
      <section className="max-w-7xl mx-auto px-5 md:px-10 pb-32">
        <div className="flex flex-wrap gap-2 mb-5">
          {["All", ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 mono text-[10px] uppercase tracking-widest border ${filter === s ? "bg-[#0a0a0a] text-[#efe8d8] border-[#0a0a0a]" : "border-[#0a0a0a]/40 hover:border-[#0a0a0a]"}`}
              data-testid={`filter-${s.toLowerCase()}`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin text-[#e63946]" /></div>
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-[#0a0a0a] py-16 text-center">
            <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-2">Nothing here</div>
            <div className="display text-3xl font-black">No {filter.toLowerCase()} deals.</div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="creator-deals">
            {filtered.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -3 }}
                className="border border-[#0a0a0a] bg-[#efe8d8] p-4 hover:shadow-[4px_4px_0_0_#0a0a0a]"
                data-testid={`deal-${d.id}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-9 h-9 flex items-center justify-center text-sm font-bold text-[#efe8d8]" style={{ background: d.brand_logo_color }}>{d.brand_name?.[0]}</span>
                    <div>
                      <div className="font-bold text-sm">{d.brand_name}</div>
                      <div className="mono text-[9px] uppercase tracking-widest text-[#7a7466]">{d.status}</div>
                    </div>
                  </div>
                  <div className="display text-2xl font-black text-[#e63946]">{formatINR(d.amount)}</div>
                </div>
                <div className="text-sm text-[#0a0a0a]/80 border-t border-[#0a0a0a]/15 pt-3">{d.deliverable}</div>
                {d.deadline && <div className="mono text-[9px] uppercase tracking-widest text-[#7a7466] mt-2">Due {new Date(d.deadline).toLocaleDateString()}</div>}
                {ACTIONS[d.status] && (
                  <button
                    onClick={() => advance(d)}
                    className={`mt-3 w-full px-3 py-2 mono text-[10px] uppercase tracking-widest ${ACTIONS[d.status].color} hover:brightness-110`}
                    data-testid={`advance-${d.id}`}
                  >
                    {ACTIONS[d.status].label} →
                  </button>
                )}
                {d.escrow && <div className="mono text-[9px] uppercase tracking-widest text-[#e63946] mt-2">◉ Escrow held</div>}
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <Footer />
      <BottomNav />
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }) {
  return (
    <div className={`border-r border-b border-[#0a0a0a] p-5 ${accent ? "bg-[#0a0a0a] text-[#efe8d8]" : ""}`}>
      <Icon size={18} className="mb-3 opacity-70" />
      <div className={`mono text-[10px] uppercase tracking-[0.3em] mb-1 ${accent ? "text-[#efe8d8]/60" : "text-[#7a7466]"}`}>{label}</div>
      <div className="display text-2xl md:text-3xl font-black">{value}</div>
    </div>
  );
}

function Mini({ label, v }) {
  return (
    <div className="border border-[#0a0a0a] px-3 py-2.5">
      <div className="mono text-[9px] uppercase tracking-widest text-[#7a7466]">{label}</div>
      <div className="font-bold mt-0.5">{v}</div>
    </div>
  );
}
