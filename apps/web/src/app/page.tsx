"use client";

import React from "react";
import { HeroOnboarding } from "../components/HeroOnboarding";

export default function Home() {
  return (
    <main
      className="relative flex min-h-svh w-full items-center justify-center overflow-hidden bg-black"
      style={{
        backgroundColor: "#000000",
        minHeight: "100svh",
      }}
    >
      <div className="relative z-10 flex w-full items-center justify-center">
        <HeroOnboarding />
      </div>
    </main>
  );
}
