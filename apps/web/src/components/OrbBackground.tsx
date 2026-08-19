"use client";

import React from "react";

export const OrbBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black flex items-center justify-center z-0 pointer-events-none">
      {/* Deep background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] bg-indigo-900/20 blur-[120px] rounded-full" />
      
      {/* The Morphing Iridescent Liquid Glass Orb */}
      <div 
        className="relative w-[300px] h-[300px] md:w-[600px] md:h-[600px] orb-container"
        style={{
          background: "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9), rgba(100, 200, 255, 0.7) 20%, rgba(200, 50, 255, 0.5) 45%, rgba(10, 20, 40, 0.9) 80%)",
          boxShadow: "inset -20px -20px 60px rgba(0, 150, 255, 0.5), inset 20px 20px 60px rgba(255, 0, 200, 0.5), 0 0 60px rgba(255,255,255,0.1)",
        }}
      >
        {/* Inner liquid swirls (chromatic aberration feel) */}
        <div 
          className="absolute inset-0 inner-swirl"
          style={{
            background: "linear-gradient(135deg, rgba(0, 255, 150, 0.4), rgba(255, 100, 0, 0.4))",
            mixBlendMode: "overlay",
          }}
        />
        <div 
          className="absolute inset-0 inner-swirl-2"
          style={{
            background: "radial-gradient(circle at 70% 70%, rgba(255, 255, 0, 0.2), rgba(0, 255, 255, 0.3))",
            mixBlendMode: "color-dodge",
          }}
        />
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .orb-container {
          border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          animation: morph 12s ease-in-out infinite, spin 25s linear infinite;
          backdrop-filter: blur(10px);
        }
        .inner-swirl {
          border-radius: 40% 60% 70% 30% / 50% 60% 40% 50%;
          animation: morph 15s ease-in-out infinite reverse, spin 20s linear infinite reverse;
        }
        .inner-swirl-2 {
          border-radius: 50% 50% 30% 70% / 70% 30% 60% 40%;
          animation: morph 10s ease-in-out infinite, spin 30s linear infinite;
        }

        @keyframes morph {
          0% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          33% { border-radius: 30% 70% 70% 30% / 30% 60% 40% 70%; }
          66% { border-radius: 70% 30% 40% 60% / 70% 40% 60% 30%; }
          100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
};
