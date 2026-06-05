/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Trash2, 
  Compass, 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign, 
  Eye, 
  ShieldCheck, 
  Heart, 
  Plane, 
  Home, 
  BookOpen, 
  CheckSquare, 
  FileText, 
  Globe, 
  CheckCircle2, 
  ShieldAlert, 
  ListTodo,
  Sparkles
} from "lucide-react";
import { SavedTrip, Itinerary, FlightMock, HotelMock } from "../types";
import { translations } from "../translations";
import TravelDiary from "./TravelDiary";

interface MyTripsDashboardProps {
  lang: "ar" | "en";
  onLoadItinerary: (itinerary: Itinerary) => void;
}

interface ChecklistDestInfo {
  id: string;
  nameAr: string;
  nameEn: string;
  flag: string;
  passportAr: string;
  passportEn: string;
  visaAr: string;
  visaEn: string;
  insuranceAr: string;
  insuranceEn: string;
  additionalAr: string[];
  additionalEn: string[];
}

const checklistDestinations: ChecklistDestInfo[] = [
  {
    id: "algeria",
    nameAr: "الجزائر (للزائرين والأجانب والنزلاء الدوليين)",
    nameEn: "Algeria (For Global Incoming Travelers)",
    flag: "🇩🇿",
    passportAr: "جواز سفر ساري المفعول لمدة لا تقل عن 6 أشهر من تاريخ ورود السائح، مع وجود صفحتين فارغتين على الأقل للأختام الرسمية.",
    passportEn: "Passport must be valid for at least 6 months beyond entry date, with at least two empty pages for official border gates entry/exit stamps.",
    visaAr: "تأشيرة دخول مسبقة مطلوبة لغالبية الدول الأوروبية والأمريكية والآسيوية. معفاة لمواطني تونس، المغرب، ماليزيا وموريتانيا. تتطلب دعوة رسمية من وكيل مرخص أو حجز فندقي مؤكد.",
    visaEn: "Consular visa or official invite required for most Western/EU passport holders. Visa-free entry for nationals of Tunisia, Morocco, Mauritania, and Malaysia. Invitation from authorized tour agencies makes entry seamless.",
    insuranceAr: "تأمين سفر طبي إجباري شامل طيلة مدة الإقامة مخصص للحصول على التأشيرة، يغطي نفقات الاستشفاء الطبي والترحيل الطارئ بحد أدنى 30,000 يورو.",
    insuranceEn: "Compulsory travel insurance certificate is required for visa application, covering medical care and emergency repatriation expenses up to minimum limit of €30,000.",
    additionalAr: [
      "حمل نسخة ورقية مطبوعة من تأشيرة السفر وحجز الفندق ومخطط الرحلة.",
      "تعبئة استمارة التصريح بالعملات الأجنبية إن تجاوزت القيمة 1,000 يورو عند الوصول لمكاتب الجمارك."
    ],
    additionalEn: [
      "Keep a paper printout of your approved tourist visa, hotel vouchers, and flight tickets handy.",
      "Fill out the foreign currency declaration form if carrying cash assets exceeding €1,000 upon arrival."
    ]
  },
  {
    id: "saudi",
    nameAr: "المملكة العربية السعودية (العمرة والسياحة)",
    nameEn: "Saudi Arabia (Umrah & Tourism Guidelines)",
    flag: "🇸🇦",
    passportAr: "جواز سفر بيومتري ساري لمدة 6 أشهر على الأقل من تاريخ السفر للاعتمار والدخول للشقيقة الكبرى.",
    passportEn: "Machine-readable biometric passport with absolute validity of at least 6 months after flight date.",
    visaAr: "تأشيرة إلكترونية (e-Visa) سياحية لـ 63 جنسية مؤهلة، أو تأشيرة عند الوصول لحاملي تأشيرات شنغن/أمريكا النشطة. تأشيرة نسك مخصصة لتسهيل تصاريح الروضة الشريفة والعمرة.",
    visaEn: "Instant Tourist e-Visa is online for 63 countries, or physical visa on arrival for holders of active Schengen/US/UK visas. Nusuk platforms streamline dynamic Umrah permits.",
    insuranceAr: "تأمين طبي فوري إلزامي مدمج تلقائياً مع رسوم التأشيرة الإلكترونية السياحية، يغطي الحالات الطارئة والعلاجات الطبية في سائر مستشفيات المملكة.",
    insuranceEn: "Compulsory health insurance is automatically integrated into the tourist e-visa fee, providing complete coverage for emergencies and healthcare across public clinics.",
    additionalAr: [
      "تحميل تطبيق 'نسك' (Nusuk) لحجز مواعيد الروضة الشريفة وتصاريح العمرة مسبقاً طيلة مدة الرحلة لضمان العبور.",
      "التأكد من أخذ التطعيمات الإلزامية مثل الحمى الشوكية (التهاب السحايا) وحمل الدفتر الأصفر الطبي."
    ],
    additionalEn: [
      "Install the 'Nusuk' digital app prior to departing to schedule official Riyadh Al-Jannah and Umrah slots.",
      "Ensure certificate verification for compulsory vaccines, largely the meningococcal meningitis vaccines with the yellow booklet."
    ]
  },
  {
    id: "tunisia",
    nameAr: "تونس (سفر الأشقاء والعبور البري والاستجمام)",
    nameEn: "Tunisia (Sisterly Neighbor Borders)",
    flag: "🇹🇳",
    passportAr: "جواز سفر ساري المفعول للزائرين. بالنسبة للمواطنين الجزائريين، يمكن العبور بجواز سفر عادي ساري المفعول بمراجعة الحراسات البرية.",
    passportEn: "Passport must remain valid during the complete duration of stay. Algerian passport holders enjoy simplified entry corridors across land and air borders.",
    visaAr: "معفاة تماماً من تأشيرة الدخول لمواطني الجزائر، دول الاتحاد الأوروبي، الولايات المتحدة وكندا، وفترات إقامة مرنة تصل إلى 90 يوماً متواصلة.",
    visaEn: "Completely Visa-free for Algerian citizens and more than 95 nations (EU, USA, Canada, Japan, etc.) allowing continuous stays up to 90 days of pure leisure.",
    insuranceAr: "التأمين ليس شرطاً إجبارياً صارماً للدخول المعفى، ولكن يوصى به بشدة لتغطية الحوادث، حالات الطوارئ الطبية وعمليات الإجلاء الجوية واللوجستية.",
    insuranceEn: "Not legally mandatory for border entry under visa-exempt classes, but highly encouraged to insure against medical checkups, luggage losses, or emergency transport.",
    additionalAr: [
      "دفع ضريبة المغادرة السياحية المقررة للسيارات في المعابر البرية إن وجد.",
      "الاحتفاظ بوثائق ملكية السيارة الجزائرية والبطاقة الرمادية للتأمين عند العبير البري الجمركي."
    ],
    additionalEn: [
      "Pay the nominal vehicle entry tax if crossing borders via local land vehicle stations.",
      "Verify vehicle documents, gray card coverage, and special cross-border insurance logs before driving."
    ]
  },
  {
    id: "turkey",
    nameAr: "جمهورية تركيا (تأشيرات العمر والشنغن والفيزا السياحية)",
    nameEn: "Turkey (Consular & e-Visa Guidelines)",
    flag: "🇹🇷",
    passportAr: "جواز سفر لا تقل صلاحيته عن 150 يوماً (5 أشهر تقريباً) من تاريخ دخول الأراضي التركية.",
    passportEn: "Passport must possess a validity span of at least 150 days (approx. 5 months) counting from arrival date.",
    visaAr: "تأشيرة إلكترونية (e-Visa) متاحة عبر الإنترنت للمواطنين الجزائريين للفئات العمرية دون 15 سنة وفوف 35 سنة. أما الفئات المتوسطة فتحتاج لتأشيرة ملصقة كلاسيكية مسبقة عبر وكلاء معتمدين (Gate25).",
    visaEn: "Online e-Visa is accessible for Algerian passport holders aged under 15 or over 35. Core ages (15-35) require standard pre-arranged sticker visas applied physically.",
    insuranceAr: "تأمين سفر دولي إلزامي يغطي الجمهورية التركية ونطاق إسعافي كامل بحد أدنى 30,000 يورو، ويكون مفعلاً ومطبوعاً بنسخة ملونة.",
    insuranceEn: "Compulsory travel insurance certificate is required covering all Turkish provinces with medical expense caps of at least €30,000, color printed.",
    additionalAr: [
      "التأكد من وجود كشف حساب بنكي نشط لآخر 3 أشهر لإثبات كفاية الموارد المادية عند الفحص.",
      "تأكيد حجز الطيران ذهاباً وإياباً، وحجز فندقي متطابق مع التواريخ المطلوبة للتأشيرة."
    ],
    additionalEn: [
      "Prepare a signed and stamped bank transaction history for the past 3 months to prove economic self-sufficiency.",
      "Verify that your flight ticket schedules are physically identical to your hotel booking check-in days."
    ]
  },
  {
    id: "schengen",
    nameAr: "منطقة الشنغن - أوروبا (متطلبات صارمة للقنصليات)",
    nameEn: "Schengen Area - Europe (Consular Rigor)",
    flag: "🇪🇺",
    passportAr: "جواز سفر ساري المفعول لمدة لا تقل عن 3 أشهر بعد التخطيط للمغادرة من منطقة شنغن ومصادر خلال الـ 10 سنوات الماضية مع صفحتين فارغتين.",
    passportEn: "Passport must remain valid for at least 3 months after intended Schengen departure date. It must be issued within the last 10 years and host 2 empty pages.",
    visaAr: "تأشيرة شريحة شنغن قصيرة المدة (C-Type) إجبارية. تتطلب ملفاً شاملاً: إثبات الوظيفة، كشوف حسابات بنكية مقنعة، وحجوزات طيران متبادلة وفندقية مؤكدة وحضور البصمات في مراكز التقديم (VFS/TLS).",
    visaEn: "Mandatory Schengen Visa (Category C) required before flying. Demands a bulletproof file structure: employment logs, robust bank proofs, flight bookings, and biometric inputs.",
    insuranceAr: "تأمين سفر شنغن معتمد إجباري بنسبة 100٪ يغطي كافة الدول الأعضاء الـ 29، بحد أدنى يبلغ 30,000 يورو وبدون أي مبالغ مستقطعة للحوادث وخدمات الطوارئ.",
    insuranceEn: "100% compulsory Schengen-compliant travelers insurance, covering all 29 member states, with minimum security ceiling of €30,000 and zero deductible liabilities.",
    additionalAr: [
      "ترجمة سائر الوثائق المهنية والحالة المدنية إلى لغة بلد الوجهة (الفرنسية أو الإنجليزية) ترجمة رسمية معتمدة.",
      "حمل تأكيد موعد البصمة والحجز الأصلي لتقديمه لشرطة الحدود عند بوابات الدخول ومكاتب فحص الجوازات."
    ],
    additionalEn: [
      "Translate all professional files and civil registry documents officially into French, English, or the host nation language.",
      "Keep a copy of your visa invitation, booking references, and insurance policy readily open to present to Schengen border patrol."
    ]
  }
];

export default function MyTripsDashboard({ lang, onLoadItinerary }: MyTripsDashboardProps) {
  const t = translations[lang];
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [activeDiaryTrip, setActiveDiaryTrip] = useState<SavedTrip | null>(null);
  
  // Dashboard Subtab: "trips" (default) or "checklist"
  const [activeSubTab, setActiveSubTab] = useState<"trips" | "checklist">("trips");
  
  // Pre-Flight Destination select state
  const [selectedDestId, setSelectedDestId] = useState<string>("algeria");

  // Checklist Checkbox States
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("preflight_checklist_checked_state");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    loadSavedTrips();
  }, []);

  const loadSavedTrips = () => {
    const existing = localStorage.getItem("saved_trips");
    if (existing) {
      setTrips(JSON.parse(existing));
    }
  };

  const handleDeleteTrip = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = trips.filter(trip => trip.id !== id);
    localStorage.setItem("saved_trips", JSON.stringify(filtered));
    setTrips(filtered);
  };

  const handleSelectTripToReview = (trip: SavedTrip) => {
    onLoadItinerary(trip.itinerary);
  };

  const handleToggleCheckItem = (id: string) => {
    const updated = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(updated);
    localStorage.setItem("preflight_checklist_checked_state", JSON.stringify(updated));
  };

  const selectedDest = checklistDestinations.find(d => d.id === selectedDestId) || checklistDestinations[0];

  // Calculate completion score
  const checklistKeys = [
    `${selectedDestId}-passport`,
    `${selectedDestId}-visa`,
    `${selectedDestId}-insurance`,
    ...selectedDest.additionalEn.map((_, idx) => `${selectedDestId}-add-${idx}`)
  ];
  const completedCount = checklistKeys.filter(k => checkedItems[k]).length;
  const totalCount = checklistKeys.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100) || 0;

  if (activeDiaryTrip) {
    return (
      <TravelDiary
        lang={lang}
        trip={activeDiaryTrip}
        onUpdateTripDiary={(updatedTrip) => {
          const updatedTrips = trips.map(t => t.id === updatedTrip.id ? updatedTrip : t);
          localStorage.setItem("saved_trips", JSON.stringify(updatedTrips));
          setTrips(updatedTrips);
          setActiveDiaryTrip(updatedTrip);
        }}
        onClose={() => setActiveDiaryTrip(null)}
      />
    );
  }

  return (
    <div className="space-y-6" id="saved-trips-component">
      
      {/* Top Beautiful Header and Tabs */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-500 animate-pulse" />
              {lang === "ar" ? "خزنة السندات ومحاكاة وثائق ما قبل السفر" : "Travel Vault & Pre-Flight Document Center"}
            </h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xl">
              {lang === "ar" 
                ? "مكان متكامل لمراجعة مسودات رحلاتك المفضلة، تدوين الذكريات اليومية، والتأكد الفوري من صلاحية وثائق السفر كجواز السفر وتفاصيل التأشيرة."
                : "A unified cockpit to inspect saved travel blueprints, publish daily diaries, and verify pre-flight items including passport validities, visas, and coverages."}
            </p>
          </div>

          {/* Sub components inside MyTripsDashboard tabs switcher */}
          <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 self-start">
            <button
              onClick={() => setActiveSubTab("trips")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === "trips" 
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>{lang === "ar" ? "الرحلات المحفوظة" : "Saved Journeys"}</span>
            </button>
            <button
              onClick={() => setActiveSubTab("checklist")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === "checklist" 
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              <ListTodo className="w-4 h-4" />
              <span>{lang === "ar" ? "قائمة وثائق ما قبل السفر" : "Pre-Flight Checklist"}</span>
            </button>
          </div>
        </div>

        {/* TAB 1: SAVED TRIPS */}
        {activeSubTab === "trips" && (
          <div>
            {trips.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <div className="p-4 rounded-full bg-indigo-50 text-indigo-500">
                  <Compass className="w-8 h-8 animate-spin-slow" />
                </div>
                <div className="max-w-md space-y-1.5">
                  <h3 className="font-bold text-slate-800 text-base">{lang === "ar" ? "خزنتك لا تزال شاغرة" : "Your Vault Is Empty"}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold px-4">
                    {t.noTrips}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {trips.map((trip) => {
                  const iti = trip.itinerary;
                  return (
                    <div 
                      key={trip.id}
                      onClick={() => handleSelectTripToReview(trip)}
                      className="rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all p-6 space-y-5 bg-white flex flex-col justify-between cursor-pointer group"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                              {t.tripId}{trip.id}
                            </span>
                            <h3 className="font-extrabold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors mt-0.5">
                              {iti.destinationName}
                            </h3>
                            <span className="text-xs font-semibold text-slate-400">{iti.country}</span>
                          </div>

                          <button
                            onClick={(e) => handleDeleteTrip(trip.id, e)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title={t.deleteTrip}
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {iti.tripDurationDays} {t.daysCount}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            {iti.targetBudgetLevel}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5" />
                            {iti.travelerType}
                          </span>
                        </div>

                        <div className="border-t border-slate-50 pt-4 space-y-3">
                          <div className="flex items-center gap-3 text-xs leading-none">
                            <Plane className="w-4 h-4 text-slate-400 shrink-0" />
                            <div className="font-semibold text-slate-500">
                              {lang === "ar" ? "الطيران المؤكد:" : "Flight confirmed:"}{" "}
                              {trip.selectedFlight ? (
                                <span className="text-indigo-600 font-bold">{trip.selectedFlight.airline} ({trip.selectedFlight.flightNumber})</span>
                              ) : (
                                <span className="text-slate-400 font-medium italic">{t.notSelected}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-xs leading-none">
                            <Home className="w-4 h-4 text-slate-400 shrink-0" />
                            <div className="font-semibold text-slate-500">
                              {lang === "ar" ? "مكان الإقامة:" : "Lodging confirmed:"}{" "}
                              {trip.selectedHotel ? (
                                <span className="text-indigo-600 font-bold">{trip.selectedHotel.name}</span>
                              ) : (
                                <span className="text-slate-400 font-medium italic">{t.notSelected}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-4">
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {t.createdAt} {trip.createdAt}
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDiaryTrip(trip);
                            }}
                            className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 hover:text-amber-850 border border-amber-200/50 p-2 px-3.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-3xs select-none"
                          >
                            <BookOpen className="w-4 h-4 text-amber-500" />
                            <span>{lang === "ar" ? "📖 مذكرات السفر" : "📖 Travel Diary"}</span>
                            {trip.diaryEntries && trip.diaryEntries.length > 0 && (
                              <span className="bg-amber-600 text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold shrink-0">
                                {trip.diaryEntries.length}
                              </span>
                            )}
                          </button>

                          <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:underline">
                            <Eye className="w-4 h-4" />
                            {lang === "ar" ? "افتح مراجعة الجدول" : "Inspect Schedules"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRE-FLIGHT DOCUMENT CHECKLIST */}
        {activeSubTab === "checklist" && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Dynamic Selector and Progress Banner */}
            <div className="bg-slate-50/50 rounded-2xl border border-slate-150 p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              {/* Destination Selector Dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">
                  📍 {lang === "ar" ? "حدد وجهة السفر لمطابقة المتطلبات:" : "Select Travel Destination To Audit:"}
                </label>
                <div className="relative">
                  <select
                    value={selectedDestId}
                    onChange={(e) => setSelectedDestId(e.target.value)}
                    className="pl-4 pr-10 py-3 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 bg-white shadow-3xs focus:outline-hidden focus:border-indigo-400 w-full sm:w-80 cursor-pointer text-ellipsis"
                  >
                    {checklistDestinations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.flag} {lang === "ar" ? d.nameAr : d.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Graphical Circular Check progress stats */}
              <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 shadow-3xs max-w-sm w-full md:w-auto shrink-0">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      className="text-slate-100"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      className="text-indigo-600 transition-all duration-300"
                      strokeWidth="4"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={`${2 * Math.PI * 20 * (1 - progressPercent / 100)}`}
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  <span className="text-xs font-black text-slate-850 font-mono">{progressPercent}%</span>
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800">
                    {lang === "ar" ? "مدى جاهزية مستندات السفر" : "Travel Document Readiness Tracker"}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    {lang === "ar" 
                      ? `${completedCount} من أصل ${totalCount} متطلبات مستهدفة تم تأكيدها`
                      : `${completedCount} of ${totalCount} core document rules completed`}
                  </p>
                </div>
              </div>
            </div>

            {/* Core Trio Requirements Cards Stack */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Passport checking */}
              {(() => {
                const itemKey = `${selectedDestId}-passport`;
                const checked = checkedItems[itemKey] || false;
                return (
                  <div className={`p-5 rounded-2xl border transition-all ${
                    checked ? "bg-indigo-50/20 border-indigo-200" : "bg-white border-slate-100 hover:border-slate-200"
                  } flex flex-col justify-between space-y-4`}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                          {lang === "ar" ? "متطلبات جواز السفر" : "PASSPORT VALIDITY"}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-800 text-sm">
                        {lang === "ar" ? "صلاحية جواز السفر وفارغ الصفحات" : "Passport Validity & Blank Pages"}
                      </h4>
                      <p className="text-slate-500 text-[11px] leading-relaxed font-semibold">
                        {lang === "ar" ? selectedDest.passportAr : selectedDest.passportEn}
                      </p>
                    </div>

                    <button
                      onClick={() => handleToggleCheckItem(itemKey)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        checked 
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-3xs" 
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{checked ? (lang === "ar" ? "تم التحقق والصلاحية" : "Verified & Valid") : (lang === "ar" ? "أكد الصلاحية شخصياً" : "Click to Validate")}</span>
                    </button>
                  </div>
                );
              })()}

              {/* Card 2: Visa status checking */}
              {(() => {
                const itemKey = `${selectedDestId}-visa`;
                const checked = checkedItems[itemKey] || false;
                return (
                  <div className={`p-5 rounded-2xl border transition-all ${
                    checked ? "bg-indigo-50/20 border-indigo-200" : "bg-white border-slate-100 hover:border-slate-200"
                  } flex flex-col justify-between space-y-4`}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                          <Globe className="w-5 h-5" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                          {lang === "ar" ? "موقف التأشيرة" : "VISA CLEARANCES"}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-800 text-sm">
                        {lang === "ar" ? "دخول معفى أو تأشيرة مسبقة" : "Visa Exemptions & Sticker Entry"}
                      </h4>
                      <p className="text-slate-500 text-[11px] leading-relaxed font-semibold font-sans">
                        {lang === "ar" ? selectedDest.visaAr : selectedDest.visaEn}
                      </p>
                    </div>

                    <button
                      onClick={() => handleToggleCheckItem(itemKey)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        checked 
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-3xs" 
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{checked ? (lang === "ar" ? "تم الحصول / الإعفاء مؤكد" : "Approved / Visa Sourced") : (lang === "ar" ? "أكد الفيزا شخصياً" : "Confirm Clearances")}</span>
                    </button>
                  </div>
                );
              })()}

              {/* Card 3: Travel Insurance checking */}
              {(() => {
                const itemKey = `${selectedDestId}-insurance`;
                const checked = checkedItems[itemKey] || false;
                return (
                  <div className={`p-5 rounded-2xl border transition-all ${
                    checked ? "bg-indigo-50/20 border-indigo-200" : "bg-white border-slate-100 hover:border-slate-200"
                  } flex flex-col justify-between space-y-4`}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                          <FileText className="w-5 h-5" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                          {lang === "ar" ? "تأمين طبي للسفر" : "MEDICAL ASSISTANCE"}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-800 text-sm">
                        {lang === "ar" ? "وثيقة تأمين المصاريف والترحيل" : "Schengen & Repatriation Insurance"}
                      </h4>
                      <p className="text-slate-500 text-[11px] leading-relaxed font-semibold">
                        {lang === "ar" ? selectedDest.insuranceAr : selectedDest.insuranceEn}
                      </p>
                    </div>

                    <button
                      onClick={() => handleToggleCheckItem(itemKey)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        checked 
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-3xs" 
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{checked ? (lang === "ar" ? "بند التأمين مغطى" : "Insurance Policy Active") : (lang === "ar" ? "أكد تغطية التأمين" : "Confirm Coverage")}</span>
                    </button>
                  </div>
                );
              })()}

            </div>

            {/* Custom Additional Requirements Checkbox Module */}
            <div className="bg-slate-50/30 p-6 rounded-2xl border border-slate-150 space-y-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-600" />
                <h4 className="text-sm font-extrabold text-slate-800">
                  {lang === "ar" ? "تأكيد الإجراءات التكميلية المهمة للوجهة" : "Dynamic Border Crossing Additional Provisos"}
                </h4>
              </div>

              <div className="space-y-3 font-semibold text-xs">
                {(lang === "ar" ? selectedDest.additionalAr : selectedDest.additionalEn).map((addText, idx) => {
                  const key = `${selectedDestId}-add-${idx}`;
                  const isChecked = checkedItems[key] || false;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleToggleCheckItem(key)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer select-none transition-all ${
                        isChecked 
                          ? "bg-white border-indigo-200 text-slate-800 shadow-3xs" 
                          : "bg-white/50 border-slate-100 text-slate-500 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${isChecked ? "bg-indigo-600" : "bg-slate-305"}`} />
                        <span className="leading-relaxed">{addText}</span>
                      </div>
                      
                      <div className={`p-1.5 rounded-lg border ${isChecked ? "bg-indigo-50 border-indigo-305 text-indigo-600" : "bg-slate-50 border-slate-150 text-slate-350"}`}>
                        <CheckSquare className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Informative advice banner footer */}
              <div className="bg-amber-50/50 border border-amber-150/40 p-3.5 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-900 leading-relaxed font-semibold">
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold">{lang === "ar" ? "تنويه واحتراز هام:" : "Consular Compliance Advisory:"} </span>
                  {lang === "ar"
                    ? "تتغير قوانين التأشيرة والدخول باستمرار. نوصي دوماً بالتحقق النهائي من القنوات القنصلية الرسمية وسفارة وجهتك قبل قطع تذاكر الطيران وتأكيد الحجوزات غير المستردة."
                    : "Border rules undergo swift modifications. Please secure final verifications from official diplomatic portals of your host nations prior to purchasing non-refundable air fares."}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
