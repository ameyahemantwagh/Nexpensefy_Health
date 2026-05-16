"use client";
import { useHealthStore, UserProfile } from "@/lib/store";
import { calcBMI, bmiCategory, calcTDEE, ACTIVITY_MULTIPLIERS, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import {
  Activity, Droplets, Flame, Moon, Smile, Target,
  TrendingDown, TrendingUp, Dumbbell, Utensils,
} from "lucide-react";

export default function DashboardPage() {
  const { profile, biometrics, meals, workouts, water } = useHealthStore();
  const todayStr = new Date().toISOString().split("T")[0];

  // Today's nutrition totals
  const todayMeals = meals.filter((m) => m.date === todayStr);
  const todayNutrition = todayMeals.reduce(
    (acc, meal) => {
      meal.foods.forEach(({ food, quantity }) => {
        const factor = quantity / parseFloat(food.servingSize || "1");
        acc.calories += food.calories * factor;
        acc.protein += food.protein * factor;
        acc.carbs += food.carbs * factor;
        acc.fat += food.fat * factor;
      });
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Today's water
  const todayWater = water.find((w) => w.date === todayStr)?.totalMl ?? 0;

  // Last biometric entry
  const lastBio = biometrics[biometrics.length - 1];
  const bmi = lastBio ? calcBMI(lastBio.weightKg, profile.heightCm) : 0;
  const bmiInfo = bmiCategory(bmi);
  const tdee = calcTDEE(
    profile.weightKg,
    profile.heightCm,
    profile.age,
    profile.sex,
    ACTIVITY_MULTIPLIERS[profile.activityLevel] ?? 1.55
  );

  // Today's workout
  const todayWorkouts = workouts.filter((w) => w.date === todayStr);
  const totalCalBurned = todayWorkouts.reduce((s, w) => s + (w.caloriesBurned ?? 0), 0);

  // Weight trend
  const weightData = biometrics.slice(-7).map((b) => ({
    date: b.date.slice(5),
    weight: b.weightKg,
    mood: b.mood,
  }));

  // Macro rings data
  const macros = [
    { name: "Protein", value: Math.round(todayNutrition.protein), target: profile.targetProtein, color: "#3b82f6" },
    { name: "Carbs", value: Math.round(todayNutrition.carbs), target: profile.targetCarbs, color: "#f59e0b" },
    { name: "Fat", value: Math.round(todayNutrition.fat), target: profile.targetFat, color: "#f43f5e" },
  ];

  const netCal = Math.round(todayNutrition.calories) - totalCalBurned;
  const calPct = Math.min(100, Math.round((todayNutrition.calories / (profile.targetCalories || 2000)) * 100));
  const waterPct = Math.min(100, Math.round((todayWater / profile.targetWaterMl) * 100));

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Good {getGreeting()},{" "}
          <span className="text-emerald-600">{profile.name || "there"}</span> 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">{formatDate(new Date())} · Here&apos;s your health snapshot</p>
      </div>

      {/* Top KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Flame className="w-5 h-5 text-orange-500" />}
          label="Calories Today"
          value={`${Math.round(todayNutrition.calories)} / ${profile.targetCalories}`}
          sub="kcal consumed"
          progress={calPct}
          progColor="#f97316"
          bg="bg-orange-50"
        />
        <KpiCard
          icon={<Droplets className="w-5 h-5 text-blue-500" />}
          label="Hydration"
          value={`${(todayWater / 1000).toFixed(1)} / ${(profile.targetWaterMl / 1000).toFixed(1)}`}
          sub="litres today"
          progress={waterPct}
          progColor="#3b82f6"
          bg="bg-blue-50"
        />
        <KpiCard
          icon={<Dumbbell className="w-5 h-5 text-violet-500" />}
          label="Cal Burned"
          value={totalCalBurned > 0 ? totalCalBurned.toString() : "—"}
          sub={todayWorkouts.length > 0 ? `${todayWorkouts.length} workout(s)` : "No workout logged"}
          progress={Math.min(100, (totalCalBurned / 500) * 100)}
          progColor="#8b5cf6"
          bg="bg-violet-50"
        />
        <KpiCard
          icon={<Activity className="w-5 h-5 text-emerald-500" />}
          label="Net Calories"
          value={netCal > 0 ? `+${netCal}` : `${netCal}`}
          sub={`TDEE: ${tdee} kcal`}
          progress={Math.min(100, Math.abs((netCal / tdee) * 100))}
          progColor={netCal > 0 ? "#10b981" : "#ef4444"}
          bg="bg-emerald-50"
        />
      </div>

      {/* Weight trend + Macros */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weight Trend</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {weightData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={weightData}>
                  <defs>
                    <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "none", background: "#fff", boxShadow: "0 4px 24px rgba(0,0,0,.1)" }}
                    formatter={(v) => [`${v} kg`, "Weight"]}
                  />
                  <Area type="monotone" dataKey="weight" stroke="#10b981" fill="url(#wGrad)" strokeWidth={2} dot={{ r: 3, fill: "#10b981" }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={<TrendingDown className="w-8 h-8" />} text="No weight data yet. Log your first entry in Biometrics." />
            )}
          </CardContent>
        </Card>

        {/* Macros card */}
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Macros</CardTitle>
            <CardDescription>vs. daily targets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {macros.map((m) => (
              <div key={m.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">{m.name}</span>
                  <span className="text-slate-500">
                    {m.value}g / {m.target}g
                  </span>
                </div>
                <Progress value={m.value} max={m.target} color={m.color} />
              </div>
            ))}

            <div className="pt-2 mt-2 border-t border-slate-100">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-700">BMI</span>
                <span className="font-semibold" style={{ color: bmiInfo.color }}>
                  {bmi} — {bmiInfo.label}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mood / Sleep + Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Mood & Energy Trend</CardTitle>
            <CardDescription>Weekly overview</CardDescription>
          </CardHeader>
          <CardContent>
            {weightData.length > 0 ? (
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.08)" }}
                    formatter={(v) => [v as number, "Mood"]}
                  />
                  <Bar dataKey="mood" radius={[6, 6, 0, 0]} maxBarSize={32}>
                    {weightData.map((entry, idx) => (
                      <Cell key={idx} fill={(entry.mood ?? 0) >= 7 ? "#10b981" : (entry.mood ?? 0) >= 5 ? "#f59e0b" : "#f43f5e"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={<Smile className="w-8 h-8" />} text="Log your mood in Biometrics to see trends." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Workouts</CardTitle>
            <CardDescription>Last 5 sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {workouts.length > 0 ? (
              <div className="space-y-2">
                {workouts.slice(0, 5).map((w) => (
                  <div key={w.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                      <Dumbbell className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{w.type}</p>
                      <p className="text-xs text-slate-500">{w.date} · {w.durationMin} min</p>
                    </div>
                    {w.caloriesBurned && (
                      <span className="text-xs font-semibold text-orange-500">{w.caloriesBurned} kcal</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<TrendingUp className="w-8 h-8" />} text="No workouts logged yet. Start your first session!" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today's Meals Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Today&apos;s Meals</CardTitle>
            <CardDescription>{todayMeals.length} entries logged</CardDescription>
          </div>
          <Utensils className="w-5 h-5 text-slate-400" />
        </CardHeader>
        <CardContent>
          {todayMeals.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(["breakfast", "lunch", "dinner", "snack"] as const).map((type) => {
                const typeMeals = todayMeals.filter((m) => m.mealType === type);
                const typeCal = typeMeals.reduce((acc, meal) => {
                  meal.foods.forEach(({ food, quantity }) => {
                    acc += food.calories * (quantity / parseFloat(food.servingSize || "1"));
                  });
                  return acc;
                }, 0);
                return (
                  <div key={type} className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">{type}</p>
                    <p className="text-lg font-bold text-slate-800">{Math.round(typeCal)} kcal</p>
                    <p className="text-xs text-slate-500">{typeMeals.length} meal(s)</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={<Utensils className="w-8 h-8" />} text="No meals logged today. Head to Nutrition to log your food." />
          )}
        </CardContent>
      </Card>

      {/* Quick tips */}
      <QuickTips profile={profile} todayNutrition={todayNutrition} todayWater={todayWater} />
    </div>
  );
}

function KpiCard({
  icon, label, value, sub, progress, progColor, bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  progress: number;
  progColor: string;
  bg: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>{icon}</div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-slate-800 mt-0.5">{value}</p>
        <p className="text-xs text-slate-400 mb-2">{sub}</p>
        <Progress value={progress} color={progColor} />
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
      <div className="opacity-30">{icon}</div>
      <p className="text-sm text-center max-w-56">{text}</p>
    </div>
  );
}

function QuickTips({
  profile,
  todayNutrition,
  todayWater,
}: {
  profile: UserProfile;
  todayNutrition: { calories: number; protein: number; carbs: number; fat: number };
  todayWater: number;
}) {
  const tips: string[] = [];

  if (todayNutrition.protein < profile.targetProtein * 0.5)
    tips.push("You're below 50% of your protein target — consider adding a protein-rich meal.");
  if (todayWater < profile.targetWaterMl * 0.4)
    tips.push("Stay hydrated! You've had less than 40% of your daily water target.");
  if (todayNutrition.calories < profile.targetCalories * 0.3 && new Date().getHours() > 14)
    tips.push("Calorie intake is low for this time of day — make sure you're eating enough.");
  if (tips.length === 0)
    tips.push("Great job! Keep tracking your meals and workouts to stay on top of your health goals.");

  return (
    <Card className="border-emerald-100 bg-emerald-50/30">
      <CardHeader>
        <CardTitle className="text-emerald-700 flex items-center gap-2">
          <Target className="w-4 h-4" /> Today&apos;s Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {tips.map((t, i) => (
          <div key={i} className="flex gap-2 text-sm text-emerald-900">
            <span className="text-emerald-500 mt-0.5">•</span>
            <span>{t}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}
