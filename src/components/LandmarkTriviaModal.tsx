/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, BookOpen, HelpCircle, AlertCircle, Compass } from "lucide-react";

interface LandmarkTriviaModalProps {
  isOpen: boolean;
  onClose: () => void;
  landmarkName: string;
  lang: "ar" | "en";
}

interface TriviaData {
  historicalContext: string;
  trivia: string[];
}

export default function LandmarkTriviaModal({
  isOpen,
  onClose,
  landmarkName,
  lang,
}: LandmarkTriviaModalProps) {
  const isAr = lang === "ar";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TriviaData | null>(null);

  useEffect(() => {
    if (isOpen && landmarkName) {
      fetchTrivia();
    }
  }, [isOpen, landmarkName]);

  const fetchTrivia = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      console.log(`[Trivia API] Requesting AI context for: ${landmarkName}`);
      const res = await fetch("/api/landmark-trivia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ landmarkName, lang }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch historical context");
      }

      const parsed: TriviaData = await res.json();
      setData(parsed);
    } catch (err: any) {
      console.error("[Trivia API Error]", err);
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Blur Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            id="trivia-modal-backdrop"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.4 }}
            className={`bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden relative z-10 flex flex-col ${
              isAr ? "text-right" : "text-left"
            }`}
            id="trivia-modal-container"
          >
            {/* Elegant Header Background Pattern */}
            <div className="bg-gradient-to-r from-amber-500 to-indigo-600 p-6 text-white relative">
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/10 hover:bg-black/20 text-white cursor-pointer transition-all"
                title={isAr ? "إغلاق" : "Close"}
                id="close-trivia-modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                  <Compass className="w-6 h-6 animate-spin" style={{ animationDuration: "12s" }} />
                </div>
                <div>
                  <span className="text-[9px] font-black tracking-widest text-amber-200 uppercase block">
                    {isAr ? "المرور الجغرافي المعزز بالذكاء الاصطناعي ✦" : "AI-POWERED HERITAGE TRAVEL"}
                  </span>
                  <h3 className="text-base md:text-lg font-black leading-tight mt-0.5">
                    {landmarkName}
                  </h3>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[70vh]">
              {loading && (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <div className="flex space-x-1.5 justify-center items-center">
                    <span className="sr-only">Loading...</span>
                    <div className="h-3 w-3 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-3 w-3 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-3 w-3 bg-indigo-600 rounded-full animate-bounce"></div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-black text-slate-800">
                      {isAr ? "🚀 يستدعي الذكاء الاصطناعي مذكرات التاريخ..." : "🚀 Querying centuries of historical archives..."}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold tracking-wide mt-1">
                      {isAr ? "يرجى الانتظار لصياغة المحتوى" : "Structuring trivia facts & heritage details"}
                    </p>
                  </div>
                </div>
              )}

              {error && !loading && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h5 className="text-xs font-black text-rose-800">
                      {isAr ? "مشكلة في إبحار التاريخ" : "History Retrieval Issue"}
                    </h5>
                    <p className="text-[11px] text-rose-600 font-medium">
                      {isAr ? "تعذّر جلب البيانات، يرجى إعادة محاولة الضغط مجدداً." : "Could not safely pull AI history. Let's click again."}
                    </p>
                  </div>
                </div>
              )}

              {data && !loading && (
                <div className="space-y-6">
                  {/* Historical Context Section */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5 text-slate-800 font-black text-xs md:text-sm uppercase tracking-wider">
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                      <span>{isAr ? "📜 السياق التاريخي والتراثي" : "📜 Historical Context & Heritage"}</span>
                    </div>
                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-semibold bg-slate-50 p-4.5 rounded-2xl border border-slate-100">
                      {data.historicalContext}
                    </p>
                  </div>

                  {/* Trivia / Fun Facts Section */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-800 font-black text-xs md:text-sm uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>{isAr ? "✨ هل تعلم؟ غوامض وغرائب طريفة" : "✨ Did You Know? Special Trivia"}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {data.trivia && data.trivia.map((t, idx) => (
                        <div
                          key={idx}
                          className="bg-amber-50/30 border border-amber-500/10 p-3.5 rounded-2xl flex gap-3 relative overflow-hidden text-start"
                        >
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-amber-500/30" />
                          <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-black shrink-0 text-xs mt-0.5">
                            {idx + 1}
                          </div>
                          <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                            {t}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span>{isAr ? "بوابة الأثر السياحي فسحةديزاد" : "Fos7a Travel Heritage Guide"}</span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black cursor-pointer transition-all"
                id="close-trivia-footer"
              >
                {isAr ? "حسناً، فهمت" : "Got it!"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
