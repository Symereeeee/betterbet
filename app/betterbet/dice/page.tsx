// app/betterbet/dice/page.tsx
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useWallet, formatCurrency } from "@/lib/useWallet";
import { useSounds } from "@/lib/useSounds";
import Link from "next/link";

type RollDirection = "over" | "under";

type HistoryItem = {
  id: number;
  amount: number;
  roll: number;
  target: number;
  direction: RollDirection;
  won: boolean;
  payout: number;
};

const HOUSE_EDGE = 0.10; // 10% house edge (90% RTP)

export default function DicePage() {
  const { balance, placeBet: walletPlaceBet, isLoaded } = useWallet();
  const { play } = useSounds();
  const [amount, setAmount] = useState<number>(100);
  const [target, setTarget] = useState<number>(50.5);
  const [direction, setDirection] = useState<RollDirection>("over");
  const [roll, setRoll] = useState<number | null>(null);
  const [won, setWon] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const mobileSliderRef = useRef<HTMLDivElement>(null);

  // Calculate win chance and multiplier
  const winChance = direction === "over"
    ? Math.max(0.01, 99.99 - target)
    : Math.max(0.01, target - 0.01);

  const multiplier = (100 - HOUSE_EDGE * 100) / winChance;
  const payout = amount * multiplier;

  // Update target from win chance
  const updateFromWinChance = (newWinChance: number) => {
    const clampedChance = Math.max(0.01, Math.min(98, newWinChance));
    if (direction === "over") {
      setTarget(parseFloat((99.99 - clampedChance).toFixed(2)));
    } else {
      setTarget(parseFloat((clampedChance + 0.01).toFixed(2)));
    }
  };

  // Update target from multiplier
  const updateFromMultiplier = (newMultiplier: number) => {
    const clampedMult = Math.max(1.0102, Math.min(9700, newMultiplier));
    const newWinChance = (100 - HOUSE_EDGE * 100) / clampedMult;
    updateFromWinChance(newWinChance);
  };

  // Toggle direction
  const toggleDirection = () => {
    setDirection(prev => prev === "over" ? "under" : "over");
  };

  // Handle slider drag
  const handleSliderInteraction = useCallback((clientX: number, isMobile: boolean = false) => {
    const ref = isMobile ? mobileSliderRef.current : sliderRef.current;
    if (!ref) return;
    const rect = ref.getBoundingClientRect();
    const percentage = Math.max(0.5, Math.min(99.5, ((clientX - rect.left) / rect.width) * 100));
    setTarget(parseFloat(percentage.toFixed(2)));
  }, []);

  const [isMobileSlider, setIsMobileSlider] = useState(false);

  const handleMouseDown = (e: React.MouseEvent, mobile: boolean = false) => {
    setIsDragging(true);
    setIsMobileSlider(mobile);
    handleSliderInteraction(e.clientX, mobile);
  };

  const handleTouchStart = (e: React.TouchEvent, mobile: boolean = false) => {
    setIsDragging(true);
    setIsMobileSlider(mobile);
    handleSliderInteraction(e.touches[0].clientX, mobile);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) handleSliderInteraction(e.clientX, isMobileSlider);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) handleSliderInteraction(e.touches[0].clientX, isMobileSlider);
    };
    const handleEnd = () => {
      setIsDragging(false);
      setIsMobileSlider(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, isMobileSlider, handleSliderInteraction]);

  // Animate the roll number
  const animateRoll = useCallback((finalRoll: number) => {
    setIsAnimating(true);
    let iterations = 0;
    const maxIterations = 15;
    const interval = setInterval(() => {
      iterations++;
      setRoll(parseFloat((Math.random() * 100).toFixed(2)));

      if (iterations >= maxIterations) {
        clearInterval(interval);
        setRoll(finalRoll);
        setIsAnimating(false);
      }
    }, 50);
  }, []);

  const placeBet = useCallback(async () => {
    if (amount <= 0 || amount > balance) return;

    setWon(null);
    setLoading(true);
    play("roll");

    // Roll dice (0.00-99.99)
    const diceRoll = parseFloat((Math.random() * 100).toFixed(2));
    animateRoll(diceRoll);

    await new Promise((resolve) => setTimeout(resolve, 800));

    const isWin = direction === "over" ? diceRoll > target : diceRoll < target;
    const winPayout = isWin ? amount * multiplier : 0;

    if (isWin) {
      play(multiplier >= 5 ? "bigWin" : "win");
    } else {
      play("lose");
    }

    walletPlaceBet(amount, isWin, winPayout);
    setWon(isWin);

    setHistory((prev) => [
      { id: Date.now(), amount, roll: diceRoll, target, direction, won: isWin, payout: winPayout },
      ...prev,
    ].slice(0, 20));

    setLoading(false);
  }, [amount, balance, target, direction, multiplier, walletPlaceBet, play, animateRoll]);

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
        <span className="text-white">Dice</span>
      </div>

      {/* Mobile Layout: Game first, then controls */}
      <div className="lg:hidden space-y-4">
        {/* Game Area */}
        <div className="bg-[#1a1a2e] rounded-xl p-4">
          {/* Roll Result Display */}
          {roll !== null && (
            <div className="text-center mb-4">
              <span className={`text-4xl font-bold ${won ? "text-[#22c55e]" : won === false ? "text-[#ef4444]" : "text-white"}`}>
                {roll?.toFixed(2)}
              </span>
            </div>
          )}

          {/* Slider Bar */}
          <div className="relative mb-6 px-2">
            <div
              ref={mobileSliderRef}
              className="relative h-10 rounded-full cursor-pointer select-none"
              onMouseDown={(e) => handleMouseDown(e, true)}
              onTouchStart={(e) => handleTouchStart(e, true)}
            >
              {/* Background gradient */}
              <div
                className="absolute inset-0 rounded-full overflow-hidden"
                style={{
                  background: direction === "over"
                    ? `linear-gradient(to right, #ef4444 0%, #ef4444 ${target}%, #22c55e ${target}%, #22c55e 100%)`
                    : `linear-gradient(to right, #22c55e 0%, #22c55e ${target}%, #ef4444 ${target}%, #ef4444 100%)`
                }}
              />

              {/* Handle */}
              <div
                className={`absolute top-1/2 w-5 h-14 bg-white rounded-md shadow-[0_0_10px_rgba(0,0,0,0.3)] z-10 flex items-center justify-center transition-transform ${isDragging && isMobileSlider ? "scale-110" : ""}`}
                style={{ left: `calc(${target}% - 10px)`, top: "50%", transform: "translateY(-50%)" }}
                onTouchStart={(e) => { e.stopPropagation(); setIsDragging(true); setIsMobileSlider(true); }}
              >
                <div className="flex flex-col gap-1">
                  <div className="w-2.5 h-0.5 bg-gray-400 rounded" />
                  <div className="w-2.5 h-0.5 bg-gray-400 rounded" />
                  <div className="w-2.5 h-0.5 bg-gray-400 rounded" />
                </div>
              </div>

              {/* Roll marker */}
              {roll !== null && !isAnimating && (
                <div
                  className={`absolute top-1/2 w-2.5 h-2.5 rounded-full border-2 border-white z-20 ${won ? "bg-[#22c55e] shadow-[0_0_8px_#22c55e]" : "bg-[#ef4444] shadow-[0_0_8px_#ef4444]"}`}
                  style={{ left: `${roll}%`, transform: "translate(-50%, -50%)" }}
                />
              )}
            </div>

            {/* Scale */}
            <div className="flex justify-between mt-3 text-xs text-[#666666]">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#0f0f1a] rounded-lg p-3">
              <p className="text-xs text-[#666666] mb-1">Multiplier</p>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={multiplier.toFixed(4)}
                  onChange={(e) => updateFromMultiplier(parseFloat(e.target.value) || 2)}
                  className="w-full bg-transparent text-white font-bold text-sm outline-none"
                  step="0.1"
                />
                <span className="text-[#666666] text-xs">X</span>
              </div>
            </div>
            <div className="bg-[#0f0f1a] rounded-lg p-3">
              <p className="text-xs text-[#666666] mb-1">Win Chance</p>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={winChance.toFixed(2)}
                  onChange={(e) => updateFromWinChance(parseFloat(e.target.value) || 50)}
                  className="w-full bg-transparent text-white font-bold text-sm outline-none"
                  step="1"
                />
                <span className="text-[#666666] text-xs">%</span>
              </div>
            </div>
            <div className="bg-[#0f0f1a] rounded-lg p-3">
              <p className="text-xs text-[#666666] mb-1">Roll {direction === "over" ? "Over" : "Under"}</p>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={target.toFixed(2)}
                  onChange={(e) => setTarget(parseFloat(e.target.value) || 50)}
                  className="w-full bg-transparent text-white font-bold text-sm outline-none"
                  step="0.5"
                />
                <button onClick={toggleDirection} className="text-[#FFD700] hover:text-[#FFEA00]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Betting Controls */}
        <div className="bg-[#1a1a2e] rounded-xl p-4 space-y-4">
          {/* Bet Amount */}
          <div>
            <label className="text-xs text-[#666666] mb-2 block">Bet Amount</label>
            <div className="flex items-center bg-[#0f0f1a] rounded-lg overflow-hidden">
              <span className="px-3 text-[#666666]">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                className="flex-1 bg-transparent py-3 text-white outline-none"
              />
              <button onClick={() => setAmount(a => Math.max(1, Math.floor(a / 2)))} className="px-3 py-3 text-[#666666] hover:text-white hover:bg-[#2a2a3e]">½</button>
              <button onClick={() => setAmount(a => Math.min(Math.floor(balance), a * 2))} className="px-3 py-3 text-[#666666] hover:text-white hover:bg-[#2a2a3e]">2×</button>
            </div>
          </div>

          {/* Balance & Place Bet */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#666666]">Balance</p>
              <p className="text-lg font-bold text-white">{formatCurrency(balance)}</p>
            </div>
            <button
              onClick={placeBet}
              disabled={loading || amount <= 0 || amount > balance}
              className="px-12 py-4 bg-gradient-to-r from-[#DC2626] to-[#FFD700] hover:from-[#EF4444] hover:to-[#FFEA00] disabled:bg-[#2a2a3e] disabled:from-[#2a2a3e] disabled:to-[#2a2a3e] disabled:text-[#666666] text-white font-bold rounded-full transition-colors disabled:cursor-not-allowed"
            >
              {loading ? "Rolling..." : "Place bet"}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6">
        {/* LEFT: Betting Panel */}
        <div className="space-y-4">
          <div className="bg-[#1a1a2e] rounded-xl p-4">
            {/* Mode tabs */}
            <div className="flex bg-[#0f0f1a] rounded-lg p-1 mb-6">
              <button className="flex-1 py-2 px-4 rounded-md bg-transparent text-white text-sm font-medium border-b-2 border-[#FFD700]">
                Manual
              </button>
              <button className="flex-1 py-2 px-4 rounded-md text-[#666666] text-sm font-medium hover:text-white transition-colors">
                Auto
              </button>
            </div>

            {/* Bet Amount */}
            <div className="space-y-2 mb-4">
              <label className="text-xs text-[#666666] font-medium">Bet Amount</label>
              <div className="flex items-center bg-[#0f0f1a] rounded-lg overflow-hidden">
                <span className="px-3 text-[#666666]">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="flex-1 bg-transparent py-3 text-white outline-none"
                />
                <button className="px-2 py-3 text-[#22c55e] hover:bg-[#2a2a3e]">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                </button>
                <button onClick={() => setAmount(a => Math.max(1, Math.floor(a / 2)))} className="px-3 py-3 text-[#666666] hover:text-white hover:bg-[#2a2a3e]">½</button>
                <button onClick={() => setAmount(a => Math.min(Math.floor(balance), a * 2))} className="px-3 py-3 text-[#666666] hover:text-white hover:bg-[#2a2a3e]">2×</button>
                <button className="px-2 py-3 text-[#666666] hover:text-white hover:bg-[#2a2a3e]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Payout Display */}
            <div className="flex justify-between items-center py-3 px-4 bg-[#0f0f1a] rounded-lg mb-4">
              <span className="text-sm text-[#666666]">Payout</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">{formatCurrency(payout)}</span>
                <span className="text-[#FFD700] text-sm">{multiplier.toFixed(2)}x</span>
              </div>
            </div>

            {/* Place Bet Button */}
            <button
              onClick={placeBet}
              disabled={loading || amount <= 0 || amount > balance}
              className="w-full py-4 bg-gradient-to-r from-[#DC2626] to-[#FFD700] hover:from-[#EF4444] hover:to-[#FFEA00] disabled:bg-[#2a2a3e] disabled:from-[#2a2a3e] disabled:to-[#2a2a3e] disabled:text-[#666666] text-white font-bold rounded-full transition-colors disabled:cursor-not-allowed"
            >
              {loading ? "Rolling..." : "Place bet"}
            </button>

            {/* Balance Display */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-[#666666]">Balance:</span>
              <span className="text-white font-bold">{formatCurrency(balance)}</span>
            </div>
          </div>

          {/* History */}
          <div className="bg-[#1a1a2e] rounded-xl p-4">
            <h3 className="text-sm font-medium text-white mb-3">Recent Rolls</h3>
            {history.length === 0 ? (
              <p className="text-xs text-[#666666] text-center py-4">No rolls yet</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {history.slice(0, 5).map((h) => (
                  <div key={h.id} className="flex justify-between items-center text-sm">
                    <span className={`font-bold ${h.won ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                      {h.roll.toFixed(2)}
                    </span>
                    <span className={h.won ? "text-[#22c55e]" : "text-[#ef4444]"}>
                      {h.won ? `+${formatCurrency(h.payout - h.amount)}` : `-${formatCurrency(h.amount)}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Game Display */}
        <div className="lg:col-span-2">
          <div className="bg-[#1a1a2e] rounded-xl p-6 h-full flex flex-col justify-center">
            {/* Roll Result */}
            {roll !== null && (
              <div className="text-center mb-8">
                <span className={`text-6xl font-bold ${isAnimating ? "text-white blur-sm" : won ? "text-[#22c55e]" : won === false ? "text-[#ef4444]" : "text-white"}`}>
                  {roll?.toFixed(2)}
                </span>
                {won !== null && !isAnimating && (
                  <p className={`text-xl mt-2 ${won ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                    {won ? "WIN!" : "LOSE"}
                  </p>
                )}
              </div>
            )}

            {/* Slider Bar */}
            <div className="relative mb-8 px-4">
              <div
                ref={sliderRef}
                className="relative h-12 rounded-full cursor-pointer select-none"
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
              >
                {/* Background gradient */}
                <div
                  className="absolute inset-0 rounded-full overflow-hidden"
                  style={{
                    background: direction === "over"
                      ? `linear-gradient(to right, #ef4444 0%, #ef4444 ${target}%, #22c55e ${target}%, #22c55e 100%)`
                      : `linear-gradient(to right, #22c55e 0%, #22c55e ${target}%, #ef4444 ${target}%, #ef4444 100%)`
                  }}
                />

                {/* Handle */}
                <div
                  className={`absolute top-1/2 w-6 h-16 bg-white rounded-md shadow-[0_0_10px_rgba(0,0,0,0.3)] z-10 flex items-center justify-center transition-transform ${isDragging && !isMobileSlider ? "scale-110 cursor-grabbing" : "cursor-grab hover:scale-105"}`}
                  style={{ left: `calc(${target}% - 12px)`, top: "50%", transform: "translateY(-50%)" }}
                  onMouseDown={(e) => { e.stopPropagation(); setIsDragging(true); setIsMobileSlider(false); }}
                  onTouchStart={(e) => { e.stopPropagation(); setIsDragging(true); setIsMobileSlider(false); }}
                >
                  <div className="flex flex-col gap-1">
                    <div className="w-3 h-0.5 bg-gray-400 rounded" />
                    <div className="w-3 h-0.5 bg-gray-400 rounded" />
                    <div className="w-3 h-0.5 bg-gray-400 rounded" />
                  </div>
                </div>

                {/* Roll marker */}
                {roll !== null && !isAnimating && (
                  <div
                    className={`absolute top-1/2 w-3 h-3 rounded-full border-2 border-white z-20 transition-all ${won ? "bg-[#22c55e] shadow-[0_0_10px_#22c55e]" : "bg-[#ef4444] shadow-[0_0_10px_#ef4444]"}`}
                    style={{ left: `${roll}%`, transform: "translate(-50%, -50%)" }}
                  />
                )}
              </div>

              {/* Scale */}
              <div className="flex justify-between mt-4 text-sm text-[#666666] px-1">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#0f0f1a] rounded-lg p-4">
                <p className="text-xs text-[#666666] mb-2">Multiplier</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={multiplier.toFixed(4)}
                    onChange={(e) => updateFromMultiplier(parseFloat(e.target.value) || 2)}
                    className="w-full bg-transparent text-white font-bold text-lg outline-none"
                    step="0.1"
                  />
                  <span className="text-[#666666]">X</span>
                </div>
              </div>
              <div className="bg-[#0f0f1a] rounded-lg p-4">
                <p className="text-xs text-[#666666] mb-2">Win Chance</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={winChance.toFixed(2)}
                    onChange={(e) => updateFromWinChance(parseFloat(e.target.value) || 50)}
                    className="w-full bg-transparent text-white font-bold text-lg outline-none"
                    step="1"
                  />
                  <span className="text-[#666666]">%</span>
                </div>
              </div>
              <div className="bg-[#0f0f1a] rounded-lg p-4">
                <p className="text-xs text-[#666666] mb-2">Roll {direction === "over" ? "Over" : "Under"}</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={target.toFixed(1)}
                    onChange={(e) => setTarget(parseFloat(e.target.value) || 50)}
                    className="w-full bg-transparent text-white font-bold text-lg outline-none"
                    step="0.5"
                  />
                  <button onClick={toggleDirection} className="text-[#FFD700] hover:text-[#FFEA00] p-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
