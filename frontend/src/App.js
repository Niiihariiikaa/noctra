import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { initAuth } from "@/lib/auth";
import { ScrollReset, ScrollToTopButton } from "@/components/common/ScrollToTop";

initAuth();
import { Toaster } from "sonner";

import Landing from "@/pages/Landing";
import Discover from "@/pages/Discover";
import CreatorProfile from "@/pages/CreatorProfile";
import BrandDashboard from "@/pages/BrandDashboard";
import CreatorDashboard from "@/pages/CreatorDashboard";
import Services from "@/pages/Services";
import Auth from "@/pages/Auth";
import CreatorOnboarding from "@/pages/CreatorOnboarding";
import BrandOnboarding from "@/pages/BrandOnboarding";
import CreateCampaign from "@/pages/CreateCampaign";
import CampaignDetail from "@/pages/CampaignDetail";
import DealRoom from "@/pages/DealRoom";
import VerifyEmail from "@/pages/VerifyEmail";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Careers from "@/pages/Careers";
import GetStarted from "@/pages/GetStarted";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <ScrollReset />
        <ScrollToTopButton />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/creators/:id" element={<CreatorProfile />} />
          <Route path="/services" element={<Services />} />
          <Route path="/auth" element={<Auth />} />

          {/* Email verification */}
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Onboarding */}
          <Route path="/onboarding/creator" element={<CreatorOnboarding />} />
          <Route path="/onboarding/brand" element={<BrandOnboarding />} />

          {/* Dashboards */}
          <Route path="/dashboard/brand" element={<BrandDashboard />} />
          <Route path="/dashboard/creator" element={<CreatorDashboard />} />

          {/* Campaigns */}
          <Route path="/campaigns/new" element={<CreateCampaign />} />
          <Route path="/campaigns/:id" element={<CampaignDetail />} />

          {/* Deal rooms */}
          <Route path="/deal-room/:id" element={<DealRoom />} />

          {/* Info pages */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/get-started" element={<GetStarted />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        theme="light"
        position="top-right"
        toastOptions={{
          style: {
            background: "#efe8d8",
            color: "#0a0a0a",
            border: "1px solid #0a0a0a",
            borderRadius: 0,
            fontFamily: "'Space Grotesk', sans-serif",
          },
        }}
      />
    </div>
  );
}

export default App;
