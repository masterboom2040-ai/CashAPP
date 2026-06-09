import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { Sparkles, Check, Settings, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "../utils/cn";

export default function AddTab() {
  const { data, addTransaction, updateData } = useAppContext();
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState(data.categories[0]?.name || "Other");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [recurring, setRecurring] = useState(false);
  
  const [isExtracting, setIsExtracting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showManageCat, setShowManageCat] = useState(false);

  const [newCatName, setNewCatName] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("📦");

  const handleExtract = async () => {
    if (!note) return;
    setIsExtracting(true);
    
    setTimeout(() => {
      // Find amount (number)
      const amountMatch = note.match(/\d+(\.\d+)?/);
      if (amountMatch) {
        setAmount(amountMatch[0]);
      }
      
      // Find category
      const noteLower = note.toLowerCase();
      const foundCategory = data.categories.find(c => noteLower.includes(c.name.toLowerCase()));
      if (foundCategory) {
         setCategory(foundCategory.name);
      }
      
      // Simple logic for income/expense
      if (noteLower.includes("earned") || noteLower.includes("got") || noteLower.includes("income")) {
        setType("income");
        if (!foundCategory) setCategory("Income");
      }
      
      setIsExtracting(false);
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    
    addTransaction({
      id: Math.random().toString(36).substr(2, 9),
      type,
      amount: Number(amount),
      category: type === "income" ? "Income" : category,
      note,
      date,
      recurring
    });

    setAmount("");
    setNote("");
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleAddCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    updateData(prev => ({
      ...prev,
      categories: [...prev.categories, { name: newCatName.trim(), emoji: newCatEmoji || "📦" }]
    }));
    setNewCatName("");
  };

  const handleDeleteCat = (name: string) => {
    updateData(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.name !== name)
    }));
    if (category === name) {
      setCategory(data.categories.find(c => c.name !== name)?.name || "Other");
    }
  };

  if (showManageCat) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-lg">Manage Categories</h2>
          <button onClick={() => setShowManageCat(false)} className="text-sm text-blue-500 font-bold hover:text-blue-600">Done</button>
        </div>
        
        <form onSubmit={handleAddCat} className="flex gap-2">
          <input 
            type="text" 
            placeholder="Emoji" 
            value={newCatEmoji} 
            onChange={e => setNewCatEmoji(e.target.value)} 
            className="w-16 p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none text-center"
            maxLength={2}
          />
          <input 
            type="text" 
            placeholder="Category Name" 
            value={newCatName} 
            onChange={e => setNewCatName(e.target.value)} 
            className="flex-1 p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none text-sm"
          />
          <button type="submit" className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600"><Plus size={18} /></button>
        </form>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
          {data.categories.map(c => (
            <div key={c.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3 font-medium text-sm">
                <span>{c.emoji}</span> {c.name}
              </div>
              <button onClick={() => handleDeleteCat(c.name)} className="text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {data.categories.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No categories left.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Tops Toggles */}
      <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        <button 
          onClick={() => setType("expense")}
          className={cn(
            "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
            type === "expense" ? "bg-white dark:bg-gray-900 text-red-500 shadow-sm" : "text-gray-500"
          )}
        >
          Expense
        </button>
        <button 
          onClick={() => setType("income")}
          className={cn(
            "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
            type === "income" ? "bg-white dark:bg-gray-900 text-emerald-500 shadow-sm" : "text-gray-500"
          )}
        >
          Income
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
        
        {/* Amount */}
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-older text-center">Amount</label>
          <div className="relative flex justify-center">
            <span className="text-2xl font-medium text-gray-400 absolute left-4 top-1/2 -translate-y-1/2">৳</span>
            <input 
              type="number" 
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={cn(
                "w-full text-center text-5xl font-bold bg-transparent py-4 focus:outline-none transition-colors",
                type === "expense" ? "text-red-500" : "text-emerald-500"
              )}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* AI Note Input */}
        <div>
          <label className="block text-sm font-bold mb-2 flex justify-between items-center">
            <span>Description</span>
            <button 
              type="button"
              onClick={handleExtract}
              disabled={isExtracting || !note}
              className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full flex items-center gap-1 font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
            >
              <Sparkles size={10} /> {isExtracting ? "Extracting..." : "Auto-fill with AI"}
            </button>
          </label>
          <div className="relative">
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-4 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm resize-none"
              placeholder='e.g., "spent 500 on lunch with friends"'
              rows={2}
            />
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          {type === "expense" && (
            <div className="col-span-2 sm:col-span-1">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold">Category</label>
                <button type="button" onClick={() => setShowManageCat(true)} className="text-xs text-gray-400 hover:text-blue-500"><Settings size={14} /></button>
              </div>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none text-sm"
              >
                {data.categories.map(c => <option key={c.name} value={c.name}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
          )}
          
          <div className={type === "income" ? "col-span-2 sm:col-span-1" : "col-span-2 sm:col-span-1"}>
            <label className="block text-sm font-bold mb-2">Date</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            />
          </div>

          <div className="col-span-2 flex justify-between items-center bg-gray-50 dark:bg-gray-950 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
            <span className="text-sm font-bold">Recurring Monthly</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={recurring} onChange={e => setRecurring(e.target.checked)} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
            </label>
          </div>
        </div>

        <button 
          type="submit"
          className={cn(
            "w-full py-4 rounded-xl font-bold text-white transition-all active:scale-[0.98] flex justify-center items-center gap-2",
            type === "expense" ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600",
            showSuccess ? "bg-green-500 hover:bg-green-600" : ""
          )}
        >
          {showSuccess ? <><Check size={20} /> Added Successfully</> : "Save Transaction"}
        </button>

      </form>
    </div>
  );
}
