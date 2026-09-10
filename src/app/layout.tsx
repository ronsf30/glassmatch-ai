import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AmbientGlow } from "@/components/layout/AmbientGlow";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GlassMatch AI — Caribbean Sea Glass Job Radar",
  description:
    "Asistente inteligente de match y seguimiento de oportunidades laborales con enfoque Human-in-the-Loop y diseño inspirado en el Mar del Caribe.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F0FDFA] text-slate-900 selection:bg-teal-500/20 selection:text-teal-900">
        <AmbientGlow />
        {children}
      </body>
    </html>
  );
}
