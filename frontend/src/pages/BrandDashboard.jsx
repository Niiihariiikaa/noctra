import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Plus, Loader2, Pencil, Globe, Instagram, Mail } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";
import { getDeals, updateDeal, getBrands, razorpayConfig, createOrder, verifyPayment, getCampaigns, getDealRooms, deleteAccount, updateBrandProfile, changePassword } from "../lib/api";
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
        <div className="mb-3">
          <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946]">Brand Studio · {brand?.name || "—"}</div>
        </div>
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

        {/* Brand identity card */}
        {brand && (
          <div className="mt-8 border border-[#0a0a0a] flex flex-wrap items-center gap-0 divide-x divide-[#0a0a0a]">
            {/* Logo */}
            <div className="flex items-center gap-4 px-6 py-5 min-w-[180px]">
              <div
                className="w-12 h-12 flex items-center justify-center text-[#efe8d8] text-xl font-black shrink-0"
                style={{ background: brand.logo_color || "#0a0a0a" }}
              >
                {brand.logo_initial || brand.name?.[0] || "B"}
              </div>
              <div>
                <div className="font-black text-base leading-tight">{brand.name}</div>
                {brand.industry && <div className="mono text-[9px] uppercase tracking-widest text-[#5c5650] mt-0.5">{brand.industry}</div>}
              </div>
            </div>
            {/* Email */}
            <div className="flex items-center gap-2.5 px-6 py-5">
              <Mail size={14} className="text-[#e63946] shrink-0" />
              <div>
                <div className="mono text-[9px] uppercase tracking-widest text-[#5c5650] mb-0.5">Email</div>
                <div className="text-sm font-medium">{user.email}</div>
              </div>
            </div>
            {/* Instagram */}
            {brand.instagram && (
              <a
                href={`https://www.instagram.com/${brand.instagram.replace("@", "")}/`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-2.5 px-6 py-5 hover:bg-[#0a0a0a] hover:text-[#efe8d8] transition-colors group"
              >
                <Instagram size={14} className="text-[#e63946] group-hover:text-[#efe8d8] shrink-0" />
                <div>
                  <div className="mono text-[9px] uppercase tracking-widest text-[#5c5650] group-hover:text-[#efe8d8]/50 mb-0.5">Instagram</div>
                  <div className="text-sm font-medium">@{brand.instagram.replace("@", "")}</div>
                </div>
              </a>
            )}
            {/* Website */}
            {brand.website && (
              <a
                href={brand.website.startsWith("http") ? brand.website : `https://${brand.website}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-2.5 px-6 py-5 hover:bg-[#0a0a0a] hover:text-[#efe8d8] transition-colors group"
              >
                <Globe size={14} className="text-[#e63946] group-hover:text-[#efe8d8] shrink-0" />
                <div>
                  <div className="mono text-[9px] uppercase tracking-widest text-[#5c5650] group-hover:text-[#efe8d8]/50 mb-0.5">Website</div>
                  <div className="text-sm font-medium truncate max-w-[140px]">{brand.website.replace(/^https?:\/\//, "")}</div>
                </div>
              </a>
            )}
            {/* Instagram — show connect prompt if not set */}
            {!brand.instagram && (
              <button
                onClick={() => setTab("profile")}
                className="flex items-center gap-2.5 px-6 py-5 text-[#5c5650] hover:text-[#0a0a0a] hover:bg-[#e8e0cd] transition-colors border-r border-[#0a0a0a] group"
              >
                <Instagram size={14} className="text-[#e63946] shrink-0" />
                <div className="text-left">
                  <div className="mono text-[9px] uppercase tracking-widest text-[#5c5650] group-hover:text-[#0a0a0a] mb-0.5">Instagram</div>
                  <div className="mono text-[9px] uppercase tracking-widest text-[#e63946]">Connect →</div>
                </div>
              </button>
            )}
            {/* Website — show prompt if not set */}
            {!brand.website && (
              <button
                onClick={() => setTab("profile")}
                className="flex items-center gap-2.5 px-6 py-5 text-[#5c5650] hover:text-[#0a0a0a] hover:bg-[#e8e0cd] transition-colors group"
              >
                <Globe size={14} className="text-[#e63946] shrink-0" />
                <div className="text-left">
                  <div className="mono text-[9px] uppercase tracking-widest text-[#5c5650] group-hover:text-[#0a0a0a] mb-0.5">Website</div>
                  <div className="mono text-[9px] uppercase tracking-widest text-[#e63946]">Add →</div>
                </div>
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 border-t border-l border-[#0a0a0a] mt-6" data-testid="brand-stats">
          <Stat label="Total deals" value={stats.total} />
          <Stat label="Active" value={stats.active} accent />
          <Stat label="Committed spend" value={formatINR(stats.spent)} />
        </div>
      </section>

      {/* Tabs */}
      <section className="max-w-7xl mx-auto px-5 md:px-10 mb-6">
        <div className="flex gap-0 border border-[#0a0a0a] w-fit flex-wrap">
          {[["pipeline", "Deal Pipeline"], ["campaigns", "Campaigns"], ["deal-rooms", "Deal Rooms"], ["insights", "Insights"], ["profile", "Edit Profile"]].map(([key, label]) => (
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
        ) : tab === "insights" ? (
          <BrandInsights deals={deals} campaigns={campaigns} dealRooms={dealRooms} brand={brand} />
        ) : tab === "profile" ? (
          <BrandProfileEditor brand={brand} onUpdated={setBrand} />
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

      <ChangePasswordSection />
      <DeleteZone />
      <Footer />
      <BottomNav />
    </div>
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

const DEAL_COLORS = {
  Requested: "#e8e0cd", Negotiating: "#f4c542", Confirmed: "#e63946",
  Live: "#0a0a0a", Completed: "#5c5650", Rejected: "#c8bfb0",
};

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0a0a] text-[#efe8d8] px-3 py-2 mono text-[9px] uppercase tracking-widest">
      <div className="mb-0.5">{label || payload[0]?.name}</div>
      <div className="text-[#e63946] font-bold">{payload[0]?.value}</div>
    </div>
  );
};

function BrandInsights({ deals, campaigns, dealRooms, brand }) {
  const igStats = brand?.instagram_stats;
  const dealsByStatus = Object.entries(
    deals.reduce((acc, d) => { acc[d.status] = (acc[d.status] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const spendByCreator = Object.values(
    deals
      .filter((d) => ["Confirmed", "Live", "Completed"].includes(d.status))
      .reduce((acc, d) => {
        if (!acc[d.creator_name]) acc[d.creator_name] = { name: d.creator_name, spend: 0, deals: 0 };
        acc[d.creator_name].spend += d.amount;
        acc[d.creator_name].deals += 1;
        return acc;
      }, {})
  ).sort((a, b) => b.spend - a.spend).slice(0, 6);

  const campaignApplicants = campaigns
    .map((c) => ({ name: c.name.length > 18 ? c.name.slice(0, 18) + "…" : c.name, applicants: c.applicant_count || 0 }))
    .sort((a, b) => b.applicants - a.applicants)
    .slice(0, 6);

  const totalSpent = deals.filter((d) => ["Confirmed", "Live", "Completed"].includes(d.status)).reduce((s, d) => s + d.amount, 0);
  const completed = deals.filter((d) => d.status === "Completed").length;
  const convRate = deals.length ? Math.round((completed / deals.length) * 100) : 0;
  const totalApplicants = campaigns.reduce((s, c) => s + (c.applicant_count || 0), 0);

  if (!deals.length && !campaigns.length) {
    return (
      <div className="border border-dashed border-[#0a0a0a] py-24 text-center max-w-2xl">
        <div className="mono text-[9px] uppercase tracking-[0.4em] text-[#5c5650] mb-2">Insights</div>
        <div className="display text-3xl font-black text-[#e63946]">No data yet.</div>
        <p className="text-sm text-[#5c5650] mt-2">Create campaigns and book creators to see analytics here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-l border-[#0a0a0a]">
        {[
          ["Total spend", `₹${(totalSpent / 1000).toFixed(1)}K`],
          ["Deals completed", completed],
          ["Conversion rate", `${convRate}%`],
          ["Total applicants", totalApplicants],
        ].map(([label, value]) => (
          <div key={label} className="border-r border-b border-[#0a0a0a] p-5">
            <div className="mono text-[9px] uppercase tracking-[0.3em] text-[#5c5650] mb-1">{label}</div>
            <div className="display text-3xl font-black">{value}</div>
          </div>
        ))}
      </div>

      {/* Instagram stats */}
      {igStats ? (
        <div className="border border-[#0a0a0a]">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-[#0a0a0a] bg-[#0a0a0a] text-[#efe8d8]">
            <Instagram size={13} className="text-[#e63946]" />
            <span className="mono text-[9px] uppercase tracking-[0.3em]">Your Instagram</span>
            {brand?.instagram && (
              <a href={`https://www.instagram.com/${brand.instagram.replace("@","")}/`} target="_blank" rel="noreferrer"
                className="ml-auto mono text-[9px] uppercase tracking-widest text-[#efe8d8]/50 hover:text-[#efe8d8] flex items-center gap-1">
                @{brand.instagram.replace("@","")} <ArrowUpRight size={10} />
              </a>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-[#0a0a0a]">
            {[
              ["Followers",   igStats.followers != null ? Number(igStats.followers).toLocaleString("en-IN") : "—"],
              ["Following",   igStats.following != null ? Number(igStats.following).toLocaleString("en-IN") : "—"],
              ["Total Posts", igStats.posts_count != null ? Number(igStats.posts_count).toLocaleString("en-IN") : "—"],
              ["Verified",    igStats.verified ? "✓ Yes" : "No"],
            ].map(([label, value]) => (
              <div key={label} className="px-5 py-4">
                <div className="mono text-[8px] uppercase tracking-widest text-[#5c5650] mb-1">{label}</div>
                <div className="font-black text-xl">{value}</div>
              </div>
            ))}
          </div>
        </div>
      ) : brand?.instagram ? (
        <div className="border border-dashed border-[#0a0a0a] px-5 py-4 flex items-center gap-3">
          <Loader2 size={14} className="animate-spin text-[#e63946] shrink-0" />
          <div>
            <div className="mono text-[9px] uppercase tracking-widest font-bold">Fetching Instagram stats…</div>
            <div className="text-xs text-[#5c5650] mt-0.5">Scraping @{brand.instagram.replace("@","")} — refresh in ~15 seconds.</div>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-[#0a0a0a] px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="mono text-[9px] uppercase tracking-widest font-bold mb-0.5">No Instagram connected</div>
            <div className="text-xs text-[#5c5650]">Go to Edit Profile → add your handle to see your Instagram stats here.</div>
          </div>
          <Instagram size={18} className="text-[#e63946] shrink-0" />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Deal pipeline breakdown */}
        {dealsByStatus.length > 0 && (
          <div className="border border-[#0a0a0a] p-5">
            <div className="mono text-[9px] uppercase tracking-[0.3em] text-[#5c5650] mb-4">Deal pipeline</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={dealsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} strokeWidth={1} stroke="#efe8d8">
                  {dealsByStatus.map((entry) => (
                    <Cell key={entry.name} fill={DEAL_COLORS[entry.name] || "#ccc"} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTip />} />
                <Legend iconSize={8} iconType="square" wrapperStyle={{ fontFamily: "monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Campaign applicants */}
        {campaignApplicants.length > 0 && (
          <div className="border border-[#0a0a0a] p-5">
            <div className="mono text-[9px] uppercase tracking-[0.3em] text-[#5c5650] mb-4">Applicants per campaign</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={campaignApplicants} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 8, fontFamily: "monospace", fill: "#5c5650" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 8, fontFamily: "monospace", fill: "#5c5650" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTip />} cursor={{ fill: "#0a0a0a0d" }} />
                <Bar dataKey="applicants" fill="#e63946" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Spend by creator */}
      {spendByCreator.length > 0 && (
        <div className="border border-[#0a0a0a] p-5">
          <div className="mono text-[9px] uppercase tracking-[0.3em] text-[#5c5650] mb-4">Spend by creator</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={spendByCreator} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 8, fontFamily: "monospace", fill: "#5c5650" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 8, fontFamily: "monospace", fill: "#5c5650" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} cursor={{ fill: "#0a0a0a0d" }} />
              <Bar dataKey="spend" fill="#0a0a0a" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Deal rooms summary */}
      {dealRooms.length > 0 && (
        <div className="border border-[#0a0a0a]">
          <div className="px-5 py-3 border-b border-[#0a0a0a] mono text-[9px] uppercase tracking-[0.3em] text-[#5c5650]">Active deal rooms</div>
          <div className="divide-y divide-[#0a0a0a]/10">
            {dealRooms.slice(0, 5).map((r) => (
              <Link key={r.id} to={`/deal-room/${r.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-[#e8e0cd] transition-colors group">
                <div>
                  <div className="font-bold text-sm">{r.campaign_name}</div>
                  <div className="mono text-[8px] uppercase tracking-widest text-[#5c5650]">with {r.creator_name}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="mono text-[8px] uppercase tracking-widest px-2 py-0.5 border border-[#0a0a0a]/30">{r.status}</span>
                  <ArrowUpRight size={13} className="text-[#e63946] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
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

function BrandProfileEditor({ brand, onUpdated }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    description: brand?.description || brand?.tagline || "",
    industry: brand?.industry || "",
    website: brand?.website || "",
    instagram: brand?.instagram || "",
    tagline: brand?.tagline || "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      const updated = await updateBrandProfile(form);
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
        <div className="display text-2xl font-black">Your brand profile.</div>
      </div>

      <BrandProfileField label="Description / Tagline">
        <textarea
          value={form.description}
          onChange={set("description")}
          rows={3}
          placeholder="What does your brand do? What are you looking for in creators?"
          className="w-full bg-transparent border-0 px-6 py-4 text-sm focus:outline-none resize-none"
        />
      </BrandProfileField>

      <BrandProfileField label="Industry">
        <input
          value={form.industry}
          onChange={set("industry")}
          placeholder="e.g. Fashion, Tech, Food, Beauty…"
          className="w-full bg-transparent border-0 px-6 py-4 text-sm focus:outline-none"
        />
      </BrandProfileField>

      <BrandProfileField label="Website">
        <input
          value={form.website}
          onChange={set("website")}
          placeholder="https://yourbrand.com"
          type="url"
          className="w-full bg-transparent border-0 px-6 py-4 text-sm focus:outline-none"
        />
      </BrandProfileField>

      <BrandProfileField label="Instagram handle">
        <div className="flex items-center">
          <span className="px-6 py-4 text-sm text-[#5c5650] border-r border-[#0a0a0a] select-none shrink-0 flex items-center gap-1.5">
            <Instagram size={13} className="text-[#e63946]" /> @
          </span>
          <input
            value={form.instagram}
            onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value.replace(/^@/, "") }))}
            placeholder="yourbrandhandle"
            className="flex-1 bg-transparent px-4 py-4 text-sm focus:outline-none"
          />
        </div>
      </BrandProfileField>

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

function BrandProfileField({ label, children }) {
  return (
    <div className="border-t border-[#0a0a0a]">
      <div className="px-6 pt-4 pb-0">
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#5c5650]">{label}</div>
      </div>
      {children}
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
