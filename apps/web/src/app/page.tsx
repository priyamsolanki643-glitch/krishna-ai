"use client";

import React from "react";
import { MuxBackground } from "../components/MuxBackground";
import { HeroOnboarding } from "../components/HeroOnboarding";

export default function Home() {
  return (
    <main
      style={{
        background: "#000000",
        minHeight: "100svh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <MuxBackground />
      <div style={{ position: "relative", zIndex: 10, width: "100%" }}>
        <HeroOnboarding />
      </div>
    </main>
  );
}
