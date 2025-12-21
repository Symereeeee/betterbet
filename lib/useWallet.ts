// lib/useWallet.ts
"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "betterbet_wallet";
const WALLET_UPDATE_EVENT = "betterbet_wallet_update";
const DEFAULT_BALANCE = 0;

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

// Helper to broadcast wallet updates to all components
const broadcastUpdate = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(WALLET_UPDATE_EVENT));
  }
};

// Helper to read wallet from localStorage
const readWalletFromStorage = (): WalletState => {
  if (typeof window === "undefined") return defaultWallet;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultWallet, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error("Failed to read wallet:", e);
  }
  return defaultWallet;
};

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>(defaultWallet);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load wallet from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    setWallet(readWalletFromStorage());
    setIsLoaded(true);
  }, []);

  // Listen for wallet updates from other components (same tab)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleWalletUpdate = () => {
      setWallet(readWalletFromStorage());
    };

    // Listen for custom event (same tab updates)
    window.addEventListener(WALLET_UPDATE_EVENT, handleWalletUpdate);

    // Listen for storage event (cross-tab updates)
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY) {
        handleWalletUpdate();
      }
    });

    return () => {
      window.removeEventListener(WALLET_UPDATE_EVENT, handleWalletUpdate);
      window.removeEventListener("storage", handleWalletUpdate);
    };
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
    // Read latest from localStorage to avoid stale state issues
    const latest = readWalletFromStorage();
    const newWallet = {
      ...latest,
      balance: (latest.balance || 0) + amount,
    };

    // Save immediately and broadcast
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newWallet));
    setWallet(newWallet);
    broadcastUpdate();
  }, []);

  const cashOut = useCallback((amount: number) => {
    // Read latest from localStorage to avoid stale state issues
    const latest = readWalletFromStorage();
    const newWallet = {
      ...latest,
      balance: Math.max(0, (latest.balance || 0) - amount),
    };

    // Save immediately and broadcast
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newWallet));
    setWallet(newWallet);
    broadcastUpdate();
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
