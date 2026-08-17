import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Council — Multi-Agent Cognitive Architecture",
  description:
    "Adversarial Multi-Agent Cognitive AI System engineered to make hallucination structurally impossible.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
