// app/betterbet/layout.tsx
export const metadata = {
  title: "BetterBet",
};

export default function BetterBetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-black text-zinc-100">
      {/* background gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-purple-900/40 via-black to-black" />
      {/* subtle stars / noise if you add stars.png */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[url('/stars.png')] opacity-15" />
      {children}
    </div>
  );
}
