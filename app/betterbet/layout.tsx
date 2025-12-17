// app/betterbet/layout.tsx
"use client";

import type { ReactNode } from "react";
import Sidebar from "@/components/betterbet/Sidebar";
import Header from "@/components/betterbet/Header";
import { useWallet } from "@/lib/useWallet";
import { useSounds } from "@/lib/useSounds";

export default function BetterBetLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { balance, addFunds, cashOut, isLoaded } = useWallet();
  const { isMuted, toggleMute } = useSounds();

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen">
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

        {/* Footer */}
        <footer className="border-t border-[#2a2a2a] py-6 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#666666]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-gradient-to-br from-[#DC2626] to-[#FFD700] flex items-center justify-center text-xs font-bold text-white">
                  67
                </div>
                <span>SixSeven.bet Demo Casino</span>
              </div>
              <p>This is a demo site. No real money is involved.</p>
              <p>Built with Next.js & Tailwind CSS</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
