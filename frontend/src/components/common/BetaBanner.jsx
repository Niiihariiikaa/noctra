import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const STORAGE_KEY = "noctra_beta_dismissed";

export default function BetaBanner() {
  const [visible, setVisible] = useState(() => {
    try { return !localStorage.getItem(STORAGE_KEY); } catch { return true; }
  });

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          className="fixed bottom-16 lg:bottom-4 left-0 right-0 z-[55] flex justify-center px-4 pointer-events-none"
        >
          <div className="pointer-events-auto w-full max-w-2xl bg-[#0a0a0a] text-[#efe8d8] border border-[#0a0a0a] shadow-[6px_6px_0_0_#e63946]">
            {/* Header strip */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#efe8d8]/10">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 bg-[#e63946] text-[#efe8d8] mono text-[9px] uppercase tracking-[0.3em] px-2 py-1">
                  ◆ Beta
                </span>
                <span className="mono text-[9px] uppercase tracking-[0.25em] text-[#efe8d8]/40">
                  Noctra v0.1 — Early access
                </span>
              </div>
              <button
                onClick={dismiss}
                className="text-[#efe8d8]/40 hover:text-[#efe8d8] transition ml-4 shrink-0"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 grid sm:grid-cols-3 gap-3">
              <div className="flex items-start gap-2.5">
                <span className="mono text-[#e63946] text-[10px] mt-0.5 shrink-0">01</span>
                <p className="text-[11px] text-[#efe8d8]/70 leading-relaxed">
                  <span className="text-[#efe8d8] font-semibold">Beta build.</span> We're testing core flows. Expect rough edges — your feedback shapes what ships next.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="mono text-[#e63946] text-[10px] mt-0.5 shrink-0">02</span>
                <p className="text-[11px] text-[#efe8d8]/70 leading-relaxed">
                  <span className="text-[#efe8d8] font-semibold">Payments tracked, not processed.</span> Deals and budgets are logged on Noctra — actual payment happens outside for now.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="mono text-[#e63946] text-[10px] mt-0.5 shrink-0">03</span>
                <p className="text-[11px] text-[#efe8d8]/70 leading-relaxed">
                  <span className="text-[#efe8d8] font-semibold">Coming soon.</span> Creator verification, analytics, in-app payments, and brand dashboards are in progress.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 border-t border-[#efe8d8]/10 flex items-center justify-between">
              <span className="mono text-[9px] uppercase tracking-[0.25em] text-[#efe8d8]/25">
                Built in India · Edition 01 · 2026
              </span>
              <button
                onClick={dismiss}
                className="mono text-[9px] uppercase tracking-widest text-[#efe8d8]/40 hover:text-[#efe8d8] transition"
              >
                Got it →
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
