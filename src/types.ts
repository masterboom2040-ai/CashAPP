export interface Category {
  name: string;
  emoji: string;
}

export interface Transaction {
  id: string;
  type: "expense" | "income";
  amount: number;
  category: string;
  note: string;
  date: string; // YYYY-MM-DD
  recurring: boolean;
}

export interface MonthData {
  month: string; // YYYY-MM
  total_spent: number;
  breakdown: Record<string, number>;
}

export interface AppData {
  balance: number;
  transactions: Transaction[];
  budgets: Record<string, number>;
  monthly_memory: MonthData[];
  categories: Category[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

