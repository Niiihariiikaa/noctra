import React from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";
// import { useNavigate } from "react-router-dom";
// import { motion } from "framer-motion";
// import { Check, X, RefreshCw } from "lucide-react";
// import TrustRing from "../components/common/TrustRing";
// import { getDeals, updateDeal, getCreator } from "../lib/api";
// import { getUser } from "../lib/mockAuth";
// import { formatINR } from "../lib/format";
// import { toast } from "sonner";

export default function CreatorDashboard() {
  return (
    <div className="min-h-screen bg-[#efe8d8] text-[#0a0a0a]">
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-5 text-center">
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-4">§ Studio — Creator Dashboard</div>
        <h1 className="display text-[4rem] md:text-[8rem] lg:text-[11rem] font-black leading-[0.85]">
          Coming<br/><span className="italic text-[#e63946]">soon.</span>
        </h1>
        <p className="mono text-[10px] uppercase tracking-[0.3em] text-[#7a7466] mt-8">
          We're building something worth waiting for.
        </p>
      </div>
      <Footer />
      <BottomNav />
    </div>
  );
}
