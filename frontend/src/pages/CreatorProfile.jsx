import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, MapPin, Star, Instagram, Loader2, Info, X } from "lucide-react";
import { toast } from "sonner";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";
import TrustRing from "../components/common/TrustRing";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getCreator, getBrands, createDeal } from "../lib/api";
import { getAvatar } from "../lib/avatar";
import { getUser } from "../lib/auth";
import { formatINR, trustBadge } from "../lib/format";

const DELIVERABLES = [
  { key: "story", label: "Story", multiplier: 1 },
  { key: "post", label: "Feed Post", multiplier: 3 },
  { key: "reel", label: "Reel", multiplier: 5 },
];

export default function CreatorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [deliverable, setDeliverable] = useState("reel");
  const [submitting, setSubmitting] = useState(false);
  const user = getUser();

  useEffect(() => {
    setLoading(true);
    getCreator(id)
      .then(setCreator)
      .catch(() => toast.error("Creator not found"))
      .finally(() => setLoading(false));
    getBrands().then(setBrands).catch(() => {});
  }, [id]);

  const price = creator?.pricing?.[deliverable] || 0;

  const onBook = async () => {
    if (!user || user.role !== "brand") {
      toast.error("Sign in as a brand to book");
      navigate("/auth?role=brand");
      return;
    }
    // Only show the brand that belongs to this user
    const myBrand = brands.find((b) => b.user_id === user.id) || brands.find((b) => b.id === selectedBrand);
    if (!myBrand) {
      toast.error("No brand profile found — make sure you registered as a brand.");
      return;
    }
    setSubmitting(true);
    try {
      await createDeal({
        brand_id: user.id,
        brand_name: myBrand.name,
        brand_logo_color: myBrand.logo_color || "#00d4c8",
        creator_id: creator.id,
        creator_name: creator.name,
        creator_avatar: creator.avatar,
        deliverable: DELIVERABLES.find((d) => d.key === deliverable).label,
        amount: price,
        status: "Requested",
      });
      toast.success("Request sent! The creator will review it.");
      setOpen(false);
      navigate("/dashboard/brand");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to send request");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#efe8d8] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#e63946]" size={32} />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-[#efe8d8]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-5 py-32 text-center">
          <h1 className="display text-6xl">Creator not found.</h1>
          <Link to="/discover" className="mono text-xs uppercase tracking-widest underline mt-6 inline-block">Back to discover</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const badge = trustBadge(creator.trust_score);

  return (
    <div className="min-h-screen bg-[#efe8d8] text-[#0a0a0a]" data-testid="creator-profile">
      <Navbar />

      {/* Cover */}
      <section className="relative h-[40vh] md:h-[55vh] overflow-hidden border-b border-[#0a0a0a]">
        <img src={creator.cover} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#0a0a0a]/40" />
        <div className="absolute bottom-6 left-5 md:left-10 right-5 md:right-10 flex items-end justify-between gap-4">
          <div>
            <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#efe8d8]/90 mb-2">{creator.niche} · {creator.city}</div>
            <h1 className="display text-5xl md:text-8xl font-black text-[#efe8d8] leading-[0.9]" data-testid="creator-name">{creator.name}</h1>
          </div>
          <div className="hidden md:block bg-[#efe8d8] border border-[#0a0a0a] p-3">
            <TrustRing score={creator.trust_score} size={80} />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 md:px-10 py-12 grid md:grid-cols-[1fr_320px] gap-10">
        {/* Main */}
        <div>
          {/* Avatar + bio + badge */}
          <div className="flex items-center gap-3 flex-wrap mb-8">
            <img
              src={getAvatar(creator)}
              alt=""
              className="w-16 h-16 rounded-full object-cover border border-[#0a0a0a] bg-[#e8e0cd]"
            />
            <div className="flex-1">
              <p className="text-[#0a0a0a]/80 text-sm md:text-base">{creator.bio}</p>
            </div>
            <span className="px-2.5 py-1 mono text-[9px] uppercase tracking-widest border border-[#0a0a0a] bg-[#0a0a0a] text-[#efe8d8]">{badge.label}</span>
          </div>

          {/* Instagram — big redirect link */}
          {creator.instagram_handle ? (
            <a
              href={`https://www.instagram.com/${creator.instagram_handle.replace("@", "")}/`}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center justify-between border border-[#0a0a0a] px-6 py-5 mb-4 hover:bg-[#0a0a0a] hover:text-[#efe8d8] transition-colors"
            >
              <div>
                <div className="mono text-[9px] uppercase tracking-[0.3em] text-[#5c5650] group-hover:text-[#efe8d8]/50 mb-1">Instagram</div>
                <div className="display text-3xl md:text-4xl font-black">{creator.instagram_handle}</div>
              </div>
              <ArrowUpRight size={28} className="text-[#e63946] group-hover:text-[#efe8d8] shrink-0" />
            </a>
          ) : null}

          {/* Creator Insights panel */}
          <CreatorInsights creator={creator} />

          {/* Reviews */}
          <div className="mt-12">
            <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-4">Brands say</div>
            <div className="space-y-3">
              {(creator.reviews || []).slice(0, 6).map((r) => (
                <div key={r.id} className="border border-[#0a0a0a] p-4 bg-[#efe8d8]" data-testid={`review-${r.id}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 flex items-center justify-center text-xs font-bold text-[#efe8d8]" style={{ background: r.brand_logo_color }}>{r.brand_name?.[0]}</span>
                      <span className="font-bold text-sm">{r.brand_name}</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-[#e63946]">
                      {Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                    </div>
                  </div>
                  <p className="text-sm text-[#0a0a0a]/80">{r.comment}</p>
                </div>
              ))}
              {!creator.reviews?.length && <p className="text-[#5c5650] text-sm">No reviews yet.</p>}
            </div>
          </div>
        </div>

        {/* Booking sidebar */}
        <aside className="md:sticky md:top-6 h-fit border border-[#0a0a0a] bg-[#efe8d8]">
          <div className="px-5 py-4 border-b border-[#0a0a0a] mono text-[10px] uppercase tracking-[0.3em]">Pricing</div>
          <div className="p-5 space-y-3">
            {DELIVERABLES.map((d) => (
              <button
                key={d.key}
                onClick={() => setDeliverable(d.key)}
                className={`w-full flex justify-between items-center px-4 py-3 border ${deliverable === d.key ? "bg-[#0a0a0a] text-[#efe8d8] border-[#0a0a0a]" : "border-[#0a0a0a]/40 hover:border-[#0a0a0a]"}`}
                data-testid={`pricing-${d.key}`}
              >
                <span className="text-sm font-medium">{d.label}</span>
                <span className="display font-black text-xl">{formatINR(creator.pricing?.[d.key] || 0)}</span>
              </button>
            ))}
            <button
              onClick={() => setOpen(true)}
              className="w-full mt-4 px-4 py-3.5 bg-[#e63946] text-[#efe8d8] font-bold uppercase tracking-widest text-xs hover:brightness-110 inline-flex items-center justify-center gap-2"
              data-testid="book-deal-btn"
            >
              Book a deal <ArrowUpRight size={14} />
            </button>
            <p className="mono text-[9px] uppercase tracking-widest text-[#5c5650] text-center">Deals tracked end-to-end on Noctra</p>
          </div>
        </aside>
      </section>

      {/* Booking Modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-[#0a0a0a]/60 flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setOpen(false)} data-testid="book-modal">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#efe8d8] border border-[#0a0a0a] w-full md:max-w-lg p-6 md:p-8"
          >
            <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-2">Book a deal</div>
            <h3 className="display text-3xl font-black mb-5">{DELIVERABLES.find((d) => d.key === deliverable).label} with {creator.name}</h3>
            <label className="mono text-[10px] uppercase tracking-[0.3em] block mb-2">From brand</label>
            <select
              value={selectedBrand || brands.find((b) => b.user_id === user?.id)?.id || ""}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full border border-[#0a0a0a] bg-[#efe8d8] px-3 py-3 mb-5 text-sm"
              data-testid="brand-select"
            >
              {brands.filter((b) => b.user_id === user?.id).map((b) => <option key={b.id} value={b.id}>{b.name}{b.industry ? ` — ${b.industry}` : ""}</option>)}
            </select>

            <div className="flex items-center justify-between border-t border-[#0a0a0a] pt-4 mb-5">
              <span className="mono text-xs uppercase tracking-widest">Total</span>
              <span className="display text-3xl font-black text-[#e63946]">{formatINR(price)}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setOpen(false)} className="flex-1 px-4 py-3 border border-[#0a0a0a] mono text-[10px] uppercase tracking-widest" data-testid="cancel-book">
                Cancel
              </button>
              <button
                onClick={onBook}
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-[#0a0a0a] text-[#efe8d8] mono text-[10px] uppercase tracking-widest disabled:opacity-50 inline-flex items-center justify-center gap-2"
                data-testid="confirm-book"
              >
                {submitting && <Loader2 size={12} className="animate-spin" />}
                Send Request
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
      <BottomNav />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="border-r border-b border-[#0a0a0a] p-5">
      <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#5c5650] mb-1">{label}</div>
      <div className="display text-3xl md:text-4xl font-black">{value}</div>
    </div>
  );
}

const TIER_STYLE = {
  top:        { label: "Top Creator", bg: "#e63946", text: "#efe8d8" },
  gold:       { label: "Gold",        bg: "#f4c542", text: "#0a0a0a" },
  silver:     { label: "Silver",      bg: "#0a0a0a", text: "#efe8d8" },
  bronze:     { label: "Bronze",      bg: "#7a7466", text: "#efe8d8" },
  unverified: { label: "Unverified",  bg: "#e8e0cd", text: "#5c5650" },
};

const BREAKDOWN_META = [
  { key: "engagement",   label: "Engagement rate",  max: 40 },
  { key: "authenticity", label: "Follower quality",  max: 20 },
  { key: "activity",     label: "Posting activity",  max: 15 },
  { key: "completeness", label: "Profile complete",  max: 15 },
  { key: "verified",     label: "Verified badge",    max: 10 },
];

const BREAKDOWN_DESC = {
  engagement:   "Avg (likes + comments) / followers × 100",
  authenticity: "Followers-to-following ratio — high = real audience",
  activity:     "Posts in last 30 days (max 8+)",
  completeness: "Bio, niche, city, pricing & Instagram handle",
  verified:     "Instagram blue-tick verification",
};

function ScoreInfoModal({ onClose }) {
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
          <button onClick={onClose} className="absolute top-4 right-4 hover:text-[#e63946] transition-colors"><X size={16} /></button>
          <div className="mono text-[9px] uppercase tracking-[0.4em] text-[#e63946] mb-1">How it works</div>
          <div className="display text-2xl font-black mb-4">Trust Score</div>
          <p className="text-sm text-[#5c5650] mb-5">Calculated from live Instagram data. Updated automatically after each completed deal.</p>
          <div className="space-y-3">
            {BREAKDOWN_META.map(({ label, max, key }) => (
              <div key={key} className="border border-[#0a0a0a]/20 p-3">
                <div className="flex justify-between mono text-[9px] uppercase tracking-widest mb-1">
                  <span className="font-bold text-[#0a0a0a]">{label}</span>
                  <span className="text-[#e63946]">{max} pts</span>
                </div>
                <div className="text-xs text-[#5c5650]">{BREAKDOWN_DESC[key]}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0a0a] text-[#efe8d8] px-3 py-2 mono text-[9px] uppercase tracking-widest">
      <div className="mb-0.5">{label}</div>
      <div>Likes: <span className="text-[#e63946] font-bold">{payload[0]?.value?.toLocaleString("en-IN")}</span></div>
      {payload[1] && <div>Comments: <span className="font-bold">{payload[1]?.value?.toLocaleString("en-IN")}</span></div>}
    </div>
  );
};

function CreatorInsights({ creator }) {
  const [showInfo, setShowInfo] = useState(false);
  const stats = creator?.instagram_stats;
  const breakdown = creator?.trust_breakdown;
  const tier = TIER_STYLE[creator?.trust_tier] || TIER_STYLE.unverified;
  const hasScore = creator?.trust_score > 0 || !!breakdown;
  const chart = stats?.posts_chart || [];

  if (!stats && !hasScore) {
    return (
      <div className="border border-[#0a0a0a] px-6 py-8 text-center mb-4">
        <div className="mono text-[9px] uppercase tracking-[0.4em] text-[#5c5650] mb-2">Creator Insights</div>
        <div className="text-sm text-[#5c5650]">This creator hasn't connected their Instagram yet.</div>
      </div>
    );
  }

  return (
    <>
      {showInfo && <ScoreInfoModal onClose={() => setShowInfo(false)} />}
      <div className="border border-[#0a0a0a] mb-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#0a0a0a] bg-[#0a0a0a] text-[#efe8d8]">
          <div>
            <div className="mono text-[9px] uppercase tracking-[0.4em] text-[#efe8d8]/50 mb-0.5">Creator Insights</div>
            <div className="display text-xl font-black">Instagram Analytics</div>
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

        <div className="p-6 space-y-6">
          {/* Basic stats */}
          {stats && (
            <div>
              <div className="mono text-[9px] uppercase tracking-[0.3em] text-[#5c5650] mb-3">Profile</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  ["Followers",   stats.followers != null ? Number(stats.followers).toLocaleString("en-IN") : "—"],
                  ["Following",   stats.following != null ? Number(stats.following).toLocaleString("en-IN") : "—"],
                  ["Total Posts", stats.posts_count != null ? Number(stats.posts_count).toLocaleString("en-IN") : "—"],
                  ["Verified",    stats.verified ? "✓ Yes" : "No"],
                ].map(([label, value]) => (
                  <div key={label} className="border border-[#0a0a0a] px-4 py-3">
                    <div className="mono text-[8px] uppercase tracking-widest text-[#5c5650] mb-1">{label}</div>
                    <div className="font-black text-lg">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Engagement stats */}
          {hasScore && stats && (
            <div>
              <div className="mono text-[9px] uppercase tracking-[0.3em] text-[#5c5650] mb-3">Engagement</div>
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
            </div>
          )}

          {/* Trust score + breakdown */}
          {hasScore && (
            <div className="flex items-center gap-5 border border-[#0a0a0a] p-5">
              <TrustRing score={creator?.trust_score || 0} size={72} stroke={5} />
              <div className="flex-1 min-w-0">
                <div className="mono text-[9px] uppercase tracking-[0.3em] text-[#5c5650] mb-1">Trust Score</div>
                <div className="display text-4xl font-black">{creator.trust_score}<span className="text-lg font-normal text-[#5c5650]">/100</span></div>
              </div>
            </div>
          )}

          {/* Breakdown bars */}
          {breakdown && (
            <div>
              <div className="mono text-[9px] uppercase tracking-[0.3em] text-[#5c5650] mb-3">Score Breakdown</div>
              <div className="space-y-2.5">
                {BREAKDOWN_META.map(({ key, label, max }) => {
                  const val = breakdown[key] || 0;
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
                          animate={{ width: `${(val / max) * 100}%` }}
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
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={chart} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 8, fontFamily: "monospace", fill: "#5c5650" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 8, fontFamily: "monospace", fill: "#5c5650" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "#0a0a0a0d" }} />
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
        </div>
      </div>
    </>
  );
}
