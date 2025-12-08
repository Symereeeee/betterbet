// app/api/betterbet/cashin/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// lazy singleton so we don't crash at module load
let prisma: PrismaClient | null = null;
function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

// helper: get or create demo user + wallet
async function getOrCreateDemoWallet() {
  const prisma = getPrisma();

  // 🔹 tweak these fields to match your actual User model
  let user = await prisma.user.findFirst({
    where: { email: "demo@betterbet.local" },
    include: { wallet: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "demo@betterbet.local",
        // add any required fields your User model needs here
        wallet: {
          create: {
            balance: 1000, // starting demo balance
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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid cash in amount." },
        { status: 400 },
      );
    }

    const prisma = getPrisma();
    const wallet = await getOrCreateDemoWallet();

    const updated = await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: amount } },
    });

    return NextResponse.json(
      {
        ok: true,
        newBalance: updated.balance,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("❌ /api/betterbet/cashin error:", err);
    return NextResponse.json(
      { error: "Server error during cash in." },
      { status: 500 },
    );
  }
}
