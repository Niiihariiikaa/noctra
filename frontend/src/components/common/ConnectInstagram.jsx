import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Instagram, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { instagramLookup, instagramConnect } from "../../lib/api";
import { formatFollowers } from "../../lib/format";

export default function ConnectInstagram({ creator, onUpdated }) {
  const [step, setStep] = useState("idle"); // idle | input | loading | preview | connecting | syncing
  const [username, setUsername] = useState("");
  const [preview, setPreview] = useState(null);

  const isConnected = creator?.instagram_verified;

  const handleSync = async () => {
    const handle = creator.instagram_handle?.replace(/^@/, "");
    if (!handle) return;
    setStep("syncing");
    try {
      const updated = await instagramConnect(handle);
      onUpdated?.(updated);
      toast.success("Stats synced!");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Sync failed — try again");
    } finally {
      setStep("idle");
    }
  };

  const handleLookup = async (e) => {
    e?.preventDefault();
    const u = username.trim().replace(/^@/, "");
    if (!u) return;
    setStep("loading");
    try {
      const data = await instagramLookup(u);
      setPreview(data);
      setStep("preview");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Account not found — check the username");
      setStep("input");
    }
  };

  const handleConfirm = async () => {
    setStep("connecting");
    try {
      const updated = await instagramConnect(preview.username);
      toast.success(`@${preview.username} connected!`);
      onUpdated?.(updated);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to connect — try again");
      setStep("preview");
    }
  };

  const reset = () => { setStep("idle"); setUsername(""); setPreview(null); };

  /* ── Connected ── */
  if (isConnected) {
    return (
      <div className="border border-[#0a0a0a] px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Instagram size={10} className="text-[#7a7466]" />
          <div className="mono text-[9px] uppercase tracking-widest text-[#7a7466]">Instagram</div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-sm">{creator.instagram_handle}</span>
          <CheckCircle2 size={11} className="text-[#e63946]" />
        </div>
        {creator.followers > 0 && (
          <div className="mono text-[9px] text-[#7a7466] mt-0.5">
            {formatFollowers(creator.followers)} followers
          </div>
        )}
        <button
          onClick={handleSync}
          disabled={step === "syncing"}
          className="mt-1.5 flex items-center gap-1 mono text-[8px] uppercase tracking-widest text-[#7a7466] hover:text-[#e63946] transition disabled:opacity-40"
        >
          {step === "syncing"
            ? <><Loader2 size={8} className="animate-spin" /> Syncing…</>
            : "↻ Sync stats"}
        </button>
      </div>
    );
  }

  /* ── Idle ── */
  if (step === "idle") {
    return (
      <div className="border border-dashed border-[#0a0a0a] px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <Instagram size={10} className="text-[#7a7466]" />
          <div className="mono text-[9px] uppercase tracking-widest text-[#7a7466]">Instagram</div>
        </div>
        <button onClick={() => setStep("input")} className="flex items-center gap-1.5 mono text-[9px] uppercase tracking-widest text-[#e63946] hover:underline">
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
        <form onSubmit={handleLookup} className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a7466] text-sm font-bold select-none">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/^@/, ""))}
              placeholder="yourhandle"
              autoFocus
              className="w-full bg-transparent border border-[#0a0a0a] pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:bg-[#e8e0cd] transition"
            />
          </div>
          <button type="submit" disabled={!username.trim()} className="px-4 py-2.5 bg-[#0a0a0a] text-[#efe8d8] mono text-[9px] uppercase tracking-widest hover:bg-[#e63946] disabled:opacity-40 transition">
            Find →
          </button>
          <button type="button" onClick={reset} className="px-3 py-2.5 border border-[#0a0a0a] mono text-[9px] hover:bg-[#e8e0cd] transition">✕</button>
        </form>
      </div>
    );
  }

  /* ── Loading ── */
  if (step === "loading") {
    return (
      <div className="border border-[#0a0a0a] p-4 w-full flex items-center gap-2">
        <Loader2 size={14} className="animate-spin text-[#e63946]" />
        <span className="mono text-[9px] uppercase tracking-widest text-[#7a7466]">Looking up @{username}…</span>
      </div>
    );
  }

  /* ── Preview ── */
  if (step === "preview" && preview) {
    const seed = encodeURIComponent(preview.username);
    const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,ffd5dc&radius=50`;

    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="border border-[#0a0a0a] p-4 w-full">
        <div className="mono text-[9px] uppercase tracking-[0.3em] text-[#e63946] mb-3">Is this you?</div>
        <div className="flex items-center gap-4 mb-4">
          <img src={avatarUrl} alt={preview.username} className="w-14 h-14 rounded-full border border-[#0a0a0a]/20 bg-[#e8e0cd]" />
          <div>
            <div className="font-bold text-base flex items-center gap-1.5">
              {preview.full_name || preview.username}
              {preview.is_verified && <CheckCircle2 size={13} className="text-[#e63946]" />}
            </div>
            <div className="mono text-[9px] uppercase tracking-widest text-[#7a7466]">@{preview.username}</div>
            <div className="flex items-center gap-3 mt-1.5 mono text-[9px] uppercase tracking-widest text-[#7a7466]">
              <span>{formatFollowers(preview.followers)} followers</span>
              <span>{preview.posts} posts</span>
            </div>
          </div>
        </div>

        {preview.is_private && (
          <div className="flex items-start gap-2 bg-[#f4c542]/20 border border-[#f4c542] px-3 py-2.5 mb-4">
            <AlertTriangle size={12} className="text-[#7a7466] shrink-0 mt-0.5" />
            <p className="mono text-[8px] uppercase tracking-widest text-[#7a7466]">
              Your account is private. Brands won't see your content — consider making it public.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={handleConfirm} className="flex-1 px-4 py-2.5 bg-[#0a0a0a] text-[#efe8d8] mono text-[9px] uppercase tracking-widest hover:bg-[#e63946] transition">
            Yes, this is me →
          </button>
          <button onClick={() => { setPreview(null); setStep("input"); }} className="flex items-center gap-1.5 px-3 py-2.5 border border-[#0a0a0a] mono text-[9px] uppercase tracking-widest hover:bg-[#e8e0cd] transition">
            <ArrowLeft size={11} /> Back
          </button>
        </div>
      </motion.div>
    );
  }

  /* ── Connecting ── */
  if (step === "connecting") {
    return (
      <div className="border border-[#0a0a0a] p-4 w-full flex items-center gap-2">
        <Loader2 size={14} className="animate-spin text-[#e63946]" />
        <span className="mono text-[9px] uppercase tracking-widest text-[#7a7466]">Saving @{preview?.username}…</span>
      </div>
    );
  }

  return null;
}
