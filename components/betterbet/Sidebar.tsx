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
      { name: "Dice", href: "/betterbet/dice", icon: "🎲" },
      { name: "Blackjack", href: "/betterbet/blackjack", icon: "🃏" },
      { name: "Mines", href: "/betterbet/mines", icon: "💣" },
      { name: "Plinko", href: "/betterbet/plinko", icon: "⚪" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-[#0a0a0f] border-r border-[#2a2a3e] h-screen sticky top-0">
      {/* Logo */}
      <div className="p-4 border-b border-[#2a2a3e]">
        <Link href="/betterbet" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#f97316] flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-purple-500/20">
            B
          </div>
          <span className="text-xl font-bold text-white">BetterBet</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems.map((section) => (
          <div key={section.label} className="mb-6">
            <div className="px-4 mb-2 flex items-center gap-2 text-xs font-semibold text-[#b0b0c0] uppercase tracking-wider">
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
                          ? "bg-[#8b5cf6]/20 text-[#a78bfa] border border-[#8b5cf6]/30"
                          : "text-[#b0b0c0] hover:bg-[#1a1a2e] hover:text-white"
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.name}</span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#39ff14] shadow-[0_0_8px_#39ff14]" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#2a2a3e]">
        <div className="text-xs text-[#b0b0c0] text-center">
          <p className="text-[#f97316]">Demo Mode</p>
          <p className="text-[#666680]">No real money involved</p>
        </div>
      </div>
    </aside>
  );
}
