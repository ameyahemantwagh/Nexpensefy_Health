"use client";
import { useState } from "react";
import { useHealthStore, WorkoutEntry, WorkoutExercise } from "@/lib/store";
import { WORKOUT_EXERCISES } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Plus, Trash2, Dumbbell, Clock, Flame, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const WORKOUT_TYPES = ["Strength", "Cardio", "HIIT", "Yoga", "Pilates", "Cycling", "Running", "Swimming", "Custom"];
const CATEGORIES = ["All", ...Array.from(new Set(WORKOUT_EXERCISES.map((e) => e.category)))];

export default function WorkoutPage() {
  const { workouts, addWorkout, removeWorkout } = useHealthStore();
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [wType, setWType] = useState("Strength");
  const [wDate, setWDate] = useState(new Date().toISOString().split("T")[0]);
  const [wDuration, setWDuration] = useState("");
  const [wCalories, setWCalories] = useState("");
  const [wNotes, setWNotes] = useState("");
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [exSearch, setExSearch] = useState("");
  const [exCat, setExCat] = useState("All");

  const filteredEx = WORKOUT_EXERCISES.filter(
    (e) =>
      (exCat === "All" || e.category === exCat) &&
      e.name.toLowerCase().includes(exSearch.toLowerCase())
  );

  const addExercise = (name: string, category: string) => {
    setExercises([...exercises, { name, category, sets: [{ reps: 10, weightKg: 0 }] }]);
  };

  const updateSet = (exIdx: number, setIdx: number, field: "reps" | "weightKg" | "duration", val: string) => {
    const updated = [...exercises];
    updated[exIdx] = {
      ...updated[exIdx],
      sets: updated[exIdx].sets.map((s, i) => i === setIdx ? { ...s, [field]: parseFloat(val) || 0 } : s),
    };
    setExercises(updated);
  };

  const addSet = (exIdx: number) => {
    const updated = [...exercises];
    const lastSet = updated[exIdx].sets[updated[exIdx].sets.length - 1] ?? {};
    updated[exIdx] = { ...updated[exIdx], sets: [...updated[exIdx].sets, { ...lastSet }] };
    setExercises(updated);
  };

  const removeExercise = (idx: number) => {
    setExercises(exercises.filter((_, i) => i !== idx));
  };

  const saveWorkout = () => {
    if (!wDuration) return;
    const entry: WorkoutEntry = {
      id: Date.now().toString(),
      date: wDate,
      type: wType,
      durationMin: parseInt(wDuration),
      caloriesBurned: wCalories ? parseInt(wCalories) : undefined,
      exercises,
      notes: wNotes || undefined,
    };
    addWorkout(entry);
    setShowForm(false);
    setExercises([]);
    setWDuration("");
    setWCalories("");
    setWNotes("");
  };

  // Chart: duration per day (last 7 workouts)
  const chartData = [...workouts]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7)
    .map((w) => ({ date: w.date.slice(5), duration: w.durationMin, cal: w.caloriesBurned ?? 0, type: w.type }));

  const totalWorkouts = workouts.length;
  const totalMinutes = workouts.reduce((s, w) => s + w.durationMin, 0);
  const totalCalBurned = workouts.reduce((s, w) => s + (w.caloriesBurned ?? 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Workout Tracker</h1>
          <p className="text-slate-500 text-sm mt-1">Log exercises, track progress, and build consistency</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> Log Workout
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={<Dumbbell className="w-5 h-5 text-violet-500" />} label="Total Sessions" value={totalWorkouts.toString()} bg="bg-violet-50" />
        <StatCard icon={<Clock className="w-5 h-5 text-blue-500" />} label="Total Minutes" value={`${totalMinutes}`} sub="logged" bg="bg-blue-50" />
        <StatCard icon={<Flame className="w-5 h-5 text-orange-500" />} label="Total Burned" value={totalCalBurned > 0 ? `${totalCalBurned}` : "—"} sub="kcal" bg="bg-orange-50" />
      </div>

      {/* Log Form */}
      {showForm && (
        <Card className="border-violet-100 bg-violet-50/20">
          <CardHeader>
            <CardTitle>New Workout Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Basic info */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label>Workout Type</Label>
                <select
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={wType}
                  onChange={(e) => setWType(e.target.value)}
                >
                  {WORKOUT_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={wDate} onChange={(e) => setWDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Duration (min) *</Label>
                <Input type="number" placeholder="45" value={wDuration} onChange={(e) => setWDuration(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Calories Burned</Label>
                <Input type="number" placeholder="350" value={wCalories} onChange={(e) => setWCalories(e.target.value)} />
              </div>
            </div>

            {/* Exercise picker */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Add Exercises</p>
              <div className="flex gap-2 mb-2 flex-wrap">
                {CATEGORIES.map((c) => (
                  <button key={c} onClick={() => setExCat(c)}
                    className={cn("px-3 py-1 rounded-lg text-xs font-medium", exCat === c ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600")}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <Input placeholder="Search exercises..." value={exSearch} onChange={(e) => setExSearch(e.target.value)} className="mb-2" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-hide">
                {filteredEx.map((ex) => {
                  const added = exercises.some((e) => e.name === ex.name);
                  return (
                    <button
                      key={ex.name}
                      onClick={() => !added && addExercise(ex.name, ex.category)}
                      disabled={added}
                      className={cn(
                        "p-2.5 rounded-xl text-xs text-left border transition-all",
                        added ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 text-slate-700"
                      )}
                    >
                      <p className="font-medium">{ex.name}</p>
                      <p className="text-slate-400 mt-0.5">{ex.category}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Exercise sets */}
            {exercises.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-700">Set Details</p>
                {exercises.map((ex, exIdx) => (
                  <div key={exIdx} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium text-slate-800 text-sm">{ex.name}</p>
                      <button onClick={() => removeExercise(exIdx)} className="p-1 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {ex.sets.map((set, setIdx) => (
                        <div key={setIdx} className="flex gap-2 items-center">
                          <span className="text-xs text-slate-400 w-8">Set {setIdx + 1}</span>
                          {ex.category !== "Cardio" ? (
                            <>
                              <Input type="number" placeholder="Reps" value={set.reps ?? ""} onChange={(e) => updateSet(exIdx, setIdx, "reps", e.target.value)} className="w-24" />
                              <span className="text-xs text-slate-400">×</span>
                              <Input type="number" placeholder="kg" value={set.weightKg ?? ""} onChange={(e) => updateSet(exIdx, setIdx, "weightKg", e.target.value)} className="w-24" />
                              <span className="text-xs text-slate-400">kg</span>
                            </>
                          ) : (
                            <>
                              <Input type="number" placeholder="Duration (min)" value={set.duration ?? ""} onChange={(e) => updateSet(exIdx, setIdx, "duration", e.target.value)} className="w-36" />
                              <span className="text-xs text-slate-400">min</span>
                            </>
                          )}
                        </div>
                      ))}
                      <button onClick={() => addSet(exIdx)} className="text-xs text-emerald-600 hover:underline mt-1">
                        + Add Set
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Input placeholder="How did it feel?" value={wNotes} onChange={(e) => setWNotes(e.target.value)} />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={saveWorkout} disabled={!wDuration}>Save Workout</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Duration chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Workout Duration</CardTitle>
            <CardDescription>Last 7 sessions (minutes)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.08)" }}
                  formatter={(v, name) => [v as number, name === "duration" ? "min" : "kcal"]}
                />
                <Bar dataKey="duration" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {chartData.map((_, i) => <Cell key={i} fill="#8b5cf6" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Workout history */}
      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
          <CardDescription>{workouts.length} sessions logged</CardDescription>
        </CardHeader>
        <CardContent>
          {workouts.length === 0 ? (
            <div className="text-center py-10 text-slate-400">No workouts logged yet. Smash your first session!</div>
          ) : (
            <div className="space-y-3">
              {[...workouts].sort((a, b) => b.date.localeCompare(a.date)).map((w) => (
                <div key={w.id} className="border border-slate-100 rounded-xl overflow-hidden">
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50 transition"
                    onClick={() => setExpandedId(expandedId === w.id ? null : w.id)}
                  >
                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                      <Dumbbell className="w-5 h-5 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800">{w.type}</p>
                      <p className="text-xs text-slate-500">
                        {w.date} · {w.durationMin} min
                        {w.caloriesBurned ? ` · ${w.caloriesBurned} kcal` : ""}
                        {w.exercises.length > 0 ? ` · ${w.exercises.length} exercise(s)` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); removeWorkout(w.id); }}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                      {expandedId === w.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>
                  {expandedId === w.id && w.exercises.length > 0 && (
                    <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 space-y-2">
                      {w.exercises.map((ex, i) => (
                        <div key={i} className="text-sm">
                          <p className="font-medium text-slate-700">{ex.name}</p>
                          <p className="text-xs text-slate-400">
                            {ex.sets.map((s, si) =>
                              ex.category === "Cardio"
                                ? `${si + 1}: ${s.duration}min`
                                : `${si + 1}: ${s.reps} reps @ ${s.weightKg}kg`
                            ).join(" | ")}
                          </p>
                        </div>
                      ))}
                      {w.notes && <p className="text-xs italic text-slate-500 mt-1">Note: {w.notes}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, sub, bg }: { icon: React.ReactNode; label: string; value: string; sub?: string; bg?: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className={`w-9 h-9 ${bg ?? "bg-slate-100"} rounded-xl flex items-center justify-center mb-3`}>{icon}</div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-slate-800">
          {value}
          {sub && <span className="text-sm font-normal text-slate-400 ml-1">{sub}</span>}
        </p>
      </CardContent>
    </Card>
  );
}
