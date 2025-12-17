// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BetterBet v2 - Demo Casino",
  description: "Experience the thrill of casino gaming with provably fair games. Play Dice, Blackjack, Mines and more!",
  keywords: ["casino", "gambling", "dice", "blackjack", "mines", "demo"],
  authors: [{ name: "BetterBet" }],
  openGraph: {
    title: "BetterBet - Demo Casino",
    description: "Experience the thrill of casino gaming with provably fair games.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
