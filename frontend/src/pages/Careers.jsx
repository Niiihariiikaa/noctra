import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, MapPin, Clock, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";

export default function Careers() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", why: "", links: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.why.trim()) {
      toast.error("Please fill in your name, email, and motivation");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/careers/apply", {
        ...form,
        position: "Marketing Intern",
      });
      setDone(true);
      toast.success("Application sent! We'll be in touch.");
    } catch {
      toast.error("Failed to send — try again or email social@noctra.co.in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#efe8d8] text-[#0a0a0a]">
      <Navbar />

      <section className="max-w-7xl mx-auto px-5 md:px-10 pt-16 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-4"
        >
          Careers at Noctra
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="display text-6xl md:text-8xl font-black leading-[0.85] mb-6"
        >
          Help us<br /><span className="italic text-[#e63946]">build</span><br />the thing.
        </motion.h1>
        <p className="text-base text-[#0a0a0a]/85 max-w-xl mb-16 leading-relaxed">
          We're a small, fast-moving team building India's creator marketplace from the ground up. If that sounds like your kind of chaos — read on.
        </p>
      </section>

      {/* Job listing */}
      <section className="max-w-7xl mx-auto px-5 md:px-10 pb-24">
        <div className="grid md:grid-cols-[1fr_380px] gap-12 md:gap-20">

          {/* JD */}
          <div>
            <div className="border border-[#0a0a0a] mb-1">
              <div className="bg-[#e63946] text-[#efe8d8] px-6 py-4">
                <div className="mono text-[9px] uppercase tracking-[0.3em] mb-1 opacity-70">Open role · 01</div>
                <h2 className="display text-4xl md:text-5xl font-black leading-none">Marketing Intern</h2>
              </div>
              <div className="px-6 py-5 flex flex-wrap gap-5 border-b border-[#0a0a0a]">
                {[
                  { icon: IndianRupee, label: "₹4,000 stipend" },
                  { icon: Clock, label: "1 month" },
                  { icon: MapPin, label: "Remote (India)" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 mono text-[9px] uppercase tracking-widest text-[#5c5650]">
                    <Icon size={11} /> {label}
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-t-0 border-[#0a0a0a] p-6 md:p-8 space-y-8">
              <JDSection title="The role">
                <p>
                  You'll be the person on the ground who gets brands and creators excited about Noctra. Your core job: reach out to brands that should be running creator campaigns, and connect with creators who belong on the platform. You'll be one of the first people to build Noctra's community.
                </p>
              </JDSection>

              <JDSection title="What you'll do">
                <ul>
                  <li>Identify and reach out to D2C brands, startups, and businesses across India that are a fit for creator marketing</li>
                  <li>Find and DM creators across Instagram, LinkedIn, and other platforms to join Noctra's creator roster</li>
                  <li>Draft compelling outreach messages (we'll help with templates — you'll make them your own)</li>
                  <li>Track outreach, follow-ups, and conversion in a simple shared sheet</li>
                  <li>Jump on brief calls to explain the platform to interested brands or creators</li>
                  <li>Share weekly learnings with the team — what's working, what's not</li>
                </ul>
              </JDSection>

              <JDSection title="What we're looking for">
                <ul>
                  <li>Genuinely good at talking to people — over DM, email, or a quick call</li>
                  <li>Active on Instagram and aware of the creator economy in India</li>
                  <li>Self-starter who doesn't need hand-holding to get things moving</li>
                  <li>Hustle mentality — you'll be cold-outreaching, not just posting content</li>
                  <li>Prior experience in sales, marketing, or content creation is a big plus, not a must</li>
                  <li>Available for 20–30 hours/week for one month</li>
                </ul>
              </JDSection>

              <JDSection title="What you get">
                <ul>
                  <li>₹4,000 stipend for the month (paid at the end of the contract)</li>
                  <li>Direct access to the founding team — learn how a startup is built</li>
                  <li>Letter of recommendation based on performance</li>
                  <li>A front-row seat to the creator economy in India</li>
                  <li>Potential for a longer role if things go well</li>
                </ul>
              </JDSection>
            </div>
          </div>

          {/* Application form */}
          <div className="h-fit sticky top-24">
            {done ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border border-[#0a0a0a] p-8 text-center"
              >
                <CheckCircle2 size={40} className="mx-auto mb-4 text-[#0a0a0a]" strokeWidth={1.5} />
                <div className="display text-3xl font-black mb-2">Application sent!</div>
                <p className="text-sm text-[#5c5650]">We'll review your application and reach out to <strong className="text-[#0a0a0a]">{form.email}</strong> within a few days.</p>
              </motion.div>
            ) : (
              <div className="border border-[#0a0a0a] p-6 md:p-8">
                <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-5">Apply now</div>
                <form onSubmit={onSubmit} className="space-y-4">
                  <Field label="Full name *">
                    <input
                      type="text"
                      value={form.name}
                      onChange={set("name")}
                      placeholder="Your name"
                      className="w-full bg-transparent border border-[#0a0a0a] px-3 py-3 text-sm focus:outline-none focus:bg-[#e8e0cd] transition"
                    />
                  </Field>
                  <Field label="Email *">
                    <input
                      type="email"
                      value={form.email}
                      onChange={set("email")}
                      placeholder="you@email.com"
                      className="w-full bg-transparent border border-[#0a0a0a] px-3 py-3 text-sm focus:outline-none focus:bg-[#e8e0cd] transition"
                    />
                  </Field>
                  <Field label="Phone (optional)">
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={set("phone")}
                      placeholder="+91 00000 00000"
                      className="w-full bg-transparent border border-[#0a0a0a] px-3 py-3 text-sm focus:outline-none focus:bg-[#e8e0cd] transition"
                    />
                  </Field>
                  <Field label="Why Noctra? *">
                    <textarea
                      value={form.why}
                      onChange={set("why")}
                      placeholder="What excites you about this role? What would you bring to it?"
                      rows={5}
                      className="w-full bg-transparent border border-[#0a0a0a] px-3 py-3 text-sm focus:outline-none focus:bg-[#e8e0cd] resize-none transition"
                    />
                  </Field>
                  <Field label="Instagram / LinkedIn / Portfolio (optional)">
                    <input
                      type="text"
                      value={form.links}
                      onChange={set("links")}
                      placeholder="@handle or link"
                      className="w-full bg-transparent border border-[#0a0a0a] px-3 py-3 text-sm focus:outline-none focus:bg-[#e8e0cd] transition"
                    />
                  </Field>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full px-4 py-3.5 bg-[#0a0a0a] text-[#efe8d8] mono text-[10px] uppercase tracking-widest hover:bg-[#e63946] disabled:opacity-50 transition flex items-center justify-center gap-2"
                  >
                    {submitting ? <><Loader2 size={12} className="animate-spin" /> Sending…</> : "Submit application →"}
                  </button>
                  <p className="mono text-[8px] uppercase tracking-widest text-[#5c5650] text-center">
                    Or email us directly at social@noctra.co.in
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
      <BottomNav />
    </div>
  );
}

function JDSection({ title, children }) {
  return (
    <div>
      <div className="mono text-[9px] uppercase tracking-[0.3em] text-[#e63946] mb-3">{title}</div>
      <div className="space-y-2 text-sm text-[#0a0a0a]/80 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2">
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="mono text-[8px] uppercase tracking-widest text-[#5c5650] mb-1.5">{label}</div>
      {children}
    </div>
  );
}
