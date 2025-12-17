// components/betterbet/Header.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { formatCurrency } from "@/lib/useWallet";

interface HeaderProps {
  balance: number;
  onAddFunds: (amount: number) => void;
  onResetWallet: () => void;
}

export default function Header({ balance, onAddFunds, onResetWallet }: HeaderProps) {
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0f]/95 backdrop-blur border-b border-[#2a2a3e]">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Mobile menu button */}
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="lg:hidden p-2 text-[#b0b0c0] hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo (mobile only) */}
        <Link href="/betterbet" className="lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#f97316] flex items-center justify-center text-sm font-bold text-white">
            B
          </div>
          <span className="text-lg font-bold text-white">BetterBet</span>
        </Link>

        {/* Spacer for desktop */}
        <div className="hidden lg:block" />

        {/* Right side - Wallet */}
        <div className="flex items-center gap-3">
          {/* Balance display */}
          <div className="relative">
            <button
              onClick={() => setShowWalletMenu(!showWalletMenu)}
              className="flex items-center gap-2 bg-[#12121a] hover:bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-4 py-2 transition-colors"
            >
              <span className="text-[#39ff14] font-bold" style={{ textShadow: '0 0 10px rgba(57, 255, 20, 0.5)' }}>
                {formatCurrency(balance)}
              </span>
              <svg className="w-4 h-4 text-[#b0b0c0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Wallet dropdown */}
            {showWalletMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowWalletMenu(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-[#12121a] border border-[#2a2a3e] rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-[#2a2a3e] bg-gradient-to-r from-[#8b5cf6]/10 to-[#f97316]/10">
                    <p className="text-xs text-[#b0b0c0] mb-1">Demo Balance</p>
                    <p className="text-2xl font-bold text-[#39ff14]" style={{ textShadow: '0 0 10px rgba(57, 255, 20, 0.5)' }}>
                      {formatCurrency(balance)}
                    </p>
                  </div>
                  <div className="p-2">
                    <p className="px-2 py-1 text-xs text-[#666680] font-medium">Add Funds</p>
                    <div className="grid grid-cols-2 gap-2 p-2">
                      {[1000, 5000, 10000, 50000].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => {
                            onAddFunds(amount);
                            setShowWalletMenu(false);
                          }}
                          className="px-3 py-2 bg-[#1a1a2e] hover:bg-[#8b5cf6]/20 hover:border-[#8b5cf6]/50 border border-[#2a2a3e] text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          +${amount.toLocaleString()}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        onResetWallet();
                        setShowWalletMenu(false);
                      }}
                      className="w-full mt-2 px-3 py-2 text-[#ff4444] hover:bg-[#ff4444]/10 text-sm font-medium rounded-lg transition-colors text-left"
                    >
                      Reset Wallet
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#f97316] flex items-center justify-center text-white font-bold">
            D
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      {showMobileMenu && (
        <div className="lg:hidden border-t border-[#2a2a3e] bg-[#0a0a0f]">
          <nav className="p-4 space-y-2">
            {[
              { name: "Lobby", href: "/betterbet", icon: "🏠" },
              { name: "Dice", href: "/betterbet/dice", icon: "🎲" },
              { name: "Blackjack", href: "/betterbet/blackjack", icon: "🃏" },
              { name: "Mines", href: "/betterbet/mines", icon: "💣" },
              { name: "Plinko", href: "/betterbet/plinko", icon: "⚪" },
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#b0b0c0] hover:bg-[#1a1a2e] hover:text-white transition-colors"
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
