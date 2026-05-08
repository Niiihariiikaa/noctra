import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Briefcase, Sparkles, Scissors, ArrowUpRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";
import { register, login, getUser } from "../lib/auth";

const ROLES = [
  { key: "brand", label: "Brand", desc: "Hire creators, run campaigns, track every deal in one pipeline.", icon: Briefcase, color: "bg-[#f4c542]" },
  { key: "creator", label: "Creator", desc: "Get discovered, accept escrow-secured deals, and get paid fast.", icon: Sparkles, color: "bg-[#e63946] text-[#efe8d8]" },
  { key: "editor", label: "Editor / Pro", desc: "List your craft — video editing, reels, social management.", icon: Scissors, color: "bg-[#0a0a0a] text-[#efe8d8]" },
];

const NICHES = ["Fashion", "Fitness", "Food", "Tech", "Lifestyle", "Travel", "Beauty", "Gaming"];

export default function Auth() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get("mode") === "login" ? "login" : "register");
  const [role, setRole] = useState(params.get("role") || "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [instagramUsername, setInstagramUsername] = useState("");
  const [niche, setNiche] = useState("");
  const [industry, setIndustry] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const existing = getUser();

  const redirect = (userRole) => {
    if (userRole === "brand") navigate("/dashboard/brand");
    else if (userRole === "creator") navigate("/dashboard/creator");
    else navigate("/services");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (mode === "register" && !role) return toast.error("Pick a role first");
    if (!email || !password) return toast.error("Email and password required");
    if (mode === "register" && !name) return toast.error("Name required");
    if (mode === "register" && role === "creator" && !instagramUsername) return toast.error("Instagram username required");
    if (mode === "register" && role === "creator" && !niche) return toast.error("Pick your niche");
    setSubmitting(true);
    try {
      let user;
      if (mode === "register") {
        user = await register({ name, email, password, role, instagram_username: instagramUsername, niche, industry });
        toast.success(`Welcome to Noctra, ${user.name}!`);
      } else {
        user = await login({ email, password });
        toast.success(`Welcome back, ${user.name}!`);
      }
      redirect(user.role);
    } catch (err) {
      const msg = err?.response?.data?.detail || "Something went wrong";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#efe8d8] text-[#0a0a0a]" data-testid="auth-page">
      <Navbar />
      <section className="max-w-6xl mx-auto px-5 md:px-10 py-12">
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-3">§ Join the hub</div>
        <h1 className="display text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9]">
          {existing
            ? <>Switch your<br /><span className="italic text-[#e63946]">role</span>.</>
            : mode === "login"
              ? <>Welcome<br /><span className="italic text-[#e63946]">back</span>.</>
              : <>Pick your<br /><span className="italic text-[#e63946]">side</span>.</>
          }
        </h1>

        {/* Mode toggle */}
        <div className="flex gap-0 mt-10 border border-[#0a0a0a] w-fit">
          {["register", "login"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-6 py-2.5 mono text-[10px] uppercase tracking-widest font-bold transition-colors ${mode === m ? "bg-[#0a0a0a] text-[#efe8d8]" : "bg-transparent text-[#0a0a0a] hover:bg-[#e8e0cd]"}`}
            >
              {m === "register" ? "Create account" : "Sign in"}
            </button>
          ))}
        </div>

        {/* Role picker — only for registration */}
        {mode === "register" && (
          <div className="grid md:grid-cols-3 mt-10 border-t border-l border-[#0a0a0a]" data-testid="role-picker">
            {ROLES.map((r, i) => {
              const Icon = r.icon;
              const active = role === r.key;
              return (
                <motion.button
                  key={r.key}
                  whileHover={{ y: -3 }}
                  onClick={() => setRole(r.key)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`text-left border-r border-b border-[#0a0a0a] p-7 md:p-9 min-h-[220px] relative ${r.color} ${active ? "ring-4 ring-inset ring-[#e63946]" : ""}`}
                  data-testid={`role-${r.key}`}
                >
                  <Icon size={28} strokeWidth={1.6} />
                  <h3 className="display text-3xl md:text-4xl font-black leading-none mt-6">{r.label}<span className="italic">.</span></h3>
                  <p className="text-sm leading-relaxed mt-3 max-w-xs opacity-90">{r.desc}</p>
                  <div className="mono text-[10px] uppercase tracking-widest mt-6 inline-flex items-center gap-1">
                    {active ? "Selected" : "Select"} <ArrowUpRight size={11} />
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Form */}
        {(mode === "login" || role) && (
          <motion.form
            onSubmit={onSubmit}
            key={mode}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 max-w-xl border border-[#0a0a0a] p-6 md:p-8 bg-[#efe8d8]"
            data-testid="auth-form"
          >
            <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-2">
              {mode === "register" ? `Continue as ${role}` : "Sign in to your account"}
            </div>
            <h2 className="display text-3xl font-black mb-6">
              {mode === "register" ? "Create your account." : "Welcome back."}
            </h2>

            {mode === "register" && (
              <Field label="Name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-transparent border border-[#0a0a0a] px-3 py-3 text-sm focus:outline-none focus:bg-[#e8e0cd]"
                  data-testid="name-input"
                />
              </Field>
            )}

            {mode === "register" && role === "creator" && (
              <>
                <Field label="Instagram Username">
                  <div className="flex items-center border border-[#0a0a0a] focus-within:bg-[#e8e0cd]">
                    <span className="px-3 py-3 text-sm text-[#7a7466] border-r border-[#0a0a0a] select-none">@</span>
                    <input
                      value={instagramUsername}
                      onChange={(e) => setInstagramUsername(e.target.value.replace(/^@/, ""))}
                      placeholder="your_handle"
                      className="flex-1 bg-transparent px-3 py-3 text-sm focus:outline-none"
                      data-testid="instagram-input"
                    />
                  </div>
                </Field>
                <Field label="Your Niche">
                  <select
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className="w-full bg-transparent border border-[#0a0a0a] px-3 py-3 text-sm focus:outline-none focus:bg-[#e8e0cd] appearance-none cursor-pointer"
                    data-testid="niche-input"
                  >
                    <option value="">Select a niche</option>
                    {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </Field>
              </>
            )}

            {mode === "register" && role === "brand" && (
              <Field label="Industry">
                <input
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Fashion, Tech, Food, Beauty…"
                  className="w-full bg-transparent border border-[#0a0a0a] px-3 py-3 text-sm focus:outline-none focus:bg-[#e8e0cd]"
                  data-testid="industry-input"
                />
              </Field>
            )}

            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-transparent border border-[#0a0a0a] px-3 py-3 text-sm focus:outline-none focus:bg-[#e8e0cd]"
                data-testid="email-input"
              />
            </Field>

            <Field label="Password">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "Min. 8 characters" : "Your password"}
                  className="w-full bg-transparent border border-[#0a0a0a] px-3 py-3 pr-10 text-sm focus:outline-none focus:bg-[#e8e0cd]"
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a7466] hover:text-[#0a0a0a]"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 px-4 py-3.5 bg-[#0a0a0a] text-[#efe8d8] font-bold uppercase tracking-widest text-xs hover:bg-[#e63946] disabled:opacity-50 transition-colors"
              data-testid="auth-submit"
            >
              {submitting ? (mode === "register" ? "Creating account…" : "Signing in…") : (mode === "register" ? "Create account →" : "Sign in →")}
            </button>

            <p className="mono text-[9px] uppercase tracking-widest text-[#7a7466] mt-3 text-center">
              {mode === "register"
                ? <>Already have an account? <button type="button" onClick={() => setMode("login")} className="underline text-[#0a0a0a]">Sign in</button></>
                : <>New here? <button type="button" onClick={() => setMode("register")} className="underline text-[#0a0a0a]">Create account</button></>
              }
            </p>
          </motion.form>
        )}

        <p className="mt-10 text-sm text-[#7a7466]">
          Browse without signing in: <Link to="/discover" className="underline text-[#0a0a0a]">Discover creators →</Link>
        </p>
      </section>

      <Footer />
      <BottomNav />
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-4">
      <span className="mono text-[10px] uppercase tracking-[0.3em] text-[#0a0a0a]/70 block mb-2">{label}</span>
      {children}
    </label>
  );
}
