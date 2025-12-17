// components/betterbet/WalletModal.tsx
"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/useWallet";

type Tab = "topup" | "cashout";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onCashIn: (amount: number) => void;
  onCashOut: (amount: number) => void;
}

export default function WalletModal({
  isOpen,
  onClose,
  balance,
  onCashIn,
  onCashOut,
}: WalletModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("topup");
  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setError("");
    }
  }, [isOpen]);

  const presets = [100, 500, 1000, 5000];

  const handleAmountChange = (value: string) => {
    // Only allow positive integers
    const cleaned = value.replace(/[^0-9]/g, "");
    setAmount(cleaned);
    setError("");
  };

  const handlePresetClick = (preset: number) => {
    setAmount(preset.toString());
    setError("");
  };

  const validateAmount = (): number | null => {
    const numAmount = parseInt(amount);

    if (!amount || isNaN(numAmount)) {
      setError("Please enter an amount");
      return null;
    }

    if (numAmount < 1) {
      setError("Minimum amount is $1");
      return null;
    }

    if (activeTab === "cashout" && numAmount > balance) {
      setError("Insufficient balance");
      return null;
    }

    return numAmount;
  };

  const handleSubmit = () => {
    const validAmount = validateAmount();
    if (validAmount === null) return;

    if (activeTab === "topup") {
      onCashIn(validAmount);
    } else {
      onCashOut(validAmount);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="w-full max-w-md bg-[#141414] rounded-2xl shadow-2xl transform transition-all animate-[scaleIn_0.2s_ease-out] border border-[#2a2a2a]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative p-6 pb-0">
            {/* Close button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-[#2a2a2a] z-10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Tabs */}
            <div className="flex border-b border-[#2a2a2a]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("topup");
                  setError("");
                }}
                className={`flex-1 pb-4 text-sm font-semibold transition-colors relative ${
                  activeTab === "topup" ? "text-[#DC2626]" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Top-Up
                {activeTab === "topup" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#DC2626] rounded-full" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("cashout");
                  setError("");
                }}
                className={`flex-1 pb-4 text-sm font-semibold transition-colors relative ${
                  activeTab === "cashout" ? "text-[#FFD700]" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Cash Out
                {activeTab === "cashout" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFD700] rounded-full" />
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Balance display */}
            <div className="mb-6 p-4 bg-[#0a0a0a] rounded-xl border border-[#2a2a2a]">
              <p className="text-xs text-gray-500 mb-1">Current Balance</p>
              <p className="text-2xl font-bold text-[#FFD700]">{formatCurrency(balance)}</p>
            </div>

            {/* Amount label */}
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {activeTab === "topup" ? "Top-Up Amount" : "Cash Out Amount"}
            </label>

            {/* Amount input */}
            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                $
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0"
                className={`w-full pl-8 pr-4 py-4 text-xl font-semibold bg-[#0a0a0a] border-2 rounded-xl outline-none transition-colors text-white placeholder-gray-600 ${
                  error
                    ? "border-red-500 focus:border-red-500"
                    : activeTab === "cashout"
                    ? "border-[#2a2a2a] focus:border-[#FFD700]"
                    : "border-[#2a2a2a] focus:border-[#DC2626]"
                }`}
              />
            </div>

            {/* Error message */}
            {error && (
              <p className="text-sm text-red-500 mb-4">{error}</p>
            )}

            {/* Preset chips */}
            <div className="flex gap-2 mb-6">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                    amount === preset.toString()
                      ? activeTab === "cashout"
                        ? "bg-[#FFD700] text-black shadow-lg shadow-yellow-500/25"
                        : "bg-[#DC2626] text-white shadow-lg shadow-red-500/25"
                      : "bg-[#0a0a0a] text-gray-400 hover:bg-[#2a2a2a] hover:text-white border border-[#2a2a2a]"
                  }`}
                >
                  ${preset.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Submit button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!amount || parseInt(amount) < 1}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                amount && parseInt(amount) >= 1
                  ? activeTab === "topup"
                    ? "bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white hover:from-[#EF4444] hover:to-[#DC2626] shadow-lg shadow-red-500/25"
                    : "bg-gradient-to-r from-[#FFD700] to-[#FFC000] text-black hover:from-[#FFEA00] hover:to-[#FFD700] shadow-lg shadow-yellow-500/25"
                  : "bg-[#2a2a2a] text-gray-600 cursor-not-allowed"
              }`}
            >
              {activeTab === "topup" ? "Top-Up Now" : "Cash Out Now"}
            </button>

            {/* Info text */}
            <p className="mt-4 text-center text-xs text-gray-600">
              {activeTab === "topup"
                ? "Demo credits will be added to your balance instantly"
                : "Demo credits will be removed from your balance"}
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}
