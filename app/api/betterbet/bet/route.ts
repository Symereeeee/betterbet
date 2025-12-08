// app/api/betterbet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEMO_EMAIL = "demo@betterbet.local";

async function getOrCreateDemoWallet() {
  let user = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    include: { wallet: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: DEMO_EMAIL,
        wallet: {
          create: {
            balance: 1000,
          },
        },
      },
      include: { wallet: true },
    });
  }

  if (!user.wallet) {
    const wallet = await prisma.wallet.create({
      data: {
        balance: 1000,
        userId: user.id,
      },
    });
    return wallet;
  }

  return user.wallet;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const kind = body.kind as "bet" | "cashin";
    const amount = Number(body.amount);
    const guess = body.guess as "HIGH" | "LOW" | undefined;

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0." },
        { status: 400 }
      );
    }

    const wallet = await getOrCreateDemoWallet();

    // CASH IN
    if (kind === "cashin") {
      const updated = await prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });

      return NextResponse.json({
        ok: true,
        newBalance: updated.balance,
      });
    }

    // BET
    if (kind === "bet") {
      if (guess !== "HIGH" && guess !== "LOW") {
        return NextResponse.json(
          { error: "Invalid guess." },
          { status: 400 }
        );
      }

      if (amount > wallet.balance) {
        return NextResponse.json(
          { error: "Insufficient balance." },
          { status: 400 }
        );
      }

      // simple 1–100 roll: 50/50 high vs low
      const roll = Math.floor(Math.random() * 100) + 1;
      const isWin =
        guess === "HIGH" ? roll > 50 : roll <= 50;

      const delta = isWin ? amount : -amount;

      const updated = await prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: delta } },
      });

      await prisma.bet.create({
        data: {
          amount,
          roll,
          outcome: isWin ? "WIN" : "LOSE",
          userId: wallet.userId,
        },
      });

      return NextResponse.json({
        ok: true,
        roll,
        outcome: isWin ? "WIN" : "LOSE",
        newBalance: updated.balance,
      });
    }

    return NextResponse.json(
      { error: "Unknown operation." },
      { status: 400 }
    );
  } catch (err) {
    console.error("❌ /api/betterbet error:", err);
    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}
