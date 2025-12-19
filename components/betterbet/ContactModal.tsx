// components/betterbet/ContactModal.tsx
"use client";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="w-full max-w-sm bg-[#141414] rounded-2xl border border-[#2a2a2a] shadow-2xl p-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Work in Progress content */}
          <div className="text-center">
            {/* Construction icon */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center">
              <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Work in Progress</h2>
            <p className="text-[#b0b0b0] mb-6">
              This feature is coming soon. Stay tuned!
            </p>

            <button
              onClick={onClose}
              className="px-8 py-3 bg-gradient-to-r from-[#DC2626] to-[#FFD700] hover:from-[#EF4444] hover:to-[#FFEA00] text-white font-bold rounded-full transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
