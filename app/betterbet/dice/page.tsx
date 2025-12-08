// app/betterbet/dice/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Outcome = "WIN" | "LOSE" | null;

type HistoryItem = {
  id: number;
  amount: number;
  roll: number;
  outcome: Outcome;
};

export default function DicePage() {
  const [balance, setBalance] = useState<number>(1000);
  const [amount, setAmount] = useState<number>(50);
  const [sliderValue, setSliderValue] = useState<number>(50); // 0–100
  const [guess, setGuess] = useState<"HIGH" | "LOW">("HIGH");
  const [roll, setRoll] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [betCount, setBetCount] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [hitAnim, setHitAnim] = useState(false);

  // derive win chance & multiplier from slider
  const { winChance, multiplier, rollOverLabel } = useMemo(() => {
    const threshold = sliderValue; // 0–100
    const chance =
      guess === "HIGH" ? 100 - threshold : threshold || 1;
    const houseEdge = 0.99; // 1% edge
    const mult = houseEdge * (100 / chance);
    const rollOver =
      guess === "HIGH"
        ? `${threshold.toFixed(1)}+`
        : `${threshold.toFixed(1)}−`;

    return {
      winChance: chance,
      multiplier: mult,
      rollOverLabel: rollOver,
    };
  }, [sliderValue, guess]);

  const avgProfit = betCount === 0 ? 0 : totalProfit / betCount;

  // animate hit
  useEffect(() => {
    if (roll === null) return;
    setHitAnim(true);
    const id = setTimeout(() => setHitAnim(false), 350);
    return () => clearTimeout(id);
  }, [roll]);

  // slider controls guess when crossing 50
  const syncGuessFromSlider = (value: number) => {
    const newGuess: "HIGH" | "LOW" = value >= 50 ? "HIGH" : "LOW";
    setSliderValue(value);
    setGuess(newGuess);
  };

  const placeBet = async () => {
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

    try {
      setLoading(true);

      const res = await fetch("/api/betterbet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "bet",
          amount,
          guess,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || `Server error (${res.status})`);
        return;
      }

      setRoll(data.roll);
      setOutcome(data.outcome);
      setBalance(data.newBalance);

      const profitChange = data.outcome === "WIN" ? amount : -amount;
      setTotalProfit((p) => p + profitChange);
      setBetCount((c) => c + 1);
      setHistory((prev) => {
        const next: HistoryItem[] = [
          {
            id: Date.now(),
            amount,
            roll: data.roll,
            outcome: data.outcome,
          },
          ...prev,
        ];
        return next.slice(0, 10);
      });
    } catch (err) {
      console.error(err);
      setError("Server error while placing bet.");
    } finally {
      setLoading(false);
    }
  };

  const rollBoxClass =
    "mt-2 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 text-2xl font-bold transition-transform duration-200 " +
    (loading ? "animate-pulse " : "") +
    (hitAnim
      ? "scale-125 ring-2 ring-pink-500/70 shadow-[0_0_20px_rgba(236,72,153,0.7)] "
      : "");

  return (
    <div className="min-h-screen bg-transparent text-zinc-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 lg:flex-row">
        {/* LEFT PANEL */}
        <div className="w-full rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-xl lg:w-[340px]">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold tracking-tight">
              BetterBet • Dice
            </h1>
            <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs text-zinc-400">
              Demo
            </span>
          </div>

          <div className="mt-6 flex rounded-2xl bg-zinc-900 p-1 text-sm font-medium">
            <button className="flex-1 rounded-2xl bg-zinc-950 py-2 text-center text-zinc-100">
              Manual
            </button>
            <button className="flex-1 rounded-2xl py-2 text-center text-zinc-500">
              Auto
            </button>
          </div>

          {/* Payout */}
          <div className="mt-6 space-y-2 text-sm">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Payout</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3">
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-zinc-400">₱</span>
                <span className="text-lg font-semibold">
                  {(amount * multiplier).toFixed(2)}
                </span>
              </div>
              <span className="text-sm font-semibold text-emerald-400">
                {multiplier.toFixed(2)}x
              </span>
            </div>
          </div>

          {/* Bet Amount */}
          <div className="mt-6 space-y-2 text-sm">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Bet Amount</span>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-3">
              <div className="flex flex-1 items-center gap-2">
                <span className="text-xs text-zinc-500">₱</span>
                <input
                  type="number"
                  min={1}
                  className="w-full bg-transparent text-sm outline-none"
                  value={amount}
                  onChange={(e) => {
                    const v = Number(e.target.value) || 0;
                    setAmount(v);
                    if (v > 0 && v <= balance) setError(null);
                  }}
                />
              </div>
              <div className="flex gap-1 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setAmount((a) => Math.max(1, Math.floor(a / 2)))
                  }
                  className="rounded-xl bg-zinc-900 px-2 py-1 text-zinc-300 hover:bg-zinc-800"
                >
                  ½
                </button>
                <button
                  type="button"
                  onClick={() => setAmount((a) => Math.max(1, a * 2))}
                  className="rounded-xl bg-zinc-900 px-2 py-1 text-zinc-300 hover:bg-zinc-800"
                >
                  2×
                </button>
                <button
                  type="button"
                  onClick={() => setAmount(balance)}
                  className="rounded-xl bg-zinc-900 px-2 py-1 text-zinc-300 hover:bg-zinc-800"
                >
                  Max
                </button>
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-3 text-xs text-red-400">{error}</p>
          )}

          <button
            type="button"
            onClick={placeBet}
            disabled={loading}
            className="mt-6 w-full rounded-full bg-pink-500 py-3 text-center text-sm font-semibold text-black shadow-lg shadow-pink-500/30 transition hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Rolling..." : "Place bet"}
          </button>

          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-zinc-900 px-3 py-2 text-[11px] text-zinc-500">
            <span className="text-emerald-400">🎮</span>
            <span>
              Betting ₱0.00 will enter demo mode. This is a virtual credits
              game only.
            </span>
          </div>

          {/* Balance box */}
          <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs text-zinc-400">
            <div className="flex items-center justify-between">
              <span>Balance</span>
              <span className="text-sm font-semibold text-zinc-100">
                ₱{balance.toFixed(2)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span>Total profit</span>
              <span
                className={
                  totalProfit >= 0
                    ? "text-emerald-400"
                    : "text-pink-400"
                }
              >
                {totalProfit >= 0 ? "+" : ""}
                {totalProfit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 space-y-6">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-xl">
            {/* Top row */}
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Last roll
                </p>
                <div className={rollBoxClass}>{roll ?? "—"}</div>
                <p className="mt-2 text-xs text-zinc-500">
                  Mode:{" "}
                  {guess === "HIGH"
                    ? "High wins above threshold"
                    : "Low wins below threshold"}
                </p>
              </div>

              <div className="text-right text-sm text-zinc-400">
                <p>
                  Bets:{" "}
                  <span className="font-semibold text-zinc-100">
                    {betCount}
                  </span>
                </p>
                <p className="mt-1">
                  Avg. profit per bet:{" "}
                  <span
                    className={
                      avgProfit >= 0
                        ? "text-emerald-400"
                        : "text-pink-400"
                    }
                  >
                    {avgProfit >= 0 ? "+" : ""}
                    {avgProfit.toFixed(2)}
                  </span>
                </p>
              </div>
            </div>

            {/* Risk slider */}
            <div className="mt-8 space-y-3">
              <div className="text-xs font-medium uppercase tracking-[0.25em] text-zinc-500">
                RISK SLIDER
              </div>

              <div className="relative mt-1 h-10 rounded-full bg-zinc-900 px-6 py-2">
                <div className="absolute inset-[8px] flex overflow-hidden rounded-full bg-zinc-900">
                  <div
                    className="h-full bg-pink-500/80"
                    style={{ width: `${sliderValue}%` }}
                  />
                  <div
                    className="h-full bg-emerald-500/80"
                    style={{ width: `${100 - sliderValue}%` }}
                  />
                </div>

                <div className="absolute inset-0 flex items-center px-6">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={sliderValue}
                    onChange={(e) =>
                      syncGuessFromSlider(Number(e.target.value))
                    }
                    className="w-full cursor-pointer appearance-none bg-transparent"
                  />
                </div>
              </div>

              <div className="mt-2 flex justify-between text-xs text-zinc-500">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>

            {/* Stat cards */}
            <div className="mt-8 grid gap-4 text-sm md:grid-cols-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3">
                <p className="text-xs text-zinc-500">Multiplier</p>
                <p className="mt-1 text-lg font-semibold">
                  {multiplier.toFixed(4)}x
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3">
                <p className="text-xs text-zinc-500">Win Chance</p>
                <p className="mt-1 text-lg font-semibold">
                  {winChance.toFixed(2)}%
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3">
                <p className="text-xs text-zinc-500">Roll Over</p>
                <p className="mt-1 text-lg font-semibold">
                  {rollOverLabel}
                </p>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100">
                Recent rolls
              </h2>
              <span className="text-xs text-zinc-500">
                Last {history.length || 0} bets
              </span>
            </div>

            {history.length === 0 ? (
              <p className="mt-4 text-xs text-zinc-500">
                No bets yet. Place a bet to start your streak.
              </p>
            ) : (
              <div className="mt-4 space-y-2 text-xs">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between rounded-xl border border-zinc-900 bg-zinc-950 px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg bg-zinc-900 px-2 py-1 text-[11px] text-zinc-400">
                        Roll {h.roll}
                      </span>
                      <span className="text-zinc-300">
                        Bet ₱{h.amount.toFixed(2)}
                      </span>
                    </div>
                    <span
                      className={
                        h.outcome === "WIN"
                          ? "text-emerald-400"
                          : "text-pink-400"
                      }
                    >
                      {h.outcome === "WIN" ? "WIN" : "LOSE"}
                    </span>
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
