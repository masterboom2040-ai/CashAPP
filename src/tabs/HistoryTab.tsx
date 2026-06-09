import React, { useState, useMemo } from "react";
import { useAppContext } from "../context/AppContext";
import { Search, Download, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { cn } from "../utils/cn";

export default function HistoryTab() {
  const { data, deleteTransaction } = useAppContext();
  const [search, setSearch] = useState("");
  
  const months = Array.from(new Set(data.transactions.map(t => t.date.substring(0, 7)))).sort().reverse();
  const [selectedMonth, setSelectedMonth] = useState(months[0] || format(new Date(), "yyyy-MM"));

  const filteredData = useMemo(() => {
    return data.transactions.filter(t => {
      const matchMonth = t.date.startsWith(selectedMonth);
      const matchSearch = (t.note || "").toLowerCase().includes(search.toLowerCase()) || 
                          t.category.toLowerCase().includes(search.toLowerCase());
      return matchMonth && matchSearch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.transactions, selectedMonth, search]);

  const totalIn = filteredData.filter(t => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
  const totalOut = filteredData.filter(t => t.type === "expense").reduce((acc, t) => acc + t.amount, 0);
  const net = totalIn - totalOut;

  // Chart data: sums per day
  const dailyDataMap = filteredData.reduce((acc, t) => {
    if (t.type === "expense") {
      const day = t.date.split("-")[2];
      acc[day] = (acc[day] || 0) + t.amount;
    }
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(dailyDataMap).map(([day, amount]) => ({ day, amount })).sort((a, b) => Number(a.day) - Number(b.day));

  const exportCSV = () => {
    const header = "Date,Type,Category,Amount,Note,Recurring\\n";
    const rows = filteredData.map(t => [t.date, t.type, t.category, t.amount, '"' + (t.note || '') + '"', t.recurring].join(',')).join("\\n");
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "cashapp_" + selectedMonth + ".csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Month & Search */}
      <div className="flex gap-2">
        <select 
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-bold min-w-[120px]"
        >
          {months.length === 0 && <option value={selectedMonth}>{selectedMonth}</option>}
          {months.map(m => <option key={m} value={m}>{format(parseISO(m + "-01"), "MMM yyyy")}</option>)}
        </select>
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">In</p>
          <p className="text-sm font-bold text-emerald-500">৳{totalIn.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Out</p>
          <p className="text-sm font-bold text-red-500">৳{totalOut.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Net</p>
          <p className={cn("text-sm font-bold", net >= 0 ? "text-emerald-500" : "text-red-500")}>
            {net >= 0 ? '+' : ''}৳{net.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 4px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="amount" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Transactions */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex-1">
        <div className="p-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-sm">Transactions</h3>
          <button onClick={exportCSV} className="text-blue-500 hover:text-blue-600 flex items-center gap-1 text-xs font-bold">
            <Download size={14} /> Export CSV
          </button>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-[50vh] overflow-y-auto">
          {filteredData.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500 font-medium">No transactions found.</div>
          ) : (
            filteredData.map(tx => (
              <div key={tx.id} className="p-4 flex items-center justify-between group">
                <div>
                  <p className="font-bold text-sm flex items-center gap-2">
                    {tx.category} {tx.recurring && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">R</span>}
                  </p>
                  <p className="text-xs text-gray-500 max-w-[200px] truncate">{tx.note || (tx.type === 'expense' ? 'Expense' : 'Income')}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{format(parseISO(tx.date), 'MMM d, yyyy')}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className={cn("font-bold text-sm", tx.type === "income" ? "text-emerald-500" : "")}>
                    {tx.type === "income" ? "+" : "-"}৳{tx.amount.toLocaleString()}
                  </p>
                  <button onClick={() => deleteTransaction(tx.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
