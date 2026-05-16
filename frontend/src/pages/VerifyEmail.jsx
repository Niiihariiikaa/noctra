import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { sendOTP, verifyOTP } from "../lib/api";
import { saveSession } from "../lib/auth";

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
    const t = setInterval(() => setCountdown((c) => {
      if (c <= 1) { clearInterval(t); return 0; }
      return c - 1;
    }), 1000);
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
        const next = [...digits]; next[i] = ""; setDigits(next);
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
      toast.error(err?.response?.data?.detail || "Invalid or expired code");
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
    <div className="min-h-screen bg-[#efe8d8] text-[#0a0a0a] flex flex-col">
      {/* Top bar */}
      <div className="border-b border-[#0a0a0a] px-5 md:px-10 py-4 flex items-center justify-between">
        <Link to="/">
          <img src="/brand/logo.svg" alt="Noctra" className="h-8 w-auto" />
        </Link>
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#0a0a0a]/40">
          Email verification
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-5 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          className="w-full max-w-md"
        >
          {/* Label */}
          <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-4">
            § Step — Confirm your email
          </div>

          {/* Heading */}
          <h1 className="display text-5xl md:text-6xl font-black leading-[0.9] mb-4">
            Check your<br /><span className="italic">inbox.</span>
          </h1>
          <p className="text-sm text-[#0a0a0a]/55 leading-relaxed mb-10">
            We sent a 6-digit code to{" "}
            <span className="font-semibold text-[#0a0a0a]">{email}</span>.
            <br />Enter it below to verify your account.
          </p>

          <form onSubmit={onSubmit}>
            {/* OTP inputs */}
            <div className="flex gap-2 sm:gap-3 mb-4" onPaste={onPaste}>
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
                    flex-1 min-w-0 h-14 sm:h-16 text-center text-xl sm:text-2xl font-black border-2 transition-all focus:outline-none
                    ${d
                      ? "border-[#0a0a0a] bg-[#0a0a0a] text-[#efe8d8]"
                      : "border-[#0a0a0a]/25 bg-transparent text-[#0a0a0a] focus:border-[#0a0a0a]"
                    }
                  `}
                />
              ))}
            </div>

            {/* Progress track */}
            <div className="h-[2px] bg-[#0a0a0a]/10 mb-8 overflow-hidden">
              <motion.div
                className="h-full bg-[#0a0a0a]"
                animate={{ width: `${(filled / 6) * 100}%` }}
                transition={{ duration: 0.15 }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || filled < 6}
              className="w-full py-4 bg-[#0a0a0a] text-[#efe8d8] mono text-[10px] uppercase tracking-widest hover:bg-[#e63946] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting
                ? <><Loader2 size={13} className="animate-spin" /> Verifying…</>
                : "Verify email →"
              }
            </button>
          </form>

          {/* Resend + back */}
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => navigate("/auth")}
              className="mono text-[10px] uppercase tracking-widest text-[#0a0a0a]/40 hover:text-[#0a0a0a] transition"
            >
              ← Back
            </button>
            <button
              onClick={onResend}
              disabled={countdown > 0 || resending}
              className="mono text-[10px] uppercase tracking-widest text-[#0a0a0a] hover:text-[#e63946] disabled:text-[#0a0a0a]/30 disabled:cursor-not-allowed transition"
            >
              {resending ? "Sending…" : countdown > 0 ? `Resend in ${countdown}s` : "Resend code →"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
