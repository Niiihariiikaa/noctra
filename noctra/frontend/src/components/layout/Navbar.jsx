import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getUser, signOut } from "../../lib/mockAuth";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getUser();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { label: "Discover", to: "/discover" },
    { label: "Services", to: "/services" },
    { label: "Brands", to: "/auth?role=brand" },
    { label: "Creators", to: "/auth?role=creator" },
  ];

  return (
    <>
      {/* Top header bar — not fixed, sits in normal flow */}
      <div className="flex items-center justify-between px-4 md:px-6 pt-9 pb-4 md:pt-10 md:pb-6">
        <Link to="/" className="flex items-center z-50" data-testid="logo-link">
          <img src="/brand/logo.svg" alt="Noctra" className="h-10 md:h-14 w-auto top-60" />
        </Link>
        <div className="hidden md:flex items-center gap-3 mono text-[10px] uppercase tracking-[0.25em] text-[#0a0a0a]">
          <span>2026 — Edition 01</span>
          <span className="w-1 h-1 rounded-full bg-[#e63946]" />
          <span className="text-[#e63946]">Live</span>
        </div>
      </div>

      {/* Desktop floating nav */}
      <motion.nav
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={`hidden lg:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-50 items-center gap-1 px-2 py-2 rounded-full border border-[#0a0a0a] bg-[#efe8d8]/90 backdrop-blur-md transition ${scrolled ? "shadow-[4px_4px_0_0_#0a0a0a]" : ""}`}
        data-testid="main-navbar"
      >
        {navItems.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                active ? "bg-[#e63946] text-[#efe8d8]" : "text-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-[#efe8d8]"
              }`}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
            >
              {item.label}
            </Link>
          );
        })}
        <div className="w-px h-5 bg-[#0a0a0a]/20 mx-1" />
        {user ? (
          <>
            <Link
              to={user.role === "brand" ? "/dashboard/brand" : "/dashboard/creator"}
              className="px-4 py-1.5 rounded-full text-sm font-medium text-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-[#efe8d8] transition"
              data-testid="dashboard-link"
            >
              Studio
            </Link>
            <button
              onClick={() => { signOut(); navigate("/"); }}
              className="px-4 py-1.5 rounded-full text-sm font-medium bg-[#0a0a0a] text-[#efe8d8] hover:brightness-110"
              data-testid="sign-out-btn"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link
            to="/auth"
            className="px-4 py-1.5 rounded-full text-sm font-bold bg-[#0a0a0a] text-[#efe8d8] hover:bg-[#e63946]"
            data-testid="sign-in-btn"
          >
            Sign in
          </Link>
        )}
      </motion.nav>
    </>
  );
}
