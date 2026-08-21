"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface InteractiveStarfieldProps {
  active?: boolean;
  particleCount?: number;
  speed?: number;
  className?: string;
}

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  layer: number; // 0: distant, 1: mid, 2: foreground
}

export function InteractiveStarfield({
  active = true,
  particleCount = 650,
  speed = 0.35,
  className,
}: InteractiveStarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let cx = 0;
    let cy = 0;

    // Mouse velocity & position tracking with smooth dampening
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let mouseVelX = 0;
    let mouseVelY = 0;
    let lastClientX = 0;
    let lastClientY = 0;

    const resize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = rect.width || window.innerWidth;
      height = rect.height || window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      cx = width / 2;
      cy = height / 2;
    };

    resize();

    const resizeObserver = new ResizeObserver(() => {
      resize();
    });
    resizeObserver.observe(container);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const rawX = (e.clientX - rect.left - cx) / cx;
      const rawY = (e.clientY - rect.top - cy) / cy;

      targetMouseX = Math.max(-1, Math.min(1, rawX)) * 50;
      targetMouseY = Math.max(-1, Math.min(1, rawY)) * 50;

      // Calculate instantaneous mouse velocity for warp reactivity
      if (lastClientX !== 0 || lastClientY !== 0) {
        mouseVelX = (e.clientX - lastClientX) * 0.15;
        mouseVelY = (e.clientY - lastClientY) * 0.15;
      }
      lastClientX = e.clientX;
      lastClientY = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Initialize 600+ multi-depth micro-particles
    const maxDepth = 1400;
    const stars: Star[] = [];

    for (let i = 0; i < particleCount; i++) {
      const layer = Math.random() < 0.65 ? 0 : Math.random() < 0.88 ? 1 : 2;
      const initialZ = Math.random() * maxDepth;
      stars.push({
        x: (Math.random() - 0.5) * width * 3,
        y: (Math.random() - 0.5) * height * 3,
        z: initialZ,
        size: layer === 0 ? Math.random() * 0.9 + 0.3 : layer === 1 ? Math.random() * 1.5 + 0.7 : Math.random() * 2.2 + 1.1,
        baseAlpha: layer === 0 ? Math.random() * 0.5 + 0.2 : layer === 1 ? Math.random() * 0.6 + 0.3 : Math.random() * 0.8 + 0.4,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2,
        layer,
      });
    }

    let time = 0;

    const render = () => {
      // Smooth damped lerp for mouse parallax & velocity dissipation
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;
      mouseVelX *= 0.92;
      mouseVelY *= 0.92;

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      time += 0.02;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Multi-layered depth velocity: Foreground moves faster
        const layerMultiplier = star.layer === 0 ? 0.7 : star.layer === 1 ? 1.1 : 1.6;
        star.z -= speed * layerMultiplier + (Math.abs(mouseVelX) + Math.abs(mouseVelY)) * 0.05;

        if (star.z <= 0) {
          star.z = maxDepth;
          star.x = (Math.random() - 0.5) * width * 3;
          star.y = (Math.random() - 0.5) * height * 3;
        }

        const k = 280 / star.z;
        const warpOffsetX = mouseVelX * (star.layer + 1) * 2;
        const warpOffsetY = mouseVelY * (star.layer + 1) * 2;
        const px = (star.x + mouseX * (1 - star.z / maxDepth) + warpOffsetX) * k + cx;
        const py = (star.y + mouseY * (1 - star.z / maxDepth) + warpOffsetY) * k + cy;

        if (px >= -15 && px <= width + 15 && py >= -15 && py <= height + 15) {
          const depthAlpha = Math.min(1, Math.max(0.08, (1 - star.z / maxDepth) * 1.2));
          const twinkle = Math.sin(time * star.twinkleSpeed * 10 + star.twinklePhase) * 0.25 + 0.75;
          const alpha = star.baseAlpha * depthAlpha * twinkle;
          const renderedSize = Math.max(0.4, star.size * k * 0.85);

          ctx.beginPath();
          ctx.arc(px, py, renderedSize, 0, Math.PI * 2);

          if (star.layer === 2) {
            // Subtle silver glow for foreground micro-particles
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.shadowBlur = 6;
            ctx.shadowColor = "rgba(255, 255, 255, 0.6)";
          } else if (star.layer === 1) {
            ctx.fillStyle = `rgba(228, 228, 231, ${alpha * 0.9})`;
            ctx.shadowBlur = renderedSize > 1.2 ? 3 : 0;
            ctx.shadowColor = "rgba(255, 255, 255, 0.3)";
          } else {
            // Crisp dim zinc/silver distant stars
            ctx.fillStyle = `rgba(212, 212, 216, ${alpha * 0.7})`;
            ctx.shadowBlur = 0;
          }

          ctx.fill();
        }
      }

      // Radial Center Darkness Mask: Ensures hero typography has 100% razor-sharp contrast
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.7);
      gradient.addColorStop(0, "rgba(0, 0, 0, 0.15)");
      gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.45)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.95)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [particleCount, speed]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 -z-10 pointer-events-none overflow-hidden bg-black transition-opacity duration-700 ease-in-out",
        active ? "opacity-100" : "opacity-0",
        className
      )}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
