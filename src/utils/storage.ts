import { AppData, Transaction } from "../types";

const STORAGE_KEY = "cashapp_data";

export const defaultData: AppData = {
  balance: 0,
  transactions: [],
  budgets: {
    Food: 0,
    Transport: 0,
    Shopping: 0,
    Utilities: 0,
    Health: 0,
    Entertainment: 0,
    Education: 0,
    Other: 0,
  },
  monthly_memory: [],
  categories: [
    { name: "Food", emoji: "🍔" },
    { name: "Transport", emoji: "🚌" },
    { name: "Shopping", emoji: "🛍️" },
    { name: "Utilities", emoji: "💡" },
    { name: "Health", emoji: "🏥" },
    { name: "Entertainment", emoji: "🎬" },
    { name: "Education", emoji: "📚" },
    { name: "Other", emoji: "📦" }
  ],
};

export function loadData(): AppData {
  const dataStr = localStorage.getItem(STORAGE_KEY);
  if (!dataStr) return { ...defaultData, isNewUser: true } as AppData & { isNewUser?: boolean };
  try {
    const data = JSON.parse(dataStr);
    return { ...defaultData, ...data, categories: data.categories || defaultData.categories };
  } catch (e) {
    return { ...defaultData };
  }
}

export function saveData(data: AppData) {
  // make a deep copy before saving if needed, but AppData works fine
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Ensure the month memory is updated when saving
export function calculateMonthData(transactions: Transaction[], targetMonth: string) {
  const monthTxs = transactions.filter(t => t.date.startsWith(targetMonth) && t.type === 'expense');
  let totalSpent = 0;
  const breakdown: Record<string, number> = {};
  
  monthTxs.forEach(t => {
    totalSpent += t.amount;
    breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
  });

  return { targetMonth, totalSpent, breakdown };
}

export function recalculateMonthlyMemory(data: AppData): AppData {
  const months = Array.from(new Set(data.transactions.map(t => t.date.substring(0, 7))));
  
  const newMemory = months.map(m => {
    const { totalSpent, breakdown } = calculateMonthData(data.transactions, m);
    return {
      month: m,
      total_spent: totalSpent,
      breakdown,
    };
  });

  return { ...data, monthly_memory: newMemory };
}
