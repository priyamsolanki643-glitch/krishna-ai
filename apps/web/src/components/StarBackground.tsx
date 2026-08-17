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
  color: string;
  alpha: number;
  trailLength: number;
  prevX: number[];
  prevY: number[];
}

const PALETTE = [
  "rgba(255, 255, 255,", // Photon white
  "rgba(99, 102, 241,",  // Indigo
  "rgba(139, 92, 246,",  // Violet
  "rgba(217, 70, 239,",  // Fuchsia
  "rgba(56, 189, 248,",  // Cyan
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

      const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY) * 1.1;
      const count = Math.min(Math.floor((width * height) / 4000), 220); // optimized count for butter 60/120fps

      particles = Array.from({ length: count }, () => {
        const rad = Math.random() * maxRadius + 30;
        const ang = Math.random() * Math.PI * 2;
        const paletteColor = PALETTE[Math.floor(Math.random() * PALETTE.length)];
        return {
          x: centerX + Math.cos(ang) * rad,
          y: centerY + Math.sin(ang) * rad,
          angle: ang,
          radius: rad,
          // Orbital speed increases dramatically near the center (relativistic acceleration)
          speed: (Math.random() * 0.02 + 0.012) * (1 + 120 / (rad + 40)),
          radialVelocity: Math.random() * 1.2 + 0.8, // inward gravitational suction
          size: Math.random() * 1.5 + 0.6,
          color: paletteColor,
          alpha: Math.random() * 0.7 + 0.3,
          trailLength: Math.floor(Math.random() * 4 + 3),
          prevX: [],
          prevY: [],
        };
      });
    };

    initParticles();
    window.addEventListener("resize", initParticles);

    let eventHorizonPulse = 0;

    const render = () => {
      eventHorizonPulse += 0.02;

      // Soft trail clearing for motion blur & light trails
      ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
      ctx.fillRect(0, 0, width, height);

      const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY) * 1.1;

      // ─── 1. Black Hole Gravitational Lensing Glow Ring ───
      const ringRadius = Math.min(width, height) * 0.22;
      const pulseSize = ringRadius + Math.sin(eventHorizonPulse) * 4;

      // Outer accretion corona glow
      const coronaGrad = ctx.createRadialGradient(
        centerX, centerY, pulseSize * 0.6,
        centerX, centerY, pulseSize * 1.8
      );
      coronaGrad.addColorStop(0, "rgba(0, 0, 0, 0.95)");
      coronaGrad.addColorStop(0.35, "rgba(99, 102, 241, 0.04)");
      coronaGrad.addColorStop(0.7, "rgba(217, 70, 239, 0.02)");
      coronaGrad.addColorStop(1, "transparent");

      ctx.fillStyle = coronaGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseSize * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Thin photon sphere halo
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseSize * 0.85, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // ─── 2. Fast Swirling Relativistic Particles ───
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Store trail positions
        p.prevX.unshift(p.x);
        p.prevY.unshift(p.y);
        if (p.prevX.length > p.trailLength) {
          p.prevX.pop();
          p.prevY.pop();
        }

        // Relativistic Keplerian orbit: faster angular velocity near center
        const proximityBoost = Math.max(1, 260 / (p.radius + 30));
        p.angle += p.speed * proximityBoost;
        p.radius -= p.radialVelocity * (0.8 + proximityBoost * 0.4);

        // Calculate new cartesian position
        p.x = centerX + Math.cos(p.angle) * p.radius;
        p.y = centerY + Math.sin(p.angle) * (p.radius * 0.88); // slight perspective inclination

        // Reset particle when swallowed by Singularity
        if (p.radius < 25) {
          p.radius = maxRadius + Math.random() * 80;
          p.angle = Math.random() * Math.PI * 2;
          p.prevX = [];
          p.prevY = [];
        }

        // Draw light streak trail
        if (p.prevX.length > 1) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          for (let t = 0; t < p.prevX.length; t++) {
            ctx.lineTo(p.prevX[t], p.prevY[t]);
          }
          ctx.strokeStyle = `${p.color}${p.alpha * 0.6})`;
          ctx.lineWidth = p.size;
          ctx.lineCap = "round";
          ctx.stroke();
        }

        // Draw particle head
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + proximityBoost * 0.2), 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.min(1, p.alpha * 1.2)})`;
        ctx.fill();
      }

      // ─── 3. Pure Pitch Black Event Horizon Core ───
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseSize * 0.5, 0, Math.PI * 2);
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
