import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { getDealRoom, submitContent, reviewContent, updateDealRoomStatus } from "../lib/api";
import { getUser } from "../lib/auth";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";

const STATUS_STEPS = ["Matched", "Content Submitted", "Under Review", "Approved", "Posted", "Closed"];

export default function DealRoom() {
  const { id } = useParams();
  const user = getUser();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contentLink, setContentLink] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const [postUrl, setPostUrl] = useState("");
  const [acting, setActing] = useState(false);

  useEffect(() => { load(); }, [id]); // eslint-disable-line

  async function load() {
    setLoading(true);
    try {
      const r = await getDealRoom(id);
      setRoom(r);
      if (r.content_link) setContentLink(r.content_link);
      if (r.instagram_post_url) setPostUrl(r.instagram_post_url);
    } catch {
      toast.error("Deal room not found or access denied");
    } finally {
      setLoading(false);
    }
  }

  const act = async (fn) => { setActing(true); try { const r = await fn(); setRoom(r); } catch { toast.error("Action failed"); } finally { setActing(false); } };

  const onSubmitContent = () => {
    if (!contentLink.trim()) return toast.error("Paste a Google Drive or Frame.io link");
    act(() => submitContent(id, contentLink).then((r) => { toast.success("Content submitted!"); return r; }));
  };

  const onApprove = () => act(() => reviewContent(id, "approve").then((r) => { toast.success("Content approved!"); return r; }));

  const onRequestRevision = () => {
    if (!revisionNote.trim()) return toast.error("Explain what needs to change");
    if ((room.revision_count || 0) >= 2) return toast.error("Max revisions reached — deal flagged for admin");
    act(() => reviewContent(id, revisionNote).then((r) => { toast.success("Revision requested"); setRevisionNote(""); return r; }));
  };

  const onMarkPosted = () => {
    if (!postUrl.trim()) return toast.error("Paste the live Instagram post URL");
    act(() => updateDealRoomStatus(id, "Posted", postUrl).then((r) => { toast.success("Marked as posted!"); return r; }));
  };

  const onMarkComplete = () => act(() => updateDealRoomStatus(id, "Closed").then((r) => { toast.success("Deal marked complete. Arrange payment with creator."); return r; }));

  const onPaymentReceived = () => act(() => updateDealRoomStatus(id, "Closed").then((r) => { toast.success("Payment confirmed. Deal closed!"); return r; }));

  if (loading) return (
    <div className="min-h-screen bg-[#efe8d8] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#e63946]" size={32} />
    </div>
  );

  if (!room) return null;

  const isBrand = user?.id === room.brand_id;
  const isCreator = user?.id === room.creator_id;
  const stepIndex = STATUS_STEPS.indexOf(room.status);

  return (
    <div className="min-h-screen bg-[#efe8d8] text-[#0a0a0a]">
      <Navbar />
      <section className="max-w-4xl mx-auto px-5 md:px-10 py-10 pb-32">
        <Link to={isBrand ? "/dashboard/brand" : "/dashboard/creator"} className="inline-flex items-center gap-2 mono text-[10px] uppercase tracking-widest text-[#5c5650] hover:text-[#0a0a0a] mb-8">
          <ArrowLeft size={12} /> Back to dashboard
        </Link>

        <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-3">Deal Room</div>
        <h1 className="display text-4xl md:text-6xl font-black leading-[0.9] mb-2">{room.campaign_name}</h1>
        <div className="mono text-[10px] uppercase tracking-widest text-[#5c5650] mb-8">
          {room.brand_name} × {room.creator_name}
        </div>

        {/* Status tracker */}
        <div className="border border-[#0a0a0a] p-5 mb-8">
          <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-4">Status</div>
          <div className="flex gap-0 overflow-x-auto">
            {STATUS_STEPS.map((s, i) => (
              <div key={s} className={`flex-1 min-w-[80px] px-2 py-2 text-center mono text-[9px] uppercase tracking-widest border-r border-[#0a0a0a] last:border-r-0 transition ${i <= stepIndex ? "bg-[#0a0a0a] text-[#efe8d8]" : "text-[#5c5650]"}`}>
                {s}
              </div>
            ))}
          </div>
          {room.status === "Flagged — Admin Review" && (
            <div className="mt-3 text-sm text-[#e63946] mono uppercase tracking-widest">⚠ Flagged for admin review after 2 revisions</div>
          )}
        </div>

        <div className="grid md:grid-cols-[1fr_280px] gap-8">
          <div className="space-y-8">
            {/* Brief */}
            <Card title="Campaign brief">
              <Row label="Deliverables" value={room.deliverables} />
              <Row label="Content deadline" value={new Date(room.content_deadline).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} />
              {room.requirements && <Row label="Requirements" value={room.requirements} />}
            </Card>

            {/* Concept cards */}
            {room.concepts?.length > 0 && (
              <Card title="Content concepts">
                {room.concepts.map((c, i) => (
                  <div key={i} className="border border-[#0a0a0a]/30 p-3 mb-3 last:mb-0">
                    <div className="mono text-[9px] uppercase tracking-widest text-[#e63946] mb-1">Concept {i + 1}{c.title ? ` — ${c.title}` : ""}</div>
                    {c.description && <p className="text-sm text-[#0a0a0a]/80">{c.description}</p>}
                    {c.reference && <a href={c.reference} target="_blank" rel="noreferrer" className="mono text-[9px] uppercase tracking-widest text-[#e63946] underline mt-1 inline-flex items-center gap-1"><ExternalLink size={9} />Reference</a>}
                  </div>
                ))}
              </Card>
            )}

            {/* Revision log */}
            {room.revisions?.length > 0 && (
              <Card title={`Revision history (${room.revision_count}/2)`}>
                {room.revisions.map((r, i) => (
                  <div key={i} className="border-l-2 border-[#e63946] pl-3 mb-3 last:mb-0">
                    <div className="mono text-[9px] uppercase tracking-widest text-[#5c5650] mb-1">Revision {i + 1} · {new Date(r.at).toLocaleDateString()}</div>
                    <p className="text-sm">{r.note}</p>
                  </div>
                ))}
              </Card>
            )}

            {/* Content link */}
            {room.content_link && (
              <Card title="Submitted content">
                <a href={room.content_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-[#e63946] underline">
                  <ExternalLink size={13} /> {room.content_link}
                </a>
              </Card>
            )}

            {/* Live post */}
            {room.instagram_post_url && (
              <Card title="Live Instagram post">
                <a href={room.instagram_post_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-[#e63946] underline">
                  <ExternalLink size={13} /> {room.instagram_post_url}
                </a>
              </Card>
            )}
          </div>

          {/* Action sidebar */}
          <aside className="space-y-4">
            {/* WhatsApp */}
            {room.brand_whatsapp && (
              <div className="border border-[#0a0a0a] p-4">
                <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-3">Contact</div>
                <a
                  href={`https://wa.me/91${room.brand_whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full block text-center px-4 py-3 bg-[#25D366] text-white mono text-[10px] uppercase tracking-widest hover:brightness-110 transition"
                >
                  WhatsApp Brand →
                </a>
              </div>
            )}

            {/* Creator actions */}
            {isCreator && (
              <div className="border border-[#0a0a0a] p-4 space-y-3">
                <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946]">Your actions</div>

                {(room.status === "Matched" || room.status === "Under Review") && (
                  <>
                    <label className="mono text-[10px] uppercase tracking-[0.3em] text-[#0a0a0a]/85 block mb-1">Google Drive / Frame.io link</label>
                    <input
                      value={contentLink}
                      onChange={(e) => setContentLink(e.target.value)}
                      placeholder="https://drive.google.com/…"
                      className="w-full border border-[#0a0a0a] px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:bg-[#e8e0cd]"
                    />
                    <button onClick={onSubmitContent} disabled={acting} className={btn}>
                      {acting ? <Loader2 size={12} className="animate-spin mx-auto" /> : "Submit content →"}
                    </button>
                  </>
                )}

                {room.status === "Approved" && (
                  <>
                    <p className="text-xs text-[#5c5650]">Content approved! Post it on Instagram, then paste the live URL below.</p>
                    <input
                      value={postUrl}
                      onChange={(e) => setPostUrl(e.target.value)}
                      placeholder="https://instagram.com/p/…"
                      className="w-full border border-[#0a0a0a] px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:bg-[#e8e0cd]"
                    />
                    <button onClick={onMarkPosted} disabled={acting} className={btn}>
                      {acting ? "…" : "Mark as posted →"}
                    </button>
                  </>
                )}

                {room.status === "Closed" && (
                  <button onClick={onPaymentReceived} disabled={acting} className={btn}>
                    {acting ? "…" : "Confirm payment received →"}
                  </button>
                )}
              </div>
            )}

            {/* Brand actions */}
            {isBrand && (
              <div className="border border-[#0a0a0a] p-4 space-y-3">
                <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946]">Your actions</div>

                {room.status === "Content Submitted" && (
                  <>
                    <button onClick={onApprove} disabled={acting} className={btn}>
                      {acting ? "…" : "Approve content →"}
                    </button>
                    <div>
                      <label className="mono text-[10px] uppercase tracking-[0.3em] text-[#0a0a0a]/85 block mb-1">
                        Request revision ({room.revision_count || 0}/2 used)
                      </label>
                      <textarea
                        value={revisionNote}
                        onChange={(e) => setRevisionNote(e.target.value)}
                        placeholder="What needs to change?"
                        rows={3}
                        className="w-full border border-[#0a0a0a] px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:bg-[#e8e0cd] resize-none mb-2"
                      />
                      <button onClick={onRequestRevision} disabled={acting || (room.revision_count || 0) >= 2} className={`${btn} bg-transparent border border-[#0a0a0a] text-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-[#efe8d8]`}>
                        {acting ? "…" : "Request revision"}
                      </button>
                    </div>
                  </>
                )}

                {room.status === "Posted" && (
                  <button onClick={onMarkComplete} disabled={acting} className={btn}>
                    {acting ? "…" : "Mark deal complete →"}
                  </button>
                )}

                {room.status !== "Content Submitted" && room.status !== "Posted" && (
                  <p className="text-xs text-[#5c5650]">
                    {room.status === "Matched" && "Waiting for creator to submit content."}
                    {room.status === "Under Review" && "Creator is revising content."}
                    {room.status === "Approved" && "Waiting for creator to post content."}
                    {room.status === "Closed" && "Deal complete. Pay creator via UPI/bank transfer."}
                  </p>
                )}
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

const btn = "w-full block text-center px-4 py-3 bg-[#0a0a0a] text-[#efe8d8] mono text-[10px] uppercase tracking-widest hover:bg-[#e63946] disabled:opacity-50 transition";

function Card({ title, children }) {
  return (
    <div className="border border-[#0a0a0a] p-5">
      <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-4">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex gap-3 mb-3 last:mb-0 text-sm">
      <span className="mono text-[9px] uppercase tracking-widest text-[#5c5650] w-28 shrink-0 pt-0.5">{label}</span>
      <span className="text-[#0a0a0a]/90">{value}</span>
    </div>
  );
}
