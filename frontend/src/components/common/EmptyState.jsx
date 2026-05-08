import React from "react";
import { motion } from "framer-motion";

export default function EmptyState({ title = "Nothing here yet", subtitle = "Try adjusting your filters.", action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full min-h-[360px] border border-dashed border-[#0a0a0a] bg-[#efe8d8] flex flex-col items-center justify-center text-center p-10"
      data-testid="empty-state"
    >
      <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-3">Empty / Void / Nothing</div>
      <h3 className="display text-4xl md:text-6xl font-black leading-[0.9] mb-3">
        {title}<span className="italic text-[#e63946]">.</span>
      </h3>
      <p className="text-[#7a7466] text-sm max-w-sm">{subtitle}</p>
      {action}
    </motion.div>
  );
}
