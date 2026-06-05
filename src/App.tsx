/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Compass, 
  Search, 
  Plane, 
  Building2, 
  ShieldCheck, 
  MessageSquare, 
  Globe2, 
  Globe,
  Sparkles,
  Heart,
  CloudLightning,
  Palette,
  Clock,
  CloudSun,
  Map,
  MapPin,
  Calendar,
  Sun
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Itinerary, FlightMock, HotelMock } from "./types";
import { translations } from "./translations";
import { themes, regionalBackgrounds } from "./themes";

// Sub-components
import TravelPlanner from "./components/TravelPlanner";
import TranslationCustomizer from "./components/TranslationCustomizer";
import InteractiveSearch from "./components/InteractiveSearch";
import MyTripsDashboard from "./components/MyTripsDashboard";
import TravelChat from "./components/TravelChat";
import Fos7aIntegration from "./components/Fos7aIntegration";
import PrayerTimesCard from "./components/PrayerTimesCard";
import WeatherForecastCard from "./components/WeatherForecastCard";
import InteractiveMap, { resolveCoordinates } from "./components/InteractiveMap";
import RegionalHub from "./components/RegionalHub";

// Qibla Direction calculator copy helper
function calculateQibla(lat: number, lng: number): number {
  const PI = Math.PI;
  const latRad = lat * PI / 180;
  const lngRad = lng * PI / 180;
  const meccaLatRad = 21.4225 * PI / 180;
  const meccaLngRad = 39.8262 * PI / 180;

  const dLng = meccaLngRad - lngRad;

  const y = Math.sin(dLng);
  const x = Math.cos(latRad) * Math.tan(meccaLatRad) - Math.sin(latRad) * Math.cos(dLng);

  let qiblaBearing = Math.atan2(y, x) * 180 / PI;
  qiblaBearing = (qiblaBearing + 360) % 360;
  return qiblaBearing;
}

// Live Digital Clock Widget
const LiveClockWidget = ({ lang }: { lang: "ar" | "en" }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [lang]);

  const formattedTime = time.toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const formattedDate = time.toLocaleDateString(lang === "ar" ? "ar-DZ" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl overflow-hidden relative flex flex-col items-center justify-center text-center space-y-2">
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-radial from-transparent to-indigo-500/10" />
      <div className="text-[10px] font-black uppercase tracking-widest text-amber-500">
        {lang === "ar" ? "التوقيت الحي والمحلي" : "LIVE CURRENT TIME"}
      </div>
      <div className="text-3xl md:text-5xl font-black font-mono tracking-tight text-white drop-shadow-md">
        {formattedTime}
      </div>
      <div className="text-xs md:text-sm font-semibold text-slate-300">
        {formattedDate}
      </div>
      <div className="text-[9px] font-bold text-slate-500 bg-slate-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
        {lang === "ar" ? "توقيت الجزائر الرسمي (GMT+1)" : "Algeria Standard Time (GMT+1)"}
      </div>
    </div>
  );
};

// Interactive 360 Travel Compass
const InteractiveTravelCompass = ({ lang, lat, lng }: { lang: "ar" | "en"; lat: number; lng: number }) => {
  const [heading, setHeading] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartAngle = useRef(0);

  const meccaBearing = calculateQibla(lat, lng);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    dragStartAngle.current = startAngle - heading;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    let newHeading = currentAngle - dragStartAngle.current;
    
    newHeading = (newHeading + 360) % 360;
    setHeading(newHeading);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const getDirectionLabel = (angle: number) => {
    const directionsAr = ["شمال [N]", "شمال شرقي [NE]", "شرق [E]", "جنوب شرقي [SE]", "جنوب [S]", "جنوب غربي [SW]", "غرب [W]", "شمال غربي [NW]"];
    const directionsEn = ["North [N]", "North-East [NE]", "East [E]", "South-East [SE]", "South [S]", "South-West [SW]", "West [W]", "North-West [NW]"];
    const index = Math.round(angle / 45) % 8;
    return lang === "ar" ? directionsAr[index] : directionsEn[index];
  };

  return (
    <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs flex flex-col items-center justify-center space-y-4 text-center">
      <div className="text-start w-full border-b border-slate-100 pb-2">
        <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
          {lang === "ar" ? "أداة التوجيه الرقمي والبوصلة" : "Digital Travel Direction Dial"}
        </span>
        <h4 className="text-xs font-black text-slate-800 mt-1">
          {lang === "ar" ? "البوصلة الكونية المحاكية" : "Simulated Celestial Compass"}
        </h4>
        <p className="text-[10px] text-slate-450 font-semibold mt-0.5 leading-normal">
          {lang === "ar" ? "🔄 انقر واسحب القرص لتغيير اتجاه نظرك يدويًا ومحاكاة الجيروسكوب" : "🔄 Click & drag dial to rotate manually on desktops"}
        </p>
      </div>

      <div 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative w-48 h-48 rounded-full bg-slate-950 border-4 border-slate-900 shadow-xl flex items-center justify-center cursor-grab active:cursor-grabbing select-none overflow-hidden touch-none"
      >
        <div 
          className="absolute inset-0 flex items-center justify-center transition-transform duration-75"
          style={{ transform: `rotate(${-heading}deg)` }}
        >
          <div className="absolute w-[92%] h-[92%] border border-dashed border-white/10 rounded-full flex items-center justify-center">
            <span className="absolute top-2 text-[11px] font-black text-rose-500">N</span>
            <span className="absolute right-3 text-[10px] font-bold text-slate-400">E</span>
            <span className="absolute bottom-2 text-[10px] font-bold text-slate-400">S</span>
            <span className="absolute left-3 text-[10px] font-bold text-slate-400">W</span>

            <span className="absolute text-[8px] font-semibold text-slate-500 rotate-45 transform translate-y-[-40px] translate-x-[40px]">NE</span>
            <span className="absolute text-[8px] font-semibold text-slate-500 -rotate-45 transform translate-y-[40px] translate-x-[40px]">SE</span>
            <span className="absolute text-[8px] font-semibold text-slate-500 rotate-45 transform translate-y-[40px] translate-x-[-40px]">SW</span>
            <span className="absolute text-[8px] font-semibold text-slate-500 -rotate-45 transform translate-y-[-40px] translate-x-[-40px]">NW</span>

            <div className="w-20 h-20 border border-indigo-500/10 rounded-full flex items-center justify-center" />
          </div>
        </div>

        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ transform: `rotate(${meccaBearing - heading}deg)` }}
        >
          <div className="relative w-2 h-40 flex flex-col items-center justify-between">
            <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[24px] border-b-amber-500" />
            <div className="absolute top-[28px] bg-amber-600 w-1 h-5 rounded-full" />
            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[14px] border-t-slate-700" />
          </div>
        </div>

        <div className="w-10 h-10 bg-slate-900 border border-amber-400 shadow-md rounded-xl flex items-center justify-center text-xs z-30 select-none">
          🕋
        </div>
      </div>

      <div className="space-y-1 w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-semibold text-xs text-start">
        <div className="flex justify-between">
          <span className="text-slate-500">{lang === "ar" ? "زاوية انحراف شمالك الحالي:" : "Virtual Heading:"}</span>
          <span className="font-mono text-slate-805 font-extrabold">{heading.toFixed(0)}°</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">{lang === "ar" ? "الاتجاه المقترب:" : "Calculated Heading:"}</span>
          <span className="text-slate-805 font-extrabold">{getDirectionLabel(heading)}</span>
        </div>
        <div className="flex justify-between border-t border-slate-150/60 pt-1.5 mt-1.5">
          <span className="text-amber-700 font-bold">{lang === "ar" ? "اتجاه القِبلة لموقعك الحالي:" : "Qibla Mecca Angle:"}</span>
          <span className="font-mono text-amber-600 font-black">{meccaBearing.toFixed(1)}°</span>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  // Default to Arabic since the prompt was in Arabic, but allow quick bilingual switch!
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [currentPage, setCurrentPage] = useState<"portal" | "atmosphere" | "maps_compass" | "regional_hub">("portal");
  const [activeTab, setActiveTab] = useState<"planner" | "search" | "vault" | "chat" | "fos7a">("planner");
  const [activeTheme, setActiveTheme] = useState<string>(() => {
    return localStorage.getItem("app_theme") || "autumn";
  });
  const [activeBg, setActiveBg] = useState<string>(() => {
    return localStorage.getItem("app_bg_overlay") || "none";
  });
  const [themeSubPanel, setThemeSubPanel] = useState<"seasons" | "heritage">("seasons");
  const [showThemeMenu, setShowThemeMenu] = useState<boolean>(false);
  
  // App-level state coordination
  const [activeItinerary, setActiveItinerary] = useState<Itinerary | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<FlightMock | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<HotelMock | null>(null);
  const [plannerCoordinationTypeOverride, setPlannerCoordinationTypeOverride] = useState<"optional" | "fos7a" | null>(null);

  // Translation Customized Labs & States
  const [customTranslations, setCustomTranslations] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("custom_translations_overrides");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [contributedPhrases, setContributedPhrases] = useState<Array<{ key: string; original: string; custom: string; note?: string }>>(() => {
    try {
      const saved = localStorage.getItem("contributed_dialect_phrases");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showTranslationLab, setShowTranslationLab] = useState<boolean>(false);

  const t = useMemo(() => {
    const base = { ...translations[lang] };
    if (lang === "ar") {
      Object.entries(customTranslations).forEach(([key, val]) => {
        if (val) {
          (base as any)[key] = val;
        }
      });
    }
    return base;
  }, [lang, customTranslations]);

  const toggleLanguage = () => {
    setLang(prev => (prev === "ar" ? "en" : "ar"));
  };

  const handleItineraryGenerated = (itinerary: Itinerary) => {
    setActiveItinerary(itinerary);
    // Clear previously selected mock flight & hotel when a new trip is initiated
    setSelectedFlight(null);
    setSelectedHotel(null);
  };

  const handleLoadItineraryFromVault = (itinerary: Itinerary) => {
    setActiveItinerary(itinerary);
    // Try to restore mock selections if stored (handled simply on selection context)
    setActiveTab("planner");
  };

  const handleSelectFlight = (flight: FlightMock) => {
    setSelectedFlight(flight);
    // Overwrite the saved trip configuration if exists
    updateLocalStorageWithSelections(flight, selectedHotel);
  };

  const handleSelectHotel = (hotel: HotelMock) => {
    setSelectedHotel(hotel);
    updateLocalStorageWithSelections(selectedFlight, hotel);
  };

  const updateLocalStorageWithSelections = (flight: FlightMock | null, hotel: HotelMock | null) => {
    if (!activeItinerary) return;
    const existing = localStorage.getItem("saved_trips");
    if (!existing) return;
    
    try {
      const trips = JSON.parse(existing);
      const isMatchIdx = trips.findIndex((trip: any) => trip.itinerary.destinationName === activeItinerary.destinationName);
      
      if (isMatchIdx !== -1) {
        if (flight) trips[isMatchIdx].selectedFlight = flight;
        if (hotel) trips[isMatchIdx].selectedHotel = hotel;
        localStorage.setItem("saved_trips", JSON.stringify(trips));
      }
    } catch (e) {
      console.error("Failed to append flight/hotel selections to vault:", e);
    }
  };

  const changeTheme = (themeId: string) => {
    setActiveTheme(themeId);
    localStorage.setItem("app_theme", themeId);
  };

  const changeBackground = (bgId: string) => {
    setActiveBg(bgId);
    localStorage.setItem("app_bg_overlay", bgId);
  };

  const getSmartThemeRecommendation = () => {
    if (!activeItinerary) return null;
    const dest = (activeItinerary.destination || "").toLowerCase();
    
    if (dest.includes("ghardaia") || dest.includes("غرداية") || dest.includes("metlili") || dest.includes("شعانبة")) {
      return {
        themeId: "spring",
        bgId: "dunes",
        reasonAr: "تم رصد واحات غرداية ومتليلي الشعانبة! نوصي بالثيم الذهبي لرمال وادي ميزاب وكثبان متليلي.",
        reasonEn: "Sahara Ghardaia & Metlili detected! We recommend the golden spring dunes backdrop."
      };
    }
    if (dest.includes("algiers") || dest.includes("الجزائر") || dest.includes("oran") || dest.includes("تلمسان") || dest.includes("annaba") || dest.includes("عنابة")) {
      return {
        themeId: "summer",
        bgId: "mosaic",
        reasonAr: "تم رصد العاصمة العريقة أو المدن الساحلية! نوصي بثيم البحر الأبيض المتوسط وفسيفساء القصبة الأندلسية.",
        reasonEn: "Algiers or coastal cities detected! We recommend coastal themes and Andalusian mosaic tiles."
      };
    }
    if (dest.includes("bejaia") || dest.includes("بجاية") || dest.includes("jijel") || dest.includes("جيجل") || dest.includes("kabylie") || dest.includes("جرجرة") || dest.includes("constantine") || dest.includes("قسنطينة")) {
      return {
        themeId: "winter",
        bgId: "kabyle",
        reasonAr: "تم رصد جبال الأطلس ومنطقة القبائل الكبرى! نوصي بالخلفية الأمازيغية التحتية التراثية وثيم غابات الأرز الأخضر.",
        reasonEn: "Atlas peaks or Kabylie detected! We recommend pine green theme and Berber traditional weavers."
      };
    }
    if (dest.includes("djanet") || dest.includes("جانت") || dest.includes("tassili") || dest.includes("تاغيت")) {
      return {
        themeId: "spring",
        bgId: "tassili",
        reasonAr: "تم رصد جانت والطاسيلي بأعماق الصحراء! نوصي بالخلفية الكونية ونقوش كهوف التاسيلي الأثرية والنجوم النادرة.",
        reasonEn: "Deep Sahara & Tassili rock trails! We recommend cosmic black starscapes with rock engravings."
      };
    }
    return {
      themeId: "autumn",
      bgId: "none",
      reasonAr: "ثيم الخريف الهادئ الافتراضي المريح للأنظار.",
      reasonEn: "Our standard comfortable classic theme."
    };
  };

  const applySmartRecommendation = () => {
    const rec = getSmartThemeRecommendation();
    if (rec) {
      setActiveTheme(rec.themeId);
      localStorage.setItem("app_theme", rec.themeId);
      setActiveBg(rec.bgId);
      localStorage.setItem("app_bg_overlay", rec.bgId);
    }
  };

  const chosenBgConfig = regionalBackgrounds.find(bg => bg.id === activeBg) || regionalBackgrounds[0];

  return (
    <div 
      className={`min-h-screen theme-${activeTheme} ${chosenBgConfig.cssClass} text-slate-800 font-sans pb-12 relative overflow-hidden transition-all duration-300`}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* Aesthetic watermarked luxury backdrop travel logo in background */}
      <div className="absolute top-[25%] left-[-150px] w-[500px] h-[500px] pointer-events-none opacity-[0.02]/85 text-indigo-950 flex items-center justify-center font-black select-none pointer-events-none">
        <Compass className="w-full h-full animate-spin-slow text-slate-900 opacity-[0.02]" />
      </div>
      <div className="absolute bottom-[10%] right-[-150px] w-[600px] h-[600px] pointer-events-none opacity-[0.015]/85 text-indigo-950 flex items-center justify-center font-black select-none pointer-events-none">
        <Compass className="w-full h-full text-slate-900 opacity-[0.015]" />
      </div>
      {/* Upper Brand Navigation Bar */}
      <nav className="sticky top-0 bg-white/85 backdrop-blur-md border-b border-slate-100 z-50 shadow-sm h-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-150 transform hover:rotate-6 transition-transform">
              <Compass className="w-5.5 h-5.5 animate-spin-slow" />
            </div>
            <div>
              <span className="font-extrabold text-base md:text-lg block text-slate-800 tracking-tight leading-none">
                {t.title}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1">
                {lang === "ar" ? "الذكاء الاصطناعي لوكلاء السياحة" : "AI Powered Holiday Advisor"}
              </span>
            </div>
          </div>

          {/* Quick Actions Right (Lang & Theme Selector) */}
          <div className="flex items-center gap-2.5 relative">
            
            {/* Theme Selector Popover */}
            <div className="relative">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                type="button"
                className="px-3 py-2 rounded-xl text-xs font-bold transition-all border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 tracking-wider flex items-center gap-1.5 cursor-pointer text-slate-700"
                title={lang === "ar" ? "تغيير المظهر / الفصل" : "Change Seasonal/Event Theme"}
              >
                <Palette className="w-4 h-4 text-indigo-500" />
                <span className="hidden sm:inline">
                  {lang === "ar" ? "ثيم الواجهة" : "Theme"}
                </span>
                <span className="text-sm">{themes.find(th => th.id === activeTheme)?.icon || "🎨"}</span>
              </button>

              {showThemeMenu && (
                <>
                  {/* Overlay to dim backdrop and close */}
                  <div 
                    className="fixed inset-0 z-40 cursor-default" 
                    onClick={() => setShowThemeMenu(false)} 
                  />
                  
                  {/* Theme Popover Menu */}
                  <div className={`absolute ${lang === "ar" ? "left-0" : "right-0"} mt-2 w-80 md:w-[350px] rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl z-50 animate-fade-in text-slate-800 space-y-3`}>
                    <div className="pb-1 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                        <Palette className="w-4 h-4 text-indigo-500" />
                        {lang === "ar" ? "تخصيص ثيم وتراث النظام" : "Theme & Cultural Heritage"}
                      </span>
                    </div>

                    {/* Smart Suggestion Banner based on Destination */}
                    {activeItinerary && (
                      <div className="p-2.5 rounded-xl bg-indigo-50/75 border border-indigo-100 text-right space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-indigo-900 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                            {lang === "ar" ? "المقترح الثقافي للوجهة" : "AI Cultural Suggestion"}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              applySmartRecommendation();
                              setShowThemeMenu(false);
                            }}
                            className="bg-indigo-650 hover:bg-indigo-750 text-white rounded-lg px-2 py-1 text-[9px] font-black tracking-wider transition-colors cursor-pointer"
                          >
                            {lang === "ar" ? "تطبيق تلقائي" : "Auto Apply"}
                          </button>
                        </div>
                        <p className="text-[10.5px] text-slate-700 leading-normal font-semibold">
                          {lang === "ar" ? getSmartThemeRecommendation()?.reasonAr : getSmartThemeRecommendation()?.reasonEn}
                        </p>
                      </div>
                    )}

                    {/* Tab Switcher */}
                    <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setThemeSubPanel("seasons")}
                        className={`py-1.5 text-[10px] font-black rounded-lg cursor-pointer transition-all ${
                          themeSubPanel === "seasons"
                            ? "bg-white text-indigo-900 shadow-xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {lang === "ar" ? "🍂 فصول ومناسبات" : "Autumn & Seasons"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setThemeSubPanel("heritage")}
                        className={`py-1.5 text-[10px] font-black rounded-lg cursor-pointer transition-all ${
                          themeSubPanel === "heritage"
                            ? "bg-white text-indigo-900 shadow-xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {lang === "ar" ? "🕌 زخارف التراث" : "Heritage Backgrounds"}
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-[260px] overflow-y-auto pt-1">
                      {themeSubPanel === "seasons" ? (
                        themes.map((theme) => {
                          const isSelected = activeTheme === theme.id;
                          return (
                            <button
                              key={theme.id}
                              type="button"
                              onClick={() => {
                                changeTheme(theme.id);
                                setShowThemeMenu(false);
                              }}
                              className={`w-full p-2 rounded-xl text-start transition-all flex items-start gap-2.5 cursor-pointer border ${
                                isSelected
                                  ? "bg-indigo-50/50 border-indigo-200 text-slate-950 font-bold"
                                  : "bg-white border-transparent hover:bg-slate-50 text-slate-650 hover:text-slate-900"
                              }`}
                            >
                              <span className="text-lg p-1.5 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                                {theme.icon}
                              </span>
                              <div className="space-y-0.5 pointer-events-none text-right">
                                <div className="flex items-center gap-1.5 text-xs font-black">
                                  <span className={isSelected ? "text-indigo-900" : "text-slate-800"}>
                                    {lang === "ar" ? theme.nameAr : theme.nameEn}
                                  </span>
                                  {isSelected && (
                                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse shrink-0" />
                                  )}
                                </div>
                                <p className="text-[9.5px] text-slate-400 font-bold leading-none">
                                  {lang === "ar" ? theme.seasonAr : theme.seasonEn}
                                </p>
                                <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">
                                  {lang === "ar" ? theme.descriptionAr : theme.descriptionEn}
                                </p>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        regionalBackgrounds.map((bg) => {
                          const isSelected = activeBg === bg.id;
                          return (
                            <button
                              key={bg.id}
                              type="button"
                              onClick={() => {
                                changeBackground(bg.id);
                                setShowThemeMenu(false);
                              }}
                              className={`w-full p-2 rounded-xl text-start transition-all flex items-start gap-2.5 cursor-pointer border ${
                                isSelected
                                  ? "bg-emerald-50/50 border-emerald-250 text-slate-950 font-bold"
                                  : "bg-white border-transparent hover:bg-slate-50 text-slate-650 hover:text-slate-900"
                              }`}
                            >
                              <span className="text-lg p-1.5 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                                {bg.icon}
                              </span>
                              <div className="space-y-0.5 pointer-events-none text-right">
                                <div className="flex items-center gap-1.5 text-xs font-black">
                                  <span className={isSelected ? "text-emerald-900" : "text-slate-800"}>
                                    {lang === "ar" ? bg.nameAr : bg.nameEn}
                                  </span>
                                  {isSelected && (
                                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shrink-0" />
                                  )}
                                </div>
                                <p className="text-[9.5px] text-slate-400 font-bold leading-none">
                                  {lang === "ar" ? bg.regionAr : bg.regionEn}
                                </p>
                                <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">
                                  {lang === "ar" ? bg.descriptionAr : bg.descriptionEn}
                                </p>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

              {/* Expand Translations Settings button */}
              <button
                onClick={() => setShowTranslationLab(prev => !prev)}
                type="button"
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold sm:font-bold transition-all border flex items-center gap-1.5 cursor-pointer select-none ${
                  showTranslationLab
                    ? "bg-indigo-950 border-indigo-600 text-indigo-300"
                    : "bg-indigo-50/60 hover:bg-indigo-50 border-indigo-150 hover:border-indigo-250 text-indigo-750"
                }`}
                title={lang === "ar" ? "معمل وخطط وتوسيع ترجمات اللهجات" : "Translation & Dialect Sub-panel Lab"}
              >
                <Globe className="w-4 h-4 text-indigo-500" />
                <span>{lang === "ar" ? "🛠️ معمل اللهجات والترجمة" : "🛠️ Dialect & Translation Lab"}</span>
              </button>

              {/* Language Switcher */}
              <button
                onClick={toggleLanguage}
                type="button"
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 tracking-wider flex items-center gap-1.5 cursor-pointer text-slate-700"
              >
                <Globe2 className="w-4 h-4 text-slate-400" />
                <span>{t.langToggle}</span>
              </button>
            </div>

          </div>
        </nav>

        {/* Hero Header Presentation */}
        <header className="max-w-7xl mx-auto px-4 md:px-8 pt-6 md:pt-10 pb-4 flex flex-col items-center justify-center text-center space-y-3.5">
        <div className="inline-flex items-center gap-1 bg-white border border-slate-100 shadow-sm px-3.5 py-1.5 rounded-full text-xs font-bold text-indigo-600">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>{lang === "ar" ? "خطط رحلتك الاستثنائية بلمسة ذكاء اصطناعي واكتشف أفضل المعالم والرحلات" : "Bespoke holidays generated in seconds using Gemini intelligence"}</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
          {lang === "ar" 
            ? "بوابة سفرك المتكاملة بلمسات ذكية" 
            : "Your Ultimate Personal AI Travel Agency"}
        </h1>
        <p className="text-sm md:text-base text-slate-500 font-medium max-w-2xl leading-relaxed">
          {t.subtitle}
        </p>
      </header>

      {/* Main Tab bar Controller */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-2 space-y-8">
        
        <AnimatePresence>
          {showTranslationLab && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: "auto", scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden mb-6"
            >
              <TranslationCustomizer
                lang={lang}
                customTranslations={customTranslations}
                contributedPhrases={contributedPhrases}
                onUpdateTranslations={(updated) => {
                  setCustomTranslations(updated);
                  localStorage.setItem("custom_translations_overrides", JSON.stringify(updated));
                }}
                onAddContributedPhrase={(key, original, custom, note) => {
                  const updated = [...contributedPhrases, { key, original, custom, note }];
                  setContributedPhrases(updated);
                  localStorage.setItem("contributed_dialect_phrases", JSON.stringify(updated));
                }}
                onClose={() => setShowTranslationLab(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Multi-Page Selector Module */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              id: "portal" as const,
              labelAr: "بوابة سفرك المتكاملة",
              labelEn: "Integrated Travel Portal",
              descAr: "مخطط الرحلات الذكي، وحجز الطيران والفنادق، ونبض المساعد وتكامل سحابة فسحة",
              descEn: "Forge AI travel blueprints, search flights/hotels, talk with guides & sync itineraries",
              icon: <Compass className="w-5 h-5" />,
              color: "indigo"
            },
            {
              id: "atmosphere" as const,
              labelAr: "مواقيت الصلاة والأجواء",
              labelEn: "Prayers & Climate Outlook",
              descAr: "الساعة المباشرة، ومواقيت صلاة المسافرين (رخصة الفطر والجمع) وحساب القبلة وتوقعات الطقس ومقترحات التعبئة",
              descEn: "Live standard clocks, prayer tables helper, virtual Qibla dial & weather forecasts",
              icon: <Clock className="w-5 h-5" />,
              color: "amber"
            },
            {
              id: "maps_compass" as const,
              labelAr: "الخرائط والبوصلة التفاعلية",
              labelEn: "Interactive Maps & Compass",
              descAr: "تتبع المسافات والإحداثيات (GPS)، خطوط السير البرية والسكك الحديدية وعربات الوقوف والبوصلة الرقمية ثنائية التوجيه",
              descEn: "Seamless airline tracks, railway corridor bedding, layover stops, and digital physical compass gauge",
              icon: <Map className="w-5 h-5" />,
              color: "emerald"
            },
            {
              id: "regional_hub" as const,
              labelAr: "ساحة الأحداث والجمال الفصلي",
              labelEn: "Festivals & Seasonal Wellness",
              descAr: "روزنامة المهرجانات الوطنية والشعبية، عمود الأخبار والرحلات البيئية المستدامة، واستشارات الصحة والعناية الفصيلة",
              descEn: "Local folklore calendars, eco-safari chronicles, and custom medical wellness & beauty suggestions",
              icon: <Sparkles className="w-5 h-5" />,
              color: "rose"
            }
          ].map((page) => {
            const isSelected = currentPage === page.id;
            return (
              <button
                key={page.id}
                onClick={() => setCurrentPage(page.id)}
                type="button"
                className={`p-4 rounded-2xl border text-start transition-all duration-200 select-none hover:scale-102 cursor-pointer flex flex-col justify-between ${
                  isSelected 
                    ? "bg-indigo-600 border-indigo-400 text-white shadow-md ring-4 ring-indigo-500/20" 
                    : "bg-white border-slate-100 hover:border-slate-200 text-slate-700 shadow-xs"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl flex items-center justify-center border ${
                    isSelected ? "bg-white/20 border-white/30 text-white animate-pulse" : "bg-indigo-50 border-indigo-100 text-indigo-600"
                  }`}>
                    {page.icon}
                  </div>
                  <div>
                    <h2 className="font-extrabold text-sm tracking-tight">
                      {lang === "ar" ? page.labelAr : page.labelEn}
                    </h2>
                    <span className={`text-[10px] font-bold block mt-0.5 ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                      {page.id === "portal" 
                        ? `(${t.navPlanner})` 
                        : page.id === "atmosphere" 
                          ? `(🌦️ ${lang === "ar" ? "الأجواء" : "Climate"})` 
                          : page.id === "maps_compass" 
                            ? `(🗺️ ${lang === "ar" ? "الخرائط والبوصلة" : "Compass"})` 
                            : `(🌸 ${lang === "ar" ? "الأحداث والجمال" : "Regional Hub"})`}
                    </span>
                  </div>
                </div>
                <p className={`text-[11px] font-semibold leading-normal mt-3 ${isSelected ? "text-indigo-150" : "text-slate-500"}`}>
                  {lang === "ar" ? page.descAr : page.descEn}
                </p>
              </button>
            );
          })}
        </div>

        {/* Dynamic Page Router Content */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {currentPage === "portal" && (
                <div className="space-y-6">
                  {/* Navigation Selector */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-2 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="grid grid-cols-2 md:flex md:flex-row gap-1 w-full">
                      <button
                        onClick={() => setActiveTab("planner")}
                        className={`px-4 py-3 rounded-xl font-bold text-xs md:text-sm tracking-wide transition-all duration-150 flex items-center gap-2 justify-center cursor-pointer ${
                          activeTab === "planner"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <Compass className="w-4 h-4" />
                        <span>{t.navPlanner}</span>
                      </button>

                      <button
                        onClick={() => setActiveTab("search")}
                        className={`px-4 py-3 rounded-xl font-bold text-xs md:text-sm tracking-wide transition-all duration-150 flex items-center gap-2 justify-center cursor-pointer ${
                          activeTab === "search"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <Plane className="w-4 h-4" />
                        <span>{t.navSearch}</span>
                      </button>

                      <button
                        onClick={() => setActiveTab("vault")}
                        className={`px-4 py-3 rounded-xl font-bold text-xs md:text-sm tracking-wide transition-all duration-150 flex items-center gap-2 justify-center cursor-pointer ${
                          activeTab === "vault"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{t.navVault}</span>
                      </button>

                      <button
                        onClick={() => setActiveTab("chat")}
                        className={`px-4 py-3 rounded-xl font-bold text-xs md:text-sm tracking-wide transition-all duration-150 flex items-center gap-2 justify-center cursor-pointer ${
                          activeTab === "chat"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>{t.navChat}</span>
                      </button>

                      <button
                        onClick={() => setActiveTab("fos7a")}
                        className={`px-4 py-3 rounded-xl font-bold text-xs md:text-sm tracking-wide transition-all duration-150 flex items-center gap-2 justify-center cursor-pointer ${
                          activeTab === "fos7a"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <CloudLightning className="w-4 h-4" />
                        <span>{t.navFos7a}</span>
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Tab Panels Router */}
                  <div className="min-h-[400px]">
                    {activeTab === "planner" && (
                      <TravelPlanner
                        lang={lang}
                        onItineraryGenerated={handleItineraryGenerated}
                        onUpdateItinerary={setActiveItinerary}
                        activeItinerary={activeItinerary}
                        selectedFlight={selectedFlight}
                        selectedHotel={selectedHotel}
                        initialCoordinationTypeOverride={plannerCoordinationTypeOverride}
                        onResetCoordinationTypeOverride={() => setPlannerCoordinationTypeOverride(null)}
                      />
                    )}

                    {activeTab === "search" && (
                      <InteractiveSearch
                        lang={lang}
                        activeItinerary={activeItinerary}
                        onSelectFlight={handleSelectFlight}
                        onSelectHotel={handleSelectHotel}
                        selectedFlight={selectedFlight}
                        selectedHotel={selectedHotel}
                        onUpdateItinerary={setActiveItinerary}
                        onRequestFos7aAssistantRedirect={() => {
                          setActiveTab("planner");
                          setPlannerCoordinationTypeOverride("fos7a");
                        }}
                      />
                    )}

                    {activeTab === "vault" && (
                      <MyTripsDashboard
                        lang={lang}
                        onLoadItinerary={handleLoadItineraryFromVault}
                      />
                    )}

                    {activeTab === "chat" && (
                      <TravelChat
                        lang={lang}
                        activeItinerary={activeItinerary}
                      />
                    )}

                    {activeTab === "fos7a" && (
                      <Fos7aIntegration
                        lang={lang}
                        activeItinerary={activeItinerary}
                        onInjectPlace={(place: any) => {
                          if (!activeItinerary) {
                            const dummyItinerary: Itinerary = {
                              destinationName: place.wilaya,
                              country: lang === "ar" ? "الجزائر" : "Algeria",
                              tripDurationDays: 1,
                              targetBudgetLevel: "Economy",
                              travelerType: "Solo",
                              languageCode: lang,
                              days: [
                                {
                                  dayNumber: 1,
                                  theme: lang === "ar" ? "استكشاف معالم برنامج فسحة مخصصة" : "Custom Fos7a DZ Explored Spots",
                                  activities: [
                                    {
                                      title: place.name,
                                      description: place.description,
                                      timeOfDay: lang === "ar" ? "صباحاً" : "Morning",
                                      durationHours: 3,
                                      estimatedCostUSD: place.avgCostUSD,
                                      locationName: place.wilaya
                                    }
                                  ]
                                }
                              ],
                              suggestedHotels: [
                                {
                                  name: lang === "ar" ? "نزل الدار التقليدي" : "Traditional Dar Guest House",
                                  stars: 4,
                                  pricePerNightUSD: 40,
                                  ratingValue: 4.7,
                                  reasonForRecommendation: lang === "ar" ? "إقامة تقليدية ملائمة تماماً بأصالة" : "Authentic local guest house recommendation"
                                }
                              ],
                              customPackingList: [],
                              localTravelTips: []
                            };
                            setActiveItinerary(dummyItinerary);
                          } else {
                            const updated = { ...activeItinerary };
                            if (updated.days && updated.days.length > 0) {
                              updated.days[0].activities.push({
                                title: place.name,
                                description: place.description,
                                timeOfDay: lang === "ar" ? "مساءً" : "Evening",
                                durationHours: 2.5,
                                estimatedCostUSD: place.avgCostUSD,
                                locationName: place.wilaya
                              });
                              setActiveItinerary(updated);
                            }
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
              )}

              {currentPage === "atmosphere" && (
                <div className="grid grid-cols-1 gap-6">
                  {/* Live Digital Clock Widget */}
                  <LiveClockWidget lang={lang} />

                  {/* Prayer times */}
                  <PrayerTimesCard 
                    destinationName={activeItinerary?.destinationName || (lang === "ar" ? "الجزائر" : "Algiers")}
                    lang={lang} 
                  />

                  {/* Weather outlook with smart packing forecasts */}
                  <WeatherForecastCard 
                    destinationName={activeItinerary?.destinationName || (lang === "ar" ? "الجزائر" : "Algiers")}
                    lang={lang} 
                    itinerary={activeItinerary || undefined}
                  />
                </div>
              )}

              {currentPage === "maps_compass" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Standalone Interactive Route Map */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
                        <div>
                          <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            🗺️ {lang === "ar" ? "تتبع المسافات والإحداثيات التفاعلية" : "Dynamic GPS Matrix Tracker"}
                          </span>
                          <h4 className="text-sm font-black text-slate-800 mt-1">
                            {lang === "ar" 
                              ? `خريطة السفر لرحلة: ${activeItinerary?.destinationName || "الجزائر"}` 
                              : `Travel Route Blueprint: ${activeItinerary?.destinationName || "Algiers"}`}
                          </h4>
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold font-mono">
                          LAT: {resolveCoordinates(activeItinerary?.destinationName || "Algiers", activeItinerary?.country || "Algeria").lat.toFixed(4)} 
                          • LNG: {resolveCoordinates(activeItinerary?.destinationName || "Algiers", activeItinerary?.country || "Algeria").lng.toFixed(4)}
                        </div>
                      </div>

                      <div className="h-[480px] rounded-xl overflow-hidden border border-slate-150 relative">
                        <InteractiveMap
                          lang={lang}
                          destinationName={activeItinerary?.destinationName || (lang === "ar" ? "غرداية" : "Ghardaia")}
                          country={activeItinerary?.country || (lang === "ar" ? "الجزائر" : "Algeria")}
                          originName={activeItinerary?.originWilaya || (lang === "ar" ? "الجزائر العاصمة" : "Algiers")}
                          flights={[]}
                          hotels={[]}
                          selectedFlight={selectedFlight}
                          selectedHotel={selectedHotel}
                          transitMode={activeItinerary?.transitMode || "Plane"}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Magnetic & Qibla Compass and Directions */}
                  <div className="lg:col-span-1">
                    <InteractiveTravelCompass 
                      lang={lang}
                      lat={resolveCoordinates(activeItinerary?.destinationName || "Algiers", activeItinerary?.country || "Algeria").lat}
                      lng={resolveCoordinates(activeItinerary?.destinationName || "Algiers", activeItinerary?.country || "Algeria").lng}
                    />
                  </div>
                </div>
              )}

              {currentPage === "regional_hub" && (
                <RegionalHub 
                  lang={lang}
                  activeSeasonTheme={activeTheme}
                  destinationCity={activeItinerary?.destinationName}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Elegant minimalist footer */}
      <footer className="max-w-7xl mx-auto px-4 md:px-8 mt-16 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-center">
        <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
          © {new Date().getFullYear()} AI Smart Travel Agency. {lang === "ar" ? "وكيل السائحين المتكامل" : "All rights reserved. Designed to explore."}
        </span>
        <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
          {lang === "ar" ? "صُنع بشغف للاستكشاف" : "Made with passion for explorations"} <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
        </span>
      </footer>
    </div>
  );
}
