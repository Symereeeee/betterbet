// app/api/betterbet/wallet/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DEMO_EMAIL = "demo@betterbet.local";

export async function GET() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: DEMO_EMAIL },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      return NextResponse.json({
        balance: 1000, // default if nothing yet
      });
    }

    return NextResponse.json({
      balance: user.wallet.balance,
    });
  } catch (err) {
    console.error("Wallet GET error:", err);
    return NextResponse.json(
      { error: "Could not load wallet balance" },
      { status: 500 }
    );
  }
}
