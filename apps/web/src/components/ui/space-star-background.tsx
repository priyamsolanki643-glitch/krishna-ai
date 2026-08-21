"use client";

import React, { useEffect, useRef } from "react";

interface SpaceStarBackgroundProps {
  className?: string;
  starCount?: number;
  speed?: number;
}

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

export function SpaceStarBackground({
  className = "",
  starCount = 180,
  speed = 0.5,
}: SpaceStarBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Initialize stars with 3D space depth
    const stars: Star[] = Array.from({ length: starCount }, () => ({
      x: (Math.random() - 0.5) * width * 1.5,
      y: (Math.random() - 0.5) * height * 1.5,
      z: Math.random() * width,
      size: Math.random() * 1.6 + 0.4,
      baseAlpha: Math.random() * 0.7 + 0.3,
      twinkleSpeed: Math.random() * 0.03 + 0.01,
      twinklePhase: Math.random() * Math.PI * 2,
    }));

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      time += 0.04;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Move star forward slowly in space
        star.z -= speed;
        if (star.z <= 0) {
          star.z = width;
          star.x = (Math.random() - 0.5) * width * 1.5;
          star.y = (Math.random() - 0.5) * height * 1.5;
        }

        // Project 3D coordinate to 2D
        const k = 250 / star.z;
        const px = star.x * k + cx;
        const py = star.y * k + cy;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const depthAlpha = Math.min(1, Math.max(0.1, (1 - star.z / width) * 1.2));
          const twinkle = Math.sin(time * star.twinkleSpeed * 10 + star.twinklePhase) * 0.25 + 0.75;
          const alpha = star.baseAlpha * depthAlpha * twinkle;
          const renderedSize = Math.max(0.5, star.size * k * 0.8);

          ctx.beginPath();
          ctx.arc(px, py, renderedSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.shadowBlur = renderedSize > 1.2 ? 6 : 0;
          ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [starCount, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 w-full h-full opacity-70 ${className}`}
    />
  );
}
