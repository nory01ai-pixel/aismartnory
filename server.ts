import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();

// 1. تفعيل العبور الآمن والتام للـ CORS لتطبيقات الأندرويد والهواتف
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

// 2. دالة المعالجة الموحدة لطلبات جيميناي من الهاتف
async function handleGeminiChat(req: express.Request, res: express.Response) {
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

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Gemini Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

// 3. دعم المسارات بـ /api وبدونها لضمان اتصال كل أدوات التطبيق دفعة واحدة
app.post('/chat', handleGeminiChat);
app.post('/api/chat', handleGeminiChat);
app.post('/generate-itinerary', handleGeminiChat);
app.post('/api/generate-itinerary', handleGeminiChat);
app.post('/smart-location-help', handleGeminiChat);
app.post('/api/smart-location-help', handleGeminiChat);
app.post('/smart-search-help', handleGeminiChat);
app.post('/api/smart-search-help', handleGeminiChat);
app.post('/smart-fos7a-help', handleGeminiChat);
app.post('/api/smart-fos7a-help', handleGeminiChat);

// 4. فحص حالة السيرفر عبر النطاق الرئيسي
app.get('/', (req, res) => {
  res.send('AI Travel Agency Server for Fosha DZ is Live and Ready!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running beautifully on port ${PORT}`);
});