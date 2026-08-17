"use client";

import React, { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  opacity: number;
  baseOpacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  active: boolean;
}

export const StarfieldBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars();
    };

    window.addEventListener("resize", handleResize);

    const starCount = Math.min(220, Math.floor((width * height) / 4500));
    let stars: Star[] = [];

    // Distinctive star temperatures
    const starColors = [
      "rgba(255, 255, 255,",   // Diamond White
      "rgba(224, 238, 255,",   // Cool Stellar Blue
      "rgba(255, 244, 224,",   // Warm Gold Tint
    ];

    const initStars = () => {
      stars = [];
      for (let i = 0; i < starCount; i++) {
        const opacity = Math.random() * 0.7 + 0.3;
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z: Math.random() * 2 + 0.4, // Depth / speed layer
          size: Math.random() * 1.4 + 0.4,
          opacity,
          baseOpacity: opacity,
          twinkleSpeed: Math.random() * 0.02 + 0.006,
          twinkleOffset: Math.random() * Math.PI * 2,
          color: starColors[Math.floor(Math.random() * starColors.length)],
        });
      }
    };

    initStars();

    // Shooting stars / meteor streaks
    const shootingStars: ShootingStar[] = [];
    let lastShootingStarTime = Date.now();

    const spawnShootingStar = () => {
      shootingStars.push({
        x: Math.random() * width * 0.75 + width * 0.1,
        y: Math.random() * (height * 0.35),
        length: Math.random() * 90 + 60,
        speed: Math.random() * 7 + 8,
        angle: Math.PI / 4 + (Math.random() * 0.15 - 0.075),
        opacity: 1,
        active: true,
      });
    };

    let tick = 0;

    const render = () => {
      tick++;

      // Pure pitch black base
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      // Ultra-subtle deep space atmospheric depth
      const deepGlow = ctx.createRadialGradient(
        width * 0.5,
        height * 0.3,
        20,
        width * 0.5,
        height * 0.35,
        Math.max(width, height) * 0.75
      );
      deepGlow.addColorStop(0, "rgba(12, 16, 30, 0.2)");
      deepGlow.addColorStop(0.5, "rgba(6, 8, 16, 0.08)");
      deepGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = deepGlow;
      ctx.fillRect(0, 0, width, height);

      // Render & update realistic drifting stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Smooth slow upward drift with parallax depth
        star.y -= star.z * 0.16;
        if (star.y < 0) {
          star.y = height;
          star.x = Math.random() * width;
        }

        // Realistic natural twinkle
        const twinkle = Math.sin(tick * star.twinkleSpeed + star.twinkleOffset);
        const currentAlpha = Math.max(0.12, Math.min(1, star.baseOpacity + twinkle * 0.38));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `${star.color} ${currentAlpha})`;
        ctx.fill();

        // Subtle soft halo on brighter foreground stars
        if (star.size > 1.2 && currentAlpha > 0.75) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `${star.color} ${currentAlpha * 0.12})`;
          ctx.fill();
        }
      }

      // Spawn shooting stars periodically
      const now = Date.now();
      if (now - lastShootingStarTime > 4000 && Math.random() < 0.02) {
        spawnShootingStar();
        lastShootingStarTime = now;
      }

      // Render shooting stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        if (!s.active) continue;

        const endX = s.x - Math.cos(s.angle) * s.length;
        const endY = s.y - Math.sin(s.angle) * s.length;

        const streakGrad = ctx.createLinearGradient(s.x, s.y, endX, endY);
        streakGrad.addColorStop(0, `rgba(255, 255, 255, ${s.opacity})`);
        streakGrad.addColorStop(0.2, `rgba(200, 225, 255, ${s.opacity * 0.8})`);
        streakGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.strokeStyle = streakGrad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Advance shooting star
        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        s.opacity -= 0.016;

        if (s.opacity <= 0 || s.x > width + 100 || s.y > height + 100) {
          s.active = false;
          shootingStars.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ background: "#000000" }}
    />
  );
};
