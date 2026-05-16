"use client";
import { useState } from "react";
import { useHealthStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Droplets, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const QUICK_ADD_OPTIONS = [150, 250, 330, 500];

export default function HydrationPage() {
  const { water, logWater, profile } = useHealthStore();
  const [custom, setCustom] = useState("");
  const todayStr = new Date().toISOString().split("T")[0];
  const todayEntry = water.find((w) => w.date === todayStr);
  const todayMl = todayEntry?.totalMl ?? 0;
  const pct = Math.min(100, Math.round((todayMl / profile.targetWaterMl) * 100));

  const chartData = [...water]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7)
    .map((w) => ({ date: w.date.slice(5), ml: w.totalMl, target: profile.targetWaterMl }));

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Hydration Tracker</h1>
        <p className="text-slate-500 text-sm mt-1">Stay hydrated — track your daily water intake</p>
      </div>

      {/* Main gauge */}
      <Card>
        <CardContent className="pt-8 pb-8 flex flex-col items-center gap-6">
          {/* Water fill visual */}
          <div className="relative w-40 h-40">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e0f2fe" strokeWidth="3.5" />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="#3b82f6" strokeWidth="3.5"
                strokeDasharray={`${pct}, 100`}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
              <Droplets className="w-6 h-6 text-blue-500" />
              <span className="text-2xl font-bold text-slate-800">{(todayMl / 1000).toFixed(1)}L</span>
              <span className="text-xs text-slate-400">of {(profile.targetWaterMl / 1000).toFixed(1)}L goal</span>
            </div>
          </div>

          <Progress value={todayMl} max={profile.targetWaterMl} color="#3b82f6" className="w-full max-w-sm h-3" />

          <p className={cn("text-sm font-medium", pct >= 100 ? "text-emerald-600" : "text-slate-500")}>
            {pct >= 100 ? "🎉 Daily goal reached!" : `${profile.targetWaterMl - todayMl} ml remaining`}
          </p>

          {/* Quick add */}
          <div className="flex gap-3 flex-wrap justify-center">
            {QUICK_ADD_OPTIONS.map((ml) => (
              <button
                key={ml}
                onClick={() => logWater(todayStr, ml)}
                className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm transition-all"
              >
                +{ml}ml
              </button>
            ))}
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Custom ml"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                className="w-28 h-10 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <Button
                onClick={() => { if (custom) { logWater(todayStr, parseInt(custom)); setCustom(""); } }}
                variant="outline"
                size="icon"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Today's log */}
          {todayEntry && todayEntry.logs.length > 0 && (
            <div className="w-full max-w-sm space-y-1.5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Today's Log</p>
              {[...todayEntry.logs].reverse().map((log, i) => (
                <div key={i} className="flex justify-between text-sm bg-slate-50 px-3 py-2 rounded-lg">
                  <span className="text-slate-600">{log.time}</span>
                  <span className="font-medium text-blue-600">+{log.ml} ml</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 7-day chart */}
      <Card>
        <CardHeader>
          <CardTitle>7-Day Trend</CardTitle>
          <CardDescription>Daily water intake vs. goal</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.08)" }}
                  formatter={(v) => [`${v} ml`]}
                />
                <Area type="monotone" dataKey="target" stroke="#e2e8f0" strokeDasharray="4 4" fill="none" name="Goal" />
                <Area type="monotone" dataKey="ml" stroke="#3b82f6" fill="url(#waterGrad)" strokeWidth={2} name="Intake" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-10 text-slate-400 text-sm">Start logging water to see your trend.</div>
          )}
        </CardContent>
      </Card>

      {/* Hydration tips */}
      <Card className="bg-blue-50/40 border-blue-100">
        <CardHeader>
          <CardTitle className="text-blue-800">Hydration Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {[
            "Drink a glass of water first thing in the morning to kickstart digestion.",
            "Set hourly reminders if you struggle to hit your goal consistently.",
            "Increase intake by 500ml on workout days to compensate for sweat loss.",
            "Herbal teas and water-rich foods (cucumbers, watermelon) count toward hydration.",
            "Dark yellow urine is a sign of dehydration — aim for pale yellow.",
          ].map((tip, i) => (
            <p key={i} className="flex gap-2 text-sm text-blue-900">
              <Droplets className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              {tip}
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
