// app/betterbet/blackjack/page.tsx
export default function BlackjackPlaceholder() {
  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Blackjack (Coming Soon)
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          This table is still under construction. The idea:
        </p>

        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-300">
          <li>Player vs dealer, using a single shoe.</li>
          <li>Hit / Stand controls with simple animations.</li>
          <li>Virtual credits only, same wallet as Dice.</li>
          <li>Bet size selector and win / loss history.</li>
        </ul>

        <p className="mt-6 text-xs text-zinc-500">
          You can go back to{" "}
          <a
            href="/betterbet"
            className="text-pink-400 underline"
          >
            BetterBet lobby
          </a>{" "}
          or keep this as a future feature idea for your
          portfolio.
        </p>
      </div>
    </div>
  );
}
