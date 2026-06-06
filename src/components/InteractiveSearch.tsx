/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Plane, Building2, Search, Check, Star, Wind, Heart, MapPin, Calendar, Compass, X, SlidersHorizontal, RotateCcw, ShieldCheck, Sparkles, Users, Send } from "lucide-react";
import { motion } from "motion/react";
import { Itinerary, FlightMock, HotelMock } from "../types";
import { translations } from "../translations";
import InteractiveMap from "./InteractiveMap";

interface InteractiveSearchProps {
  lang: "ar" | "en";
  activeItinerary: Itinerary | null;
  onSelectFlight: (flight: FlightMock) => void;
  onSelectHotel: (hotel: HotelMock) => void;
  selectedFlight: FlightMock | null;
  selectedHotel: HotelMock | null;
  onUpdateItinerary?: (itinerary: Itinerary) => void;
  onRequestFos7aAssistantRedirect?: () => void;
}

const parseDurationToMinutes = (durationStr: string): number => {
  const match = durationStr.match(/(\d+)\s*h\s*(\d*)\s*m?/i);
  if (match) {
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    return hours * 60 + minutes;
  }
  return 0;
};

export default function InteractiveSearch({
  lang,
  activeItinerary,
  onSelectFlight,
  onSelectHotel,
  selectedFlight,
  selectedHotel,
  onUpdateItinerary,
  onRequestFos7aAssistantRedirect
}: InteractiveSearchProps) {
  const t = translations[lang];

  // Tab: "flights" | "hotels"
  const [activeTab, setActiveTab] = useState<"flights" | "hotels">("flights");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  
  // Results Lists
  const [flights, setFlights] = useState<FlightMock[]>([]);
  const [hotels, setHotels] = useState<HotelMock[]>([]);

  const [preferencesSaved, setPreferencesSaved] = useState(false);

  // --- AI Smart Ticket & Lodging Assistant States ---
  const [smartQuery, setSmartQuery] = useState("");
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartError, setSmartError] = useState("");
  const [smartResult, setSmartResult] = useState<{
    detectedOrigin: string;
    detectedDestination: string;
    transportMode: string;
    lodgingType: string;
    isDomestic: boolean;
    approxPriceUSD: number;
    localPriceDZD: number;
    stayDurationDays: number;
    accommodationDetails: string;
    aiGuidanceText: string;
  } | null>(null);
  const [useSmartInference, setUseSmartInference] = useState(false);

  const handleSmartSearchHelp = async (queryText?: string) => {
    const activeQuery = queryText || smartQuery;
    if (!activeQuery.trim()) {
      setSmartError(lang === "ar" ? "يرجى كتابة خطتك أو طلبك للمساعد أولاً!" : "Please enter your travel details or request first!");
      return;
    }
    setSmartLoading(true);
    setSmartError("");
    try {
      const response = await fetch("https://nory-fos7a-ai-smart-backend.onrender.com/api/smart-search-help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: activeQuery, lang })
      });
      if (!response.ok) {
        throw new Error(lang === "ar" ? "فشلت معالجة الطلب عبر مساعد الذكاء الاصطناعي." : "Failed to process smart search request.");
      }
      const data = await response.json();
      setSmartResult(data);
      setUseSmartInference(true);
      
      if (data.detectedDestination) {
        setSearchQuery(data.detectedDestination);
        triggerMockSearch(data.detectedDestination);
      }
    } catch (err: any) {
      console.error(err);
      setSmartError(err.message || (lang === "ar" ? "حدث خطأ غير متوقع أثناء تواصلك مع المساعد." : "An unexpected error occurred while calling the assistant."));
    } finally {
      setSmartLoading(false);
    }
  };

  // Sorting and Filtering States
  const [flightSort, setFlightSort] = useState<"price_asc" | "price_desc" | "duration" | null>(() => {
    const saved = localStorage.getItem("search_prefs_flightSort");
    return (saved && saved !== "") ? (saved as any) : null;
  });
  const [hotelSort, setHotelSort] = useState<"price_asc" | "price_desc" | "rating" | null>(() => {
    const saved = localStorage.getItem("search_prefs_hotelSort");
    return (saved && saved !== "") ? (saved as any) : null;
  });

  // --- Travel Insurance States ---
  const [insuranceEnabled, setInsuranceEnabled] = useState(
    activeItinerary?.insurancePolicy?.enabled || false
  );
  const [insuranceType, setInsuranceType] = useState<"basic" | "premium" | "comprehensive">(
    activeItinerary?.insurancePolicy?.type || "basic"
  );
  const [insuranceDays, setInsuranceDays] = useState(
    activeItinerary?.tripDurationDays || 7
  );
  const [insuranceZone, setInsuranceZone] = useState<"local" | "mena" | "europe" | "worldwide">(
    activeItinerary?.insurancePolicy?.zone || "local"
  );
  const [insuranceAge, setInsuranceAge] = useState<"youth" | "adult" | "senior">(
    activeItinerary?.insurancePolicy?.ageGroup || "adult"
  );

  // --- Fos7a DZ Sponsorship States ---
  const [sponsorshipEnabled, setSponsorshipEnabled] = useState(
    activeItinerary?.fos7aSponsorship?.enabled || false
  );
  const [travelConfig, setTravelConfig] = useState<"solo" | "group" | "family" | "couple" | "lovers">(
    activeItinerary?.fos7aSponsorship?.travelConfig || "solo"
  );
  const [tripTheme, setTripTheme] = useState<"cultural" | "sahara" | "mountain" | "coastal" | "business">(
    activeItinerary?.fos7aSponsorship?.tripTheme || "cultural"
  );
  const [departureWilaya, setDepartureWilaya] = useState(
    activeItinerary?.fos7aSponsorship?.departureWilaya || "Algiers"
  );
  const [includeReturn, setIncludeReturn] = useState(
    activeItinerary?.fos7aSponsorship?.includeReturn !== false
  );
  const [submittingSponsorship, setSubmittingSponsorship] = useState(false);
  const [sponsorshipResult, setSponsorshipResult] = useState<{submitted: boolean, quoteMin: number, quoteMax: number} | null>(
    activeItinerary?.fos7aSponsorship?.submitted ? {
      submitted: true,
      quoteMin: activeItinerary.fos7aSponsorship.estimatedMinDZD,
      quoteMax: activeItinerary.fos7aSponsorship.estimatedMaxDZD
    } : null
  );

  // Insurance calculation coefficients
  const getBaseRatePerDay = () => {
    switch (insuranceType) {
      case "basic": return 1.5;
      case "premium": return 3.5;
      case "comprehensive": return 5.5;
    }
  };

  const getZoneMultiplier = () => {
    switch (insuranceZone) {
      case "local": return 0.8;
      case "mena": return 1.1;
      case "europe": return 1.4;
      case "worldwide": return 1.8;
    }
  };

  const getAgeMultiplier = () => {
    switch (insuranceAge) {
      case "youth": return 0.9;
      case "adult": return 1.0;
      case "senior": return 1.5;
    }
  };

  const calculateInsurancePremium = () => {
    const cost = getBaseRatePerDay() * insuranceDays * getZoneMultiplier() * getAgeMultiplier();
    return parseFloat(cost.toFixed(2));
  };

  // sponsorship estimation in Algerian DZD
  const calculateSponsorshipQuote = () => {
    let baseDZD = 5000;
    if (travelConfig === "couple") baseDZD = 8500;
    if (travelConfig === "lovers") baseDZD = 9500;
    if (travelConfig === "family") baseDZD = 18000;
    if (travelConfig === "group") baseDZD = 15000;

    const days = activeItinerary?.tripDurationDays || insuranceDays || 7;
    let factor = 1.0;
    if (tripTheme === "sahara") factor = 1.45;
    if (tripTheme === "mountain") factor = 1.25;
    if (tripTheme === "business") factor = 1.6;

    const min = baseDZD * days * factor;
    const max = min * 1.35;
    return { min: Math.round(min), max: Math.round(max) };
  };

  // Synchronize options to activeItinerary in global state
  const syncAddonsToGlobalState = (
    insEnabled: boolean,
    insType: "basic" | "premium" | "comprehensive",
    insDays: number,
    insZone: "local" | "mena" | "europe" | "worldwide",
    insAge: "youth" | "adult" | "senior",
    sponEnabled: boolean,
    sponConfig: "solo" | "group" | "family" | "couple" | "lovers",
    sponTheme: "cultural" | "sahara" | "mountain" | "coastal" | "business",
    sponWilaya: string,
    sponReturn: boolean,
    sponResult: {submitted: boolean, quoteMin: number, quoteMax: number} | null
  ) => {
    if (!activeItinerary || !onUpdateItinerary) return;

    const premium = getBaseRatePerDay() * insDays * getZoneMultiplier() * getAgeMultiplier();
    const updatedItinerary: Itinerary = {
      ...activeItinerary,
      insurancePolicy: {
        enabled: insEnabled,
        type: insType,
        premiumUSD: parseFloat(premium.toFixed(2)),
        days: insDays,
        zone: insZone,
        ageGroup: insAge
      },
      fos7aSponsorship: {
        enabled: sponEnabled,
        travelConfig: sponConfig,
        tripTheme: sponTheme,
        departureWilaya: sponWilaya,
        includeReturn: sponReturn,
        estimatedMinDZD: sponResult ? sponResult.quoteMin : calculateSponsorshipQuote().min,
        estimatedMaxDZD: sponResult ? sponResult.quoteMax : calculateSponsorshipQuote().max,
        submitted: sponResult ? sponResult.submitted : false
      }
    };
    onUpdateItinerary(updatedItinerary);
  };

  const handleSponsorshipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingSponsorship(true);
    setTimeout(() => {
      setSubmittingSponsorship(false);
      const quotes = calculateSponsorshipQuote();
      setSponsorshipResult({
        submitted: true,
        quoteMin: quotes.min,
        quoteMax: quotes.max
      });
    }, 1500);
  };

  // Watch for Changes to auto-commit State
  useEffect(() => {
    if (activeItinerary) {
      syncAddonsToGlobalState(
        insuranceEnabled,
        insuranceType,
        insuranceDays,
        insuranceZone,
        insuranceAge,
        sponsorshipEnabled,
        travelConfig,
        tripTheme,
        departureWilaya,
        includeReturn,
        sponsorshipResult
      );
    }
  }, [
    insuranceEnabled,
    insuranceType,
    insuranceDays,
    insuranceZone,
    insuranceAge,
    sponsorshipEnabled,
    travelConfig,
    tripTheme,
    departureWilaya,
    includeReturn,
    sponsorshipResult,
    activeItinerary?.destinationName
  ]);

  // Sorted Arrays helpers
  const getSortedFlights = () => {
    let sorted = [...flights];
    if (flightSort === "price_asc") {
      sorted.sort((a, b) => a.priceUSD - b.priceUSD);
    } else if (flightSort === "price_desc") {
      sorted.sort((a, b) => b.priceUSD - a.priceUSD);
    } else if (flightSort === "duration") {
      sorted.sort((a, b) => parseDurationToMinutes(a.duration) - parseDurationToMinutes(b.duration));
    }
    return sorted;
  };

  const getSortedHotels = () => {
    let sorted = [...hotels];
    if (hotelSort === "price_asc") {
      sorted.sort((a, b) => a.priceUSD - b.priceUSD);
    } else if (hotelSort === "price_desc") {
      sorted.sort((a, b) => b.priceUSD - a.priceUSD);
    } else if (hotelSort === "rating") {
      sorted.sort((a, b) => b.rating - a.rating);
    }
    return sorted;
  };

  const handleSavePreferences = () => {
    localStorage.setItem("search_prefs_flightSort", flightSort || "");
    localStorage.setItem("search_prefs_hotelSort", hotelSort || "");
    setPreferencesSaved(true);
    setTimeout(() => {
      setPreferencesSaved(false);
    }, 2000);
  };

  // Synchronize with active Itinerary
  useEffect(() => {
    if (activeItinerary) {
      setSearchQuery(activeItinerary.destinationName);
      triggerMockSearch(activeItinerary.destinationName);
    }
  }, [activeItinerary]);

  const triggerMockSearch = (city: string) => {
    if (!city.trim()) return;
    setSearching(true);
    
    // Create authentic feeling data tailored based on character length/hash of the city name
    setTimeout(() => {
      const parsedCity = city.trim();
      
      const airlines = lang === "ar" 
        ? ["طيران الإمارات", "الخطوط القطرية", "الخطوط السعودية", "مصر للطيران", "طيران الاتحاد", "الخطوط اليابانية"]
        : ["Emirates", "Qatar Airways", "Saudi Arabian Airlines", "EgyptAir", "Etihad Airways", "Japan Airlines"];
        
      const suffix = ["AI-301", "QA-708", "SV-220", "MS-442", "EY-115", "JL-061"];

      // Mock Flights
      const generatedFlights: FlightMock[] = Array.from({ length: 4 }).map((_, i) => {
        const hash = (parsedCity.length + i) % airlines.length;
        const price = 280 + (hash * 120) + (i * 45);
        return {
          airline: airlines[hash],
          flightNumber: suffix[hash] + "-" + (i + 1),
          departureTime: `${10 + i}:20 AM`,
          arrivalTime: `${16 + i * 2}:45 PM`,
          duration: `${6 + i}h 25m`,
          priceUSD: price,
          stops: i === 0 ? 0 : 1,
          luggageDetail: lang === "ar"
            ? "حقيبة يد 10 كغ + حقيبة شحن رئيسية 23 كغ مشمولة مجاناً"
            : "10kg Overhead Cabin Bag + 23kg Checked Bag fully included",
          mealOption: lang === "ar"
            ? "وجبة ساخنة فاخرة (طبق رئيسي مع حلوى) ومشروبات طازجة على متن الطائرة"
            : "Complimentary premium hot meal & fresh cabin beverages served",
          aircraftModel: i % 2 === 0 ? "Boeing 737-800 Max" : "Airbus A321neo",
          cabinClass: lang === "ar" ? "الدرجة السياحية المريحة (مساحة أكبر للأرجل)" : "Economy Classic (Extra Legroom Seats)"
        };
      });

      // Mock Hotels
      const prefix = lang === "ar" 
        ? ["فندق جراند بالاس", "منتجع ماريوت ريزيدنس", "فندق هيلتون بريمير", "شيراتون بيتش وفيلات", "أجنحة سفير الفندقية"]
        : ["Grand Palace Hotel", "Marriott Residence Resort", "Hilton Premier Suites", "Sheraton Beach & Villas", "Safir Signature Stay"];
        
      const featuresList = lang === "ar" 
        ? [["واي فاي مجاني", "مسبح داخلي", "إفطار متضمن", "موقف سيارات"], ["إطلالة بحرية غامرة", "مركز عافية وسبا", "بوفيه مفتوح فاخر"], ["صالة ألعاب رياضية", "مكتب سياحي جولات مخصصة"]]
        : [["Free Wi-Fi", "Indoor Pool", "Free Breakfast", "Valet Parking"], ["Full Ocean View", "Wellness Spa & Massage", "Michelin Buffet"], ["Local City Tour Shuttle", "Fitness Center", "Rooftop Lounge"]];

      const roomTypesAr = [
        "غرفة ديلوكس كينج مزدوجة مع إطلالة بانورامية رائعة",
        "جناح تنفيذي واسع للعائلات مع شرفة خاصة مطلة",
        "غرفة بريميوم توين فاخرة متكاملة التجهيزات العصرية",
        "جناح جونيور ملكي مريح مع جاكوزي ومستلزمات الحمام"
      ];
      const roomTypesEn = [
        "Deluxe Double King Room with spectacular panoramic view",
        "Spacious Executive Family Suite with private outdoor balcony",
        "Premium Luxury Twin Room fully equipped with smart utilities",
        "Comfortable Junior Royal Suite with private jacuzzi & fine amenities"
      ];

      const generatedHotels: HotelMock[] = Array.from({ length: 4 }).map((_, i) => {
        const hash = (parsedCity.length + i) % prefix.length;
        const rating = parseFloat((4.2 + (i * 0.2) % 0.8).toFixed(1));
        return {
          name: prefix[hash] + " " + parsedCity,
          stars: 4 + (i % 2),
          rating: rating,
          reviews: 120 + (i * 94),
          priceUSD: 95 + (hash * 40) + (i * 25),
          address: `${12 + i * 4} Road, City Center, ${parsedCity}`,
          imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80", // Reliable unsplash fallback
          amenities: featuresList[i % featuresList.length],
          roomType: lang === "ar" ? roomTypesAr[i % roomTypesAr.length] : roomTypesEn[i % roomTypesEn.length],
          breakfastIncluded: i % 3 !== 2,
          cancellationPolicy: lang === "ar"
            ? "إلغاء مجاني آمن قبل 24 ساعة من تاريخ موعد الوصول"
            : "Risk-free Free Cancellation up to 24 hours prior to check-in",
          availableRoomsCount: 2 + (i % 4)
        };
      });

      setFlights(generatedFlights);
      setHotels(generatedHotels);
      setSearching(false);
    }, 1200);
  };

  const handleSearchBtnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerMockSearch(searchQuery);
  };

  return (
    <div className="space-y-8" id="interactive-search-component">
      <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
        <div className="space-y-1.5 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-500" />
            {t.searchTitle}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {t.searchSubtitle}
          </p>
        </div>

        {/* --- AI Smart Ticket & Lodging Assistant Section --- */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50/40 via-purple-50/10 to-slate-50 border border-indigo-100/60 space-y-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-indigo-100/30 pb-3">
            <div>
              <h3 className="text-sm md:text-base font-black text-slate-800 flex items-center gap-2">
                <span className="p-1 px-1.5 rounded-lg bg-indigo-600 text-white text-[10px] md:text-xs font-sans font-bold">AI</span>
                <span>{lang === "ar" ? "مساعد التذاكر والإقامة الذكي" : "AI Smart Tickets & Lodging Assistant"}</span>
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                {lang === "ar"
                  ? "اكتب فكرتك وتفاصيل رحلتك وسنتكفل بفرز تذاكر الطيران، نوع وسيلة النقل، السعر والعملة المحلية بدقة."
                  : "Specify your journey idea; we will arrange transport types, local prices in DZD, and lodging matches automatically."}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <textarea
              rows={2}
              value={smartQuery}
              onChange={(e) => setSmartQuery(e.target.value)}
              placeholder={
                lang === "ar"
                  ? "مثال: أريد السفر من الجزائر العاصمة إلى قسنطينة بالقطار مع إقامة في دار ضيافة لمدة 3 أيام"
                  : "e.g., I want to travel from Algiers to Oran by train and stay in traditional guesthouse for 3 days"
              }
              className="w-full p-3 text-xs md:text-sm rounded-xl border border-slate-200 outline-none focus:border-indigo-500 bg-white text-slate-800 font-semibold placeholder-slate-400 shadow-sm"
            />

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] text-slate-400 font-bold">{lang === "ar" ? "💡 مقترحات سريعة:" : "Quick Ideas:"}</span>
              {[
                { 
                  ar: "سفر من الجزائر العاصمة إلى غرداية بالحافلة والإقامة بدار ضيافة لـ 4 أيام", 
                  en: "Travel from Algiers to Ghardaia by bus and stay in traditional guesthouse for 4 days" 
                },
                { 
                  ar: "رحلة من وهران إلى قسنطينة بالقطار مع إقامة في فندق لـ 3 أيام", 
                  en: "Trip from Oran to Constantine by Train with hotel stay for 3 days" 
                },
                { 
                  ar: "طائرة من الجزائر إلى باريس وإقامة في فندق لـ 5 أيام", 
                  en: "Flight from Algiers to Paris with hotel stay for 5 days" 
                }
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSmartQuery(lang === "ar" ? p.ar : p.en);
                    handleSmartSearchHelp(lang === "ar" ? p.ar : p.en);
                  }}
                  className="text-[10px] bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-slate-600 hover:text-indigo-800 px-2 py-1 rounded-lg transition-all font-semibold cursor-pointer"
                >
                  🚀 {lang === "ar" ? p.ar : p.en}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleSmartSearchHelp()}
                disabled={smartLoading}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  smartLoading
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 hover:scale-[1.01]"
                }`}
              >
                {smartLoading ? (
                  <>
                    <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full mr-1.5" />
                    <span>{lang === "ar" ? "جاري فرز وقراءة تفاصيل الحجز..." : "Structuring smart parameters..."}</span>
                  </>
                ) : (
                  <>
                    <span>🔮</span>
                    <span>{lang === "ar" ? "تفعيل مساعد الحجز والإقامة بالذكاء الاصطناعي" : "Process Smart AI Booking & Stay Advisor"}</span>
                  </>
                )}
              </button>

              {smartResult && (
                <button
                  type="button"
                  onClick={() => {
                    setSmartQuery("");
                    setSmartResult(null);
                    setUseSmartInference(false);
                  }}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer underline"
                >
                  {lang === "ar" ? "إعادة تعيين وبدء جديد" : "Reset Assistant"}
                </button>
              )}
            </div>

            {smartError && (
              <p className="text-xs text-rose-600 font-bold">⚠️ {smartError}</p>
            )}
          </div>

          {/* Assistant Parsed Results display block */}
          {smartResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-xl border border-indigo-100 bg-white shadow-xs space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-none">
                {/* 1. Origin & Destination */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">
                    {lang === "ar" ? "📍 مكان الانطلاق والوصول:" : "📍 Origin & Destination:"}
                  </span>
                  <p className="text-xs font-black text-slate-800 leading-normal">
                    {lang === "ar" ? "من:" : "From:"} <span className="text-indigo-600">{smartResult.detectedOrigin}</span>
                  </p>
                  <p className="text-xs font-black text-slate-800 leading-normal">
                    {lang === "ar" ? "إلى:" : "To:"} <span className="text-indigo-600">{smartResult.detectedDestination}</span>
                  </p>
                </div>

                {/* 2. Transport Mode */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">
                    {lang === "ar" ? "🚀 وسيلة النقل المستخرجة:" : "🚀 Selected Transport Mode:"}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                    <span className="text-indigo-600 text-sm">
                      {smartResult.transportMode.toLowerCase().includes("plane") || smartResult.transportMode.includes("طائرة") ? "✈️" :
                       smartResult.transportMode.toLowerCase().includes("train") || smartResult.transportMode.includes("قطار") ? "🚄" :
                       smartResult.transportMode.toLowerCase().includes("bus") || smartResult.transportMode.includes("حافلة") ? "🚌" : "🚗"}
                    </span>
                    <span>{smartResult.transportMode}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-semibold block">
                    {lang === "ar" ? "تأمين حجز وسيلة تنقل مباشرة" : "Optimized scheduling selected"}
                  </span>
                </div>

                {/* 3. Lodging Type */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">
                    {lang === "ar" ? "🏨 اختيار الإقامة:" : "🏨 Smart Stay Match:"}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 capitalize">
                    <span>🏠</span>
                    <span>
                      {smartResult.lodgingType === "hotel" ? (lang === "ar" ? "فندق مصنف" : "Hotel") :
                       smartResult.lodgingType === "guesthouse" ? (lang === "ar" ? "دار ضيافة تقليدية" : "Guesthouse") :
                       smartResult.lodgingType === "hostel" ? (lang === "ar" ? "بيت شباب مشترك" : "Youth Hostel") :
                       smartResult.lodgingType === "dortoir" ? (lang === "ar" ? "مرقد مشترك (Dortoir)" : "Dormitory (Dortoir)") :
                       (lang === "ar" ? "منزل / شقة مستقلة" : "Home / Apartment")}
                    </span>
                  </div>
                  <span className="text-[9px] text-indigo-600 font-extrabold block">
                    {smartResult.stayDurationDays} {lang === "ar" ? "أيام إقامة" : "days of stay"}
                  </span>
                </div>

                {/* 4. Pricing / currency */}
                <div className="p-3 bg-indigo-50/30 rounded-xl border border-indigo-100 space-y-1">
                  <span className="text-[10px] text-indigo-900 font-extrabold block">
                    {lang === "ar" ? "💵 الميزانية التقديرية الذكية:" : "💵 Approx Flight & stay value:"}
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-sm font-black text-slate-800">
                      ${smartResult.approxPriceUSD} <span className="text-[10px] text-slate-400 font-medium font-sans">USD</span>
                    </p>
                    {smartResult.isDomestic && (
                      <p className="text-sm font-black text-emerald-600">
                        {smartResult.localPriceDZD.toLocaleString()} <span className="text-[10px] font-medium">{lang === "ar" ? "دج (عملة محلية)" : "DZD (Algerian Dinar)"}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Accommodation custom guidance comments */}
              <div className="p-3.5 bg-slate-50 text-xs rounded-xl border border-slate-100 space-y-2">
                <div className="font-extrabold text-slate-700 flex items-center gap-1">
                  <span>🏡</span>
                  <span>{lang === "ar" ? "مساعد الإقامة والإقامة الداخلية والمحلية:" : "Smart Lodging & Domestic Stay Advice:"}</span>
                </div>
                <p className="text-slate-600 font-semibold leading-relaxed">
                  {smartResult.accommodationDetails}
                </p>
              </div>

              {/* Global transport/lodging advise summary */}
              <div className="p-3.5 bg-indigo-50/10 text-xs rounded-xl border border-indigo-100/50 space-y-2">
                <div className="font-extrabold text-indigo-950 flex items-center gap-1">
                  <span>💡</span>
                  <span>{lang === "ar" ? "نصائح وإرشادات المسار والأسعار:" : "AI Travel Guidance & Fare breakdown:"}</span>
                </div>
                <p className="text-indigo-900 font-semibold leading-relaxed">
                  {smartResult.aiGuidanceText}
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Query Input */}
        {!useSmartInference ? (
          <form onSubmit={handleSearchBtnSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.destPlaceholder}
                className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 text-slate-800 transition-colors text-sm font-semibold"
              />
            </div>
            <button
              type="submit"
              className="px-6 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all uppercase tracking-wider cursor-pointer"
            >
              {lang === "ar" ? "ابحث" : "Search"}
            </button>
          </form>
        ) : (
          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔮</span>
              <div>
                <h4 className="font-extrabold text-sm text-indigo-900">
                  {lang === "ar" ? "معتمد على وجهة المساعد الذكي المقترحة" : "Relying on Destination suggested by AI assistant"}
                </h4>
                <p className="text-xs text-indigo-700 font-semibold mt-0.5">
                  {lang === "ar"
                    ? `الوجهة المقترحة والمقفلة: ${smartResult?.detectedDestination} (نقطة الانطلاق: ${smartResult?.detectedOrigin})`
                    : `Locked Suggestion: ${smartResult?.detectedDestination} (Starting Point: ${smartResult?.detectedOrigin})`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setUseSmartInference(false);
                setSmartResult(null);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-[11px] font-bold cursor-pointer transition-all shrink-0"
            >
              {lang === "ar" ? "تعديل الوجهة يدوياً والبحث الحر" : "Edit Destination manually"}
            </button>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex border-b border-slate-100 mt-6 gap-6">
          <button
            onClick={() => setActiveTab("flights")}
            className={`pb-3 font-bold text-sm border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "flights"
                ? "border-indigo-600 text-indigo-900"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Plane className="w-4 h-4" />
            <span>{t.flightsTab}</span>
          </button>
          <button
            onClick={() => setActiveTab("hotels")}
            className={`pb-3 font-bold text-sm border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "hotels"
                ? "border-indigo-600 text-indigo-900"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{t.hotelsTab}</span>
          </button>
        </div>

        {/* Dynamic Sorting UI */}
        {!searching && searchQuery.trim() && (
          <div className="mt-6 p-4 bg-slate-50/45 rounded-xl border border-slate-100/70 space-y-3.5">
            {/* Action Bar Selector Line with New Dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-650 flex items-center gap-1.5 leading-none">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                {lang === "ar" ? "ترتيب النتائج وبحث مخصص:" : "Sort results & boost efficiency:"}
              </span>
              
              {activeTab === "flights" ? (
                <div className="flex items-center gap-2">
                  <select
                    id="flight-sort-select"
                    value={flightSort || ""}
                    onChange={(e) => setFlightSort((e.target.value as any) || null)}
                    className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-colors cursor-pointer"
                  >
                    <option value="">{lang === "ar" ? "⏱️ الترتيب الافتراضي" : "⏱️ Default Order"}</option>
                    <option value="price_asc">{lang === "ar" ? "💵 السعر: من الأقل إلى الأعلى" : "💵 Price: Low to High"}</option>
                    <option value="price_desc">{lang === "ar" ? "💵 السعر: من الأعلى إلى الأقل" : "💵 Price: High to Low"}</option>
                    <option value="duration">{lang === "ar" ? "⚡ مدة الرحلة: الأقصر" : "⚡ Duration: Shortest First"}</option>
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    id="hotel-sort-select"
                    value={hotelSort || ""}
                    onChange={(e) => setHotelSort((e.target.value as any) || null)}
                    className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-colors cursor-pointer"
                  >
                    <option value="">{lang === "ar" ? "🏨 الترتيب الافتراضي" : "🏨 Default Order"}</option>
                    <option value="price_asc">{lang === "ar" ? "💵 السعر: من الأقل إلى الأعلى" : "💵 Price: Low to High"}</option>
                    <option value="price_desc">{lang === "ar" ? "💵 السعر: من الأعلى إلى الأقل" : "💵 Price: High to Low"}</option>
                    <option value="rating">{lang === "ar" ? "⭐️ التقييم: الأعلى أولاً" : "⭐️ Rating: Highest First"}</option>
                  </select>
                </div>
              )}
            </div>

            {/* Clickable Active Filter Badges with Quick Reset */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {lang === "ar" ? "الفرز النشط:" : "Active Filters:"}
                </span>
                
                {activeTab === "flights" ? (
                  flightSort ? (
                    <button
                      type="button"
                      id="flight-active-sort-badge"
                      onClick={() => setFlightSort(null)}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-lg border border-indigo-100/50 flex items-center gap-1.5 cursor-pointer group transition-all"
                      title={lang === "ar" ? "انقر لإعادة التعيين" : "Click to reset sort"}
                    >
                      <span>
                        {flightSort === "price_asc" && (lang === "ar" ? "💵 السعر: من الأقل إلى الأعلى" : "💵 Price: Low to High")}
                        {flightSort === "price_desc" && (lang === "ar" ? "💵 السعر: من الأعلى إلى الأقل" : "💵 Price: High to Low")}
                        {flightSort === "duration" && (lang === "ar" ? "⏱️ مدة الرحلة: الأقصر" : "⏱️ Duration: Shortest First")}
                      </span>
                      <X className="w-3 h-3 text-indigo-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                    </button>
                  ) : (
                    <span className="text-[10px] sm:text-xs text-slate-400 font-semibold bg-slate-100/60 px-2.5 py-1 rounded-lg border border-slate-200/20">
                      {lang === "ar" ? "🔄 الترتيب الأصلي التلقائي" : "🔄 Unsorted (Original Order)"}
                    </span>
                  )
                ) : (
                  hotelSort ? (
                    <button
                      type="button"
                      id="hotel-active-sort-badge"
                      onClick={() => setHotelSort(null)}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-lg border border-indigo-100/50 flex items-center gap-1.5 cursor-pointer group transition-all"
                      title={lang === "ar" ? "انقر لإعادة التعيين" : "Click to reset sort"}
                    >
                      <span>
                        {hotelSort === "price_asc" && (lang === "ar" ? "💵 السعر: من الأقل إلى الأعلى" : "💵 Price: Low to High")}
                        {hotelSort === "price_desc" && (lang === "ar" ? "💵 السعر: من الأعلى إلى الأقل" : "💵 Price: High to Low")}
                        {hotelSort === "rating" && (lang === "ar" ? "⭐ التقييم: الأعلى أولاً" : "⭐ Rating: Highest First")}
                      </span>
                      <X className="w-3 h-3 text-indigo-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                    </button>
                  ) : (
                    <span className="text-[10px] sm:text-xs text-slate-400 font-semibold bg-slate-100/60 px-2.5 py-1 rounded-lg border border-slate-200/20">
                      {lang === "ar" ? "🔄 الترتيب الأصلي التلقائي" : "🔄 Unsorted (Original Order)"}
                    </span>
                  )
                )}
              </div>

              <div className="flex items-center gap-3">
                {((activeTab === "flights" && flightSort) || (activeTab === "hotels" && hotelSort)) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === "flights") setFlightSort(null);
                      else setHotelSort(null);
                    }}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 hover:underline font-bold flex items-center gap-1 cursor-pointer transition-all animate-none"
                  >
                    <RotateCcw className="w-2.5 h-2.5 shrink-0" />
                    <span>{lang === "ar" ? "إعادة تعيين الفرز" : "Reset Sort"}</span>
                  </button>
                )}

                <button
                  type="button"
                  id="save-preferences-btn"
                  onClick={handleSavePreferences}
                  className={`text-[10px] px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all border cursor-pointer select-none leading-none ${
                    preferencesSaved
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <Check className={`w-3.5 h-3.5 text-emerald-500 transition-transform ${preferencesSaved ? "scale-100" : "scale-0 hidden"}`} />
                  {!preferencesSaved && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>}
                  <span>
                    {preferencesSaved
                      ? (lang === "ar" ? "تم الحفظ!" : "Saved!")
                      : (lang === "ar" ? "حفظ تفضيلات البحث" : "Save search preferences")}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Geographical Map Component */}
        {!searching && searchQuery.trim() && (
          <div className="mt-6 mb-8">
            <InteractiveMap
              lang={lang}
              destinationName={searchQuery}
              country={activeItinerary?.country || ""}
              originName={smartResult?.detectedOrigin || "Algiers"}
              flights={flights}
              hotels={hotels}
              selectedFlight={selectedFlight}
              selectedHotel={selectedHotel}
              onSelectFlight={onSelectFlight}
              onSelectHotel={onSelectHotel}
              transitMode={activeItinerary?.transitMode}
            />
          </div>
        )}

        {/* Status Messaging */}
        {!searchQuery.trim() && !activeItinerary && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50/50 rounded-xl mt-6 border border-dashed border-slate-200">
            <div className="p-3 rounded-full bg-slate-100 text-slate-400">
              <Compass className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-400 font-bold max-w-sm">
              {t.searchDestFirst}
            </p>
          </div>
        )}

        {/* Loading Ring */}
        {searching && (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <div className="w-7 h-7 border-3 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400 font-bold">
              {lang === "ar" ? "جاري تجميع أسعار تذاكر وعروض اليوم..." : "Simulating airlines rates and vacancy tables..."}
            </p>
          </div>
        )}

        {/* Flight Results */}
        {!searching && searchQuery.trim() && activeTab === "flights" && flights.length > 0 && (
          <div className="space-y-4 mt-6">
            {getSortedFlights().map((flight, idx) => {
              const isSelected = selectedFlight?.flightNumber === flight.flightNumber;
              return (
                <div 
                  key={idx}
                  className={`p-5 rounded-xl border hover:border-indigo-200 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isSelected ? "border-indigo-500 bg-indigo-50/10 shadow-sm" : "border-slate-100 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50/50 flex items-center justify-center text-indigo-600 font-extrabold text-sm border border-indigo-100/35">
                      {flight.airline.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-slate-800 text-sm">
                        {flight.airline}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {flight.flightNumber}
                      </p>
                    </div>
                  </div>

                  {/* Flight Timeline Details & Rich Attributes */}
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-4 text-xs">
                      <div className="text-center">
                        <div className="font-bold text-slate-700">{flight.departureTime}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{lang === "ar" ? "مطار المغادرة" : "DEPART"}</div>
                      </div>
                      <div className="flex flex-col items-center justify-center min-w-[80px]">
                        <span className="text-[9px] text-slate-400 font-bold">{flight.duration}</span>
                        <div className="w-full h-[1px] bg-indigo-100 relative my-1">
                          <div className="absolute right-0 -top-1 w-2 h-2 rounded-full border border-indigo-400 bg-white"></div>
                        </div>
                        <span className="text-[9px] font-bold text-slate-500">
                          {flight.stops === 0 ? t.stopDirect : `${flight.stops} ${t.stopsCount}`}
                        </span>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-slate-700">{flight.arrivalTime}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{lang === "ar" ? "الوصول" : "ARRIVE"}</div>
                      </div>
                    </div>

                    {/* Rich flight features detail */}
                    <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100/50 flex flex-col gap-1 text-[10px] text-slate-500 font-semibold max-w-sm">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[10px]">
                        <span>✈️ {flight.aircraftModel || "Boeing 737"}</span>
                        <span className="text-indigo-650 bg-indigo-50/80 px-1.5 py-0.2 rounded scale-95">{flight.cabinClass}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>🎒</span>
                        <span className="text-emerald-700 font-bold">{flight.luggageDetail}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>🍽️</span>
                        <span>{flight.mealOption}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price and Trigger */}
                  <div className="flex md:flex-col items-end justify-between md:justify-center gap-2 border-t md:border-0 pt-3 md:pt-0 border-slate-50">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-semibold block">{lang === "ar" ? "شخصي ذكي" : "Round-trip"}</span>
                      <span className="text-lg font-black text-indigo-600">${flight.priceUSD}</span>
                    </div>

                    <button
                      onClick={() => onSelectFlight(flight)}
                      type="button"
                      className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                        isSelected 
                          ? "bg-indigo-500 text-white" 
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                      <span>{isSelected ? t.selectedState : t.selectBtn}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Accommodation Results */}
        {!searching && searchQuery.trim() && activeTab === "hotels" && hotels.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {getSortedHotels().map((hotel, idx) => {
              const isSelected = selectedHotel?.name === hotel.name;
              return (
                <div 
                  key={idx}
                  className={`rounded-2xl border overflow-hidden hover:shadow-md transition-all flex flex-col justify-between ${
                    isSelected ? "border-indigo-500 bg-indigo-50/10 shadow-sm" : "border-slate-100 bg-white"
                  }`}
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className="text-[9px] text-indigo-600 font-extrabold uppercase bg-indigo-50 px-2 py-0.5 rounded">
                          {hotel.stars} {t.stars}
                        </span>
                        <h4 className="font-extrabold text-slate-800 text-sm leading-tight">
                          {hotel.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        <span>{hotel.rating}</span>
                        <span className="text-slate-400 text-[10px] font-medium">({hotel.reviews})</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className="truncate">{hotel.address}</span>
                    </div>

                     {/* Features checklist */}
                    <div className="flex flex-wrap gap-1">
                      {hotel.amenities.map((amenity, amIdx) => (
                        <span key={amIdx} className="text-[9px] bg-slate-50 text-slate-500 font-bold px-1.5 py-0.5 rounded border border-slate-100">
                          {amenity}
                        </span>
                      ))}
                    </div>

                    {/* Rich hotel features details */}
                    <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 flex flex-col gap-1.5 text-[10px] text-slate-500 font-semibold leading-relaxed">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                        <span>🛏️</span>
                        <span className="text-indigo-950 font-black">{hotel.roomType}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-750">
                        <span>🍳</span>
                        <span className="font-bold">{hotel.breakfastIncluded ? (lang === "ar" ? "الإفطار بوفيه مفتوح متضمن ومجاني يومياً" : "Daily complimentary rich breakfast buffet included") : (lang === "ar" ? "الإفطار حسب الطلب متوفر" : "Breakfast buffet available on request")}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mt-1 border-t border-slate-100/50 pt-1.5 text-[9px]">
                        <span className="text-indigo-650 font-bold bg-indigo-50/50 px-1.5 py-0.5 rounded w-fit">🛡️ {hotel.cancellationPolicy}</span>
                        {hotel.availableRoomsCount && (
                          <span className="text-rose-600 font-extrabold bg-rose-50 px-1.5 py-0.5 rounded w-fit animate-pulse">
                            ⚠️ {lang === "ar" ? `${hotel.availableRoomsCount} غرف متبقية فقط!` : `Only ${hotel.availableRoomsCount} rooms left!`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pricing footer row */}
                  <div className="p-4 bg-slate-50/40 border-t border-slate-50 flex items-center justify-between gap-4 mt-auto">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">{t.perNight}</span>
                      <span className="text-base font-black text-indigo-600">${hotel.priceUSD}</span>
                    </div>

                    <button
                      onClick={() => onSelectHotel(hotel)}
                      type="button"
                      className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer ${
                        isSelected 
                          ? "bg-indigo-500 text-white" 
                          : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-100"
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                      <span>{isSelected ? t.selectedState : t.selectBtn}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- OPTIONAL TRAVEL BENEFITS SECTION --- */}
        {!searching && searchQuery.trim() && (
          <div className="mt-12 border-t border-slate-100/85 pt-10 space-y-10">
            <div className="flex flex-col space-y-2">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse animate-none" />
                <span>{lang === "ar" ? "تفاصيل وخدمات الرفاهية والسفر الاختيارية" : "Optional Premium Holiday Services & Add-ons"}</span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {lang === "ar"
                  ? "قم بتأمين رحلتك عبر بوليصة التأمين الذكية أو اطلب التكفل الشامل بالتنقل والإقامة من شريكنا وكالة فسحة DZ"
                  : "Protect your journey with smart insurance or request a complete VIP door-to-door sponsorship by Fos7a DZ Travel Agency."}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Card 1: Travel Insurance (تأمين السفر التفاعلي) */}
              <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl p-6 transition-all space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 border border-green-100">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800">
                        {lang === "ar" ? "تأمين السفر التفاعلي الذكي" : "Interactive Smart Travel Insurance"}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {lang === "ar" ? "توقع وحساب فوري لقيمة التأمين" : "Instant premium calculator & coverages"}
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={insuranceEnabled}
                      onChange={(e) => setInsuranceEnabled(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                {insuranceEnabled ? (
                  <div className="space-y-4 text-xs">
                    {/* Coverage Level */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-600 block">{lang === "ar" ? "مستوى وخطة التغطية:" : "Coverage Tier Strategy:"}</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["basic", "premium", "comprehensive"] as const).map((tier) => (
                          <button
                            key={tier}
                            type="button"
                            onClick={() => setInsuranceType(tier)}
                            className={`p-2 rounded-xl border text-center font-bold text-[10px] transition-all capitalize cursor-pointer ${
                              insuranceType === tier 
                                ? "border-green-600 bg-green-50/30 text-green-800 animate-none" 
                                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-500 animate-none"
                            }`}
                          >
                            {tier === "basic" && (lang === "ar" ? "أساسي" : "Basic")}
                            {tier === "premium" && (lang === "ar" ? "ممتاز" : "Premium")}
                            {tier === "comprehensive" && (lang === "ar" ? "شامل VIP" : "Comprehensive")}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Regional / Grid options */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-600 block">{lang === "ar" ? "نطاق الوجهة الجغرافية:" : "Geographical Zone:"}</label>
                        <select
                          value={insuranceZone}
                          onChange={(e) => setInsuranceZone(e.target.value as any)}
                          className="w-full p-2 h-9 rounded-xl border border-slate-200 bg-white font-bold text-[11px] text-slate-700 focus:border-indigo-400 focus:outline-none"
                        >
                          <option value="local">{lang === "ar" ? "الجزائر (محلي)" : "Algeria (Local)"}</option>
                          <option value="mena">{lang === "ar" ? "شمال إفريقيا والشرق الأوسط" : "North Africa / MENA"}</option>
                          <option value="europe">{lang === "ar" ? "أوروبا (شنغن)" : "Europe (Schengen)"}</option>
                          <option value="worldwide">{lang === "ar" ? "كافة دول العالم" : "Worldwide Coverage"}</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-600 block">{lang === "ar" ? "الفئة العمرية للمسافر:" : "Traveler Age Category:"}</label>
                        <select
                          value={insuranceAge}
                          onChange={(e) => setInsuranceAge(e.target.value as any)}
                          className="w-full p-2 h-9 rounded-xl border border-slate-200 bg-white font-bold text-[11px] text-slate-700 focus:border-indigo-400 focus:outline-none"
                        >
                          <option value="youth">{lang === "ar" ? "شباب (تحت 25)" : "Youth (< 25)"}</option>
                          <option value="adult">{lang === "ar" ? "بالغ (25 - 59)" : "Adult (25 - 59)"}</option>
                          <option value="senior">{lang === "ar" ? "كبار السن (60+)" : "Senior (60+)"}</option>
                        </select>
                      </div>
                    </div>

                    {/* Duration slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-bold text-slate-600">
                        <span>{lang === "ar" ? "أيام التغطية التأمينية:" : "Active Insured Days:"}</span>
                        <span className="text-green-600">{insuranceDays} {lang === "ar" ? "يوم" : "Days"}</span>
                      </div>
                      <input 
                        type="range"
                        min="1"
                        max="90"
                        value={insuranceDays}
                        onChange={(e) => setInsuranceDays(parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-green-600"
                      />
                    </div>

                    {/* Breakdown & Premium Calculation */}
                    <div className="p-3 bg-white border border-slate-100 rounded-xl space-y-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-500 text-[10px]">{lang === "ar" ? "قيمة التأمين الإجمالي المقدرة:" : "Calculated Premium Price:"}</span>
                        <span className="text-lg font-black text-green-600">${calculateInsurancePremium()}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 leading-relaxed font-semibold">
                        {insuranceType === "basic" && (lang === "ar" ? "✔️ تغطي الحالات الطبية الطارئة البسيطة للأسنان والعيادات وتأخر الحقائب." : "✔️ Covers basic emergency outpatient care, emergency dentistry, and baggage delays.")}
                        {insuranceType === "premium" && (lang === "ar" ? "✔️ تغطي طوارئ الاستشفاء بقيمة 150 ألف دولار، إلغاء الرحلة، وسرقة الأمتعة والوثائق." : "✔️ Covers hospital emergencies up to $150k, trip cancellation refund, and lost baggage/passports.")}
                        {insuranceType === "comprehensive" && (lang === "ar" ? "✔️ تغطية شاملة VIP غير محدودة، الرياضات المغامرة، التعويض الفوري عن تأخر الطائرات والاتصال الهاتفي الطبي 24 ساعة." : "✔️ Full Tier VIP Unlimited coverages, adventure-sports insurance, immediate flight delay compensatory pay, and 24/7 medical advice hotline.")}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 flex flex-col items-center justify-center text-center space-y-1 border border-dashed border-slate-200 rounded-xl bg-white select-none">
                    <span className="text-slate-300 text-2xl">🛡️</span>
                    <p className="text-[10px] text-slate-400 font-bold">
                      {lang === "ar" ? "فعل التبديل أعلاه لحساب وإدراج بوليصة التغطية" : "Enable toggle above to calculate and add travel insurance plan"}
                    </p>
                  </div>
                )}
              </div>

              {/* Card 2: Fos7a DZ Full Sponsorship Request (التكفل الشامل بالرحلة) */}
              <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl p-6 transition-all space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                      <Sparkles className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800">
                        {lang === "ar" ? "طلب التكفل الشامل - وكالة فسحة DZ" : "Fos7a DZ All-Inclusive Sponsorship"}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {lang === "ar" ? "تكفل وتنظيم الرحلة من الانطلاق للعودة" : "Complete luxury package from departure to arrival"}
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={sponsorshipEnabled}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setSponsorshipEnabled(val);
                        if (val && onRequestFos7aAssistantRedirect) {
                          onRequestFos7aAssistantRedirect();
                        }
                      }}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {sponsorshipEnabled ? (
                  <form onSubmit={handleSponsorshipSubmit} className="space-y-3.5 text-xs">
                    {/* Prompt Direct Smart Assistant Navigation Banner */}
                    <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 flex items-center justify-between gap-3 text-[11px] font-bold text-indigo-900 shadow-xs">
                      <div className="flex items-center gap-1.5">
                        <span>🔮</span>
                        <span>{lang === "ar" ? "أتريد ملئ المعطيات حراً بالذكاء الاصطناعي؟" : "Want to write freely with AI?"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={onRequestFos7aAssistantRedirect}
                        className="py-1 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-[9px] font-extrabold transition-all cursor-pointer shadow-xs"
                      >
                        {lang === "ar" ? "الانتقال للمساعد الذكي" : "Go to Smart Copilot"}
                      </button>
                    </div>
                    {/* Travel Setup & Configuration */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-600 block">{lang === "ar" ? "تركيبة وتصنيف المسافرين:" : "Travel Group Dynamic:"}</label>
                        <select
                          value={travelConfig}
                          onChange={(e) => setTravelConfig(e.target.value as any)}
                          className="w-full p-2 h-9 rounded-xl border border-slate-200 bg-white font-bold text-[10px] text-slate-700 focus:border-indigo-400 focus:outline-none"
                        >
                          <option value="solo">{lang === "ar" ? "فردي (مسافر بمفرده)" : "Solo Traveler"}</option>
                          <option value="group">{lang === "ar" ? "جماعي (فوج / وفد)" : "Group Tour"}</option>
                          <option value="family">{lang === "ar" ? "عائلي (أفراد العائلة الأقارب)" : "Family Group"}</option>
                          <option value="couple">{lang === "ar" ? "زوجين (استجمام هادئ)" : "Couple Trip"}</option>
                          <option value="lovers">{lang === "ar" ? "عاشقين (رومانسية وشهر عسل)" : "Lovers / Romance Retreat"}</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-600 block">{lang === "ar" ? "نوع وأسلوب الرحلة المطلوب:" : "Preferred Trip Style Theme:"}</label>
                        <select
                          value={tripTheme}
                          onChange={(e) => setTripTheme(e.target.value as any)}
                          className="w-full p-2 h-9 rounded-xl border border-slate-200 bg-white font-bold text-[10px] text-slate-700 focus:border-indigo-400 focus:outline-none"
                        >
                          <option value="cultural">{lang === "ar" ? "ثقافية وتاريخية" : "Cultural & Historical"}</option>
                          <option value="sahara">{lang === "ar" ? "سياحة صحراوية واستكشافية" : "Sahara Safari Sands"}</option>
                          <option value="mountain">{lang === "ar" ? "نزهة جبلية ومغامرات" : "Mountain Hiking & Trails"}</option>
                          <option value="coastal">{lang === "ar" ? "شاطئية واستجمام مائي" : "Beachside Relaxation"}</option>
                          <option value="business">{lang === "ar" ? "مهمة إدارية / أعمال VIP" : "Administrative / Work VIP"}</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-600 block">{lang === "ar" ? "ولاية المغادرة والانطلاق:" : "Departure Wilaya Origin:"}</label>
                        <input
                          type="text"
                          value={departureWilaya}
                          onChange={(e) => setDepartureWilaya(e.target.value)}
                          placeholder="e.g. Algiers"
                          className="w-full px-3 h-9 rounded-xl border border-slate-200 bg-white font-bold text-[10px] text-slate-700 focus:border-indigo-400 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-6">
                        <input
                          type="checkbox"
                          id="chk_return"
                          checked={includeReturn}
                          onChange={(e) => setIncludeReturn(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                        <label htmlFor="chk_return" className="font-bold text-slate-600 text-[10px] cursor-pointer select-none">
                          {lang === "ar" ? "تأمين التوصيل للعودة أيضاً" : "Arrange Return transfer"}
                        </label>
                      </div>
                    </div>

                    {/* Submit and Quote section */}
                    <div className="p-3.5 bg-white border border-slate-100 rounded-xl space-y-3 mt-1 text-[10px]">
                      <div className="flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-500 block">{lang === "ar" ? "التكفل التقديري الشامل بالدينار:" : "Dynamic Support Value range:"}</span>
                          <span className="text-[9px] text-slate-400 block font-bold">
                            {lang === "ar" ? "🚗 يشمل السائق ودار الضيافة والمرافقة" : "🚗 Includes driver, local guesthouse & concierge"}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-indigo-600 block">
                            {calculateSponsorshipQuote().min.toLocaleString()} - {calculateSponsorshipQuote().max.toLocaleString()} دج
                          </span>
                        </div>
                      </div>

                      {sponsorshipResult?.submitted ? (
                        <div className="p-2 border border-green-200 bg-green-50 text-green-800 rounded-lg text-[9px] font-bold text-center">
                          {lang === "ar" 
                            ? "🎉 تم إرسال طلب التكفل بنجاح! سيتصل بك وكيل معتمد من وكالة فسحة DZ خلال ساعتين على رقم هاتفك المسجل."
                            : "🎉 Sponsorship requested successfully! Our advisor from Fos7a DZ will contact you within 2 hours."}
                        </div>
                      ) : (
                        <button
                          type="submit"
                          disabled={submittingSponsorship}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-100"
                        >
                          {submittingSponsorship ? (
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>{lang === "ar" ? "إرسال طلب التكفل الشامل" : "Submit Comprehensive Booking Request"}</span>
                        </button>
                      )}
                    </div>
                  </form>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-1 border border-dashed border-slate-200 rounded-xl bg-white mt-1 select-none">
                    <span className="text-slate-300 text-2xl">🌟</span>
                    <p className="text-[10px] text-slate-400 font-bold">
                      {lang === "ar" ? "فعل التبديل أعلاه لتفصيل طلب التكفل من وكالة فسحة" : "Enable toggle above to configure agency support"}
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
