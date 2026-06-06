/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors"; // [إصلاح] استيراد حزمة الأمان
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

// جعل منفذ التشغيل ديناميكياً ليتعرف عليه نظام خوادم Render تلقائياً
const PORT = process.env.PORT || 3000;

// Lazy initialize Gemini SDK client with custom User-Agent
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

// Clean log helper to catch quota/429 limits or high demand (503) gracefully
function logCleanErrorWarning(apiEndpoint: string, error: any) {
  const errMsg = error?.message || String(error);
  console.log(`[Info] ${apiEndpoint} fallback initiated. Notice:`, errMsg);
}

// Resilient helper to execute content generation with retry and model fallbacks
async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
}): Promise<any> {
  // [تعديل] استخدام أحدث النماذج المستقرة لـ Gemini لعام 2026
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
          console.log(`[Gemini API] Success using model ${model}`);
          return response;
        }
        throw new Error("Empty response text returned");
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const errStr = errMsg.toLowerCase();
        const errStatus = String(err?.status || err?.code || "").toLowerCase();

        const isQuotaExceeded =
          errStr.includes("quota") ||
          errStr.includes("rate-limit") ||
          errStr.includes("exhausted") ||
          errStr.includes("429") ||
          errStr.includes("resource_exhausted") ||
          errStatus.includes("429") ||
          errStatus.includes("resource_exhausted");

        if (isQuotaExceeded) {
          console.log(`[Notice] API key current limits reached. Failing fast for fallback.`);
          throw new Error("SERVICE_QUOTA_EXHAUSTED");
        }

        const isTransient =
          errStr.includes("503") ||
          errStr.includes("unavailable") ||
          errStr.includes("demand") ||
          errStr.includes("temp") ||
          errStr.includes("overloaded") ||
          errStr.includes("busy") ||
          errStatus.includes("503") ||
          errStatus.includes("unavailable");

        console.log(`[Gemini API] Model ${model} returned service notice`);

        if (isTransient && attempt < 3) {
          const delay = attempt * 800;
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          break;
        }
      }
    }
  }

  throw lastError || new Error("All model fallback options exhausted");
}

// --- مسارات الـ Endpoints والربط المزدوج لخدمة الهاتف والمتصفح معاً ---

async function generateItineraryRoute(req: express.Request, res: express.Response) {
  try {
    const { destination, daysCount, budget, travelerType, interests, lang, tripScope, originWilaya, departureDate, allocatedBudgetAmount, transitMode, tripPurpose, missionDestinationsText, lodgingType } = req.body;

    if (!destination || !daysCount) {
      return res.status(400).json({ error: "Destination and days count are required" });
    }

    const isAr = lang === "ar";
    const isDomestic = tripScope === "domestic";

    let systemInstruction = "";
    if (isAr) {
      if (isDomestic) {
        systemInstruction = "أنت وكيل سفر وخبير سياحي ومستشار خدمات لوجستية جزائري محترف متخصص في برمجة الرحلات المتكاملة البين-ولائية والداخلية في الجزائر لوكالة فسحة DZ. ومهمتك هي إنشاء برنامج سياحي، علاجي، أو إداري متين يربط بأصالة واحترافية بين ولاية الانطلاق وولاية الوجهة بشكل مذهل باللغة العربية الفصحى. يجب مراجعة تاريخ السفر، وسيلة النقل المحددة (سواء طيران، قطار، سيارة، أو حافلات النقل البري / الحضري)، والميزانية، واقتراح وسائل النقل بالحافلات للتنقل البين-ولائي والحضري وتقديم نصائح غنية. يجب تقديم تحذيرات جوية، وتزويدنا بأرقام الطوارئ الجزائرية الرسمية (الشرطة 17 / 1548، الحماية المدنية 14، الدرك الوطني 1055)، وتحويل الأسعار بالكامل للدينار الجزائري (دج) بما يتوافق مع ميزانية المسافر واختيارات الإقامة (فندق، دار ضيافة، دار شباب، أو منزل كإقامة مستقلة).";
      } else {
        systemInstruction = "أنت خبير وكيل سفر ومخطط رحلات محترف ومستشار لوجستي لرحلات السياحة، العلاج، والمهام الإدارية لوكالة فسحة DZ. مهمتك هي إنشاء برنامج رحلة مفصل وملهم للغاية باللغة العربية الفصحى يتوافق بدقة مع رغبة المستخدم وموازنته والغرض المحدد لرحلته. يجب تقديم نصائح مناخية، وتحديد أرقام اتصالات الطوارئ، وشروط الحجز بدقة بناء على خياره للإقامة (فندق، دار ضيافة، دار شباب، أو منزل خاص)، ومحاكاة خرائط قوقل وتتطبيقات النقل ووسائل النقل العام مثل الحافلات ومترو الأنفاق في التنقلات الحضرية البينية.";
      }
    } else {
      if (isDomestic) {
        systemInstruction = "You are an expert Algerian travel agent and logistics guide specializing in domestic inter-wilaya travel for Fosha DZ agency. Design highly authentic, localized travel and administrative routes starting from the origin province to the destination province in Algeria, showcasing traditional guest houses or private home rentals, architectural landmarks, and public bus network systems. Advise explicitly on climate, transit warnings (focusing heavily on intercity and urban public buses), domestic Algerian emergency numbers (17 / 1548 for Police, 14 for Protection Civile, 1055 for National Gendarmerie) and translate all expenses to Algerian Dinars (DZD / دج).";
      } else {
        systemInstruction = "You are an expert travel agent and professional logistics planner for Fosha DZ travel hub. Your job is to construct a highly detailed, beautifully structured travel, medical, or business itinerary. Optimize plans based on traveler purpose (tourism, medical, business_admin) and lodging preference (hotel, traditional guesthouse, youth hostel, or private home rental). Provide specific climate advisory alerts, public bus and transit strategies, official hotlines, lodging requirements, and mock Google Maps routes.";
      }
    }

    let prompt = "";
    if (isAr) {
      if (isDomestic) {
        prompt = `قم بتخطيط برنامج رحلة داخلية متكاملة في الجزائر بين الولايات:
        ولاية الانطلاق والمغادرة: ${originWilaya || "الجزائر العاصمة"}.
        ولاية الوجهة والمحافظة المقصودة: ${destination}.
        عدد أيام البرنامج: ${daysCount} يوم.
        تاريخ أو ميعاد السفر المحدد: ${departureDate || "غير محدد"}.
        المبلغ الإجمالي المخصص لكامل الرحلة: ${allocatedBudgetAmount || "مفتوح"}.
        وسيلة النقل المفضلة للتنقل العام/البين-ولائي والحضري: ${transitMode || "القرار"}. (ملاحظة: تأكد من تفعيل وتحديد خطوط الحافلات لنقل الركاب بين الولايات أو الحافلات للتنقل الحضري أيضاً مع شرح المسار).
        الدرجة والمستوى: ${budget} (مثال: اقتصادية، متوسطة، فاخرة).
        نمط السفر والمرافقين: ${travelerType}.
        الغرض الرئيسي من السفر والتنقل: ${tripPurpose || "tourism"} (سياحة وترفيه "tourism"، أو علاج واستشفاء طبي بمستشفى أو عيادة "medical"، أو مهمة عمل وإجراء معاملات إدارية ومكاتب "business_admin").
        الجهات المستهدفة والمستشفيات أو الإدارات ومكاتب العمل المراد زيارتها لإتمام المهمة: ${missionDestinationsText || "لا يوجد"}.
        نوع مكان الإقامة والمنشأة المفضلة: ${lodgingType || "hotel"} (فندق "hotel"، أو دار ضيافة/لوكاندة تقليدية "guesthouse"، أو بيت شباب/مشترك "hostel"، أو منزل خاص/شقة سكنية "home").
        الاهتمامات التي يفضلها المسافر: ${interests && interests.length > 0 ? interests.join("، ") : "كل ما هو ثقافي، طبيعي ومحلي"}.

        يرجى التركيز على الخصائص البنيوية المحددة لقالب الـ JSON ومطابقتها بالكامل.`;
      } else {
        prompt = `قم بتخطيط رحلة كاملة ومفصلة إلى: ${destination}. الأيام: ${daysCount}. الميزانية: ${budget}.`;
      }
    } else {
      prompt = `Plan a complete itinerary to ${destination} for ${daysCount} days matching structural requirements.`;
    }

    // استعادة الـ responseSchema الأصلي والكامل المذكور في كودك لمنع تفكك الواجهات
    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            destinationName: { type: Type.STRING },
            country: { type: Type.STRING },
            tripDurationDays: { type: Type.INTEGER },
            targetBudgetLevel: { type: Type.STRING },
            travelerType: { type: Type.STRING },
            languageCode: { type: Type.STRING },
            departureDate: { type: Type.STRING },
            allocatedBudgetAmount: { type: Type.STRING },
            transitMode: { type: Type.STRING },
            climateAdvisoryAlert: { type: Type.STRING },
            localEventsAndExpos: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  date: { type: Type.STRING },
                  advisabilityNote: { type: Type.STRING }
                },
                required: ["name", "date", "advisabilityNote"]
              }
            },
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayNumber: { type: Type.INTEGER },
                  theme: { type: Type.STRING },
                  activities: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        timeOfDay: { type: Type.STRING },
                        durationHours: { type: Type.NUMBER },
                        estimatedCostUSD: { type: Type.NUMBER },
                        locationName: { type: Type.STRING },
                      },
                      required: ["title", "description", "timeOfDay", "durationHours", "estimatedCostUSD", "locationName"],
                    },
                  },
                },
                required: ["dayNumber", "theme", "activities"],
              },
            },
            suggestedHotels: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  stars: { type: Type.NUMBER },
                  pricePerNightUSD: { type: Type.NUMBER },
                  ratingValue: { type: Type.NUMBER },
                  reasonForRecommendation: { type: Type.STRING },
                  phoneNumber: { type: Type.STRING },
                  address: { type: Type.STRING }
                },
                required: ["name", "stars", "pricePerNightUSD", "ratingValue", "reasonForRecommendation", "phoneNumber", "address"],
              },
            },
            customPackingList: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  items: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["category", "items"],
              },
            },
            localTravelTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            isDomesticTrip: { type: Type.BOOLEAN },
            localCurrencySymbol: { type: Type.STRING },
            emergencyNumbers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  phone: { type: Type.STRING }
                },
                required: ["label", "phone"]
              }
            },
            bookingRequirements: { type: Type.ARRAY, items: { type: Type.STRING } },
            localTraditionalCuisine: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["name", "description"]
              }
            },
            popularMarketsAndSouks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["name", "type", "description"]
              }
            },
            googleMapsSim: {
              type: Type.OBJECT,
              properties: {
                accommodationName: { type: Type.STRING },
                accommodationQuery: { type: Type.STRING },
                primarySpotName: { type: Type.STRING },
                primarySpotQuery: { type: Type.STRING },
                distanceKMText: { type: Type.STRING },
                recommendedTaxiApp: { type: Type.STRING },
                taxiFareEstimateLocal: { type: Type.STRING },
                transitAdviceStep: { type: Type.STRING }
              },
              required: ["accommodationName", "accommodationQuery", "primarySpotName", "primarySpotQuery", "distanceKMText", "recommendedTaxiApp", "taxiFareEstimateLocal", "transitAdviceStep"]
            },
            tripPurpose: { type: Type.STRING },
            missionDestinationsText: { type: Type.STRING },
            lodgingType: { type: Type.STRING },
            administrativeMissionDetails: {
              type: Type.OBJECT,
              properties: {
                missionOverview: { type: Type.STRING },
                destinationsList: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      estimatedQueueTime: { type: Type.STRING },
                      transitAdvice: { type: Type.STRING },
                      documentsRequired: { type: Type.ARRAY, items: { type: Type.STRING } },
                      googleMapsQuery: { type: Type.STRING },
                      phoneNumber: { type: Type.STRING },
                      address: { type: Type.STRING }
                    },
                    required: ["name", "estimatedQueueTime", "transitAdvice", "documentsRequired", "googleMapsQuery", "phoneNumber", "address"]
                  }
                }
              },
              required: ["missionOverview", "destinationsList"]
            },
            nearbyPlacesAndUtilities: {
              type: Type.OBJECT,
              properties: {
                restaurantsAndCafes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, type: { type: Type.STRING }, description: { type: Type.STRING }, googleMapsQuery: { type: Type.STRING } }, required: ["name", "type", "description", "googleMapsQuery"] } },
                mosquesAndRestrooms: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, prayerTimesTransitAdvice: { type: Type.STRING }, hasPublicRestroom: { type: Type.BOOLEAN }, googleMapsQuery: { type: Type.STRING } }, required: ["name", "prayerTimesTransitAdvice", "hasPublicRestroom", "googleMapsQuery"] } },
                medicalServices: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, type: { type: Type.STRING }, description: { type: Type.STRING }, googleMapsQuery: { type: Type.STRING }, phoneNumber: { type: Type.STRING } }, required: ["name", "type", "description", "googleMapsQuery", "phoneNumber"] } },
                nearbyAlternativeLodgings: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, type: { type: Type.STRING }, priceEstimateLocal: { type: Type.STRING }, googleMapsQuery: { type: Type.STRING }, phoneNumber: { type: Type.STRING } }, required: ["name", "type", "priceEstimateLocal", "googleMapsQuery", "phoneNumber"] } },
                businessAndPrintingServices: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, type: { type: Type.STRING }, description: { type: Type.STRING }, googleMapsQuery: { type: Type.STRING } }, required: ["name", "type", "description", "googleMapsQuery"] } }
              },
              required: ["restaurantsAndCafes", "mosquesAndRestrooms", "medicalServices", "nearbyAlternativeLodgings", "businessAndPrintingServices"]
            },
            estimatedTransitSchedules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  transportMethod: { type: Type.STRING },
                  departureDayTime: { type: Type.STRING },
                  stationName: { type: Type.STRING },
                  frequencyAndPrice: { type: Type.STRING },
                  contactPhone: { type: Type.STRING }
                },
                required: ["transportMethod", "departureDayTime", "stationName", "frequencyAndPrice", "contactPhone"]
              }
            }
          },
          required: ["destinationName", "country", "tripDurationDays", "targetBudgetLevel", "travelerType", "languageCode", "days", "suggestedHotels", "customPackingList", "localTravelTips", "isDomesticTrip", "localCurrencySymbol", "emergencyNumbers", "bookingRequirements", "localTraditionalCuisine", "popularMarketsAndSouks", "googleMapsSim", "tripPurpose", "missionDestinationsText", "lodgingType", "administrativeMissionDetails", "nearbyPlacesAndUtilities", "estimatedTransitSchedules"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response returned from the model");

    return res.json(JSON.parse(text));
  } catch (error: any) {
    logCleanErrorWarning("Itinerary generation", error);
    return res.json(generateOfflineItinerary(req.body));
  }
}

app.post("/api/generate-itinerary", generateItineraryRoute);
app.post("/generate-itinerary", generateItineraryRoute);


async function chatRouteHandler(req: express.Request, res: express.Response) {
  try {
    const { messages, currentTripContext, lang } = req.body;
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "Chat messages are required" });

    const ai = getAiClient();
    const conversations = messages.slice(-10).map((msg: any) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    const chatResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: conversations,
      config: {
        systemInstruction: lang === "ar" ? "أنت مستشار السفر الشخصي الذكي لوكالة فسحة DZ..." : "You are the AI Travel Concierge for Fosha DZ..."
      }
    });

    return res.json({ text: chatResponse.text || "تم الاستلام بنجاح" });
  } catch (error: any) {
    logCleanErrorWarning("Chat guide assistant", error);
    return res.json({ text: req.body.lang === "ar" ? "مرحباً بكم في وكالة فسحة الرقمية التفاعلية." : "Welcome to Fosha DZ smart help terminal." });
  }
}

app.post("/api/chat", chatRouteHandler);
app.post("/chat", chatRouteHandler);

// --- إبقاء الدوال الأصلية للـ Fallback الصامد دون إنترنت الحفاظ على التطبيق ---
function generateOfflineItinerary(params: any): any {
  const { destination = "Algiers", daysCount = 3, budget = "Economy", travelerType = "Solo", lang = "en", tripScope = "domestic", allocatedBudgetAmount = "Flexible", transitMode = "Flight", tripPurpose = "tourism", lodgingType = "hotel" } = params;
  const isAr = lang === "ar";
  const daysNum = Math.min(14, Math.max(1, parseInt(daysCount) || 3));
  const isDomestic = tripScope === "domestic";
  const localCurrencySymbol = isDomestic ? (isAr ? "دج" : "DZD") : "$";

  const daysArray = [];
  for (let i = 1; i <= daysNum; i++) {
    daysArray.push({
      dayNumber: i,
      theme: isAr ? `اليوم ${i}: الانغماس في التراث والجمال المحلي للمنطقة` : `Day ${i}: Discovering Local Soul & Architecture`,
      activities: [{
        title: isAr ? `استكشاف معالم المدينة التاريخية العريقة` : `Ancient Heritage Landmark Tour`,
        description: isAr ? `جولة صباحية استكشافية رفقة دليل محلي للتعرف على الخصائص المعمارية الفريدة والأسواق التراثية القديمة.` : `An immersive tour visiting historical architecture and old-city heritage sites.`,
        timeOfDay: "Morning", durationHours: 3, estimatedCostUSD: 5, locationName: destination
      }]
    });
  }

  return {
    destinationName: destination, country: isDomestic ? "الجزائر" : "International", tripDurationDays: daysNum, targetBudgetLevel: budget, travelerType: travelerType, languageCode: lang, departureDate: "Flexible", allocatedBudgetAmount: allocatedBudgetAmount, transitMode: transitMode, climateAdvisoryAlert: isAr ? "🌦️ الأجواء مستقرة ومناسبة جداً للاستكشاف." : "🌦️ Pleasant weather conditions forecast.", localEventsAndExpos: [], days: daysArray, isDomesticTrip: isDomestic, localCurrencySymbol: localCurrencySymbol,
    suggestedHotels: [{ name: isAr ? "فندق السعادة والراحة السياحي" : "Comfort Bliss Grand Hotel", stars: 3, pricePerNightUSD: 35, ratingValue: 4.5, reasonForRecommendation: "Prime site", phoneNumber: "+213 21 00 11 22", address: destination }],
    customPackingList: [{ category: "Essentials", items: ["Comfortable clothing"] }], localTravelTips: [isAr ? "يفضل حمل مبالغ نقدية بالعملة المحلية (دج)." : "Carry local currency cash."], emergencyNumbers: [{ label: "Police", phone: "17" }, { label: "Protection Civile", phone: "14" }], bookingRequirements: ["ID Card"],
    localTraditionalCuisine: [{ name: isAr ? "الكسكس الجزائري الأصيل" : "Authentic Couscous", description: "Sovereign traditional dish" }], popularMarketsAndSouks: [], googleMapsSim: { accommodationName: "Hotel", accommodationQuery: destination, primarySpotName: "Center", primarySpotQuery: destination, distanceKMText: "1.5 km", recommendedTaxiApp: "Yassir", taxiFareEstimateLocal: "300 دج", transitAdviceStep: "Take public bus or taxi" }, tripPurpose: tripPurpose, missionDestinationsText: "", lodgingType: lodgingType, administrativeMissionDetails: { missionOverview: "Standard track", destinationsList: [] },
    nearbyPlacesAndUtilities: { restaurantsAndCafes: [], mosquesAndRestrooms: [], medicalServices: [], nearbyAlternativeLodgings: [], businessAndPrintingServices: [] }, estimatedTransitSchedules: []
  };
}

// 4. تشغيل وضبط البيئة لـ Vite وسحب صفحات المتصفح
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Travel Agency Server active on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Bootstrap server failure:", err);
});