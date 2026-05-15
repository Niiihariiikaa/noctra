import React from "react";
import { motion } from "framer-motion";
import { Mail, Instagram } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";

export default function Contact() {
  return (
    <div className="min-h-screen bg-[#efe8d8] text-[#0a0a0a]">
      <Navbar />

      <section className="max-w-7xl mx-auto px-5 md:px-10 pt-16 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-4"
        >
          Contact Us
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="display text-6xl md:text-8xl font-black leading-[0.85] mb-16"
        >
          Let's<br /><span className="italic text-[#e63946]">talk.</span>
        </motion.h1>

        <div className="grid md:grid-cols-2 gap-16 md:gap-24">
          <div className="space-y-12">
            <div>
              <div className="mono text-[9px] uppercase tracking-[0.3em] text-[#5c5650] mb-2">General enquiries</div>
              <p className="text-sm text-[#0a0a0a]/80 leading-relaxed mb-4">
                For partnerships, brand onboarding, creator support, or anything else — drop us a mail and we'll get back within 24 hours.
              </p>
              <a
                href="mailto:social@noctra.co.in"
                className="inline-flex items-center gap-2 px-5 py-3 border border-[#0a0a0a] mono text-[10px] uppercase tracking-widest hover:bg-[#0a0a0a] hover:text-[#efe8d8] transition"
              >
                <Mail size={12} /> social@noctra.co.in
              </a>
            </div>

            <div>
              <div className="mono text-[9px] uppercase tracking-[0.3em] text-[#5c5650] mb-2">Follow us</div>
              <a
                href="https://instagram.com/noctra.co.in"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 border border-[#0a0a0a] mono text-[10px] uppercase tracking-widest hover:bg-[#e63946] hover:border-[#e63946] hover:text-[#efe8d8] transition"
              >
                <Instagram size={12} /> @noctra.co.in
              </a>
            </div>

            <div>
              <div className="mono text-[9px] uppercase tracking-[0.3em] text-[#5c5650] mb-2">Response time</div>
              <p className="text-sm text-[#0a0a0a]/80">We typically respond within 24 hours on business days.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border border-[#0a0a0a] p-8 md:p-10">
              <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-6">Common topics</div>
              {[
                ["Brand partnerships", "social@noctra.co.in"],
                ["Creator support", "social@noctra.co.in"],
                ["Press & media", "social@noctra.co.in"],
                ["Careers", "/careers"],
                ["Technical issues", "social@noctra.co.in"],
              ].map(([topic, contact]) => (
                <div key={topic} className="flex items-center justify-between py-3 border-b border-[#0a0a0a]/10 last:border-0">
                  <span className="text-sm">{topic}</span>
                  {contact.startsWith("/") ? (
                    <a href={contact} className="mono text-[9px] uppercase tracking-widest text-[#e63946] hover:opacity-70 transition">
                      View page →
                    </a>
                  ) : (
                    <a href={`mailto:${contact}`} className="mono text-[9px] uppercase tracking-widest text-[#e63946] hover:opacity-70 transition">
                      {contact}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <BottomNav />
    </div>
  );
}
