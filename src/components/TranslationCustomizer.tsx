/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  X, 
  Search, 
  MapPin, 
  Check, 
  RotateCcw, 
  FileEdit, 
  Sparkles, 
  Plus, 
  CheckCircle2, 
  ChevronRight, 
  BookOpen, 
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { translations } from "../translations";

// Dialect preset dictionary
export const dialectPresets = {
  dz: {
    name: "الدرجة الجزائرية (Algerian Darja)",
    flag: "🇩🇿",
    desc: "مصطلحات مميزة مستعملة في روع ومنوع المغامرات المحلية والرحلات بالجزائر",
    overrides: {
      navPlanner: "بلانور تاع التحواس والرحلة",
      navSearch: "تذاكر الطيارة وحجز لوطيلات",
      navVault: "خزنة التحواسات المحفوظة",
      navChat: "كونسيرج ذكي للتحواس",
      destPlaceholder: "وين راك حاب تسافر؟ (مثلاً: طوكيو، روما، البندقية، مسقط، زاير...)",
      generateBtn: "برمجلنا تحويسة بالذكاء الاصطناعي درك",
      generating: "رانا نوجدولك بروجرام شباب تاع التحواس... اصبر شوية",
      tripTypeLabel: "طبيعة التحويسة ومجالها",
      tripTypeDomestic: "تحويسة داخلية بالجزائر (بين الولايات)",
      originWilayaLabel: "ولاية الديبار (الانطلاق)",
      destWilayaLabel: "الولاية اللي راك حاب تحوس فيها",
      transitModeLabel: "واش من وسيلة ترسبور تفضلها؟",
      transitTaxi: "🚕 طاكسي كوليكتيف (بين الولايات)",
      transitCar: "🚗 لوطو بريفي أو كراء",
      transitBus: "🚌 كار / حافلة عمومية",
      lodgingTypeHotel: "🏨 لوكال / فندق شباب",
      budgetEco: "توفيرية (حنينة على الجيب)",
      budgetLux: "كلاس ورفاهية عالية جداً"
    }
  },
  gulf: {
    name: "اللهجة الخليجية (Gulf Dialect)",
    flag: "🇸🇦",
    desc: "مفردات ملائمة ومألوفة لأجواء السفر في دول الخليج العربي",
    overrides: {
      navPlanner: "جدول الرحلات الذكي",
      navSearch: "حجوزات طيران ومقاصد الفنادق",
      navVault: "مستودع السفر الجاهز",
      destPlaceholder: "وين ناوي تسافر؟ (مثلاً: طوكيو، روما، الرياض، صلالة...)",
      generateBtn: "صمم جدول رحلتي الذكي الحين",
      generating: "قاعدين نضبط لك أفضل مخطط للسفر... لحظات من فضلك",
      tripTypeLabel: "تصنيف ومسار هذي السفرية",
      budgetEco: "اقتصادية (أوفر خيار وتوفير كاش)",
      budgetLux: "فاخرة (على أعلى مستوى من الرفاهية والراحة)"
    }
  },
  levant: {
    name: "اللهجة الشامية (Levantine Dialect)",
    flag: "🇸🇾",
    desc: "تعبيرات جميلة ومحببة للرحلات وأيام العطل والراحة",
    overrides: {
      navPlanner: "صانع المخططات والرحلات",
      navVault: "خزانة رحلاتي وسفراتي",
      destPlaceholder: "لوين حابب تسافر؟ (مثلاً: طوكيو، روما، بيروت، الشام...)",
      generateBtn: "خططلي السفرية هلق بالذكاء الاصطناعي",
      generating: "عم نجهزلك أحلى برنامج للرحلة... ثواني صغيرة",
      budgetEco: "توفيرية ورخيصة (على قد الحال)",
      budgetLux: "برستيج وكماليات فاخرة كتير"
    }
  },
  egyptian: {
    name: "اللهجة المصرية (Egyptian Arabic)",
    flag: "🇪🇬",
    desc: "أقرب لهجة خفيفة ومفهومة بطعم الفسح والمصايف والرحلات والسياحة",
    overrides: {
      navPlanner: "مظبّط السفريات والرحلات الذكي",
      navSearch: "تذاكر طيران وفنادق لقطة",
      navVault: "دولاب سفرياتي المحفوظة",
      destPlaceholder: "نفسك تسافر فين المرة دي؟ (مثلاً: طوكيو، روما، القاهرة، الإسكندرية...)",
      generateBtn: "يلا خططي الرحلة بالذكاء الاصطناعي دلوقتي",
      generating: "بنظبّط لك جدول رحلة ملهوش مثيل... ثواني يافندم",
      budgetEco: "على قد الإيد واقتصادية جداً",
      budgetLux: "ملوكي وفاخرة ع الآخر"
    }
  }
};

interface TranslationCustomizerProps {
  lang: "ar" | "en";
  customTranslations: Record<string, string>;
  contributedPhrases?: Array<{ key: string; original: string; custom: string; note?: string }>;
  onUpdateTranslations: (changes: Record<string, string>) => void;
  onAddContributedPhrase?: (key: string, original: string, custom: string, note?: string) => void;
  onClose: () => void;
}

export default function TranslationCustomizer({
  lang,
  customTranslations,
  contributedPhrases = [],
  onUpdateTranslations,
  onAddContributedPhrase,
  onClose
}: TranslationCustomizerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  
  // Create phrase contribution fields
  const [newKey, setNewKey] = useState("");
  const [newOriginal, setNewOriginal] = useState("");
  const [newCustom, setNewCustom] = useState("");
  const [newNote, setNewNote] = useState("");
  const [contributionSuccess, setContributionSuccess] = useState(false);

  // Active Dialect Selection visual highlight
  const [activePresetId, setActivePresetId] = useState<string | null>(() => {
    // Detect matching preset if overrides are loaded
    const keysOverridden = Object.keys(customTranslations);
    if (keysOverridden.length === 0) return null;
    
    for (const [id, preset] of Object.entries(dialectPresets)) {
      const matchAll = Object.entries(preset.overrides).every(([k, v]) => customTranslations[k] === v);
      if (matchAll) return id;
    }
    return null;
  });

  // Base Modern Standard Arabic (MSA) keys
  const msaList = useMemo(() => {
    return Object.entries(translations.ar).map(([key, value]) => ({
      key,
      original: value,
      customVal: customTranslations[key] || ""
    }));
  }, [customTranslations]);

  // Search filtered terms list
  const filteredMsaList = useMemo(() => {
    if (!searchTerm.trim()) return msaList;
    const term = searchTerm.toLowerCase();
    return msaList.filter(item => 
      item.key.toLowerCase().includes(term) || 
      item.original.toLowerCase().includes(term) ||
      item.customVal.toLowerCase().includes(term)
    );
  }, [msaList, searchTerm]);

  // Handle preset application
  const applyDialectPreset = (presetId: string, overrides: Record<string, string>) => {
    setActivePresetId(presetId);
    onUpdateTranslations(overrides);
    
    // Play delightful notification bell sound logic
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const playPitch = (freq: number, start: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.1, start + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.4);
        };
        playPitch(523.25, now); // C5
        playPitch(659.25, now + 0.07); // E5
      }
    } catch {}
  };

  // Reset overrides to Standard Arabic
  const handleReset = () => {
    setActivePresetId(null);
    onUpdateTranslations({});
    setSearchTerm("");
    setEditingKey(null);
  };

  // Save single key override
  const handleSaveSingleOverride = (key: string, value: string) => {
    const updated = {
      ...customTranslations,
      [key]: value.trim()
    };
    if (!value.trim()) {
      delete updated[key];
    }
    onUpdateTranslations(updated);
    setEditingKey(null);
    setEditingValue("");
  };

  // Submit missing phrase contribution
  const handleAddContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newOriginal.trim() || !newCustom.trim()) return;

    if (onAddContributedPhrase) {
      onAddContributedPhrase(
        newKey.trim(),
        newOriginal.trim(),
        newCustom.trim(),
        newNote.trim()
      );
    }

    // Also inject temporarily into custom translations so they show up
    onUpdateTranslations({
      ...customTranslations,
      [newKey.trim()]: newCustom.trim()
    });

    setNewKey("");
    setNewOriginal("");
    setNewCustom("");
    setNewNote("");
    setContributionSuccess(true);
    setTimeout(() => setContributionSuccess(false), 4000);
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 text-slate-100 shadow-2xl relative overflow-hidden backdrop-blur-md">
      {/* Visual Ambient Grid Backdrops */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-indigo-500 to-pink-500" />

      <div className="flex justify-between items-start gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1.5 text-right w-full">
          <div className="flex items-center gap-2 justify-end">
            <span className="text-xs font-black tracking-wider text-teal-400 bg-teal-950/60 border border-teal-800/40 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 animate-spin" />
              <span>{lang === "ar" ? "ترقية اللهجة والترجمة" : "Custom Dialect Lab"}</span>
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-50">
            {lang === "ar" ? "🛠️ استوديو اللكنات وتوسيع الترجمات" : "🛠️ Arabic Dialect & Scale Translations Lab"}
          </h2>
          <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xl">
            {lang === "ar" 
              ? "تحكّم في صياغة الواجهة! غيّر العبارات إلى لهجتك المحببة كالدّارجة الجزائرية، شارك مصطلحات محلية مفقودة، أو خصّص المسميات لتستمتع برحلة ذكية مثالية."
              : "Refine every UI terminology! Switch standard Arabic commands into your preferred dialect like Algerian Darja, or submit localized region phrases immediately."}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-100 border border-slate-700/60 hover:scale-105 transition-all cursor-pointer shrink-0 mt-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        
        {/* LEFT PANEL: Dialect Presets & Contribute Missing Terms (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-5 text-right flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 justify-end">
              <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest leading-none">
                {lang === "ar" ? "⭐️ اختر لهجة جاهزة للتطبيق الفوري:" : "⭐️ Apply Quick Dialect Presets:"}
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {Object.entries(dialectPresets).map(([id, preset]) => {
                const isSelected = activePresetId === id;
                return (
                  <button
                    key={id}
                    onClick={() => applyDialectPreset(id, preset.overrides)}
                    className={`p-3 rounded-2xl text-right transition-all border font-medium flex gap-3 cursor-pointer select-none leading-normal relative overflow-hidden group ${
                      isSelected 
                        ? "bg-indigo-950/60 border-indigo-500 text-slate-100 shadow-lg shadow-indigo-950/80" 
                        : "bg-slate-800/40 border-slate-800 hover:bg-slate-800 text-slate-350 hover:text-slate-200"
                    }`}
                  >
                    {/* Tick icon indicator */}
                    {isSelected && (
                      <span className="absolute top-3 left-3 bg-indigo-500 text-white rounded-full p-0.5 shadow-sm">
                        <Check className="w-3 h-3 stroke-[3.5]" />
                      </span>
                    )}

                    <span className="text-2xl p-1.5 bg-slate-800 rounded-xl flex items-center justify-center shrink-0 border border-slate-700/30 group-hover:scale-105 transition-transform duration-300">
                      {preset.flag}
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black ${isSelected ? "text-indigo-300" : "text-slate-200"}`}>
                          {preset.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug">
                        {preset.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Clear Customizations / Reset Button */}
            {Object.keys(customTranslations).length > 0 && (
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 p-2 bg-rose-950/40 hover:bg-rose-950/60 border border-rose-800/30 text-rose-300 rounded-xl text-[11px] font-black tracking-wider transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{lang === "ar" ? "🗑️ حذف كافة التعديلات واستعادة اللغة الفصحى" : "Clear Lab Overrides & Restore Standard MSA"}</span>
              </button>
            )}
          </div>

          {/* Form: Contribute Missing Phrase */}
          <div className="bg-slate-800/35 border border-slate-800/80 rounded-2xl p-4 space-y-3 mt-4">
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-[9px] font-black text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-800/20">
                {lang === "ar" ? "قاعدة اللكنات" : "Dialect Engine"}
              </span>
              <h3 className="font-extrabold text-xs text-slate-300">
                {lang === "ar" ? "📝 ساهم بعبارة مفقودة أو مصطلح محلي:" : "📝 Add Missing Term & Contribute:"}
              </h3>
            </div>
            
            <form onSubmit={handleAddContribution} className="space-y-2.5">
              <div>
                <label className="text-[9.5px] font-black text-slate-500 block mb-1">
                  {lang === "ar" ? "رمز المصطلح بالإنجليزية (Key Code):" : "Unique Key Key (e.g., localFarewell):"}
                </label>
                <input
                  type="text"
                  required
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
                  placeholder="e.g., dialTaxiText"
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs font-bold font-mono px-3 py-1.5 rounded-lg text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9.5px] font-black text-slate-500 block mb-1">
                    {lang === "ar" ? "العبارة بالفصحى:" : "Standard Arabic:"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newOriginal}
                    onChange={(e) => setNewOriginal(e.target.value)}
                    placeholder="سيارة الأجرة"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs font-bold px-3 py-1.5 rounded-lg text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[9.5px] font-black text-slate-500 block mb-1">
                    {lang === "ar" ? "العامية أو اللكنة المقترحة:" : "Dialect Refinement:"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustom}
                    onChange={(e) => setNewCustom(e.target.value)}
                    placeholder="الكلوندستان"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs font-bold px-3 py-1.5 rounded-lg text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9.5px] font-black text-slate-500 block mb-1">
                  {lang === "ar" ? "ملاحظة أو الولاية/المنطقة (اختياري):" : "Context / Region Note (Optional):"}
                </label>
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="مستعملة بكثرة في غرب ووسط الجزائر..."
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs font-bold px-3 py-1.5 rounded-lg text-slate-200"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white hover:text-white rounded-xl py-2 px-3 text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>{lang === "ar" ? "إدراج وتطبيق المصطلح بالتحول التلقائي" : "Add Phrase & Trigger Application Live"}</span>
              </button>
            </form>

            <AnimatePresence>
              {contributionSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 p-2.5 rounded-xl text-center text-[10.5px] font-bold"
                >
                  🎉 {lang === "ar" ? "تم قبول مساهمتك وتطبيق لغتك المحلية بنجاح!" : "Contributed translation applied live!"}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT PANEL: Live Search and Keys Refinement (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4 text-right flex flex-col justify-between">
          <div className="bg-slate-800/20 border border-slate-800 rounded-2xl p-4/5 p-4 space-y-4">
            
            {/* Search Input */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2.5">
              <span className="text-[10px] font-black text-indigo-400 bg-indigo-950 border border-indigo-900 px-2 py-0.5 rounded-md self-start sm:self-center">
                {lang === "ar" ? `إجمالي المفردات: ${filteredMsaList.length}` : `Vocabulary Keys: ${filteredMsaList.length}`}
              </span>
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={lang === "ar" ? "ابحث عن مفردة لتعديلها..." : "Search label to customize..."}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs font-bold pl-3 pr-8.5 py-1.5 rounded-lg text-slate-200 text-right font-sans"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2" />
              </div>
            </div>

            {/* Vocab Scroller */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {filteredMsaList.length > 0 ? (
                filteredMsaList.map((item) => {
                  const isEditing = editingKey === item.key;
                  const isRefined = !!item.customVal;

                  return (
                    <div
                      key={item.key}
                      className={`p-3 rounded-xl border transition-all text-xs flex flex-col gap-2 relative ${
                        isRefined
                          ? "bg-slate-800/50 border-teal-900/60"
                          : "bg-slate-950/30 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        {/* Action buttons on left */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isEditing ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleSaveSingleOverride(item.key, editingValue)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-[10.5px] font-extrabold flex items-center gap-0.5 cursor-pointer"
                              >
                                <span>{lang === "ar" ? "حفظ" : "Save"}</span>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingKey(null);
                                  setEditingValue("");
                                }}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-350 px-2 py-1 rounded text-[10.5px] font-bold cursor-pointer"
                              >
                                <span>{lang === "ar" ? "إلغاء" : "Cancel"}</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingKey(item.key);
                                  setEditingValue(item.customVal || item.original);
                                }}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700/50 flex items-center justify-center cursor-pointer"
                                title={lang === "ar" ? "تعديل هذه الصياغة بلكنتك" : "Refine translation string"}
                              >
                                <FileEdit className="w-3.5 h-3.5" />
                              </button>
                              
                              {isRefined && (
                                <button
                                  onClick={() => handleSaveSingleOverride(item.key, "")}
                                  className="p-1 px-1.5 bg-rose-950/30 hover:bg-rose-950/60 text-rose-400 rounded-lg text-[9px] font-black border border-rose-900/30 cursor-pointer"
                                  title={lang === "ar" ? "إعادة الصياغة الأصلية" : "Restore original translation"}
                                >
                                  {lang === "ar" ? "أصلي" : "Reset"}
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Text and key on right */}
                        <div className="text-right space-y-0.5 truncate flex-1 min-w-0 pr-1">
                          <span className="font-extrabold text-[10px] text-slate-500 font-mono block">
                            {item.key}
                          </span>
                          <p className="font-bold text-slate-300 pr-1.5 leading-snug">
                            {item.original}
                          </p>
                        </div>
                      </div>

                      {/* Display active custom override */}
                      {isEditing ? (
                        <div className="mt-1">
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:outline-none text-xs font-bold px-3 py-1.5 rounded-lg text-slate-100 text-right leading-none"
                            placeholder={lang === "ar" ? "اكتب الصياغة العامية البديلة..." : "Provide custom label override..."}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveSingleOverride(item.key, editingValue);
                            }}
                          />
                        </div>
                      ) : (
                        isRefined && (
                          <div className="flex items-center gap-1.5 bg-teal-950/70 border border-teal-900/60 p-1.5 py-1 rounded-lg text-[10.5px] font-bold text-teal-300 self-end">
                            <span className="shrink-0 text-emerald-400">✨</span>
                            <span className="font-semibold text-slate-400 ml-1 shrink-0">{lang === "ar" ? "اللكنة البديلة:" : "Revised:"}</span>
                            <span className="font-black">{item.customVal}</span>
                          </div>
                        )
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-[11px] text-slate-400 italic text-center py-6 leading-none">
                  {lang === "ar" ? "لم نجد أي عبارة مطابقة لبحثك" : "No translations string matches search key."}
                </p>
              )}
            </div>
            
          </div>

          {/* List of Contributed Phrases */}
          {contributedPhrases.length > 0 && (
            <div className="bg-slate-950/40 p-4 border border-slate-800 rounded-2xl space-y-2">
              <h4 className="text-[11px] font-black text-slate-400 tracking-wider uppercase">
                {lang === "ar" ? "📚 مصطلحاتك وولاياتك المقترحة حديثاً:" : "📚 Your Contributed Dialect Dictionary:"}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[110px] overflow-y-auto pr-1">
                {contributedPhrases.map((phrase, idx) => (
                  <div key={idx} className="bg-slate-900 p-2.5 rounded-xl border border-teal-950 text-[11.5px] hover:border-slate-700 transition-colors flex justify-between items-center text-right font-medium">
                    <span className="text-[10px] text-teal-400 font-bold bg-teal-950/40 px-1.5 py-0.5 rounded-lg border border-teal-900/10">
                      {phrase.custom}
                    </span>
                    <div className="text-right">
                      <p className="font-extrabold text-slate-300 truncate max-w-[130px] leading-none mb-0.5">{phrase.original}</p>
                      <p className="text-[9.5px] text-slate-500 font-bold font-mono tracking-wide leading-none">{phrase.key}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Lab footer presentation */}
      <div className="border-t border-slate-800 pt-3.5 mt-5 text-center flex flex-col sm:flex-row justify-between items-center gap-2 text-[10.5px] font-bold text-slate-500">
        <div>
          <span>{lang === "ar" ? "💡 ملاحظة: تظل اللكنات فعالة ومحفوظة بمتصفحك حتى تقوم بإعادة الضبط" : "💡 Note: Dialect preferences are persisted locally until cleared"}</span>
        </div>
        <div className="flex gap-1">
          <span className="text-indigo-400">#Fos7aDZ_DialectLab</span>
          <span>•</span>
          <span className="text-amber-400">v1.4</span>
        </div>
      </div>
    </div>
  );
}
