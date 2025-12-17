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

// Multipliers based on risk level (for 8 rows = 9 slots)
const MULTIPLIERS: Record<RiskLevel, number[]> = {
  low: [1.5, 1.2, 1.1, 1.0, 0.5, 1.0, 1.1, 1.2, 1.5],
  medium: [3, 1.5, 1.2, 0.8, 0.4, 0.8, 1.2, 1.5, 3],
  high: [10, 3, 1.5, 0.5, 0.2, 0.5, 1.5, 3, 10],
};

const ROWS = 8;
const PINS_START = 3;
const GRAVITY = 0.4;
const BOUNCE = 0.7;
const FRICTION = 0.99;

// Board dimensions in SVG viewBox units
const BOARD_WIDTH = 100;
const BOARD_HEIGHT = 100;
const PIN_RADIUS = 1.5;
const BALL_RADIUS = 2.5;

// Calculate pin positions
const getPinPositions = () => {
  const pins: { x: number; y: number; row: number }[] = [];
  for (let row = 0; row < ROWS; row++) {
    const pinsInRow = PINS_START + row;
    const rowY = 15 + (row * 60) / ROWS;
    const totalWidth = 70;
    const spacing = totalWidth / (pinsInRow - 1 || 1);
    const startX = (BOARD_WIDTH - totalWidth) / 2;

    for (let pin = 0; pin < pinsInRow; pin++) {
      pins.push({
        x: startX + pin * spacing,
        y: rowY,
        row,
      });
    }
  }
  return pins;
};

const PIN_POSITIONS = getPinPositions();

export default function PlinkoPage() {
  const { balance, placeBet: walletPlaceBet, isLoaded } = useWallet();
  const { play } = useSounds();
  const [betAmount, setBetAmount] = useState(10);
  const [risk, setRisk] = useState<RiskLevel>("high");
  const [balls, setBalls] = useState<Ball[]>([]);
  const [history, setHistory] = useState<{ multiplier: number; win: number; bet: number }[]>([]);
  const [activeBets, setActiveBets] = useState(0);
  const ballIdRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const multipliers = MULTIPLIERS[risk];

  // Physics simulation
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = Math.min((timestamp - lastTimeRef.current) / 16, 2); // Cap at 2x speed
      lastTimeRef.current = timestamp;

      setBalls((prevBalls) => {
        let updated = false;
        const newBalls = prevBalls.map((ball) => {
          if (ball.done) return ball;
          updated = true;

          let { x, y, vx, vy, row } = ball;

          // Apply gravity
          vy += GRAVITY * deltaTime;

          // Apply velocity
          x += vx * deltaTime;
          y += vy * deltaTime;

          // Apply friction
          vx *= FRICTION;

          // Wall collisions
          if (x < BALL_RADIUS + 5) {
            x = BALL_RADIUS + 5;
            vx = Math.abs(vx) * BOUNCE;
          }
          if (x > BOARD_WIDTH - BALL_RADIUS - 5) {
            x = BOARD_WIDTH - BALL_RADIUS - 5;
            vx = -Math.abs(vx) * BOUNCE;
          }

          // Pin collisions
          for (const pin of PIN_POSITIONS) {
            const dx = x - pin.x;
            const dy = y - pin.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = PIN_RADIUS + BALL_RADIUS;

            if (dist < minDist && dist > 0) {
              // Collision detected
              const overlap = minDist - dist;
              const nx = dx / dist;
              const ny = dy / dist;

              // Push ball out
              x += nx * overlap;
              y += ny * overlap;

              // Reflect velocity
              const dotProduct = vx * nx + vy * ny;
              vx = (vx - 2 * dotProduct * nx) * BOUNCE;
              vy = (vy - 2 * dotProduct * ny) * BOUNCE;

              // Add randomness for natural bouncing
              vx += (Math.random() - 0.5) * 1.5;

              // Track row progression
              if (pin.row > row) {
                row = pin.row;
              }
            }
          }

          // Check if ball reached bottom
          if (y >= 82) {
            // Calculate which slot the ball landed in
            const slotWidth = 70 / 9;
            const startX = (BOARD_WIDTH - 70) / 2;
            let slot = Math.floor((x - startX) / slotWidth);
            slot = Math.max(0, Math.min(8, slot));

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
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Handle ball completion
  useEffect(() => {
    balls.forEach((ball) => {
      if (ball.done && ball.finalSlot !== null) {
        const multiplier = multipliers[ball.finalSlot];
        const winAmount = ball.betAmount * multiplier;
        const won = multiplier >= 1;

        // Play sound
        if (won) {
          play(multiplier >= 3 ? "bigWin" : "win");
        } else {
          play("lose");
        }

        // Process bet
        walletPlaceBet(ball.betAmount, won, winAmount);

        // Add to history
        setHistory((prev) => [
          { multiplier, win: winAmount, bet: ball.betAmount },
          ...prev,
        ].slice(0, 10));

        setActiveBets((prev) => Math.max(0, prev - 1));

        // Remove ball after delay
        setTimeout(() => {
          setBalls((prev) => prev.filter((b) => b.id !== ball.id));
        }, 1500);

        // Mark as processed by setting finalSlot to null
        setBalls((prev) =>
          prev.map((b) =>
            b.id === ball.id ? { ...b, finalSlot: null } : b
          )
        );
      }
    });
  }, [balls, multipliers, walletPlaceBet, play]);

  // Drop a ball
  const dropBall = useCallback(() => {
    if (betAmount <= 0 || betAmount > balance) return;

    play("click");
    setActiveBets((prev) => prev + 1);

    const newBall: Ball = {
      id: ballIdRef.current++,
      x: BOARD_WIDTH / 2 + (Math.random() - 0.5) * 4, // Slight random start position
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

  // Auto-drop for rapid betting
  const dropIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoDrop = useCallback(() => {
    if (dropIntervalRef.current) return;
    dropBall();
    dropIntervalRef.current = setInterval(() => {
      if (betAmount <= balance) {
        dropBall();
      }
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
      if (dropIntervalRef.current) {
        clearInterval(dropIntervalRef.current);
      }
    };
  }, []);

  const getMultiplierColor = (mult: number) => {
    if (mult >= 3) return "bg-[#DC2626] text-white";
    if (mult >= 1.5) return "bg-[#FFD700] text-black";
    if (mult >= 1) return "bg-[#2a2a2a] text-white";
    return "bg-[#1a1a1a] text-[#666666]";
  };

  const getSlotHighlight = (index: number) => {
    const recentSlots = balls.filter(b => b.done && b.finalSlot === null).length === 0
      ? []
      : balls.filter(b => b.done).map(b => {
          const slotWidth = 70 / 9;
          const startX = (BOARD_WIDTH - 70) / 2;
          return Math.floor((b.x - startX) / slotWidth);
        });

    const hitCount = recentSlots.filter(s => s === index).length;
    if (hitCount > 0) return "ring-2 ring-white scale-105";
    return "";
  };

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
        <span className="text-white">Plinko</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Betting Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-4">
            <h2 className="text-lg font-bold text-white mb-4">Plinko</h2>

            {/* Bet Amount */}
            <div className="space-y-2 mb-4">
              <label className="text-xs text-[#b0b0b0] font-medium">Bet Amount</label>
              <div className="flex items-center bg-[#0a0a0a] rounded-lg border border-[#2a2a2a] overflow-hidden">
                <span className="px-3 text-[#666666]">$</span>
                <input
                  type="number"
                  min={1}
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value) || 0)}
                  className="flex-1 bg-transparent py-3 text-white outline-none"
                />
                <div className="flex border-l border-[#2a2a2a]">
                  <button
                    onClick={() => setBetAmount((a) => Math.max(1, Math.floor(a / 2)))}
                    className="px-3 py-3 text-[#b0b0b0] hover:text-white hover:bg-[#2a2a2a] transition-colors text-sm"
                  >
                    ½
                  </button>
                  <button
                    onClick={() => setBetAmount((a) => Math.min(balance, a * 2))}
                    className="px-3 py-3 text-[#b0b0b0] hover:text-white hover:bg-[#2a2a2a] transition-colors text-sm border-l border-[#2a2a2a]"
                  >
                    2×
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                {[1, 5, 10, 50].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setBetAmount(preset)}
                    className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                      betAmount === preset
                        ? "bg-[#FFD700] text-black font-bold"
                        : "bg-[#0a0a0a] hover:bg-[#2a2a2a] text-[#b0b0b0] hover:text-white"
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Risk Level */}
            <div className="space-y-2 mb-4">
              <label className="text-xs text-[#b0b0b0] font-medium">Risk</label>
              <div className="grid grid-cols-3 gap-2">
                {(["low", "medium", "high"] as RiskLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => setRisk(level)}
                    className={`py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                      risk === level
                        ? level === "high"
                          ? "bg-[#DC2626] text-white"
                          : level === "medium"
                          ? "bg-[#FFD700] text-black"
                          : "bg-[#2a2a2a] text-white"
                        : "bg-[#0a0a0a] text-[#b0b0b0] hover:bg-[#2a2a2a] hover:text-white border border-[#2a2a2a]"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Bets */}
            {activeBets > 0 && (
              <div className="mb-4 p-3 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-[#b0b0b0]">Balls in play</span>
                  <span className="text-[#FFD700] font-bold">{activeBets}</span>
                </div>
              </div>
            )}

            {/* Drop Buttons */}
            <div className="space-y-2">
              <button
                onClick={dropBall}
                disabled={betAmount <= 0 || betAmount > balance}
                className="w-full py-4 bg-[#FFD700] hover:bg-[#FFEA00] disabled:bg-[#2a2a2a] disabled:text-[#666666] text-black font-bold rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                Drop Ball - {formatCurrency(betAmount)}
              </button>

              <button
                onMouseDown={startAutoDrop}
                onMouseUp={stopAutoDrop}
                onMouseLeave={stopAutoDrop}
                onTouchStart={startAutoDrop}
                onTouchEnd={stopAutoDrop}
                disabled={betAmount <= 0 || betAmount > balance}
                className="w-full py-3 bg-[#DC2626] hover:bg-[#EF4444] disabled:bg-[#2a2a2a] disabled:text-[#666666] text-white font-bold rounded-lg transition-colors disabled:cursor-not-allowed text-sm"
              >
                Hold to Auto-Drop
              </button>
            </div>

            {/* Balance Display */}
            <div className="mt-4 p-3 bg-[#0a0a0a] rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-[#b0b0b0]">Balance</span>
                <span className="text-white font-bold">{formatCurrency(balance)}</span>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-4">
            <h3 className="text-sm font-medium text-white mb-3">Recent Drops</h3>
            {history.length === 0 ? (
              <p className="text-xs text-[#666666] text-center py-4">No drops yet</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {history.map((h, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getMultiplierColor(h.multiplier)}`}>
                      {h.multiplier}x
                    </span>
                    <span className={h.win >= h.bet ? "text-[#FFD700]" : "text-[#DC2626]"}>
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
          <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-6">
            {/* Plinko Board */}
            <div className="relative w-full max-w-lg mx-auto aspect-[4/5] bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] rounded-xl overflow-hidden">
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Drop zone indicator */}
                <rect x="40" y="0" width="20" height="8" fill="#FFD700" fillOpacity="0.1" rx="2" />
                <text x="50" y="5" textAnchor="middle" fill="#FFD700" fontSize="3" fontWeight="bold">DROP</text>

                {/* Draw pins */}
                {PIN_POSITIONS.map((pin, i) => (
                  <circle
                    key={i}
                    cx={pin.x}
                    cy={pin.y}
                    r={PIN_RADIUS}
                    className="fill-[#FFD700]"
                    style={{
                      filter: "drop-shadow(0 0 2px rgba(255, 215, 0, 0.5))",
                    }}
                  />
                ))}

                {/* Draw balls */}
                {balls.map((ball) => (
                  <g key={ball.id}>
                    {/* Ball shadow */}
                    <ellipse
                      cx={ball.x}
                      cy={ball.y + BALL_RADIUS}
                      rx={BALL_RADIUS * 0.8}
                      ry={BALL_RADIUS * 0.3}
                      fill="rgba(0,0,0,0.3)"
                    />
                    {/* Ball */}
                    <circle
                      cx={ball.x}
                      cy={ball.y}
                      r={BALL_RADIUS}
                      className={ball.done ? "fill-[#FFD700]" : "fill-white"}
                      style={{
                        filter: ball.done
                          ? "drop-shadow(0 0 8px rgba(255, 215, 0, 0.8))"
                          : "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
                        transition: "fill 0.3s",
                      }}
                    />
                    {/* Ball highlight */}
                    <circle
                      cx={ball.x - BALL_RADIUS * 0.3}
                      cy={ball.y - BALL_RADIUS * 0.3}
                      r={BALL_RADIUS * 0.3}
                      fill="rgba(255,255,255,0.4)"
                    />
                  </g>
                ))}
              </svg>

              {/* Multiplier slots at bottom */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-0.5 px-2 pb-2">
                {multipliers.map((mult, i) => (
                  <div
                    key={i}
                    className={`flex-1 py-2 rounded text-center text-xs font-bold transition-all duration-200 ${getMultiplierColor(mult)} ${getSlotHighlight(i)}`}
                  >
                    {mult}x
                  </div>
                ))}
              </div>
            </div>

            {/* Game Info */}
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-[#666666] mb-1">Risk Level</p>
                <p className={`text-xl font-bold capitalize ${
                  risk === "high" ? "text-[#DC2626]" : risk === "medium" ? "text-[#FFD700]" : "text-white"
                }`}>
                  {risk}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#666666] mb-1">Rows</p>
                <p className="text-xl font-bold text-white">{ROWS}</p>
              </div>
              <div>
                <p className="text-xs text-[#666666] mb-1">Max Win</p>
                <p className="text-xl font-bold text-[#FFD700]">{Math.max(...multipliers)}x</p>
              </div>
            </div>
          </div>

          {/* How to Play */}
          <div className="mt-4 bg-[#141414] rounded-xl border border-[#2a2a2a] p-4">
            <h3 className="text-sm font-medium text-white mb-3">How to Play</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#b0b0b0]">
              <div className="flex items-start gap-2">
                <span className="text-[#FFD700]">1.</span>
                <span>Set your bet amount and choose a risk level</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#FFD700]">2.</span>
                <span>Click to drop balls or hold for rapid drops</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#FFD700]">3.</span>
                <span>Win based on where each ball lands</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
