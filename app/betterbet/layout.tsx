// app/betterbet/layout.tsx
"use client";

import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import Sidebar from "@/components/betterbet/Sidebar";
import Header from "@/components/betterbet/Header";
import ContactModal from "@/components/betterbet/ContactModal";
import { useWallet } from "@/lib/useWallet";
import { useSounds } from "@/lib/useSounds";

export default function BetterBetLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { balance, addFunds, cashOut, isLoaded } = useWallet();
  const { isMuted, toggleMute } = useSounds();
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showContact, setShowContact] = useState(false);

  // Show disclaimer on first visit
  useEffect(() => {
    const hasSeenDisclaimer = localStorage.getItem("betterbet_disclaimer_seen");
    if (!hasSeenDisclaimer) {
      setShowDisclaimer(true);
    }
  }, []);

  const handleAcceptDisclaimer = () => {
    localStorage.setItem("betterbet_disclaimer_seen", "true");
    setShowDisclaimer(false);
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      {/* Sidebar */}
      <Sidebar onContactClick={() => setShowContact(true)} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen pb-16 lg:pb-0">
        {/* Header */}
        <Header
          balance={isLoaded ? balance : 0}
          onCashIn={addFunds}
          onCashOut={cashOut}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Bottom Tab Bar (Mobile only) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#2a2a2a] z-40">
        <div className="flex justify-center">
          <button
            onClick={() => setShowContact(true)}
            className="flex-1 max-w-xs py-3 flex flex-col items-center gap-1 text-[#b0b0b0] hover:text-[#FFD700] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </div>

      {/* Contact Modal */}
      <ContactModal isOpen={showContact} onClose={() => setShowContact(false)} />

      {/* Disclaimer Popup */}
      {showDisclaimer && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#141414] rounded-2xl border border-[#2a2a2a] shadow-2xl p-6 text-center">
              {/* Icon */}
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#DC2626] to-[#FFD700] flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-white mb-2">Disclaimer</h2>

              {/* Message */}
              <p className="text-[#b0b0b0] mb-6">
                This is a <span className="text-[#FFD700] font-semibold">demo site</span> for entertainment purposes only.
                <br /><br />
                <span className="text-white font-medium">No real money is involved.</span>
                <br />
                All credits are virtual and have no monetary value.
              </p>

              {/* Button */}
              <button
                onClick={handleAcceptDisclaimer}
                className="w-full py-4 bg-gradient-to-r from-[#DC2626] to-[#FFD700] hover:from-[#EF4444] hover:to-[#FFEA00] text-white font-bold rounded-full transition-all shadow-lg"
              >
                I Understand
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
