import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { sendOTP, verifyOTP } from "../lib/api";
import { saveSession } from "../lib/auth";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const role = params.get("role") || "";

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputs = useRef([]);

  useEffect(() => {
    if (!email) { navigate("/auth"); return; }
    startCountdown();
    setTimeout(() => inputs.current[0]?.focus(), 100);
  }, []); // eslint-disable-line

  function startCountdown() {
    setCountdown(60);
    const t = setInterval(() => setCountdown((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  }

  const onDigit = (i, val) => {
    const v = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) inputs.current[i + 1]?.focus();
  };

  const onKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      if (digits[i]) {
        const next = [...digits];
        next[i] = "";
        setDigits(next);
      } else if (i > 0) {
        inputs.current[i - 1]?.focus();
      }
    }
  };

  const onPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      inputs.current[5]?.focus();
      e.preventDefault();
    }
  };

  const filled = digits.join("").length;

  const onSubmit = async (e) => {
    e.preventDefault();
    const otp = digits.join("");
    if (otp.length < 6) return toast.error("Enter all 6 digits");
    setSubmitting(true);
    try {
      const data = await verifyOTP(email, otp);
      saveSession(data.access_token, data.user);
      toast.success("Email verified!");
      if (role === "brand") navigate("/onboarding/brand");
      else if (role === "creator") navigate("/onboarding/creator");
      else navigate("/services");
    } catch (err) {
      const msg = err?.response?.data?.detail || "Invalid or expired code";
      toast.error(msg);
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputs.current[0]?.focus(), 50);
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    try {
      await sendOTP(email);
      toast.success("New code sent — check your inbox");
      startCountdown();
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputs.current[0]?.focus(), 50);
    } catch {
      toast.error("Failed to resend — try again");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#efe8d8] text-[#0a0a0a]">
      <Navbar />

      <section className="flex items-center justify-center px-5 py-20 min-h-[calc(100vh-80px)] pb-32">
        <div className="w-full max-w-md">

          {/* Label */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-4"
          >
            § Verify your email
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="display text-5xl md:text-6xl font-black leading-[0.9] mb-4"
          >
            Check your<br /><span className="italic text-[#e63946]">inbox.</span>
          </motion.h1>

          {/* Email hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.16 }}
            className="flex items-center gap-2 mb-10"
          >
            <Mail size={13} className="text-[#7a7466]" />
            <span className="text-sm text-[#7a7466]">
              We sent a 6-digit code to{" "}
              <span className="font-bold text-[#0a0a0a]">{email}</span>
            </span>
          </motion.div>

          {/* OTP form */}
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            onSubmit={onSubmit}
          >
            {/* Box row */}
            <div className="flex gap-2.5 mb-8" onPaste={onPaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (inputs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => onDigit(i, e.target.value)}
                  onKeyDown={(e) => onKeyDown(i, e)}
                  className={`
                    flex-1 h-14 md:h-16 text-center text-xl md:text-2xl font-black
                    border-2 bg-transparent transition-all duration-150 focus:outline-none
                    ${d
                      ? "border-[#0a0a0a] bg-[#0a0a0a] text-[#efe8d8]"
                      : "border-[#0a0a0a]/30 focus:border-[#e63946] focus:bg-[#e8e0cd]"
                    }
                  `}
                />
              ))}
            </div>

            {/* Progress bar */}
            <div className="h-0.5 bg-[#0a0a0a]/10 mb-6 overflow-hidden">
              <motion.div
                className="h-full bg-[#e63946]"
                animate={{ width: `${(filled / 6) * 100}%` }}
                transition={{ duration: 0.15 }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || filled < 6}
              className="w-full px-4 py-4 bg-[#0a0a0a] text-[#efe8d8] mono text-[10px] uppercase tracking-widest hover:bg-[#e63946] disabled:opacity-30 transition-colors flex items-center justify-center gap-2"
            >
              {submitting
                ? <><Loader2 size={13} className="animate-spin" /> Verifying…</>
                : "Verify →"
              }
            </button>
          </motion.form>

          {/* Resend */}
          <div className="mt-6 flex items-center justify-between">
            <span className="mono text-[9px] uppercase tracking-widest text-[#7a7466]">
              Didn't get it?
            </span>
            <button
              onClick={onResend}
              disabled={countdown > 0 || resending}
              className="mono text-[9px] uppercase tracking-widest text-[#0a0a0a] hover:text-[#e63946] disabled:text-[#7a7466] disabled:cursor-not-allowed transition-colors"
            >
              {resending
                ? "Sending…"
                : countdown > 0
                  ? `Resend in ${countdown}s`
                  : "Resend code →"
              }
            </button>
          </div>

          {/* Wrong email link */}
          <div className="mt-8 pt-6 border-t border-[#0a0a0a]/10 text-center">
            <button
              onClick={() => navigate("/auth")}
              className="mono text-[9px] uppercase tracking-widest text-[#7a7466] hover:text-[#0a0a0a] transition-colors"
            >
              ← Back to sign in
            </button>
          </div>
        </div>
      </section>

      <Footer />
      <BottomNav />
    </div>
  );
}
