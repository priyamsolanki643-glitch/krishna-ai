"use client";

import React from "react";

export const VexBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black z-0 pointer-events-none">
      
      {/* Ultra-soft ambient center glow (No more noisy SVG static) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[60vh] bg-white/[0.015] blur-[100px] rounded-[100%]" />

      {/* TOP RIGHT HUD */}
      <div className="absolute top-0 right-0 w-full h-full pointer-events-none">
        {/* Horizontal line */}
        <div className="absolute top-[12%] right-[6%] w-[35%] max-w-[400px] h-[1px] bg-gradient-to-l from-white/20 to-transparent" />
        
        {/* Intense Flare on top line */}
        <div className="absolute top-[12%] right-[15%] w-[120px] h-[1px] bg-white shadow-[0_0_20px_4px_rgba(255,255,255,0.6)]" />
        <div className="absolute top-[12%] right-[15%] w-[120px] h-[2px] bg-white blur-[2px]" />
        
        {/* Diagonal cut connecting to vertical */}
        <div className="absolute top-[12%] right-[6%] w-[30px] h-[1px] bg-white/20 origin-top-right rotate-45" />
        {/* Vertical drop */}
        <div className="absolute top-[calc(12%+21px)] right-[calc(6%-21px)] w-[1px] h-[120px] bg-gradient-to-b from-white/20 to-transparent" />
      </div>

      {/* BOTTOM LEFT HUD */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {/* Vertical line */}
        <div className="absolute bottom-[12%] left-[6%] w-[1px] h-[35%] max-h-[350px] bg-gradient-to-t from-white/20 to-transparent" />
        
        {/* Intense Flare on left line */}
        <div className="absolute bottom-[22%] left-[6%] w-[1px] h-[120px] bg-white shadow-[0_0_20px_4px_rgba(255,255,255,0.6)]" />
        <div className="absolute bottom-[22%] left-[6%] w-[2px] h-[120px] bg-white blur-[2px]" />
        
        {/* Diagonal cut connecting to horizontal */}
        <div className="absolute bottom-[12%] left-[6%] w-[1px] h-[30px] bg-white/20 origin-bottom-left rotate-45" />
        {/* Horizontal run */}
        <div className="absolute bottom-[calc(12%-21px)] left-[calc(6%+21px)] w-[120px] h-[1px] bg-gradient-to-r from-white/20 to-transparent" />
      </div>

    </div>
  );
};
