// app/betterbet/plinko/page.tsx
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useWallet, formatCurrency } from "@/lib/useWallet";
import { useSounds } from "@/lib/useSounds";
import Link from "next/link";

type RiskLevel = "low" | "medium" | "high";

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  row: number;
  finalSlot: number | null;
  done: boolean;
  betAmount: number;
}

// Multipliers based on risk level and rows (90% RTP)
const getMultipliers = (rows: number, risk: RiskLevel): number[] => {
  const multiplierSets: Record<number, Record<RiskLevel, number[]>> = {
    8: {
      low: [1.1, 0.9, 0.7, 0.5, 0.4, 0.5, 0.7, 0.9, 1.1],
      medium: [1.8, 1.0, 0.6, 0.4, 0.2, 0.4, 0.6, 1.0, 1.8],
      high: [5, 1.8, 0.8, 0.3, 0.1, 0.3, 0.8, 1.8, 5],
    },
    10: {
      low: [1.2, 0.9, 0.7, 0.5, 0.4, 0.3, 0.4, 0.5, 0.7, 0.9, 1.2],
      medium: [2.5, 1.3, 0.8, 0.5, 0.3, 0.2, 0.3, 0.5, 0.8, 1.3, 2.5],
      high: [12, 2.5, 1.5, 0.7, 0.3, 0.1, 0.3, 0.7, 1.5, 2.5, 12],
    },
    12: {
      low: [1.2, 1.0, 0.8, 0.6, 0.5, 0.4, 0.3, 0.4, 0.5, 0.6, 0.8, 1.0, 1.2],
      medium: [3, 1.8, 1.1, 0.8, 0.5, 0.3, 0.2, 0.3, 0.5, 0.8, 1.1, 1.8, 3],
      high: [18, 6, 2.2, 1.0, 0.5, 0.3, 0.1, 0.3, 0.5, 1.0, 2.2, 6, 18],
    },
    14: {
      low: [1.3, 1.1, 0.9, 0.7, 0.5, 0.4, 0.35, 0.3, 0.35, 0.4, 0.5, 0.7, 0.9, 1.1, 1.3],
      medium: [4, 2.2, 1.4, 1.0, 0.7, 0.4, 0.3, 0.2, 0.3, 0.4, 0.7, 1.0, 1.4, 2.2, 4],
      high: [30, 10, 3.5, 1.8, 0.8, 0.4, 0.2, 0.1, 0.2, 0.4, 0.8, 1.8, 3.5, 10, 30],
    },
    16: {
      low: [1.3, 1.2, 1.0, 0.8, 0.7, 0.5, 0.4, 0.35, 0.3, 0.35, 0.4, 0.5, 0.7, 0.8, 1.0, 1.2, 1.3],
      medium: [5, 2.6, 1.8, 1.2, 0.8, 0.6, 0.4, 0.3, 0.2, 0.3, 0.4, 0.6, 0.8, 1.2, 1.8, 2.6, 5],
      high: [60, 18, 6, 2.6, 1.2, 0.5, 0.3, 0.2, 0.1, 0.2, 0.3, 0.5, 1.2, 2.6, 6, 18, 60],
    },
  };
  return multiplierSets[rows]?.[risk] || multiplierSets[12][risk];
};

const GRAVITY = 0.25;
const BOUNCE = 0.6;
const FRICTION = 0.995;
const BOARD_WIDTH = 100;
const BOARD_HEIGHT = 100;
const PIN_RADIUS = 0.8;
const BALL_RADIUS = 1.4;

export default function PlinkoPage() {
  const { balance, placeBet: walletPlaceBet, isLoaded } = useWallet();
  const { play } = useSounds();
  const [betAmount, setBetAmount] = useState(10);
  const [rows, setRows] = useState(12);
  const [risk, setRisk] = useState<RiskLevel>("medium");
  const [balls, setBalls] = useState<Ball[]>([]);
  const [history, setHistory] = useState<{ multiplier: number; win: number; bet: number }[]>([]);
  const [activeBets, setActiveBets] = useState(0);
  const ballIdRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const multipliers = getMultipliers(rows, risk);
  const numSlots = rows + 1;

  // Calculate pin positions based on rows
  const getPinPositions = useCallback(() => {
    const pins: { x: number; y: number; row: number }[] = [];
    const PINS_START = 3;
    for (let row = 0; row < rows; row++) {
      const pinsInRow = PINS_START + row;
      const rowY = 15 + (row * 60) / rows;
      const totalWidth = 70;
      const spacing = totalWidth / (pinsInRow - 1 || 1);
      const startX = (BOARD_WIDTH - totalWidth) / 2;

      for (let pin = 0; pin < pinsInRow; pin++) {
        pins.push({ x: startX + pin * spacing, y: rowY, row });
      }
    }
    return pins;
  }, [rows]);

  const pinPositions = getPinPositions();

  // Physics simulation
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = Math.min((timestamp - lastTimeRef.current) / 16, 2);
      lastTimeRef.current = timestamp;

      setBalls((prevBalls) => {
        const newBalls = prevBalls.map((ball) => {
          if (ball.done) return ball;

          let { x, y, vx, vy, row } = ball;

          vy += GRAVITY * deltaTime;
          x += vx * deltaTime;
          y += vy * deltaTime;
          vx *= FRICTION;

          if (x < BALL_RADIUS + 5) {
            x = BALL_RADIUS + 5;
            vx = Math.abs(vx) * BOUNCE;
          }
          if (x > BOARD_WIDTH - BALL_RADIUS - 5) {
            x = BOARD_WIDTH - BALL_RADIUS - 5;
            vx = -Math.abs(vx) * BOUNCE;
          }

          for (const pin of pinPositions) {
            const dx = x - pin.x;
            const dy = y - pin.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = PIN_RADIUS + BALL_RADIUS;

            if (dist < minDist && dist > 0) {
              const overlap = minDist - dist;
              const nx = dx / dist;
              const ny = dy / dist;

              x += nx * overlap;
              y += ny * overlap;

              const dotProduct = vx * nx + vy * ny;
              vx = (vx - 2 * dotProduct * nx) * BOUNCE;
              vy = (vy - 2 * dotProduct * ny) * BOUNCE;
              // Add randomness with slight bias toward center (where house edge is)
              const centerBias = (BOARD_WIDTH / 2 - x) * 0.02;
              vx += (Math.random() - 0.5) * 1.2 + centerBias;

              if (pin.row > row) row = pin.row;
            }
          }

          if (y >= 82) {
            // Calculate slot more accurately - use the center of the ball position
            const slotWidth = 70 / numSlots;
            const startX = (BOARD_WIDTH - 70) / 2;
            // Use round instead of floor for better accuracy at boundaries
            let slot = Math.round((x - startX - slotWidth / 2) / slotWidth);
            slot = Math.max(0, Math.min(numSlots - 1, slot));

            return { ...ball, x, y: 82, vx: 0, vy: 0, row, finalSlot: slot, done: true };
          }

          return { ...ball, x, y, vx, vy, row };
        });

        return newBalls;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [pinPositions, numSlots]);

  // Handle ball completion
  useEffect(() => {
    balls.forEach((ball) => {
      if (ball.done && ball.finalSlot !== null) {
        const multiplier = multipliers[ball.finalSlot];
        const winAmount = ball.betAmount * multiplier;
        const won = multiplier >= 1;

        if (won) {
          play(multiplier >= 3 ? "bigWin" : "win");
        } else {
          play("lose");
        }

        walletPlaceBet(ball.betAmount, won, winAmount);

        setHistory((prev) => [
          { multiplier, win: winAmount, bet: ball.betAmount },
          ...prev,
        ].slice(0, 10));

        setActiveBets((prev) => Math.max(0, prev - 1));

        setTimeout(() => {
          setBalls((prev) => prev.filter((b) => b.id !== ball.id));
        }, 1500);

        setBalls((prev) =>
          prev.map((b) =>
            b.id === ball.id ? { ...b, finalSlot: null } : b
          )
        );
      }
    });
  }, [balls, multipliers, walletPlaceBet, play]);

  const dropBall = useCallback(() => {
    if (betAmount <= 0 || betAmount > balance) return;

    play("click");
    setActiveBets((prev) => prev + 1);

    const newBall: Ball = {
      id: ballIdRef.current++,
      x: BOARD_WIDTH / 2 + (Math.random() - 0.5) * 4,
      y: 5,
      vx: (Math.random() - 0.5) * 2,
      vy: 0,
      row: -1,
      finalSlot: null,
      done: false,
      betAmount,
    };

    setBalls((prev) => [...prev, newBall]);
  }, [betAmount, balance, play]);

  const dropIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoDrop = useCallback(() => {
    if (dropIntervalRef.current) return;
    dropBall();
    dropIntervalRef.current = setInterval(() => {
      if (betAmount <= balance) dropBall();
    }, 200);
  }, [dropBall, betAmount, balance]);

  const stopAutoDrop = useCallback(() => {
    if (dropIntervalRef.current) {
      clearInterval(dropIntervalRef.current);
      dropIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (dropIntervalRef.current) clearInterval(dropIntervalRef.current);
    };
  }, []);

  const getMultiplierColor = (mult: number) => {
    if (mult >= 10) return "bg-gradient-to-b from-[#ef4444] to-[#dc2626] text-white";
    if (mult >= 3) return "bg-gradient-to-b from-[#f97316] to-[#ea580c] text-white";
    if (mult >= 1.5) return "bg-gradient-to-b from-[#eab308] to-[#ca8a04] text-black";
    if (mult >= 1) return "bg-gradient-to-b from-[#fbbf24] to-[#f59e0b] text-black";
    return "bg-gradient-to-b from-[#facc15] to-[#eab308] text-black";
  };

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
        <span className="text-white">Plinko</span>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden space-y-4">
        {/* Game Board */}
        <div className="bg-[#1a1a2e] rounded-xl p-4">
          <div className="relative w-full aspect-[4/5] bg-gradient-to-b from-[#0f0f1a] to-[#1a1a2e] rounded-xl overflow-hidden">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
              {pinPositions.map((pin, i) => (
                <circle key={i} cx={pin.x} cy={pin.y} r={PIN_RADIUS} className="fill-white" style={{ filter: "drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))" }} />
              ))}
              {balls.map((ball) => (
                <g key={ball.id}>
                  <circle cx={ball.x} cy={ball.y} r={BALL_RADIUS} className="fill-[#FFD700]" style={{ filter: "drop-shadow(0 0 8px rgba(255, 215, 0, 0.8))" }} />
                </g>
              ))}
            </svg>

            {/* Multiplier slots */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-px px-1 pb-2">
              {multipliers.map((mult, i) => (
                <div key={i} className={`flex-1 py-1 rounded text-center text-[7px] font-bold ${getMultiplierColor(mult)}`}>
                  {mult}x
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-[#1a1a2e] rounded-xl p-4 space-y-4">
          {/* Bet Amount */}
          <div>
            <label className="text-xs text-[#666666] mb-2 block">Bet Amount</label>
            <div className="flex items-center bg-[#0f0f1a] rounded-lg overflow-hidden">
              <span className="px-3 text-[#666666]">$</span>
              <input type="number" min={1} value={betAmount} onChange={(e) => setBetAmount(Number(e.target.value) || 0)} className="flex-1 bg-transparent py-3 text-white outline-none" />
              <button onClick={() => setBetAmount((a) => Math.max(1, Math.floor(a / 2)))} className="px-3 py-3 text-[#666666] hover:text-white hover:bg-[#2a2a3e]">½</button>
              <button onClick={() => setBetAmount((a) => Math.min(balance, a * 2))} className="px-3 py-3 text-[#666666] hover:text-white hover:bg-[#2a2a3e]">2×</button>
            </div>
          </div>

          {/* Risk Level */}
          <div>
            <label className="text-xs text-[#666666] mb-2 block">Risk Levels</label>
            <div className="grid grid-cols-3 gap-2">
              {(["low", "medium", "high"] as RiskLevel[]).map((level) => (
                <button key={level} onClick={() => setRisk(level)} className={`py-2 rounded-lg text-sm font-medium capitalize transition-all ${risk === level ? "bg-[#2a2a3e] text-white" : "bg-[#0f0f1a] text-[#666666] hover:text-white"}`}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Balance & Bet */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-xs text-[#666666]">Balance</p>
              <p className="text-lg font-bold text-white">{formatCurrency(balance)}</p>
            </div>
            <button onClick={dropBall} disabled={betAmount <= 0 || betAmount > balance} className="px-10 py-4 bg-gradient-to-r from-[#DC2626] to-[#FFD700] hover:from-[#EF4444] hover:to-[#FFEA00] disabled:bg-[#2a2a3e] disabled:from-[#2a2a3e] disabled:to-[#2a2a3e] disabled:text-[#666666] text-white font-bold rounded-full transition-colors disabled:cursor-not-allowed">
              Place bet
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
              <button className="flex-1 py-2 px-4 rounded-md bg-transparent text-white text-sm font-medium border-b-2 border-[#FFD700]">Manual</button>
              <button className="flex-1 py-2 px-4 rounded-md text-[#666666] text-sm font-medium hover:text-white transition-colors">Auto</button>
            </div>

            {/* Bet Amount */}
            <div className="space-y-2 mb-4">
              <label className="text-xs text-[#666666] font-medium">Bet Amount</label>
              <div className="flex items-center bg-[#0f0f1a] rounded-lg overflow-hidden">
                <span className="px-3 text-[#666666]">$</span>
                <input type="number" min={1} value={betAmount} onChange={(e) => setBetAmount(Number(e.target.value) || 0)} className="flex-1 bg-transparent py-3 text-white outline-none" />
                <button className="px-2 py-3 text-[#22c55e] hover:bg-[#2a2a3e]">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                </button>
                <button onClick={() => setBetAmount((a) => Math.max(1, Math.floor(a / 2)))} className="px-3 py-3 text-[#666666] hover:text-white hover:bg-[#2a2a3e]">½</button>
                <button onClick={() => setBetAmount((a) => Math.min(balance, a * 2))} className="px-3 py-3 text-[#666666] hover:text-white hover:bg-[#2a2a3e]">2×</button>
                <button className="px-2 py-3 text-[#666666] hover:text-white hover:bg-[#2a2a3e]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
                </button>
              </div>
            </div>

            {/* Rows Slider */}
            <div className="space-y-2 mb-4">
              <label className="text-xs text-[#666666] font-medium">Rows</label>
              <div className="flex items-center gap-3 bg-[#0f0f1a] rounded-lg px-4 py-3">
                <span className="text-white font-bold w-6">{rows}</span>
                <input type="range" min={8} max={16} step={2} value={rows} onChange={(e) => setRows(Number(e.target.value))} className="flex-1 h-1 bg-[#2a2a3e] rounded-lg appearance-none cursor-pointer accent-white" />
              </div>
            </div>

            {/* Risk Level */}
            <div className="space-y-2 mb-6">
              <label className="text-xs text-[#666666] font-medium">Risk Levels</label>
              <div className="grid grid-cols-3 gap-2">
                {(["low", "medium", "high"] as RiskLevel[]).map((level) => (
                  <button key={level} onClick={() => setRisk(level)} className={`py-2 rounded-lg text-sm font-medium capitalize transition-all ${risk === level ? "bg-[#2a2a3e] text-white" : "bg-[#0f0f1a] text-[#666666] hover:text-white"}`}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Place Bet */}
            <button onClick={dropBall} disabled={betAmount <= 0 || betAmount > balance} className="w-full py-4 bg-gradient-to-r from-[#DC2626] to-[#FFD700] hover:from-[#EF4444] hover:to-[#FFEA00] disabled:bg-[#2a2a3e] disabled:from-[#2a2a3e] disabled:to-[#2a2a3e] disabled:text-[#666666] text-white font-bold rounded-full transition-colors disabled:cursor-not-allowed">
              Place bet
            </button>

            {/* Auto Drop */}
            <button onMouseDown={startAutoDrop} onMouseUp={stopAutoDrop} onMouseLeave={stopAutoDrop} onTouchStart={startAutoDrop} onTouchEnd={stopAutoDrop} disabled={betAmount <= 0 || betAmount > balance} className="w-full mt-2 py-3 bg-[#2a2a3e] hover:bg-[#3a3a4e] disabled:bg-[#1a1a2e] disabled:text-[#666666] text-white font-medium rounded-full transition-colors disabled:cursor-not-allowed text-sm">
              Hold for Auto Drop
            </button>

            {/* Balance */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-[#666666]">Balance:</span>
              <span className="text-white font-bold">{formatCurrency(balance)}</span>
            </div>

            {activeBets > 0 && (
              <div className="mt-2 p-2 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg text-center">
                <span className="text-sm text-[#FFD700]">{activeBets} ball{activeBets > 1 ? 's' : ''} in play</span>
              </div>
            )}
          </div>

          {/* History */}
          <div className="bg-[#1a1a2e] rounded-xl p-4">
            <h3 className="text-sm font-medium text-white mb-3">Recent Drops</h3>
            {history.length === 0 ? (
              <p className="text-xs text-[#666666] text-center py-4">No drops yet</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {history.map((h, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getMultiplierColor(h.multiplier)}`}>{h.multiplier}x</span>
                    <span className={h.win >= h.bet ? "text-[#22c55e]" : "text-[#ef4444]"}>
                      {h.win >= h.bet ? "+" : ""}{formatCurrency(h.win - h.bet)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Game Board */}
        <div className="lg:col-span-2">
          <div className="bg-[#1a1a2e] rounded-xl p-6 h-full">
            <div className="relative w-full max-w-xl mx-auto aspect-[4/5] bg-gradient-to-b from-[#0f0f1a] to-[#1a1a2e] rounded-xl overflow-hidden">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                {/* Drop zone */}
                <rect x="40" y="0" width="20" height="8" fill="#FFD700" fillOpacity="0.1" rx="2" />
                <text x="50" y="5" textAnchor="middle" fill="#FFD700" fontSize="3" fontWeight="bold">DROP</text>

                {/* Pins */}
                {pinPositions.map((pin, i) => (
                  <circle key={i} cx={pin.x} cy={pin.y} r={PIN_RADIUS} className="fill-white" style={{ filter: "drop-shadow(0 0 3px rgba(255, 255, 255, 0.6))" }} />
                ))}

                {/* Balls */}
                {balls.map((ball) => (
                  <g key={ball.id}>
                    <ellipse cx={ball.x} cy={ball.y + BALL_RADIUS} rx={BALL_RADIUS * 0.8} ry={BALL_RADIUS * 0.3} fill="rgba(0,0,0,0.3)" />
                    <circle cx={ball.x} cy={ball.y} r={BALL_RADIUS} className="fill-[#FFD700]" style={{ filter: "drop-shadow(0 0 8px rgba(255, 215, 0, 0.8))" }} />
                    <circle cx={ball.x - BALL_RADIUS * 0.3} cy={ball.y - BALL_RADIUS * 0.3} r={BALL_RADIUS * 0.3} fill="rgba(255,255,255,0.4)" />
                  </g>
                ))}
              </svg>

              {/* Multiplier slots */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-0.5 px-2 pb-2">
                {multipliers.map((mult, i) => (
                  <div key={i} className={`flex-1 py-2 rounded text-center text-xs font-bold ${getMultiplierColor(mult)}`}>
                    {mult}x
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-[#666666] mb-1">Risk Level</p>
                <p className="text-xl font-bold text-white capitalize">{risk}</p>
              </div>
              <div>
                <p className="text-xs text-[#666666] mb-1">Rows</p>
                <p className="text-xl font-bold text-white">{rows}</p>
              </div>
              <div>
                <p className="text-xs text-[#666666] mb-1">Max Win</p>
                <p className="text-xl font-bold text-[#FFD700]">{Math.max(...multipliers)}x</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
