// components/betterbet/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  {
    label: "Casino",
    icon: "🎰",
    items: [
      { name: "Lobby", href: "/betterbet", icon: "🏠" },
      { name: "Slots", href: "/betterbet/slots", icon: "🎰" },
      { name: "Dice", href: "/betterbet/dice", icon: "🎲" },
      { name: "Blackjack", href: "/betterbet/blackjack", icon: "🃏" },
      { name: "Roulette", href: "/betterbet/roulette", icon: "🎡" },
      { name: "Baccarat", href: "/betterbet/baccarat", icon: "🎴" },
      { name: "Mines", href: "/betterbet/mines", icon: "💣" },
      { name: "Plinko", href: "/betterbet/plinko", icon: "⚪" },
    ],
  },
];

interface SidebarProps {
  onContactClick?: () => void;
}

export default function Sidebar({ onContactClick }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-[#0a0a0a] border-r border-[#2a2a2a] h-screen sticky top-0">
      {/* Logo */}
      <div className="p-4 border-b border-[#2a2a2a]">
        <Link href="/betterbet" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#DC2626] to-[#FFD700] flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-red-500/20">
            BB
          </div>
          <span className="text-xl font-bold text-white">BetterBet</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems.map((section) => (
          <div key={section.label} className="mb-6">
            <div className="px-4 mb-2 flex items-center gap-2 text-xs font-semibold text-[#b0b0b0] uppercase tracking-wider">
              <span>{section.icon}</span>
              <span>{section.label}</span>
            </div>
            <ul className="space-y-1 px-2">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? "bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30"
                          : "text-[#b0b0b0] hover:bg-[#1a1a1a] hover:text-white"
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.name}</span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FFD700] shadow-[0_0_8px_#FFD700]" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Contact Button */}
      <div className="p-4 border-t border-[#2a2a2a]">
        <button
          onClick={onContactClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#DC2626] to-[#FFD700] hover:from-[#EF4444] hover:to-[#FFEA00] text-white font-medium rounded-lg transition-all text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Keep in Touch
        </button>
      </div>
    </aside>
  );
}
