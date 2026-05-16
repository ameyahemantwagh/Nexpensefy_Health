"use client";
import { useState } from "react";
import { useHealthStore, MealEntry, FoodItem } from "@/lib/store";
import { FOOD_DATABASE } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Plus, Search, Trash2, Utensils, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";
const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export default function NutritionPage() {
  const { meals, addMeal, removeMeal, profile } = useHealthStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [activeMeal, setActiveMeal] = useState<MealType>("breakfast");
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState("1");

  const dayMeals = meals.filter((m) => m.date === selectedDate);

  const dayTotals = dayMeals.reduce(
    (acc, meal) => {
      meal.foods.forEach(({ food, quantity: q }) => {
        const f = q / parseFloat(food.servingSize || "1");
        acc.calories += food.calories * f;
        acc.protein += food.protein * f;
        acc.carbs += food.carbs * f;
        acc.fat += food.fat * f;
        acc.fiber += (food.fiber ?? 0) * f;
        acc.sodium += (food.sodium ?? 0) * f;
      });
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 }
  );

  const filtered = FOOD_DATABASE.filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase())
  );

  const addFoodEntry = () => {
    if (!selectedFood) return;
    const qty = parseFloat(quantity) || 1;
    const id = `${Date.now()}`;
    const entry: MealEntry = {
      id,
      date: selectedDate,
      mealType: activeMeal,
      foods: [{ food: selectedFood, quantity: qty }],
    };
    addMeal(entry);
    setSelectedFood(null);
    setQuery("");
    setQuantity("1");
    setShowFoodSearch(false);
  };

  const macroChartData = [
    { name: "Protein", value: Math.round(dayTotals.protein), fill: "#3b82f6" },
    { name: "Carbs", value: Math.round(dayTotals.carbs), fill: "#f59e0b" },
    { name: "Fat", value: Math.round(dayTotals.fat), fill: "#f43f5e" },
  ].filter((d) => d.value > 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nutrition</h1>
          <p className="text-slate-500 text-sm mt-1">Track your daily food intake and macros</p>
        </div>
        <div className="flex gap-3">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-44"
          />
          <Button onClick={() => setShowFoodSearch(true)}>
            <Plus className="w-4 h-4" /> Log Food
          </Button>
        </div>
      </div>

      {/* Daily summary */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Calorie ring */}
        <Card>
          <CardContent className="pt-6 flex flex-col items-center">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="#f1f5f9" strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="#10b981" strokeWidth="3"
                  strokeDasharray={`${Math.min(100, (dayTotals.calories / profile.targetCalories) * 100)}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-800">{Math.round(dayTotals.calories)}</span>
                <span className="text-xs text-slate-400">/ {profile.targetCalories}</span>
                <span className="text-xs text-slate-400">kcal</span>
              </div>
            </div>
            <p className="mt-3 text-sm font-medium text-slate-600">Daily Calories</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {profile.targetCalories - Math.round(dayTotals.calories) > 0
                ? `${profile.targetCalories - Math.round(dayTotals.calories)} kcal remaining`
                : `${Math.round(dayTotals.calories) - profile.targetCalories} kcal over`}
            </p>
          </CardContent>
        </Card>

        {/* Macros progress */}
        <Card>
          <CardHeader>
            <CardTitle>Macros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Protein", value: dayTotals.protein, target: profile.targetProtein, color: "#3b82f6", unit: "g" },
              { label: "Carbs", value: dayTotals.carbs, target: profile.targetCarbs, color: "#f59e0b", unit: "g" },
              { label: "Fat", value: dayTotals.fat, target: profile.targetFat, color: "#f43f5e", unit: "g" },
              { label: "Fiber", value: dayTotals.fiber, target: 30, color: "#22c55e", unit: "g" },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-600">{m.label}</span>
                  <span className="text-slate-400">{Math.round(m.value)}{m.unit} / {m.target}{m.unit}</span>
                </div>
                <Progress value={m.value} max={m.target} color={m.color} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Macro pie */}
        <Card>
          <CardHeader>
            <CardTitle>Macro Split</CardTitle>
          </CardHeader>
          <CardContent>
            {macroChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={macroChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {macroChartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v}g`]} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.08)" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No food logged yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Meal type tabs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle>Meal Log</CardTitle>
            <div className="flex gap-1 flex-wrap">
              {MEAL_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveMeal(t)}
                  className={cn(
                    "px-4 py-1.5 rounded-xl text-sm font-medium capitalize transition-all",
                    activeMeal === t ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {dayMeals.filter((m) => m.mealType === activeMeal).length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No {activeMeal} entries for this day.{" "}
              <button className="text-emerald-600 underline" onClick={() => { setShowFoodSearch(true); }}>
                Add food
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {dayMeals
                .filter((m) => m.mealType === activeMeal)
                .map((meal) => (
                  <div key={meal.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl group">
                    <div className="flex-1">
                      {meal.foods.map(({ food, quantity: q }, i) => {
                        const f = q / parseFloat(food.servingSize || "1");
                        return (
                          <div key={i} className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-slate-800">{food.name}</p>
                              <p className="text-xs text-slate-500">{q} {food.servingUnit} · P: {Math.round(food.protein * f)}g · C: {Math.round(food.carbs * f)}g · F: {Math.round(food.fat * f)}g</p>
                            </div>
                            <span className="text-sm font-semibold text-orange-500 mr-2">{Math.round(food.calories * f)} kcal</span>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => removeMeal(meal.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sodium & micronutrients */}
      <Card>
        <CardHeader>
          <CardTitle>Micronutrient Snapshot</CardTitle>
          <CardDescription>Daily intake vs. recommended</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <MicroRow label="Sodium" value={Math.round(dayTotals.sodium)} max={2300} unit="mg" color="#f43f5e" warn={dayTotals.sodium > 2300} />
          <MicroRow label="Fiber" value={Math.round(dayTotals.fiber)} max={30} unit="g" color="#22c55e" />
        </CardContent>
      </Card>

      {/* Food search modal */}
      {showFoodSearch && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg bg-white shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Add Food</CardTitle>
              <button onClick={() => { setShowFoodSearch(false); setSelectedFood(null); setQuery(""); }}>
                <ChevronDown className="w-5 h-5 text-slate-400 rotate-180" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Meal type select */}
              <div className="flex gap-1 flex-wrap">
                {MEAL_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveMeal(t)}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-medium capitalize",
                      activeMeal === t ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search food..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>

              <div className="max-h-52 overflow-y-auto space-y-1 scrollbar-hide">
                {filtered.slice(0, 15).map((food) => (
                  <button
                    key={food.id}
                    onClick={() => setSelectedFood(food)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl text-sm transition-all",
                      selectedFood?.id === food.id ? "bg-emerald-50 border border-emerald-200" : "hover:bg-slate-50"
                    )}
                  >
                    <p className="font-medium text-slate-800">{food.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {food.calories} kcal | P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g per {food.servingSize} {food.servingUnit}
                    </p>
                  </button>
                ))}
              </div>

              {selectedFood && (
                <div className="border-t pt-4 space-y-3">
                  <p className="text-sm font-medium text-slate-700">
                    Serving: {selectedFood.servingSize} {selectedFood.servingUnit}
                  </p>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1 space-y-1">
                      <Label>Quantity</Label>
                      <Input type="number" min="0.1" step="0.1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                    </div>
                    <Button onClick={addFoodEntry} className="shrink-0">Add to {activeMeal}</Button>
                  </div>
                  {quantity && (
                    <p className="text-xs text-slate-500">
                      ≈ {Math.round(selectedFood.calories * (parseFloat(quantity) / parseFloat(selectedFood.servingSize)))} kcal
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function MicroRow({ label, value, max, unit, color, warn }: {
  label: string; value: number; max: number; unit: string; color: string; warn?: boolean;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className={cn("font-medium", warn ? "text-red-600" : "text-slate-700")}>{label}</span>
        <span className="text-slate-400">{value}{unit} / {max}{unit}</span>
      </div>
      <Progress value={value} max={max} color={warn && value > max ? "#ef4444" : color} />
    </div>
  );
}
