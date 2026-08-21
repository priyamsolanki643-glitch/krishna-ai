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
  color: string;
}

export function InteractiveStarfield({
  active = true,
  particleCount = 500,
  speed = 0.5,
  className,
}: InteractiveStarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let cx = width / 2;
    let cy = height / 2;

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const maxDepth = 1200;
    const stars: Star[] = [];

    const initStars = (w: number, h: number) => {
      stars.length = 0;
      for (let i = 0; i < particleCount; i++) {
        const isBright = Math.random() < 0.25;
        const isMedium = Math.random() < 0.5;
        stars.push({
          x: (Math.random() - 0.5) * w * 2.5,
          y: (Math.random() - 0.5) * h * 2.5,
          z: Math.random() * maxDepth + 1,
          size: isBright ? Math.random() * 2.2 + 1.2 : isMedium ? Math.random() * 1.6 + 0.8 : Math.random() * 1.0 + 0.4,
          baseAlpha: isBright ? Math.random() * 0.4 + 0.6 : Math.random() * 0.5 + 0.3,
          twinkleSpeed: Math.random() * 0.04 + 0.015,
          twinklePhase: Math.random() * Math.PI * 2,
          color: isBright ? "#ffffff" : isMedium ? "#e4e4e7" : "#d4d4d8",
        });
      }
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      cx = width / 2;
      cy = height / 2;
      initStars(width, height);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const rawX = (e.clientX - cx) / cx;
      const rawY = (e.clientY - cy) / cy;
      targetMouseX = Math.max(-1, Math.min(1, rawX)) * 60;
      targetMouseY = Math.max(-1, Math.min(1, rawY)) * 60;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    let time = 0;

    const render = () => {
      // Smooth lerp for mouse parallax
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Draw rich pure pitch black canvas background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      time += 0.025;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Move star forward
        star.z -= speed * 1.2;

        if (star.z <= 0) {
          star.z = maxDepth;
          star.x = (Math.random() - 0.5) * width * 2.5;
          star.y = (Math.random() - 0.5) * height * 2.5;
        }

        const k = 320 / star.z;
        const px = (star.x + mouseX * (1 - star.z / maxDepth)) * k + cx;
        const py = (star.y + mouseY * (1 - star.z / maxDepth)) * k + cy;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const depthRatio = Math.max(0.15, Math.min(1, (1 - star.z / maxDepth) * 1.3));
          const twinkle = Math.sin(time * star.twinkleSpeed * 10 + star.twinklePhase) * 0.3 + 0.7;
          const alpha = star.baseAlpha * depthRatio * twinkle;
          const renderedSize = Math.max(0.6, star.size * k * 0.9);

          ctx.beginPath();
          ctx.arc(px, py, renderedSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;

          if (renderedSize > 1.4) {
            ctx.shadowBlur = 8;
            ctx.shadowColor = "rgba(255, 255, 255, 0.9)";
          } else {
            ctx.shadowBlur = 0;
          }

          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [particleCount, speed]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-700 ease-in-out bg-black",
        active ? "opacity-100" : "opacity-0",
        className
      )}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
