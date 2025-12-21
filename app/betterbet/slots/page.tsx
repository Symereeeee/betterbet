// app/betterbet/slots/page.tsx
"use client";

import { useState, useCallback } from "react";
import { useWallet, formatCurrency } from "@/lib/useWallet";
import { useSounds } from "@/lib/useSounds";
import Link from "next/link";

type Symbol = "6" | "7";
type GameState = "idle" | "spinning" | "ended";

// 6-7 pays 4x (90% RTP)
const WIN_MULTIPLIER = 4;

// Weighted randomness - balanced for fair play
const getRandomSymbol = (): Symbol => {
  return Math.random() < 0.5 ? "6" : "7";
};

const ReelSymbol = ({ symbol, isSpinning }: { symbol: Symbol; isSpinning: boolean }) => {
  return (
    <div
      className={`relative w-28 h-36 sm:w-36 sm:h-44 flex items-center justify-center rounded-2xl transition-all duration-300 ${
        symbol === "6"
          ? "bg-gradient-to-br from-[#DC2626] to-[#991B1B] shadow-xl shadow-red-500/40"
          : "bg-gradient-to-br from-[#FFD700] to-[#B8860B] shadow-xl shadow-yellow-500/40"
      } ${isSpinning ? "animate-pulse scale-95" : "scale-100"}`}
    >
      <span className={`text-7xl sm:text-8xl font-black ${symbol === "6" ? "text-white" : "text-black"}`}>
        {symbol}
      </span>
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-2xl" />
    </div>
  );
};

export default function SlotsPage() {
  const { balance, placeBet: walletPlaceBet, isLoaded } = useWallet();
  const { play } = useSounds();
  const [betAmount, setBetAmount] = useState(100);
  const [reels, setReels] = useState<Symbol[]>(["6", "7"]);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [message, setMessage] = useState("");
  const [isWin, setIsWin] = useState(false);
  const [spinCount, setSpinCount] = useState(0);
  const [history, setHistory] = useState<{ reels: Symbol[]; win: number; bet: number }[]>([]);

  const spin = useCallback(async () => {
    if (betAmount <= 0 || betAmount > balance || gameState === "spinning") return;

    play("roll");
    setGameState("spinning");
    setMessage("");
    setIsWin(false);
    setSpinCount(prev => prev + 1);

    // Animate through random symbols
    const spinDuration = 1500;
    const intervalTime = 80;
    let elapsed = 0;

    const spinInterval = setInterval(() => {
      elapsed += intervalTime;
      setReels([getRandomSymbol(), getRandomSymbol()]);

      if (elapsed >= spinDuration) {
        clearInterval(spinInterval);

        // Final result
        const finalReels: Symbol[] = [getRandomSymbol(), getRandomSymbol()];
        setReels(finalReels);

        // Win only on 6-7
        const won = finalReels[0] === "6" && finalReels[1] === "7";
        setIsWin(won);

        if (won) {
          const payout = betAmount * WIN_MULTIPLIER;
          walletPlaceBet(betAmount, true, payout);
          setMessage("SIXSEVEN!");
          play("bigWin");
        } else {
          walletPlaceBet(betAmount, false, 0);
          setMessage("Try again!");
          play("lose");
        }

        setHistory(prev => [
          { reels: finalReels, win: won ? betAmount * WIN_MULTIPLIER : 0, bet: betAmount },
          ...prev.slice(0, 9)
        ]);
        setGameState("ended");
      }
    }, intervalTime);
  }, [betAmount, balance, gameState, walletPlaceBet, play]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-[#b0b0b0]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#666666] mb-4 lg:mb-6">
        <Link href="/betterbet" className="hover:text-white transition-colors">Casino</Link>
        <span>/</span>
        <span className="text-white">BetterBet Slots</span>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden space-y-4">
        {/* Slot Machine */}
        <div className="bg-[#1a1a2e] rounded-xl p-6">
          {/* Logo */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-black bg-gradient-to-r from-[#DC2626] via-[#FFD700] to-[#DC2626] bg-clip-text text-transparent">
              BetterBet
            </h2>
            <p className="text-sm text-[#666666] mt-1">Land 6-7 to win {WIN_MULTIPLIER}x!</p>
          </div>

          {/* Win Message */}
          {message && gameState === "ended" && (
            <div className={`mb-6 p-4 rounded-xl text-center font-bold ${
              isWin
                ? "bg-gradient-to-r from-[#DC2626]/30 via-[#FFD700]/30 to-[#DC2626]/30 border-2 border-[#FFD700] animate-pulse"
                : "bg-[#2a2a2a]"
            }`}>
              <p className={`text-2xl ${isWin ? "text-[#FFD700]" : "text-[#666666]"}`}>
                {message}
              </p>
              {isWin && (
                <p className="text-3xl font-black text-white mt-2">
                  +{formatCurrency(betAmount * WIN_MULTIPLIER - betAmount)}
                </p>
              )}
            </div>
          )}

          {/* Reels */}
          <div className="flex justify-center items-center gap-4 mb-6">
            {reels.map((symbol, i) => (
              <ReelSymbol key={i} symbol={symbol} isSpinning={gameState === "spinning"} />
            ))}
          </div>

          {/* Win indicator */}
          <div className="text-center mb-4">
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
              isWin && gameState === "ended"
                ? "bg-[#FFD700] text-black"
                : "bg-[#2a2a2a] text-[#666666]"
            }`}>
              {WIN_MULTIPLIER}x on 6-7
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-[#1a1a2e] rounded-xl p-4 space-y-4">
          {/* Bet Amount */}
          <div>
            <label className="text-xs text-[#666666] mb-2 block">Bet Amount</label>
            <div className="flex items-center bg-[#0f0f1a] rounded-lg overflow-hidden">
              <span className="px-3 text-[#666666]">$</span>
              <input
                type="number"
                min={1}
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value) || 0)}
                disabled={gameState === "spinning"}
                className="flex-1 bg-transparent py-3 text-white outline-none disabled:opacity-50"
              />
              <button
                onClick={() => setBetAmount((a) => Math.max(1, Math.floor(a / 2)))}
                disabled={gameState === "spinning"}
                className="px-3 py-3 text-[#666666] hover:text-white hover:bg-[#2a2a3e] disabled:opacity-50"
              >
                ½
              </button>
              <button
                onClick={() => setBetAmount((a) => Math.min(Math.floor(balance), a * 2))}
                disabled={gameState === "spinning"}
                className="px-3 py-3 text-[#666666] hover:text-white hover:bg-[#2a2a3e] disabled:opacity-50"
              >
                2×
              </button>
            </div>
          </div>

          {/* Balance & Spin */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-xs text-[#666666]">Balance</p>
              <p className="text-lg font-bold text-white">{formatCurrency(balance)}</p>
            </div>
            <button
              onClick={spin}
              disabled={betAmount <= 0 || betAmount > balance || gameState === "spinning"}
              className="px-12 py-4 bg-gradient-to-r from-[#DC2626] to-[#FFD700] hover:from-[#EF4444] hover:to-[#FFEA00] disabled:bg-[#2a2a3e] disabled:from-[#2a2a3e] disabled:to-[#2a2a3e] disabled:text-[#666666] text-white text-xl font-bold rounded-full transition-colors disabled:cursor-not-allowed"
            >
              {gameState === "spinning" ? "..." : "SPIN"}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6">
        {/* LEFT: Controls */}
        <div className="space-y-4">
          <div className="bg-[#1a1a2e] rounded-xl p-4">
            {/* Bet Amount */}
            <div className="space-y-2 mb-4">
              <label className="text-xs text-[#666666] font-medium">Bet Amount</label>
              <div className="flex items-center bg-[#0f0f1a] rounded-lg overflow-hidden">
                <span className="px-3 text-[#666666]">$</span>
                <input
                  type="number"
                  min={1}
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value) || 0)}
                  disabled={gameState === "spinning"}
                  className="flex-1 bg-transparent py-3 text-white outline-none disabled:opacity-50"
                />
                <button
                  onClick={() => setBetAmount((a) => Math.max(1, Math.floor(a / 2)))}
                  disabled={gameState === "spinning"}
                  className="px-3 py-3 text-[#666666] hover:text-white hover:bg-[#2a2a3e] disabled:opacity-50"
                >
                  ½
                </button>
                <button
                  onClick={() => setBetAmount((a) => Math.min(Math.floor(balance), a * 2))}
                  disabled={gameState === "spinning"}
                  className="px-3 py-3 text-[#666666] hover:text-white hover:bg-[#2a2a3e] disabled:opacity-50"
                >
                  2×
                </button>
              </div>
            </div>

            {/* Quick Bets */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[10, 50, 100, 500].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  disabled={gameState === "spinning"}
                  className="py-2 bg-[#0f0f1a] hover:bg-[#2a2a3e] text-[#b0b0b0] hover:text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                >
                  ${amount}
                </button>
              ))}
            </div>

            {/* Spin Button */}
            <button
              onClick={spin}
              disabled={betAmount <= 0 || betAmount > balance || gameState === "spinning"}
              className="w-full py-5 bg-gradient-to-r from-[#DC2626] to-[#FFD700] hover:from-[#EF4444] hover:to-[#FFEA00] disabled:bg-[#2a2a3e] disabled:from-[#2a2a3e] disabled:to-[#2a2a3e] disabled:text-[#666666] text-white font-black text-2xl rounded-full transition-colors disabled:cursor-not-allowed"
            >
              {gameState === "spinning" ? "..." : "SPIN"}
            </button>

            {/* Balance */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-[#666666]">Balance:</span>
              <span className="text-white font-bold">{formatCurrency(balance)}</span>
            </div>

            {/* Stats */}
            <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
              <div className="flex justify-between text-sm">
                <span className="text-[#666666]">Total Spins</span>
                <span className="text-white">{spinCount}</span>
              </div>
            </div>
          </div>

          {/* How to Win */}
          <div className="bg-[#1a1a2e] rounded-xl p-4">
            <h3 className="text-sm font-medium text-white mb-3">How to Win</h3>
            <div className="p-4 bg-gradient-to-r from-[#DC2626]/20 to-[#FFD700]/20 rounded-xl border border-[#FFD700]/30">
              <div className="flex items-center justify-center gap-4 mb-3">
                <div className="w-12 h-14 bg-gradient-to-br from-[#DC2626] to-[#991B1B] rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-black text-white">6</span>
                </div>
                <div className="w-12 h-14 bg-gradient-to-br from-[#FFD700] to-[#B8860B] rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-black text-black">7</span>
                </div>
              </div>
              <p className="text-center text-[#FFD700] font-bold text-lg">{WIN_MULTIPLIER}x PAYOUT</p>
            </div>
            <p className="text-xs text-[#666666] text-center mt-3">
              Land 6 then 7 to win!
            </p>
          </div>

          {/* History */}
          <div className="bg-[#1a1a2e] rounded-xl p-4">
            <h3 className="text-sm font-medium text-white mb-3">Recent Spins</h3>
            {history.length === 0 ? (
              <p className="text-xs text-[#666666] text-center py-4">No spins yet</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {history.map((h, i) => (
                  <div key={i} className={`flex justify-between items-center p-2 rounded-lg ${h.win > 0 ? "bg-[#FFD700]/20" : "bg-[#0f0f1a]"}`}>
                    <div className="flex gap-2">
                      <span className={`font-bold ${h.reels[0] === "6" ? "text-[#DC2626]" : "text-[#FFD700]"}`}>
                        {h.reels[0]}
                      </span>
                      <span className={`font-bold ${h.reels[1] === "6" ? "text-[#DC2626]" : "text-[#FFD700]"}`}>
                        {h.reels[1]}
                      </span>
                    </div>
                    <span className={`text-sm ${h.win > 0 ? "text-[#FFD700]" : "text-[#666666]"}`}>
                      {h.win > 0 ? `+${formatCurrency(h.win - h.bet)}` : `-${formatCurrency(h.bet)}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Slot Machine */}
        <div className="lg:col-span-2">
          <div className="bg-[#1a1a2e] rounded-xl p-8 h-full flex flex-col items-center justify-center">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-5xl font-black bg-gradient-to-r from-[#DC2626] via-[#FFD700] to-[#DC2626] bg-clip-text text-transparent mb-2">
                BetterBet
              </h2>
              <p className="text-[#666666]">Land 6-7 to win {WIN_MULTIPLIER}x your bet!</p>
            </div>

            {/* Win Message */}
            {message && gameState === "ended" && (
              <div className={`mb-8 px-8 py-4 rounded-2xl text-center ${
                isWin
                  ? "bg-gradient-to-r from-[#DC2626]/30 via-[#FFD700]/30 to-[#DC2626]/30 border-2 border-[#FFD700] animate-pulse"
                  : "bg-[#2a2a2a]"
              }`}>
                <p className={`text-3xl font-bold ${isWin ? "text-[#FFD700]" : "text-[#666666]"}`}>
                  {message}
                </p>
                {isWin && (
                  <p className="text-4xl font-black text-white mt-2">
                    +{formatCurrency(betAmount * WIN_MULTIPLIER - betAmount)}
                  </p>
                )}
              </div>
            )}

            {/* Slot Machine */}
            <div className="relative">
              {/* Machine frame */}
              <div className="absolute -inset-6 bg-gradient-to-b from-[#FFD700] via-[#B8860B] to-[#8B6914] rounded-3xl" />
              <div className="absolute -inset-4 bg-[#1a1a2e] rounded-2xl" />

              {/* Reels */}
              <div className="relative flex items-center gap-6 p-6 bg-[#0a0a0a] rounded-xl">
                {reels.map((symbol, i) => (
                  <ReelSymbol key={i} symbol={symbol} isSpinning={gameState === "spinning"} />
                ))}
              </div>
            </div>

            {/* Target indicator */}
            <div className="mt-8 flex items-center gap-4">
              <span className="text-[#666666]">Target:</span>
              <div className="flex gap-2">
                <div className="w-10 h-12 bg-gradient-to-br from-[#DC2626] to-[#991B1B] rounded-lg flex items-center justify-center opacity-50">
                  <span className="text-xl font-black text-white">6</span>
                </div>
                <div className="w-10 h-12 bg-gradient-to-br from-[#FFD700] to-[#B8860B] rounded-lg flex items-center justify-center opacity-50">
                  <span className="text-xl font-black text-black">7</span>
                </div>
              </div>
              <span className="text-[#FFD700] font-bold">= {WIN_MULTIPLIER}x</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
