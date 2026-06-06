import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();

// 1. تفعيل العبور الآمن والتام لتطبيقات الهواتف والأندرويد (CORS)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());

// 2. إعداد العميل الذكي لـ Gemini عبر المتغيرات المحمية في Render
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

// 3. مسار استقبال طلبات المساعد الذكي والدردشة الحية من الهاتف
app.post('/chat', async (req, res) => {
  try {
    const { messages, currentTripContext, lang } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    // التقاط نص آخر رسالة قام مستخدم الهاتف بكتابتها
    const lastMessage = messages[messages.length - 1]?.text || '';

    // الاتصال بالنموذج السريع والمتطور من ذكاء جيميناي
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: lastMessage,
    });

    // إرجاع النص الذكي الصافي بتنسيق JSON نظيف للهاتف
    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Gemini Execution Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// 4. مسار فحص حالة السيرفر الأساسية عبر المتصفح
app.get('/', (req, res) => {
  res.send('AI Travel Agency Server for Fosha DZ is Live and Ready!');
});

// 5. جعل منفذ التشغيل ديناميكياً 100% ليتعرف عليه نظام خوادم Render تلقائياً
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running smoothly on port ${PORT}`);
});