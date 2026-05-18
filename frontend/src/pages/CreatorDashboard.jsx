import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, TrendingUp, Inbox, CheckCircle2, Star, Camera, ArrowUpRight, RefreshCw, Info, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";
import TrustRing from "../components/common/TrustRing";
import { getDeals, updateDeal, getCreator, getCampaigns, getDealRooms, deleteAccount, uploadAvatar, updateCreatorProfile, refreshTrustScore, changePassword } from "../lib/api";
import { getUser, signOut } from "../lib/auth";
import { formatINR } from "../lib/format";
import { getAvatar } from "../lib/avatar";

const STATUSES = ["Requested", "Negotiating", "Confirmed", "Live", "Completed", "Rejected"];

// Creator acts on: Requested (accept/reject), Confirmed (mark live), Live (mark done)
// Negotiating = waiting for brand to pay — no creator action needed
const ACTIONS = {
  Requested: { label: "Accept", next: "Negotiating", color: "bg-[#0a0a0a] text-[#efe8d8]" },
  Confirmed:  { label: "Mark live", next: "Live",      color: "bg-[#e63946] text-[#efe8d8]" },
  Live:       { label: "Mark done", next: "Completed", color: "bg-[#0a0a0a] text-[#efe8d8]" },
};

export default function CreatorDashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const [tab, setTab] = useState("deals");
  const [creator, setCreator] = useState(null);
  const [deals, setDeals] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [dealRooms, setDealRooms] = useState([]);
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
      const [c, ds, cs, drs] = await Promise.all([
        getCreator(user.id).catch(() => null),
        getDeals({ creator_id: user.id }),
        getCampaigns({ niche: creator?.niche || "" }),
        getDealRooms(),
      ]);
      setCreator(c);
      setDeals(ds);
      setCampaigns(cs);
      setDealRooms(drs);
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const earned = deals.filter((d) => ["Confirmed", "Live", "Completed"].includes(d.status)).reduce((s, d) => s + d.amount, 0);
    return {
      earned,
      pending: deals.filter((d) => ["Requested", "Negotiating"].includes(d.status)).length,
      active:  deals.filter((d) => ["Confirmed", "Live"].includes(d.status)).length,
      done:    deals.filter((d) => d.status === "Completed").length,
    };
  }, [deals]);

  const filtered = filter === "All" ? deals : deals.filter((d) => d.status === filter);

  const advance = async (deal) => {
    const next = ACTIONS[deal.status]?.next;
    if (!next) return;
    try {
      const updated = await updateDeal(deal.id, { status: next });
      setDeals((ds) => ds.map((d) => (d.id === deal.id ? updated : d)));
      toast.success(next === "Negotiating" ? "Deal accepted · Waiting for brand to pay" : `Status → ${next}`);
    } catch {
      toast.error("Failed to update");
    }
  };

  const reject = async (deal) => {
    try {
      const updated = await updateDeal(deal.id, { status: "Rejected" });
      setDeals((ds) => ds.map((d) => (d.id === deal.id ? updated : d)));
      toast.success("Deal rejected");
    } catch {
      toast.error("Failed to reject");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#efe8d8] text-[#0a0a0a]" data-testid="creator-dashboard">
      <Navbar />

      <section className="max-w-7xl mx-auto px-5 md:px-10 pt-8 md:pt-12 pb-8">
        <div className="mb-3">
          <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946]">Creator Studio</div>
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <AvatarUploader creator={creator} onUpdated={setCreator} />
            <h1 className="display text-5xl md:text-7xl font-black leading-[0.9]">
              Hey, <span className="italic text-[#e63946]">{user.name?.split(" ")[0]}</span>.
            </h1>
          </div>
          {creator && (
            <div className="flex items-center gap-3 border border-[#0a0a0a] bg-[#efe8d8] p-3">
              <TrustRing score={creator.trust_score} size={56} stroke={3} />
              <div>
                <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#5c5650]">Trust score</div>
                <div className="display text-xl font-black">{creator.trust_score}/100</div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-l border-[#0a0a0a] mt-10" data-testid="creator-stats">
          <Stat icon={TrendingUp} label="Earned (locked + paid)" value={formatINR(stats.earned)} accent />
          <Stat icon={Inbox}       label="Pending requests"       value={stats.pending} />
          <Stat icon={CheckCircle2} label="Active deals"          value={stats.active} />
          <Stat icon={Star}        label="Completed"              value={stats.done} />
        </div>

        {creator && (
          <div className="mt-8 space-y-4">
            {creator.instagram_handle ? (
              <a
                href={`https://www.instagram.com/${creator.instagram_handle.replace("@", "")}/`}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between border border-[#0a0a0a] px-6 py-5 hover:bg-[#0a0a0a] hover:text-[#efe8d8] transition-colors"
              >
                <div>
                  <div className="mono text-[9px] uppercase tracking-[0.3em] text-[#5c5650] group-hover:text-[#efe8d8]/50 mb-1">Instagram</div>
                  <div className="display text-3xl md:text-4xl font-black">{creator.instagram_handle}</div>
                </div>
                <ArrowUpRight size={28} className="text-[#e63946] group-hover:text-[#efe8d8] shrink-0" />
              </a>
            ) : (
              <div className="border border-dashed border-[#0a0a0a] px-6 py-5">
                <div className="mono text-[9px] uppercase tracking-[0.3em] text-[#5c5650] mb-1">Instagram</div>
                <div className="display text-3xl md:text-4xl font-black text-[#5c5650]">Not linked yet</div>
              </div>
            )}
            <TrustScorePanel creator={creator} onUpdated={setCreator} />
          </div>
        )}
      </section>

      {/* Tabs */}
      <section className="max-w-7xl mx-auto px-5 md:px-10 mb-6">
        <div className="flex gap-0 border border-[#0a0a0a] w-fit flex-wrap">
          {[["deals", "My Deals"], ["campaigns", "Find Campaigns"], ["deal-rooms", "Deal Rooms"], ["profile", "Edit Profile"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-5 py-2.5 mono text-[10px] uppercase tracking-widest ${tab === key ? "bg-[#0a0a0a] text-[#efe8d8]" : "hover:bg-[#e8e0cd]"}`}>
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 md:px-10 pb-32">
        {tab === "profile" ? (
          <CreatorProfileEditor creator={creator} onUpdated={setCreator} />
        ) : tab === "campaigns" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.length === 0 ? (
              <div className="col-span-3 border border-dashed border-[#0a0a0a] py-16 text-center">
                <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#5c5650]">No campaigns in your niche yet. Check back soon.</div>
              </div>
            ) : campaigns.map((c) => {
              const isNew = c.created_at && (Date.now() - new Date(c.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000;
              return (
                <Link key={c.id} to={`/campaigns/${c.id}`} className="border border-[#0a0a0a] p-5 hover:shadow-[4px_4px_0_0_#0a0a0a] transition-shadow block relative">
                  {isNew && (
                    <span className="absolute top-3 right-3 bg-[#e63946] text-[#efe8d8] mono text-[8px] uppercase tracking-widest px-2 py-0.5">New</span>
                  )}
                  <div className="mono text-[9px] uppercase tracking-widest text-[#e63946] mb-2">{c.brand_name} · {c.target_niche}</div>
                  <div className="display text-2xl font-black mb-1">{c.name}</div>
                  <div className="text-sm text-[#5c5650] mb-4 line-clamp-2">{c.description}</div>
                  <div className="flex items-center justify-between mono text-[9px] uppercase tracking-widest text-[#5c5650]">
                    <span>{c.deliverables}</span>
                    <span className="text-[#e63946] font-bold">{formatINR(c.budget_min)}–{formatINR(c.budget_max)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : tab === "deal-rooms" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dealRooms.length === 0 ? (
              <div className="col-span-3 border border-dashed border-[#0a0a0a] py-16 text-center">
                <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#5c5650]">No deal rooms yet — apply to a campaign and get accepted.</div>
              </div>
            ) : dealRooms.map((r) => (
              <Link key={r.id} to={`/deal-room/${r.id}`} className="border border-[#0a0a0a] p-5 hover:shadow-[4px_4px_0_0_#0a0a0a] transition-shadow">
                <div className="mono text-[9px] uppercase tracking-widest text-[#e63946] mb-2">{r.status}</div>
                <div className="display text-xl font-black mb-1">{r.campaign_name}</div>
                <div className="mono text-[10px] uppercase tracking-widest text-[#5c5650]">{r.brand_name}</div>
              </Link>
            ))}
          </div>
        ) : (
        <>
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
                      <div className="mono text-[9px] uppercase tracking-widest text-[#5c5650]">{d.status}</div>
                    </div>
                  </div>
                  <div className="display text-2xl font-black text-[#e63946]">{formatINR(d.amount)}</div>
                </div>

                <div className="text-sm text-[#0a0a0a]/80 border-t border-[#0a0a0a]/25 pt-3">{d.deliverable}</div>
                {d.deadline && <div className="mono text-[9px] uppercase tracking-widest text-[#5c5650] mt-2">Due {new Date(d.deadline).toLocaleDateString()}</div>}

                {d.status === "Negotiating" && (
                  <div className="mt-3 mono text-[9px] uppercase tracking-widest text-[#5c5650]">⏳ Waiting for brand to pay</div>
                )}

                {d.status === "Requested" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => advance(d)}
                      className="flex-1 px-3 py-2 mono text-[10px] uppercase tracking-widest bg-[#0a0a0a] text-[#efe8d8] hover:brightness-110"
                      data-testid={`accept-${d.id}`}
                    >
                      Accept →
                    </button>
                    <button
                      onClick={() => reject(d)}
                      className="px-3 py-2 mono text-[10px] uppercase tracking-widest border border-[#0a0a0a] hover:bg-[#e63946] hover:text-[#efe8d8] hover:border-[#e63946] transition"
                      data-testid={`reject-${d.id}`}
                    >
                      Reject
                    </button>
                  </div>
                )}

                {ACTIONS[d.status] && d.status !== "Requested" && (
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
        </>
        )}
      </section>

      <ChangePasswordSection />
      <DeleteZone />
      <Footer />
      <BottomNav />
    </div>
  );
}

const TIER_STYLE = {
  top:        { label: "Top Creator",   bg: "#e63946", text: "#efe8d8" },
  gold:       { label: "Gold",          bg: "#f4c542", text: "#0a0a0a" },
  silver:     { label: "Silver",        bg: "#0a0a0a", text: "#efe8d8" },
  bronze:     { label: "Bronze",        bg: "#7a7466", text: "#efe8d8" },
  unverified: { label: "Unverified",    bg: "#e8e0cd", text: "#5c5650" },
};

const BREAKDOWN_META = [
  { key: "engagement",   label: "Engagement rate",    max: 40, desc: "Avg (likes + comments) / followers × 100, scaled to 40 pts" },
  { key: "authenticity", label: "Follower quality",   max: 20, desc: "Followers-to-following ratio — high ratio = real audience" },
  { key: "activity",     label: "Posting activity",   max: 15, desc: "Number of posts in the last 30 days, capped at 8+ posts" },
  { key: "completeness", label: "Profile complete",   max: 15, desc: "Bio, niche, city, pricing, and Instagram handle — 3 pts each" },
  { key: "verified",     label: "Verified badge",     max: 10, desc: "Instagram blue-tick verification" },
];

function InfoModal({ onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/60 backdrop-blur-sm px-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-[#efe8d8] border border-[#0a0a0a] w-full max-w-md p-6 relative"
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-4 right-4 hover:text-[#e63946] transition-colors">
            <X size={16} />
          </button>
          <div className="mono text-[9px] uppercase tracking-[0.4em] text-[#e63946] mb-1">How it works</div>
          <div className="display text-2xl font-black mb-4">Trust Score</div>
          <p className="text-sm text-[#5c5650] mb-5">
            Your score is calculated from live Instagram data scraped via Apify. Brands use it to decide who to work with.
          </p>
          <div className="space-y-3">
            {BREAKDOWN_META.map(({ label, max, desc }) => (
              <div key={label} className="border border-[#0a0a0a]/20 p-3">
                <div className="flex justify-between mono text-[9px] uppercase tracking-widest mb-1">
                  <span className="font-bold text-[#0a0a0a]">{label}</span>
                  <span className="text-[#e63946]">{max} pts</span>
                </div>
                <div className="text-xs text-[#5c5650]">{desc}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-[#0a0a0a]/20 mono text-[9px] uppercase tracking-widest text-[#5c5650]">
            Score auto-updates every time a brand completes a deal with you.
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0a0a] text-[#efe8d8] px-3 py-2 mono text-[9px] uppercase tracking-widest">
      <div className="mb-0.5">{label}</div>
      <div>Likes: <span className="text-[#e63946] font-bold">{payload[0]?.value?.toLocaleString("en-IN")}</span></div>
      {payload[1] && <div>Comments: <span className="font-bold">{payload[1]?.value?.toLocaleString("en-IN")}</span></div>}
    </div>
  );
};

function TrustScorePanel({ creator, onUpdated }) {
  const [refreshing, setRefreshing] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const stats = creator?.instagram_stats;
  const breakdown = creator?.trust_breakdown;
  const tier = TIER_STYLE[creator?.trust_tier] || TIER_STYLE.unverified;
  const computing = creator?.trust_score_computing;
  const hasScore = creator?.trust_score > 0 || !!breakdown;
  const hasHandle = !!creator?.instagram_handle;
  const chart = stats?.posts_chart || [];

  const timeAgo = (iso) => {
    if (!iso) return null;
    const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
    if (h < 1) return "just now";
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const doRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await refreshTrustScore(creator.id);
      toast.success(res.message);
      onUpdated({ ...creator, trust_score_computing: true });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <>
      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
      <div className="border border-[#0a0a0a]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#0a0a0a] bg-[#0a0a0a] text-[#efe8d8]">
          <div>
            <div className="mono text-[9px] uppercase tracking-[0.4em] text-[#efe8d8]/50 mb-0.5">Instagram Insights</div>
            <div className="display text-xl font-black">How brands see you.</div>
          </div>
          <div className="flex items-center gap-2">
            {hasScore && (
              <span className="mono text-[9px] uppercase tracking-widest px-3 py-1" style={{ background: tier.bg, color: tier.text }}>
                {tier.label}
              </span>
            )}
            <button onClick={() => setShowInfo(true)} className="text-[#efe8d8]/50 hover:text-[#efe8d8] transition-colors" title="How trust score is calculated">
              <Info size={15} />
            </button>
          </div>
        </div>

        {/* State 1: No handle */}
        {!hasHandle && (
          <div className="px-6 py-10 text-center">
            <div className="mono text-[9px] uppercase tracking-widest text-[#5c5650] mb-2">Instagram not linked</div>
            <div className="text-sm text-[#5c5650]">Go to <strong>Edit Profile</strong> → add your Instagram handle to see your stats and trust score.</div>
          </div>
        )}

        {/* State 2 & 3: Handle linked, quick stats (with or without trust score) */}
        {hasHandle && (
          <div className="p-6 space-y-6">
            {/* Basic stats — always shown once handle exists */}
            {stats ? (
              <div>
                <div className="mono text-[9px] uppercase tracking-[0.3em] text-[#5c5650] mb-3">Instagram Stats</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    ["Followers",    stats.followers != null ? Number(stats.followers).toLocaleString("en-IN") : "—"],
                    ["Following",    stats.following != null ? Number(stats.following).toLocaleString("en-IN") : "—"],
                    ["Total Posts",  stats.posts_count != null ? Number(stats.posts_count).toLocaleString("en-IN") : "—"],
                    ["Verified",     stats.verified ? "✓ Yes" : "No"],
                  ].map(([label, value]) => (
                    <div key={label} className="border border-[#0a0a0a] px-4 py-3">
                      <div className="mono text-[8px] uppercase tracking-widest text-[#5c5650] mb-1">{label}</div>
                      <div className="font-black text-lg">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {[0,1,2,3].map(i => <div key={i} className="border border-[#0a0a0a]/20 h-16 animate-pulse bg-[#0a0a0a]/5" />)}
              </div>
            )}

            {/* Engagement stats — only after trust score computed */}
            {hasScore && stats && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["Avg likes",    stats.avg_likes != null ? Number(stats.avg_likes).toLocaleString("en-IN") : "—"],
                  ["Avg comments", stats.avg_comments != null ? Number(stats.avg_comments).toLocaleString("en-IN") : "—"],
                  ["Posts / 30d",  stats.recent_posts_30d ?? "—"],
                ].map(([label, value]) => (
                  <div key={label} className="border border-[#0a0a0a]/40 px-3 py-2">
                    <div className="mono text-[8px] uppercase tracking-widest text-[#5c5650] mb-0.5">{label}</div>
                    <div className="font-bold text-base">{value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* CTA: Calculate score */}
            {!hasScore && !computing && (
              <div className="border border-dashed border-[#0a0a0a] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={14} className="text-[#e63946]" />
                    <div className="mono text-[9px] uppercase tracking-widest font-bold">Calculate Trust Score & Insights</div>
                  </div>
                  <div className="text-sm text-[#5c5650]">Scrapes your Instagram live — engagement rate, posting activity, follower quality and more.</div>
                </div>
                <button
                  onClick={doRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-1.5 mono text-[9px] uppercase tracking-widest px-4 py-2.5 bg-[#e63946] text-[#efe8d8] hover:brightness-110 disabled:opacity-50 transition-all shrink-0"
                >
                  <Sparkles size={10} className={refreshing ? "animate-spin" : ""} />
                  {refreshing ? "Starting…" : "Calculate now →"}
                </button>
              </div>
            )}

            {/* Computing state */}
            {computing && (
              <div className="border border-[#e63946] p-4 flex items-center gap-3">
                <Loader2 size={16} className="animate-spin text-[#e63946] shrink-0" />
                <div>
                  <div className="mono text-[9px] uppercase tracking-widest text-[#e63946] font-bold">Computing your trust score…</div>
                  <div className="text-xs text-[#5c5650] mt-0.5">Scraping Instagram live — takes about 10–15 seconds. Refresh the page in a moment.</div>
                </div>
              </div>
            )}

            {/* Trust score section — shown after computation */}
            {hasScore && (
              <>
                {/* Score ring + tier */}
                <div className="flex items-center gap-5 border border-[#0a0a0a] p-5">
                  <TrustRing score={creator?.trust_score || 0} size={80} stroke={6} />
                  <div className="flex-1">
                    <div className="mono text-[9px] uppercase tracking-[0.3em] text-[#5c5650] mb-1">Trust Score</div>
                    <div className="display text-4xl font-black">{creator.trust_score}<span className="text-lg font-normal text-[#5c5650]">/100</span></div>
                    <div className="mono text-[8px] uppercase tracking-widest text-[#5c5650] mt-1">
                      {creator?.trust_score_updated_at ? `Updated ${timeAgo(creator.trust_score_updated_at)}` : ""}
                    </div>
                  </div>
                  <button
                    onClick={doRefresh}
                    disabled={refreshing || computing}
                    className="flex items-center gap-1.5 mono text-[9px] uppercase tracking-widest px-3 py-2 border border-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-[#efe8d8] disabled:opacity-40 transition-colors"
                    title="Recalculate (once per 24h)"
                  >
                    <RefreshCw size={10} className={refreshing ? "animate-spin" : ""} />
                    {refreshing ? "…" : "Recalculate"}
                  </button>
                </div>

                {/* Score breakdown bars */}
                {breakdown && (
                  <div>
                    <div className="mono text-[9px] uppercase tracking-[0.3em] text-[#5c5650] mb-3">Score Breakdown</div>
                    <div className="space-y-2.5">
                      {BREAKDOWN_META.map(({ key, label, max }) => {
                        const val = breakdown[key] || 0;
                        const pct = (val / max) * 100;
                        return (
                          <div key={key}>
                            <div className="flex justify-between mono text-[9px] uppercase tracking-widest text-[#5c5650] mb-1">
                              <span>{label}</span>
                              <span className="text-[#0a0a0a] font-bold">{val}/{max}</span>
                            </div>
                            <div className="h-1.5 bg-[#0a0a0a]/10 w-full">
                              <motion.div
                                className="h-full bg-[#e63946]"
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Likes per post chart */}
                {chart.length > 0 && (
                  <div>
                    <div className="mono text-[9px] uppercase tracking-[0.3em] text-[#5c5650] mb-3">Likes per post (recent)</div>
                    <div className="border border-[#0a0a0a]/20 p-3">
                      <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={chart} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                          <XAxis dataKey="label" tick={{ fontSize: 8, fontFamily: "monospace", fill: "#5c5650" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 8, fontFamily: "monospace", fill: "#5c5650" }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#0a0a0a0d" }} />
                          <Bar dataKey="likes" fill="#e63946" radius={[2, 2, 0, 0]} />
                          <Bar dataKey="comments" fill="#0a0a0a" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="flex items-center gap-4 mt-2 mono text-[8px] uppercase tracking-widest text-[#5c5650]">
                        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 bg-[#e63946]" /> Likes</span>
                        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 bg-[#0a0a0a]" /> Comments</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function ChangePasswordSection() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => { setCurrent(""); setNext(""); setConfirm(""); setOpen(false); };

  const save = async () => {
    if (!current || !next || !confirm) return toast.error("Fill in all fields");
    if (next.length < 8) return toast.error("New password must be at least 8 characters");
    if (next !== confirm) return toast.error("Passwords don't match");
    setSaving(true);
    try {
      await changePassword(current, next);
      toast.success("Password updated");
      reset();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-5 md:px-10 pb-6">
      <div className="border-t border-[#0a0a0a]/25 pt-6 mt-2">
        <div className="mono text-[9px] uppercase tracking-widest text-[#5c5650] mb-2">Password</div>
        {!open ? (
          <button onClick={() => setOpen(true)} className="mono text-[10px] uppercase tracking-widest text-[#5c5650] hover:text-[#0a0a0a] transition-colors">
            Change password →
          </button>
        ) : (
          <div className="flex flex-col gap-3 max-w-sm">
            <input
              type="password" placeholder="Current password" value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="border border-[#0a0a0a] px-4 py-2.5 text-sm bg-transparent focus:outline-none"
            />
            <input
              type="password" placeholder="New password (min 8 chars)" value={next}
              onChange={(e) => setNext(e.target.value)}
              className="border border-[#0a0a0a] px-4 py-2.5 text-sm bg-transparent focus:outline-none"
            />
            <input
              type="password" placeholder="Confirm new password" value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="border border-[#0a0a0a] px-4 py-2.5 text-sm bg-transparent focus:outline-none"
            />
            <div className="flex gap-3">
              <button
                onClick={save} disabled={saving}
                className="mono text-[10px] uppercase tracking-widest px-4 py-2 bg-[#0a0a0a] text-[#efe8d8] hover:bg-[#e63946] disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : "Update password"}
              </button>
              <button onClick={reset} className="mono text-[10px] uppercase tracking-widest text-[#5c5650] hover:text-[#0a0a0a]">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function DeleteZone() {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const doDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      signOut();
      toast.success("Account deleted");
      navigate("/");
    } catch {
      toast.error("Failed to delete account");
      setDeleting(false);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-5 md:px-10 pb-8">
      <div className="border-t border-[#0a0a0a]/25 pt-6 mt-2">
        <div className="mono text-[9px] uppercase tracking-widest text-[#5c5650] mb-2">Danger zone</div>
        {confirming ? (
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm text-[#e63946]">This permanently deletes your account and all data.</span>
            <button
              onClick={doDelete}
              disabled={deleting}
              className="mono text-[10px] uppercase tracking-widest px-3 py-1.5 bg-[#e63946] text-[#efe8d8] hover:brightness-110 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Yes, delete →"}
            </button>
            <button onClick={() => setConfirming(false)} className="mono text-[10px] uppercase tracking-widest text-[#5c5650] hover:text-[#0a0a0a]">
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="mono text-[10px] uppercase tracking-widest text-[#5c5650] hover:text-[#e63946] transition-colors"
          >
            Delete account →
          </button>
        )}
      </div>
    </section>
  );
}

function Stat({ icon: Icon, label, value, accent }) {
  return (
    <div className={`border-r border-b border-[#0a0a0a] p-5 ${accent ? "bg-[#0a0a0a] text-[#efe8d8]" : ""}`}>
      <Icon size={18} className="mb-3 opacity-70" />
      <div className={`mono text-[10px] uppercase tracking-[0.3em] mb-1 ${accent ? "text-[#efe8d8]/85" : "text-[#5c5650]"}`}>{label}</div>
      <div className="display text-2xl md:text-3xl font-black">{value}</div>
    </div>
  );
}

function Mini({ label, v }) {
  return (
    <div className="border border-[#0a0a0a] px-3 py-2.5">
      <div className="mono text-[9px] uppercase tracking-widest text-[#5c5650]">{label}</div>
      <div className="font-bold mt-0.5">{v}</div>
    </div>
  );
}

const NICHES = ["Fashion", "Fitness", "Food", "Tech", "Lifestyle", "Travel", "Beauty", "Gaming"];

function CreatorProfileEditor({ creator, onUpdated }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bio: creator?.bio || "",
    city: creator?.city || "",
    niche: creator?.niche || "",
    instagram_handle: creator?.instagram_handle?.replace("@", "") || "",
    pricing_story: creator?.pricing?.story || 0,
    pricing_post: creator?.pricing?.post || 0,
    pricing_reel: creator?.pricing?.reel || 0,
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        instagram_handle: form.instagram_handle ? `@${form.instagram_handle.replace(/^@/, "")}` : undefined,
        pricing_story: Number(form.pricing_story),
        pricing_post: Number(form.pricing_post),
        pricing_reel: Number(form.pricing_reel),
      };
      const updated = await updateCreatorProfile(payload);
      onUpdated(updated);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to save — try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-0 border border-[#0a0a0a]">
      <div className="bg-[#0a0a0a] text-[#efe8d8] px-6 py-4">
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#efe8d8]/50 mb-1">Edit Profile</div>
        <div className="display text-2xl font-black">Your creator profile.</div>
      </div>

      <ProfileField label="Bio">
        <textarea
          value={form.bio}
          onChange={set("bio")}
          rows={3}
          placeholder="Tell brands who you are and what you create…"
          className="w-full bg-transparent border-0 px-6 py-4 text-sm focus:outline-none resize-none"
        />
      </ProfileField>

      <ProfileField label="City">
        <input
          value={form.city}
          onChange={set("city")}
          placeholder="e.g. Mumbai, Delhi, Bangalore…"
          className="w-full bg-transparent border-0 px-6 py-4 text-sm focus:outline-none"
        />
      </ProfileField>

      <ProfileField label="Niche">
        <select
          value={form.niche}
          onChange={set("niche")}
          className="w-full bg-transparent border-0 px-6 py-4 text-sm focus:outline-none appearance-none cursor-pointer"
        >
          <option value="">Select niche</option>
          {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </ProfileField>

      <ProfileField label="Instagram Handle">
        <div className="flex items-center">
          <span className="px-6 py-4 text-sm text-[#5c5650] border-r border-[#0a0a0a] select-none shrink-0">@</span>
          <input
            value={form.instagram_handle}
            onChange={(e) => setForm((f) => ({ ...f, instagram_handle: e.target.value.replace(/^@/, "") }))}
            placeholder="your_handle"
            className="flex-1 bg-transparent px-4 py-4 text-sm focus:outline-none"
          />
        </div>
      </ProfileField>

      <div className="border-t border-[#0a0a0a] px-6 py-4">
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#5c5650] mb-4">Pricing (₹ per post)</div>
        <div className="grid grid-cols-3 gap-3">
          {[["Story", "pricing_story"], ["Post", "pricing_post"], ["Reel", "pricing_reel"]].map(([label, key]) => (
            <label key={key}>
              <div className="mono text-[9px] uppercase tracking-widest text-[#5c5650] mb-1">{label}</div>
              <div className="flex items-center border border-[#0a0a0a]">
                <span className="px-2 py-2 text-sm text-[#5c5650] border-r border-[#0a0a0a] select-none">₹</span>
                <input
                  type="number"
                  min="0"
                  value={form[key]}
                  onChange={set(key)}
                  className="flex-1 bg-transparent px-2 py-2 text-sm focus:outline-none w-full"
                />
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-[#0a0a0a] px-6 py-4 flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2.5 bg-[#0a0a0a] text-[#efe8d8] mono text-[10px] uppercase tracking-widest hover:bg-[#e63946] disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Save changes →"}
        </button>
      </div>
    </div>
  );
}

function ProfileField({ label, children }) {
  return (
    <div className="border-t border-[#0a0a0a]">
      <div className="px-6 pt-4 pb-0">
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#5c5650]">{label}</div>
      </div>
      {children}
    </div>
  );
}

function AvatarUploader({ creator, onUpdated }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image too large — keep it under 2 MB");
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const base64 = ev.target.result;
        await uploadAvatar(base64);
        onUpdated({ ...creator, avatar: base64 });
        toast.success("Photo updated!");
      } catch {
        toast.error("Upload failed — try again");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="relative group cursor-pointer shrink-0"
      onClick={() => !uploading && inputRef.current?.click()}
    >
      <img
        src={getAvatar(creator || {})}
        alt=""
        className="w-16 h-16 rounded-full border-2 border-[#0a0a0a] bg-[#e8e0cd] object-cover"
      />
      <div className="absolute inset-0 rounded-full bg-[#0a0a0a]/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
        {uploading
          ? <Loader2 size={16} className="animate-spin text-[#efe8d8]" />
          : <Camera size={16} className="text-[#efe8d8]" />}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
