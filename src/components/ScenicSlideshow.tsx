/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  Plus, 
  Trash2, 
  Star, 
  Clock, 
  DollarSign, 
  MapPin, 
  Sparkles, 
  Award,
  BookOpen,
  Camera,
  Layers,
  X,
  Compass
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Itinerary } from "../types";

export interface ScenicSlideshowProps {
  itinerary: Itinerary;
  lang: "ar" | "en";
  onLandmarkClick?: (landmarkName: string) => void;
}

interface ItinerarySlide {
  id: string;
  dayNumber: number;
  dayTheme: string;
  title: string;
  description: string;
  timeOfDay: string;
  cost: number;
  image: string;
  customTip: string;
  heritageFact: string;
  isCustom?: boolean;
}

export default function ScenicSlideshow({ itinerary, lang, onLandmarkClick }: ScenicSlideshowProps) {
  const isAr = lang === "ar";
  
  // 1. Theme and playing controls state
  const [activeSlideIdx, setActiveSlideIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeTheme, setActiveTheme] = useState<"desert" | "marine" | "royal" | "forest">("desert");
  const [isAudioNarrating, setIsAudioNarrating] = useState<boolean>(false);
  
  // 2. Add custom slides state
  const [customSlides, setCustomSlides] = useState<ItinerarySlide[]>([]);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newSlideTitle, setNewSlideTitle] = useState("");
  const [newSlideDesc, setNewSlideDesc] = useState("");
  const [newSlideDay, setNewSlideDay] = useState<number>(1);
  const [newSlideTime, setNewSlideTime] = useState("Morning");
  const [newSlideCategory, setNewSlideCategory] = useState<"desert" | "beach" | "stadium" | "museum" | "market" | "food">("stadium");
  
  // 3. User customized ratings/starred list (Saved per slide ID)
  const [starredSlides, setStarredSlides] = useState<Record<string, boolean>>({});

  // Unique identifier for local storage namespaces
  const itineraryId = useMemo(() => {
    return `${itinerary.destinationName}-${itinerary.tripDurationDays}-${itinerary.departureDate || "default"}`;
  }, [itinerary]);

  // Load persisted custom slides & star loyalty on mount
  useEffect(() => {
    const savedCustom = localStorage.getItem(`scenic_custom_slides_${itineraryId}`);
    if (savedCustom) {
      try {
        setCustomSlides(JSON.parse(savedCustom));
      } catch (e) {
        console.error("Error loading custom slides", e);
      }
    }

    const savedStars = localStorage.getItem(`scenic_starred_slides_${itineraryId}`);
    if (savedStars) {
      try {
        setStarredSlides(JSON.parse(savedStars));
      } catch (e) {
        console.error("Error loading starred slides", e);
      }
    }
  }, [itineraryId]);

  // Map category keywords to premium Unsplash URLs
  const getCategoryPhotoUrl = (cat: string): string => {
    switch (cat) {
      case "desert":
        return "https://images.unsplash.com/photo-1542401886-65d6c61db217?auto=format&fit=crop&q=80&w=800"; // golden Sahara desert
      case "beach":
        return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800"; // turquoise sea beach
      case "museum":
        return "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80&w=800"; // classical columns
      case "market":
        return "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&q=80&w=800"; // vibrant market crafts
      case "food":
        return "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&q=80&w=800"; // delicious dining plate
      case "stadium":
      default:
        return "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800"; // football stadium
    }
  };

  // Compile active itinerary activities into default visual slides
  const defaultSlides = useMemo<ItinerarySlide[]>(() => {
    if (!itinerary || !itinerary.days) return [];
    
    const slides: ItinerarySlide[] = [];
    
    itinerary.days.forEach((day) => {
      day.activities.forEach((act, aIdx) => {
        const titleLower = (act.title || "").toLowerCase();
        
        let imageUrl = "";
        let cat: "stadium" | "desert" | "beach" | "museum" | "market" | "food" = "stadium";

        if (titleLower.includes("stadium") || titleLower.includes("match") || titleLower.includes("ملعب") || titleLower.includes("مباراة") || titleLower.includes("كرة")) {
          cat = "stadium";
        } else if (titleLower.includes("sahara") || titleLower.includes("desert") || titleLower.includes("صحراء") || titleLower.includes("كثبان") || titleLower.includes("تاغيت") || titleLower.includes("بشار")) {
          cat = "desert";
        } else if (titleLower.includes("beach") || titleLower.includes("sea") || titleLower.includes("بحر") || titleLower.includes("شاطئ") || titleLower.includes("بجاية") || titleLower.includes("مستغانم") || titleLower.includes("ساحل")) {
          cat = "beach";
        } else if (titleLower.includes("museum") || titleLower.includes("historic") || titleLower.includes("متحف") || titleLower.includes("تاريخ") || titleLower.includes("أثري") || titleLower.includes("تيبازة") || titleLower.includes("قالمة")) {
          cat = "museum";
        } else if (titleLower.includes("market") || titleLower.includes("souk") || titleLower.includes("سوق") || titleLower.includes("بزار") || titleLower.includes("تسوق")) {
          cat = "market";
        } else if (titleLower.includes("food") || titleLower.includes("restaurant") || titleLower.includes("أكل") || titleLower.includes("طعام") || titleLower.includes("عشاء") || titleLower.includes("غداء") || titleLower.includes("كسكس")) {
          cat = "food";
        } else {
          // Select fallback photo cyclically based on length of title
          const fallbacks: ("stadium" | "desert" | "beach" | "museum" | "market" | "food")[] = ["stadium", "desert", "beach", "museum", "market", "food"];
          cat = fallbacks[(act.title.length + aIdx) % fallbacks.length];
        }

        imageUrl = getCategoryPhotoUrl(cat);

        const customTip = isAr
          ? `💡 نصيحة محلية: يُنصح بزيارة هذا المعلم الجذاب برفقة الأصدقاء أو المشجعين لالتقاط صور تذكارية رائعة وتفادي ساعات الذروة.`
          : `💡 Local Tip: Visually majestic! It is best enjoyed in companionship. Excellent for snapshots, but keep an eye on crowds.`;

        const heritageFact = isAr
          ? `✨ نبذة تراثية: يعكس هذا المعلم الساحر غنى التراث وحسن الضيافة وعمق الهوية السياحية المتميزة للمنطقة.`
          : `✨ Cultural Heritage: This prime landmark portrays the profound local customs, amazing hospitality patterns, and historical value of the city.`;

        slides.push({
          id: `default-${day.dayNumber}-${aIdx}`,
          dayNumber: day.dayNumber,
          dayTheme: day.theme,
          title: act.title,
          description: act.description,
          timeOfDay: act.timeOfDay || (isAr ? "خلال اليوم" : "Daytime"),
          cost: act.estimatedCostUSD || 0,
          image: imageUrl,
          customTip,
          heritageFact
        });
      });
    });

    return slides;
  }, [itinerary, isAr]);

  // Combine default active slides with user custom slides
  const allSlides = useMemo<ItinerarySlide[]>(() => {
    return [...defaultSlides, ...customSlides];
  }, [defaultSlides, customSlides]);

  // Handle Autoplay timing increment loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying && allSlides.length > 0) {
      interval = setInterval(() => {
        setActiveSlideIdx((prev) => (prev + 1) % allSlides.length);
      }, 5500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, allSlides.length]);

  const currentSlide = allSlides[activeSlideIdx] || allSlides[0];

  // Speech synthesis speaker play commentary
  const handleToggleAudioExplanation = () => {
    if (isAudioNarrating) {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsAudioNarrating(false);
      return;
    }

    if (!currentSlide || typeof window === "undefined" || !window.speechSynthesis) {
      return;
    }

    setIsAudioNarrating(true);
    const speechText = `${currentSlide.title}. ${currentSlide.description}. ${currentSlide.heritageFact}. ${currentSlide.customTip}`;
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = isAr ? "ar-DZ" : "en-US";
    
    utterance.onend = () => {
      setIsAudioNarrating(false);
    };

    utterance.onerror = () => {
      setIsAudioNarrating(false);
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  // Turn voice narration off when changing slides
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsAudioNarrating(false);
  }, [activeSlideIdx]);

  // Handle slide removal
  const handleRemoveCustomSlide = (slideId: string) => {
    const updated = customSlides.filter(s => s.id !== slideId);
    setCustomSlides(updated);
    localStorage.setItem(`scenic_custom_slides_${itineraryId}`, JSON.stringify(updated));
    if (activeSlideIdx >= updated.length + defaultSlides.length) {
      setActiveSlideIdx(Math.max(0, updated.length + defaultSlides.length - 1));
    }
  };

  // Add custom slide logic
  const handleAddSlideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlideTitle.trim() || !newSlideDesc.trim()) return;

    const newSlideId = `custom-${Date.now()}`;
    const customTip = isAr
      ? `💡 نصيحة مخصصة: استعد لتسجيل أروع لحظات رحلتك الممتعة هنا.`
      : `💡 Custom Fan Tip: Be fully ready to craft a breathtaking record of your sightseeing moments here.`;

    const heritageFact = isAr
      ? `✨ إطلالة تراثية متميزة: معلم سياحي مخصص أضيف بذكاء لخارطة برنامج الرحلة لزيادة المتعة والاستكشاف.`
      : `✨ Scenic Addition: A personalized coordinate added seamlessly to enhance your visual travel schedule.`;

    const nextSlide: ItinerarySlide = {
      id: newSlideId,
      dayNumber: newSlideDay,
      dayTheme: isAr ? `يوم مخصص ${newSlideDay}` : `Custom Event - Day ${newSlideDay}`,
      title: newSlideTitle,
      description: newSlideDesc,
      timeOfDay: newSlideTime,
      cost: 0,
      image: getCategoryPhotoUrl(newSlideCategory),
      customTip,
      heritageFact,
      isCustom: true
    };

    const updated = [...customSlides, nextSlide];
    setCustomSlides(updated);
    localStorage.setItem(`scenic_custom_slides_${itineraryId}`, JSON.stringify(updated));

    // Reset fields
    setNewSlideTitle("");
    setNewSlideDesc("");
    setShowAddForm(false);
    setActiveSlideIdx(allSlides.length); // Hop to the newly added slide index immediately
  };

  // Star slide toggle
  const handleToggleStar = (id: string) => {
    const next = { ...starredSlides, [id]: !starredSlides[id] };
    setStarredSlides(next);
    localStorage.setItem(`scenic_starred_slides_${itineraryId}`, JSON.stringify(next));
  };

  // Helper theme configuration
  const themeStyles = {
    desert: {
      background: "bg-gradient-to-br from-amber-950 via-slate-900 to-yellow-950 border-amber-500/30",
      accent: "text-amber-400 bg-amber-500/10 border-amber-500/35",
      btnActive: "bg-amber-500 text-slate-950 hover:bg-amber-400",
      pillBg: "bg-amber-950/75 border-amber-800/40"
    },
    marine: {
      background: "bg-gradient-to-br from-slate-950 via-indigo-950 to-cyan-950 border-cyan-500/30",
      accent: "text-cyan-400 bg-cyan-500/10 border-cyan-500/35",
      btnActive: "bg-cyan-500 text-slate-950 hover:bg-cyan-400",
      pillBg: "bg-cyan-950/75 border-cyan-850/40"
    },
    royal: {
      background: "bg-gradient-to-br from-purple-950 via-slate-900 to-fuchsia-950 border-fuchsia-500/30",
      accent: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/35",
      btnActive: "bg-fuchsia-500 text-white hover:bg-fuchsia-400",
      pillBg: "bg-purple-950/75 border-purple-800/40"
    },
    forest: {
      background: "bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 border-emerald-500/30",
      accent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/35",
      btnActive: "bg-emerald-500 text-slate-950 hover:bg-emerald-400",
      pillBg: "bg-emerald-950/75 border-emerald-800/40"
    }
  }[activeTheme];

  if (allSlides.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 text-slate-500 font-bold">
        ⚠️ {isAr ? "لا توجد معالم أو أنشطة كافية في هذا المخطط لتوليد العرض البصري." : "No sightseeing nodes found in this itinerary to assemble a presentation deck."}
      </div>
    );
  }

  return (
    <div className="space-y-6" id="scenic-interactive-slideshow">
      {/* Slideshow Control Dashboard Section */}
      <div className={`p-4 rounded-2xl border transition-all ${themeStyles.background} text-white space-y-4 shadow-lg`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              {isAr ? "لوحة العرض البصري التفاعلي" : "SCENIC SLIDESHOW PRESENTATION"}
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              {isAr 
                ? `تصفح أهم المعالم والأنشطة السياحية لرحلتك إلى ${itinerary.destinationName} بأسلوب معزز وديناميكي.`
                : `Interactive virtual travel agenda presentation of premium sights for your custom holiday package.`}
            </p>
          </div>

          {/* Theme customizers */}
          <div className="flex flex-wrap items-center gap-1.5 self-center">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 mr-1">
              🎨 {isAr ? "الأجواء:" : "Vibe Theme:"}
            </span>
            {[
              { id: "desert" as const, label: isAr ? "🏜️ صحراوي" : "Desert" },
              { id: "marine" as const, label: isAr ? "🌊 بحري" : "Marine" },
              { id: "royal" as const, label: isAr ? "👑 ملوكي" : "Royal" },
              { id: "forest" as const, label: isAr ? "🌲 غابي" : "Forest" }
            ].map((themeOpt) => {
              const active = activeTheme === themeOpt.id;
              return (
                <button
                  key={themeOpt.id}
                  type="button"
                  onClick={() => setActiveTheme(themeOpt.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-all ${
                    active 
                      ? "bg-white text-slate-900 shadow-sm font-bold scale-[1.01]" 
                      : "bg-white/10 hover:bg-white/15 text-slate-350"
                  }`}
                >
                  {themeOpt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
          <div className="flex items-center gap-2">
            {/* Play/Pause Autoplay button */}
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                isPlaying 
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" 
                  : themeStyles.btnActive
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? (isAr ? "إيقاف مؤقت" : "Pause Deck") : (isAr ? "تشغيل تلقائي" : "Autoplay")}</span>
            </button>

            {/* Narrator commentary voice button */}
            <button
              type="button"
              onClick={handleToggleAudioExplanation}
              className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 cursor-pointer ${
                isAudioNarrating
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 animate-pulse"
                  : "bg-white/5 border-white/10 hover:bg-white/10 text-slate-100"
              }`}
              title={isAr ? "استمع للمرشد السياحي الرياضي" : "Listen to audio commentary"}
            >
              {isAudioNarrating ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isAudioNarrating ? (isAr ? "كتم الصوت" : "Stop Voice") : (isAr ? "استمع للمرشد" : "Audio Guide")}</span>
            </button>

            {isAudioNarrating && (
              <span className="inline-flex gap-0.5 items-center justify-center h-4 text-emerald-400">
                <span className="w-1 bg-emerald-400 rounded animate-bounce h-2" />
                <span className="w-1 bg-emerald-400 rounded animate-bounce h-3.5 [animation-delay:0.2s]" />
                <span className="w-1 bg-emerald-400 rounded animate-bounce h-2.5 [animation-delay:0.4s]" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Add Custom Sight button */}
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 rounded-xl text-xs font-black bg-indigo-650 hover:bg-indigo-600 border border-indigo-500/35 text-white flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? "أضف معلماً مخصصاً" : "Add Custom Slide"}</span>
            </button>
          </div>
        </div>

        {/* Dynamic add form overlay inside card */}
        <AnimatePresence>
          {showAddForm && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleAddSlideSubmit}
              className="mt-3 p-4 rounded-xl bg-white/5 border border-white/10 space-y-3.5"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h4 className="text-xs font-black text-slate-200">
                  ➕ {isAr ? "إضافة معلم سياحي مخصص للعرض البصري" : "APPEND LANDMARK SLIDE"}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-slate-800">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-350 font-black tracking-wide uppercase">
                    {isAr ? "اسم المعلم السياحي أو الفعالية النشطة" : "Landmark / Attraction Title"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newSlideTitle}
                    onChange={(e) => setNewSlideTitle(e.target.value)}
                    placeholder={isAr ? "مثال: ملعب 5 جويلية، شاطئ الصخرة، جبال الشريعة..." : "e.g., Roman Theatre, Grand Dunes..."}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/15 text-white text-xs font-medium placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-350 font-black tracking-wide uppercase">
                    {isAr ? "أجواء وصنف صورة المعلم" : "Visual Vibe & Photo Category"}
                  </label>
                  <select
                    value={newSlideCategory}
                    onChange={(e) => setNewSlideCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/15 text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="stadium">⚽ {isAr ? "ملعب كرة أو رياضة" : "Sports Stadium / Arena"}</option>
                    <option value="desert">🏜️ {isAr ? "كثبان وجو صحراوي" : "Sahara Dunes / Desert"}</option>
                    <option value="beach">🌊 {isAr ? "ساحل بحر أو شاطئ مميز" : "Sea / Coast Beach"}</option>
                    <option value="museum">🏛️ {isAr ? "أثوري ومتحف أو بناء تاريخي" : "Museum / Ruins / Classical"}</option>
                    <option value="market">🛍️ {isAr ? "أسواق وصناعات تقليدية غنية" : "Vibrant Local Market Souk"}</option>
                    <option value="food">🍽️ {isAr ? "أكل ومطاعم شهيرة" : "Gourmet Dish / Food Option"}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-350 font-black tracking-wide uppercase">
                    {isAr ? "تخصيص لليوم رقم" : "Associated Day Number"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={itinerary.tripDurationDays || 10}
                    value={newSlideDay}
                    onChange={(e) => setNewSlideDay(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/15 text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-350 font-black tracking-wide uppercase">
                    {isAr ? "الفترة الزمنية المفضلة" : "Preferred Visiting Time"}
                  </label>
                  <select
                    value={newSlideTime}
                    onChange={(e) => setNewSlideTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/15 text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Morning">🌅 {isAr ? "الفترة الصباحية" : "Morning Block"}</option>
                    <option value="Afternoon">☀️ {isAr ? "فترة الظهيرة والمساء" : "Afternoon Block"}</option>
                    <option value="Evening">🌙 {isAr ? "الفترة الليلية الساهرة" : "Evening / Nightly"}</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] text-slate-350 font-black tracking-wide uppercase">
                    {isAr ? "وصف المعلم والأنشطة المقترحة فيه" : "Detailed Landmark Overview"}
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={newSlideDesc}
                    onChange={(e) => setNewSlideDesc(e.target.value)}
                    placeholder={isAr ? "اكتب تفاصيل المعلم مثل: زيارة غرف كبار الشخصيات، حضور التدريبات، تسوق تذكاري..." : "Review the landmark's highlights and scheduling hints..."}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/15 text-white text-xs font-medium placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-350 hover:text-white"
                >
                  {isAr ? "إلغاء الأمر" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-black bg-emerald-500 border border-emerald-400 text-slate-950 hover:bg-emerald-400"
                >
                  {isAr ? "حفظ وإضافة" : "Append Slide"}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Main Slide Interactive Frame */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Visual interactive slide viewer (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className={`relative overflow-hidden rounded-3xl border ${themeStyles.background} shadow-xl aspect-16/9 md:min-h-[380px] text-white flex flex-col justify-end p-6 md:p-8 transition-all`}>
            {/* Background scenic photo overlay */}
            <AnimatePresence mode="wait">
              <motion.img
                key={currentSlide.id + "-bg"}
                src={currentSlide.image}
                alt={currentSlide.title}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 0.38, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.55 }}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                referrerPolicy="no-referrer"
              />
            </AnimatePresence>

            {/* Backdrop visual filters */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none z-10" />

            {/* Top-right card tools */}
            <div className="absolute top-5 left-5 right-5 z-20 flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${themeStyles.pillBg}`}>
                  📅 {isAr ? `اليوم ${currentSlide.dayNumber}` : `DAY ${currentSlide.dayNumber}`}
                </span>
                <span className="text-xs font-bold text-indigo-300 drop-shadow-md">
                  {currentSlide.dayTheme}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Check / Star loyalty buttons */}
                <button
                  type="button"
                  onClick={() => handleToggleStar(currentSlide.id)}
                  className={`p-2 rounded-xl border backdrop-blur-md cursor-pointer transition-all ${
                    starredSlides[currentSlide.id]
                      ? "bg-yellow-500/10 border-yellow-400 text-yellow-400 scale-[1.08] shadow-sm"
                      : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                  }`}
                  title={isAr ? "تمييز المعلم كمفضل للرحلة" : "Star this sight"}
                >
                  <Star className={`w-4 h-4 ${starredSlides[currentSlide.id] ? "fill-yellow-400" : ""}`} />
                </button>

                {/* If custom slide, allow deleting */}
                {currentSlide.isCustom && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomSlide(currentSlide.id)}
                    className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 cursor-pointer transition-all"
                    title={isAr ? "حذف هذا المعلم المخصص" : "Delete custom slide"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Slide interactive text presentation block */}
            <div className="z-20 relative space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Specific tags */}
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${themeStyles.accent}`}>
                  <Clock className="w-3 h-3" />
                  {currentSlide.timeOfDay}
                </span>

                {currentSlide.cost > 0 && (
                  <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    <DollarSign className="w-3 h-3" />
                    {isAr ? `${currentSlide.cost} دولار أمريكي` : `$${currentSlide.cost}`}
                  </span>
                )}

                {starredSlides[currentSlide.id] && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-amber-500/15 border border-amber-400/30 text-amber-300">
                    👑 {isAr ? "مضمون ومفضل" : "Key Favorite Target"}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => onLandmarkClick?.(currentSlide.title)}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer transition-colors border border-indigo-400/40"
                  title={isAr ? "استكشف تاريخ المعلم بالـ AI" : "Explore AI Landmark History & Trivia"}
                >
                  ✨ {isAr ? "عرض تاريخ المعلم بالـ AI" : "AI History & Trivia"}
                </button>
              </div>

              <div className="space-y-1.5 text-right md:text-start lg:text-start">
                <h2 className="text-xl md:text-2xl font-black text-white leading-tight drop-shadow-lg flex items-center gap-2">
                  <Camera className="w-5 h-5 text-indigo-400 shrink-0" />
                  {currentSlide.title}
                </h2>
                <p className="text-xs md:text-sm text-slate-200/90 leading-relaxed font-semibold max-w-2xl drop-shadow-md">
                  {currentSlide.description}
                </p>
              </div>

              {/* Collateral dynamic commentary insights widgets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-white/10">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 backdrop-blur-xs text-start">
                  <p className="text-[9.5px] uppercase font-black text-slate-400 flex items-center gap-1 tracking-wider">
                    <Award className="w-3 h-3 text-amber-400" />
                    {isAr ? "الهوية التاريخية" : "ARCHAEOLOGICAL BACKDROP"}
                  </p>
                  <p className="text-[11px] text-slate-200 font-bold leading-relaxed mt-1">
                    {currentSlide.heritageFact}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-white/5 backdrop-blur-xs text-start">
                  <p className="text-[9.5px] uppercase font-black text-indigo-400 flex items-center gap-1 tracking-wider">
                    <BookOpen className="w-3 h-3 text-indigo-400" />
                    {isAr ? "دليل مرافقة المشجع" : "DIARY FAN COMPANION"}
                  </p>
                  <p className="text-[11px] text-slate-200 font-bold leading-relaxed mt-1">
                    {currentSlide.customTip}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Seeking progress timeline overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10 z-20">
              {isPlaying && (
                <motion.div 
                  key={activeSlideIdx}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 5.5, ease: "linear" }}
                  className="h-full bg-indigo-500"
                />
              )}
            </div>
          </div>

          {/* Stepper Slide Navigation Trigger Footer */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setActiveSlideIdx((prev) => (prev - 1 + allSlides.length) % allSlides.length);
              }}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-xs flex items-center gap-1 transition-all shadow-3xs cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{isAr ? "السابق" : "Prev slide"}</span>
            </button>

            {/* Bullet Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-sm px-4">
              {allSlides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveSlideIdx(idx)}
                  className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${
                    activeSlideIdx === idx 
                      ? "w-6 bg-indigo-600 scale-102" 
                      : "w-2 bg-slate-300 hover:bg-slate-400"
                  }`}
                  title={`${isAr ? "المعلم" : "Sight"} ${idx + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveSlideIdx((prev) => (prev + 1) % allSlides.length);
              }}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-xs flex items-center gap-1 transition-all shadow-3xs cursor-pointer"
            >
              <span>{isAr ? "التالي" : "Next slide"}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right column: Slides directory / Filmstrip sidebar (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-150 p-4 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-500" />
              {isAr ? `فهرس معالم الرحلة (${allSlides.length})` : `SLIDES DIRECTORY (${allSlides.length})`}
            </h3>
            
            {customSlides.length > 0 && (
              <span className="text-[9px] bg-emerald-50 text-emerald-600 font-black px-2 py-0.5 rounded border border-emerald-250">
                ⭐ {isAr ? `+${customSlides.length} مخصص` : `+${customSlides.length} custom`}
              </span>
            )}
          </div>

          {/* Sizable list of slides */}
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
            {allSlides.map((slide, idx) => {
              const isSelected = activeSlideIdx === idx;
              const isStarred = starredSlides[slide.id];
              return (
                <button
                  key={slide.id}
                  onClick={() => setActiveSlideIdx(idx)}
                  className={`w-full p-2.5 rounded-xl border text-start flex items-center gap-3 transition-all cursor-pointer ${
                    isSelected 
                      ? "bg-indigo-50/70 border-indigo-500/80 ring-2 ring-indigo-50" 
                      : "bg-slate-50/40 border-slate-100 hover:border-slate-200"
                  }`}
                >
                  {/* Photo thumbnail */}
                  <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                    <img 
                      src={slide.image} 
                      alt={slide.title} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-extrabold ${isSelected ? "text-indigo-650" : "text-slate-400"}`}>
                        {isAr ? `اليوم ${slide.dayNumber}` : `Day ${slide.dayNumber}`}
                      </span>

                      {isStarred && (
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      )}
                    </div>
                    
                    <h4 className={`text-xs font-black truncate leading-normal ${isSelected ? "text-indigo-950" : "text-slate-800"}`}>
                      {slide.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5 scrollbar-none font-medium">
                      {slide.timeOfDay} • {slide.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick PDF Presentation Booklet trigger */}
          <div className="pt-2 border-t border-slate-100">
            <div className="p-3 bg-gradient-to-br from-indigo-50/50 to-emerald-50/30 rounded-2xl border border-indigo-100/50 text-center space-y-2">
              <p className="text-[10.5px] font-bold text-indigo-950 leading-relaxed">
                {isAr 
                  ? "احجز باقة المشاهدة والرحلة التكفلية الشاملة مع الفندق والملعب بمجرد تأكيد المخطط!"
                  : "Enjoy absolute convenience with integrated concierge matching your slide selections."}
              </p>
              
              <div className="flex items-center justify-center gap-1 text-[9.5px] text-emerald-600 font-extrabold">
                <Compass className="w-3.5 h-3.5 animate-spin-slow" />
                <span>{isAr ? "معالم مصدقة وموثقة بالذكاء الاصطناعي" : "Coordinated Tourism Package Ready"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
