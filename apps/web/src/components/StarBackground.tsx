"use client";

import React, { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  z: number;
  pz: number;
}

const STAR_COUNT = 1500;
const FL = 300;

function randomStar(): Star {
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
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
      starsRef.current = Array.from({ length: STAR_COUNT }, randomStar);
    };

    resize();
    starsRef.current = Array.from({ length: STAR_COUNT }, randomStar);
    window.addEventListener("resize", resize);

    const render = () => {
      const speed = speedRef.current;
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      for (let i = 0; i < starsRef.current.length; i++) {
        const s = starsRef.current[i];
        s.pz = s.z;
        s.z -= speed;

        if (s.z <= 0.001) {
          starsRef.current[i] = randomStar();
          starsRef.current[i].z = 1;
          starsRef.current[i].pz = 1;
          continue;
        }

        const sx = (s.x / s.z) * FL + cx;
        const sy = (s.y / s.z) * FL + cy;
        const alpha = Math.min(1, (1 - s.z) * 1.4);
        const size = Math.max(0.4, (1 - s.z) * 2.2);

        ctx.beginPath();
        ctx.arc(sx, sy, size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
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
