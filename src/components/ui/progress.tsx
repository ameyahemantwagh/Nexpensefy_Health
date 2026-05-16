"use client";
import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  trackClassName?: string;
  color?: string;
}

export function Progress({ value, max = 100, className, trackClassName, color }: ProgressProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={cn("h-2 w-full rounded-full bg-slate-100 overflow-hidden", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-500", trackClassName)}
        style={{ width: `${pct}%`, backgroundColor: color ?? "#10b981" }}
      />
    </div>
  );
}

interface StatBadgeProps {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  className?: string;
}

export function StatBadge({ label, value, unit, color = "#10b981", className }: StatBadgeProps) {
  return (
    <div className={cn("flex flex-col items-center gap-0.5", className)}>
      <span className="text-xl font-bold" style={{ color }}>
        {value}
        {unit && <span className="text-sm font-normal ml-0.5 text-slate-500">{unit}</span>}
      </span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}
