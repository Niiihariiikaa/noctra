import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";

export default function About() {
  return (
    <div className="min-h-screen bg-[#efe8d8] text-[#0a0a0a]">
      <Navbar />

      <section className="max-w-7xl mx-auto px-5 md:px-10 pt-16 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-4"
        >
          About Noctra
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="display text-6xl md:text-8xl lg:text-[10rem] font-black leading-[0.85] mb-16"
        >
          Built for the<br /><span className="italic text-[#e63946]">creator</span><br />generation.
        </motion.h1>
      </section>

      {/* Story */}
      <section className="max-w-7xl mx-auto px-5 md:px-10 pb-24">
        <div className="grid md:grid-cols-2 gap-12 md:gap-24 mb-24">
          <div className="space-y-6">
            <p className="text-base md:text-lg text-[#0a0a0a]/80 leading-relaxed">
              Noctra is India's creator deal marketplace. A place where brands find the right voices, and creators find deals worth their time. No cold DMs. No chasing payments. Just clean, direct collabs.
            </p>
            <p className="text-base md:text-lg text-[#0a0a0a]/80 leading-relaxed">
              We started with a simple observation that  India has millions of creators who are seriously good at what they do, and thousands of brands that genuinely want to work with them , but no platform that makes the whole process feel smooth and human. Noctra is that platform.
            </p>
            <p className="text-base md:text-lg text-[#0a0a0a]/80 leading-relaxed">
              Every creator carries a <strong>Trust Score</strong> built from delivery history, engagement authenticity and brand reviews. Every deal is tracked end-to-end on the platform, so both sides always know exactly where things stand.
            </p>
          </div>
          <div className="space-y-8">
            {[
              { label: "Founded", value: "2026" },
              { label: "Based in", value: "India" },
              { label: "Mode", value: "Remote-first" },
              { label: "Contact", value: "social@noctra.co.in" },
            ].map((item) => (
              <div key={item.label} className="border-t border-[#0a0a0a]/30 pt-5">
                <div className="mono text-[9px] uppercase tracking-[0.3em] text-[#5c5650] mb-1">{item.label}</div>
                <div className="text-xl font-bold">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-8">Our principles</div>
        <div className="grid md:grid-cols-3 border-t border-l border-[#0a0a0a]">
          {[
            {
              num: "01",
              title: "Transparency",
              desc: "No hidden fees, no algorithm games. Every campaign brief, every deal, every status update — fully visible to both sides at all times.",
            },
            {
              num: "02",
              title: "Creator-first",
              desc: "Creators are not inventory. They're the product. We build tools that respect their time, make payments clear, and help grow their reputation with every collab.",
            },
            {
              num: "03",
              title: "India-built",
              desc: "We understand the Indian market — the platforms, the price points, the creator culture. Built here, for here, with the rest of the world in mind.",
            },
          ].map((item) => (
            <motion.div
              key={item.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="border-r border-b border-[#0a0a0a] p-8 md:p-10"
            >
              <div className="display text-6xl font-black leading-none text-[#0a0a0a]/10 mb-6">{item.num}</div>
              <h3 className="display text-3xl font-black leading-none mb-3">{item.title}<span className="italic">.</span></h3>
              <p className="text-sm leading-relaxed text-[#0a0a0a]/80">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-24 text-center">
          <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-4">Join the platform</div>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/auth?role=brand" className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#0a0a0a] text-[#efe8d8] mono text-[10px] uppercase tracking-widest hover:bg-[#e63946] transition">
              I'm a brand <ArrowUpRight size={13} />
            </Link>
            <Link to="/auth?role=creator" className="inline-flex items-center gap-2 px-6 py-3.5 border border-[#0a0a0a] mono text-[10px] uppercase tracking-widest hover:bg-[#0a0a0a] hover:text-[#efe8d8] transition">
              I'm a creator
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <BottomNav />
    </div>
  );
}
