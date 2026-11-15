"use client";

import { useEffect, useRef } from "react";
import { AnimalEngine } from "@/lib/ascii-animals/src/engine";

/** The reference's blue morpho field, rendered through the ASCII Animals engine. */
export function AsciiCurrent() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new AnimalEngine(canvas, {
      animal: "butterflies",
      theme: "dark",
      tuning: {
        density: 0.9,
        speed: 0.95,
        size: 0.92,
        farthest: 0.45,
        farBias: 1.6,
        fog: 0.76,
        spread: 0.06,
        sway: 0.04,
        trail: 0.85,
        trailFade: 1.3,
        shimmer: 0.3,
        sparkle: 0.12,
        grid: 1.05,
        detail: 1.3,
      },
    });

    return () => engine.destroy();
  }, []);

  return <canvas ref={canvasRef} className="kx-ascii-current" aria-hidden="true" />;
}
