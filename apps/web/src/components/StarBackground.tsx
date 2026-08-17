"use client";

import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  angle: number;
  radius: number;
  speed: number;
  radialVelocity: number;
  size: number;
  alpha: number;
  shade: string; // monochrome shades (white, silver, cool gray)
  trailLength: number;
  prevX: number[];
  prevY: number[];
}

const MONOCHROME_SHADES = [
  "rgba(255, 255, 255,", // Pure crisp white
  "rgba(241, 245, 249,", // Slate 100 (bright platinum)
  "rgba(226, 232, 240,", // Slate 200 (silver)
  "rgba(148, 163, 184,", // Slate 400 (muted zinc)
  "rgba(100, 116, 139,", // Slate 500 (deep cosmic gray)
];

export const StarBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let width = window.innerWidth;
    let height = window.innerHeight;
    let centerX = width / 2;
    let centerY = height / 2;

    const initParticles = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      centerX = width / 2;
      centerY = height / 2;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY) * 1.15;
      const count = Math.min(Math.floor((width * height) / 3800), 240);

      particles = Array.from({ length: count }, () => {
        const rad = Math.random() * maxRadius + 30;
        const ang = Math.random() * Math.PI * 2;
        const shade = MONOCHROME_SHADES[Math.floor(Math.random() * MONOCHROME_SHADES.length)];
        return {
          x: centerX + Math.cos(ang) * rad,
          y: centerY + Math.sin(ang) * rad,
          angle: ang,
          radius: rad,
          // Accelerated Keplerian vortex velocity near singularity
          speed: (Math.random() * 0.018 + 0.012) * (1 + 130 / (rad + 35)),
          radialVelocity: Math.random() * 1.1 + 0.7,
          size: Math.random() * 1.4 + 0.5,
          shade,
          alpha: Math.random() * 0.65 + 0.25,
          trailLength: Math.floor(Math.random() * 5 + 3),
          prevX: [],
          prevY: [],
        };
      });
    };

    initParticles();
    window.addEventListener("resize", initParticles);

    let pulse = 0;

    const render = () => {
      pulse += 0.015;

      // Clean motion trail fade (pure black)
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fillRect(0, 0, width, height);

      const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY) * 1.15;

      // ─── 1. Pure Monochrome Gravitational Corona ───
      const ringRadius = Math.min(width, height) * 0.22;
      const pulseSize = ringRadius + Math.sin(pulse) * 3;

      const monoGrad = ctx.createRadialGradient(
        centerX, centerY, pulseSize * 0.5,
        centerX, centerY, pulseSize * 1.9
      );
      monoGrad.addColorStop(0, "rgba(0, 0, 0, 0.98)");
      monoGrad.addColorStop(0.3, "rgba(255, 255, 255, 0.025)");
      monoGrad.addColorStop(0.65, "rgba(255, 255, 255, 0.008)");
      monoGrad.addColorStop(1, "transparent");

      ctx.fillStyle = monoGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseSize * 1.9, 0, Math.PI * 2);
      ctx.fill();

      // Subtle minimalist photon ring boundary
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseSize * 0.8, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // ─── 2. Monochrome Fast Star Streaks & Dots ───
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.prevX.unshift(p.x);
        p.prevY.unshift(p.y);
        if (p.prevX.length > p.trailLength) {
          p.prevX.pop();
          p.prevY.pop();
        }

        const proximityBoost = Math.max(1, 260 / (p.radius + 30));
        p.angle += p.speed * proximityBoost;
        p.radius -= p.radialVelocity * (0.8 + proximityBoost * 0.35);

        p.x = centerX + Math.cos(p.angle) * p.radius;
        p.y = centerY + Math.sin(p.angle) * (p.radius * 0.88);

        // Reset particle on swallowing
        if (p.radius < 22) {
          p.radius = maxRadius + Math.random() * 70;
          p.angle = Math.random() * Math.PI * 2;
          p.prevX = [];
          p.prevY = [];
        }

        // Draw clean monochrome streak
        if (p.prevX.length > 1) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          for (let t = 0; t < p.prevX.length; t++) {
            ctx.lineTo(p.prevX[t], p.prevY[t]);
          }
          ctx.strokeStyle = `${p.shade}${p.alpha * 0.55})`;
          ctx.lineWidth = p.size;
          ctx.lineCap = "round";
          ctx.stroke();
        }

        // Draw star dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + proximityBoost * 0.15), 0, Math.PI * 2);
        ctx.fillStyle = `${p.shade}${Math.min(1, p.alpha * 1.1)})`;
        ctx.fill();
      }

      // ─── 3. Pitch Black Singularity Center ───
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseSize * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = "#000000";
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", initParticles);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full bg-black"
      aria-hidden="true"
    />
  );
};
