import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createCampaign } from "../lib/api";
import { getUser } from "../lib/auth";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const NICHES = ["Fashion", "Fitness", "Food", "Tech", "Lifestyle", "Travel", "Beauty", "Gaming"];

export default function CreateCampaign() {
  const navigate = useNavigate();
  const user = getUser();

  const [form, setForm] = useState({
    name: "", description: "", target_niche: "", platform: "Instagram",
    deliverables: "", budget_min: "", budget_max: "",
    application_deadline: "", content_deadline: "", requirements: "",
  });
  const [concepts, setConcepts] = useState([{ title: "", description: "", reference: "" }]);
  const [submitting, setSubmitting] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const updateConcept = (i, k, v) =>
    setConcepts((cs) => cs.map((c, idx) => idx === i ? { ...c, [k]: v } : c));

  const addConcept = () => {
    if (concepts.length >= 3) return toast.error("Max 3 concept cards");
    setConcepts((cs) => [...cs, { title: "", description: "", reference: "" }]);
  };

  const removeConcept = (i) => setConcepts((cs) => cs.filter((_, idx) => idx !== i));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.target_niche || !form.deliverables)
      return toast.error("Fill in all required fields");
    if (!form.budget_min || !form.budget_max)
      return toast.error("Set a budget range");
    if (!form.application_deadline || !form.content_deadline)
      return toast.error("Set both deadlines");
    setSubmitting(true);
    try {
      const campaign = await createCampaign({
        ...form,
        budget_min: parseInt(form.budget_min),
        budget_max: parseInt(form.budget_max),
        concepts: concepts.filter((c) => c.title),
      });
      toast.success("Campaign published!");
      navigate(`/campaigns/${campaign.id}`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || user.role !== "brand") {
    navigate("/auth?role=brand");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#efe8d8] text-[#0a0a0a]">
      <Navbar />
      <section className="max-w-3xl mx-auto px-5 md:px-10 py-12">
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-3">§ New Campaign</div>
        <h1 className="display text-5xl md:text-7xl font-black leading-[0.9] mb-10">
          Create a<br /><span className="italic text-[#e63946]">campaign.</span>
        </h1>

        <motion.form onSubmit={onSubmit} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Basic info */}
          <div className="border border-[#0a0a0a] p-6 space-y-4">
            <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-2">Campaign basics</div>
            <Field label="Campaign name *">
              <input value={form.name} onChange={set("name")} placeholder="Summer Glow Campaign" className={inp} />
            </Field>
            <Field label="Description *">
              <textarea value={form.description} onChange={set("description")} placeholder="What's this campaign about? What vibe / message are you going for?" rows={3} className={`${inp} resize-none`} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Target niche *">
                <select value={form.target_niche} onChange={set("target_niche")} className={inp}>
                  <option value="">Select niche</option>
                  {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </Field>
              <Field label="Platform">
                <select value={form.platform} onChange={set("platform")} className={inp}>
                  <option value="Instagram">Instagram</option>
                </select>
              </Field>
            </div>
            <Field label="Deliverables *">
              <input value={form.deliverables} onChange={set("deliverables")} placeholder="e.g. 1 Reel + 2 Stories" className={inp} />
            </Field>
          </div>

          {/* Concept cards */}
          <div className="border border-[#0a0a0a] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946]">Content concepts (up to 3)</div>
              {concepts.length < 3 && (
                <button type="button" onClick={addConcept} className="inline-flex items-center gap-1 mono text-[10px] uppercase tracking-widest hover:text-[#e63946]">
                  <Plus size={12} /> Add concept
                </button>
              )}
            </div>
            {concepts.map((c, i) => (
              <div key={i} className="border border-[#0a0a0a]/30 p-4 space-y-3 relative">
                <div className="mono text-[9px] uppercase tracking-widest text-[#7a7466]">Concept {i + 1}</div>
                {concepts.length > 1 && (
                  <button type="button" onClick={() => removeConcept(i)} className="absolute top-3 right-3 text-[#7a7466] hover:text-[#e63946]">
                    <Trash2 size={13} />
                  </button>
                )}
                <input value={c.title} onChange={(e) => updateConcept(i, "title", e.target.value)} placeholder="Concept title" className={inp} />
                <textarea value={c.description} onChange={(e) => updateConcept(i, "description", e.target.value)} placeholder="Mood, style, key message…" rows={2} className={`${inp} resize-none`} />
                <input value={c.reference} onChange={(e) => updateConcept(i, "reference", e.target.value)} placeholder="Reference link (optional)" className={inp} />
              </div>
            ))}
          </div>

          {/* Budget & deadlines */}
          <div className="border border-[#0a0a0a] p-6 space-y-4">
            <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-2">Budget & timeline</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Budget min (₹) *">
                <input type="number" value={form.budget_min} onChange={set("budget_min")} placeholder="5000" className={inp} />
              </Field>
              <Field label="Budget max (₹) *">
                <input type="number" value={form.budget_max} onChange={set("budget_max")} placeholder="25000" className={inp} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Application deadline *">
                <input type="date" value={form.application_deadline} onChange={set("application_deadline")} className={inp} />
              </Field>
              <Field label="Content deadline *">
                <input type="date" value={form.content_deadline} onChange={set("content_deadline")} className={inp} />
              </Field>
            </div>
          </div>

          {/* Requirements */}
          <div className="border border-[#0a0a0a] p-6">
            <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-4">Requirements & do's / don'ts</div>
            <textarea value={form.requirements} onChange={set("requirements")} placeholder="Any specific requirements, restrictions, or guidelines for creators…" rows={3} className={`${inp} resize-none`} />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-4 bg-[#0a0a0a] text-[#efe8d8] font-bold uppercase tracking-widest text-xs hover:bg-[#e63946] disabled:opacity-50 transition-colors"
          >
            {submitting ? "Publishing…" : "Publish campaign →"}
          </button>
        </motion.form>
      </section>
      <Footer />
    </div>
  );
}

const inp = "w-full bg-transparent border border-[#0a0a0a] px-3 py-3 text-sm focus:outline-none focus:bg-[#e8e0cd]";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mono text-[10px] uppercase tracking-[0.3em] text-[#0a0a0a]/70 block mb-2">{label}</span>
      {children}
    </label>
  );
}
