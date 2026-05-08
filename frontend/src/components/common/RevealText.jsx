import React from "react";
import { motion } from "framer-motion";

/*
 * Word-mask reveal — splits a phrase into words and reveals them
 * with a vertical slide-up inside a clipped container.
 * Inspired by PRM / editorial motion design.
 */
export default function RevealText({ text, className = "", delay = 0, stagger = 0.08, as: Tag = "h1" }) {
  const words = text.split(" ");
  return (
    <Tag className={className}>
      {words.map((w, i) => (
        <span key={i} className="reveal-mask">
          <motion.span
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{ delay: delay + i * stagger, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {w}
            {i !== words.length - 1 && "\u00A0"}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/* In-view variant (reveals when scrolled into view) */
export function RevealTextOnScroll({ text, className = "", stagger = 0.06, as: Tag = "h2" }) {
  const words = text.split(" ");
  return (
    <Tag className={className}>
      {words.map((w, i) => (
        <span key={i} className="reveal-mask">
          <motion.span
            initial={{ y: "110%" }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: i * stagger, duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {w}
            {i !== words.length - 1 && "\u00A0"}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
