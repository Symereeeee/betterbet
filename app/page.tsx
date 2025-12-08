// app/page.tsx
import Link from "next/link";

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-zinc-100">
      <h1 className="text-3xl font-semibold tracking-tight">
        My Portfolio Hub
      </h1>
      <p className="mt-2 text-sm text-zinc-400">
        Full Stack • QA • Experiments
      </p>
      <div className="mt-6 flex gap-4">
        <Link
          href="/betterbet"
          className="rounded-full bg-pink-500 px-5 py-2 text-sm font-medium text-black hover:bg-pink-400"
        >
          Open BetterBet
        </Link>
      </div>
    </main>
  );
}
