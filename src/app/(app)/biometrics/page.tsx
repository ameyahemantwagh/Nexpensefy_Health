"use client";
import { useState } from "react";
import { useHealthStore, BiometricEntry } from "@/lib/store";
import { calcBMI, bmiCategory } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Plus, Activity, Heart, Thermometer, Moon, Smile } from "lucide-react";

export default function BiometricsPage() {
  const { biometrics, addBiometric, profile } = useHealthStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    weightKg: "",
    bodyFatPct: "",
    systolic: "",
    diastolic: "",
    restingHR: "",
    bloodGlucose: "",
    mood: "",
    energyLevel: "",
    sleepHours: "",
  });

  const handleSubmit = () => {
    if (!form.date || !form.weightKg) return;
    const wt = parseFloat(form.weightKg);
    const entry: BiometricEntry = {
      date: form.date,
      weightKg: wt,
      bmi: calcBMI(wt, profile.heightCm),
      bodyFatPct: form.bodyFatPct ? parseFloat(form.bodyFatPct) : undefined,
      systolic: form.systolic ? parseInt(form.systolic) : undefined,
      diastolic: form.diastolic ? parseInt(form.diastolic) : undefined,
      restingHR: form.restingHR ? parseInt(form.restingHR) : undefined,
      bloodGlucose: form.bloodGlucose ? parseFloat(form.bloodGlucose) : undefined,
      mood: form.mood ? parseInt(form.mood) : undefined,
      energyLevel: form.energyLevel ? parseInt(form.energyLevel) : undefined,
      sleepHours: form.sleepHours ? parseFloat(form.sleepHours) : undefined,
    };
    addBiometric(entry);
    setShowForm(false);
    setForm({ date: new Date().toISOString().split("T")[0], weightKg: "", bodyFatPct: "", systolic: "", diastolic: "", restingHR: "", bloodGlucose: "", mood: "", energyLevel: "", sleepHours: "" });
  };

  const sortedBio = [...biometrics].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sortedBio[sortedBio.length - 1];
  const bmi = latest ? calcBMI(latest.weightKg, profile.heightCm) : 0;
  const bmiInfo = bmiCategory(bmi);

  const chartData = sortedBio.slice(-14).map((b) => ({
    date: b.date.slice(5),
    Weight: b.weightKg,
    BMI: b.bmi?.toFixed(1),
    Sleep: b.sleepHours,
    Mood: b.mood,
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Biometrics</h1>
          <p className="text-slate-500 text-sm mt-1">Track your body measurements and vitals over time</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> Log Entry
        </Button>
      </div>

      {/* Log form */}
      {showForm && (
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardHeader>
            <CardTitle>New Biometric Entry</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
            <Field label="Weight (kg) *" type="number" placeholder="70.5" value={form.weightKg} onChange={(v) => setForm({ ...form, weightKg: v })} />
            <Field label="Body Fat %" type="number" placeholder="18.5" value={form.bodyFatPct} onChange={(v) => setForm({ ...form, bodyFatPct: v })} />
            <Field label="Systolic BP (mmHg)" type="number" placeholder="120" value={form.systolic} onChange={(v) => setForm({ ...form, systolic: v })} />
            <Field label="Diastolic BP (mmHg)" type="number" placeholder="80" value={form.diastolic} onChange={(v) => setForm({ ...form, diastolic: v })} />
            <Field label="Resting HR (bpm)" type="number" placeholder="65" value={form.restingHR} onChange={(v) => setForm({ ...form, restingHR: v })} />
            <Field label="Blood Glucose (mg/dL)" type="number" placeholder="95" value={form.bloodGlucose} onChange={(v) => setForm({ ...form, bloodGlucose: v })} />
            <Field label="Mood (1–10)" type="number" placeholder="8" value={form.mood} onChange={(v) => setForm({ ...form, mood: v })} />
            <Field label="Energy Level (1–10)" type="number" placeholder="7" value={form.energyLevel} onChange={(v) => setForm({ ...form, energyLevel: v })} />
            <Field label="Sleep Hours" type="number" placeholder="7.5" value={form.sleepHours} onChange={(v) => setForm({ ...form, sleepHours: v })} />
            <div className="sm:col-span-2 lg:col-span-3 flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!form.weightKg}>Save Entry</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary cards */}
      {latest && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Activity className="w-5 h-5 text-emerald-500" />} label="Current Weight" value={`${latest.weightKg} kg`} bg="bg-emerald-50" />
          <StatCard
            icon={<Thermometer className="w-5 h-5 text-blue-500" />}
            label="BMI"
            value={`${bmi}`}
            sub={bmiInfo.label}
            subColor={bmiInfo.color}
            bg="bg-blue-50"
          />
          <StatCard
            icon={<Heart className="w-5 h-5 text-red-500" />}
            label="Blood Pressure"
            value={latest.systolic && latest.diastolic ? `${latest.systolic}/${latest.diastolic}` : "—"}
            sub="mmHg"
            bg="bg-red-50"
          />
          <StatCard
            icon={<Moon className="w-5 h-5 text-indigo-500" />}
            label="Last Sleep"
            value={latest.sleepHours ? `${latest.sleepHours}h` : "—"}
            bg="bg-indigo-50"
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Weight & BMI</CardTitle>
            <CardDescription>Last 14 entries</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.08)" }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="Weight" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="BMI" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sleep & Mood</CardTitle>
            <CardDescription>Last 14 entries</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.08)" }} />
                <Legend />
                <Line type="monotone" dataKey="Sleep" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Mood" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* History table */}
      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>{biometrics.length} entries logged</CardDescription>
        </CardHeader>
        <CardContent>
          {biometrics.length === 0 ? (
            <div className="text-center py-10 text-slate-400">No entries yet. Log your first measurement above.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Date", "Weight", "BMI", "BP", "HR", "Glucose", "Sleep", "Mood", "Energy"].map((h) => (
                      <th key={h} className="pb-3 text-left text-xs font-semibold text-slate-400 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...sortedBio].reverse().map((b, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="py-2.5 pr-4 text-slate-600 font-medium">{b.date}</td>
                      <td className="pr-4 text-slate-800">{b.weightKg} kg</td>
                      <td className="pr-4">
                        <span style={{ color: bmiCategory(b.bmi ?? 0).color }} className="font-medium">
                          {b.bmi ?? calcBMI(b.weightKg, profile.heightCm)}
                        </span>
                      </td>
                      <td className="pr-4 text-slate-600">{b.systolic && b.diastolic ? `${b.systolic}/${b.diastolic}` : "—"}</td>
                      <td className="pr-4 text-slate-600">{b.restingHR ?? "—"}</td>
                      <td className="pr-4 text-slate-600">{b.bloodGlucose ?? "—"}</td>
                      <td className="pr-4 text-slate-600">{b.sleepHours ? `${b.sleepHours}h` : "—"}</td>
                      <td className="pr-4">
                        {b.mood != null ? (
                          <span className={`font-semibold ${b.mood >= 7 ? "text-emerald-600" : b.mood >= 5 ? "text-amber-500" : "text-red-500"}`}>
                            {b.mood}/10
                          </span>
                        ) : "—"}
                      </td>
                      <td className="text-slate-600">{b.energyLevel != null ? `${b.energyLevel}/10` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BMI Reference */}
      <Card>
        <CardHeader><CardTitle>BMI Reference</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Underweight", range: "< 18.5", color: "#3b82f6" },
              { label: "Normal", range: "18.5 – 24.9", color: "#10b981" },
              { label: "Overweight", range: "25 – 29.9", color: "#f59e0b" },
              { label: "Obese", range: "≥ 30", color: "#ef4444" },
            ].map((r) => (
              <div key={r.label} className="p-4 rounded-xl border" style={{ borderColor: r.color + "33", background: r.color + "11" }}>
                <p className="font-semibold text-sm" style={{ color: r.color }}>{r.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{r.range}</p>
                {bmiInfo.label === r.label && (
                  <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full text-white" style={{ background: r.color }}>You are here</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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

function StatCard({
  icon, label, value, sub, subColor, bg,
}: {
  icon: React.ReactNode; label: string; value: string; sub?: string; subColor?: string; bg?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className={`w-9 h-9 ${bg ?? "bg-slate-100"} rounded-xl flex items-center justify-center mb-3`}>{icon}</div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-slate-800">{value}</p>
        {sub && <p className="text-xs mt-0.5 font-medium" style={{ color: subColor ?? "#94a3b8" }}>{sub}</p>}
      </CardContent>
    </Card>
  );
}
