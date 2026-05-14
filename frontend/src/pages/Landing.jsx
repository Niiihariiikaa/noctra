import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Plus, Dumbbell, Shirt, UtensilsCrossed, Cpu, Coffee, Plane, Clapperboard, Megaphone, Star, Calendar, Users } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";
import CreatorCard from "../components/common/CreatorCard";
import IridescentWordmark from "../components/common/IridescentWordmark";
import { getCreators, getCategories, getCampaigns } from "../lib/api";
import { formatFollowers, formatINR } from "../lib/format";

const ICONS = { Dumbbell, Shirt, UtensilsCrossed, Cpu, Coffee, Plane, Clapperboard, Megaphone };

const STATIC_CATEGORIES = [
  { slug: "fashion", name: "Fashion", icon: "Shirt" },
  { slug: "fitness", name: "Fitness", icon: "Dumbbell" },
  { slug: "food", name: "Food", icon: "UtensilsCrossed" },
  { slug: "tech", name: "Tech", icon: "Cpu" },
  { slug: "lifestyle", name: "Lifestyle", icon: "Coffee" },
  { slug: "travel", name: "Travel", icon: "Plane" },
  { slug: "video-editors", name: "Video Editing", icon: "Clapperboard" },
  { slug: "smm", name: "Social Media", icon: "Megaphone" },
];

const STATIC_CREATORS = [
  { id: "demo-1", name: "Anika Sharma", niche: "Fashion", city: "Mumbai", followers: 280000, engagement_rate: 4.8, trust_score: 92, bio: "Slow fashion advocate & style storyteller. Partnered with 40+ brands across India.", pricing: { reel: 45000 }, avatar: "https://i.pravatar.cc/400?img=47" },
  { id: "demo-2", name: "Rohan Mehta", niche: "Fitness", city: "Bangalore", followers: 185000, engagement_rate: 6.2, trust_score: 87, bio: "NASM-certified coach turning gym science into 60-second gold.", pricing: { reel: 30000 }, avatar: "https://i.pravatar.cc/400?img=12" },
  { id: "demo-3", name: "Priya Nair", niche: "Food", city: "Hyderabad", followers: 320000, engagement_rate: 5.5, trust_score: 95, bio: "Regional recipes, global reach. 3.2M reel views in 2025.", pricing: { reel: 55000 }, avatar: "https://i.pravatar.cc/400?img=32" },
  { id: "demo-4", name: "Kabir Verma", niche: "Tech", city: "Pune", followers: 140000, engagement_rate: 7.1, trust_score: 89, bio: "Breaking down AI & gadgets for the everyday curious mind.", pricing: { reel: 25000 }, avatar: "https://i.pravatar.cc/400?img=53" },
  { id: "demo-5", name: "Zara Khan", niche: "Lifestyle", city: "Delhi NCR", followers: 210000, engagement_rate: 4.3, trust_score: 83, bio: "Curating the art of living well on a budget. Wellness meets aesthetic.", pricing: { reel: 35000 }, avatar: "https://i.pravatar.cc/400?img=44" },
  { id: "demo-6", name: "Dev Patel", niche: "Travel", city: "Jaipur", followers: 95000, engagement_rate: 8.4, trust_score: 78, bio: "Off-the-map India explorer. 28 states, 200+ locations documented.", pricing: { reel: 18000 }, avatar: "https://i.pravatar.cc/400?img=17" },
  { id: "demo-7", name: "Meera Iyer", niche: "Fashion", city: "Chennai", followers: 155000, engagement_rate: 5.9, trust_score: 91, bio: "South Indian heritage through a modern lens. Sarees to streetwear.", pricing: { reel: 28000 }, avatar: "https://i.pravatar.cc/400?img=25" },
  { id: "demo-8", name: "Arjun Singh", niche: "Fitness", city: "Chandigarh", followers: 75000, engagement_rate: 9.2, trust_score: 80, bio: "Powerlifting, nutrition, real talk. No filters, no shortcuts.", pricing: { reel: 15000 }, avatar: "https://i.pravatar.cc/400?img=8" },
];

export default function Landing() {
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

  return (
    <div className="min-h-screen bg-[#efe8d8] text-[#0a0a0a]">
      <Navbar />

      {/* Ticker strip top */}
      <div className="fixed top-0 left-0 right-0 z-40 border-b border-[#0a0a0a] bg-[#efe8d8]/95 backdrop-blur-sm overflow-hidden mono text-[10px] uppercase tracking-[0.25em]" data-testid="ticker-bar">
        <div className="flex ticker-track whitespace-nowrap py-2 pl-[140px]">
          {Array.from({ length: 2 }).map((_, dup) => (
            <div key={dup} className="flex items-center gap-6 pr-6">
              <span className="text-[#e63946]">◆ Now Live</span>
              <span>/</span>
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

      {/* HERO */}
      <section ref={heroRef} className="relative min-h-screen pt-4 md:pt-6 pb-20">
        {/* Logo watermark — parallax */}
        <motion.div
          style={{ y: watermarkY, scale: watermarkScale }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
        >
          <img src="/brand/logo.svg" alt="" aria-hidden="true" className="w-[82%] max-w-5xl opacity-[0.05]" />
        </motion.div>
        {/* Iridescent 3D decorative NOCTRA */}

        {/* Vertical label left */}
        <div className="hidden md:block absolute left-6 top-1/2 -translate-y-1/2 vertical-text text-[#0a0a0a]">
          Collaborative Hub · Est. 2026 · Made in India
        </div>
        {/* Vertical label right */}
        <div className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 vertical-text text-[#e63946]" style={{ transform: "rotate(0deg)", writingMode: "vertical-rl" }}>
          Scroll to explore — Featured creators below
        </div>

        {/* Scroll dot indicator */}
        <div className="hidden md:flex absolute right-12 top-1/2 -translate-y-1/2 flex-col scroll-dots">
          {Array.from({ length: 10 }).map((_, i) => <span key={i} />)}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-10 h-full flex flex-col justify-end pt-[12vh] md:pt-[16vh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-4"
          >
            § Where brands meet creators
          </motion.div>

          <h1 className="display text-[3.5rem] sm:text-8xl lg:text-[11rem] leading-[0.85] font-black tracking-tighter" data-testid="hero-headline">
            <div className="reveal-mask block">
              <motion.span
                initial={{ y: "110%" }} animate={{ y: 0 }}
                transition={{ delay: 0.5, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
                className="block"
              >Let's make</motion.span>
            </div>
            <div className="reveal-mask block">
              <motion.span
                initial={{ y: "110%" }} animate={{ y: 0 }}
                transition={{ delay: 0.65, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
                className="block"
              >
                something
              </motion.span>
            </div>
            <div className="reveal-mask block">
              <motion.span
                initial={{ y: "110%" }} animate={{ y: 0 }}
                transition={{ delay: 0.8, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
                className="block"
              >
                <span className="italic text-[#e63946]">stupid</span> good<span className="text-[#e63946]">.</span>
              </motion.span>
            </div>
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05 }}
            className="grid md:grid-cols-[1fr_auto] gap-6 md:gap-10 items-end mt-8 md:mt-10"
          >
            <p className="text-sm md:text-lg max-w-md text-[#0a0a0a]/75 leading-relaxed">
              India's creator deal marketplace. Brands find the right creators, creators find deals worth their time. No cold DMs, no chasing payments<span className="text-[#e63946]">.</span>
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/auth?role=brand"
                className="inline-flex items-center gap-2 px-5 md:px-6 py-3 md:py-3.5 bg-[#0a0a0a] text-[#efe8d8] font-bold uppercase tracking-widest text-xs hover:bg-[#e63946] transition min-h-[44px]"
                data-testid="cta-brand"
              >
                I'm a brand <ArrowUpRight size={14} />
              </Link>
              <Link
                to="/auth?role=creator"
                className="inline-flex items-center gap-2 px-5 md:px-6 py-3 md:py-3.5 border border-[#0a0a0a] text-[#0a0a0a] font-bold uppercase tracking-widest text-xs hover:bg-[#0a0a0a] hover:text-[#efe8d8] transition min-h-[44px]"
                data-testid="cta-creator"
              >
                I'm a creator
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="bg-[#e63946] text-[#efe8d8] py-24 md:py-32 relative" data-testid="categories-section">
        <div className="max-w-7xl mx-auto px-5 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#efe8d8]/70 mb-3">§ 01 — Browse by craft</div>
            <h2 className="display text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9]">
              Find your<br/><span className="italic">people</span>.
            </h2>
          </div>
          <Link to="/discover" className="inline-flex items-center gap-2 mono text-xs uppercase tracking-widest border-b border-[#efe8d8] hover:opacity-70 transition pb-1">
            Explore all <ArrowUpRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-l border-[#efe8d8]/40">
          {(categories.length ? categories : STATIC_CATEGORIES).map((cat, i) => {
            const Icon = ICONS[cat.icon] || Star;
            return (
              <motion.div
                key={cat.slug}
                whileHover={{ backgroundColor: "#efe8d8", color: "#0a0a0a" }}
                transition={{ duration: 0.2 }}
                className="group border-r border-b border-[#efe8d8]/40 aspect-square relative overflow-hidden"
              >
                <Link
                  to={cat.slug === "video-editors" || cat.slug === "smm" ? "/services" : `/discover?niche=${cat.name}`}
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
      <section className="bg-[#0a0a0a] text-[#efe8d8] py-24 md:py-32 relative overflow-hidden" data-testid="featured-section">
        <div className="absolute top-6 left-6 mono text-[10px] uppercase tracking-[0.3em] text-[#e63946]">§ 02 — Featured</div>
        <div className="max-w-7xl mx-auto px-5 md:px-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <h2 className="display text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9]">
              On the <span className="italic text-[#e63946]">rise</span><br/>
              this week.
            </h2>
            <Link to="/discover" className="mono text-xs uppercase tracking-widest text-[#efe8d8] hover:text-[#e63946] transition border-b border-[#efe8d8]/40 pb-1 w-fit">
              Browse all creators →
            </Link>
          </div>

          {/* horizontal scroll */}
          <div className="flex gap-5 overflow-x-auto scroll-hidden pb-4 -mx-5 px-5 md:mx-0 md:px-0">
            {(creators.length ? creators : STATIC_CREATORS).map((c, i) => (
              <div key={c.id} className="min-w-[280px] max-w-[280px]">
                <CreatorCard creator={c} index={i} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LATEST CAMPAIGNS */}
      {campaigns.length > 0 && (
        <section className="max-w-7xl mx-auto px-5 md:px-10 py-24 md:py-32" data-testid="campaigns-section">
          <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-3">§ 03 — Open for applications</div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <h2 className="display text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9]">
              Fresh<br /><span className="italic text-[#e63946]">briefs.</span>
            </h2>
            <Link to="/discover" className="inline-flex items-center gap-2 mono text-xs uppercase tracking-widest border-b border-[#0a0a0a] hover:opacity-70 transition pb-1 w-fit">
              Browse all <ArrowUpRight size={12} />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-[#0a0a0a]">
            {campaigns.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
              >
                <Link
                  to={`/campaigns/${c.id}`}
                  className="group border-r border-b border-[#0a0a0a] p-6 flex flex-col justify-between min-h-[260px] hover:bg-[#0a0a0a] hover:text-[#efe8d8] transition-colors block"
                >
                  <div>
                    <div className="mono text-[9px] uppercase tracking-[0.25em] text-[#e63946] mb-3">{c.platform} · {c.target_niche}</div>
                    <h3 className="display text-2xl font-black leading-tight mb-2 group-hover:text-[#efe8d8]">{c.name}</h3>
                    <p className="text-xs text-[#0a0a0a]/60 group-hover:text-[#efe8d8]/60 line-clamp-2 leading-relaxed">{c.description}</p>
                  </div>
                  <div className="mt-4 space-y-1.5">
                    <div className="display text-2xl font-black text-[#e63946]">{formatINR(c.budget_min)}–{formatINR(c.budget_max)}</div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 mono text-[8px] uppercase tracking-widest text-[#7a7466] group-hover:text-[#efe8d8]/50">
                        <Calendar size={9} />
                        {new Date(c.application_deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                      <span className="flex items-center gap-1 mono text-[8px] uppercase tracking-widest text-[#7a7466] group-hover:text-[#efe8d8]/50">
                        <Users size={9} />
                        {c.applicant_count || 0} applied
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/auth?role=creator"
              className="inline-flex items-center gap-2 px-6 py-3.5 border border-[#0a0a0a] mono text-[10px] uppercase tracking-widest hover:bg-[#0a0a0a] hover:text-[#efe8d8] transition"
            >
              Join as creator to apply →
            </Link>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-5 md:px-10 py-24 md:py-32" data-testid="how-section">
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-3">§ 04 — How it works</div>
        <h2 className="display text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] mb-12 max-w-4xl">
          Three steps.<br/>Zero <span className="italic text-[#e63946]">chaos</span>.
        </h2>

        <div className="grid md:grid-cols-3 gap-0 border-t border-[#0a0a0a]">
          {[
            { num: "01", title: "Discover", desc: "Browse creators by niche, city, engagement rate and price. Trust score badges show you who delivers.", bg: "bg-[#efe8d8]" },
            { num: "02", title: "Connect", desc: "Send a collab brief directly on the platform. Negotiate, agree on deliverables, and lock the deal.", bg: "bg-[#f4c542]" },
            { num: "03", title: "Get paid", desc: "Creator submits content, brand approves it. Payment is settled directly — tracked on Noctra for accountability.", bg: "bg-[#e63946] text-[#efe8d8]" },
          ].map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`${s.bg} border-r border-b border-[#0a0a0a] p-8 md:p-10 min-h-[360px] flex flex-col justify-between`}
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

      {/* ABOUT US */}
      <section className="max-w-7xl mx-auto px-5 md:px-10 py-24 md:py-32" data-testid="about-section">
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-3">§ 05 — About Noctra</div>

        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-start mb-16">
          <div>
            <h2 className="display text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9]">
              Built for the<br/><span className="italic text-[#e63946]">creator</span><br/>generation.
            </h2>
          </div>
          <div className="space-y-5 pt-1">
            <p className="text-base md:text-lg text-[#0a0a0a]/80 leading-relaxed">
              Noctra is India's end-to-end creator collaboration platform — a place where brands find the right voices, and creators find deals worth their time. No cold DMs. No chasing invoices. Just clean, direct collabs.
            </p>
            <p className="text-base md:text-lg text-[#0a0a0a]/80 leading-relaxed">
              We started with a simple observation: India has millions of creators who are seriously good at what they do, and thousands of brands that genuinely want to work with them — but no infrastructure that makes it feel human. Noctra is that infrastructure.
            </p>
            <p className="text-base md:text-lg text-[#0a0a0a]/80 leading-relaxed">
              Every creator on the platform carries a <span className="font-bold text-[#0a0a0a]">Trust Score</span> — built from delivery history, engagement authenticity and brand feedback. Every deal is tracked end-to-end, so brands and creators always know exactly where things stand.
            </p>
            <div className="pt-2">
              <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#7a7466]">Founded 2026 · Remote-first · Made in India</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 border-t border-l border-[#0a0a0a]">
          {[
            {
              title: "For Brands",
              bg: "bg-[#f4c542]",
              desc: "Browse verified creators by niche, city, engagement rate and budget. Send a collab brief in minutes. Track every deal from first request to delivery — all in one dashboard.",
              cta: "Start as brand →",
              to: "/auth?role=brand",
            },
            {
              title: "For Creators",
              bg: "bg-[#e63946]",
              fg: "text-[#efe8d8]",
              desc: "Get discovered by brands that fit your audience. Apply to campaigns, negotiate terms, and get paid once the brand approves your content. No middlemen, no delays.",
              cta: "Join as creator →",
              to: "/auth?role=creator",
            },
            {
              title: "For Editors & Pros",
              bg: "bg-[#0a0a0a]",
              fg: "text-[#efe8d8]",
              desc: "Video editors, reel cutters, social media managers — list your services, set your rates, and connect with creators and brands who need the skill behind the content.",
              cta: "List your services →",
              to: "/services",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`${item.bg} ${item.fg || "text-[#0a0a0a]"} border-r border-b border-[#0a0a0a] p-8 md:p-10 flex flex-col justify-between min-h-[320px]`}
            >
              <div>
                <h3 className="display text-3xl md:text-4xl font-black leading-none mb-4">{item.title}<span className="italic">.</span></h3>
                <p className="text-sm md:text-base leading-relaxed opacity-90 max-w-xs">{item.desc}</p>
              </div>
              <Link
                to={item.to}
                className={`mt-6 inline-flex items-center gap-1.5 mono text-[10px] uppercase tracking-widest border-b pb-0.5 w-fit ${item.fg ? "border-current" : "border-[#0a0a0a]"} hover:opacity-70 transition`}
              >
                {item.cta} <ArrowUpRight size={11} />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 md:py-32 text-center px-5" data-testid="final-cta">
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-3">§ Ready to start?</div>
        <h2 className="display text-[2.75rem] sm:text-8xl lg:text-[9rem] leading-[0.85] font-black max-w-5xl mx-auto">
          Your next<br/>collab starts<br/><span className="italic text-[#e63946]">here</span>.
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
