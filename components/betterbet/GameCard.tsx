// components/betterbet/GameCard.tsx
"use client";

import Link from "next/link";

interface GameCardProps {
  name: string;
  href: string;
  icon: string;
  description: string;
  tag?: string;
  comingSoon?: boolean;
  gradient?: string;
  houseEdge?: string;
}

export default function GameCard({
  name,
  href,
  icon,
  description,
  tag,
  comingSoon = false,
  gradient = "from-[#8b5cf6] to-[#f97316]",
  houseEdge,
}: GameCardProps) {
  const Wrapper = comingSoon ? "div" : Link;

  return (
    <Wrapper
      href={comingSoon ? "#" : href}
      className={`group relative overflow-hidden rounded-xl bg-[#12121a] border border-[#2a2a3e] transition-all duration-300 ${
        comingSoon
          ? "opacity-60 cursor-not-allowed"
          : "hover:border-[#8b5cf6]/50 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1"
      }`}
    >
      {/* Gradient header */}
      <div className={`h-32 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
        {/* Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl opacity-90 group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">
            {icon}
          </span>
        </div>

        {/* Coming soon badge */}
        {comingSoon && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 backdrop-blur rounded-full text-xs font-semibold text-white">
            Coming Soon
          </div>
        )}

        {/* Tag */}
        {tag && !comingSoon && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 backdrop-blur rounded-full text-xs font-semibold text-white">
            {tag}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-white mb-1">{name}</h3>
        <p className="text-sm text-[#b0b0c0] mb-3">{description}</p>

        <div className="flex items-center justify-between">
          {houseEdge && (
            <span className="text-xs text-[#666680]">
              House Edge: {houseEdge}
            </span>
          )}
          {!comingSoon && (
            <span className="text-sm text-[#8b5cf6] font-medium group-hover:text-[#a78bfa] group-hover:translate-x-1 transition-all">
              Play Now →
            </span>
          )}
        </div>
      </div>
    </Wrapper>
  );
}
