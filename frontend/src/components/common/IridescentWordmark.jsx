import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/*
 * Giant iridescent 3D-ish decorative NOCTRA wordmark.
 * - Faux 3D via layered text-shadows + skew + gradient fill
 * - Parallax on scroll
 * - Respects pointer-events: none so it never blocks clicks
 */
export default function IridescentWordmark({ text = "NOCTRA", className = "", scale = 1 }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1200], [0, -180]);
  const rotate = useTransform(scrollY, [0, 1200], [0, -3]);

  return (
    <motion.div
      style={{ y, rotate }}
      className={`pointer-events-none select-none absolute inset-0 flex items-center justify-center ${className}`}
      aria-hidden="true"
    >
      <div
        className="noctra-3d text-[36vw] md:text-[24vw]"
        style={{
          transform: "perspective(1200px) rotateX(14deg) rotateY(-6deg) skewY(-3deg)",
        }}
      >
        <span className="noctra-3d-face">{text}</span>
        <span className="noctra-3d-shadow" aria-hidden="true">{text}</span>
      </div>
    </motion.div>
  );
}
