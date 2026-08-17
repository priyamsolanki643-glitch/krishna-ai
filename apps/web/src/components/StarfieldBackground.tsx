"use client";

import React, { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  color: string;
  alpha: number;
  pulseSpeed: number;
  pulseOffset: number;
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

    // Track touch / mouse for magnetic gravitational interactive warp
    const touch = {
      x: width * 0.5,
      y: height * 0.5,
      active: false,
      radius: 120,
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initNodes();
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      touch.active = true;
      if ("touches" in e && e.touches.length > 0) {
        touch.x = e.touches[0].clientX;
        touch.y = e.touches[0].clientY;
      } else if ("clientX" in e) {
        touch.x = e.clientX;
        touch.y = e.clientY;
      }
    };

    const handlePointerLeave = () => {
      touch.active = false;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("touchmove", handlePointerMove);
    window.addEventListener("mouseleave", handlePointerLeave);
    window.addEventListener("touchend", handlePointerLeave);

    const nodeCount = Math.min(85, Math.floor((width * height) / 10000));
    let nodes: Node[] = [];

    // Distinctive Council palette: Gold ember, Celestial cyan, Pure white photon
    const colors = [
      "rgba(245, 158, 11,",   // Amber Gold
      "rgba(251, 191, 36,",   // Light Gold
      "rgba(56, 189, 248,",   // Celestial Sky
      "rgba(255, 255, 255,",  // Pure White
    ];

    const initNodes = () => {
      nodes = [];
      for (let i = 0; i < nodeCount; i++) {
        const baseRadius = Math.random() * 1.8 + 0.8;
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          radius: baseRadius,
          baseRadius,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: Math.random() * 0.6 + 0.3,
          pulseSpeed: Math.random() * 0.02 + 0.008,
          pulseOffset: Math.random() * Math.PI * 2,
        });
      }
    };

    initNodes();

    let tick = 0;

    const render = () => {
      tick++;

      // Pure pitch black base
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      // Deep Living Atmospheric Auroral Breathing Glow
      const breathPhase = Math.sin(tick * 0.008);
      const auraGradient = ctx.createRadialGradient(
        width * 0.5 + Math.sin(tick * 0.005) * 80,
        height * 0.4 + Math.cos(tick * 0.005) * 60,
        20,
        width * 0.5,
        height * 0.45,
        Math.max(width, height) * 0.65
      );
      // Soft amber-violet subtle cognitive nebula
      auraGradient.addColorStop(0, `rgba(245, 158, 11, ${0.045 + breathPhase * 0.015})`);
      auraGradient.addColorStop(0.4, `rgba(30, 41, 75, ${0.06 + breathPhase * 0.02})`);
      auraGradient.addColorStop(0.8, "rgba(8, 10, 18, 0.04)");
      auraGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = auraGradient;
      ctx.fillRect(0, 0, width, height);

      // Faint central celestial orbital ring (The Council Ring)
      const centerX = width * 0.5;
      const centerY = height * 0.42;
      const ringRadius = Math.min(width, height) * 0.34;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(tick * 0.0015);

      // Outer delicate dashed ring
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(245, 158, 11, 0.06)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 14]);
      ctx.stroke();

      // Counter-rotating inner ring
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius * 0.72, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.04)";
      ctx.setLineDash([1, 18]);
      ctx.stroke();

      ctx.restore();

      // Connect nearby nodes with delicate synaptic constellation threads
      const maxDistance = Math.min(width * 0.28, 130);

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const lineAlpha = (1 - dist / maxDistance) * 0.16;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(215, 225, 255, ${lineAlpha})`;
            ctx.lineWidth = 0.65;
            ctx.stroke();
          }
        }
      }

      // Update & Draw Nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // Move node
        node.x += node.vx;
        node.y += node.vy;

        // Bounce from walls softly
        if (node.x < 0) node.x = width;
        if (node.x > width) node.x = 0;
        if (node.y < 0) node.y = height;
        if (node.y > height) node.y = 0;

        // Interactive touch/cursor repulsion & magnetic pull
        if (touch.active) {
          const tdx = touch.x - node.x;
          const tdy = touch.y - node.y;
          const tdist = Math.sqrt(tdx * tdx + tdy * tdy);

          if (tdist < touch.radius) {
            const force = (1 - tdist / touch.radius) * 1.5;
            node.x -= (tdx / tdist) * force;
            node.y -= (tdy / tdist) * force;
          }
        }

        // Pulse calculation
        const pulse = Math.sin(tick * node.pulseSpeed + node.pulseOffset);
        const dynamicAlpha = Math.max(0.15, Math.min(0.9, node.alpha + pulse * 0.25));
        const dynamicRadius = node.baseRadius * (1 + pulse * 0.2);

        // Core Photon Dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, dynamicRadius, 0, Math.PI * 2);
        ctx.fillStyle = `${node.color} ${dynamicAlpha})`;
        ctx.fill();

        // Subtle soft outer glow for gold/cyan nodes
        if (node.baseRadius > 1.4) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, dynamicRadius * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = `${node.color} ${dynamicAlpha * 0.15})`;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("mouseleave", handlePointerLeave);
      window.removeEventListener("touchend", handlePointerLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-auto z-0"
      style={{ background: "#000000" }}
    />
  );
};
