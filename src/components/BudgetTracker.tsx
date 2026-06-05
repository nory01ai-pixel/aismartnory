import React, { useState, useEffect, useMemo } from "react";
import { 
  TrendingUp, 
  Trash2, 
  Plus, 
  Check, 
  DollarSign, 
  AlertTriangle, 
  PiggyBank,
  PieChart as ChartIcon,
  ShoppingBag,
  Utensils,
  PlusCircle,
  HelpCircle,
  CreditCard,
  Briefcase
} from "lucide-react";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip,
  Legend
} from "recharts";
import { Itinerary } from "../types";
import { motion, AnimatePresence } from "motion/react";

function getAutoCategoryOfActivity(title: string, desc: string): "transport" | "food" | "shopping" | "activities" {
  const text = `${title} ${desc}`.toLowerCase();
  
  // Food & Dining Keywords
  const foodKeywords = [
    "food", "dine", "dining", "dinner", "lunch", "breakfast", "cafe", "restaurant", "eat", "meal", 
    "coffee", "bistro", "pastry", "street-food", "sweet", "bakery", "snack", "tea", "drink", "culinary", 
    "طعام", "عشاء", "غداء", "فطور", "مطعم", "أكل", "قهوة", "مقهى", "وجبة", "حلويات", "مخبز", "شوربة", "شاي"
  ];
  
  // Transportation & Transit Keywords
  const transportKeywords = [
    "trans", "transport", "transit", "taxi", "bus", "metro", "drive", "uber", "flight", "car rent", 
    "car hire", "ride", "train", "cab", "rickshaw", "subway", "shuttle", "ticket transit", "fuel", "gas", 
    "حافلة", "أجرة", "تاكسي", "سيارة", "مركبة", "طريق", "نقل", "قطار", "طيران", "تذكرة", "وقود"
  ];

  // Shopping Keywords
  const shoppingKeywords = [
    "shop", "shopping", "mall", "market", "boutique", "souvenir", "buy", "gift", "bazaar", "store", "purchase",
    "تسوق", "محل", "شراء", "سوق", "هدايا", "متجر"
  ];

  if (transportKeywords.some(kw => text.includes(kw))) {
    return "transport";
  }
  if (foodKeywords.some(kw => text.includes(kw))) {
    return "food";
  }
  if (shoppingKeywords.some(kw => text.includes(kw))) {
    return "shopping";
  }
  return "activities";
}

interface BudgetTrackerProps {
  itinerary: Itinerary;
  selectedHotel: any | null; // HotelMock | null
  selectedFlight: any | null; // FlightMock | null
  lang: "en" | "ar";
  customExchangeRate: number;
  formatPrice: (priceUSDorLocal: number) => string;
}

interface CustomExpense {
  id: string;
  category: "dining" | "shopping" | "emergency" | "other";
  description: string;
  amount: number;
}

export default function BudgetTracker({
  itinerary,
  selectedHotel,
  selectedFlight,
  lang,
  customExchangeRate,
  formatPrice,
}: BudgetTrackerProps) {
  const isDomestic = !!itinerary.isDomesticTrip;
  const currentRate = customExchangeRate || 140;
  const itId = itinerary.departureDate ? `${itinerary.destinationName}_${itinerary.departureDate}` : itinerary.destinationName;

  // State for Custom Budgets
  const [customBudgetTarget, setCustomBudgetTarget] = useState<string>("");
  const [customExpenses, setCustomExpenses] = useState<CustomExpense[]>([]);
  const [selectedLifestyle, setSelectedLifestyle] = useState<"budget" | "standard" | "luxury">("standard");
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [selectedConvertCurrency, setSelectedConvertCurrency] = useState<"USD" | "EUR" | "DZD">(
    isDomestic ? "DZD" : "USD"
  );

  // Manual category budget rate overrides
  const [manualHotelOverride, setManualHotelOverride] = useState<number | null>(() => {
    const val = localStorage.getItem(`budget_tracker_${itId}_override_hotel`);
    return val ? parseFloat(val) : null;
  });
  const [manualTransportOverride, setManualTransportOverride] = useState<number | null>(() => {
    const val = localStorage.getItem(`budget_tracker_${itId}_override_transit`);
    return val ? parseFloat(val) : null;
  });
  const [manualDiningOverride, setManualDiningOverride] = useState<number | null>(() => {
    const val = localStorage.getItem(`budget_tracker_${itId}_override_dining`);
    return val ? parseFloat(val) : null;
  });

  // Keep manual overrides updated in localStorage
  const handleSetManualHotelOverride = (val: number | null) => {
    setManualHotelOverride(val);
    if (val === null) {
      localStorage.removeItem(`budget_tracker_${itId}_override_hotel`);
    } else {
      localStorage.setItem(`budget_tracker_${itId}_override_hotel`, val.toString());
    }
  };

  const handleSetManualTransportOverride = (val: number | null) => {
    setManualTransportOverride(val);
    if (val === null) {
      localStorage.removeItem(`budget_tracker_${itId}_override_transit`);
    } else {
      localStorage.setItem(`budget_tracker_${itId}_override_transit`, val.toString());
    }
  };

  const handleSetManualDiningOverride = (val: number | null) => {
    setManualDiningOverride(val);
    if (val === null) {
      localStorage.removeItem(`budget_tracker_${itId}_override_dining`);
    } else {
      localStorage.setItem(`budget_tracker_${itId}_override_dining`, val.toString());
    }
  };

  const tripDays = useMemo(() => {
    return itinerary.days?.length || itinerary.tripDurationDays || 1;
  }, [itinerary]);

  const simulatedSpending = useMemo(() => {
    const isDz = isDomestic;
    const rates = {
      budget: {
        food: isDz ? 1500 : 15,
        transport: isDz ? 1000 : 10,
        activities: isDz ? 1500 : 15,
      },
      standard: {
        food: isDz ? 5000 : 45,
        transport: isDz ? 3000 : 25,
        activities: isDz ? 4000 : 40,
      },
      luxury: {
        food: isDz ? 18000 : 140,
        transport: isDz ? 12005 : 90,
        activities: isDz ? 15000 : 110,
      }
    };

    const currentRates = rates[selectedLifestyle];
    const dailyTotal = currentRates.food + currentRates.transport + currentRates.activities;
    const tripTotal = dailyTotal * tripDays;

    return {
      food: currentRates.food,
      transport: currentRates.transport,
      activities: currentRates.activities,
      dailyTotal,
      tripTotal
    };
  }, [selectedLifestyle, isDomestic, tripDays]);

  // Form states for creating custom items
  const [newDesc, setNewDesc] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCat, setNewCat] = useState<"dining" | "shopping" | "emergency" | "other">("dining");

  // Synchronize target budget when itinerary updates
  useEffect(() => {
    if (itinerary) {
      const budgetStr = itinerary.allocatedBudgetAmount || "";
      const numericPart = budgetStr.replace(/[^\d]/g, "");
      setCustomBudgetTarget(numericPart || "150000");

      // Load custom logged expenses from localStorage
      const savedExpenses = localStorage.getItem(`budget_tracker_${itId}_expenses`);
      if (savedExpenses) {
        try {
          setCustomExpenses(JSON.parse(savedExpenses));
        } catch {
          setCustomExpenses([]);
        }
      } else {
        setCustomExpenses([]);
      }

      // Load manual price overrides
      const h = localStorage.getItem(`budget_tracker_${itId}_override_hotel`);
      setManualHotelOverride(h ? parseFloat(h) : null);
      const t = localStorage.getItem(`budget_tracker_${itId}_override_transit`);
      setManualTransportOverride(t ? parseFloat(t) : null);
      const d = localStorage.getItem(`budget_tracker_${itId}_override_dining`);
      setManualDiningOverride(d ? parseFloat(d) : null);
    }
  }, [itinerary, itId]);

  // Persist custom expenses
  const saveExpensesToLocalStorage = (expenses: CustomExpense[]) => {
    localStorage.setItem(`budget_tracker_${itId}_expenses`, JSON.stringify(expenses));
  };

  // Base values calculations
  const activitiesTotal = useMemo(() => {
    return itinerary.days?.reduce((sum, d) => {
      return sum + (d.activities?.reduce((sub, act) => sub + (act.estimatedCostUSD || 0), 0) || 0);
    }, 0) || 0;
  }, [itinerary.days]);

  // Split activities into custom sub-categories based on their descriptions using keywords
  const parsedActivitiesBreakdown = useMemo(() => {
    let transport = 0;
    let food = 0;
    let shopping = 0;
    let activities = 0;
    const items: Array<{
      title: string;
      description: string;
      cost: number;
      category: "transport" | "food" | "shopping" | "activities";
    }> = [];

    itinerary.days?.forEach(d => {
      d.activities?.forEach(act => {
        const cost = act.estimatedCostUSD || 0;
        const cat = getAutoCategoryOfActivity(act.title, act.description);
        
        if (cost > 0) {
          if (cat === "transport") transport += cost;
          else if (cat === "food") food += cost;
          else if (cat === "shopping") shopping += cost;
          else activities += cost;
        }

        items.push({
          title: act.title,
          description: act.description,
          cost,
          category: cat
        });
      });
    });

    return { transport, food, shopping, activities, items };
  }, [itinerary.days]);

  const hotelTotal = useMemo(() => {
    const hotelPricePerNight = selectedHotel
      ? selectedHotel.priceUSD
      : (itinerary.suggestedHotels?.[0]?.pricePerNightUSD || 0);
    return hotelPricePerNight * (itinerary.days?.length || itinerary.tripDurationDays || 1);
  }, [itinerary, selectedHotel]);

  const flightTotal = useMemo(() => {
    return selectedFlight ? selectedFlight.priceUSD : 0;
  }, [selectedFlight]);

  // Adjust values based on currency mode
  const finalHotelVal = isDomestic && selectedHotel ? hotelTotal * currentRate : hotelTotal;
  const finalFlightVal = isDomestic && selectedFlight ? flightTotal * currentRate : flightTotal;
  const finalActivitiesVal = activitiesTotal; // Itinerary API generates in local rate directly for domestic

  // Sum up custom expenses
  const customSumByCategory = useMemo(() => {
    const sums = { dining: 0, shopping: 0, emergency: 0, other: 0 };
    customExpenses.forEach(exp => {
      sums[exp.category] += exp.amount;
    });
    return sums;
  }, [customExpenses]);

  const totalCustomExpensesValue = useMemo(() => {
    return customExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [customExpenses]);

  // Adjusted values based on manual user overrides 
  const adjustedHotelVal = manualHotelOverride !== null ? manualHotelOverride : finalHotelVal;
  const adjustedTransportVal = manualTransportOverride !== null ? manualTransportOverride : (finalFlightVal + parsedActivitiesBreakdown.transport);
  const adjustedDiningVal = manualDiningOverride !== null ? manualDiningOverride : (customSumByCategory.dining + parsedActivitiesBreakdown.food);

  // Combined total including manual overrides and remaining categories
  const totalBaseCost = 
    parsedActivitiesBreakdown.activities + 
    adjustedHotelVal + 
    adjustedTransportVal + 
    adjustedDiningVal + 
    (customSumByCategory.shopping + parsedActivitiesBreakdown.shopping) + 
    customSumByCategory.emergency + 
    customSumByCategory.other;

  const convertedTotalPrices = useMemo(() => {
    // 1. Convert base cost to USD
    let valueInUSD = totalBaseCost;
    if (isDomestic) {
      valueInUSD = totalBaseCost / (customExchangeRate || 140);
    }

    // 2. Compute converted values
    const usdVal = valueInUSD;
    const eurVal = valueInUSD * 0.92;
    const dzdVal = valueInUSD * (customExchangeRate || 140);

    return {
      USD: usdVal,
      EUR: eurVal,
      DZD: dzdVal
    };
  }, [totalBaseCost, isDomestic, customExchangeRate]);

  const formatConvertedPrice = (val: number, curr: "USD" | "EUR" | "DZD") => {
    if (curr === "USD") {
      return `$${Math.round(val).toLocaleString()}`;
    }
    if (curr === "EUR") {
      return `€${Math.round(val).toLocaleString()}`;
    }
    const suffix = lang === "ar" ? "دج" : "DZD";
    return `${Math.round(val).toLocaleString()} ${suffix}`;
  };

  // Seasonal Monthly Multipliers for benchmarking budget trends at destination
  const monthsSeasonalData = useMemo(() => {
    const multipliers = [0.90, 0.88, 0.95, 1.05, 1.12, 1.25, 1.35, 1.30, 1.15, 1.02, 0.92, 0.98];
    const namesAr = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const namesEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    return multipliers.map((mult, idx) => {
      const value = simulatedSpending.dailyTotal * 30 * mult;
      return {
        idx,
        nameAr: namesAr[idx],
        nameEn: namesEn[idx],
        value,
        mult,
        isHighSeason: mult >= 1.20,
        isLowSeason: mult < 0.95
      };
    });
  }, [simulatedSpending]);

  const userMonthlyEquivalent = useMemo(() => {
    return (totalBaseCost / (tripDays || 1)) * 30;
  }, [totalBaseCost, tripDays]);

  const maxChartYVal = useMemo(() => {
    const maxDataVal = Math.max(...monthsSeasonalData.map(m => m.value));
    return Math.max(maxDataVal, userMonthlyEquivalent * 1.1) || 100;
  }, [monthsSeasonalData, userMonthlyEquivalent]);

  // Savings Potential & Luxury Comparison Calculations
  const savingsSummary = useMemo(() => {
    const actualActivitiesVal = parsedActivitiesBreakdown.activities;
    const actualHotelVal = adjustedHotelVal;
    const actualTransitVal = adjustedTransportVal;
    const actualCustomVal = customSumByCategory.shopping + parsedActivitiesBreakdown.shopping + customSumByCategory.emergency + customSumByCategory.other;
    const actualTotalSum = totalBaseCost;

    // Luxury high-end premium estimations
    const luxuryActivitiesVal = actualActivitiesVal > 0 ? actualActivitiesVal * 2.5 : (isDomestic ? 35000 : 250);
    const luxuryHotelVal = actualHotelVal > 0 ? actualHotelVal * 2.8 : (isDomestic ? 90000 : 650);
    const luxuryTransitVal = actualTransitVal > 0 ? actualTransitVal * 2.4 : (isDomestic ? 30000 : 200);
    const luxuryTotalSum = luxuryActivitiesVal + luxuryHotelVal + luxuryTransitVal + actualCustomVal + adjustedDiningVal;

    const savingsPotential = Math.max(0, luxuryTotalSum - actualTotalSum);

    return {
      actualTotalSum,
      luxuryTotalSum,
      savingsPotential,
      actualActivitiesVal,
      luxuryActivitiesVal,
      actualHotelVal,
      luxuryHotelVal,
      actualTransitVal,
      luxuryTransitVal
    };
  }, [parsedActivitiesBreakdown, adjustedHotelVal, adjustedTransportVal, adjustedDiningVal, customSumByCategory, totalBaseCost, isDomestic]);

  const limitNum = parseFloat(customBudgetTarget) || 0;
  const isOver = limitNum > 0 && totalBaseCost > limitNum;
  const overDiff = totalBaseCost - limitNum;

  // Chart Data Preparation
  const chartData = useMemo(() => {
    return [
      { 
        name: lang === "ar" ? "🎯 الأنشطة والترفيه" : "🎯 Activities & Attractions", 
        value: parsedActivitiesBreakdown.activities, 
        color: "#6366f1",
        key: "activities"
      },
      { 
        name: lang === "ar" ? "🏨 الفندق والإقامة" : "🏨 Lodgings", 
        value: adjustedHotelVal, 
        color: "#10b981",
        key: "hotel"
      },
      { 
        name: lang === "ar" ? "✈️ المواصلات والنقل" : "✈️ Transit & Transport", 
        value: adjustedTransportVal, 
        color: "#3b82f6",
        key: "transit"
      },
      { 
        name: lang === "ar" ? "🍽️ مطاعم ومأكولات" : "🍽️ Dining & Food", 
        value: adjustedDiningVal, 
        color: "#f59e0b",
        key: "dining"
      },
      { 
        name: lang === "ar" ? "🛍️ تسوق وهدايا" : "🛍️ Shopping & Souvenirs", 
        value: customSumByCategory.shopping + parsedActivitiesBreakdown.shopping, 
        color: "#ec4899",
        key: "shopping"
      },
      { 
        name: lang === "ar" ? "🆘 ميزانية طوارئ" : "🆘 Emergencies", 
        value: customSumByCategory.emergency, 
        color: "#ef4444",
        key: "emergency"
      },
      { 
        name: lang === "ar" ? "➕ تكاليف عامة أخرى" : "➕ Other Expenses", 
        value: customSumByCategory.other, 
        color: "#8b5cf6",
        key: "other"
      }
    ].filter(d => d.value > 0);
  }, [parsedActivitiesBreakdown, adjustedHotelVal, adjustedTransportVal, adjustedDiningVal, customSumByCategory, lang]);

  // Handle adding custom items
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(newAmount.replace(/[^\d.]/g, ""));
    if (!newDesc.trim() || isNaN(amountVal) || amountVal <= 0) return;

    const newExpense: CustomExpense = {
      id: "exp_" + Date.now().toString(36),
      category: newCat,
      description: newDesc.trim(),
      amount: amountVal
    };

    const next = [...customExpenses, newExpense];
    setCustomExpenses(next);
    saveExpensesToLocalStorage(next);
    setNewDesc("");
    setNewAmount("");
  };

  const handleRemoveExpense = (id: string) => {
    const next = customExpenses.filter(exp => exp.id !== id);
    setCustomExpenses(next);
    saveExpensesToLocalStorage(next);
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "dining": return lang === "ar" ? "🍽️ طعام ومشروبات" : "🍽️ Dining & Food";
      case "shopping": return lang === "ar" ? "🛍️ تسوق وهدايا" : "🛍️ Shopping";
      case "emergency": return lang === "ar" ? "🆘 حالة طارئة" : "🆘 Emergency";
      default: return lang === "ar" ? "📦 أخرى" : "📦 Other";
    }
  };

  return (
    <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs space-y-6 flex flex-col justify-between" id="applet-budget-tracker">
      <div className="space-y-4">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0">
              <PieIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 tracking-tight text-sm">
                {lang === "ar" ? "متعقب الميزانية والتدفقات المالية" : "Itinerary Budget Tracker & Planner"}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                {lang === "ar" ? "تحليل توزيع التكاليف بدقة وتوقع الميزانية المثالية" : "Comprehensive expense breakdown & actual cost forecasting"}
              </p>
            </div>
          </div>
          <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-150 p-2.5 rounded-xl flex flex-col items-start sm:items-end gap-1.5 transition-all w-full sm:w-auto min-w-[200px] max-w-full">
            {/* Currency switcher buttons */}
            <div className="flex items-center justify-between w-full sm:w-auto gap-3">
              <span className="text-[9px] text-slate-450 font-black uppercase shrink-0">
                {lang === "ar" ? "التكلفة الكلية للرحلة:" : "TOTAL TRIP COST:"}
              </span>
              <div className="flex items-center gap-0.5 bg-slate-200/50 border border-slate-200 p-0.5 rounded-lg">
                {(["USD", "EUR", "DZD"] as const).map((curr) => {
                  const isSelected = selectedConvertCurrency === curr;
                  return (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => setSelectedConvertCurrency(curr)}
                      className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-md transition-all cursor-pointer ${
                        isSelected 
                          ? "bg-indigo-600 text-white shadow-3xs" 
                          : "text-slate-600 hover:bg-slate-300/50 hover:text-slate-950"
                      }`}
                    >
                      {curr}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price output */}
            <div className="flex items-baseline gap-1.5 justify-start sm:justify-end w-full">
              <span className="text-base font-black text-indigo-750 font-mono leading-none">
                {formatConvertedPrice(convertedTotalPrices[selectedConvertCurrency], selectedConvertCurrency)}
              </span>
              {selectedConvertCurrency !== (isDomestic ? "DZD" : "USD") && (
                <span className="text-[9px] text-slate-400 font-bold leading-none select-none">
                  ({formatPrice(totalBaseCost)})
                </span>
              )}
            </div>

            {/* Rate references */}
            <span className="text-[8px] font-bold text-slate-400 block tracking-tight leading-none text-start sm:text-end select-none">
              {lang === "ar" 
                ? `المعدل المعتمد: 1 USD = ${customExchangeRate || 140} DZD | 1 USD = 0.92 EUR` 
                : `Rates: 1 USD = ${customExchangeRate || 140} DZD | 1 USD = 0.92 EUR`}
            </span>
          </div>
        </div>

        {/* Chart & Category Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          
          {/* Legend and Base Category cost listing */}
          <div className="md:col-span-6 space-y-2">
            <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wide mb-1 px-1">
              {lang === "ar" ? "تقسيم المصاريف الأساسية:" : "Expense Categories Allocation:"}
            </h4>
            <div className="space-y-1.5 text-xs max-h-[190px] overflow-y-auto pr-1 scrollbar-none">
              {chartData.map((item) => (
                <div key={item.key} className="flex justify-between items-center bg-slate-50/50 hover:bg-slate-50 p-2 rounded-lg border border-slate-100 transition-colors">
                  <span className="font-semibold text-slate-650 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <span className="font-black text-slate-800 font-mono">{formatPrice(item.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recharts Pie Chart Block */}
          <div className="md:col-span-6 flex items-center justify-center min-h-[150px] relative">
            {chartData.length > 0 ? (
              <div className="w-full h-[150px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={56}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: any) => [formatPrice(Number(value)), ""]}
                      contentStyle={{
                        background: "#0f172a",
                        border: "1px solid #1e293b",
                        borderRadius: "10px",
                        fontSize: "9px",
                        color: "#fff",
                        padding: "4px 8px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Balance Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none border-0">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{lang === "ar" ? "رصيدك" : "SHARE"}</span>
                  <span className="text-[10px] font-black text-slate-700 mt-0.5">
                    {Math.round((finalActivitiesVal / (totalBaseCost || 1)) * 100)}% {lang === "ar" ? "أنشطة" : "Act"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center p-4">
                <span className="text-2xl">📊</span>
                <p className="text-[10px] text-slate-400 font-bold leading-normal mt-1.5">
                  {lang === "ar" ? "لا توجد مصاريف لتصويرها بيانياً حالياً" : "Configure lodging or activities to populate visual chart."}
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Dynamic target limits selector details */}
        <div className="bg-slate-50/50 rounded-xl p-3.5 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="text-[10px] font-black text-slate-400 block uppercase tracking-wider mb-1">
              {lang === "ar" ? "ميزانيتك المستهدفة للرحلة:" : "Custom Budget Ceiling / Limit:"}
            </label>
            <div className="relative max-w-sm">
              <input
                type="text"
                value={customBudgetTarget}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^\d]/g, "");
                  setCustomBudgetTarget(val);
                }}
                placeholder={lang === "ar" ? "أدخل قيمة ميزانيتك" : "Enter max limit amount"}
                className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-xs font-bold font-mono px-3.5 py-1.5 rounded-lg text-slate-800 tracking-tight"
              />
              <div className="absolute right-3.5 top-2 text-[9px] font-black text-slate-400 uppercase pointer-events-none">
                {isDomestic ? (lang === "ar" ? "دج" : "DZD") : "USD"}
              </div>
            </div>
          </div>

          <div className="text-start md:text-end shrink-0 sm:min-w-[120px]">
            <span className="text-[9px] text-slate-400 font-extrabold uppercase block">{lang === "ar" ? "رصيد متبقي" : "BALANCE REMAINING"}</span>
            <span className={`text-sm font-black font-mono ${isOver ? "text-rose-600 animate-pulse" : "text-emerald-600"}`}>
              {isOver ? "-" : ""}{formatPrice(Math.abs(limitNum - totalBaseCost))}
            </span>
          </div>
        </div>

        {/* Manual Pricing Override Controls */}
        <div className="bg-indigo-50/40 border border-indigo-150/45 rounded-2xl p-4 md:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-indigo-50/70 p-2.5 px-3.5 rounded-xl border border-indigo-100">
            <span className="text-[10px] font-black text-indigo-700 bg-white border border-indigo-150 px-2.5 py-1 rounded-md leading-none self-start sm:self-center">
              {isDomestic ? (lang === "ar" ? "العملة: دج" : "CURRENCY: DZD") : (lang === "ar" ? "العملة: $" : "CURRENCY: USD")}
            </span>
            <div className="text-right">
              <h4 className="text-xs font-black text-indigo-900 flex items-center gap-1 justify-end">
                <span>🔧 {lang === "ar" ? "تعديل الميزانية التقديرية يدويًا (اختياري)" : "Manual Budget Rate Adjustments (Optional)"}</span>
              </h4>
              <p className="text-[9.5px] text-indigo-650 font-semibold mt-0.5 max-w-lg leading-normal">
                {lang === "ar" 
                  ? "تعديل أسعار الإقامة، النقل والاطعام يدويًا لتوقع التكلفة والتحكم المالي بمرونة وإلغاء المعدلات الافتراضية." 
                  : "Manually fine-tune prices for hotel stays, transit/plane tickets, or eating out to overwrite automatic estimates."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Lodgings/Accommodation Override */}
            <div className="space-y-1.5 text-right">
              <label className="text-[10px] font-black text-slate-500 uppercase block tracking-wider">
                🏨 {lang === "ar" ? "سعر الإقامة والسكن:" : "Stay / Accommodation:"}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={manualHotelOverride !== null ? manualHotelOverride : ""}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^\d.]/g, "");
                    handleSetManualHotelOverride(clean ? parseFloat(clean) : null);
                  }}
                  placeholder={Math.round(finalHotelVal).toString()}
                  className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg p-2 text-xs font-bold font-mono tracking-tight text-slate-850"
                />
                <div className="absolute right-3.5 top-2.5 text-[9px] font-black text-slate-400 pointer-events-none uppercase">
                  {isDomestic ? (lang === "ar" ? "دج" : "DZD") : "USD"}
                </div>
                {manualHotelOverride !== null && (
                  <button
                    type="button"
                    onClick={() => handleSetManualHotelOverride(null)}
                    className="absolute left-2 top-2 text-[9px] font-black text-rose-500 hover:underline cursor-pointer bg-rose-50 border border-rose-150 px-1.5 py-0.5 rounded-md leading-none transition-all"
                  >
                    {lang === "ar" ? "إعادة" : "Reset"}
                  </button>
                )}
              </div>
              <span className="text-[9.5px] text-slate-400 block font-semibold leading-normal">
                {manualHotelOverride !== null 
                  ? (lang === "ar" ? "✨ تم التعديل يدويًا" : "✨ Rate overridden manually")
                  : (lang === "ar" ? `المقدر تلقائياً: ${Math.round(finalHotelVal).toLocaleString()}` : `Computed rate: ${Math.round(finalHotelVal).toLocaleString()}`)}
              </span>
            </div>

            {/* Transport/Transit Override */}
            <div className="space-y-1.5 text-right">
              <label className="text-[10px] font-black text-slate-500 uppercase block tracking-wider">
                🚌 {lang === "ar" ? "سعر النقل والمواصلات:" : "Transit & Flights:"}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={manualTransportOverride !== null ? manualTransportOverride : ""}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^\d.]/g, "");
                    handleSetManualTransportOverride(clean ? parseFloat(clean) : null);
                  }}
                  placeholder={Math.round(finalFlightVal + parsedActivitiesBreakdown.transport).toString()}
                  className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg p-2 text-xs font-bold font-mono tracking-tight text-slate-850"
                />
                <div className="absolute right-3.5 top-2.5 text-[9px] font-black text-slate-400 pointer-events-none uppercase">
                  {isDomestic ? (lang === "ar" ? "دج" : "DZD") : "USD"}
                </div>
                {manualTransportOverride !== null && (
                  <button
                    type="button"
                    onClick={() => handleSetManualTransportOverride(null)}
                    className="absolute left-2 top-2 text-[9px] font-black text-rose-500 hover:underline cursor-pointer bg-rose-50 border border-rose-150 px-1.5 py-0.5 rounded-md leading-none transition-all"
                  >
                    {lang === "ar" ? "إعادة" : "Reset"}
                  </button>
                )}
              </div>
              <span className="text-[9.5px] text-slate-400 block font-semibold leading-normal">
                {manualTransportOverride !== null 
                  ? (lang === "ar" ? "✨ تم التعديل يدويًا" : "✨ Rate overridden manually")
                  : (lang === "ar" ? `المقدر تلقائياً: ${Math.round(finalFlightVal + parsedActivitiesBreakdown.transport).toLocaleString()}` : `Computed rate: ${Math.round(finalFlightVal + parsedActivitiesBreakdown.transport).toLocaleString()}`)}
              </span>
            </div>

            {/* Food/Dining Override */}
            <div className="space-y-1.5 text-right">
              <label className="text-[10px] font-black text-slate-500 uppercase block tracking-wider">
                🍽 {lang === "ar" ? "سعر المأكولات والوجبات:" : "Dining & Catering:"}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={manualDiningOverride !== null ? manualDiningOverride : ""}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^\d.]/g, "");
                    handleSetManualDiningOverride(clean ? parseFloat(clean) : null);
                  }}
                  placeholder={Math.round(customSumByCategory.dining + parsedActivitiesBreakdown.food).toString()}
                  className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg p-2 text-xs font-bold font-mono tracking-tight text-slate-850"
                />
                <div className="absolute right-3.5 top-2.5 text-[9px] font-black text-slate-400 pointer-events-none uppercase">
                  {isDomestic ? (lang === "ar" ? "دج" : "DZD") : "USD"}
                </div>
                {manualDiningOverride !== null && (
                  <button
                    type="button"
                    onClick={() => handleSetManualDiningOverride(null)}
                    className="absolute left-2 top-2 text-[9px] font-black text-rose-500 hover:underline cursor-pointer bg-rose-50 border border-rose-150 px-1.5 py-0.5 rounded-md leading-none transition-all"
                  >
                    {lang === "ar" ? "إعادة" : "Reset"}
                  </button>
                )}
              </div>
              <span className="text-[9.5px] text-slate-400 block font-semibold leading-normal">
                {manualDiningOverride !== null 
                  ? (lang === "ar" ? "✨ تم التعديل يدويًا" : "✨ Rate overridden manually")
                  : (lang === "ar" ? `المقدر تلقائياً: ${Math.round(customSumByCategory.dining + parsedActivitiesBreakdown.food).toLocaleString()}` : `Computed rate: ${Math.round(customSumByCategory.dining + parsedActivitiesBreakdown.food).toLocaleString()}`)}
              </span>
            </div>
          </div>
        </div>

        {/* Compare limit badge warning message alert */}
        {limitNum > 0 && (
          <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs font-bold transition-all ${
            isOver
              ? "bg-rose-50/80 border-rose-100 text-rose-800"
              : "bg-emerald-50/80 border-emerald-100 text-emerald-800"
          }`}>
            <span className="text-base leading-none shrink-0 mt-0.5">{isOver ? "⚠️" : "🛡️"}</span>
            <div className="flex-1 space-y-0.5">
              <p className="font-extrabold">
                {isOver ? (lang === "ar" ? "تحذير: تجاوز الميزانية!" : "Budget Warning: Overflow Check") : (lang === "ar" ? "تخطيط مالي آمن!" : "Sound Balance: Within Boundaries")}
              </p>
              <p className="text-[10px] font-semibold text-slate-600 leading-normal">
                {isOver ? (
                  lang === "ar" 
                    ? `تجاوزت المصاريف الكلية السقف المعين لرحلتك بقيمة تزيد بقدر ${formatPrice(overDiff)}. لسلامة الرحلة ادمج اقتراحاتنا الاقتصادية أو خفض مصاريف التسوق!`
                    : `Total projected cost exceeds your target budget ceiling by ${formatPrice(overDiff)}. We highly recommend reviewing shopping limits or opting for standard options.`
                ) : (
                  lang === "ar"
                    ? `مبارك! خطتك الحالية تسير ممتازة وتحت ميزانيتك بـ ${formatPrice(limitNum - totalBaseCost)} كاملة. هذا يترك مجالا ممتعا للحالات الطارئة.`
                    : `Awesome! Your trip agenda remains highly optimized and operates comfortable under your guidelines with ${formatPrice(limitNum - totalBaseCost)} leftover.`
                )}
              </p>
            </div>
          </div>
        )}

        {/* Projected Spending Simulator Section */}
        <div className="border-t border-slate-150 pt-4 space-y-4 bg-slate-50/20 p-4 rounded-2xl border border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-100 shrink-0">
                <Briefcase className="w-4 h-4 shrink-0" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800">
                  {lang === "ar" ? "محاكي الإنفاق اليومي المتوقع بالموقع" : "Projected Daily Out-of-Pocket Simulator"}
                </h4>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">
                  {lang === "ar" ? "توقع نفقات المعيشة الإضافية حسب أسلوب حياتك" : "Estimate daily out-of-pocket costs at destination"}
                </p>
              </div>
            </div>
            
            {/* Days count indicator */}
            <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 whitespace-nowrap">
              {lang === "ar" ? `${tripDays} أيام` : `${tripDays} Days Trip`}
            </span>
          </div>

          {/* Lifestyle Toggles */}
          <div className="grid grid-cols-3 gap-1.5 bg-slate-100/70 p-1 rounded-xl border border-slate-150/45">
            {(["budget", "standard", "luxury"] as const).map((lvl) => {
              const isSelected = selectedLifestyle === lvl;
              const labels = {
                budget: { ar: "اقتصادي", en: "Budget" },
                standard: { ar: "متوسط", en: "Standard" },
                luxury: { ar: "فاخر", en: "Luxury" }
              };
              const colors = {
                budget: "bg-emerald-650 text-white shadow-3xs border-emerald-500 font-extrabold",
                standard: "bg-indigo-600 text-white shadow-3xs border-indigo-500 font-extrabold",
                luxury: "bg-rose-650 text-white shadow-3xs border-rose-500 font-extrabold"
              };

              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedLifestyle(lvl)}
                  className={`py-1.5 px-2 text-[10.5px] rounded-lg transition-all border cursor-pointer text-center select-none ${
                    isSelected 
                      ? `${colors[lvl]}` 
                      : "bg-transparent text-slate-650 border-transparent hover:bg-white/40 font-bold"
                  }`}
                >
                  {lang === "ar" ? labels[lvl].ar : labels[lvl].en}
                </button>
              );
            })}
          </div>

          {/* Rate Itemized Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="bg-white p-2.5 rounded-xl border border-slate-150 flex flex-col justify-between space-y-1">
              <span className="text-[9px] text-slate-450 font-black uppercase flex items-center gap-1">
                <span>🍽️</span> {lang === "ar" ? "الوجبات و المشروبات اليومية" : "Est. Daily Food & Drink"}
              </span>
              <strong className="text-[11.5px] font-black text-slate-800 font-mono">
                {formatPrice(simulatedSpending.food)}
              </strong>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-150 flex flex-col justify-between space-y-1">
              <span className="text-[9px] text-slate-450 font-black uppercase flex items-center gap-1">
                <span>🚗</span> {lang === "ar" ? "المواصلات والوقود" : "Est. Daily Travel/Transit"}
              </span>
              <strong className="text-[11.5px] font-black text-slate-800 font-mono">
                {formatPrice(simulatedSpending.transport)}
              </strong>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-150 flex flex-col justify-between space-y-1">
              <span className="text-[9px] text-slate-450 font-black uppercase flex items-center gap-1">
                <span>🎫</span> {lang === "ar" ? "التذاكر والهدايا الطارئة" : "Est. Daily Extras/Ticketing"}
              </span>
              <strong className="text-[11.5px] font-black text-slate-800 font-mono">
                {formatPrice(simulatedSpending.activities)}
              </strong>
            </div>
          </div>

          {/* Dynamic calculated cost totals widget */}
          <div className="bg-gradient-to-r from-slate-50 to-indigo-50/40 border border-slate-150/50 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold text-slate-550 leading-none block">
                {lang === "ar" ? "إجمالي الإنفاق الإضافي التقديري بالموقع:" : "Total Estimated Simulated Spending:"}
              </span>
              <p className="text-[9.5px] text-slate-400 font-bold leading-tight">
                {lang === "ar" 
                  ? `بمعدل إنفاق يومي قدره ${formatPrice(simulatedSpending.dailyTotal)} خلال فترة الرحلة` 
                  : `Calculated at ${formatPrice(simulatedSpending.dailyTotal)} per day, for ${tripDays} days.`}
              </p>
            </div>

            <div className="flex items-center gap-2 bg-white border border-indigo-100 px-3 py-1.5 rounded-lg shrink-0 text-right">
              <span className="text-[9px] text-slate-400 font-black uppercase block leading-none">{lang === "ar" ? "الإنفاق الكلي:" : "LIFESTYLE TOTAL:"}</span>
              <strong className="text-xs font-black text-indigo-750 font-mono leading-none">
                {formatPrice(simulatedSpending.tripTotal)}
              </strong>
            </div>
          </div>

          {/* Historical Seasonal Benchmark Chart for Selected Lifestyle */}
          <div className="border-t border-slate-150 pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-[11px] font-black text-slate-800">
                  {lang === "ar" ? "منحنى الإنفاق الموسمي التاريخي ومعيار المقارنة" : "Monthly Benchmark Costs & Historical Seasonal Trend"}
                </h5>
                <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">
                  {lang === "ar" ? "مقارنة خطتك بالأعراف التاريخية للأشهر الـ12 (معدل 30 يوماً)" : "Benchmark your custom 30-day rate against monthly locations trends"}
                </p>
              </div>
            </div>

            {/* SVG Interactive Chart */}
            <div className="p-3 bg-white border border-slate-150 rounded-xl relative overflow-hidden select-none">
              <svg viewBox="0 0 540 180" className="w-full h-auto overflow-visible">
                {/* Horizontal reference grid lines representing 25%, 50%, 75%, 100% of maxChartYVal */}
                {[0.25, 0.5, 0.75, 1.0].map((ratio, gridIdx) => {
                  const gridVal = maxChartYVal * ratio;
                  const yPos = 145 - (gridVal / maxChartYVal) * 125;
                  return (
                    <g key={gridIdx} className="opacity-40">
                      <line 
                        x1="52" 
                        y1={yPos} 
                        x2="525" 
                        y2={yPos} 
                        stroke="#e2e8f0" 
                        strokeWidth="1" 
                        strokeDasharray="2 2"
                      />
                      <text 
                        x="46" 
                        y={yPos + 3} 
                        fill="#94a3b8" 
                        fontSize="7" 
                        fontWeight="bold" 
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        {formatPrice(gridVal)}
                      </text>
                    </g>
                  );
                })}

                {/* Left vertical axis boundary */}
                <line x1="52" y1="20" x2="52" y2="145" stroke="#cbd5e1" strokeWidth="1" />

                {/* 12 Bars for Jan-Dec */}
                {monthsSeasonalData.map((m, mIdx) => {
                  const colWidth = 36;
                  const spacing = 39;
                  const barWidth = 18;
                  const xPos = 55 + (mIdx * spacing) + 8;
                  const barHeight = (m.value / maxChartYVal) * 125;
                  const yPos = 145 - barHeight;

                  const isHovered = hoveredBarIndex === mIdx;

                  // Dynamic color matching the lifestyle
                  let barFill = "fill-indigo-500/80 hover:fill-indigo-600";
                  let barStroke = "stroke-indigo-150";
                  if (selectedLifestyle === "budget") {
                    barFill = "fill-emerald-500/80 hover:fill-emerald-600";
                    barStroke = "stroke-emerald-150";
                  } else if (selectedLifestyle === "luxury") {
                    barFill = "fill-rose-500/80 hover:fill-rose-600";
                    barStroke = "stroke-rose-150";
                  }

                  if (isHovered) {
                    if (selectedLifestyle === "budget") barFill = "fill-emerald-650";
                    else if (selectedLifestyle === "luxury") barFill = "fill-rose-650";
                    else barFill = "fill-indigo-700";
                  }

                  return (
                    <g 
                      key={mIdx}
                      onMouseEnter={() => setHoveredBarIndex(mIdx)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                      className="cursor-pointer transition-all duration-200"
                    >
                      {/* Transparent wider target zone for easier hover on touch/desktop */}
                      <rect
                        x={xPos - 8}
                        y="15"
                        width={colWidth}
                        height="132"
                        fill="transparent"
                      />

                      {/* Actual SVG bar with subtle rounded corners */}
                      <rect
                        x={xPos}
                        y={yPos}
                        width={barWidth}
                        height={Math.max(2, barHeight)}
                        rx="3"
                        className={`${barFill} ${barStroke} transition-all duration-250`}
                      />

                      {/* X Axis Labelling */}
                      <text
                        x={xPos + (barWidth / 2)}
                        y="158"
                        textAnchor="middle"
                        fill={isHovered ? "#334155" : "#64748b"}
                        fontSize="8.5"
                        fontWeight={isHovered ? "900" : "700"}
                      >
                        {lang === "ar" ? m.nameAr : m.nameEn}
                      </text>
                    </g>
                  );
                })}

                {/* Dotted horizontal line representing User's current plan's monthly equivalent cost */}
                {userMonthlyEquivalent > 0 && (
                  <g className="transition-all duration-300">
                    {/* Make sure line coordinates remain boundary safe */}
                    {(() => {
                      const userYPos = 145 - (Math.min(maxChartYVal, userMonthlyEquivalent) / maxChartYVal) * 125;
                      return (
                        <>
                          <line
                            x1="52"
                            y1={userYPos}
                            x2="525"
                            y2={userYPos}
                            stroke="#f59e0b"
                            strokeWidth="1.5"
                            strokeDasharray="4 3"
                          />
                          {/* Dotted line tag / marker */}
                          <circle cx="525" cy={userYPos} r="2.5" fill="#f59e0b" />
                          <text
                            x="520"
                            y={userYPos - 5}
                            fill="#d97706"
                            fontSize="7.5"
                            fontWeight="900"
                            textAnchor="end"
                          >
                            {lang === "ar" ? "معادل ميزانيتك المقترحة 💡" : "Your Plan Equiv 💡"}
                          </text>
                        </>
                      );
                    })()}
                  </g>
                )}
              </svg>
            </div>

            {/* Selected Month Interactive Details Card & Local Tip */}
            <div className="bg-slate-50 border border-slate-150/50 rounded-xl p-3 min-h-[58px] transition-all flex flex-col justify-center">
              {hoveredBarIndex !== null ? (
                (() => {
                  const m = monthsSeasonalData[hoveredBarIndex];
                  const diffPct = Math.round((Math.abs(userMonthlyEquivalent - m.value) / (m.value || 1)) * 100);
                  const isSmarterThanBenchmark = userMonthlyEquivalent < m.value;
                  const seasonTagEn = m.mult >= 1.20 ? "Peak Season 🔥" : m.mult < 0.95 ? "Off-Peak Season ❄️" : "Shoulder Season 🍂";
                  const seasonTagAr = m.mult >= 1.20 ? "ذروة الموسم الساحق 🔥" : m.mult < 0.95 ? "خارج الذروة (موسم هادئ) ❄️" : "موسم معتدل متوازن 🍂";

                  return (
                    <div className="space-y-1 text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                          <span className="text-sm">🗓️</span>
                          <span>{lang === "ar" ? m.nameAr : m.nameEn}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                            m.mult >= 1.20 ? "bg-red-50 text-red-700 border border-red-100" :
                            m.mult < 0.95 ? "bg-sky-50 text-sky-700 border border-sky-100" :
                            "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}>
                            {lang === "ar" ? seasonTagAr : seasonTagEn}
                          </span>
                        </div>
                        <div className="text-[10.5px] font-semibold text-slate-600">
                          {lang === "ar" ? "الإنفاق التاريخي المعتاد:" : "Standard Monthly Benchmark:"}{" "}
                          <strong className="text-slate-800 font-extrabold font-mono">{formatPrice(m.value)}</strong>
                        </div>
                      </div>

                      {/* Benchmark comparisons */}
                      <p className="text-[10px] leading-relaxed text-slate-550 font-semibold font-sans pt-0.5 border-t border-slate-100 mt-1 pb-0.5">
                        {isSmarterThanBenchmark ? (
                          lang === "ar" ? (
                            <span>
                              🎉 <strong>رائع!</strong> ميزانية رحلتك الحالية توفر حوالي <span className="text-emerald-700 font-extrabold">{diffPct}%</span> مقارنة بمتوسط تكاليف السفر المعتادة في شهر <strong>{m.nameAr}</strong> لأسلوب {selectedLifestyle === "budget" ? "اقتصادي" : selectedLifestyle === "luxury" ? "الفاخر" : "المتوسط"}.
                            </span>
                          ) : (
                            <span>
                              🎉 <strong>Excellent Value!</strong> Your travel plan equivalent is <span className="text-emerald-700 font-extrabold">{diffPct}% cheaper</span> than typical monthly bench rates in <strong>{m.nameEn}</strong> for {selectedLifestyle} level comfort.
                            </span>
                          )
                        ) : (
                          lang === "ar" ? (
                            <span>
                              💎 <strong>خيارات معززة:</strong> ميزانيتك تزيد بـ <span className="text-rose-650 font-extrabold">{diffPct}%</span> عن المعدل الأساسي البسيط لشهر <strong>{m.nameAr}</strong>. يعود هذا لوجود إضافات طيران ممتازة وفنادق فاخرة تدعم الراحة.
                            </span>
                          ) : (
                            <span>
                              💎 <strong>Premium Upgrades:</strong> Your current plan is <span className="text-rose-650 font-extrabold">{diffPct}% higher</span> than standard level <strong>{m.nameEn}</strong> spending baseline, mirroring your extra flight comforts and selected high-end hotel stays.
                            </span>
                          )
                        )}
                      </p>
                    </div>
                  );
                })()
              ) : (
                <div className="flex items-center gap-2 justify-center text-center text-[10.5px] font-bold text-slate-500 py-1">
                  <span className="animate-pulse">💡</span>
                  <span>
                    {lang === "ar" 
                      ? "مرر مؤشر الماوس أو المس أعمدة الأشهر لمقارنة دقيقة لرحلتك مع معايير الموسم المعتادة وتوصياتها" 
                      : "Hover or tap on any monthly bar above to analyze seasonal cost trends against your custom planned rate."}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Custom logged expenses adding section */}
        <div className="border-t border-slate-50 pt-4 space-y-3">
          <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
            <PlusCircle className="w-3.5 h-3.5 text-indigo-500" />
            <span>{lang === "ar" ? "تسجيل مصاريف إضافية خاصة بك" : "Log Additional Personal Expenses"}</span>
          </h4>

          <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
            <div className="sm:col-span-5">
              <label className="text-[9px] font-extrabold text-slate-400 block uppercase mb-1">
                {lang === "ar" ? "بيان المصروف (مثال: وجبة عشاء، تذاكر):" : "Expense Details (e.g. Dinner, Gift):"}
              </label>
              <input
                type="text"
                required
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder={lang === "ar" ? "وصف المصروف..." : "Short description..."}
                className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-xs font-bold px-3 py-1.5 rounded-lg text-slate-800"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="text-[9px] font-extrabold text-slate-400 block uppercase mb-1">
                {lang === "ar" ? "القيمة المالية:" : "Amount / Price:"}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={newAmount}
                  onChange={(e) => {
                    const priceVal = e.target.value.replace(/[^\d.]/g, "");
                    setNewAmount(priceVal);
                  }}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-xs font-bold font-mono px-3 py-1.5 rounded-lg text-slate-800"
                />
                <span className="absolute right-3.5 top-1.5 text-[9px] font-black text-slate-400 pointer-events-none uppercase">
                  {isDomestic ? (lang === "ar" ? "دج" : "DZD") : "$"}
                </span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[9px] font-extrabold text-slate-400 block uppercase mb-1">
                {lang === "ar" ? "التصنيف:" : "Type / Category:"}
              </label>
              <select
                value={newCat}
                onChange={(e) => setNewCat(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-xs font-bold px-2 py-1.5 rounded-lg text-slate-800 pointer-events-auto"
              >
                <option value="dining">{lang === "ar" ? "🍽️ طعام" : "🍽️ Dining"}</option>
                <option value="shopping">{lang === "ar" ? "🛍️ تسوق" : "🛍️ Shopping"}</option>
                <option value="emergency">{lang === "ar" ? "🆘 طوارئ" : "🆘 Emergency"}</option>
                <option value="other">{lang === "ar" ? "📦 أخرى" : "📦 Other"}</option>
              </select>
            </div>

            <button
              type="submit"
              className="sm:col-span-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-1.5 px-3 flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-3xs"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>{lang === "ar" ? "إضافة" : "Add"}</span>
            </button>
          </form>

          {/* List of custom expenses */}
          {customExpenses.length > 0 ? (
            <div className="pt-2">
              <label className="text-[9px] font-black text-slate-400 block uppercase tracking-wider mb-1 px-1">
                {lang === "ar" ? "المصاريف المخصصة المسجلة للرحلة:" : "Logged Personal Travel Expenses:"}
              </label>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {customExpenses.map((expense) => (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      key={expense.id}
                      className="flex items-center justify-between border border-dashed border-slate-200 p-2 rounded-lg bg-slate-50/30 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {expense.category === "dining" ? "🍽️" : expense.category === "shopping" ? "🛍️" : expense.category === "emergency" ? "🆘" : "📦"}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-800 leading-none">{expense.description}</p>
                          <p className="text-[9px] font-semibold text-slate-400 mt-0.5">{getCategoryLabel(expense.category)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-black text-slate-800 font-mono">{formatPrice(expense.amount)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveExpense(expense.id)}
                          className="p-1 hover:bg-slate-100 hover:text-rose-600 text-slate-400 rounded-md transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-slate-400 font-medium italic text-center py-2">
              {lang === "ar" ? "لم تقم بتسجيل أي مصاريف إضافية خاصة بك بعد" : "No personal expenses logged yet. Add some above to visualizer."}
            </p>
          )}

          {/* Smart Activity Classification Logs */}
          <div className="border-t border-slate-150 pt-3 mt-4">
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                {lang === "ar" ? "🤖 سجل تصنيف الأنشطة التلقائي:" : "🤖 Auto-Categorized Itinerary Activities:"}
              </span>
              <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {lang === "ar" ? "مصفى بالكلمات الدلالية" : "Keyword Classified"}
              </span>
            </div>
            
            {parsedActivitiesBreakdown.items.length > 0 ? (
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                {parsedActivitiesBreakdown.items.map((act, idx) => {
                  const getCatBadge = (c: string) => {
                    switch (c) {
                      case "transport": return { icon: "✈️", label: lang === "ar" ? "مواصلات" : "Transport", class: "bg-blue-50 text-blue-700 border-blue-100" };
                      case "food": return { icon: "🍽️", label: lang === "ar" ? "طعام" : "Dining", class: "bg-amber-50 text-amber-700 border-amber-100" };
                      case "shopping": return { icon: "🛍️", label: lang === "ar" ? "تسوق" : "Shopping", class: "bg-pink-50 text-pink-700 border-pink-100" };
                      default: return { icon: "🎯", label: lang === "ar" ? "أنشطة" : "Attraction", class: "bg-indigo-50 text-indigo-700 border-indigo-100" };
                    }
                  };
                  const badge = getCatBadge(act.category);
                  return (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-205/50 text-[11px] hover:border-indigo-150 hover:bg-slate-50/50 transition-all font-medium">
                      <div className="flex items-center gap-2 truncate max-w-[80%]">
                        <span className={`text-[10px] font-black border px-1.5 py-0.5 rounded-lg shrink-0 flex items-center gap-1 leading-none ${badge.class}`}>
                          <span>{badge.icon}</span>
                          <span className="hidden sm:inline-block font-sans">{badge.label}</span>
                        </span>
                        <div className="truncate text-left shrink-0 max-w-[65%]">
                          <p className="font-bold text-slate-800 truncate leading-none mb-0.5">{act.title}</p>
                          <p className="text-[9.5px] text-slate-400 font-semibold truncate leading-none">{act.description}</p>
                        </div>
                      </div>
                      <span className="font-extrabold text-slate-700 font-mono text-[10.5px]">
                        {act.cost > 0 ? formatPrice(act.cost) : (lang === "ar" ? "مجاني" : "Free")}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 font-medium italic text-center py-2">
                {lang === "ar" ? "لا توجد أنشطة بالبرنامج لتصنيفها بعد" : "No program activities found to classify yet."}
              </p>
            )}
          </div>

          {/* New Summary Footer: Smart Savings Potential & Luxury Comparison */}
          <div className="border-t border-slate-150 pt-4 mt-5 space-y-3 bg-gradient-to-br from-emerald-50/40 via-white to-slate-50/20 p-4 rounded-2xl border border-emerald-100/35">
            <div className="flex items-center gap-2 pb-1">
              <PiggyBank className="w-5 h-5 text-emerald-600 animate-bounce" />
              <div>
                <h4 className="text-[11.5px] font-black text-slate-800">
                  {lang === "ar" ? "تحليل ومقارنة سقف التوفير الذكي" : "Budget Optimization & Savings Analysis"}
                </h4>
                <p className="text-[9px] uppercase font-black text-emerald-700 tracking-wider">
                  {lang === "ar" ? "مقارنة الخطة الاقتصادية مقابل التقديرات الفاخرة" : "Comparing Optimized Standard vs. High-End Premium equivalents"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Cost comparison progress/meters */}
              <div className="space-y-2">
                {/* Regular Plan Total */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10.5px] font-bold">
                    <span className="text-slate-550">{lang === "ar" ? "خطة رحلتك الحالية المبسطة:" : "Your Current Optimized Plan:"}</span>
                    <strong className="text-indigo-600 font-extrabold font-mono">{formatPrice(savingsSummary.actualTotalSum)}</strong>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (savingsSummary.actualTotalSum / (savingsSummary.luxuryTotalSum || 1)) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Luxury Equivalent Estimate */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10.5px] font-bold">
                    <span className="text-slate-500">{lang === "ar" ? "التقدير الفاخر المماثل (5 نجوم):" : "High-End Luxury Estimate (5★):"}</span>
                    <strong className="text-rose-600 font-extrabold font-mono">{formatPrice(savingsSummary.luxuryTotalSum)}</strong>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-rose-550 h-2 rounded-full w-full" />
                  </div>
                </div>
              </div>

              {/* Glowing savings tag block */}
              <div className="bg-emerald-50 border border-emerald-100/80 rounded-xl p-3 flex flex-col justify-center items-center text-center space-y-1 shadow-3xs">
                <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest leading-none">
                  {lang === "ar" ? "💰 ميزة التوفير الكامنة" : "💰 SAVINGS POTENTIAL"}
                </span>
                <span className="text-lg font-black text-emerald-700 font-mono tracking-tight leading-none pt-1">
                  {formatPrice(savingsSummary.savingsPotential)}
                </span>
                <span className="text-[9.5px] text-emerald-800 font-bold bg-emerald-100/70 px-2 py-0.5 rounded-full mt-1.5 inline-block">
                  {lang === "ar" 
                    ? `توفير بنسبة ${Math.round((savingsSummary.savingsPotential / (savingsSummary.luxuryTotalSum || 1)) * 105 || 0)}% كاملة!` 
                    : `Save around ${Math.round((savingsSummary.savingsPotential / (savingsSummary.luxuryTotalSum || 1)) * 105 || 0)}% on total budget!`}
                </span>
              </div>
            </div>

            {/* Explanatory localized descriptions */}
            <p className="text-[10px] text-slate-550 leading-relaxed font-semibold italic border-t border-slate-100/60 pt-2 bg-transparent text-left">
              {lang === "ar" ? (
                <>
                  📌 <strong>بيان الترشيد:</strong> بالمضي قدماً في خطة الأنشطة والإقامات الاقتصادية المحددة في هذا الدليل، فإنك توفر ما يقرب من <span className="text-emerald-700 font-black">{formatPrice(savingsSummary.savingsPotential)}</span> مقارنة بالمسار السياحي الكلاسيكي الفاخر! يشمل هذا خيارات النزهات الشعبية المجانية، والمطاعم الأصيلة، والتنقلات الجماعية المرشدة.
                </>
              ) : (
                <>
                  📌 <strong>Optimization Note:</strong> By following the curated, budget-friendly activities and loquacious local options outlined above, your savings potential of <span className="text-emerald-700 font-black">{formatPrice(savingsSummary.savingsPotential)}</span> preserves your funds compared to luxury counterparts! Standard local transit, heritage strolls, and community market dining save you big.
                </>
              )}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

// Minimal placeholder icons to keep it light
function PieIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}
