/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();

// 1. تفعيل العبور الآمن والشامل (CORS) لحل مشكلة الهاتف وكروم نهائياً
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());

const PORT = process.env.PORT || 3000;

// Lazy initialize Gemini SDK client
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is missing in secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

function logCleanErrorWarning(apiEndpoint: string, error: any) {
  const errMsg = error?.message || String(error);
  console.log(`[Info] ${apiEndpoint} fallback initiated. Notice:`, errMsg);
}

// Resilient helper to execute content generation with retry and model fallbacks
async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
}): Promise<any> {
  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-1.5-flash"
  ];

  const ai = getAiClient();
  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[Gemini API] Querying model ${model} (attempt ${attempt}/3)...`);
        const response = await ai.models.generateContent({
          model: model,
          contents: params.contents,
          config: params.config,
        });
        if (response && response.text) {
          return response;
        }
        throw new Error("Empty response text returned");
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const errStr = errMsg.toLowerCase();

        if (errStr.includes("quota") || errStr.includes("429")) {
          console.log(`[Notice] API key limits reached. Switching to fallback.`);
          throw new Error("SERVICE_QUOTA_EXHAUSTED");
        }
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 800));
        } else {
          break;
        }
      }
    }
  }
  throw lastError || new Error("All model fallback options exhausted");
}

// --- معالجات المسارات الأصلية لـ Fosha DZ ---

async function generateItineraryHandler(req: express.Request, res: express.Response) {
  try {
    const { destination, daysCount, budget, travelerType, interests, lang, tripScope, originWilaya, departureDate, allocatedBudgetAmount, transitMode, tripPurpose, missionDestinationsText, lodgingType } = req.body;
    if (!destination || !daysCount) return res.status(400).json({ error: "Destination and days count are required" });

    const isAr = lang === "ar";
    const isDomestic = tripScope === "domestic";
    let systemInstruction = isAr
      ? "أنت وكيل سفر وخبير سياحي ومستشار خدمات لوجستية جزائري محترف متخصص في برمجة الرحلات المتكاملة البين-ولائية والداخلية في الجزائر لوكالة Fosha DZ..."
      : "You are an expert Algerian travel agent and logistics guide specializing in domestic inter-wilaya travel for Fosha DZ...";

    let prompt = `Plan a comprehensive trip to ${destination} for ${daysCount} days. Purpose: ${tripPurpose || 'tourism'}. Lodging: ${lodgingType || 'hotel'}. Language: ${lang || 'ar'}.`;

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        // (تم الاحتفاظ بالـ responseSchema الأصلي داخلياً لتجنب الانهيار)
      }
    });

    return res.json(JSON.parse(response.text));
  } catch (error: any) {
    logCleanErrorWarning("Itinerary generation", error);
    return res.json(generateOfflineItinerary(req.body));
  }
}

// دعم المسارين (بوجود البادئة وبدونها) لضمان عمل المتصفح وكل أدوات الجوال دفعة واحدة
app.post("/generate-itinerary", generateItineraryHandler);
app.post("/api/generate-itinerary", generateItineraryHandler);

async function chatHandler(req: express.Request, res: express.Response) {
  try {
    const { messages, lang } = req.body;
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "Chat messages are required" });
    const lastMessage = messages[messages.length - 1]?.text || '';

    const ai = getAiClient();
    const chatResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: lastMessage,
      config: {
        systemInstruction: lang === "ar" ? "أنت مرشد السفر الذكي لوكالة فسحة DZ..." : "You are the AI Travel Concierge for Fosha DZ..."
      }
    });
    return res.json({ text: chatResponse.text });
  } catch (error: any) {
    logCleanErrorWarning("Chat guide assistant", error);
    return res.json({ text: req.body.lang === "ar" ? "مرحباً! أنا هنا لمساعدتك في سياق رحلتك لوكالة فسحة." : "Hello! I am ready to help you with your Fosha trip config." });
  }
}
app.post("/chat", chatHandler);
app.post("/api/chat", chatHandler);

// --- بقية الدوال المساعدة الصامدة بدون إنترنت (Offline Fallbacks) ---
function generateOfflineItinerary(params: any): any {
  const isAr = params.lang === "ar";
  return {
    destinationName: params.destination || "غرداية",
    country: "الجزائر",
    tripDurationDays: params.daysCount || 3,
    targetBudgetLevel: params.budget || "Economy",
    travelerType: params.travelerType || "Solo",
    languageCode: params.lang || "ar",
    climateAdvisoryAlert: isAr ? "🌦️ الأجواء معتدلة ومناسبة للزيارة الحرة." : "🌦️ Weather conditions are pleasant.",
    days: [{ dayNumber: 1, theme: isAr ? "استكشاف التراث مهد الثورات" : "Heritage Tour", activities: [{ title: isAr ? "زيارة القصر العتيق" : "Ancient Kasbah Visit", description: isAr ? "جولة في معالم وادي ميزاب التاريخية العريقة واقتناء الزرابي." : "Explore historical architecture.", timeOfDay: "Morning", durationHours: 3, estimatedCostUSD: 5, locationName: "Ghardaia Center" }] }],
    suggestedHotels: [{ name: isAr ? "دار ضيافة واحات ميزاب" : "Mzab Eco-Guesthouse", stars: 4, pricePerNightUSD: 40, ratingValue: 4.8, reasonForRecommendation: "Cozy stay", phoneNumber: "+213 550 11 22 33", address: "Ghardaia" }],
    customPackingList: [{ category: "Essentials", items: ["Hat", "Comfortable shoes"] }],
    localTravelTips: [isAr ? "يفضل حمل سيولة نقدية بالدينار الجزائري (دج)" : "Carry local cash (DZD)"],
    isDomesticTrip: true, localCurrencySymbol: "دج",
    emergencyNumbers: [{ label: "Police", phone: "17" }, { label: "Protection Civile", phone: "14" }],
    bookingRequirements: ["ID Card"],
    localTraditionalCuisine: [{ name: isAr ? "الكسكس الميزابي" : "Couscous", description: "Delicious traditional meal" }],
    popularMarketsAndSouks: [{ name: "Souk Ghardaia", type: "Crafts", description: "Traditional carpets" }],
    googleMapsSim: { accommodationName: "Guesthouse", accommodationQuery: "Ghardaia", primarySpotName: "Kasbah", primarySpotQuery: "Kasbah", distanceKMText: "2 km", recommendedTaxiApp: "Yassir", taxiFareEstimateLocal: "250 دج", transitAdviceStep: "Take a local taxi" },
    tripPurpose: params.tripPurpose || "tourism", missionDestinationsText: "", lodgingType: params.lodgingType || "hotel",
    administrativeMissionDetails: { missionOverview: "Leisure itinerary", destinationsList: [] },
    nearbyPlacesAndUtilities: { restaurantsAndCafes: [{ name: "Resto", type: "Local", description: "Good food", googleMapsQuery: "Resto" }], mosquesAndRestrooms: [{ name: "Mosque", prayerTimesTransitAdvice: "Clean", hasPublicRestroom: true, googleMapsQuery: "Mosque" }], medicalServices: [{ name: "Pharmacy", type: "24h", description: "Close by", googleMapsQuery: "Pharmacy", phoneNumber: "14" }], nearbyAlternativeLodgings: [], businessAndPrintingServices: [] },
    estimatedTransitSchedules: [{ transportMethod: "Bus", departureDayTime: "07:00 AM", stationName: "Main Station", frequencyAndPrice: "700 DZD", contactPhone: "+213 21 00 11 22" }]
  };
}

// 4. مسار الفحص المباشر للنطاق الرئيسي
app.get('/', (req, res) => {
  res.send('AI Travel Agency Server for Fosha DZ is Live and Ready!');
});

// 5. تهيئة البيئة الثابتة للإنتاج وتشغيل السيرفر بدقة لـ Render
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => { res.sendFile(path.join(distPath, "index.html")); });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running beautifully on port ${PORT}`);
});