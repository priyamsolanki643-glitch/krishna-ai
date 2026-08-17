"use client";

import React, { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  baseOpacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
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

    const starCount = Math.min(240, Math.floor((width * height) / 4000));
    let stars: Star[] = [];

    const initStars = () => {
      stars = [];
      for (let i = 0; i < starCount; i++) {
        const opacity = Math.random() * 0.75 + 0.25;
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z: Math.random() * 1.8 + 0.3, // depth layer
          size: Math.random() * 1.2 + 0.35, // crisp micro stars
          baseOpacity: opacity,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          twinkleOffset: Math.random() * Math.PI * 2,
        });
      }
    };

    initStars();

    const shootingStars: ShootingStar[] = [];
    let lastShootingStarTime = Date.now();

    const spawnShootingStar = () => {
      shootingStars.push({
        x: Math.random() * width * 0.8 + width * 0.1,
        y: Math.random() * (height * 0.3),
        length: Math.random() * 80 + 50,
        speed: Math.random() * 6 + 8,
        angle: Math.PI / 4 + (Math.random() * 0.1 - 0.05),
        opacity: 0.9,
        active: true,
      });
    };

    let tick = 0;

    const render = () => {
      tick++;

      // True OLED Pure Vantablack Void (No haze, pure #000000)
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      // Render crisp micro diamond stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Smooth slow drift
        star.y -= star.z * 0.14;
        if (star.y < 0) {
          star.y = height;
          star.x = Math.random() * width;
        }

        // Clean natural twinkle
        const twinkle = Math.sin(tick * star.twinkleSpeed + star.twinkleOffset);
        const currentAlpha = Math.max(0.1, Math.min(1, star.baseOpacity + twinkle * 0.35));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        ctx.fill();
      }

      // Shooting stars
      const now = Date.now();
      if (now - lastShootingStarTime > 4500 && Math.random() < 0.02) {
        spawnShootingStar();
        lastShootingStarTime = now;
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        if (!s.active) continue;

        const endX = s.x - Math.cos(s.angle) * s.length;
        const endY = s.y - Math.sin(s.angle) * s.length;

        const streakGrad = ctx.createLinearGradient(s.x, s.y, endX, endY);
        streakGrad.addColorStop(0, `rgba(255, 255, 255, ${s.opacity})`);
        streakGrad.addColorStop(0.3, `rgba(255, 255, 255, ${s.opacity * 0.6})`);
        streakGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.strokeStyle = streakGrad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        s.opacity -= 0.018;

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
