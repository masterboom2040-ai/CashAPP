import React, { useState, useRef, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { Send, Sparkles, User, Brain, Plus } from "lucide-react";
import { ChatMessage } from "../types";
import { cn } from "../utils/cn";

const SUGGESTIONS = [
  "Analyze this month",
  "Compare last 2 months",
  "How to save more?",
  "Predict next month"
];

export default function ChatTab() {
  const { data, addTransaction, deleteTransaction } = useAppContext();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("cashapp_chat");
    return saved ? JSON.parse(saved) : [{
      id: "init", role: "assistant", content: "Hi! I'm your AI financial advisor. How can I help you understand your spending today?"
    }];
  });
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("cashapp_chat", JSON.stringify(messages));
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isTyping) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      let aiMsgContent = "I'm your offline assistant. I can answer basic questions! Try 'Analyze this month' or 'How to save more?'";
      const tLower = text.toLowerCase();
      
      // Compute expense stats
      const expenses = data.transactions.filter(t => t.type === 'expense');
      const totalEx = expenses.reduce((sum, item) => sum + item.amount, 0);
      
      if (tLower.includes("analyze") || tLower.includes("month") || tLower.includes("spending")) {
        aiMsgContent = `Your total expenses documented currently amount to ৳${totalEx.toLocaleString()}. You can verify the dashboard for a robust categorical breakdown.`;
      } else if (tLower.includes("save") || tLower.includes("how")) {
        if (expenses.length > 0) {
          const catTotals: Record<string, number> = {};
          expenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
          const highestCat = Object.keys(catTotals).reduce((a, b) => catTotals[a] > catTotals[b] ? a : b);
          aiMsgContent = `Your highest spending category is ${highestCat} at ৳${catTotals[highestCat].toLocaleString()}. I suggest carefully planning expenses there!`;
        } else {
           aiMsgContent = "You don't have any expenses documented yet! Let's log some first, and I will find saving tips for you.";
        }
      } else if (tLower.includes("compare") || tLower.includes("predict")) {
        aiMsgContent = "Unfortunately I can't look back into distant history right now. I advise reviewing the History tab for long term planning!";
      }

      const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: "assistant", content: aiMsgContent };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] sm:h-[600px] bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2 bg-blue-50/50 dark:bg-blue-900/10">
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 flex items-center justify-center">
          <Brain size={16} />
        </div>
        <div>
          <h2 className="font-bold text-sm">Fin-AI Advisor</h2>
          <p className="text-[10px] text-gray-500">Powered by Gemini</p>
        </div>
        <div className="ml-auto">
          <button 
            onClick={() => setMessages([{ id: "init", role: "assistant", content: "Started a new session. Let's talk money!" }])}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(m => (
          <div key={m.id} className={cn("flex gap-3", m.role === 'user' ? 'flex-row-reverse' : '')}>
            <div className={cn("w-8 h-8 rounded-full flex shrink-0 items-center justify-center", m.role === 'user' ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400')}>
              {m.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
            </div>
            <div className={cn(
              "p-3 rounded-2xl max-w-[80%] text-sm whitespace-pre-wrap leading-relaxed",
              m.role === "user" ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-tr-sm" : "bg-gray-50 dark:bg-gray-800 rounded-tl-sm border border-gray-100 dark:border-gray-700"
            )}>
              {m.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Sparkles size={14} className="animate-spin" />
            </div>
            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 rounded-tl-sm border border-gray-100 dark:border-gray-700 text-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts if empty */}
      {messages.length <= 1 && (
        <div className="p-4 flex gap-2 overflow-x-auto no-scrollbar border-t border-gray-50 dark:border-gray-800">
          {SUGGESTIONS.map((s, i) => (
            <button 
              key={i} 
              onClick={() => handleSend(s)}
              className="shrink-0 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-medium rounded-full transition-colors whitespace-nowrap"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form 
        onSubmit={e => { e.preventDefault(); handleSend(input); }} 
        className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800"
      >
        <div className="relative flex items-center">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about your finances..."
            className="w-full bg-gray-50 dark:bg-gray-800 py-3 pl-4 pr-12 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-full transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </form>

    </div>
  );
}
