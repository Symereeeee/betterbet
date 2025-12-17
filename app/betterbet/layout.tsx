// app/betterbet/layout.tsx
"use client";

import type { ReactNode } from "react";
import Sidebar from "@/components/betterbet/Sidebar";
import Header from "@/components/betterbet/Header";
import { useWallet } from "@/lib/useWallet";

export default function BetterBetLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { balance, addFunds, resetWallet, isLoaded } = useWallet();

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <Header
          balance={isLoaded ? balance : 0}
          onAddFunds={addFunds}
          onResetWallet={resetWallet}
        />

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-[#2a2a3e] py-6 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#666680]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-gradient-to-br from-[#8b5cf6] to-[#f97316] flex items-center justify-center text-xs font-bold text-white">
                  B
                </div>
                <span>BetterBet Demo Casino</span>
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
