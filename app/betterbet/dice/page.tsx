// app/betterbet/dice/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet, formatCurrency } from "@/lib/useWallet";
import { useSounds } from "@/lib/useSounds";
import Link from "next/link";

type Outcome = "WIN" | "LOSE" | null;

type HistoryItem = {
  id: number;
  amount: number;
  roll: number;
  outcome: Outcome;
  guess: "HIGH" | "LOW";
};

export default function DicePage() {
  const { balance, placeBet: walletPlaceBet, isLoaded } = useWallet();
  const { play } = useSounds();
  const [amount, setAmount] = useState<number>(100);
  const [guess, setGuess] = useState<"HIGH" | "LOW">("HIGH");
  const [roll, setRoll] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [hitAnim, setHitAnim] = useState(false);

  const payoutMultiplier = 2.0;
  const winChance = 50.0;

  // Animate roll result
  useEffect(() => {
    if (roll === null) return;
    setHitAnim(true);
    const id = setTimeout(() => setHitAnim(false), 400);
    return () => clearTimeout(id);
  }, [roll]);

  const placeBet = useCallback(async () => {
    setError(null);
    setOutcome(null);

    if (amount <= 0) {
      setError("Bet amount must be greater than 0.");
      return;
    }

    if (amount > balance) {
      setError("Insufficient balance.");
      return;
    }

    setLoading(true);
    play("roll");

    // Simulate roll delay
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Roll dice (1-6)
    const diceRoll = Math.floor(Math.random() * 6) + 1;
    const isHigh = diceRoll >= 4;
    const won = (guess === "HIGH" && isHigh) || (guess === "LOW" && !isHigh);

    const winAmount = won ? amount * payoutMultiplier : 0;

    // Play win/lose sound
    if (won) {
      play(winAmount >= amount * 4 ? "bigWin" : "win");
    } else {
      play("lose");
    }

    // Update wallet
    walletPlaceBet(amount, won, winAmount);

    // Update local state
    setRoll(diceRoll);
    setOutcome(won ? "WIN" : "LOSE");

    // Add to history
    const newOutcome: Outcome = won ? "WIN" : "LOSE";
    setHistory((prev) =>
      [
        {
          id: Date.now(),
          amount,
          roll: diceRoll,
          outcome: newOutcome,
          guess,
        },
        ...prev,
      ].slice(0, 15)
    );

    setLoading(false);
  }, [amount, balance, guess, walletPlaceBet, play]);

  const totalProfit = history.reduce((sum, h) => {
    return sum + (h.outcome === "WIN" ? h.amount : -h.amount);
  }, 0);

  const winCount = history.filter((h) => h.outcome === "WIN").length;
  const winRate = history.length > 0 ? (winCount / history.length) * 100 : 0;

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-[#b0b0b0]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#666666] mb-6">
        <Link href="/betterbet" className="hover:text-white transition-colors">
          Casino
        </Link>
        <span>/</span>
        <span className="text-white">Dice</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Betting Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-4">
            {/* Mode tabs */}
            <div className="flex bg-[#0a0a0a] rounded-lg p-1 mb-6">
              <button className="flex-1 py-2 px-4 rounded-md bg-[#2a2a2a] text-white text-sm font-medium">
                Manual
              </button>
              <button className="flex-1 py-2 px-4 rounded-md text-[#b0b0b0] text-sm font-medium hover:text-white transition-colors">
                Auto
              </button>
            </div>

            {/* Bet Amount */}
            <div className="space-y-2 mb-4">
              <label className="text-xs text-[#b0b0b0] font-medium">Bet Amount</label>
              <div className="flex items-center bg-[#0a0a0a] rounded-lg border border-[#2a2a2a] overflow-hidden">
                <span className="px-3 text-[#666666]">$</span>
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="flex-1 bg-transparent py-3 text-white outline-none"
                />
                <div className="flex border-l border-[#2a2a2a]">
                  <button
                    onClick={() => setAmount((a) => Math.max(0.1, a / 2))}
                    className="px-3 py-3 text-[#b0b0b0] hover:text-white hover:bg-[#2a2a2a] transition-colors text-sm"
                  >
                    ½
                  </button>
                  <button
                    onClick={() => setAmount((a) => Math.min(balance, a * 2))}
                    className="px-3 py-3 text-[#b0b0b0] hover:text-white hover:bg-[#2a2a2a] transition-colors text-sm border-l border-[#2a2a2a]"
                  >
                    2×
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                {[10, 50, 100, 500].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(preset)}
                    className="flex-1 py-1.5 bg-[#0a0a0a] hover:bg-[#2a2a2a] text-[#b0b0b0] hover:text-white text-xs rounded-md transition-colors"
                  >
                    ${preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Payout Display */}
            <div className="flex justify-between items-center py-3 px-4 bg-[#0a0a0a] rounded-lg mb-4">
              <span className="text-sm text-[#b0b0b0]">Profit on Win</span>
              <span className="text-lg font-bold text-[#FFD700]">
                +{formatCurrency(amount * (payoutMultiplier - 1))}
              </span>
            </div>

            {/* Guess Selection */}
            <div className="space-y-2 mb-4">
              <label className="text-xs text-[#b0b0b0] font-medium">Prediction</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setGuess("LOW")}
                  className={`py-3 rounded-lg font-medium transition-all ${
                    guess === "LOW"
                      ? "bg-[#FFD700] text-black"
                      : "bg-[#0a0a0a] text-[#b0b0b0] hover:bg-[#2a2a2a] hover:text-white border border-[#2a2a2a]"
                  }`}
                >
                  Low (1-3)
                </button>
                <button
                  onClick={() => setGuess("HIGH")}
                  className={`py-3 rounded-lg font-medium transition-all ${
                    guess === "HIGH"
                      ? "bg-[#FFD700] text-black"
                      : "bg-[#0a0a0a] text-[#b0b0b0] hover:bg-[#2a2a2a] hover:text-white border border-[#2a2a2a]"
                  }`}
                >
                  High (4-6)
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-[#DC2626]/10 border border-[#DC2626]/30 rounded-lg mb-4">
                <p className="text-sm text-[#DC2626]">{error}</p>
              </div>
            )}

            {/* Place Bet Button */}
            <button
              onClick={placeBet}
              disabled={loading || amount <= 0 || amount > balance}
              className="w-full py-4 bg-[#FFD700] hover:bg-[#FFEA00] disabled:bg-[#2a2a2a] disabled:text-[#666666] text-black font-bold rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Rolling...
                </span>
              ) : (
                "Roll Dice"
              )}
            </button>

            {/* Balance Display */}
            <div className="mt-4 p-3 bg-[#0a0a0a] rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-[#b0b0b0]">Balance</span>
                <span className="text-white font-bold">{formatCurrency(balance)}</span>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-4">
            <h3 className="text-sm font-medium text-white mb-3">Session Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#b0b0b0]">Bets</span>
                <span className="text-white">{history.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#b0b0b0]">Wins</span>
                <span className="text-[#FFD700]">{winCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#b0b0b0]">Win Rate</span>
                <span className="text-white">{winRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#b0b0b0]">Profit</span>
                <span className={totalProfit >= 0 ? "text-[#FFD700]" : "text-[#DC2626]"}>
                  {totalProfit >= 0 ? "+" : ""}{formatCurrency(totalProfit)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Game Display */}
        <div className="lg:col-span-2 space-y-4">
          {/* Main Game Area */}
          <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-6">
            {/* Dice Display */}
            <div className="flex flex-col items-center justify-center py-12">
              <div
                className={`relative w-32 h-32 rounded-2xl bg-[#0a0a0a] border-2 flex items-center justify-center transition-all duration-300 ${
                  hitAnim
                    ? outcome === "WIN"
                      ? "border-[#FFD700] shadow-[0_0_30px_rgba(255,215,0,0.5)] scale-110"
                      : "border-[#DC2626] shadow-[0_0_30px_rgba(220,38,38,0.5)] scale-110"
                    : "border-[#2a2a2a]"
                } ${loading ? "animate-dice-roll" : ""}`}
              >
                <span className={`text-6xl font-bold ${roll !== null ? "text-white" : "text-[#666666]"}`}>
                  {roll ?? "?"}
                </span>
              </div>

              {/* Result Message */}
              {outcome && (
                <div className={`mt-6 text-center ${hitAnim ? "animate-pulse" : ""}`}>
                  <p className={`text-2xl font-bold ${outcome === "WIN" ? "text-[#FFD700]" : "text-[#DC2626]"}`}>
                    {outcome === "WIN" ? "You Won!" : "You Lost"}
                  </p>
                  <p className="text-[#b0b0b0] mt-1">
                    Rolled {roll} - {roll && roll >= 4 ? "High" : "Low"}
                  </p>
                </div>
              )}

              {!outcome && !loading && (
                <p className="mt-6 text-[#666666]">Place a bet to roll the dice</p>
              )}
            </div>

            {/* Game Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#2a2a2a]">
              <div className="text-center">
                <p className="text-xs text-[#666666] mb-1">Multiplier</p>
                <p className="text-xl font-bold text-white">{payoutMultiplier}x</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-[#666666] mb-1">Win Chance</p>
                <p className="text-xl font-bold text-white">{winChance}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-[#666666] mb-1">Target</p>
                <p className="text-xl font-bold text-white">
                  {guess === "HIGH" ? "4-6" : "1-3"}
                </p>
              </div>
            </div>
          </div>

          {/* Roll History */}
          <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white">Roll History</h3>
              <span className="text-xs text-[#666666]">Last {history.length} rolls</span>
            </div>

            {history.length === 0 ? (
              <p className="text-sm text-[#666666] text-center py-8">
                No rolls yet. Place a bet to start playing!
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${
                          h.outcome === "WIN"
                            ? "bg-[#FFD700]/20 text-[#FFD700]"
                            : "bg-[#DC2626]/20 text-[#DC2626]"
                        }`}
                      >
                        {h.roll}
                      </div>
                      <div>
                        <p className="text-sm text-white">
                          Bet {formatCurrency(h.amount)} on {h.guess}
                        </p>
                        <p className="text-xs text-[#666666]">
                          Rolled {h.roll} ({h.roll >= 4 ? "High" : "Low"})
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-bold ${
                          h.outcome === "WIN" ? "text-[#FFD700]" : "text-[#DC2626]"
                        }`}
                      >
                        {h.outcome === "WIN" ? `+${formatCurrency(h.amount)}` : `-${formatCurrency(h.amount)}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
