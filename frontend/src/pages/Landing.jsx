import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowUpRight, Plus, Dumbbell, Shirt, UtensilsCrossed, Cpu, Coffee,
  Plane, Clapperboard, Megaphone, Star, Calendar, Users,
  Ghost, MessageCircleOff, ShieldCheck, Flame,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";
import CreatorCard from "../components/common/CreatorCard";
import Stepper, { Step } from "../components/ui/Stepper";
import { getCreators, getCategories, getCampaigns } from "../lib/api";
import { formatINR } from "../lib/format";
import { getUser } from "../lib/auth";

const ICONS = { Dumbbell, Shirt, UtensilsCrossed, Cpu, Coffee, Plane, Clapperboard, Megaphone };

const STATIC_CATEGORIES = [
  { slug: "fashion",       name: "Fashion",       icon: "Shirt" },
  { slug: "fitness",       name: "Fitness",       icon: "Dumbbell" },
  { slug: "food",          name: "Food",          icon: "UtensilsCrossed" },
  { slug: "tech",          name: "Tech",          icon: "Cpu" },
  { slug: "lifestyle",     name: "Lifestyle",     icon: "Coffee" },
  { slug: "travel",        name: "Travel",        icon: "Plane" },
  { slug: "video-editors", name: "Video Editing", icon: "Clapperboard" },
  { slug: "smm",           name: "Social Media",  icon: "Megaphone" },
];

/* ─── Ticker ──────────────────────────────────────────────────────────── */
function Ticker() {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 border-b border-[#0a0a0a] bg-[#efe8d8]/95 backdrop-blur-sm overflow-hidden mono text-[10px] uppercase tracking-[0.25em]" data-testid="ticker-bar">
      <div className="flex ticker-track whitespace-nowrap py-2">
        {Array.from({ length: 2 }).map((_, dup) => (
          <div key={dup} className="flex items-center gap-6 pr-6">
            <span className="text-[#e63946]">◆ Now Live</span><span>/</span>
            <span>India's creator deal marketplace</span><span>/</span>
            <span className="text-[#e63946]">Join free — it's open</span><span>/</span>
            <span>Brands · Creators · Editors</span><span>/</span>
            <span>Verified deals</span><span>/</span>
            <span>Built in India</span><span>/</span>
            <span className="text-[#e63946]">Edition 01 · 2026</span><span>/</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Hero (shared) ───────────────────────────────────────────────────── */
function Hero({ heroRef, watermarkY, watermarkScale, ctaSlot, user }) {
  const firstName = user?.name?.split(" ")[0] || "";

  return (
    <section ref={heroRef} className="relative md:min-h-screen pt-4 md:pt-6 pb-16 md:pb-20 flex flex-col">
      <motion.div
        style={{ y: watermarkY, scale: watermarkScale }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
      >
        <img src="/brand/logo.svg" alt="" aria-hidden="true" className="w-[82%] max-w-5xl opacity-[0.05]" />
      </motion.div>
      <div className="hidden md:block absolute left-6 top-1/2 -translate-y-1/2 vertical-text text-[#0a0a0a]">Collaborative Hub · Est. 2026 · Made in India</div>
      <div className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 vertical-text text-[#e63946]" style={{ writingMode: "vertical-rl" }}>Scroll to explore</div>
      <div className="hidden md:flex absolute right-12 top-1/2 -translate-y-1/2 flex-col scroll-dots">
        {Array.from({ length: 10 }).map((_, i) => <span key={i} />)}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-10 flex flex-col mt-4 md:mt-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-4"
        >{user ? `§ Welcome back, ${firstName}` : "§ Where brands meet creators"}</motion.div>

        {user ? (
          <h1 className="display text-[3.5rem] sm:text-6xl lg:text-[11rem] leading-[0.85] font-black tracking-tighter" data-testid="hero-headline">
            <div className="reveal-mask block">
              <motion.span initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ delay: 0.5, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }} className="block">
                Hello, <span className="italic text-[#e63946]">{firstName}</span>.
              </motion.span>
            </div>
            <div className="reveal-mask block">
              <motion.span initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ delay: 0.65, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }} className="block">your next</motion.span>
            </div>
            <div className="reveal-mask block">
              <motion.span initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ delay: 0.8, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }} className="block">collab <span className="italic">starts here</span>.</motion.span>
            </div>
          </h1>
        ) : (
          <h1 className="display text-[3.5rem] sm:text-6xl lg:text-[11rem] leading-[0.85] font-black tracking-tighter" data-testid="hero-headline">
            <div className="reveal-mask block">
              <motion.span initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ delay: 0.5, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }} className="block">your next</motion.span>
            </div>
            <div className="reveal-mask block">
              <motion.span initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ delay: 0.65, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }} className="block">collab <span className="italic text-[#e63946]">starts</span></motion.span>
            </div>
            <div className="reveal-mask block">
              <motion.span initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ delay: 0.8, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }} className="block">here<span className="text-[#e63946]">.</span></motion.span>
            </div>
          </h1>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05 }}
          className="grid md:grid-cols-[1fr_auto] gap-6 md:gap-10 items-end mt-8 md:mt-10"
        >
          <p className="text-sm md:text-lg max-w-md text-[#0a0a0a]/75 leading-relaxed">
            India's creator deal marketplace. Brands find the right creators, creators find deals worth their time. No cold DMs, no chasing payments<span className="text-[#e63946]">.</span>
          </p>
          {ctaSlot}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Discovery sections (shown to everyone) ──────────────────────────── */
function DiscoverySections({ creators, categories, campaigns }) {
  return (
    <>
      {/* CATEGORIES */}
      <section id="discover" className="bg-[#e63946] text-[#efe8d8] py-12 md:py-20 relative" data-testid="categories-section">
        <div className="max-w-7xl mx-auto px-5 md:px-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#efe8d8]/70 mb-2">§ Browse by craft</div>
              <h2 className="display text-4xl md:text-6xl lg:text-7xl font-black leading-[0.9]">Find your<br /><span className="italic">people</span>.</h2>
            </div>
            <Link to="/discover" className="inline-flex items-center gap-2 mono text-xs uppercase tracking-widest border-b border-[#efe8d8] hover:opacity-70 transition pb-1">
              Explore all <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 border-t border-l border-[#efe8d8]/40">
            {(categories.length ? categories : STATIC_CATEGORIES).map((cat, i) => {
              const Icon = ICONS[cat.icon] || Star;
              return (
                <motion.div key={cat.slug} whileHover={{ backgroundColor: "#efe8d8", color: "#0a0a0a" }} transition={{ duration: 0.2 }}
                  className="group border-r border-b border-[#efe8d8]/40 h-[140px] md:aspect-square md:h-auto relative overflow-hidden"
                >
                  <Link to={cat.slug === "video-editors" || cat.slug === "smm" ? "/services" : `/discover?niche=${cat.name}`}
                    className="absolute inset-0 p-5 flex flex-col justify-between group-hover:text-[#0a0a0a] transition-colors"
                    data-testid={`category-${cat.slug}`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="mono text-[10px] uppercase tracking-[0.25em]">No. {String(i + 1).padStart(2, "0")}</span>
                      <ArrowUpRight size={16} className="opacity-60" />
                    </div>
                    <div>
                      <Icon size={28} strokeWidth={1.5} className="mb-3" />
                      <div className="display text-3xl md:text-4xl font-black leading-none tracking-tight">{cat.name}</div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED CREATORS */}
      {creators.length > 0 && (
        <section className="bg-[#0a0a0a] text-[#efe8d8] py-8 md:py-14 relative overflow-hidden" data-testid="featured-section">
          <div className="absolute top-4 left-6 mono text-[10px] uppercase tracking-[0.3em] text-[#e63946]">§ Featured</div>
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <h2 className="display text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9]">
                On the <span className="italic text-[#e63946]">rise</span><br />this week.
              </h2>
              <Link to="/discover" className="mono text-xs uppercase tracking-widest text-[#efe8d8] hover:text-[#e63946] transition border-b border-[#efe8d8]/40 pb-1 w-fit">
                Browse all creators →
              </Link>
            </div>
            <div className="flex gap-5 overflow-x-auto scroll-hidden pb-4 -mx-5 px-5 md:mx-0 md:px-0">
              {creators.map((c, i) => (
                <div key={c.id} className="min-w-[280px] max-w-[280px]">
                  <CreatorCard creator={c} index={i} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* LATEST CAMPAIGNS */}
      {campaigns.length > 0 && (
        <section className="max-w-7xl mx-auto px-5 md:px-10 py-12 md:py-20" data-testid="campaigns-section">
          <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-3">§ Open for applications</div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <h2 className="display text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9]">Fresh<br /><span className="italic text-[#e63946]">briefs.</span></h2>
            <Link to="/discover" className="inline-flex items-center gap-2 mono text-xs uppercase tracking-widest border-b border-[#0a0a0a] hover:opacity-70 transition pb-1 w-fit">
              Browse all <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-[#0a0a0a]">
            {campaigns.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                <Link to={`/campaigns/${c.id}`} className="group border-r border-b border-[#0a0a0a] p-6 flex flex-col justify-between min-h-[260px] hover:bg-[#0a0a0a] hover:text-[#efe8d8] transition-colors">
                  <div>
                    <div className="mono text-[9px] uppercase tracking-[0.25em] text-[#e63946] mb-3">{c.platform} · {c.target_niche}</div>
                    <h3 className="display text-2xl font-black leading-tight mb-2 group-hover:text-[#efe8d8]">{c.name}</h3>
                    <p className="text-xs text-[#0a0a0a]/60 group-hover:text-[#efe8d8]/60 line-clamp-2 leading-relaxed">{c.description}</p>
                  </div>
                  <div className="mt-4 space-y-1.5">
                    <div className="display text-2xl font-black text-[#e63946]">{formatINR(c.budget_min)}–{formatINR(c.budget_max)}</div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 mono text-[8px] uppercase tracking-widest text-[#7a7466] group-hover:text-[#efe8d8]/50">
                        <Calendar size={9} />{new Date(c.application_deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                      <span className="flex items-center gap-1 mono text-[8px] uppercase tracking-widest text-[#7a7466] group-hover:text-[#efe8d8]/50">
                        <Users size={9} />{c.applicant_count || 0} applied
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/auth?role=creator" className="inline-flex items-center gap-2 px-6 py-3.5 border border-[#0a0a0a] mono text-[10px] uppercase tracking-widest hover:bg-[#0a0a0a] hover:text-[#efe8d8] transition">
              Join as creator to apply →
            </Link>
          </div>
        </section>
      )}
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   MARKETING LANDING  (not logged in)
════════════════════════════════════════════════════════════════════════ */
function MarketingLanding({ heroRef, watermarkY, watermarkScale, creators, categories, campaigns, user }) {
  return (
    <div className="min-h-screen bg-[#efe8d8] text-[#0a0a0a]">
      <Navbar />
      <Ticker />

      {/* Simple create-account prompt at top */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className="fixed top-[34px] left-0 right-0 z-[45] flex justify-center pointer-events-none"
      >
        <div className="pointer-events-auto flex items-center gap-3 bg-[#0a0a0a] text-[#efe8d8] px-4 py-2 mx-4 mt-1.5 border border-[#0a0a0a] shadow-[3px_3px_0_0_#e63946]">
          <Link to="/auth?mode=signup" className="mono text-[10px] uppercase tracking-widest font-bold bg-[#e63946] text-[#efe8d8] px-3 py-1 hover:opacity-80 transition whitespace-nowrap">
            Create account — free
          </Link>
          <span className="text-[#efe8d8]/30 hidden sm:block">·</span>
          <Link to="/auth" className="mono text-[10px] uppercase tracking-widest text-[#efe8d8]/60 hover:text-[#efe8d8] transition whitespace-nowrap hidden sm:block">
            Sign in
          </Link>
        </div>
      </motion.div>

      {/* HERO */}
      <Hero heroRef={heroRef} watermarkY={watermarkY} watermarkScale={watermarkScale} user={user} ctaSlot={
        <div className="flex flex-wrap gap-3">
          <Link to="/auth?role=brand" className="inline-flex items-center gap-2 px-5 md:px-6 py-3 md:py-3.5 bg-[#0a0a0a] text-[#efe8d8] font-bold uppercase tracking-widest text-xs hover:bg-[#e63946] transition min-h-[44px]" data-testid="cta-brand">
            I'm a brand <ArrowUpRight size={14} />
          </Link>
          <Link to="/auth?role=creator" className="inline-flex items-center gap-2 px-5 md:px-6 py-3 md:py-3.5 border border-[#0a0a0a] text-[#0a0a0a] font-bold uppercase tracking-widest text-xs hover:bg-[#0a0a0a] hover:text-[#efe8d8] transition min-h-[44px]" data-testid="cta-creator">
            I'm a creator
          </Link>
          <Link
            to="/get-started"
            className="inline-flex items-center gap-2 px-5 md:px-6 py-3 md:py-3.5 bg-[#e63946] text-[#efe8d8] font-bold uppercase tracking-widest text-xs hover:opacity-80 transition min-h-[44px]"
          >
            Get started <ArrowUpRight size={14} />
          </Link>
        </div>
      } />

      {/* ── BUILT DIFFERENT ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 md:px-10 py-12 md:py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#0a0a0a]/40 mb-5">§ 01 — Why Noctra</div>
            <h2 className="display text-6xl md:text-8xl lg:text-[9rem] font-black leading-[0.9]">
              Built different.<br />
              <span className="italic">Actually.</span>
            </h2>
          </div>
          <p className="text-sm md:text-base text-[#0a0a0a]/65 max-w-xs leading-relaxed">
            Creator collabs in India have always been a mess. We fixed the four things that break every deal.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-l border-[#0a0a0a]">
          {[
            {
              icon: Ghost,
              num: "01",
              title: "No Ghosting",
              desc: "Creators can't ghost a brief. Brands can't ghost a payment. Every deal has a live status — visible to both sides, always.",
            },
            {
              icon: MessageCircleOff,
              num: "02",
              title: "No Cold DMs",
              desc: "Brands post a brief. Creators apply. Zero awkward outreach. Zero ignored messages. The deal finds the right people.",
            },
            {
              icon: ShieldCheck,
              num: "03",
              title: "Verified Payments",
              desc: "Deal value and deadline locked on-platform in INR. Payment tracked end-to-end. No chasing invoices. No FX nonsense.",
            },
            {
              icon: Flame,
              num: "04",
              title: "Live Deals",
              desc: "Real campaigns from real brands, updated daily. Apply instantly — no waiting on a reply that never comes.",
            },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="border-r border-b border-[#0a0a0a] p-5 md:p-8 flex flex-col justify-between min-h-[200px] md:min-h-[280px]"
              >
                <div className="flex items-start justify-between">
                  <span className="mono text-[10px] uppercase tracking-[0.25em] opacity-30">{f.num}</span>
                  <Icon size={16} strokeWidth={1.5} className="opacity-40" />
                </div>
                <div>
                  <h3 className="display text-2xl md:text-4xl font-black leading-tight mb-2">{f.title}</h3>
                  <p className="text-xs md:text-sm leading-relaxed text-[#0a0a0a]/55">{f.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── HOW IT WORKS — STEPPER ─────────────────────────────────────── */}
      <section className="py-12 md:py-20" data-testid="how-section">
        <div className="max-w-7xl mx-auto px-5 md:px-10 mb-10">
          <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#0a0a0a]/40 mb-5">§ 02 — How it works</div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h2 className="display text-6xl md:text-8xl lg:text-[9rem] font-black leading-[0.9]">
              Three steps.<br /><span className="italic">Zero chaos.</span>
            </h2>
            <p className="text-sm text-[#0a0a0a]/60 max-w-xs leading-relaxed">
              Click through the full flow — from finding a creator to getting the content delivered.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-5 md:px-10">
          <Stepper
            stepTitles={["Discover", "Connect", "Get Paid"]}
            backButtonText="← Previous"
            nextButtonText="Next step →"
            onFinalStepCompleted={() => {}}
          >
            <Step>
              <div className="max-w-2xl">
                <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#0a0a0a]/30 mb-6">Step 01</div>
                <h3 className="display text-5xl md:text-6xl font-black leading-none mb-5">Find the right creators.</h3>
                <p className="text-sm md:text-base text-[#0a0a0a]/60 leading-relaxed mb-6">
                  Browse verified creators by niche, city, follower count and engagement rate. Every profile carries a Trust Score built from real delivery history — so you know who actually delivers before you spend a rupee.
                </p>
                <Link to="/discover" className="inline-flex items-center gap-1.5 mono text-[10px] uppercase tracking-widest border-b border-[#0a0a0a] pb-0.5 hover:text-[#e63946] hover:border-[#e63946] transition">
                  Browse creators <ArrowUpRight size={10} />
                </Link>
              </div>
            </Step>

            <Step>
              <div className="max-w-2xl">
                <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#0a0a0a]/30 mb-6">Step 02</div>
                <h3 className="display text-5xl md:text-6xl font-black leading-none mb-5">Lock the deal, on-platform.</h3>
                <p className="text-sm md:text-base text-[#0a0a0a]/60 leading-relaxed mb-6">
                  Post a brief or apply to one. Negotiate deliverables, timelines and budget — all inside Noctra. No cold DMs, no WhatsApp threads, no "seen" with no reply. When both sides agree, the deal is locked and tracked.
                </p>
                <Link to="/auth?role=brand" className="inline-flex items-center gap-1.5 mono text-[10px] uppercase tracking-widest border-b border-[#0a0a0a] pb-0.5 hover:text-[#e63946] hover:border-[#e63946] transition">
                  Post a brief <ArrowUpRight size={10} />
                </Link>
              </div>
            </Step>

            <Step>
              <div className="max-w-2xl">
                <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#0a0a0a]/30 mb-6">Step 03</div>
                <h3 className="display text-5xl md:text-6xl font-black leading-none mb-5">Content approved. Payment done.</h3>
                <p className="text-sm md:text-base text-[#0a0a0a]/60 leading-relaxed mb-6">
                  Creator submits content. Brand reviews and approves. Payment is tracked end-to-end on Noctra in INR — no chasing invoices, no payment surprises. Both sides get a full record, every time.
                </p>
                <Link to="/auth?role=creator" className="inline-flex items-center gap-1.5 mono text-[10px] uppercase tracking-widest border-b border-[#0a0a0a] pb-0.5 hover:text-[#e63946] hover:border-[#e63946] transition">
                  Join as creator <ArrowUpRight size={10} />
                </Link>
              </div>
            </Step>
          </Stepper>
        </div>
      </section>

      {/* ── OUR SERVICES ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 md:px-10 py-12 md:py-20">
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#0a0a0a]/40 mb-5">§ 03 — Our services</div>
        <h2 className="display text-6xl md:text-8xl lg:text-[9rem] font-black leading-[0.9] mb-12">
          One platform.<br /><span className="italic">Three paths.</span>
        </h2>

        <div className="grid md:grid-cols-3 border-t border-l border-[#0a0a0a]">
          {[
            {
              title: "For Brands",
              bg: "bg-[#f4c542]", fg: "text-[#0a0a0a]",
              points: ["Browse verified creators by niche & city", "Post a brief — creators apply to you", "Track every deal from brief to final cut", "INR budgets, no FX surprises"],
              cta: "Start as brand", to: "/auth?role=brand",
            },
            {
              title: "For Creators",
              bg: "bg-[#e63946]", fg: "text-[#efe8d8]",
              points: ["Get discovered without cold DMing brands", "Apply to real campaigns with real budgets", "Negotiate terms in one place", "Get paid once content is approved"],
              cta: "Join as creator", to: "/auth?role=creator",
            },
            {
              title: "For Editors & Pros",
              bg: "bg-[#0a0a0a]", fg: "text-[#efe8d8]",
              points: ["List your services — video, reels, SMM", "Set your own rates", "Connect with creators and brands who need you", "Get credited for every project"],
              cta: "List your services", to: "/services",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`${item.bg} ${item.fg} border-r border-b border-[#0a0a0a] p-8 md:p-10 flex flex-col justify-between min-h-[360px]`}
            >
              <div>
                <h3 className="display text-3xl md:text-4xl font-black leading-none mb-5">{item.title}<span className="italic">.</span></h3>
                <ul className="space-y-2">
                  {item.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2 text-xs md:text-sm leading-relaxed opacity-85">
                      <span className="text-current mt-0.5 shrink-0">—</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link to={item.to} className="mt-6 inline-flex items-center gap-1.5 mono text-[10px] uppercase tracking-widest border-b pb-0.5 w-fit border-current hover:opacity-70 transition">
                {item.cta} <ArrowUpRight size={11} />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── DISCOVERY SECTIONS (visible to all) ───────────────────────── */}

      {/* FINAL CTA */}
      <section className="py-12 md:py-20 text-center px-5" data-testid="final-cta">
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-3">§ Ready to start?</div>
        <h2 className="display text-[2.75rem] sm:text-8xl lg:text-[9rem] leading-[0.85] font-black max-w-5xl mx-auto">
          Let's build<br />something<br /><span className="italic text-[#e63946]">stupid good</span>.
        </h2>
        <div className="mt-10 flex flex-wrap gap-3 justify-center">
          <Link to="/auth?role=brand" className="inline-flex items-center gap-2 px-6 md:px-8 py-3.5 md:py-4 bg-[#0a0a0a] text-[#efe8d8] font-bold uppercase tracking-widest text-xs hover:bg-[#e63946] transition min-h-[44px]">
            Get started — I'm a brand <ArrowUpRight size={14} />
          </Link>
          <Link to="/auth?role=creator" className="inline-flex items-center gap-2 px-6 md:px-8 py-3.5 md:py-4 border border-[#0a0a0a] font-bold uppercase tracking-widest text-xs hover:bg-[#0a0a0a] hover:text-[#efe8d8] transition min-h-[44px]">
            Get started — I'm a creator
          </Link>
        </div>
      </section>

      <Footer />
      <BottomNav />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   DISCOVERY LANDING  (logged in — exact current layout)
════════════════════════════════════════════════════════════════════════ */
function DiscoveryLanding({ heroRef, watermarkY, watermarkScale, creators, categories, campaigns, user }) {
  return (
    <div className="min-h-screen bg-[#efe8d8] text-[#0a0a0a]">
      <Navbar />
      <Ticker />

      <Hero heroRef={heroRef} watermarkY={watermarkY} watermarkScale={watermarkScale} user={user} ctaSlot={
        <div className="flex flex-wrap gap-3">
          <Link to="/auth?role=brand" className="inline-flex items-center gap-2 px-5 md:px-6 py-3 md:py-3.5 bg-[#0a0a0a] text-[#efe8d8] font-bold uppercase tracking-widest text-xs hover:bg-[#e63946] transition min-h-[44px]" data-testid="cta-brand">
            I'm a brand <ArrowUpRight size={14} />
          </Link>
          <Link to="/auth?role=creator" className="inline-flex items-center gap-2 px-5 md:px-6 py-3 md:py-3.5 border border-[#0a0a0a] text-[#0a0a0a] font-bold uppercase tracking-widest text-xs hover:bg-[#0a0a0a] hover:text-[#efe8d8] transition min-h-[44px]" data-testid="cta-creator">
            I'm a creator
          </Link>
        </div>
      } />

      <DiscoverySections creators={creators} categories={categories} campaigns={campaigns} />

      {/* HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-5 md:px-10 py-12 md:py-20" data-testid="how-section">
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-3">§ 04 — How it works</div>
        <h2 className="display text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] mb-12 max-w-4xl">
          Three steps.<br />Zero <span className="italic text-[#e63946]">chaos</span>.
        </h2>
        <div className="grid md:grid-cols-3 gap-0 border-t border-[#0a0a0a]">
          {[
            { num: "01", title: "Discover", desc: "Browse creators by niche, city, engagement rate and price. Trust score badges show you who delivers.", bg: "bg-[#efe8d8]" },
            { num: "02", title: "Connect",  desc: "Send a collab brief directly on the platform. Negotiate, agree on deliverables, and lock the deal.", bg: "bg-[#f4c542]" },
            { num: "03", title: "Get paid", desc: "Creator submits content, brand approves it. Payment is settled and tracked on Noctra for full accountability.", bg: "bg-[#e63946] text-[#efe8d8]" },
          ].map((s, i) => (
            <motion.div key={s.num} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className={`${s.bg} border-r border-b border-[#0a0a0a] p-6 md:p-8 min-h-[240px] flex flex-col justify-between`}
            >
              <div className="display text-8xl font-black leading-none">{s.num}</div>
              <div>
                <h3 className="display text-4xl md:text-5xl font-black leading-none mb-3">{s.title}<span className="italic">.</span></h3>
                <p className="text-sm md:text-base max-w-xs leading-relaxed opacity-90">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section className="max-w-7xl mx-auto px-5 md:px-10 py-12 md:py-20" data-testid="about-section">
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-3">§ 05 — About Noctra</div>
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-start mb-16">
          <div>
            <h2 className="display text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9]">
              Built for the<br /><span className="italic text-[#e63946]">creator</span><br />generation.
            </h2>
          </div>
          <div className="space-y-5 pt-1">
            <p className="text-base md:text-lg text-[#0a0a0a]/80 leading-relaxed">Noctra is India's end-to-end creator collaboration platform, a place where brands find the right voices, and creators find deals worth their time. No cold DMs. No chasing invoices. Just clean, direct collabs.</p>
            <p className="text-base md:text-lg text-[#0a0a0a]/80 leading-relaxed">We started with a simple observation that India has millions of creators who are seriously good at what they do, and thousands of brands that genuinely want to work with them, but no infrastructure that makes it feel human. Noctra is that infrastructure.</p>
            <div className="pt-2"><div className="mono text-[10px] uppercase tracking-[0.3em] text-[#7a7466]">Founded 2026 · Remote-first · Made in India</div></div>
          </div>
        </div>
        <div className="grid md:grid-cols-3 border-t border-l border-[#0a0a0a]">
          {[
            { title: "For Brands",         bg: "bg-[#f4c542]", fg: "",               desc: "Browse verified creators by niche, city, engagement rate and budget.", cta: "Start as brand →",       to: "/auth?role=brand" },
            { title: "For Creators",       bg: "bg-[#e63946]", fg: "text-[#efe8d8]", desc: "Get discovered by brands that fit your audience. Apply to campaigns, negotiate terms, and get paid once the brand approves.", cta: "Join as creator →",    to: "/auth?role=creator" },
            { title: "For Editors & Pros", bg: "bg-[#0a0a0a]", fg: "text-[#efe8d8]", desc: "Video editors, reel cutters, social media managers. List your services, set your rates, and connect with creators and brands who need the skill.", cta: "List your services →", to: "/services" },
          ].map((item, i) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className={`${item.bg} ${item.fg || "text-[#0a0a0a]"} border-r border-b border-[#0a0a0a] p-8 md:p-10 flex flex-col justify-between min-h-[320px]`}
            >
              <div>
                <h3 className="display text-3xl md:text-4xl font-black leading-none mb-4">{item.title}<span className="italic">.</span></h3>
                <p className="text-sm md:text-base leading-relaxed opacity-90 max-w-xs">{item.desc}</p>
              </div>
              <Link to={item.to} className={`mt-6 inline-flex items-center gap-1.5 mono text-[10px] uppercase tracking-widest border-b pb-0.5 w-fit ${item.fg ? "border-current" : "border-[#0a0a0a]"} hover:opacity-70 transition`}>
                {item.cta} <ArrowUpRight size={11} />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-12 md:py-20 text-center px-5" data-testid="final-cta">
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-3">§ Ready to start?</div>
        <h2 className="display text-[2.75rem] sm:text-8xl lg:text-[9rem] leading-[0.85] font-black max-w-5xl mx-auto">
          Let's build<br />something<br /><span className="italic text-[#e63946]">stupid good</span>.
        </h2>
        <div className="mt-10 flex flex-wrap gap-3 justify-center">
          <Link to="/auth?role=brand" className="inline-flex items-center gap-2 px-6 md:px-7 py-3.5 md:py-4 bg-[#0a0a0a] text-[#efe8d8] font-bold uppercase tracking-widest text-xs hover:bg-[#e63946] transition min-h-[44px]">
            Join as brand <Plus size={14} />
          </Link>
          <Link to="/auth?role=creator" className="inline-flex items-center gap-2 px-6 md:px-7 py-3.5 md:py-4 border border-[#0a0a0a] font-bold uppercase tracking-widest text-xs hover:bg-[#0a0a0a] hover:text-[#efe8d8] transition min-h-[44px]">
            Join as creator
          </Link>
        </div>
      </section>

      <Footer />
      <BottomNav />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   ROOT — splits on auth state
════════════════════════════════════════════════════════════════════════ */
export default function Landing() {
  const user = getUser();
  const [creators, setCreators] = useState([]);
  const [categories, setCategories] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const watermarkY = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);
  const watermarkScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  useEffect(() => {
    getCreators({ limit: 8 }).then(setCreators).catch(() => {});
    getCategories().then(setCategories).catch(() => {});
    getCampaigns({ limit: 4, sort: "newest" }).then(setCampaigns).catch(() => {});
  }, []);

  const sharedProps = { heroRef, watermarkY, watermarkScale, creators, categories, campaigns, user };

  return user
    ? <DiscoveryLanding {...sharedProps} />
    : <MarketingLanding {...sharedProps} />;
}
