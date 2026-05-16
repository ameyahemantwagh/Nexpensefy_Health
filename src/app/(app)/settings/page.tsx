"use client";
import { useState } from "react";
import { useHealthStore, Goal, ActivityLevel, Diet } from "@/lib/store";
import { calcTDEE, calcBMI, bmiCategory, ACTIVITY_MULTIPLIERS } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { User, Target, Utensils, Activity, Save, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const GOAL_OPTIONS: { value: Goal; label: string; desc: string }[] = [
  { value: "lose_weight", label: "Lose Weight", desc: "Create a calorie deficit to shed body fat" },
  { value: "gain_muscle", label: "Build Muscle", desc: "Calorie surplus + strength training" },
  { value: "maintain", label: "Maintain Weight", desc: "Balance intake with expenditure" },
  { value: "improve_health", label: "Improve Health", desc: "Focus on overall wellness" },
];

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: "sedentary", label: "Sedentary", desc: "Little to no exercise" },
  { value: "light", label: "Lightly Active", desc: "1–3 days/week" },
  { value: "moderate", label: "Moderately Active", desc: "3–5 days/week" },
  { value: "active", label: "Very Active", desc: "6–7 days/week" },
  { value: "veryActive", label: "Extra Active", desc: "2x/day or physical job" },
];

const DIET_OPTIONS: { value: Diet; label: string }[] = [
  { value: "none", label: "No restriction" },
  { value: "vegan", label: "Vegan" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "keto", label: "Keto" },
  { value: "paleo", label: "Paleo" },
  { value: "gluten_free", label: "Gluten-Free" },
  { value: "diabetic_friendly", label: "Diabetic-Friendly" },
];

export default function SettingsPage() {
  const { profile, updateProfile } = useHealthStore();
  const [form, setForm] = useState({ ...profile });
  const [saved, setSaved] = useState(false);

  const calc = () => {
    const tdee = calcTDEE(
      form.weightKg, form.heightCm, form.age, form.sex,
      ACTIVITY_MULTIPLIERS[form.activityLevel] ?? 1.55
    );
    const targetCalories =
      form.goal === "lose_weight" ? tdee - 500 :
      form.goal === "gain_muscle" ? tdee + 300 : tdee;
    const targetProtein = Math.round(form.weightKg * (form.goal === "gain_muscle" ? 2.0 : 1.6));
    const targetCarbs = Math.round(((targetCalories * 0.45) / 4));
    const targetFat = Math.round(((targetCalories * 0.25) / 9));
    return { targetCalories, targetProtein, targetCarbs, targetFat };
  };

  const bmi = calcBMI(form.weightKg, form.heightCm);
  const bmiInfo = bmiCategory(bmi);
  const { targetCalories, targetProtein, targetCarbs, targetFat } = calc();

  const handleSave = () => {
    updateProfile({ ...form, targetCalories, targetProtein, targetCarbs, targetFat, onboarded: true });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings & Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Update your personal details and health goals</p>
      </div>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="w-4 h-4 text-emerald-500" /> Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <Field label="Full Name" type="text" placeholder="John Doe" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Email" type="email" placeholder="john@example.com" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="Age" type="number" placeholder="25" value={form.age.toString()} onChange={(v) => setForm({ ...form, age: parseInt(v) || 25 })} />
          <div className="space-y-1.5">
            <Label>Biological Sex</Label>
            <select
              className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={form.sex}
              onChange={(e) => setForm({ ...form, sex: e.target.value as "male" | "female" })}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <Field label="Height (cm)" type="number" placeholder="170" value={form.heightCm.toString()} onChange={(v) => setForm({ ...form, heightCm: parseFloat(v) || 170 })} />
          <div className="space-y-1.5">
            <Label>Weight (kg)</Label>
            <Input type="number" placeholder="70" value={form.weightKg.toString()} onChange={(e) => setForm({ ...form, weightKg: parseFloat(e.target.value) || 70 })} />
            <p className="text-xs text-slate-400">
              BMI: <strong style={{ color: bmiInfo.color }}>{bmi} — {bmiInfo.label}</strong>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Goal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Target className="w-4 h-4 text-orange-500" /> Health Goal</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3">
          {GOAL_OPTIONS.map((g) => (
            <button
              key={g.value}
              onClick={() => setForm({ ...form, goal: g.value })}
              className={cn(
                "p-4 rounded-xl border text-left transition-all",
                form.goal === g.value ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-slate-300 bg-white"
              )}
            >
              <p className={cn("text-sm font-semibold", form.goal === g.value ? "text-emerald-700" : "text-slate-800")}>{g.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{g.desc}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Activity Level */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500" /> Activity Level</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {ACTIVITY_OPTIONS.map((a) => (
            <button
              key={a.value}
              onClick={() => setForm({ ...form, activityLevel: a.value })}
              className={cn(
                "w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all",
                form.activityLevel === a.value ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-slate-300"
              )}
            >
              <div>
                <p className={cn("text-sm font-semibold", form.activityLevel === a.value ? "text-blue-700" : "text-slate-800")}>{a.label}</p>
                <p className="text-xs text-slate-500">{a.desc}</p>
              </div>
              {form.activityLevel === a.value && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Dietary Preference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Utensils className="w-4 h-4 text-amber-500" /> Dietary Preference</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DIET_OPTIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => setForm({ ...form, diet: d.value })}
              className={cn(
                "p-3 rounded-xl border text-sm font-medium transition-all",
                form.diet === d.value ? "border-amber-400 bg-amber-50 text-amber-700" : "border-slate-200 hover:border-slate-300 text-slate-700"
              )}
            >
              {d.label}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Custom targets (auto-calculated preview) */}
      <Card>
        <CardHeader>
          <CardTitle>Calculated Daily Targets</CardTitle>
          <CardDescription>Auto-calculated from your profile. Saved when you click Save.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <TargetBox label="Calories" value={targetCalories} unit="kcal" color="text-orange-600" />
          <TargetBox label="Protein" value={targetProtein} unit="g" color="text-blue-600" />
          <TargetBox label="Carbs" value={targetCarbs} unit="g" color="text-amber-600" />
          <TargetBox label="Fat" value={targetFat} unit="g" color="text-red-500" />
        </CardContent>
      </Card>

      {/* Water target */}
      <Card>
        <CardHeader>
          <CardTitle>Hydration Target</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Input
            type="number"
            value={form.targetWaterMl}
            onChange={(e) => setForm({ ...form, targetWaterMl: parseInt(e.target.value) || 2500 })}
            className="w-36"
          />
          <span className="text-sm text-slate-500">ml per day (recommended: 2000–3000ml)</span>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" className={cn(saved && "bg-emerald-600")}>
          {saved ? (
            <><CheckCircle2 className="w-4 h-4" /> Saved!</>
          ) : (
            <><Save className="w-4 h-4" /> Save Profile</>
          )}
        </Button>
      </div>
    </div>
  );
}

function Field({
  label, type, placeholder, value, onChange,
}: {
  label: string; type: string; placeholder?: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function TargetBox({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div className="text-center p-4 bg-slate-50 rounded-xl">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{unit}</p>
      <p className="text-xs font-medium text-slate-600 mt-0.5">{label}</p>
    </div>
  );
}
