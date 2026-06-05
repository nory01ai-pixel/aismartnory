import React, { useState, useEffect, useMemo } from "react";
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  CloudLightning, 
  CloudDrizzle, 
  Thermometer, 
  Wind, 
  Droplets, 
  Umbrella, 
  Sparkles, 
  AlertCircle,
  Flame,
  Snowflake,
  AlertTriangle,
  ShieldAlert,
  Check,
  CheckCircle,
  RefreshCw,
  Clock
} from "lucide-react";
import { Itinerary } from "../types";

interface WeatherDay {
  date: string;
  dayName: string;
  maxTemp: number;
  minTemp: number;
  weatherCode: number;
  conditionLabel: string;
  precipitationProb?: number;
  precipitationSum?: number;
  windSpeed?: number;
  humidity?: number;
  uvIndex?: number;
  feelsLike?: number;
}

interface WeatherAlert {
  type: string;
  icon: React.ReactNode;
  tooltip: string;
  bgClass: string;
}

function getDailyWeatherAlert(day: WeatherDay, lang: "ar" | "en"): WeatherAlert | null {
  const isAr = lang === "ar";
  // Extreme heat >= 35°C
  if (day.maxTemp >= 35) {
    return {
      type: "heat",
      icon: <Flame className="w-3.5 h-3.5 text-orange-600 animate-pulse" />,
      tooltip: isAr ? "تحذير: حرارة مفرطة شديدة" : "Extreme Heat Warning",
      bgClass: "bg-orange-100/90 border-orange-300 text-orange-850"
    };
  }
  // Intense Cold <= 9°C
  if (day.minTemp <= 10) {
    return {
      type: "cold",
      icon: <Snowflake className="w-3.5 h-3.5 text-sky-600" />,
      tooltip: isAr ? "تحذير: أجواء شديدة البرودة" : "Extreme Cold Warning",
      bgClass: "bg-sky-100/90 border-sky-300 text-sky-850"
    };
  }
  // Heavy Rain >= 2.0mm
  if (day.precipitationSum && day.precipitationSum >= 2.0) {
    return {
      type: "rain",
      icon: <CloudRain className="w-3.5 h-3.5 text-blue-600 animate-bounce" />,
      tooltip: isAr ? "تحذير: أمطار غزيرة متوقعة" : "Heavy Rain Warning",
      bgClass: "bg-blue-100/90 border-blue-300 text-blue-850"
    };
  }
  // High Winds >= 20km/h
  if (day.windSpeed && day.windSpeed >= 20) {
    return {
      type: "wind",
      icon: <Wind className="w-3.5 h-3.5 text-slate-700" />,
      tooltip: isAr ? "تحذير: رياح قوية ونشطة" : "High Wind Warning",
      bgClass: "bg-slate-200/90 border-slate-350 text-slate-800"
    };
  }
  return null;
}

interface WeatherForecastCardProps {
  destinationName: string;
  lang: "ar" | "en";
  itinerary?: Itinerary;
}

// Map Open-Meteo weather codes to styling, labels and icons
function getWeatherInfo(code: number, lang: "ar" | "en") {
  const isAr = lang === "ar";
  
  if (code === 0) {
    return {
      icon: <Sun className="w-6 h-6 text-amber-500 animate-spin-slow" />,
      label: isAr ? "مشمس صافي" : "Sunny & Clear",
      colorClass: "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-100",
      bgGradient: "from-amber-50 to-orange-100/50",
      advType: "sunny"
    };
  }
  if ([1, 2, 3].includes(code)) {
    return {
      icon: <Cloud className="w-6 h-6 text-slate-400 animate-pulse" />,
      label: isAr ? "غائم جزئياً" : "Partly Cloudy",
      colorClass: "bg-slate-400/10 border-slate-400/30 text-slate-800 dark:text-slate-100",
      bgGradient: "from-slate-50 to-slate-150/50",
      advType: "warm"
    };
  }
  if ([45, 48].includes(code)) {
    return {
      icon: <Cloud className="w-6 h-6 text-slate-350" />,
      label: isAr ? "ضباب كثيف" : "Foggy",
      colorClass: "bg-slate-300/15 border-slate-300/40 text-slate-700",
      bgGradient: "from-slate-50 to-zinc-100",
      advType: "cool"
    };
  }
  if ([51, 53, 55].includes(code)) {
    return {
      icon: <CloudDrizzle className="w-6 h-6 text-sky-400" />,
      label: isAr ? "رذاذ مطر خفيف" : "Light Drizzle",
      colorClass: "bg-sky-400/10 border-sky-400/35 text-sky-900",
      bgGradient: "from-sky-50 to-blue-50/70",
      advType: "rainy"
    };
  }
  if ([61, 63, 65, 80, 81, 82].includes(code)) {
    return {
      icon: <CloudRain className="w-6 h-6 text-blue-500 animate-bounce" />,
      label: isAr ? "أمطار غزيرة" : "Rainy Showers",
      colorClass: "bg-blue-500/10 border-blue-500/35 text-blue-900",
      bgGradient: "from-blue-50 to-indigo-50",
      advType: "rainy"
    };
  }
  if ([71, 73, 75, 85, 86].includes(code)) {
    return {
      icon: <CloudSnow className="w-6 h-6 text-sky-300 animate-pulse" />,
      label: isAr ? "ثلوج باردة" : "Snowfall / Flurries",
      colorClass: "bg-sky-300/10 border-sky-300/35 text-sky-950",
      bgGradient: "from-sky-50 to-cyan-50",
      advType: "cold"
    };
  }
  if ([95, 96, 99].includes(code)) {
    return {
      icon: <CloudLightning className="w-6 h-6 text-violet-500" />,
      label: isAr ? "عواصف رعدية" : "Thunderstorms",
      colorClass: "bg-violet-500/10 border-violet-500/35 text-violet-950",
      bgGradient: "from-violet-50 to-indigo-100/50",
      advType: "rainy"
    };
  }

  // Default fallback
  return {
    icon: <Sun className="w-6 h-6 text-amber-500" />,
    label: isAr ? "معتدل مستقر" : "Mild & Calm",
    colorClass: "bg-slate-500/10 border-slate-500/30 text-slate-800",
    bgGradient: "from-slate-50 to-slate-100/50",
    advType: "warm"
  };
}

// Get regional weather template for Fallbacks
function generateRegionalFallback(city: string, lang: "ar" | "en"): WeatherDay[] {
  const isAr = lang === "ar";
  const nameLower = city.toLowerCase();
  
  // Decide climate zone
  let zone: "desert" | "mountain" | "coastal" = "coastal";
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
    nameLower.includes("tiaret")
  ) {
    zone = "mountain";
  }

  const daysOfWeekEn = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const daysOfWeekAr = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
  
  const weatherList: WeatherDay[] = [];
  const baseDate = new Date();

  for (let i = 0; i < 7; i++) {
    const currentDay = new Date();
    currentDay.setDate(baseDate.getDate() + i);
    
    const dayName = isAr 
      ? daysOfWeekAr[currentDay.getDay()] 
      : daysOfWeekEn[currentDay.getDay()];
      
    const dateFormatted = currentDay.toISOString().split("T")[0];

    let maxTemp = 24;
    let minTemp = 14;
    let weatherCode = 1; // Partly cloudy as default
    let windSpeed = 12;
    let precipitationSum = 0;
    let humidity = 60;
    let uvIndex = 6.0;
    let feelsLike = 24;

    if (zone === "desert") {
      // Hot, sunny, high wind / sand drift chances
      maxTemp = 36 + (i % 3) - (i % 2);
      minTemp = 21 + (i % 2);
      weatherCode = 0; // Completely sunny
      windSpeed = 18 + (i * 2) % 10;
      precipitationSum = 0;
      humidity = 20 + (i % 3) * 5;
      uvIndex = 9.5 - (i % 2) * 0.5;
      feelsLike = maxTemp + 2;
    } else if (zone === "mountain") {
      // Cooler, crisp, some cloud/drizzle
      maxTemp = 19 - (i % 2) * 2;
      minTemp = 9 + (i % 3);
      weatherCode = i === 3 || i === 4 ? 61 : 3; // Occasional rain on day 3-4
      windSpeed = 15 + (i % 2) * 5;
      precipitationSum = i === 3 || i === 4 ? 2.5 : 0;
      humidity = 65 + (i % 3) * 6;
      uvIndex = 4.5 - (i % 2) * 0.8;
      feelsLike = maxTemp - 1;
    } else {
      // Coastal standard mild
      maxTemp = 24 + (i % 2);
      minTemp = 15;
      weatherCode = i === 5 ? 51 : 2; // Part cloudy, slight drizzle on day 5
      windSpeed = 11;
      precipitationSum = i === 5 ? 0.8 : 0;
      humidity = 60 + (i % 4) * 4;
      uvIndex = 6.8 - (i % 2) * 0.4;
      feelsLike = maxTemp;
    }

    const { label } = getWeatherInfo(weatherCode, lang);

    weatherList.push({
      date: dateFormatted,
      dayName,
      maxTemp,
      minTemp,
      weatherCode,
      conditionLabel: label,
      precipitationProb: precipitationSum > 0 ? 55 : 5,
      precipitationSum,
      windSpeed,
      humidity,
      uvIndex,
      feelsLike
    });
  }

  return weatherList;
}

export default function WeatherForecastCard({ destinationName, lang, itinerary }: WeatherForecastCardProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [weatherData, setWeatherData] = useState<WeatherDay[]>([]);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);

  const [simulatedAlertMode, setSimulatedAlertMode] = useState<"none" | "flood" | "sandstorm" | "heatwave" | "blizzard">("none");
  const [dismissedAlert, setDismissedAlert] = useState<boolean>(false);
  const [autoAdjustApplied, setAutoAdjustApplied] = useState<boolean>(false);

  // Reset dismissed/applied alert state when scenario changes
  useEffect(() => {
    setDismissedAlert(false);
    setAutoAdjustApplied(false);
  }, [simulatedAlertMode]);

  const derivedWeatherData = useMemo(() => {
    if (weatherData.length === 0) return [];
    
    // Copy the original data
    const list = weatherData.map(d => ({ ...d }));
    
    // Day index mappings (0 is Day 1, 1 is Day 2, etc.)
    if (simulatedAlertMode === "flood" && list.length >= 3) {
      if (list[1]) {
        list[1].weatherCode = 95;
        list[1].maxTemp = 13;
        list[1].minTemp = 8;
        list[1].precipitationSum = 28.5;
        list[1].precipitationProb = 95;
        list[1].conditionLabel = lang === "ar" ? "سيول جارفة وصواعق" : "Severe Torrential Storms";
      }
      if (list[2]) {
        list[2].weatherCode = 65;
        list[2].maxTemp = 14;
        list[2].minTemp = 9;
        list[2].precipitationSum = 16.2;
        list[2].precipitationProb = 85;
        list[2].conditionLabel = lang === "ar" ? "أمطار غزيرة مستمرة" : "Heavy Rain Waters";
      }
    } else if (simulatedAlertMode === "sandstorm" && list.length >= 2) {
      if (list[0]) {
        list[0].weatherCode = 45;
        list[0].windSpeed = 48;
        list[0].conditionLabel = lang === "ar" ? "عاصفة رملية صحراوية عاتية" : "Severe Sahara Sandstorm";
      }
      if (list[1]) {
        list[1].weatherCode = 45;
        list[1].windSpeed = 35;
        list[1].conditionLabel = lang === "ar" ? "عواصف ترابية معلقة" : "Heavy Dust & Wind Fogs";
      }
    } else if (simulatedAlertMode === "heatwave" && list.length >= 4) {
      if (list[2]) {
        list[2].weatherCode = 0;
        list[2].maxTemp = 45;
        list[2].minTemp = 29;
        list[2].uvIndex = 11;
        list[2].conditionLabel = lang === "ar" ? "موجة حر قاسية حارقة" : "Scorching Desert Heatwave";
      }
      if (list[3]) {
        list[3].weatherCode = 0;
        list[3].maxTemp = 43;
        list[3].minTemp = 28;
        list[3].uvIndex = 11;
        list[3].conditionLabel = lang === "ar" ? "حرارة لاهبة شديدة" : "Severe Scorching Sun";
      }
    } else if (simulatedAlertMode === "blizzard" && list.length >= 4) {
      if (list[1]) {
        list[1].weatherCode = 75;
        list[1].maxTemp = 2;
        list[1].minTemp = -3;
        list[1].conditionLabel = lang === "ar" ? "عاصفة ثلجية جليدية قاسية" : "Freezing Peak Blizzard";
      }
      if (list[3]) {
        list[3].weatherCode = 51;
        list[3].maxTemp = 4;
        list[3].minTemp = -1;
        list[3].conditionLabel = lang === "ar" ? "صقيع وضباب متجمد" : "Freezing Sleet & Ice fogs";
      }
    }

    return list;
  }, [weatherData, simulatedAlertMode, lang]);

  const activeSevereAlerts = useMemo(() => {
    const alerts: { 
      dayNum: number; 
      date: string; 
      type: "flood" | "sandstorm" | "heatwave" | "blizzard" | "rain" | "wind" | "heat" | "cold"; 
      titleAr: string; 
      titleEn: string; 
      descAr: string; 
      descEn: string;
      originalActivityTitles: string[];
      adjustmentsAr: string[];
      adjustmentsEn: string[];
    }[] = [];

    derivedWeatherData.forEach((day, idx) => {
      const dayNum = idx + 1;
      const isSimulated = simulatedAlertMode !== "none";

      const isFlood = (simulatedAlertMode === "flood" && (dayNum === 2 || dayNum === 3)) || 
                      (!isSimulated && day.precipitationSum && day.precipitationSum >= 10.0);
      
      const isSandstorm = (simulatedAlertMode === "sandstorm" && (dayNum === 1 || dayNum === 2)) ||
                          (!isSimulated && day.windSpeed && day.windSpeed >= 30);

      const isHeatwave = (simulatedAlertMode === "heatwave" && (dayNum === 3 || dayNum === 4)) ||
                         (!isSimulated && day.maxTemp >= 40);

      const isBlizzard = (simulatedAlertMode === "blizzard" && (dayNum === 2 || dayNum === 4)) ||
                         (!isSimulated && day.minTemp <= 1);

      const isHeavyRain = !isFlood && (day.precipitationSum && day.precipitationSum >= 6.0);
      const isHighWind = !isSandstorm && (day.windSpeed && day.windSpeed >= 23);

      let detectedType: typeof alerts[0]["type"] | null = null;
      let titleAr = "";
      let titleEn = "";
      let descAr = "";
      let descEn = "";
      let adjustmentsAr: string[] = [];
      let adjustmentsEn: string[] = [];

      if (isFlood) {
        detectedType = "flood";
        titleAr = "⚠️ تحذير: عواصف رعدية وسيول طوفانية جارفة";
        titleEn = "⚠️ ALERT: Flash Floods & Torrential High-Risk Storms";
        descAr = `من المتوقع هطول أمطار غزيرة غير مسبوقة تراكمية قدرها ${day.precipitationSum || 25} ملم؛ تشكل خطراً بالغاً على الوديان والمناطق المنخفضة ومسارات المشي القريبة من قنوات تصريف المياه.`;
        descEn = `Expected extreme rainfall of ${day.precipitationSum || 25}mm with thunder; poses severe risk of flash floods in canyons, unpaved roads, and typical dry oases channels (Wadis).`;
        adjustmentsAr = [
          "تجنب الأودية ومسارات المشي منخفضة الحصانات في الواحات أو السهول؛ استبدلها فوراً بجولة المتاحف وصناعة السجاد التقليدي المعزولة.",
          "تعديل جدولة اليوم: نوصي بتجميد جولات قورب المياه المفتوحة أو السير بالسيارات في الوحل، واللجوء لجولة المقاهي بوسط القصر الطيني."
        ];
        adjustmentsEn = [
          "Divert from Wadis and Low-Lying Oasis treks: Immediately replace with closed historical museums, pottery workshops, or heritage libraries.",
          "Alternative Day Schedule: Suspend open sand 4x4 trails or boat trips in favor of custom craft workshops and traditional home dining."
        ];
      } else if (isSandstorm) {
        detectedType = "sandstorm";
        titleAr = "⚠️ تحذير: عاصفة رملية صحراوية ورياح شديدة";
        titleEn = "⚠️ ALERT: Major Desert Sandstorm & High Gust Advisory";
        descAr = `رياح نشطة قوية جداً تتجاوز سرعتها ${day.windSpeed || 42} كم/سا؛ تؤدي لتدني الرؤية الأفقية التامة وتعليق الأنشطة الخارجية والقيادة في الطرقات الرملية.`;
        descEn = `Severe sandy storms with gusts exceeding ${day.windSpeed || 42} km/h; creates zero-visibility dust fogs rendering unpaved driving and open desert treks highly hazardous.`;
        adjustmentsAr = [
          "توقف المسار المفتوح بالكثبان: بدلاً من الذهاب لمشاهدة الغروب فوق الكثبان الرملية مباشرة، يوصى بقضاء هذا الوقت في فناء القصر الطيني لتعلم النقش التتراقي وصنع الشاي.",
          "استبدال السير البري المكشوف: التحول للتسوق وصنع المأكولات الشعبية في السوق العتيق المسقوف."
        ];
        adjustmentsEn = [
          "Suspend Dune Trekking: Instead of climbing open dunes for sunset, enjoy traditional tea-brewing and leather embossing tutorials in high-walled clay courtyards.",
          "Indoor Crafts Exchange: Replace bare landscape walks with shaded tour guides inside Covered Heritage Souks."
        ];
      } else if (isHeatwave) {
        detectedType = "heatwave";
        titleAr = "🔥 تحذير: موجة حر صحراوية لاهبة فائقة الخطورة";
        titleEn = "🔥 ALERT: Extreme Sahara Heatwave Warning (Heat Hazard)";
        descAr = `درجات الحرارة العظمى تقترب من ${day.maxTemp}°م مع مؤشر أشعة فوق بنفسجية (UV) حارق؛ تتضاعف معها احتمالات الإصابة بضربات الشمس الحادة والتجفاف.`;
        descEn = `Extreme temperatures approaching ${day.maxTemp}°C coupled with highest UV radiation index, creating severe dehydration threshold and risk of sunstroke.`;
        adjustmentsAr = [
          "مناورة الصباح الباكر: ترحيل جولتك المفتوحة لتتم حصراً بين 05:00 - 08:30 صباحاً كحد أقصى لتطويق الوهج الشمسي الحارق.",
          "تقليص فترة الظهيرة: استرخ في الغرف المبردة ذات التهوية التراثية أو في فناء الكسار وامنح بشرتك ترطيباً دافئاً مستمراً."
        ];
        adjustmentsEn = [
          "Shift to Dawn Sightseeing: Push outdoor walking or guided excursions strictly to 05:00 - 08:30 AM to fully avoid direct solar flare.",
          "Midday Oasis Shading: Schedule deep resting or local museum visits inside thick-walled structures between 11:00 AM and 04:30 PM."
        ];
      } else if (isBlizzard) {
        detectedType = "blizzard";
        titleAr = "❄️ تحذير: منخفض جوي قطبي وعاصفة ثلجية جليدية";
        titleEn = "❄️ ALERT: Freezing Arctic Depressions & Mountain Frostbite Advisory";
        descAr = `درجات الحرارة الصغرى تهبط إلى ${day.minTemp}°م مع نشاط الصقيع والرياح؛ يؤدي لتجمد مياه الشرب وتراكم الثلوج وصعوبة القيادة في التضاريس المرتفعة.`;
        descEn = `Freezing sub-temperatures down to ${day.minTemp}°C and frost/sleet accumulation, posing risk of hypothermia and challenging driving on mountain routes.`;
        adjustmentsAr = [
          "إلغاء التخييم البري المفتوح: استبدل تماماً المبيت الخارجي بحجز غرف مجهزة بجدران سميكة في نزل أو دار تقليدية دافئة.",
          "أنشطة تراثية دافئة: عوض النزهات الجبلية بتناول طعام الكسكسي الساخن وباقي المأكولات المحلية حول الموقد التقليدي."
        ];
        adjustmentsEn = [
          "Halt Wilderness Camping: Switch uninsulated tent stays to solid brick chalets or well-heated local guest suites immediately.",
          "Gastronomy & Hearth Experience: Replace chilly mountain peaks with sitting by the hearth enjoying piping hot traditional stews and local mint tea."
        ];
      }

      if (detectedType) {
        const originalActivities: string[] = [];
        if (itinerary && itinerary.days && itinerary.days[dayNum - 1]) {
          const originalDay = itinerary.days[dayNum - 1];
          originalDay.activities?.forEach(act => {
            originalActivities.push(act.title);
          });
        }

        alerts.push({
          dayNum,
          date: day.date,
          type: detectedType,
          titleAr,
          titleEn,
          descAr,
          descEn,
          originalActivityTitles: originalActivities,
          adjustmentsAr,
          adjustmentsEn
        });
      }
    });

    return alerts;
  }, [derivedWeatherData, simulatedAlertMode, itinerary, lang]);

  useEffect(() => {
    let active = true;

    async function fetchWeather() {
      if (!destinationName) return;

      setLoading(true);
      setIsFallback(false);

      try {
        // Step 1: Geocoding the destination city
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destinationName)}&count=1&language=en&format=json`;
        const geoResponse = await fetch(geoUrl);
        
        if (!geoResponse.ok) {
          throw new Error("Geocoding service error");
        }

        const geoData = await geoResponse.json();
        
        if (!geoData.results || geoData.results.length === 0) {
          throw new Error("No coordinate data found for " + destinationName);
        }

        const firstResult = geoData.results[0];
        const { latitude, longitude } = firstResult;

        if (active) {
          setCoords({ lat: parseFloat(latitude.toFixed(4)), lng: parseFloat(longitude.toFixed(4)) });
        }

        // Step 2: Fetch 7-day daily forecast
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,apparent_temperature_max,uv_index_max,precipitation_probability,precipitation_sum,windspeed_10m_max&timezone=auto`;
        const weatherResponse = await fetch(weatherUrl);

        if (!weatherResponse.ok) {
          throw new Error("Weather forecast service error");
        }

        const wData = await weatherResponse.json();
        const daily = wData.daily;

        if (!daily || !daily.time || daily.time.length === 0) {
          throw new Error("Empty daily forecast payload");
        }

        const daysOfWeekEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const daysOfWeekAr = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

        const parsedDays: WeatherDay[] = daily.time.map((timeStr: string, idx: number) => {
          const dateObj = new Date(timeStr);
          const dayName = lang === "ar" 
            ? daysOfWeekAr[dateObj.getDay()] 
            : daysOfWeekEn[dateObj.getDay()];

          const maxT = Math.round(daily.temperature_2m_max[idx]);
          const minT = Math.round(daily.temperature_2m_min[idx]);
          const code = daily.weathercode[idx];
          
          const { label } = getWeatherInfo(code, lang);

          // Get Feels-like temperature (apparent_temperature_max)
          const feelsLikeT = daily.apparent_temperature_max 
            ? Math.round(daily.apparent_temperature_max[idx]) 
            : Math.round(maxT - 1 + (idx % 3));

          // Get UV index response
          const uvVal = daily.uv_index_max 
            ? parseFloat(parseFloat(daily.uv_index_max[idx]).toFixed(1))
            : (code === 0 ? 8.5 : [1, 2, 3].includes(code) ? 5.2 : 2.1);

          // Estimate relative humidity based on weather code and rain
          let humidityVal = 55;
          if ([45, 48].includes(code)) humidityVal = 95;
          else if ([61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code)) humidityVal = 85;
          else if ([51, 53, 55].includes(code)) humidityVal = 78;
          else if (code === 0) humidityVal = 40;
          else if ([1, 2, 3].includes(code)) humidityVal = 60;

          return {
            date: timeStr,
            dayName,
            maxTemp: maxT,
            minTemp: minT,
            weatherCode: code,
            conditionLabel: label,
            precipitationProb: daily.precipitation_probability ? daily.precipitation_probability[idx] : undefined,
            precipitationSum: daily.precipitation_sum ? daily.precipitation_sum[idx] : undefined,
            windSpeed: daily.windspeed_10m_max ? Math.round(daily.windspeed_10m_max[idx]) : undefined,
            humidity: humidityVal,
            uvIndex: uvVal,
            feelsLike: feelsLikeT
          };
        });

        if (active) {
          setWeatherData(parsedDays);
          setLoading(false);
        }

      } catch (err) {
        console.warn("Weather APIs failed - triggering premium regional microclimate engine:", err);
        if (active) {
          setWeatherData(generateRegionalFallback(destinationName, lang));
          setIsFallback(true);
          setLoading(false);
        }
      }
    }

    fetchWeather();

    return () => {
      active = false;
    };
  }, [destinationName, lang]);

  const isAr = lang === "ar";

  if (loading) {
    return (
      <div className="bg-slate-50 border border-slate-150 rounded-2xl p-6 shadow-xs animate-pulse space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 bg-slate-200 rounded w-1/3" />
          <div className="h-4 bg-slate-200 rounded w-1/6" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-7 gap-3">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Find general characteristics to help pack
  const averageMaxTemp = derivedWeatherData.reduce((acc, curr) => acc + curr.maxTemp, 0) / (derivedWeatherData.length || 1);
  const anyRain = derivedWeatherData.some(d => d.precipitationSum && d.precipitationSum >= 1);
  const anyFrost = derivedWeatherData.some(d => d.minTemp < 10);
  const anyIntenseHeat = currentHighestMaxTemp() >= 34;

  function currentHighestMaxTemp(): number {
    if (derivedWeatherData.length === 0) return 24;
    return Math.max(...derivedWeatherData.map(d => d.maxTemp));
  }

  // Construct Smart packing checklists
  const getPackingAdvice = () => {
    const list: string[] = [];
    if (anyIntenseHeat) {
      list.push(
        isAr 
          ? "حماية فائقة من الشمس: كريم واقٍ من الشمس (SPF 50)، قبعة وسيعة ونظارات شمسية مستقطبة لحمايتك من وهج الأشعة الشديدة." 
          : "Maximum Sun Protection: Carry high SPF sunscreen, polarized shades, and a wide-brimmed sun hat."
      );
      list.push(
        isAr 
          ? "أزياء خفيفة ومريحة: نوصي بملابس قطنية بيضاء أو فاتحة فضفاضة لتهوية الجسم طيلة ساعات النهار الحارة." 
          : "Lightweight fabrics: Pack high-breathability linen or loose cotton wear, helping keep cool during day walks."
      );
    } else if (anyFrost) {
      list.push(
        isAr 
          ? "ملابس شتوية مجهزة: معطف صوف دافئ أو جاكيت مبطن بالريش، بالإضافة لوشاح صوفي رقيق للتنزه المسائي." 
          : "Heavy layers: Bring a windbreaker outerwear, fleece layers, or a compact down jacket for cold evenings."
      );
    } else {
      list.push(
        isAr 
          ? "ملابس معتدلة مرنة: احزم ملابس يومية مريحة مع سترة أو كارديجان خفيف لارتدائه عند هبوب نسمات باردة فجائية." 
          : "Versatile smart layers: Pack light shirts accompanied by a light jacket or cardigan for unexpected temperature drops."
      );
    }

    if (anyRain) {
      list.push(
        isAr 
          ? "حماية من المطر والبلل: مظلة جيب خفيفة الوزن أو سترة مطرية مقاومة للماء مع حذاء جلدي مانع للانزلاق." 
          : "Wet weather preparation: Pack a sturdy compact umbrella or a light rain poncho, and carry slip-resistant/water-tight footwear."
      );
    } else {
      list.push(
        isAr 
          ? "ترطيب مكثف: احرص كلياً على مرافقة زجاجة مياه قابلة لإعادة التعبئة لتجنب العطش والتجفاف أثناء المسارات السياحية المفتوحة." 
          : "Hydration Focus: Keep a reusable insulated water flask handy to shield yourself against high ambient dryness."
      );
    }

    // Always append regional/activity guideline
    list.push(
      isAr 
        ? "أحذية مخصصة للمشي: لزيارة المعالم التاريخية الوعرة والمنحدرات والأسواق، حذاء رياضي مرن وداعم للقدمين أمر لا غنى عنه." 
        : "Robust walking shoes: A highly supportive pair of trainers is strongly advised to easily traverse historical sites and uneven alleys."
    );

    return list;
  };

  const adviceList = getPackingAdvice();
  const mainToday = derivedWeatherData[0] || { maxTemp: 24, conditionLabel: "Clear" };
  const selectedDay = derivedWeatherData[selectedDayIdx] || mainToday;
  const todayWeatherInfo = getWeatherInfo(mainToday.weatherCode, lang);

  return (
    <div id="weather-forecast-card" className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden">
      {/* Upper header segment highlighting selected city */}
      <div className={`p-5 border-b border-slate-150 bg-gradient-to-r ${todayWeatherInfo.bgGradient} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-white shadow-xs border border-slate-100 flex items-center justify-center">
            {todayWeatherInfo.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 tracking-tight text-base">
                {isAr ? `توقعات الطقس في ${destinationName}` : `7-Day Outlook: ${destinationName}`}
              </h3>
              {isFallback && (
                <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold rounded-md whitespace-nowrap">
                  🛰️ {isAr ? "مناخ محلي" : "Microclimate Mode"}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-1 font-semibold flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                {isAr 
                  ? `الحالة الحالية التقريبية: ${mainToday.conditionLabel} مع معدل عظمى ${mainToday.maxTemp}°م` 
                  : `Currently: ${mainToday.conditionLabel} with a projected daytime high of ${mainToday.maxTemp}°C`}
              </span>
            </p>
          </div>
        </div>

        {coords && (
          <div className="bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-100 font-mono text-[10.5px] text-slate-500 self-start md:self-center">
            <span className="font-bold text-slate-800">GPS:</span> {coords.lat > 0 ? `${coords.lat}°N` : `${Math.abs(coords.lat)}°S`}, {coords.lng > 0 ? `${coords.lng}°E` : `${Math.abs(coords.lng)}°W`}
          </div>
        )}
      </div>

      {/* Interactive Severe Weather Simulator Ribbon */}
      <div className="bg-slate-50 border-b border-slate-150 p-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>{isAr ? "محاكي الطوارئ والإنذارات المبكرة" : "Severe Weather Simulation Sandbox"}</span>
                <span className="text-[9px] bg-indigo-100 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Dev/Test
                </span>
              </p>
              <p className="text-[10px] text-slate-500 font-medium font-sans">
                {isAr ? "اضغط لمحاكاة الكوارث الجوية واختبار مرونة مسارات الرحلة تلقائياً" : "Simulate severe conditions to test real-time advisory alerts and itinerary protection."}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1.5 justify-end">
            {[
              { id: "none", labelEn: "Real Local Weather", labelAr: "الطقس الطبيعي", emoji: "🛰️" },
              { id: "flood", labelEn: "Flash Floods", labelAr: "سيول جارفة", emoji: "⛈️" },
              { id: "sandstorm", labelEn: "Sandstorm", labelAr: "عواصف رملية", emoji: "🌪️" },
              { id: "heatwave", labelEn: "Heatwave", labelAr: "موجة حرارة", emoji: "🔥" },
              { id: "blizzard", labelEn: "Peak Blizzard", labelAr: "عاصفة بريد", emoji: "❄️" }
            ].map((scen) => {
              const isSelected = simulatedAlertMode === scen.id;
              return (
                <button
                  key={scen.id}
                  onClick={() => setSimulatedAlertMode(scen.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all duration-150 flex items-center gap-1 border ${
                    isSelected
                      ? "bg-slate-950 text-white border-slate-950 shadow-xs scale-102"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  <span>{scen.emoji}</span>
                  <span>{lang === "ar" ? scen.labelAr : scen.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Real-time Severe Weather Warnings & Adaptive Itinerary Adjustment UI */}
      {activeSevereAlerts.length > 0 && !dismissedAlert && (
        <div className="mx-5 mt-5 bg-rose-50/70 border border-rose-200 rounded-xl p-4 md:p-5 relative overflow-hidden shadow-2xs">
          {/* Subtle background warning pulse bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-rose-600 animate-pulse" />
          
          <div className="flex flex-col md:flex-row items-stretch gap-4 justify-between">
            <div className="flex items-start gap-3.5 flex-1">
              <div className="p-3 bg-rose-100 rounded-xl border border-rose-200 text-rose-600 animate-bounce flex items-center justify-center self-start mt-0.5">
                <ShieldAlert className="w-6 h-6" />
              </div>
              
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase bg-rose-600 text-white px-2 py-0.5 rounded tracking-wide animate-pulse">
                    {isAr ? "إنذار جوي نشط" : "CRITICAL ALERT ACTIVE"}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{isAr ? "تحذير محدث فوري" : "Real-time Guard Syncing"}</span>
                  </span>
                </div>
                
                {activeSevereAlerts.map((alert, index) => (
                  <div key={index} className="border-b border-rose-100/60 pb-3 last:border-0 last:pb-0 pt-2 first:pt-0">
                    <h4 className="font-extrabold text-slate-900 text-sm md:text-base tracking-tight">
                      {lang === "ar" ? alert.titleAr : alert.titleEn}
                    </h4>
                    <p className="text-xs text-slate-705 mt-1 leading-relaxed">
                      {lang === "ar" ? alert.descAr : alert.descEn}
                    </p>
                    
                    {/* Nested Adaptive Itinerary Modifications */}
                    <div className="mt-3 bg-white/95 rounded-lg border border-rose-150 p-3 shadow-3xs space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        <span>
                          {isAr ? `الحلول المقترحة التكيفية لليوم ${alert.dayNum}:` : `Adaptive Itinerary Adjustments (Day ${alert.dayNum}):`}
                        </span>
                      </div>
                      
                      {/* Activities Cross-Out Section */}
                      {alert.originalActivityTitles.length > 0 && (
                        <div className="bg-slate-50 rounded-md p-2 border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            {isAr ? "المسار الأصلي المعرض للمخاطر:" : "Original At-Risk Activities:"}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {alert.originalActivityTitles.map((title, tIdx) => (
                              <span key={tIdx} className="text-xs text-rose-800 bg-rose-50/60 px-2 py-0.5 rounded border border-rose-100 line-through decoration-rose-400 font-medium">
                                🚫 {title}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Detailed Safe Adaptations */}
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                          {isAr ? "التعديلات الوقائية المقترحة للتطبيق:" : "Recommended Safe Adjustments:"}
                        </p>
                        <ul className="space-y-1 text-xs text-slate-700 pl-1">
                          {(lang === "ar" ? alert.adjustmentsAr : alert.adjustmentsEn).map((adj, adjIdx) => (
                            <li key={adjIdx} className="flex items-start gap-1.5 leading-snug">
                              <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                              <span>{adj}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-row md:flex-col items-stretch gap-2 w-full md:w-auto self-stretch justify-end mt-2 md:mt-0 min-w-[170px]">
              <button
                onClick={() => setAutoAdjustApplied(!autoAdjustApplied)}
                className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  autoAdjustApplied
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                }`}
              >
                {autoAdjustApplied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>{isAr ? "تم تبني التدابير" : "Protective Fix Active"}</span>
                  </>
                ) : (
                  <>
                    <span>🔧</span>
                    <span>{isAr ? "تبني تعديلات الجدول" : "Apply Safety Fixes"}</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => setDismissedAlert(true)}
                className="px-3 py-2.5 bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-800 rounded-lg text-xs font-medium cursor-pointer flex items-center justify-center"
                title={isAr ? "إخفاء التنبيه مؤقتاً" : "Mute alert warnings"}
              >
                {isAr ? "تجاوز التنبيه" : "Dismiss Warning"}
              </button>
            </div>
          </div>
          
          {autoAdjustApplied && (
            <div className="mt-3 bg-emerald-50/90 border border-emerald-200 rounded-md p-2.5 flex items-center gap-2">
              <div className="text-emerald-500 animate-bounce">
                <CheckCircle className="w-5 h-5 fill-emerald-100" />
              </div>
              <p className="text-[11px] text-emerald-800 font-semibold leading-relaxed">
                {isAr 
                  ? "✓ تم تفعيل بروتوكول سلامة الطيران والمسارات البرية! تم نقل الأنشطة المعرضة للخطر لبقية الفترات المشمسة والآمنة تلقائياً وعُدلت ساعات المغادرة." 
                  : "✓ Safe Transit protocol initiated! Your travel itinerary has been updated with weatherproof scheduling and thermal buffers."}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="p-5 space-y-5">
        {/* 7-Day Horizontal Outlook */}
        <div className="relative">
          <p className="text-[11px] font-bold text-slate-400 mb-2.5 uppercase tracking-wide">
            {isAr ? "💡 انقر أو مرر الفأرة فوق أي يوم لعرض المؤشرات التفصيلية" : "💡 Click or hover any day to view detailed metrics"}
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {derivedWeatherData.map((day, dIdx) => {
              const info = getWeatherInfo(day.weatherCode, lang);
              const alert = getDailyWeatherAlert(day, lang);
              const isSelected = selectedDayIdx === dIdx;
              
              return (
                <div 
                  key={day.date} 
                  onClick={() => setSelectedDayIdx(dIdx)}
                  onMouseEnter={() => setSelectedDayIdx(dIdx)}
                  className={`relative flex-shrink-0 w-[112px] rounded-xl border p-3 flex flex-col items-center justify-between text-center transition-all duration-200 cursor-pointer select-none ${
                    isSelected 
                      ? "bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20 shadow-md transform scale-102 -translate-y-0.5" 
                      : "bg-slate-50/50 border-slate-100 hover:border-slate-250 hover:bg-slate-50 hover:scale-102"
                  }`}
                >
                  {alert && (
                    <div 
                      className={`absolute top-1 right-1 px-1 py-1 rounded-md border text-[9.5px] font-bold shadow-2xs ${alert.bgClass} flex items-center justify-center animate-bounce z-10 cursor-help`}
                      title={alert.tooltip}
                    >
                      {alert.icon}
                    </div>
                  )}

                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {dIdx === 0 ? (isAr ? "اليوم" : "Today") : day.dayName.slice(0, 3)}
                  </span>
                  
                  <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">
                    {day.date.split("-").slice(1).reverse().join("/")}
                  </span>

                  <div className="my-3 flex items-center justify-center p-1 bg-white rounded-lg shadow-2xs border border-slate-100 w-10 h-10">
                    {info.icon}
                  </div>

                  <span className="text-[10.5px] font-bold text-slate-805 leading-tight truncate max-w-full block" title={day.conditionLabel}>
                    {day.conditionLabel}
                  </span>

                  <div className="mt-2.5 pt-2 border-t border-slate-150/60 w-full flex items-center justify-center gap-1.5">
                    <span className="text-xs font-extrabold text-slate-800 font-mono">{day.maxTemp}°</span>
                    <span className="text-[10px] text-slate-400 font-mono">/</span>
                    <span className="text-[10px] font-bold text-slate-500 font-mono">{day.minTemp}°</span>
                  </div>

                  {day.precipitationProb !== undefined && day.precipitationSum !== undefined && (
                    <div className="mt-2 flex items-center gap-0.5 text-[9px] font-semibold text-blue-600 font-mono">
                      <Droplets className="w-2.5 h-2.5" />
                      <span>{day.precipitationProb}%</span>
                    </div>
                  )}

                  {day.windSpeed !== undefined && (
                    <div className="mt-1 flex items-center gap-0.5 text-[9px] font-semibold text-slate-500 font-mono">
                      <Wind className="w-2.5 h-2.5" />
                      <span>{day.windSpeed} km/h</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Expandable Detail Panel */}
        {selectedDay && (
          <div className="bg-indigo-50/20 rounded-xl p-4 border border-indigo-100/50 space-y-3/2 transition-all duration-300 animate-fade-in">
            <div className="flex items-center justify-between border-b border-indigo-100/30 pb-2">
              <span className="font-extrabold text-xs text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>
                  {isAr 
                    ? `مؤشرات يوم ${selectedDay.dayName} (${selectedDay.date.split("-").slice(1).reverse().join("/")})` 
                    : `Details for ${selectedDay.dayName} (${selectedDay.date.split("-").slice(1).reverse().join("/")})`}
                </span>
              </span>
              <span className="px-2 py-0.5 bg-indigo-100/50 border border-indigo-200 text-indigo-750 text-[10.5px] font-bold rounded-lg uppercase">
                {selectedDay.conditionLabel}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Feels like */}
              <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 hover:shadow-2xs transition-shadow">
                <div className="p-2 rounded-lg bg-rose-50 text-rose-500">
                  <Thermometer className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isAr ? "الملموسة" : "Feels Like"}</div>
                  <div className="text-xs font-black text-slate-800">{selectedDay.feelsLike}°C</div>
                </div>
              </div>

              {/* Humidity */}
              <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 hover:shadow-2xs transition-shadow">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-500">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isAr ? "الرطوبة" : "Humidity"}</div>
                  <div className="text-xs font-black text-slate-800">{selectedDay.humidity}%</div>
                </div>
              </div>

              {/* UV index */}
              <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 hover:shadow-2xs transition-shadow">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-500">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isAr ? "مؤشر الأشعة" : "UV Index"}</div>
                  <div className="text-xs font-black text-slate-800">
                    {selectedDay.uvIndex} <span className="text-[9.5px] font-bold text-slate-400">/ 11+</span>
                  </div>
                </div>
              </div>

              {/* Wind Speed */}
              <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 hover:shadow-2xs transition-shadow">
                <div className="p-2 rounded-lg bg-slate-50 text-slate-500">
                  <Wind className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isAr ? "سرعة الرياح" : "Wind Speed"}</div>
                  <div className="text-xs font-black text-slate-800">{selectedDay.windSpeed} km/h</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Packing suggestions and advisory notes */}
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-150/80 space-y-3">
          <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-xs uppercase tracking-wide">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>{isAr ? "توصيات التعبئة الذكية وحزم الحقائب" : "Smart Travel Packing Advisories"}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {adviceList.map((adv, aIdx) => (
              <div key={aIdx} className="bg-white rounded-lg p-3 border border-slate-100 flex items-start gap-2.5">
                <span className="text-xs mt-0.5 p-1 bg-indigo-50 text-indigo-600 rounded-md">
                  <Umbrella className="w-3.5 h-3.5" />
                </span>
                <p className="text-xs text-slate-700 leading-normal font-semibold">
                  {adv}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-1.5 flex items-start gap-2 text-[10px] md:text-xs text-slate-500 leading-relaxed font-semibold">
            <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              {isAr 
                ? "تم سحب معلومات التنبؤات والطقس والـ GPS مباشرة من محرك معالجة البيانات الجوية لموقع رحلتك. يرجى توخي الحذر والتحقق الدائم." 
                : "Weather outlook insights and GPS metrics are processed client-side. We advise verifying current sky conditions prior to hiking wild terrain."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
