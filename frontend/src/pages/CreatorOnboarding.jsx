import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { completeCreatorOnboarding } from "../lib/api";
import { getUser } from "../lib/auth";
import Navbar from "../components/layout/Navbar";

const DEAL_TYPES = [
  { key: "paid_promotion", label: "Paid Promotion" },
  { key: "barter",         label: "Barter / Product" },
  { key: "affiliate",      label: "Affiliate" },
];

export default function CreatorOnboarding() {
  const navigate = useNavigate();
  const user = getUser();
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [minRate, setMinRate] = useState("");
  const [dealTypes, setDealTypes] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleDeal = (key) =>
    setDealTypes((p) => p.includes(key) ? p.filter((k) => k !== key) : [...p, key]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!bio) return toast.error("Add a short bio");
    setSubmitting(true);
    try {
      await completeCreatorOnboarding({
        bio,
        city,
        deal_types: dealTypes,
        min_rate: minRate ? parseInt(minRate) : null,
      });
      toast.success("Profile set up! Welcome to Noctra.");
      navigate("/dashboard/creator");
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
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-3">Creator Onboarding</div>
        <h1 className="display text-5xl md:text-7xl font-black leading-[0.9] mb-10">
          Set up your<br /><span className="italic text-[#e63946]">profile.</span>
        </h1>

        <motion.form onSubmit={onSubmit} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Field label="Bio — tell brands who you are">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Fashion creator from Mumbai. Reels focused, authentic storytelling."
              rows={3}
              className="w-full bg-transparent border border-[#0a0a0a] px-3 py-3 text-sm focus:outline-none focus:bg-[#e8e0cd] resize-none"
            />
          </Field>

          <Field label="City">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Mumbai, Delhi NCR, Bangalore…"
              className="w-full bg-transparent border border-[#0a0a0a] px-3 py-3 text-sm focus:outline-none focus:bg-[#e8e0cd]"
            />
          </Field>

          <Field label="Minimum rate per reel (₹)">
            <input
              type="number"
              value={minRate}
              onChange={(e) => setMinRate(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full bg-transparent border border-[#0a0a0a] px-3 py-3 text-sm focus:outline-none focus:bg-[#e8e0cd]"
            />
          </Field>

          <Field label="Deal types you're open to">
            <div className="flex gap-2 flex-wrap mt-1">
              {DEAL_TYPES.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => toggleDeal(d.key)}
                  className={`px-4 py-2 mono text-[10px] uppercase tracking-widest border transition ${dealTypes.includes(d.key) ? "bg-[#0a0a0a] text-[#efe8d8] border-[#0a0a0a]" : "border-[#0a0a0a]/40 hover:border-[#0a0a0a]"}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </Field>

          <div className="pt-2 border-t border-[#0a0a0a]/30">
            <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#5c5650] mb-4">
              Your Instagram handle is saved as <span className="text-[#0a0a0a] font-bold">@{user?.instagram_username || user?.name}</span>. Connect and verify it from your dashboard after signing up.
            </div>
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
