// lib/useSounds.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SoundType =
  | "win"
  | "lose"
  | "click"
  | "roll"
  | "flip"
  | "reveal"
  | "explosion"
  | "cashout"
  | "bigWin";

export function useSounds() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Helper to get or create AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume if suspended (required by some browsers after user interaction)
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  // Load muted preference on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMute = localStorage.getItem("betterbet_muted");
      setIsMuted(savedMute === "true");
    }
  }, []);

  // Save mute preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("betterbet_muted", String(isMuted));
    }
  }, [isMuted]);

  const playTone = useCallback((
    frequency: number,
    duration: number,
    type: OscillatorType = "sine",
    volume: number = 0.3,
    decay: boolean = true
  ) => {
    if (isMuted) return;

    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    if (decay) {
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    }

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, [isMuted, getAudioContext]);

  const playNoise = useCallback((duration: number, volume: number = 0.1) => {
    if (isMuted) return;

    const ctx = getAudioContext();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    noise.buffer = buffer;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1000, ctx.currentTime);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + duration);
  }, [isMuted, getAudioContext]);

  const play = useCallback((sound: SoundType) => {
    if (isMuted) return;

    switch (sound) {
      case "click":
        // Short click sound
        playTone(800, 0.05, "sine", 0.2);
        break;

      case "roll":
        // Dice rolling - multiple short taps
        for (let i = 0; i < 6; i++) {
          setTimeout(() => {
            playTone(200 + Math.random() * 300, 0.05, "square", 0.15);
          }, i * 40);
        }
        break;

      case "flip":
        // Card flip - swoosh sound
        playTone(300, 0.1, "sine", 0.2);
        setTimeout(() => playTone(600, 0.08, "sine", 0.15), 50);
        break;

      case "win":
        // Winning chime - ascending notes
        playTone(523, 0.15, "sine", 0.3); // C5
        setTimeout(() => playTone(659, 0.15, "sine", 0.3), 100); // E5
        setTimeout(() => playTone(784, 0.2, "sine", 0.3), 200); // G5
        break;

      case "bigWin":
        // Big win - fanfare
        playTone(523, 0.15, "sine", 0.4); // C5
        setTimeout(() => playTone(659, 0.15, "sine", 0.4), 100); // E5
        setTimeout(() => playTone(784, 0.15, "sine", 0.4), 200); // G5
        setTimeout(() => playTone(1047, 0.3, "sine", 0.5), 300); // C6
        setTimeout(() => {
          playTone(784, 0.1, "sine", 0.3);
          playTone(1047, 0.1, "sine", 0.3);
        }, 500);
        setTimeout(() => {
          playTone(784, 0.1, "sine", 0.3);
          playTone(1047, 0.1, "sine", 0.3);
        }, 600);
        setTimeout(() => {
          playTone(784, 0.3, "sine", 0.4);
          playTone(1047, 0.3, "sine", 0.4);
        }, 700);
        break;

      case "lose":
        // Losing sound - descending notes
        playTone(400, 0.15, "sine", 0.25);
        setTimeout(() => playTone(300, 0.2, "sine", 0.2), 100);
        setTimeout(() => playTone(200, 0.3, "sine", 0.15), 200);
        break;

      case "reveal":
        // Gem reveal - sparkle
        playTone(1200, 0.1, "sine", 0.2);
        setTimeout(() => playTone(1500, 0.1, "sine", 0.15), 50);
        setTimeout(() => playTone(1800, 0.15, "sine", 0.1), 100);
        break;

      case "explosion":
        // Mine explosion - boom
        playNoise(0.3, 0.4);
        playTone(80, 0.3, "sawtooth", 0.4);
        setTimeout(() => playTone(60, 0.2, "sawtooth", 0.3), 50);
        break;

      case "cashout":
        // Cash out - coin sounds
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            playTone(1000 + i * 100, 0.1, "sine", 0.2);
          }, i * 60);
        }
        break;
    }
  }, [isMuted, playTone, playNoise]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  return { play, isMuted, toggleMute };
}
