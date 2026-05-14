import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, MapPin, Star, Instagram, Heart, MessageCircle, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";
import TrustRing from "../components/common/TrustRing";
import { getCreator, getBrands, createDeal } from "../lib/api";
import { getAvatar } from "../lib/avatar";
import { getUser } from "../lib/auth";
import { formatINR, formatFollowers, trustBadge } from "../lib/format";

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
            <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#efe8d8]/80 mb-2">{creator.niche} · {creator.city}</div>
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
          <div className="flex items-center gap-3 flex-wrap mb-6">
            <img
              src={getAvatar(creator)}
              alt=""
              className="w-16 h-16 rounded-full object-cover border border-[#0a0a0a] bg-[#e8e0cd]"
            />
            <div className="flex-1">
              <a href={`https://instagram.com/${creator.instagram_handle?.replace("@", "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mono text-xs hover:text-[#e63946]">
                <Instagram size={12} /> {creator.instagram_handle}
              </a>
              <p className="text-[#0a0a0a]/80 mt-1 text-sm md:text-base">{creator.bio}</p>
            </div>
            <span className="px-2.5 py-1 mono text-[9px] uppercase tracking-widest border border-[#0a0a0a] bg-[#0a0a0a] text-[#efe8d8]">{badge.label}</span>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 border-t border-l border-[#0a0a0a]">
            <Stat label="Followers" value={formatFollowers(creator.followers)} />
            <Stat label="Engagement" value={`${creator.engagement_rate}%`} />
            <Stat label="Avg Likes" value={formatFollowers(creator.avg_likes)} />
            <Stat label="Avg Comments" value={formatFollowers(creator.avg_comments || 0)} />
          </div>

          {/* Portfolio */}
          {creator.portfolio?.length > 0 && (
            <div className="mt-10">
              <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-4">
                {creator.instagram_verified ? "Recent Content" : "Portfolio"}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {creator.portfolio.map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04 }}
                    data-testid={`portfolio-${i}`}
                  >
                    {p.type ? (
                      /* Instagram-synced item — stats card */
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block border border-[#0a0a0a] group hover:shadow-[4px_4px_0_0_#0a0a0a] transition-shadow"
                      >
                        <div className={`aspect-square flex flex-col items-center justify-center gap-3 ${p.type === "reel" ? "bg-[#0a0a0a]" : "bg-[#e8e0cd]"}`}>
                          {p.type === "reel" && <Play size={28} className="text-[#efe8d8] opacity-60" />}
                          <div className={`flex items-center gap-4 mono text-xs font-bold ${p.type === "reel" ? "text-[#efe8d8]" : "text-[#0a0a0a]"}`}>
                            <span className="flex items-center gap-1"><Heart size={12} /> {p.likes?.toLocaleString()}</span>
                            <span className="flex items-center gap-1"><MessageCircle size={12} /> {p.comments?.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="px-3 py-2 border-t border-[#0a0a0a] text-xs flex items-center justify-between gap-2">
                          <span className="mono text-[9px] uppercase tracking-widest text-[#7a7466]">{p.type}</span>
                          <span className="text-[#0a0a0a]/60 truncate text-right">{p.caption?.slice(0, 40) || "View post"}</span>
                        </div>
                      </a>
                    ) : (
                      /* Manually added item — image card */
                      <div className="border border-[#0a0a0a] overflow-hidden group">
                        <div className="aspect-square overflow-hidden">
                          <img src={p.thumb} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                        </div>
                        <div className="px-3 py-2 border-t border-[#0a0a0a] text-xs flex justify-between">
                          <span className="font-medium truncate">{p.campaign}</span>
                          <span className="text-[#7a7466] truncate ml-2">{p.brand}</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

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
              {!creator.reviews?.length && <p className="text-[#7a7466] text-sm">No reviews yet.</p>}
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
            <p className="mono text-[9px] uppercase tracking-widest text-[#7a7466] text-center">Deals tracked end-to-end on Noctra</p>
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
            <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-2">§ Book a deal</div>
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
      <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#7a7466] mb-1">{label}</div>
      <div className="display text-3xl md:text-4xl font-black">{value}</div>
    </div>
  );
}
