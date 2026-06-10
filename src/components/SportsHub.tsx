/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Ticket, 
  Users, 
  Sparkles, 
  Search, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  DollarSign, 
  Flame, 
  Compass, 
  Download, 
  Printer, 
  Tv, 
  ChevronRight, 
  Award,
  CalendarDays,
  Star,
  Bell,
  CalendarPlus,
  Megaphone,
  Send,
  MessageSquare,
  Share2,
  ThumbsUp,
  RefreshCw,
  Music
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SportsHubProps {
  lang: "ar" | "en";
  activeItinerary?: any;
}

// Interfaces
interface LeagueStanding {
  position: number;
  team: string;
  teamAr: string;
  played: number;
  points: number;
  form: string[];
}

interface MatchFixture {
  id: string;
  league: string;
  leagueAr: string;
  homeTeam: string;
  homeTeamAr: string;
  awayTeam: string;
  awayTeamAr: string;
  date: string;
  venue: string;
  venueAr: string;
  status: "scheduled" | "live" | "finished";
  homeScore?: number;
  awayScore?: number;
  tournamentType: "local" | "european" | "saudi" | "qatari" | "global";
}

interface TournamentSchedule {
  name: string;
  nameAr: string;
  nextEdition: string;
  host: string;
  hostAr: string;
  dates: string;
  datesAr: string;
  teamsCount: number;
}

interface SportsBooking {
  bookingId: string;
  matchId: string;
  homeTeam: string;
  homeTeamAr: string;
  awayTeam: string;
  awayTeamAr: string;
  leagueName: string;
  leagueNameAr: string;
  date: string;
  qty: number;
  tier: "standard" | "premium" | "vip";
  bookingType: "ticket_only" | "full_package";
  totalCostDZD: number;
  customerName: string;
  customerPassport: string;
  status: "Confirmed" | "Processing";
  qrCodeToken: string;
}

interface FanGroupTrip {
  id: string;
  tournament: string;
  tournamentAr: string;
  destination: string;
  destinationAr: string;
  fansQty: number;
  transportType: "charter" | "bus" | "airline" | "none";
  extraShirts: boolean;
  extraDrums: boolean;
  extraMeals: boolean;
  totalEstimatedCostDZD: number;
  leaderName: string;
  leaderPhone: string;
  createdAt: string;
}

const POPULAR_GLOBAL_TEAMS = [
  { id: "MC Alger", ar: "مولودية الجزائر 🟢🔴", en: "MC Alger 🟢🔴" },
  { id: "JS Kabylie", ar: "شبيبة القبائل 💛💚", en: "JS Kabylie 💛💚" },
  { id: "USM Alger", ar: "الاتحاد العاصمي 🔴⚫", en: "USM Alger 🔴⚫" },
  { id: "CR Belouizdad", ar: "شباب بلوزداد 🔴⚪", en: "CR Belouizdad 🔴⚪" },
  { id: "ES Setif", ar: "وفاق سطيف 🦅⚫⚪", en: "ES Setif 🦅⚫⚪" },
  { id: "CS Constantine", ar: "شباب قسنطينة 💚🖤", en: "CS Constantine 💚🖤" },
  { id: "MC Oran", ar: "مولودية وهران 🔴⚪", en: "MC Oran 🔴⚪" },
  { id: "Al-Hilal", ar: "الهلال السعودي 💙🇸🇦", en: "Al-Hilal 💙🇸🇦" },
  { id: "Al-Nassr", ar: "النصر السعودي 💛🇸🇦", en: "Al-Nassr 💛🇸🇦" },
  { id: "Al-Ittihad", ar: "الاتحاد السعودي 🖤🇸🇦", en: "Al-Ittihad 🖤🇸🇦" },
  { id: "Al-Ahly", ar: "الأهلي المصري 🔴🇪🇬", en: "Al-Ahly 🔴🇪🇬" },
  { id: "Zamalek", ar: "الزمالك المصري ⚪🇪🇬", en: "Zamalek ⚪🇪🇬" },
  { id: "Real Madrid", ar: "ريال مدريد 👑⚪", en: "Real Madrid 👑⚪" },
  { id: "Barcelona", ar: "برشلونة 🔵🔴", en: "Barcelona 🔵🔴" },
  { id: "Manchester City", ar: "مانشستر سيتي 🩵🇬🇧", en: "Manchester City 🩵🇬🇧" },
  { id: "Manchester United", ar: "مانشستر يونايتد ❤️🇬🇧", en: "Manchester United ❤️🇬🇧" },
  { id: "Liverpool", ar: "ليفربول 🔴🇬🇧", en: "Liverpool 🔴🇬🇧" },
  { id: "PSG", ar: "باريس سان جيرمان 🔵🇫🇷", en: "PSG 🔵🇫🇷" },
  { id: "Algeria", ar: "المنتخب الجزائري 🇩🇿", en: "Algeria National Team 🇩🇿" },
  { id: "Saudi Arabia", ar: "المنتخب السعودي 🇸🇦", en: "Saudi Arabia National Team 🇸🇦" },
  { id: "Morocco", ar: "المنتخب المغربي 🇲🇦", en: "Morocco National Team 🇲🇦" },
  { id: "Egypt", ar: "المنتخب المصري 🇪🇬", en: "Egypt National Team 🇪🇬" },
  { id: "Tunisia", ar: "المنتخب التونسي 🇹🇳", en: "Tunisia National Team 🇹🇳" },
  { id: "Brazil", ar: "منتخب البرازيل 🇧🇷", en: "Brazil Team 🇧🇷" },
  { id: "Argentina", ar: "منتخب الأرجنتين 🇦🇷", en: "Argentina Team 🇦🇷" }
];

const getPersonalizedGreeting = (team: string, ar: boolean) => {
  if (!team) return ar ? "أهلاً بك يا كابتن في ملعب فسحة ديزاد! ⚽" : "Welcome Captain to Fos7a DZ Stadium! ⚽";
  const t = team.toLowerCase();
  if (t.includes("أهلي") || t.includes("ahly")) return ar ? "أهلاً ومرحباً بك يا أهلاوي البطل! 🔴🏆" : "Welcome, Red Giant Supporter! 🔴🏆";
  if (t.includes("مدريد") || t.includes("madrid") || t.includes("ملكي")) return ar ? "مرحباً يا مدريدي الملكي! 👑⚪" : "Hala Madrid! Welcome, Madridista! 👑⚪";
  if (t.includes("مولودية") || t.includes("mca") || t.includes("شناوة")) return ar ? "مرحباً يا شناوي عميد الأندية الجزائرية! 🟢🔴" : "Welcome, Chnaoua Supporter! 🟢🔴";
  if (t.includes("شبيبة") || t.includes("jsk") || t.includes("كناري") || t.includes("قبائل")) return ar ? "أهلاً ومرحباً يا كناري القبائل الأحرار! 💛💚" : "Welcome, Golden JSK Supporter! 💛💚";
  if (t.includes("ليفربول") || t.includes("liverpool")) return ar ? "مرحباً بك يا مشجع الريدز! لن تسير وحدك أبداً! 🔴" : "Welcome, Red! You Will Never Walk Alone! 🔴";
  if (t.includes("زمالك") || t.includes("zamalek")) return ar ? "أهلاً يا زملكاوي يا مدرسة الفن والهندسة! ⚪🔴" : "Welcome, Zamalek Fan! ⚪🔴";
  if (t.includes("نصر") || t.includes("nassr")) return ar ? "أهلاً بالنصراوي العالمي! 💛💙" : "Welcome, Al-Nassr Legend! 💛💙";
  if (t.includes("هلال") || t.includes("hilal")) return ar ? "مرحباً بالهلالي الزعيم الآسيوي! 💙" : "Welcome, Al-Hilal Supporter! 💙";
  return ar ? `أهلاً بك يا مشجع ${team} الكبير! ⚔️` : `Welcome, loyal fan of ${team}! ⚔️`;
};

const getTeamColorAccent = (team: string) => {
  if (!team) return { accent: "indigo", border: "border-indigo-100", text: "text-indigo-650", bg: "bg-indigo-50/20" };
  const t = team.toLowerCase();
  if (t.includes("أهلي") || t.includes("ahly") || t.includes("ليفربول") || t.includes("liverpool")) {
    return { accent: "rose", border: "border-rose-150", text: "text-rose-650", bg: "bg-rose-50/20" };
  }
  if (t.includes("مولودية") || t.includes("mca") || t.includes("شناوة")) {
    return { accent: "emerald", border: "border-emerald-150", text: "text-emerald-750", bg: "bg-emerald-50/25" };
  }
  if (t.includes("شبيبة") || t.includes("jsk") || t.includes("كناري") || t.includes("قبائل") || t.includes("نصر") || t.includes("nassr")) {
    return { accent: "amber", border: "border-amber-250", text: "text-amber-700", bg: "bg-amber-50/20" };
  }
  if (t.includes("مدريد") || t.includes("madrid") || t.includes("هلال") || t.includes("hilal")) {
    return { accent: "indigo", border: "border-blue-205", text: "text-blue-700", bg: "bg-blue-50/20" };
  }
  return { accent: "indigo", border: "border-indigo-100", text: "text-indigo-650", bg: "bg-indigo-50/20" };
};

export default function SportsHub({ lang, activeItinerary }: SportsHubProps) {
  const isAr = lang === "ar";

  // State Variables
  const [selectedCategory, setSelectedCategory] = useState<"leagues" | "booking" | "fan_trips" | "sports_news">("leagues");
  const [selectedLeague, setSelectedLeague] = useState<"dz" | "ucl" | "saudi" | "qatar" | "epl" | "laliga" | "egy" | "wc" | "caf">("dz");
  const [schDayFilter, setSchDayFilter] = useState<"all" | "today" | "tomorrow" | "week">("all");
  const [schMonthFilter, setSchMonthFilter] = useState<"all" | "june" | "july">("all");
  const [ticketSearchQuery, setTicketSearchQuery] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [bookingType, setBookingType] = useState<"ticket_only" | "full_package">("ticket_only");
  const [bookingSuccess, setBookingSuccess] = useState<SportsBooking | null>(null);

  // Advanced Filtering & Custom Teams Tracking
  const [leagueFilter, setLeagueFilter] = useState<"all" | "saudi" | "european" | "international">("all");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");
  const [customTeamInput, setCustomTeamInput] = useState<string>("");

  // Form Booking Data
  const [bookingMatchId, setBookingMatchId] = useState("");
  const [bookingQty, setBookingQty] = useState(1);
  const [bookingTier, setBookingTier] = useState<"standard" | "premium" | "vip">("standard");
  const [customerName, setCustomerName] = useState("");
  const [customerPassport, setCustomerPassport] = useState("");

  // Group fan trips status & list
  const [fanGroupTrips, setFanGroupTrips] = useState<FanGroupTrip[]>(() => {
    try {
      const saved = localStorage.getItem("fos7a_fan_group_trips");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("fos7a_fan_group_trips", JSON.stringify(fanGroupTrips));
  }, [fanGroupTrips]);

  // Form states for Custom Group Tour
  const [tripTournament, setTripTournament] = useState("FIFA World Cup 2026");
  const [tripDestination, setTripDestination] = useState("");
  const [tripFansQty, setTripFansQty] = useState(15);
  const [tripTransport, setTripTransport] = useState<"charter" | "bus" | "airline" | "none">("charter");
  const [tripShirts, setTripShirts] = useState(true);
  const [tripDrums, setTripDrums] = useState(true);
  const [tripMeals, setTripMeals] = useState(false);
  const [tripLeaderName, setTripLeaderName] = useState("");
  const [tripLeaderPhone, setTripLeaderPhone] = useState("");
  const [groupSuccess, setGroupSuccess] = useState<FanGroupTrip | null>(null);

  // Booking history stored offline in LocalStorage
  const [bookingsList, setBookingsList] = useState<SportsBooking[]>(() => {
    try {
      const saved = localStorage.getItem("fos7a_sports_bookings");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("fos7a_sports_bookings", JSON.stringify(bookingsList));
  }, [bookingsList]);

  // Sports Alerts, Reminders, Favorites & Intelligent Search States
  const [alertedMatches, setAlertedMatches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("fos7a_match_alerts");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [favoriteTeams, setFavoriteTeams] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("fos7a_favorite_teams");
      return saved ? JSON.parse(saved) : ["MC Alger", "المنتخب الجزائري محاربو الصحراء"];
    } catch {
      return ["MC Alger", "المنتخب الجزائري محاربو الصحراء"];
    }
  });

  const [favoriteLeagues, setFavoriteLeagues] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("fos7a_favorite_leagues");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(false);
  const [calendarModalMatch, setCalendarModalMatch] = useState<MatchFixture | null>(null);
  const [selectedItineraryDay, setSelectedItineraryDay] = useState<number>(0);
  const [localChantText, setLocalChantText] = useState<{ lyric: string; translation: string } | null>(null);
  const [cheeredClub, setCheeredClub] = useState<string>("");
  const [showSyncSuccessAlert, setShowSyncSuccessAlert] = useState<string | null>(null);

  // Active Football Tournament Filter
  const [activeCompetitionFilter, setActiveCompetitionFilter] = useState<string>("الكل");
  // Active Sports Hub Style (Pitch, Night, Gold, Violet)
  const [activeHubTheme, setActiveHubTheme] = useState<"pitch" | "night" | "gold" | "violet" >(() => {
    return (localStorage.getItem("fos7a_sports_hub_theme") as any) || "pitch";
  });

  // Sports Intelligence Chatbot
  const [smartChatInput, setSmartChatInput] = useState<string>("");
  const [chatOpened, setChatOpened] = useState<boolean>(true); // Open chatbot by default as a key interactive element on page!
  const [smartChatLoading, setSmartChatLoading] = useState<boolean>(false);
  const [chatFavoriteTeam, setChatFavoriteTeam] = useState<string>(() => {
    return localStorage.getItem("fos7a_chat_favorite_team") || "";
  });
  const [smartChatHistory, setSmartChatHistory] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    {
      role: "assistant",
      text: isAr
        ? "أهلاً بك يا بطل! أنا «ملعب» (Mal3ab) ⚽، مستشارك الرياضي الممتاز لوكالة فسحة ديزاد والمحدث بلحظ اللحظة من Goal.com الرياضية. ما هو فريقك المفضل الذي تشجعه بدفء لنبدأ؟"
        : "Welcome champion! I am «Mal3ab» ⚽, your premium interactive sports advisor sourced with live Goal.com news. What is your favorite football club to customize your dashboard?"
    }
  ]);

  // Goal.com Live Matches Dynamic States & Interface (يوم المباراة، النتيجة، المسجلون)
  interface ParsedGoalMatch {
    matchDay: string;
    homeTeam: string;
    awayTeam: string;
    result: string;
    scorers: string;
    category: "today" | "upcoming" | "recent";
  }

  const [activeGoalFilter, setActiveGoalFilter] = useState<"all" | "today" | "upcoming" | "recent">("all");
  const [goalParsedMatches, setGoalParsedMatches] = useState<ParsedGoalMatch[]>([]);
  const [parsingLoading, setParsingLoading] = useState<boolean>(false);

  // Worldwide Football News state - moment by moment
  const [newsFeed, setNewsFeed] = useState<Array<{
    id: string;
    titleEn: string;
    titleAr: string;
    categoryEn: string;
    categoryAr: string;
    timeEn: string;
    timeAr: string;
    likes: number;
    shares: number;
    hasLiked?: boolean;
    hasShared?: boolean;
    descEn: string;
    descAr: string;
  }>>([
    {
      id: "news-1",
      titleEn: "MC Alger completes a masterclass pre-season setup for CAF Champions League",
      titleAr: "مولودية الجزائر تستعد لضم صفقة من الطراز العالمي استعداداً لدوري أبطال أفريقيا 🟢🔴",
      categoryEn: "National Team & Local Clubs",
      categoryAr: "دوري رصيد وطني وأندية",
      timeEn: "2 minutes ago",
      timeAr: "منذ دقيقتين",
      likes: 142,
      shares: 39,
      descEn: "Team staff announced a set of strict fitness camps in high altitude and special tactics alignment.",
      descAr: "تقارير تؤكد أن العميد يضع اللمسات الأخيرة لاستئجار خبراء فنيين وتنظيم معسكر مغلق لضمان الصدارة القارية."
    },
    {
      id: "news-2",
      titleEn: "Stade Chahid Hamlaoui gears up for historic Algerian Cup turnout",
      titleAr: "لجنة الفيفا تشيد بمواصفات ملعب الشهيد حملاوي بقسنطينة وميلود هدفي بوهران لاستضافة التصفيات 🇩🇿🏆",
      categoryEn: "Infrastructure & Stadiums",
      categoryAr: "الملاعب والبنى التحتية",
      timeEn: "15 minutes ago",
      timeAr: "منذ 15 دقيقة",
      likes: 87,
      shares: 12,
      descEn: "Perfect pitch conditions and modern spectator entrance gates recorded in recent inspection.",
      descAr: "أعرب مفتشو الفيفا عن انبهارهم بنجاعة نظام الدخول الذكي وأرضية العشب الطبيعية المذهلة المطابقة للمقاييس الكونية."
    },
    {
      id: "news-3",
      titleEn: "JS Kabylie starts massive youth developmental academy in Tizi Ouzou",
      titleAr: "إدارة شبيبة القبائل تفتتح أكاديميتها المتكاملة للفئات السنية بدعم تراثي استثنائي 💛💚",
      categoryEn: "Youth Development",
      categoryAr: "التراث والفئات السنية",
      timeEn: "45 minutes ago",
      timeAr: "منذ 45 دقيقة",
      likes: 215,
      shares: 55,
      descEn: "Legendary former players appointed to supervise kids training with special local lodging facilities.",
      descAr: "تجمع كروي عائلي يحتفل بتعيين قدامى المحاربين لجمع وتأهيل البراعم الصاعدة لغرس الروح الرياضية القبائلية."
    },
    {
      id: "news-4",
      titleEn: "UCL Super Clash: Real Madrid vs Manchester City Predicted Lineups released",
      titleAr: "نهائي مبكر: ريال مدريد يواجه مانشستر سيتي مع ميركاتو صيفي خيالي ومقترحات المشجعين 🇪🇺✈️",
      categoryEn: "Champions League",
      categoryAr: "دوري أبطال أوروبا والعالمي",
      timeEn: "1 hour ago",
      timeAr: "منذ ساعة واحدة",
      likes: 310,
      shares: 98,
      descEn: "Tactical geniuses prepare to battle under Wembley's magical lights for the absolute European crown.",
      descAr: "توقعات بمدرجات تاريخية وازدحام لرحلات المشجعين المتجهة من دول المينا ولندن لمساندة الملكي والسيتي."
    }
  ]);

  const [transferGossip, setTransferGossip] = useState<Array<{
    titleAr: string;
    titleEn: string;
    cost: string;
    status: string;
  }>>([
    {
      titleAr: "بطل الجزائر مولودية الجزائر تفتح قنوات اتصال للتوقيع مع صانع ألعاب من العيار الثقيل.",
      titleEn: "PSG & Euro super scouts report massive interest in Algerian local League prospects.",
      cost: "Goal Target: CAF",
      status: "91%"
    },
    {
      titleAr: "أهلي جدة ونادي النصر السعودي يقتربان من حسم صفقة متبادلة لتعزيز الدفاع والارتكاز بالدوري.",
      titleEn: "Al Nassr & Al-Ahli explore defensive squad adjustments in Riyadh meetings.",
      cost: "Deal value: Undisclosed",
      status: "Negotiating"
    },
    {
      titleAr: "شبيبة القبائل تبدأ معسكر التنمية الرياضية ومفاوضات لجلب مدرب كونتنينتال خبير.",
      titleEn: "JS Kabylie recruits certified Continental coaches for upcoming season setup.",
      cost: "Tactical Alignment: Active",
      status: "95%"
    }
  ]);

  useEffect(() => {
    // Live simulator loop for Goal.com sports news ticker and transfer gossip tracker
    const interval = setInterval(() => {
      // 1. Randomly update likes/shares for news
      setNewsFeed((prev) =>
        prev.map((item) => {
          if (Math.random() > 0.6) {
            return {
              ...item,
              likes: item.likes + Math.floor(Math.random() * 3) + 1,
              shares: item.shares + (Math.random() > 0.85 ? 1 : 0),
            };
          }
          return item;
        })
      );

      // 2. Randomly update transfer percentage probability or values
      setTransferGossip((prev) => {
        return prev.map((g) => {
          if (Math.random() > 0.65) {
            if (g.status.endsWith("%")) {
              const currentVal = parseInt(g.status);
              const newVal = Math.min(99, Math.max(50, currentVal + (Math.random() > 0.5 ? 1 : -1)));
              return { ...g, status: `${newVal}%` };
            } else if (g.status === "Negotiating" || g.status === "قيد التفاوض") {
              return { ...g, status: "93%" };
            } else if (g.status === "Closing Deal" || g.status === "صفقة تنتهي") {
              return { ...g, status: "Done ✅" };
            }
          }
          return g;
        });
      });

      // 3. Randomly inject live news updates related to Goal/transfer rumors (every few ticks)
      if (Math.random() > 0.85) {
        const liveGossipFlashes = [
          {
            id: `liveticker-flash-${Date.now()}`,
            titleEn: "PSG scouts report strong interest in Algerian Ligue 1 best youth prospect.",
            titleAr: "متابعة غول: كشاف ميركاتو باريس سان جيرمان يحضر لقاء المولودية لمراقبة موهبة الوسط 🗼🇩🇿",
            categoryEn: "Scout Report",
            categoryAr: "رادار الكشافين",
            timeEn: "Just now",
            timeAr: "الآن",
            likes: 45,
            shares: 8,
            descEn: "European consultants recommend opening early negotiation pipelines with current staff.",
            descAr: "مستشارون فرنسيون يوصون بصياغة ملف رعاية مبكر وضبط بنود العقد لتسهيل رحلة فئة النخبة."
          },
          {
            id: `liveticker-flash-ticket-${Date.now()}`,
            titleEn: "Additional buses allocated for Algerian fans entering Stadium 5 Juillet.",
            titleAr: "تحديث عاجل: تخصيص 20 حافلة إضافية مجانية لنقل جماهير الكلاسيكو من المقرات الحضرية 🚌🏟️",
            categoryEn: "Commute",
            categoryAr: "تنسيق مواصلات",
            timeEn: "Just now",
            timeAr: "الآن",
            likes: 120,
            shares: 64,
            descEn: "Fos7a logistics coordinates with urban transport planners to release shuttle lines.",
            descAr: "الهيئات البلدية بالجزائر العاصمة تنسق مع تطبيق يسير لتأمين رحلات العودة لكافة المشجعين المسجلين."
          }
        ];
        const selected = liveGossipFlashes[Math.floor(Math.random() * liveGossipFlashes.length)];
        setNewsFeed((prev) => {
          if (prev.some((x) => x.titleAr === selected.titleAr)) return prev;
          return [selected, ...prev.slice(0, 5)];
        });
      }
    }, 10000); // 10 seconds refresh
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem("fos7a_match_alerts", JSON.stringify(alertedMatches));
  }, [alertedMatches]);

  useEffect(() => {
    localStorage.setItem("fos7a_favorite_teams", JSON.stringify(favoriteTeams));
  }, [favoriteTeams]);

  useEffect(() => {
    localStorage.setItem("fos7a_favorite_leagues", JSON.stringify(favoriteLeagues));
  }, [favoriteLeagues]);

  const parseGoalMarkdown = (text: string, isArabicVal: boolean): ParsedGoalMatch[] => {
    if (!text) return [];

    const matches: ParsedGoalMatch[] = [];
    const lines = text.split("\n");

    let currentCategory: "today" | "upcoming" | "recent" = "today";
    let currentGroupDate = "";

    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const lowerLine = trimmed.toLowerCase();
      
      // Determine section
      if (trimmed.includes("مباريات اليوم") || lowerLine.includes("today's fixtures") || lowerLine.includes("today's matches")) {
        currentCategory = "today";
        continue;
      }
      if (trimmed.includes("المباريات القادمة") || lowerLine.includes("upcoming") || lowerLine.includes("next 7 days")) {
        currentCategory = "upcoming";
        continue;
      }
      if (trimmed.includes("النتائج الأخيرة") || lowerLine.includes("recent results") || lowerLine.includes("last results") || trimmed.includes("النتائج الاخيرة")) {
        currentCategory = "recent";
        continue;
      }

      if (trimmed.startsWith("---") || trimmed.startsWith("🔍") || (trimmed.startsWith("**") && !trimmed.includes("vs") && !trimmed.includes("ضد") && !trimmed.includes("-"))) {
        continue;
      }

      if (currentCategory === "upcoming" && (trimmed.startsWith("###") || trimmed.startsWith("####") || (trimmed.startsWith("**") && trimmed.endsWith("**") && !trimmed.includes("vs") && !trimmed.includes("-") && !trimmed.includes("ضد")))) {
        currentGroupDate = trimmed.replace(/[*#]/g, "").trim();
        continue;
      }

      // Check if it represents a match
      const representsMatch = trimmed.includes("vs") || trimmed.includes("ضد") || trimmed.includes("-") || /\d+/.test(trimmed);
      if (!representsMatch) continue;

      let cleanLine = trimmed.replace(/^[-*•\s⭐+]+/g, "").trim();
      cleanLine = cleanLine.replace(/\*\*/g, "");

      // Extract scorers
      let scorers = isArabicVal ? "لا يوجد أهداف مسجلة" : "No scorers listed";
      const scorerMatch = cleanLine.match(/\((أهداف|مسجلو الأهداف|أهداف:|مسجلي|أهداف|Scorers|Scorers:|Scorer:|Goals:|goals):\s*([^)]+)\)/i) || 
                          cleanLine.match(/\((أهداف:\s*[^)]+)\)/) ||
                          cleanLine.match(/\(([^)]*(?:بوعبيد|مسعودي|Bouabid|Messaoudi|Scored|goals|\d+')[^)]*)\)/i);
      
      if (scorerMatch) {
        scorers = scorerMatch[2] ? scorerMatch[2].trim() : scorerMatch[1].replace(/أهداف:\s*/, "").trim();
        cleanLine = cleanLine.replace(scorerMatch[0], "").trim();
      } else {
        const customScorersIdx = cleanLine.indexOf("أهداف:");
        if (customScorersIdx !== -1) {
          scorers = cleanLine.substring(customScorersIdx + 5).trim();
          cleanLine = cleanLine.substring(0, customScorersIdx).trim();
        } else {
          const customScorersEnIdx = cleanLine.indexOf("Scorers:");
          if (customScorersEnIdx !== -1) {
            scorers = cleanLine.substring(customScorersEnIdx + 8).trim();
            cleanLine = cleanLine.substring(0, customScorersEnIdx).trim();
          }
        }
      }

      let home = "";
      let away = "";
      let result = "";
      let isLive = false;

      // Clean line from scorelines like "Real Madrid 1 - 2 Bayern"
      const scorePatternMatch = cleanLine.match(/^([^\d-]+?)\s*(\d+)\s*[-–]\s*(\d+)\s*(.+)$/);
      if (scorePatternMatch) {
        home = scorePatternMatch[1].trim();
        result = `${scorePatternMatch[2]} - ${scorePatternMatch[3]}`;
        away = scorePatternMatch[4].trim();
      } else {
        let divider = "vs";
        if (cleanLine.includes(" vs ")) divider = " vs ";
        else if (cleanLine.includes(" VS ")) divider = " VS ";
        else if (cleanLine.includes(" ضد ")) divider = " ضد ";
        else if (cleanLine.includes(" - ")) divider = " - ";

        const parts = cleanLine.split(divider);
        if (parts.length >= 2) {
          home = parts[0].trim();
          const remainder = parts[1].trim();
          const innerScore = remainder.match(/(\d+)\s*-\s*(\d+)/);
          if (innerScore) {
            result = `${innerScore[1]} - ${innerScore[2]}`;
          } else {
            result = isArabicVal ? "غير متوفر" : "Unavailable";
          }

          if (remainder.includes("🔴 LIVE") || remainder.includes("LIVE") || remainder.includes("مباشر")) {
            isLive = true;
            if (result && result !== (isArabicVal ? "غير متوفر" : "Unavailable")) {
              result += " 🔴 LIVE";
            } else {
              result = "LIVE 🔴";
            }
          }

          away = remainder.split(/[(-]/)[0].trim();
        } else {
          home = cleanLine;
          away = isArabicVal ? "لم يحدد بعد" : "TBD";
          result = "-";
        }
      }

      if (!result || result === (isArabicVal ? "غير متوفر" : "Unavailable")) {
        const timeMatch = trimmed.match(/(\d{2}:\d{2})/);
        if (timeMatch) {
          result = timeMatch[1];
        } else {
          result = isArabicVal ? "ضد (مجدولة)" : "VS (Scheduled)";
        }
      }

      let matchDay = "";
      if (currentCategory === "today") {
        matchDay = isArabicVal ? "اليوم" : "Today";
      } else if (currentCategory === "recent") {
        matchDay = isArabicVal ? "مساء الأمس" : "Yesterday";
      } else {
        const dateInLine = cleanLine.match(/(الخميس|الجمعة|السبت|الأحد|الاثنين|الثلاثاء|الأربعاء)\s+\d+\s+\w+/i) ||
                          cleanLine.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+\w+\s+\d+/i) ||
                          trimmed.match(/-\s*([آ-يa-zA-Z\s]+\s+\d+\s*[آ-يa-zA-Z]*)/);
        if (dateInLine) {
          matchDay = dateInLine[0].replace(/^-/, "").trim();
        } else if (currentGroupDate) {
          matchDay = currentGroupDate;
        } else {
          matchDay = isArabicVal ? "الخميس 11 جوان" : "Thursday June 11";
        }
      }

      home = home.replace(/^[*•\s⭐+]+/g, "").replace(/\s*🟢\s*/, " ").trim();
      away = away.replace(/^[*•\s⭐+]+/g, "").replace(/\s*💛\s*/, " ").trim();

      matches.push({
        matchDay,
        homeTeam: home,
        awayTeam: away,
        result,
        scorers,
        category: currentCategory
      });
    }

    return matches;
  };

  const DEFAULT_RAW_DATA_STATIC_AR = `
🗓️ **مباريات اليوم**
⭐ مولودية الجزائر 🟢 vs شبيبة القبائل 💛 (الدوري المحلي) - 🔴 LIVE (التعادل الإيجابي 1-1)
شباب بلوزداد vs اتحاد العاصمة (كأس الجزائر) - 18:00 بتوقيت الجزائر (القناة السادسة الجزائرية)
ريال مدريد vs مانشستر سيتي (دوري أبطال أوروبا) - 20:50 بتوقيت الجزائر (بث مباشر Bein Sports)

---
📅 **المباريات القادمة** (7 أيام)
شبيبة الساورة vs وفاق سطيف - الخميس 11 جوان
أولمبي الشلف vs شباب قسنطينة - السبت 13 جوان

---
✅ **النتائج الأخيرة**
نجم مقرة 1 - 2 نادي بارادو (أهداف: بوعبيد د. 14، مسعودي د. 88)
`;

  const DEFAULT_RAW_DATA_STATIC_EN = `
🗓️ **Today's Fixtures**
⭐ MC Alger vs JS Kabylie - 🔴 LIVE (1-1)
CR Belouizdad vs USM Alger (Algerian Cup) - 18:00 Algerian Time
Real Madrid vs Manchester City (UEFA Champions League) - 20:50 Atlantic Time

---
📅 **Upcoming Commits** (Next 7 Days)
JS Saoura vs ES Setif - Thursday June 11
ASO Chlef vs CS Constantine - Saturday June 13

---
✅ **Recent Results**
NC Magra 1 - 2 Paradou AC (Scorers: Bouabid 14', Messaoudi 88')
`;

  const fetchAndParseGoalData = async () => {
    setParsingLoading(true);
    try {
      const res = await fetch("/api/sports-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: isAr ? "عرض مباريات وجدول اليوم ونتائج الامس مع مسجلين الاهداف" : "Show today's fixtures and yesterday's scores with scorers from Goal.com",
          favoriteTeam: chatFavoriteTeam || (favoriteTeams && favoriteTeams[0]),
          theme: activeHubTheme,
          competitionFilter: activeCompetitionFilter,
          lang: lang
        })
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      if (data.text) {
        const parsed = parseGoalMarkdown(data.text, isAr);
        if (parsed && parsed.length > 0) {
          setGoalParsedMatches(parsed);
          return;
        }
      }
      // Fallback
      throw new Error("No data");
    } catch {
      // Use perfect offline simulation fallback
      const rawText = isAr ? DEFAULT_RAW_DATA_STATIC_AR : DEFAULT_RAW_DATA_STATIC_EN;
      setGoalParsedMatches(parseGoalMarkdown(rawText, isAr));
    } finally {
      setParsingLoading(false);
    }
  };

  useEffect(() => {
    fetchAndParseGoalData();
  }, [lang, activeCompetitionFilter, chatFavoriteTeam]);

  // Sync standings table with active competition filter automatically
  useEffect(() => {
    const filterToLeague: Record<string, typeof selectedLeague> = {
      "دوري أبطال أوروبا": "ucl",
      "الدوري الإنجليزي": "epl",
      "الدوري الإسباني": "laliga",
      "الدوري السعودي": "saudi",
      "الدوري المصري": "egy",
      "كأس العالم 2026": "wc",
      "دوري أبطال أفريقيا": "caf",
      "الكل": "dz",
    };
    const mapped = filterToLeague[activeCompetitionFilter];
    if (mapped) setSelectedLeague(mapped);
  }, [activeCompetitionFilter]);

  // Mock Data: Standings
  const standingsData: Record<"dz" | "ucl" | "saudi" | "qatar" | "epl" | "laliga" | "egy" | "wc" | "caf", LeagueStanding[]> = {
    dz: [
      { position: 1, team: "MC Alger", teamAr: "مولودية الجزائر", played: 22, points: 51, form: ["W", "W", "D", "W", "W"] },
      { position: 2, team: "CR Belouizdad", teamAr: "شباب بلوزداد", played: 22, points: 43, form: ["W", "D", "W", "L", "W"] },
      { position: 3, team: "CS Constantine", teamAr: "شباب قسنطينة", played: 22, points: 40, form: ["D", "W", "W", "D", "L"] },
      { position: 4, team: "USM Alger", teamAr: "إتحاد الجزائر", played: 21, points: 38, form: ["W", "L", "W", "W", "D"] },
      { position: 5, team: "JS Kabylie", teamAr: "شبيبة القبائل", played: 22, points: 35, form: ["L", "W", "D", "W", "L"] },
    ],
    ucl: [
      { position: 1, team: "Real Madrid", teamAr: "ريال مدريد", played: 8, points: 22, form: ["W", "W", "W", "D", "W"] },
      { position: 2, team: "Manchester City", teamAr: "مانشستر سيتي", played: 8, points: 20, form: ["W", "W", "L", "W", "W"] },
      { position: 3, team: "Bayern Munich", teamAr: "بايرن ميونخ", played: 8, points: 18, form: ["W", "D", "W", "W", "L"] },
      { position: 4, team: "Paris Saint-Germain", teamAr: "باريس سان جيرمان", played: 8, points: 16, form: ["D", "W", "L", "W", "W"] },
      { position: 5, team: "FC Barcelona", teamAr: "برشلونة", played: 8, points: 15, form: ["W", "L", "W", "W", "D"] },
    ],
    saudi: [
      { position: 1, team: "Al-Hilal", teamAr: "الهلال", played: 24, points: 68, form: ["W", "W", "W", "W", "W"] },
      { position: 2, team: "Al-Nassr", teamAr: "النصر", played: 24, points: 56, form: ["W", "L", "W", "W", "W"] },
      { position: 3, team: "Al-Ahli", teamAr: "الأهلي", played: 24, points: 47, form: ["W", "D", "L", "W", "D"] },
      { position: 4, team: "Al-Ittihad", teamAr: "الاتحاد", played: 24, points: 43, form: ["L", "W", "W", "L", "W"] },
      { position: 5, team: "Al-Taawoun", teamAr: "التعاون", played: 24, points: 40, form: ["D", "D", "W", "L", "W"] },
    ],
    qatar: [
      { position: 1, team: "Al-Sadd", teamAr: "السد", played: 18, points: 43, form: ["W", "W", "D", "W", "W"] },
      { position: 2, team: "Al-Gharafa", teamAr: "الغرافة", played: 18, points: 40, form: ["W", "D", "W", "W", "L"] },
      { position: 3, team: "Al-Rayyan", teamAr: "الريان", played: 18, points: 38, form: ["W", "W", "L", "W", "W"] },
      { position: 4, team: "Al-Duhail", teamAr: "الدحيل", played: 18, points: 28, form: ["L", "W", "W", "D", "L"] },
      { position: 5, team: "Al-Arabi", teamAr: "العربي", played: 18, points: 26, form: ["D", "L", "W", "L", "W"] },
    ],
    epl: [
      { position: 1, team: "Arsenal", teamAr: "أرسنال", played: 30, points: 71, form: ["W", "W", "D", "W", "W"] },
      { position: 2, team: "Liverpool", teamAr: "ليفربول", played: 30, points: 70, form: ["L", "W", "W", "D", "W"] },
      { position: 3, team: "Manchester City", teamAr: "مانشستر سيتي", played: 30, points: 67, form: ["W", "W", "W", "D", "D"] },
      { position: 4, team: "Aston Villa", teamAr: "أستون فيلا", played: 30, points: 59, form: ["L", "W", "L", "W", "W"] },
      { position: 5, team: "Tottenham Hotspur", teamAr: "توتنهام", played: 30, points: 57, form: ["W", "L", "W", "L", "W"] },
    ],
    laliga: [
      { position: 1, team: "Real Madrid", teamAr: "ريال مدريد", played: 29, points: 72, form: ["W", "W", "D", "W", "W"] },
      { position: 2, team: "Barcelona", teamAr: "برشلونة", played: 29, points: 64, form: ["W", "D", "W", "W", "L"] },
      { position: 3, team: "Girona", teamAr: "جيرونا", played: 29, points: 62, form: ["L", "W", "L", "W", "L"] },
      { position: 4, team: "Atletico Madrid", teamAr: "أتلتيكو مدريد", played: 29, points: 55, form: ["L", "W", "L", "W", "W"] },
      { position: 5, team: "Athletic Club", teamAr: "أتلتيك بيلباو", played: 29, points: 53, form: ["W", "W", "D", "L", "W"] },
    ],
    egy: [
      { position: 1, team: "Al Ahly", teamAr: "الأهلي المصري", played: 18, points: 44, form: ["W", "W", "W", "W", "D"] },
      { position: 2, team: "Pyramids", teamAr: "بيراميدز", played: 18, points: 41, form: ["D", "W", "W", "L", "W"] },
      { position: 3, team: "Zamalek", teamAr: "الزمالك", played: 18, points: 38, form: ["W", "L", "W", "W", "L"] },
      { position: 4, team: "Al Masry", teamAr: "المصري البورسعيدي", played: 18, points: 34, form: ["W", "D", "L", "W", "L"] },
      { position: 5, team: "ZED FC", teamAr: "زد إف سي", played: 18, points: 31, form: ["D", "D", "W", "D", "D"] },
    ],
    wc: [
      { position: 1, team: "Argentina", teamAr: "الأرجنتين", played: 3, points: 9, form: ["W", "W", "W", "W", "W"] },
      { position: 2, team: "France", teamAr: "فرنسا", played: 3, points: 7, form: ["W", "D", "W", "L", "W"] },
      { position: 3, team: "Brazil", teamAr: "البرازيل", played: 3, points: 6, form: ["L", "W", "W", "D", "L"] },
      { position: 4, team: "England", teamAr: "إنجلترا", played: 3, points: 5, form: ["D", "W", "D", "W", "W"] },
      { position: 5, team: "Spain", teamAr: "إسبانيا", played: 3, points: 4, form: ["L", "D", "W", "W", "L"] },
    ],
    caf: [
      { position: 1, team: "Al Ahly", teamAr: "الأهلي المصري", played: 6, points: 12, form: ["W", "D", "W", "D", "W"] },
      { position: 2, team: "Esperance Tunis", teamAr: "الترجي التونسي", played: 6, points: 11, form: ["W", "L", "W", "W", "D"] },
      { position: 3, team: "Mamelodi Sundowns", teamAr: "صنداونز", played: 6, points: 10, form: ["W", "W", "D", "L", "W"] },
      { position: 4, team: "TP Mazembe", teamAr: "مازيمبي الوحش", played: 6, points: 8, form: ["L", "D", "W", "W", "L"] },
      { position: 5, team: "CR Belouizdad", teamAr: "شباب بلوزداد", played: 6, points: 8, form: ["D", "W", "L", "D", "W"] },
    ],
  };

  // Mock Data: Fixtures & Matches
  const fixturesData: MatchFixture[] = [
    // Local DZ (Algerian Ligue 1)
    {
      id: "M-DZ-1",
      league: "Algerian Ligue 1",
      leagueAr: "الرابطة الجزائرية المحترفة الأولى",
      homeTeam: "MC Alger",
      homeTeamAr: "مولودية الجزائر",
      awayTeam: "JS Kabylie",
      awayTeamAr: "شبيبة القبائل",
      date: "2026-06-12 18:00",
      venue: "Stade 5 Juillet 1962, Algiers",
      venueAr: "ملعب 5 جويلية 1962، الجزائر العاصمة",
      status: "scheduled",
      tournamentType: "local"
    },
    {
      id: "M-DZ-2",
      league: "Algerian Ligue 1",
      leagueAr: "الرابطة الجزائرية المحترفة الأولى",
      homeTeam: "CS Constantine",
      homeTeamAr: "شباب قسنطينة",
      awayTeam: "USM Alger",
      awayTeamAr: "إتحاد الجزائر",
      date: "2026-06-13 19:00",
      venue: "Stade Chahid Hamlaoui, Constantine",
      venueAr: "ملعب الشهيد حملاوي، قسنطينة",
      status: "scheduled",
      tournamentType: "local"
    },
    {
      id: "M-DZ-3",
      league: "Algerian Ligue 1",
      leagueAr: "الرابطة الجزائرية المحترفة الأولى",
      homeTeam: "MC Oran",
      homeTeamAr: "مولودية وهران",
      awayTeam: "CR Belouizdad",
      awayTeamAr: "شباب بلوزداد",
      date: "24-Hour Live Coverage",
      venue: "Stade Miloud Hadefi, Oran",
      venueAr: "ملعب ميلود هدفي، وهران",
      status: "live",
      homeScore: 1,
      awayScore: 1,
      tournamentType: "local"
    },
    // European (Champions League)
    {
      id: "M-EU-1",
      league: "UEFA Champions League Final",
      leagueAr: "دوري أبطال أوروبا",
      homeTeam: "Real Madrid",
      homeTeamAr: "ريال مدريد",
      awayTeam: "Manchester City",
      awayTeamAr: "مانشستر سيتي",
      date: "2026-06-18 21:00",
      venue: "Wembley Stadium, London",
      venueAr: "ملعب ويمبلي، لندن",
      status: "scheduled",
      tournamentType: "european"
    },
    // Saudi (Saudi Pro League)
    {
      id: "M-SA-1",
      league: "Saudi Pro League",
      leagueAr: "الدوري السعودي",
      homeTeam: "Al-Hilal",
      homeTeamAr: "الهلال",
      awayTeam: "Al-Nassr",
      awayTeamAr: "النصر",
      date: "2026-06-25 19:30",
      venue: "Kingdom Arena, Riyadh",
      venueAr: "المملكة أرينا، الرياض",
      status: "scheduled",
      tournamentType: "saudi"
    },
    // Qatar (Qatar Stars League)
    {
      id: "M-QA-1",
      league: "Qatar Stars League",
      leagueAr: "دوري نجوم قطر",
      homeTeam: "Al-Sadd",
      homeTeamAr: "السد",
      awayTeam: "Al-Rayyan",
      awayTeamAr: "الريان",
      date: "2026-06-21 19:00",
      venue: "Jassim Bin Hamad Stadium, Doha",
      venueAr: "ملعب جاسم بن حمد، الدوحة",
      status: "scheduled",
      tournamentType: "qatari"
    },
    // Global Packages / World Cup 2026
    {
      id: "M-GL-1",
      league: "FIFA World Cup 2026 Stadium Pack",
      leagueAr: "كأس العالم 2026",
      homeTeam: "Algeria",
      homeTeamAr: "الجزائر",
      awayTeam: "Mexico",
      awayTeamAr: "المكسيك",
      date: "2026-06-30 20:00",
      venue: "Estadio Azteca, Mexico City",
      venueAr: "ملعب أزتيكا، مكسيكو سيتي",
      status: "scheduled",
      tournamentType: "global"
    },
    {
      id: "M-GL-2",
      league: "FIFA World Cup 2026",
      leagueAr: "كأس العالم 2026",
      homeTeam: "Saudi Arabia",
      homeTeamAr: "السعودية",
      awayTeam: "Egypt",
      awayTeamAr: "مصر",
      date: "2026-07-04 18:00",
      venue: "MetLife Stadium, New Jersey",
      venueAr: "ملعب ميتلايف، نيوجيرسي",
      status: "scheduled",
      tournamentType: "global"
    },
    // English League (Premier League)
    {
      id: "M-EN-1",
      league: "English Premier League",
      leagueAr: "الدوري الإنجليزي",
      homeTeam: "Liverpool",
      homeTeamAr: "ليفربول",
      awayTeam: "Manchester United",
      awayTeamAr: "مانشستر يونايتد",
      date: "Yesterday's Clash",
      venue: "Anfield, Liverpool",
      venueAr: "ملعب آنفيلد، ليفربول",
      status: "finished",
      homeScore: 3,
      awayScore: 1,
      tournamentType: "european"
    },
    // Spanish League (La Liga)
    {
      id: "M-ES-1",
      league: "Spanish La Liga",
      leagueAr: "الدوري الإسباني",
      homeTeam: "Barcelona",
      homeTeamAr: "برشلونة",
      awayTeam: "Real Madrid",
      awayTeamAr: "ريال مدريد",
      date: "Yesterday's El Clasico",
      venue: "Camp Nou, Barcelona",
      venueAr: "ملعب سبوتيفاي كامب نو، برشلونة",
      status: "finished",
      homeScore: 2,
      awayScore: 3,
      tournamentType: "european"
    },
    // Egyptian League (Premier League)
    {
      id: "M-EG-1",
      league: "Egyptian Premier League",
      leagueAr: "الدوري المصري",
      homeTeam: "Al-Ahly",
      homeTeamAr: "الأهلي المصري",
      awayTeam: "Zamalek",
      awayTeamAr: "الزمالك",
      date: "2026-06-15 19:30",
      venue: "Cairo International Stadium, Cairo",
      venueAr: "ستاد القاهرة الدولي، القاهرة",
      status: "scheduled",
      tournamentType: "global"
    },
    // CAF Champions League (دوري أبطال أفريقيا)
    {
      id: "M-CAF-1",
      league: "CAF Champions League Group Stage",
      leagueAr: "دوري أبطال أفريقيا",
      homeTeam: "Al-Ahly",
      homeTeamAr: "الأهلي المصري",
      awayTeam: "MC Alger",
      awayTeamAr: "مولودية الجزائر",
      date: "2026-06-20 20:55",
      venue: "Stade Nelson Mandela, Algiers",
      venueAr: "ملعب نيلسون مانديلا، الجزائر العاصمة",
      status: "scheduled",
      tournamentType: "global"
    }
  ];

  // Autocomplete terms extractor
  const autocompleteTerms = useMemo(() => {
    const terms: { text: string; labelEn: string; labelAr: string; category: string }[] = [];
    
    // Major Leagues
    const uniqueLeagues = Array.from(new Set(fixturesData.map(f => f.league)));
    uniqueLeagues.forEach(lEn => {
      const f = fixturesData.find(match => match.league === lEn);
      if (f) {
        terms.push({ text: lEn, labelEn: lEn, labelAr: f.leagueAr, category: isAr ? "البطولات" : "Leagues" });
        terms.push({ text: f.leagueAr, labelEn: lEn, labelAr: f.leagueAr, category: isAr ? "البطولات" : "Leagues" });
      }
    });

    // Teams
    fixturesData.forEach(match => {
      terms.push({ text: match.homeTeam, labelEn: match.homeTeam, labelAr: match.homeTeamAr, category: isAr ? "الأندية" : "Clubs" });
      terms.push({ text: match.homeTeamAr, labelEn: match.homeTeam, labelAr: match.homeTeamAr, category: isAr ? "الأندية" : "Clubs" });
      terms.push({ text: match.awayTeam, labelEn: match.awayTeam, labelAr: match.awayTeamAr, category: isAr ? "الأندية" : "Clubs" });
      terms.push({ text: match.awayTeamAr, labelEn: match.awayTeam, labelAr: match.awayTeamAr, category: isAr ? "الأندية" : "Clubs" });
    });

    // Venues / Places
    fixturesData.forEach(match => {
      terms.push({ text: match.venue, labelEn: match.venue, labelAr: match.venueAr, category: isAr ? "الملاعب" : "Venues" });
      terms.push({ text: match.venueAr, labelEn: match.venue, labelAr: match.venueAr, category: isAr ? "الملاعب" : "Venues" });
    });

    // Remove duplicates
    const seen = new Set<string>();
    const uniq: typeof terms = [];
    terms.forEach(item => {
      if (!seen.has(item.text.toLowerCase())) {
        seen.add(item.text.toLowerCase());
        uniq.push(item);
      }
    });

    return uniq;
  }, [fixturesData, isAr]);

  const filteredSuggestions = useMemo(() => {
    const queryClean = ticketSearchQuery.trim().toLowerCase();
    if (!queryClean) return [];
    return autocompleteTerms.filter(item => 
      item.text.toLowerCase().includes(queryClean) &&
      item.text.toLowerCase() !== queryClean
    ).slice(0, 5);
  }, [ticketSearchQuery, autocompleteTerms]);

  // Global Tournaments
  const internationalTournaments: TournamentSchedule[] = [
    {
      name: "FIFA World Cup 2026",
      nameAr: "كأس العالم لكرة القدم 25 / 2026",
      nextEdition: "2026",
      host: "USA, Canada & Mexico",
      hostAr: "الولايات المتحدة الأمريكية، كندا والمكسيك",
      dates: "June 11 - July 19, 2026",
      datesAr: "11 جوان - 19 جويلية 2026",
      teamsCount: 48
    },
    {
      name: "TotalEnergies CAF Africa Cup of Nations",
      nameAr: "كأس أمم أفريقيا - الكان",
      nextEdition: "25/2026",
      host: "Morocco",
      hostAr: "المملكة المغربية",
      dates: "Winter Season 2025/2026",
      datesAr: "فصل الشتاء 25 / 2026",
      teamsCount: 24
    },
    {
      name: "UEFA European Championship",
      nameAr: "بطولة أمم أوروبا - اليورو",
      nextEdition: "2028",
      host: "United Kingdom & Ireland",
      hostAr: "المملكة المتحدة وجمهورية أيرلندا",
      dates: "Summer 2028",
      datesAr: "صيف 2028",
      teamsCount: 24
    },
    {
      name: "AFC Asian Cup",
      nameAr: "كأس أمم آسيا لكرة القدم",
      nextEdition: "2027",
      host: "Saudi Arabia",
      hostAr: "المملكة العربية السعودية",
      dates: "January 2027",
      datesAr: "جانفي 2027",
      teamsCount: 24
    },
    {
      name: "Copa América",
      nameAr: "كوبا أمريكا - بطولة المنتخبات اللاتينية",
      nextEdition: "2028",
      host: "Ecuador / USA Guest",
      hostAr: "الأكوادور والولايات المتحدة",
      dates: "June - July 2028",
      datesAr: "جوان - جويلية 2028",
      teamsCount: 16
    },
    {
      name: "Arab Nations Cup",
      nameAr: "كأس العرب للمنتخبات",
      nextEdition: "2025/2026",
      host: "Qatar",
      hostAr: "دولة قطر",
      dates: "December 2025 / 2026",
      datesAr: "ديسمبر 2025 / 2026",
      teamsCount: 16
    }
  ];

  // Pricing calculations
  const seatPrices: Record<"standard" | "premium" | "vip", number> = {
    standard: 1500,  // ~11 USD or 1,500 DZD
    premium: 4500,   // ~33 USD or 4,500 DZD
    vip: 12000       // ~90 USD or 12,000 DZD
  };

  const selectedMatchForBooking = useMemo(() => {
    return fixturesData.find(f => f.id === bookingMatchId) || fixturesData[0];
  }, [bookingMatchId]);

  const bookingTotalCost = useMemo(() => {
    const baseTicket = seatPrices[bookingTier] * bookingQty;
    if (bookingType === "full_package") {
      // Full sports tourism coverage with Flights + 4-Star Hotel stay + stadium transfers: add 78,000 DZD per fan
      return baseTicket + (78000 * bookingQty);
    }
    return baseTicket;
  }, [bookingTier, bookingQty, bookingType]);

  // Group Fan Trip Estimators
  const tourEstimatedCostPerFan = useMemo(() => {
    let base = 15000; // Base ticket & matching seat coordination
    if (tripTournament.includes("World Cup")) base = 125000; // World Cup travel assistance
    else if (tripTournament.includes("Africa Cup")) base = 55000; // AFCON coordination
    else if (tripTournament.includes("Arab Cup")) base = 48000; // Arab Cup package
    else if (tripTournament.includes("UEFA")) base = 85000; // Champions League final block

    let transportCost = 0;
    if (tripTransport === "charter") transportCost = 75000;
    else if (tripTransport === "bus") transportCost = 12000;
    else if (tripTransport === "airline") transportCost = 45000;

    let extras = 0;
    if (tripShirts) extras += 3500;
    if (tripDrums) extras += 1500;
    if (tripMeals) extras += 4000;

    return base + transportCost + extras;
  }, [tripTournament, tripTransport, tripShirts, tripDrums, tripMeals]);

  const groupTotalCost = useMemo(() => {
    return tourEstimatedCostPerFan * tripFansQty;
  }, [tourEstimatedCostPerFan, tripFansQty]);

  // Handle individual sport tourism / booking
  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPassport.trim()) {
      alert(isAr ? "يرجى تعبئة اسم المسافر ورقم جواز السفر لحجز التذكرة وباقة المشاهدة." : "Please fill in traveler name and passport to purchase match package tickets.");
      return;
    }

    const matchObj = selectedMatchForBooking;
    const newBooking: SportsBooking = {
      bookingId: "TKT-DZ-" + Math.floor(100000 + Math.random() * 900000).toString(),
      matchId: matchObj.id,
      homeTeam: matchObj.homeTeam,
      homeTeamAr: matchObj.homeTeamAr,
      awayTeam: matchObj.awayTeam,
      awayTeamAr: matchObj.awayTeamAr,
      leagueName: matchObj.league,
      leagueNameAr: matchObj.leagueAr,
      date: matchObj.date,
      qty: bookingQty,
      tier: bookingTier,
      bookingType: bookingType,
      totalCostDZD: bookingTotalCost,
      customerName: customerName,
      customerPassport: customerPassport,
      status: "Confirmed",
      qrCodeToken: `FOS7A-DZ-SPORT-${matchObj.id}-${bookingQty}-${Date.now()}`
    };

    setBookingsList([newBooking, ...bookingsList]);
    setBookingSuccess(newBooking);

    // Reset Form
    setCustomerName("");
    setCustomerPassport("");
  };

  // Handle custom group fan trips submission
  const handleGroupTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripLeaderName.trim() || !tripLeaderPhone.trim()) {
      alert(isAr 
        ? "يرجى تعبئة كافة اسم رئيس الوفد ورقم الهاتف لتنسيق حافلات ومباريات المشجعين." 
        : "Please enter delegation leader's name and contact number.");
      return;
    }

    const tObj = internationalTournaments.find(tour => tour.name === tripTournament);
    const tournamentTitleAr = tObj ? tObj.nameAr : tripTournament;

    const newGroup: FanGroupTrip = {
      id: "GRP-DZ-" + Math.floor(1000 + Math.random() * 9000).toString(),
      tournament: tripTournament,
      tournamentAr: tournamentTitleAr,
      destination: tripDestination || "Match Stadia",
      destinationAr: tripDestination || "البلد المضيف واستادات الدورة",
      fansQty: tripFansQty,
      transportType: tripTransport,
      extraShirts: tripShirts,
      extraDrums: tripDrums,
      extraMeals: tripMeals,
      totalEstimatedCostDZD: groupTotalCost,
      leaderName: tripLeaderName,
      leaderPhone: tripLeaderPhone,
      createdAt: new Date().toLocaleDateString("ar-DZ")
    };

    setFanGroupTrips([newGroup, ...fanGroupTrips]);
    setGroupSuccess(newGroup);

    // Reset leader details
    setTripLeaderName("");
    setTripLeaderPhone("");
  };

  // WhatsApp link generator for individual bookings
  const getWhatsAppBookingText = (booking: SportsBooking) => {
    const isAr = lang === "ar";
    const coverTypeStr = booking.bookingType === "full_package" 
       ? (isAr ? "باقة التكفل البري الفندقي الكامل (طيران + فندق 4★ + تنقلات + تذكرة)" : "Full Agency Match Coverage (Flights, Accommodation & Matches ticket)") 
       : (isAr ? "تذكرة دخول الملعب فقط (بدون رعاية سكنية)" : "Match Ticket Only");

    const text = isAr 
? `السلام عليكم وكالة فسحة ديزاد (Fos7a DZ)، أرغب في استكمال حجز تذكرة مباراة وتأكيد الباقة بالتنسيق معكم:
- رقم الحجز: ${booking.bookingId}
- المباراة: ${booking.homeTeamAr} ضد ${booking.awayTeamAr} (${booking.leagueNameAr})
- فئة المقعد: ${booking.tier.toUpperCase()}
- نوع التغطية: ${coverTypeStr}
- عدد التذاكر: ${booking.qty}
- الاسم الكامل: ${booking.customerName}
- جواز السفر: ${booking.customerPassport}
- القيمة الكلية المقدرة: DZD ${booking.totalCostDZD.toLocaleString()}

يرجى إرسال تفاصيل الدفع لـ CCP أو بريدي موب وتعليمات الانتقال للفندق والملعب شكرًا لكم!`
: `Hello Fos7a DZ Sports Agency, I want to finalize my football travel package:
- Booking voucher ID: ${booking.bookingId}
- Match: ${booking.homeTeam} vs ${booking.awayTeam} (${booking.leagueName})
- Seat tier: ${booking.tier.toUpperCase()}
- Coverage mode: ${coverTypeStr}
- Passengers: ${booking.qty}
- Name: ${booking.customerName}
- Passport number: ${booking.customerPassport}
- Overall Budget: DZD ${booking.totalCostDZD.toLocaleString()}

Please send secure payment instructions & match-day meeting point. Thank you!`;

    return `https://wa.me/213551234567?text=${encodeURIComponent(text)}`;
  };

  // WhatsApp link generator for group fan trips
  const getWhatsAppGroupText = (gTrip: FanGroupTrip) => {
    const isAr = lang === "ar";
    const transportStr = gTrip.transportType === "charter" 
      ? (isAr ? "رحلة تشارتر طائرة خاصة (Charter Flight)" : "Charter Flight")
      : gTrip.transportType === "bus"
        ? (isAr ? "باقة حافلات المشجعين البرية" : "Private Bus Service")
        : gTrip.transportType === "airline"
          ? (isAr ? "رحلات طيران تجارية مجمعة" : "Commercial Airline Tickets")
          : (isAr ? "بدون تنقل مركزي" : "No centralized coordination");

    const extrasList = [];
    if (gTrip.extraShirts) extrasList.push(isAr ? "أقمصة المشجعين الرسمية" : "Official jerseys");
    if (gTrip.extraDrums) extrasList.push(isAr ? "أدوات التشجيع والطبول والأعلام" : "Flags & Shakers");
    if (gTrip.extraMeals) extrasList.push(isAr ? "توفير الوجبات والمطاعم" : "Full Catering support");

    const text = isAr
? `السلام عليكم وكالة فسحة ديزاد (Fos7a DZ) لخدمات السياحة الرياضية، نود طلب تنظيم رحلة جماعية للمشجعين بالتنسيق معكم:
- رقم الطلب المرجعي للمجموعة: ${gTrip.id}
- البطولة الكبرى المرتقبة: ${gTrip.tournamentAr}
- الوجهة وتاريخ المباريات: ${gTrip.destinationAr}
- حجم وفد المشجعين: ${gTrip.fansQty} وفدًا مشجعًا
- خيارات النقل والمواصلات: ${transportStr}
- إضافات وباقات المشجعين: ${extrasList.join("، ") || "لا يوجد"}
- رئيس الوفد المنسق: ${gTrip.leaderName}
- هاتف روفد المشجعين: ${gTrip.leaderPhone}
- إجمالي التقدير للميزانية: DZD ${gTrip.totalEstimatedCostDZD.toLocaleString()}

يرجى تزويدنا بالعرض الرسمي المكتوب لإرساله لجهات الوفد والبدء بجمع جوازات السفر وتأكيد الحجوزات مع مكاتب الفنادق والبلديات. شكراً لتنسيقكم الرائع!`
: `Hello Fos7a DZ Agency, we want to design and book a Group Fan Trip Coordination:
- Fan Request ID: ${gTrip.id}
- Major Tournament: ${gTrip.tournament}
- Dest/Match details: ${gTrip.destination}
- Group count: ${gTrip.fansQty} supporters
- Transport Mode: ${transportStr}
- Extras: ${extrasList.join(", ") || "None"}
- Lead Organizer: ${gTrip.leaderName}
- Lead Contact: ${gTrip.leaderPhone}
- Estimated Total Budget: DZD ${gTrip.totalEstimatedCostDZD.toLocaleString()}

Please provide a detailed custom agency proposal for our sports tour delegation. Thank you!`;

    return `https://wa.me/213551234567?text=${encodeURIComponent(text)}`;
  };

  const handlePrintTicket = (booking: SportsBooking) => {
    const printContent = document.getElementById(`print-voucher-${booking.bookingId}`);
    if (printContent) {
      const originalContent = document.body.innerHTML;
      const printHTML = printContent.innerHTML;
      
      const popupWindow = window.open("", "_blank");
      if (popupWindow) {
        popupWindow.document.write(`
          <html>
            <head>
              <title>${isAr ? "تذكرة المباراة وباقة سفر المشجع" : "Match Ticket & Fan Package Voucher"}</title>
              <style>
                body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; background: #fff; color: #1e293b; direction: ${isAr ? "rtl" : "ltr"}; }
                .ticket-box { border: 3px double #cbd5e1; border-radius: 16px; padding: 30px; max-width: 650px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .header-logo { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
                .badge { background: #4f46e5; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
                .matches-vs { font-size: 24px; font-weight: 900; color: #0f172a; margin: 15px 0; display: flex; align-items: center; justify-content: center; gap: 10px; }
                .info-grid { display: grid; grid-cols-2; gap: 15px; margin-top: 20px; }
                .column-title { font-size: 11px; color: #64748b; font-weight: bold; }
                .column-data { font-size: 14px; color: #0f172a; font-weight: bold; margin-top: 3px; }
                .qr { display: flex; justify-content: center; margin-top: 30px; border-top: 1px dashed #e2e8f0; padding-top: 20px; }
              </style>
            </head>
            <body onload="window.print(); window.close();">
              <div class="ticket-box">
                ${printHTML}
              </div>
            </body>
          </html>
        `);
        popupWindow.document.close();
      }
    }
  };

  // 1. Toggle general Match Alert
  const handleToggleAlert = (matchId: string) => {
    setAlertedMatches(prev => {
      const isSet = prev.includes(matchId);
      if (isSet) {
        return prev.filter(id => id !== matchId);
      } else {
        return [...prev, matchId];
      }
    });

    // Also trigger sound/quote motivation
    const match = fixturesData.find(m => m.id === matchId);
    if (match) {
      setLocalChantText({
        lyric: isAr ? `⚽ تم تفعيل تنبيه اللقاء لمباراة ${match.homeTeamAr} ضد ${match.awayTeamAr}! سنشعل المدرجات حماساً!` : `⚽ Alert set for ${match.homeTeam} vs ${match.awayTeam}! Sound system is ready!`,
        translation: isAr ? "حافظ على تذكرتك قريبة وتابع الأحداث المباشرة لحظة بلحظة" : "Keep your digital ticket close and watch the live scores ticking"
      });
      setTimeout(() => setLocalChantText(null), 5000);
    }
  };

  // 2. Open Calendar/Itinerary sync Modal helper
  const handleOpenCalendarSync = (match: MatchFixture) => {
    setCalendarModalMatch(match);
    setSelectedItineraryDay(0);
  };

  // 3. Confirm adding Match Event to travel Itinerary Days
  const handleSaveEventToItinerary = () => {
    if (!calendarModalMatch) return;

    if (!activeItinerary) {
      // Bootstrap the plan if none exists
      handleBootstrappingSportItinerary(calendarModalMatch);
      setCalendarModalMatch(null);
      return;
    }

    try {
      const newItinerary = { ...activeItinerary };
      if (!newItinerary.days || newItinerary.days.length === 0) {
        newItinerary.days = [
          {
            dayNumber: 1,
            theme: isAr ? "يوم التشجيع الرياضي" : "Sports Celebration Day",
            activities: []
          }
        ];
      }

      const dayIdx = Math.min(selectedItineraryDay, newItinerary.days.length - 1);
      const targetDay = newItinerary.days[dayIdx];

      // Create a premium Match Activity
      const newActivity = {
        title: isAr 
          ? `⚽ مباراة: ${calendarModalMatch.homeTeamAr} ضد ${calendarModalMatch.awayTeamAr}`
          : `⚽ Match: ${calendarModalMatch.homeTeam} vs ${calendarModalMatch.awayTeam}`,
        description: isAr
          ? `حضور الحدث الرياضي الكروي المباشر في ${calendarModalMatch.venueAr}. تمت المزامنة عبر رادار مشجعي فسحةdz الرياضية.`
          : `Attend live sports fixture at ${calendarModalMatch.venue}. Sync'ed securely via SportsHub fan radar.`,
        timeOfDay: "Evening" as const,
        durationHours: 3,
        estimatedCostUSD: 15, // around 2000 DZD
        locationName: isAr ? calendarModalMatch.venueAr : calendarModalMatch.venue
      };

      if (!targetDay.activities) {
        targetDay.activities = [];
      }

      // Add activity & clear modal
      targetDay.activities.push(newActivity);
      
      // Auto register of alert for that match
      if (!alertedMatches.includes(calendarModalMatch.id)) {
        setAlertedMatches(prev => [...prev, calendarModalMatch.id]);
      }

      // Push back to LocalStorage & Dispatch event to trigger state sync
      localStorage.setItem("fos7a_active_itinerary", JSON.stringify(newItinerary));
      window.dispatchEvent(new Event("fos7a_local_itinerary_changed"));

      setShowSyncSuccessAlert(isAr ? "تم إدراج المباراة بنجاح في مخطط مفكرة رحلتك!" : "Match added to your travel itinerary calendar!");
      setTimeout(() => setShowSyncSuccessAlert(null), 5000);

      // Trigger celebratory club chant
      const clubToCheer = calendarModalMatch.homeTeam;
      handleTriggerChant(clubToCheer);
    } catch (e) {
      console.error("Failed adding match event to itinerary calendar:", e);
    }

    setCalendarModalMatch(null);
  };

  // 4. Instantly bootstrap a custom sports itinerary if none exists
  const handleBootstrappingSportItinerary = (match: MatchFixture) => {
    const defaultSportsItinerary = {
      destinationName: isAr ? match.venueAr.split("،")[1]?.trim() || "الجزائر العاصمة" : "Algiers, Algeria",
      country: isAr ? "الجزائر" : "Algerian Republic",
      tripDurationDays: 3,
      targetBudgetLevel: isAr ? "اقتصادي مريح" : "Affordable comfort",
      travelerType: isAr ? "عشاق الرياضة والمشجعين" : "Sports Fans & Explorer",
      languageCode: lang,
      days: [
        {
          dayNumber: 1,
          theme: isAr ? "الوصول وجولة الملاعب الرياضية العريقة" : "Arrival & Legendary Stadium Trails",
          activities: [
            {
              title: isAr ? "الوصول التكتيكي والاستقرار بالمدينة" : "Hotel check-in & setup",
              description: isAr ? "تسوية الأمتعة في النزل والاستعداد بارتداء قميص النادي المفضل" : "Unpacking gears and prep sports fan outfits",
              timeOfDay: "Morning" as const,
              durationHours: 2,
              estimatedCostUSD: 0,
              locationName: isAr ? "وسط المدينة / الفندق" : "City Center Hub"
            },
            {
              title: isAr ? `⚽ حضور المباراة: ${match.homeTeamAr} ضد ${match.awayTeamAr}` : `⚽ Match Attendance: ${match.homeTeam} vs ${match.awayTeam}`,
              description: isAr 
                ? `حماس منقطع النظير في ملعب ${match.venueAr}. أهازيج ملتهبة وتجربة رياضة خالدة بامتياز.`
                : `Ultimate live sports experience at ${match.venue}. Feel the deep fan chant rhythms.`,
              timeOfDay: "Evening" as const,
              durationHours: 4,
              estimatedCostUSD: 14,
              locationName: isAr ? match.venueAr : match.venue
            }
          ]
        },
        {
          dayNumber: 2,
          theme: isAr ? "استكشاف أسواق ومقاهي المشجعين الشعبية" : "Sublime Fan Cafes & Heritage Markets",
          activities: [
            {
              title: isAr ? "تذوق الأطعمة الشعبية ومناقشة التكتيك" : "Savor traditional fans breakfast specialty",
              description: isAr ? "شرب الشاي بالنعناع ومناقشة تفاصيل المباراة وخطط اللعب مع رواد المقاهي المحليين" : "Discuss match tactics with passionate elders at old tea shops",
              timeOfDay: "Afternoon" as const,
              durationHours: 3,
              estimatedCostUSD: 5,
              locationName: isAr ? "المدينة القديمة / القصبة" : "Old Kasbah alleys"
            }
          ]
        }
      ],
      customPackingList: [
        {
          category: isAr ? "أدوات التشجيع الرياضية والتراث" : "Stadium Cheering Gadgets & Clothing",
          items: [
            isAr ? "وشاح النادي الرسمي عازل" : "Official club scarf & beanies",
            isAr ? "قميص المنتخب الوطني الأخضر النقي" : "Algeria national green jersey",
            isAr ? "طبل صغير محمول للاهازيج" : "Compact stadium drum",
            isAr ? "واقي شمس وقبعة للمدرج المكشوف" : "Stadium outdoor sunscreen & shades"
          ]
        }
      ],
      localTravelTips: [
        isAr ? "يرجى الدخول للملعب ساعتين قبل صافرة البداية لتفادي طوابير الانتظار الكثيفة." : "Get inside stadium gates 2 hours prior to kickoff to avoid dense supporter congestion.",
        isAr ? "شارك في أهازيج المدرجات وارتد الملابس الرياضية المتوهجة بالوطنية!" : "Join the crowd choral chants and have absolute sport fun!"
      ]
    };

    localStorage.setItem("fos7a_active_itinerary", JSON.stringify(defaultSportsItinerary));
    window.dispatchEvent(new Event("fos7a_local_itinerary_changed"));

    setShowSyncSuccessAlert(isAr ? "🎉 قمنا بإنشاء مفكرة رحلة رياضية جديدة لك تلقائياً وسجلنا اللقاء بمفكرتك!" : "🎉 Successfully bootstrapped a brand new Sports Itinerary and attached this match!");
    setTimeout(() => setShowSyncSuccessAlert(null), 6000);
  };

  // 5. Follow Team and subscription
  const handleToggleFavoriteTeam = (teamName: string) => {
    setFavoriteTeams(prev => {
      const isFav = prev.includes(teamName);
      if (isFav) {
        return prev.filter(t => t !== teamName);
      } else {
        return [...prev, teamName];
      }
    });
  };

  // 6. Trigger specific club chants
  const handleTriggerChant = (team: string) => {
    setCheeredClub(team);
    const lowercaseTeam = team.toLowerCase();
    let currentChant = { lyric: "", translation: "" };

    if (lowercaseTeam.includes("mc alger") || lowercaseTeam.includes("مولودية")) {
      currentChant = {
        lyric: "🟢🔴 يا العاصمية والعميد الشناوة جايبين الهلال والبطولة لينا غالية.. أولاد البهجة حرس الملاعب!",
        translation: "The oldest Algerian athletic club supporters singing local patriotic pride."
      };
    } else if (lowercaseTeam.includes("js kabylie") || lowercaseTeam.includes("شبيبة")) {
      currentChant = {
        lyric: "💛💚 شبيبة القبائل رمز الهوية والأمل الساطع في تيزي وزو وجرجرة.. أنار جياسكا الدروب الكروية!",
        translation: "The traditional Kabyle yellow & green army with majestic mountain spirit."
      };
    } else if (lowercaseTeam.includes("algeria") || lowercaseTeam.includes("الجزائري")) {
      currentChant = {
        lyric: "🇩🇿 ون، تو، ثري، فيفا لالجيري! محاربو الصحراء يزأرون في قلب الملاعب الخضراء الصامدة!",
        translation: "The worldwide famous Algerian sports anthem '1-2-3 Viva l'Algerie!' unleashing passion."
      };
    } else if (lowercaseTeam.includes("real madrid") || lowercaseTeam.includes("الملكي")) {
      currentChant = {
        lyric: "👑 هلا مدريد! يا تاريخاً يتحدث بالمدرجات وصوت البرنابيو الفخم يرتجف رهبة وهيبة!",
        translation: "Hala Madrid echoing worldwide with royal class and absolute champion authority."
      };
    } else {
      currentChant = {
        lyric: "⚽ حيوا الرياضيين وشجعوا الأبطال.. الملاعب فضاء التآخي والمودة والسلام والإلهام!",
        translation: "Cheer the athletic pioneers and hold absolute sportsmanship respect to high heights."
      };
    }

    setLocalChantText(currentChant);
    setTimeout(() => {
      setLocalChantText(null);
      setCheeredClub("");
    }, 8500);
  };

  // 7. Sports Search Assistant replies
  const handleSmartSearchQuery = async (questionText: string) => {
    const textToAnalyze = questionText.trim();
    if (!textToAnalyze || smartChatLoading) return;

    // Append user message immediately
    setSmartChatHistory(prev => [
      ...prev,
      { role: "user", text: questionText }
    ]);
    setSmartChatInput("");
    setSmartChatLoading(true);

    try {
      const res = await fetch("/api/sports-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToAnalyze,
          favoriteTeam: chatFavoriteTeam,
          theme: activeHubTheme,
          competitionFilter: activeCompetitionFilter,
          lang: isAr ? "ar" : "en"
        })
      });

      if (!res.ok) {
        throw new Error("Advisor response not ok");
      }

      const data = await res.json();
      let assistantMsg = data.text || "";

      // If a favorite team was newly set or updated
      if (data.detectedTeam) {
        setChatFavoriteTeam(data.detectedTeam);
        localStorage.setItem("fos7a_chat_favorite_team", data.detectedTeam);
      }

      // Append assistant reply with optional cited sources
      if (data.sources && data.sources.length > 0) {
        const sourceLines = data.sources
          .map((s: any) => `• [${s.title}](${s.uri})`)
          .join("\n");
        assistantMsg += `\n\n🔗 **${isAr ? "المصادر المرجعية للبحث المباشر:" : "Grounding Sources:"}**\n${sourceLines}`;
      }

      setSmartChatHistory(prev => [
        ...prev,
        { role: "assistant", text: assistantMsg }
      ]);
    } catch (err) {
      console.error("Error calling sports advisor:", err);
      // fallback
      const fallbackMsg = isAr
        ? "عذراً يا كابتن، واجهت مشكلة في الاتصال بالملعب الفوري لتنسيق النتائج والمواعيد من Goal.com. يرجى تكرار المحاولة في غضون ثوانٍ قليلة!"
        : "Sorry companion, I faced a connection issue reaching the Goal.com Live Index. Please try again in a few moments!";
      setSmartChatHistory(prev => [
        ...prev,
        { role: "assistant", text: fallbackMsg }
      ]);
    } finally {
      setSmartChatLoading(false);
    }
  };

  // 8. Refresh and inject new Breaking soccer news and transfers
  const handleRefreshBreakingNews = () => {
    const extraNews = [
      {
        id: `news-extra-${Date.now()}`,
        titleEn: "BREAKING: Algerian National Team coach reviews stadium options for 2026 WC Qualifiers",
        titleAr: "عاجل: مدرب المنتخب الوطني محاربو الصحراء يحدد أسماء الملاعب الرسمية لتصفيات المونديال 🇩🇿💪",
        categoryEn: "National Team",
        categoryAr: "محاربو الصحراء الوطني",
        timeEn: "Just now",
        timeAr: "الآن بلحظتها",
        likes: 295,
        shares: 64,
        descEn: "Coach emphasizes that natural grass pitches of Algiers and Constantine will give players perfect high speed transition advantage.",
        descAr: "صرح الناخب الوطني بأن الاستعداد الذهني وجاهزية الملاعب الصامدة في وهران والجزائر ستصنع الفارق للعبور كمتصدرين."
      },
      {
        id: `news-extra-2-${Date.now()}`,
        titleEn: "Al-Hilal vs Al-Nassr: Intense Riyadh Derby matches sell out offline",
        titleAr: "ميركاتو روشن: الهلال والنصر يستعدان للتصادم في قمة تكتيكية مذهلة بالمملكة أرينا 🔥🇸🇦",
        categoryEn: "Saudi Pro League",
        categoryAr: "دوري روشن السعودي",
        timeEn: "5 minutes ago",
        timeAr: "منذ 5 دقائق",
        likes: 180,
        shares: 41,
        descEn: "Riyadh gears up to host thousand and millions of traveling fans for the biggest Gulf match of the season.",
        descAr: "تحضيرات ترفيهية وترتيبات ممتازة في المملكة أرينا لاستقبال الجماهير السعودية والعربية لقمة الكبار."
      }
    ];

    setNewsFeed(prev => {
      // Avoid inserting duplicates
      const filteredExtra = extraNews.filter(extra => !prev.some(p => p.titleAr === extra.titleAr));
      return [...filteredExtra, ...prev];
    });

    setLocalChantText({
      lyric: isAr ? "🔔 تم تحديث موجز الأخبار الرياضية العالمية والمحلية لحظة بلحظة بنجاح!" : "🔔 Global and domestic live news stories refreshed successfully!",
      translation: isAr ? "متابعة لصيقة لنبض الملاعب والتحركات التكتيكية والميركاتو" : "Continuous tracking of stadium activities and summer transfer market"
    });
    setTimeout(() => setLocalChantText(null), 6000);
  };

  const handleLikeNews = (newsId: string) => {
    setNewsFeed(prev => prev.map(item => {
      if (item.id === newsId) {
        const hasLiked = !item.hasLiked;
        return {
          ...item,
          hasLiked,
          likes: hasLiked ? item.likes + 1 : item.likes - 1
        };
      }
      return item;
    }));
  };

  const handleShareNews = (newsId: string) => {
    setNewsFeed(prev => prev.map(item => {
      if (item.id === newsId) {
        const hasShared = !item.hasShared;
        return {
          ...item,
          hasShared,
          shares: hasShared ? item.shares + 1 : item.shares - 1
        };
      }
      return item;
    }));
  };

  // Add custom favorite club/country to the radar
  const handleAddCustomFavoriteTeam = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customTeamInput.trim();
    if (!trimmed) return;

    if (!favoriteTeams.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
      setFavoriteTeams(prev => [...prev, trimmed]);
      setLocalChantText({
        lyric: isAr 
          ? `⭐ تم إضافة "${trimmed}" بنجاح! سنقوم بمطابقتها وتنبيهك بمواعيد مبارياتها أولاً بأول في الجدول.`
          : `⭐ "${trimmed}" added successfully! We'll track it and alert you of all schedule dates.`,
        translation: isAr 
          ? "تخصيص مباشر كامل لرادار الأندية والبطولات المفضلة في فسحة" 
          : "Complete user flexibility for tracking non-standard clubs"
      });
      setTimeout(() => setLocalChantText(null), 4500);
    }
    setCustomTeamInput("");
  };

  // Filter schedules or fixtures count accounting for Search Query AND showOnlyFavorites filter
  const filteredFixtures = useMemo(() => {
    return fixturesData.filter(f => {
      // 1. Active Competition Filter (The 8 requested pills)
      if (activeCompetitionFilter !== "الكل") {
        const cFilter = activeCompetitionFilter.trim();
        const fLeague = f.league.toLowerCase();
        const fLeagueAr = f.leagueAr;

        let isMatch = false;
        if (cFilter === "دوري أبطال أوروبا") {
          isMatch = fLeagueAr.includes("أبطال أوروبا") || fLeague.includes("champions league");
        } else if (cFilter === "الدوري الإنجليزي") {
          isMatch = fLeagueAr.includes("الإنجليزي") || fLeague.includes("premier league") || fLeague.includes("english");
        } else if (cFilter === "الدوري الإسباني") {
          isMatch = fLeagueAr.includes("الإسباني") || fLeague.includes("la liga") || fLeague.includes("spanish");
        } else if (cFilter === "الدوري السعودي") {
          isMatch = fLeagueAr.includes("السعودي") || fLeague.includes("saudi");
        } else if (cFilter === "الدوري المصري") {
          isMatch = fLeagueAr.includes("المصري") || fLeague.includes("egyptian") || fLeagueAr.includes("مصر");
        } else if (cFilter === "كأس العالم 2026") {
          isMatch = fLeagueAr.includes("كأس العالم") || fLeague.includes("world cup");
        } else if (cFilter === "دوري أبطال أفريقيا") {
          isMatch = fLeagueAr.includes("أبطال أفريقيا") || fLeague.includes("caf");
        }

        if (!isMatch) {
          return false;
        }
      }

      // 2. Favorite filter check (merges favoriteTeams list with chatFavoriteTeam choice)
      if (showOnlyFavorites) {
        const combinedFavs = [...favoriteTeams];
        if (chatFavoriteTeam && !combinedFavs.includes(chatFavoriteTeam)) {
          combinedFavs.push(chatFavoriteTeam);
        }

        const matchesFavTeam = combinedFavs.some(t => 
          f.homeTeam.toLowerCase().includes(t.toLowerCase()) || 
          f.homeTeamAr.includes(t) ||
          f.awayTeam.toLowerCase().includes(t.toLowerCase()) ||
          f.awayTeamAr.includes(t)
        );
        const matchesFavLeague = favoriteLeagues.some(l => 
          f.league.toLowerCase().includes(l.toLowerCase()) ||
          f.leagueAr.includes(l)
        );
        if (!matchesFavTeam && !matchesFavLeague) {
          return false;
        }
      }

      // 3. League classification toggle filter
      if (leagueFilter !== "all") {
        if (leagueFilter === "saudi" && f.tournamentType !== "saudi") {
          return false;
        }
        if (leagueFilter === "european" && f.tournamentType !== "european") {
          return false;
        }
        if (leagueFilter === "international" && f.tournamentType !== "global" && f.tournamentType !== "local" && f.tournamentType !== "qatari") {
          return false;
        }
      }

      // 4. Date range filter check (includes Day & Month buttons)
      const getMatchDate = (dateStr: string) => {
        if (!dateStr || dateStr.includes("24-Hour") || dateStr.includes("Live") || dateStr.includes("Yesterday") || dateStr.includes("الأمس")) {
          return "2026-06-12"; // Mock base today
        }
        const match = dateStr.match(/^\d{4}-\d{2}-\d{2}/);
        return match ? match[0] : "2026-06-12";
      };

      const matchDate = getMatchDate(f.date);

      // Apply schDayFilter
      if (schDayFilter !== "all") {
        const isLive = f.status === "live" || f.date.includes("Live") || f.date.includes("24-Hour");
        if (schDayFilter === "today") {
          if (!isLive && matchDate !== "2026-06-12") {
            return false;
          }
        } else if (schDayFilter === "tomorrow") {
          if (matchDate !== "2026-06-13") {
            return false;
          }
        } else if (schDayFilter === "week") {
          if (matchDate < "2026-06-12" || matchDate > "2026-06-19") {
            return false;
          }
        }
      }

      // Apply schMonthFilter
      if (schMonthFilter !== "all") {
        if (schMonthFilter === "june" && !matchDate.startsWith("2026-06")) {
          return false;
        }
        if (schMonthFilter === "july" && !matchDate.startsWith("2026-07")) {
          return false;
        }
      }

      if (startDateFilter && matchDate < startDateFilter) {
        return false;
      }
      if (endDateFilter && matchDate > endDateFilter) {
        return false;
      }

      // 5. Search query check
      const query = ticketSearchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        f.homeTeam.toLowerCase().includes(query) ||
        f.homeTeamAr.includes(query) ||
        f.awayTeam.toLowerCase().includes(query) ||
        f.awayTeamAr.includes(query) ||
        f.league.toLowerCase().includes(query) ||
        f.leagueAr.includes(query) ||
        f.venue.toLowerCase().includes(query) ||
        f.venueAr.includes(query)
      );
    });
  }, [ticketSearchQuery, showOnlyFavorites, favoriteTeams, favoriteLeagues, leagueFilter, startDateFilter, endDateFilter, activeCompetitionFilter, chatFavoriteTeam, schDayFilter, schMonthFilter]);

  // Symmetrically filter Goal.com live matches by selected tab competition AND Day/Month schedules
  const filteredGoalParsedMatches = useMemo(() => {
    let res = goalParsedMatches;

    // 1. Filter by Active Competition Filter
    if (activeCompetitionFilter !== "الكل") {
      const cFilter = activeCompetitionFilter.trim();
      res = res.filter(m => {
        const textToSearch = `${m.homeTeam} ${m.awayTeam} ${m.matchDay} ${m.result} ${m.scorers}`.toLowerCase();
        
        if (cFilter === "دوري أبطال أوروبا") {
          return textToSearch.includes("madrid") || textToSearch.includes("city") || textToSearch.includes("bayern") || textToSearch.includes("أبطال أوروبا") || textToSearch.includes("champions");
        } else if (cFilter === "الدوري الإنجليزي") {
          return textToSearch.includes("liverpool") || textToSearch.includes("arsenal") || textToSearch.includes("chelsea") || textToSearch.includes("manchester") || textToSearch.includes("إنجليز") || textToSearch.includes("يونايتد");
        } else if (cFilter === "الدوري الإسباني") {
          return textToSearch.includes("barcelona") || textToSearch.includes("real madrid") || textToSearch.includes("إسبان") || textToSearch.includes("ريال") || textToSearch.includes("برشلونة") || textToSearch.includes("أتلتيكو");
        } else if (cFilter === "الدوري السعودي") {
          return textToSearch.includes("hilal") || textToSearch.includes("nassr") || textToSearch.includes("ahli") || textToSearch.includes("ittihad") || textToSearch.includes("سعودي") || textToSearch.includes("الهلال") || textToSearch.includes("النصر");
        } else if (cFilter === "الدوري المصري") {
          return textToSearch.includes("ahly") || textToSearch.includes("zamalek") || textToSearch.includes("مصر") || textToSearch.includes("الأهلي") || textToSearch.includes("الزمالك") || textToSearch.includes("بيراميدز");
        } else if (cFilter === "كأس العالم 2026") {
          return textToSearch.includes("world cup") || textToSearch.includes("كأس العالم") || textToSearch.includes("argentina") || textToSearch.includes("france") || textToSearch.includes("brazil");
        } else if (cFilter === "دوري أبطال أفريقيا") {
          return textToSearch.includes("caf") || textToSearch.includes("أفريقيا") || textToSearch.includes("mca") || textToSearch.includes("مولودية") || textToSearch.includes("caf") || textToSearch.includes("الترجي") || textToSearch.includes("الأهلي");
        }
        return true;
      });
    }

    // 2. Filter by Day scheduling options
    if (schDayFilter !== "all") {
      if (schDayFilter === "today") {
        res = res.filter(m => m.category === "today" || m.matchDay.includes("اليوم") || m.matchDay.toLowerCase().includes("today") || m.result.includes("LIVE"));
      } else if (schDayFilter === "tomorrow") {
        res = res.filter(m => m.category === "upcoming" || m.matchDay.includes("غداً") || m.matchDay.toLowerCase().includes("tomorrow") || m.matchDay.includes("السبت") || m.matchDay.includes("Saturday"));
      } else if (schDayFilter === "week") {
        res = res.filter(m => m.category === "upcoming" || m.category === "today");
      }
    }

    // 3. Filter by Month scheduling options
    if (schMonthFilter !== "all") {
      res = res.filter(m => {
        const textToSearch = m.matchDay.toLowerCase();
        if (schMonthFilter === "june") {
          return textToSearch.includes("june") || textToSearch.includes("جوان") || textToSearch.includes("يونيو") || textToSearch.includes("06");
        } else if (schMonthFilter === "july") {
          return textToSearch.includes("july") || textToSearch.includes("جويلية") || textToSearch.includes("يوليو") || textToSearch.includes("07");
        }
        return true;
      });
    }

    return res;
  }, [goalParsedMatches, activeCompetitionFilter, schDayFilter, schMonthFilter]);

  return (
    <div className={`space-y-6 transition-all duration-300 p-1 rounded-3xl ${
      activeHubTheme === "night" ? "bg-slate-950 text-slate-100 p-2 border border-slate-800" :
      activeHubTheme === "gold" ? "bg-amber-50/5 text-slate-900" :
      activeHubTheme === "violet" ? "bg-fuchsia-100/10 text-slate-950" :
      "bg-slate-50/50"
    }`} id="sports-hub-dashboard">
      
      {/* Dynamic Header Banner with animated trophy & Commentary Greeting */}
      <div className={`p-6 rounded-3xl text-white border shadow-xl overflow-hidden relative flex flex-col md:flex-row items-center justify-between gap-6 ${
        activeHubTheme === "night" ? "bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border-slate-800" :
        activeHubTheme === "gold" ? "bg-gradient-to-br from-amber-950 via-slate-900 to-yellow-950 border-amber-600/40" :
        activeHubTheme === "violet" ? "bg-gradient-to-br from-purple-950 via-slate-900 to-fuchsia-950 border-fuchsia-800/40" :
        "bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 border-emerald-800/40"
      }`}>
        {/* Stadium turf photo layout placeholder overlay */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=600')` }} />
        
        <div className="z-10 text-right md:text-start max-w-xl space-y-2">
          {/* Logo badge */}
          <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-black tracking-wide text-amber-300">
            <Trophy className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>{isAr ? "«ملعب» (Mal3ab) ⚽ مساعد المشجع الذكي" : "«Mal3ab» ⚽ Your Stadium Companion"}</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
            {isAr ? "ملعبك الرياضي متكامل الأبعاد والبطولات" : "Your Premium Interactive Sports Arena"}
          </h2>
          <p className="text-xs text-slate-100 font-semibold leading-relaxed">
            {isAr 
              ? "تابع لحظة بلحظة صفقات ميركاتو غول Goal.com الحصرية، رادار مباريات اليوم والدوريات الكبرى، ونظم باقات سفرك السياحي الرياضي لحضور أقوى كلاسيكيات الساحرة المستديرة مع وكالة فسحة ديزاد."
              : "Check transfers, matchday rosters, and configure travel companion schedules synchronized with Goal.com and premier regional sources."}
          </p>
        </div>

        {/* Stadium Live visual widget */}
        <div className="z-10 h-28 w-28 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center shadow-lg backdrop-blur-md relative overflow-hidden shrink-0 group hover:border-amber-400/50 transition-all">
          <Trophy className="w-10 h-10 text-amber-400 drop-shadow-[0_4px_16px_rgba(251,191,36,0.3)] animate-pulse" />
          <span className="text-[9px] font-black tracking-widest text-emerald-300 mt-1 uppercase animate-pulse">
            {isAr ? "● متصل مباشر" : "● LIVE ACTIVE"}
          </span>
        </div>
      </div>

      {/* Stadium Theme & Dynamic Greeting Controller Panel */}
      <div className={`p-4 rounded-2xl border transition-all ${
        activeHubTheme === "night" ? "bg-slate-900 border-slate-800 text-white" :
        activeHubTheme === "gold" ? "bg-amber-500/5 border-amber-500/10" :
        activeHubTheme === "violet" ? "bg-fuchsia-500/5 border-fuchsia-500/10" :
        "bg-white border-slate-150"
      } space-y-4`}>
        
        {/* Theme selecter and Commentary Greetings */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-right lg:text-right">
            <p className="text-[10px] font-black text-slate-400 tracking-wide uppercase">
              🎙️ {isAr ? "تعليق المذيع المخصص" : "STADIUM ANNOUNCER BOOTH"}
            </p>
            <h3 className={`text-base font-black ${
              activeHubTheme === "night" ? "text-indigo-300" : "text-slate-800"
            }`}>
              {getPersonalizedGreeting(chatFavoriteTeam, isAr)}
            </h3>
          </div>

          {/* Dynamic Hub Theme Switcher */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 self-center">
            <span className="text-[10.5px] font-extrabold text-slate-400 mr-2">
              {isAr ? "أجواء الملعب 🏟️:" : "Pitch Vibe:"}
            </span>
            {[
              { id: "pitch" as const, label: isAr ? "🏟️ عشب طبيعي" : "🏟️ Pitch" },
              { id: "night" as const, label: isAr ? "🌙 سهرة مظلمة" : "🌙 Night View" },
              { id: "gold" as const, label: isAr ? "✨ كأس ذهبي" : "✨ Gold Trophy" },
              { id: "violet" as const, label: isAr ? "🟣 موجة مدرجات" : "🟣 Violet Wave" }
            ].map((themeOpt) => {
              const isActive = activeHubTheme === themeOpt.id;
              return (
                <button
                  key={themeOpt.id}
                  type="button"
                  onClick={() => {
                    setActiveHubTheme(themeOpt.id);
                    localStorage.setItem("fos7a_sports_hub_theme", themeOpt.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-650 text-white shadow-3xs ring-2 ring-indigo-500/20 scale-[1.01]"
                      : activeHubTheme === "night"
                      ? "bg-slate-800 text-slate-350 hover:bg-slate-750"
                      : "bg-slate-100 text-slate-650 hover:bg-slate-200"
                  }`}
                >
                  {themeOpt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Favorite Team interactive selector (Ask once on page / Choose loyalty) */}
        <div className="border-t border-slate-150/40 pt-3.5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center md:text-start">
            ❤️ {isAr ? "ما هو فريقك المفضل لتخصيص الواجهة والخدمة الرياضية؟" : "Select Favorite Club to Personalize Dashboard & Coach Theme:"}
          </p>
          
          <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
            {[
              { id: "MC Alger", label: "مولودية الجزائر 🟢🔴", short: "عميد الجزائر" },
              { id: "JS Kabylie", label: "شبيبة القبائل 💛💚", short: "كناري جرجرة" },
              { id: "Al-Ahly", label: "الأهلي المصري 🔴🇪🇬", short: "شياطين حمر" },
              { id: "Zamalek", label: "الزمالك المصري ⚪🇪🇬", short: "الفن والهندسة" },
              { id: "Al-Hilal", label: "الهلال السعودي 💙🇸🇦", short: "الزعيم الأزرق" },
              { id: "Al-Nassr", label: "النصر السعودي 💛🇸🇦", short: "العالمي الأصفر" },
              { id: "Real Madrid", label: "ريال مدريد 👑⚪", short: "البلانكوس الملكي" },
              { id: "Liverpool", label: "ليفربول 🔴🇬🇧", short: "ريدز الأنفيلد" }
            ].map((team) => {
              const matchesSelected = chatFavoriteTeam === team.id;
              const accentStyles = getTeamColorAccent(team.id);
              return (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => {
                    setChatFavoriteTeam(team.id);
                    localStorage.setItem("fos7a_chat_favorite_team", team.id);
                  }}
                  className={`px-3 py-2 rounded-xl text-[10.5px] font-bold border transition-all cursor-pointer ${
                    matchesSelected
                      ? `${accentStyles.bg} ${accentStyles.border} ${accentStyles.text} font-black ring-2 ring-indigo-500/15 scale-[1.03] shadow-3xs`
                      : activeHubTheme === "night"
                      ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                  title={team.short}
                >
                  {team.label}
                </button>
              );
            })}

            {chatFavoriteTeam && (
              <button
                type="button"
                onClick={() => {
                  setChatFavoriteTeam("");
                  localStorage.removeItem("fos7a_chat_favorite_team");
                }}
                className="px-3 py-2 rounded-xl text-[10px] font-bold bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 cursor-pointer transition-all"
              >
                ✕ {isAr ? "إظهار الكل" : "Reset Team"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Primary Category Switcher Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 pb-1 w-full gap-3 sm:gap-5">
        {[
          { id: "leagues" as const, labelAr: "🏆 رعاية الملاعب والنتائج", labelEn: "🏆 Pitch Action & Schedules" },
          { id: "sports_news" as const, labelAr: "📰 غول الرياضي وهامش الصفقات", labelEn: "📰 Goal.com News & Hub Gossip" },
          { id: "booking" as const, labelAr: "🎟️ باقات حجز مشجعين فسحة ديزاد", labelEn: "🎟️ Fan Flight & Hotel Booking" },
          { id: "fan_trips" as const, labelAr: "📣 تنسيق الرحلات الجماعية للملاعب", labelEn: "📣 Supporter Bus Tours Coordinator" }
        ].map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`pb-2.5 text-xs sm:text-sm font-black transition-all border-b-2 cursor-pointer ${
                isSelected
                  ? "border-indigo-600 text-indigo-700 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {isAr ? cat.labelAr : cat.labelEn}
            </button>
          );
        })}
      </div>

      {/* Stadium Chants sound overlays & Synchronization Alerts banner */}
      <div className="space-y-4">
        <AnimatePresence>
          {localChantText && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-emerald-950 border-2 border-emerald-500/20 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden flex items-center gap-4"
            >
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-emerald-500/10 rounded-l-2xl filter blur-xl pointer-events-none" />
              <div className="p-3 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-300 animate-pulse shrink-0">
                <Megaphone className="w-6 h-6" />
              </div>
              <div className="space-y-1 relative z-10 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {isAr ? "📣 أهازيج محفزة وصيحات الملاعب" : "📣 LIVE STADIUM CHANT SIMULATOR"}
                  </span>
                  {cheeredClub && (
                    <span className="text-[10px] text-amber-300 font-bold">
                      ⚔️ {cheeredClub}
                    </span>
                  )}
                </div>
                <p className="text-sm md:text-base font-black text-emerald-50 leading-relaxed font-sans text-start">
                  {localChantText.lyric}
                </p>
                <p className="text-[10.5px] text-emerald-300 font-semibold font-mono text-start">
                  💡 {localChantText.translation}
                </p>
              </div>
            </motion.div>
          )}

          {showSyncSuccessAlert && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-emerald-50 border border-emerald-250 p-4 rounded-2xl flex items-center gap-3.5 shadow-xs"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 font-extrabold animate-bounce">
                ✓
              </div>
              <div className="flex-1 text-start">
                <p className="text-xs font-extrabold text-emerald-900">
                  {isAr ? "تمت مجدولة المباراة بمخطط رحلتك بنجاح! 📅" : "Match appended to travel itinerary! 📅"}
                </p>
                <p className="text-[10.5px] font-bold text-emerald-700">
                  {showSyncSuccessAlert}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        
        {/* Category: Leagues (Standings and Fixtures) */}
        {selectedCategory === "leagues" && (
          <motion.div
            key="leagues"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6 w-full"
          >
            {/* Interactive Competition Filter Scrollable Tab Bar */}
            <div className={`p-4 rounded-3xl border transition-all ${
              activeHubTheme === "night" ? "bg-slate-900 border-slate-800 text-white" :
              activeHubTheme === "gold" ? "bg-amber-500/5 border-amber-600/20" :
              activeHubTheme === "violet" ? "bg-fuchsia-500/5 border-fuchsia-600/20" :
              "bg-white border-slate-150"
            } space-y-2.5`}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-445 uppercase tracking-widest text-start flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  🏆 {isAr ? "تصفية الفئات والبطولات الكبرى الحية" : "MAJOR TOURNAMENTS LIVE SCREENER"}
                </p>
                {activeCompetitionFilter !== "الكل" && (
                  <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    ⚽ {isAr ? `تصفية نشطة: ${activeCompetitionFilter}` : `Screener Active: ${activeCompetitionFilter}`}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-indigo-250">
                {[
                  { filterVal: "الكل", labelAr: "🏁 الكل", labelEn: "🏁 Show All" },
                  { filterVal: "دوري أبطال أوروبا", labelAr: "🇪🇺 دوري أبطال أوروبا", labelEn: "🇪🇺 Champions League" },
                  { filterVal: "الدوري الإنجليزي", labelAr: "🏴󠁧󠁢󠁥لنكليزية", labelEn: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League" },
                  { filterVal: "الدوري الإسباني", labelAr: "🇪🇸 الدوري الإسباني", labelEn: "🇪🇸 La Liga" },
                  { filterVal: "الدوري السعودي", labelAr: "🇸🇦 الدوري السعودي", labelEn: "🇸🇦 Saudi League" },
                  { filterVal: "الدوري المصري", labelAr: "🇪🇬 الدوري المصري", labelEn: "🇪🇬 Egyptian League" },
                  { filterVal: "كأس العالم 2026", labelAr: "🏆 كأس العالم 2026", labelEn: "🏆 World Cup" },
                  { filterVal: "دوري أبطال أفريقيا", labelAr: "🌍 دوري أبطال أفريقيا", labelEn: "🌍 CAF Champions League" }
                ].map((comp) => {
                  const isActive = activeCompetitionFilter === comp.filterVal;
                  return (
                    <button
                      key={comp.filterVal}
                      type="button"
                      onClick={() => {
                        setActiveCompetitionFilter(comp.filterVal);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-[11px] font-extrabold cursor-pointer transition-all shrink-0 border whitespace-nowrap ${
                        isActive
                          ? "bg-indigo-650 border-indigo-700 text-white font-extrabold shadow-sm scale-[1.01]"
                          : activeHubTheme === "night"
                          ? "bg-slate-800 border-slate-705 text-slate-350 hover:bg-slate-750"
                          : "bg-slate-50 border-slate-150 text-slate-655 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      {isAr ? comp.labelAr : comp.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: League standing tables (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-650" />
                  <h3 className="font-extrabold text-sm text-slate-800">
                    {isAr ? "جدول ترتيب الفرق وحالة الأداء" : "League Standings & Form"}
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                  {isAr ? "تحديث مباشر" : "Live Standings"}
                </span>
              </div>

              {/* Sub-League Toggles — synced with activeCompetitionFilter */}
              <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-xl">
                {([
                  { id: "dz" as const, labelAr: "المحلي🇩🇿", labelEn: "Ligue 1🇩🇿", filters: ["الكل"] },
                  { id: "ucl" as const, labelAr: "الأوروبي🇪🇺", labelEn: "UCL🇪🇺", filters: ["الكل", "دوري أبطال أوروبا"] },
                  { id: "epl" as const, labelAr: "الإنجليزي🏴󠁧󠁢󠁥󠁮󠁧󠁿", labelEn: "EPL🏴󠁧󠁢󠁥󠁮󠁧󠁿", filters: ["الكل", "الدوري الإنجليزي"] },
                  { id: "laliga" as const, labelAr: "الإسباني🇪🇸", labelEn: "LaLiga🇪🇸", filters: ["الكل", "الدوري الإسباني"] },
                  { id: "saudi" as const, labelAr: "السعودي🇸🇦", labelEn: "Saudi🇸🇦", filters: ["الكل", "الدوري السعودي"] },
                  { id: "egy" as const, labelAr: "المصري🇪🇬", labelEn: "Egypt🇪🇬", filters: ["الكل", "الدوري المصري"] },
                  { id: "wc" as const, labelAr: "كأس العالم🏆", labelEn: "World Cup🏆", filters: ["الكل", "كأس العالم 2026"] },
                  { id: "caf" as const, labelAr: "أبطال أفريقيا🌍", labelEn: "CAF🌍", filters: ["الكل", "دوري أبطال أفريقيا"] },
                  { id: "qatar" as const, labelAr: "القطري🇶🇦", labelEn: "Qatar🇶🇦", filters: ["الكل"] },
                ] as const).filter(l => l.filters.includes(activeCompetitionFilter)).map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setSelectedLeague(l.id)}
                    className={`py-1.5 px-2.5 text-[9.5px] sm:text-[10.5px] font-black rounded-lg cursor-pointer transition-all whitespace-nowrap ${
                      selectedLeague === l.id
                        ? "bg-white text-indigo-900 shadow-xs border border-slate-100/60"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {isAr ? l.labelAr : l.labelEn}
                  </button>
                ))}
              </div>

              {/* Standing Items list table */}
              <div className="space-y-2 overflow-x-auto">
                <table className="w-full text-xs text-right md:-mr-1 border-collapse min-w-[280px]">
                  <thead>
                    <tr className="text-slate-400 font-bold border-b border-slate-100 text-[10px] uppercase">
                      <th className="py-2 px-1 text-center w-8">#</th>
                      <th className="py-2 px-2 text-right">{isAr ? "النادي" : "Club"}</th>
                      <th className="py-2 px-1 text-center w-8">{isAr ? "ل" : "P"}</th>
                      <th className="py-2 px-1 text-center w-8">{isAr ? "ن" : "Pts"}</th>
                      <th className="py-2 px-2 text-center w-24">{isAr ? "آخر 5" : "Form"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standingsData[selectedLeague].map((team, idx) => (
                      <tr 
                        key={idx}
                        className={`hover:bg-slate-50/50 border-b border-slate-100/80 transition-colors ${
                          idx === 0 ? "bg-amber-500/5 hover:bg-amber-500/10" : ""
                        }`}
                      >
                        <td className="py-2 px-1 text-center font-black font-mono">
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : team.position}
                        </td>
                        <td className="py-2 px-2 font-black text-slate-800">
                          {isAr ? team.teamAr : team.team}
                        </td>
                        <td className="py-2 px-1 text-center font-mono font-semibold text-slate-500">
                          {team.played}
                        </td>
                        <td className="py-2 px-1 text-center font-mono font-extrabold text-indigo-755 bg-indigo-50/20">
                          {team.points}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <div className="flex items-center justify-center gap-1 font-mono text-[8px] font-black">
                            {team.form.map((f, fIdx) => (
                              <span 
                                key={fIdx}
                                className={`w-4 h-4 rounded-md flex items-center justify-center text-white ${
                                  f === "W" ? "bg-emerald-500" : f === "D" ? "bg-amber-550" : "bg-rose-500"
                                }`}
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10.5px] leading-relaxed text-slate-500 font-semibold text-start">
                🛡️ {isAr 
                  ? "يتم احتساب المراكز المؤهلة للمسابقات القارية (أفريقيا/أوروبا/آسيا) تلقائياً بناءً على الحسابات الحقيقية للفيفا وقواعد الدوريات المتبعة." 
                  : "Qualifications for continental tournaments (CAF/UEFA/AFC) computed dynamically in adherence to official league charters."}
              </div>

              {/* Verified Algerian & World Favorite Club Subscriptions soundboard */}
              <div className="border border-amber-100 rounded-2xl bg-amber-500/5 p-4.5 space-y-3 text-start">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-current" />
                    <h4 className="font-extrabold text-xs text-slate-800">
                      {isAr ? "رادار الأندية والمنتخبات المفضلة ⭐" : "Follow Favorite Clubs & Teams ⭐"}
                    </h4>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 bg-amber-100 border border-amber-200 text-amber-700 rounded-md font-black">
                    {isAr ? "دعم كامل ومفتوح" : "Completely Unlocked"}
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-550 leading-relaxed font-semibold">
                  {isAr 
                    ? "رادار موجه ومفتوح بالكامل! يمكنك البحث واختيار أي نادٍ أو منتخب محلي أو عالمي من القائمة للترميز السريع في الجداول، أو كتابة أي اسم مخصص بالكامل:"
                    : "Fully unlocked team tracking! Search and follow any local or international club/country directly, or type any unique custom team name:"}
                </p>

                {/* Intelligent Autocomplete and Dynamic Team addition form */}
                <div className="space-y-1.5">
                  <form 
                    onSubmit={handleAddCustomFavoriteTeam}
                    className="flex items-center gap-1.5"
                  >
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={customTeamInput}
                        onChange={(e) => setCustomTeamInput(e.target.value)}
                        placeholder={isAr ? "ابحث أو اكتب نادٍ/منتخب (مثال: ريال مدريد، مصر، سطيف)..." : "Search or type team (e.g. Real Madrid, Egypt, Setif)..."}
                        className="w-full text-[10.5px] px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:border-amber-400 bg-white text-slate-800 shadow-3xs font-semibold"
                      />
                      {customTeamInput && (
                        <button
                          type="button"
                          onClick={() => setCustomTeamInput("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 hover:text-slate-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-[10px] font-black cursor-pointer shadow-3xs transition-all shrink-0"
                    >
                      {isAr ? "متابعة +" : "Follow +"}
                    </button>
                  </form>

                  {/* Dynamic Suggestions List based on Search Input */}
                  {customTeamInput.trim().length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl max-h-40 overflow-y-auto p-1.5 space-y-1 shadow-xs animate-in fade-in slide-in-from-top-1">
                      <p className="text-[9px] text-slate-400 font-bold px-2 pb-1 border-b border-slate-100">
                        {isAr ? "مقترحات مطابقة (اضغط لمتابعة فورية):" : "Matching Suggestions (Click to follow):"}
                      </p>
                      {(() => {
                        const searchClean = customTeamInput.toLowerCase().trim();
                        const matches = POPULAR_GLOBAL_TEAMS.filter(t => 
                          t.id.toLowerCase().includes(searchClean) || 
                          t.ar.includes(searchClean) || 
                          t.en.toLowerCase().includes(searchClean)
                        );
                        if (matches.length === 0) {
                          return (
                            <div className="p-2 text-center text-slate-500 text-[10px] font-semibold">
                              <span>{isAr ? `لا توجد أندية مطابقة تماماً لـ "${customTeamInput}"` : `No direct catalog matches for "${customTeamInput}"`}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (customTeamInput.trim()) {
                                    setFavoriteTeams(prev => [...prev, customTeamInput.trim()]);
                                    setCustomTeamInput("");
                                  }
                                }}
                                className="block mt-1 mx-auto text-amber-655 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-[9px] font-black hover:bg-amber-100"
                              >
                                {isAr ? `➕ اضغط لمتابعة مخصصة لـ "${customTeamInput.trim()}"` : `➕ Click to track custom "${customTeamInput.trim()}"`}
                              </button>
                            </div>
                          );
                        }
                        return matches.map(team => {
                          const isFav = favoriteTeams.some(t => t.toLowerCase() === team.id.toLowerCase() || t === team.ar);
                          return (
                            <button
                              key={team.id}
                              type="button"
                              onClick={() => {
                                if (isFav) {
                                  setFavoriteTeams(prev => prev.filter(t => t.toLowerCase() !== team.id.toLowerCase() && t !== team.ar));
                                } else {
                                  setFavoriteTeams(prev => [...prev, team.id]);
                                  handleTriggerChant(team.id);
                                }
                              }}
                              className={`w-full text-right sm:text-left px-2 py-1.5 rounded-lg text-[10px] font-black flex items-center justify-between transition-colors ${
                                isFav ? "bg-amber-100 text-amber-805" : "hover:bg-slate-50 text-slate-705"
                              }`}
                            >
                              <span>{isAr ? team.ar : team.en}</span>
                              <span className="text-amber-500 font-normal">{isFav ? "★ متابع" : "☆ تابع"}</span>
                            </button>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>

                {/* Grid of Active Followed Teams */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-700">
                      {isAr ? "الأندية والمنتخبات النشطة بالرادار ★" : "Teams Active on Radar ★"}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold">
                      {isAr ? `(${favoriteTeams.length} متابعين)` : `(${favoriteTeams.length} followed)`}
                    </span>
                  </div>

                  {favoriteTeams.length === 0 ? (
                    <div className="text-center p-3.5 bg-white border border-dashed border-slate-200 rounded-xl text-slate-400 text-[10px] font-semibold">
                      {isAr 
                        ? "الرادار فارغ حالياً. اكتب أو اختر أنديتك لتلقي الإشعارات الفورية والمقاعد الممتازة!" 
                        : "No teams selected. Write or look up your entries above to unlock custom goal tickers!"}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                      {favoriteTeams.map((teamId) => {
                        const catalog = POPULAR_GLOBAL_TEAMS.find(t => t.id.toLowerCase() === teamId.toLowerCase() || t.ar === teamId);
                        const labelAr = catalog ? catalog.ar : `${teamId} ⭐`;
                        const labelEn = catalog ? catalog.en : `${teamId} ⭐`;
                        return (
                          <div
                            key={teamId}
                            className="bg-white border border-slate-150 rounded-xl p-2 flex items-center justify-between gap-1.5 shadow-3xs"
                          >
                            <span className="text-[10px] font-black text-slate-700 truncate w-[75%]">
                              {isAr ? labelAr : labelEn}
                            </span>
                            <button
                              type="button"
                              onClick={() => setFavoriteTeams(prev => prev.filter(t => t !== teamId))}
                              className="w-4 h-4 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded flex items-center justify-center font-black text-[9px] cursor-pointer"
                              title={isAr ? "إلغاء المتابعة" : "Unfollow"}
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 bg-white/70 border border-slate-200/50 px-3 py-2 rounded-xl text-[9px] font-black text-rose-700 tracking-wide uppercase select-none animate-pulse">
                  <span>✨ {isAr ? "المستحيل ليس جزائرياً! 🇩🇿" : "IMPOSSIBLE IS NOT ALGERIAN! 🇩🇿"}</span>
                  <span className="text-slate-400 font-mono font-normal">Fos7a DZ Sports</span>
                </div>
              </div>
            </div>

            {/* Right Column: Active fixtures list and booking trigger (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between w-full md:w-auto gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-650" />
                    <h3 className="font-extrabold text-sm text-slate-800">
                      {isAr ? "مواعيد وجدول المباريات القادمة والمباشرة" : "Fixtures Schedule & Match statuses"}
                    </h3>
                  </div>

                  {/* Quick Filters Pill block */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Favorites Filter Switch */}
                    <button
                      type="button"
                      onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                      className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-wide cursor-pointer transition-all border flex items-center gap-1 ${
                        showOnlyFavorites
                          ? "bg-amber-500 border-amber-550 text-white shadow-3xs"
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700"
                      }`}
                      title={isAr ? "تصفية: أنديتي ومفضلاتي فقط" : "Filter: My Favorites only"}
                    >
                      <span>★</span>
                      <span>{isAr ? "مفضلاتي" : "Favs Only"}</span>
                    </button>

                    {/* Chatbot Switch Toggle */}
                    <button
                      type="button"
                      onClick={() => setChatOpened(!chatOpened)}
                      className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-wide cursor-pointer transition-all border flex items-center gap-1 ${
                        chatOpened
                          ? "bg-indigo-600 border-indigo-650 text-white shadow-3xs"
                          : "bg-indigo-50 border-indigo-100 text-indigo-650"
                      }`}
                      title={isAr ? "تفعيل دردشة مشجعي فسحة الرياضية" : "Toggle smart football chatbot assistant"}
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>{isAr ? "مساعد ذكي" : "AI Advisor"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Day & Month Scheduling & Filtering Panel */}
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3.5 my-2 text-start">
                {/* 1. Day Scheduler Filters */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="space-y-1 w-full">
                    <span className="text-[10px] font-black text-indigo-750 tracking-widest block uppercase">
                      📅 {isAr ? "جدولة المواعيد والنتائج حسب اليوم" : "Schedule Timetable by Day"}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {[
                        { id: "all" as const, labelAr: "🏁 الكل", labelEn: "🏁 All" },
                        { id: "today" as const, labelAr: "⚽ مباريات اليوم", labelEn: "⚽ Today's" },
                        { id: "tomorrow" as const, labelAr: "🌅 مباريات الغد", labelEn: "🌅 Tomorrow's" },
                        { id: "week" as const, labelAr: "📆 هذا الأسبوع", labelEn: "📆 This Week" }
                      ].map((dOpt) => (
                        <button
                          key={dOpt.id}
                          type="button"
                          onClick={() => setSchDayFilter(dOpt.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            schDayFilter === dOpt.id
                              ? "bg-indigo-600 border-indigo-650 text-white shadow-3xs"
                              : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                          }`}
                        >
                          {isAr ? dOpt.labelAr : dOpt.labelEn}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Month Scheduler Filters */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-slate-200/55 pt-3">
                  <div className="space-y-1 w-full sm:w-auto">
                    <span className="text-[10px] font-black text-amber-600 tracking-widest block uppercase">
                      📆 {isAr ? "ترشيح جدول المباريات حسب الشهر" : "Schedule Timetable by Month"}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {[
                        { id: "all" as const, labelAr: "♾️ كل الشهور المتاحة", labelEn: "♾️ All Months" },
                        { id: "june" as const, labelAr: "☀️ جوان / يونيو 2026", labelEn: "☀️ June 2026" },
                        { id: "july" as const, labelAr: "🏖️ جويلية / يوليو 2026", labelEn: "🏖️ July 2026" }
                      ].map((mOpt) => (
                        <button
                          key={mOpt.id}
                          type="button"
                          onClick={() => setSchMonthFilter(mOpt.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            schMonthFilter === mOpt.id
                              ? "bg-amber-500 border-amber-550 text-white shadow-3xs"
                              : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                          }`}
                        >
                          {isAr ? mOpt.labelAr : mOpt.labelEn}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual Date Inputs Reset indicator */}
                  {(schDayFilter !== "all" || schMonthFilter !== "all") && (
                    <button
                      type="button"
                      onClick={() => {
                        setSchDayFilter("all");
                        setSchMonthFilter("all");
                      }}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-750 rounded-xl font-bold text-xs self-end cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <span>↺</span>
                      <span>{isAr ? "إعادة تعيين الجدولة" : "Reset Schedule"}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
                
                {/* Search bar inside fixtures with intelligent autocomplete */}
                <div className="relative w-full sm:w-64 z-40">
                  <div className="relative">
                    <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-3.5 h-3.5 text-indigo-550" />
                    </span>
                    <input
                      type="text"
                      value={ticketSearchQuery}
                      onChange={(e) => {
                        setTicketSearchQuery(e.target.value);
                        setShowAutocomplete(true);
                      }}
                      onFocus={() => setShowAutocomplete(true)}
                      onBlur={() => {
                        // Delay so click handlers on suggestions run before blur hides it
                        setTimeout(() => setShowAutocomplete(false), 250);
                      }}
                      placeholder={isAr ? "ابحث بنادٍ أو بطولة..." : "Search club or league..."}
                      className="w-full text-xs pr-8 py-2 border border-slate-200 rounded-xl outline-none focus:border-indigo-550 text-slate-800 bg-slate-50 focus:bg-white shadow-3xs transition-all"
                    />
                    {ticketSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setTicketSearchQuery("");
                          setShowAutocomplete(false);
                        }}
                        className="absolute inset-y-0 left-2.5 px-1 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={isAr ? "مسح البحث" : "Clear search"}
                      >
                        <span className="text-sm font-semibold">✕</span>
                      </button>
                    )}
                  </div>

                  {/* Smart Autocomplete Dropdown */}
                  {showAutocomplete && filteredSuggestions.length > 0 && (
                    <div className="absolute top-full right-0 left-0 mt-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                      <div className="px-3 py-1.5 bg-slate-50 border-b border-indigo-50 text-[9px] font-black tracking-wide text-indigo-755 uppercase">
                        {isAr ? "مساعد الإكمال الذكي المتاح 💡" : "SMART INPUT RECOMMENDATIONS 💡"}
                      </div>
                      <div className="divide-y divide-slate-100">
                        {filteredSuggestions.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onMouseDown={() => {
                              setTicketSearchQuery(item.text);
                              setShowAutocomplete(false);
                            }}
                            className="w-full text-right sm:text-left px-3.5 py-2.5 hover:bg-slate-50/70 text-xs font-semibold text-slate-750 flex items-center justify-between gap-2.5 transition-all text-ellipsis overflow-hidden"
                          >
                            <span className="truncate">
                              {item.text}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 bg-indigo-50/50 text-indigo-650 rounded-md font-extrabold uppercase shrink-0">
                              {item.category}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Popular quick-clickable assistance badges */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] pb-1 border-b border-dashed border-slate-100">
                <span className="font-extrabold text-slate-450 text-[10px]">
                  {isAr ? "💡 بحث سريع:" : "💡 Quick Search:"}
                </span>
                {[
                  { text: isAr ? "مولودية الجزائر" : "MC Alger", query: isAr ? "مولودية الجزائر" : "MC Alger" },
                  { text: isAr ? "المنتخب الجزائري" : "Algeria", query: isAr ? "المنتخب الجزائري" : "Algeria" },
                  { text: isAr ? "ريال مدريد" : "Real Madrid", query: "Real Madrid" },
                  { text: isAr ? "الهلال" : "Al-Hilal", query: isAr ? "الهلال" : "Al-Hilal" },
                  { text: isAr ? "أبطال أوروبا" : "Champions League", query: isAr ? "دوري أبطال" : "Champions League" }
                ].map((chip, cIdx) => (
                  <button
                    key={cIdx}
                    type="button"
                    onClick={() => setTicketSearchQuery(chip.query)}
                    className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                      ticketSearchQuery === chip.query
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-3xs"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-650"
                    }`}
                  >
                    {chip.text}
                  </button>
                ))}
                {ticketSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setTicketSearchQuery("")}
                    className="text-[10px] text-rose-600 font-extrabold px-1.5 py-0.5 hover:bg-rose-50 rounded transition-colors"
                  >
                    {isAr ? "إعادة تعيين ↺" : "Reset ↺"}
                  </button>
                )}
              </div>

              {/* Premium League & Date Filter Bar */}
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl gap-3.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs my-2">
                {/* League Toggles */}
                <div className="space-y-1 select-none flex-1">
                  <span className="text-[9.5px] font-black text-indigo-750 tracking-wider block uppercase">
                    🏆 {isAr ? "تصفية الدوري والبطولة" : "Filter League / Tournament"}
                  </span>
                  <div className="flex flex-wrap items-center gap-1">
                    {[
                      { id: "all" as const, labelAr: "الكل ⚽", labelEn: "All ⚽" },
                      { id: "saudi" as const, labelAr: "السعودي 🇸🇦", labelEn: "Saudi 🇸🇦" },
                      { id: "european" as const, labelAr: "الأوروبي 🇪🇺", labelEn: "European 🇪🇺" },
                      { id: "international" as const, labelAr: "دولي ومحلي 🌍", labelEn: "Int'l & Local 🌍" }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setLeagueFilter(opt.id)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black tracking-wide border transition-all cursor-pointer ${
                          leagueFilter === opt.id
                            ? "bg-indigo-600 border-indigo-605 text-white shadow-3xs"
                            : "bg-white hover:bg-slate-100 border-slate-205 text-slate-700"
                        }`}
                      >
                        {isAr ? opt.labelAr : opt.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Ranges */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap md:shrink-0">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-450 tracking-wider block uppercase">
                      📅 {isAr ? "من تاريخ" : "Start Date"}
                    </span>
                    <input
                      type="date"
                      value={startDateFilter}
                      onChange={(e) => setStartDateFilter(e.target.value)}
                      className="text-xs px-2 py-1 border border-slate-200 rounded-lg bg-white outline-none focus:border-indigo-500 text-slate-8 w-28 sm:w-32"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-450 tracking-wider block uppercase">
                      📅 {isAr ? "إلى تاريخ" : "End Date"}
                    </span>
                    <input
                      type="date"
                      value={endDateFilter}
                      onChange={(e) => setEndDateFilter(e.target.value)}
                      className="text-xs px-2 py-1 border border-slate-200 rounded-lg bg-white outline-none focus:border-indigo-500 text-slate-8 w-28 sm:w-32"
                    />
                  </div>

                  {(startDateFilter || endDateFilter) && (
                    <button
                      type="button"
                      onClick={() => {
                        setStartDateFilter("");
                        setEndDateFilter("");
                      }}
                      className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-750 rounded-lg font-black text-[9.5px] self-end h-7 cursor-pointer transition-colors"
                      title={isAr ? "تصفير فلتر التاريخ" : "Reset Date range"}
                    >
                      {isAr ? "تصفير ×" : "Reset ×"}
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsible Intelligent AI Sports Advisor Dialog and Assistant */}
              <AnimatePresence>
                {chatOpened && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-2 border-indigo-200 rounded-2xl bg-indigo-50/40 overflow-hidden shadow-md flex flex-col mb-3"
                  >
                    <div className="bg-gradient-to-r from-indigo-700 to-indigo-800 p-3 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                        <div>
                          <p className="font-extrabold text-xs">
                            {isAr ? "دردشة مشجع فسحة الذكية 💬" : "Fos7a Smart Supporter Chatbot 💬"}
                          </p>
                          <p className="text-[9px] text-indigo-200">
                            {isAr ? "مساعد فوري للمباريات والملاعب والأهازيج" : "Instant stadium schedules & routes counselor"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setChatOpened(false)}
                        className="text-white hover:text-indigo-200 text-xs font-bold cursor-pointer transition-colors"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Chat Area */}
                    <div className="p-3 space-y-3 max-h-60 overflow-y-auto bg-white/75">
                      {smartChatHistory.map((msg, idx) => {
                        const isUser = msg.role === "user";
                        let bubbleCcStr = "bg-slate-150/80 text-slate-800 font-medium rounded-bl-none border border-slate-200";
                        if (isUser) {
                          bubbleCcStr = "bg-indigo-600 text-white font-semibold rounded-br-none shadow-sm";
                        } else if (chatFavoriteTeam) {
                          const tLower = chatFavoriteTeam.toLowerCase();
                          if (tLower.includes("أهلي") || tLower.includes("ahly") || tLower.includes("ليفربول") || tLower.includes("liverpool")) {
                            bubbleCcStr = "bg-rose-50 text-rose-950 font-medium rounded-bl-none border border-rose-250 shadow-xs";
                          } else if (tLower.includes("ريال") || tLower.includes("madrid") || tLower.includes("ملكي") || tLower.includes("royal")) {
                            bubbleCcStr = "bg-blue-50 text-sky-950 font-medium rounded-bl-none border border-blue-200 shadow-xs";
                          } else if (tLower.includes("مولودية") || tLower.includes("mca") || tLower.includes("شناوة")) {
                            bubbleCcStr = "bg-emerald-50 text-emerald-950 font-medium rounded-bl-none border border-emerald-250 shadow-xs";
                          } else if (tLower.includes("شبيبة") || tLower.includes("jsk") || tLower.includes("كناري") || tLower.includes("قبائل")) {
                            bubbleCcStr = "bg-amber-50 text-amber-950 font-medium rounded-bl-none border border-amber-250 shadow-xs";
                          } else {
                            bubbleCcStr = "bg-slate-50 text-slate-900 border border-indigo-200 rounded-bl-none shadow-xs";
                          }
                        }
                        return (
                          <div
                            key={idx}
                            className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                          >
                            <div className={`max-w-[85%] rounded-2xl p-2.5 text-[11px] leading-relaxed ${bubbleCcStr}`}>
                              <p className="whitespace-pre-line">{msg.text}</p>
                            </div>
                          </div>
                        );
                      })}
                      {smartChatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-slate-100/95 text-slate-500 rounded-bl-none border border-slate-200 rounded-2xl px-3 py-2 text-[10.5px] leading-relaxed flex items-center gap-1.5 shadow-3xs animate-pulse">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce shrink-0" />
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s] shrink-0" />
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s] shrink-0" />
                            <span className="text-[9.5px] font-bold text-slate-500">
                              {isAr ? "ملعب يحلل الملاعب والأجندات..." : "Mal3ab reading pitch live..."}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Chat quick chips */}
                    <div className="flex flex-wrap items-center gap-1.5 p-3 bg-slate-50 border-t border-slate-100">
                      <span className="text-[9.5px] font-bold text-slate-400">
                        {isAr ? "💡 اختر سؤالاً:" : "💡 Choose FAQ:"}
                      </span>
                      {[
                        { text: isAr ? "متى يلعب المولودية؟" : "When MCA play?", query: "تفاصيل لقاء مولودية الجزائر" },
                        { text: isAr ? "أين لملعب حملاوي؟" : "Where Chahid Hamlaoui?", query: "أين يقع ملعب الشهيد حملاوي" },
                        { text: isAr ? "كلاسيكو الجزائر" : "Algerian Classic derby?", query: "الجزائر الكلاسيكو شبيبة وقبائل ومولودية" },
                        { text: isAr ? "نهائي الأبطال" : "UCL Final dates?", query: "دوري ابطال اوروبا النهائي والميركاتو" }
                      ].map((faq, faqIdx) => (
                        <button
                          key={faqIdx}
                          type="button"
                          onClick={() => handleSmartSearchQuery(faq.query)}
                          className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[9.5px] font-bold text-slate-700 cursor-pointer shadow-3xs transition-all"
                        >
                          {faq.text}
                        </button>
                      ))}
                    </div>

                    {/* Input controls */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSmartSearchQuery(smartChatInput);
                      }}
                      className="flex items-center gap-1 p-2 bg-indigo-50/50 border-t border-indigo-100"
                    >
                      <input
                        type="text"
                        value={smartChatInput}
                        onChange={(e) => setSmartChatInput(e.target.value)}
                        placeholder={isAr ? "اسأل المساعد الذكي عن الألعاب والملاعب..." : "Ask smart football advisor..."}
                        className="flex-1 text-xs px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-slate-800 bg-white shadow-3xs"
                      />
                      <button
                        type="submit"
                        className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-3 max-h-[480px] overflow-y-auto">
                {filteredFixtures.length === 0 ? (
                  <div className="py-12 px-4 text-center text-slate-400 font-bold text-xs space-y-4">
                    <div className="p-4 bg-rose-50/30 rounded-2xl border border-rose-100 inline-block">
                      <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-800 font-extrabold">{isAr ? `عذراً، لا يوجد نتائج لـ "${ticketSearchQuery}"` : `No direct results for "${ticketSearchQuery}"`}</p>
                      <p className="text-[10px] text-slate-450 font-semibold max-w-sm mx-auto leading-relaxed">
                        {isAr 
                          ? "لم نجد نتيجة مطابقة تماماً لبحثك الحالي. متاح لدينا حجز مقاعد وسكن وتذاكر طيران وفندقة متميزة مع وكالة فسحة ديزاد. تفضل بالنقر المباشر على أحد الأندية الشائعة التالية لعرض الجدول:"
                          : "We couldn't locate matching tickets. Discover our sports tourism flight + companion packages. Tap any verified team below to view:"}
                      </p>
                    </div>
                    
                    {/* Assistant fallback list */}
                    <div className="flex flex-wrap justify-center gap-1.5 max-w-md mx-auto pt-2">
                      {fixturesData.slice(0, 8).map((f, fIdx) => {
                        const optionText = isAr ? f.homeTeamAr : f.homeTeam;
                        return (
                          <button
                            key={fIdx}
                            type="button"
                            onClick={() => setTicketSearchQuery(optionText)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-indigo-700 transition-all cursor-pointer shadow-3xs"
                          >
                            ⚽ {optionText}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : filteredFixtures.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-3xl">⚽</div>
                    <p className="font-extrabold text-sm text-slate-700">
                      {isAr ? "لا توجد مباريات لهذا الفلتر" : "No matches found for this filter"}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                      {isAr 
                        ? `لا توجد لقاءات مجدولة لـ "${activeCompetitionFilter}" مع الفلاتر الحالية.` 
                        : `No fixtures scheduled matching "${activeCompetitionFilter}" with the current filters.`}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCompetitionFilter("الكل");
                        setSchDayFilter("all");
                        setSchMonthFilter("all");
                        setLeagueFilter("all");
                        setTicketSearchQuery("");
                        setShowOnlyFavorites(false);
                      }}
                      className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-black cursor-pointer hover:bg-indigo-700 transition-colors"
                    >
                      {isAr ? "↺ إعادة تعيين جميع الفلاتر" : "↺ Reset All Filters"}
                    </button>
                  </div>
                ) : (
                  filteredFixtures.map((match) => (
                    <div 
                      key={match.id}
                      className="border border-slate-100 rounded-2xl p-4 hover:border-indigo-150 hover:bg-indigo-50/10 transition-all space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded">
                            {isAr ? match.leagueAr : match.league}
                          </span>
                          {(favoriteTeams.includes(match.homeTeam) || favoriteTeams.includes(match.homeTeamAr) || favoriteTeams.includes(match.awayTeam) || favoriteTeams.includes(match.awayTeamAr)) && (
                            <span className="text-[9px] font-black text-amber-700 bg-amber-50 border border-amber-250 px-2 py-0.5 rounded flex items-center gap-0.5">
                              ⭐ {isAr ? "مفضل" : "Starred"}
                            </span>
                          )}
                          {alertedMatches.includes(match.id) && (
                            <span className="text-[9px] font-black text-red-750 bg-red-50 border border-red-200 px-2 py-0.5 rounded flex items-center gap-0.5">
                              🔔 {isAr ? "تنبيه نشط" : "Alert set"}
                            </span>
                          )}
                        </div>
                        
                        {match.status === "live" ? (
                          <span className="flex items-center gap-1 text-[9px] font-black text-rose-605 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full animate-pulse uppercase">
                            <span className="w-1.5 h-1.5 bg-rose-600 rounded-full" />
                            {isAr ? "مباشر الآن" : "Live now"}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-405" />
                            {match.date}
                          </span>
                        )}
                      </div>

                      {/* Teams matchup row */}
                      <div className="flex items-center justify-between text-center max-w-lg mx-auto py-1">
                        <div className="w-[35%]">
                          <p className="font-extrabold text-sm text-slate-800">
                            {isAr ? match.homeTeamAr : match.homeTeam}
                          </p>
                          <span className="text-[9px] text-slate-400 font-bold">{isAr ? "صاحب الأرض" : "Home Club"}</span>
                        </div>

                        <div className="w-[30%] flex flex-col items-center justify-center gap-1 select-none">
                          {match.status === "live" ? (
                            <div className="flex items-center gap-2 bg-slate-950 text-white font-black font-mono text-lg px-3 py-1 rounded-xl shadow-xs">
                              <span>{match.homeScore}</span>
                              <span className="text-rose-550 animate-pulse">-</span>
                              <span>{match.awayScore}</span>
                            </div>
                          ) : (
                            <div className="text-[11px] font-black text-slate-400 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full uppercase tracking-widest border border-slate-150">
                              {isAr ? "ضد" : "VS"}
                            </div>
                          )}
                          <p className="text-[9.5px] font-mono font-bold text-slate-400 truncate max-w-[120px]" title={match.venue}>
                            {isAr ? match.venueAr : match.venue}
                          </p>
                        </div>

                        <div className="w-[35%]">
                          <p className="font-extrabold text-sm text-slate-800">
                            {isAr ? match.awayTeamAr : match.awayTeam}
                          </p>
                          <span className="text-[9px] text-slate-400 font-bold">{isAr ? "الضيف" : "Away Club"}</span>
                        </div>
                      </div>

                      {/* Sports Tourism Ticket Offer Action */}
                      <div className="border-t border-slate-100 pt-3 mt-1 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 p-2.5 rounded-xl">
                        <div className="text-right sm:text-left space-y-0.5">
                          <p className="text-[10.5px] font-bold text-slate-600">
                            {isAr ? "احصل على باقة المشجع المتكاملة (تذكير وملعب)" : "Stadium Passenger & Travel Package available"}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold">
                            {isAr 
                              ? `تبدأ الأسعار من 1,500 دج شاملة باقة الإرشادات` 
                              : `Seats from 1,500 DZD up to hospitality luxury options`}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-end">
                          {/* Favorite Team Toggle */}
                          <button
                            type="button"
                            onClick={() => {
                              handleToggleFavoriteTeam(match.homeTeam);
                              handleTriggerChant(match.homeTeam);
                            }}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              favoriteTeams.includes(match.homeTeam) || favoriteTeams.includes(match.homeTeamAr)
                                ? "bg-amber-50 border-amber-200 text-amber-500"
                                : "bg-white hover:bg-slate-100 border-slate-200 text-slate-400"
                            }`}
                            title={isAr ? "أضف النادي للمفضلة ومتابعة الأداء" : "Bookmark team and subscribe sports alert"}
                          >
                            <Star className={`w-3.5 h-3.5 ${(favoriteTeams.includes(match.homeTeam) || favoriteTeams.includes(match.homeTeamAr)) ? "fill-current" : ""}`} />
                          </button>

                          {/* Set Match Alert Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleAlert(match.id)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              alertedMatches.includes(match.id)
                                ? "bg-rose-50 border-rose-200 text-rose-600"
                                : "bg-white hover:bg-slate-100 border-slate-200 text-slate-450"
                            }`}
                            title={isAr ? "تعيين منبه لتذكيرك قبل اللقاء" : "Set Match alert on travel itinerary calendar"}
                          >
                            <Bell className={`w-3.5 h-3.5 ${alertedMatches.includes(match.id) ? "animate-bounce" : ""}`} />
                          </button>

                          {/* Add match to travel plan calendar */}
                          <button
                            type="button"
                            onClick={() => handleOpenCalendarSync(match)}
                            className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1"
                            title={isAr ? "ضم لجدول ومفكرة رحلتك بالجزائر" : "Save match date/time to local travel itinerary"}
                          >
                            <CalendarPlus className="w-3.5 h-3.5" />
                            <span>{isAr ? "ضم للمفكرة" : "Sync Plan"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setBookingMatchId(match.id);
                              setSelectedCategory("booking");
                            }}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10.5px] font-black transition-all cursor-pointer"
                          >
                            {isAr ? "حجز باقة" : "Book Pack"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div> {/* Closing the newly added layout grid */}
          </motion.div>
        )}

        {/* Category: Sports News (Breaking news, transfers, and live feeds) */}
        {selectedCategory === "sports_news" && (
          <motion.div
            key="sports_news"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Live Ticker Channel Indicator */}
            <div className="bg-gradient-to-r from-red-600 to-rose-700 rounded-2xl p-4.5 text-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="animate-pulse bg-white text-rose-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase flex items-center gap-1 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-rose-650 inline-block animate-ping" />
                  {isAr ? "عاجل الرياضة 🔴" : "BREAKING 🔴"}
                </span>
                <p className="text-xs md:text-sm font-black text-rose-50 leading-relaxed text-right md:text-left">
                  {isAr 
                    ? "الميركاتو الشتوي والصيفي يغلي: رادار المشجعين يكشف صفقات حصرية لأندية روشن والدوريات العالمية وجدول المباريات محدث لحظة بلحظة!" 
                    : "Blockbuster football transfers & schedule timings revised by FIFA and regional federations. Scroll below to filter live!"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleRefreshBreakingNews}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                <span>{isAr ? "تحديث الأخبار الرياضية فوراً" : "Refresh News Feed"}</span>
              </button>
            </div>

            {/* News and Side Utilities */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Live News Feed List */}
              <div className="lg:col-span-8 space-y-4 font-sans">
                {/* 📊 Goal.com Live Match Center Card */}
                <div className={`p-5 rounded-2xl border transition-all ${
                  activeHubTheme === "night" ? "bg-slate-900 border-slate-800 text-white" :
                  activeHubTheme === "gold" ? "bg-amber-500/5 border-amber-600/20 text-slate-900" :
                  activeHubTheme === "violet" ? "bg-fuchsia-500/5 border-fuchsia-600/20 text-slate-950" :
                  "bg-white border-slate-100 text-slate-800"
                } space-y-4 shadow-3xs`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dashed border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                        {isAr ? "مركز مباريات وبث غول دوت كوم الذكي ⚡" : "Goal.com Match Center & Smart Live Ticker ⚡"}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={fetchAndParseGoalData}
                      disabled={parsingLoading}
                      className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10.5px] font-black rounded-lg border border-indigo-150 transition-all flex items-center gap-1 shrink-0"
                    >
                      <RefreshCw className={`w-3 h-3 ${parsingLoading ? "animate-spin" : ""}`} />
                      <span>{isAr ? "تحديث الجدول فوراً ↺" : "Refresh Goal Feed ↺"}</span>
                    </button>
                  </div>

                  {parsingLoading ? (
                    <div className="py-8 text-center text-xs text-slate-400 font-bold animate-pulse flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-indigo-650" />
                      <span>{isAr ? "جاري سحب واستخراج جدول مباريات الأمس واليوم والمسجلين بأمان..." : "Extracting yesterday & today live scorers and fixtures safely..."}</span>
                    </div>
                  ) : goalParsedMatches.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 font-medium">
                      {isAr ? "لا توجد تفاصيل مباريات متاحة حالياً." : "No parsed fixtures found."}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Tabs to toggle sub-categories: Today, Upcoming, Recent */}
                      <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-lg w-fit max-w-full overflow-x-auto">
                        {(["all", "today", "upcoming", "recent"] as const).map((cat) => {
                          const count = cat === "all" ? goalParsedMatches.length : goalParsedMatches.filter(m => m.category === cat).length;
                          let label = "";
                          if (cat === "all") label = isAr ? "الكل" : "All";
                          else if (cat === "today") label = isAr ? "مباريات اليوم" : "Today";
                          else if (cat === "upcoming") label = isAr ? "القادمة (7 أيام)" : "Upcoming";
                          else if (cat === "recent") label = isAr ? "النتائج الأخيرة" : "Recent";

                          const isActive = activeGoalFilter === cat;

                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setActiveGoalFilter(cat)}
                              className={`px-3 py-1 rounded-md text-[10px] font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                                isActive 
                                  ? "bg-indigo-650 text-white shadow-3xs" 
                                  : "text-slate-500 hover:text-slate-850"
                              }`}
                            >
                              {label} {count > 0 && <span className="font-mono text-[9px] font-bold opacity-80">({count})</span>}
                            </button>
                          );
                        })}
                      </div>

                      {/* Structured Matches Table as per prompting instructions */}
                      <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-xs text-right border-collapse min-w-[500px]">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-450 font-black uppercase">
                              <th className="py-2 px-3 text-right">{isAr ? "يوم المباراة" : "Match Day"}</th>
                              <th className="py-2 px-3 text-right">{isAr ? "اللقاء الرياضي" : "Matchup"}</th>
                              <th className="py-2 px-3 text-center w-28">{isAr ? "النتيجة" : "Result"}</th>
                              <th className="py-2 px-3 text-right">{isAr ? "المسجلون" : "Scorers"}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100/50">
                            {goalParsedMatches
                              .filter(m => activeGoalFilter === "all" || m.category === activeGoalFilter)
                              .map((m, mIdx) => {
                                const hasScorers = m.scorers && !m.scorers.toLowerCase().includes("no goal") && !m.scorers.toLowerCase().includes("no scorer") && !m.scorers.includes("لا يوجد") && !m.scorers.includes("لم تلعب") && !m.scorers.includes("لم يحدد") && !m.scorers.toLowerCase().includes("not played");
                                const isLiveMatch = m.result.includes("LIVE") || m.result.includes("مباشر");

                                return (
                                  <tr key={mIdx} className="hover:bg-slate-550/5 transition-colors">
                                    {/* 1. يوم المباراة (Match Day) */}
                                    <td className="py-2.5 px-3 font-semibold text-slate-500 text-[10.5px] whitespace-nowrap text-right">
                                      📅 {m.matchDay}
                                    </td>
                                    {/* 2. اللقاء (Matchup) */}
                                    <td className="py-2.5 px-3 font-extrabold text-slate-850 text-right">
                                      <div className="flex items-center gap-1 justify-start">
                                        <span className="truncate">{m.homeTeam}</span>
                                        <span className="text-slate-400 font-normal">vs</span>
                                        <span className="truncate">{m.awayTeam}</span>
                                      </div>
                                    </td>
                                    {/* 3. النتيجة (Result / scoreline) */}
                                    <td className="py-2.5 px-3 text-center">
                                      <span className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-black ${
                                        isLiveMatch 
                                          ? "bg-rose-50 border border-rose-100 text-rose-600 animate-pulse font-extrabold" 
                                          : m.result.includes("-") 
                                          ? "bg-slate-100 border border-slate-200 text-slate-800" 
                                          : m.result.includes(":") 
                                          ? "bg-indigo-50 border border-indigo-100/40 text-indigo-700" 
                                          : "bg-amber-50 border border-amber-200 text-amber-700"
                                      }`}>
                                        {m.result}
                                      </span>
                                    </td>
                                    {/* 4. المسجلون (Scorers) */}
                                    <td className="py-2.5 px-3 text-[10.5px] font-semibold text-slate-500 max-w-xs truncate text-right">
                                      {hasScorers ? (
                                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-100/40 px-2 py-0.5 rounded text-[10px]">
                                          🏃‍♂️ {m.scorers}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 font-normal text-[10px]">
                                          {isAr ? "لا يتوفر مسجلين (لم تبدأ بعد أو غير معروف)" : "No scorers (not kicked off / unavailable)"}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {newsFeed.map((news) => (
                  <motion.div
                    key={news.id}
                    layoutId={news.id}
                    className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-indigo-100 hover:shadow-3xs transition-all space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100/50 px-2.5 py-0.5 rounded">
                        {isAr ? news.categoryAr : news.categoryEn}
                      </span>
                      <span className="text-[9.5px] font-mono text-slate-400 font-bold">
                        🕒 {isAr ? news.timeAr : news.timeEn}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="font-extrabold text-sm md:text-base text-slate-800 leading-snug">
                        {isAr ? news.titleAr : news.titleEn}
                      </h4>
                      <p className="text-[11.5px] md:text-xs leading-relaxed text-slate-500 font-semibold font-sans">
                        {isAr ? news.descAr : news.descEn}
                      </p>
                    </div>

                    {/* Social Options */}
                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => handleLikeNews(news.id)}
                          className={`flex items-center gap-1.5 cursor-pointer font-black ${
                            news.hasLiked ? "text-rose-600" : "text-slate-400 hover:text-slate-600"
                          }`}
                        >
                          <ThumbsUp className={`w-4 h-4 ${news.hasLiked ? "fill-current animate-bounce" : ""}`} />
                          <span>{news.likes} {isAr ? "إعجاب" : "Likes"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleShareNews(news.id)}
                          className={`flex items-center gap-1.5 cursor-pointer font-black ${
                            news.hasShared ? "text-indigo-650 animate-pulse" : "text-slate-400 hover:text-indigo-600"
                          }`}
                        >
                          <Share2 className="w-4 h-4" />
                          <span>{news.shares} {isAr ? "مشاركة" : "Shares"}</span>
                        </button>
                      </div>

                      <div className="text-[9px] font-black tracking-wide text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                        <span>{isAr ? "Goal.com بث رياضي موثق" : "Sourced from Goal.com"}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Right Column: Transfer Gossip widget & Notifications subscription card */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Exclusive Summer Transfer Tracker */}
                <div className="bg-gradient-to-br from-indigo-950 to-slate-900 rounded-2xl p-5 text-white border border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-400" />
                      <h4 className="font-extrabold text-xs text-indigo-100">
                        {isAr ? "رادار المركاتو الحصري لفسحة" : "Fos7a Exclusive Transfer Insider"}
                      </h4>
                    </div>
                    <span className="text-[9px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-md animate-pulse">
                      {isAr ? "ساخن جداً" : "LIVE HOT"}
                    </span>
                  </div>

                  <div className="divide-y divide-white/10 space-y-3.5">
                    {transferGossip.map((gossip, idx) => (
                      <div key={idx} className="pt-3.5 first:pt-0 space-y-1">
                        <p className="text-[10.5px] font-semibold text-slate-100 leading-relaxed">
                          {isAr ? gossip.titleAr : gossip.titleEn}
                        </p>
                        <div className="flex justify-between items-center text-[9px] font-mono text-indigo-300">
                          <span>{gossip.cost}</span>
                          <span className="bg-rose-500/20 text-rose-300 px-1 rounded-sm font-bold">{gossip.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-[9px] text-center font-bold text-slate-350">
                    💡 {isAr ? "الأخبار مستخلصة وتحدث لحظة بلحظة بالتعاون مع فيفا وشاشات الجزائر الرياضية." : "Trackings synced moment-by-moment with live FIFA & regional newsletters."}
                  </div>
                </div>

                {/* Instant Notifications push subscription card */}
                <div className="border border-indigo-100 rounded-2xl bg-indigo-50/20 p-4.5 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white mx-auto font-black shadow-xs">
                    🔔
                  </div>
                  <div className="space-y-1">
                    <p className="font-extrabold text-xs text-slate-800">
                      {isAr ? "اشترك بإشعارات الأخبار العاجلة" : "Enroll in Soccer Break Alerts"}
                    </p>
                    <p className="text-[9.5px] text-slate-500 leading-relaxed font-semibold">
                      {isAr 
                        ? "سيرسل لك نظام رادار فسحة تنبيهاً بلحظتها فور تسجيل هدف بمباراتك المفضلة أو حسم صفقات المخابرات الرياضية." 
                        : "Our notification agent instantly alerts you of transfer deals, live goals & stadium ticket flashes."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLocalChantText({
                        lyric: isAr ? "🔔 تم تفعيل اشتراكك في خدمة إشعارات الكرة العاجلة لحظة بلحظة!" : "🔔 Enrolled in live sports prompt updates successfully!",
                        translation: isAr ? "تخصيص كامل" : "All matches tracked and synchronized offline"
                      });
                      setTimeout(() => setLocalChantText(null), 5000);
                    }}
                    className="w-full py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-3xs"
                  >
                    {isAr ? "تفعيل الإشعارات الآن" : "Enable Moment Alerts"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Category: Booking & Ticket History (Matches spectator package) */}
        {selectedCategory === "booking" && (
          <motion.div
            key="booking"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left Box: Active package booking form (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-105 p-6 space-y-6 shadow-sm">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-850">
                    {isAr ? "طلب حجز تذكرة المباراة والتكفل بالرحلة" : "Request Ticket Reservation & Tour Booking"}
                  </h3>
                  <p className="text-[10.5px] text-slate-450 font-bold mt-0.5">
                    {isAr 
                      ? "احجز مدرجاتك فقط أو اختر باقة السفر المتكاملة (طيران + فندق 4★ + تنقلات) مع وكالة فسحة ديزاد" 
                      : "Book stadiums seats only or upgrade to a full travel package (flights, premium hotel and transport) with Fos7a Agency"}
                  </p>
                </div>
                <Ticket className="w-5 h-5 text-indigo-650" />
              </div>

              {/* Booking success overlay notification with dynamic WhatsApp button */}
              {bookingSuccess && (
                <div className="bg-emerald-50 border border-emerald-250 rounded-2xl p-5 space-y-4 shadow-3xs">
                  <div className="flex items-start gap-3 text-emerald-900">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-black">{isAr ? "تم تسجيل طلبك وتوليد تذكرتك المرجعية بنجاح!" : "Reservation successfully registered offline!"}</h4>
                      <p className="text-[10.5px] text-emerald-700 leading-relaxed font-semibold">
                        {isAr 
                          ? `كود الحجز: ${bookingSuccess.bookingId} - نوع الباقة: ${bookingSuccess.bookingType === "full_package" ? "باقة التكفل بالرحلة الكاملة ✈️🏨" : "تذكرة الملعب فقط 🎟️"}` 
                          : `Ref ID: ${bookingSuccess.bookingId} - Mode: ${bookingSuccess.bookingType === "full_package" ? "Full Agency Travel Support ✈️🏨" : "Ticket Only 🎟️"}`}
                      </p>
                      <p className="text-[10px] text-slate-550 leading-normal">
                        {isAr 
                          ? "تبقّى لك خطوة واحدة فقط! اضغط لتأكيد الحجز والدفع الفوري الآمن عبر واتساب مع مرشد وكالة فسحة ديزاد." 
                          : "Only one step left! Click below to finalize your payment securely and lock your hotel/flight on WhatsApp with Fos7a Agent."}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    <a
                      href={getWhatsAppBookingText(bookingSuccess)}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs animate-bounce"
                    >
                      <span className="text-xs">💬</span>
                      <span>{isAr ? "تأكيد الدفع والاستكمال عبر واتساب" : "Confirm booking on WhatsApp"}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handlePrintTicket(bookingSuccess)}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-[11px] font-black rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isAr ? "اطبع تذكرة المشجع الآن" : "Print Travel Ticket Pass"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingSuccess(null)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-black rounded-xl transition-colors cursor-pointer"
                    >
                      {isAr ? "إغلاق" : "Dismiss"}
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleBookingSubmit} className="space-y-5">
                
                {/* Booking Coverage Choice (Stadium Entrance vs Full Flight/Hotel) */}
                <div className="space-y-2 text-right sm:text-left">
                  <label className="text-xs font-black text-slate-800 block">
                    {isAr ? "اختر مستوى ونطاق التكفل بالرحلة مع الوكالة:" : "Choose Trip Coverage / Coordination level:"}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setBookingType("ticket_only")}
                      className={`p-4 rounded-2xl border text-right sm:text-left transition-all cursor-pointer flex flex-col justify-between h-28 ${
                        bookingType === "ticket_only"
                          ? "border-indigo-600 bg-indigo-50/25 ring-1 ring-indigo-500/20"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-indigo-700">
                          <Ticket className="w-3.5 h-3.5" />
                          {isAr ? "تذكرة مباراة فقط" : "Stadium Ticket Only"}
                        </span>
                        <input 
                          type="radio" 
                          checked={bookingType === "ticket_only"} 
                          onChange={() => {}}
                          className="accent-indigo-600" 
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold line-clamp-2 mt-1 leading-relaxed">
                        {isAr 
                          ? "حجز المقعد ودخول استاد المباراة فئة المقاعد المحددة. يتكفل المشجع بالسكن والتنقل الخارجي وطيران الوفد بنفسه." 
                          : "Includes stadium seats of choice. Fan handles personal lodging, transfers, and incoming flight tickets autonomously."}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBookingType("full_package")}
                      className={`p-4 rounded-2xl border text-right sm:text-left transition-all cursor-pointer flex flex-col justify-between h-28 ${
                        bookingType === "full_package"
                          ? "border-emerald-600 bg-emerald-50/15 ring-1 ring-emerald-500/20"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800">
                          <span className="text-xs">✈️🏨</span>
                          {isAr ? "باقة التكفل بالرحلة بالكامل" : "Full Agency Travel Support"}
                        </span>
                        <input 
                          type="radio" 
                          checked={bookingType === "full_package"} 
                          onChange={() => {}}
                          className="accent-emerald-600" 
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold line-clamp-2 mt-1 leading-relaxed">
                        {isAr 
                          ? "شامل (تذكرة طيران + إقامة فندقية قريبة من الملعب 4 نجوم + حافلات تنقل مكوكية يوم المباراة + مرافقة وكالة فسحة)." 
                          : "Includes (incoming flight tickets + 4-Star hotel stay close to pitch + stadium transfers + Fos7a coordinator companion)."}
                      </p>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select Match */}
                  <div className="space-y-1.5 text-right sm:text-left">
                    <label className="text-xs font-extrabold text-slate-700 block">
                      {isAr ? "حدد المباراة المراد حضورها" : "Choose Stadium Match"}
                    </label>
                    <select
                      value={bookingMatchId}
                      onChange={(e) => setBookingMatchId(e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-semibold bg-slate-50 text-slate-800"
                    >
                      {fixturesData.map((f) => (
                        <option key={f.id} value={f.id}>
                          {isAr ? `${f.homeTeamAr} ضد ${f.awayTeamAr}` : `${f.homeTeam} vs ${f.awayTeam}`} ({isAr ? f.leagueAr : f.league})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Booking Qty */}
                  <div className="space-y-1.5 text-right sm:text-left">
                    <label className="text-xs font-extrabold text-slate-700 block">
                      {isAr ? "عدد التذاكر المطلوبة" : "Number of Attendee Tickets"}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={bookingQty}
                      onChange={(e) => setBookingQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-semibold bg-slate-50 text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Seat Class/Tier */}
                  <div className="space-y-1.5 text-right sm:text-left">
                    <label className="text-xs font-extrabold text-slate-700 block">
                      {isAr ? "فئة المقعد والمدرجات" : "Seat Category class"}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "standard" as const, labelAr: "مدرجات", labelEn: "Standard Floor" },
                        { id: "premium" as const, labelAr: "ممتازة", labelEn: "Premium Seat" },
                        { id: "vip" as const, labelAr: "منصة VIP", labelEn: "VIP Lounge" }
                      ].map((seat) => {
                        const isChosen = bookingTier === seat.id;
                        return (
                          <button
                            key={seat.id}
                            type="button"
                            onClick={() => setBookingTier(seat.id)}
                            className={`p-2 rounded-xl text-[10.5px] font-black border transition-all cursor-pointer ${
                              isChosen
                                ? "bg-indigo-605 border-indigo-600 text-sky-950 shadow-xs ring-1 ring-indigo-305/40"
                                : "bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100"
                            }`}
                          >
                            <span>{isAr ? seat.labelAr : seat.labelEn}</span>
                            <span className="block text-[8px] opacity-80 mt-0.5">DZD {seatPrices[seat.id].toLocaleString()}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Passport Details for Match Travel */}
                  <div className="space-y-1.5 text-right sm:text-left">
                    <label className="text-xs font-extrabold text-slate-700 block">
                      {isAr ? "رقم جواز السفر للمسافر" : "Spectator Passport number"}
                    </label>
                    <input
                      type="text"
                      required
                      value={customerPassport}
                      onChange={(e) => setCustomerPassport(e.target.value)}
                      placeholder={isAr ? "مثال: 12345678" : "e.g. 12345678"}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-semibold bg-slate-50 text-slate-800"
                    />
                  </div>
                </div>

                {/* Customer Full Name */}
                <div className="space-y-1.5 text-right sm:text-left">
                  <label className="text-xs font-extrabold text-slate-700 block">
                    {isAr ? "اسم المشجع والمشاهد بالكامل (مثل جواز السفر)" : "Spectator Full Name (matching passport)"}
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={isAr ? "الاسم الكامل باللاتينية" : "Traveler Full Name"}
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-semibold bg-slate-50 text-slate-800"
                  />
                </div>

                {/* Pricing Calc Preview updated dynamically */}
                <div className="bg-slate-50 border border-slate-120 rounded-2xl p-4 flex flex-col gap-2 text-xs text-slate-700 font-semibold">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <p>{isAr ? "سعر التذاكر الأساسي للجلوس:" : "Base seat tickets fare:"}</p>
                    <p className="font-mono text-[11px] text-slate-800">
                      DZD {seatPrices[bookingTier].toLocaleString()} x {bookingQty} = DZD {(seatPrices[bookingTier] * bookingQty).toLocaleString()}
                    </p>
                  </div>
                  
                  {bookingType === "full_package" && (
                    <div className="flex items-center justify-between text-emerald-700 border-b border-slate-200/60 pb-2">
                      <p>✈️🏨 {isAr ? "باقة التكفل الكامل والسفر للفرد (مدرج):" : "Full Travel & companion coverage per person:"}</p>
                      <p className="font-mono text-[11px] font-black">
                        DZD (78,000 x {bookingQty}) = DZD {(78000 * bookingQty).toLocaleString()}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <p className="text-slate-800 font-black">{isAr ? "إجمالي التكلفة التقديرية للباقة:" : "Total package cost:"}</p>
                    <div className="text-right">
                      <p className="text-sm font-black text-indigo-700 font-mono">DZD {bookingTotalCost.toLocaleString()}</p>
                      <p className="text-[8px] text-slate-400 font-bold uppercase">{isAr ? "السعر مقدر بالدينار الجزائري" : "Estimated in Algerian DZD"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    className="w-full sm:w-2/3 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs md:text-sm tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>{isAr ? "تأكيد واستخراج التذكرة التفاعلية" : "Issue Spectator Match Pass"}</span>
                  </button>
                  <a
                    href={`https://wa.me/213551234567?text=${encodeURIComponent(
                      isAr 
                        ? `السلام عليكم وكالة فسحة ديزاد (Fos7a DZ)، أود الاستفسار عن حجز باقة السياحة الرياضية والتكفل برحلة طيران وفندق لمباراة قادمة` 
                        : "Hello Fos7a DZ, I want to inquire about customizable flight and hotel packages for upcoming stadiums matches"
                    )}`}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="w-full sm:w-1/3 h-12 rounded-xl border-2 border-emerald-550 text-emerald-700 hover:bg-emerald-50 text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="text-sm">💬</span>
                    <span>{isAr ? "استشارة واتساب" : "WhatsApp Inquiry"}</span>
                  </a>
                </div>
              </form>
            </div>

            {/* Right Box: Bookings history and ticket view list (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-indigo-650" />
                  <h3 className="font-extrabold text-sm text-slate-800">
                    {isAr ? "أرشيف تذاكرك وباقاتك المصدرة" : "Your Match passes Archive"}
                  </h3>
                </div>
                <span className="text-[10.5px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {bookingsList.length} {isAr ? "جواز مروجي" : "Passes Issued"}
                </span>
              </div>

              {bookingsList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-bold text-xs space-y-2">
                  <Ticket className="w-10 h-10 text-slate-300 mx-auto" />
                  <p>{isAr ? "لم تقم بحجز أي تذاكر مباريات لزيارتك حتى الآن." : "You have not reserved matches tickets yet."}</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[480px] overflow-y-auto">
                  {bookingsList.map((book) => (
                    <div 
                      key={book.bookingId}
                      className="border border-slate-150 rounded-2xl p-4 bg-slate-50/60 shadow-3xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[9.5px] font-black px-2.5 py-0.5 rounded border ${
                          book.bookingType === "full_package" 
                            ? "text-emerald-700 bg-emerald-50 border-emerald-100/50" 
                            : "text-rose-600 bg-rose-50 border-rose-105/50"
                        }`}>
                          {book.bookingType === "full_package" 
                            ? (isAr ? "تكفل بالرحلة طيران + فندق ✈️🏨" : "Full Travel Package ✈️🏨") 
                            : (isAr ? "تذكرة ملعب فقط 🎟️" : "Stadium Seat Only 🎟️")}
                        </span>
                        <p className="text-[10px] font-mono font-bold text-slate-400">{book.bookingId}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="font-extrabold text-xs text-slate-850">
                          {isAr ? `${book.homeTeamAr} ضد ${book.awayTeamAr}` : `${book.homeTeam} vs ${book.awayTeam}`}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold truncate">
                          🎯 {isAr ? book.leagueNameAr : book.leagueName}
                        </p>
                        <p className="text-[10px] text-indigo-600 font-black">
                          📅 {book.date}
                        </p>
                      </div>

                      {/* Print Ticket Layout for specific vouchers */}
                      <div id={`print-voucher-${book.bookingId}`} className="hidden">
                        <div className="header-logo">
                          <h2>FOS7A DZ SPORTS TOURISM</h2>
                          <p>بوابة حجز تذاكر الملاعب والمباريات الرسمية والوطنية - وكالة فسحة ديزاد</p>
                        </div>
                        <div className="badge">${book.bookingId}</div>
                        <div className="matches-vs">
                          <span>${isAr ? book.homeTeamAr : book.homeTeam}</span>
                          <strong>VS</strong>
                          <span>${isAr ? book.awayTeamAr : book.awayTeam}</span>
                        </div>
                        <div className="info-grid">
                          <div>
                            <div className="column-title">اسم المسافر</div>
                            <div className="column-data">${book.customerName}</div>
                          </div>
                          <div>
                            <div className="column-title">جواز السفر</div>
                            <div className="column-data">${book.customerPassport}</div>
                          </div>
                          <div>
                            <div className="column-title">فئة المقعد والمدرجات</div>
                            <div className="column-data">${book.tier.toUpperCase()} - DZD {seatPrices[book.tier]}</div>
                          </div>
                          <div>
                            <div className="column-title">تير التغطية والعدد</div>
                            <div className="column-data">${book.qty} تذاكر (${book.bookingType === "full_package" ? "باقة سفر شامل طيران وفندق 4 نجوم" : "تذكرة دخول فقط"})</div>
                          </div>
                          <div>
                            <div className="column-title">إجمالي الميزانية المدفوعة</div>
                            <div className="column-data">DZD ${book.totalCostDZD.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="column-title">رابط الفواتير الفورية</div>
                            <div className="column-data">${book.qrCodeToken}</div>
                          </div>
                        </div>
                        <div className="qr">
                          <div style={{ textAlign: "center", border: "1.5px solid #cbd5e1", padding: "10px", borderRadius: "8px", fontWeight: "bold", fontFamily: "monospace", fontSize: "11px" }}>
                            [ QR CODE SECURITY TOKEN : FOS7A-SPORT-TOURISM-CONFIRMED ]
                          </div>
                        </div>
                      </div>

                      <div className="flex border-t border-slate-150/85 pt-3 mt-1 items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black text-slate-400">{isAr ? "الاسم" : "Name"}</p>
                          <p className="text-[11px] font-semibold text-slate-700">{book.customerName}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={getWhatsAppBookingText(book)}
                            target="_blank"
                            referrerPolicy="no-referrer"
                            className="p-1 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-black flex items-center gap-1 border border-emerald-250/30"
                          >
                            <span>💬</span>
                            <span>{isAr ? "تنسيق الدفع" : "Pay/Finalize"}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handlePrintTicket(book)}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 font-black text-[10px] rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-indigo-200/50"
                          >
                            <Printer className="w-3 h-3" />
                            <span>{isAr ? "اطبع" : "Print"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Category: Group Fan Trip Builder (World Cup, AFCON, Arab Cup, etc.) */}
        {selectedCategory === "fan_trips" && (
          <motion.div
            key="fan_trips"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left Column: Group Tour Builder form */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-150 p-6 space-y-6 shadow-sm">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-850">
                    {isAr ? "منسق الرحلات الجماعية للمشجعين" : "Group Fan Trip Coordinator"}
                  </h3>
                  <p className="text-[10.5px] text-slate-450 font-bold mt-0.5">
                    {isAr 
                      ? "نظّم رحلة وفد مشجعين جماعية لحضور كأس العالم، الكان، كوف الأبطال أو كبار المباريات بالتنسيق مع وكالة فسحة ديزاد" 
                      : "Assemble a custom supporters group for World Cup, AFCON, Champions League with direct Fos7a coordination."}
                  </p>
                </div>
                <Users className="w-5 h-5 text-indigo-650" />
              </div>

              {/* Success display */}
              {groupSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-start gap-2.5 text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-black">{isAr ? "تم تسجيل مسودة طلب الوفد الجماعي بنجاح!" : "Group Tour Proposal saved draft!"}</h4>
                      <p className="text-[10.5px] text-emerald-700 font-semibold font-mono">
                        {isAr 
                          ? `كود الوفد: ${groupSuccess.id} | تجميع: ${groupSuccess.fansQty} مشجع`
                          : `Group ID: ${groupSuccess.id} | Delegation size: ${groupSuccess.fansQty} supporters`}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {isAr 
                          ? "جاهز لإرسال التفاصيل مباشرة لوكالة فسحة ديزاد؟ تواصل معنا مباشرة لتحديد طائرة تشارتر والفنادق وحجز مقاعد الوفد دفعة واحدة!" 
                          : "Ready to coordinate on WhatsApp? Contact our agency now to secure charter block allocation, hotels and team tickets!"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <a
                      href={getWhatsAppGroupText(groupSuccess)}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs animate-bounce"
                    >
                      <span className="text-xs">💬</span>
                      <span>{isAr ? "إرسال وتنسيق الوفد عبر واتساب" : "Send & Coordinate on WhatsApp"}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setGroupSuccess(null)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-black rounded-xl transition-colors cursor-pointer"
                    >
                      {isAr ? "تعديل الطلب" : "Edit Request"}
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleGroupTripSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Title / Tournament Selection */}
                  <div className="space-y-1.5 text-right sm:text-left">
                    <label className="text-xs font-extrabold text-slate-700 block">
                      {isAr ? "اختر البطولة المستهدفة" : "Target Major Tournament"}
                    </label>
                    <select
                      value={tripTournament}
                      onChange={(e) => setTripTournament(e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-semibold bg-slate-50 text-slate-800"
                    >
                      {internationalTournaments.map((t, idx) => (
                        <option key={idx} value={t.name}>
                          {isAr ? t.nameAr : t.name} ({t.nextEdition})
                        </option>
                      ))}
                      <option value="CAF Champions League">{isAr ? "دوري أبطال أفريقيا" : "CAF Champions League"}</option>
                      <option value="Algerian Cup Final">{isAr ? "نهائي كأس الجزائر" : "Algerian Cup Final"}</option>
                    </select>
                  </div>

                  {/* Match Match/Destination */}
                  <div className="space-y-1.5 text-right sm:text-left">
                    <label className="text-xs font-extrabold text-slate-700 block">
                      {isAr ? "الوجهة، المباراة أو الاستاد المرجو" : "Destination, Match or Stadium Target"}
                    </label>
                    <input
                      type="text"
                      required
                      value={tripDestination}
                      onChange={(e) => setTripDestination(e.target.value)}
                      placeholder={isAr ? "مثال: مكسيكو سيتي، غانا، أو مرشح ملعب الملعب" : "e.g. Mexico City, Wembley, Stade Nelson Mandela"}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-semibold bg-slate-50 text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Fans delegation size */}
                  <div className="space-y-1.5 text-right sm:text-left">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-slate-700 block">
                        {isAr ? "حجم وفد المشجعين (عدد المقاعد)" : "Group Size (Seats)"}
                      </label>
                      <span className="text-xs text-indigo-750 font-black font-mono">
                        {tripFansQty} {isAr ? "مشجع برفق" : "Fans"}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="150"
                      step="5"
                      value={tripFansQty}
                      onChange={(e) => setTripFansQty(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 font-bold font-mono">
                      <span>5</span>
                      <span>50</span>
                      <span>100</span>
                      <span>150+</span>
                    </div>
                  </div>

                  {/* Transport Option */}
                  <div className="space-y-1.5 text-right sm:text-left">
                    <label className="text-xs font-extrabold text-slate-700 block">
                      {isAr ? "خيارات تنقل الوفد المفضلة" : "Preferred Delegation Transport"}
                    </label>
                    <select
                      value={tripTransport}
                      onChange={(e) => setTripTransport(e.target.value as any)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-semibold bg-slate-50 text-slate-800"
                    >
                      <option value="charter">{isAr ? "✈️ طائرة خاصة مستأجرة (تشارتر للوفود)" : "✈️ Shared Charter Flight Alliance"}</option>
                      <option value="airline">{isAr ? "✈️ حجز تذاكر طيران تجاري جماعي" : "✈️ Regular Airline block seats"}</option>
                      <option value="bus">{isAr ? "🚌 قافلة حافلات سياحية برية مريحة" : "🚌 Deluxe Bus Caravan (Roadtrip)"}</option>
                      <option value="none">{isAr ? "❌ بدون تنسيق تنقل (تذاكر واستاد فقط)" : "❌ Tickets & accommodation selection only"}</option>
                    </select>
                  </div>
                </div>

                {/* Additional custom options */}
                <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 space-y-2 text-right sm:text-left">
                  <span className="text-xs font-black text-slate-700 block mb-1">
                    {isAr ? "مستلزمات الروابط الرياضية الإضافية (اختياري):" : "Add-on Fans Delegation Gear & Catering (Optional):"}
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label className="flex items-center gap-2 bg-white border border-slate-150 rounded-xl p-2.5 cursor-pointer hover:bg-slate-50 text-[10.5px] font-bold text-slate-705">
                      <input 
                        type="checkbox" 
                        checked={tripShirts} 
                        onChange={(e) => setTripShirts(e.target.checked)} 
                        className="accent-indigo-600"
                      />
                      <span>👕 {isAr ? "أقمصة المشجعين" : "Fan Team Jerseys"}</span>
                    </label>

                    <label className="flex items-center gap-2 bg-white border border-slate-150 rounded-xl p-2.5 cursor-pointer hover:bg-slate-50 text-[10.5px] font-bold text-slate-705">
                      <input 
                        type="checkbox" 
                        checked={tripDrums} 
                        onChange={(e) => setTripDrums(e.target.checked)} 
                        className="accent-indigo-600"
                      />
                      <span>🥁 {isAr ? "أدوات التشجيع والطبول" : "Flags & Cheering Drums"}</span>
                    </label>

                    <label className="flex items-center gap-2 bg-white border border-slate-150 rounded-xl p-2.5 cursor-pointer hover:bg-slate-50 text-[10.5px] font-bold text-slate-705">
                      <input 
                        type="checkbox" 
                        checked={tripMeals} 
                        onChange={(e) => setTripMeals(e.target.checked)} 
                        className="accent-indigo-600"
                      />
                      <span>🍲 {isAr ? "تكفل بالوجبات" : "Full Catering support"}</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                  {/* Lead Name */}
                  <div className="space-y-1.5 text-right sm:text-left">
                    <label className="text-xs font-extrabold text-slate-700 block">
                      {isAr ? "اسم رئيس الوفد المنسق" : "Lead Supporter / Organizer Name"}
                    </label>
                    <input
                      type="text"
                      required
                      value={tripLeaderName}
                      onChange={(e) => setTripLeaderName(e.target.value)}
                      placeholder={isAr ? "اسم رئيس رابطة المشجعين " : "Lead's Full Name"}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-semibold bg-slate-50 text-slate-800"
                    />
                  </div>

                  {/* Lead Phone Number */}
                  <div className="space-y-1.5 text-right sm:text-left">
                    <label className="text-xs font-extrabold text-slate-700 block">
                      {isAr ? "رقم الهاتف للتنسيق والمتابعة" : "Lead Mobile Phone"}
                    </label>
                    <input
                      type="tel"
                      required
                      value={tripLeaderPhone}
                      onChange={(e) => setTripLeaderPhone(e.target.value)}
                      placeholder={isAr ? "مثال: 0555123456" : "e.g. +213555123456"}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-semibold bg-slate-50 text-slate-800"
                    />
                  </div>
                </div>

                {/* Pricing summary */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white flex items-center justify-between text-xs font-extrabold">
                  <div className="space-y-0.5 text-right sm:text-left">
                    <p>{isAr ? "تقدير التكلفة الفردية للمشجع:" : "Estimated budget per fan:"}</p>
                    <p className="font-mono text-[10.5px] text-indigo-200">
                      ~ DZD {tourEstimatedCostPerFan.toLocaleString()} / {isAr ? "شخص" : "Fan"}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-amber-400 font-mono block">DZD {groupTotalCost.toLocaleString()}</span>
                    <span className="text-[9.5px] text-slate-300 font-semibold">{isAr ? "الميزانية الكلية للوفد" : "Estimated Total Cost"}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    className="w-full sm:w-1/2 h-12 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-black text-xs md:text-sm tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>📣</span>
                    <span>{isAr ? "حفظ كمسودة تنظيم محلية" : "Establish Group Draft Proposal"}</span>
                  </button>
                  <a
                    href={`https://wa.me/213551234567?text=${encodeURIComponent(
                      isAr 
                        ? `مرحباً وكالة فسحة ديزاد (Fos7a DZ) لخدمات السياحة الرياضية. أود تنسيق حافلة/رحلة مشجعين جماعية لحضور المباريات والبطولات الكبرى بالتنسيق معكم` 
                        : "Hello Fos7a DZ Sports Agency, we want to coordinate and consult on a dynamic group fan trip for supporters. Please guide us."
                    )}`}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="w-full sm:w-1/2 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                  >
                    <span>💬</span>
                    <span>{isAr ? "تنسيق الوفد فورا عبر واتساب" : "Group WhatsApp Hotline"}</span>
                  </a>
                </div>
              </form>
            </div>

            {/* Right Column: List of saved delegations drafts */}
            <div className="lg:col-span-12 xl:col-span-5 lg:col-start-1 bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-650" />
                  <h3 className="font-extrabold text-sm text-slate-800">
                    {isAr ? "طلبات وفود المشجعين الحالية" : "Active Delegations Proposals"}
                  </h3>
                </div>
                <span className="text-[10.5px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded">
                  {fanGroupTrips.length} {isAr ? "وفود" : "Groups"}
                </span>
              </div>

              {fanGroupTrips.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-bold text-xs space-y-2">
                  <Users className="w-10 h-10 text-slate-300 mx-auto" />
                  <p>{isAr ? "لم تقم بتسجيل أي وفود أو رابطة مشجعين مخصصة حتى الآن." : "No custom supporters delegations drafts recorded yet."}</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[520px] overflow-y-auto">
                  {fanGroupTrips.map((gTour) => (
                    <div 
                      key={gTour.id}
                      className="border border-slate-150 rounded-2xl p-4 bg-slate-50/70 shadow-3xs space-y-3 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 h-1 w-24 bg-indigo-600" />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100/50">
                          {isAr ? "طلب انتظار مراجعة الوكالة" : "Pending Agency Review"}
                        </span>
                        <p className="text-[10px] font-mono font-bold text-slate-400">{gTour.id}</p>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-black text-xs text-slate-850">
                          🌍 {isAr ? gTour.tournamentAr : gTour.tournament}
                        </h4>
                        <p className="text-[10px] text-slate-600 font-bold">
                          📍 {isAr ? `الوجهة المقترحة: ${gTour.destinationAr}` : `Target Destination: ${gTour.destination}`}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          👥 {isAr ? `حجم وفد الوفد: ${gTour.fansQty} مشجعين` : `Delegation Seats: ${gTour.fansQty} supporters`}
                        </p>
                        <p className="text-[10px] text-indigo-750 font-black">
                          💰 {isAr ? "الميزانية المتوقعة:" : "Estimated Budget:"} DZD {gTour.totalEstimatedCostDZD.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex border-t border-slate-150 pt-3 mt-1 items-center justify-between">
                        <div className="text-right sm:text-left">
                          <p className="text-[9px] text-slate-400 font-black mb-0.5">{isAr ? "المنسق" : "Lead Organizer"}</p>
                          <p className="text-[10.5px] font-extrabold text-slate-700 max-w-[120px] truncate">{gTour.leaderName}</p>
                        </div>

                        <a
                          href={getWhatsAppGroupText(gTour)}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-750 font-black text-[10px] rounded-lg transition-colors flex items-center gap-1.5 border border-emerald-200/50"
                        >
                          <span className="text-xs">💬</span>
                          <span>{isAr ? "إرسال لواتساب" : "Send to WA"}</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Itinerary Calendar Synchronization Modal Dialog */}
      <AnimatePresence>
        {calendarModalMatch && (
          <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 max-w-sm w-full overflow-hidden shadow-2xl space-y-0"
            >
              {/* Modal header pitch background */}
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 p-4.5 text-white relative">
                <div className="absolute top-1/2 right-4 -translate-y-1/2 w-20 h-20 bg-white/5 rounded-full filter blur-xl pointer-events-none" />
                <h4 className="font-extrabold text-xs tracking-wide">
                  ⚽ {isAr ? "جدولة اللقاء بمخطط رحلتك بالجزائر" : "Sync Football Schedule with Itinerary Calendar"}
                </h4>
                <p className="text-[9.5px] text-emerald-100 font-medium">
                  {isAr ? "أضف توقيت وملعب اللقاء تلقائياً لبرنامجك السياحي" : "Overlay score times & stadiums directly onto your travel days"}
                </p>
              </div>

              {/* Modal content area */}
              <div className="p-4 space-y-3.5">
                {/* Selected Match details card */}
                <div className="bg-slate-50 border border-slate-150 p-3 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                    <span className="bg-indigo-50 text-indigo-750 px-1.5 py-0.5 rounded font-black">
                      {isAr ? calendarModalMatch.leagueAr : calendarModalMatch.league}
                    </span>
                    <span>{calendarModalMatch.date}</span>
                  </div>
                  <div className="flex justify-between items-center text-center font-black text-slate-800 text-[11px] text-ellipsis">
                    <span className="truncate w-[44%]">{isAr ? calendarModalMatch.homeTeamAr : calendarModalMatch.homeTeam}</span>
                    <span className="text-slate-400 text-[9px] w-[12%] font-bold">VS</span>
                    <span className="truncate w-[44%]">{isAr ? calendarModalMatch.awayTeamAr : calendarModalMatch.awayTeam}</span>
                  </div>
                  <p className="text-[9px] font-semibold text-slate-500 text-center font-mono">
                    📍 {isAr ? calendarModalMatch.venueAr : calendarModalMatch.venue}
                  </p>
                </div>

                {!activeItinerary ? (
                  /* No active itinerary - bootstrap layout */
                  <div className="bg-amber-500/5 border border-amber-200/50 p-3.5 rounded-2xl text-center space-y-2.5">
                    <p className="text-[10px] leading-relaxed text-slate-705 font-bold">
                      ⚠️ {isAr 
                        ? "لم تقم بإنشاء أي مخطط رحلة سياحية بعد! هل تود إنشاء مخطط رحلة كروي افتراضي فوراً لتخزين اللقاء؟" 
                        : "You don't have an active travel plan yet! Create a customized sports fan itinerary now to save this fixture:"}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleBootstrappingSportItinerary(calendarModalMatch)}
                      className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-[10.5px] font-black transition-all cursor-pointer shadow-3xs flex items-center justify-center gap-1"
                    >
                      <span>🚀</span>
                      <span>{isAr ? "إنشاء مخطط رحلة المعجبين الجديد" : "Create Fans Travel Itinerary"}</span>
                    </button>
                  </div>
                ) : (
                  /* Choose target day */
                  <div className="space-y-2">
                    <label className="block text-[10px] font-extrabold text-slate-700 text-right sm:text-left">
                      📅 {isAr ? "اختر اليوم المراد الإضافة فيه:" : "Select day to add match activity:"}
                    </label>
                    
                    <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                      {activeItinerary.days?.map((day: any) => {
                        const isSel = selectedItineraryDay === day.day;
                        return (
                          <button
                            key={day.day}
                            type="button"
                            onClick={() => setSelectedItineraryDay(day.day)}
                            className={`px-2 py-2 rounded-xl border text-[10.5px] text-center font-black transition-all cursor-pointer ${
                              isSel
                                ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-3xs"
                                : "bg-white hover:bg-slate-50 border-slate-205 text-slate-650"
                            }`}
                          >
                            <p>{isAr ? `اليوم ${day.day}` : `Day ${day.day}`}</p>
                            <p className="text-[8px] text-slate-400 font-medium truncate">
                              {day.activities?.length || 0} {isAr ? "أنشطة" : "activities"}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal footer controls */}
              <div className="bg-slate-50/80 border-t border-slate-150 p-3 flex items-center justify-end gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => setCalendarModalMatch(null)}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-550 border border-slate-250 rounded-xl font-extrabold cursor-pointer transition-colors"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
                {activeItinerary && (
                  <button
                    type="button"
                    onClick={() => handleSaveEventToItinerary()}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl cursor-pointer transition-all shadow-3xs flex items-center gap-1"
                  >
                    <span>✓</span>
                    <span>{isAr ? "ضم للمخطط" : "Sync Schedule"}</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
