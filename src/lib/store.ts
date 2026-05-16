import { create } from "zustand";

export type Goal = "lose_weight" | "gain_muscle" | "maintain" | "improve_health";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "veryActive";
export type Diet = "none" | "vegan" | "vegetarian" | "keto" | "paleo" | "gluten_free" | "diabetic_friendly";

export interface UserProfile {
  name: string;
  email: string;
  age: number;
  sex: "male" | "female";
  heightCm: number;
  weightKg: number;
  goal: Goal;
  activityLevel: ActivityLevel;
  diet: Diet;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  targetWaterMl: number;
  onboarded: boolean;
}

export interface BiometricEntry {
  date: string;
  weightKg: number;
  bodyFatPct?: number;
  bmi?: number;
  systolic?: number;
  diastolic?: number;
  restingHR?: number;
  bloodGlucose?: number;
  mood?: number;
  energyLevel?: number;
  sleepHours?: number;
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
  servingSize: string;
  servingUnit: string;
}

export interface MealEntry {
  id: string;
  date: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  foods: Array<{ food: FoodItem; quantity: number }>;
}

export interface WorkoutSet {
  reps?: number;
  weightKg?: number;
  duration?: number;
}

export interface WorkoutExercise {
  name: string;
  category: string;
  sets: WorkoutSet[];
  notes?: string;
}

export interface WorkoutEntry {
  id: string;
  date: string;
  type: string;
  durationMin: number;
  caloriesBurned?: number;
  exercises: WorkoutExercise[];
  notes?: string;
}

export interface WaterEntry {
  date: string;
  totalMl: number;
  logs: Array<{ time: string; ml: number }>;
}

interface HealthStore {
  profile: UserProfile;
  biometrics: BiometricEntry[];
  meals: MealEntry[];
  workouts: WorkoutEntry[];
  water: WaterEntry[];
  updateProfile: (data: Partial<UserProfile>) => void;
  addBiometric: (entry: BiometricEntry) => void;
  addMeal: (entry: MealEntry) => void;
  removeMeal: (id: string) => void;
  addWorkout: (entry: WorkoutEntry) => void;
  removeWorkout: (id: string) => void;
  logWater: (date: string, ml: number) => void;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "",
  email: "",
  age: 25,
  sex: "male",
  heightCm: 170,
  weightKg: 70,
  goal: "maintain",
  activityLevel: "moderate",
  diet: "none",
  targetCalories: 2000,
  targetProtein: 150,
  targetCarbs: 250,
  targetFat: 65,
  targetWaterMl: 2500,
  onboarded: false,
};

export const useHealthStore = create<HealthStore>((set) => ({
  profile: DEFAULT_PROFILE,
  biometrics: [
    { date: "2026-04-01", weightKg: 72, bmi: 24.9, mood: 7, energyLevel: 7, sleepHours: 7.5 },
    { date: "2026-04-02", weightKg: 71.8, bmi: 24.8, mood: 8, energyLevel: 8, sleepHours: 8 },
    { date: "2026-04-03", weightKg: 71.5, bmi: 24.7, mood: 6, energyLevel: 6, sleepHours: 6.5 },
    { date: "2026-04-04", weightKg: 71.2, bmi: 24.6, mood: 8, energyLevel: 7, sleepHours: 7 },
    { date: "2026-04-05", weightKg: 70.9, bmi: 24.4, mood: 9, energyLevel: 9, sleepHours: 8 },
  ],
  meals: [],
  workouts: [],
  water: [],
  updateProfile: (data) =>
    set((state) => ({ profile: { ...state.profile, ...data } })),
  addBiometric: (entry) =>
    set((state) => ({ biometrics: [...state.biometrics, entry] })),
  addMeal: (entry) =>
    set((state) => ({ meals: [entry, ...state.meals] })),
  removeMeal: (id) =>
    set((state) => ({ meals: state.meals.filter((m) => m.id !== id) })),
  addWorkout: (entry) =>
    set((state) => ({ workouts: [entry, ...state.workouts] })),
  removeWorkout: (id) =>
    set((state) => ({ workouts: state.workouts.filter((w) => w.id !== id) })),
  logWater: (date, ml) =>
    set((state) => {
      const existing = state.water.find((w) => w.date === date);
      const time = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      if (existing) {
        return {
          water: state.water.map((w) =>
            w.date === date
              ? { ...w, totalMl: w.totalMl + ml, logs: [...w.logs, { time, ml }] }
              : w
          ),
        };
      }
      return {
        water: [...state.water, { date, totalMl: ml, logs: [{ time, ml }] }],
      };
    }),
}));
