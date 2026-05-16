import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, TrendingUp, Inbox, CheckCircle2, Star, Camera, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";
import TrustRing from "../components/common/TrustRing";
import { getDeals, updateDeal, getCreator, getCampaigns, getDealRooms, deleteAccount, uploadAvatar } from "../lib/api";
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
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-3">Creator Studio</div>
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
            <div className="border border-[#0a0a0a] px-6 py-8 text-center">
              <div className="mono text-[9px] uppercase tracking-[0.4em] text-[#5c5650] mb-3">Creator Insights</div>
              <div className="display text-4xl md:text-5xl font-black text-[#e63946]">Coming soon.</div>
              <p className="text-sm text-[#5c5650] mt-3">Follower counts, engagement rates & content analytics</p>
            </div>
          </div>
        )}
      </section>

      {/* Tabs */}
      <section className="max-w-7xl mx-auto px-5 md:px-10 mb-6">
        <div className="flex gap-0 border border-[#0a0a0a] w-fit">
          {[["deals", "My Deals"], ["campaigns", "Find Campaigns"], ["deal-rooms", "Deal Rooms"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-5 py-2.5 mono text-[10px] uppercase tracking-widest ${tab === key ? "bg-[#0a0a0a] text-[#efe8d8]" : "hover:bg-[#e8e0cd]"}`}>
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 md:px-10 pb-32">
        {tab === "campaigns" ? (
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

      <DeleteZone />
      <Footer />
      <BottomNav />
    </div>
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
