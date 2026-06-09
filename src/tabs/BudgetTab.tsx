import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { Sparkles, Save, Edit2 } from "lucide-react";
import { format, subMonths } from "date-fns";
import { cn } from "../utils/cn";

export default function BudgetTab() {
  const { data, updateData } = useAppContext();
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isSuggesting, setIsSuggesting] = useState(false);

  const CATEGORY_EMOJIS = data.categories.reduce((acc, cat) => ({...acc, [cat.name]: cat.emoji}), {} as Record<string, string>);

  const [savingsGoal, setSavingsGoal] = useState<number>(() => {
    return Number(localStorage.getItem("cashapp_savings_goal") || 0);
  });
  const [editingGoal, setEditingGoal] = useState(false);

  const currentMonthStr = format(new Date(), 'yyyy-MM');
  const currentMonthData = data.monthly_memory.find(m => m.month === currentMonthStr) || { total_spent: 0, breakdown: {} };

  const handleSaveBudget = (cat: string) => {
    const num = Number(editValue);
    if (!isNaN(num)) {
      updateData(prev => ({ ...prev, budgets: { ...prev.budgets, [cat]: num } }));
    }
    setEditingCat(null);
  };

  const handleSaveGoal = () => {
    localStorage.setItem("cashapp_savings_goal", savingsGoal.toString());
    setEditingGoal(false);
  };

  const suggestBudgets = async () => {
    setIsSuggesting(true);
    setTimeout(() => {
      // Get last 3 months data
      const past3 = [
        format(subMonths(new Date(), 1), 'yyyy-MM'),
        format(subMonths(new Date(), 2), 'yyyy-MM'),
        format(subMonths(new Date(), 3), 'yyyy-MM'),
      ].map(m => data.monthly_memory.find(d => d.month === m)?.breakdown || {});

      // Calculate averages locally
      const suggested: Record<string, number> = {};
      const allKeys = new Set<string>();
      
      past3.forEach(monthBreakdown => {
        Object.keys(monthBreakdown).forEach(k => allKeys.add(k));
      });

      allKeys.forEach(key => {
        let sum = 0;
        let count = 0;
        past3.forEach(month => {
          if (month[key]) {
            sum += month[key];
            count++;
          }
        });
        if (count > 0) {
           suggested[key] = Math.round(sum / count);
        }
      });

      if (Object.keys(suggested).length > 0) {
        updateData(prev => ({ ...prev, budgets: { ...prev.budgets, ...suggested } }));
      } else {
        alert("Not enough historical data to calculate a robust suggestion.");
      }
      setIsSuggesting(false);
    }, 800);
  };

  // Savings math
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const currentDay = new Date().getDate();
  const daysLeft = daysInMonth - currentDay + 1;
  const currentIncome = data.transactions.filter(t => t.date.startsWith(currentMonthStr) && t.type === 'income').reduce((a, b) => a + b.amount, 0);
  const projectedSavings = currentIncome - currentMonthData.total_spent;
  const neededPerDay = savingsGoal > 0 && daysLeft > 0 ? (savingsGoal - projectedSavings) / daysLeft : 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header & Suggest Button */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Monthly Budget</h2>
          <p className="text-sm text-gray-500">Plan your spending limits</p>
        </div>
        <button 
          onClick={suggestBudgets}
          disabled={isSuggesting}
          className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl text-xs font-bold font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {isSuggesting ? <span className="animate-pulse">Thinking...</span> : <><Sparkles size={14} /> AI Suggest</>}
        </button>
      </div>

      {/* Savings Goal Card */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Savings Goal</h3>
            {editingGoal ? (
              <div className="flex bg-white/20 rounded p-1">
                <input 
                  type="number" 
                  value={savingsGoal}
                  onChange={e => setSavingsGoal(Number(e.target.value))}
                  className="w-20 bg-transparent outline-none text-right font-bold"
                />
                <button onClick={handleSaveGoal} className="ml-2 hover:text-emerald-200"><Save size={16} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2 font-bold cursor-pointer hover:text-emerald-200" onClick={() => setEditingGoal(true)}>
                ৳{savingsGoal.toLocaleString()} <Edit2 size={12} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-emerald-100 text-xs">Projected Net This Month</p>
              <p className={cn("text-lg font-bold", projectedSavings < 0 ? "text-red-200" : "")}>৳{projectedSavings.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-emerald-100 text-xs">Need to save / day</p>
              <p className="text-lg font-bold">
                {savingsGoal === 0 ? "Set a goal!" : (neededPerDay <= 0 ? "Goal Met! 🎉" : "৳" + Math.max(0, neededPerDay).toFixed(0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Budget List */}
      <div className="space-y-4">
        {Object.entries(data.budgets).map(([cat, rawLimit]) => {
          const limit = rawLimit as number;
          const spent = (currentMonthData.breakdown[cat] as number) || 0;
          const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
          const isOver = spent > limit && limit > 0;

          return (
            <div key={cat} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <span>{CATEGORY_EMOJIS[cat]}</span> {cat}
                </div>
                {editingCat === cat ? (
                  <div className="flex items-center gap-1">
                    <input 
                      type="number" 
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      className="w-20 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-xs focus:outline-none dark:bg-gray-800"
                      autoFocus
                    />
                    <button onClick={() => handleSaveBudget(cat)} className="p-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700"><Check size={14} /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-medium cursor-pointer" onClick={() => { setEditingCat(cat); setEditValue(limit.toString()); }}>
                    <span className="text-gray-500">
                      ৳{spent.toLocaleString()} / <span className="font-bold text-gray-900 dark:text-white">৳{limit.toLocaleString()}</span>
                    </span>
                    <Edit2 size={12} className="text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
                <div 
                  className={cn("h-full rounded-full transition-all", isOver ? "bg-red-500" : pct > 80 ? "bg-yellow-500" : "bg-emerald-500")} 
                  style={{ width: pct + "%" }}
                />
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

// Local helper to avoid extra import
function Check({ size, className }: { size: number, className?: string }) {
  return <Save size={size} className={className} />;
}
