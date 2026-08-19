"use client";

import React from "react";
import { HeroOnboarding } from "../components/HeroOnboarding";
import { BackgroundVideo } from "../components/BackgroundVideo";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-black overflow-hidden flex flex-col items-center justify-center">
      <BackgroundVideo />
      <HeroOnboarding />
    </main>
  );
}

