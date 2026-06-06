import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();

// 1. تفعيل تامة للعبور الآمن (CORS) لهواتف الأندرويد
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

// 2. مسار معالجة الدردشة والمساعد الذكي (الذي نجح في الصورة الثالثة)
async function handleChat(req: express.Request, res: express.Response) {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }
    const lastMessage = messages[messages.length - 1]?.text || '';

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: lastMessage,
    });

    return res.json({ text: response.text });
  } catch (error: any) {
    console.error('Chat Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

app.post('/chat', handleChat);
app.post('/api/chat', handleChat);


// 3. مسار توليد البرامج السياحية وجداول المسارات المفصلة لوكالة فسحة DZ
async function handleItinerary(req: express.Request, res: express.Response) {
  try {
    // استقبال معطيات فكرة المسار من واجهة الهاتف
    const { destination, daysCount, tripPurpose } = req.body;

    const prompt = `أنت مستشار لوجستي وخبير سياحي متمرس في الجزائر لوكالة فسحة DZ.
    قم بصياغة برنامج سياحي مفصل إلى الوجهة المطلوبة: ${destination || 'غرداية'} لمدة ${daysCount || 3} أيام.
    الغرض: ${tripPurpose || 'سياحة استكشافية'}.
    يجب أن ترجع الإجابة حصراً ككائن JSON نظيف يحتوي على الهيكل التالي تماماً:
    {
      "destinationName": "${destination || 'غرداية'}",
      "country": "الجزائر",
      "tripDurationDays": ${daysCount || 3},
      "targetBudgetLevel": "اقتصادية مريحة",
      "travelerType": "عائلي",
      "languageCode": "ar",
      "climateAdvisoryAlert": "🌦️ الأجواء معتدلة ومناسبة جداً للزيارة والاستكشاف المعماري والثقافي.",
      "localEventsAndExpos": [{"name": "معرض الصناعات التقليدية والحرف", "date": "الشهر الحالي", "advisabilityNote": "ننصح بزيارته لاقتناء منتجات يدوية عريقة."}],
      "days": [
        {
          "dayNumber": 1,
          "theme": "اكتشاف العراقة والتراث الهندسي الباهر",
          "activities": [
            {
              "title": "جولة في القصر العتيق والمعالم الأثرية",
              "description": "استكشاف الهندسة المعمارية الفريدة لوادي ميزاب وزيارة الأسواق الشعبية القديمة وتناول الغداء التقليدي.",
              "timeOfDay": "صباحاً",
              "durationHours": 3,
              "estimatedCostUSD": 5,
              "locationName": "وسط المدينة الأثرية"
            }
          ]
        }
      ],
      "suggestedHotels": [{"name": "دار ضيافة تقليدية أصيلة", "stars": 4, "pricePerNightUSD": 45, "ratingValue": 4.8, "reasonForRecommendation": "موقع ممتاز يمنحك تجربة ثقافية فريدة ونقية.", "phoneNumber": "+213 550 12 34 56", "address": "حي القصبة العتيق"}],
      "customPackingList": [{"category": "ملابس", "items": ["ملابس مشي مريحة", "قبعة شمسية"]}],
      "localTravelTips": ["يفضل حمل مبالغ نقدية بالدينار الجزائري", "استأذن السكان المحليين قبل التصوير اللوجستي"],
      "isDomesticTrip": true,
      "localCurrencySymbol": "دج",
      "emergencyNumbers": [{"label": "الشرطة", "phone": "17"}, {"label": "الحماية المدنية", "phone": "14"}, {"label": "الدرك الوطني", "phone": "1055"}],
      "bookingRequirements": ["بطاقة التعريف الوطنية سارية المفعول"],
      "localTraditionalCuisine": [{"name": "الكسكس الجزائري الأصيل", "description": "طبق عريق يُطهى بالبخار مع خضار طازجة ولحم محلي غني بالنكهات."}],
      "popularMarketsAndSouks": [{"name": "السوق القديم لمنتجات النسيج والنحاس", "type": "سوق صناعات تقليدية", "description": "أفضل مكان لشراء الزرابي الميزابية والتحف التذكارية اليدوية."}],
      "googleMapsSim": {
        "accommodationName": "دار الضيافة التقليدية",
        "accommodationQuery": "دار ضيافة، غرداية",
        "primarySpotName": "مترس التراث الثقافي",
        "primarySpotQuery": "متحف، غرداية",
        "distanceKMText": "2.5 كم",
        "recommendedTaxiApp": "يسير (Yassir) أو خط سيارات الأجرة المحلية",
        "taxiFareEstimateLocal": "300 دج",
        "transitAdviceStep": "يمكنك ركوب حافلة النقل الحضري مباشرة من أمام مقر الإقامة لتصل في غضون 7 دقائق."
      },
      "tripPurpose": "tourism",
      "missionDestinationsText": "",
      "lodgingType": "guesthouse",
      "administrativeMissionDetails": {"missionOverview": "مسار مرن ومريح لزيارة المعالم التراثية والأسواق.", "destinationsList": []},
      "nearbyPlacesAndUtilities": {
        "restaurantsAndCafes": [{"name": "مطعم الخيرات الشعبي", "type": "مطعم مأكولات شعبية", "description": "يقدم وجبات تقليدية طازجة بنكهة محلية ساحرة.", "googleMapsQuery": "مطعم، غرداية"}],
        "mosquesAndRestrooms": [{"name": "المسجد الكبير العتيق", "prayerTimesTransitAdvice": "يحتوي على دورات مياه عمومية نظيفة ومفتوحة للعامة طيلة ساعات الصلوات.", "hasPublicRestroom": true, "googleMapsQuery": "المسجد العتيق"}],
        "medicalServices": [{"name": "صيدلية الهلال المناوبة", "type": "صيدلية (24 ساعة)", "description": "توفر المستلزمات الطبية على مدار اليوم بالقرب من النُزل.", "googleMapsQuery": "صيدلية، غرداية", "phoneNumber": "+213 29 00 11 22"}],
        "nearbyAlternativeLodgings": [{"name": "مرقد العائلات المريح", "type": "نُزل شعبي اقتصادي", "priceEstimateLocal": "2500 دج", "googleMapsQuery": "مرقد، غرداية", "phoneNumber": "+213 660 11 22 33"}],
        "businessAndPrintingServices": [{"name": "كشك النور للخدمات والنسخ", "type": "مركز نسخ وثائق", "description": "متوفر لطباعة وتصوير الأوراق والمستندات والخرائط فورياً.", "googleMapsQuery": "مكتبة، غرداية"}]
      },
      "estimatedTransitSchedules": [{"transportMethod": "حافلات خطوط النقل البري الكبرى", "departureDayTime": "يومياً الساعة 07:00 صباحاً", "stationName": "محطة المسافرين البرية المركزية", "frequencyAndPrice": "رحلة منتظمة طيلة الأسبوع بسعر 800 دج", "contactPhone": "+213 21 44 33 22"}]
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const data = JSON.parse(response.text || '{}');
    return res.json(data);
  } catch (error: any) {
    console.error('Itinerary Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

app.post('/generate-itinerary', handleItinerary);
app.post('/api/generate-itinerary', handleItinerary);

// 4. مسار فحص حالة السيرفر الأساسية عبر المتصفح
app.get('/', (req, res) => {
  res.send('AI Travel Agency Server for Fosha DZ is Live and Ready!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running beautifully on port ${PORT}`);
});