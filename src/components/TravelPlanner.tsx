/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { 
  Sparkles, 
  Calendar, 
  DollarSign, 
  Users, 
  MapPin, 
  Check, 
  Star, 
  Smile, 
  Clock, 
  Compass, 
  Heart, 
  Home, 
  Info,
  ChevronRight,
  ChevronLeft,
  Phone,
  ShieldCheck,
  Utensils,
  Store,
  Navigation,
  Car,
  AlertTriangle,
  Locate,
  Printer,
  Briefcase,
  Plane,
  Plus,
  Trash2,
  Share2,
  Copy,
  X,
  Award,
  FileText,
  Bell,
  BellRing,
  GripVertical
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Itinerary, FlightMock, HotelMock } from "../types";
import { translations } from "../translations";
import { exportItineraryToPDF } from "../utils/pdfExporter";
import { getDestinationHeaderImage } from "../utils/itineraryImageHelper";
import { createPortal } from "react-dom";
import WeatherForecastCard from "./WeatherForecastCard";
import PrayerTimesCard from "./PrayerTimesCard";
import BudgetTracker from "./BudgetTracker";
import ScenicSlideshow from "./ScenicSlideshow";
import LandmarkTriviaModal from "./LandmarkTriviaModal";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from "recharts";

export interface PackingSuggestion {
  id: string;
  textEn: string;
  textAr: string;
  reasonEn: string;
  reasonAr: string;
  categoryEn: string;
  categoryAr: string;
  type: "weather" | "activity";
}

export interface WeatherConditions {
  maxTemp: number;
  minTemp: number;
  hasRain: boolean;
  hasWind: boolean;
  hasHeat: boolean;
  hasCold: boolean;
  zone: "desert" | "mountain" | "coastal" | "moderate" | "standard";
  conditionLabel?: string;
}

export function generateSmartSuggestions(itinerary: Itinerary, weather?: WeatherConditions | null): PackingSuggestion[] {
  const suggestions: PackingSuggestion[] = [];
  if (!itinerary) return suggestions;

  const climateAlert = (itinerary.climateAdvisoryAlert || "").toLowerCase();
  
  const weatherMatches = {
    cold: /cold|winter|snow|rain|winter|بارد|شتاء|مطر|ثلوج|طقس بارد|منخفض جوي/gi.test(climateAlert) || (weather ? weather.hasCold : false),
    hot: /hot|summer|heat|warm|desert|sahara|حار|صيف|حرارة|شمس|صحراء/gi.test(climateAlert) || (weather ? weather.hasHeat : false),
    windy: /wind|dust|storm|عاصف|رمل|غبار|رياح|عواصف/gi.test(climateAlert) || (weather ? weather.hasWind : false),
    rainy: /rain|shower|wet|مطر|أمطار|مبلل/gi.test(climateAlert) || (weather ? weather.hasRain : false),
  };

  const isSahara = /طاسيلي|tassili|جانت|janet|tamanrasset|تمنراست|غرداية|ghardaïa|guelma|صحراء|desert/gi.test(itinerary.destinationName || "") || (weather ? weather.zone === "desert" : false);
  const isCoastal = /بجاية|bejaia|جيجل|jijel|وهران|oran|العاصمة|algiers|تيبازة|tipaza|skikda|سكيكدة|عنابة|annaba|شاطئ|beach/gi.test(itinerary.destinationName || "") || (weather ? weather.zone === "coastal" : false);
  const isMountain = /قسنطينة|constantine|سطيف|setif|باتنة|batna|المدية|medea|خنشلة|khenchela|تيارت|tiaret/gi.test(itinerary.destinationName || "") || (weather ? weather.zone === "mountain" : false);

  if (weatherMatches.cold || isMountain) {
    suggestions.push({
      id: "w_heavy_coat",
      textEn: "Heavy insulated jacket / coat",
      textAr: "معطف أو سترة شتوية ثقيلة عازلة",
      reasonEn: weather ? `Actual regional cold forecasted (min ${weather.minTemp}°C)` : "Matches cold/rainy forecast notes",
      reasonAr: weather ? `بناءً على برودة الطقس المتوقعة (الصغرى ${weather.minTemp}°م)` : "بسبب التنبؤ بالأجواء الباردة أو الممطرة في وجهتك",
      categoryEn: "Climate Gear",
      categoryAr: "تجهيزات الطقس",
      type: "weather",
    });
    suggestions.push({
      id: "w_thermals",
      textEn: "Thermal undergarments / warming base layer",
      textAr: "ملابس داخلية حرارية دافئة (طبقة أساسية)",
      reasonEn: "Helps preserve crucial body warmth during long outdoor activities",
      reasonAr: "لحفظ حرارة الجسم واستقراره أثناء التجول والرحلات الخارجية الباردة",
      categoryEn: "Climate Gear",
      categoryAr: "تجهيزات الطقس",
      type: "weather",
    });
    suggestions.push({
      id: "w_beanie_gloves",
      textEn: "Woolen scarf, thermal beanie & touchscreen gloves",
      textAr: "شال صوفي، قبعة شتوية دافئة وقفازات تدعم اللمس",
      reasonEn: "Guards extreme body joints from frosty mountain or desert nights",
      reasonAr: "لحماية أطراف الجسم من الصقيع الشتوي أو البرد الصحراوي المسائي القارس",
      categoryEn: "Climate Gear",
      categoryAr: "تجهيزات الطقس",
      type: "weather",
    });
  }

  if (weatherMatches.rainy) {
    suggestions.push({
      id: "w_umbrella",
      textEn: "Compact travel umbrella / breathable raincoat",
      textAr: "مظلة سفر مدمجة أو معطف مطر مضاد للبلل",
      reasonEn: "Precipitation or rain alerts mapped on the schedule",
      reasonAr: "بسبب التنبؤ بالأمطار ورطوبة الطقس المرتفعة بموقع زيارتك",
      categoryEn: "Climate Gear",
      categoryAr: "تجهيزات الطقس",
      type: "weather",
    });
    suggestions.push({
      id: "w_waterproof_shoes",
      textEn: "Water-resistant or waterproof footwear with grip",
      textAr: "حذاء غير منفذ للمياه ومقاوم للانزلاق في الطرقات المبللة",
      reasonEn: "Guards socks and feet from damp trails or city walkways",
      reasonAr: "للحفاظ على جفاف قدميك وسلامتك من الانزلاق أثناء هطول الأمطار",
      categoryEn: "Climate Gear",
      categoryAr: "تجهيزات الطقس",
      type: "weather",
    });
  }

  if (weatherMatches.hot || isSahara) {
    suggestions.push({
      id: "w_sunscreen",
      textEn: "High SPF Broad-Spectrum Sunscreen",
      textAr: "واقي من الشمس ذو حماية وافرة ومقاوم للتعرق",
      reasonEn: weather ? `High UV radiation mapped with forecasted high of ${weather.maxTemp}°C` : "High ultraviolet index or desert heat alert",
      reasonAr: weather ? `لحماية البشرة من وهج الأشعة وحرارة الجو المرتفعة (${weather.maxTemp}°م)` : "بسبب مؤشر الأشعة فوق البنفسجية المرتفع أو الطقس الصحراوي والحرارة",
      categoryEn: "Climate Gear",
      categoryAr: "تجهيزات الطقس",
      type: "weather",
    });
    suggestions.push({
      id: "w_polarized_glasses",
      textEn: "Polarized Sunglasses & Wide-brimmed Hat",
      textAr: "نظارات شمسية مستقطبة وقبعة عريضة الحواف",
      reasonEn: "Intense daytime sun protection",
      reasonAr: "للحماية من أشعة الشمس الساطعة والوهج أثناء النهار",
      categoryEn: "Climate Gear",
      categoryAr: "تجهيزات الطقس",
      type: "weather",
    });
    suggestions.push({
      id: "w_hydration",
      textEn: "Insulated water flask (1.5L+)",
      textAr: "مطرة مياه عازلة للحرارة (1.5 لتر+)",
      reasonEn: "Crucial for warm climates to avoid dehydration",
      reasonAr: "ضرورية لتجنب الجفاف في الطقس الحار أو الصحراوي والقرى الجافة",
      categoryEn: "Climate Gear",
      categoryAr: "تجهيزات الطقس",
      type: "weather",
    });
    suggestions.push({
      id: "w_light_fabrics",
      textEn: "Breathable linen shirt or ultra-light loose wear",
      textAr: "ملابس كتانية خفيفة أو قمصان قطنية بيضاء فضفاضة",
      reasonEn: "Maintains adequate airflow & comfort under high sun loads",
      reasonAr: "تسمح بالتهوية الممتازة وتجنب تضايق الجسم من الحر الوافر",
      categoryEn: "Climate Gear",
      categoryAr: "تجهيزات الطقس",
      type: "weather",
    });
  }

  if (weatherMatches.windy || isSahara) {
    suggestions.push({
      id: "w_face_scarf",
      textEn: "Microfiber lightweight face scarf / Cheche",
      textAr: "شال خفيف لحماية الوجه والرأس (شاش/حايك)",
      reasonEn: "Protects against incoming sand drafts and dust storms",
      reasonAr: "يحمي من هبوب الرمال والغبار في الرحلات الصحراوية أو الرياح العاتية",
      categoryEn: "Climate Gear",
      categoryAr: "تجهيزات الطقس",
      type: "weather",
    });
    suggestions.push({
      id: "w_moisturizer",
      textEn: "Lip balm & intensive skin moisturizer",
      textAr: "مرطب شفاه وكريم مرطب ومغذي للبشرة",
      reasonEn: "Prevents skin cracking from dry sand or heavy wind",
      reasonAr: "يمنع جفاف وتشقق البشرة والشفاه بفعل الرياح الجافة والرمال",
      categoryEn: "Climate Gear",
      categoryAr: "تجهيزات الطقس",
      type: "weather",
    });
  }

  if (isCoastal) {
    suggestions.push({
      id: "w_coastal_wear",
      textEn: "Light windbreaker or outerwear layer for evening",
      textAr: "جاكيت خفيف واقٍ من النسمات والرياح الساحلية ليلاً",
      reasonEn: "Coastal zones often get refreshing but chilly breezes after dark",
      reasonAr: "في المواقع الساحلية، تنخفض درجات الحرارة تدريجياً ويشتد نسيم البحر الرطب ليلاً",
      categoryEn: "Climate Gear",
      categoryAr: "تجهيزات الطقس",
      type: "weather",
    });
  }

  let textPool = "";
  if (itinerary.days && Array.isArray(itinerary.days)) {
    itinerary.days.forEach(day => {
      if (day.activities && Array.isArray(day.activities)) {
        day.activities.forEach(act => {
          textPool += ` ${act.title || ""} ${act.description || ""}`;
        });
      }
    });
  }
  textPool = textPool.toLowerCase();

  const activityMatches = {
    hiking: /hiking|trek|climb|mountain|wilderness|trail|forest|جبل|مشي|تسلق|مسار سياحي|غابة/gi.test(textPool),
    swimming: /swim|beach|sea|waterfall|pool|yacht|snorke|بحر|شاطئ|سباحة|حوض|مسبح/gi.test(textPool),
    shopping: /market|mall|souk|bazaar|craft|tradition|تسوق|سوق|محلات|هدايا/gi.test(textPool),
    culture: /museum|mosque|shrine|history|ruins|palace|ancient|متحف|تاريخ|مسجد|قصر|أثري/gi.test(textPool),
    food: /dinner|restaurant|cuisine|dish|tasting|foodie|gastronom|عشاء|مطعم|أكل|أطباق|مطبخ/gi.test(textPool),
    photography: /photo|camera|lens|scenic|picture|sunset|views|تصوير|كاميرا|منظر|غروب/gi.test(textPool),
    camping: /camp|bivouac|desert night|sahara night|tent|خيمة|تخييم|مبيت/gi.test(textPool)
  };

  if (activityMatches.hiking) {
    suggestions.push({
      id: "a_trail_shoes",
      textEn: "Ankle-support hiking boots or outdoor trail runners",
      textAr: "أحذية مشي للمسافات الطويلة أو أحذية جبلية ذات دفع قوي",
      reasonEn: "Detected mountain scaling or nature hikes in the schedule",
      reasonAr: "بسبب وجود أنشطة تسلق جبال أو مشي في الطبيعة ببرنامج رحلتك",
      categoryEn: "Activity Gear",
      categoryAr: "تجهيزات الأنشطة",
      type: "activity",
    });
    suggestions.push({
      id: "a_bug_spray",
      textEn: "Tropical insect repellent (DEET 30%+)",
      textAr: "بخاخ طارد للحشرات والبعوض بتركيز فعال",
      reasonEn: "Outdoor wilderness or forestry explorations identified",
      reasonAr: "بسبب الأنشطة الخارجية والبرية في الطبيعة المدرجة بجدولك",
      categoryEn: "Activity Gear",
      categoryAr: "تجهيزات الأنشطة",
      type: "activity",
    });
    suggestions.push({
      id: "a_backpack",
      textEn: "15L - 25L lightweight day-pack with utility straps",
      textAr: "حقيبة ظهر خفيفة (15-25 لتر) لحمل الأغراض اليومية والمياه",
      reasonEn: "Essential for carrying rations during day hikes",
      reasonAr: "لتسهيل حمل المستندات والمياه والوجبات الخفيفة طوال ساعات الاستكشاف",
      categoryEn: "Activity Gear",
      categoryAr: "تجهيزات الأنشطة",
      type: "activity",
    });
    if (/mountain|climb|جبل|تسلق/i.test(textPool)) {
      suggestions.push({
        id: "a_trek_poles",
        textEn: "Collapsible robust trekking poles",
        textAr: "عصي مشي وتجوال صلبة وقابلة للطي",
        reasonEn: "Provides leg support and joint relief on steep mountain paths",
        reasonAr: "لتوفير التوازن وتخفيف الضغط عن الركبتين بالممرات الجبلية شديدة الوعورة",
        categoryEn: "Activity Gear",
        categoryAr: "تجهيزات الأنشطة",
        type: "activity",
      });
    }
  }

  if (activityMatches.swimming || isCoastal) {
    suggestions.push({
      id: "a_swimwear",
      textEn: "Quick-dry swimwear & UV rashguard",
      textAr: "ملابس سباحة سريعة الجفاف وقميص واقٍ من الشمس",
      reasonEn: "Beach activities or pool visits identified",
      reasonAr: "بسبب رحلات الشواطئ والمحطات المائية والمسابح المدرجة في البرنامج",
      categoryEn: "Activity Gear",
      categoryAr: "تجهيزات الأنشطة",
      type: "activity",
    });
    suggestions.push({
      id: "a_microfiber_towel",
      textEn: "Highly absorbent compact microfiber towel",
      textAr: "منشفة سفر ميكروفايبر فائقة الامتصاص وموفرة للمساحة",
      reasonEn: "Dries rapidly and fits in any small pouch",
      reasonAr: "تجف بسرعة فائقة ولا تأخذ مساحة كبيرة بحقيبة الظهر",
      categoryEn: "Activity Gear",
      categoryAr: "تجهيزات الأنشطة",
      type: "activity",
    });
    suggestions.push({
      id: "a_waterproof_container",
      textEn: "Lanyard waterproof phone case / beach bag",
      textAr: "جراب هاتف مقاوم للماء مع خيط تعليق وحقيبة شاطئ",
      reasonEn: "Keeps electronics safe near sea spray and sand",
      reasonAr: "لحماية أجهزتك الإلكترونية من مياه البحر والرذاذ والرمال الناعمة",
      categoryEn: "Activity Gear",
      categoryAr: "تجهيزات الأنشطة",
      type: "activity",
    });
  }

  if (activityMatches.shopping) {
    suggestions.push({
      id: "a_canvas_bag",
      textEn: "Foldable eco-friendly canvas shopper bag",
      textAr: "حقيبة تسوق قماشية صديقة للبيئة وقابلة للطي",
      reasonEn: "Perfect for holding traditional souvenirs & dates",
      reasonAr: "مفيدة لحمل التذكارات والصناعات التقليدية والتمور الجزائرية أثناء التجول",
      categoryEn: "Activity Gear",
      categoryAr: "تجهيزات الأنشطة",
      type: "activity",
    });
    suggestions.push({
      id: "a_cash_pouch",
      textEn: "Secure dual-compartment travel cash pouch",
      textAr: "محفظة مخفية أو حقيبة خصر صغيرة لتثبيت الكاش بمأمن",
      reasonEn: "Essential for market negotiations and souvenirs",
      reasonAr: "مهمة جداً للتعامل بالكاش والسيولة النقدية في الأسواق التقليدية الشعبية",
      categoryEn: "Activity Gear",
      categoryAr: "تجهيزات الأنشطة",
      type: "activity",
    });
  }

  if (activityMatches.culture) {
    suggestions.push({
      id: "a_modest_attire",
      textEn: "Modest attire covering shoulders & knees",
      textAr: "ملابس محتشمة تغطي الكتفين والركبتين للزيارات الثقافية",
      reasonEn: "Respectful access code for mosques and historical spaces",
      reasonAr: "مراعاة لآداب وثقافة زيارة المساجد التاريخية والمعالم الأثرية والمقدسة",
      categoryEn: "Activity Gear",
      categoryAr: "تجهيزات الأنشطة",
      type: "activity",
    });
    suggestions.push({
      id: "a_slip_on_shoes",
      textEn: "Slip-on loafers / footwear easy to remove",
      textAr: "أحذية سهلة النزع والارتداء (بدون أربطة معقدة)",
      reasonEn: "Saves time when entering religious temples or places of worship",
      reasonAr: "تسهل وتوفر الوقت عند الدخول للمساجد أو الصروح التاريخية التي يتطلب دخولها نزع الحذاء",
      categoryEn: "Activity Gear",
      categoryAr: "تجهيزات الأنشطة",
      type: "activity",
    });
  }

  if (activityMatches.food) {
    suggestions.push({
      id: "a_antacids",
      textEn: "Gastric antacids or digestive enzymes",
      textAr: "مضادات الحموضة وإنزيمات هضمية مهدئة للمعدة",
      reasonEn: "Helps you adjust seamlessly to rich traditional foods and dishes",
      reasonAr: "تساعد في تلطيف وضمان راحة المعدة عند تذوق الأطباق والولائم التقليدية الغنية",
      categoryEn: "Activity Gear",
      categoryAr: "تجهيزات الأنشطة",
      type: "activity",
    });
  }

  if (activityMatches.photography) {
    suggestions.push({
      id: "a_lens_kit",
      textEn: "Rechargeable camera battery pack & fine lens cleaners",
      textAr: "بطارية كاميرا إضافية ومنديل ناعم لتنظيف عدسات التصوير",
      reasonEn: "Assures you never run out of charge during spectacular sunset visits",
      reasonAr: "تضمن التقاط كل بيكسل ونقاء من المناظر الشاهقة والغروب بنظافة تامة وشحن كافي",
      categoryEn: "Activity Gear",
      categoryAr: "تجهيزات الأنشطة",
      type: "activity",
    });
  }

  if (activityMatches.camping) {
    suggestions.push({
      id: "a_flashlight",
      textEn: "LED Headlamp or tactical waterproof torchlight",
      textAr: "كشاف رأس LED أو مصباح تاكتيكي مقاوم للماء",
      reasonEn: "Essential utility for moving around campgrounds after nightfall",
      reasonAr: "مهم وضروري جداً لتفقد مخيم المبيت أو جولات الرصد الفلكي الليلية بالبراري",
      categoryEn: "Activity Gear",
      categoryAr: "تجهيزات الأنشطة",
      type: "activity",
    });
  }

  suggestions.push({
    id: "e_powerbank",
    textEn: "Universal power bank (20,000mAh+) / charger",
    textAr: "شاحن متنقل عالي السعة (20,000 مللي أمبير+)",
    reasonEn: "Continuous camera and navigation mapping during outdoor times",
    reasonAr: "لضمان استمرار شحن هاتفك وتشغيل نظام الملاحة والتصوير بكثافة طوال اليوم",
    categoryEn: "Essentials",
    categoryAr: "الأساسيات والمستندات",
    type: "activity",
  });
  suggestions.push({
    id: "e_medikit",
    textEn: "Personal medical kit (painkillers, antacids, band-aids)",
    textAr: "حقيبة طبية إسعافية مصغرة (مسكنات، مضادات حموضة، ضمادات)",
    reasonEn: "Essential for minor symptoms or gastronomic adaptations",
    reasonAr: "للطوارئ البسيطة أو التكيف مع المأكولات ولضمان راحتك الصحية دائماً",
    categoryEn: "Essentials",
    categoryAr: "الأساسيات والمستندات",
    type: "activity",
  });

  return suggestions;
}

export interface VisualActivityTag {
  id: string;
  labelAr: string;
  labelEn: string;
  bgStyle: string;
  borderStyle: string;
  textStyle: string;
  emoji: string;
}

export function getActivityTags(title: string, desc: string): VisualActivityTag[] {
  const text = `${title} ${desc}`.toLowerCase();
  const tags: VisualActivityTag[] = [];

  const outdoorKeywordsEn = ["hike", "nature", "outdoor", "park", "lake", "beach", "forest", "mountain", "climb", "trek", "sport", "walk", "sea", "desert", "safari", "valley", "dune", "camp", "gorge", "oasis", "canyon", "drive", "ride", "boat", "swim", "coast", "exploration", "trail", "explore", "outside", "garden", "dunes"];
  const outdoorKeywordsAr = ["جولة", "سفاري", "صحراء", "واحة", "جبل", "طبيعة", "غابة", "حديقة", "بحر", "شاطئ", "رمال", "تخييم", "سير", "تنزه", "مسار", "واد", "وديان", "رمال", "ركوب", "خارجي"];

  const historyKeywordsEn = ["history", "historical", "museum", "ruin", "ancient", "monument", "castle", "palace", "heritage", "culture", "cultural", "mosque", "church", "cathedral", "tradition", "traditional", "folklore", "art", "gallery", "guided", "landmark", "kasbah", "archaeological", "romans", "roman", "heritage"];
  const historyKeywordsAr = ["تاريخ", "تاريخي", "متحف", "آثار", "قديم", "أثري", "قصر", "قلعة", "مسجد", "جامع", "كنيسة", "تراث", "ثقافة", "ثقافي", "شعبي", "القصبة", "معالم", "معلم"];

  const foodKeywordsEn = ["food", "lunch", "dinner", "breakfast", "eat", "restaurant", "cafe", "meal", "coffee", "tea", "dining", "delicacy", "brewery", "baking", "sweet", "street", "kitchen", "dishes", "dish", "cooking", "cuisine"];
  const foodKeywordsAr = ["أكل", "طعام", "غداء", "عشاء", "فطور", "مطعم", "مقهى", "شاي", "قهوة", "وجبة", "مأكولات", "حلويات", "تذوق", "شعبي", "طبق", "طهي"];

  const relaxKeywordsEn = ["relax", "relaxation", "spa", "pool", "hotel", "beach lounge", "massage", "hammam", "bath", "chill", "leisure", "sunset", "view", "beauty", "workshop", "stay", "sleep", "cabin", "retreat", "resort", "comfort", "lounge", "rest", "bed"];
  const relaxKeywordsAr = ["استرخاء", "استجمام", "حمام", "معدني", "راحة", "غروب", "مسبح", "فندق", "منتجع", "جلسة", "هدوء", "منظر", "إقامة"];

  const hasOutdoor = outdoorKeywordsEn.some(kw => text.includes(kw)) || outdoorKeywordsAr.some(kw => text.includes(kw));
  const hasHistory = historyKeywordsEn.some(kw => text.includes(kw)) || historyKeywordsAr.some(kw => text.includes(kw));
  const hasFood = foodKeywordsEn.some(kw => text.includes(kw)) || foodKeywordsAr.some(kw => text.includes(kw));
  const hasRelax = relaxKeywordsEn.some(kw => text.includes(kw)) || relaxKeywordsAr.some(kw => text.includes(kw));

  if (hasOutdoor) {
    tags.push({
      id: "outdoor",
      labelAr: "نشاط خارجي",
      labelEn: "Outdoor",
      bgStyle: "bg-emerald-50",
      borderStyle: "border-emerald-200/50",
      textStyle: "text-emerald-700",
      emoji: "🌲"
    });
  }
  if (hasHistory) {
    tags.push({
      id: "history",
      labelAr: "تاريخ وثقافة",
      labelEn: "History",
      bgStyle: "bg-amber-50",
      borderStyle: "border-amber-200/50",
      textStyle: "text-amber-700",
      emoji: "🏛️"
    });
  }
  if (hasFood) {
    tags.push({
      id: "food",
      labelAr: "طعام ومطاعم",
      labelEn: "Food",
      bgStyle: "bg-rose-50",
      borderStyle: "border-rose-200/50",
      textStyle: "text-rose-700",
      emoji: "🍳"
    });
  }
  if (hasRelax) {
    tags.push({
      id: "relax",
      labelAr: "راحة واستجمام",
      labelEn: "Relax",
      bgStyle: "bg-teal-50",
      borderStyle: "border-teal-200/50",
      textStyle: "text-teal-700",
      emoji: "🧘"
    });
  }

  // If none matched, assign a fallback Explore tag
  if (tags.length === 0) {
    tags.push({
      id: "explore",
      labelAr: "استكشاف عام",
      labelEn: "Explore",
      bgStyle: "bg-indigo-50",
      borderStyle: "border-indigo-200/50",
      textStyle: "text-indigo-700",
      emoji: "🧭"
    });
  }

  return tags;
}

export function enrichItineraryWithSmartPacking(itinerary: Itinerary, language: "en" | "ar", weather?: WeatherConditions | null): Itinerary {
  if (!itinerary) return itinerary;

  const suggestions = generateSmartSuggestions(itinerary, weather);
  const customPackingList = [...(itinerary.customPackingList || [])];

  const weatherSuggestions = suggestions.filter(s => s.type === "weather");
  const activitySuggestions = suggestions.filter(s => s.type === "activity");

  const weatherLabel = language === "ar" ? "🧥 تجهيزات الطقس والمناخ" : "🧥 Climate & Weather Gear";
  const activityLabel = language === "ar" ? "🏃 تجهيزات الأنشطة المبرمجة" : "🏃 Planned Activity Gear";

  if (weatherSuggestions.length > 0) {
    const items = weatherSuggestions.map(s => language === "ar" ? s.textAr : s.textEn);
    const existingIdx = customPackingList.findIndex(cat => 
      cat.category.toLowerCase().includes(language === "ar" ? "الطقس" : "climate") ||
      cat.category.toLowerCase().includes(language === "ar" ? "الجو" : "weather")
    );
    if (existingIdx >= 0) {
      customPackingList[existingIdx] = { category: weatherLabel, items };
    } else {
      customPackingList.unshift({ category: weatherLabel, items });
    }
  }

  if (activitySuggestions.length > 0) {
    const items = activitySuggestions.map(s => language === "ar" ? s.textAr : s.textEn);
    const existingIdx = customPackingList.findIndex(cat => 
      cat.category.toLowerCase().includes(language === "ar" ? "الأنشطة" : "planned activity") ||
      cat.category.toLowerCase().includes(language === "ar" ? "مخططة" : "activity gear")
    );
    if (existingIdx >= 0) {
      customPackingList[existingIdx] = { category: activityLabel, items };
    } else {
      customPackingList.push({ category: activityLabel, items });
    }
  }

  return {
    ...itinerary,
    customPackingList
  };
}

interface TravelPlannerProps {
  lang: "ar" | "en";
  onItineraryGenerated: (itinerary: Itinerary) => void;
  onUpdateItinerary?: (itinerary: Itinerary) => void;
  activeItinerary: Itinerary | null;
  selectedFlight?: FlightMock | null;
  selectedHotel?: HotelMock | null;
  initialCoordinationTypeOverride?: "optional" | "fos7a" | null;
  onResetCoordinationTypeOverride?: () => void;
}

export default function TravelPlanner({ 
  lang, 
  onItineraryGenerated, 
  onUpdateItinerary,
  activeItinerary,
  selectedFlight,
  selectedHotel,
  initialCoordinationTypeOverride,
  onResetCoordinationTypeOverride
}: TravelPlannerProps) {
  const t = translations[lang];

  const [packingWeather, setPackingWeather] = useState<WeatherConditions | null>(null);
  const [packingWeatherLoading, setPackingWeatherLoading] = useState<boolean>(false);
  const [packingAiLoading, setPackingAiLoading] = useState<boolean>(false);

  const handleTriggerAiAdditions = async () => {
    if (!activeItinerary || packingAiLoading) return;
    setPackingAiLoading(true);

    try {
      // Gather all current packing items to avoid suggestion duplication
      const currentList = (enrichedItinerary?.customPackingList || []).flatMap(cat => cat.items);

      const res = await fetch("/api/get-packing-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: activeItinerary.destinationName,
          duration: activeItinerary.tripDurationDays,
          lang,
          currentPacking: currentList
        })
      });

      if (!res.ok) {
        throw new Error("Failed to fetch packing suggestions");
      }

      const data = await res.json();
      if (data.additions && Array.isArray(data.additions)) {
        // We can group additions by category and merge them into activeItinerary.customPackingList!
        const updatedPackingList = [...(activeItinerary.customPackingList || [])];

        data.additions.forEach((addition: { category: string; item: string }) => {
          // Find matching category or create a new one
          const categoryName = addition.category;
          const itemName = addition.item;

          const existingCatIdx = updatedPackingList.findIndex(c => 
            c.category.toLowerCase().trim() === categoryName.toLowerCase().trim()
          );

          if (existingCatIdx >= 0) {
            // Avoid adding duplicate item name strings inside same category
            if (!updatedPackingList[existingCatIdx].items.some(it => it.toLowerCase().includes(itemName.toLowerCase()))) {
              updatedPackingList[existingCatIdx] = {
                ...updatedPackingList[existingCatIdx],
                items: [...updatedPackingList[existingCatIdx].items, itemName]
              };
            }
          } else {
            updatedPackingList.push({
              category: categoryName,
              items: [itemName]
            });
          }
        });

        // Save back
        const updatedItinerary = {
          ...activeItinerary,
          customPackingList: updatedPackingList
        };

        if (onUpdateItinerary) {
          onUpdateItinerary(updatedItinerary);
        } else {
          onItineraryGenerated(updatedItinerary);
        }
      }
    } catch (err) {
      console.error("Error generating packing additions:", err);
    } finally {
      setPackingAiLoading(false);
    }
  };

  // Add custom activity form state
  const [showAddActivityForm, setShowAddActivityForm] = useState(false);
  const [newActivityTitle, setNewActivityTitle] = useState("");
  const [newActivityDesc, setNewActivityDesc] = useState("");
  const [newActivityLocation, setNewActivityLocation] = useState("");
  const [newActivityCost, setNewActivityCost] = useState("");
  const [newActivityDuration, setNewActivityDuration] = useState("2");
  const [newActivityTimeOfDay, setNewActivityTimeOfDay] = useState<"Morning" | "Afternoon" | "Evening">("Afternoon");

  // Simulated Alert Notification Configuration States
  interface SimulatedAlert {
    id: string;
    title: string;
    description: string;
    location: string;
    timeOfDay: string;
    durationHours: number;
    dayNumber: number;
    activityIdx: number;
    simulatedActionStatus?: string;
  }

  const [notificationConfigs, setNotificationConfigs] = useState<Record<string, {
    active: boolean;
    countdown: number | null;
  }>>(() => {
    try {
      const saved = localStorage.getItem("simulated_notification_configs");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [activeSimulatedAlerts, setActiveSimulatedAlerts] = useState<SimulatedAlert[]>([]);

  // Ticks down simulated notification timers every second
  useEffect(() => {
    const hasCountdowns = Object.values(notificationConfigs).some((cfg: any) => cfg && cfg.countdown !== null && cfg.countdown > 0);
    if (!hasCountdowns) return;

    const interval = setInterval(() => {
      setNotificationConfigs(prev => {
        const next = { ...prev };
        let stateChanged = false;

        Object.keys(next).forEach(key => {
          const cfg = next[key];
          if (cfg && cfg.countdown !== null) {
            stateChanged = true;
            if (cfg.countdown <= 1) {
              // Time has approached! Trigger simulated popup alert
              next[key] = {
                active: cfg.active,
                countdown: null, // Countdown completed
              };

              const [dayNumStr, actIdxStr] = key.split("-");
              const dayNum = parseInt(dayNumStr);
              const actIdx = parseInt(actIdxStr);

              if (activeItinerary && activeItinerary.days) {
                const targetDay = activeItinerary.days.find(d => d.dayNumber === dayNum);
                const act = targetDay?.activities?.[actIdx];
                if (act) {
                  const alertId = `${dayNum}-${actIdx}-${Date.now()}`;
                  setActiveSimulatedAlerts(prevAlerts => [
                    ...prevAlerts,
                    {
                      id: alertId,
                      title: act.title,
                      description: act.description,
                      location: act.locationName || (lang === "ar" ? "معلم سياحي مقترح" : "Suggested attraction spot"),
                      timeOfDay: act.timeOfDay,
                      durationHours: act.durationHours || 2,
                      dayNumber: dayNum,
                      activityIdx: actIdx
                    }
                  ]);

                  // Play custom synthesized musical pop note
                  try {
                    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                    if (AudioContextClass) {
                      const ctx = new AudioContextClass();
                      const playTone = (freq: number, startTime: number, duration: number) => {
                        const osc = ctx.createOscillator();
                        const gainNode = ctx.createGain();
                        osc.type = "sine";
                        osc.frequency.setValueAtTime(freq, startTime);

                        gainNode.gain.setValueAtTime(0, startTime);
                        gainNode.gain.linearRampToValueAtTime(0.12, startTime + 0.05);
                        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

                        osc.connect(gainNode);
                        gainNode.connect(ctx.destination);

                        osc.start(startTime);
                        osc.stop(startTime + duration);
                      };
                      const now = ctx.currentTime;
                      // Play harmonious trip-chime
                      playTone(587.33, now, 0.4); // D5
                      playTone(698.46, now + 0.08, 0.45); // F5
                      playTone(880.00, now + 0.16, 0.55); // A5
                    }
                  } catch (err) {
                    console.log("Audio contextual chime allowed state check", err);
                  }
                }
              }
            } else {
              // Decrement remaining seconds
              next[key] = {
                active: cfg.active,
                countdown: cfg.countdown - 1
              };
            }
          }
        });

        if (stateChanged) {
          localStorage.setItem("simulated_notification_configs", JSON.stringify(next));
          return next;
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [notificationConfigs, activeItinerary, lang]);

  const handleToggleNotification = (dayNumber: number, actIdx: number) => {
    const key = `${dayNumber}-${actIdx}`;
    setNotificationConfigs(prev => {
      const current = prev[key];
      const isEnabling = !current?.active;

      const next = {
        ...prev,
        [key]: {
          active: isEnabling,
          countdown: isEnabling ? 5 : null // Start simulated approaching timer
        }
      };
      localStorage.setItem("simulated_notification_configs", JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    let active = true;
    if (!activeItinerary?.destinationName) {
      setPackingWeather(null);
      return;
    }

    async function fetchPackingWeather() {
      setPackingWeatherLoading(true);
      try {
        const dest = activeItinerary!.destinationName;
        // Step 1: Geocoding the destination
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(dest)}&count=1&language=en&format=json`;
        const geoRes = await fetch(geoUrl);
        if (!geoRes.ok) throw new Error("Geocoding failed");
        const geoData = await geoRes.json();
        if (!geoData.results || geoData.results.length === 0) throw new Error("No coordinate data found");

        const { latitude, longitude } = geoData.results[0];

        // Step 2: Fetch 7-day daily forecast
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_sum,windspeed_10m_max&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        if (!weatherRes.ok) throw new Error("Weather service failed");
        const wData = await weatherRes.json();
        const daily = wData.daily;

        if (daily && daily.temperature_2m_max && active) {
          const maxTemps = daily.temperature_2m_max.map(Number);
          const minTemps = daily.temperature_2m_min.map(Number);
          const maxTemp = Math.max(...maxTemps);
          const minTemp = Math.min(...minTemps);
          const totalRain = daily.precipitation_sum ? daily.precipitation_sum.reduce((a: number, b: number) => a + b, 0) : 0;
          const maxWind = daily.windspeed_10m_max ? Math.max(...daily.windspeed_10m_max.map(Number)) : 0;

          const hasRain = totalRain >= 1.5 || daily.weathercode?.some((code: number) => [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code));
          const hasWind = maxWind >= 18;
          const hasHeat = maxTemp >= 33;
          const hasCold = minTemp <= 11;

          const nameLower = dest.toLowerCase();
          let zone: "desert" | "mountain" | "coastal" | "moderate" = "moderate";
          if (
            nameLower.includes("ghardaia") || 
            nameLower.includes("sahara") || 
            nameLower.includes("taghit") || 
            nameLower.includes("timimoun") || 
            nameLower.includes("djanet") || 
            nameLower.includes("tamanrasset") || 
            nameLower.includes("biskra") || 
            nameLower.includes("tindouf") ||
            nameLower.includes("ouargla") ||
            nameLower.includes("desert")
          ) {
            zone = "desert";
          } else if (
            nameLower.includes("constantine") || 
            nameLower.includes("setif") || 
            nameLower.includes("batna") || 
            nameLower.includes("medea") || 
            nameLower.includes("khenchela") || 
            nameLower.includes("tiaret") ||
            minTemp <= 11
          ) {
            zone = "mountain";
          } else if (
            nameLower.includes("bejaia") || 
            nameLower.includes("jijel") || 
            nameLower.includes("oran") || 
            nameLower.includes("algiers") || 
            nameLower.includes("tipaza") || 
            nameLower.includes("skikda") || 
            nameLower.includes("annaba") || 
            nameLower.includes("beach") ||
            nameLower.includes("coast")
          ) {
            zone = "coastal";
          }

          setPackingWeather({
            maxTemp,
            minTemp,
            hasRain,
            hasWind,
            hasHeat,
            hasCold,
            zone
          });
        }
      } catch (err) {
        console.warn("Packing background weather fetch failed, using fallback:", err);
        if (active) {
          const dest = activeItinerary!.destinationName;
          const nameLower = dest.toLowerCase();
          let zone: "desert" | "mountain" | "coastal" | "moderate" = "moderate";
          let maxTemp = 24;
          let minTemp = 14;
          let hasRain = false;
          let hasWind = false;
          let hasHeat = false;
          let hasCold = false;

          if (
            nameLower.includes("ghardaia") || 
            nameLower.includes("sahara") || 
            nameLower.includes("taghit") || 
            nameLower.includes("timimoun") || 
            nameLower.includes("djanet") || 
            nameLower.includes("tamanrasset") || 
            nameLower.includes("biskra") || 
            nameLower.includes("tindouf") ||
            nameLower.includes("ouargla") ||
            nameLower.includes("desert")
          ) {
            zone = "desert";
            maxTemp = 36;
            minTemp = 21;
            hasHeat = true;
            hasWind = true;
          } else if (
            nameLower.includes("constantine") || 
            nameLower.includes("setif") || 
            nameLower.includes("batna") || 
            nameLower.includes("medea") || 
            nameLower.includes("khenchela") || 
            nameLower.includes("tiaret")
          ) {
            zone = "mountain";
            maxTemp = 18;
            minTemp = 8;
            hasCold = true;
          } else if (
            nameLower.includes("bejaia") || 
            nameLower.includes("jijel") || 
            nameLower.includes("oran") || 
            nameLower.includes("algiers") || 
            nameLower.includes("tipaza") || 
            nameLower.includes("skikda") || 
            nameLower.includes("annaba") || 
            nameLower.includes("beach") ||
            nameLower.includes("coast")
          ) {
            zone = "coastal";
            maxTemp = 25;
            minTemp = 15;
          }

          setPackingWeather({
            maxTemp,
            minTemp,
            hasRain,
            hasWind,
            hasHeat,
            hasCold,
            zone
          });
        }
      } finally {
        if (active) {
          setPackingWeatherLoading(false);
        }
      }
    }

    fetchPackingWeather();
    return () => {
      active = false;
    };
  }, [activeItinerary?.destinationName]);

  const enrichedItinerary = useMemo(() => {
    if (!activeItinerary) return null;
    return enrichItineraryWithSmartPacking(activeItinerary, lang, packingWeather);
  }, [activeItinerary, lang, packingWeather]);

  const [targetCurrency, setTargetCurrency] = useState<"USD" | "LOCAL" | null>(null);
  const [customExchangeRate, setCustomExchangeRate] = useState<number>(140);
  const [rateType, setRateType] = useState<"bank" | "black">("bank");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [customBudgetTarget, setCustomBudgetTarget] = useState<string>("");
  const [itineraryViewMode, setItineraryViewMode] = useState<"timeline" | "slideshow">("timeline");

  // Drag and drop states for activities reordering
  const [draggedActivityIndex, setDraggedActivityIndex] = useState<number | null>(null);
  const [dragOverActivityIndex, setDragOverActivityIndex] = useState<number | null>(null);

  const handleReorderActivities = (dayIdx: number, fromIdx: number, toIdx: number) => {
    if (activeItinerary) {
      const updated = { ...activeItinerary };
      updated.days = updated.days.map((day, dIdx) => {
        if (dIdx === dayIdx) {
          const list = [...day.activities];
          const [removed] = list.splice(fromIdx, 1);
          list.splice(toIdx, 0, removed);
          return {
            ...day,
            activities: list
          };
        }
        return day;
      });

      // Maintain order changes back into parent states
      if (onUpdateItinerary) {
        onUpdateItinerary(updated);
      } else {
        onItineraryGenerated(updated);
      }
    }
  };

  // Synchronize target budget when itinerary updates
  useEffect(() => {
    if (activeItinerary) {
      const budgetStr = activeItinerary.allocatedBudgetAmount || "";
      // Strip currency signs or commas to get a numeric suggestion
      const numericPart = budgetStr.replace(/[^\d]/g, "");
      setCustomBudgetTarget(numericPart || "150000"); // Standard starting DZD suggestion or custom default
    }
  }, [activeItinerary?.destinationName, activeItinerary?.tripDurationDays]);

  // Track completed days on itinerary change
  useEffect(() => {
    if (activeItinerary) {
      const storageKey = `completed_days_${activeItinerary.destinationName}_${activeItinerary.tripDurationDays}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setCompletedDays(JSON.parse(saved));
        } catch (e) {
          setCompletedDays([]);
        }
      } else {
        setCompletedDays([]);
      }
    }
  }, [activeItinerary?.destinationName, activeItinerary?.tripDurationDays]);

  const toggleDayCompleted = (dayNumber: number) => {
    if (!activeItinerary) return;
    const storageKey = `completed_days_${activeItinerary.destinationName}_${activeItinerary.tripDurationDays}`;
    const newCompleted = completedDays.includes(dayNumber)
      ? completedDays.filter(d => d !== dayNumber)
      : [...completedDays, dayNumber].sort((a, b) => a - b);
    
    setCompletedDays(newCompleted);
    localStorage.setItem(storageKey, JSON.stringify(newCompleted));
  };

  const getDefaultExchangeRate = (country: string, isDomestic: boolean, type: "bank" | "black"): number => {
    const countryLower = (country || "").toLowerCase();
    const isDZ = isDomestic || countryLower.includes("algeria");

    if (isDZ) {
      return type === "black" ? 240 : 135;
    }

    if (
      countryLower.includes("ital") || 
      countryLower.includes("rom") || 
      countryLower.includes("franc") || 
      countryLower.includes("pari") || 
      countryLower.includes("spain") || 
      countryLower.includes("greec") || 
      countryLower.includes("german") || 
      countryLower.includes("euro")
    ) {
      return type === "black" ? 260 : 147;
    }
    if (countryLower.includes("egypt") || countryLower.includes("cair")) {
      return type === "black" ? 52 : 48;
    }
    if (countryLower.includes("japan") || countryLower.includes("tokyo")) {
      return type === "black" ? 155 : 155;
    }
    if (
      countryLower.includes("saudi") || 
      countryLower.includes("riyadh") || 
      countryLower.includes("makkah") || 
      countryLower.includes("madinah")
    ) {
      return type === "black" ? 64 : 36;
    }
    if (countryLower.includes("uae") || countryLower.includes("dubai") || countryLower.includes("emirates")) {
      return type === "black" ? 65 : 37;
    }
    if (countryLower.includes("oman") || countryLower.includes("muscat")) {
      return type === "black" ? 0.38 : 0.38;
    }
    if (countryLower.includes("tunis")) {
      return type === "black" ? 3.1 : 3.1;
    }
    if (countryLower.includes("moroc") || countryLower.includes("maroc")) {
      return type === "black" ? 10.1 : 10.1;
    }
    if (countryLower.includes("turk") || countryLower.includes("istanbul")) {
      return type === "black" ? 32 : 32;
    }
    return type === "black" ? 1.7 : 1.0;
  };

  // Automatically update the default exchange rate when activeItinerary or rateType changes
  useEffect(() => {
    if (activeItinerary) {
      const isDomestic = !!activeItinerary.isDomesticTrip;
      const country = activeItinerary.country || "";
      const defaultRate = getDefaultExchangeRate(country, isDomestic, rateType);
      setCustomExchangeRate(defaultRate);

      if (isDomestic) {
        setTargetCurrency("LOCAL");
      } else {
        setTargetCurrency("USD");
      }
    }
  }, [activeItinerary, rateType]);

  const activeCurrencyMode = targetCurrency || (activeItinerary?.isDomesticTrip ? "LOCAL" : "USD");

  const formatPrice = (priceUSDorLocal: number) => {
    if (!activeItinerary) return `$${priceUSDorLocal}`;

    const isDomestic = !!activeItinerary.isDomesticTrip;
    const localSym = activeItinerary.localCurrencySymbol || (lang === "ar" ? "دج" : "DZD");

    if (isDomestic) {
      // Base values inside the itinerary database are in local currency (DZD)
      if (activeCurrencyMode === "LOCAL") {
        return `${Math.round(priceUSDorLocal).toLocaleString("en-US")} ${localSym}`;
      } else {
        // Convert DZD to USD
        const rate = customExchangeRate || 140;
        const converted = priceUSDorLocal / rate;
        return `$${converted.toLocaleString("en-US")}`;
      }
    } else {
      // Base values inside the itinerary database are in USD
      if (activeCurrencyMode === "USD") {
        return `$${Math.round(priceUSDorLocal).toLocaleString("en-US")}`;
      } else {
        // Convert USD to local currency
        const rate = customExchangeRate || 1.0;
        const converted = priceUSDorLocal * rate;
        return `${Math.round(converted).toLocaleString("en-US")} ${localSym}`;
      }
    }
  };

  // Form State
  const [tripScope, setTripScope] = useState<"international" | "domestic">("international");
  const [coordinationType, setCoordinationType] = useState<"optional" | "fos7a">("optional");
  const [fos7aTripType, setFos7aTripType] = useState("");
  const [fos7aRequestSubmitted, setFos7aRequestSubmitted] = useState(false);
  const [originWilaya, setOriginWilaya] = useState("الجزائر العاصمة (Algiers)");
  const [originType, setOriginType] = useState<"domestic" | "international">("domestic");
  const [originInternational, setOriginInternational] = useState("فرنسا - باريس (Paris, France)");
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Free Trip / Manual selection smart assistant states
  const [freeTripOrigin, setFreeTripOrigin] = useState("الجزائر العاصمة (Algiers)");
  const [freeTripDestination, setFreeTripDestination] = useState("");
  const [smartQuery, setSmartQuery] = useState("");
  const [smartResult, setSmartResult] = useState<{
    detectedOrigin: string;
    detectedUpcomingDestination: string;
    suggestedAirports: Array<{ code: string; name: string; city: string; type: "direct" | "connection"; remarks: string }>;
    flightSchedules: Array<{ flightNo: string; airline: string; type: "Direct" | "Indirect"; duration: string; departureTime: string; arrivalTime: string; stops: string; remarks: string }>;
    aiGuidanceText: string;
  } | null>(null);
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartError, setSmartError] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);

  // Handle external redirection with coordination type override
  useEffect(() => {
    if (initialCoordinationTypeOverride) {
      setCoordinationType(initialCoordinationTypeOverride);
      if (initialCoordinationTypeOverride === "fos7a") {
        setTimeout(() => {
          const el = document.getElementById("fos7a-smart-copilot-card");
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            const textarea = document.getElementById("smart-fos7a-input-textarea");
            if (textarea) {
              (textarea as HTMLElement).focus();
            }
          }
        }, 300);
      }
      if (onResetCoordinationTypeOverride) {
        onResetCoordinationTypeOverride();
      }
    }
  }, [initialCoordinationTypeOverride, onResetCoordinationTypeOverride]);

  // Fos7a Smart AI Agency Assistant States
  const [smartFos7aQuery, setSmartFos7aQuery] = useState("");
  const [smartFos7aLoading, setSmartFos7aLoading] = useState(false);
  const [smartFos7aError, setSmartFos7aError] = useState("");
  const [smartFos7aSuccessText, setSmartFos7aSuccessText] = useState("");

  const INTERNATIONAL_HUBS = [
    { value: "فرنسا - باريس (Paris, France)", label: "فرنسا - باريس (Paris, France)" },
    { value: "تونس (Tunisia)", label: "تونس (Tunisia)" },
    { value: "تركيا - اسطنبول (Istanbul, Turkey)", label: "تركيا - اسطنبول (Istanbul, Turkey)" },
    { value: "المملكة العربية السعودية (Saudi Arabia)", label: "المملكة العربية السعودية (Saudi Arabia)" },
    { value: "الإمارات - دبي (Dubai, UAE)", label: "الإمارات - دبي (Dubai, UAE)" },
    { value: "قطر - الدوحة (Doha, Qatar)", label: "قطر - الدوحة (Doha, Qatar)" },
    { value: "المملكة المتحدة - لندن (London, UK)", label: "المملكة المتحدة - لندن (London, UK)" },
    { value: "إسبانيا - برشلونة (Barcelona, Spain)", label: "إسبانيا - برشلونة (Barcelona, Spain)" },
    { value: "إيطاليا - روما (Rome, Italy)", label: "إيطاليا - روما (Rome, Italy)" },
    { value: "كندا - مونتريال (Montreal, Canada)", label: "كندا - مونتريال (Montreal, Canada)" },
    { value: "الولايات المتحدة (United States)", label: "الولايات المتحدة (United States)" },
    { value: "أخرى - وجهة دولية مغايرة", label: "موقع دولي آخر (Other International)" }
  ];
  const [destination, setDestination] = useState("");
  const [daysCount, setDaysCount] = useState(4);

  // Manual trip metadata configuration fields
  const [manualOrigin, setManualOrigin] = useState("");
  const [manualNextDestination, setManualNextDestination] = useState("");

  // Persistent customizable section visibilities to allow simplifying the dashboard layout
  const [visibleWidgets, setVisibleWidgets] = useState<{
    currencyConverter: boolean;
    weatherForecast: boolean;
    budgetTracker: boolean;
    prayerTimes: boolean;
    clock: boolean;
    compass: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem("fos7a_visible_widgets");
      return saved ? JSON.parse(saved) : {
        currencyConverter: true,
        weatherForecast: true,
        budgetTracker: true,
        prayerTimes: true,
        clock: true,
        compass: true,
      };
    } catch {
      return {
        currencyConverter: true,
        weatherForecast: true,
        budgetTracker: true,
        prayerTimes: true,
        clock: true,
        compass: true,
      };
    }
  });

  const handleToggleWidget = (widgetKey: "currencyConverter" | "weatherForecast" | "budgetTracker" | "prayerTimes" | "clock" | "compass") => {
    setVisibleWidgets((prev) => {
      const next = { ...prev, [widgetKey]: !prev[widgetKey] };
      localStorage.setItem("fos7a_visible_widgets", JSON.stringify(next));
      return next;
    });
  };
  const [budget, setBudget] = useState("Moderate");
  const [travelerType, setTravelerType] = useState("Couple");
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["Culture", "Food"]);
  const [departureDate, setDepartureDate] = useState("2026-06-15");
  const [allocatedBudgetAmount, setAllocatedBudgetAmount] = useState("");
  const [transitMode, setTransitMode] = useState("Plane");
  const [tripPurpose, setTripPurpose] = useState<"tourism" | "medical" | "business_admin">("tourism");
  const [missionDestinationsText, setMissionDestinationsText] = useState("");
  const [lodgingType, setLodgingType] = useState<"hotel" | "guesthouse" | "hostel" | "home" | "dortoir">("hotel");

  const ALGERIAN_WILAYAS = [
    { value: "أدرار (Adrar)", label: "01 - أدرار (Adrar)" },
    { value: "الشلف (Chlef)", label: "02 - الشلف (Chlef)" },
    { value: "الأغواط (Laghouat)", label: "03 - الأغواط (Laghouat)" },
    { value: "أم البواقي (Oum El Bouaghi)", label: "04 - أم البواقي (Oum El Bouaghi)" },
    { value: "باتنة (Batna)", label: "05 - باتنة (Batna)" },
    { value: "بجاية (Bejaia)", label: "06 - بجاية (Bejaia)" },
    { value: "بسكرة (Biskra)", label: "07 - بسكرة (Biskra)" },
    { value: "بشار (Bechar)", label: "08 - بشار (Bechar)" },
    { value: "البليدة (Blida)", label: "09 - البليدة (Blida)" },
    { value: "البويرة (Bouira)", label: "10 - البويرة (Bouira)" },
    { value: "تمنراست (Tamanrasset)", label: "11 - تمنراست (Tamanrasset)" },
    { value: "تبسة (Tebessa)", label: "12 - تبسة (Tebessa)" },
    { value: "تلمسان (Tlemcen)", label: "13 - تلمسان (Tlemcen)" },
    { value: "تيارت (Tiaret)", label: "14 - تيارت (Tiaret)" },
    { value: "تيزي وزو (Tizi Ouzou)", label: "15 - تيزي وزو (Tizi Ouzou)" },
    { value: "الجزائر العاصمة (Algiers)", label: "16 - الجزائر العاصمة (Algiers)" },
    { value: "الجلفة (Djelfa)", label: "17 - الجلفة (Djelfa)" },
    { value: "جيجل (Jijel)", label: "18 - جيجل (Jijel)" },
    { value: "سطيف (Setif)", label: "19 - سطيف (Setif)" },
    { value: "سعيدة (Saida)", label: "20 - سعيدة (Saida)" },
    { value: "سكيكدة (Skikda)", label: "21 - سكيكدة (Skikda)" },
    { value: "سيدي بلعباس (Sidi Bel Abbes)", label: "22 - سيدي بلعباس (Sidi Bel Abbes)" },
    { value: "عنابة (Annaba)", label: "23 - عنابة (Annaba)" },
    { value: "قالمة (Guelma)", label: "24 - قالمة (Guelma)" },
    { value: "قسنطينة (Constantine)", label: "25 - قسنطينة (Constantine)" },
    { value: "المدية (Medea)", label: "26 - المدية (Medea)" },
    { value: "مستغانم (Mostaganem)", label: "27 - مستغانم (Mostaganem)" },
    { value: "المسيلة (M'Sila)", label: "28 - المسيلة (M'Sila)" },
    { value: "معسكر (Mascara)", label: "29 - معسكر (Mascara)" },
    { value: "ورقلة (Ouargla)", label: "30 - ورقلة (Ouargla)" },
    { value: "وهران (Oran)", label: "31 - وهران (Oran)" },
    { value: "البيض (El Bayadh)", label: "32 - البيض (El Bayadh)" },
    { value: "إليزي (Illizi)", label: "33 - إليزي (Illizi)" },
    { value: "برج بوعريريج (Bordj Bou Arreridj)", label: "34 - برج بوعريريج (Bordj Bou Arreridj)" },
    { value: "بومرداس (Boumerdes)", label: "35 - بومرداس (Boumerdes)" },
    { value: "الطارف (El Tarf)", label: "36 - الطارف (El Tarf)" },
    { value: "تندوف (Tindouf)", label: "37 - تندوف (Tindouf)" },
    { value: "تيسمسيلت (Tissemsilt)", label: "38 - تيسمسيلت (Tissemsilt)" },
    { value: "الوادي (El Oued)", label: "39 - الوادي (El Oued)" },
    { value: "خنشلة (Khenchela)", label: "40 - خنشلة (Khenchela)" },
    { value: "سوق أهراس (Souk Ahras)", label: "41 - سوق أهراس (Souk Ahras)" },
    { value: "تيبازة (Tipaza)", label: "42 - تيبازة (Tipaza)" },
    { value: "ميلة (Mila)", label: "44 - ميلة (Mila)" },
    { value: "عين الدفلى (Ain Defla)", label: "44 - عين الدفلى (Ain Defla)" },
    { value: "النعامة (Naama)", label: "45 - النعامة (Naama)" },
    { value: "عين تموشنت (Ain Temouchent)", label: "46 - عين تموشنت (Ain Temouchent)" },
    { value: "غرداية (Ghardaia)", label: "47 - غرداية (Ghardaia)" },
    { value: "غليزان (Relizane)", label: "48 - غليزان (Relizane)" },
    { value: "المغير (El M'Ghair)", label: "49 - المغير (El M'Ghair)" },
    { value: "المنيعة (El Meniaa)", label: "50 - المنيعة (El Meniaa)" },
    { value: "أولاد جلال (Ouled Djellal)", label: "51 - أولاد جلال (Ouled Djellal)" },
    { value: "برج باجي مختار (Bordj Baji Mokhtar)", label: "52 - برج باجي مختار (Bordj Baji Mokhtar)" },
    { value: "بني عباس (Beni Abbes)", label: "53 - بني عباس (Beni Abbes)" },
    { value: "عين صالح (In Salah)", label: "54 - عين صالح (In Salah)" },
    { value: "عين قزام (In Guezzam)", label: "55 - عين قزام (In Guezzam)" },
    { value: "تقرت (Touggourt)", label: "56 - تقرت (Touggourt)" },
    { value: "جانت (Djanet)", label: "57 - جانت (Djanet)" },
    { value: "تيميمون (Timimoun)", label: "58 - تيميمون (Timimoun)" }
  ];
  
  // Loading & View States
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [checkboxState, setCheckboxState] = useState<Record<string, boolean>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedLandmarkForTrivia, setSelectedLandmarkForTrivia] = useState("");
  const [isTriviaModalOpen, setIsTriviaModalOpen] = useState(false);

  const budgetOptions = [
    { value: "Economy", label: t.budgetEco, color: "border-green-300 text-green-700 bg-green-50/50" },
    { value: "Moderate", label: t.budgetMod, color: "border-blue-300 text-blue-700 bg-blue-50/50" },
    { value: "Luxury", label: t.budgetLux, color: "border-purple-300 text-purple-700 bg-purple-50/50" },
  ];

  const travelerOptions = [
    { value: "Solo", label: t.travelerSolo, icon: Smile },
    { value: "Couple", label: t.travelerCouple, icon: Heart },
    { value: "Family", label: t.travelerFamily, icon: Home },
    { value: "Friends", label: t.travelerFriends, icon: Users },
  ];

  const interestOptions = [
    { id: "Culture", label: t.interestCulture },
    { id: "Nature", label: t.interestNature },
    { id: "Food", label: t.interestFood },
    { id: "Shopping", label: t.interestShopping },
    { id: "Relax", label: t.interestRelax },
  ];

  const loadingMessages = lang === "ar" ? [
    "جارٍ الاتصال بوكيل السفر الذكي للوكالة...",
    "جارٍ البحث عن أفضل المعالم السياحية وعروض التوفير...",
    "جارٍ صياغة وتنسيق جدول زمني متكامل صباحاً ومساءً...",
    "جارٍ فحص خيارات الإقامة والفنادق المناسبة لميزانيتك...",
    "جارٍ تجهيز قائمة الأمتعة المناسبة لأجواء الجهة المقترحة..."
  ] : [
    "Establishing connection with our digital travel advisor...",
    "Scouting local landmarks, hidden gems, and historic alleys...",
    "Drafting day-by-day optimal schedule flows (Morning to Evening)...",
    "Finding vetted accommodations fitting your exact budget level...",
    "Packing list calculations and climate checks complete!"
  ];

  const handleInterestToggle = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSmartLocationHelp = async () => {
    if (!smartQuery.trim()) {
      setSmartError(lang === "ar" ? "يرجى كتابة بعض التفاصيل للمساعد أولاً!" : "Please write down some details for the assistant first!");
      return;
    }
    setSmartLoading(true);
    setSmartError("");
    try {
      const response = await fetch("/api/smart-location-help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: smartQuery, lang }),
      });
      if (!response.ok) {
        throw new Error(lang === "ar" ? "فشلت معالجة الطلب عبر الخادم." : "Failed to process direct request through backend.");
      }
      const data = await response.json();
      setSmartResult(data);
      if (data.detectedOrigin) {
        setFreeTripOrigin(data.detectedOrigin);
      }
      if (data.detectedUpcomingDestination) {
        setFreeTripDestination(data.detectedUpcomingDestination);
        setDestination(data.detectedUpcomingDestination);
      }
    } catch (err: any) {
      console.error(err);
      setSmartError(err.message || (lang === "ar" ? "حدث خطأ غير متوقع أثناء تواصلك مع المساعد." : "An error occurred while calling the assistant."));
    } finally {
      setSmartLoading(false);
    }
  };

  const handleSmartFos7aHelp = async () => {
    if (!smartFos7aQuery.trim()) {
      setSmartFos7aError(lang === "ar" ? "يرجى كتابة بعض تفاصيل أو رغبات رحلتك أولاً!" : "Please describe your trip desires or instructions first!");
      return;
    }
    setSmartFos7aLoading(true);
    setSmartFos7aError("");
    setSmartFos7aSuccessText("");
    try {
      const response = await fetch("/api/smart-fos7a-help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: smartFos7aQuery, lang }),
      });
      if (!response.ok) {
        throw new Error(lang === "ar" ? "تعذر معالجة الطلب اللوجستي الذكي عبر خادمنا." : "Failed to parse smart logistical constraints via server.");
      }
      const data = await response.json();
      
      // Update form parameters based on parsed intelligent results!
      if (data.detectedDurationDays) {
        setDaysCount(Math.max(1, Math.min(30, Number(data.detectedDurationDays))));
      }
      if (data.detectedDeparturePeriod) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(data.detectedDeparturePeriod)) {
          setDepartureDate(data.detectedDeparturePeriod);
        }
      }
      if (data.detectedTravelersComposition) {
        const comp = data.detectedTravelersComposition;
        if (["Solo", "Couple", "Family", "Friends"].includes(comp)) {
          setTravelerType(comp);
        }
      }
      if (data.formattedFos7aDescription) {
        setFos7aTripType(data.formattedFos7aDescription);
      }
      if (data.detectedDestination) {
        setDestination(data.detectedDestination);
      }

      // Origin matching & detection
      if (data.detectedOrigin) {
        const originStr = data.detectedOrigin.toLowerCase();
        const matchedWilaya = ALGERIAN_WILAYAS.find(w => 
          w.value.toLowerCase().includes(originStr) || 
          originStr.includes(w.value.toLowerCase()) ||
          w.label.toLowerCase().includes(originStr)
        );
        if (matchedWilaya) {
          setOriginType("domestic");
          setOriginWilaya(matchedWilaya.value);
        } else {
          const matchedHub = INTERNATIONAL_HUBS.find(h => 
            h.value.toLowerCase().includes(originStr) || 
            originStr.includes(h.value.toLowerCase())
          );
          if (matchedHub) {
            setOriginType("international");
            setOriginInternational(matchedHub.value);
          }
        }
      }

      setSmartFos7aSuccessText(lang === "ar" 
        ? "🔮 تم بنجاح معالجة غاياتك وتحديث معلمات الطلب (الانطلاق، الوجهة، المدة وتصنيف المسافرين) تلقائياً!" 
        : "🔮 Safely parsed and pre-filled inquiry fields (Origin, Destination, Days & Travelers) successfully!");
    } catch (err: any) {
      console.error(err);
      setSmartFos7aError(err.message || (lang === "ar" ? "عذراً، حدث خطأ أثناء تواصلك مع المساعد الذكي التكفلي." : "An error occurred during communication."));
    } finally {
      setSmartFos7aLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!activeItinerary) return;
    setPdfLoading(true);
    try {
      let englishItinerary = activeItinerary;
      let arabicItinerary = activeItinerary;

      // Case A: The active itinerary is in Arabic
      if (lang === "ar" || activeItinerary.languageCode === "ar") {
        // Translate to English on-the-fly to get both versions
        try {
          const res = await fetch("/api/translate-itinerary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itinerary: activeItinerary, targetLang: "en" }),
          });
          if (res.ok) {
            englishItinerary = await res.json();
          } else {
            console.warn("On-the-fly translation to English failed. Using original Arabic as fallback.");
          }
        } catch (translateErr) {
          console.error("Translation fetch error:", translateErr);
        }
      } 
      // Case B: The active itinerary is in English
      else {
        // Translate to Arabic on-the-fly to get both versions
        try {
          const res = await fetch("/api/translate-itinerary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itinerary: activeItinerary, targetLang: "ar" }),
          });
          if (res.ok) {
            arabicItinerary = await res.json();
          } else {
            console.warn("On-the-fly translation to Arabic failed. Using original English as fallback.");
          }
        } catch (translateErr) {
          console.error("Translation fetch error:", translateErr);
        }
      }

      const enrichedEnglish = enrichItineraryWithSmartPacking(englishItinerary, "en");
      const enrichedArabic = enrichItineraryWithSmartPacking(arabicItinerary, "ar");

      exportItineraryToPDF(enrichedEnglish, enrichedArabic, selectedFlight, selectedHotel);
    } catch (err) {
      console.error("Error conducting PDF export with translation:", err);
      // Fallback: use active itinerary for both
      const fallbackEnglish = enrichItineraryWithSmartPacking(activeItinerary, "en");
      const fallbackArabic = enrichItineraryWithSmartPacking(activeItinerary, "ar");
      exportItineraryToPDF(fallbackEnglish, fallbackArabic, selectedFlight, selectedHotel);
    } finally {
      setPdfLoading(false);
    }
  };

  const generateAIPlan = async () => {
    const activeDestination = tripScope === "domestic" && !destination ? "غرداية (Ghardaïa)" : destination;
    if (!activeDestination.trim() || daysCount <= 0) {
      setErrorMsg(t.promptError);
      return;
    }
    setErrorMsg("");
    setLoading(true);
    setSaveSuccess(false);
    setActiveDayIdx(0);

    // Dynamic loading text step cycles
    const stepInterval = setInterval(() => {
      setLoadingStep(curr => (curr + 1) % loadingMessages.length);
    }, 2800);

    try {
      const response = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: activeDestination,
          daysCount,
          budget,
          travelerType,
          interests: selectedInterests,
          lang,
          tripScope,
          originWilaya: coordinationType === "optional" ? (freeTripOrigin || originWilaya) : originWilaya,
          departureDate,
          allocatedBudgetAmount,
          transitMode,
          tripPurpose,
          missionDestinationsText,
          lodgingType
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with AI Server");
      }

      const data = await response.json();
      
      // Inject origin/departure details
      data.originWilaya = coordinationType === "optional" ? (freeTripOrigin || originWilaya) : originWilaya;
      data.coordinationType = coordinationType;
      
      if (coordinationType === "fos7a") {
        // Map travelerGroup safely to Fos7a config
        let mappedConfig: "solo" | "group" | "family" | "couple" | "lovers" = "solo";
        const cleanType = travelerType.toLowerCase();
        if (cleanType.includes("couple")) mappedConfig = "couple";
        else if (cleanType.includes("family")) mappedConfig = "family";
        else if (cleanType.includes("friend") || cleanType.includes("group")) mappedConfig = "group";
        
        // Setup initial default estimate for the sponsorship details
        const minQuote = 25000 + (daysCount * 6500);
        const maxQuote = minQuote * 1.35;
        
        data.fos7aSponsorship = {
          enabled: true,
          travelConfig: mappedConfig,
          tripTheme: "cultural" as "cultural",
          departureWilaya: originWilaya.split(" (")[0], // Clean label
          includeReturn: true,
          estimatedMinDZD: Math.round(minQuote),
          estimatedMaxDZD: Math.round(maxQuote),
          submitted: true
        };
      } else {
        data.fos7aSponsorship = {
          enabled: false,
          travelConfig: "solo",
          tripTheme: "cultural" as "cultural",
          departureWilaya: originWilaya.split(" (")[0],
          includeReturn: false,
          estimatedMinDZD: 0,
          estimatedMaxDZD: 0,
          submitted: false
        };
      }

      onItineraryGenerated(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(lang === "ar" 
        ? "فشل في إنشاء خطة الرحلة ومخاطبة الخادم. يرجى تجربة وجهة أخرى لاحقاً." 
        : "Oops! We faced a problem drafting your journey details. Please refine your destination or try again."
      );
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  const handleSaveToVault = () => {
    if (!activeItinerary) return;
    const existing = localStorage.getItem("saved_trips");
    const trips = existing ? JSON.parse(existing) : [];

    // Create unique token entry
    const newSaved = {
      id: "TRIP-" + Math.floor(100000 + Math.random() * 900000).toString(),
      itinerary: activeItinerary,
      createdAt: new Date().toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
        year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
      })
    };

    localStorage.setItem("saved_trips", JSON.stringify([newSaved, ...trips]));
    setSaveSuccess(true);
  };

  // State & Handlers for Custom Packing Checklist with Local Storage Persistence
  const [customPackingItems, setCustomPackingItems] = useState<{ id: string; text: string; checked: boolean }[]>([]);
  const [newCustomItemText, setNewCustomItemText] = useState("");
  const [addedSuggestionIds, setAddedSuggestionIds] = useState<Record<string, boolean>>({});

  // Synchronize on activeItinerary changes
  useEffect(() => {
    if (activeItinerary) {
      const itId = `${activeItinerary.destinationName}-${activeItinerary.tripDurationDays}-${activeItinerary.departureDate || "default"}`;
      
      // Load pre-generated checklist checked mappings
      const savedChecks = localStorage.getItem(`packing_checked_${itId}`);
      if (savedChecks) {
        try {
          setCheckboxState(JSON.parse(savedChecks));
        } catch (e) {
          setCheckboxState({});
        }
      } else {
        setCheckboxState({});
      }

      // Load custom packing items
      const savedCustoms = localStorage.getItem(`packing_customs_${itId}`);
      if (savedCustoms) {
        try {
          setCustomPackingItems(JSON.parse(savedCustoms));
        } catch (e) {
          setCustomPackingItems([]);
        }
      } else {
        setCustomPackingItems([]);
      }

      // Load added suggestion IDs
      const savedAddedSugg = localStorage.getItem(`packing_added_sugg_${itId}`);
      if (savedAddedSugg) {
        try {
          setAddedSuggestionIds(JSON.parse(savedAddedSugg));
        } catch (e) {
          setAddedSuggestionIds({});
        }
      } else {
        setAddedSuggestionIds({});
      }
    } else {
      setCheckboxState({});
      setCustomPackingItems([]);
      setAddedSuggestionIds({});
    }
  }, [activeItinerary]);

  // Toggle pre-generated item checkbox
  const toggleCheck = (itemKey: string) => {
    if (!activeItinerary) return;
    const itId = `${activeItinerary.destinationName}-${activeItinerary.tripDurationDays}-${activeItinerary.departureDate || "default"}`;
    setCheckboxState(prev => {
      const next = { ...prev, [itemKey]: !prev[itemKey] };
      localStorage.setItem(`packing_checked_${itId}`, JSON.stringify(next));
      return next;
    });
  };

  // Toggle custom item checkbox
  const handleToggleCustomItem = (itemId: string) => {
    if (!activeItinerary) return;
    const itId = `${activeItinerary.destinationName}-${activeItinerary.tripDurationDays}-${activeItinerary.departureDate || "default"}`;
    setCustomPackingItems(prev => {
      const next = prev.map(item => item.id === itemId ? { ...item, checked: !item.checked } : item);
      localStorage.setItem(`packing_customs_${itId}`, JSON.stringify(next));
      return next;
    });
  };

  // Add a new custom item to list
  const handleAddCustomItem = (text: string) => {
    if (!activeItinerary || !text.trim()) return;
    const itId = `${activeItinerary.destinationName}-${activeItinerary.tripDurationDays}-${activeItinerary.departureDate || "default"}`;
    setCustomPackingItems(prev => {
      const newItem = { id: Date.now().toString(), text: text.trim(), checked: false };
      const next = [...prev, newItem];
      localStorage.setItem(`packing_customs_${itId}`, JSON.stringify(next));
      return next;
    });
    setNewCustomItemText("");
  };

  const [packingFilter, setPackingFilter] = useState<"all" | "packed" | "unpacked">("all");

  const packingStats = useMemo(() => {
    if (!enrichedItinerary) return { total: 0, checked: 0, percentage: 0 };
    
    let totalStatic = 0;
    let checkedStatic = 0;
    enrichedItinerary.customPackingList.forEach(cat => {
      cat.items.forEach(item => {
        totalStatic++;
        const itemKey = `${cat.category}-${item}`;
        if (checkboxState[itemKey]) {
          checkedStatic++;
        }
      });
    });

    const totalCustom = customPackingItems.length;
    const checkedCustom = customPackingItems.filter(item => item.checked).length;

    const total = totalStatic + totalCustom;
    const checked = checkedStatic + checkedCustom;
    const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;

    return { total, checked, percentage };
  }, [enrichedItinerary, checkboxState, customPackingItems]);

  const weatherWarnings = useMemo(() => {
    if (!activeItinerary || !packingWeather) return [];
    const list: {
      id: string;
      type: "rain" | "cold" | "heat" | "wind";
      titleEn: string;
      titleAr: string;
      descEn: string;
      descAr: string;
      recommendEn: string;
      recommendAr: string;
      queryItem: string;
      itemEn: string;
      itemAr: string;
      isMissing: boolean;
      isUnpacked: boolean;
    }[] = [];

    const allDefaultItems = (enrichedItinerary?.customPackingList || []).flatMap(cat => cat.items);
    const allCustomItems = customPackingItems;
    
    const hasItemMatch = (terms: string[]) => {
      return allDefaultItems.some(i => terms.some(t => i.toLowerCase().includes(t.toLowerCase()))) ||
             allCustomItems.some(i => terms.some(t => i.text.toLowerCase().includes(t.toLowerCase())));
    };

    const isItemChecked = (terms: string[]) => {
      const defaultMatchedChecked = (enrichedItinerary?.customPackingList || []).some(cat => 
        cat.items.some(i => terms.some(t => i.toLowerCase().includes(t.toLowerCase())) && !!checkboxState[`${cat.category}-${i}`])
      );
      const customMatchedChecked = allCustomItems.some(i => 
        terms.some(t => i.text.toLowerCase().includes(t.toLowerCase())) && i.checked
      );
      return defaultMatchedChecked || customMatchedChecked;
    };

    // 1. Rain Alert
    if (packingWeather.hasRain) {
      const rainTerms = ["umbrella", "raincoat", "waterproof", "مظلة", "معطف مطر", "معطف المطر", "مضاد للبلل"];
      const exists = hasItemMatch(rainTerms);
      const checked = exists ? isItemChecked(rainTerms) : false;
      list.push({
        id: "rain_alert",
        type: "rain",
        titleEn: "Rain Predicted 🌧️",
        titleAr: "هطول أمطار متوقع 🌧️",
        descEn: "Heavy precipitation is expected during your stay.",
        descAr: "تشير التوقعات لهطول زخات من الأمطار بغزارة أثناء رحلتك.",
        recommendEn: "Rain umbrella or waterproof raincoat is recommended.",
        recommendAr: "يُنصح بشدة بإضافة مظلة مطر أو معطف واقٍ لمقاومة البلل.",
        queryItem: "travel umbrella",
        itemEn: "Compact travel umbrella & raincoat",
        itemAr: "مظلة سفر مدمجة ومعطف مطر",
        isMissing: !exists,
        isUnpacked: exists && !checked
      });
    }

    // 2. Cold Alert
    if (packingWeather.hasCold) {
      const coldTerms = ["heavy coat", "jacket", "thermal", "beanie", "gloves", "معطف", "سترة شتوية", "حرارية", "قبعة صوفية", "قفازات"];
      const exists = hasItemMatch(coldTerms);
      const checked = exists ? isItemChecked(coldTerms) : false;
      list.push({
        id: "cold_alert",
        type: "cold",
        titleEn: "Freezing Temperatures Expected ❄️",
        titleAr: "درجات حرارة منخفضة وصقيع ❄️",
        descEn: `Temperatures may drop to ${packingWeather.minTemp}°C.`,
        descAr: `ستنخفض الصغرى ببلد الزيارة لتلامس ${packingWeather.minTemp} درجة مئوية.`,
        recommendEn: "Heavy coat, insulated gloves and thermal baselayers are necessary.",
        recommendAr: "من الضروري اصطحاب معطف شتوي عازل، وملابس داخلية حرارية قوية للوقاية.",
        queryItem: "heavy insulated winter coat",
        itemEn: "Heavy insulated winter coat & thermals",
        itemAr: "سترة شتوية ثقيلة عازلة وملابس حرارية",
        isMissing: !exists,
        isUnpacked: exists && !checked
      });
    }

    // 3. Heat Alert
    if (packingWeather.hasHeat) {
      const heatTerms = ["sunscreen", "sunglasses", "hat", "واقي", "نظارة شمسية", "قبعة عريضة", "غطاء رأس"];
      const exists = hasItemMatch(heatTerms);
      const checked = exists ? isItemChecked(heatTerms) : false;
      list.push({
        id: "heat_alert",
        type: "heat",
        titleEn: "Substantial Heatwave Alert ☀️",
        titleAr: "موجة حر مشمسة شديدة ☀️",
        descEn: `Temperatures will exceed ${packingWeather.maxTemp}°C with high UV index.`,
        descAr: `ستتجاوز العظمى عتبة ${packingWeather.maxTemp} درجة مئوية نهاراً مع مؤشر أشعة فوق بنفسجية نشط.`,
        recommendEn: "High SPF sunscreen, UV sunglasses, and wider hats are crucial.",
        recommendAr: "يلزمك دهان واقي الشمس بعامل حماية مرتفع ونظارات شمسية مرشحة لحماية الأعين.",
        queryItem: "high SPF sunscreen & sunglasses",
        itemEn: "High SPF sunscreen & UV polarized sunglasses",
        itemAr: "واقي من الشمس ونظارة شمسية مستقطبة",
        isMissing: !exists,
        isUnpacked: exists && !checked
      });
    }

    // 4. Wind Alert
    if (packingWeather.hasWind) {
      const windTerms = ["windbreaker", "scarf", "goggles", "شال", "وشاح", "سترة واقية", "مقاوم للرياح"];
      const exists = hasItemMatch(windTerms);
      const checked = exists ? isItemChecked(windTerms) : false;
      list.push({
        id: "wind_alert",
        type: "wind",
        titleEn: "High Windy conditions 💨",
        titleAr: "نشاط للرياح القوية والعواصف 💨",
        descEn: "Gusts may create dusty sand clouds or cold drafts.",
        descAr: "قد تسبب هبات الرياح النشطة عوالق ترابية أو صحراوية في الفضاء المفتوح.",
        recommendEn: "Windbreaker jacket and protective scarf/neck gaiter recommended.",
        recommendAr: "يُنصح بوضع سترة واقية خفيفة من الرياح ووشاح أو غطاء حماية مريح.",
        queryItem: "protective windbreaker",
        itemEn: "Protective windbreaker jacket & travel scarf",
        itemAr: "سترة خفيفة مقاومة للرياح وشال حماية",
        isMissing: !exists,
        isUnpacked: exists && !checked
      });
    }

    return list;
  }, [activeItinerary, packingWeather, enrichedItinerary, checkboxState, customPackingItems]);

  const handleCheckAllPackingItems = () => {
    if (!activeItinerary || !enrichedItinerary) return;
    const itId = `${activeItinerary.destinationName}-${activeItinerary.tripDurationDays}-${activeItinerary.departureDate || "default"}`;
    
    const newCheckboxState: Record<string, boolean> = {};
    enrichedItinerary.customPackingList.forEach(cat => {
      cat.items.forEach(item => {
        const itemKey = `${cat.category}-${item}`;
        newCheckboxState[itemKey] = true;
      });
    });
    setCheckboxState(newCheckboxState);
    localStorage.setItem(`packing_checked_${itId}`, JSON.stringify(newCheckboxState));

    setCustomPackingItems(prev => {
      const next = prev.map(item => ({ ...item, checked: true }));
      localStorage.setItem(`packing_customs_${itId}`, JSON.stringify(next));
      return next;
    });
  };

  const handleResetAllPackingItems = () => {
    if (!activeItinerary) return;
    const itId = `${activeItinerary.destinationName}-${activeItinerary.tripDurationDays}-${activeItinerary.departureDate || "default"}`;
    
    setCheckboxState({});
    localStorage.setItem(`packing_checked_${itId}`, JSON.stringify({}));

    setCustomPackingItems(prev => {
      const next = prev.map(item => ({ ...item, checked: false }));
      localStorage.setItem(`packing_customs_${itId}`, JSON.stringify(next));
      return next;
    });
  };

  // Remove a custom item from list
  const handleRemoveCustomItem = (itemId: string) => {
    if (!activeItinerary) return;
    const itId = `${activeItinerary.destinationName}-${activeItinerary.tripDurationDays}-${activeItinerary.departureDate || "default"}`;
    setCustomPackingItems(prev => {
      const removedItem = prev.find(item => item.id === itemId);
      const next = prev.filter(item => item.id !== itemId);
      localStorage.setItem(`packing_customs_${itId}`, JSON.stringify(next));

      if (removedItem) {
        const suggestions = generateSmartSuggestions(activeItinerary, packingWeather);
        const matchedSugg = suggestions.find(s => s.textEn === removedItem.text || s.textAr === removedItem.text);
        if (matchedSugg) {
          setAddedSuggestionIds(prevSugg => {
            const nextSugg = { ...prevSugg };
            delete nextSugg[matchedSugg.id];
            localStorage.setItem(`packing_added_sugg_${itId}`, JSON.stringify(nextSugg));
            return nextSugg;
          });
        }
      }
      return next;
    });
  };

  // Add an automated packing suggestion to list
  const handleAddSuggestion = (suggestionId: string, suggestionText: string) => {
    if (!activeItinerary) return;
    const itId = `${activeItinerary.destinationName}-${activeItinerary.tripDurationDays}-${activeItinerary.departureDate || "default"}`;
    
    setCustomPackingItems(prev => {
      const newItem = { id: Date.now().toString(), text: suggestionText, checked: false };
      const next = [...prev, newItem];
      localStorage.setItem(`packing_customs_${itId}`, JSON.stringify(next));
      return next;
    });

    setAddedSuggestionIds(prev => {
      const next = { ...prev, [suggestionId]: true };
      localStorage.setItem(`packing_added_sugg_${itId}`, JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="space-y-8" id="travel-planner-component">
      {/* Configuration Panel */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
          {t.navPlanner}
        </h2>

        {errorMsg && (
          <div className="mb-4 p-4 rounded-xl bg-rose-50 text-rose-600 text-sm font-medium border border-rose-100">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Trip Coordination Mode Selector */}
          <div className="md:col-span-12 space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              {t.coordinationLabel || "طبيعة تنسيق وتنظيم خطة الرحلة"} <span className="text-xs text-slate-400 font-normal">({lang === "ar" ? "اختياري" : "Optional"})</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCoordinationType("optional")}
                className={`py-3 px-4 rounded-xl text-xs md:text-sm font-bold border-2 transition-all cursor-pointer flex items-center gap-2 ${
                  coordinationType === "optional"
                    ? "border-slate-800 bg-slate-900 text-white"
                    : "border-slate-100 bg-slate-50/40 text-slate-500 hover:border-slate-200"
                }`}
              >
                🎒 {t.coordinationOptional || "رحلة حرة مع اختيار الخدمات يدوياً"}
              </button>
              <button
                type="button"
                onClick={() => setCoordinationType("fos7a")}
                className={`py-3 px-4 rounded-xl text-xs md:text-sm font-bold border-2 transition-all cursor-pointer flex items-center gap-2 ${
                  coordinationType === "fos7a"
                    ? "border-indigo-600 bg-indigo-50/10 text-indigo-900"
                    : "border-slate-100 bg-slate-50/40 text-slate-500 hover:border-slate-200"
                }`}
              >
                ✨ {t.coordinationFos7a || "برعاية وتنسيق كامل عبر وكالة فسحة DZ"}
              </button>
            </div>
          </div>

          {/* If Fos7a is chosen, render the dedicated direct organizer fields */}
          {coordinationType === "fos7a" ? (
            <div className="md:col-span-12 p-6 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-blue-50/30 border border-indigo-100/80 space-y-6 my-2" id="fos7a-agency-direct-panel">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-100/60 pb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-indigo-100/80 text-indigo-700 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase mb-2">
                    ⚡ {lang === "ar" ? "خدمة التكفل اللوجستي الشامل لرحلتكم مفعلة" : "Comprehensive Logistics & Agency Coordination Active"}
                  </div>
                  <h3 className="text-base md:text-lg font-black text-indigo-950 flex items-center gap-1.5 leading-tight">
                    ✨ {lang === "ar" ? "طلب تنظيم متميز من وكالة فسحة DZ" : "Bespoke Concierge & Coordinated Travel via Fos7a DZ"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 max-w-xl leading-relaxed font-semibold">
                    {lang === "ar"
                      ? "يسر فريق وكالة فسحة تنظيم وجدولة رحلتك بالكامل (النقل، الإقامة الفندقية أو الشقق، المرافقة، وبطاقات الدعم الإداري والاستشفائي) دون جهد تخطيط يدوي."
                      : "Fos7a DZ team will gracefully program and coordinate every logistical segment (premium guesthouses, transfers, tour guides, and business/medical alignment) directly."}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* WhatsApp Support Button */}
                  <a
                    href="https://wa.me/213662212484"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xs px-5 py-3.5 rounded-xl transition-all shadow-md shadow-emerald-250 cursor-pointer text-center group transform hover:-translate-y-0.5"
                    id="whatsapp-direct-link"
                  >
                    <Phone className="w-4.5 h-4.5 fill-current shrink-0 animate-bounce" />
                    <span>{lang === "ar" ? "خدمة العملاء واتساب: +213662212484" : "Direct Customer Support: +213662212484"}</span>
                  </a>

                  {/* Facebook official profile */}
                  <a
                    href="https://www.facebook.com/profile.php?id=61556682238560"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black text-xs px-5 py-3.5 rounded-xl transition-all shadow-md shadow-blue-200 cursor-pointer text-center transform hover:-translate-y-0.5"
                    id="facebook-agency-link"
                  >
                    <span>💬</span>
                    <span>{lang === "ar" ? "مراسلة الصفحة الرسمية لوكالة 'فسحة dz'" : "Message Official Facebook: فسحة dz"}</span>
                  </a>
                </div>
              </div>

              {/* Bespoke Fos7a Intelligent Assistant Helper Block */}
              <div className="bg-white/95 rounded-2xl p-5 border border-indigo-100 shadow-md space-y-3.5" id="fos7a-smart-copilot-card">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-sm">
                    🔮
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-indigo-900">
                      {lang === "ar" ? "المساعد اللوجستي الذكي للتكفل برحلتك" : "Smart Logistical Assistant for Fos7a Agency Integration"}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {lang === "ar"
                        ? "صف محطة الانطلاق والوصول، المدة، توقيت الرحلة، تركيبتكم وغاياتها في مسودة واحدة ليقوم الذكاء الاصطناعي بتنظيمها وتعبئة الحقول آلياً!"
                        : "Describe your departing station, arrival hub, date, duration, travelers profile and purposes simple-text to configure options automatically!"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={smartFos7aQuery}
                    onChange={(e) => setSmartFos7aQuery(e.target.value)}
                    placeholder={
                      lang === "ar"
                        ? "مثال: أريد تنظيم رحلة شهر عسل هادئة لزوجين من قسنطينة إلى جيجل وتلمسان لمدة 7 أيام ابتداء من 20 جوان..."
                        : "Example: Honeymoon trip for a couple departing from Constantine to Jijel & Tlemcen, lasting 7 days from June 20..."
                    }
                    className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 outline-none bg-slate-50/40 text-slate-800 transition-all font-semibold placeholder-slate-400"
                    id="smart-fos7a-input-textarea"
                  />
                  
                  {smartFos7aError && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-bold">
                      ⚠️ {smartFos7aError}
                    </div>
                  )}

                  {smartFos7aSuccessText && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-extrabold animate-pulse">
                      {smartFos7aSuccessText}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      id="smart-fos7a-trigger-btn"
                      disabled={smartFos7aLoading}
                      onClick={handleSmartFos7aHelp}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {smartFos7aLoading ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>{lang === "ar" ? "جاري معالجة معطيات الرحلة..." : "Analyzing trip parameters..."}</span>
                        </>
                      ) : (
                        <>
                          <span>🔮</span>
                          <span>{lang === "ar" ? "تحليل ومعالجة البيانات بالذكاء الاصطناعي" : "Apply AI Parameters Alignment"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Dual Origin Selector - Domestic or International Dropdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/70 p-4 rounded-xl border border-indigo-100/60 shadow-xs">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span>📍</span>
                    <span>{lang === "ar" ? "تصنيف ونوع الانطلاق المفضل:" : "Origin Departure Category:"}</span>
                  </label>
                  <p className="text-[10px] text-slate-400 font-semibold leading-none mb-1">
                    {lang === "ar" ? "اختر ما إذا كان المغادر من داخل الجزائر أو موقع دولي" : "Decide if starting from Algeria or abroad"}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOriginType("domestic")}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        originType === "domestic"
                          ? "bg-indigo-650 text-white shadow-sm"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      🇩🇿 {lang === "ar" ? "انطلاق محلي (ولاية بالجزائر)" : "Domestic (Algerian Wilaya)"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOriginType("international")}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        originType === "international"
                          ? "bg-indigo-650 text-white shadow-sm"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      🌍 {lang === "ar" ? "انطلاق دولي (خارج الجزائر)" : "International (Foreign)"}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span>🛫</span>
                    <span>{lang === "ar" ? "حدد المطار أو نقطة المغادرة المحددة:" : "Departing From Point:"}</span>
                  </label>
                  {originType === "domestic" ? (
                    <select
                      value={originWilaya}
                      onChange={(e) => setOriginWilaya(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white outline-none focus:border-indigo-505 text-xs font-bold text-slate-800 cursor-pointer"
                      id="fos7a-domestic-origin-select"
                    >
                      {ALGERIAN_WILAYAS.map((w) => (
                        <option key={w.value} value={w.value}>{w.label}</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={originInternational}
                      onChange={(e) => setOriginInternational(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white outline-none focus:border-indigo-505 text-xs font-bold text-slate-800 cursor-pointer"
                      id="fos7a-international-origin-select"
                    >
                      {INTERNATIONAL_HUBS.map((hub) => (
                        <option key={hub.value} value={hub.value}>{hub.label}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Input for trip type and requirements */}
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-bold text-slate-705 flex items-center gap-1.5">
                  <span>📝</span>
                  <span>{lang === "ar" ? "حدد نوع وتفاصيل الرحلة المطلوبة للتنظيم:" : "Specify trip type, focus and target requirements:"}</span>
                  <span className="text-rose-550">*</span>
                </label>
                <textarea
                  rows={4}
                  value={fos7aTripType}
                  onChange={(e) => setFos7aTripType(e.target.value)}
                  placeholder={
                    lang === "ar"
                      ? "اكتب هنا نوع وتفاصيل الرحلة المطلوبة (مثال: رحلة شهر عسل هادئة ومميزة لمدة 10 أيام في تيزي وزو وجيجل مع حجز سيارة خاصة وسائق، وفنادق مريحة مع تفضيل النشاطات الثقافية والغروب)..."
                      : "Formulate your custom itinerary vibe here (e.g. 10-day peaceful romantic trip to Tizi Ouzou & Jijel, private driver, cultural highlights & scenic stays requested)..."
                  }
                  className="w-full p-4 text-xs md:text-sm rounded-xl border border-slate-200 outline-none focus:border-indigo-505 focus:ring-1 focus:ring-indigo-100 bg-white text-slate-800 transition-all font-medium placeholder-slate-400 shadow-xs"
                  id="fos7a-trip-type-textarea"
                />
              </div>

              {/* Real-time Message Treatment & Preview Panel ("معالجة النص ذكية") */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-750 flex items-center gap-1">
                    <span>✨</span>
                    <span>{lang === "ar" ? "معالجة ومعاينة نص الطلب المنظم آلياً:" : "Smart Structured Message Preview:"}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-100">
                    {lang === "ar" ? "معالجة فورية مبرزة" : "Real-time structured digest"}
                  </span>
                </div>
                
                <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line border border-slate-800 relative select-all" id="smart-text-preview-box">
                  {(() => {
                    const isAr = lang === "ar";
                    const originStr = originType === "domestic" 
                      ? (isAr ? `🇩🇿 داخلية - من ولاية: ${originWilaya}` : `🇩🇿 Domestic - From Wilaya: ${originWilaya}`)
                      : (isAr ? `🌍 دولية - من: ${originInternational}` : `🌍 International - From: ${originInternational}`);
                    
                    if (isAr) {
                      return `مرحباً وكالة فسحة DZ، أرغب بطلب تنظيم وتنسيق رحلة ممتازة عبر تطبيق التخطيط الذكي:

📋 تفاصيل ونوع الرحلة المطلوبة للتنظيم:
👈 "${fos7aTripType || "رحلة سياحية مريحة ومخصصة للعائلات/الأفراد"}"

🛫 نقطة المغادرة المفضلة:
${originStr}

📅 تاريخ السفر المخطط:
⬅️ ${departureDate}

⏱️ مدة الإقامة المقترحة:
⬅️ ${daysCount} أيام

💰 الميزانية المخصصة التقريبية:
⬅️ ${allocatedBudgetAmount || "لم يتم التحديد بدقة بعد"}

🚗 وسيلة النقل المرجحة:
⬅️ ${transitMode === "Plane" ? "✈️ الطيران" : transitMode === "Train" ? " SNTF 🚄 قطار" : transitMode === "Taxi" ? "🚕 أجرة جماعية كبرى" : transitMode === "Car" ? "🚗 سيارة خاصة" : "🚌 حافلة عمومية"}

🏢 نوع الإقامة المفضل:
⬅️ ${lodgingType === "hotel" ? "🏨 فندق" : lodgingType === "guesthouse" ? "🏡 دار ضيافة" : lodgingType === "hostel" ? "🏢 بيت شباب مشترك" : lodgingType === "dortoir" ? "🛏️ مرقد مشترك" : "🔑 منزل مستقل"}`;
                    } else {
                      return `Hello Fos7a DZ Travel Team, I would like to request a bespoke travel organization:

📋 Special Trip Type & Requirements:
👈 "${fos7aTripType || "Custom peaceful travel package request"}"

🛫 Preferred Departure Origin:
${originStr}

📅 Target Departure Date:
⬅️ ${departureDate}

⏱️ Proposed Duration:
⬅️ ${daysCount} Days

💰 Allocated Investment Budget:
⬅️ ${allocatedBudgetAmount || "Not specified yet"}

🚗 Transit Vibe Preference:
⬅️ ${transitMode}

🏢 Preferred Lodging Choice:
⬅️ ${lodgingType}`;
                    }
                  })()}
                  <div className="absolute top-2 right-2 bg-slate-800 text-[10px] text-slate-400 px-2 py-0.5 rounded font-sans uppercase">
                    {lang === "ar" ? "النص المبلور" : "Processed text"}
                  </div>
                </div>
              </div>

              {/* Action Despatch buttons for smart sending or copy */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                {/* Send via WhatsApp button */}
                <button
                  type="button"
                  id="fos7a-submit-request-whatsapp-btn"
                  onClick={() => {
                    if (!fos7aTripType.trim()) {
                      alert(lang === "ar" ? "يرجى كتابة وتوضيح تفاصيل ونوع الرحلة المطلوبة أولاً!" : "Please write down your custom trip type or details first!");
                      return;
                    }

                    const isAr = lang === "ar";
                    const originStr = originType === "domestic" 
                      ? (isAr ? `🇩🇿 داخلية - من ولاية: ${originWilaya}` : `🇩🇿 Domestic - From Wilaya: ${originWilaya}`)
                      : (isAr ? `🌍 دولية - من: ${originInternational}` : `🌍 International - From: ${originInternational}`);

                    const formattedMessage = isAr 
                      ? `مرحباً وكالة فسحة DZ، أرغب بطلب تنظيم وتنسيق رحلة ممتازة عبر تطبيق التخطيط الذكي:

📋 تفاصيل ونوع الرحلة المطلوبة للتنظيم:
👈 "${fos7aTripType}"

🛫 نقطة المغادرة المفضلة:
${originStr}

📅 تاريخ السفر المخطط:
⬅️ ${departureDate}

⏱️ مدة الإقامة المقترحة:
⬅️ ${daysCount} أيام

💰 الميزانية المخصصة التقريبية:
⬅️ ${allocatedBudgetAmount || "لم يتم التحديد بدقة بعد"}

🚗 وسيلة النقل المرجحة:
⬅️ ${transitMode === "Plane" ? "✈️ الطيران" : transitMode === "Train" ? " SNTF 🚄 قطار" : transitMode === "Taxi" ? "🚕 أجرة جماعية كبرى" : transitMode === "Car" ? "🚗 سيارة خاصة" : "🚌 حافلة عمومية"}`
                      : `Hello Fos7a DZ Travel Team, I would like to request a bespoke travel organization:

📋 Special Trip Type & Requirements:
👈 "${fos7aTripType}"

🛫 Preferred Departure Origin:
${originStr}

📅 Target Departure Date:
⬅️ ${departureDate}

⏱️ Proposed Duration:
⬅️ ${daysCount} Days

💰 Allocated Investment Budget:
⬅️ ${allocatedBudgetAmount || "Not specified yet"}`;

                    const finalWaUrl = `https://wa.me/213662212484?text=${encodeURIComponent(formattedMessage)}`;
                    setFos7aRequestSubmitted(true);
                    window.open(finalWaUrl, "_blank");
                  }}
                  className="px-6 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-extrabold text-xs md:text-sm transition-all shadow-md hover:shadow-emerald-250 flex items-center justify-center gap-2 cursor-pointer w-full sm:w-1/2 font-sans"
                >
                  <Phone className="w-4 h-4 shrink-0 fill-current" />
                  <span>
                    {lang === "ar" ? "🟢 إرسال الطلب المرتب عبر واتساب" : "🟢 Send Formatted Request via WhatsApp"}
                  </span>
                </button>

                {/* Send/Copy to Facebook button */}
                <button
                  type="button"
                  id="fos7a-submit-request-facebook-btn"
                  onClick={() => {
                    if (!fos7aTripType.trim()) {
                      alert(lang === "ar" ? "يرجى كتابة وتوضيح تفاصيل ونوع الرحلة المطلوبة أولاً!" : "Please write down your custom trip type or details first!");
                      return;
                    }

                    const isAr = lang === "ar";
                    const originStr = originType === "domestic" 
                      ? (isAr ? `🇩🇿 داخلية - من ولاية: ${originWilaya}` : `🇩🇿 Domestic - From Wilaya: ${originWilaya}`)
                      : (isAr ? `🌍 دولية - من: ${originInternational}` : `🌍 International - From: ${originInternational}`);

                    const formattedMessage = isAr 
                      ? `مرحباً وكالة فسحة DZ، أرغب بطلب تنظيم وتنسيق رحلة ممتازة عبر تطبيق التخطيط الذكي:

📋 تفاصيل ونوع الرحلة المطلوبة للتنظيم:
👈 "${fos7aTripType}"

🛫 نقطة المغادرة المفضلة:
${originStr}

📅 تاريخ السفر المخطط:
⬅️ ${departureDate}

⏱️ مدة الإقامة المقترحة:
⬅️ ${daysCount} أيام

💰 الميزانية المخصصة التقريبية:
⬅️ ${allocatedBudgetAmount || "لم يتم التحديد بدقة بعد"}

🚗 وسيلة النقل المرجحة:
⬅️ ${transitMode === "Plane" ? "✈️ الطيران" : transitMode === "Train" ? " SNTF 🚄 قطار" : transitMode === "Taxi" ? "🚕 أجرة جماعية كبرى" : transitMode === "Car" ? "🚗 سيارة خاصة" : "🚌 حافلة عمومية"}`
                      : `Hello Fos7a DZ Travel Team, I would like to request a bespoke travel organization:

📋 Special Trip Type & Requirements:
👈 "${fos7aTripType}"

🛫 Preferred Departure Origin:
${originStr}

📅 Target Departure Date:
⬅️ ${departureDate}

⏱️ Proposed Duration:
⬅️ ${daysCount} Days

💰 Allocated Investment Budget:
⬅️ ${allocatedBudgetAmount || "Not specified yet"}`;

                    // Native clipboard operation with support for iframe environments
                    try {
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(formattedMessage).then(() => {
                          setFos7aRequestSubmitted(true);
                          window.open("https://www.facebook.com/profile.php?id=61556682238560", "_blank");
                        }).catch((err) => {
                          console.error("Clipboard API failed:", err);
                          setFos7aRequestSubmitted(true);
                          window.open("https://www.facebook.com/profile.php?id=61556682238560", "_blank");
                        });
                      } else {
                        const textArea = document.createElement("textarea");
                        textArea.value = formattedMessage;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand("copy");
                        document.body.removeChild(textArea);
                        setFos7aRequestSubmitted(true);
                        window.open("https://www.facebook.com/profile.php?id=61556682238560", "_blank");
                      }
                    } catch (e) {
                      console.error("Clipboard API error:", e);
                      setFos7aRequestSubmitted(true);
                      window.open("https://www.facebook.com/profile.php?id=61556682238560", "_blank");
                    }
                  }}
                  className="px-6 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-xs md:text-sm transition-all shadow-md hover:shadow-indigo-250 flex items-center justify-center gap-2 cursor-pointer w-full sm:w-1/2 font-sans"
                >
                  <span>🔗</span>
                  <span>{lang === "ar" ? "نسخ الطلب ومراسلة فيسبوك" : "Copy Demand & Chat via Facebook"}</span>
                </button>
              </div>

              {fos7aRequestSubmitted && (
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs md:text-sm font-semibold leading-relaxed animate-pulse">
                  <span>{lang === "ar" ? "رائع! لقد تم نسخ نص الطلب المرتب تلقائياً إلى حافظتك. افتح صفحة فيسبوك الآن والصقه في محادثة الوكالة." : "Excellent! The formatted request has been safely copied to your clipboard. Paste it directly in the Facebook chat."}</span>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Smart Route Assistant - Write your idea and we'll handle the rest! */}
              <div className="md:col-span-12 p-6 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-slate-50 border border-indigo-100/70 space-y-4 my-3" id="smart-free-trip-workspace">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-100/30 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                      <span className="p-1 px-1.5 rounded-lg bg-indigo-600 text-white text-xs font-sans">AI</span>
                      <span>{lang === "ar" ? "مساعد المسارات الذكي" : "Smart Route AI Assistant"}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed font-semibold">
                      {lang === "ar"
                        ? "اكتب فكرتك وسنتكفل بالباقي - سيقوم المساعد الذكي باستخراج وتحليل النقاط وتجهيز مسار خطتك الفورية تلقائياً."
                        : "Write your idea and we'll take care of the rest - our virtual advisor will extract locations and align configurations instantly."}
                    </p>
                  </div>
                </div>

                {/* Smart Intelligent Assistant Form Area */}
                <div className="p-4 rounded-xl bg-white border border-indigo-100/50 space-y-4 shadow-2xs">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-indigo-950 flex items-center gap-1 font-sans">
                      <span>🔮</span>
                      <span>{lang === "ar" ? "مساعد المسارات الذكي - اكتب فكرتك وسنتكفل بالباقي:" : "Smart Route AI Assistant - Express your draft:"}</span>
                    </label>
                    <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                      {lang === "ar"
                        ? "اكتب مسارك بحرية وسيقوم الذكاء الاصطناعي باستخراج مكان الانطلاق والوجهة وضبطها ليكون التخطيط دقيقاً."
                        : "Speak your draft route freely. The AI will parse points, extract origin & target, and set your planner parameters perfectly."}
                    </p>
                    <textarea
                      rows={2}
                      value={smartQuery}
                      onChange={(e) => setSmartQuery(e.target.value)}
                      placeholder={
                        lang === "ar"
                          ? "مثال: أريد السفر من الجزائر العاصمة لزيارة ولاية غرداية للتعرف على تراث متليلي الشعانبة مهد الثورات الشعبية..."
                          : "e.g. I want to travel from Algiers to Ghardaia Metlili to explore Chaamba heritage, the cradle of popular revolutions..."
                      }
                      className="w-full p-3.5 text-xs md:text-sm rounded-xl border border-slate-205 outline-none focus:border-indigo-500 bg-slate-50/50 text-slate-800 font-semibold placeholder-slate-400 transition-all shadow-xs"
                    />
                  </div>

                  {/* Quick Preset Pills */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-slate-400 font-bold mr-1">{lang === "ar" ? "💡 أفكار مقترحة:" : "Suggested Ideas:"}</span>
                    {[
                      {
                        ar: "السفر من الجزائر العاصمة لزيارة ولاية غرداية للتعرف على تراث متليلي الشعانبة مهد الثورات الشعبية",
                        en: "Depart Algiers to Ghardaia to explore the heritage of Metlili Chaamba, the cradle of popular revolutions"
                      },
                      {
                        ar: "رحلة من وهران إلى قسنطينة لاستطلاع الجسور المعلقة والآثار القديمة بمثالية",
                        en: "Oran to Constantine tour for checking historical bridges and monuments"
                      },
                      {
                        ar: "مسار هادئ واستثنائي من تلمسان إلى جيجل لزيارة الكهوف العجيبة والشواطئ",
                        en: "Tlemcen to Jijel scenic drive to view Marvelous Caves and pristine beaches"
                      }
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSmartQuery(lang === "ar" ? item.ar : item.en)}
                        className="text-[10px] font-bold bg-indigo-50/40 text-indigo-700 hover:bg-indigo-100/60 transition-all px-2.5 py-1.5 rounded-lg border border-indigo-150/40 cursor-pointer"
                      >
                        🚀 {lang === "ar" ? item.ar.slice(0, 36) + "..." : item.en.slice(0, 36) + "..."}
                      </button>
                    ))}
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleSmartLocationHelp}
                      disabled={smartLoading}
                      className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-sm ${
                        smartLoading
                          ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                          : "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 hover:scale-[1.01]"
                      }`}
                    >
                      {smartLoading ? (
                        <>
                          <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-slate-550 border-t-transparent rounded-full mr-1.5" />
                          <span>{lang === "ar" ? "جاري تحليل مسارك تلقائياً..." : "Analyzing air itineraries..."}</span>
                        </>
                      ) : (
                        <>
                          <span>🔮</span>
                          <span>{lang === "ar" ? "استخراج فكرة المسار الذكي وضبطه بالذكاء الاصطناعي" : "Extract & Calculate Flights using AI"}</span>
                        </>
                      )}
                    </button>
                    {smartResult && (
                      <button
                        type="button"
                        onClick={() => {
                          setSmartQuery("");
                          setSmartResult(null);
                        }}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer underline"
                      >
                        {lang === "ar" ? "إعادة تعيين وبدء من جديد" : "Reset assistant"}
                      </button>
                    )}
                  </div>

                  {smartError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg font-bold">
                      ⚠️ {smartError}
                    </div>
                  )}
                </div>

                {/* Smart Assistant Result Display area */}
                <AnimatePresence>
                  {smartResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      {/* Quiet Automatic Configuration Banner */}
                      <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-950 border border-emerald-100 text-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-semibold shadow-2xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-550 text-white text-[9px] font-black uppercase">
                            {lang === "ar" ? "تطبيق تلقائي" : "Auto Applied"}
                          </span>
                          <span>{lang === "ar" ? "🧠 تم استخراج وتطبيق نقطة الانطلاق:" : "Detected point of origin:"}</span>
                          <span className="text-slate-800 font-extrabold border border-indigo-200 bg-white px-2 py-0.5 rounded shadow-3xs">{smartResult.detectedOrigin}</span>
                          <span>{lang === "ar" ? "والوجهة المستهدفة:" : "and destination:"}</span>
                          <span className="text-indigo-900 font-extrabold border border-emerald-200 bg-white px-2 py-0.5 rounded shadow-3xs">{smartResult.detectedUpcomingDestination}</span>
                        </div>
                      </div>

                      {/* AI Guidance Box */}
                      <div className="p-4 rounded-xl bg-slate-900 text-indigo-50 border border-slate-850 text-xs leading-relaxed relative font-sans">
                        <span className="absolute top-2.5 end-3.5 text-[9px] font-bold text-indigo-300 uppercase tracking-widest bg-slate-800 px-2 py-0.5 rounded">
                          {smartResult.isOfflineFallback 
                            ? (lang === "ar" ? "🔌 نظام احتياطي محلي" : "🔌 Local Fallback Active") 
                            : (lang === "ar" ? "توجيهات ذكية" : "AI Vibe Check")}
                        </span>
                        <p className="font-semibold pe-14 ps-1 text-slate-200">
                          💬 <span>{smartResult.aiGuidanceText}</span>
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="md:col-span-12 space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-indigo-500" />
              {t.tripTypeLabel}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setTripScope("international");
                  setDestination("");
                }}
                className={`py-3 px-4 rounded-xl text-xs md:text-sm font-bold border-2 transition-all cursor-pointer ${
                  tripScope === "international"
                    ? "border-indigo-600 bg-indigo-50/10 text-indigo-900"
                    : "border-slate-100 bg-slate-50/40 text-slate-500 hover:border-slate-200"
                }`}
              >
                🌍 {t.tripTypeInternational}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTripScope("domestic");
                  setDestination("غرداية (Ghardaïa)");
                }}
                className={`py-3 px-4 rounded-xl text-xs md:text-sm font-bold border-2 transition-all cursor-pointer ${
                  tripScope === "domestic"
                    ? "border-indigo-600 bg-indigo-50/10 text-indigo-900"
                    : "border-slate-100 bg-slate-50/40 text-slate-500 hover:border-slate-200"
                }`}
              >
                🇩🇿 {t.tripTypeDomestic}
              </button>
            </div>
          </div>

          {/* Conditional Destination based on Scope - Hide/Block when Smart Assistant is Active */}
          {tripScope === "international" ? (
            smartResult ? (
              <div className="md:col-span-8 space-y-2 animate-fade-in" id="ai-destination-international-wrapper">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                  {lang === "ar" ? "الوجهة المستخرجة بالذكاء الاصطناعي (نشطة)" : "AI Extracted Destination (Active)"}
                </label>
                <div className="w-full h-12 px-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between text-slate-800 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    <span className="font-extrabold text-indigo-950 text-sm md:text-base">
                      {smartResult.detectedUpcomingDestination || destination || (lang === "ar" ? "وجهة ذكية" : "AI Destination")}
                    </span>
                  </div>
                  <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100/50 px-2 py-1 rounded">
                    {lang === "ar" ? "معتمدة وتلقائية" : "AI Confirmed"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4" id="destination-international-wrapper">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    {lang === "ar" ? "منطقة ونقطة الانطلاق (البداية)" : "Departure / Starting Area Point"}
                  </label>
                  <input
                    type="text"
                    value={manualOrigin}
                    onChange={(e) => setManualOrigin(e.target.value)}
                    placeholder={lang === "ar" ? "مثال: قسنطينة، الجزائر" : "e.g. Constantine, Algeria"}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 text-slate-800 transition-colors text-xs md:text-sm font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-rose-500" />
                    {lang === "ar" ? "أين وجهتك القادمة (الهدف التالي)؟" : "Where is your next destination?"}
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value);
                      setManualNextDestination(e.target.value);
                    }}
                    placeholder={t.destPlaceholder}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 text-slate-800 transition-colors text-xs md:text-sm font-semibold"
                  />
                </div>
              </div>
            )
          ) : (
            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4" id="destination-domestic-wrapper">
              <div className="space-y-2 col-span-1">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  {t.originWilayaLabel}
                </label>
                <select
                  value={originWilaya}
                  onChange={(e) => setOriginWilaya(e.target.value)}
                  className="w-full h-12 px-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-500 text-xs md:text-sm font-semibold text-slate-800"
                >
                  {ALGERIAN_WILAYAS.map((w) => (
                    <option key={w.value} value={w.value}>{w.label}</option>
                  ))}
                </select>
              </div>

              {smartResult ? (
                <div className="space-y-2 col-span-1 animate-fade-in" id="ai-destination-domestic-wrapper">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                    {lang === "ar" ? "الوجهة المستخرجة بالذكاء الاصطناعي" : "AI Target Destination"}
                  </label>
                  <div className="w-full h-12 px-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between text-slate-800 transition-colors">
                    <span className="font-extrabold text-indigo-950 text-xs md:text-sm truncate">
                      📍 {smartResult.detectedUpcomingDestination || destination}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/50 px-1.5 py-0.5 rounded truncate">
                      {lang === "ar" ? "معتمدة وتلقائية" : "AI Target"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 col-span-1" id="destination-manual-domestic-wrapper">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-rose-500" />
                    {t.destWilayaLabel}
                  </label>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full h-12 px-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-500 text-xs md:text-sm font-semibold text-slate-800"
                  >
                    {ALGERIAN_WILAYAS.filter(w => w.value !== originWilaya).map((w) => (
                      <option key={w.value} value={w.value}>{w.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="md:col-span-4 space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-500" />
                {t.durationDays}
              </span>
              <span className="text-xs bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full font-mono">
                {daysCount} {lang === "ar" ? "أيام" : "Days"}
              </span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDaysCount(prev => Math.max(1, prev - 1))}
                className="w-12 h-12 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-lg font-black flex items-center justify-center text-slate-700 transition-colors select-none active:scale-95 cursor-pointer"
              >
                -
              </button>
              <div className="flex-1 relative flex items-center px-1">
                <input
                  type="range"
                  min="1"
                  max="14"
                  value={daysCount}
                  onChange={(e) => setDaysCount(parseInt(e.target.value) || 1)}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setDaysCount(prev => Math.min(14, prev + 1))}
                className="w-12 h-12 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-lg font-black flex items-center justify-center text-slate-700 transition-colors select-none active:scale-95 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          <div className="md:col-span-4 space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-500" />
              {t.departureDateLabel}
            </label>
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 text-slate-800 transition-colors bg-white font-semibold text-sm"
            />
          </div>

          <div className="md:col-span-4 space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-amber-500" />
              {t.allocatedBudgetAmountLabel}
            </label>
            <input
              type="text"
              value={allocatedBudgetAmount}
              onChange={(e) => setAllocatedBudgetAmount(e.target.value)}
              placeholder={lang === "ar" ? "مثال: 120,000 دج أو $1200" : "e.g. 120,000 DZD or $1200"}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 text-slate-800 transition-colors bg-white text-sm"
            />
          </div>

          {/* Transit Mode Selection */}
          <div className="md:col-span-12 space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-blue-500" />
              {t.transitModeLabel}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {[
                { key: "Plane", label: t.transitPlane },
                { key: "Train", label: t.transitTrain },
                { key: "Taxi", label: t.transitTaxi },
                { key: "Car", label: t.transitCar },
                { key: "Bus", label: t.transitBus || (lang === "ar" ? "🚌 حافلة عمومية" : "🚌 Public Bus") }
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setTransitMode(opt.key)}
                  className={`py-3 px-4 rounded-xl text-xs md:text-sm font-bold border-2 transition-all cursor-pointer text-center ${
                    transitMode === opt.key
                      ? "border-blue-600 bg-blue-50/20 text-blue-900 shadow-sm"
                      : "border-slate-100 bg-slate-50/40 text-slate-600 hover:border-slate-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* New Field: Trip Purpose Selection */}
          <div className="md:col-span-12 space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-500" />
              {t.tripPurposeLabel || (lang === "ar" ? "غرض الزيارة أو المسار الرئيسي" : "Primary Trip Purpose")}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { key: "tourism", label: t.tripPurposeTourism || (lang === "ar" ? "🌴 رحلة سياحة واستجمام" : "🌴 Leisure & Tourism") },
                { key: "medical", label: t.tripPurposeMedical || (lang === "ar" ? "🏥 رحلة علاج واستشفاء طبي" : "🏥 Medical Care & Treatment") },
                { key: "business_admin", label: t.tripPurposeBusinessAdmin || (lang === "ar" ? "💼 مهمة عمل وزيارة سريعة أو مراجعة إدارية" : "💼 Work, Business & Bureaucracy") }
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setTripPurpose(opt.key as any)}
                  className={`px-4 py-3.5 rounded-xl border-2 text-center font-medium transition-all ${
                    tripPurpose === opt.key
                      ? "border-emerald-500 ring-2 ring-emerald-50 bg-emerald-50/10 text-emerald-900 font-bold"
                      : "border-slate-100 hover:border-slate-200 text-slate-600 bg-slate-50/40"
                  }`}
                >
                  <span className="text-sm">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Input: Mission Destinations Detail */}
          {tripPurpose !== "tourism" && (
            <div className="md:col-span-12 space-y-2 bg-emerald-50/20 p-4 rounded-xl border border-emerald-100/60 transition-all duration-300">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-emerald-600 animate-bounce" />
                {t.missionDestinationsLabel || (lang === "ar" ? "المستشفيات، العيادات، مكاتب العمل أو الإدارات المقصودة" : "Hospitals, Clinics, or Work Offices/Administrations to Visit")}
              </label>
              <textarea
                value={missionDestinationsText}
                onChange={(e) => setMissionDestinationsText(e.target.value)}
                rows={2}
                placeholder={t.missionDestinationsPlaceholder || (lang === "ar" ? "اذكر أسماء الإدارات، المؤسسات أو المستشفى والعيادة لتوضيح خطوات مسار المهمة مع قوقل ماب..." : "Mention targeted office names, clients, clinics or hospital departments...")}
                className="w-full p-3 text-sm rounded-xl border border-slate-200 outline-none focus:border-emerald-500 bg-white text-slate-800 transition-colors shadow-inner font-medium"
              />
            </div>
          )}

          {/* New Field: Preferred Lodging Category Selection */}
          <div className="md:col-span-12 space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Home className="w-4 h-4 text-indigo-500" />
              {t.lodgingTypeLabel || (lang === "ar" ? "نوع مكان الإقامة المفضل" : "Preferred Accommodation Category")}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {[
                { key: "hotel", label: t.lodgingTypeHotel || (lang === "ar" ? "🏨 فندق (Hotel)" : "🏨 Hotel") },
                { key: "guesthouse", label: t.lodgingTypeGuesthouse || (lang === "ar" ? "🏡 دار ضيافة أو مرقد" : "🏡 Guest House") },
                { key: "hostel", label: t.lodgingTypeHostel || (lang === "ar" ? "🏢 بيت شباب مشترك" : "🏢 Youth Hostel") },
                { key: "dortoir", label: t.lodgingTypeDortoir || (lang === "ar" ? "🛏️ مرقد مشترك (Dortoir)" : "🛏️ Shared Dorms (Dortoir)") },
                { key: "home", label: t.lodgingTypeHome || (lang === "ar" ? "🔑 منزل خاص مستأجر" : "🔑 Private Home") }
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setLodgingType(opt.key as any)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 text-center font-medium transition-all ${
                    lodgingType === opt.key
                      ? "border-indigo-500 ring-2 ring-indigo-50 bg-indigo-50/10 text-indigo-900 font-bold"
                      : "border-slate-100 hover:border-slate-200 text-slate-600 bg-slate-50/40"
                  }`}
                >
                  <span className="text-xs md:text-sm">{opt.label}</span>
                </button>
              ))}
            </div>

            {/* Smart Disclaimer for Homes / Private Rental houses in Algeria */}
            {lodgingType === "home" && tripScope === "domestic" && (
              <div className="mt-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  {lang === "ar" 
                    ? "تنبيه للاستقرار في منزل أو شقة خاصة في الجزائر: يرجى إحضار بطاقة الهوية وعقد الزواج (للأزواج) حيث تفرض القوانين المحلية الجزائرية تقديم هذه الوثائق والتحقق منها عند حجز المنازل البين-ولائية."
                    : "Note for renting private homes/apartments in Algeria: Please ensure to have your ID and family/marriage booklet ready, as local regulations require strict check-in validation."}
                </span>
              </div>
            )}
          </div>

          {/* Budget Options */}
          <div className="md:col-span-12 space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-indigo-500" />
              {t.budgetLevel}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {budgetOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBudget(opt.value)}
                  className={`px-4 py-3.5 rounded-xl border-2 text-start font-medium transition-all ${
                    budget === opt.value
                      ? "border-indigo-500 ring-2 ring-indigo-50 bg-indigo-50/20 text-indigo-900"
                      : "border-slate-100 hover:border-slate-200 text-slate-600 bg-slate-50/40"
                  }`}
                >
                  <div className="text-sm font-bold">{opt.value === "Economy" ? t.budgetEco : opt.value === "Moderate" ? t.budgetMod : t.budgetLux}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Traveler Group */}
          <div className="md:col-span-12 space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-500" />
              {t.travelerType}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {travelerOptions.map((opt) => {
                const IconComp = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTravelerType(opt.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      travelerType === opt.value
                        ? "border-indigo-500 ring-2 ring-indigo-50 bg-indigo-50/20 text-indigo-900"
                        : "border-slate-100 hover:border-slate-200 text-slate-600 bg-slate-50/20"
                    }`}
                  >
                    <IconComp className={`w-5 h-5 ${travelerType === opt.value ? "text-indigo-600" : "text-slate-400"}`} />
                    <span className="text-xs font-semibold">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interest Chips */}
          <div className="md:col-span-12 space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              {t.interestsLabel}
            </label>
            <div className="flex flex-wrap gap-2.5">
              {interestOptions.map((interest) => {
                const isActive = selectedInterests.includes(interest.id);
                return (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => handleInterestToggle(interest.id)}
                    className={`px-4 py-2 rounded-full border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isActive
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {isActive && <Check className="w-3.5 h-3.5" />}
                    {interest.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trigger Request button */}
          <div className="md:col-span-12 pt-4">
            <button
              type="button"
              disabled={loading}
              onClick={generateAIPlan}
              className="w-full flex items-center justify-center gap-2 h-13 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold tracking-wide transition-all shadow-md disabled:bg-slate-300 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                  <span>{loadingMessages[loadingStep]}</span>
                </div>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>{t.generateBtn}</span>
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  </div>

      {/* Loading Canvas Placeholder */}
      {loading && (
        <div className="bg-indigo-50/40 rounded-2xl border border-indigo-100 p-8 flex flex-col items-center justify-center space-y-4 shadow-sm animate-pulse min-h-[300px]">
          <div className="p-4 rounded-full bg-indigo-100 text-indigo-600 animate-spin">
            <Compass className="w-8 h-8" />
          </div>
          <div className="text-center max-w-md">
            <h3 className="text-lg font-bold text-slate-800">{t.generating}</h3>
            <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
              {loadingMessages[loadingStep]}
            </p>
          </div>
        </div>
      )}

      {/* Structured Itinerary Result Explorer */}
      {!loading && activeItinerary && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="space-y-8"
        >
          {/* Main header banner */}
          <div className="relative overflow-hidden rounded-2xl min-h-[220px] md:min-h-[280px] text-white shadow-lg flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 p-6 md:p-8 border border-slate-800 bg-slate-950">
            {/* Scenic background image */}
            <img 
              src={getDestinationHeaderImage(activeItinerary.destinationName, activeItinerary.country || "")} 
              alt={activeItinerary.destinationName}
              className="absolute inset-0 w-full h-full object-cover opacity-45 hover:scale-[1.03] transition-transform duration-[3000ms] ease-out pointer-events-none z-0"
              referrerPolicy="no-referrer"
            />
            {/* Dramatic high-contrast overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/60 to-black/10 pointer-events-none z-10" />

            {/* Header text content wrapper */}
            <div className="space-y-1.5 relative z-20 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-indigo-200 text-xs font-bold rounded-full uppercase tracking-wider backdrop-blur-md border border-white/5">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>AI Travel Agency Verified</span>
                </div>
                {activeItinerary.isOfflineFallback && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-200 text-xs font-bold rounded-full uppercase tracking-wider backdrop-blur-md border border-amber-500/30">
                    🔌 <span>{lang === "ar" ? "محرك التخطيط المحلي الاحتياطي نشط" : "Local Backup Intelligence Active"}</span>
                  </div>
                )}
              </div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tight flex flex-wrap items-center gap-2 drop-shadow-md">
                <Compass className="w-7 md:w-8 md:h-8 text-indigo-400 animate-spin-slow" />
                <span>{t.itineraryHeader} {activeItinerary.destinationName}</span>
                <span className="text-indigo-300 font-extrabold text-lg md:text-xl">({activeItinerary.country})</span>
              </h1>
              <p className="text-sm text-slate-200 max-w-xl leading-relaxed font-semibold drop-shadow-sm">
                {lang === "ar" 
                  ? `رحلة مصممة خصيصاً لمدة ${activeItinerary.tripDurationDays} أيام بأسلوب ميزانية ${activeItinerary.targetBudgetLevel} ولصالح مجموعة ${activeItinerary.travelerType}.`
                  : `Tailored ${activeItinerary.tripDurationDays}-day journey structured for a ${activeItinerary.targetBudgetLevel} budget focusing on ${activeItinerary.travelerType} configuration.`}
              </p>

              {/* Trip Route ("من" و "إلى") and Coordination Banner Row */}
              <div className="mt-5 pt-5 border-t border-white/10 flex flex-wrap gap-4 items-center justify-between">
                {/* Route Information */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{lang === "ar" ? "نقطة الانطلاق (من)" : "Departure Origin (From)"}</span>
                    <span className="text-xs md:text-sm font-extrabold text-white flex items-center gap-1 mt-0.5 whitespace-nowrap">
                      📍 {activeItinerary.originWilaya || originWilaya || (lang === "ar" ? "الجزائر العاصمة" : "Algiers")}
                    </span>
                  </div>
                  
                  <div className="text-indigo-400 text-xs font-bold bg-white/5 py-1 px-2.5 rounded-lg border border-white/5 font-mono">
                    ➡️
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{lang === "ar" ? "الوجهة السياحية (إلى)" : "Tourism Destination (To)"}</span>
                    <span className="text-xs md:text-sm font-extrabold text-indigo-300 flex items-center gap-1 mt-0.5 whitespace-nowrap">
                      📍 {activeItinerary.destinationName}
                    </span>
                  </div>
                </div>

                {/* Coordination Type Status Badges */}
                <div className="flex flex-col sm:items-end gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{lang === "ar" ? "طبيعة تنظيم الرحلة" : "Trip Organization Status"}</span>
                  {activeItinerary.fos7aSponsorship?.enabled ? (
                    <div className="bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{lang === "ar" ? "مدعومة ومنسقة بالكامل عبر وكالة فسحة DZ" : "Fully Coordinated via Fos7a DZ Agency"}</span>
                    </div>
                  ) : (
                    <div className="bg-slate-800/60 border border-slate-700/80 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                      <span>🎒 {lang === "ar" ? "رحلة اختيارية حرة بمجهودك الفردي" : "Self-Planned Free Style Trip"}</span>
                    </div>
                  )}

                  {/* Inline Toggle of Coordination Type */}
                  <button
                    type="button"
                    onClick={() => {
                      const updated = {
                        ...activeItinerary,
                        fos7aSponsorship: {
                          ...activeItinerary.fos7aSponsorship,
                          enabled: !activeItinerary.fos7aSponsorship?.enabled,
                          travelConfig: travelerType.toLowerCase() as any,
                          tripTheme: "cultural" as "cultural",
                          departureWilaya: (activeItinerary.originWilaya || originWilaya || "Algiers").split(" (")[0],
                          includeReturn: true,
                          estimatedMinDZD: activeItinerary.fos7aSponsorship?.estimatedMinDZD || 45000,
                          estimatedMaxDZD: activeItinerary.fos7aSponsorship?.estimatedMaxDZD || 95000,
                          submitted: !activeItinerary.fos7aSponsorship?.enabled
                        }
                      };
                      onItineraryGenerated(updated);
                    }}
                    className="text-[10px] text-indigo-300 hover:text-white hover:underline font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    🔄 {lang === "ar" ? "تغيير نوع وهيكل الرحلة اختياري / وكالة" : "Switch Trip Type: Optional / Agency"}
                  </button>
                </div>
              </div>
            </div>

            <div className="relative z-20 bg-slate-900/80 border border-white/10 rounded-xl p-5 flex flex-col md:items-end justify-center min-w-[200px] backdrop-blur-md shadow-inner">
              <span className="text-xs text-indigo-200 font-medium">{lang === "ar" ? "حالة الخطة" : "PLAN STATUS"}</span>
              <span className="text-lg font-bold mt-1 text-emerald-400 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                {lang === "ar" ? "جاهزة للاستكشاف" : "Active & Ready"}
              </span>
              <button
                onClick={handleSaveToVault}
                disabled={saveSuccess}
                className={`mt-3 w-full py-2 px-4 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  saveSuccess 
                    ? "bg-emerald-500 text-white" 
                    : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
                }`}
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{lang === "ar" ? "تم الحفظ!" : "Saved!"}</span>
                  </>
                ) : (
                  <span>{t.saveTripBtn}</span>
                )}
              </button>
              
              <button
                type="button"
                onClick={handleExportPDF}
                disabled={pdfLoading}
                className={`mt-2 w-full py-2 px-4 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                  pdfLoading
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                }`}
              >
                {pdfLoading ? (
                  <>
                    <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-slate-500 border-t-transparent rounded-full" />
                    <span>{lang === "ar" ? "جاري الترجمة والتحميل..." : "Translating & Preparing..."}</span>
                  </>
                ) : (
                  <span>{t.exportPdfBtn}</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="mt-2 w-full py-2 px-4 rounded-lg font-bold text-xs bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{lang === "ar" ? "تحميل كملف PDF (تنسيق الطباعة)" : "Download Itinerary as PDF"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="mt-2 w-full py-2 px-4 rounded-lg font-bold text-xs bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{lang === "ar" ? "مشاركة برنامج الرحلة" : "Share Itinerary"}</span>
              </button>
            </div>
          </div>

          {/* Dashboard Visibility Manager & Widgets Customization */}
          <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-4" id="dashboard-layout-customizer-card">
            <div className="flex items-center gap-2 mb-1 pb-2 border-b border-slate-100">
              <span className="text-xl">⚙️</span>
              <div>
                <h3 className="font-extrabold text-slate-900 tracking-tight text-sm">
                  {lang === "ar" ? "تخصيص وتبسيط واجهة لوحة التحكم" : "Customize & Simplify Dashboard Layout"}
                </h3>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  {lang === "ar" 
                    ? "اختر الأجزاء والوظائف التي ترغب في إظهارها أو إخفائها لتسهيل وتبسيط واجهة النتيجة" 
                    : "Toggle the sections you want to display or hide to simplify and streamline the final workspace layout"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleToggleWidget("currencyConverter")}
                className={`py-2 px-3 rounded-lg border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  visibleWidgets.currencyConverter 
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold" 
                    : "bg-slate-50 border-slate-150 text-slate-400 hover:text-slate-600 line-through"
                }`}
              >
                <span>🪙</span>
                <span className="truncate">{lang === "ar" ? "محول العملات" : "Currency Converter"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleWidget("weatherForecast")}
                className={`py-2 px-3 rounded-lg border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  visibleWidgets.weatherForecast 
                    ? "bg-sky-50 border-sky-200 text-sky-700 font-bold" 
                    : "bg-slate-50 border-slate-150 text-slate-400 hover:text-slate-600 line-through"
                }`}
              >
                <span>🌦️</span>
                <span className="truncate">{lang === "ar" ? "أرصاد الطقس" : "Weather Forecast"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleWidget("prayerTimes")}
                className={`py-2 px-3 rounded-lg border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  visibleWidgets.prayerTimes 
                    ? "bg-amber-50 border-amber-200 text-amber-700 font-bold" 
                    : "bg-slate-50 border-slate-150 text-slate-400 hover:text-slate-600 line-through"
                }`}
              >
                <span>🕌</span>
                <span className="truncate">{lang === "ar" ? "مواقيت الصلاة" : "Prayer Times"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleWidget("budgetTracker")}
                className={`py-2 px-3 rounded-lg border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  visibleWidgets.budgetTracker 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold" 
                    : "bg-slate-50 border-slate-150 text-slate-400 hover:text-slate-600 line-through"
                }`}
              >
                <span>📊</span>
                <span className="truncate">{lang === "ar" ? "الميزانية والمخطط" : "Budget & Chart"}</span>
              </button>
            </div>
          </div>

          {/* Real-time Currency Conversion Tool */}
          {visibleWidgets.currencyConverter && (
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-3 border-b border-indigo-50/50">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 mt-0.5">
                    <DollarSign className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-950 tracking-tight text-base">
                      {lang === "ar" ? "أداة تحويل العملات وحساب الأسعار الفورية" : "Real-time Currency Converter & Pricing Tool"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium leading-relaxed font-sans">
                      {lang === "ar" 
                        ? "قارن التكاليف وحوّل الأسعار فورياً بين العملة المحلية والدولار بسعر البنك الرسمي أو موازين السوق السوداء." 
                        : "Compare trip expenses and instantly switch between USD and local currency using Bank or Black Market rates."}
                    </p>
                  </div>
                </div>

                {/* Currencies & Exchange Markets Selectors */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Rate Type Selector (Bank vs. Black Market) */}
                  <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setRateType("bank");
                      }}
                      className={`px-3 py-1.5 font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                        rateType === "bank"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      🏦 {lang === "ar" ? "سعر البنك" : "Bank Rate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRateType("black");
                      }}
                      className={`px-3 py-1.5 font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                        rateType === "black"
                          ? "bg-amber-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      ⚖️ {lang === "ar" ? "السوق السوداء" : "Black Market"}
                    </button>
                  </div>

                  {/* Main currency toggle */}
                  <span className="text-slate-300 hidden sm:block">|</span>

                  <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setTargetCurrency("LOCAL")}
                      className={`px-3.5 py-1.5 font-black text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                        activeCurrencyMode === "LOCAL"
                          ? "bg-white text-indigo-950 shadow-xs text-indigo-600"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      🌐 {activeItinerary.localCurrencySymbol || (lang === "ar" ? "دج" : "DZD")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetCurrency("USD")}
                      className={`px-3.5 py-1.5 font-black text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                        activeCurrencyMode === "USD"
                          ? "bg-white text-indigo-950 shadow-xs text-indigo-600"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      🇺🇸 USD ($)
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Informational Comparison Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2 font-sans text-xs">
                <div 
                  onClick={() => setRateType("bank")}
                  className={`p-3 rounded-xl border flex flex-col justify-between gap-1 transition-all cursor-pointer hover:border-indigo-300 ${rateType === "bank" ? "bg-indigo-50/40 border-indigo-200 ring-2 ring-indigo-500/10" : "bg-slate-50/60 border-slate-150"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      🏦 {lang === "ar" ? "سعر الصرف البنكي الرسمي" : "Official Bank Exchange Rate"}
                    </span>
                    {rateType === "bank" && <span className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-100 text-indigo-700 font-extrabold uppercase">{lang === "ar" ? "نشط" : "Active"}</span>}
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-1">
                    1 USD = {getDefaultExchangeRate(activeItinerary.country || "", !!activeItinerary.isDomesticTrip, "bank")} {activeItinerary.localCurrencySymbol || (lang === "ar" ? "دج" : "DZD")}
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    {lang === "ar" ? "السعر المعتمد لدى البنوك والتحويلات الرسمية الحكومية." : "Standard rate for sovereign bank conversions and official channels."}
                  </p>
                </div>

                <div 
                  onClick={() => setRateType("black")}
                  className={`p-3 rounded-xl border flex flex-col justify-between gap-1 transition-all cursor-pointer hover:border-amber-300 ${rateType === "black" ? "bg-amber-50/45 border-amber-200 ring-2 ring-amber-500/10" : "bg-slate-50/60 border-slate-150"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      ⚖️ {lang === "ar" ? "سعر السوق الموازية والسكوار" : "Parallel Black Market Rate"}
                    </span>
                    {rateType === "black" && <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-100 text-amber-800 font-extrabold uppercase">{lang === "ar" ? "نشط" : "Active"}</span>}
                  </div>
                  <div className="text-sm font-black text-amber-700 mt-1">
                    1 USD = {getDefaultExchangeRate(activeItinerary.country || "", !!activeItinerary.isDomesticTrip, "black")} {activeItinerary.localCurrencySymbol || (lang === "ar" ? "دج" : "DZD")}
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    {lang === "ar" ? "السعر السائد في السوق الموازية غير الرسمية (مفيد لمطابقة ميزانية السفر الفعلية للكاش)." : "Actual parallel market cash rate (essential for liquid pocket travelers matching real-life costs in DZD)."}
                  </p>
                </div>
              </div>

              {/* Exchange Rate Adjustment Box */}
              <div className="bg-slate-50/90 rounded-xl p-4 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 block">
                    {lang === "ar" ? "⚙️ سعر الصرف المعتمد حالياً للتحويل:" : "⚙️ Configured Exchange Rate (Base Rate):"}
                  </span>
                  <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                    {lang === "ar" 
                      ? `مبني على سعر: 1 دولار أمريكي (USD) = ${customExchangeRate || 140} ${activeItinerary.localCurrencySymbol || "دج"} (${rateType === "bank" ? "سعر البنك" : "السوق السوداء"})`
                      : `Based on: 1 USD = ${customExchangeRate || 1.0} ${activeItinerary.localCurrencySymbol || "DZD"} (${rateType === "bank" ? "Bank Rate" : "Black Market"})`}
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <label className="text-xs font-extrabold text-slate-700 whitespace-nowrap">
                    {lang === "ar" ? "تعديل سعر الصرف يدوياً:" : "Override Rate:"}
                  </label>
                  <div className="relative rounded-lg">
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      value={customExchangeRate || ""}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) setCustomExchangeRate(val);
                      }}
                      className="w-28 py-1.5 px-3 rounded-lg border border-slate-250 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-250 text-center"
                    />
                  </div>
                  
                  {/* Reset button to standard default */}
                  <button
                    type="button"
                    onClick={() => {
                      const isDomestic = !!activeItinerary.isDomesticTrip;
                      const country = activeItinerary.country || "";
                      const defaultRate = getDefaultExchangeRate(country, isDomestic, rateType);
                      setCustomExchangeRate(defaultRate);
                    }}
                    className="px-2.5 py-1.5 bg-slate-150 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                    title={lang === "ar" ? "استعادة القيمة الافتراضية" : "Reset to default"}
                  >
                    {lang === "ar" ? "إعادة تعيين" : "Reset"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Weather & Climate 7-Day Forecast card */}
          {visibleWidgets.weatherForecast && (
            <WeatherForecastCard 
              destinationName={activeItinerary.destinationName} 
              lang={lang} 
              itinerary={activeItinerary}
            />
          )}

          {/* Prayer Times Card */}
          {visibleWidgets.prayerTimes && (
            <PrayerTimesCard 
              destinationName={activeItinerary.destinationName} 
              lang={lang} 
            />
          )}

          {/* Meteorology & Active Festival Advisories Section */}
          {(activeItinerary.climateAdvisoryAlert || (activeItinerary.localEventsAndExpos && activeItinerary.localEventsAndExpos.length > 0)) && (
            <div className="bg-amber-50/50 border border-amber-200/85 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-amber-150 pb-3 font-semibold text-amber-900">
                <span className="text-xl">🌦️</span>
                <h3 className="font-extrabold text-slate-900 tracking-tight text-base">
                  {t.weatherAlertsSectionLabel}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-500 border-b border-amber-150 pb-4">
                <div className="bg-white/85 rounded-xl p-3 border border-amber-100 flex items-center gap-2.5">
                  <span className="text-lg">📅</span>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                      {lang === "ar" ? "تاريخ مغادرة الرحلة المحدد" : "Planned Flight Date"}
                    </div>
                    <div className="text-slate-800 text-xs mt-0.5">{activeItinerary.departureDate || departureDate}</div>
                  </div>
                </div>
                
                <div className="bg-white/85 rounded-xl p-3 border border-amber-100 flex items-center gap-2.5">
                  <span className="text-lg">💰</span>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                      {lang === "ar" ? "القدرة المالية المخصصة" : "Set Capital Allocation"}
                    </div>
                    <div className="text-slate-800 text-xs mt-0.5">{activeItinerary.allocatedBudgetAmount || allocatedBudgetAmount || (lang === "ar" ? "ميزانية مرنة" : "Flexible Limit")}</div>
                  </div>
                </div>

                <div className="bg-white/85 rounded-xl p-3 border border-amber-100 flex items-center gap-2.5">
                  <span className="text-lg">🚌</span>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                      {lang === "ar" ? "قناة النقل المفضلة" : "Means of Transportation"}
                    </div>
                    <div className="text-slate-800 text-xs mt-0.5">
                      {activeItinerary.transitMode === "Train" || transitMode === "Train" ? t.transitTrain 
                       : activeItinerary.transitMode === "Taxi" || transitMode === "Taxi" ? t.transitTaxi 
                       : activeItinerary.transitMode === "Car" || transitMode === "Car" ? t.transitCar 
                       : t.transitPlane}
                    </div>
                  </div>
                </div>
              </div>

              {activeItinerary.climateAdvisoryAlert && (
                <div className="space-y-1 bg-white/75 rounded-xl p-4 border border-amber-200">
                  <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5 uppercase tracking-wider">
                    🔄 {t.delayAdvanceRecommendation}
                  </span>
                  <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-semibold mt-1.5">
                    {activeItinerary.climateAdvisoryAlert}
                  </p>
                </div>
              )}

              {activeItinerary.localEventsAndExpos && activeItinerary.localEventsAndExpos.length > 0 && (
                <div className="space-y-3 pt-1">
                  <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                    🎪 {t.expoWarning}
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {activeItinerary.localEventsAndExpos.map((expo, expIdx) => (
                      <div key={expIdx} className="bg-white/85 rounded-xl p-4 border border-indigo-50 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-2 border-b border-rose-50 pb-2 mb-2">
                            <span className="text-xs font-bold text-indigo-950">{expo.name}</span>
                            <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-md whitespace-nowrap">
                              📅 {expo.date}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                            {expo.advisabilityNote}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Diagnostic & Tracking Suite: Progress Control + Expense Tracker Chart Grid */}
          {(() => {
            const activitiesTotal = activeItinerary.days?.reduce((sum, d) => {
              return sum + (d.activities?.reduce((sub, act) => sub + (act.estimatedCostUSD || 0), 0) || 0);
            }, 0) || 0;

            const hotelPricePerNight = selectedHotel
              ? selectedHotel.priceUSD
              : (activeItinerary.suggestedHotels?.[0]?.pricePerNightUSD || 0);
            const hotelTotal = hotelPricePerNight * (activeItinerary.days?.length || activeItinerary.tripDurationDays || 1);

            const flightTotal = selectedFlight ? selectedFlight.priceUSD : 0;

            const isDomestic = !!activeItinerary.isDomesticTrip;
            const currentRate = customExchangeRate || 140;

            let finalHotelVal = hotelTotal;
            let finalFlightVal = flightTotal;
            let finalActivitiesVal = activitiesTotal;

            if (isDomestic) {
              if (selectedHotel) {
                finalHotelVal = selectedHotel.priceUSD * currentRate;
              }
              if (selectedFlight) {
                finalFlightVal = selectedFlight.priceUSD * currentRate;
              }
            }

            const totalBaseCost = finalActivitiesVal + finalHotelVal + finalFlightVal;
            const limitNum = parseFloat(customBudgetTarget) || 0;
            const isOver = limitNum > 0 && totalBaseCost > limitNum;
            const overDiff = totalBaseCost - limitNum;

            const chartData = [
              { name: lang === "ar" ? "🎯 الأنشطة" : "🎯 Activities", value: finalActivitiesVal, color: "#6366f1" },
              { name: lang === "ar" ? "🏨 الإقامة" : "🏨 Lodgings", value: finalHotelVal, color: "#10b981" },
              { name: lang === "ar" ? "✈️ النقل والعبور" : "✈️ Transit", value: finalFlightVal, color: "#3b82f6" },
            ].filter(d => d.value > 0);

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Visual Day-by-Day Journey Progress Indicator Panel */}
                <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl border ${completedDays.length === activeItinerary.days.length ? "bg-emerald-50 border-emerald-110 text-emerald-600 animate-bounce" : "bg-indigo-50 border-indigo-100 text-indigo-600 animate-pulse"}`}>
                          {completedDays.length === activeItinerary.days.length ? (
                            <Award className="w-5 h-5" />
                          ) : (
                            <Calendar className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-950 tracking-tight text-sm">
                            {lang === "ar" ? "نسبة إنجاز خطة السير والرحلة" : "Journey Itinerary Mileage Progress"}
                          </h3>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                            {lang === "ar" 
                              ? `${completedDays.length} من إجمالي ${activeItinerary.days.length} أيام مسجلة كمكتملة (${Math.round((completedDays.length / (activeItinerary.days.length || 1)) * 100)}%)` 
                              : `${completedDays.length} of ${activeItinerary.days.length} days marked as accomplished (${Math.round((completedDays.length / (activeItinerary.days.length || 1)) * 100)}%)`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Motivational feedback bubble */}
                    <div className="bg-slate-50/80 px-4 py-2 rounded-xl border border-slate-100 text-xs font-semibold text-slate-600 leading-relaxed">
                      {completedDays.length === 0 ? (
                        lang === "ar" ? "🎯 جاهز لبدء مغامرتك؟ علم على الأيام كمكتملة لمتابعة مسارك خطوة بخطوة عند البدء!" : "🎯 Ready to explore? Mark days as finished below to track your route footprint step by step!"
                      ) : completedDays.length === activeItinerary.days.length ? (
                        lang === "ar" ? "🏆 تهانينا على إتمام كامل خطة رحلة السفر الرائعة في الجزائر! ذكريات لا تنسى! 🎉" : "🏆 Splendid! You have accomplished 100% of your travel agenda itinerary successfully! 🎉"
                      ) : (
                        lang === "ar" ? "✨ أنت تسير بتمكن رائع! تابع إنجاز الأيام المتبقية واستمتع بكل تفاصيل الأجواء..." : "✨ Great track progression! Keep marking days completed as you experience each adventure..."
                      )}
                    </div>

                    {/* Progress bar container */}
                    <div className="space-y-3">
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/40 relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(completedDays.length / (activeItinerary.days.length || 1)) * 100}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 rounded-full"
                        />
                      </div>

                      {/* Day Checker Grid bubbles - Interactive Checklist */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase mr-1 whitespace-nowrap">
                          {lang === "ar" ? "تحديد الأيام المكتملة:" : "Mark days done:"}
                        </span>
                        
                        {activeItinerary.days.map((day) => {
                          const isDone = completedDays.includes(day.dayNumber);
                          return (
                            <button
                              key={day.dayNumber}
                              type="button"
                              onClick={() => toggleDayCompleted(day.dayNumber)}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                                isDone
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs"
                                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 active:bg-slate-50"
                              }`}
                            >
                              <span className={`w-4 h-4 rounded-md flex items-center justify-center border text-[9px] transition-all shrink-0 ${
                                isDone ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 bg-white"
                              }`}>
                                {isDone && <Check className="w-2.5 h-2.5 stroke-[4px]" />}
                              </span>
                              <span>{lang === "ar" ? "اليوم" : "Day"} {day.dayNumber}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Intelligent Expense Tracker & Chart Visual Allocation Panel */}
                {visibleWidgets.budgetTracker && (
                  <BudgetTracker
                    itinerary={activeItinerary}
                    selectedHotel={selectedHotel}
                    selectedFlight={selectedFlight}
                    lang={lang}
                    customExchangeRate={customExchangeRate}
                    formatPrice={formatPrice}
                  />
                )}

              </div>
            );
          })()}

          {/* Dual Exploration View Switcher: Agenda Planner (timeline) VS visual slides (slideshow) */}
          <div className="bg-slate-100/70 p-2 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 border border-slate-200/50">
            <div className="flex items-center gap-2.5 px-2">
              <span className="text-xl">🗺️</span>
              <div className="text-start">
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{lang === "ar" ? "وزّع عرض المخطط" : "LAYOUT NAVIGATOR"}</p>
                <p className="text-xs font-black text-slate-800">{lang === "ar" ? "اختر طريقة استعراض مسار الرحلة" : "Switch Itinerary View Mode"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setItineraryViewMode("timeline")}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  itineraryViewMode === "timeline"
                    ? "bg-slate-900 border border-slate-950 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-650 hover:bg-slate-50"
                }`}
              >
                📋 {lang === "ar" ? "جدول خطة الرحلة" : "Agenda Planner"}
              </button>

              <button
                type="button"
                onClick={() => setItineraryViewMode("slideshow")}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer relative ${
                  itineraryViewMode === "slideshow"
                    ? "bg-indigo-600 border border-indigo-500 text-white shadow-md shadow-indigo-100"
                    : "bg-white border border-slate-200 text-slate-650 hover:bg-slate-50"
                }`}
              >
                🎬 {lang === "ar" ? "العرض البصري الجذّاب" : "Scenic Slideshow"}
                <span className="absolute -top-1.5 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {itineraryViewMode === "slideshow" && (
              <motion.div
                key="scenic-slide-container"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
              >
                <ScenicSlideshow 
                  itinerary={activeItinerary} 
                  lang={lang} 
                  onLandmarkClick={(landmarkName) => {
                    setSelectedLandmarkForTrivia(landmarkName);
                    setIsTriviaModalOpen(true);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Days Interactive Timelines Tabs */}
          <div className={itineraryViewMode === "slideshow" ? "hidden" : "grid grid-cols-1 lg:grid-cols-12 gap-8"}>
            {/* Days Slider Navigator (Left/Right) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4 px-1 flex items-center gap-1.5 uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  {lang === "ar" ? "المخطط اليومي للرحلة" : "Daily Agenda"}
                </h3>

                <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
                  {activeItinerary.days.map((day, idx) => (
                    <button
                      key={day.dayNumber}
                      onClick={() => setActiveDayIdx(idx)}
                      className={`flex-shrink-0 flex lg:items-center gap-3 px-4 py-3 rounded-xl border text-start transition-all w-36 lg:w-full cursor-pointer ${
                        activeDayIdx === idx
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                          : "bg-slate-50/50 border-slate-100 hover:border-slate-200 text-slate-700"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        activeDayIdx === idx ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-600"
                      }`}>
                        {day.dayNumber}
                      </div>
                      <div className="text-xs truncate font-semibold lg:block hidden">
                        {day.theme}
                      </div>
                      <div className="text-xs lg:hidden font-bold">
                        {lang === "ar" ? "يوم" : "Day"} {day.dayNumber}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Daily Timeline Detail Column */}
            <div className="lg:col-span-8 space-y-4">
              {(() => {
                const currentDay = activeItinerary.days[activeDayIdx] || activeItinerary.days[0];
                if (!currentDay) return null;
                return (
                  <motion.div
                    key={activeDayIdx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4 h-full flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm flex justify-between items-center border-b border-slate-50 pb-3">
                        <span className="flex items-center gap-1.5 font-bold uppercase text-[12.5px] text-indigo-700 tracking-wider">
                          🗓️ {lang === "ar" ? "تفاصيل اليوم" : "Day Timeline"}: {currentDay.dayNumber}
                          <span className="text-[9px] bg-indigo-50/70 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-md animate-pulse">
                            {lang === "ar" ? "👋 اسحب للترتيب" : "👋 Drag to reorder"}
                          </span>
                        </span>
                        <span className="text-slate-600 font-extrabold font-sans text-xs bg-indigo-50 px-2.5 py-1 rounded-md">
                          {currentDay.theme}
                        </span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {currentDay.activities.map((act, aIdx) => {
                          const isAlertActive = notificationConfigs[`${currentDay.dayNumber}-${aIdx}`]?.active;
                          const countdown = notificationConfigs[`${currentDay.dayNumber}-${aIdx}`]?.countdown;
                          const computedTags = getActivityTags(act.title, act.description);
                          
                          const isDragged = draggedActivityIndex === aIdx;
                          const isDragOver = dragOverActivityIndex === aIdx;

                          return (
                            <motion.div
                              key={aIdx}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ 
                                opacity: isDragged ? 0.45 : 1, 
                                y: 0,
                                scale: isDragOver ? 1.015 : 1
                              }}
                              transition={{ duration: 0.2 }}
                              draggable="true"
                              onDragStart={(e) => {
                                setDraggedActivityIndex(aIdx);
                                e.dataTransfer.effectAllowed = "move";
                                e.dataTransfer.setData("text/plain", aIdx.toString());
                              }}
                              onDragEnd={() => {
                                setDraggedActivityIndex(null);
                                setDragOverActivityIndex(null);
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                if (draggedActivityIndex !== null && draggedActivityIndex !== aIdx) {
                                  setDragOverActivityIndex(aIdx);
                                }
                              }}
                              onDragLeave={() => {
                                setDragOverActivityIndex(null);
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                const fromIdx = parseInt(e.dataTransfer.getData("text/plain"));
                                if (!isNaN(fromIdx) && fromIdx !== aIdx) {
                                  handleReorderActivities(activeDayIdx, fromIdx, aIdx);
                                }
                                setDraggedActivityIndex(null);
                                setDragOverActivityIndex(null);
                              }}
                              className={`bg-slate-50/50 p-3.5 border hover:border-indigo-150 rounded-xl text-xs space-y-2 hover:shadow-3xs transition-all border-s-4 border-s-indigo-500 relative flex flex-col justify-between cursor-move select-none ${
                                isDragOver 
                                  ? "border-t-2 border-t-indigo-500 ring-2 ring-indigo-500/10" 
                                  : isDragged
                                    ? "border-dashed border-slate-300 bg-slate-100"
                                    : "border-slate-150/40"
                              }`}
                            >
                              <div>
                                <div className="flex justify-between items-start gap-2 font-semibold">
                                  <div className="flex items-start gap-1">
                                    <div className="text-slate-400 hover:text-indigo-600 transition-colors p-0.5 cursor-grab shrink-0 mt-0.5" title={lang === "ar" ? "اسحب لإعادة الترتيب" : "Drag to reorder"}>
                                      <GripVertical className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                      <span className="font-black text-slate-950 text-[12px] pr-1 block">{act.title}</span>
                                      {computedTags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1 pr-1">
                                          {computedTags.map((tag) => (
                                            <span
                                              key={tag.id}
                                              className={`px-1.5 py-0.5 rounded-md text-[9px] font-black border flex items-center gap-1 transition-all ${tag.bgStyle} ${tag.borderStyle} ${tag.textStyle}`}
                                            >
                                              <span className="scale-90 leading-none">{tag.emoji}</span>
                                              <span>{lang === "ar" ? tag.labelAr : tag.labelEn}</span>
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className="text-[10px] text-indigo-750 bg-indigo-50 px-2 py-0.5 rounded-md font-mono font-bold whitespace-nowrap">{act.timeOfDay} ({act.durationHours}h)</span>
                                    
                                    <button
                                      type="button"
                                      onClick={() => handleToggleNotification(currentDay.dayNumber, aIdx)}
                                      className={`p-1.5 rounded-lg border transition-all flex items-center justify-center gap-1 cursor-pointer scale-95 md:scale-100 ${
                                        isAlertActive 
                                          ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100" 
                                          : "bg-white text-slate-400 border-slate-200 hover:text-slate-600 hover:bg-slate-50"
                                      }`}
                                      title={lang === "ar" ? "تفعيل تنبيه محاكاة الوصول باقتراب وقت الفعالية" : "Toggle simulated schedule approach notification"}
                                    >
                                      {countdown !== null ? (
                                        <span className="text-[9px] font-black font-mono text-amber-600 animate-pulse flex items-center gap-0.5 leading-none">
                                          ⏰ {countdown}s
                                        </span>
                                      ) : (
                                        <Bell className={`w-3.5 h-3.5 ${isAlertActive ? "fill-amber-500 stroke-[2.5]" : "stroke-[2.2]"}`} />
                                      )}
                                    </button>
                                  </div>
                                </div>
                                <p className="text-slate-500 font-medium leading-relaxed mt-1.5">{act.description}</p>
                              </div>

                              {isAlertActive && (
                                <div className="flex items-center gap-1.5 bg-amber-50/40 text-amber-700/90 text-[10px] font-bold px-2 py-1 rounded-lg border border-amber-200/30 mt-1 leading-none">
                                  <span className="animate-ping w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                  <span>
                                    {lang === "ar" 
                                      ? `⏰ مفعّل! محاكاة التنبيه بالاقتراب جارية (ستكتمل خلال ${countdown !== null ? countdown : 0} ثانية)...`
                                      : `⏰ Alert active! Countdown timer simulation in progress (${countdown !== null ? countdown : 0}s)...`}
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-1.5 border-t border-slate-150/20 text-[10.5px] font-semibold text-slate-700">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedLandmarkForTrivia(act.locationName);
                                    setIsTriviaModalOpen(true);
                                  }}
                                  className="flex items-center gap-1 cursor-pointer text-indigo-650 hover:text-indigo-800 bg-indigo-50/50 hover:bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100/30 transition-all font-black text-[10px]"
                                  title={lang === "ar" ? "اضغط هنا لرؤية تاريخ المعلم والذكاء الاصطناعي" : "Click here to see AI historic facts & trivia"}
                                >
                                  ✨ 📍 {act.locationName}
                                </button>
                                {act.estimatedCostUSD > 0 && (
                                  <span className="text-emerald-700 font-black">
                                    💰 {formatPrice(act.estimatedCostUSD)}
                                  </span>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* Form to add an activity to this current day */}
                      <div className="pt-4 border-t border-slate-100 mt-5">
                        {!showAddActivityForm ? (
                          <button
                            onClick={() => setShowAddActivityForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-3xs border border-indigo-100"
                          >
                            <Plus className="w-4 h-4 stroke-[3]" />
                            <span>{lang === "ar" ? "➕ إضافة نشاط مخصص لبرنامج اليوم" : "➕ Add Custom Activity to Day Plan"}</span>
                          </button>
                        ) : (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const costNum = parseFloat(newActivityCost.replace(/[^\d.]/g, "")) || 0;
                              const durNum = parseFloat(newActivityDuration) || 2;
                              if (!newActivityTitle.trim() || !newActivityDesc.trim()) return;

                              const customActivity = {
                                title: newActivityTitle.trim(),
                                description: newActivityDesc.trim(),
                                timeOfDay: (lang === "ar" ? (newActivityTimeOfDay === "Morning" ? "صباحاً" : newActivityTimeOfDay === "Afternoon" ? "بعد الظهر" : "مساءً") : newActivityTimeOfDay) as any,
                                durationHours: durNum,
                                estimatedCostUSD: costNum,
                                locationName: newActivityLocation.trim() || (lang === "ar" ? "معلم محلي" : "Local spot")
                              };

                              // Update activeItinerary in TravelPlanner
                              if (activeItinerary) {
                                const updated = { ...activeItinerary };
                                updated.days = updated.days.map((day, dIdx) => {
                                  if (dIdx === activeDayIdx) {
                                    return {
                                      ...day,
                                      activities: [...day.activities, customActivity]
                                    };
                                  }
                                  return day;
                                });

                                // Call update callbacks to propagate state back to context
                                if (onUpdateItinerary) {
                                  onUpdateItinerary(updated);
                                } else {
                                  onItineraryGenerated(updated);
                                }
                              }

                              // Reset form
                              setNewActivityTitle("");
                              setNewActivityDesc("");
                              setNewActivityLocation("");
                              setNewActivityCost("");
                              setNewActivityDuration("2");
                              setShowAddActivityForm(false);
                            }}
                            className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 shadow-3xs text-left"
                          >
                            <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                              <span className="font-extrabold text-slate-800 text-xs">
                                {lang === "ar" ? "📝 إضافة نشاط جديد للبرنامج" : "📝 Add New Activity to Timeline"}
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowAddActivityForm(false)}
                                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg"
                              >
                                {lang === "ar" ? "إلغاء" : "Cancel"}
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] font-black text-slate-400 block uppercase mb-1 font-sans">
                                  {lang === "ar" ? "عنوان النشاط (مثال: جولة بالتاكسي، غداء تقليدي):" : "Activity Title (e.g., Taxi to old town, Traditional lunch):"}
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={newActivityTitle}
                                  onChange={(e) => setNewActivityTitle(e.target.value)}
                                  placeholder={lang === "ar" ? "ادخل عنواناً قصيراً..." : "e.g., Seafood dinner by harbor"}
                                  className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 text-xs font-bold px-3 py-1.5 rounded-lg text-slate-800"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-black text-slate-400 block uppercase mb-1 font-sans">
                                  {lang === "ar" ? "الموقع الجغرافي / المكان:" : "Location / Spot Name:"}
                                </label>
                                <input
                                  type="text"
                                  value={newActivityLocation}
                                  onChange={(e) => setNewActivityLocation(e.target.value)}
                                  placeholder={lang === "ar" ? "العنوان أو اسم المعلم..." : "e.g., Royal Fish Restaurant"}
                                  className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 text-xs font-bold px-3 py-1.5 rounded-lg text-slate-800"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] font-black text-slate-400 block uppercase mb-1 font-sans">
                                {lang === "ar" ? "وصف تفصيلي للنشاط (لتفعيل التصنيف الذكي، اكتب تفاصيل مفيدة):" : "Activity Description (To activate smart categorization, write helpful keywords):"}
                              </label>
                              <textarea
                                required
                                rows={2}
                                value={newActivityDesc}
                                onChange={(e) => setNewActivityDesc(e.target.value)}
                                placeholder={lang === "ar" 
                                  ? "مثال: ركوب تاكسي للتنقل إلى وسط المدينة، أو تناول وجبة طعام عشاء في مطعم للأسماك..." 
                                  : "e.g., Took a local bus for transit to the central museum, or ordered a lunch meal at a cozy café..."}
                                className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-800 leading-relaxed resize-none"
                              />
                              <p className="text-[9.5px] text-slate-400/95 font-bold italic mt-1 leading-normal">
                                💡 {lang === "ar" 
                                  ? "نصيحة: كلمات مثل (تاكسي، حافلة، نقل، طعام، مطعم، أسماك، تسوق، هدايا) تفعّل التصنيف المالي التلقائي!" 
                                  : "Tip: Keywords like (taxi, bus, transit, food, lunch, cafe, restaurant, shopping, buy, souvenir) trigger automated budget categories!"}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="text-[10px] font-black text-slate-400 block uppercase mb-1 font-sans">
                                  {lang === "ar" ? "التوقيت المقترح:" : "Suggested Timeframe:"}
                                </label>
                                <select
                                  value={newActivityTimeOfDay}
                                  onChange={(e: any) => setNewActivityTimeOfDay(e.target.value)}
                                  className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 text-xs font-bold px-2 py-1.5 rounded-lg text-slate-800"
                                >
                                  <option value="Morning">{lang === "ar" ? "صباحاً (Morning)" : "Morning"}</option>
                                  <option value="Afternoon">{lang === "ar" ? "بعد الظهر (Afternoon)" : "Afternoon"}</option>
                                  <option value="Evening">{lang === "ar" ? "مساءً (Evening)" : "Evening"}</option>
                                </select>
                              </div>

                              <div>
                                <label className="text-[10px] font-black text-slate-400 block uppercase mb-1 font-sans">
                                  {lang === "ar" ? "المدة المتوقعة (ساعات):" : "Duration Estimation (hrs):"}
                                </label>
                                <input
                                  type="number"
                                  min="0.5"
                                  max="12"
                                  step="0.5"
                                  required
                                  value={newActivityDuration}
                                  onChange={(e) => setNewActivityDuration(e.target.value)}
                                  className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 text-xs font-bold px-3 py-1.5 rounded-lg text-slate-800"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-black text-slate-400 block uppercase mb-1 font-sans">
                                  {lang === "ar" ? "التكلفة التقديرية بالـ (USD):" : "Estimated Cost (USD):"}
                                </label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    required
                                    value={newActivityCost}
                                    onChange={(e) => {
                                      const costVal = e.target.value.replace(/[^\d.]/g, "");
                                      setNewActivityCost(costVal);
                                    }}
                                    placeholder="0.00"
                                    className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 text-xs font-bold font-mono px-3 py-1.5 rounded-lg text-slate-800"
                                  />
                                  <span className="absolute right-3.5 top-1.5 text-[9px] font-black text-slate-400 pointer-events-none">
                                    USD
                                  </span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="submit"
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 px-4 flex items-center justify-center gap-1.5 text-xs font-black transition-all cursor-pointer shadow-3xs"
                            >
                              <Plus className="w-4 h-4 stroke-[3]" />
                              <span>{lang === "ar" ? "حفظ وإدراج النشاط بالبرنامج مع تصنيف الميزانية" : "Save & Add Activity in Timeline & Categorize Budget"}</span>
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })()}
            </div>
          </div>

          {/* Dynamic packing Checklist options */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-150/60 pb-5">
                  <div className="space-y-1">
                    <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                      <span className="text-xl">🎒</span>
                      <span>{t.packingHeader}</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold">
                      {lang === "ar"
                        ? "تتبع ورتب تجهيز حقائبك حياّ قبل الانطلاق لمطابقة البرنامج والطقس"
                        : "Physically track and check off items as they make it into your bags with smart forecast guidelines"}
                    </p>
                  </div>

                  {/* Filter and Control actions layout */}
                  <div className="flex flex-wrap items-center gap-2.5 text-xs">
                    {/* Filter buttons */}
                    <div className="flex items-center bg-slate-50 border border-slate-200/60 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setPackingFilter("all")}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                          packingFilter === "all"
                            ? "bg-indigo-600 text-white shadow-3xs"
                            : "text-slate-650 hover:text-slate-900"
                        }`}
                      >
                        {lang === "ar" ? "الكل" : "All"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPackingFilter("packed")}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                          packingFilter === "packed"
                            ? "bg-indigo-600 text-white shadow-3xs"
                            : "text-slate-650 hover:text-slate-900"
                        }`}
                      >
                        {lang === "ar" ? "المُعبأ" : "Packed"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPackingFilter("unpacked")}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                          packingFilter === "unpacked"
                            ? "bg-indigo-600 text-white shadow-3xs"
                            : "text-slate-650 hover:text-slate-900"
                        }`}
                      >
                        {lang === "ar" ? "غير المُعبأ" : "Unpacked"}
                      </button>
                    </div>

                    {/* Master check / reset options */}
                    <button
                      type="button"
                      onClick={handleCheckAllPackingItems}
                      className="px-3 py-2 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-3xs"
                      title={lang === "ar" ? "تحديد الكل كمشحون" : "Mark all packed"}
                    >
                      <span>{lang === "ar" ? "✓ تعبئة الكل" : "✓ Pack All"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetAllPackingItems}
                      className="px-3 py-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-3xs"
                      title={lang === "ar" ? "إعادة ضبط الاختيارات" : "Reset checks"}
                    >
                      <span>{lang === "ar" ? "↺ تصفير" : "↺ Reset"}</span>
                    </button>
                  </div>
                </div>

                {/* Progress indicator banner */}
                <div className="bg-indigo-50/40 border border-indigo-100/30 rounded-xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <span className="animate-bounce">🎒</span>
                        <span>
                          {lang === "ar"
                            ? `تعبئة الأمتعة: ${packingStats.checked} من أصل ${packingStats.total} مستلزمات`
                            : `Packing Progress: ${packingStats.checked} of ${packingStats.total} items packed`}
                        </span>
                      </span>
                      <span className="font-mono font-black text-indigo-750 bg-white px-2 py-0.5 rounded-md border border-indigo-100 shadow-3xs">{packingStats.percentage}%</span>
                    </div>
                    
                    {/* Actual visual motion bar */}
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <motion.div
                        className="bg-indigo-600 h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${packingStats.percentage}%` }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {packingStats.percentage === 100 && packingStats.total > 0 ? (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-2 bg-emerald-50 border border-emerald-150 px-3.5 py-2 rounded-xl text-emerald-800 text-xs font-bold leading-none shrink-0"
                    >
                      <span className="text-base">🎉</span>
                      <div>
                        <p className="font-extrabold">{lang === "ar" ? "جاهز تماماً للسفر!" : "Fully Packed & Ready!"}</p>
                        <p className="text-[10px] font-semibold text-emerald-700/80 mt-0.5">{lang === "ar" ? "حقائبك جاهزة لرحلتك المميزة" : "Everything is securely stowed in your bags"}</p>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-[10px] text-slate-400 font-extrabold uppercase shrink-0 leading-tight">
                      {lang === "ar" ? "تأكد من شحن التجهيزات الهامة والوثائق" : "Ensure major documents & gear checked"}
                    </div>
                  )}
                </div>

                {/* Dynamic Weather alerts & smart warnings for missing items */}
                {weatherWarnings.length > 0 && (
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-3.5 shadow-3xs">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base text-amber-500 animate-pulse">⚠️</span>
                      <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                        {lang === "ar" ? "تنبيهات الطقس وتجهيز الحقائب الذكي" : "Weather Forecast Advisories & Action Items"}
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {weatherWarnings.map((warn) => {
                        const hasAction = warn.isMissing || warn.isUnpacked;
                        return (
                          <div 
                            key={warn.id}
                            className={`border rounded-xl p-3.5 flex flex-col justify-between transition-all ${
                              warn.isMissing 
                                ? "bg-rose-50/40 border-rose-100 ring-1 ring-rose-500/5" 
                                : warn.isUnpacked
                                  ? "bg-amber-50/30 border-amber-100"
                                  : "bg-emerald-50/20 border-emerald-100"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-black text-xs text-slate-850">
                                  {lang === "ar" ? warn.titleAr : warn.titleEn}
                                </span>
                                
                                {warn.isMissing ? (
                                  <span className="text-[9.5px] font-black bg-rose-100/60 text-rose-700 px-2 py-0.5 rounded-md flex items-center gap-1 border border-rose-200/50">
                                    <span>⚠️</span>
                                    <span>{lang === "ar" ? "غير موجود بالقائمة" : "Missing from list"}</span>
                                  </span>
                                ) : warn.isUnpacked ? (
                                  <span className="text-[9.5px] font-black bg-amber-100/50 text-amber-700 px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-200/30">
                                    <span>⏳</span>
                                    <span>{lang === "ar" ? "لم يُعبأ بعد" : "Not packed yet"}</span>
                                  </span>
                                ) : (
                                  <span className="text-[9.5px] font-black bg-emerald-100/50 text-emerald-700 px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-200/50">
                                    <span>✓</span>
                                    <span>{lang === "ar" ? "جاهز ومُعبأ" : "Ready & Packed"}</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 font-semibold mt-1">
                                {lang === "ar" ? `${warn.descAr} ${warn.recommendAr}` : `${warn.descEn} ${warn.recommendEn}`}
                              </p>
                            </div>

                            {hasAction && (
                              <div className="border-t border-slate-200/55 pt-3 mt-3 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-600 line-clamp-1">
                                  📦 {lang === "ar" ? warn.itemAr : warn.itemEn}
                                </span>
                                
                                {warn.isMissing ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const textToAdd = lang === "ar" ? warn.itemAr : warn.itemEn;
                                      handleAddCustomItem(textToAdd);
                                    }}
                                    className="p-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] rounded-lg cursor-pointer transition-colors shadow-3xs shrink-0"
                                  >
                                    {lang === "ar" ? "+ أضف للتعبئة" : "+ Add to list"}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // Mark as packed
                                      const terms = [warn.queryItem, "umbrella", "raincoat", "coat", "jacket", "thermal", "beanie", "gloves", "sunscreen", "sunglasses", "hat", "windbreaker", "scarf", "مظلة", "معطف مطر", "معطف", "سترة شتوية", "حرارية", "واقي", "نظارة شمسية", "قبعة", "سترة واقية", "شال"];
                                      
                                      // 1. Try to toggle custom packing item if it fits terms
                                      const foundCustom = customPackingItems.find(i => terms.some(t => i.text.toLowerCase().includes(t.toLowerCase())) && !i.checked);
                                      if (foundCustom) {
                                        handleToggleCustomItem(foundCustom.id);
                                        return;
                                      }

                                      // 2. Or toggle pre-generated default items
                                      let toggled = false;
                                      for (const cat of (enrichedItinerary?.customPackingList || [])) {
                                        for (const i of cat.items) {
                                          const itemKey = `${cat.category}-${i}`;
                                          if (terms.some(t => i.toLowerCase().includes(t.toLowerCase())) && !checkboxState[itemKey]) {
                                            toggleCheck(itemKey);
                                            toggled = true;
                                            break;
                                          }
                                        }
                                        if (toggled) break;
                                      }
                                    }}
                                    className="p-1 px-3 bg-emerald-600 border border-emerald-500/40 hover:bg-emerald-500 text-white font-black text-[10px] rounded-lg cursor-pointer transition-colors shrink-0"
                                  >
                                    {lang === "ar" ? "✓ تعبئة الآن" : "✓ Pack Now"}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrichedItinerary?.customPackingList.map((cat, cIdx) => {
                    const filteredItems = cat.items.filter(item => {
                      const itemKey = `${cat.category}-${item}`;
                      const isChecked = !!checkboxState[itemKey];
                      if (packingFilter === "packed") return isChecked;
                      if (packingFilter === "unpacked") return !isChecked;
                      return true;
                    });

                    const catTotal = cat.items.length;
                    const catChecked = cat.items.filter(item => !!checkboxState[`${cat.category}-${item}`]).length;
                    const isCatDone = catTotal > 0 && catChecked === catTotal;

                    if (filteredItems.length === 0 && packingFilter !== "all") return null;

                    return (
                      <div key={cIdx} className="space-y-3 p-4 bg-white border border-slate-100 shadow-3xs rounded-xl flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm bg-slate-50/50 border border-slate-100 px-3 py-1.5 rounded-lg flex items-center justify-between">
                            <span className="line-clamp-1">{cat.category}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 font-mono ${
                              isCatDone ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                            }`}>
                              {catChecked}/{catTotal}
                            </span>
                          </h4>
                          <ul className="space-y-2 mt-3">
                            {filteredItems.map((item, itemIdx) => {
                              const itemKey = `${cat.category}-${item}`;
                              const isChecked = !!checkboxState[itemKey];
                              return (
                                <li 
                                  key={itemIdx}
                                  onClick={() => toggleCheck(itemKey)}
                                  className="flex items-start gap-2.5 text-xs text-slate-605 font-semibold cursor-pointer py-1.5 hover:text-slate-900 transition-colors select-none"
                                >
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 mt-0.5 ${
                                    isChecked ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-200 hover:border-indigo-400"
                                  }`}>
                                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                  <span className={`${isChecked ? "line-through text-slate-400 font-medium" : "text-slate-705"} break-words`}>
                                    {item}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                    );
                  })}

                  {/* Render Custom Packing List Card */}
                  {(() => {
                    const filteredCustoms = customPackingItems.filter(item => {
                      if (packingFilter === "packed") return item.checked;
                      if (packingFilter === "unpacked") return !item.checked;
                      return true;
                    });

                    const customTotal = customPackingItems.length;
                    const customChecked = customPackingItems.filter(item => item.checked).length;
                    const isCustomDone = customTotal > 0 && customChecked === customTotal;

                    if (filteredCustoms.length === 0 && packingFilter !== "all" && customTotal === 0) return null;

                    return (
                      <div className="space-y-3 bg-slate-50/55 p-4 rounded-xl border border-slate-200/60 shadow-3xs flex flex-col justify-between">
                        <div className="space-y-3">
                          <h4 className="font-bold text-indigo-750 text-sm bg-indigo-50/60 px-3 py-1.5 rounded-lg flex items-center justify-between border border-indigo-100/50">
                            <span>{lang === "ar" ? "🎒 أمتعتي الشخصية الإضافية" : "🎒 My Custom Pack List"}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 font-mono ${
                              isCustomDone ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-white border border-slate-200/50 text-slate-700"
                            }`}>
                              {customChecked}/{customTotal}
                            </span>
                          </h4>

                          {filteredCustoms.length === 0 ? (
                            <p className="text-[10.5px] text-slate-450 italic py-5 text-center font-semibold leading-relaxed">
                              {packingFilter !== "all" 
                                ? (lang === "ar" ? "لا توجد مستلزمات مخصصة تطابق التصنيف" : "No custom items matching current filter")
                                : (lang === "ar" 
                                    ? "اكتب بالأسفل لإضافة مستلزمات مخصصة لحقيبتك لم يتم العثور عليها بالملخص التلقائي!" 
                                    : "Add specific gear, medication or gear references missing from the default plans!")}
                            </p>
                          ) : (
                            <ul className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                              {filteredCustoms.map((item) => (
                                <li 
                                  key={item.id}
                                  className="flex items-center justify-between group text-xs text-slate-650 font-semibold py-0.5"
                                >
                                  <div 
                                    onClick={() => handleToggleCustomItem(item.id)}
                                    className="flex items-center gap-2.5 cursor-pointer max-w-[85%] hover:text-slate-900 transition-colors select-none"
                                  >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                      item.checked ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-200"
                                    }`}>
                                      {item.checked && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                    <span className={`${item.checked ? "line-through text-slate-400 font-medium" : ""} break-all`}>
                                      {item.text}
                                    </span>
                                  </div>

                                  <button
                                    onClick={() => handleRemoveCustomItem(item.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-600 hover:bg-rose-50 text-slate-400 transition-all rounded-md cursor-pointer"
                                    title={lang === "ar" ? "حذف" : "Remove"}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {/* Input form element */}
                        <div className="pt-3 border-t border-slate-200/60 mt-1">
                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleAddCustomItem(newCustomItemText);
                            }}
                            className="flex items-center gap-1.5"
                          >
                            <input 
                              type="text"
                              value={newCustomItemText}
                              onChange={(e) => setNewCustomItemText(e.target.value)}
                              placeholder={lang === "ar" ? "مثال: شاحن، كتاب جيب..." : "umbrella, sunglasses..."}
                              className="flex-1 bg-white border border-slate-205 rounded-lg px-2 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-3xs"
                            />
                            <button
                              type="submit"
                              disabled={!newCustomItemText.trim()}
                              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white rounded-lg text-xs font-black transition-all flex items-center gap-1 shrink-0 shadow-sm cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{lang === "ar" ? "أضف" : "Add"}</span>
                            </button>
                          </form>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Add intelligent packing suggestions card */}
                  <div className="space-y-3 bg-indigo-50/20 p-4 rounded-xl border border-indigo-100 shadow-3xs flex flex-col justify-between">
                    <div className="space-y-3">
                      <h4 className="font-bold text-indigo-900 text-sm bg-indigo-100/60 px-3 py-1.5 rounded-lg flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                          {lang === "ar" ? "💡 اقتراحات التعبئة الذكية" : "💡 Smart packing suggestions"}
                        </span>
                        <span className="text-[10px] font-black text-indigo-700 bg-white border border-indigo-200/50 px-1.5 py-0.5 rounded-md font-mono">
                          {generateSmartSuggestions(activeItinerary, packingWeather).filter(s => !addedSuggestionIds[s.id]).length}
                        </span>
                      </h4>

                      <div className="p-2.5 bg-white border border-indigo-100/30 rounded-lg space-y-1">
                        <div className="text-[9px] font-black text-indigo-900 flex items-center gap-1 uppercase tracking-wider">
                          📋 {lang === "ar" ? "تفاصيل التحليل للرحلة:" : "DYNAMIC FORECAST ANALYSIS"}
                        </div>
                        <div className="text-[10px] text-slate-505 font-bold leading-normal">
                          {(() => {
                            const suggs = generateSmartSuggestions(activeItinerary, packingWeather);
                            const weatherCount = suggs.filter(s => s.type === "weather").length;
                            const activityCount = suggs.filter(s => s.type === "activity").length;
                            if (lang === "ar") {
                              return `تم اقتراح ${weatherCount} احتياجات طبقا للطقس، و ${activityCount} من الأنشطة بالبرنامج.`;
                            }
                            return `Suggested ${weatherCount} weather needs, and ${activityCount} custom activity gear matching the plan.`;
                          })()}
                        </div>
                      </div>

                      {generateSmartSuggestions(activeItinerary, packingWeather).filter(s => !addedSuggestionIds[s.id]).length === 0 ? (
                        <div className="text-center py-6 px-1 space-y-1 bg-white/50 rounded-lg border border-indigo-50/30 font-semibold text-xs leading-relaxed">
                          <Check className="w-6 h-6 text-emerald-500 mx-auto" />
                          <p className="text-[11px] text-emerald-700 font-extrabold">
                            {lang === "ar" ? "رائع! أضفت كافة الاقتراحات" : "All suggestions added!"}
                          </p>
                          <p className="text-[10.5px] text-slate-400 font-semibold">
                            {lang === "ar" ? "قائمة أمتعتك مهيأة بالكامل لرحلتك." : "Your travel checklist is fully optimized."}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                          {generateSmartSuggestions(activeItinerary, packingWeather)
                            .filter(s => !addedSuggestionIds[s.id])
                            .map((s) => (
                              <div 
                                key={s.id}
                                className="bg-white border border-slate-100 hover:border-indigo-100 rounded-lg p-2.5 space-y-1.5 transition-all shadow-3xs text-left"
                              >
                                <div className="flex items-start justify-between gap-1.5 font-sans">
                                  <div className="space-y-0.5">
                                    <span className="font-extrabold text-slate-950 text-[11px] block leading-snug">
                                      {lang === "ar" ? s.textAr : s.textEn}
                                    </span>
                                    <span className="text-[10.5px] text-slate-500 font-medium block leading-snug">
                                      {lang === "ar" ? s.reasonAr : s.reasonEn}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleAddSuggestion(s.id, lang === "ar" ? s.textAr : s.textEn)}
                                    className="p-1 text-indigo-600 bg-indigo-50 hover:bg-indigo-605 hover:text-white rounded-md shrink-0 transition-all shadow-3xs cursor-pointer border-0"
                                    title={lang === "ar" ? "أضف للقائمة" : "Add to list"}
                                  >
                                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`inline-block text-[9.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                    s.type === "weather" 
                                      ? "bg-amber-50 text-amber-700" 
                                      : "bg-blue-50 text-blue-700"
                                  }`}>
                                    {lang === "ar" ? s.categoryAr : s.categoryEn}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                    <div className="text-[9.5px] text-slate-400 font-bold italic text-center pt-2 border-t border-indigo-100/50 mt-1 leading-normal">
                      {lang === "ar" 
                        ? "تتم المزامنة تلقائياً بالـ LocalStorage" 
                        : "Synchronized dynamically via LocalStorage"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Google Maps Transit Simulator */}
              {activeItinerary.googleMapsSim && (
                <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-50 pb-4 gap-2">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Navigation className="w-5 h-5 text-indigo-600" />
                      <span>{lang === "ar" ? "خريطة موقع الإقامة والتنقل والمسافات" : "Google Maps Transit & Distance Guide"}</span>
                    </h3>
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-[11px] font-bold rounded-full">
                      <Car className="w-3.5 h-3.5" />
                      <span>{lang === "ar" ? "جاهز للتوجيه" : "Navigation Guidelines"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Accommodation card link */}
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 flex flex-col justify-between space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{lang === "ar" ? "مكان الإقامة المقترح" : "Lodging Recommendation"}</span>
                        <h4 className="text-sm font-extrabold text-slate-800 mt-1 flex items-center gap-1.5 leading-snug">
                          <Home className="w-4 h-4 text-indigo-500 shrink-0" />
                          {activeItinerary.googleMapsSim.accommodationName}
                        </h4>
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeItinerary.googleMapsSim.accommodationQuery)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-all w-fit cursor-pointer decoration-none border-0"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{lang === "ar" ? "موقع الإقامة على الخريطة" : "Show Accommodation Location"}</span>
                      </a>
                    </div>

                    {/* Landmark / Primary spot card link */}
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 flex flex-col justify-between space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{lang === "ar" ? "وجهة اليوم الأول الرئيسية" : "Day 1 Primary Landmark"}</span>
                        <h4 className="text-sm font-extrabold text-slate-800 mt-1 flex items-center gap-1.5 leading-snug">
                          <Compass className="w-4 h-4 text-indigo-500 shrink-0" />
                          {activeItinerary.googleMapsSim.primarySpotName}
                        </h4>
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeItinerary.googleMapsSim.primarySpotQuery)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-all w-fit cursor-pointer decoration-none border-0"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{lang === "ar" ? "موقع المعلم السياحي" : "Show Landmark Location"}</span>
                      </a>
                    </div>
                  </div>

                  {/* Distance and Transit application recommended */}
                  <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100/70 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-650">
                    <div className="space-y-1 bg-white/80 p-3 rounded-lg border border-indigo-100/30">
                      <span className="text-[10px] text-indigo-600 font-bold tracking-wider uppercase block">{lang === "ar" ? "المسافة بينهما" : "Inter-Distance"}</span>
                      <div className="text-slate-855 font-black text-sm flex items-center gap-1.5 mt-0.5 font-mono">
                        <Navigation className="w-4 h-4 text-indigo-500 shrink-0" />
                        {activeItinerary.googleMapsSim.distanceKMText}
                      </div>
                    </div>

                    <div className="space-y-1 bg-white/80 p-3 rounded-lg border border-indigo-100/30">
                      <span className="text-[10px] text-indigo-600 font-bold tracking-wider uppercase block">{lang === "ar" ? "تطبيقات النقل العاملة" : "Local Ride-hailing App"}</span>
                      <div className="text-indigo-950 font-extrabold text-xs flex items-center gap-1.5 mt-0.5">
                        <Car className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span>{activeItinerary.googleMapsSim.recommendedTaxiApp}</span>
                      </div>
                    </div>

                    <div className="space-y-1 bg-white/80 p-3 rounded-lg border border-indigo-100/30">
                      <span className="text-[10px] text-indigo-600 font-bold tracking-wider uppercase block">{lang === "ar" ? "تكلفة التوصيلة التقريبية" : "Est. Ride Fare"}</span>
                      <div className="text-emerald-700 font-extrabold text-xs flex items-center gap-1.5 mt-0.5 font-mono">
                        <span>{activeItinerary.googleMapsSim.taxiFareEstimateLocal}</span>
                      </div>
                    </div>
                  </div>

                  {/* Transit advice step-by-step description */}
                  <div className="text-xs bg-slate-50/70 rounded-xl p-3.5 border border-slate-100 space-y-1">
                    <strong className="text-slate-700 block mb-1">{lang === "ar" ? "دليل التنقل ووسائل النقل المحلية والبرية:" : "Local Commuting & Ground Transport Info:"}</strong>
                    <p className="text-slate-650 leading-relaxed font-medium">
                      {activeItinerary.googleMapsSim.transitAdviceStep}
                    </p>
                  </div>
                </div>
              )}

              {/* Estimated Inter-state Transit Schedules timetables */}
              {activeItinerary.estimatedTransitSchedules && activeItinerary.estimatedTransitSchedules.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
                  <div className="flex items-center gap-2 border-b border-indigo-50 pb-4">
                    <Car className="w-5 h-5 text-indigo-600 animate-bounce" />
                    <h3 className="text-lg font-bold text-slate-800">
                      {lang === "ar" ? "🚌 المواعيد التقريبية لانطلاق وسائل السفر باليوم والساعة" : "🚌 Approximate Domestic Travel Departures & Timetables"}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeItinerary.estimatedTransitSchedules.map((schedule, idx) => (
                      <div key={idx} className="bg-slate-50/45 p-4 rounded-xl border border-slate-100 hover:border-indigo-150 transition-all space-y-3">
                        <div className="flex justify-between items-center gap-2 border-b border-slate-100 pb-2">
                          <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5 animate-none">
                            <Navigation className="w-4 h-4 text-indigo-500" />
                            {schedule.transportMethod}
                          </span>
                        </div>
                        <div className="space-y-1.5 text-xs font-semibold text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{lang === "ar" ? "وقت الانطلاق التقديري:" : "Departure Time:"} {schedule.departureDayTime}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{lang === "ar" ? "المحطة المحددة:" : "Station/Terminal:"} {schedule.stationName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-indigo-700">
                            <strong>{lang === "ar" ? "التكرار والتكلفة:" : "Frequency & Cost:"}</strong>
                            <span>{schedule.frequencyAndPrice}</span>
                          </div>
                          {schedule.contactPhone && (
                            <div className="flex items-center gap-1.5 text-emerald-850">
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{lang === "ar" ? "هاتف الاستعلام:" : "Inquiry Phone:"} {schedule.contactPhone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Administrative / Medical Mission Guidelines */}
              {activeItinerary.administrativeMissionDetails && activeItinerary.administrativeMissionDetails.destinationsList && activeItinerary.administrativeMissionDetails.destinationsList.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
                  <div className="flex items-center gap-2 border-b border-rose-50 pb-4">
                    <ShieldCheck className="w-5 h-5 text-rose-600 animate-pulse" />
                    <h3 className="text-lg font-bold text-slate-800">
                      {lang === "ar" ? "💼 تفاصيل المهمة وتوجيهات الإشراف الإداري / العلاجي" : "💼 Administrative & Patient Mission Workflow Guide"}
                    </h3>
                  </div>

                  {activeItinerary.administrativeMissionDetails.missionOverview && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs md:text-sm text-slate-700 leading-relaxed font-semibold">
                      <strong className="text-slate-900 block mb-1">{lang === "ar" ? "نظرة عامة على سير المهمة:" : "Mission Workflow Overview:"}</strong>
                      {activeItinerary.administrativeMissionDetails.missionOverview}
                    </div>
                  )}

                  <div className="space-y-4">
                    {activeItinerary.administrativeMissionDetails.destinationsList.map((dest, dIdx) => (
                      <div key={dIdx} className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:border-indigo-100 transition-all space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-50 pb-2.5">
                          <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 leading-tight animate-none">
                            <MapPin className="w-4 h-4 text-rose-500" />
                            {dest.name}
                          </h4>
                          <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 text-[11px] font-bold rounded-full">
                            🕒 {lang === "ar" ? "وقت الانتظار المتوقع:" : "Est. Wait Time:"} {dest.estimatedQueueTime}
                          </span>
                        </div>

                        {/* Phone and Address Contact Info block */}
                        {(dest.phoneNumber || dest.address) && (
                          <div className="flex flex-wrap gap-4 text-xs font-semibold bg-rose-50/20 p-2.5 rounded-lg border border-rose-100 text-slate-700">
                            {dest.phoneNumber && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span>{lang === "ar" ? "الهاتف:" : "Phone:"} {dest.phoneNumber}</span>
                              </div>
                            )}
                            {dest.address && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span>{lang === "ar" ? "العنوان:" : "Address:"} {dest.address}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                           <div className="space-y-1 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                             <strong className="text-slate-800 block">{lang === "ar" ? "🤖 توجيهات التنقل الذكي والوصول:" : "🤖 Smart Route Guide:"}</strong>
                             <p className="text-slate-600 font-medium leading-relaxed mt-1">{dest.transitAdvice}</p>
                           </div>
                           <div className="space-y-1 bg-indigo-50/30 p-3 rounded-lg border border-indigo-100/30">
                             <strong className="text-indigo-950 block">📄 {lang === "ar" ? "الأوراق والمستندات الثبوتية المطلوبة:" : "Required Documents & Clearances:"}</strong>
                             <ul className="list-disc ps-4 mt-1.5 space-y-1 text-slate-600 font-semibold">
                               {dest.documentsRequired.map((doc, docIdx) => (
                                 <li key={docIdx}>{doc}</li>
                               ))}
                             </ul>
                           </div>
                        </div>

                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dest.googleMapsQuery || dest.name)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="py-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs inline-flex items-center gap-1.5 transition-all w-fit cursor-pointer decoration-none border-0 mt-1"
                        >
                          <Locate className="w-3.5 h-3.5" />
                          <span>{lang === "ar" ? "افتح موقع الإدارة/المستشفى على قوقل ماب" : "Open Target Location on Google Maps"}</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Local Convenience Utilities adjacent to Destination */}
              {activeItinerary.nearbyPlacesAndUtilities && (
                <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
                  <div className="flex items-center gap-2 border-b border-indigo-50 pb-4">
                    <Utensils className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-bold text-slate-800">
                      {lang === "ar" ? "📍 الخدمات والمرافق الأساسية القريبة من إقامتك ومقر الزيارة" : "📍 Nearby Facilities, Restaurants & Essential Places"}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cafes & Restaurants */}
                    {activeItinerary.nearbyPlacesAndUtilities.restaurantsAndCafes && activeItinerary.nearbyPlacesAndUtilities.restaurantsAndCafes.length > 0 && (
                      <div className="bg-amber-50/20 p-5 rounded-xl border border-amber-100/60 space-y-4">
                        <h4 className="font-extrabold text-amber-900 text-sm flex items-center gap-1.5">
                          <Utensils className="w-4 h-4 text-amber-600" />
                          {lang === "ar" ? "🍽️ مطاعم ومقاهي واستراحات قريبة شعبية" : "🍽️ Nearby Restaurants, Cafes & Stops"}
                        </h4>
                        <div className="space-y-2.5">
                          {activeItinerary.nearbyPlacesAndUtilities.restaurantsAndCafes.map((item, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-amber-100/30 shadow-xs space-y-2">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <span className="font-bold text-xs text-slate-800 block">{item.name}</span>
                                  <span className="text-[10px] bg-amber-50 text-amber-805 px-1.5 py-0.5 rounded mt-1 inline-block font-semibold">{item.type}</span>
                                </div>
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.googleMapsQuery)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-indigo-600 hover:underline font-bold"
                                >
                                  🗺️ {lang === "ar" ? "الخارطة" : "Map"}
                                </a>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">{item.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mosques & Restrooms */}
                    {activeItinerary.nearbyPlacesAndUtilities.mosquesAndRestrooms && activeItinerary.nearbyPlacesAndUtilities.mosquesAndRestrooms.length > 0 && (
                      <div className="bg-emerald-50/20 p-5 rounded-xl border border-emerald-100/60 space-y-4">
                        <h4 className="font-extrabold text-emerald-900 text-sm flex items-center gap-1.5">
                          <Navigation className="w-4 h-4 text-emerald-600" />
                          {lang === "ar" ? "🕌 مساجد ودورات مياه مخصصة لأوقات الصلاة" : "🕌 Nearby Mosques & Public Restrooms"}
                        </h4>
                        <div className="space-y-2.5">
                          {activeItinerary.nearbyPlacesAndUtilities.mosquesAndRestrooms.map((item, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-emerald-100/30 shadow-xs space-y-2">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <span className="font-bold text-xs text-slate-800 block">{item.name}</span>
                                  {item.hasPublicRestroom ? (
                                    <span className="text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded mt-1 inline-block font-bold">🚽 {lang === "ar" ? "تشمل دورة مياه عمومية" : "equipped restroom"}</span>
                                  ) : (
                                    <span className="text-[10px] bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded mt-1 inline-block font-semibold">{lang === "ar" ? "مسجد فقط" : "mosque space"}</span>
                                  )}
                                </div>
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.googleMapsQuery)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-indigo-600 hover:underline font-bold"
                                >
                                  🗺️ {lang === "ar" ? "الخارطة" : "Map"}
                                </a>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">ℹ️ {item.prayerTimesTransitAdvice}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Medical Resources (Pharmacies / Labs / Clinics) */}
                    {activeItinerary.nearbyPlacesAndUtilities.medicalServices && activeItinerary.nearbyPlacesAndUtilities.medicalServices.length > 0 && (
                      <div className="bg-rose-50/20 p-5 rounded-xl border border-rose-100/60 space-y-4">
                        <h4 className="font-extrabold text-rose-900 text-sm flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-rose-600" />
                           {lang === "ar" ? "🏥 صيدليات قريبة، مخابر طبية وعيادات طوارئ" : "🏥 Nearby Pharmacies, Labs & Medical Aid"}
                        </h4>
                        <div className="space-y-2.5">
                          {activeItinerary.nearbyPlacesAndUtilities.medicalServices.map((item, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-rose-100/30 shadow-xs space-y-2">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <span className="font-bold text-xs text-slate-800 block">{item.name}</span>
                                  <span className="text-[10px] bg-rose-50 text-rose-800 px-1.5 py-0.5 rounded mt-1 inline-block font-bold">{item.type}</span>
                                </div>
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.googleMapsQuery)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-indigo-600 hover:underline font-bold"
                                >
                                  🗺️ {lang === "ar" ? "الخارطة" : "Map"}
                                </a>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">{item.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Alternative Inn Lodges / Motels */}
                    {activeItinerary.nearbyPlacesAndUtilities.nearbyAlternativeLodgings && activeItinerary.nearbyPlacesAndUtilities.nearbyAlternativeLodgings.length > 0 && (
                      <div className="bg-indigo-50/20 p-5 rounded-xl border border-indigo-100/60 space-y-4">
                        <h4 className="font-extrabold text-indigo-900 text-sm flex items-center gap-1.5">
                          <Home className="w-4 h-4 text-indigo-600" />
                          {lang === "ar" ? "🏠 مراقد بديلة، لوكاندات فنادق شعبية أو شقق" : "🏠 Nearby Alternative Inns, Motels & Rooms"}
                        </h4>
                        <div className="space-y-2.5">
                          {activeItinerary.nearbyPlacesAndUtilities.nearbyAlternativeLodgings.map((item, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-indigo-100/30 shadow-xs space-y-2">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <span className="font-bold text-xs text-slate-800 block">{item.name}</span>
                                  <span className="text-[10px] bg-indigo-50/50 text-indigo-805 px-1.5 py-0.5 rounded mt-1 inline-block font-semibold">{item.type}</span>
                                </div>
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.googleMapsQuery)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-indigo-600 hover:underline font-bold"
                                >
                                  🗺️ {lang === "ar" ? "الخارطة" : "Map"}
                                </a>
                              </div>
                              <div className="text-[10px] text-emerald-700 font-mono font-bold">
                                {lang === "ar" ? "التكلفة التقديرية:" : "Est. Cost:"} {item.priceEstimateLocal}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Official Printing & Kiosks */}
                    {activeItinerary.nearbyPlacesAndUtilities.businessAndPrintingServices && activeItinerary.nearbyPlacesAndUtilities.businessAndPrintingServices.length > 0 && (
                      <div className="bg-indigo-50/20 p-5 rounded-xl border border-indigo-100/60 space-y-4">
                        <h4 className="font-extrabold text-indigo-900 text-sm flex items-center gap-1.5">
                          <Printer className="w-4 h-4 text-indigo-600" />
                          {lang === "ar" ? "📠 محلات الطباعة، الأكشاك، والمكتبات للأعمال" : "📠 Printing Shops, Kiosks & Stationery Offices"}
                        </h4>
                        <div className="space-y-2.5">
                          {activeItinerary.nearbyPlacesAndUtilities.businessAndPrintingServices.map((item, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-indigo-100/30 shadow-xs space-y-2">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <span className="font-bold text-xs text-slate-800 block">{item.name}</span>
                                  <span className="text-[10px] bg-indigo-50/50 text-indigo-800 px-1.5 py-0.5 rounded mt-1 inline-block font-semibold">{item.type}</span>
                                </div>
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.googleMapsQuery)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-indigo-600 hover:underline font-bold"
                                >
                                  🗺️ {lang === "ar" ? "الخارطة" : "Map"}
                                </a>
                              </div>
                              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                                {item.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Popular Markets & Local Cuisine Explorer */}
              {((activeItinerary.localTraditionalCuisine && activeItinerary.localTraditionalCuisine.length > 0) || 
                (activeItinerary.popularMarketsAndSouks && activeItinerary.popularMarketsAndSouks.length > 0)) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Traditional Delicacies */}
                  {activeItinerary.localTraditionalCuisine && activeItinerary.localTraditionalCuisine.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
                      <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
                        <Utensils className="w-5 h-5 text-amber-500 shrink-0" />
                        <span>{lang === "ar" ? "الأكلات والأطباق الشعبية الشهيرة" : "Famous Traditional Dishes"}</span>
                      </h3>
                      <div className="space-y-3.5">
                        {activeItinerary.localTraditionalCuisine.map((dish, dIdx) => (
                          <div key={dIdx} className="bg-amber-50/30 rounded-xl p-3.5 border border-amber-100/30 space-y-1">
                            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                              <span className="text-sm">🍲</span>
                              {dish.name}
                            </h4>
                            <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                              {dish.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Traditional Markets and Souks */}
                  {activeItinerary.popularMarketsAndSouks && activeItinerary.popularMarketsAndSouks.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
                      <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
                        <Store className="w-5 h-5 text-indigo-500 shrink-0" />
                        <span>{lang === "ar" ? "الأسواق والمراقد والساحات العريقة" : "Traditional Souks & Markets"}</span>
                      </h3>
                      <div className="space-y-3.5">
                        {activeItinerary.popularMarketsAndSouks.map((souk, sIdx) => (
                          <div key={sIdx} className="bg-indigo-50/10 rounded-xl p-3.5 border border-indigo-100/30 space-y-1">
                            <div className="flex justify-between items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                                <span className="text-sm">👜</span>
                                {souk.name}
                              </h4>
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[9px] font-bold uppercase tracking-wider whitespace-nowrap">
                                {souk.type}
                              </span>
                            </div>
                            <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                              {souk.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Hotel booking and check-in specifications */}
              {activeItinerary.bookingRequirements && activeItinerary.bookingRequirements.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-4">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{lang === "ar" ? "متطلبات الحجز واللوائح التنظيمية للإقامة" : "Lodging Regulations & Check-in Rules"}</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeItinerary.bookingRequirements.map((req, rIdx) => (
                      <div key={rIdx} className="flex gap-2.5 p-3 rounded-xl bg-slate-50/60 border border-slate-100">
                        <div className="p-1 rounded bg-emerald-50 text-emerald-600 h-fit mt-0.5 shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className="text-xs font-semibold text-slate-600 leading-relaxed">
                          {req}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hidden Print-Only Comprehensive Travel Invoice Itinerary Document */}
              {typeof document !== "undefined" && createPortal(
                <div id="printable-itinerary-invoice-format" className="hidden print:block text-slate-900 bg-white p-6 space-y-6 text-xs leading-relaxed font-sans" dir={lang === "ar" ? "rtl" : "ltr"}>
                
                {/* PDF Branded Header with Logo and QR Code */}
                <div className="border-b-2 border-slate-900 pb-5 flex items-center justify-between gap-4" style={{ pageBreakInside: "avoid" }}>
                  <div className="flex items-center gap-4">
                    {/* Branded Logo representation */}
                    <div className="p-1 border-2 border-slate-950 rounded-xl bg-slate-50">
                      <svg viewBox="0 0 100 100" className="w-14 h-14 text-slate-950 shrink-0 select-none">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2.5" />
                        <circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                        <path d="M25 65 L45 38 L60 55 L75 30 L85 65 Z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M42 22 C46 18 54 18 58 22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M48 26 L52 26 M50 24 L50 28" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </div>
                    <div className="text-start">
                      <div className="text-base font-black tracking-tight text-slate-950 uppercase leading-none">
                        {lang === "ar" ? "وكالة فسحة ديزاد للسياحة" : "Fos7a DZ Travel Agency"}
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold mt-1">
                        {lang === "ar" ? "مخطط وبوابة الرحلات السياحية الذكية الشاملة" : "Premium Intelligent Travel & Agency Logistics"}
                      </div>
                      <div className="text-[9px] text-slate-400 font-medium mt-0.5 leading-none">
                        Lic: #9507-AR-DZ | Customer support: contact@fos7a-agency.dz
                      </div>
                    </div>
                  </div>

                  {/* Document Title Stamp */}
                  <div className="hidden sm:block text-center px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50">
                    <span className="text-[9px] tracking-wider text-slate-500 font-extrabold uppercase leading-none block">
                      {lang === "ar" ? "نوع الوثيقة" : "Document Class"}
                    </span>
                    <span className="text-xs font-black text-rose-600 uppercase block mt-1">
                      {lang === "ar" ? "مخطط سياحي معتمد" : "Validated Itinerary"}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                      REF: F7-2026-{(activeItinerary?.destinationName || "DZ").substring(0,3).toUpperCase()}-{Math.floor(1000 + Math.random() * 9000)}
                    </span>
                  </div>

                  {/* High fidelity QR Code placeholder */}
                  <div className="flex flex-col items-center justify-center p-1.5 border-2 border-slate-950 rounded-xl bg-white shrink-0 select-none" style={{ width: "88px", height: "88px" }}>
                    <svg viewBox="0 0 100 100" className="w-14 h-14 text-slate-950">
                      <rect x="5" y="5" width="25" height="25" fill="currentColor" />
                      <rect x="9" y="9" width="17" height="17" fill="white" />
                      <rect x="13" y="13" width="9" height="9" fill="currentColor" />
                      
                      <rect x="70" y="5" width="25" height="25" fill="currentColor" />
                      <rect x="74" y="9" width="17" height="17" fill="white" />
                      <rect x="78" y="13" width="9" height="9" fill="currentColor" />
                      
                      <rect x="5" y="70" width="25" height="25" fill="currentColor" />
                      <rect x="9" y="74" width="17" height="17" fill="white" />
                      <rect x="13" y="78" width="9" height="9" fill="currentColor" />
                      
                      <rect x="35" y="5" width="6" height="6" fill="currentColor" />
                      <rect x="45" y="8" width="6" height="12" fill="currentColor" />
                      <rect x="55" y="5" width="10" height="6" fill="currentColor" />
                      <rect x="35" y="18" width="12" height="6" fill="currentColor" />
                      <rect x="52" y="15" width="6" height="12" fill="currentColor" />
                      
                      <rect x="5" y="38" width="12" height="6" fill="currentColor" />
                      <rect x="22" y="35" width="6" height="12" fill="currentColor" />
                      <rect x="34" y="34" width="18" height="6" fill="currentColor" />
                      <rect x="58" y="38" width="6" height="18" fill="currentColor" />
                      <rect x="70" y="35" width="12" height="6" fill="currentColor" />
                      <rect x="85" y="38" width="10" height="6" fill="currentColor" />
                      
                      <rect x="5" y="52" width="6" height="12" fill="currentColor" />
                      <rect x="18" y="55" width="12" height="6" fill="currentColor" />
                      <rect x="35" y="48" width="6" height="18" fill="currentColor" />
                      <rect x="48" y="52" width="12" height="6" fill="currentColor" />
                      <rect x="75" y="48" width="6" height="18" fill="currentColor" />
                      <rect x="88" y="52" width="7" height="10" fill="currentColor" />
                      
                      <rect x="35" y="70" width="6" height="12" fill="currentColor" />
                      <rect x="48" y="75" width="18" height="6" fill="currentColor" />
                      <rect x="38" y="86" width="12" height="6" fill="currentColor" />
                      <rect x="55" y="84" width="8" height="12" fill="currentColor" />
                      <rect x="70" y="78" width="12" height="6" fill="currentColor" />
                      <rect x="85" y="74" width="10" height="12" fill="currentColor" />
                    </svg>
                    <span className="text-[7.5px] font-black tracking-tight text-slate-900 uppercase mt-1 leading-none text-center">
                      {lang === "ar" ? "مسح ضوئي" : "FOS7A.DZ"}
                    </span>
                  </div>
                </div>

                {/* Subtitle / date metadata strip */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold border-b border-slate-100 pb-2 -mt-3" style={{ pageBreakInside: "avoid" }}>
                  <div className="text-start">
                    {lang === "ar" ? "وثيقة البرنامج السياحي الرسمي المعتمد والمصدر إلكترونياً" : "Official digital travel planning itinerary validated and approved by the travel desk"}
                  </div>
                  <div className="text-start">
                    {lang === "ar" ? "تاريخ الإصدار:" : "Issue Date:"} <span className="font-mono text-slate-800">{new Date().toLocaleDateString(lang === "ar" ? "ar-DZ" : "en-US")}</span>
                  </div>
                </div>

                {/* Trip Overview Metadata Box */}
                <div className="border-2 border-slate-900 rounded-xl p-4 bg-slate-50 space-y-3" style={{ pageBreakInside: "avoid" }}>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <div className="text-[11px] font-black text-slate-900 tracking-wider flex items-center gap-1.5 uppercase">
                      🗺️ {lang === "ar" ? "ملخص بيانات الرحلة المعتمدة" : "OFFICIAL TRIP OVERVIEW METADATA"}
                    </div>
                    <div className="text-[9px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md uppercase">
                      {lang === "ar" ? "حالة المستند: مؤكد" : "Status: Active & Confirmed"}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold leading-normal">
                    {/* Destination & Origin */}
                    <div className="space-y-1 p-2.5 bg-white rounded-lg border border-slate-100 shadow-3xs flex items-start gap-2.5">
                      <div className="p-1.5 bg-rose-50 text-rose-600 rounded-md shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 font-extrabold block uppercase tracking-wider">
                          {lang === "ar" ? "الوجهة المستهدفة" : "Destination"}
                        </span>
                        <span className="font-black text-slate-900 block leading-tight mt-0.5 text-[11px]">
                          {activeItinerary.destinationName}, {activeItinerary.country}
                        </span>
                        <span className="text-[9.5px] font-bold text-slate-500 block leading-none mt-1">
                          {lang === "ar" ? "من:" : "From:"} {activeItinerary.originWilaya || originWilaya}
                        </span>
                      </div>
                    </div>

                    {/* Duration & Departure Date */}
                    <div className="space-y-1 p-2.5 bg-white rounded-lg border border-slate-100 shadow-3xs flex items-start gap-2.5">
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md shrink-0 mt-0.5">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 font-extrabold block uppercase tracking-wider">
                          {lang === "ar" ? "مدة الرحلة والجدولة" : "Trip Duration"}
                        </span>
                        <span className="font-black text-slate-900 block leading-tight mt-0.5 text-[11px]">
                          {activeItinerary.tripDurationDays} {lang === "ar" ? "أيام" : "Days"}
                        </span>
                        <span className="text-[9.5px] font-mono text-slate-500 block leading-none mt-1">
                          {activeItinerary.departureDate || departureDate}
                        </span>
                      </div>
                    </div>

                    {/* Traveler Count */}
                    <div className="space-y-1 p-2.5 bg-white rounded-lg border border-slate-100 shadow-3xs flex items-start gap-2.5">
                      <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md shrink-0 mt-0.5">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 font-extrabold block uppercase tracking-wider">
                          {lang === "ar" ? "عدد المسافرين" : "Traveler Count"}
                        </span>
                        <span className="font-black text-slate-900 block leading-tight mt-0.5 text-[11px]">
                          {(() => {
                            const type = activeItinerary.travelerType || travelerType || "Couple";
                            if (type.toLowerCase().includes("solo")) return lang === "ar" ? "فرد واحد (1)" : "Solo Traveler (1)";
                            if (type.toLowerCase().includes("couple")) return lang === "ar" ? "زوجين (2)" : "Couple (2 Travelers)";
                            if (type.toLowerCase().includes("family")) return lang === "ar" ? "عائلة (4+ أفراد)" : "Family (4+ Travelers)";
                            if (type.toLowerCase().includes("friends")) return lang === "ar" ? "أصدقاء (3+ أفراد)" : "Friends (3+ Travelers)";
                            return type;
                          })()}
                        </span>
                      </div>
                    </div>

                    {/* Total Budget Column */}
                    <div className="space-y-1 p-2.5 bg-white rounded-lg border border-slate-100 shadow-3xs flex items-start gap-2.5">
                      <div className="p-1.5 bg-amber-50 text-amber-600 rounded-md shrink-0 mt-0.5">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 font-extrabold block uppercase tracking-wider">
                          {lang === "ar" ? "الميزانية الإجمالية" : "Total Budget"}
                        </span>
                        <span className="font-black text-slate-900 block leading-tight mt-0.5 text-[11px]">
                          {(() => {
                            const amount = activeItinerary.allocatedBudgetAmount || allocatedBudgetAmount;
                            const level = activeItinerary.targetBudgetLevel || budget;
                            if (amount) {
                              return `${amount} (${level === "Economy" ? (lang === "ar" ? "اقتصادي" : "Eco") : level === "Moderate" ? (lang === "ar" ? "معتدل" : "Mod") : (lang === "ar" ? "فاخر" : "Lux")})`;
                            }
                            return level === "Economy" 
                              ? (lang === "ar" ? "ميزانية اقتصادية" : "Economy Budget")
                              : level === "Moderate" 
                                ? (lang === "ar" ? "ميزانية معتدلة" : "Moderate Budget")
                                : (lang === "ar" ? "ميزانية فاخرة" : "Luxury Budget");
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const originName = activeItinerary.originWilaya || originWilaya || (lang === "ar" ? "نقطة الانطلاق" : "Departure Origin");
                    const destName = activeItinerary.destinationName;

                    // Gather unique stops/locations
                    const stops: string[] = [originName];

                    // Add major spot
                    if (activeItinerary.googleMapsSim?.accommodationName) {
                      stops.push(activeItinerary.googleMapsSim.accommodationName);
                    } else if (activeItinerary.googleMapsSim?.primarySpotName) {
                      stops.push(activeItinerary.googleMapsSim.primarySpotName);
                    }

                    // Add some unique day themes/destinations
                    if (activeItinerary.days && activeItinerary.days.length > 0) {
                      activeItinerary.days.forEach(d => {
                        let candidate = "";
                        if (d.theme && d.theme.length < 25) {
                          candidate = d.theme.split(/[،,-]/)[0].trim();
                        } else if (d.activities && d.activities.length > 0) {
                          candidate = d.activities[0].locationName || d.activities[0].title;
                        }
                        if (candidate && !stops.includes(candidate)) {
                          stops.push(candidate);
                        }
                      });
                    }

                    if (!stops.includes(destName)) {
                      stops.push(destName);
                    }

                    // Slice to max 5 stops
                    const routeStops = stops.filter(Boolean).slice(0, 5);

                    const getCoordinates = (index: number, total: number) => {
                      const width = 600; // Optimal blueprint width
                      const height = 150;
                      const paddingX = 50;
                      const x = paddingX + (index * (width - 2 * paddingX)) / (total - 1 || 1);
                      let y = 75;
                      if (total === 2) {
                        y = index === 0 ? 110 : 45;
                      } else if (total === 3) {
                        const yVals = [110, 45, 100];
                        y = yVals[index] || 75;
                      } else if (total === 4) {
                        const yVals = [110, 45, 105, 50];
                        y = yVals[index] || 75;
                      } else {
                        const yVals = [115, 50, 110, 45, 105];
                        y = yVals[index] || 75;
                      }
                      return { x, y };
                    };

                    const points = routeStops.map((stop, index) => {
                      const { x, y } = getCoordinates(index, routeStops.length);
                      return { label: stop, x, y };
                    });

                    // Build quadratic/cubic curve connection line
                    let pathD = "";
                    if (points.length > 0) {
                      pathD = `M ${points[0].x} ${points[0].y}`;
                      for (let i = 1; i < points.length; i++) {
                        const prev = points[i - 1];
                        const curr = points[i];
                        const cpX1 = prev.x + (curr.x - prev.x) / 2;
                        const cpY1 = prev.y;
                        const cpX2 = prev.x + (curr.x - prev.x) / 2;
                        const cpY2 = curr.y;
                        pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
                      }
                    }

                    const formatLabel = (lbl: string) => {
                      if (!lbl) return "";
                      if (lbl.length > 18) return lbl.substring(0, 16) + "..";
                      return lbl;
                    };

                    return (
                      <div className="border border-slate-200 rounded-xl bg-white p-3.5 space-y-3" style={{ pageBreakInside: "avoid" }}>
                        <div className="flex items-center justify-between text-[10px] font-black text-slate-900 border-b border-slate-100 pb-1.5 uppercase tracking-wider text-start">
                          <span className="flex items-center gap-1.5">
                            🗺️ {lang === "ar" ? "الخريطة التخطيطية لمسار الرحلة والمحطات الرئيسية" : "STYLIZED ROUTE PATH & TRANSIT WAYPOINTS MAP"}
                          </span>
                          <span className="text-slate-400 font-bold uppercase text-[8px]">
                            {lang === "ar" ? "رسم بياني تخطيطي للمسار" : "indicative topological scale"}
                          </span>
                        </div>

                        <div className="relative bg-slate-950 rounded-lg overflow-hidden border border-slate-900">
                          <svg viewBox="0 0 600 150" className="w-full h-auto text-white select-none">
                            {/* SVG Defs for patterns and shadows */}
                            <defs>
                              <pattern id="printMapGrid" width="25" height="25" patternUnits="userSpaceOnUse">
                                <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                              </pattern>
                              <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.4" />
                              </filter>
                            </defs>
                            <rect width="100%" height="100%" fill="#0B1329" />
                            <rect width="100%" height="100%" fill="url(#printMapGrid)" />

                            {/* Topographic line designs */}
                            <path d="M-50,130 Q100,90 250,110 T550,120 T800,100" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="2" />
                            <path d="M-55,140 Q110,110 270,120 T580,100" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1.5" />

                            {/* Stylized compass rose */}
                            <g transform="translate(565, 30)" className="text-slate-500 opacity-85">
                              <circle cx="0" cy="0" r="12" fill="none" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 2" />
                              <line x1="0" y1="-15" x2="0" y2="15" stroke="currentColor" strokeWidth="0.75" />
                              <line x1="-15" y1="0" x2="15" y2="0" stroke="currentColor" strokeWidth="0.75" />
                              <polygon points="0,-15 -3.5,-4 0,-1" fill="#F43F5E" />
                              <polygon points="0,-15 3.5,-4 0,-1" fill="#E11D48" />
                              <text x="0" y="-18" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="currentColor">N</text>
                            </g>

                            {/* Scale bar indicator */}
                            <g transform="translate(20, 132)" className="text-slate-500 opacity-85">
                              <line x1="0" y1="0" x2="50" y2="0" stroke="currentColor" strokeWidth="1.5" />
                              <line x1="0" y1="-3" x2="0" y2="3" stroke="currentColor" strokeWidth="0.75" />
                              <line x1="25" y1="-2" x2="25" y2="2" stroke="currentColor" strokeWidth="0.75" />
                              <line x1="50" y1="-3" x2="50" y2="3" stroke="currentColor" strokeWidth="0.75" />
                              <text x="58" y="3" textAnchor="start" fontSize="6" fontWeight="bold" fill="currentColor" className="font-mono tracking-wider">
                                {lang === "ar" ? "رسم بياني توضيحي للمسار" : "INDICATIVE TOPOLOGICAL PATH"}
                              </text>
                            </g>

                            {/* Main connection route path shadow layer */}
                            {pathD && (
                              <path 
                                d={pathD} 
                                fill="none" 
                                stroke="rgba(99, 102, 241, 0.25)" 
                                strokeWidth="5" 
                                strokeLinecap="round" 
                              />
                            )}

                            {/* Main connection route path line */}
                            {pathD && (
                              <path 
                                d={pathD} 
                                fill="none" 
                                stroke="#6366F1" 
                                strokeWidth="2" 
                                strokeDasharray="4 3" 
                                strokeLinecap="round" 
                              />
                            )}

                            {/* Draw each waypoint node marker */}
                            {points.map((p, idx) => {
                              const isFirst = idx === 0;
                              const isLast = idx === points.length - 1;
                              const labelDy = p.y < 80 ? -14 : 22;

                              return (
                                <g key={idx} transform={`translate(${p.x}, ${p.y})`} filter="url(#nodeShadow)">
                                  {/* Pulsing visual halo */}
                                  <circle 
                                    cx="0" 
                                    cy="0" 
                                    r={isFirst || isLast ? 9 : 7} 
                                    fill={isFirst ? "rgba(244, 63, 94, 0.15)" : isLast ? "rgba(16, 185, 129, 0.15)" : "rgba(99, 102, 241, 0.15)"} 
                                    stroke={isFirst ? "rgba(244, 63, 94, 0.3)" : isLast ? "rgba(16, 185, 129, 0.3)" : "rgba(99, 102, 241, 0.3)"}
                                    strokeWidth="1"
                                  />

                                  {/* Border solid background */}
                                  <circle 
                                    cx="0" 
                                    cy="0" 
                                    r={isFirst || isLast ? 6 : 4.5} 
                                    fill="#ffffff" 
                                    stroke={isFirst ? "#F43F5E" : isLast ? "#10B981" : "#6366F1"} 
                                    strokeWidth="2" 
                                  />

                                  {/* Center core point */}
                                  <circle 
                                    cx="0" 
                                    cy="0" 
                                    r={isFirst || isLast ? 2.5 : 1.5} 
                                    fill={isFirst ? "#F43F5E" : isLast ? "#10B981" : "#6366F1"} 
                                  />

                                  {/* Label Text string */}
                                  <text
                                    x="0"
                                    y={labelDy}
                                    textAnchor="middle"
                                    fontSize="8"
                                    fontWeight="900"
                                    fill="#FFFFFF"
                                    className="font-sans antialiased"
                                    style={{ textShadow: "0px 1px 3px rgba(0,0,0,0.95)" }}
                                  >
                                    {formatLabel(p.label)}
                                  </text>

                                  {/* Order indicator sub-label text */}
                                  <text
                                    x="0"
                                    y={labelDy + (p.y < 80 ? -8.5 : 8.5)}
                                    textAnchor="middle"
                                    fontSize="6"
                                    fontWeight="bold"
                                    fill="#94A3B8"
                                    className="font-mono uppercase tracking-widest"
                                    style={{ textShadow: "0px 1px 2px rgba(0,0,0,0.9)" }}
                                  >
                                    {isFirst 
                                      ? (lang === "ar" ? "[البداية]" : "START") 
                                      : isLast 
                                        ? (lang === "ar" ? "[الوجهة]" : "DEST") 
                                        : `${lang === "ar" ? "المحطة" : "STOP"} 0${idx}`}
                                  </text>
                                </g>
                              );
                            })}
                          </svg>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Selected Flight (If any) */}
                {selectedFlight && (
                  <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2" style={{ pageBreakInside: "avoid" }}>
                    <div className="font-bold text-slate-800 border-b border-slate-100 pb-1 flex items-center gap-1">
                      🎫 {lang === "ar" ? "عرض رحلة الطيران المحددة للرحلة" : "Selected Flight Reservation Details"}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500">{lang === "ar" ? "الخطوط الناقلة:" : "Airlines Airline:"}</span>
                        <div className="font-bold text-slate-800">{selectedFlight.airline} ({selectedFlight.flightNumber})</div>
                      </div>
                      <div>
                        <span className="text-slate-500">{lang === "ar" ? "المواعيد والمدة:" : "Departure & Duration:"}</span>
                        <div className="font-bold text-slate-800">{selectedFlight.departureTime} &rarr; {selectedFlight.arrivalTime} ({selectedFlight.duration})</div>
                      </div>
                      <div>
                        <span className="text-slate-500">{lang === "ar" ? "فئة السفر والأمتعة:" : "Cabin & Baggage ALLOWANCE:"}</span>
                        <div className="font-bold text-slate-800">{selectedFlight.luggageDetail || "Included standard bag"}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Hotel (If any) */}
                {selectedHotel && (
                  <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2" style={{ pageBreakInside: "avoid" }}>
                    <div className="font-bold text-slate-800 border-b border-slate-100 pb-1 flex items-center gap-1">
                      🏨 {lang === "ar" ? "مكان الإقامة والإقامة الأساسية المؤكدة" : "Selected Accommodation Coordinates"}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500">{lang === "ar" ? "الفندق والإقامة:" : "Hotel Name:"}</span>
                        <div className="font-bold text-slate-800">{selectedHotel.name} ({selectedHotel.stars} ★)</div>
                      </div>
                      <div>
                        <span className="text-slate-500">{lang === "ar" ? "العنوان والتفاصيل:" : "Location Address:"}</span>
                        <div className="font-bold text-slate-800">{selectedHotel.address}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">{lang === "ar" ? "نوع الغرفة والوجبات:" : "Selected Stay Class:"}</span>
                        <div className="font-bold text-slate-800">{selectedHotel.roomType || "Standard Suite"}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Printable Day-by-day sequence */}
                <div className="space-y-4">
                  <div className="text-sm font-black text-slate-900 border-b border-slate-350 pb-1 uppercase">
                    📅 {lang === "ar" ? "تفاصيل الجدول الزمني اليومي الكامل للرحلة" : "Day-by-Day Comprehensive Schedule"}
                  </div>
                  <div className="print-days-grid">
                    {activeItinerary.days.map((day) => (
                      <div key={day.dayNumber} className="border border-slate-200 rounded-xl p-4 space-y-2 bg-slate-50/50/50" style={{ pageBreakInside: "avoid" }}>
                        <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                          <span className="font-extrabold text-slate-900 text-[11px]">
                            {lang === "ar" ? `اليوم ${day.dayNumber}: ${day.theme}` : `Day ${day.dayNumber}: ${day.theme}`}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:grid-cols-2">
                          {day.activities.map((act, aIdx) => {
                            const computedTags = getActivityTags(act.title, act.description);
                            return (
                              <div key={aIdx} className="bg-white p-2.5 border border-slate-200/80 rounded-lg text-[11px] grid grid-cols-12 gap-2 border-s-2 border-indigo-500 ps-2.5 hover:shadow-2xs transition-shadow">
                                <div className="col-span-4 font-bold text-slate-600 flex items-start gap-1">
                                  <span className="pt-0.5">🕒</span>
                                  <div>
                                    <div>{act.timeOfDay}</div>
                                    <div className="text-[9px] text-slate-400 font-medium">({act.durationHours}h)</div>
                                  </div>
                                </div>
                                <div className="col-span-8 flex flex-col justify-between space-y-1">
                                  <div>
                                    <div className="font-extrabold text-slate-800">{act.title} - {act.locationName}</div>
                                    {computedTags.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1 mb-1">
                                        {computedTags.map((tag) => (
                                          <span
                                            key={tag.id}
                                            className={`px-1.5 py-0.5 rounded-md text-[8.5px] font-black border flex items-center gap-1 ${tag.bgStyle} ${tag.borderStyle} ${tag.textStyle}`}
                                          >
                                            <span>{tag.emoji}</span>
                                            <span>{lang === "ar" ? tag.labelAr : tag.labelEn}</span>
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    <p className="text-slate-500 text-[10px] leading-relaxed mt-1 font-medium">{act.description}</p>
                                  </div>
                                  {act.estimatedCostUSD > 0 && (
                                    <div className="pt-1.5 border-t border-slate-100 mt-1">
                                      <span className="text-indigo-650 font-bold text-[9px]">
                                        💰 {lang === "ar" ? `التكلفة التقديرية: ${formatPrice(act.estimatedCostUSD)}` : `Est Value: ${formatPrice(act.estimatedCostUSD)}`}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Packing List & Essential tips */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="border border-slate-250 p-3 rounded-lg space-y-2" style={{ pageBreakInside: "avoid" }}>
                    <div className="font-bold text-slate-800 border-b border-slate-100 pb-1">🧳 {lang === "ar" ? "قائمة الأمتعة المقترحة" : "Custom Smart Packing Guide"}</div>
                    <ul className="list-disc list-inside space-y-1 text-[10px]">
                      {(enrichedItinerary?.customPackingList || []).slice(0, 3).map((item, index) => (
                        <li key={index} className="text-slate-650 font-semibold leading-relaxed">
                          <span className="font-bold text-slate-800">{item.category}:</span> {item.items.slice(0, 3).join(", ")}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border border-slate-250 p-3 rounded-lg space-y-2" style={{ pageBreakInside: "avoid" }}>
                    <div className="font-bold text-slate-800 border-b border-slate-100 pb-1">💡 {lang === "ar" ? "أهم التوجيهات المحلية للرحلة" : "Crucial Local Guidance Checks"}</div>
                    <ul className="list-decimal list-inside space-y-1 text-[10px]">
                      {activeItinerary.localTravelTips.slice(0, 4).map((tip, index) => (
                        <li key={index} className="text-slate-650 font-semibold leading-relaxed truncate">{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Printable dynamic packing list checklists */}
                {(enrichedItinerary?.customPackingList && enrichedItinerary.customPackingList.length > 0) && (
                  <div className="border border-slate-250 p-3.5 rounded-xl space-y-2.5 mt-2" style={{ pageBreakInside: "avoid" }}>
                    <div className="font-extrabold text-slate-900 border-b border-slate-350 pb-1 flex items-center justify-between gap-1.5 uppercase text-[10.5px]">
                      <span className="flex items-center gap-1.5 truncate">
                        🧳 {lang === "ar" ? "مربعات التعبئة والتحضير للمسافر (يدوية/للطباعة)" : "TRAVELER PACKING CHECKLISTS (PRINT & CHECK CHECKS)"}
                      </span>
                      <button
                        type="button"
                        onClick={handleTriggerAiAdditions}
                        disabled={packingAiLoading}
                        className="print:hidden px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-extrabold flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50 shrink-0 select-none shadow-3xs uppercase text-right sm:text-left"
                      >
                        {packingAiLoading ? (
                          <>
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping shrink-0" />
                            {lang === "ar" ? "جاري ترشيح..." : "Analyzing..."}
                          </>
                        ) : (
                          <>
                            ✨ {lang === "ar" ? "إضافات AI ذكية" : "AI Additions"}
                          </>
                        )}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-start">
                      {enrichedItinerary.customPackingList.map((cat, cIdx) => (
                        <div key={cIdx} className="space-y-1.5">
                          <div className="font-bold text-slate-800 border-b border-slate-150 pb-0.5 text-[10px]">
                            {cat.category}
                          </div>
                          <div className="space-y-1">
                            {cat.items.map((item, iIdx) => (
                              <div key={iIdx} className="flex items-center gap-1.5 text-[9px] text-slate-650 font-semibold">
                                <span className="w-3 h-3 border border-slate-400 rounded-sm inline-block shrink-0" />
                                <span className="truncate">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="text-center pt-4 border-t border-slate-200 text-[10px] text-slate-400 font-medium">
                  {lang === "ar"
                    ? "تمنياتنا لكم برحلة سعيدة وممتعة وآمنة. للاستفسارات تواصلوا مع فسحة DZ هاتفياً أو عبر واتساب +213662212484."
                    : "We wish you a magnificent safe journey. For support, reach out via WhatsApp at +213662212484."}
                </div>
              </div>,
              document.body
            )}
          </motion.div>
        )}

      {/* Dynamic Copied and Share Modal Trigger Block */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShareModalOpen(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-150 overflow-hidden text-start flex flex-col max-h-[90vh]"
              style={{ direction: lang === "ar" ? "rtl" : "ltr" }}
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-950 tracking-tight text-base">
                      {lang === "ar" ? "مشاركة برنامج الرحلة" : "Share Itinerary Plan"}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                      {lang === "ar" ? "أرسل تفاصيل برنامجك مباشرة لعائلتك وأصدقائك" : "Send trip details directly to your family and friends"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6 overflow-y-auto">
                {/* Boarding-Pass Mock QR Card */}
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 rounded-2xl p-5 border border-slate-800 text-white relative overflow-hidden shadow-lg">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  {/* Top Header details */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 text-white/50 text-[10px] font-bold tracking-widest uppercase">
                    <span>{lang === "ar" ? "تذكرة المسافر الذكية" : "AI VOYAGE BOARDING CARD"}</span>
                    <span className="text-amber-400 font-black">{activeItinerary?.tripDurationDays} {lang === "ar" ? "أيام" : "Days"}</span>
                  </div>

                  {/* Route overview */}
                  <div className="flex items-center justify-between py-4">
                    <div className="space-y-1">
                      <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">{lang === "ar" ? "موقع الانطلاق" : "ORIGIN"}</span>
                      <div className="text-sm font-black text-white truncate max-w-[145px]">
                        {activeItinerary?.originWilaya ? activeItinerary.originWilaya.split(" (")[0] : (lang === "ar" ? "المنطلق" : "Depart")}
                      </div>
                    </div>

                    {/* Flight arrow track connector */}
                    <div className="flex-1 flex flex-col items-center justify-center px-4 relative">
                      <div className="w-full border-t border-dashed border-white/30 relative flex items-center justify-center">
                        <div className="absolute bg-indigo-800 text-white rounded-full p-1 -top-3.5 scale-90">
                          <Plane className="w-3.5 h-3.5 rotate-45" />
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold mt-1.5 uppercase tracking-widest">{activeItinerary?.transitMode || "Plane"}</span>
                    </div>

                    <div className="space-y-1 text-end">
                      <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">{lang === "ar" ? "الوجهة المقصودة" : "DESTINATION"}</span>
                      <div className="text-sm font-black text-white truncate max-w-[145px]">
                        {activeItinerary?.destinationName}
                      </div>
                    </div>
                  </div>

                  {/* QR details & micro metadata */}
                  <div className="flex items-center gap-4 bg-white/5 p-3.5 rounded-xl border border-white/5 mt-2">
                    {/* Simulated SVG QR Code */}
                    <div className="w-16 h-16 bg-white rounded-lg p-1 shrink-0 flex items-center justify-center border border-indigo-400/20">
                      <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
                        {/* Eye anchors */}
                        <rect x="5" y="5" width="25" height="25" fill="currentColor" />
                        <rect x="10" y="10" width="15" height="15" fill="white" />
                        <rect x="13" y="13" width="9" height="9" fill="currentColor" />

                        <rect x="70" y="5" width="25" height="25" fill="currentColor" />
                        <rect x="75" y="10" width="15" height="15" fill="white" />
                        <rect x="78" y="13" width="9" height="9" fill="currentColor" />

                        <rect x="5" y="70" width="25" height="25" fill="currentColor" />
                        <rect x="10" y="75" width="15" height="15" fill="white" />
                        <rect x="13" y="78" width="9" height="9" fill="currentColor" />

                        {/* QR content lines & particles */}
                        <rect x="35" y="5" width="10" height="5" fill="currentColor" />
                        <rect x="50" y="5" width="5" height="15" fill="currentColor" />
                        <rect x="60" y="10" width="5" height="5" fill="currentColor" />
                        <rect x="35" y="15" width="10" height="10" fill="currentColor" />
                        
                        <rect x="35" y="35" width="10" height="5" fill="currentColor" />
                        <rect x="50" y="30" width="5" height="15" fill="currentColor" />
                        <rect x="60" y="40" width="15" height="5" fill="currentColor" />
                        <rect x="5" y="45" width="10" height="5" fill="currentColor" />
                        <rect x="20" y="45" width="5" height="10" fill="currentColor" />
                        <rect x="15" y="55" width="15" height="5" fill="currentColor" />

                        <rect x="35" y="55" width="20" height="10" fill="currentColor" />
                        <rect x="60" y="55" width="5" height="10" fill="currentColor" />
                        <rect x="70" y="45" width="10" height="15" fill="currentColor" />
                        <rect x="85" y="35" width="10" height="25" fill="currentColor" />

                        <rect x="35" y="75" width="5" height="20" fill="currentColor" />
                        <rect x="45" y="75" width="15" height="5" fill="currentColor" />
                        <rect x="65" y="75" width="10" height="20" fill="currentColor" />
                        <rect x="80" y="70" width="15" height="10" fill="currentColor" />
                        <rect x="80" y="85" width="5" height="10" fill="currentColor" />
                        <rect x="90" y="85" width="5" height="10" fill="currentColor" />
                      </svg>
                    </div>

                    <div className="flex-1 space-y-1 text-xs">
                      <div className="font-extrabold text-white">
                        {lang === "ar" ? "مسافر ذكي • بوابة التخطيط" : "Elite Smart Voyage Blueprint"}
                      </div>
                      <div className="text-[10px] text-slate-350 leading-normal font-semibold">
                        {lang === "ar" 
                          ? "افتح الكود مع الرمز لمشاركة المسافرين الآخرين معك ومزامنة رحلتك ثنائياً" 
                          : "Scan the digital stamp barcode to share itinerary parameters with co-travelers."}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Copy Link Field */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    {lang === "ar" ? "رابط المشاركة المباشر" : "Direct Share Link"}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={(() => {
                        if (!activeItinerary) return "";
                        const base = window.location.origin + window.location.pathname;
                        const params = new URLSearchParams();
                        params.set("destination", activeItinerary.destinationName || "");
                        params.set("days", (activeItinerary.tripDurationDays || 1).toString());
                        if (activeItinerary.originWilaya) {
                          params.set("origin", activeItinerary.originWilaya);
                        }
                        return `${base}?${params.toString()}`;
                      })()}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-600 font-mono tracking-tight select-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const urlText = (() => {
                          if (!activeItinerary) return "";
                          const base = window.location.origin + window.location.pathname;
                          const params = new URLSearchParams();
                          params.set("destination", activeItinerary.destinationName || "");
                          params.set("days", (activeItinerary.tripDurationDays || 1).toString());
                          if (activeItinerary.originWilaya) {
                            params.set("origin", activeItinerary.originWilaya);
                          }
                          return `${base}?${params.toString()}`;
                        })();
                        navigator.clipboard.writeText(urlText);
                        setCopySuccess(true);
                        setTimeout(() => setCopySuccess(false), 2000);
                      }}
                      className={`px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                        copySuccess 
                          ? "bg-emerald-500 text-white" 
                          : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
                      }`}
                    >
                      {copySuccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copySuccess ? (lang === "ar" ? "نسخ!" : "Copied!") : (lang === "ar" ? "نسخ" : "Copy")}</span>
                    </button>
                  </div>
                </div>

                {/* Social Share grid */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    {lang === "ar" ? "المشاركة المباشرة عبر الشبكات" : "Direct Social Transmission"}
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* WhatsApp */}
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                        (lang === "ar" 
                          ? `تفقد برنامج رحلتي الرائع إلى ${activeItinerary?.destinationName} المخطط بالذكاء الاصطناعي: ` 
                          : `Check out my incredible AI-generated travel schedule to ${activeItinerary?.destinationName}: `) + (() => {
                          if (!activeItinerary) return "";
                          const base = window.location.origin + window.location.pathname;
                          const params = new URLSearchParams();
                          params.set("destination", activeItinerary.destinationName || "");
                          params.set("days", (activeItinerary.tripDurationDays || 1).toString());
                          if (activeItinerary.originWilaya) {
                            params.set("origin", activeItinerary.originWilaya);
                          }
                          return `${base}?${params.toString()}`;
                        })()
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-3 rounded-xl border border-emerald-100 bg-emerald-50 hover:bg-emerald-110 text-emerald-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                    >
                      <span className="text-base select-none">💬</span>
                      <span>WhatsApp</span>
                    </a>

                    {/* Twitter/X */}
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                        (lang === "ar" 
                          ? `برنامجي السياحي والترفيهي إلى ${activeItinerary?.destinationName} عبر الذكاء الاصطناعي ✨ ` 
                          : `My amazing AI holiday plan to ${activeItinerary?.destinationName} ✨ `) + (() => {
                          if (!activeItinerary) return "";
                          const base = window.location.origin + window.location.pathname;
                          const params = new URLSearchParams();
                          params.set("destination", activeItinerary.destinationName || "");
                          params.set("days", (activeItinerary.tripDurationDays || 1).toString());
                          if (activeItinerary.originWilaya) {
                            params.set("origin", activeItinerary.originWilaya);
                          }
                          return `${base}?${params.toString()}`;
                        })()
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-3 rounded-xl border border-slate-850 bg-slate-900 hover:bg-slate-805 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                    >
                      <span className="text-sm select-none">𝕏</span>
                      <span>Twitter / X</span>
                    </a>

                    {/* Telegram */}
                    <a
                      href={`https://t.me/share/url?url=${encodeURIComponent((() => {
                        if (!activeItinerary) return "";
                        const base = window.location.origin + window.location.pathname;
                        const params = new URLSearchParams();
                        params.set("destination", activeItinerary.destinationName || "");
                        params.set("days", (activeItinerary.tripDurationDays || 1).toString());
                        if (activeItinerary.originWilaya) {
                          params.set("origin", activeItinerary.originWilaya);
                        }
                        return `${base}?${params.toString()}`;
                      })())}&text=${encodeURIComponent(
                        lang === "ar" 
                          ? `برنامجي السياحي الذكي إلى ${activeItinerary?.destinationName}` 
                          : `AI Travel Plan to ${activeItinerary?.destinationName}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-3 rounded-xl border border-sky-100 bg-sky-50 hover:bg-sky-110 text-sky-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                    >
                      <span className="text-base select-none">✈️</span>
                      <span>Telegram</span>
                    </a>

                    {/* Email */}
                    <a
                      href={`mailto:?subject=${encodeURIComponent(
                        lang === "ar" 
                          ? `خطة رحلة ترفيهية ممتازة إلى ${activeItinerary?.destinationName}` 
                          : `Magnificent travel itinerary schedule to ${activeItinerary?.destinationName}`
                      )}&body=${encodeURIComponent(
                        (lang === "ar" 
                          ? `مرحباً! أود مشاركة خطة السفر الذكية والمفصلة لرحلتنا القادمة إلى ${activeItinerary?.destinationName} معكم. تصفحوا الخطة بالكامل عبر الرابط: ` 
                          : `Hello! Check out this complete beautiful schedule for our upcoming trip to ${activeItinerary?.destinationName}. Feel free to explore it here: `) + (() => {
                          if (!activeItinerary) return "";
                          const base = window.location.origin + window.location.pathname;
                          const params = new URLSearchParams();
                          params.set("destination", activeItinerary.destinationName || "");
                          params.set("days", (activeItinerary.tripDurationDays || 1).toString());
                          if (activeItinerary.originWilaya) {
                            params.set("origin", activeItinerary.originWilaya);
                          }
                          return `${base}?${params.toString()}`;
                        })()
                      )}`}
                      className="px-4 py-3 rounded-xl border border-slate-150 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                    >
                      <span className="select-none">✉️</span>
                      <span>{lang === "ar" ? "البريد الإلكتروني" : "Email Message"}</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Status footer bar */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-black tracking-widest uppercase">
                🔒 {lang === "ar" ? "تخطيط ترفيهي مرن وسهل وموثوق • فسحة دبي" : "SECURED CONNECTION • FOS7A TRAVEL BOARD"}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Simulated UI Pop-up Notification Stack */}
      <div className="fixed bottom-5 right-5 z-[99999] max-w-sm w-full space-y-3 pointer-events-none p-4">
        <AnimatePresence>
          {activeSimulatedAlerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-slate-900 border border-slate-700 text-white shadow-2xl rounded-2xl p-4 pointer-events-auto flex gap-3 relative overflow-hidden backdrop-blur-md"
            >
              {/* Accent glow line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-indigo-500 to-pink-500" />
              
              <div className="bg-indigo-600/15 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-indigo-500/20 text-indigo-400 mt-1">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              
              <div className="space-y-2 flex-1 text-left bg-transparent">
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-[10px] font-black tracking-wider text-amber-400 uppercase">
                      {lang === "ar" ? "⏰ تذكير باقتراب موعد الفعالية" : "⏰ Upcoming Activity Reminder"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSimulatedAlerts(prev => prev.filter(a => a.id !== alert.id));
                      }}
                      className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h5 className="font-extrabold text-[12.5px] leading-snug text-slate-50 mt-0.5">
                    {alert.title}
                  </h5>
                  <p className="text-[10px] text-slate-400 font-semibold italic flex items-center gap-1 mt-0.5">
                    <span>📍 {alert.location}</span>
                    <span>•</span>
                    <span className="text-slate-300 font-bold">{alert.timeOfDay} ({alert.durationHours}h)</span>
                  </p>
                </div>
                
                <p className="text-[10.5px] text-slate-300 leading-relaxed font-semibold">
                  {alert.description}
                </p>

                {alert.simulatedActionStatus && (
                  <div className="bg-emerald-950/80 text-emerald-400 text-[10px] font-bold py-1.5 px-2.5 rounded-xl border border-emerald-500/20 mt-2 flex items-center gap-1.5 leading-normal animate-pulse">
                    <span>🗺️</span>
                    <span>
                      {lang === "ar" 
                        ? `جاري محاكاة الخريطة: تم تفعيل توجيهات المسار بنجاح إلى ${alert.location}!`
                        : `Simulating Map: GPS route details successfully generated for ${alert.location}!`}
                    </span>
                  </div>
                )}
                
                <div className="flex gap-2 pt-1 border-t border-slate-800/60 mt-2">
                  <button
                    type="button"
                    disabled={!!alert.simulatedActionStatus}
                    onClick={() => {
                      // Update simulated status
                      setActiveSimulatedAlerts(prev => prev.map(a => {
                        if (a.id === alert.id) {
                          return { ...a, simulatedActionStatus: "active" };
                        }
                        return a;
                      }));
                      // Auto dismiss after 4 seconds
                      setTimeout(() => {
                        setActiveSimulatedAlerts(prev => prev.filter(a => a.id !== alert.id));
                      }, 4000);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-[9px] px-2.5 py-1.5 rounded-lg border border-indigo-500/20 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>{lang === "ar" ? "محاكاة خريطة المسار" : "Simulate Map"}</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSimulatedAlerts(prev => prev.filter(a => a.id !== alert.id));
                      const key = `${alert.dayNumber}-${alert.activityIdx}`;
                      setNotificationConfigs(prev => ({
                        ...prev,
                        [key]: {
                          active: true,
                          countdown: 5
                        }
                      }));
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[9px] px-2 py-1.5 rounded-lg border border-slate-700 transition-all cursor-pointer"
                  >
                    {lang === "ar" ? "غفوة 5ث" : "Snooze 5s"}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSimulatedAlerts(prev => prev.filter(a => a.id !== alert.id));
                    }}
                    className="text-slate-400 hover:text-white font-semibold text-[9px] px-2 py-1.5 ml-auto cursor-pointer"
                  >
                    {lang === "ar" ? "تجاهل" : "Dismiss"}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <LandmarkTriviaModal
        isOpen={isTriviaModalOpen}
        onClose={() => setIsTriviaModalOpen(false)}
        landmarkName={selectedLandmarkForTrivia}
        lang={lang}
      />
    </div>
  );
}
