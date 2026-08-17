import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Council — Multi-Agent Cognitive Architecture",
  description: "Adversarial Multi-Agent Cognitive AI System engineered to make hallucination structurally impossible.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#07090e] text-[#f1f5f9] selection:bg-amber-500/20 selection:text-amber-200">
        {children}
      </body>
    </html>
  );
}
