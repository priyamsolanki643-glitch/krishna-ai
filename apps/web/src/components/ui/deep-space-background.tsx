"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface DeepSpaceBackgroundProps {
  particleCount?: number;
  speed?: number;
  starColor?: string;
  className?: string;
}

interface Star {
  x: number;
  y: number;
  z: number;
  prevZ: number;
  size: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  isDust?: boolean;
}

export function DeepSpaceBackground({
  particleCount = 800,
  speed = 0.4,
  starColor = "#ffffff",
  className,
}: DeepSpaceBackgroundProps) {
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

    // Mouse parallax with smooth lerp
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

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
      targetMouseX = Math.max(-1, Math.min(1, rawX)) * 40;
      targetMouseY = Math.max(-1, Math.min(1, rawY)) * 40;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Initialize stars (Deep space 3D distribution)
    const stars: Star[] = [];
    const maxDepth = 1500;

    for (let i = 0; i < particleCount; i++) {
      const isDust = i % 5 === 0;
      const initialZ = Math.random() * maxDepth;
      stars.push({
        x: (Math.random() - 0.5) * width * 3,
        y: (Math.random() - 0.5) * height * 3,
        z: initialZ,
        prevZ: initialZ,
        size: isDust ? Math.random() * 2.2 + 0.8 : Math.random() * 1.4 + 0.3,
        baseAlpha: isDust ? Math.random() * 0.4 + 0.15 : Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.04 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2,
        isDust,
      });
    }

    let time = 0;

    const render = () => {
      // Smooth dampening / lerp for mouse parallax
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      time += 0.02;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        star.prevZ = star.z;
        star.z -= speed * (star.isDust ? 1.4 : 1.0);

        if (star.z <= 0) {
          star.z = maxDepth;
          star.prevZ = maxDepth;
          star.x = (Math.random() - 0.5) * width * 3;
          star.y = (Math.random() - 0.5) * height * 3;
        }

        const k = 300 / star.z;
        const px = (star.x + mouseX * (1 - star.z / maxDepth)) * k + cx;
        const py = (star.y + mouseY * (1 - star.z / maxDepth)) * k + cy;

        if (px >= -20 && px <= width + 20 && py >= -20 && py <= height + 20) {
          const depthRatio = 1 - star.z / maxDepth;
          const twinkle = Math.sin(time * star.twinkleSpeed * 10 + star.twinklePhase) * 0.3 + 0.7;
          const alpha = star.baseAlpha * Math.max(0.1, depthRatio) * twinkle;
          const renderedSize = Math.max(0.4, star.size * k * 0.9);

          ctx.beginPath();
          ctx.arc(px, py, renderedSize, 0, Math.PI * 2);

          if (star.isDust) {
            ctx.fillStyle = `rgba(212, 212, 216, ${alpha * 0.7})`;
            ctx.shadowBlur = 8;
            ctx.shadowColor = "rgba(255, 255, 255, 0.4)";
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.shadowBlur = renderedSize > 1.2 ? 5 : 0;
            ctx.shadowColor = starColor;
          }

          ctx.fill();
        }
      }

      // Center subtle vignette gradient to preserve razor-sharp headline contrast
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.65);
      gradient.addColorStop(0, "rgba(0, 0, 0, 0.1)");
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
  }, [particleCount, speed, starColor]);

  return (
    <div
      ref={containerRef}
      className={cn("absolute inset-0 -z-10 pointer-events-none overflow-hidden bg-black", className)}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
