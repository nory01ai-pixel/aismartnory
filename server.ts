import express from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

// 1. تحميل متغيرات البيئة
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 2. حقن إعدادات CORS الشاملة (لحل مشاكل الاتصال من Appsmith أو المتصفح نهائياً)
app.use(cors({
  origin: "*", // يتيح لجميع النطاقات الاتصال بالسيرفر
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  credentials: true
}));

// 3. معالجة البيانات القادمة بصيغة JSON
app.use(express.json());

// 4. تهيئة عميل الذكاء الاصطناعي (Gemini SDK)
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("⚠️ تحذير حرج: مفتاح GEMINI_API_KEY غير موجود في ملف البيئة!");
}
const ai = new GoogleGenAI({ apiKey });

/**
 * --- المسار الأول: الدردشة والمساعد التفاعلي لوكالة فسحة ---
 */
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, lang } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "المصفوفة 'messages' مطلوبة." });
    }

    // جلب آخر رسالة أرسلها المستخدم
    const lastUserMessage = messages[messages.length - 1]?.text || "";

    // إرشادات النظام لضبط هوية الذكاء الاصطناعي
    const systemInstruction = lang === "ar"
      ? "أنت المرشد السياحي والمساعد التفاعلي لوكالة 'فسحة DZ' في الجزائر. أجب بلباقة واحترافية وبمعلومات سياحية دقيقة ومختصرة."
      : "You are the AI Travel Assistant for Fosha DZ agency in Algeria. Be professional and concise.";

    console.log(`[Chat API] معالجة طلب: "${lastUserMessage}"`);

    // استدعاء النموذج
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: lastUserMessage,
      config: {
        systemInstruction: systemInstruction
      }
    });

    return res.json({ text: response.text || "مرحباً بك! كيف يمكنني مساعدتك اليوم؟" });

  } catch (error: any) {
    console.error("خطأ في مسار الدردشة:", error.message || error);
    return res.status(500).json({ text: "عذراً، واجه الخادم مشكلة مؤقتة في معالجة طلبك." });
  }
});

// مسار بديل للدردشة بدون /api لضمان التوافقية
app.post("/chat", (req, res) => app._router.handle(req, res));


/**
 * --- المسار الثاني: توليد البرامج السياحية (إصدار خفيف متوافق مع Appsmith) ---
 */
app.post("/api/generate-itinerary", async (req, res) => {
  try {
    const { destination, daysCount, budget, travelerType } = req.body;

    const targetDest = destination || "غرداية";
    // تحديد الأيام بحد أقصى 3 أيام لضمان بقاء حجم الرد أصغر من 1 ميجابايت وتفادي خطأ Appsmith الشهير
    const duration = daysCount ? Math.min(Number(daysCount), 3) : 3;

    console.log(`[Itinerary API] توليد برنامج لـ ${targetDest} لمدة ${duration} أيام...`);

    const systemInstruction = "أنت خبير لوجستي لوكالة فسحة DZ. يجب أن تعيد رد JSON مضغوط ومباشر يطابق الهيكل المطلوب تماماً وبدون أي نصوص ترحيبية خارج الـ JSON.";

    // صياغة برومبت صارم ومحدد البنية
    const prompt = `قم بصياغة برنامج سياحي تفصيلي وموجز لزيارة ${targetDest} لمدة ${duration} أيام. الميزانية: ${budget || "اقتصادية"}. نمط الرحلة: ${travelerType || "عائلي"}.
    المخرجات يجب أن تكون حصراً كائن JSON نظيف ومطابق تماماً للبنية التالية:
    {
      "destinationName": "${targetDest}",
      "country": "الجزائر",
      "tripDurationDays": ${duration},
      "targetBudgetLevel": "${budget || "اقتصادية"}",
      "travelerType": "${travelerType || "عائلي"}",
      "languageCode": "ar",
      "climateAdvisoryAlert": "الأجواء ملائمة جداً للأنشطة السياحية الميدانية واستكشاف المنطقة.",
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
      "customPackingList": [{"category": "الأمتعة الأساسية", "items": ["أحذية مريحة للمشي", "نظارات شمسية"]}],
      "localTravelTips": ["يفضل حمل سيولة نقدية بالدينار الجزائري (دج)"],
      "isDomesticTrip": true,
      "localCurrencySymbol": "دج",
      "emergencyNumbers": [{"label": "الحماية المدنية", "phone": "14"}, {"label": "الشرطة", "phone": "17"}]
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
    if (!jsonText) throw new Error("لم يتم إرجاع نص من النموذج.");

    // إرسال كائن الـ JSON بعد تحويله بنجاح
    return res.json(JSON.parse(jsonText));

  } catch (error: any) {
    console.error("خطأ في مسار توليد البرنامج:", error.message || error);
    return res.status(500).json({ error: "فشل في توليد البرنامج السياحي بسبب مشكلة في الهيكلة." });
  }
});

// مسار بديل لتوليد البرامج بدون /api لضمان التوافقية
app.post("/generate-itinerary", (req, res) => app._router.handle(req, res));


/**
 * --- المسارات العامة والإنتاجية ---
 */
app.get("/", (req, res) => {
  res.send("Fosha DZ AI Server is reset, clean, and fully operational!");
});

// التعامل مع المخرجات الجاهزة في بيئة الإنتاج (Production)
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// بدء تشغيل الاستماع للطلبات
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Clean server is happily running on port ${PORT}`);
});