import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Twitter, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-32 pb-24 lg:pb-10 bg-[#0a0a0a] text-[#efe8d8] relative overflow-hidden" data-testid="footer">

      {/* Big beige logo */}
      <div className="w-full pt-16 pb-4 flex items-center justify-center px-6">
        <img
          src="/brand/logo.svg"
          alt="Noctra"
          className="w-[78vw] max-w-4xl"
          style={{ filter: "brightness(0) invert(97%) sepia(6%) saturate(603%) hue-rotate(334deg) brightness(103%) contrast(96%)" }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-10 pb-10 relative">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-3">Collaborative Hub · EST. 2026</div>
            <h3 className="display text-4xl md:text-6xl leading-[0.95] mb-4">
              Let's make<br/>something<br/><span className="text-[#e63946] italic">weird & good.</span>
            </h3>
            <p className="text-[#efe8d8]/60 max-w-sm text-sm">
              A marketplace where brands meet creators. Based in India. Open to earth.
            </p>
            <div className="flex gap-2 mt-6">
              {[Instagram, Twitter, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-full border border-[#efe8d8]/30 flex items-center justify-center hover:bg-[#e63946] hover:border-[#e63946] transition"
                  aria-label="social"
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          <FooterCol title="Explore" links={[["Discover", "/discover"], ["Services", "/services"], ["For Brands", "/auth?role=brand"], ["For Creators", "/auth?role=creator"]]} />
          <FooterCol title="Inside" links={[["About", "#"], ["Manifesto", "#"], ["Careers", "#"], ["Contact", "mailto:hello@noctra.in"]]} />
        </div>

        <div className="mt-16 pt-6 border-t border-[#efe8d8]/10 flex flex-col md:flex-row justify-between gap-2 mono text-[10px] uppercase tracking-[0.25em]">
          <span>© 2026 Noctra · Built in India</span>
          <div className="flex gap-5">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-4">{title}</div>
      <ul className="space-y-2.5">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link to={href} className="text-[#efe8d8]/80 hover:text-[#e63946] transition text-sm">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
