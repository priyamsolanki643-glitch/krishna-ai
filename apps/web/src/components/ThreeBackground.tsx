"use client";

import React, { useEffect, useRef } from "react";

interface ThreeBackgroundProps {
  isMobile: boolean;
  totalSections: number;
}

export const ThreeBackground: React.FC<ThreeBackgroundProps> = ({
  isMobile,
  totalSections,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let THREE: typeof import("three");
    let rafId: number;

    const init = async () => {
      THREE = await import("three");
      const canvas = canvasRef.current;
      if (!canvas) return;

      // ── Scene ──────────────────────────────────────────────────
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x000000, 0.00018);

      const camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        6000
      );
      camera.position.z = 1000;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 1);

      // ── Stars ───────────────────────────────────────────────────
      const STAR_COUNT = 2500;
      const positions = new Float32Array(STAR_COUNT * 3);
      for (let i = 0; i < STAR_COUNT * 3; i += 3) {
        positions[i]     = (Math.random() - 0.5) * 2400;
        positions[i + 1] = (Math.random() - 0.5) * 2400;
        positions[i + 2] = Math.random() * -5000;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

      const mat = new THREE.PointsMaterial({
        size: 2.0,
        color: 0xffffff,
        transparent: true,
        opacity: 0.85,
        sizeAttenuation: true,
      });

      const stars = new THREE.Points(geo, mat);
      scene.add(stars);

      // ── Camera state ────────────────────────────────────────────
      const Z_START = 1000;
      const Z_TRAVEL = (totalSections - 1) * 1200; // 1200 units per section
      let currentZ = Z_START;
      let targetZ = Z_START;
      let scrollVelocity = 0;

      // ── Desktop scroll handler ───────────────────────────────────
      const onScroll = () => {
        if (isMobile) return;
        const maxScroll =
          document.documentElement.scrollHeight - window.innerHeight;
        if (maxScroll <= 0) return;
        const progress = Math.min(window.scrollY / maxScroll, 1);
        targetZ = Z_START - progress * Z_TRAVEL;

        const dy = Math.abs(window.scrollY - (window as any)._lastSY || 0);
        scrollVelocity = Math.min(dy / 40, 1);
        (window as any)._lastSY = window.scrollY;
      };
      window.addEventListener("scroll", onScroll, { passive: true });

      // ── Mobile: snap section → camera position ───────────────────
      const snapEl = document.querySelector<HTMLElement>(".snap-container");
      const onSnapScroll = () => {
        if (!isMobile || !snapEl) return;
        const section = Math.round(snapEl.scrollTop / window.innerHeight);
        targetZ = Z_START - section * 1200;
        scrollVelocity = 0.8;
        setTimeout(() => { scrollVelocity = 0; }, 700);
      };
      if (snapEl) snapEl.addEventListener("scroll", onSnapScroll, { passive: true });

      // ── Touch velocity for warp burst ────────────────────────────
      let touchY = 0;
      const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0].clientY; };
      const onTouchMove = (e: TouchEvent) => {
        scrollVelocity = Math.min(Math.abs(touchY - e.touches[0].clientY) / 80, 1);
      };
      const onTouchEnd = () => { setTimeout(() => { scrollVelocity = 0; }, 700); };
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      window.addEventListener("touchend", onTouchEnd);

      // ── Render loop ───────────────────────────────────────────────
      const animate = () => {
        rafId = requestAnimationFrame(animate);

        // Smooth camera dolly
        currentZ += (targetZ - currentZ) * 0.08;
        camera.position.z = currentZ;

        // Warp effect: size burst at high velocity
        mat.size = 2.0 + scrollVelocity * 5;
        mat.opacity = 0.85 + scrollVelocity * 0.15;
        scrollVelocity *= 0.92;

        // Slow ambient rotation
        stars.rotation.z += 0.0003;

        renderer.render(scene, camera);
      };
      animate();

      // ── Resize ────────────────────────────────────────────────────
      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener("resize", onResize);

      // Store cleanup refs on canvas element
      (canvas as any)._cleanup = () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);
        if (snapEl) snapEl.removeEventListener("scroll", onSnapScroll);
        renderer.dispose();
        geo.dispose();
        mat.dispose();
      };
    };

    init();

    return () => {
      const canvas = canvasRef.current;
      if (canvas && (canvas as any)._cleanup) {
        (canvas as any)._cleanup();
      }
      if (rafId!) cancelAnimationFrame(rafId);
    };
  }, [isMobile, totalSections]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
        display: "block",
      }}
      aria-hidden="true"
    />
  );
};
