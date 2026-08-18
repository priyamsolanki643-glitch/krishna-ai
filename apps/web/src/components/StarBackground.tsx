"use client";

import React, { useEffect, useRef } from "react";

interface Star {
  x: number;   // world space [-1, 1]
  y: number;
  z: number;   // depth [0.01, 1] — smaller = closer
  pz: number;  // prev z for trail
}

const STAR_COUNT = 1500;
const FL = 300; // focal length

function randomStar(width: number, height: number): Star {
  const z = Math.random() * 0.98 + 0.02;
  return {
    x: (Math.random() - 0.5) * 2,
    y: (Math.random() - 0.5) * 2,
    z,
    pz: z,
  };
}

export const StarBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const speedRef = useRef(0.0015);
  const targetSpeedRef = useRef(0.0015);
  const rafRef = useRef<number>(0);
  const lastScrollRef = useRef(0);
  const lastScrollTimeRef = useRef(Date.now());
  const isMobileRef = useRef(false);

  // Touch state for mobile warp burst
  const touchStartYRef = useRef(0);
  const touchActiveRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    isMobileRef.current = width < 768;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      isMobileRef.current = width < 768;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
      // Re-init stars on resize
      starsRef.current = Array.from({ length: STAR_COUNT }, () => randomStar(width, height));
    };

    resize();
    starsRef.current = Array.from({ length: STAR_COUNT }, () => randomStar(width, height));
    window.addEventListener("resize", resize);

    // Desktop: link scroll velocity to warp speed
    const handleScroll = () => {
      if (isMobileRef.current) return;
      const now = Date.now();
      const dt = Math.max(1, now - lastScrollTimeRef.current);
      const dy = Math.abs(window.scrollY - lastScrollRef.current);
      const velocity = dy / dt; // px/ms
      // Map velocity [0, 2] to speed [0.002, 0.025]
      const warpBoost = Math.min(velocity * 0.012, 0.025);
      targetSpeedRef.current = 0.002 + warpBoost;
      lastScrollRef.current = window.scrollY;
      lastScrollTimeRef.current = now;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Mobile: touch swipe triggers warp burst
    const handleTouchStart = (e: TouchEvent) => {
      if (!isMobileRef.current) return;
      touchStartYRef.current = e.touches[0].clientY;
      touchActiveRef.current = true;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!isMobileRef.current || !touchActiveRef.current) return;
      const dy = Math.abs(touchStartYRef.current - e.touches[0].clientY);
      const velocity = dy / 100;
      targetSpeedRef.current = Math.min(0.002 + velocity * 0.025, 0.04); // Hyperspace burst
    };
    const handleTouchEnd = () => {
      touchActiveRef.current = false;
      // Ease back to ambient drift
      setTimeout(() => { targetSpeedRef.current = 0.0015; }, 600);
    };
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);

    // Render loop
    const render = () => {
      // Smooth interpolate toward target speed
      speedRef.current += (targetSpeedRef.current - speedRef.current) * 0.06;

      const speed = speedRef.current;
      const isWarping = speed > 0.005;

      ctx.fillStyle = isWarping
        ? `rgba(0,0,0,${0.25 + speed * 3})`  // faster fade = longer trails
        : "rgba(0,0,0,0.18)";
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      for (let i = 0; i < starsRef.current.length; i++) {
        const s = starsRef.current[i];
        s.pz = s.z;
        s.z -= speed;

        if (s.z <= 0.001) {
          starsRef.current[i] = randomStar(width, height);
          starsRef.current[i].z = 1;
          starsRef.current[i].pz = 1;
          continue;
        }

        // 3D projection
        const sx = (s.x / s.z) * FL + cx;
        const sy = (s.y / s.z) * FL + cy;
        const psx = (s.x / s.pz) * FL + cx;
        const psy = (s.y / s.pz) * FL + cy;

        // Alpha based on depth
        const alpha = Math.min(1, (1 - s.z) * 1.4);
        const size = Math.max(0.4, (1 - s.z) * 2.2);

        if (isWarping && s.pz !== s.z) {
          // Warp trail streak
          ctx.beginPath();
          ctx.moveTo(psx, psy);
          ctx.lineTo(sx, sy);
          ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.85})`;
          ctx.lineWidth = size * 0.7;
          ctx.stroke();
        } else {
          // Normal star dot
          ctx.beginPath();
          ctx.arc(sx, sy, size * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.fill();
        }
      }

      // Ease target speed back to ambient when no scroll
      if (!touchActiveRef.current && !isMobileRef.current) {
        targetSpeedRef.current += (0.0015 - targetSpeedRef.current) * 0.02;
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 w-full h-full bg-black"
      aria-hidden="true"
    />
  );
};
