/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Sparkles, 
  AlertCircle, 
  Mic, 
  MicOff, 
  Image as ImageIcon, 
  X, 
  History, 
  PlusCircle, 
  Trash2, 
  MessageSquare,
  Compass
} from "lucide-react";
import { Itinerary, Message } from "../types";
import { translations } from "../translations";

interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
  messages: Message[];
}

interface TravelChatProps {
  lang: "ar" | "en";
  activeItinerary: Itinerary | null;
}

export default function TravelChat({ lang, activeItinerary }: TravelChatProps) {
  const t = translations[lang];
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [recognitionRef, setRecognitionRef] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Multimodal image attachment
  const [attachedImage, setAttachedImage] = useState<{ mimeType: string; data: string } | null>(null);

  // Chat sessions state with local storage persistence (offline caching)
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem("fos7a_chat_sessions");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to load chat sessions:", e);
    }
    return [];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem("fos7a_current_session_id");
      return savedId || "";
    } catch {
      return "";
    }
  });

  // Keep track of current session ID in localStorage
  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem("fos7a_current_session_id", currentSessionId);
    } else {
      localStorage.removeItem("fos7a_current_session_id");
    }
  }, [currentSessionId]);

  // Persist sessions on update
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("fos7a_chat_sessions", JSON.stringify(sessions));
    } else {
      localStorage.removeItem("fos7a_chat_sessions");
    }
  }, [sessions]);

  // Initialize or align default session
  useEffect(() => {
    if (sessions.length === 0) {
      const welcomeTextAr = activeItinerary
        ? `${t.chatWelcome || "مرحباً بك! أنا مرشد السفر الذكي الخاص بك لكافة استفسارات رحلتك. وجهتك الحالية هي:"} ${activeItinerary.destinationName} (${activeItinerary.country})`
        : t.chatNoTripYet || "سعيد بخدمتك! بعد تخطيط رحلتك، سأتمكن من الإجابة بدقة مع تفاصيل وجهتك وأنشطتك الحالية.";
      const welcomeTextEn = activeItinerary
        ? `Welcome! I am your AI travel companion for your trip to ${activeItinerary.destinationName} (${activeItinerary.country}).`
        : "Glad to serve you! Once your trip is planned, I can give answers aligned with your schedule.";

      const initialSession: ChatSession = {
        id: "session-1",
        title: activeItinerary
          ? (lang === "ar" ? `رحلة ${activeItinerary.destinationName}` : `Trip to ${activeItinerary.destinationName}`)
          : (lang === "ar" ? "استشارة سياحية" : "Interactive Guide"),
        timestamp: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        messages: [
          {
            role: "model",
            text: lang === "ar" ? welcomeTextAr : welcomeTextEn,
            timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
          }
        ]
      };
      setSessions([initialSession]);
      setCurrentSessionId(initialSession.id);
    } else if (!currentSessionId && sessions.length > 0) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [activeItinerary, lang, sessions, currentSessionId, t]);

  const activeSession = sessions.find((s) => s.id === currentSessionId);
  const messages = activeSession ? activeSession.messages : [];

  // Update scroll when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleCreateNewSession = () => {
    const welcomeAr = activeItinerary
      ? `مرحباً بك مجدداً في نبض المساعد السياحي! **فسحةdz تتمنى لكم رحلة ممتعة وسعيدة!** 🌴✨ أنا هنا لتيسير إقامتكم في ${activeItinerary.destinationName}.`
      : "مرحباً بك! **فسحةdz تتمنى لكم رحلة ممتعة وسعيدة!** 🌴✨ اسألني عن أي معالم سياحية أو خدمات.";
    const welcomeEn = activeItinerary
      ? `Welcome back to your travel dashboard! **Fos7a DZ wishes you an enjoyable and happy trip!** 🌴✨ I am ready to guide you in ${activeItinerary.destinationName}.`
      : "Hello! **Fos7a DZ wishes you an enjoyable and highly pleasant trip!** 🌴✨ How can I assist you today?";

    const newSession: ChatSession = {
      id: "session-" + Date.now(),
      title: activeItinerary
        ? (lang === "ar" ? `مساعد: ${activeItinerary.destinationName} (${sessions.length + 1})` : `Guide: ${activeItinerary.destinationName} (${sessions.length + 1})`)
        : (lang === "ar" ? `محادثة رقم ${sessions.length + 1}` : `Conversation ${sessions.length + 1}`),
      timestamp: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      messages: [
        {
          role: "model",
          text: lang === "ar" ? welcomeAr : welcomeEn,
          timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
        }
      ]
    };

    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newSession.id);
  };

  const handleDeleteSession = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== idToDelete);
    setSessions(updated);
    if (currentSessionId === idToDelete) {
      if (updated.length > 0) {
        setCurrentSessionId(updated[0].id);
      } else {
        setCurrentSessionId("");
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert(lang === "ar" ? "يرجى اختيار صورة صالحة فقط." : "Please select a valid image file only.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAttachedImage({
          mimeType: file.type,
          data: reader.result,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef) {
        recognitionRef.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Fallback: prompt user to use system keyboard mic
      alert(
        lang === "ar"
          ? "ميزة الإدخال الصوتي غير مدعومة في هذا المتصفح.\n\nيمكنك استخدام ميزة الإملاء في لوحة مفاتيح هاتفك (🎤) لتحويل صوتك إلى نص مباشرة في حقل الإدخال."
          : "Speech-to-text is not supported in this browser.\n\nTip: Use your phone's keyboard microphone button (🎤) to dictate directly into the text field."
      );
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = lang === "ar" ? "ar-DZ" : "en-US";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech error", e);
        setIsListening(false);
        if (e.error === "not-allowed") {
          alert(
            lang === "ar"
              ? "تم رفض الإذن بالوصول للميكروفون.\nيرجى السماح بالوصول من إعدادات المتصفح."
              : "Microphone access denied.\nPlease allow microphone access in your browser settings."
          );
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.start();
      setRecognitionRef(rec);
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachedImage) || loading || !currentSessionId) return;

    const textPayload = input.trim();
    const imagePayload = attachedImage;
    setInput("");
    setAttachedImage(null);

    const userMessage: Message = {
      role: "user",
      text: textPayload || (lang === "ar" ? "معاينة وتحليل هذه الصورة" : "Analyze this attached image"),
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
      image: imagePayload || undefined
    };

    // Update active session locally
    const updatedMessages = [...messages, userMessage];
    const updatedSessions = sessions.map((s) => {
      if (s.id === currentSessionId) {
        return { ...s, messages: updatedMessages };
      }
      return s;
    });

    setSessions(updatedSessions);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            text: m.text,
            image: m.image ? { mimeType: m.image.mimeType, data: m.image.data } : null
          })),
          currentTripContext: activeItinerary,
          lang,
        }),
      });

      if (!response.ok) {
        throw new Error("Chat response failure");
      }

      const data = await response.json();

      const botMessage: Message = {
        role: "model",
        text: data.text,
        isOfflineFallback: data.isOfflineFallback,
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === currentSessionId) {
            return { ...s, messages: [...s.messages, botMessage] };
          }
          return s;
        })
      );
    } catch (err) {
      console.error("Chat error:", err);
      const errMessage: Message = {
        role: "model",
        text: lang === "ar"
          ? "عذراً، لم أتمكن من معالجة طلبك حالياً. يرجى مراجعة إعدادات الإنترنت وإعادة التشغيل."
          : "Apologies, I couldn't reach the server. Please verify your connection or retry shortly.",
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === currentSessionId) {
            return { ...s, messages: [...s.messages, errMessage] };
          }
          return s;
        })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" id="travel-chat-workspace">
      {/* Wishing Banner from Fos7a DZ */}
      <div className="bg-gradient-to-r from-teal-50 to-indigo-50 border border-teal-100/60 p-4 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center font-bold text-sm">
            DZ
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {lang === "ar" ? "تحية طيبة مكللة بالترحاب 🌴" : "Warm Traveler Greetings 🌴"}
            </h3>
            <p className="text-xs font-semibold text-teal-700 mt-0.5">
              {lang === "ar" 
                ? "فسحةdz تتمنى لكم رحلة ممتعة وسعيدة تملؤها الراحة والبهجة والذكريات الجميلة!" 
                : "Fos7a DZ wishes you an extremely enjoyable, safe, and pleasant voyage full of wonder!"}
            </p>
          </div>
        </div>
        <Compass className="w-5 h-5 text-indigo-500 animate-spin-slow hidden sm:block shrink-0" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[650px] items-stretch">
        {/* Left Column: Sessions & History List (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-5 flex flex-col h-[200px] lg:h-full shadow-sm select-none">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-800">
                {lang === "ar" ? "نبض المحادثات السابقة" : "Previous Chats History"}
              </h3>
            </div>
            <button
              onClick={handleCreateNewSession}
              title={lang === "ar" ? "بدء دردشة جديدة" : "Start a new conversation"}
              className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{lang === "ar" ? "جديد" : "New"}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none">
            {sessions.map((sess) => {
              const isSelected = sess.id === currentSessionId;
              const lastMsgText = sess.messages[sess.messages.length - 1]?.text || "";
              return (
                <div
                  key={sess.id}
                  onClick={() => setCurrentSessionId(sess.id)}
                  className={`group p-3 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-indigo-50/50 border-indigo-200/60 shadow-xs"
                      : "bg-slate-50/40 border-slate-100 hover:bg-slate-50 hover:border-slate-200"
                  }`}
                >
                  <div className="min-w-0 flex-1 text-right">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {sess.title}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1 truncate">
                      {lastMsgText || (lang === "ar" ? "محادثة فارغة" : "No messages yet")}
                    </p>
                    <span className="text-[9px] text-slate-400 font-bold block mt-1 font-mono">
                      {sess.timestamp}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteSession(sess.id, e)}
                    title={lang === "ar" ? "مسح المحادثة" : "Delete session"}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Chat Window Interactivity (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-6 flex flex-col h-[500px] lg:h-full shadow-sm min-w-0">
          {/* Active Title Banner */}
          <div className="border-b border-slate-100 pb-4 mb-4 space-y-1 shrink-0 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <h2 className="text-lg font-bold text-slate-800">
                  {activeSession ? activeSession.title : t.chatTitle}
                </h2>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {lang === "ar" 
                  ? "مساعدك السياحي يتعرف على صور المعالم ويُجيبك بذكاء وفورية!" 
                  : "Your travel assistant identifies monument photos and answers instantly!"}
              </p>
            </div>
            <MessageSquare className="w-5 h-5 text-indigo-400/80" />
          </div>

          {/* Chat Messages Log Panel */}
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
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border text-xs font-extrabold ${
                    isModel 
                      ? "bg-indigo-50 text-indigo-700 border-indigo-100" 
                      : "bg-slate-900 text-white border-slate-800"
                  }`}>
                    {isModel ? "AI" : "ME"}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1 max-w-full">
                    <div className={`p-4 rounded-2xl text-sm font-semibold leading-relaxed shadow-xs break-words overflow-x-auto ${
                      isModel 
                        ? "bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100/80" 
                        : "bg-indigo-600 text-white rounded-tr-none"
                    }`}>
                      {/* Attached image preview inside chat balloon */}
                      {msg.image && (
                        <div className="mb-2">
                          <img
                            src={msg.image.data}
                            alt="Attached location"
                            className="max-w-[200px] h-32 object-cover rounded-xl border border-white/20 shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      <div className="whitespace-pre-wrap break-words">
                        {msg.text}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 px-1.5">
                      <span className="text-[9px] text-slate-400 font-bold block font-mono">
                        {msg.timestamp}
                      </span>
                      {msg.isOfflineFallback && (
                        <span className="text-[8px] text-amber-600 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/15 whitespace-nowrap">
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
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center text-xs font-bold animate-pulse">
                  AI
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100/60 text-slate-400 rounded-2xl rounded-tl-none text-xs font-bold flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-150"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-300"></div>
                </div>
              </div>
            )}
          </div>

          {/* Attached Image Workspace Preview bar */}
          {attachedImage && (
            <div className="bg-slate-50 border border-slate-100/80 p-2.5 rounded-xl flex items-center justify-between gap-3 animate-fade-in mt-3">
              <div className="flex items-center gap-3">
                <img
                  src={attachedImage.data}
                  alt="Upload preview"
                  className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                  referrerPolicy="no-referrer"
                />
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-800">
                    {lang === "ar" ? "تم إرفاق صورة الاستكشاف للمعالجة الذكية" : "Image attached for spot analysis"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold font-mono mt-0.5">
                    {lang === "ar" ? "صورة معالم سياحية" : "Tourist landmark site"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAttachedImage(null)}
                className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Form Action Controls */}
          <form onSubmit={handleSendMessage} className="mt-4 pt-3 border-t border-slate-100 flex gap-2 items-center shrink-0">
            {/* Hidden native input for files */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title={lang === "ar" ? "إضافة صورة المنطقة المحتاجة للتحقق" : "Add photo to recognize area"}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                attachedImage 
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading || !currentSessionId}
              placeholder={activeSession ? t.chatPlaceholder : (lang === "ar" ? "الرجاء بدء أو تحديد محادثة أولاً" : "Please select or start a chat first")}
              className="flex-1 h-10 sm:h-12 px-3 sm:px-4 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 text-xs sm:text-sm font-semibold text-slate-800 transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed"
            />

            <button
              type="button"
              onClick={toggleListening}
              disabled={!currentSessionId}
              title={lang === "ar" ? "تحدث للمساعد لنسخ نصك" : "Click to speak"}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                isListening
                  ? "bg-rose-500 text-white border-rose-600 animate-pulse ring-4 ring-rose-100"
                  : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              type="submit"
              disabled={loading || (!input.trim() && !attachedImage) || !currentSessionId}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4 translate-x-[1px] -translate-y-[1px]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
