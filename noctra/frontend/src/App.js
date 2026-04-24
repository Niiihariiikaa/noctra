import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

import Landing from "@/pages/Landing";
import Discover from "@/pages/Discover";
import CreatorProfile from "@/pages/CreatorProfile";
import BrandDashboard from "@/pages/BrandDashboard";
import CreatorDashboard from "@/pages/CreatorDashboard";
import Services from "@/pages/Services";
import Auth from "@/pages/Auth";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/creators/:id" element={<CreatorProfile />} />
          <Route path="/services" element={<Services />} />
          <Route path="/dashboard/brand" element={<BrandDashboard />} />
          <Route path="/dashboard/creator" element={<CreatorDashboard />} />
          <Route path="/auth" element={<Auth />} />
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
