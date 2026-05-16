import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NutriTrack | Health Tracker & Nutrition Planner",
  description:
    "Your all-in-one health tracker, nutrition planner, and wellness guide. Track meals, workouts, biometrics, hydration, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50">{children}</body>
    </html>
  );
}
