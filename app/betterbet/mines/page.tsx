// app/betterbet/mines/page.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { useWallet, formatCurrency } from "@/lib/useWallet";
import { useSounds } from "@/lib/useSounds";
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
  const { play } = useSounds();
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

    play("click");

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
  }, [betAmount, balance, mineCount, play]);

  const revealTile = useCallback((index: number) => {
    if (gameState !== "playing" || grid[index] !== "hidden") return;

    const newGrid = [...grid];

    if (minePositions.includes(index)) {
      // Hit a mine - reveal all
      play("explosion");
      minePositions.forEach(pos => {
        newGrid[pos] = "mine";
      });
      newGrid[index] = "mine";
      setGrid(newGrid);
      setGameState("lost");
      walletPlaceBet(betAmount, false, 0);
    } else {
      // Found a gem
      play("reveal");
      newGrid[index] = "gem";
      setGrid(newGrid);
      const newGemsRevealed = gemsRevealed + 1;
      setGemsRevealed(newGemsRevealed);

      // Check if all gems found (win condition)
      if (newGemsRevealed === GRID_SIZE - mineCount) {
        setGameState("won");
        setTimeout(() => play("bigWin"), 200);
        const winAmount = betAmount * calculateMultiplier(newGemsRevealed, mineCount);
        walletPlaceBet(betAmount, true, winAmount);
      }
    }
  }, [gameState, grid, minePositions, gemsRevealed, betAmount, mineCount, walletPlaceBet, play]);

  const cashOut = useCallback(() => {
    if (gameState !== "playing" || gemsRevealed === 0) return;

    play("cashout");

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
  }, [gameState, gemsRevealed, betAmount, currentMultiplier, grid, minePositions, walletPlaceBet, play]);

  const resetGame = () => {
    setGrid(Array(GRID_SIZE).fill("hidden"));
    setMinePositions([]);
    setGemsRevealed(0);
    setGameState("betting");
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
        <Link href="/betterbet" className="hover:text-white transition-colors">
          Casino
        </Link>
        <span>/</span>
        <span className="text-white">Mines</span>
      </div>

      {/* Mobile Layout: Game first, then controls */}
      <div className="lg:hidden space-y-4">
        {/* Game Grid */}
        <div className="bg-[#1a1a2e] rounded-xl p-4">
          {/* Result Messages */}
          {gameState === "won" && (
            <div className="mb-4 p-3 bg-[#FFD700]/20 border border-[#FFD700]/30 rounded-lg text-center">
              <p className="text-[#FFD700] font-bold text-sm">
                You won {formatCurrency(betAmount * currentMultiplier)}!
              </p>
            </div>
          )}
          {gameState === "lost" && (
            <div className="mb-4 p-3 bg-[#DC2626]/20 border border-[#DC2626]/30 rounded-lg text-center">
              <p className="text-[#DC2626] font-bold text-sm">You hit a mine!</p>
            </div>
          )}

          <div className="grid grid-cols-5 gap-1.5 max-w-xs mx-auto">
            {grid.map((tile, index) => (
              <button
                key={index}
                onClick={() => revealTile(index)}
                disabled={gameState !== "playing" || tile !== "hidden"}
                className={`aspect-square rounded-lg flex items-center justify-center text-xl transition-all duration-200 ${
                  tile === "hidden"
                    ? gameState === "playing"
                      ? "bg-[#2a2a3e] hover:bg-[#3a3a4e] cursor-pointer active:scale-95"
                      : "bg-[#2a2a3e] cursor-not-allowed"
                    : tile === "gem"
                    ? "bg-[#FFD700]/20 border-2 border-[#FFD700]"
                    : "bg-[#DC2626]/20 border-2 border-[#DC2626]"
                }`}
              >
                {tile === "gem" && "💎"}
                {tile === "mine" && "💣"}
              </button>
            ))}
          </div>

          {/* Game Stats */}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="bg-[#0f0f1a] rounded-lg py-2">
              <p className="text-[10px] text-[#666666]">Mines</p>
              <p className="text-lg font-bold text-[#DC2626]">{mineCount}</p>
            </div>
            <div className="bg-[#0f0f1a] rounded-lg py-2">
              <p className="text-[10px] text-[#666666]">Found</p>
              <p className="text-lg font-bold text-[#FFD700]">{gemsRevealed}</p>
            </div>
            <div className="bg-[#0f0f1a] rounded-lg py-2">
              <p className="text-[10px] text-[#666666]">Multiplier</p>
              <p className="text-lg font-bold text-white">{currentMultiplier.toFixed(2)}x</p>
            </div>
          </div>

          {/* Progress bar */}
          {gameState === "playing" && (
            <div className="mt-3">
              <div className="h-1.5 bg-[#0f0f1a] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#DC2626] to-[#FFD700] transition-all duration-300"
                  style={{ width: `${(gemsRevealed / (GRID_SIZE - mineCount)) * 100}%` }}
                />
              </div>
            </div>
          )}
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
                disabled={gameState !== "betting"}
                className="flex-1 bg-transparent py-3 text-white outline-none disabled:opacity-50"
              />
              <button
                onClick={() => setBetAmount((a) => Math.max(1, Math.floor(a / 2)))}
                disabled={gameState !== "betting"}
                className="px-3 py-3 text-[#666666] hover:text-white hover:bg-[#2a2a3e] disabled:opacity-50"
              >
                ½
              </button>
              <button
                onClick={() => setBetAmount((a) => Math.min(Math.floor(balance), a * 2))}
                disabled={gameState !== "betting"}
                className="px-3 py-3 text-[#666666] hover:text-white hover:bg-[#2a2a3e] disabled:opacity-50"
              >
                2×
              </button>
            </div>
          </div>

          {/* Mine Count */}
          <div>
            <label className="text-xs text-[#666666] mb-2 block">Mines</label>
            <div className="grid grid-cols-5 gap-2">
              {[1, 3, 5, 10, 15].map((count) => (
                <button
                  key={count}
                  onClick={() => setMineCount(count)}
                  disabled={gameState !== "betting"}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                    mineCount === count
                      ? "bg-[#FFD700] text-black"
                      : "bg-[#0f0f1a] text-[#b0b0b0] hover:bg-[#2a2a3e] hover:text-white disabled:opacity-50"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Playing stats */}
          {gameState === "playing" && gemsRevealed > 0 && (
            <div className="p-3 bg-[#0f0f1a] rounded-lg flex justify-between items-center">
              <div>
                <p className="text-xs text-[#666666]">Potential Win</p>
                <p className="text-lg font-bold text-[#FFD700]">
                  {formatCurrency(betAmount * currentMultiplier)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#666666]">Next</p>
                <p className="text-sm font-bold text-white">{nextMultiplier.toFixed(2)}x</p>
              </div>
            </div>
          )}

          {/* Game Actions & Balance */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-xs text-[#666666]">Balance</p>
              <p className="text-lg font-bold text-white">{formatCurrency(balance)}</p>
            </div>

            {gameState === "betting" ? (
              <button
                onClick={startGame}
                disabled={betAmount <= 0 || betAmount > balance}
                className="px-8 py-4 bg-gradient-to-r from-[#DC2626] to-[#FFD700] hover:from-[#EF4444] hover:to-[#FFEA00] disabled:bg-[#2a2a3e] disabled:from-[#2a2a3e] disabled:to-[#2a2a3e] disabled:text-[#666666] text-white font-bold rounded-full transition-colors disabled:cursor-not-allowed"
              >
                Start
              </button>
            ) : gameState === "playing" ? (
              <button
                onClick={cashOut}
                disabled={gemsRevealed === 0}
                className="px-6 py-4 bg-gradient-to-r from-[#DC2626] to-[#FFD700] hover:from-[#EF4444] hover:to-[#FFEA00] disabled:bg-[#2a2a3e] disabled:from-[#2a2a3e] disabled:to-[#2a2a3e] disabled:text-[#666666] text-white font-bold rounded-full transition-colors disabled:cursor-not-allowed text-sm"
              >
                Cash Out
              </button>
            ) : (
              <button
                onClick={resetGame}
                className="px-8 py-4 bg-gradient-to-r from-[#DC2626] to-[#FFD700] hover:from-[#EF4444] hover:to-[#FFEA00] text-white font-bold rounded-full transition-colors"
              >
                New Game
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6">
        {/* LEFT: Betting Panel */}
        <div className="lg:col-span-1 space-y-4">
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
                  min={1}
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value) || 0)}
                  disabled={gameState !== "betting"}
                  className="flex-1 bg-transparent py-3 text-white outline-none disabled:opacity-50"
                />
                <button
                  onClick={() => setBetAmount((a) => Math.max(1, Math.floor(a / 2)))}
                  disabled={gameState !== "betting"}
                  className="px-3 py-3 text-[#666666] hover:text-white hover:bg-[#2a2a3e] disabled:opacity-50"
                >
                  ½
                </button>
                <button
                  onClick={() => setBetAmount((a) => Math.min(Math.floor(balance), a * 2))}
                  disabled={gameState !== "betting"}
                  className="px-3 py-3 text-[#666666] hover:text-white hover:bg-[#2a2a3e] disabled:opacity-50"
                >
                  2×
                </button>
              </div>
            </div>

            {/* Mine Count */}
            <div className="space-y-2 mb-4">
              <label className="text-xs text-[#666666] font-medium">Mines</label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 3, 5, 10, 15].map((count) => (
                  <button
                    key={count}
                    onClick={() => setMineCount(count)}
                    disabled={gameState !== "betting"}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                      mineCount === count
                        ? "bg-[#FFD700] text-black"
                        : "bg-[#0f0f1a] text-[#b0b0b0] hover:bg-[#2a2a3e] hover:text-white disabled:opacity-50"
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Stats */}
            {gameState === "playing" && (
              <div className="space-y-2 mb-4 p-3 bg-[#0f0f1a] rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-[#666666]">Gems Found</span>
                  <span className="text-[#FFD700] font-bold">{gemsRevealed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#666666]">Current Multiplier</span>
                  <span className="text-white font-bold">{currentMultiplier.toFixed(2)}x</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#666666]">Potential Win</span>
                  <span className="text-[#FFD700] font-bold">
                    {formatCurrency(betAmount * currentMultiplier)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#666666]">Next Multiplier</span>
                  <span className="text-white">{nextMultiplier.toFixed(2)}x</span>
                </div>
              </div>
            )}

            {/* Game Actions */}
            {gameState === "betting" ? (
              <button
                onClick={startGame}
                disabled={betAmount <= 0 || betAmount > balance}
                className="w-full py-4 bg-gradient-to-r from-[#DC2626] to-[#FFD700] hover:from-[#EF4444] hover:to-[#FFEA00] disabled:bg-[#2a2a3e] disabled:from-[#2a2a3e] disabled:to-[#2a2a3e] disabled:text-[#666666] text-white font-bold rounded-full transition-colors disabled:cursor-not-allowed"
              >
                Start Game
              </button>
            ) : gameState === "playing" ? (
              <button
                onClick={cashOut}
                disabled={gemsRevealed === 0}
                className="w-full py-4 bg-gradient-to-r from-[#DC2626] to-[#FFD700] hover:from-[#EF4444] hover:to-[#FFEA00] disabled:bg-[#2a2a3e] disabled:from-[#2a2a3e] disabled:to-[#2a2a3e] disabled:text-[#666666] text-white font-bold rounded-full transition-colors disabled:cursor-not-allowed"
              >
                Cash Out {formatCurrency(betAmount * currentMultiplier)}
              </button>
            ) : (
              <button
                onClick={resetGame}
                className="w-full py-4 bg-gradient-to-r from-[#DC2626] to-[#FFD700] hover:from-[#EF4444] hover:to-[#FFEA00] text-white font-bold rounded-full transition-colors"
              >
                New Game
              </button>
            )}

            {/* Result Message */}
            {gameState === "won" && (
              <div className="mt-4 p-3 bg-[#FFD700]/20 border border-[#FFD700]/30 rounded-lg text-center">
                <p className="text-[#FFD700] font-bold">
                  You won {formatCurrency(betAmount * currentMultiplier)}!
                </p>
              </div>
            )}
            {gameState === "lost" && (
              <div className="mt-4 p-3 bg-[#DC2626]/20 border border-[#DC2626]/30 rounded-lg text-center">
                <p className="text-[#DC2626] font-bold">You hit a mine!</p>
              </div>
            )}

            {/* Balance Display */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-[#666666]">Balance:</span>
              <span className="text-white font-bold">{formatCurrency(balance)}</span>
            </div>
          </div>

          {/* How to Play */}
          <div className="bg-[#1a1a2e] rounded-xl p-4">
            <h3 className="text-sm font-medium text-white mb-3">How to Play</h3>
            <ul className="space-y-2 text-xs text-[#b0b0b0]">
              <li>• Click tiles to reveal gems or mines</li>
              <li>• Each gem increases your multiplier</li>
              <li>• Cash out anytime to secure your winnings</li>
              <li>• Hit a mine and lose your bet</li>
            </ul>
          </div>
        </div>

        {/* RIGHT: Game Grid */}
        <div className="lg:col-span-2">
          <div className="bg-[#1a1a2e] rounded-xl p-6 h-full">
            <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
              {grid.map((tile, index) => (
                <button
                  key={index}
                  onClick={() => revealTile(index)}
                  disabled={gameState !== "playing" || tile !== "hidden"}
                  className={`aspect-square rounded-lg flex items-center justify-center text-2xl sm:text-3xl transition-all duration-200 ${
                    tile === "hidden"
                      ? gameState === "playing"
                        ? "bg-[#2a2a3e] hover:bg-[#3a3a4e] cursor-pointer hover:scale-105"
                        : "bg-[#2a2a3e] cursor-not-allowed"
                      : tile === "gem"
                      ? "bg-[#FFD700]/20 border-2 border-[#FFD700]"
                      : "bg-[#DC2626]/20 border-2 border-[#DC2626]"
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
                <p className="text-xs text-[#666666] mb-1">Mines</p>
                <p className="text-xl font-bold text-[#DC2626]">{mineCount}</p>
              </div>
              <div>
                <p className="text-xs text-[#666666] mb-1">Gems</p>
                <p className="text-xl font-bold text-[#FFD700]">{GRID_SIZE - mineCount}</p>
              </div>
              <div>
                <p className="text-xs text-[#666666] mb-1">Revealed</p>
                <p className="text-xl font-bold text-white">{gemsRevealed}</p>
              </div>
            </div>

            {/* Multiplier Progress */}
            {gameState === "playing" && (
              <div className="mt-6">
                <div className="flex justify-between text-xs text-[#666666] mb-2">
                  <span>Progress</span>
                  <span>{gemsRevealed} / {GRID_SIZE - mineCount} gems</span>
                </div>
                <div className="h-2 bg-[#0f0f1a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#DC2626] to-[#FFD700] transition-all duration-300"
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
