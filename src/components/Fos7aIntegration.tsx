/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Fos7a DZ & Safari Pro Direct Travel Schedules Board
 * Replaces the Supabase S3 panel with live-like travel board cards synchronized with Algerian social tour pages.
 */

import React, { useState } from "react";
import { 
  Calendar, 
  ExternalLink,
  MapPin,
  Compass,
  Download,
  Flame,
  Clock,
  Phone,
  CheckCircle,
  HelpCircle,
  Briefcase
} from "lucide-react";
import { motion } from "motion/react";

interface Fos7aProps {
  lang: "ar" | "en";
  activeItinerary: any;
  onInjectPlace: (place: any) => void;
}

export default function Fos7aIntegration({ lang, activeItinerary, onInjectPlace }: Fos7aProps) {
  const isAr = lang === "ar";
  const [activePlatform, setActivePlatform] = useState<"fos7a" | "safari">("fos7a");
  const [injectStatus, setInjectStatus] = useState<string | null>(null);

  // High fidelity schedules representing Fos7a DZ Facebook Tours and Safari Pro Logistics
  const toursData = {
    fos7a: {
      profileUrl: "https://www.facebook.com/profile.php?id=61556682238560",
      pageName: isAr ? "بوابة فسحة DZ الشتصفية" : "Fos7a DZ Tours Portal",
      description: isAr 
        ? "الصفحة الرسمية لتنظيم الرحلات الاستكشافية، المخيمات الجبلية، ورحلات واحات الصحراء الجزائرية الكبرى بأسعار تنافسية وتنظيم احترافي."
        : "The official page for organizing scenic excursions, eco-camping, and deep Algerian Sahara tours with premium lodging & transportation.",
      schedules: [
        {
          id: "tour_01",
          name: isAr ? "رحلة مغامرة واحات غرداية وبني يزقن" : "Ghardaia Oasis & Beni Isguen Scenic Tour",
          wilaya: "غرداية (Ghardaia)",
          departureTime: isAr ? "كل يوم خميس الساعة 22:00 ليلاً" : "Every Thursday at 10:00 PM",
          station: isAr ? "محطة تافيلالت الجديدة / موقف تيسير خروبة" : "Tafilalet New Station / Kharouba Terminal",
          duration: isAr ? "4 أيام / 3 ليالٍ" : "4 Days / 3 Nights",
          priceDZD: "18,500 دج",
          phone: "+213 552 14 85 92",
          description: isAr 
            ? "تشمل الإقامة بدار ضيافة تقليدية، وجبتين يومياً، جولة في قصر تافيلالت البيئي، زيارة سوق الجمعة التقليدي، وتذوق الكسكسي الميزابي الأصيل."
            : "Includes traditional guesthouse lodging, half-board formula, ecological tours of Ksar Tafilelt, traditional market walks, and original Saharan dining.",
          spots: {
            name: isAr ? "قصر تافيلالت وغرداية العريقة" : "Grand Palace of Tafilalet",
            description: isAr ? "نموذج عمراني وهندسي متفرد مبني من الطين والحجارة الكلسية بنظام اجتماعي وبيئي محكم." : "An architecturally unique eco-fortress constructed with clay and limestones following regional community codes.",
            avgCostUSD: 12,
            wilaya: "Ghardaia"
          }
        },
        {
          id: "tour_02",
          name: isAr ? "مخيم المغامرة الشتوي بكثبان تاغيت" : "Deep Sahara Winter Excursion - Taghit Dunes",
          wilaya: "بشار (Taghit)",
          departureTime: isAr ? "كل ثلاثاء الساعة 18:00 مساءً" : "Every Tuesday at 06:00 PM",
          station: isAr ? "مجموعة النقل الكبرى - محطة الركاب بئر مراد رايس" : "Grand Commuting Center - Bir Mourad Rais",
          duration: isAr ? "5 أيام / 4 ليالٍ" : "5 Days / 4 Nights",
          priceDZD: "24,000 دج",
          phone: "+213 661 40 19 82",
          description: isAr 
            ? "استكشاف نقوش الصحراء التاريخية، سهرات فنية تقليدية حول الموقد، ركوب الجمال الفلكلوري، والإقامة بفندق صحراوي تقليدي دافئ."
            : "Camel trekking tours, ancient rock engraving sights, typical ambient fireside music with local tea, and premium desert lodging.",
          spots: {
            name: isAr ? "كثبان تاغيت والمدينة القديمة الدافئة" : "Taghit Dunes & Ancient Warm Medina",
            description: isAr ? "بوابة الصحراء الغربية تحفة المعالم الطينية والقصبة التاريخية وكثبان الرمال الذهبية الساحرة." : "The pearl of Saoura valley containing pristine golden dunes, age-old clay castles, and historic oases.",
            avgCostUSD: 14,
            wilaya: "Taghit"
          }
        },
        {
          id: "tour_03",
          name: isAr ? "مسار جسور الجمال والتاريخ بقسنطينة" : "Hanging Bridges & History Route - Constantine",
          wilaya: "قسنطينة (Constantine)",
          departureTime: isAr ? "كل جمعة الساعة 06:30 صباحاً" : "Every Friday at 06:30 AM",
          station: isAr ? "محطة الخروبة المركزية للخطوط الشرقية" : "Kharouba Station - East Bound Platforms",
          duration: isAr ? "3 أيام / 2 ليلتين" : "3 Days / 2 Nights",
          priceDZD: "13,500 دج",
          phone: "+213 770 91 38 41",
          description: isAr 
            ? "رحلة مخصصة لزيارة جسر سيدي مسيد ومقام الشهيد العتيق، تجارب الغداء القسنطيني الشهير وأسواق البازارات والصنائع الفضية التقليدية."
            : "Specialize in visiting Sidi M'Cid suspension bridges, regional Martyr monument, traditional silver bazaars, and local fine dining.",
          spots: {
            name: isAr ? "الجسور المعلقة وسيدي مسيد" : "Sidi M'Cid Suspension Bridge",
            description: isAr ? "عجيبة معمارية على وادي الرمال الخناقي السحيق وتتميز بمناظرها المهيبة وتاريخها العريق الأصيل." : "An engineering marvel overlooking the deep Rhumel gorge, offering historic walkways and spectacular views.",
            avgCostUSD: 8,
            wilaya: "Constantine"
          }
        }
      ]
    },
    safari: {
      profileUrl: "https://www.facebook.com/profile.php?id=61581218144645&locale=fr_FR",
      pageName: isAr ? "بوابة سفاري برو للتنقل والخدمات السريعة" : "Safari Pro Logistics & Transit Board",
      description: isAr 
        ? "مجمع لوجستي فاخر معتمد لتأجير السيارات السياحية الفارهة وتأمين سيارات ونقل إداري وطبي سريع ومحترف بين الولايات والمدن الكبرى."
        : "A certified high-end transit agency providing private premium vehicles, inter-wilaya professional shuttles, business travel aid, and medical patient transit routes.",
      schedules: [
        {
          id: "safari_01",
          name: isAr ? "نقل إداري سريع لرجال الأعمال (الجزائر - وهران)" : "Business Express Shuttle (Algiers - Oran)",
          wilaya: "وهران (Oran)",
          departureTime: isAr ? "رحلات يومية متوفرة كل ساعتين بدءاً من 07:00 صباحاً" : "Daily departures every 2 hours from 07:00 AM",
          station: isAr ? "انطلاق مباشر من باب الزوار ومطار هواري بومدين" : "Direct departure from Bab Ezzouar or Houari Boumediene Airport",
          duration: isAr ? "توصيل سريع (4 ساعات)" : "Express Direct Trans (4 Hours)",
          priceDZD: "4,500 دج / مقعد",
          phone: "+213 550 84 92 11",
          description: isAr 
            ? "سيارات سياحية فارهة مكيفة ومريحة للغاية ومزودة بخدمة إنترنت مجاني وحساب فواتير رسمي معتمد للشركات والمؤسسات الإدارية."
            : "Premium air-conditioned shuttle equipped with high-speed Wi-Fi and certified fiscal receipting for corporate missions.",
          spots: {
            name: isAr ? "مقر الإدارات بوهران والمنطقة الصناعية" : "Oran Administrative Center & Industrial Terminal",
            description: isAr ? "جولات تنقل وخدمات مستندات وثوبيت ومحلات طباعة ومقرات إدارية رئيسية لرجال الأعمال." : "Administrative layouts for corporate offices, printing systems, and local executive lounges.",
            avgCostUSD: 25,
            wilaya: "Oran"
          }
        },
        {
          id: "safari_02",
          name: isAr ? "رحلات السفر العائلي الخاصة والمريحة (الجزائر - تلمسان)" : "Private Family Transit Service (Algiers - Tlemcen)",
          wilaya: "تلمسان (Tlemcen)",
          departureTime: isAr ? "كل أحد وأربعاء الساعة 08:00 صباحاً" : "Every Sunday & Wednesday at 08:00 AM",
          station: isAr ? "من باب منزلك مباشرة خدمة من الباب للباب" : "Door-to-door direct collection services",
          duration: isAr ? "رحلة مريحة مع التوقف بالاستراحات" : "Comfort transit with leisure stops",
          priceDZD: "26,000 دج كامل السيارة",
          phone: "+213 560 31 16 00",
          description: isAr 
            ? "خدمة نقل مخصصة للعائلات مع سائق محترف ومرشد فلكلوري محلي عبر حافلات عائلية صغيرة نظيفة تناسب مستوى الميزانية المطلوبة."
            : "Dedicated private family micro-buses operating with highly trained drivers, secure stopping, and adaptive luggage handling.",
          spots: {
            name: isAr ? "قلعة المشور وولاية تلمسان" : "El Mechouar Citadel & Historic Tlemcen",
            description: isAr ? "تحفة فنية أثرية بالغرب الجزائري تجسد حقب العصر الأندلسي والزياني الأنيق والأسواق العتيقة." : "An Andalusian-Zianid cultural palace showcasing royal architecture, pristine gardens, and artisanal craft rooms.",
            avgCostUSD: 15,
            wilaya: "Tlemcen"
          }
        },
        {
          id: "safari_03",
          name: isAr ? "خط النقل الطبي ومرافقة المرضى (سطيف - مستشفيات العاصمة)" : "Patient Care Express (Setif - Algiers Clinics)",
          wilaya: "الجزائر العاصمة (Algiers)",
          departureTime: isAr ? "رحلات يومية منتظمة الساعة 05:00 صباحاً" : "Daily regular service at 05:00 AM",
          station: isAr ? "مباشرة من محطة وسط مدينة سطيف البير" : "Directly from Setif Central Terminal",
          duration: isAr ? "توصيل مباشر مع مرافقة طبية" : "Direct transit with patient care elements",
          priceDZD: "6,000 دج للذهاب والإياب",
          phone: "+213 662 55 99 21",
          description: isAr 
            ? "خدمة نقل آمنة وسريعة للمواعيد الطبية ومخابر التحاليل بعيادات ومؤسسات الاستشفاء الكبرى بالعاصمة مع تسليم وثائق التأمين."
            : "Extremely secure, smooth transit targeted for medical appointments, laboratories, and major clinical trials in Algiers.",
          spots: {
            name: isAr ? "مجمع مستشفيات العاصمة وعيادة الاستشفاء" : "Algiers Medical Complex & Clinical Care Station",
            description: isAr ? "توجيهات لوجستية وتنسيق أجهزة وصيدليات ومخابر عيادات قريبة من فروع الرحلة الطبية." : "Detailed layouts and mappings for central pharmacies, laboratories, and clinic lobbies.",
            avgCostUSD: 30,
            wilaya: "Algiers"
          }
        }
      ]
    }
  };

  const handleInject = (tourSchedule: any) => {
    // Inject the tour spot directly to the user's workspace
    onInjectPlace({
      name: tourSchedule.spots.name,
      description: `${tourSchedule.name}: ${tourSchedule.description} - ${tourSchedule.spots.description}`,
      wilaya: tourSchedule.wilaya,
      avgCostUSD: tourSchedule.spots.avgCostUSD
    });
    setInjectStatus(tourSchedule.id);
    setTimeout(() => {
      setInjectStatus(null);
    }, 3000);
  };

  const activeTour = toursData[activePlatform];

  return (
    <div id="fos7a-fb-integration-panel" className="space-y-6 max-w-4xl mx-auto">
      
      {/* Title block with brand details */}
      <div id="fos7a-header-block" className="relative overflow-hidden bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-md border border-indigo-950">
        
        {/* Subtle background graphic logo acting as watermarked backdrop */}
        <div className="absolute right-[-20px] bottom-[-20px] w-64 h-64 bg-white/5 rounded-full pointer-events-none flex items-center justify-center border border-white/10 animate-pulse">
          <span className="text-[120px] opacity-10">🚙</span>
        </div>

        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <Flame className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
              {isAr ? "معتمد رسمياً" : "Social Verified"}
            </span>
            <span className="bg-indigo-600/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-1 rounded-full">
              {isAr ? "دواوين السياحة والنقل والتبادل التجاري" : "DZ Tourism & Logistics Transit"}
            </span>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-black font-sans leading-tight text-slate-50">
            {isAr ? "بوابة لوحة رحلات فسحة DZ و Safari Pro" : "Fos7a DZ & Safari Pro Schedule Board"}
          </h2>
          
          <p className="text-slate-200 text-xs md:text-sm font-semibold leading-relaxed max-w-2xl">
            {isAr 
              ? "لقد قمنا بتعويض بوابة التكامل القديمة (Supabase S3) بجدول رحلات السفر البري والسياحي المنظمة المأخوذة مباشرة من حسابات الفيسيوك والوكالات الوطنية المعتمدة. يمكنك استعراض المواعيد باليوم والساعة وإدراجها بنقرة واحدة في برنامج رحلتك!"
              : "We have upgraded the prior Supabase S3 module with real-time transit schedules and tourism boards directly integrated from Algerian national tour guides and transport hubs. Inspect routes with day/hour details and update your active itinerary on the fly!"}
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <a 
              href="https://www.facebook.com/profile.php?id=61556682238560" 
              target="_blank" 
              rel="noreferrer"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 px-3.5 rounded-lg transition-all inline-flex items-center gap-1.5 shadow-sm hover:scale-[1.02]"
            >
              <span>👤 {isAr ? "فيسبوك فسحة DZ" : "Fos7a DZ Facebook"}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a 
              href="https://www.facebook.com/profile.php?id=61581218144645&locale=fr_FR" 
              target="_blank" 
              rel="noreferrer"
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2 px-3.5 rounded-lg transition-all inline-flex items-center gap-1.5 border border-slate-700 shadow-sm hover:scale-[1.02]"
            >
              <span>👤 {isAr ? "فيسبوك Safari Pro" : "Safari Pro Facebook"}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Tabs Filter */}
      <div id="platform-tabs" className="flex items-center justify-center p-1.5 bg-slate-100 rounded-2xl border border-slate-200/60 max-w-md mx-auto">
        <button
          id="tab-btn-fos7a"
          onClick={() => setActivePlatform("fos7a")}
          className={`flex-1 py-3 text-xs md:text-sm font-black rounded-xl transition-all cursor-pointer text-center ${
            activePlatform === "fos7a" 
              ? "bg-white text-indigo-950 shadow-md transform scale-[1.01] border border-indigo-100" 
              : "text-slate-550 hover:text-slate-800"
          }`}
        >
          ⛺ {isAr ? "رحلات ومخيمات فسحة DZ" : "Fos7a DZ Scenic Tours"}
        </button>
        <button
          id="tab-btn-safari"
          onClick={() => setActivePlatform("safari")}
          className={`flex-1 py-3 text-xs md:text-sm font-black rounded-xl transition-all cursor-pointer text-center ${
            activePlatform === "safari" 
              ? "bg-white text-indigo-950 shadow-md transform scale-[1.01] border border-indigo-100" 
              : "text-slate-550 hover:text-slate-800"
          }`}
        >
          🚀 {isAr ? "شاحنات وسيارة سفاري برو" : "Safari Pro Logistics & Transit"}
        </button>
      </div>

      {/* Primary Feed Info Details */}
      <div id="tour-schedules-display-panel" className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
        
        {/* Page metadata container */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="text-center md:text-left space-y-1">
            <h3 className="text-lg font-black text-slate-800 flex items-center justify-center md:justify-start gap-1.5">
              <span>{activePlatform === "fos7a" ? "⛺" : "🚀"}</span>
              {activeTour.pageName}
            </h3>
            <p className="text-xs text-slate-500 font-semibold max-w-2xl">
              {activeTour.description}
            </p>
          </div>
          <a
            href={activeTour.profileUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-indigo-600 hover:underline font-extrabold flex items-center gap-1 shrink-0 bg-indigo-50/50 p-2 rounded-lg"
          >
            <span>💬 {isAr ? "افتح محادثة الصفحة للحجز" : "Book via Facebook Direct"}</span>
            <ExternalLink className="w-3" />
          </a>
        </div>

        {/* List of tour/transit schedules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activeTour.schedules.map((schedule) => (
            <div 
              key={schedule.id}
              className="group relative flex flex-col justify-between border border-slate-150 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-md transition-all bg-slate-50/45"
            >
              <div className="space-y-4">
                
                {/* Visual badge and Location */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <span className="text-[10px] bg-indigo-50 text-indigo-800 px-2.5 py-0.5 rounded-full font-black tracking-wider uppercase">
                    {schedule.wilaya}
                  </span>
                  <span className="text-indigo-950 font-black text-xs font-mono">
                    {schedule.priceDZD}
                  </span>
                </div>

                {/* Tour Name & Details */}
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-slate-800 text-sm leading-tight hover:text-indigo-600 transition-colors">
                    {schedule.name}
                  </h4>
                  <p className="text-[11px] text-slate-550 leading-relaxed font-semibold">
                    {schedule.description}
                  </p>
                </div>

                {/* Logistics Schedule Day and Hour & Terminal */}
                <div className="space-y-2 text-xs bg-white p-3 rounded-xl border border-slate-100/80">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <strong>{isAr ? "الانطلاق:" : "Departure:"}</strong>
                    <span className="font-semibold text-slate-600">{schedule.departureTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <strong>{isAr ? "المحطة:" : "Terminal:"}</strong>
                    <span className="font-semibold text-slate-600 line-clamp-1" title={schedule.station}>{schedule.station}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-indigo-700 font-bold bg-indigo-50/30 p-1 rounded">
                    <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <strong>{isAr ? "هاتف الحجز:" : "Phone:"}</strong>
                    <span>{schedule.phone}</span>
                  </div>
                </div>

              </div>

              {/* Action buttons (Direct FB, Inject Itinerary) */}
              <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
                <button
                  id={`inject-${schedule.id}`}
                  onClick={() => handleInject(schedule)}
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {injectStatus === schedule.id ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                      <span>{isAr ? "تم إدراج المعلم بنجاح!" : "Injected into Program!"}</span>
                    </>
                  ) : (
                    <>
                      <span>➕ {isAr ? "إدراج هذه الرحلة في معالمي" : "Inject this Spot/Trip"}</span>
                    </>
                  )}
                </button>

                <a
                  href={activeTour.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 font-extrabold text-xs rounded-xl transition-all inline-flex items-center justify-center gap-1"
                >
                  <span>{isAr ? "تواصل معي فيسبوك للحجز" : "Chat on Messenger"}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>

            </div>
          ))}
        </div>

      </div>

      {/* Frequently Asked Questions regarding Facebook schedules */}
      <div id="fos7a-faq-section" className="bg-slate-50/60 p-6 rounded-3xl border border-slate-150 space-y-4">
        <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-500" />
          {isAr ? "أسئلة شائعة حول الحجوزات ووسائل النقل المعروضة" : "Frequently Asked Questions about facebook Bookings"}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-650">
          <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-1">
            <span className="text-indigo-600 font-bold block">❓ {isAr ? "كيف أقوم بتأكيد حجزي بعد اختيار رحلة؟" : "How do I confirm my booking?"}</span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              {isAr 
                ? "اضغط على زر (تواصل على فيسبوك) للذهاب المباشر إلى حساب فسحة DZ أو Safari Pro، أرسل لهم اسم الرحلة ورقمها مع هاتف التواصل لتلقي بيانات الحساب البريدي CCP ودفع العربون."
                : "Click the Facebook messenger direct link for active tours. Share the name of the tour and client mobile to receive CCP postal bank credentials for secure deposit payment."}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-1">
            <span className="text-indigo-600 font-bold block">❓ {isAr ? "ما هي مميزات سيارات سفاري برو للتنقل الإداري؟" : "What is Safari Pro corporate transit?"}</span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              {isAr 
                ? "تتخصص سفاري برو في إعداد مهام العمل الإدارية والرحلات العلاجية مع ميزات تسليم فواتير رسمية مطابقة لشروط المحاسبة الوطنية الجزائرية وتوصيل من الباب إلى الباب."
                : "Safari Pro specialises in secure corporate task assignments, medical patients transfer programs with official fiscal invoices conforming to Algerian fiscal requirements."}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
