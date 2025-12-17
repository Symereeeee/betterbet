// app/betterbet/page.tsx
"use client";

import GameCard from "@/components/betterbet/GameCard";
import { useWallet, formatCurrency } from "@/lib/useWallet";

const originalGames = [
  {
    name: "Dice",
    href: "/betterbet/dice",
    icon: "🎲",
    description: "Classic high/low dice game with 2x multiplier",
    tag: "Popular",
    gradient: "from-[#DC2626] to-[#FFD700]",
    houseEdge: "1%",
  },
  {
    name: "Blackjack",
    href: "/betterbet/blackjack",
    icon: "🃏",
    description: "Beat the dealer without going over 21",
    tag: "Classic",
    gradient: "from-[#FFD700] to-[#DC2626]",
    houseEdge: "0.5%",
  },
  {
    name: "Mines",
    href: "/betterbet/mines",
    icon: "💣",
    description: "Navigate the minefield for big rewards",
    tag: "New",
    gradient: "from-[#DC2626] to-[#8B0000]",
    houseEdge: "1%",
  },
  {
    name: "Plinko",
    href: "/betterbet/plinko",
    icon: "⚪",
    description: "Drop the ball and watch it bounce to riches",
    tag: "Fun",
    gradient: "from-[#FFD700] to-[#FFA500]",
    houseEdge: "1%",
  },
];

const stats = [
  { label: "Total Games", value: "4" },
  { label: "Max Multiplier", value: "1000x" },
  { label: "Min Bet", value: "$0.10" },
  { label: "Max Bet", value: "$10,000" },
];

export default function BetterBetLobby() {
  const { balance, totalWagered, totalWon, betsPlaced, isLoaded } = useWallet();

  const profit = totalWon - totalWagered;

  return (
    <div className="p-4 lg:p-6">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#141414] via-[#1a1a1a] to-[#141414] border border-[#2a2a2a] mb-8">
        {/* Decorative gradient orbs */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-[#DC2626]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#FFD700]/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-[#FFD700]/10 rounded-full blur-2xl" />

        <div className="relative p-6 lg:p-10">
          <div className="max-w-2xl">
            <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4">
              Welcome to <span className="bg-gradient-to-r from-[#DC2626] via-[#FFD700] to-[#DC2626] bg-clip-text text-transparent">SixSeven.bet</span>
            </h1>
            <p className="text-lg text-[#b0b0b0] mb-6">
              Experience the thrill of casino gaming with our provably fair games.
              No real money involved - just pure entertainment.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="/betterbet/dice"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#EF4444] hover:to-[#DC2626] text-white font-bold rounded-lg transition-all shadow-lg shadow-red-500/25"
              >
                <span>🎲</span>
                Play Dice
              </a>
              <a
                href="/betterbet/blackjack"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FFD700] to-[#FFC000] hover:from-[#FFEA00] hover:to-[#FFD700] text-black font-bold rounded-lg transition-all shadow-lg shadow-yellow-500/25"
              >
                <span>🃏</span>
                Play Blackjack
              </a>
            </div>
          </div>

          {/* Floating stats card */}
          <div className="hidden lg:block absolute top-6 right-6 w-64 p-4 bg-[#0a0a0a]/80 backdrop-blur rounded-xl border border-[#2a2a2a]">
            <p className="text-xs text-[#666666] mb-1">Your Balance</p>
            <p className="text-2xl font-bold text-[#FFD700] mb-4" style={{ textShadow: '0 0 10px rgba(255, 215, 0, 0.5)' }}>
              {isLoaded ? formatCurrency(balance) : "$0.00"}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#b0b0b0]">Bets Placed</span>
                <span className="text-white font-medium">{betsPlaced}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#b0b0b0]">Total Wagered</span>
                <span className="text-white font-medium">{formatCurrency(totalWagered)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#b0b0b0]">Profit/Loss</span>
                <span className={`font-medium ${profit >= 0 ? "text-[#FFD700]" : "text-[#DC2626]"}`}>
                  {profit >= 0 ? "+" : ""}{formatCurrency(profit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar (mobile) */}
      <div className="lg:hidden grid grid-cols-2 gap-3 mb-8">
        <div className="p-4 bg-[#141414] rounded-xl border border-[#2a2a2a]">
          <p className="text-xs text-[#666666]">Your Balance</p>
          <p className="text-xl font-bold text-[#FFD700]" style={{ textShadow: '0 0 10px rgba(255, 215, 0, 0.5)' }}>
            {isLoaded ? formatCurrency(balance) : "$0.00"}
          </p>
        </div>
        <div className="p-4 bg-[#141414] rounded-xl border border-[#2a2a2a]">
          <p className="text-xs text-[#666666]">Profit/Loss</p>
          <p className={`text-xl font-bold ${profit >= 0 ? "text-[#FFD700]" : "text-[#DC2626]"}`}>
            {profit >= 0 ? "+" : ""}{formatCurrency(profit)}
          </p>
        </div>
      </div>

      {/* Platform stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="p-4 bg-[#141414] rounded-xl border border-[#2a2a2a] text-center hover:border-[#FFD700]/50 transition-colors"
          >
            <p className={`text-2xl lg:text-3xl font-bold mb-1 ${
              i === 0 ? "text-[#DC2626]" : i === 1 ? "text-[#FFD700]" : i === 2 ? "text-[#FFD700]" : "text-white"
            }`}>{stat.value}</p>
            <p className="text-sm text-[#b0b0b0]">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Our Games */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">SixSeven Originals</h2>
            <p className="text-sm text-[#b0b0b0]">Our exclusive in-house games</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {originalGames.map((game) => (
            <GameCard key={game.name} {...game} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 bg-[#141414] rounded-xl border border-[#2a2a2a] hover:border-[#DC2626]/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-[#DC2626]/20 flex items-center justify-center text-2xl mb-4">
              💰
            </div>
            <h3 className="text-lg font-bold text-white mb-2">1. Get Demo Credits</h3>
            <p className="text-sm text-[#b0b0b0]">
              Start with $10,000 in demo credits. Add more anytime from your wallet.
            </p>
          </div>
          <div className="p-6 bg-[#141414] rounded-xl border border-[#2a2a2a] hover:border-[#FFD700]/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-[#FFD700]/20 flex items-center justify-center text-2xl mb-4">
              🎮
            </div>
            <h3 className="text-lg font-bold text-white mb-2">2. Choose a Game</h3>
            <p className="text-sm text-[#b0b0b0]">
              Pick from our selection of casino classics and original games.
            </p>
          </div>
          <div className="p-6 bg-[#141414] rounded-xl border border-[#2a2a2a] hover:border-[#FFD700]/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-[#FFD700]/20 flex items-center justify-center text-2xl mb-4">
              🏆
            </div>
            <h3 className="text-lg font-bold text-white mb-2">3. Play & Win</h3>
            <p className="text-sm text-[#b0b0b0]">
              Place your bets and enjoy the thrill. Track your stats and climb the leaderboard.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6">Why SixSeven.bet?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: "🔒", title: "Provably Fair", desc: "All games use verifiable random outcomes", color: "#DC2626" },
            { icon: "⚡", title: "Instant Play", desc: "No downloads or registration required", color: "#FFD700" },
            { icon: "📱", title: "Mobile Ready", desc: "Play on any device, anywhere", color: "#FFD700" },
            { icon: "🎁", title: "Free Forever", desc: "Demo credits never expire", color: "#DC2626" },
          ].map((feature) => (
            <div
              key={feature.title}
              className="p-4 bg-[#141414] rounded-xl border border-[#2a2a2a] flex items-start gap-3 hover:border-opacity-50 transition-colors"
              style={{ '--hover-color': feature.color } as React.CSSProperties}
            >
              <span className="text-2xl">{feature.icon}</span>
              <div>
                <h3 className="font-bold text-white">{feature.title}</h3>
                <p className="text-sm text-[#b0b0b0]">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
