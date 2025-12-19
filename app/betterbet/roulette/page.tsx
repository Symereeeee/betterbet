// app/betterbet/roulette/page.tsx
"use client";

import { useState, useCallback } from "react";
import { useWallet, formatCurrency } from "@/lib/useWallet";
import { useSounds } from "@/lib/useSounds";
import Link from "next/link";

type BetType =
  | "red" | "black" | "odd" | "even" | "1-18" | "19-36"
  | "1st12" | "2nd12" | "3rd12"
  | "column1" | "column2" | "column3"
  | "number";

type GameState = "betting" | "spinning" | "ended";

interface PlacedBet {
  type: BetType;
  numbers: number[];
  amount: number;
  position: string;
}

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

const getPayoutMultiplier = (type: BetType): number => {
  switch (type) {
    case "number": return 35;
    case "column1": case "column2": case "column3":
    case "1st12": case "2nd12": case "3rd12": return 3;
    default: return 2;
  }
};

const getNumberColor = (num: number): "red" | "black" | "green" => {
  if (num === 0) return "green";
  return RED_NUMBERS.includes(num) ? "red" : "black";
};

const BOARD_ROWS = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
];

export default function RoulettePage() {
  const { balance, placeBet: walletPlaceBet, isLoaded } = useWallet();
  const { play } = useSounds();
  const [chipValue, setChipValue] = useState(10);
  const [placedBets, setPlacedBets] = useState<PlacedBet[]>([]);
  const [gameState, setGameState] = useState<GameState>("betting");
  const [result, setResult] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [isWin, setIsWin] = useState<boolean | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [spinning, setSpinning] = useState(false);

  const totalBetAmount = placedBets.reduce((sum, bet) => sum + bet.amount, 0);

  const checkWin = (bet: PlacedBet, resultNum: number): boolean => {
    switch (bet.type) {
      case "red": return RED_NUMBERS.includes(resultNum);
      case "black": return !RED_NUMBERS.includes(resultNum) && resultNum !== 0;
      case "odd": return resultNum !== 0 && resultNum % 2 === 1;
      case "even": return resultNum !== 0 && resultNum % 2 === 0;
      case "1-18": return resultNum >= 1 && resultNum <= 18;
      case "19-36": return resultNum >= 19 && resultNum <= 36;
      case "1st12": return resultNum >= 1 && resultNum <= 12;
      case "2nd12": return resultNum >= 13 && resultNum <= 24;
      case "3rd12": return resultNum >= 25 && resultNum <= 36;
      case "column1": return resultNum !== 0 && resultNum % 3 === 1;
      case "column2": return resultNum !== 0 && resultNum % 3 === 2;
      case "column3": return resultNum !== 0 && resultNum % 3 === 0;
      default: return bet.numbers.includes(resultNum);
    }
  };

  const placeBetOnBoard = (type: BetType, numbers: number[], position: string) => {
    if (gameState !== "betting") return;
    if (chipValue > balance - totalBetAmount) return;

    setPlacedBets(prev => {
      const existing = prev.find(b => b.position === position);
      if (existing) {
        return prev.map(b =>
          b.position === position ? { ...b, amount: b.amount + chipValue } : b
        );
      }
      return [...prev, { type, numbers, amount: chipValue, position }];
    });
    play("click");
  };

  const clearBets = () => setPlacedBets([]);

  const getBetAmount = (position: string): number => {
    return placedBets.find(b => b.position === position)?.amount || 0;
  };

  const spin = useCallback(async () => {
    if (placedBets.length === 0 || totalBetAmount > balance) return;

    play("roll");
    setGameState("spinning");
    setResult(null);
    setMessage("");
    setIsWin(null);
    setSpinning(true);

    // Simulate spinning through numbers
    const finalResult = Math.floor(Math.random() * 37);

    // Quick number cycling animation
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setResult(Math.floor(Math.random() * 37));
    }

    // Slow down
    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 200 + i * 100));
      setResult(Math.floor(Math.random() * 37));
    }

    // Final result
    setResult(finalResult);
    setSpinning(false);
    setGameState("ended");
    setHistory(prev => [finalResult, ...prev.slice(0, 11)]);

    let winnings = 0;
    let hasWin = false;

    placedBets.forEach(bet => {
      if (checkWin(bet, finalResult)) {
        hasWin = true;
        winnings += bet.amount * getPayoutMultiplier(bet.type);
      }
    });

    setIsWin(hasWin);
    const profit = winnings - totalBetAmount;

    if (hasWin) {
      walletPlaceBet(totalBetAmount, true, winnings);
      setMessage(`Winner: ${finalResult} ${getNumberColor(finalResult).toUpperCase()}! You won ${formatCurrency(profit)}!`);
      play(profit > totalBetAmount * 5 ? "bigWin" : "win");
    } else {
      walletPlaceBet(totalBetAmount, false, 0);
      setMessage(`${finalResult} ${getNumberColor(finalResult).toUpperCase()} - You lost ${formatCurrency(totalBetAmount)}`);
      play("lose");
    }
  }, [placedBets, totalBetAmount, balance, walletPlaceBet, play]);

  const resetGame = () => {
    setGameState("betting");
    setResult(null);
    setMessage("");
    setIsWin(null);
    setPlacedBets([]);
  };

  const Chip = ({ amount }: { amount: number }) => {
    if (amount === 0) return null;
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="w-6 h-6 rounded-full bg-[#FFD700] border-2 border-[#B8860B] shadow flex items-center justify-center font-bold text-[8px] text-black">
          {amount >= 1000 ? `${(amount/1000).toFixed(0)}k` : amount}
        </div>
      </div>
    );
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-[#808080]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm text-[#808080]">
          <Link href="/betterbet" className="hover:text-white transition-colors">Casino</Link>
          <span>/</span>
          <span className="text-white">Roulette</span>
        </div>
        <div className="text-white font-medium">{formatCurrency(balance)}</div>
      </div>

      <div className="space-y-4">
        {/* Result Display */}
        <div className="bg-[#1a1a2e] rounded-xl p-6 text-center">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-4xl font-bold text-white mb-4 transition-all ${
            spinning ? "animate-pulse" : ""
          } ${
            result !== null
              ? getNumberColor(result) === "green" ? "bg-green-600"
                : getNumberColor(result) === "red" ? "bg-red-600"
                : "bg-zinc-800"
              : "bg-zinc-800"
          }`}>
            {result !== null ? result : "?"}
          </div>

          {message && (
            <div className={`text-lg font-semibold ${isWin ? "text-green-400" : "text-red-400"}`}>
              {message}
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="flex gap-1.5 justify-center mt-4 flex-wrap">
              {history.map((num, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    getNumberColor(num) === "red" ? "bg-red-600"
                      : getNumberColor(num) === "green" ? "bg-green-600"
                      : "bg-zinc-700"
                  }`}
                >
                  {num}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Betting Board */}
        <div className="bg-green-800 rounded-xl p-4 overflow-x-auto">
          <div className="min-w-[500px]">
            <div className="flex">
              {/* Zero */}
              <button
                onClick={() => placeBetOnBoard("number", [0], "num-0")}
                disabled={gameState !== "betting"}
                className={`relative w-14 bg-green-600 hover:bg-green-500 text-white font-bold text-xl rounded-l-lg transition-all disabled:cursor-not-allowed ${
                  result === 0 ? "ring-2 ring-yellow-400" : ""
                }`}
                style={{ height: "144px" }}
              >
                0
                <Chip amount={getBetAmount("num-0")} />
              </button>

              {/* Main Grid */}
              <div className="flex-1">
                {/* Numbers */}
                <div className="grid grid-cols-12">
                  {BOARD_ROWS.flat().map((num) => {
                    const color = getNumberColor(num);
                    return (
                      <button
                        key={num}
                        onClick={() => placeBetOnBoard("number", [num], `num-${num}`)}
                        disabled={gameState !== "betting"}
                        className={`relative h-12 flex items-center justify-center font-bold text-white transition-all disabled:cursor-not-allowed border-r border-b border-green-900 ${
                          color === "red" ? "bg-red-600 hover:bg-red-500" : "bg-zinc-800 hover:bg-zinc-700"
                        } ${result === num ? "ring-2 ring-yellow-400 z-10" : ""}`}
                      >
                        {num}
                        <Chip amount={getBetAmount(`num-${num}`)} />
                      </button>
                    );
                  })}
                </div>

                {/* Dozens */}
                <div className="grid grid-cols-3">
                  {["1st12", "2nd12", "3rd12"].map((type) => (
                    <button
                      key={type}
                      onClick={() => placeBetOnBoard(type as BetType, [], type)}
                      disabled={gameState !== "betting"}
                      className="relative h-10 bg-green-700 hover:bg-green-600 text-white font-medium text-sm border-r border-green-900 transition-all disabled:cursor-not-allowed"
                    >
                      {type === "1st12" ? "1st 12" : type === "2nd12" ? "2nd 12" : "3rd 12"}
                      <Chip amount={getBetAmount(type)} />
                    </button>
                  ))}
                </div>

                {/* Outside Bets */}
                <div className="grid grid-cols-6">
                  {[
                    { type: "1-18", label: "1-18" },
                    { type: "even", label: "EVEN" },
                    { type: "red", label: "RED", bg: "bg-red-600 hover:bg-red-500" },
                    { type: "black", label: "BLACK", bg: "bg-zinc-800 hover:bg-zinc-700" },
                    { type: "odd", label: "ODD" },
                    { type: "19-36", label: "19-36" },
                  ].map(({ type, label, bg }) => (
                    <button
                      key={type}
                      onClick={() => placeBetOnBoard(type as BetType, [], type)}
                      disabled={gameState !== "betting"}
                      className={`relative h-10 font-medium text-sm text-white transition-all disabled:cursor-not-allowed border-r border-green-900 ${
                        bg || "bg-green-700 hover:bg-green-600"
                      }`}
                    >
                      {label}
                      <Chip amount={getBetAmount(type)} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Column Bets */}
              <div className="flex flex-col">
                {["column3", "column2", "column1"].map((type) => (
                  <button
                    key={type}
                    onClick={() => placeBetOnBoard(type as BetType, [], type)}
                    disabled={gameState !== "betting"}
                    className="relative w-12 h-12 bg-green-700 hover:bg-green-600 text-white font-medium text-xs rounded-r transition-all disabled:cursor-not-allowed"
                  >
                    2:1
                    <Chip amount={getBetAmount(type)} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-[#1a1a2e] rounded-xl p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Chips */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#808080] mr-2">Chip:</span>
              {[5, 10, 25, 100, 500].map((value) => (
                <button
                  key={value}
                  onClick={() => setChipValue(value)}
                  disabled={gameState !== "betting"}
                  className={`w-11 h-11 rounded-full font-bold text-sm transition-all disabled:opacity-50 ${
                    chipValue === value
                      ? "bg-[#FFD700] text-black scale-110 shadow-lg"
                      : "bg-[#2a2a3e] text-white hover:bg-[#3a3a4e]"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {placedBets.length > 0 && gameState === "betting" && (
                <>
                  <span className="text-[#FFD700] font-medium">Total: {formatCurrency(totalBetAmount)}</span>
                  <button
                    onClick={clearBets}
                    className="px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                </>
              )}

              {gameState === "betting" ? (
                <button
                  onClick={spin}
                  disabled={placedBets.length === 0 || totalBetAmount > balance}
                  className="px-8 py-3 bg-red-600 hover:bg-red-500 disabled:bg-[#2a2a3e] disabled:text-[#808080] text-white font-bold rounded-lg transition-all disabled:cursor-not-allowed"
                >
                  SPIN
                </button>
              ) : gameState === "ended" ? (
                <button
                  onClick={resetGame}
                  className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-all"
                >
                  NEW GAME
                </button>
              ) : (
                <div className="px-8 py-3 text-[#808080] animate-pulse">Spinning...</div>
              )}
            </div>
          </div>
        </div>

        {/* Payouts */}
        <div className="bg-[#1a1a2e] rounded-xl p-4">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span className="text-[#808080]">Payouts:</span>
            <span><span className="text-white">Straight</span> <span className="text-[#FFD700]">35x</span></span>
            <span><span className="text-white">Dozen/Column</span> <span className="text-[#FFD700]">3x</span></span>
            <span><span className="text-white">Red/Black/Odd/Even</span> <span className="text-[#FFD700]">2x</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
