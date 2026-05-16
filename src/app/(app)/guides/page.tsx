"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpen, Search, ChevronDown, ChevronUp, Apple, Dumbbell, Heart, Brain, Zap, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface Article {
  id: string;
  category: string;
  icon: React.ReactNode;
  title: string;
  summary: string;
  readTime: string;
  content: string;
}

const ARTICLES: Article[] = [
  {
    id: "1", category: "Nutrition", icon: <Apple className="w-4 h-4" />, readTime: "4 min",
    title: "Understanding Macronutrients",
    summary: "Proteins, carbohydrates, and fats are the three macronutrients your body needs in large amounts.",
    content: `**Proteins** are the building blocks of muscle, enzymes, and hormones. Aim for 0.8–2.2g per kg of bodyweight depending on your activity level. Good sources: chicken, fish, eggs, legumes, tofu.

**Carbohydrates** are your body's primary energy source. Choose complex carbs (oats, brown rice, sweet potatoes) over simple sugars. They provide sustained energy and fiber for gut health.

**Fats** are essential for hormone production, brain function, and vitamin absorption. Focus on unsaturated fats (avocado, nuts, olive oil) and omega-3 fatty acids (salmon, flaxseeds, walnuts). Limit saturated and trans fats.

The ideal macro split depends on your goal:
- Weight loss: 40% carbs / 30% protein / 30% fat
- Muscle gain: 45% carbs / 35% protein / 20% fat
- General health: 45–65% carbs / 15–25% protein / 20–35% fat`,
  },
  {
    id: "2", category: "Nutrition", icon: <Apple className="w-4 h-4" />, readTime: "3 min",
    title: "Micronutrients That Most People Miss",
    summary: "Vitamins and minerals play critical roles that are often overlooked in standard diets.",
    content: `**Vitamin D**: Most people are deficient. Essential for bone health, immune function, and mood. Sources: sunlight, fatty fish, fortified milk, supplements.

**Magnesium**: Involved in 300+ enzyme reactions. Deficiency causes muscle cramps, poor sleep, anxiety. Sources: dark chocolate, leafy greens, nuts, seeds.

**Iron**: Critical for oxygen transport. Deficiency causes fatigue. Women, athletes, and vegans are at higher risk. Sources: red meat, lentils, spinach (pair with Vitamin C for absorption).

**Vitamin B12**: Only found in animal products. Essential for nerve function and red blood cells. Vegans must supplement.

**Zinc**: Supports immune function and testosterone production. Sources: oysters, beef, pumpkin seeds.

**Omega-3 fatty acids**: Anti-inflammatory. Most diets are omega-6 dominant. Sources: fatty fish, flaxseed oil, walnuts.`,
  },
  {
    id: "3", category: "Fitness", icon: <Dumbbell className="w-4 h-4" />, readTime: "5 min",
    title: "Progressive Overload: The Secret to Muscle Growth",
    summary: "Without progressively challenging your muscles, adaptation stops and gains plateau.",
    content: `Progressive overload is the gradual increase of stress on your body during training. Without it, your muscles adapt and stop growing.

**Methods of progressive overload:**
- Increase weight (most common)
- Increase reps or sets
- Decrease rest time between sets
- Improve range of motion or form
- Increase training frequency

**Practical example**: If you bench press 60kg for 3×10 this week, aim for 3×10 at 62.5kg next week, or 3×11 at the same weight.

**Key principles:**
1. Track your workouts — you can't improve what you don't measure
2. Prioritize compound movements (squats, deadlifts, bench, rows)
3. Allow adequate recovery (48–72h per muscle group for beginners)
4. Sleep 7–9 hours — most muscle repair happens during deep sleep

Beginners can progress weekly; advanced athletes may need monthly micro-cycles.`,
  },
  {
    id: "4", category: "Fitness", icon: <Dumbbell className="w-4 h-4" />, readTime: "3 min",
    title: "Cardio: HIIT vs. Steady-State",
    summary: "Both forms of cardio have distinct advantages. Knowing when to use each is key.",
    content: `**HIIT (High-Intensity Interval Training)** alternates short bursts of intense effort with recovery periods.
- Burns more calories in less time
- Elevates metabolism post-workout (EPOC effect)
- Improves cardiovascular fitness rapidly
- Best for: busy schedules, fat loss, athletes
- Caution: High recovery demand — limit to 3×/week

**Steady-State Cardio** (LISS) maintains a constant moderate intensity.
- Lower joint stress and recovery demand
- Ideal for active recovery days
- Burns fat directly as primary fuel at moderate intensities
- Better for: beginners, injury-prone individuals, endurance building

**Recommendation**: Combine both — 2 HIIT sessions and 2–3 LISS sessions per week. Always warm up for 5 minutes before cardio.`,
  },
  {
    id: "5", category: "Health", icon: <Heart className="w-4 h-4" />, readTime: "4 min",
    title: "Heart Health: What Your Numbers Mean",
    summary: "Understanding blood pressure, cholesterol, and heart rate helps you take control of cardiovascular health.",
    content: `**Blood Pressure** (Target: <120/80 mmHg)
- <120/80: Normal
- 120–129/<80: Elevated
- 130–139/80–89: Stage 1 hypertension
- ≥140/≥90: Stage 2 hypertension

**Resting Heart Rate** (Target: 60–100 bpm; athletes often 40–60)
Lower resting HR generally indicates better cardiovascular fitness.

**Cholesterol**
- Total: <200 mg/dL ideal
- LDL (bad): <100 mg/dL optimal
- HDL (good): >60 mg/dL protective
- Triglycerides: <150 mg/dL normal

**Ways to improve heart health:**
- Exercise 150+ min/week of moderate cardio
- Reduce sodium and saturated fat
- Quit smoking
- Manage stress (chronic stress raises cortisol, which raises BP)
- Maintain a healthy BMI (18.5–24.9)`,
  },
  {
    id: "6", category: "Health", icon: <Heart className="w-4 h-4" />, readTime: "3 min",
    title: "Diabetes Prevention Through Diet",
    summary: "Type 2 diabetes is largely preventable with the right dietary and lifestyle choices.",
    content: `Type 2 diabetes develops when cells become resistant to insulin, leading to elevated blood glucose.

**Dietary strategies to reduce risk:**
1. **Low glycemic index foods**: Prefer foods that raise blood sugar slowly — oats, legumes, non-starchy vegetables.
2. **Reduce added sugars**: Sugar-sweetened beverages are strongly linked to diabetes risk.
3. **Increase fiber**: Fiber slows glucose absorption. Target 30g/day from whole grains, fruits, and vegetables.
4. **Healthy fats**: Replace saturated fats with plant-based fats (nuts, avocado, olive oil).
5. **Portion control**: Even healthy foods can raise blood sugar if eaten in excess.

**Lifestyle factors:**
- Lose 5–7% of body weight if overweight
- Exercise 30 min/day, 5 days/week
- Regular fasting glucose checks after age 40 (target <100 mg/dL)`,
  },
  {
    id: "7", category: "Mental Health", icon: <Brain className="w-4 h-4" />, readTime: "4 min",
    title: "The Gut-Brain Axis: How Food Affects Mood",
    summary: "Your gut produces 95% of your body's serotonin — diet has a profound impact on mental wellbeing.",
    content: `The gut-brain axis is the bidirectional communication network between your gut microbiome and brain.

**Key findings:**
- 95% of serotonin (the "happiness chemical") is produced in the gut
- Gut bacteria influence anxiety, depression, and cognitive function
- The vagus nerve physically connects gut and brain

**Foods that support gut-brain health:**
- **Probiotics**: Fermented foods (yogurt, kimchi, kefir) introduce beneficial bacteria
- **Prebiotics**: Fiber that feeds good bacteria (garlic, onions, bananas, oats)
- **Omega-3s**: Reduce neuroinflammation (salmon, walnuts, flaxseed)
- **Polyphenols**: Antioxidants that feed microbiome (berries, dark chocolate, green tea)

**Foods that harm gut health:**
- Ultra-processed foods
- Excessive sugar and alcohol
- Artificial sweeteners (may disrupt microbiome balance)

Regular exercise, adequate sleep, and stress management all improve gut health too.`,
  },
  {
    id: "8", category: "Mental Health", icon: <Brain className="w-4 h-4" />, readTime: "3 min",
    title: "Sleep & Health: Why 7–9 Hours Matters",
    summary: "Sleep is the foundation of recovery, cognitive function, and hormonal balance.",
    content: `Sleep is not passive — it's when your body repairs itself, consolidates memories, and rebalances hormones.

**What happens during sleep:**
- Growth hormone release (muscle repair and fat metabolism)
- Cortisol reduction (stress hormone)
- Memory consolidation
- Immune system strengthening
- Hunger hormones reset (ghrelin/leptin balance)

**Effects of sleep deprivation:**
- +25% increased calorie consumption the next day
- Reduced insulin sensitivity
- Impaired workout recovery
- Elevated cortisol → increased belly fat
- Weakened immune function
- Reduced motivation and mood

**Sleep hygiene tips:**
1. Keep a consistent sleep/wake schedule (even weekends)
2. Avoid screens 1h before bed (blue light suppresses melatonin)
3. Keep bedroom cool (18–20°C ideal)
4. Avoid caffeine after 2pm
5. Limit alcohol — it disrupts sleep architecture despite aiding sleep onset`,
  },
  {
    id: "9", category: "Nutrition", icon: <Zap className="w-4 h-4" />, readTime: "3 min",
    title: "Pre & Post-Workout Nutrition",
    summary: "What you eat around your workouts dramatically affects performance and recovery.",
    content: `**Pre-workout (1–2 hours before):**
Goal: Fuel performance and prevent muscle breakdown.
- Carbohydrates: Primary fuel for intense exercise (oats, banana, rice)
- Moderate protein: ~20–30g to prime muscle protein synthesis
- Low fat: Slows digestion; avoid large amounts before training
- Hydration: 500ml water 2h before

Example: Oats + banana + whey protein shake

**Post-workout (within 30–60 min):**
Goal: Replenish glycogen, stimulate muscle protein synthesis.
- Fast-digesting carbs: Replenish depleted glycogen (white rice, fruit)
- High-quality protein: 20–40g to maximise muscle repair
- Hydration: Replace sweat losses (weigh yourself before/after for precision)

Example: Chicken + white rice + vegetables, or Greek yogurt + berries

**Intra-workout (for sessions >75 min):**
- Electrolyte drink or banana to maintain energy levels`,
  },
  {
    id: "10", category: "Health", icon: <Shield className="w-4 h-4" />, readTime: "3 min",
    title: "Anti-Inflammatory Diet Basics",
    summary: "Chronic inflammation underlies most modern diseases. Your diet is your first line of defense.",
    content: `Inflammation is the immune system's response to injury or illness. Chronic, low-grade inflammation is linked to heart disease, diabetes, cancer, and autoimmune conditions.

**Anti-inflammatory foods:**
- Fatty fish (omega-3 rich): Salmon, mackerel, sardines
- Colourful vegetables: Broccoli, bell peppers, spinach, kale
- Berries: Rich in anthocyanins — blueberries, strawberries, cherries
- Nuts and seeds: Walnuts, almonds, flaxseeds
- Olive oil: Extra virgin contains oleocanthal, a natural COX inhibitor
- Turmeric/curcumin: Potent anti-inflammatory compounds
- Green tea: EGCG polyphenols

**Pro-inflammatory foods to limit:**
- Sugar and refined carbohydrates
- Trans fats and seed oils high in omega-6
- Processed meats (hot dogs, deli meats)
- Excessive alcohol
- Fast food

Combining an anti-inflammatory diet with regular exercise, quality sleep, and stress management provides the most robust protection.`,
  },
];

const CATEGORIES = ["All", "Nutrition", "Fitness", "Health", "Mental Health"];

export default function GuidesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = ARTICLES.filter((a) =>
    (category === "All" || a.category === category) &&
    (a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.summary.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Health Guides</h1>
        <p className="text-slate-500 text-sm mt-1">Evidence-based articles on nutrition, fitness, and wellness</p>
      </div>

      {/* Search & filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search guides..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "px-3 py-2 rounded-xl text-sm font-medium transition-all",
                category === c ? "bg-emerald-500 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Articles", value: ARTICLES.length, icon: <BookOpen className="w-4 h-4 text-emerald-500" /> },
          { label: "Nutrition", value: ARTICLES.filter((a) => a.category === "Nutrition").length, icon: <Apple className="w-4 h-4 text-orange-500" /> },
          { label: "Fitness", value: ARTICLES.filter((a) => a.category === "Fitness").length, icon: <Dumbbell className="w-4 h-4 text-violet-500" /> },
          { label: "Health & Mind", value: ARTICLES.filter((a) => ["Health", "Mental Health"].includes(a.category)).length, icon: <Heart className="w-4 h-4 text-red-500" /> },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">{s.icon}</div>
              <div>
                <p className="text-lg font-bold text-slate-800">{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Articles */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-400">No articles match your search.</div>
        )}
        {filtered.map((article) => (
          <Card key={article.id} className={cn(expanded === article.id && "border-emerald-200")}>
            <div
              className="p-5 cursor-pointer"
              onClick={() => setExpanded(expanded === article.id ? null : article.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={cn(
                      "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
                      article.category === "Nutrition" ? "bg-orange-100 text-orange-700" :
                      article.category === "Fitness" ? "bg-violet-100 text-violet-700" :
                      article.category === "Mental Health" ? "bg-blue-100 text-blue-700" :
                      "bg-red-100 text-red-700"
                    )}>
                      {article.icon} {article.category}
                    </span>
                    <span className="text-xs text-slate-400">{article.readTime} read</span>
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-1">{article.title}</h3>
                  <p className="text-sm text-slate-500">{article.summary}</p>
                </div>
                <div className="shrink-0 mt-1">
                  {expanded === article.id
                    ? <ChevronUp className="w-5 h-5 text-slate-400" />
                    : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </div>
              </div>
            </div>
            {expanded === article.id && (
              <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                <div className="prose prose-sm max-w-none text-slate-700 space-y-3">
                  {article.content.split('\n\n').map((para, i) => (
                    <p key={i} className="text-sm text-slate-600 leading-relaxed">
                      {para.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                        j % 2 === 1 ? <strong key={j} className="text-slate-800">{part}</strong> : part
                      )}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
