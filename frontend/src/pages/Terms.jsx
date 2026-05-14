import React from "react";
import { motion } from "framer-motion";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";

const LAST_UPDATED = "14 May 2026";

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#efe8d8] text-[#0a0a0a]">
      <Navbar />

      <section className="max-w-3xl mx-auto px-5 md:px-10 pt-16 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-4"
        >
          § Terms of Use
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="display text-5xl md:text-7xl font-black leading-[0.9] mb-4"
        >
          Play fair,<br /><span className="italic text-[#e63946]">get paid.</span>
        </motion.h1>
        <p className="mono text-[9px] uppercase tracking-widest text-[#7a7466] mb-12">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="space-y-10">
          <PolicySection title="1. Acceptance of terms">
            <p>By creating an account on Noctra, you agree to these Terms of Use. If you do not agree, do not use the platform. These terms apply to all users — brands, creators, and editors alike.</p>
          </PolicySection>

          <PolicySection title="2. Eligibility">
            <p>You must be at least 18 years old to use Noctra. By registering, you confirm that all information you provide is accurate and that you have the legal authority to enter into agreements on the platform.</p>
          </PolicySection>

          <PolicySection title="3. User accounts">
            <ul>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You may not create multiple accounts or impersonate another person or brand.</li>
              <li>Noctra reserves the right to suspend or terminate accounts that violate these terms.</li>
            </ul>
          </PolicySection>

          <PolicySection title="4. Campaigns and applications">
            <ul>
              <li>Brands are responsible for ensuring campaign briefs are accurate, legal, and do not promote prohibited content.</li>
              <li>Creators who apply to campaigns represent that their profile metrics are genuine.</li>
              <li>Noctra is a marketplace facilitator — we do not guarantee campaign outcomes or creator deliverables.</li>
              <li>Both parties must honour agreed terms once a deal is created.</li>
            </ul>
          </PolicySection>

          <PolicySection title="5. Payments">
            <ul>
              <li>Payments between brands and creators are facilitated through the platform and may be processed via Razorpay.</li>
              <li>Funds are released to the creator once the brand reviews and approves the submitted content.</li>
              <li>Disputes must be raised within 7 days of content submission by contacting social@noctra.co.in.</li>
              <li>Platform fees (if applicable) will be clearly communicated before any transaction is finalised.</li>
            </ul>
          </PolicySection>

          <PolicySection title="6. Content and intellectual property">
            <ul>
              <li>Creators retain ownership of content they create unless explicitly agreed otherwise in a deal.</li>
              <li>By posting content to Noctra (profile photos, portfolio), you grant Noctra a non-exclusive licence to display that content on the platform.</li>
              <li>You must not upload content that infringes third-party intellectual property rights.</li>
            </ul>
          </PolicySection>

          <PolicySection title="7. Prohibited conduct">
            <p>You may not:</p>
            <ul>
              <li>Inflate follower counts, engagement metrics, or platform statistics</li>
              <li>Contact other users off-platform to circumvent Noctra's deal process</li>
              <li>Post false, misleading, or defamatory content</li>
              <li>Use the platform for any unlawful purpose</li>
              <li>Attempt to reverse-engineer, scrape, or interfere with the platform</li>
            </ul>
          </PolicySection>

          <PolicySection title="8. Limitation of liability">
            <p>Noctra provides the platform on an "as is" basis. We are not liable for lost profits, deal failures, or indirect damages arising from use of the platform. Our total liability to any user shall not exceed the fees paid to Noctra in the 30 days preceding the claim.</p>
          </PolicySection>

          <PolicySection title="9. Termination">
            <p>Either party may terminate the relationship at any time. You may delete your account via Settings. Noctra may suspend or terminate your account for violations of these terms. Outstanding payment obligations survive termination.</p>
          </PolicySection>

          <PolicySection title="10. Governing law">
            <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in India.</p>
          </PolicySection>

          <PolicySection title="11. Contact">
            <p>Questions about these terms? Email <a href="mailto:social@noctra.co.in" className="text-[#e63946] hover:underline">social@noctra.co.in</a>.</p>
          </PolicySection>
        </div>
      </section>

      <Footer />
      <BottomNav />
    </div>
  );
}

function PolicySection({ title, children }) {
  return (
    <div className="border-t border-[#0a0a0a]/15 pt-8">
      <h2 className="display text-2xl font-black mb-4">{title}</h2>
      <div className="space-y-3 text-sm text-[#0a0a0a]/80 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_strong]:text-[#0a0a0a] [&_strong]:font-bold">
        {children}
      </div>
    </div>
  );
}
