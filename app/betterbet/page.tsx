// app/betterbet/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const games = [
  {
    id: "dice",
    href: "/betterbet/dice",
    title: "High / Low Dice",
    tag: "Dice • variable odds",
    badge: "Popular",
    description: "Quick rolls, simple odds, instant results.",
    gradient: "from-pink-500 via-fuchsia-500 to-purple-500",
  },
  {
    id: "blackjack",
    href: "/betterbet/blackjack",
    title: "Blackjack (Soon)",
    tag: "Cards • 3:2",
    badge: "Coming soon",
    description: "Beat the dealer without going over 21.",
    gradient: "from-emerald-500 via-lime-500 to-teal-500",
  },
];

export default function BetterBetLanding() {
  const [showCashIn, setShowCashIn] = useState(false);
  const [cashInAmount, setCashInAmount] = useState<number>(1000);
  const [cashInLoading, setCashInLoading] = useState(false);
  const [cashInError, setCashInError] = useState<string | null>(null);

  // always show on first visit (per browser)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem("betterbet_demo_seen");
    if (!seen) setShowCashIn(true);
  }, []);

  const handleConfirmCashIn = async () => {
    setCashInError(null);

    if (!Number.isFinite(cashInAmount) || cashInAmount <= 0) {
      setCashInError("Amount must be greater than 0.");
      return;
    }

    try {
      setCashInLoading(true);

      const res = await fetch("/api/betterbet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "cashin",
          amount: cashInAmount,
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch (e) {
        console.error("Failed to parse JSON from /api/betterbet", e);
      }

      if (!res.ok || data?.error) {
        setCashInError(
          data?.error || `Cash in failed (status ${res.status}).`
        );
        return;
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem("betterbet_demo_seen", "1");
        if (typeof data?.newBalance === "number") {
          window.localStorage.setItem(
            "betterbet_last_balance",
            String(data.newBalance)
          );
        }
      }

      setShowCashIn(false);
    } catch (err) {
      console.error(err);
      setCashInError("Network error during cash in.");
    } finally {
      setCashInLoading(false);
    }
  };

  const handleSkip = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("betterbet_demo_seen", "1");
    }
    setShowCashIn(false);
  };

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-6xl px-4 py-10">
        {/* HEADER */}
        <header className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <img
              src="/betterbet-logo.png"
              alt="BetterBet Logo"
              className="h-10 w-10 rounded-xl shadow-lg shadow-pink-500/20 object-cover"
            />
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                BetterBet
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                Pick a game mode and play with virtual credits.
              </p>
            </div>
          </div>

          <span className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-1 text-xs text-zinc-400">
            Demo Casino • v1
          </span>
        </header>

        {/* OUR FAVORITES */}
        <section className="mt-10">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="text-2xl font-extrabold italic">
                Our Favorites!
              </h2>
              <p className="text-sm text-zinc-400">
                Top-rated games hand-picked just for you.
              </p>
            </div>
            <button className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-400">
              See all →
            </button>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
              <Link
                key={game.id}
                href={game.href}
                className="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 shadow-lg transition hover:-translate-y-1 hover:border-pink-500/70 hover:shadow-pink-500/30"
              >
                <div
                  className={`h-32 w-full bg-gradient-to-tr ${game.gradient} opacity-80 transition group-hover:opacity-100`}
                />
                <div className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-[11px] font-semibold text-zinc-200">
                  {game.badge}
                </div>

                <div className="space-y-2 px-4 pb-4 pt-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
                    {game.tag}
                  </p>
                  <h3 className="text-lg font-semibold tracking-tight">
                    {game.title}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {game.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-2 py-1">
                      🎮 Demo play
                    </span>
                    <span className="inline-flex items-center gap-1 text-pink-400 group-hover:translate-x-0.5 group-hover:text-pink-300">
                      Play now <span>➜</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* HOT GAMES */}
        <section className="mt-12">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="text-2xl font-extrabold italic">Hot Games!</h2>
              <p className="text-sm text-zinc-400">
                Start spinning, rolling, and dealing.
              </p>
            </div>
            <button className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-400">
              See all →
            </button>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <Link
              href="/betterbet/dice"
              className="group overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-4 shadow-lg transition hover:-translate-y-1 hover:border-pink-500/70 hover:shadow-pink-500/30"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Hot pick
              </p>
              <h3 className="mt-2 text-lg font-semibold">High / Low Dice</h3>
              <p className="mt-1 text-xs text-zinc-400">
                Your current game. Try to build a winning streak.
              </p>
              <p className="mt-3 text-xs text-pink-400 group-hover:translate-x-0.5">
                Play dice →
              </p>
            </Link>

            <Link
              href="/betterbet/blackjack"
              className="group overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/70 p-4 opacity-70 shadow-lg transition hover:-translate-y-1 hover:border-emerald-500/70 hover:opacity-100 hover:shadow-emerald-500/20"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Coming soon
              </p>
              <h3 className="mt-2 text-lg font-semibold">Blackjack Table</h3>
              <p className="mt-1 text-xs text-zinc-400">
                Work in progress. Click to see the prototype rules.
              </p>
              <p className="mt-3 text-xs text-emerald-400 group-hover:translate-x-0.5">
                View table →
              </p>
            </Link>

            <div className="hidden rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/40 p-4 text-xs text-zinc-500 md:block">
              More games coming soon…
            </div>
          </div>
        </section>
      </main>

      {/* CASH-IN MODAL */}
      {showCashIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <h2 className="text-lg font-semibold">Cash in demo credits</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Choose how many virtual credits you want to start with.
            </p>

            <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">₱</span>
                <input
                  type="number"
                  min={1}
                  className="w-full bg-transparent text-sm outline-none"
                  value={Number.isFinite(cashInAmount) ? cashInAmount : ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      setCashInAmount(0);
                      return;
                    }
                    const num = Number(raw);
                    if (Number.isFinite(num)) setCashInAmount(num);
                  }}
                />
              </div>
            </div>

            {cashInError && (
              <p className="mt-2 text-xs text-red-400">{cashInError}</p>
            )}

            <div className="mt-6 flex justify-end gap-3 text-sm">
              <button
                type="button"
                onClick={handleSkip}
                className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-300 hover:bg-zinc-800"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleConfirmCashIn}
                disabled={cashInLoading}
                className="rounded-full bg-emerald-500 px-5 py-2 font-semibold text-black shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cashInLoading ? "Cashing in…" : "Confirm & play"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
