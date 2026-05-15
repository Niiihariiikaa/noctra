import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Briefcase, Sparkles, Scissors, ArrowUpRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";
import { register, login, getUser, saveSession } from "../lib/auth";
import { googleSignIn } from "../lib/api";

const ROLES = [
  { key: "brand",   label: "Brand",         desc: "Hire creators, run campaigns, track every deal in one pipeline.", icon: Briefcase, color: "bg-[#f4c542]" },
  { key: "creator", label: "Creator",        desc: "Get discovered by brands, apply to campaigns, and get paid for your content.", icon: Sparkles,  color: "bg-[#e63946] text-[#efe8d8]" },
  { key: "editor",  label: "Editor / Pro",   desc: "List your craft — video editing, reels, social management.",     icon: Scissors,  color: "bg-[#0a0a0a] text-[#efe8d8]" },
];

const NICHES = ["Fashion", "Fitness", "Food", "Tech", "Lifestyle", "Travel", "Beauty", "Gaming"];
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

function getStrength(pwd) {
  if (!pwd) return null;
  let score = 0;
  if (pwd.length >= 8)          score++;
  if (pwd.length >= 14)         score++;
  if (/[A-Z]/.test(pwd))       score++;
  if (/[0-9]/.test(pwd))       score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { label: "Weak",   color: "#e63946", pct: 25 };
  if (score === 2) return { label: "Fair",   color: "#f4c542", pct: 50 };
  if (score === 3) return { label: "Good",   color: "#f4c542", pct: 75 };
  return               { label: "Strong", color: "#22c55e", pct: 100 };
}

function makePassword() {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const nums  = "0123456789";
  const syms  = "!@#$%&*";
  const all   = upper + lower + nums + syms;
  const p = [
    upper[Math.floor(Math.random() * upper.length)],
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    lower[Math.floor(Math.random() * lower.length)],
    nums[Math.floor(Math.random() * nums.length)],
    nums[Math.floor(Math.random() * nums.length)],
    syms[Math.floor(Math.random() * syms.length)],
  ];
  for (let i = 0; i < 9; i++) p.push(all[Math.floor(Math.random() * all.length)]);
  return p.sort(() => Math.random() - 0.5).join("");
}

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

  const googleDivRef = useRef(null);
  const googleCbRef = useRef(null); // always points to latest handleGoogleCredential

  // isNew=true + verified=true → skip email OTP, go straight to onboarding
  const redirect = (userRole, isNew = false, userEmail = "", verified = false) => {
    if (isNew && !verified) {
      navigate(`/verify-email?email=${encodeURIComponent(userEmail)}&role=${userRole}`);
    } else if (isNew) {
      if (userRole === "brand") navigate("/onboarding/brand");
      else if (userRole === "creator") navigate("/onboarding/creator");
      else navigate("/services");
    } else {
      if (userRole === "brand") navigate("/dashboard/brand");
      else if (userRole === "creator") navigate("/dashboard/creator");
      else navigate("/services");
    }
  };

  const handleGoogleCredential = async (response) => {
    const currentRole = mode === "register" ? role : undefined;
    // On register with no role: default to undefined — backend will prompt "account_not_found"
    // and we'll show a helpful message
    setSubmitting(true);
    try {
      const data = await googleSignIn(response.credential, currentRole);
      saveSession(data.access_token, data.user);
      toast.success(data.is_new ? `Welcome to Noctra, ${data.user.name}!` : `Welcome back, ${data.user.name}!`);
      // Google accounts are pre-verified — skip /verify-email
      redirect(data.user.role, data.is_new, data.user.email, true);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (detail === "account_not_found") {
        toast.error("New here? Pick a role below then try Google again");
        setMode("register");
      } else {
        toast.error(detail || "Google sign-in failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Keep ref current so GSI callback always calls the latest closure
  googleCbRef.current = handleGoogleCredential;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const renderBtn = () => {
      if (!window.google || !googleDivRef.current) return;
      // Clear previous render before re-rendering
      googleDivRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (resp) => googleCbRef.current(resp),
      });
      window.google.accounts.id.renderButton(googleDivRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: mode === "login" ? "signin_with" : "signup_with",
        width: Math.min(googleDivRef.current.offsetWidth || 400, 400),
      });
    };

    if (window.google) {
      renderBtn();
    } else {
      window.addEventListener("gsi-ready", renderBtn, { once: true });
      return () => window.removeEventListener("gsi-ready", renderBtn);
    }
  }, [mode, role]); // re-run when role changes so button appears as soon as form is visible

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
        toast.success(`Welcome to Noctra, ${user.name}! Check your email for a verification code.`);
        redirect(user.role, true, email);
        return;
      } else {
        user = await login({ email, password });
        toast.success(`Welcome back, ${user.name}!`);
      }
      redirect(user.role);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const strength = mode === "register" ? getStrength(password) : null;

  return (
    <div className="min-h-screen bg-[#efe8d8] text-[#0a0a0a]" data-testid="auth-page">
      <Navbar />
      <section className="max-w-6xl mx-auto px-5 md:px-10 py-12">
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-3">Join the hub</div>
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

        {/* Google sign-in — always visible when configured */}
        {GOOGLE_CLIENT_ID && (
          <div className="mt-8 max-w-xl">
            {/* Hidden GSI-rendered button — we trigger it programmatically */}
            <div ref={googleDivRef} className="absolute opacity-0 pointer-events-none" style={{ width: 1, height: 1, overflow: "hidden" }} />

            <button
              type="button"
              onClick={() => {
                const btn = googleDivRef.current?.querySelector('div[role="button"]') || googleDivRef.current?.querySelector("button");
                if (btn) btn.click();
              }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[#0a0a0a] bg-[#efe8d8] hover:bg-[#e8e0cd] transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.616z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              <span className="mono text-[10px] uppercase tracking-widest text-[#0a0a0a]">
                {mode === "login" ? "Sign in with Google" : "Sign up with Google"}
              </span>
            </button>

            <div className="flex items-center gap-3 mt-5">
              <div className="flex-1 h-px bg-[#0a0a0a]/20" />
              <span className="mono text-[9px] uppercase tracking-widest text-[#5c5650]">or continue with email</span>
              <div className="flex-1 h-px bg-[#0a0a0a]/20" />
            </div>
          </div>
        )}

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
                    <span className="px-3 py-3 text-sm text-[#5c5650] border-r border-[#0a0a0a] select-none">@</span>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5c5650] hover:text-[#0a0a0a]"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Password strength meter */}
              {strength && (
                <div className="mt-1.5">
                  <div className="h-1 bg-[#0a0a0a]/10 overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{ width: `${strength.pct}%`, background: strength.color }}
                    />
                  </div>
                  <div className="mono text-[9px] uppercase tracking-widest mt-0.5" style={{ color: strength.color }}>
                    {strength.label}
                  </div>
                </div>
              )}
            </Field>

            {/* Suggest strong password — only on register */}
            {mode === "register" && (
              <button
                type="button"
                onClick={() => { setPassword(makePassword()); setShowPassword(true); }}
                className="-mt-2 mb-4 mono text-[9px] uppercase tracking-widest text-[#e63946] hover:underline block"
              >
                ↻ Suggest a strong password
              </button>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 px-4 py-3.5 bg-[#0a0a0a] text-[#efe8d8] font-bold uppercase tracking-widest text-xs hover:bg-[#e63946] disabled:opacity-50 transition-colors"
              data-testid="auth-submit"
            >
              {submitting ? (mode === "register" ? "Creating account…" : "Signing in…") : (mode === "register" ? "Create account →" : "Sign in →")}
            </button>

            <p className="mono text-[9px] uppercase tracking-widest text-[#5c5650] mt-4 text-center">
              {mode === "register"
                ? <>Already have an account? <button type="button" onClick={() => setMode("login")} className="underline text-[#0a0a0a]">Sign in</button></>
                : <>New here? <button type="button" onClick={() => setMode("register")} className="underline text-[#0a0a0a]">Create account</button></>
              }
            </p>
          </motion.form>
        )}

        <p className="mt-10 text-sm text-[#5c5650]">
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
      <span className="mono text-[10px] uppercase tracking-[0.3em] text-[#0a0a0a]/85 block mb-2">{label}</span>
      {children}
    </label>
  );
}
