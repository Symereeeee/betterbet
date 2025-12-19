// app/betterbet/blackjack/page.tsx
"use client";

import { useState, useCallback } from "react";
import { useWallet, formatCurrency } from "@/lib/useWallet";
import { useSounds } from "@/lib/useSounds";
import Link from "next/link";

type Card = {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  value: string;
  numericValue: number;
  id: number; // For animation tracking
};

type GameState = "betting" | "playing" | "dealer-turn" | "ended";
type GameResult = "win" | "lose" | "push" | "blackjack" | null;

const SUITS: Card["suit"][] = ["hearts", "diamonds", "clubs", "spades"];
const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

let cardIdCounter = 0;

const getSuitSymbol = (suit: Card["suit"]) => {
  switch (suit) {
    case "hearts": return "♥";
    case "diamonds": return "♦";
    case "clubs": return "♣";
    case "spades": return "♠";
  }
};

const getSuitColor = (suit: Card["suit"]) => {
  return suit === "hearts" || suit === "diamonds" ? "text-red-500" : "text-gray-900";
};

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      let numericValue: number;
      if (value === "A") {
        numericValue = 11;
      } else if (["J", "Q", "K"].includes(value)) {
        numericValue = 10;
      } else {
        numericValue = parseInt(value);
      }
      deck.push({ suit, value, numericValue, id: cardIdCounter++ });
    }
  }
  return deck;
};

const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const calculateHand = (cards: Card[]): number => {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    if (card.value === "A") {
      aces++;
      total += 11;
    } else {
      total += card.numericValue;
    }
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
};

const CardComponent = ({ card, hidden = false }: { card: Card; hidden?: boolean }) => {
  if (hidden) {
    return (
      <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-lg bg-gradient-to-br from-[#DC2626] to-[#8B0000] border-2 border-[#DC2626] flex items-center justify-center shadow-lg animate-deal-card">
        <div className="text-2xl text-red-300">?</div>
      </div>
    );
  }

  return (
    <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-lg bg-white border-2 border-gray-200 flex flex-col items-center justify-between p-1.5 shadow-lg animate-deal-card hover:scale-105 hover:-translate-y-1 transition-transform">
      <div className={`text-sm sm:text-base font-bold ${getSuitColor(card.suit)} self-start`}>
        {card.value}
      </div>
      <div className={`text-2xl sm:text-3xl ${getSuitColor(card.suit)}`}>
        {getSuitSymbol(card.suit)}
      </div>
      <div className={`text-sm sm:text-base font-bold ${getSuitColor(card.suit)} self-end rotate-180`}>
        {card.value}
      </div>
    </div>
  );
};

export default function BlackjackPage() {
  const { balance, placeBet: walletPlaceBet, isLoaded } = useWallet();
  const { play } = useSounds();
  const [betAmount, setBetAmount] = useState(100);
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<GameState>("betting");
  const [result, setResult] = useState<GameResult>(null);
  const [message, setMessage] = useState("");

  const playerTotal = calculateHand(playerHand);
  const dealerTotal = calculateHand(dealerHand);
  const dealerVisibleTotal = dealerHand.length > 0 ? calculateHand([dealerHand[0]]) : 0;

  const startGame = useCallback(() => {
    if (betAmount <= 0 || betAmount > balance) return;

    play("flip");
    setTimeout(() => play("flip"), 150);
    setTimeout(() => play("flip"), 300);
    setTimeout(() => play("flip"), 450);

    const newDeck = shuffleDeck(createDeck());
    const pHand = [newDeck.pop()!, newDeck.pop()!];
    const dHand = [newDeck.pop()!, newDeck.pop()!];

    setDeck(newDeck);
    setPlayerHand(pHand);
    setDealerHand(dHand);
    setResult(null);
    setMessage("");

    const playerScore = calculateHand(pHand);
    const dealerScore = calculateHand(dHand);

    // Check for blackjacks (90% RTP)
    if (playerScore === 21 && dealerScore === 21) {
      setGameState("ended");
      setResult("push");
      setMessage("Both have Blackjack! Push.");
    } else if (playerScore === 21) {
      setGameState("ended");
      setResult("blackjack");
      setMessage("Blackjack! You win 2.25x!");
      setTimeout(() => play("bigWin"), 500);
      walletPlaceBet(betAmount, true, betAmount * 2.25); // 90% RTP blackjack payout
    } else if (dealerScore === 21) {
      setGameState("ended");
      setResult("lose");
      setMessage("Dealer has Blackjack!");
      setTimeout(() => play("lose"), 500);
      walletPlaceBet(betAmount, false, 0);
    } else {
      setGameState("playing");
    }
  }, [betAmount, balance, walletPlaceBet, play]);

  const hit = useCallback(() => {
    if (gameState !== "playing" || deck.length === 0) return;

    play("flip");

    const newCard = deck.pop()!;
    const newHand = [...playerHand, newCard];
    const newDeck = [...deck];

    setDeck(newDeck);
    setPlayerHand(newHand);

    const newTotal = calculateHand(newHand);
    if (newTotal > 21) {
      setGameState("ended");
      setResult("lose");
      setMessage("Bust! You went over 21.");
      setTimeout(() => play("lose"), 300);
      walletPlaceBet(betAmount, false, 0);
    }
  }, [gameState, deck, playerHand, betAmount, walletPlaceBet, play]);

  const stand = useCallback(() => {
    if (gameState !== "playing") return;

    play("flip");
    setGameState("dealer-turn");

    let newDealerHand = [...dealerHand];
    let newDeck = [...deck];

    const dealerDraw = async () => {
      while (calculateHand(newDealerHand) < 17 && newDeck.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 600));
        play("flip");
        newDealerHand = [...newDealerHand, newDeck.pop()!];
        setDealerHand([...newDealerHand]);
        setDeck([...newDeck]);
      }

      const finalDealerTotal = calculateHand(newDealerHand);
      const finalPlayerTotal = playerTotal;

      setGameState("ended");

      if (finalDealerTotal > 21) {
        setResult("win");
        setMessage("Dealer busts! You win!");
        play("win");
        walletPlaceBet(betAmount, true, betAmount * 1.8); // 90% RTP
      } else if (finalDealerTotal > finalPlayerTotal) {
        setResult("lose");
        setMessage("Dealer wins with " + finalDealerTotal);
        play("lose");
        walletPlaceBet(betAmount, false, 0);
      } else if (finalDealerTotal < finalPlayerTotal) {
        setResult("win");
        setMessage("You win with " + finalPlayerTotal + "!");
        play("win");
        walletPlaceBet(betAmount, true, betAmount * 1.8); // 90% RTP
      } else {
        setResult("push");
        setMessage("Push! It's a tie.");
      }
    };

    dealerDraw();
  }, [gameState, deck, playerTotal, dealerHand, betAmount, walletPlaceBet, play]);

  const doubleDown = useCallback(() => {
    if (gameState !== "playing" || playerHand.length !== 2 || betAmount * 2 > balance) return;
    if (deck.length === 0) return;

    play("flip");

    const newBetAmount = betAmount * 2;
    const newCard = deck.pop()!;
    const newHand = [...playerHand, newCard];
    const newDeck = [...deck];

    setDeck(newDeck);
    setPlayerHand(newHand);

    const newTotal = calculateHand(newHand);
    if (newTotal > 21) {
      setGameState("ended");
      setResult("lose");
      setMessage("Bust! You went over 21.");
      setTimeout(() => play("lose"), 300);
      walletPlaceBet(newBetAmount, false, 0);
      return;
    }

    setTimeout(() => play("flip"), 400);
    setGameState("dealer-turn");
    setBetAmount(newBetAmount);

    let newDealerHand = [...dealerHand];
    let currentDeck = [...newDeck];

    const dealerDraw = async () => {
      while (calculateHand(newDealerHand) < 17 && currentDeck.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 600));
        play("flip");
        newDealerHand = [...newDealerHand, currentDeck.pop()!];
        setDealerHand([...newDealerHand]);
        setDeck([...currentDeck]);
      }

      const finalDealerTotal = calculateHand(newDealerHand);
      const finalPlayerTotal = newTotal;

      setGameState("ended");

      if (finalDealerTotal > 21) {
        setResult("win");
        setMessage("Dealer busts! You win!");
        play("bigWin");
        walletPlaceBet(newBetAmount, true, newBetAmount * 1.8); // 90% RTP
      } else if (finalDealerTotal > finalPlayerTotal) {
        setResult("lose");
        setMessage("Dealer wins with " + finalDealerTotal);
        play("lose");
        walletPlaceBet(newBetAmount, false, 0);
      } else if (finalDealerTotal < finalPlayerTotal) {
        setResult("win");
        setMessage("You win with " + finalPlayerTotal + "!");
        play("bigWin");
        walletPlaceBet(newBetAmount, true, newBetAmount * 1.8); // 90% RTP
      } else {
        setResult("push");
        setMessage("Push! It's a tie.");
      }
    };

    dealerDraw();
  }, [gameState, playerHand, deck, dealerHand, betAmount, balance, walletPlaceBet, play]);

  const resetGame = () => {
    setGameState("betting");
    setPlayerHand([]);
    setDealerHand([]);
    setDeck([]);
    setResult(null);
    setMessage("");
    setBetAmount(100);
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
        <span className="text-white">Blackjack</span>
      </div>

      {/* Mobile Layout: Game first, then controls */}
      <div className="lg:hidden space-y-4">
        {/* Game Table */}
        <div className="bg-[#1a1a2e] rounded-xl p-4">
          {/* Game Result Message */}
          {message && (
            <div className={`mb-4 p-3 rounded-lg text-center font-bold text-sm ${
              result === "win" || result === "blackjack"
                ? "bg-[#FFD700]/20 text-[#FFD700]"
                : result === "lose"
                ? "bg-[#DC2626]/20 text-[#DC2626]"
                : "bg-[#FFD700]/20 text-[#FFD700]"
            }`}>
              {message}
            </div>
          )}

          {/* Dealer Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-[#666666]">Dealer</h3>
              <span className="text-base font-bold text-white">
                {gameState === "ended" || gameState === "dealer-turn"
                  ? dealerTotal
                  : dealerHand.length > 0
                  ? dealerVisibleTotal
                  : "-"}
              </span>
            </div>
            <div className="flex gap-1.5 flex-wrap min-h-[96px]">
              {dealerHand.length === 0 ? (
                <div className="w-16 h-24 rounded-lg border-2 border-dashed border-[#2a2a2a] flex items-center justify-center">
                  <span className="text-[#666666] text-[10px]">Dealer</span>
                </div>
              ) : (
                dealerHand.map((card, i) => (
                  <CardComponent
                    key={card.id}
                    card={card}
                    hidden={i === 1 && gameState === "playing"}
                  />
                ))
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#2a2a2a] my-3" />

          {/* Player Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-[#666666]">Your Hand</h3>
              <span className={`text-base font-bold ${
                playerTotal > 21 ? "text-[#DC2626]" : playerTotal === 21 ? "text-[#FFD700]" : "text-white"
              }`}>
                {playerHand.length > 0 ? playerTotal : "-"}
              </span>
            </div>
            <div className="flex gap-1.5 flex-wrap min-h-[96px]">
              {playerHand.length === 0 ? (
                <div className="w-16 h-24 rounded-lg border-2 border-dashed border-[#2a2a2a] flex items-center justify-center">
                  <span className="text-[#666666] text-[10px]">You</span>
                </div>
              ) : (
                playerHand.map((card) => (
                  <CardComponent key={card.id} card={card} />
                ))
              )}
            </div>
          </div>

          {/* Current Bet Info */}
          {gameState !== "betting" && (
            <div className="mt-3 pt-3 border-t border-[#2a2a2a] flex justify-between text-sm">
              <span className="text-[#666666]">Bet</span>
              <span className="text-white font-bold">{formatCurrency(betAmount)}</span>
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
            {/* Preset chips */}
            <div className="flex gap-2 mt-2">
              {[25, 50, 100, 500].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setBetAmount(preset)}
                  disabled={gameState !== "betting"}
                  className="flex-1 py-1.5 bg-[#0f0f1a] hover:bg-[#2a2a3e] text-[#b0b0b0] hover:text-white text-xs rounded-md transition-colors disabled:opacity-50"
                >
                  ${preset}
                </button>
              ))}
            </div>
          </div>

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
                Deal
              </button>
            ) : gameState === "playing" ? (
              <div className="flex gap-2">
                <button
                  onClick={hit}
                  className="px-6 py-3 bg-[#FFD700] hover:bg-[#FFEA00] text-black font-bold rounded-full transition-colors"
                >
                  Hit
                </button>
                <button
                  onClick={stand}
                  className="px-6 py-3 bg-[#2a2a3e] hover:bg-[#3a3a4e] text-white font-bold rounded-full transition-colors"
                >
                  Stand
                </button>
              </div>
            ) : gameState === "ended" ? (
              <button
                onClick={resetGame}
                className="px-8 py-4 bg-gradient-to-r from-[#DC2626] to-[#FFD700] hover:from-[#EF4444] hover:to-[#FFEA00] text-white font-bold rounded-full transition-colors"
              >
                New Game
              </button>
            ) : (
              <div className="px-6 py-3 text-[#b0b0b0] text-sm">
                Dealer playing...
              </div>
            )}
          </div>

          {/* Double Down - separate row on mobile when available */}
          {gameState === "playing" && playerHand.length === 2 && betAmount * 2 <= balance && (
            <button
              onClick={doubleDown}
              className="w-full py-3 bg-[#DC2626] hover:bg-[#EF4444] text-white font-bold rounded-full transition-colors"
            >
              Double Down
            </button>
          )}
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
              <div className="flex gap-2">
                {[25, 50, 100, 500].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setBetAmount(preset)}
                    disabled={gameState !== "betting"}
                    className="flex-1 py-1.5 bg-[#0f0f1a] hover:bg-[#2a2a3e] text-[#b0b0b0] hover:text-white text-xs rounded-md transition-colors disabled:opacity-50"
                  >
                    ${preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Game Actions */}
            {gameState === "betting" ? (
              <button
                onClick={startGame}
                disabled={betAmount <= 0 || betAmount > balance}
                className="w-full py-4 bg-gradient-to-r from-[#DC2626] to-[#FFD700] hover:from-[#EF4444] hover:to-[#FFEA00] disabled:bg-[#2a2a3e] disabled:from-[#2a2a3e] disabled:to-[#2a2a3e] disabled:text-[#666666] text-white font-bold rounded-full transition-colors disabled:cursor-not-allowed"
              >
                Deal Cards
              </button>
            ) : gameState === "playing" ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={hit}
                    className="py-3 bg-[#FFD700] hover:bg-[#FFEA00] text-black font-bold rounded-full transition-colors"
                  >
                    Hit
                  </button>
                  <button
                    onClick={stand}
                    className="py-3 bg-[#2a2a3e] hover:bg-[#3a3a4e] text-white font-bold rounded-full transition-colors"
                  >
                    Stand
                  </button>
                </div>
                {playerHand.length === 2 && betAmount * 2 <= balance && (
                  <button
                    onClick={doubleDown}
                    className="w-full py-3 bg-[#DC2626] hover:bg-[#EF4444] text-white font-bold rounded-full transition-colors"
                  >
                    Double Down
                  </button>
                )}
              </div>
            ) : gameState === "ended" ? (
              <button
                onClick={resetGame}
                className="w-full py-4 bg-gradient-to-r from-[#DC2626] to-[#FFD700] hover:from-[#EF4444] hover:to-[#FFEA00] text-white font-bold rounded-full transition-colors"
              >
                New Game
              </button>
            ) : (
              <div className="py-4 text-center text-[#b0b0b0]">
                Dealer is playing...
              </div>
            )}

            {/* Balance Display */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-[#666666]">Balance:</span>
              <span className="text-white font-bold">{formatCurrency(balance)}</span>
            </div>
          </div>

          {/* Rules Card */}
          <div className="bg-[#1a1a2e] rounded-xl p-4">
            <h3 className="text-sm font-medium text-white mb-3">Rules</h3>
            <ul className="space-y-2 text-xs text-[#b0b0b0]">
              <li>• Get closer to 21 than the dealer without busting</li>
              <li>• Blackjack pays 2.25x</li>
              <li>• Regular win pays 1.8x</li>
              <li>• Push on ties</li>
              <li>• Dealer stands on 17</li>
            </ul>
          </div>
        </div>

        {/* RIGHT: Game Table */}
        <div className="lg:col-span-2">
          <div className="bg-[#1a1a2e] rounded-xl p-6 h-full">
            {/* Game Result Message */}
            {message && (
              <div className={`mb-6 p-4 rounded-lg text-center font-bold ${
                result === "win" || result === "blackjack"
                  ? "bg-[#FFD700]/20 text-[#FFD700]"
                  : result === "lose"
                  ? "bg-[#DC2626]/20 text-[#DC2626]"
                  : "bg-[#FFD700]/20 text-[#FFD700]"
              }`}>
                {message}
              </div>
            )}

            {/* Dealer Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-[#666666]">Dealer</h3>
                <span className="text-lg font-bold text-white">
                  {gameState === "ended" || gameState === "dealer-turn"
                    ? dealerTotal
                    : dealerHand.length > 0
                    ? dealerVisibleTotal
                    : "-"}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap min-h-[112px]">
                {dealerHand.length === 0 ? (
                  <div className="w-20 h-28 rounded-lg border-2 border-dashed border-[#2a2a2a] flex items-center justify-center">
                    <span className="text-[#666666] text-xs">Dealer</span>
                  </div>
                ) : (
                  dealerHand.map((card, i) => (
                    <CardComponent
                      key={card.id}
                      card={card}
                      hidden={i === 1 && gameState === "playing"}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[#2a2a2a] my-6" />

            {/* Player Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-[#666666]">Your Hand</h3>
                <span className={`text-lg font-bold ${
                  playerTotal > 21 ? "text-[#DC2626]" : playerTotal === 21 ? "text-[#FFD700]" : "text-white"
                }`}>
                  {playerHand.length > 0 ? playerTotal : "-"}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap min-h-[112px]">
                {playerHand.length === 0 ? (
                  <div className="w-20 h-28 rounded-lg border-2 border-dashed border-[#2a2a2a] flex items-center justify-center">
                    <span className="text-[#666666] text-xs">You</span>
                  </div>
                ) : (
                  playerHand.map((card) => (
                    <CardComponent key={card.id} card={card} />
                  ))
                )}
              </div>
            </div>

            {/* Bet Info */}
            {gameState !== "betting" && (
              <div className="mt-8 pt-4 border-t border-[#2a2a2a]">
                <div className="flex justify-between text-sm">
                  <span className="text-[#666666]">Current Bet</span>
                  <span className="text-white font-bold">{formatCurrency(betAmount)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
