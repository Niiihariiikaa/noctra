import React, { useState } from "react";
import { Loader2, Instagram, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { instagramConnect } from "../../lib/api";

export default function ConnectInstagram({ creator, onUpdated }) {
  const [step, setStep] = useState("idle"); // idle | input | saving
  const [username, setUsername] = useState("");

  const isConnected = creator?.instagram_verified;
  const handle = creator?.instagram_handle?.replace(/^@/, "");

  const handleSave = async (e) => {
    e?.preventDefault();
    const u = username.trim().replace(/^@/, "");
    if (!u) return;
    setStep("saving");
    try {
      const updated = await instagramConnect(u);
      toast.success(`@${u} connected!`);
      onUpdated?.(updated);
      setStep("idle");
      setUsername("");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to save — try again");
      setStep("input");
    }
  };

  /* ── Connected ── */
  if (isConnected) {
    return (
      <div className="border border-[#0a0a0a] px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Instagram size={10} className="text-[#5c5650]" />
          <div className="mono text-[9px] uppercase tracking-widest text-[#5c5650]">Instagram</div>
        </div>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="font-bold text-sm">{creator.instagram_handle}</span>
          <CheckCircle2 size={11} className="text-[#e63946]" />
        </div>
        <a
          href={`https://www.instagram.com/${handle}/`}
          target="_blank"
          rel="noreferrer"
          className="mono text-[8px] uppercase tracking-widest text-[#5c5650] hover:text-[#e63946] transition"
        >
          View profile →
        </a>
      </div>
    );
  }

  /* ── Idle ── */
  if (step === "idle") {
    return (
      <div className="border border-dashed border-[#0a0a0a] px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <Instagram size={10} className="text-[#5c5650]" />
          <div className="mono text-[9px] uppercase tracking-widest text-[#5c5650]">Instagram</div>
        </div>
        <button
          onClick={() => setStep("input")}
          className="flex items-center gap-1.5 mono text-[9px] uppercase tracking-widest text-[#e63946] hover:underline"
        >
          Connect account →
        </button>
      </div>
    );
  }

  /* ── Input ── */
  if (step === "input") {
    return (
      <div className="border border-[#0a0a0a] p-4 w-full">
        <div className="mono text-[9px] uppercase tracking-[0.3em] text-[#e63946] mb-3">Connect Instagram</div>
        <form onSubmit={handleSave} className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5650] text-sm font-bold select-none">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/^@/, ""))}
              placeholder="yourhandle"
              autoFocus
              className="w-full bg-transparent border border-[#0a0a0a] pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:bg-[#e8e0cd] transition"
            />
          </div>
          <button
            type="submit"
            disabled={!username.trim()}
            className="px-4 py-2.5 bg-[#0a0a0a] text-[#efe8d8] mono text-[9px] uppercase tracking-widest hover:bg-[#e63946] disabled:opacity-40 transition"
          >
            Save →
          </button>
          <button
            type="button"
            onClick={() => { setStep("idle"); setUsername(""); }}
            className="px-3 py-2.5 border border-[#0a0a0a] mono text-[9px] hover:bg-[#e8e0cd] transition"
          >
            ✕
          </button>
        </form>
      </div>
    );
  }

  /* ── Saving ── */
  if (step === "saving") {
    return (
      <div className="border border-[#0a0a0a] p-4 w-full flex items-center gap-2">
        <Loader2 size={14} className="animate-spin text-[#e63946]" />
        <span className="mono text-[9px] uppercase tracking-widest text-[#5c5650]">Saving @{username}…</span>
      </div>
    );
  }

  return null;
}
