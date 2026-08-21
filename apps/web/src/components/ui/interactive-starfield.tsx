"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface InteractiveStarfieldProps {
  active?: boolean;
  starCount?: number;
  particleCount?: number;
  speed?: number;
  className?: string;
}

interface MicroStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  parallaxFactor: number;
}

export function InteractiveStarfield({
  active = true,
  starCount = 450,
  particleCount,
  speed = 0.12,
  className,
}: InteractiveStarfieldProps) {
  const count = particleCount || starCount;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Damped Mouse Parallax Tracking
    let mouseOffsetX = 0;
    let mouseOffsetY = 0;
    let targetMouseOffsetX = 0;
    let targetMouseOffsetY = 0;

    const stars: MicroStar[] = [];

    const initStars = (w: number, h: number) => {
      stars.length = 0;
      for (let i = 0; i < count; i++) {
        const size = Math.random() < 0.8 ? 1.0 : 1.5; // Strictly 1.0px to 1.5px micro-dots
        const layerSpeed = Math.random() * 0.2 + 0.15; // Gentle smooth velocity
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: layerSpeed * 0.9, // Continuous rightward drift
          vy: -layerSpeed * 0.9, // Continuous upward drift (Bottom-Left to Top-Right)
          size,
          baseAlpha: Math.random() * 0.45 + 0.2, // Authentic soft glimmer
          twinkleSpeed: Math.random() * 0.02 + 0.008,
          twinklePhase: Math.random() * Math.PI * 2,
          parallaxFactor: Math.random() * 0.5 + 0.2, // Subtle depth layer shift
        });
      }
    };

    initStars(width, height);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars(width, height);
    };

    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const cx = width / 2;
      const cy = height / 2;
      const normX = (e.clientX - cx) / cx;
      const normY = (e.clientY - cy) / cy;
      targetMouseOffsetX = normX * 25; // Gentle 25px max parallax shift
      targetMouseOffsetY = normY * 25;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    let time = 0;

    const render = () => {
      // Smooth Damped Parallax Lerp
      mouseOffsetX += (targetMouseOffsetX - mouseOffsetX) * 0.04;
      mouseOffsetY += (targetMouseOffsetY - mouseOffsetY) * 0.04;

      // Pure Obsidian Pitch Black Canvas
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      time += 0.02;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // 2D gentle diagonal drift: Bottom-Left -> Top-Right
        star.x += star.vx;
        star.y += star.vy;

        // Smooth infinite diagonal wrap-around
        if (star.x > width + 10 || star.y < -10) {
          if (Math.random() < 0.5) {
            // Spawn from bottom edge
            star.x = Math.random() * width;
            star.y = height + 5;
          } else {
            // Spawn from left edge
            star.x = -5;
            star.y = Math.random() * height;
          }
        }

        // Calculate parallax position
        const px = star.x + mouseOffsetX * star.parallaxFactor;
        const py = star.y + mouseOffsetY * star.parallaxFactor;

        // Grok-grade sine-wave alpha twinkle
        const twinkle = Math.sin(time * star.twinkleSpeed * 10 + star.twinklePhase) * 0.35 + 0.65;
        const alpha = Math.min(0.85, Math.max(0.12, star.baseAlpha * twinkle));

        // Razor-sharp 1px - 1.5px micro-dot rendering
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(Math.round(px), Math.round(py), star.size, star.size);
      }


      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [count, speed]);


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
