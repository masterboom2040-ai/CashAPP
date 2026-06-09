import React, { useState } from "react";
import { AppProvider, useAppContext } from "./context/AppContext";
import { Moon, Sun, Home, PlusCircle, History, Sparkles, PieChart } from "lucide-react";
import { cn } from "./utils/cn";
import DashboardTab from "./tabs/DashboardTab";
import AddTab from "./tabs/AddTab";
import HistoryTab from "./tabs/HistoryTab";
import ChatTab from "./tabs/ChatTab";
import BudgetTab from "./tabs/BudgetTab";
import { motion, AnimatePresence } from "motion/react";

function Splash() {
  return (
    <motion.div 
       className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50 dark:bg-gray-950"
       initial={{ opacity: 1 }}
       exit={{ opacity: 0 }}
       transition={{ duration: 0.5 }}
    >
      <motion.div 
         initial={{ scale: 0.8, opacity: 0 }}
         animate={{ scale: 1, opacity: 1 }}
         transition={{ duration: 0.5, delay: 0.2 }}
         className="text-center"
      >
        <div className="text-6xl mb-4">💵</div>
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-emerald-400 to-emerald-600 text-transparent bg-clip-text">CashApp</h1>
      </motion.div>
    </motion.div>
  )
}

function Shell() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { theme, toggleTheme, data, updateData } = useAppContext();
  const [showSplash, setShowSplash] = useState(true);
  const [isNewUser, setIsNewUser] = useState(() => {
    return localStorage.getItem("cashapp_data") === null;
  });
  const [startBalance, setStartBalance] = useState("");

  React.useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(t);
  }, []);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const bal = parseFloat(startBalance);
    if (!isNaN(bal)) {
      updateData({ balance: bal });
      setIsNewUser(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showSplash && <Splash />}
      </AnimatePresence>
      {!showSplash && (
        isNewUser ? (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex items-center justify-center p-6 transition-colors">
            {/* Same login screen content */}
            <div className="max-w-md w-full bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
              <h1 className="text-3xl font-bold mb-2 tracking-tight">Welcome to CashApp 💵</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-8">Let's start by setting your current bank balance.</p>
              <form onSubmit={handleStart} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Initial Balance (BDT)</label>
                  <div className="relative relative-flex items-center">
                    <span className="absolute left-4 text-gray-500 font-medium">৳</span>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      value={startBalance}
                      onChange={(e) => setStartBalance(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <button className="w-full py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-200 active:scale-[0.98] transition-all">
                  Get Started
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col transition-colors pb-20 sm:pb-0">
            {/* Nav & Header content */}
            <header className="px-6 py-4 flex justify-between items-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 hidden sm:flex">
              <div className="font-bold text-xl tracking-tight flex items-center gap-2">
                <span className="bg-gradient-to-br from-emerald-400 to-emerald-600 text-transparent bg-clip-text">CashApp</span>
              </div>
              <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
              </button>
            </header>

            {/* Mobile Header */}
            <header className="px-4 py-3 flex justify-between items-center sm:hidden">
              <h1 className="font-semibold text-lg tracking-tight">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h1>
              <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
              </button>
            </header>

            <main className="flex-1 w-full max-w-lg sm:max-w-3xl mx-auto p-4 sm:p-6 w-full">
              {activeTab === "dashboard" && <DashboardTab />}
              {activeTab === "add" && <AddTab />}
              {activeTab === "history" && <HistoryTab />}
              {activeTab === "chat" && <ChatTab />}
              {activeTab === "budget" && <BudgetTab />}
            </main>

            {/* Mobile Bottom Nav */}
            <nav className="fixed bottom-0 w-full bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex justify-around p-2 pb-safe sm:hidden z-50">
              <NavItem active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} icon={<Home />} label="Dash" />
              <NavItem active={activeTab === "history"} onClick={() => setActiveTab("history")} icon={<History />} label="History" />
              <div className="-mt-8">
                <button 
                  onClick={() => setActiveTab("add")}
                  className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all text-white p-4 rounded-full shadow-lg shadow-emerald-500/30"
                >
                  <PlusCircle size={28} />
                </button>
              </div>
              <NavItem active={activeTab === "budget"} onClick={() => setActiveTab("budget")} icon={<PieChart />} label="Budget" />
              <NavItem active={activeTab === "chat"} onClick={() => setActiveTab("chat")} icon={<Sparkles />} label="AI Chat" />
            </nav>

            {/* Desktop Side/Top Nav Simulation - For this SPA, we just put it bottom or top. Up above is a top nav. Let's add desktop variant of the tabs */}
            <div className="hidden sm:flex fixed bottom-8 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 p-2 rounded-full shadow-xl border border-gray-100 dark:border-gray-800 gap-2 items-center">
              <NavItem active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} icon={<Home size={20} />} label="Dash" />
              <NavItem active={activeTab === "history"} onClick={() => setActiveTab("history")} icon={<History size={20} />} label="History" />
              <button 
                  onClick={() => setActiveTab("add")}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-medium transition-all mx-2 shadow-sm"
                >
                  <PlusCircle size={20} /> Add
                </button>
              <NavItem active={activeTab === "budget"} onClick={() => setActiveTab("budget")} icon={<PieChart size={20} />} label="Budget" />
              <NavItem active={activeTab === "chat"} onClick={() => setActiveTab("chat")} icon={<Sparkles size={20} />} label="AI Chat" />
            </div>

          </div>
        )
      )}
    </>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick} 
      className={cn(
        "flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-w-[64px]",
        active ? "text-emerald-500" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      )}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
