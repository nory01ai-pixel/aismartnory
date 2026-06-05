/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Send, MapPin, Sparkles, Compass, AlertCircle, RefreshCw, Smile, Landmark } from "lucide-react";
import { Itinerary, Message } from "../types";
import { translations } from "../translations";

interface TravelChatProps {
  lang: "ar" | "en";
  activeItinerary: Itinerary | null;
}

export default function TravelChat({ lang, activeItinerary }: TravelChatProps) {
  const t = translations[lang];
  const scrollRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize companion with welcome message suited for active context
  useEffect(() => {
    const welcomeText = activeItinerary
      ? `${t.chatWelcome} ${activeItinerary.destinationName} (${activeItinerary.country})`
      : t.chatNoTripYet;
      
    setMessages([
      {
        role: "model",
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString(lang === "ar" ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  }, [activeItinerary, lang]);

  // Adjust scroll when new messages land
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsgText = input.trim();
    setInput("");

    // Push local message immediately
    const userMessage: Message = {
      role: "user",
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString(lang === "ar" ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" })
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            text: m.text
          })),
          currentTripContext: activeItinerary,
          lang
        }),
      });

      if (!response.ok) {
        throw new Error("Chat connection failed");
      }

      const data = await response.json();
      
      setMessages(prev => [
        ...prev,
        {
          role: "model",
          text: data.text,
          isOfflineFallback: data.isOfflineFallback,
          timestamp: new Date().toLocaleTimeString(lang === "ar" ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          role: "model",
          text: lang === "ar" 
            ? "عذراً، تعذر الإتصال بمرشد السفر حالياً. يرجى محاولة السؤال مرة أخرى." 
            : "Apologies! Communication failed with your travel advisor. Please shoot your question once more.",
          timestamp: new Date().toLocaleTimeString(lang === "ar" ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8" id="travel-chat-component">
      <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm flex flex-col h-[600px]">
        {/* Header */}
        <div className="border-b border-slate-100 pb-5 mb-5 space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h2 className="text-xl font-bold text-slate-800">{t.chatTitle}</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">{t.chatSubtitle}</p>
        </div>

        {/* Conversation Hub */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-4 px-1 pr-2 scrollbar-none"
        >
          {messages.map((msg, index) => {
            const isModel = msg.role === "model";
            return (
              <div 
                key={index}
                className={`flex gap-3 max-w-[85%] ${
                  isModel ? "self-start text-left" : "ml-auto flex-row-reverse text-right"
                }`}
              >
                {/* Visual Avatar */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border text-xs font-bold ${
                  isModel 
                    ? "bg-indigo-50 text-indigo-700 border-indigo-100/40" 
                    : "bg-slate-900 text-white border-slate-800"
                }`}>
                  {isModel ? "AI" : "ME"}
                </div>

                <div className="space-y-1">
                  <div className={`p-4 rounded-2xl text-sm font-semibold leading-relaxed shadow-sm ${
                    isModel 
                      ? "bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100" 
                      : "bg-indigo-600 text-white rounded-tr-none"
                  }`}>
                    {/* Render paragraphs cleanly */}
                    <div className="whitespace-pre-wrap break-words">
                      {msg.text}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 px-1.5">
                    <span className="text-[10px] text-slate-400 font-semibold block">
                      {msg.timestamp}
                    </span>
                    {msg.isOfflineFallback && (
                      <span className="text-[9px] text-amber-600 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/15 whitespace-nowrap">
                        🔌 {lang === "ar" ? "نظام احتياطي محلي" : "Local Backup"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 max-w-[85%] self-start">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100/40 flex items-center justify-center text-xs font-bold animate-pulse">
                AI
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl rounded-tl-none text-xs font-bold flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-150"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-300"></div>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder={t.chatPlaceholder}
            className="flex-1 h-12 px-4 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 text-sm font-semibold text-slate-800 transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-12 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white flex items-center justify-center transition-all cursor-pointer grow-0 shrink-0"
          >
            <Send className="w-4 h-4 translate-x-[1px] -translate-y-[1px]" />
          </button>
        </form>
      </div>
    </div>
  );
}
