import express from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

// تفعيل الأمان الشامل لمتصفح كروم والهاتف
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());

const PORT = process.env.PORT || 3000;

// تهيئة عميل الذكاء الاصطناعي بشكل سليم
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("CRITICAL: GEMINI_API_KEY is missing in environment variables!");
}
const ai = new GoogleGenAI({ apiKey });

// --- 1. مسار معالجة الدردشة (المساعد الذكي) ---
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, lang } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    // استخراج نص آخر رسالة أرسلها المستخدم بدقة
    const lastUserMessage = messages[messages.length - 1]?.text || "";
    const systemInstruction = lang === "ar"
      ? "أنت مرشد السفر والذكاء الاصطناعي التفاعلي لوكالة فسحة DZ. ساعد المستخدمين بلباقة وبمعلومات سياحية دقيقة باللغة العربية الفصحى."
      : "You are the expert AI Travel Concierge for Fosha DZ agency. Provide helpful travel insights.";

    console.log(`[Chat API] Querying Gemini for: "${lastUserMessage}"`);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: lastUserMessage,
      config: {
        systemInstruction: systemInstruction
      }
    });

    const replyText = response.text || "مرحباً بك! أنا هنا لمساعدتك في التخطيط لرحلتك.";
    return res.json({ text: replyText });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return res.json({ text: "المعذرة، واجهت مشكلة مؤقتة في الاتصال بالخادم السحابي. يرجى إعادة محاولة إرسال السؤال." });
  }
});

// دعم المسار البديل بدون بادئة
app.post("/chat", (req, res) => app._router.handle(req, res));


// --- 2. مسار توليد البرامج السياحية وجداول المسارات لـ Fosha DZ ---
app.post("/api/generate-itinerary", async (req, res) => {
  try {
    const { destination, daysCount, budget, travelerType, tripPurpose, lodgingType } = req.body;

    const targetDest = destination || "غرداية";
    const duration = daysCount || 3;

    console.log(`[Itinerary API] Creating plan for ${targetDest} for ${duration} days...`);

    const systemInstruction = "أنت مستشار لوجستي وخبير تخطيط البرامج السياحية لوكالة فسحة DZ في الجزائر. مهمتك إرجاع هيكل JSON نظيف ومكتمل الأركان ومتوافق مع واجهة التطبيق تماماً.";

    const prompt = `قم بصياغة برنامج سياحي تفصيلي ومبهر إلى ${targetDest} لمدة ${duration} أيام. الميزانية المستهدفة: ${budget || "اقتصادية"}. نمط الرحلة: ${travelerType || "عائلي"}. الغرض: ${tripPurpose || "tourism"}. الإقامة المفضلة: ${lodgingType || "hotel"}.
    يجب أن تكون المخرجات حصراً كائن JSON يحتوي على الحقول التالية بدقة (بدون لغتك الخاصة خارج الـ JSON):
    {
      "destinationName": "${targetDest}",
      "country": "الجزائر",
      "tripDurationDays": ${duration},
      "targetBudgetLevel": "${budget || "اقتصادية"}",
      "travelerType": "${travelerType || "عائلي"}",
      "languageCode": "ar",
      "climateAdvisoryAlert": "🌦️ الأجواء مشمسة ومناسبة تماماً للجولات الميدانية والاستكشاف.",
      "localEventsAndExpos": [],
      "days": [
        {
          "dayNumber": 1,
          "theme": "اكتشاف التراث العريق والمعالم الأثرية المحيطة",
          "activities": [
            {
              "title": "جولة استكشافية وسط المدينة والأسواق القديمة",
              "description": "التعرف على الطراز المعماري التاريخي للمنطقة، المذاق الأصيل للأطباق المحلية وشراء التحف التذكارية اليدوية.",
              "timeOfDay": "Morning",
              "durationHours": 3,
              "estimatedCostUSD": 5,
              "locationName": "${targetDest} - وسط المدينة الأثرية"
            }
          ]
        }
      ],
      "suggestedHotels": [{"name": "نُزل ودار ضيافة الأصالة التقليدي", "stars": 3, "pricePerNightUSD": 30, "ratingValue": 4.6, "reasonForRecommendation": "موقع حيوي مريح وقريب من الخدمات والمواصلات الحضرية.", "phoneNumber": "+213 550 11 22 33", "address": "شارع الاستقلال الرئيسي"}],
      "customPackingList": [{"category": "الملابس والأمتعة", "items": ["أحذية مريحة للمشي", "نظارات شمسية"]}],
      "localTravelTips": ["يفضل حمل سيولة نقدية كافية بالدينار الجزائري (دج)"],
      "isDomesticTrip": true,
      "localCurrencySymbol": "دج",
      "emergencyNumbers": [{"label": "الشرطة الوطنية", "phone": "17"}, {"label": "الحماية المدنية", "phone": "14"}, {"label": "الدرك الوطني", "phone": "1055"}],
      "bookingRequirements": ["بطاقة التعريف الوطنية سارية المفعول لإتمام إجراءات الحجز"],
      "localTraditionalCuisine": [{"name": "الكسكس الجزائري التقليدي", "description": "أعرق الأطباق الوطنية المطهية بالبخار مع خضار الموسم الطازجة ولحم الغنم المحلي."}],
      "popularMarketsAndSouks": [{"name": "سوق الحرف والصناعات التقليدية القديم", "type": "سوق تراثي", "description": "أفضل مكان لشراء المنسوجات اليدوية والزرابي التذكارية الفريدة."}],
      "googleMapsSim": {
        "accommodationName": "نُزل الأصالة التقليدي",
        "accommodationQuery": "فندق، ${targetDest}",
        "primarySpotName": "المعالم الأثرية التاريخية",
        "primarySpotQuery": "قصر عتيق، ${targetDest}",
        "distanceKMText": "2.5 كم",
        "recommendedTaxiApp": "يسير (Yassir) أو خط سيارات الأجرة المحلية",
        "taxiFareEstimateLocal": "250 دج",
        "transitAdviceStep": "يمكنك استقلال حافلة النقل الحضري مباشرة من أمام بواب النُزل لتصل في غضون 7 دقائق فقط."
      },
      "tripPurpose": "${tripPurpose || "tourism"}",
      "missionDestinationsText": "",
      "lodgingType": "${lodgingType || "hotel"}",
      "administrativeMissionDetails": {"missionOverview": "مسار مرن ومنظم لزيارة المواقع وإتمام النشاطات اليومية بيسر.", "destinationsList": []},
      "nearbyPlacesAndUtilities": {
        "restaurantsAndCafes": [{"name": "مطعم الخيرات الشعبي الأصيل", "type": "مطعم مأكولات شعبية ومشاوي", "description": "يقدم وجبات تقليدية طازجة بنكهات محلية ساحرة يومياً.", "googleMapsQuery": "مطعم شعبي"}],
        "mosquesAndRestrooms": [{"name": "المسجد الكبير الجامع العتيق", "prayerTimesTransitAdvice": "يضم مرافق وضوء ودورات مياه عامة نظيفة مفتوحة للمصلين طيلة أوقات الصلوات.", "hasPublicRestroom": true, "googleMapsQuery": "المسجد الكبير"}],
        "medicalServices": [{"name": "صيدلية الهلال المركزية المناوبة", "type": "صيدلية (24 ساعة)", "description": "توفر كافة المستلزمات الطبية والأدوية الطارئة على مدار اليوم بالقرب من النُزل.", "googleMapsQuery": "صيدلية", "phoneNumber": "+213 29 00 11 22"}],
        "nearbyAlternativeLodgings": [],
        "businessAndPrintingServices": []
      },
      "estimatedTransitSchedules": [{"transportMethod": "حافلات خطوط النقل البري الكبرى المجدولة", "departureDayTime": "يومياً الساعة 06:30 صباحاً", "stationName": "محطة المسافرين البرية المركزية", "frequencyAndPrice": "رحلات منتظمة بسعر ثابت يقدر بـ 700 دج", "contactPhone": "+213 21 00 11 22"}]
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
    if (!jsonText) throw new Error("Empty response text from model");

    return res.json(JSON.parse(jsonText));

  } catch (error: any) {
    console.error("Itinerary API Failure:", error);
    return res.status(500).json({ error: "Failed to generate structured travel plan" });
  }
});

// دعم المسار البديل بدون بادئة لضمان توافق الهاتف
app.post("/generate-itinerary", (req, res) => app._router.handle(req, res));


// مسار فحص الحالة الرئيسي للمتصفح
app.get("/", (req, res) => {
  res.send("AI Travel Agency Server for Fosha DZ is Live and Ready!");
});

// تشغيل السيرفر والثبات للإنتاج
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => { res.sendFile(path.join(distPath, "index.html")); });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`AI Travel Agency Server beautifully running on port ${PORT}`);
});