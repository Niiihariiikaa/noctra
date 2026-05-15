import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
    <div className="min-h-screen bg-[#efe8d8] flex items-center justify-center px-5 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2 text-[#0a0a0a]">Check your inbox</h1>
          <p className="text-sm text-[#5c5650] leading-relaxed">
            We sent a 6-digit code to{" "}
            <span className="font-semibold text-[#0a0a0a]">{email}</span>
          </p>
        </div>

        {/* OTP form */}
        <form onSubmit={onSubmit}>
          {/* Digit boxes */}
          <div className="flex gap-2 mb-6" onPaste={onPaste}>
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
                  flex-1 h-14 text-center text-2xl font-black border-2 transition-all focus:outline-none
                  ${d
                    ? "border-[#0a0a0a] bg-[#0a0a0a] text-[#efe8d8]"
                    : "border-[#0a0a0a]/40 bg-transparent text-[#0a0a0a] focus:border-[#c94f3d] focus:bg-[#e8e0cd]"
                  }
                `}
              />
            ))}
          </div>

          {/* Progress bar */}
          <div className="h-[3px] bg-[#0a0a0a]/10 mb-6 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#c94f3d] rounded-full"
              animate={{ width: `${(filled / 6) * 100}%` }}
              transition={{ duration: 0.15 }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || filled < 6}
            className="w-full py-3.5 bg-[#0a0a0a] text-[#efe8d8] font-semibold text-sm hover:bg-[#c94f3d] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {submitting
              ? <><Loader2 size={14} className="animate-spin" /> Verifying…</>
              : "Verify email →"
            }
          </button>
        </form>

        {/* Resend + back */}
        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={() => navigate("/auth")}
            className="text-sm text-[#5c5650] hover:text-[#0a0a0a] transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={onResend}
            disabled={countdown > 0 || resending}
            className="text-sm font-medium text-[#0a0a0a] hover:text-[#c94f3d] disabled:text-[#9a9490] disabled:cursor-not-allowed transition-colors"
          >
            {resending
              ? "Sending…"
              : countdown > 0
                ? `Resend in ${countdown}s`
                : "Resend code →"
            }
          </button>
        </div>
      </motion.div>
    </div>
  );
}
