// app/betterbet/baccarat/page.tsx
"use client";

import { useState, useCallback } from "react";
import { useWallet, formatCurrency } from "@/lib/useWallet";
import { useSounds } from "@/lib/useSounds";
import Link from "next/link";

type Card = {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  value: string;
  numericValue: number;
  id: number;
};

type BetType = "player" | "banker" | "tie" | "playerPair" | "bankerPair";
type GameState = "betting" | "dealing" | "ended";
type GameResult = "player" | "banker" | "tie";

interface PlacedBet {
  type: BetType;
  amount: number;
}

const SUITS: Card["suit"][] = ["hearts", "diamonds", "clubs", "spades"];
const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const PAYOUTS: Record<BetType, number> = {
  player: 2,
  banker: 1.95,
  tie: 9,
  playerPair: 12,
  bankerPair: 12,
};

let cardId = 0;

const getSuitSymbol = (suit: Card["suit"]) => {
  const symbols = { hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" };
  return symbols[suit];
};

const isRed = (suit: Card["suit"]) => suit === "hearts" || suit === "diamonds";

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (let d = 0; d < 8; d++) {
    for (const suit of SUITS) {
      for (const value of VALUES) {
        const numericValue = value === "A" ? 1 : ["10", "J", "Q", "K"].includes(value) ? 0 : parseInt(value);
        deck.push({ suit, value, numericValue, id: cardId++ });
      }
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

const calculateHand = (cards: Card[]): number => cards.reduce((sum, c) => sum + c.numericValue, 0) % 10;

const isPair = (cards: Card[]): boolean => cards.length >= 2 && cards[0].value === cards[1].value;

export default function BaccaratPage() {
  const { balance, placeBet: walletPlaceBet, isLoaded } = useWallet();
  const { play } = useSounds();
  const [chipValue, setChipValue] = useState(10);
  const [bets, setBets] = useState<PlacedBet[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [bankerHand, setBankerHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<GameState>("betting");
  const [result, setResult] = useState<GameResult | null>(null);
  const [history, setHistory] = useState<{ result: GameResult; playerScore: number; bankerScore: number }[]>([]);
  const [winAmount, setWinAmount] = useState(0);

  const totalBet = bets.reduce((sum, b) => sum + b.amount, 0);
  const getBet = (type: BetType) => bets.find(b => b.type === type)?.amount || 0;

  const placeBet = (type: BetType) => {
    if (gameState !== "betting" || chipValue > balance - totalBet) return;
    setBets(prev => {
      const existing = prev.find(b => b.type === type);
      if (existing) return prev.map(b => b.type === type ? { ...b, amount: b.amount + chipValue } : b);
      return [...prev, { type, amount: chipValue }];
    });
    play("chip");
  };

  const clearBets = () => setBets([]);

  const deal = useCallback(async () => {
    if (bets.length === 0 || totalBet > balance) return;
    if (!bets.some(b => ["player", "banker", "tie"].includes(b.type))) return;

    play("flip");
    setGameState("dealing");
    setResult(null);
    setWinAmount(0);

    const deck = createDeck();
    const pCards = [deck.pop()!, deck.pop()!];
    const bCards = [deck.pop()!, deck.pop()!];

    setPlayerHand(pCards);
    setBankerHand(bCards);
    await new Promise(r => setTimeout(r, 1000));

    let finalP = [...pCards];
    let finalB = [...bCards];
    const pScore = calculateHand(pCards);
    const bScore = calculateHand(bCards);

    if (pScore < 8 && bScore < 8) {
      let pThird: Card | null = null;
      if (pScore <= 5) {
        pThird = deck.pop()!;
        finalP.push(pThird);
        setPlayerHand([...finalP]);
        play("flip");
        await new Promise(r => setTimeout(r, 600));
      }

      let bankerDraws = false;
      if (!pThird) {
        bankerDraws = bScore <= 5;
      } else {
        const p3 = pThird.numericValue;
        if (bScore <= 2) bankerDraws = true;
        else if (bScore === 3) bankerDraws = p3 !== 8;
        else if (bScore === 4) bankerDraws = p3 >= 2 && p3 <= 7;
        else if (bScore === 5) bankerDraws = p3 >= 4 && p3 <= 7;
        else if (bScore === 6) bankerDraws = p3 === 6 || p3 === 7;
      }

      if (bankerDraws) {
        finalB.push(deck.pop()!);
        setBankerHand([...finalB]);
        play("flip");
        await new Promise(r => setTimeout(r, 600));
      }
    }

    const finalPScore = calculateHand(finalP);
    const finalBScore = calculateHand(finalB);
    const gameResult: GameResult = finalPScore > finalBScore ? "player" : finalBScore > finalPScore ? "banker" : "tie";

    setResult(gameResult);
    setHistory(prev => [{ result: gameResult, playerScore: finalPScore, bankerScore: finalBScore }, ...prev.slice(0, 29)]);
    setGameState("ended");

    // Calculate winnings
    let winnings = 0;
    bets.forEach(bet => {
      if (bet.type === "player" && gameResult === "player") winnings += bet.amount * PAYOUTS.player;
      else if (bet.type === "banker" && gameResult === "banker") winnings += bet.amount * PAYOUTS.banker;
      else if (bet.type === "tie" && gameResult === "tie") winnings += bet.amount * PAYOUTS.tie;
      else if (bet.type === "playerPair" && isPair(finalP)) winnings += bet.amount * PAYOUTS.playerPair;
      else if (bet.type === "bankerPair" && isPair(finalB)) winnings += bet.amount * PAYOUTS.bankerPair;
    });

    setWinAmount(winnings);
    if (winnings > 0) {
      walletPlaceBet(totalBet, true, winnings);
      play(winnings > totalBet * 3 ? "bigWin" : "win");
    } else {
      walletPlaceBet(totalBet, false, 0);
      play("lose");
    }
  }, [bets, totalBet, balance, walletPlaceBet, play]);

  const newGame = () => {
    setGameState("betting");
    setPlayerHand([]);
    setBankerHand([]);
    setResult(null);
    setBets([]);
    setWinAmount(0);
  };

  const MiniCard = ({ card }: { card: Card }) => (
    <div className="w-10 h-14 bg-white rounded shadow-md flex flex-col items-center justify-center text-xs font-bold">
      <span className={isRed(card.suit) ? "text-red-500" : "text-gray-900"}>{card.value}</span>
      <span className={isRed(card.suit) ? "text-red-500" : "text-gray-900"}>{getSuitSymbol(card.suit)}</span>
    </div>
  );

  const BettingCircle = ({ type, label, payout, color, size = "normal" }: { type: BetType; label: string; payout: number; color: string; size?: "normal" | "small" }) => {
    const amount = getBet(type);
    const isSmall = size === "small";
    const isWin = result && (
      (type === "player" && result === "player") ||
      (type === "banker" && result === "banker") ||
      (type === "tie" && result === "tie") ||
      (type === "playerPair" && isPair(playerHand)) ||
      (type === "bankerPair" && isPair(bankerHand))
    );

    return (
      <button
        onClick={() => placeBet(type)}
        disabled={gameState !== "betting"}
        className={`relative rounded-full border-4 transition-all disabled:cursor-not-allowed flex flex-col items-center justify-center ${color} ${
          isSmall ? "w-20 h-20" : "w-28 h-28 lg:w-32 lg:h-32"
        } ${isWin ? "ring-4 ring-yellow-400 animate-pulse" : ""} ${
          gameState === "betting" ? "hover:scale-105 hover:brightness-110" : ""
        }`}
      >
        <span className={`font-bold text-white ${isSmall ? "text-xs" : "text-sm lg:text-base"}`}>{label}</span>
        <span className={`text-white/70 ${isSmall ? "text-[10px]" : "text-xs"}`}>{payout}:1</span>
        {amount > 0 && (
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-yellow-400 border-2 border-yellow-600 flex items-center justify-center text-[10px] font-bold text-black shadow-lg">
            {amount >= 1000 ? `${(amount/1000).toFixed(0)}k` : amount}
          </div>
        )}
      </button>
    );
  };

  if (!isLoaded) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-gray-500">Loading...</div></div>;
  }

  const playerScore = calculateHand(playerHand);
  const bankerScore = calculateHand(bankerHand);

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/betterbet" className="hover:text-white">Casino</Link>
          <span>/</span>
          <span className="text-white">Baccarat</span>
        </div>
        <div className="text-white font-medium">{formatCurrency(balance)}</div>
      </div>

      {/* Win Banner */}
      {gameState === "ended" && (
        <div className={`mb-4 p-4 rounded-xl text-center ${winAmount > 0 ? "bg-yellow-500/20 border border-yellow-500/50" : "bg-red-500/20 border border-red-500/50"}`}>
          <div className={`text-2xl font-bold ${winAmount > 0 ? "text-yellow-400" : "text-red-400"}`}>
            {result === "tie" ? "TIE!" : `${result?.toUpperCase()} WINS!`}
          </div>
          <div className="text-white mt-1">
            {winAmount > 0 ? `You won ${formatCurrency(winAmount - totalBet)}!` : `You lost ${formatCurrency(totalBet)}`}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_200px] gap-4">
        {/* Main Table */}
        <div className="bg-gradient-to-b from-green-900 to-green-950 rounded-2xl p-6 border-4 border-yellow-700/50 shadow-2xl">
          {/* Cards Display */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Player Side */}
            <div className="text-center">
              <div className={`text-lg font-bold mb-3 ${result === "player" ? "text-yellow-400" : "text-blue-400"}`}>
                PLAYER
                {playerHand.length > 0 && <span className="ml-2 text-2xl">{playerScore}</span>}
              </div>
              <div className="flex justify-center gap-2 min-h-[60px]">
                {playerHand.map(card => <MiniCard key={card.id} card={card} />)}
              </div>
            </div>

            {/* Banker Side */}
            <div className="text-center">
              <div className={`text-lg font-bold mb-3 ${result === "banker" ? "text-yellow-400" : "text-red-400"}`}>
                BANKER
                {bankerHand.length > 0 && <span className="ml-2 text-2xl">{bankerScore}</span>}
              </div>
              <div className="flex justify-center gap-2 min-h-[60px]">
                {bankerHand.map(card => <MiniCard key={card.id} card={card} />)}
              </div>
            </div>
          </div>

          {/* Betting Area */}
          <div className="flex flex-col items-center gap-4">
            {/* Tie in center */}
            <BettingCircle type="tie" label="TIE" payout={8} color="bg-green-600 border-green-400" />

            {/* Player and Banker */}
            <div className="flex items-center gap-6 lg:gap-12">
              <div className="flex flex-col items-center gap-2">
                <BettingCircle type="playerPair" label="P PAIR" payout={11} color="bg-blue-800 border-blue-500" size="small" />
                <BettingCircle type="player" label="PLAYER" payout={1} color="bg-blue-600 border-blue-400" />
              </div>

              <div className="flex flex-col items-center gap-2">
                <BettingCircle type="bankerPair" label="B PAIR" payout={11} color="bg-red-800 border-red-500" size="small" />
                <BettingCircle type="banker" label="BANKER" payout={0.95} color="bg-red-600 border-red-400" />
              </div>
            </div>
          </div>

          {/* Chips & Actions */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              {/* Chip Selector */}
              <div className="flex items-center gap-2">
                {[5, 10, 25, 100, 500].map(val => (
                  <button
                    key={val}
                    onClick={() => setChipValue(val)}
                    disabled={gameState !== "betting"}
                    className={`w-10 h-10 rounded-full font-bold text-xs transition-all disabled:opacity-50 ${
                      chipValue === val
                        ? "bg-yellow-400 text-black scale-110 shadow-lg"
                        : "bg-gray-700 text-white hover:bg-gray-600"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {totalBet > 0 && gameState === "betting" && (
                  <>
                    <span className="text-yellow-400 font-medium">{formatCurrency(totalBet)}</span>
                    <button onClick={clearBets} className="px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded">
                      Clear
                    </button>
                  </>
                )}
                {gameState === "betting" ? (
                  <button
                    onClick={deal}
                    disabled={bets.length === 0 || !bets.some(b => ["player", "banker", "tie"].includes(b.type))}
                    className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 disabled:text-gray-400 text-black font-bold rounded-lg transition-all"
                  >
                    DEAL
                  </button>
                ) : gameState === "ended" ? (
                  <button onClick={newGame} className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg">
                    NEW GAME
                  </button>
                ) : (
                  <span className="text-gray-400 animate-pulse">Dealing...</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Road Map */}
        <div className="space-y-4">
          {/* Big Road */}
          <div className="bg-gray-900 rounded-xl p-3 border border-gray-800">
            <h3 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Road Map</h3>
            <div className="grid grid-cols-6 gap-1">
              {Array.from({ length: 30 }).map((_, i) => {
                const item = history[29 - i];
                return (
                  <div
                    key={i}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      item
                        ? item.result === "player" ? "bg-blue-500 text-white"
                          : item.result === "banker" ? "bg-red-500 text-white"
                          : "bg-green-500 text-white"
                        : "bg-gray-800"
                    }`}
                  >
                    {item ? (item.result === "tie" ? "T" : item.result === "player" ? "P" : "B") : ""}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-gray-900 rounded-xl p-3 border border-gray-800">
            <h3 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Statistics</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-400">Player</span>
                <span className="text-white">{history.filter(h => h.result === "player").length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-400">Banker</span>
                <span className="text-white">{history.filter(h => h.result === "banker").length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-400">Tie</span>
                <span className="text-white">{history.filter(h => h.result === "tie").length}</span>
              </div>
            </div>
          </div>

          {/* Payouts */}
          <div className="bg-gray-900 rounded-xl p-3 border border-gray-800">
            <h3 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Payouts</h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-gray-300">
                <span>Player</span><span className="text-yellow-400">1:1</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Banker</span><span className="text-yellow-400">0.95:1</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Tie</span><span className="text-yellow-400">8:1</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Pair</span><span className="text-yellow-400">11:1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
