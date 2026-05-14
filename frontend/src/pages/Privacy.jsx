import React from "react";
import { motion } from "framer-motion";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";

const LAST_UPDATED = "14 May 2026";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#efe8d8] text-[#0a0a0a]">
      <Navbar />

      <section className="max-w-3xl mx-auto px-5 md:px-10 pt-16 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mono text-[10px] uppercase tracking-[0.3em] text-[#e63946] mb-4"
        >
          § Privacy Policy
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="display text-5xl md:text-7xl font-black leading-[0.9] mb-4"
        >
          Your data,<br /><span className="italic text-[#e63946]">your rules.</span>
        </motion.h1>
        <p className="mono text-[9px] uppercase tracking-widest text-[#7a7466] mb-12">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="space-y-10 prose-noctra">
          <PolicySection title="1. Who we are">
            <p>Noctra ("we", "us", "our") is a creator marketplace platform operated from India. We connect brands with content creators for paid collaborations. Our contact email is <a href="mailto:social@noctra.co.in" className="text-[#e63946] hover:underline">social@noctra.co.in</a>.</p>
          </PolicySection>

          <PolicySection title="2. What we collect">
            <p>We collect only what's necessary to operate the platform:</p>
            <ul>
              <li><strong>Account information:</strong> your name, email address, role (brand or creator), and password (stored as a secure hash — never in plain text).</li>
              <li><strong>Profile data:</strong> niche, city, bio, pricing, Instagram handle, and any other profile fields you choose to fill in.</li>
              <li><strong>Usage data:</strong> pages visited, campaigns applied to, deal room activity. Used to improve the platform.</li>
              <li><strong>Payment data:</strong> transaction references processed via Razorpay. We do not store full card or bank details.</li>
              <li><strong>Instagram data:</strong> if you connect your Instagram, we receive your follower count, engagement metrics, and basic public account info to populate your profile.</li>
            </ul>
          </PolicySection>

          <PolicySection title="3. How we use your data">
            <ul>
              <li>To create and manage your account</li>
              <li>To match brands and creators on the platform</li>
              <li>To facilitate deals and track payments between brands and creators</li>
              <li>To send transactional emails (OTP codes, deal confirmations)</li>
              <li>To improve platform features and user experience</li>
              <li>To comply with legal obligations</li>
            </ul>
            <p>We do not sell your personal data to third parties.</p>
          </PolicySection>

          <PolicySection title="4. Data sharing">
            <p>We share data only with:</p>
            <ul>
              <li><strong>Other platform users:</strong> your public profile (name, niche, pricing, Instagram handle) is visible to registered brands or creators as appropriate to your role.</li>
              <li><strong>Razorpay:</strong> for payment processing. Subject to <a href="https://razorpay.com/privacy/" target="_blank" rel="noreferrer" className="text-[#e63946] hover:underline">Razorpay's privacy policy</a>.</li>
              <li><strong>Resend:</strong> our email provider. Emails are processed securely and not used for marketing by Resend.</li>
              <li><strong>MongoDB Atlas:</strong> our database provider. Data is stored on encrypted servers.</li>
            </ul>
          </PolicySection>

          <PolicySection title="5. Data retention">
            <p>We retain your account data as long as your account is active. If you delete your account, your data is permanently removed from our database within 7 days. Anonymised usage data may be retained longer for analytics purposes.</p>
          </PolicySection>

          <PolicySection title="6. Your rights">
            <p>You have the right to:</p>
            <ul>
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and associated data (via Settings → Delete account)</li>
              <li>Object to processing of your data</li>
            </ul>
            <p>To exercise any of these rights, email us at <a href="mailto:social@noctra.co.in" className="text-[#e63946] hover:underline">social@noctra.co.in</a>.</p>
          </PolicySection>

          <PolicySection title="7. Cookies">
            <p>We use minimal, essential cookies and browser localStorage to keep you signed in (JWT token). We do not use advertising cookies or third-party tracking pixels.</p>
          </PolicySection>

          <PolicySection title="8. Security">
            <p>Passwords are hashed using industry-standard bcrypt. All data in transit is encrypted via HTTPS. Our database is hosted on MongoDB Atlas with encryption at rest. We follow responsible security practices and take your data protection seriously.</p>
          </PolicySection>

          <PolicySection title="9. Changes to this policy">
            <p>We may update this policy from time to time. The date at the top of this page will reflect the latest revision. Material changes will be communicated via email.</p>
          </PolicySection>

          <PolicySection title="10. Contact">
            <p>Questions about this policy? Email us at <a href="mailto:social@noctra.co.in" className="text-[#e63946] hover:underline">social@noctra.co.in</a>. We aim to respond within 2 business days.</p>
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
