import React, { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { format, subDays, startOfMonth, subMonths } from 'date-fns';
import { Sparkles, RefreshCw, ArrowUpRight, ArrowDownRight, TrendingDown, TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import { cn } from "../utils/cn";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

export default function DashboardTab() {
  const { data } = useAppContext();
  const [aiTip, setAiTip] = useState("");
  const [loadingTip, setLoadingTip] = useState(false);

  // Map category names to emojis based on AppData
  const CATEGORY_EMOJIS = data.categories.reduce((acc, cat) => ({...acc, [cat.name]: cat.emoji}), {} as Record<string, string>);

  const currentMonthStr = format(new Date(), 'yyyy-MM');
  const lastMonthStr = format(subMonths(new Date(), 1), 'yyyy-MM');

  const currentMonthData = data.monthly_memory.find(m => m.month === currentMonthStr) || { total_spent: 0, breakdown: {} };
  const lastMonthData = data.monthly_memory.find(m => m.month === lastMonthStr) || { total_spent: 0, breakdown: {} };

  const spentDiff = currentMonthData.total_spent - lastMonthData.total_spent;
  const spentDiffPercent = lastMonthData.total_spent === 0 ? 0 : (spentDiff / lastMonthData.total_spent) * 100;

  const pieData = Object.entries(currentMonthData.breakdown).map(([name, value]) => ({ name, value: value as number })).filter(item => item.value > 0);

  const recentTransactions = [...data.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const fetchTip = async () => {
    setLoadingTip(true);
    setTimeout(() => {
      let tipMessage = "Keep a close eye on your spending to achieve your financial goals!";
      const expenses = data.transactions.filter(t => t.type === 'expense');
      
      if (expenses.length > 0) {
        const catTotals: Record<string, number> = {};
        expenses.forEach(e => {
          catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
        });
        const highestCat = Object.keys(catTotals).reduce((a, b) => catTotals[a] > catTotals[b] ? a : b);
        tipMessage = `You've spent the most on ${highestCat} recently (৳${catTotals[highestCat]}). Consider reducing expenses here to save more!`;
      }
      
      setAiTip(tipMessage);
      setLoadingTip(false);
    }, 600);
  };

  useEffect(() => {
    // Intentionally left blank to avoid automatic AI calls that consume quota.
    // User must explicitly click the refresh button to get an AI tip.
  }, []);

  // Check budgets
  const budgetWarnings = Object.entries(data.budgets).filter(([cat, rawLimit]) => {
    const limit = rawLimit as number;
    if (limit <= 0) return false;
    const spent = (currentMonthData.breakdown[cat] as number) || 0;
    return (spent / limit) >= 0.8;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Warning Banners */}
      {budgetWarnings.map(([cat]) => (
        <div key={cat} className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl flex items-center gap-2 text-sm font-medium border border-red-100 dark:border-red-900">
          ⚠️ You are nearing or over your budget for {CATEGORY_EMOJIS[cat]} {cat}!
        </div>
      ))}

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-white dark:to-gray-200 p-6 rounded-3xl text-white dark:text-gray-900 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <PieChartIcon size={120} />
        </div>
        <p className="text-gray-400 dark:text-gray-500 font-medium mb-1 relative z-10">Current Balance</p>
        <h2 className="text-4xl font-bold tracking-tight relative z-10">৳ {data.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
        
        <div className="mt-6 flex flex-wrap gap-4 items-end justify-between relative z-10">
          <div>
            <p className="text-gray-400 dark:text-gray-500 text-xs font-medium">Spent This Month</p>
            <p className="text-xl font-semibold">৳ {currentMonthData.total_spent.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <div className={cn("flex items-center gap-1 text-sm font-medium", spentDiff <= 0 ? "text-emerald-400 dark:text-emerald-600" : "text-red-400 dark:text-red-600")}>
              {spentDiff <= 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
              {Math.abs(spentDiffPercent).toFixed(1)}% vs last month
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Chart & AI Tip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chart */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center">
          <h3 className="text-sm font-bold w-full mb-4">Spending by Category</h3>
          {pieData.length > 0 ? (
            <div className="h-40 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={"cell-" + index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => "৳ " + value.toLocaleString()}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-40 w-full flex items-center justify-center text-gray-400 text-sm">
              No expenses this month
            </div>
          )}
        </div>

        {/* AI Tip */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-900 relative">
          <div className="flex justify-between items-center mb-3 text-blue-600 dark:text-blue-400">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Sparkles size={16} /> AI Tip
            </h3>
            <button onClick={fetchTip} disabled={loadingTip} className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition-colors disabled:opacity-50">
              <RefreshCw size={14} className={loadingTip ? 'animate-spin' : ''} />
            </button>
          </div>
          <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed min-h-[60px]">
            {loadingTip ? "Analyzing your past 30 days..." : (aiTip || "Add some transactions to get personalized tips!")}
          </p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <h3 className="text-sm font-bold mb-3 px-1">Recent Transactions</h3>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800 overflow-hidden shadow-sm">
          {recentTransactions.length > 0 ? recentTransactions.map(tx => (
            <div key={tx.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-lg">
                  {CATEGORY_EMOJIS[tx.category] || "📦"}
                </div>
                <div>
                  <p className="font-medium text-sm">{tx.category}</p>
                  <p className="text-xs text-gray-500">{tx.note || (tx.type === 'expense' ? 'Expense' : 'Income')}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn("font-bold text-sm", tx.type === "income" ? "text-emerald-500" : "")}>
                  {tx.type === "income" ? "+" : "-"}৳{tx.amount.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-500">{format(new Date(tx.date), 'MMM d')}</p>
              </div>
            </div>
          )) : (
            <div className="p-6 text-center text-sm text-gray-500">No transactions yet.</div>
          )}
        </div>
      </div>

    </div>
  );
}
