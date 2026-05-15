import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Loader2, Users, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getCampaign, getApplications, applyToCampaign, reviewApplication } from "../lib/api";
import { getUser } from "../lib/auth";
import { formatINR } from "../lib/format";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();

  const [campaign, setCampaign] = useState(null);
  const [applications, setApplications] = useState([]);
  const [myApplication, setMyApplication] = useState(null);
  const [pitch, setPitch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);

  useEffect(() => {
    load();
  }, [id]); // eslint-disable-line

  async function load() {
    setLoading(true);
    try {
      const c = await getCampaign(id);
      setCampaign(c);
      if (user?.role === "brand" && user.id === c.brand_id) {
        const apps = await getApplications({ campaign_id: id });
        setApplications(apps);
      } else if (user?.role === "creator") {
        const myApps = await getApplications({ creator_id: user.id, campaign_id: id });
        if (myApps.length) setMyApplication(myApps[0]);
      }
    } catch {
      toast.error("Campaign not found");
    } finally {
      setLoading(false);
    }
  }

  const onApply = async () => {
    if (!user) { navigate("/auth?role=creator"); return; }
    setSubmitting(true);
    try {
      const app = await applyToCampaign({ campaign_id: id, pitch_note: pitch });
      setMyApplication(app);
      toast.success("Application sent!");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to apply");
    } finally {
      setSubmitting(false);
    }
  };

  const onReview = async (applicationId, action) => {
    setReviewingId(applicationId);
    try {
      const result = await reviewApplication(applicationId, action);
      setApplications((prev) => prev.map((a) => a.id === applicationId ? result.application : a));
      if (action === "accept" && result.deal_room) {
        toast.success("Creator accepted! Deal room created.");
        navigate(`/deal-room/${result.deal_room.id}`);
      } else {
        toast.success("Application declined");
      }
    } catch {
      toast.error("Failed to update application");
    } finally {
      setReviewingId(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#efe8d8] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#e63946]" size={32} />
    </div>
  );

  if (!campaign) return null;

  const isBrand = user?.role === "brand" && user.id === campaign.brand_id;
  const isCreator = user?.role === "creator";

  return (
    <div className="min-h-screen bg-[#efe8d8] text-[#0a0a0a]">
      <Navbar />
      <section className="max-w-4xl mx-auto px-5 md:px-10 py-10 pb-32">
        <Link to={isBrand ? "/dashboard/brand" : "/campaigns"} className="inline-flex items-center gap-2 mono text-[10px] uppercase tracking-widest text-[#5c5650] hover:text-[#0a0a0a] mb-8">
          <ArrowLeft size={12} /> Back
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-2">{campaign.brand_name} · {campaign.platform}</div>
            <h1 className="display text-5xl md:text-6xl font-black leading-[0.9]">{campaign.name}</h1>
          </div>
          <div className="text-right">
            <div className="display text-3xl font-black text-[#e63946]">{formatINR(campaign.budget_min)}–{formatINR(campaign.budget_max)}</div>
            <div className="mono text-[9px] uppercase tracking-widest text-[#5c5650] mt-1">{campaign.target_niche} · {campaign.deliverables}</div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-4 flex-wrap mb-8 text-sm">
          <div className="flex items-center gap-1.5 mono text-[10px] uppercase tracking-widest text-[#5c5650]">
            <Calendar size={12} /> Apply by {new Date(campaign.application_deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </div>
          <div className="flex items-center gap-1.5 mono text-[10px] uppercase tracking-widest text-[#5c5650]">
            <CheckCircle2 size={12} /> Content due {new Date(campaign.content_deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </div>
          <div className="flex items-center gap-1.5 mono text-[10px] uppercase tracking-widest text-[#5c5650]">
            <Users size={12} /> {campaign.applicant_count || 0} applicants
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_320px] gap-8">
          <div className="space-y-8">
            {/* Description */}
            <Section title="About this campaign">
              <p className="text-sm leading-relaxed text-[#0a0a0a]/80">{campaign.description}</p>
            </Section>

            {/* Concept cards */}
            {campaign.concepts?.length > 0 && (
              <Section title="Content concepts">
                <div className="space-y-3">
                  {campaign.concepts.map((c, i) => (
                    <div key={i} className="border border-[#0a0a0a] p-4">
                      <div className="mono text-[9px] uppercase tracking-widest text-[#e63946] mb-1">Concept {i + 1}</div>
                      {c.title && <div className="font-bold text-sm mb-1">{c.title}</div>}
                      {c.description && <p className="text-sm text-[#0a0a0a]/80">{c.description}</p>}
                      {c.reference && <a href={c.reference} target="_blank" rel="noreferrer" className="mono text-[9px] uppercase tracking-widest text-[#e63946] underline mt-2 inline-block">Reference →</a>}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Requirements */}
            {campaign.requirements && (
              <Section title="Requirements & guidelines">
                <p className="text-sm leading-relaxed text-[#0a0a0a]/80 whitespace-pre-line">{campaign.requirements}</p>
              </Section>
            )}

            {/* Brand view: applicants */}
            {isBrand && (
              <Section title={`Applicants (${applications.length})`}>
                {applications.length === 0 ? (
                  <p className="text-sm text-[#5c5650]">No applications yet.</p>
                ) : (
                  <div className="space-y-3">
                    {applications.map((a) => (
                      <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border border-[#0a0a0a] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-bold text-sm">{a.creator_name}</div>
                            <div className="mono text-[9px] uppercase tracking-widest text-[#5c5650]">{a.creator_instagram} · {a.creator_niche}</div>
                            <p className="text-sm text-[#0a0a0a]/80 mt-2">{a.pitch_note}</p>
                          </div>
                          {a.status === "pending" ? (
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => onReview(a.id, "accept")}
                                disabled={reviewingId === a.id}
                                className="px-3 py-1.5 bg-[#0a0a0a] text-[#efe8d8] mono text-[9px] uppercase tracking-widest hover:bg-[#e63946] disabled:opacity-50 transition"
                              >
                                {reviewingId === a.id ? "…" : "Accept"}
                              </button>
                              <button
                                onClick={() => onReview(a.id, "decline")}
                                disabled={reviewingId === a.id}
                                className="px-3 py-1.5 border border-[#0a0a0a] mono text-[9px] uppercase tracking-widest hover:bg-[#0a0a0a]/5 disabled:opacity-50 transition"
                              >
                                Decline
                              </button>
                            </div>
                          ) : (
                            <span className={`mono text-[9px] uppercase tracking-widest px-2 py-1 ${a.status === "accepted" ? "bg-[#0a0a0a] text-[#efe8d8]" : "bg-[#7a7466]/20 text-[#5c5650]"}`}>
                              {a.status}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Section>
            )}
          </div>

          {/* Sidebar: apply / status */}
          <aside className="h-fit">
            {isCreator && (
              <div className="border border-[#0a0a0a] p-5">
                {myApplication ? (
                  <div>
                    <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-2">Your application</div>
                    <div className={`mono text-[10px] uppercase tracking-widest px-3 py-2 text-center ${myApplication.status === "accepted" ? "bg-[#0a0a0a] text-[#efe8d8]" : myApplication.status === "declined" ? "bg-[#e63946]/10 text-[#e63946]" : "bg-[#7a7466]/10 text-[#5c5650]"}`}>
                      {myApplication.status === "pending" ? "Under review" : myApplication.status}
                    </div>
                    <p className="text-xs text-[#5c5650] mt-3">"{myApplication.pitch_note}"</p>
                  </div>
                ) : (
                  <div>
                    <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-3">Apply to this campaign</div>
                    <textarea
                      value={pitch}
                      onChange={(e) => setPitch(e.target.value)}
                      placeholder="Optional: tell the brand why you're a great fit…"
                      rows={4}
                      className="w-full bg-transparent border border-[#0a0a0a] px-3 py-3 text-sm focus:outline-none focus:bg-[#e8e0cd] resize-none mb-3"
                    />
                    <button
                      onClick={onApply}
                      disabled={submitting}
                      className="w-full px-4 py-3 bg-[#0a0a0a] text-[#efe8d8] mono text-[10px] uppercase tracking-widest hover:bg-[#e63946] disabled:opacity-50 transition"
                    >
                      {submitting ? <Loader2 size={12} className="animate-spin mx-auto" /> : "Submit application →"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {!user && (
              <div className="border border-[#0a0a0a] p-5 text-center">
                <p className="text-sm text-[#5c5650] mb-3">Sign in as a creator to apply.</p>
                <Link to="/auth?role=creator" className="block w-full px-4 py-3 bg-[#0a0a0a] text-[#efe8d8] mono text-[10px] uppercase tracking-widest hover:bg-[#e63946] transition text-center">
                  Join as Creator →
                </Link>
              </div>
            )}
          </aside>
        </div>
      </section>
      <Footer />
      <BottomNav />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-3">{title}</div>
      {children}
    </div>
  );
}
