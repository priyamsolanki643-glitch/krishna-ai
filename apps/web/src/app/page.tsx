"use client";

import React from "react";
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
      <HeroOnboarding />
    </div>
  );
}
