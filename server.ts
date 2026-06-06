import express from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// حقن إعدادات CORS الشاملة والأمان لـ Appsmith والمتصفح
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  credentials: true
}));

app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

/**
 * --- المسار الأول: الدردشة والمساعد التفاعلي لوكالة فسحة ---
 */
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, lang } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const lastUserMessage = messages[messages.length - 1]?.text || "";
    const systemInstruction = lang === "ar"
      ? "أنت المرشد السياحي والمساعد التفاعلي لوكالة 'فسحة DZ' في الجزائر. أجب بلباقة واحترافية وبإيجاز شديد دون إطالة."
      : "You are the AI Travel Assistant for Fosha DZ. Be professional and concise.";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: lastUserMessage,
      config: { systemInstruction }
    });

    return res.json({ text: response.text || "مرحباً بك! كيف يمكنني مساعدتك؟" });
  } catch (error: any) {
    console.error("Chat Error:", error);
    return res.status(500).json({ text: "عذراً، واجه الخادم مشكلة مؤقتة." });
  }
});

app.post("/chat", (req, res) => app._router.handle(req, res));


/**
 * --- المسار الثاني: توليد البرامج السياحية الكاملة للهيكل (مضغوطة لمنع أخطاء الحجم) ---
 */
app.post("/api/generate-itinerary", async (req, res) => {
  try {
    const { destination, daysCount, budget, travelerType, tripPurpose, lodgingType } = req.body;

    const targetDest = destination || "غرداية";
    const duration = daysCount ? Math.min(Number(daysCount), 3) : 3;

    console.log(`[Itinerary] Generating full-compatibility structural plan for ${targetDest}...`);

    const systemInstruction = "أنت خبير سياحي لوكالة فسحة DZ. يجب إرجاع كائن JSON مضغوط ومكتمل الحقول تماماً لتلبية متطلبات واجهة التطبيق، دون أي نصوص خارجية مضافة.";

    // برومبت صارم يجبر النموذج على ملء كل الحقول المتوقعة في الواجهة ولكن بنصوص قصيرة جداً
    const prompt = `قم بصياغة برنامج سياحي تفصيلي وموجز للغاية لزيارة ${targetDest} لمدة ${duration} أيام. الميزانية: ${budget || "اقتصادية"}. نمط الرحلة: ${travelerType || "عائلي"}.
    المخرجات يجب أن تكون حصراً كائن JSON يحتوي على كافة الحقول التالية بدقة (املأ المصفوفات بعنصر واحد أو اثنين فقط للاختصار وحماية الحجم):
    {
      "destinationName": "${targetDest}",
      "country": "الجزائر",
      "tripDurationDays": ${duration},
      "targetBudgetLevel": "${budget || "اقتصادية"}",
      "travelerType": "${travelerType || "عائلي"}",
      "languageCode": "ar",
      "climateAdvisoryAlert": "الأجواء مشمسة ومناسبة تماماً للجولات والاستكشاف.",
      "localEventsAndExpos": [],
      "days": [
        {
          "dayNumber": 1,
          "theme": "استكشاف المعالم العتيقة والتراثية"،
          "activities": [
            {
              "title": "جولة في القصر العتيق والأسواق التراثية",
              "description": "زيارة الهندسة المعمارية الفريدة للمنطقة وتذوق الأطباق المحلية.",
              "timeOfDay": "Morning",
              "durationHours": 3,
              "estimatedCostUSD": 5,
              "locationName": "${targetDest}"
            }
          ]
        }
      ],
      "suggestedHotels": [{"name": "نُزل ودار ضيافة الأصالة التراثي", "stars": 3, "pricePerNightUSD": 35, "ratingValue": 4.7, "reasonForRecommendation": "موقع هادئ وقريب من الخدمات.", "phoneNumber": "+213 550 11 22 33", "address": "وسط المدينة"}],
      "customPackingList": [{"category": "الأمتعة الأساسية", "items": ["أحذية مريحة", "نظارات شمسية"]}],
      "localTravelTips": ["يفضل حمل سيولة نقدية بالدينار الجزائري"],
      "isDomesticTrip": true,
      "localCurrencySymbol": "دج",
      "emergencyNumbers": [{"label": "الحماية المدنية", "phone": "14"}, {"label": "الشرطة", "phone": "17"}],
      "bookingRequirements": ["بطاقة التعريف الوطنية سارية المفعول"],
      "localTraditionalCuisine": [{"name": "الكسكس التقليدي الأصيل", "description": "وجبة تراثية وطنية مطهية بالبخار مع الخضار الطازجة ولحم الغنم."}],
      "popularMarketsAndSouks": [{"name": "سوق الحرف القديم", "type": "سوق تراثي", "description": "مكان مثالي لشراء الزرابي والمنسوجات اليدوية الفريدة."}],
      "googleMapsSim": {
        "accommodationName": "نُزل الأصالة",
        "accommodationQuery": "فندق، ${targetDest}",
        "primarySpotName": "المعالم التاريخية",
        "primarySpotQuery": "معالم أثرية، ${targetDest}",
        "distanceKMText": "2.0 كم",
        "recommendedTaxiApp": "سيارات الأجرة المحلية",
        "taxiFareEstimateLocal": "200 دج",
        "transitAdviceStep": "يمكن الانطلاق مباشرة للوصول للوجهة في دقائق معدودة."
      },
      "tripPurpose": "${tripPurpose || "tourism"}",
      "missionDestinationsText": "",
      "lodgingType": "${lodgingType || "hotel"}",
      "administrativeMissionDetails": {"missionOverview": "مسار مرن ومنظم لزيارة المواقع.", "destinationsList": []},
      "nearbyPlacesAndUtilities": {
        "restaurantsAndCafes": [{"name": "مطعم الخيرات الشعبي", "type": "مطعم مأكولات شعبية", "description": "يقدم وجبات تقليدية طازجة بنكهات محلية ساحرة يومياً.", "googleMapsQuery": "مطعم شعبي"}],
        "mosquesAndRestrooms": [{"name": "المسجد الكبير الجامع", "prayerTimesTransitAdvice": "يضم مرافق وضوء ودورات مياه عامة نظيفة.", "hasPublicRestroom": true, "googleMapsQuery": "المسجد الكبير"}],
        "medicalServices": [{"name": "صيدلية الهلال المركزية", "type": "صيدلية (24 ساعة)", "description": "توفر كافة المستلزمات الطبية والأدوية الطارئة على مدار اليوم.", "googleMapsQuery": "صيدلية", "phoneNumber": "+213 29 00 11 22"}],
        "nearbyAlternativeLodgings": [],
        "businessAndPrintingServices": []
      },
      "estimatedTransitSchedules": [{"transportMethod": "حافلات خطوط النقل البري الكبرى", "departureDayTime": "يومياً الساعة 07:00 صباحاً", "stationName": "محطة المسافرين البرية المركزية", "frequencyAndPrice": "رحلات منتظمة بسعر ثابت تقدر بـ 700 دج", "contactPhone": "+213 21 00 11 22"}]
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
    console.error("Itinerary Error:", error.message || error);
    return res.status(500).json({ error: "Failed to generate compatible structured itinerary plan" });
  }
});

app.post("/generate-itinerary", (req, res) => app._router.handle(req, res));

app.get("/", (req, res) => {
  res.send("Fosha DZ Production Server is Live, Lean, and Fully Compatible!");
});

if (process.env.NODE_ENV === "production") {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => { res.sendFile(path.join(distPath, "index.html")); });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Production server fully compatible and running on port ${PORT}`);
});