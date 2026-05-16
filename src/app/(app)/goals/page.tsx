"use client";
import { useHealthStore } from "@/lib/store";
import { calcTDEE, calcBMI, bmiCategory, ACTIVITY_MULTIPLIERS } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingDown, TrendingUp, Minus, Star, CheckCircle2 } from "lucide-react";

const GOAL_LABELS: Record<string, string> = {
  lose_weight: "Lose Weight",
  gain_muscle: "Build Muscle",
  maintain: "Maintain Weight",
  improve_health: "Improve Health",
};

export default function GoalsPage() {
  const { profile, biometrics, meals, workouts } = useHealthStore();
  const todayStr = new Date().toISOString().split("T")[0];

  const lastBio = biometrics[biometrics.length - 1];
  const bmi = lastBio ? calcBMI(lastBio.weightKg, profile.heightCm) : calcBMI(profile.weightKg, profile.heightCm);
  const bmiInfo = bmiCategory(bmi);
  const tdee = calcTDEE(profile.weightKg, profile.heightCm, profile.age, profile.sex, ACTIVITY_MULTIPLIERS[profile.activityLevel] ?? 1.55);

  const todayMeals = meals.filter((m) => m.date === todayStr);
  const todayCal = todayMeals.reduce((acc, meal) => {
    meal.foods.forEach(({ food, quantity }) => {
      acc += food.calories * (quantity / parseFloat(food.servingSize || "1"));
    });
    return acc;
  }, 0);

  const thisWeekWorkouts = workouts.filter((w) => {
    const d = new Date(w.date);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  });

  // Weekly targets
  const weeklyWorkoutTarget = 4;
  const weeklyCalBurnTarget = 1500;
  const weeklyCalBurned = thisWeekWorkouts.reduce((s, w) => s + (w.caloriesBurned ?? 0), 0);

  // Daily streaks approximation
  const loggedDates = new Set(meals.map((m) => m.date));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    if (loggedDates.has(ds)) streak++;
    else break;
  }

  const goalCal =
    profile.goal === "lose_weight" ? tdee - 500 :
    profile.goal === "gain_muscle" ? tdee + 300 : tdee;

  // Recommendations based on goal
  const recs: { title: string; detail: string }[] =
    profile.goal === "lose_weight" ? [
      { title: "500 kcal daily deficit", detail: `Target ${goalCal} kcal/day — you're at ${Math.round(todayCal)} kcal today.` },
      { title: "High protein intake", detail: `Aim for ${profile.targetProtein}g protein/day to preserve muscle while cutting.` },
      { title: "Cardio 3–4×/week", detail: "Mix walking, cycling, or HIIT for sustainable calorie burning." },
      { title: "Limit processed foods", detail: "Reduce added sugars and ultra-processed snacks." },
    ] : profile.goal === "gain_muscle" ? [
      { title: "Calorie surplus", detail: `Target ${goalCal} kcal/day — muscle growth requires extra energy.` },
      { title: "1.6–2.2g protein/kg bodyweight", detail: `At ${profile.weightKg}kg, aim for ${Math.round(profile.weightKg * 1.8)}–${Math.round(profile.weightKg * 2.2)}g/day.` },
      { title: "Progressive overload", detail: "Gradually increase weights or reps each session to stimulate growth." },
      { title: "Rest & recovery", detail: "Muscles grow during rest — ensure 7–9h sleep and rest days." },
    ] : [
      { title: "Balanced macros", detail: "Aim for 40% carbs, 30% protein, 30% fat for overall health." },
      { title: "7,000–10,000 steps/day", detail: "Regular movement improves cardiovascular health and mood." },
      { title: "Consistent sleep schedule", detail: "7–9 hours of quality sleep supports every aspect of health." },
      { title: "Annual health checkups", detail: "Track blood work, blood pressure, and cholesterol annually." },
    ];

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Goals & Progress</h1>
        <p className="text-slate-500 text-sm mt-1">Track your targets and celebrate milestones</p>
      </div>

      {/* Active goal banner */}
      <Card className="bg-gradient-to-r from-emerald-500 to-teal-500 border-0 text-white">
        <CardContent className="pt-6 pb-6 flex items-center gap-5">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
            {profile.goal === "lose_weight" ? <TrendingDown className="w-7 h-7" /> :
             profile.goal === "gain_muscle" ? <TrendingUp className="w-7 h-7" /> :
             <Minus className="w-7 h-7" />}
          </div>
          <div>
            <p className="text-white/70 text-sm font-medium">Current Goal</p>
            <p className="text-2xl font-bold">{GOAL_LABELS[profile.goal]}</p>
            <p className="text-white/70 text-sm mt-0.5">Target: {goalCal} kcal/day · {profile.activityLevel} activity</p>
          </div>
        </CardContent>
      </Card>

      {/* Progress metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GoalCard
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          label="Meal Log Streak"
          value={`${streak} days`}
          progress={Math.min(100, (streak / 30) * 100)}
          color="#10b981"
          bg="bg-emerald-50"
        />
        <GoalCard
          icon={<Target className="w-5 h-5 text-orange-500" />}
          label="Weekly Workouts"
          value={`${thisWeekWorkouts.length} / ${weeklyWorkoutTarget}`}
          progress={(thisWeekWorkouts.length / weeklyWorkoutTarget) * 100}
          color="#f97316"
          bg="bg-orange-50"
        />
        <GoalCard
          icon={<Star className="w-5 h-5 text-amber-500" />}
          label="Weekly Cal Burned"
          value={`${weeklyCalBurned} / ${weeklyCalBurnTarget}`}
          progress={Math.min(100, (weeklyCalBurned / weeklyCalBurnTarget) * 100)}
          color="#f59e0b"
          bg="bg-amber-50"
        />
        <GoalCard
          icon={<Target className="w-5 h-5 text-blue-500" />}
          label="Today's Calories"
          value={`${Math.round(todayCal)} / ${profile.targetCalories}`}
          progress={Math.min(100, (todayCal / profile.targetCalories) * 100)}
          color="#3b82f6"
          bg="bg-blue-50"
        />
      </div>

      {/* Personalized recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Personalized Recommendations</CardTitle>
          <CardDescription>Based on your goal: {GOAL_LABELS[profile.goal]}</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          {recs.map((r, i) => (
            <div key={i} className="flex gap-3 p-4 bg-slate-50 rounded-xl">
              <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-emerald-600 text-xs font-bold">{i + 1}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{r.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{r.detail}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Milestone tracker */}
      <Card>
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
          <CardDescription>Achievements as you build healthy habits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: "First Meal Logged", earned: meals.length > 0 },
              { label: "First Workout", earned: workouts.length > 0 },
              { label: "3-Day Streak", earned: streak >= 3 },
              { label: "7-Day Streak", earned: streak >= 7 },
              { label: "5 Workouts Logged", earned: workouts.length >= 5 },
              { label: "Hit Water Goal Once", earned: false },
              { label: "30-Day Streak", earned: streak >= 30 },
              { label: "10kg Weight Change", earned: biometrics.length >= 2 && Math.abs(biometrics[0].weightKg - biometrics[biometrics.length - 1].weightKg) >= 10 },
              { label: "BMI in Normal Range", earned: bmiInfo.label === "Normal" },
            ].map((m, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  m.earned ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-100 opacity-50"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.earned ? "bg-emerald-500" : "bg-slate-200"}`}>
                  {m.earned ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Star className="w-4 h-4 text-slate-400" />}
                </div>
                <span className={`text-sm font-medium ${m.earned ? "text-emerald-800" : "text-slate-500"}`}>{m.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GoalCard({
  icon, label, value, progress, color, bg,
}: {
  icon: React.ReactNode; label: string; value: string; progress: number; color: string; bg: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>{icon}</div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-lg font-bold text-slate-800 mt-0.5">{value}</p>
        <Progress value={progress} color={color} className="mt-2" />
      </CardContent>
    </Card>
  );
}
