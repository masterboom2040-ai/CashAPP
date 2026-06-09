import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AppData, Transaction } from "../types";
import { loadData, saveData, recalculateMonthlyMemory } from "../utils/storage";

interface AppContextType {
  data: AppData;
  updateData: (newData: Partial<AppData> | ((prev: AppData) => AppData)) => void;
  addTransaction: (tx: Transaction) => void;
  updateTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<AppData>(loadData());
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Initial calculate
    setData(prev => recalculateMonthlyMemory(prev));
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  const updateData = (newData: Partial<AppData> | ((prev: AppData) => AppData)) => {
    setData(prev => {
      const next = typeof newData === "function" ? newData(prev) : { ...prev, ...newData };
      const finalized = recalculateMonthlyMemory(next);
      saveData(finalized);
      return finalized;
    });
  };

  const addTransaction = (tx: Transaction) => {
    updateData(prev => {
      const newBalance = tx.type === "expense" ? prev.balance - tx.amount : prev.balance + tx.amount;
      return {
        ...prev,
        balance: newBalance,
        transactions: [...prev.transactions, tx]
      };
    });
  };

  const deleteTransaction = (id: string) => {
    updateData(prev => {
      const tx = prev.transactions.find(t => t.id === id);
      if (!tx) return prev;
      const newBalance = tx.type === "expense" ? prev.balance + tx.amount : prev.balance - tx.amount;
      return {
        ...prev,
        balance: newBalance,
        transactions: prev.transactions.filter(t => t.id !== id)
      };
    });
  };

  const updateTransaction = (tx: Transaction) => {
    updateData(prev => {
      const oldTx = prev.transactions.find(t => t.id === tx.id);
      if (!oldTx) return prev;
      
      const balanceWithoutOld = oldTx.type === "expense" ? prev.balance + oldTx.amount : prev.balance - oldTx.amount;
      const newBalance = tx.type === "expense" ? balanceWithoutOld - tx.amount : balanceWithoutOld + tx.amount;

      return {
        ...prev,
        balance: newBalance,
        transactions: prev.transactions.map(t => (t.id === tx.id ? tx : t))
      };
    });
  };

  return (
    <AppContext.Provider value={{ data, updateData, addTransaction, deleteTransaction, updateTransaction, theme, toggleTheme }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};
