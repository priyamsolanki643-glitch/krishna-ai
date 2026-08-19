"use client";

import React, { useEffect, useRef } from "react";

export const BackgroundVideo = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (videoRef.current) {
        const scrollPosition = window.scrollY;
        const maxScroll = 300; // Distance to reach 30% opacity
        const opacity = Math.max(0.3, 1 - (scrollPosition / maxScroll) * 0.7);
        videoRef.current.style.opacity = opacity.toString();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div 
      className="fixed inset-0 w-screen h-screen overflow-hidden pointer-events-none" 
      style={{ 
        isolation: 'isolate',
        zIndex: 0 
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover transition-opacity duration-300 pointer-events-none"
        style={{ 
          mixBlendMode: 'hard-light',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          filter: 'brightness(0.7) contrast(2)'
        }}
      >
        <source src="/videos/hero-background.mp4" type="video/mp4" />
      </video>
    </div>
  );
};
