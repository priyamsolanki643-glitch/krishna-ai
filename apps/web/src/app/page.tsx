"use client";

import React from "react";
import { StarBackground } from "../components/StarBackground";
import { HeroOnboarding } from "../components/HeroOnboarding";

export default function Home() {
  return (
    <div
      style={{
        background: "#000",
        minHeight: "100svh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <StarBackground />
      <div style={{ position: "relative", zIndex: 10 }}>
        <HeroOnboarding />
      </div>
    </div>
  );
}
