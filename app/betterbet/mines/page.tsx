// app/betterbet/mines/page.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { useWallet, formatCurrency } from "@/lib/useWallet";
import Link from "next/link";

type TileState = "hidden" | "gem" | "mine";
type GameState = "betting" | "playing" | "won" | "lost";

const GRID_SIZE = 25; // 5x5 grid

const calculateMultiplier = (gemsRevealed: number, mineCount: number): number => {
  if (gemsRevealed === 0) return 1;

  const safeSpots = GRID_SIZE - mineCount;
  let multiplier = 1;

  for (let i = 0; i < gemsRevealed; i++) {
    multiplier *= (safeSpots - i) / (GRID_SIZE - i);
  }

  // Invert and add house edge (1%)
  return Number((0.99 / multiplier).toFixed(2));
};

export default function MinesPage() {
  const { balance, placeBet: walletPlaceBet, isLoaded } = useWallet();
  const [betAmount, setBetAmount] = useState(100);
  const [mineCount, setMineCount] = useState(3);
  const [grid, setGrid] = useState<TileState[]>(Array(GRID_SIZE).fill("hidden"));
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [gemsRevealed, setGemsRevealed] = useState(0);
  const [gameState, setGameState] = useState<GameState>("betting");
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [nextMultiplier, setNextMultiplier] = useState(1);

  // Calculate multipliers when gems revealed or mine count changes
  useEffect(() => {
    setCurrentMultiplier(calculateMultiplier(gemsRevealed, mineCount));
    setNextMultiplier(calculateMultiplier(gemsRevealed + 1, mineCount));
  }, [gemsRevealed, mineCount]);

  const startGame = useCallback(() => {
    if (betAmount <= 0 || betAmount > balance) return;

    // Generate random mine positions
    const positions: number[] = [];
    while (positions.length < mineCount) {
      const pos = Math.floor(Math.random() * GRID_SIZE);
      if (!positions.includes(pos)) {
        positions.push(pos);
      }
    }

    setMinePositions(positions);
    setGrid(Array(GRID_SIZE).fill("hidden"));
    setGemsRevealed(0);
    setGameState("playing");
  }, [betAmount, balance, mineCount]);

  const revealTile = useCallback((index: number) => {
    if (gameState !== "playing" || grid[index] !== "hidden") return;

    const newGrid = [...grid];

    if (minePositions.includes(index)) {
      // Hit a mine - reveal all
      minePositions.forEach(pos => {
        newGrid[pos] = "mine";
      });
      newGrid[index] = "mine";
      setGrid(newGrid);
      setGameState("lost");
      walletPlaceBet(betAmount, false, 0);
    } else {
      // Found a gem
      newGrid[index] = "gem";
      setGrid(newGrid);
      const newGemsRevealed = gemsRevealed + 1;
      setGemsRevealed(newGemsRevealed);

      // Check if all gems found (win condition)
      if (newGemsRevealed === GRID_SIZE - mineCount) {
        setGameState("won");
        const winAmount = betAmount * calculateMultiplier(newGemsRevealed, mineCount);
        walletPlaceBet(betAmount, true, winAmount);
      }
    }
  }, [gameState, grid, minePositions, gemsRevealed, betAmount, mineCount, walletPlaceBet]);

  const cashOut = useCallback(() => {
    if (gameState !== "playing" || gemsRevealed === 0) return;

    const winAmount = betAmount * currentMultiplier;
    walletPlaceBet(betAmount, true, winAmount);

    // Reveal all mines
    const newGrid = [...grid];
    minePositions.forEach(pos => {
      if (newGrid[pos] === "hidden") {
        newGrid[pos] = "mine";
      }
    });
    setGrid(newGrid);
    setGameState("won");
  }, [gameState, gemsRevealed, betAmount, currentMultiplier, grid, minePositions, walletPlaceBet]);

  const resetGame = () => {
    setGrid(Array(GRID_SIZE).fill("hidden"));
    setMinePositions([]);
    setGemsRevealed(0);
    setGameState("betting");
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-[#b0b0c0]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#666680] mb-6">
        <Link href="/betterbet" className="hover:text-white transition-colors">
          Casino
        </Link>
        <span>/</span>
        <span className="text-white">Mines</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Betting Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#12121a] rounded-xl border border-[#2a2a3e] p-4">
            <h2 className="text-lg font-bold text-white mb-4">Mines</h2>

            {/* Bet Amount */}
            <div className="space-y-2 mb-4">
              <label className="text-xs text-[#b0b0c0] font-medium">Bet Amount</label>
              <div className="flex items-center bg-[#0a0a0f] rounded-lg border border-[#2a2a3e] overflow-hidden">
                <span className="px-3 text-[#666680]">$</span>
                <input
                  type="number"
                  min={1}
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value) || 0)}
                  disabled={gameState !== "betting"}
                  className="flex-1 bg-transparent py-3 text-white outline-none disabled:opacity-50"
                />
                <div className="flex border-l border-[#2a2a3e]">
                  <button
                    onClick={() => setBetAmount((a) => Math.max(1, Math.floor(a / 2)))}
                    disabled={gameState !== "betting"}
                    className="px-3 py-3 text-[#b0b0c0] hover:text-white hover:bg-[#2a2a3e] transition-colors text-sm disabled:opacity-50"
                  >
                    ½
                  </button>
                  <button
                    onClick={() => setBetAmount((a) => Math.min(balance, a * 2))}
                    disabled={gameState !== "betting"}
                    className="px-3 py-3 text-[#b0b0c0] hover:text-white hover:bg-[#2a2a3e] transition-colors text-sm border-l border-[#2a2a3e] disabled:opacity-50"
                  >
                    2×
                  </button>
                </div>
              </div>
            </div>

            {/* Mine Count */}
            <div className="space-y-2 mb-4">
              <label className="text-xs text-[#b0b0c0] font-medium">Mines</label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 3, 5, 10, 15].map((count) => (
                  <button
                    key={count}
                    onClick={() => setMineCount(count)}
                    disabled={gameState !== "betting"}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                      mineCount === count
                        ? "bg-[#39ff14] text-black"
                        : "bg-[#0a0a0f] text-[#b0b0c0] hover:bg-[#2a2a3e] hover:text-white border border-[#2a2a3e] disabled:opacity-50"
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Stats */}
            {gameState === "playing" && (
              <div className="space-y-2 mb-4 p-3 bg-[#0a0a0f] rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-[#b0b0c0]">Gems Found</span>
                  <span className="text-[#39ff14] font-bold">{gemsRevealed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#b0b0c0]">Current Multiplier</span>
                  <span className="text-white font-bold">{currentMultiplier.toFixed(2)}x</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#b0b0c0]">Potential Win</span>
                  <span className="text-[#39ff14] font-bold">
                    {formatCurrency(betAmount * currentMultiplier)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#b0b0c0]">Next Multiplier</span>
                  <span className="text-white">{nextMultiplier.toFixed(2)}x</span>
                </div>
              </div>
            )}

            {/* Game Actions */}
            {gameState === "betting" ? (
              <button
                onClick={startGame}
                disabled={betAmount <= 0 || betAmount > balance}
                className="w-full py-4 bg-[#39ff14] hover:bg-[#7fff00] disabled:bg-[#2a2a3e] disabled:text-[#666680] text-black font-bold rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                Start Game
              </button>
            ) : gameState === "playing" ? (
              <button
                onClick={cashOut}
                disabled={gemsRevealed === 0}
                className="w-full py-4 bg-[#39ff14] hover:bg-[#7fff00] disabled:bg-[#2a2a3e] disabled:text-[#666680] text-black font-bold rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                Cash Out {formatCurrency(betAmount * currentMultiplier)}
              </button>
            ) : (
              <button
                onClick={resetGame}
                className="w-full py-4 bg-[#39ff14] hover:bg-[#7fff00] text-black font-bold rounded-lg transition-colors"
              >
                New Game
              </button>
            )}

            {/* Result Message */}
            {gameState === "won" && (
              <div className="mt-4 p-3 bg-[#39ff14]/20 border border-[#39ff14]/30 rounded-lg text-center">
                <p className="text-[#39ff14] font-bold">
                  You won {formatCurrency(betAmount * currentMultiplier)}!
                </p>
              </div>
            )}
            {gameState === "lost" && (
              <div className="mt-4 p-3 bg-[#ff4444]/20 border border-[#ff4444]/30 rounded-lg text-center">
                <p className="text-[#ff4444] font-bold">You hit a mine!</p>
              </div>
            )}

            {/* Balance Display */}
            <div className="mt-4 p-3 bg-[#0a0a0f] rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-[#b0b0c0]">Balance</span>
                <span className="text-white font-bold">{formatCurrency(balance)}</span>
              </div>
            </div>
          </div>

          {/* How to Play */}
          <div className="bg-[#12121a] rounded-xl border border-[#2a2a3e] p-4">
            <h3 className="text-sm font-medium text-white mb-3">How to Play</h3>
            <ul className="space-y-2 text-xs text-[#b0b0c0]">
              <li>• Click tiles to reveal gems or mines</li>
              <li>• Each gem increases your multiplier</li>
              <li>• Cash out anytime to secure your winnings</li>
              <li>• Hit a mine and lose your bet</li>
            </ul>
          </div>
        </div>

        {/* RIGHT: Game Grid */}
        <div className="lg:col-span-2">
          <div className="bg-[#12121a] rounded-xl border border-[#2a2a3e] p-6">
            <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
              {grid.map((tile, index) => (
                <button
                  key={index}
                  onClick={() => revealTile(index)}
                  disabled={gameState !== "playing" || tile !== "hidden"}
                  className={`aspect-square rounded-lg flex items-center justify-center text-2xl sm:text-3xl transition-all duration-200 ${
                    tile === "hidden"
                      ? gameState === "playing"
                        ? "bg-[#2a2a3e] hover:bg-[#3d5a6c] cursor-pointer hover:scale-105"
                        : "bg-[#2a2a3e] cursor-not-allowed"
                      : tile === "gem"
                      ? "bg-[#39ff14]/20 border-2 border-[#39ff14]"
                      : "bg-[#ff4444]/20 border-2 border-[#ff4444]"
                  }`}
                >
                  {tile === "gem" && "💎"}
                  {tile === "mine" && "💣"}
                </button>
              ))}
            </div>

            {/* Game Info */}
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-[#666680] mb-1">Mines</p>
                <p className="text-xl font-bold text-[#ff4444]">{mineCount}</p>
              </div>
              <div>
                <p className="text-xs text-[#666680] mb-1">Gems</p>
                <p className="text-xl font-bold text-[#39ff14]">{GRID_SIZE - mineCount}</p>
              </div>
              <div>
                <p className="text-xs text-[#666680] mb-1">Revealed</p>
                <p className="text-xl font-bold text-white">{gemsRevealed}</p>
              </div>
            </div>

            {/* Multiplier Progress */}
            {gameState === "playing" && (
              <div className="mt-6">
                <div className="flex justify-between text-xs text-[#b0b0c0] mb-2">
                  <span>Progress</span>
                  <span>{gemsRevealed} / {GRID_SIZE - mineCount} gems</span>
                </div>
                <div className="h-2 bg-[#0a0a0f] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#39ff14] to-[#7fff00] transition-all duration-300"
                    style={{ width: `${(gemsRevealed / (GRID_SIZE - mineCount)) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
