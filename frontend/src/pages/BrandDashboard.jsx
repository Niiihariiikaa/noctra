import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";
import { getDeals, updateDeal, getBrands, razorpayConfig, createOrder, verifyPayment, getCampaigns, getDealRooms, deleteAccount } from "../lib/api";
import { getUser, signOut } from "../lib/auth";
import { formatINR } from "../lib/format";

const COLUMNS = [
  { key: "Requested",  color: "bg-[#efe8d8]" },
  { key: "Negotiating", color: "bg-[#f4c542]" },
  { key: "Confirmed",  color: "bg-[#e63946] text-[#efe8d8]" },
  { key: "Live",       color: "bg-[#0a0a0a] text-[#efe8d8]" },
  { key: "Completed",  color: "bg-[#e8e0cd]" },
  { key: "Rejected",   color: "bg-[#7a7466] text-[#efe8d8]" },
];

// Brand acts on: Negotiating → Confirmed (with payment), Live → Completed
const BRAND_NEXT = { Negotiating: "Confirmed", Live: "Completed" };

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function BrandDashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const [tab, setTab] = useState("pipeline");
  const [deals, setDeals] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [dealRooms, setDealRooms] = useState([]);
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);

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
      const [allBrands, ds, cs, drs] = await Promise.all([
        getBrands(),
        getDeals({ brand_id: user.id }),
        getCampaigns({ brand_id: user.id }),
        getDealRooms(),
      ]);
      setBrand(allBrands.find((b) => b.user_id === user.id) || null);
      setDeals(ds);
      setCampaigns(cs);
      setDealRooms(drs);
    } finally {
      setLoading(false);
    }
  }

  const grouped = useMemo(() => {
    const g = Object.fromEntries(COLUMNS.map((c) => [c.key, []]));
    deals.forEach((d) => { if (g[d.status]) g[d.status].push(d); });
    return g;
  }, [deals]);

  const stats = useMemo(() => ({
    total: deals.filter((d) => d.status !== "Rejected").length,
    active: deals.filter((d) => ["Confirmed", "Live"].includes(d.status)).length,
    spent: deals.filter((d) => ["Confirmed", "Live", "Completed"].includes(d.status)).reduce((s, d) => s + d.amount, 0),
  }), [deals]);

  const handleAdvance = async (deal) => {
    if (deal.status === "Negotiating") {
      await handlePayment(deal);
    } else {
      const next = BRAND_NEXT[deal.status];
      if (!next) return;
      try {
        const updated = await updateDeal(deal.id, { status: next });
        setDeals((ds) => ds.map((d) => (d.id === deal.id ? updated : d)));
        toast.success(`Moved to ${next}`);
      } catch {
        toast.error("Failed to update");
      }
    }
  };

  const handlePayment = async (deal) => {
    setPaying(deal.id);
    try {
      const cfg = await razorpayConfig().catch(() => ({ enabled: false }));

      if (!cfg.enabled) {
        // Mock mode — no real payment
        const order = await createOrder({ amount: deal.amount * 100, deal_id: deal.id });
        await verifyPayment({
          razorpay_order_id: order.order_id,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: "mock",
          deal_id: deal.id,
        });
        toast.success("Deal confirmed (demo mode — add Razorpay keys for live payments)");
        refresh();
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) { toast.error("Payment gateway unavailable"); return; }

      const order = await createOrder({ amount: deal.amount * 100, deal_id: deal.id });
      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Noctra",
        description: `Deal with ${deal.creator_name}`,
        order_id: order.order_id,
        prefill: { email: user.email, name: user.name },
        theme: { color: "#e63946" },
        handler: async (resp) => {
          try {
            await verifyPayment({ ...resp, deal_id: deal.id });
            toast.success("Payment successful · Deal confirmed & funds in escrow");
            refresh();
          } catch {
            toast.error("Payment verification failed");
          }
        },
      });
      rzp.open();
    } catch {
      toast.error("Payment failed");
    } finally {
      setPaying(null);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#efe8d8] text-[#0a0a0a]" data-testid="brand-dashboard">
      <Navbar />

      <section className="max-w-7xl mx-auto px-5 md:px-10 pt-8 md:pt-12 pb-8">
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-3">Brand Studio · {brand?.name || "—"}</div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="display text-5xl md:text-7xl font-black leading-[0.9]">
            Your<br/><span className="italic text-[#e63946]">pipeline</span>.
          </h1>
          <Link
            to="/campaigns/new"
            className="inline-flex items-center gap-2 px-5 py-3.5 bg-[#0a0a0a] text-[#efe8d8] font-bold uppercase tracking-widest text-xs hover:bg-[#e63946] min-h-[44px]"
          >
            <Plus size={14} /> New campaign
          </Link>
        </div>

        <div className="grid grid-cols-3 border-t border-l border-[#0a0a0a] mt-8" data-testid="brand-stats">
          <Stat label="Total deals" value={stats.total} />
          <Stat label="Active" value={stats.active} accent />
          <Stat label="Committed spend" value={formatINR(stats.spent)} />
        </div>
      </section>

      {/* Tabs */}
      <section className="max-w-7xl mx-auto px-5 md:px-10 mb-6">
        <div className="flex gap-0 border border-[#0a0a0a] w-fit">
          {[["pipeline", "Deal Pipeline"], ["campaigns", "Campaigns"], ["deal-rooms", "Deal Rooms"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-5 py-2.5 mono text-[10px] uppercase tracking-widest ${tab === key ? "bg-[#0a0a0a] text-[#efe8d8]" : "hover:bg-[#e8e0cd]"}`}>
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-[1800px] mx-auto px-5 md:px-10 pb-32">
        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin text-[#e63946]" /></div>
        ) : tab === "campaigns" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.length === 0 ? (
              <div className="col-span-3 border border-dashed border-[#0a0a0a] py-16 text-center">
                <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-2">No campaigns yet</div>
                <Link to="/campaigns/new" className="display text-3xl font-black underline">Create your first campaign →</Link>
              </div>
            ) : campaigns.map((c) => {
              const isNew = c.created_at && (Date.now() - new Date(c.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000;
              return (
                <Link key={c.id} to={`/campaigns/${c.id}`} className="border border-[#0a0a0a] p-5 hover:shadow-[4px_4px_0_0_#0a0a0a] transition-shadow block relative">
                  {isNew && (
                    <span className="absolute top-3 right-3 bg-[#e63946] text-[#efe8d8] mono text-[8px] uppercase tracking-widest px-2 py-0.5">New</span>
                  )}
                  <div className="mono text-[9px] uppercase tracking-widest text-[#e63946] mb-2">{c.target_niche} · {c.platform}</div>
                  <div className="display text-2xl font-black mb-1">{c.name}</div>
                  <div className="text-sm text-[#5c5650] mb-4 line-clamp-2">{c.description}</div>
                  <div className="flex items-center justify-between mono text-[9px] uppercase tracking-widest text-[#5c5650]">
                    <span>{c.applicant_count || 0} applicants</span>
                    <span>{formatINR(c.budget_min)}–{formatINR(c.budget_max)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : tab === "deal-rooms" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dealRooms.length === 0 ? (
              <div className="col-span-3 border border-dashed border-[#0a0a0a] py-16 text-center">
                <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#5c5650]">No deal rooms yet — accept an applicant from a campaign to create one.</div>
              </div>
            ) : dealRooms.map((r) => (
              <Link key={r.id} to={`/deal-room/${r.id}`} className="border border-[#0a0a0a] p-5 hover:shadow-[4px_4px_0_0_#0a0a0a] transition-shadow">
                <div className="mono text-[9px] uppercase tracking-widest text-[#e63946] mb-2">{r.status}</div>
                <div className="display text-xl font-black mb-1">{r.campaign_name}</div>
                <div className="mono text-[10px] uppercase tracking-widest text-[#5c5650]">with {r.creator_name}</div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3" data-testid="kanban">
            {COLUMNS.map((col) => (
              <div key={col.key} className="border border-[#0a0a0a] flex flex-col min-h-[400px]">
                <div className={`${col.color} px-4 py-3 border-b border-[#0a0a0a] flex items-center justify-between`}>
                  <span className="mono text-[10px] uppercase tracking-[0.25em] font-bold">{col.key}</span>
                  <span className="mono text-[10px]">{grouped[col.key]?.length || 0}</span>
                </div>
                <div className="flex-1 p-3 space-y-3 bg-[#efe8d8]">
                  {grouped[col.key]?.length === 0 ? (
                    <div className="text-[#5c5650] text-xs mono uppercase tracking-widest text-center py-8">Empty</div>
                  ) : (
                    grouped[col.key].map((d) => (
                      <DealCard
                        key={d.id}
                        deal={d}
                        hasAction={!!BRAND_NEXT[d.status]}
                        actionLabel={d.status === "Negotiating" ? "Confirm & Pay" : "Mark done"}
                        onAction={() => handleAdvance(d)}
                        paying={paying === d.id}
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
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

function Stat({ label, value, accent }) {
  return (
    <div className={`border-r border-b border-[#0a0a0a] p-5 ${accent ? "bg-[#0a0a0a] text-[#efe8d8]" : ""}`}>
      <div className={`mono text-[10px] uppercase tracking-[0.3em] mb-1 ${accent ? "text-[#efe8d8]/85" : "text-[#5c5650]"}`}>{label}</div>
      <div className="display text-3xl md:text-4xl font-black">{value}</div>
    </div>
  );
}

function DealCard({ deal, hasAction, actionLabel, onAction, paying }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="border border-[#0a0a0a] bg-[#efe8d8] p-3 hover:shadow-[3px_3px_0_0_#0a0a0a]"
      data-testid={`deal-${deal.id}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <img src={deal.creator_avatar} alt="" className="w-8 h-8 rounded-full border border-[#0a0a0a] object-cover" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-xs truncate">{deal.creator_name}</div>
          <div className="mono text-[9px] uppercase tracking-widest text-[#5c5650] truncate">{deal.deliverable}</div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#0a0a0a]/25">
        <span className="display text-base font-black text-[#e63946]">{formatINR(deal.amount)}</span>
        {hasAction && (
          <button
            onClick={onAction}
            disabled={paying}
            className="mono text-[9px] uppercase tracking-widest border border-[#0a0a0a] px-2 py-1 hover:bg-[#0a0a0a] hover:text-[#efe8d8] transition disabled:opacity-50"
            data-testid={`action-${deal.id}`}
          >
            {paying ? "…" : <>{actionLabel} <ArrowUpRight size={8} className="inline" /></>}
          </button>
        )}
      </div>
      {deal.status === "Requested" && (
        <div className="mono text-[9px] uppercase tracking-widest text-[#5c5650] mt-2">⏳ Awaiting creator</div>
      )}
      {deal.status === "Confirmed" && (
        <div className="mono text-[9px] uppercase tracking-widest text-[#5c5650] mt-2">⏳ Creator going live</div>
      )}
      {deal.escrow && (
        <div className="mono text-[9px] uppercase tracking-widest text-[#e63946] mt-2">◉ Escrow held</div>
      )}
    </motion.div>
  );
}
