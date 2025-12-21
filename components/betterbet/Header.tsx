// components/betterbet/Header.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { formatCurrency } from "@/lib/useWallet";
import WalletModal from "./WalletModal";

interface HeaderProps {
  balance: number;
  onCashIn: (amount: number) => void;
  onCashOut: (amount: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function Header({ balance, onCashIn, onCashOut, isMuted, onToggleMute }: HeaderProps) {
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#2a2a2a]">
        <div className="flex items-center justify-between h-14 sm:h-16 px-2 sm:px-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden p-1.5 sm:p-2 text-[#b0b0b0] hover:text-white flex-shrink-0"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo (mobile only) */}
          <Link href="/betterbet" className="lg:hidden flex-shrink-0">
            <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-[#DC2626] to-[#FFD700] bg-clip-text text-transparent">BetterBet</span>
          </Link>

          {/* Spacer for desktop */}
          <div className="hidden lg:block" />

          {/* Right side - Wallet */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {/* Balance display & Top-Up button */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-2 sm:px-4 py-1.5 sm:py-2">
                <span className="text-[#FFD700] font-bold text-sm sm:text-base" style={{ textShadow: '0 0 10px rgba(255, 215, 0, 0.5)' }}>
                  {formatCurrency(balance)}
                </span>
              </div>
              <button
                onClick={() => setShowWalletModal(true)}
                className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#EF4444] hover:to-[#DC2626] text-white font-semibold text-sm sm:text-base rounded-lg transition-all shadow-lg shadow-red-500/20"
              >
                <span className="hidden sm:inline">Wallet</span>
                <span className="sm:hidden">+</span>
              </button>
            </div>

            {/* Sound toggle - hide on very small screens */}
            <button
              onClick={onToggleMute}
              className="hidden sm:block p-2 rounded-lg bg-[#141414] hover:bg-[#1a1a1a] border border-[#2a2a2a] text-[#b0b0b0] hover:text-white transition-colors"
              title={isMuted ? "Unmute sounds" : "Mute sounds"}
            >
              {isMuted ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>

            {/* User avatar - smaller on mobile */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#DC2626] to-[#FFD700] flex items-center justify-center text-white font-bold text-sm sm:text-base">
              D
            </div>
          </div>
        </div>

        {/* Mobile navigation */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-[#2a2a2a] bg-[#0a0a0a]">
            <nav className="p-4 space-y-2">
              {[
                { name: "Lobby", href: "/betterbet", icon: "🏠" },
                { name: "Slots", href: "/betterbet/slots", icon: "🎰" },
                { name: "Dice", href: "/betterbet/dice", icon: "🎲" },
                { name: "Blackjack", href: "/betterbet/blackjack", icon: "🃏" },
                { name: "Roulette", href: "/betterbet/roulette", icon: "🎡" },
                { name: "Baccarat", href: "/betterbet/baccarat", icon: "🎴" },
                { name: "Mines", href: "/betterbet/mines", icon: "💣" },
                { name: "Plinko", href: "/betterbet/plinko", icon: "⚪" },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#b0b0b0] hover:bg-[#1a1a1a] hover:text-white transition-colors"
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Wallet Modal */}
      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        balance={balance}
        onCashIn={onCashIn}
        onCashOut={onCashOut}
      />
    </>
  );
}
