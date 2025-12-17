// lib/useWallet.ts
"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "sixseven_wallet";
const DEFAULT_BALANCE = 10000;

export interface WalletState {
  balance: number;
  totalWagered: number;
  totalWon: number;
  totalLost: number;
  betsPlaced: number;
}

const defaultWallet: WalletState = {
  balance: DEFAULT_BALANCE,
  totalWagered: 0,
  totalWon: 0,
  totalLost: 0,
  betsPlaced: 0,
};

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>(defaultWallet);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load wallet from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setWallet({ ...defaultWallet, ...parsed });
      }
    } catch (e) {
      console.error("Failed to load wallet:", e);
    }
    setIsLoaded(true);
  }, []);

  // Save wallet to localStorage whenever it changes
  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
  }, [wallet, isLoaded]);

  const updateBalance = useCallback((amount: number) => {
    setWallet((prev) => ({
      ...prev,
      balance: Math.max(0, prev.balance + amount),
    }));
  }, []);

  const placeBet = useCallback((betAmount: number, won: boolean, winAmount: number = 0) => {
    setWallet((prev) => {
      const netChange = won ? winAmount - betAmount : -betAmount;
      return {
        ...prev,
        balance: Math.max(0, prev.balance + netChange),
        totalWagered: prev.totalWagered + betAmount,
        totalWon: won ? prev.totalWon + winAmount : prev.totalWon,
        totalLost: !won ? prev.totalLost + betAmount : prev.totalLost,
        betsPlaced: prev.betsPlaced + 1,
      };
    });
  }, []);

  const resetWallet = useCallback(() => {
    setWallet(defaultWallet);
  }, []);

  const addFunds = useCallback((amount: number) => {
    setWallet((prev) => ({
      ...prev,
      balance: prev.balance + amount,
    }));
  }, []);

  const cashOut = useCallback((amount: number) => {
    setWallet((prev) => ({
      ...prev,
      balance: Math.max(0, prev.balance - amount),
    }));
  }, []);

  return {
    ...wallet,
    isLoaded,
    updateBalance,
    placeBet,
    resetWallet,
    addFunds,
    cashOut,
  };
}

// Format balance with commas
export function formatBalance(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Format currency with symbol
export function formatCurrency(amount: number): string {
  return `$${formatBalance(amount)}`;
}
