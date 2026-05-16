"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Utensils,
  Dumbbell,
  Activity,
  BookOpen,
  Settings,
  Droplets,
  Target,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/nutrition", icon: Utensils, label: "Nutrition" },
  { href: "/workout", icon: Dumbbell, label: "Workout" },
  { href: "/biometrics", icon: Activity, label: "Biometrics" },
  { href: "/hydration", icon: Droplets, label: "Hydration" },
  { href: "/goals", icon: Target, label: "Goals" },
  { href: "/guides", icon: BookOpen, label: "Guides" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-slate-200 px-4 py-6 shrink-0">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5 mb-8 px-2">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
          <Heart className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-bold text-slate-800">NutriTrack</span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", active ? "text-emerald-600" : "text-slate-400")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-400 px-2">NutriTrack Health v1.0</p>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const mobileItems = NAV_ITEMS.slice(0, 5);
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 px-2 py-2 flex justify-around">
      {mobileItems.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
              active ? "text-emerald-600" : "text-slate-400"
            )}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
