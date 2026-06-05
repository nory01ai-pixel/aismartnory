/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  BookOpen, 
  Sparkles, 
  Image as ImageIcon, 
  FileText, 
  Plus, 
  Check, 
  Trash2, 
  Calendar, 
  ChevronRight, 
  ChevronLeft, 
  Download, 
  Edit,
  Sparkle,
  History,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Itinerary, SavedTrip } from "../types";

export interface DiaryEntry {
  dayNumber: number;
  journalText: string;
  imageUrl?: string;
  aiPrompt?: string;
  createdAt: string;
}

interface TravelDiaryProps {
  lang: "ar" | "en";
  trip: SavedTrip;
  onUpdateTripDiary: (updatedTrip: SavedTrip) => void;
  onClose: () => void;
}

// Preset visual categories with beautiful Picsum seed images for traveling
const TRAVEL_THEMES_PRESETS = [
  { keywords: "ancient city, architecture, sunny day, historic street", id: "heritage" },
  { keywords: "ocean, beach, palms, sunset, paradise island", id: "coastal" },
  { keywords: "local spice market, street food, busy souk, traditional", id: "market" },
  { keywords: "snow climate, mountain peak, mist, high forest", id: "mountain" },
  { keywords: "gourmet dessert, cafe plate, traditional breakfast", id: "cuisine" },
  { keywords: "modern cityscape, neon lights, night skyscrapers, transit", id: "city" },
  { keywords: "sahara desert, sand dunes, camels, beautiful oasis", id: "sahara" }
];

export default function TravelDiary({ lang, trip, onUpdateTripDiary, onClose }: TravelDiaryProps) {
  const iti = trip.itinerary;
  const daysCount = iti.tripDurationDays || iti.days?.length || 1;

  // Selected Day State (starting at Day 1)
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [journalContent, setJournalContent] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"write" | "gallery">("write");
  const carouselRef = useRef<HTMLDivElement>(null);
  const [downloadingDayNum, setDownloadingDayNum] = useState<number | null>(null);

  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const amt = direction === "left" ? -300 : 300;
      carouselRef.current.scrollBy({ left: amt, behavior: "smooth" });
    }
  };

  // AI Image generation states
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [customStylePrompt, setCustomStylePrompt] = useState<string>("");
  const [selectedThemePreset, setSelectedThemePreset] = useState<string>("heritage");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [generatedPromptText, setGeneratedPromptText] = useState<string>("");

  // Retrieve current day's active diary entry (if exists)
  const diaryEntries: DiaryEntry[] = (trip as any).diaryEntries || [];
  const currentDayEntry = diaryEntries.find(entry => entry.dayNumber === selectedDayNumber);

  // Sync state with current selected day when selected day changes
  useEffect(() => {
    if (currentDayEntry) {
      setJournalContent(currentDayEntry.journalText);
      setPreviewImageUrl(currentDayEntry.imageUrl || null);
      setGeneratedPromptText(currentDayEntry.aiPrompt || "");
    } else {
      setJournalContent("");
      setPreviewImageUrl(null);
      setGeneratedPromptText("");
    }
  }, [selectedDayNumber, trip]);

  // Handle triggering a lovely, immersive simulated AI generation
  const handleGenerateAIImage = () => {
    setIsGeneratingImage(true);
    
    const steps = lang === "ar" ? [
      "🔍 تحليل تفاصيل اليوم ومسار الرحلة المقترح...",
      "🎨 صياغة الكلمات الدلالية وتطبيق نمط الصورة الفنية...",
      "⚡ توليد الأبعاد وبدء الرسوم السحابية للذكاء الاصطناعي...",
      "✨ تنعيم الألوان واللمسات النهائية الفريدة..."
    ] : [
      "🔍 Extracting destination coordinates and itinerary theme...",
      "🎨 Formulating aesthetic keywords and sensory lighting styles...",
      "⚡ Initiating Cloud Latent Stable Diffusion rendering...",
      "✨ Polishing visual textures and finalizing memory image..."
    ];

    let stepIndex = 0;
    setGenerationStep(steps[0]);

    // Musical ticks during generation
    const interval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) {
        setGenerationStep(steps[stepIndex]);
        // Play harmonious generation tick notes
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.frequency.setValueAtTime(320 + stepIndex * 80, ctx.currentTime);
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
          }
        } catch {}
      } else {
        clearInterval(interval);
      }
    }, 700);

    setTimeout(() => {
      setIsGeneratingImage(false);
      clearInterval(interval);

      // Construct a highly unique and vibrant beautiful travel picture
      const activeTheme = TRAVEL_THEMES_PRESETS.find(p => p.id === selectedThemePreset)?.keywords || "travel scenery";
      const customizedDetail = customStylePrompt ? `, custom style: ${customStylePrompt}` : "";
      
      const seedVal = encodeURIComponent(`${iti.destinationName}-${selectedDayNumber}-${selectedThemePreset}-${customStylePrompt || "natural"}`);
      // Generates a beautiful 600x400 landscape photo customized by seed
      const generatedUrl = `https://picsum.photos/seed/${seedVal}/600/400`;
      
      const generatedCaption = lang === "ar"
        ? `لقطة ذكاء اصطناعي لليوم ${selectedDayNumber} في ${iti.destinationName}. المظهر: ${activeTheme}${customizedDetail}`
        : `AI photo memory for Day ${selectedDayNumber} in ${iti.destinationName}. Style: ${activeTheme}${customizedDetail}`;

      setPreviewImageUrl(generatedUrl);
      setGeneratedPromptText(generatedCaption);

      // Play finished joyful note
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const now = ctx.currentTime;
          const playNote = (f: number, delay: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(f, now + delay);
            gain.gain.setValueAtTime(0, now + delay);
            gain.gain.linearRampToValueAtTime(0.08, now + delay + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + delay);
            osc.stop(now + delay + 0.4);
          };
          playNote(523.25, 0); // C5
          playNote(659.25, 0.08); // E5
          playNote(783.99, 0.16); // G5
        }
      } catch {}

    }, 3000);
  };

  // Save current diary entry into the trip's profile
  const handleSaveDiaryEntry = () => {
    // Prevent empty saving unless they want to delete
    if (!journalContent.trim() && !previewImageUrl) {
      // Just clear/delete entry
      const updatedEntries = diaryEntries.filter(entry => entry.dayNumber !== selectedDayNumber);
      const updatedTrip = {
        ...trip,
        diaryEntries: updatedEntries
      };
      onUpdateTripDiary(updatedTrip);
      return;
    }

    const newEntry: DiaryEntry = {
      dayNumber: selectedDayNumber,
      journalText: journalContent.trim(),
      imageUrl: previewImageUrl || undefined,
      aiPrompt: generatedPromptText || undefined,
      createdAt: new Date().toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    };

    const existingIndex = diaryEntries.findIndex(entry => entry.dayNumber === selectedDayNumber);
    let updatedEntries = [...diaryEntries];
    if (existingIndex > -1) {
      updatedEntries[existingIndex] = newEntry;
    } else {
      updatedEntries.push(newEntry);
    }

    const updatedTrip = {
      ...trip,
      diaryEntries: updatedEntries
    };

    onUpdateTripDiary(updatedTrip);

    // Play visual feedback checkmark
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch {}
  };

  const handleDeleteEntry = (dayNum: number) => {
    const updatedEntries = diaryEntries.filter(entry => entry.dayNumber !== dayNum);
    const updatedTrip = {
      ...trip,
      diaryEntries: updatedEntries
    };
    onUpdateTripDiary(updatedTrip);
    if (dayNum === selectedDayNumber) {
      setJournalContent("");
      setPreviewImageUrl(null);
      setGeneratedPromptText("");
    }
  };

  // Get matching theme for a specific day
  const targetDayPlan = iti.days?.find(d => d.dayNumber === selectedDayNumber);
  const dayTitleTheme = targetDayPlan?.theme || targetDayPlan?.activities?.[0]?.title || (lang === "ar" ? "جولة سياحية عامة" : "General sightseeing tour");

  return (
    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 md:p-6 text-slate-800 shadow-xl space-y-6 text-right font-medium relative overflow-hidden">
      
      {/* Mini top visual ribbon */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-indigo-500 to-pink-500" />

      {/* Header and close section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <button
          onClick={onClose}
          className="p-2 px-3.5 bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-2xs self-start"
        >
          {lang === "ar" ? "← عودة للخزنة" : "← Back to Vault"}
        </button>

        <div className="space-y-1 text-right">
          <div className="flex items-center gap-2 justify-end">
            <span className="text-[10px] font-black tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-150 rounded-full px-2.5 py-0.5">
              {lang === "ar" ? "دفتر مذكرات الرحلة" : "Traveler's Diary"}
            </span>
            <span className="text-[10px] font-black text-rose-500 bg-rose-50 border border-rose-150 rounded-full px-2.5 py-0.5">
              {iti.destinationName}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-1.5 justify-end">
            <BookOpen className="w-5.5 h-5.5 text-indigo-500" />
            <span>{lang === "ar" ? "📖 أرشيف الخواطر وصور السير الذاتية" : "📖 Memory Journals & AI Photo Diary"}</span>
          </h2>
          <p className="text-xs text-slate-500 leading-normal font-semibold max-w-xl">
            {lang === "ar"
              ? "دون خواطرك لكل يوم وأرفق صوراً ملهمة مولدة بالذكاء الاصطناعي لتوثيق أروع لحظات مغامرتك."
              : "Capture reflections for each itinerary day and attach visual AI-generated memory pieces to cherish forever."}
          </p>
        </div>
      </div>

      {/* Tabs list: Editor vs Gallery */}
      <div className="flex justify-end border-b border-slate-200 pb-px">
        <div className="flex bg-slate-150 p-1.5 rounded-xl border border-slate-200/60 font-black">
          <button
            onClick={() => setActiveTab("gallery")}
            className={`px-4 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "gallery" 
                ? "bg-white text-slate-800 shadow-3xs" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>{lang === "ar" ? "📚 الاستوديو والمعرض العام" : "📚 Travel Memory Gallery"}</span>
            {diaryEntries.length > 0 && (
              <span className="bg-indigo-600 text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0">
                {diaryEntries.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab("write")}
            className={`px-4 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "write" 
                ? "bg-white text-slate-800 shadow-3xs" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>{lang === "ar" ? "✍️ تدوين وتوليد خاطرة جديدة" : "✍️ Create New Entry"}</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "write" ? (
          <motion.div
            key="write"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Day Selector and Day description (Left / Right depending on RTL) */}
            <div className="lg:col-span-4 space-y-4 text-right order-last lg:order-first">
              <div className="bg-white border border-slate-150 p-4.5 p-4 rounded-2xl-custom rounded-2xl space-y-4">
                <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest leading-none">
                  {lang === "ar" ? "🗓️ حدد يوم الزيارة المراد تدوينه:" : "🗓️ Select Travel Day:"}
                </h3>
                
                <div className="grid grid-cols-5 gap-1.5 max-h-[170px] overflow-y-auto pr-1">
                  {Array.from({ length: daysCount }).map((_, index) => {
                    const dayNum = index + 1;
                    const isSelected = selectedDayNumber === dayNum;
                    const hasEntry = diaryEntries.some(entry => entry.dayNumber === dayNum);
                    
                    return (
                      <button
                        key={dayNum}
                        onClick={() => setSelectedDayNumber(dayNum)}
                        className={`p-2.5 rounded-xl text-center border font-bold text-xs select-none transition-all cursor-pointer flex flex-col items-center justify-center gap-1 relative ${
                          isSelected
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100 scale-105"
                            : hasEntry
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-50 border-slate-200/85 hover:bg-slate-100 text-slate-600"
                        }`}
                      >
                        <span className="text-[10px] font-medium opacity-50 block uppercase leading-none">D</span>
                        <span className="text-sm font-black leading-none">{dayNum}</span>
                        {hasEntry && !isSelected && (
                          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-xs text-slate-600 leading-relaxed font-semibold">
                    <span className="font-black text-indigo-700 block mb-0.5">
                      {lang === "ar" ? `مخطط اليوم ${selectedDayNumber}:` : `Day ${selectedDayNumber} Itinerary:`}
                    </span>
                    <p className="leading-snug">{dayTitleTheme}</p>
                  </div>
                </div>
              </div>

              {/* Tips block */}
              <div className="bg-amber-50/50 border border-amber-200/40 p-3 rounded-xl text-[10.5px] leading-relaxed text-amber-800 text-right flex gap-2">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">{lang === "ar" ? "تلميحة السير الذاتية:" : "Memory Tip:"}</span>{" "}
                  {lang === "ar"
                    ? "اختر طابعاً مناسباً لطبيعة رحلتك كزيارة المواقع الأثرية، الشواطئ، أو نمط الصحراء ثم اضغط زر توليد الصورة لجلب لقطة الذكاء الاصطناعي الأنسب."
                    : "Select a custom style preset matched directly to your active itinerary (heritage, culinary, mountain, desert) to render the optimal AI memory backdrop."}
                </div>
              </div>
            </div>

            {/* Editor card with journal and generated image options (lg:col-span-8) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white border border-slate-150 rounded-2xl p-5 md:p-6 space-y-5 text-right">
                
                {/* Journal entry area */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 block">
                    {lang === "ar" ? "✍️ اكتب مشاعرك، مغامراتك وطبق مذكراتك:" : "✍️ Write Your Daily Journal Reflections:"}
                  </label>
                  <textarea
                    rows={4}
                    value={journalContent}
                    onChange={(e) => setJournalContent(e.target.value)}
                    placeholder={
                      lang === "ar"
                        ? "اكتب هنا أجمل الذكريات، الأطعمة التي شربتها أو تذوقتها، المعالم، الأشخاص، الصعوبات والأفراح..."
                        : "Describe the incredible moments, local context, cuisines you tasted, people you met, and personal breakthroughs..."
                    }
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:outline-none rounded-xl p-3.5 text-xs text-slate-800 leading-relaxed text-right font-sans h-32"
                  />
                </div>

                {/* AI Image attachment section */}
                <div className="border-t border-slate-100 pt-4 space-y-4">
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-md font-bold">
                      {lang === "ar" ? "مولد الصور المدمج" : "Integrated AI Art Studio"}
                    </span>
                    <h4 className="text-xs font-black text-slate-700 flex items-center gap-1 justify-end">
                      <ImageIcon className="w-4 h-4 text-indigo-500" />
                      <span>{lang === "ar" ? "🌌 إرفاق صورة تذكارية للذكاء الاصطناعي:" : "🌌 Attach AI Memory Image Element:"}</span>
                    </h4>
                  </div>

                  {/* Themes presets selectors */}
                  <div className="space-y-2">
                    <span className="text-[9.5px] font-heavy text-slate-400 block mb-1">
                      {lang === "ar" ? "اختر الجو البصري العام للصورة:" : "Select Image Composition Theme:"}
                    </span>
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {TRAVEL_THEMES_PRESETS.map((p) => {
                        const isThemeSelected = selectedThemePreset === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedThemePreset(p.id)}
                            className={`p-1.5 px-2.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                              isThemeSelected
                                ? "bg-amber-50 text-amber-600 border-amber-300 shadow-3xs"
                                : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <span>#{p.id}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Prompt Input */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-8 space-y-1">
                      <label className="text-[9.5px] font-heavy text-slate-400 block">
                        {lang === "ar" ? "أضف تفاصيل مخصصة (مثلا: يوم ممطر، ألوان مائية، سينمائي...):" : "Add custom style details (e.g. moody sunset, rain, watercolor):"}
                      </label>
                      <input
                        type="text"
                        value={customStylePrompt}
                        onChange={(e) => setCustomStylePrompt(e.target.value)}
                        placeholder="e.g. moody dusk, hyperrealistic, dynamic sunrays"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-lg p-2 text-[11px] text-slate-700 text-right font-sans"
                      />
                    </div>
                    
                    <div className="md:col-span-4">
                      <button
                        type="button"
                        disabled={isGeneratingImage}
                        onClick={handleGenerateAIImage}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white hover:text-white rounded-xl py-2 px-3 text-[11px] font-black tracking-wide flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{lang === "ar" ? "🌌 ولد بالذكاء الاصطناعي" : "🌌 Trigger AI Gen"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Image render wrapper */}
                  <AnimatePresence mode="wait">
                    {isGeneratingImage ? (
                      <motion.div
                        key="gen"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-slate-900 border border-slate-750 text-white rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-400/20 text-indigo-400 text-xl animate-spin">
                          <Sparkle className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-xs text-indigo-300 animate-pulse">
                            {lang === "ar" ? "جاري محاكاة توليد الصورة بفن فريد..." : "Rendering Creative Image elements..."}
                          </h4>
                          <p className="text-[10px] text-slate-450 leading-relaxed font-bold max-w-sm">
                            {generationStep}
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      previewImageUrl && (
                        <motion.div
                          key="preview"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5 relative overflow-hidden"
                        >
                          <img
                            src={previewImageUrl}
                            alt="Generated memory photo"
                            referrerPolicy="no-referrer"
                            className="bg-slate-200 border border-slate-200 rounded-lg w-full max-h-[220px] object-cover filter brightness-95"
                          />
                          <div className="flex justify-between items-start gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewImageUrl(null);
                                setGeneratedPromptText("");
                              }}
                              className="text-rose-600 hover:underline text-[9.5px] font-black shrink-0 cursor-pointer"
                            >
                              {lang === "ar" ? "🗑️ حذف الصورة" : "🗑️ Detach Photo"}
                            </button>
                            <p className="text-[9.5px] text-slate-500 leading-snug text-right font-medium italic">
                              {generatedPromptText}
                            </p>
                          </div>
                        </motion.div>
                      )
                    )}
                  </AnimatePresence>
                </div>

                {/* Finalizing Footer buttons */}
                <div className="border-t border-slate-100 pt-4 flex justify-between items-center gap-4">
                  <div>
                    {currentDayEntry && (
                      <button
                        type="button"
                        onClick={() => handleDeleteEntry(selectedDayNumber)}
                        className="text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-150 p-2 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>{lang === "ar" ? "مسح المذكرة بالكامل" : "Delete Memory"}</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveDiaryEntry}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white hover:text-white px-5 py-2 rounded-xl text-xs font-black shadow-md shadow-emerald-50 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[3.5]" />
                    <span>
                      {lang === "ar" 
                        ? (currentDayEntry ? "💾 تعديل وحفظ الخاطرة" : "💾 حفظ ذكريات اليوم بنجاح")
                        : (currentDayEntry ? "💾 Save Changes" : "💾 Lock Memory details")}
                    </span>
                  </button>
                </div>

              </div>
            </div>
            
          </motion.div>
        ) : (
          /* GALLERY VIEW */
          <motion.div
            key="gallery"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4 text-right"
          >
            {/* Horizontal Scrollable AI Polaroid Memories Carousel */}
            <div className="bg-white/70 border border-slate-150 rounded-2xl p-5 space-y-4 shadow-3xs relative">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="flex items-center gap-2 justify-end sm:flex-row-reverse">
                  <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                    <Sparkles className="w-4.5 h-4.5 text-indigo-500 animate-pulse" />
                  </div>
                  <div className="text-right">
                    <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                      {lang === "ar" ? "📸 شريط ذكريات السفر التفاعلي بالذكاء الاصطناعي" : "📸 Interactive AI Travel Memories Carousel"}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      {lang === "ar" ? "تصفح صور ولقطات ذكاء اصطناعي خلّابة يومًا بعد يوم" : "Scroll through generated Polaroid AI frames for each day"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-1 justify-end">
                  <button
                    onClick={() => scrollCarousel("left")}
                    className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
                    title="Scroll Left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scrollCarousel("right")}
                    className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
                    title="Scroll Right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scroll Track */}
              <div 
                ref={carouselRef}
                className="flex gap-5 overflow-x-auto py-2.5 pb-4 scrollbar-thin scrollbar-thumb-slate-250 scrollbar-track-transparent snap-x snap-mandatory scroll-smooth"
                style={{ direction: lang === "ar" ? "rtl" : "ltr" }}
              >
                {Array.from({ length: daysCount }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const savedEntry = diaryEntries.find(e => e.dayNumber === dayNum);
                  
                  // Construct static custom seed URL matching day style so every day looks stunningly unique!
                  const seedTheme = TRAVEL_THEMES_PRESETS[idx % TRAVEL_THEMES_PRESETS.length].id;
                  const seedVal = encodeURIComponent(`${iti.destinationName}-day-${dayNum}-${seedTheme}`);
                  const imageUrl = savedEntry?.imageUrl || `https://picsum.photos/seed/${seedVal}/500/350`;
                  
                  const targetDayPlan = iti.days?.find(d => d.dayNumber === dayNum);
                  const dayTitle = targetDayPlan?.theme || targetDayPlan?.activities?.[0]?.title || (lang === "ar" ? "يوم استكشاف عام" : "Exploration day");
                  
                  const placeholderCaption = lang === "ar"
                    ? `لقطة ريفية ساحرة تصف طبيعة اليوم المعماري لليوم ${dayNum} في ${iti.destinationName}.`
                    : `Visual AI mood capture of local architectures & atmospheres for Day ${dayNum} in ${iti.destinationName}.`;
                  const captionText = savedEntry?.aiPrompt || placeholderCaption;

                  const isDownloading = downloadingDayNum === dayNum;

                  const handleSimulatedDownload = () => {
                    setDownloadingDayNum(dayNum);
                    
                    // Trigger nostalgic photographer shutter sound
                    try {
                      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                      if (AudioContextClass) {
                        const ctx = new AudioContextClass();
                        const now = ctx.currentTime;
                        
                        // Shutter click sound
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = "sine";
                        osc.frequency.setValueAtTime(1000, now);
                        osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
                        
                        gain.gain.setValueAtTime(0, now);
                        gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
                        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
                        
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start(now);
                        osc.stop(now + 0.15);
                      }
                    } catch {}

                    setTimeout(() => {
                      setDownloadingDayNum(null);
                      // Fallback print message
                      const link = document.createElement("a");
                      link.href = imageUrl;
                      link.target = "_blank";
                      link.download = `AI-Memory-Day-${dayNum}-${iti.destinationName}.jpg`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }, 1200);
                  };

                  return (
                    <div 
                      key={dayNum}
                      className="w-72 bg-white border border-slate-200 p-4 pb-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 shrink-0 snap-center flex flex-col justify-between space-y-3.5 relative select-none group"
                    >
                      <div className="space-y-2">
                        {/* Polaroid Header Line */}
                        <div className="flex justify-between items-center bg-slate-50 p-1 px-2.5 rounded-lg border border-slate-100">
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none font-mono">
                            {lang === "ar" ? `اليوم ${dayNum}` : `DAY ${dayNum}`}
                          </span>
                          <span className="text-[8.5px] font-black tracking-wide text-slate-400 font-mono">
                            #{seedTheme}
                          </span>
                        </div>

                        {/* Creative Image */}
                        <div className="relative h-44 bg-slate-100 rounded-xl overflow-hidden border border-slate-100 shadow-3xs">
                          <img
                            src={imageUrl}
                            alt={`Day ${dayNum} AI Memory`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover filter brightness-95 group-hover:scale-103 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute top-2 right-2 flex gap-1 bg-black/50 p-1 rounded-md backdrop-blur-xs">
                            <span className="text-[8px] font-bold text-white uppercase tracking-wider px-1">
                              AI Generated
                            </span>
                          </div>
                        </div>

                        {/* Interactive captioning */}
                        <div className="space-y-1 text-right">
                          <h4 className="text-xs font-black text-slate-800 line-clamp-1 leading-snug">
                            {dayTitle}
                          </h4>
                          <p className="text-[10.5px] text-slate-500 italic leading-snug line-clamp-2">
                            {captionText}
                          </p>
                        </div>
                      </div>

                      {/* Polaroid actions bar */}
                      <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2 bg-slate-50/50 p-1.5 rounded-xl border border-separate">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDayNumber(dayNum);
                            setActiveTab("write");
                          }}
                          className="text-[10px] font-black text-indigo-600 hover:bg-white border hover:border-indigo-200 transition-all p-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                          title="Write Memory"
                        >
                          <Edit className="w-3 h-3" />
                          <span>{savedEntry ? (lang === "ar" ? "تعديل المذكرة" : "Edit Memo") : (lang === "ar" ? "اضف خاطرة" : "Add Reflection")}</span>
                        </button>

                        <button
                          type="button"
                          disabled={isDownloading}
                          onClick={handleSimulatedDownload}
                          className={`text-[10px] font-black p-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                            isDownloading 
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : "text-slate-550 hover:bg-white border hover:border-slate-300"
                          }`}
                          title="Download Poster"
                        >
                          {isDownloading ? (
                            <>
                              <span className="animate-spin inline-block w-2.5 h-2.5 rounded-full border border-indigo-500 border-t-transparent" />
                              <span>{lang === "ar" ? "عرض..." : "Rendering..."}</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3 h-3" />
                              <span>{lang === "ar" ? "حفظ كبطاقة" : "Save Polaroid"}</span>
                            </>
                          )}
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Written Journals Shelf */}
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">
                {lang === "ar" ? "📝 مذكرات السفر المحفوظة واليوميات المكتوبة" : "📝 Logged Written Memoirs & Diaries"}
              </h3>
              
              {diaryEntries.length === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-2 bg-white rounded-2xl border border-dashed border-slate-200">
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-full text-slate-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <p className="text-[10.5px] text-slate-400 font-bold leading-normal max-w-sm px-4">
                    {lang === "ar"
                      ? "لا توجد خواطر يومية مكتوبة مسبقاً. اضغط على 'اضف خاطرة' من بطاقات الذكاء الاصطناعي بالأعلى لتدوين مغامرتك!"
                      : "No written diary entries stored yet. Click 'Add Reflection' on any AI Memory Polaroid above to write!"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {diaryEntries.map((entry) => (
                    <div
                      key={entry.dayNumber}
                      className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
                    >
                      {entry.imageUrl && (
                        <div className="relative h-44 bg-slate-100 overflow-hidden">
                          <img
                            src={entry.imageUrl}
                            alt={`Memory day ${entry.dayNumber}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover filter brightness-95"
                          />
                          <span className="absolute top-3 left-3 bg-indigo-600/90 text-white font-black text-[9.5px] uppercase tracking-wide px-2.5 py-1 rounded-lg backdrop-blur-xs">
                            {lang === "ar" ? `اليوم ${entry.dayNumber}` : `Day ${entry.dayNumber}`}
                          </span>
                        </div>
                      )}

                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          {!entry.imageUrl && (
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-150 font-black px-2 py-0.5 rounded-md">
                                {lang === "ar" ? `اليوم ${entry.dayNumber}` : `Day ${entry.dayNumber}`}
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold">{entry.createdAt}</span>
                            </div>
                          )}
                          
                          <p className="text-xs text-slate-700 font-medium leading-relaxed line-clamp-4 text-right">
                            {entry.journalText}
                          </p>
                        </div>

                        <div className="border-t border-slate-100 pt-3 flex justify-between items-center gap-2 mt-2">
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedDayNumber(entry.dayNumber);
                                setActiveTab("write");
                              }}
                              className="text-[10.5px] font-black text-indigo-600 hover:bg-indigo-50 border border-indigo-150/20 px-2.5 py-1.5 rounded-lg cursor-pointer flex items-center gap-0.5"
                            >
                              <Edit className="w-3 h-3" />
                              <span>{lang === "ar" ? "تعديل" : "Edit"}</span>
                            </button>
                            
                            <button
                              onClick={() => handleDeleteEntry(entry.dayNumber)}
                              className="text-[10.5px] font-black text-rose-600 hover:bg-rose-50 px-2 py-1.5 rounded-lg cursor-pointer"
                            >
                              {lang === "ar" ? "مسح" : "Delete"}
                            </button>
                          </div>

                          {entry.imageUrl && (
                            <span className="text-[9px] text-slate-400 font-bold">{entry.createdAt}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
