import express from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

// تفعيل الأمان الشامل لمتصفح كروم والهاتف و Appsmith
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());

const PORT = process.env.PORT || 3000;

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("CRITICAL: GEMINI_API_KEY is missing!");
}
const ai = new GoogleGenAI({ apiKey });

// --- 1. مسار معالجة الدردشة (المساعد الذكي) ---
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, lang } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const lastUserMessage = messages[messages.length - 1]?.text || "";
    const systemInstruction = lang === "ar"
      ? "أنت مرشد السفر والذكاء الاصطناعي التفاعلي لوكالة فسحة DZ. ساعد المستخدمين بلباقة وبمعلومات سياحية دقيقة باللغة العربية الفصحى وبإيجاز دون إطالة مفرطة."
      : "You are the expert AI Travel Concierge for Fosha DZ agency. Provide helpful travel insights concisely.";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: lastUserMessage,
      config: { systemInstruction }
    });

    return res.json({ text: response.text || "مرحباً بك! كيف يمكنني مساعدتك اليوم؟" });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return res.json({ text: "المعذرة، واجهت مشكلة مؤقتة في الاتصال بالخادم. يرجى المحاولة مرة أخرى." });
  }
});

// دعم المسار البديل بدون بادئة
app.post("/chat", (req, res) => app._router.handle(req, res));


// --- 2. مسار توليد البرامج السياحية (نسخة مضغوطة ومحسنة لـ Appsmith) ---
app.post("/api/generate-itinerary", async (req, res) => {
  try {
    const { destination, daysCount, budget, travelerType, tripPurpose, lodgingType } = req.body;

    const targetDest = destination || "غرداية";
    const duration = daysCount ? Math.min(Number(daysCount), 5) : 3; // تحديد الحد الأقصى بـ 5 أيام لمنع تضخم الحجم

    console.log(`[Itinerary API] Generating optimized plan for ${targetDest} (${duration} days)...`);

    const systemInstruction = "أنت مستشار لوجستي لوكالة فسحة DZ. يجب أن تعيد رد JSON مضغوط ومباشر ومطابق للهيكل تماماً بدون أي نصوص جانبية أو حقول ضخمة مكررة لتجنب تجاوز حد حجم البيانات.";

    // برومبت محكم ومختصر يركز على جودة الأنشطة دون حشو نصوص يرفع الحجم عن 1MB
    const prompt = `قم بصياغة برنامج سياحي تفصيلي وموجز إلى ${targetDest} لمدة ${duration} أيام. الميزانية: ${budget || "اقتصادية"}. نمط الرحلة: ${travelerType || "عائلي"}.
    يجب أن تكون المخرجات حصراً كائن JSON نظيف ومطابق تماماً لهذا الهيكل (لا تضف حقولاً خارجية ولا تكرر الأنشطة بشكل يضخم الحجم):
    {
      "destinationName": "${targetDest}",
      "country": "الجزائر",
      "tripDurationDays": ${duration},
      "targetBudgetLevel": "${budget || "اقتصادية"}",
      "travelerType": "${travelerType || "عائلي"}",
      "languageCode": "ar",
      "climateAdvisoryAlert": " الأجواء مناسبة تماماً للجولات الميدانية والاستكشاف.",
      "days": [
        {
          "dayNumber": 1,
          "theme": "اكتشاف المعالم الأثرية والتاريخية",
          "activities": [
            {
              "title": "جولة استكشافية في قصر المدينة العتيق والأسواق",
              "description": "التعرف على الطراز المعماري التراثي وشراء المنتجات التقليدية اليدوية.",
              "timeOfDay": "Morning",
              "durationHours": 3,
              "estimatedCostUSD": 5,
              "locationName": "${targetDest}"
            }
          ]
        }
      ],
      "suggestedHotels": [{"name": "نُزل ودار ضيافة الأصالة التقليدي", "stars": 3, "pricePerNightUSD": 30, "ratingValue": 4.6, "reasonForRecommendation": "موقع حيوي مريح وقريب من الخدمات.", "phoneNumber": "+213 550 11 22 33", "address": "وسط المدينة"}],
      "customPackingList": [{"category": "الأمتعة", "items": ["أحذية مريحة", "نظارات شمسية"]}],
      "localTravelTips": ["يفضل حمل سيولة نقدية بالدينار الجزائري"],
      "isDomesticTrip": true,
      "localCurrencySymbol": "دج",
      "emergencyNumbers": [{"label": "الحماية المدنية", "phone": "14"}, {"label": "الشرطة", "phone": "17"}],
      "bookingRequirements": ["بطاقة التعريف الوطنية سارية المفعول"],
      "localTraditionalCuisine": [{"name": "الكسكس التقليدي الجزائري", "description": "أعرق الأطباق الوطنية المطهية بالبخار مع الخضار الطازجة لحم الغنم."}],
      "popularMarketsAndSouks": [{"name": "سوق الصناعات التراثية القديم", "type": "سوق تراثي", "description": "أفضل مكان لشراء المنسوجات والزرابي التذكارية الفريدة."}],
      "googleMapsSim": {
        "accommodationName": "نُزل الأصالة",
        "accommodationQuery": "فندق، ${targetDest}",
        "primarySpotName": "المعالم الأثرية التاريخية",
        "primarySpotQuery": "قصر عتيق، ${targetDest}",
        "distanceKMText": "2.5 كم",
        "recommendedTaxiApp": "سيارات الأجرة المحلية",
        "taxiFareEstimateLocal": "250 دج",
        "transitAdviceStep": "يمكنك استقلال حافلة النقل الحضري لتصل في غضون دقائق قليلة."
      },
      "tripPurpose": "${tripPurpose || "tourism"}",
      "missionDestinationsText": "",
      "lodgingType": "${lodgingType || "hotel"}",
      "administrativeMissionDetails": {"missionOverview": "مسار مرن ومنظم لزيارة المواقع.", "destinationsList": []},
      "nearbyPlacesAndUtilities": {
        "restaurantsAndCafes": [{"name": "مطعم الخيرات الشعبي", "type": "مطعم مأكولات شعبية", "description": "يقدم وجبات تقليدية طازجة بنكهات محلية ساحرة يومياً.", "googleMapsQuery": "مطعم شعبي"}],
        "mosquesAndRestrooms": [{"name": "المسجد الكبير الجامع العتيق", "prayerTimesTransitAdvice": "يضم مرافق وضوء ودورات مياه عامة نظيفة.", "hasPublicRestroom": true, "googleMapsQuery": "المسجد الكبير"}],
        "medicalServices": [{"name": "صيدلية الهلال المركزية", "type": "صيدلية (24 ساعة)", "description": "توفر كافة المستلزمات الطبية والأدوية الطارئة على مدار اليوم.", "googleMapsQuery": "صيدلية", "phoneNumber": "+213 29 00 11 22"}],
        "nearbyAlternativeLodgings": [],
        "businessAndPrintingServices": []
      },
      "estimatedTransitSchedules": [{"transportMethod": "حافلات خطوط النقل البري الكبرى", "departureDayTime": "يومياً الساعة 07:00 صباحاً", "stationName": "محطة المسافرين البرية المركزية", "frequencyAndPrice": "رحلات منتظمة بسعر ثابت يقدر بـ 700 دج", "contactPhone": "+213 21 00 11 22"}]
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI model");

    // إرسال الرد مباشرة بعد التأكد من أنه JSON سليم ومضغوط
    return res.json(JSON.parse(jsonText));

  } catch (error: any) {
    console.error("Itinerary API Failure:", error);
    return res.status(500).json({ error: "Failed to generate structured travel plan within size limits" });
  }
});

// دعم المسار البديل بدون بادئة لضمان توافق الهاتف و Appsmith
app.post("/generate-itinerary", (req, res) => app._router.handle(req, res));

app.get("/", (req, res) => {
  res.send("Optimized AI Travel Server for Fosha DZ is running successfully!");
});

if (process.env.NODE_ENV === "production") {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => { res.sendFile(path.join(distPath, "index.html")); });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Optimized Server running smoothly on port ${PORT}`);
});