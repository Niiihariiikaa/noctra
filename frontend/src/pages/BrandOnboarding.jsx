import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { completeBrandOnboarding } from "../lib/api";
import Navbar from "../components/layout/Navbar";

export default function BrandOnboarding() {
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!description) return toast.error("Add a brand description");
    if (!whatsapp) return toast.error("WhatsApp number required — creators use it to reach you");
    setSubmitting(true);
    try {
      await completeBrandOnboarding({
        description,
        budget_min: budgetMin ? parseInt(budgetMin) : null,
        budget_max: budgetMax ? parseInt(budgetMax) : null,
        target_audience: targetAudience,
        whatsapp,
      });
      toast.success("Brand profile ready. Let's find creators.");
      navigate("/dashboard/brand");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#efe8d8] text-[#0a0a0a]">
      <Navbar />
      <section className="max-w-2xl mx-auto px-5 py-12">
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-3">Brand Onboarding</div>
        <h1 className="display text-5xl md:text-7xl font-black leading-[0.9] mb-10">
          Tell us about<br /><span className="italic text-[#e63946]">your brand.</span>
        </h1>

        <motion.form onSubmit={onSubmit} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Field label="Brand description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does your brand do and who is it for?"
              rows={3}
              className="w-full bg-transparent border border-[#0a0a0a] px-3 py-3 text-sm focus:outline-none focus:bg-[#e8e0cd] resize-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Min campaign budget (₹)">
              <input
                type="number"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                placeholder="e.g. 10000"
                className="w-full bg-transparent border border-[#0a0a0a] px-3 py-3 text-sm focus:outline-none focus:bg-[#e8e0cd]"
              />
            </Field>
            <Field label="Max campaign budget (₹)">
              <input
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="e.g. 100000"
                className="w-full bg-transparent border border-[#0a0a0a] px-3 py-3 text-sm focus:outline-none focus:bg-[#e8e0cd]"
              />
            </Field>
          </div>

          <Field label="Target audience">
            <input
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. Women 18–30 interested in skincare"
              className="w-full bg-transparent border border-[#0a0a0a] px-3 py-3 text-sm focus:outline-none focus:bg-[#e8e0cd]"
            />
          </Field>

          <Field label="WhatsApp number (creators will use this to reach you)">
            <div className="flex border border-[#0a0a0a] focus-within:bg-[#e8e0cd]">
              <span className="px-3 py-3 text-sm text-[#5c5650] border-r border-[#0a0a0a] select-none">+91</span>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="9876543210"
                className="flex-1 bg-transparent px-3 py-3 text-sm focus:outline-none"
              />
            </div>
          </Field>

          <div className="pt-2 border-t border-[#0a0a0a]/30">
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-4 bg-[#0a0a0a] text-[#efe8d8] font-bold uppercase tracking-widest text-xs hover:bg-[#e63946] disabled:opacity-50 transition-colors"
            >
              {submitting ? "Saving…" : "Go to my dashboard →"}
            </button>
          </div>
        </motion.form>
      </section>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mono text-[10px] uppercase tracking-[0.3em] text-[#0a0a0a]/85 block mb-2">{label}</span>
      {children}
    </label>
  );
}
