/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  Sparkles, 
  Search, 
  Calendar, 
  MapPin, 
  Heart, 
  Sun, 
  CloudSun, 
  BookOpen, 
  Share2, 
  Bookmark, 
  Flame, 
  Droplet, 
  Coffee, 
  Wind, 
  CheckCircle,
  Eye,
  Filter,
  Bell,
  Volume2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RegionalHubProps {
  lang: "ar" | "en";
  activeSeasonTheme?: string; // "autumn" | "spring" | "summer" | "winter"
  destinationCity?: string;
}

interface Festival {
  id: string;
  titleAr: string;
  titleEn: string;
  locationAr: string;
  locationEn: string;
  season: "spring" | "summer" | "autumn" | "winter";
  monthAr: string;
  monthEn: string;
  descAr: string;
  descEn: string;
  tagAr: string;
  tagEn: string;
  imageTheme: string;
}

interface AdviceSec {
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  tipsAr: string[];
  tipsEn: string[];
}

interface NewsCard {
  id: string;
  titleAr: string;
  titleEn: string;
  excerptAr: string;
  excerptEn: string;
  bodyAr: string;
  bodyEn: string;
  categoryAr: string;
  categoryEn: string;
  readTimeAr: string;
  readTimeEn: string;
  dateAr: string;
  dateEn: string;
  colorClass: string;
}

const festivalsData: Festival[] = [
  {
    id: "carpet-ghardaia",
    titleAr: "عيد الزربية بغرداية",
    titleEn: "Ghardaia Berber Carpet Festival",
    locationAr: "غرداية / قصور وادي ميزاب",
    locationEn: "Ghardaia / M'zab Valley Towers",
    season: "spring",
    monthAr: "مارس - أبريل",
    monthEn: "March - April",
    descAr: "احتفالية سنوية بهيجة تستعرض أفخر الزرابي المصنوعة يدوياً بأنامل نساء ميزاب التلميذات، مصحوبة باستعراضات فلكلورية مهيبة للخيالة وعروض البارود.",
    descEn: "A joyful annual festival showcasing the finest handwoven Algerian and Mozabite carpets, accompanied by folklore riders, desert camel shows, and gunpowder displays.",
    tagAr: "صناعة تقليدية",
    tagEn: "Traditional Crafts",
    imageTheme: "from-amber-500 to-red-600"
  },
  {
    id: "tafsit-tam",
    titleAr: "مهرجان التافسيت بالتمنراست",
    titleEn: "Tafsit Festival in Tamanrasset",
    locationAr: "تمنراست / جبال الهقار",
    locationEn: "Tamanrasset / Hoggar Saharan Peaks",
    season: "spring",
    monthAr: "أفريل",
    monthEn: "April",
    descAr: "احتفال ربيعي صحراوي تقليدي يستمر لثلاثة أيام مجسداً التراث التارقي الأصيل، يشمل سباقات المهاري الفريدة والرقص على وقع إيقاعات التيندي الأصيلة ولؤلؤ الشعر التارقي.",
    descEn: "A traditional 3-day Saharan spring festival celebrating the rich Tuareg culture, featuring swift camel races, 'Tindi' musical concerts, and desert poetry under the stars.",
    tagAr: "ثقافة صحراوية",
    tagEn: "Saharan Heritage",
    imageTheme: "from-blue-600 to-teal-500"
  },
  {
    id: "strawberry-skikda",
    titleAr: "عيد الفراولة بسكيكدة",
    titleEn: "Strawberry Festival in Skikda",
    locationAr: "سكيكدة / روسيكادا الرومانية",
    locationEn: "Skikda / Coastal Russicada",
    season: "spring",
    monthAr: "ماي",
    monthEn: "May",
    descAr: "كرنفال سنوي يملأ شوارع سكيكدة الساحلية بالبهجة، حيث يتنافس الحلوانيون في صنع أضخم هرم من الفراولة الطازجة من مزارع تمالوس مع عروض فنية حية.",
    descEn: "An annual street carnival filling Skikda with sweetness. Farmers and pastry chefs compete for best strawberry arrangements amidst musical acts and street tasting.",
    tagAr: "طبيعة وزراعة",
    tagEn: "Harvest & Fruits",
    imageTheme: "from-rose-500 to-red-600"
  },
  {
    id: "djemila-music",
    titleAr: "مهرجان جميلة الدولي للأغنية",
    titleEn: "Djemila International Song Festival",
    locationAr: "جميلة / سطيف (المدرج الروماني)",
    locationEn: "Djemila / Setif (Roman Amphitheatre)",
    season: "summer",
    monthAr: "جوان - جويلية",
    monthEn: "June - July",
    descAr: "مهرجان دولي يجمع ألمع مطربي الفن الأصيل تحت وهج النجوم وسط الأعمدة الشامخة والمدرج الأثري في مدينة جميلة الأثرية (كويكول).",
    descEn: "A dramatic international music festival uniting renowned Arab and local artists under starlit skies in the ancient Roman ruins of Cuicul (Djemila).",
    tagAr: "موسيقى وفنون",
    tagEn: "Music & Performing Arts",
    imageTheme: "from-violet-600 to-indigo-700"
  },
  {
    id: "cherry-miliana",
    titleAr: "عيد الكرز بمليانة",
    titleEn: "Miliana Cherry Festival",
    locationAr: "مليانة / جبل زكار الأصيل",
    locationEn: "Miliana / Mount Zaccar Foothills",
    season: "summer",
    monthAr: "جوان",
    monthEn: "June",
    descAr: "مهرجان تاريخي عريق يعود لعهود قديمة، يحتفي بجني الكرز الأحمر الفاخر في هضاب مليانة، وتتويجه بالمأكولات الشعبية وتصنيع ماء كرز الغابات.",
    descEn: "A centuries-old historic festival celebrating the summer harvest of deep red honey cherries on Mount Zaccar slopes, featuring local folk dance and jams.",
    tagAr: "تراث محلي",
    tagEn: "Local Harvest",
    imageTheme: "from-pink-600 to-red-700"
  },
  {
    id: "beach-oran",
    titleAr: "مهرجان وهران للألعاب والأغنية الوهرانية",
    titleEn: "Oran Sea & Rai Melodies Festival",
    locationAr: "وهران / ساحل الباهية",
    locationEn: "Oran / Bahia Coastline",
    season: "summer",
    monthAr: "جويلية - أوت",
    monthEn: "July - August",
    descAr: "احتفالات البحر والترفيه والشاطئ في وهران، حيث تلتقي الفنون الوهرانية الأصيلة كالراي مع الألعاب المائية الشاطئية والمأكولات البحرية اللذيذة.",
    descEn: "A vibrant summertime celebration along Oran's golden corniche, blending traditional Rai music with sandy beach sports and Mediterranean seafood feasts.",
    tagAr: "فنون البحر",
    tagEn: "Coastal Lifestyle",
    imageTheme: "from-teal-400 to-sky-600"
  },
  {
    id: "sbeiba-djanet",
    titleAr: "احتفالية السبيبة الأسطورية بجانت",
    titleEn: "Sbeiba UNESCO Festival in Djanet",
    locationAr: "جانت / واحة طاسيلي ناجر",
    locationEn: "Djanet / Tassili n'Ajjer Desert",
    season: "autumn",
    monthAr: "عاشوراء / سبتمبر - أكتوبر",
    monthEn: "Sept - Oct (Ashura Season)",
    descAr: "مهرجان مصنف لدى اليونسكو، يعيد إحياء معاهدة سلام قبائل الطوارق بملابس النيلة الداكنة البراقة، والسيوف والرقص الجماعي المهيب بنبضات الطبول.",
    descEn: "A UNESCO-certified heritage festival re-enacting historic peace treaties between desert clans with glittering indigo robes, heavy silver swords, and ritual war-drum dances.",
    tagAr: "تراث عالمي (يونسكو)",
    tagEn: "UNESCO World Heritage",
    imageTheme: "from-indigo-900 to-slate-900"
  },
  {
    id: "dates-biskra",
    titleAr: "عيد دقلة نور بطولقة وبسكري",
    titleEn: "Deglet Nour Date Harvest Festival",
    locationAr: "طولقة / بسكرة (بوابة الصحراء)",
    locationEn: "Tolga / Biskra (Gate of Sahara)",
    season: "autumn",
    monthAr: "أكتوبر - نوفمبر",
    monthEn: "October - November",
    descAr: "كرنفال زراعي يحتفي بقطاف دقلة نور الشفافة الذهبية، ملكة التمور في بسكرة وطولقة، مع تذوق الدبس والحلويات التقليدية والمأكولات بالتمور.",
    descEn: "An agricultural celebration marking the harvest of the famous translucent honey-sweet Deglet Nour dates, featuring crafts, poetry, and traditional date pastries.",
    tagAr: "مهرجان زراعي",
    tagEn: "Agriculture & Dates",
    imageTheme: "from-amber-600 to-yellow-800"
  },
  {
    id: "sahara-tourism",
    titleAr: "المهرجان الدولي للسياحة الصحراوية",
    titleEn: "International Sahara Tourism Festival",
    locationAr: "الوادي / مدينة ألف قبة وقبة",
    locationEn: "El Oued / City of a Thousand Domes",
    season: "autumn",
    monthAr: "نوفمبر",
    monthEn: "November",
    descAr: "مجمع للوكالات وعشاق الصحراء والمغامرات، يشهد مسابقات للتزلج على الرمال، ليل بدوي في الخيمة الصحراوية الكبيرة وعروض الخيل المهيبة.",
    descEn: "A major Saharan festival showcasing sandboarding competitions, overnight traditional nomad lodging, spiritual desert music, and sunset camel safaris.",
    tagAr: "مغامرات وصحراء",
    tagEn: "Adventure & Desert",
    imageTheme: "from-orange-500 to-amber-700"
  },
  {
    id: "yennayer-kabylie",
    titleAr: "رأس السنة الأمازيغية يناير",
    titleEn: "Yennayer - Amazigh New Year",
    locationAr: "تيزي وزو وبجاية وكامل القطر",
    locationEn: "Kabylie (Tizi Ouzou & Bejaia)",
    season: "winter",
    monthAr: "12 جانفي",
    monthEn: "January 12",
    descAr: "عيد وطني رسمي مجيد يحتفي ببداية السنة الفلاحية الأمازيغية، بطهي كسكس بـ 7 خضروات (إمنسي ن يناير)، واجتماع العائلات حول حكايا التراث وتبادل الأماني.",
    descEn: "An official national holiday celebrating the agrarian Amazigh New Year, featuring grand traditional couscous meals with 7 vegetables ('Imensi n Yennayer') and Berber music.",
    tagAr: "عيد وطني وتراثي",
    tagEn: "National & Folk Cultural",
    imageTheme: "from-emerald-600 to-green-800"
  },
  {
    id: "orange-boufarik",
    titleAr: "عيد البرتقال والبليدة العطرة",
    titleEn: "Boufarik Winter Orange Festival",
    locationAr: "بوفاريك / سهل متيجة الخصيب",
    locationEn: "Boufarik / Mitidja Valley Orchards",
    season: "winter",
    monthAr: "جانفي",
    monthEn: "January",
    descAr: "احتفالية شتوية تفوح بعطر أزهار برتقال حقول متيجة، لعرض كبار منتجي الحمضيات والمستخلصات الطبيعية وتصنيع ماء الزهر البليدي النقي والمربيات الفاخرة.",
    descEn: "A fragrant winter showcase displaying sweet citrus fruits, organic marmalades, and local extraction of pure orange blossom water ('Maa Zhar').",
    tagAr: "صناعة زراعية",
    tagEn: "Local Citrus",
    imageTheme: "from-amber-400 to-orange-650"
  },
  {
    id: "winter-taghit",
    titleAr: "مهرجان بركان وكثبان تاغيت الساحر",
    titleEn: "Taghit Winter Dunes & Arts Festival",
    locationAr: "تاغيت / ولاية بشار",
    locationEn: "Taghit Oasis / Bechar",
    season: "winter",
    monthAr: "ديسمبر",
    monthEn: "December",
    descAr: "احتفالية نهاية السنة الميلادية وسط واحة تاغيت الخلابة، تلتقي فيها العائلات من كل حدب للتزلج على رمال الكثبان الشاهقة ومراقبة شهب الصحراء الشتوية الباردة والنقية.",
    descEn: "A magnificent winter festival amidst Taghit's giant golden dunes, providing sandboarding sports, traditional desert lute concerts, and winter stargazing.",
    tagAr: "مهرجان شتوي صحراوي",
    tagEn: "Winter Saharan",
    imageTheme: "from-red-700 to-orange-900"
  }
];

const newsColumnData: NewsCard[] = [
  {
    id: "news-casbah",
    titleAr: "استعادة معالم القصبة العتيقة: فن العمارة يشرق من جديد",
    titleEn: "Restoration of Algiers' Ancient Casbah: Architectural Splendor Awakens",
    excerptAr: "بلدية الجزائر تطرح برنامجاً لترميم بيوت الدويرات والدكاكين في القصبة المصنفة تراثاً عالمياً، لفتح مسارات سياحية حميمية جديدة.",
    excerptEn: "A fresh restoration program aims to preserve the historic houses and narrow alleys of the UNESCO-listed Casbah, preparing new boutique travel lanes.",
    bodyAr: "تشهد القصبة التاريخية بالجزائر العاصمة ورشات عمل كبرى، بمشاركة مهندسين وحرفيين محليين برمجوا عمليات دقيقة لترميم نظام المياه الخزفي والمشربيات الخشبية التقليدية، لتمكين الزوار من خوض جولات ترحيبية آمنة وممتعة تثري تجاربهم السياحية بطابع تقليدي بهي.",
    bodyEn: "The historical Casbah of Algiers is currently hosting major conservation projects. Traditional stonemasons and carpentry experts are restoring classic wooden terraces and ceramic waterway pipes to design incredibly cozy, secure, and authentic alleys for global travelers.",
    categoryAr: "تراث وثقافة",
    categoryEn: "Culture",
    readTimeAr: "قراءة في 3 دقائق",
    readTimeEn: "3 min read",
    dateAr: "3 جوان 2026",
    dateEn: "June 3, 2026",
    colorClass: "bg-indigo-50 border-indigo-150 text-indigo-700"
  },
  {
    id: "news-ecolodge",
    titleAr: "نزل وبنغل بيئي فاخر في قلب واحات بسكرة الهادئة",
    titleEn: "New Luxury Eco-Resort Launches in Peaceful Biskra Oasis",
    excerptAr: "افتتاح منتجع واحاتي يتبنى فلسفة مستدامة 100٪ قائمة على مواد البناء الطينية الطبيعية والطاقة الشمسية والأغذية العضوية المحلية.",
    excerptEn: "A modern desert sanctuary opens near Biskra, constructed from organic mud bricks, completely solar-powered, serving farm-to-table oasis food.",
    bodyAr: "لمحبي الاستجمام والهدوء البديل، تم الإعلان رسمياً عن بدء استقبال النزلاء في نزل 'تاج الواحة' بسيدي عقبة. غُرست المباني وسط مزارع نخيل لامتناهية لتقدّم حمامات طينية حارة، وعلاجات طبيعية ببذور التمر وزيوت الزيتون الصافية على وقع خرير مياه الآبار الارتوازية.",
    bodyEn: "Formulating the ultimate slow-travel escape, 'Taj El Wahat' eco-bungalows are officially welcoming guests in Sidi Okba, Biskra. Blending natural thermal water wells, palm tree relaxation patios, and organic date-scrub facial therapy, it sets the bar high for regional luxury wellness.",
    categoryAr: "السياحة المستدامة",
    categoryEn: "Eco-Tourism",
    readTimeAr: "قراءة في 4 دقائق",
    readTimeEn: "4 min read",
    dateAr: "28 ماي 2026",
    dateEn: "May 28, 2026",
    colorClass: "bg-emerald-50 border-emerald-150 text-emerald-700"
  },
  {
    id: "news-train",
    titleAr: "ربط السكك الحديدية بالصحراء: قطارات النوم السياحية تطلق قريباً",
    titleEn: "Reaching the Sahara: Luxury Tourism Sleeper Trains to Launch Soon",
    excerptAr: "الشركة الوطنية للنقل بالسكك الحديدية تطرح عربات بانورامية للنوم تربط العاصمة بـ بسكرة، تقرت، وبشار برؤية صحراوية ساحرة.",
    excerptEn: "Algerian railway designers announce fresh luxury panoramic sleeping cabins linking Algiers directly to Biskra, Touggourt, and Bechar's dunes.",
    bodyAr: "بمواصفات تضمن أعلى مستويات الرفاهية والأمان، سيتم قريباً توفير رحلات ليلية هادئة تمكن المسافرين من النوم على متون أسرّة وثير ومقصورات فارهة بتهوية ممتازة وخدمات طعام صحراوي تقليدي، لتستيقظ صباحاً والرمال الذهبية تخاطب نافذة الغرفة ببهائها الأسطوري.",
    bodyEn: "Ensuring top-tier relaxation and security, the new tourism railway cabins will run sleeper routes directly from Northern hubs to deep desert gateways under starry nights, providing gourmet regional meals, high-speed Wi-Fi, and expansive skyward viewing windows.",
    categoryAr: "تطوير النقل سياحياً",
    categoryEn: "Transport & News",
    readTimeAr: "قراءة في 3 دقائق",
    readTimeEn: "3 min read",
    dateAr: "15 ماي 2026",
    dateEn: "May 15, 2026",
    colorClass: "bg-amber-50 border-amber-150 text-amber-700"
  }
];

const seasonalBeautyAdvisor: Record<string, AdviceSec> = {
  spring: {
    titleAr: "الربيع المعتدل: تنشيط البشرة والتغلب على حبوب اللقاح 🌸",
    titleEn: "Balanced Spring: Glow and Sinus Pollen Protection 🌸",
    descAr: "فترة انتقالية دافئة ومزهرة، تتطلب انتعاش المظهر بموازاة تهيئة البشرة لشمس الصيف المتصاعدة.",
    descEn: "A refreshing spring transition to clear cold patches and prepare your wellness for the rising sun.",
    tipsAr: [
      "تونر ماء الورد الطبيعي (Maa Ward): رشه على الوجه والرقبة قبل السير لحماية مهدئة وتثبيت الرطوبة الطبيعية وموازنة درجة الحموضة.",
      "مكافحة غبار حبوب اللقاح الطبيعي: استنشق بخار أوراق الكاليتوس (أوكالبتوس البليدة) لفتح الممرات الهوائية ومنع الحساسية الربيعية.",
      "مظهر خفيف ناعم: تجنب الكريمات الثقيلة، واستبدلها بجل حمض الهيالورونيك وخلاصة الخيار المهدئ لحلقات العين المتعبة.",
      "مطبخ ديتوكس الربيعي: تناول شاي نبتة الهندباء البرية مع قطرات ليمون متيجة لتنقية الجسم داخلياً لرحلتك القادمة."
    ],
    tipsEn: [
      "Distilled Rosewater Mist: Spray organic Algerian 'Maa Ward' onto your face to soothe, balance pH, and act as a natural refreshing prep.",
      "Eucalyptus Sinus Steam: Inhale steamed eucalyptus oils (inspired by Blida's evergreen valleys) to naturally clear pollen seasonal allergies.",
      "Lightweight Moisture: Swap dense winter body creams for lightweight hyaluronic gels and calming chamomile eye compresses.",
      "Blosson Water Detox: Infuse warm herbal teas with a tiny dash of orange blossom water to boost digestion and traveler vitals."
    ]
  },
  summer: {
    titleAr: "الصيف المتوسطي والصحراوي: الدروع الشمسية والترطيب المائي ☀️",
    titleEn: "Sizzling Summer: Solar Shields & Thermal Hydration ☀️",
    descAr: "شمس ساحلية في المتوسط ولفحات الصحراء الحارقة، تتوجب دقة قصوى لحماية البشرة ولون الجسم وصحة الرأس.",
    descEn: "Intense seaside sun in Oran and extreme dry heatwaves in the Sahara demand strict sun defense protocols.",
    tipsAr: [
      "واقي الشمس واسع المدى (SPF 50+): دهانه إلزامي كل ساعتين، ويفضل أن يحتوي على أكسيد الزنك لحماية متكاملة من وهج رمال الكثبان.",
      "ترطيب العروق المائي: شرب 4 لترات مياه يومياً مع دمج قرص فوار مغنيسيوم وإلكتروليتات لتفادي الصداع والدوار في الرحلات الطويلة.",
      "أقنعة طينية باردة (الغاسول العضوي): بعد العودة من الشاطئ أو الصحراء، ضع قناع الطين مع الزبادي البارد وعصير الخيار لتهدئة تهيج شمس الغروب.",
      "حماية الشعر الشاطئي: لف خصلات الشعر بزيت الأرغان الطبيعي أو زيت اللوز الحلو قبل السباحة لمنع ضرر الملح والشمس."
    ],
    tipsEn: [
      "Mineral Broad-Spectrum SPF 50+: Reapply generously every 2 hours, especially when exploring Sahara dunes or unshaded monuments.",
      "Traveler's Hydration Index: Carry electrolytes and pledge to drink 3.5 to 4 Liters of clean water to bypass heat exhaustion headaches.",
      "Cooling Clay Mask (Ghassoul): Treat post-sun redness with a cooling pack of organic clay mixed with cold plain yogurt and cucumber.",
      "Coastal Hair Shield: Coat hair ends with organic argan or sweet almond oil before swimming to create a safe barrier against saltwater."
    ]
  },
  autumn: {
    titleAr: "الخريف الهادئ: إصلاح أضرار الصيف ووقاية عصف الرياح 🍂",
    titleEn: "Mellow Autumn: Post-Summer Repair & Wind Defense 🍂",
    descAr: "عندما ينحسر البحر وتبدأ لفحات الهواء البارد، تحتاج البشرة علاجاً عاجلاً للجفاف وتوحيد لون السُمرة.",
    descEn: "As cooler drafts set in, use traditional local oils to repair summer UV spots and coat dry extremities.",
    tipsAr: [
      "حمام زيت الزيتون التقليدي (زيت جرجرة البكر): مرطب خريفي عميق مثالي للجسم والشعر، يرمم تشققات البشرة فوراً ويعيد لها البريق.",
      "مشروب الحصانة الخريفي: نقيع الميرمية، اللويزة الشافية (La Verveine)، أو الزعتر البري مع عسل طبيعي للوقاية من تقلبات الجو.",
      "العناية بالقدمين واليدين: رطّب الكفين بـ زبدة الشيا أو زيت السمسم لتجنب الجفاف بسبب رياح الخريف الجافة المباغتة.",
      "التدرج بالتقشير اللطيف: ساعد خلايا البشرة على التخلص من بقايا الحروق الصيفية بالتقشير بمسحوق القهوة الناعم وعسل السدر."
    ],
    tipsEn: [
      "Pure Kabyle Extra-Virgin Olive Oil: Massage a small amount on damp skin or hair after showers to lock in summer-repair moisture.",
      "Highlands Herbal Tea: Drink fresh rosemary, wild thyme, and verbena (Verveine) tea sweeted with raw honey to boost protection against autumn flu.",
      "Hand & Lip Barrier Balm: Apply shea butter or local honey balms to bypass chapping from dry, sudden autumn wind drafts.",
      "Gentle Coffee Exfoliation: Blend ground coffee with a splash of local sweet olive oil to gently slough off dull summer tan."
    ]
  },
  winter: {
    titleAr: "الشتاء الجبلي البارد: طقوس الحمام الساخن والترطيب الفائق ❄️",
    titleEn: "Mountain Kabylie Winter: Hammam Glow & Deep Moisture ❄️",
    descAr: "صقيع الجبال وثلوج غابات الأرز، تنادي طقوساً تمنح الدفء الداخلي وعلاجات الرطوبة المكثفة.",
    descEn: "With cold snows on Djurdjura peaks, embrace steaming local bathhouses (Hammams) and intensive skin oil barriers.",
    tipsAr: [
      "طقس الحمام الجزائري التقليدي: ادهن الجسم بـ الصابون البلدي الأسود (Saboun El Kahla) مع التقشير بكيس الحمام (Kessa) لتنشيط الدورة الدموية.",
      "استخلاص مياه غولمة المعدنية للوجه: اغسل بشرتك صباحاً بمياه معدنية مشبعة بالزنك والسيليكا لحماية وتلطيف البشرة الشديد.",
      "حماية الخدود الدهنية العميقة: مرهم شمع العسل العضوي مع زيت المشمش لحماية تفاحتي الخدين من لفحة البريق البارد في جبال القبايل والشريعة.",
      "الحساء الشتوي الشافي (الجيّار أو الدشيشة): فطور غني بالتوابل المحلية المانحة للدفء والحصانة وتأصيل الطاقة البدنية للحركة."
    ],
    tipsEn: [
      "Traditional Hammam Ritual: Embrace steam baths using black olive soap (Saboun El Kahla) combined with a rigorous Kessa scrubbing glove.",
      "Mineral Thermal Water: Refresh your facial layout with silica-rich water (inspired by Guelma mineral hot springs) to lock down cold-weather hydration.",
      "Mountain Beeswax Lip Shield: Apply a thick protective coating of organic beeswax with apricot kernel oil to prevent cold mountain frost burns.",
      "Spiced Winter Broth (Chorba Frik): Consume nutrient-rich, spiced local soups to elevate internal warmth and traveler blood flow."
    ]
  }
};

interface ClimateCareTip {
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  icon?: string;
}

const climateCareTipsData: Record<"desert" | "coastal" | "mountain", ClimateCareTip[]> = {
  desert: [
    {
      titleAr: "حماية البشرة من حرارة رمال الصحراء ☀️",
      titleEn: "Skin Protection for Desert Heat ☀️",
      descAr: "دهان واقي شمس معدني (مقاوم للرمال) ومسح الوجه ببخاخ ماء الورد البارد للتنقية العميقة ومنع سد المسام.",
      descEn: "Use sand-resistant zinc sunscreens and refresh with mineral-infused chilled Rosewater spray to prevent sand friction clogged pores."
    },
    {
      titleAr: "قبعة الرأس والوشاح الصحراوي 👒",
      titleEn: "Sun Hats & Saharan Cheche Protection 👒",
      descAr: "ارتدِ قبعة واقية عريضة للرأس من أشعة شمس الظهيرة أو وشاح صحراوي قطني طويل (شاش/حايك) لعزل حرارة الرأس وحماية منابت الشعر وعروق الرقبة.",
      descEn: "Wear a wide protective hat from the afternoon sun or a traditional cotton desert scarf (Cheche) to shield your scalp, hair, and neck vents from severe solar rays."
    },
    {
      titleAr: "درع الشفاه من جفاف ريح السموم 🌬️",
      titleEn: "Desert Wind Lip Defense 🌬️",
      descAr: "ضع طبقة سميكة من شمع العسل الطبيعي وزيت الزيتون البكر كل ساعتين لحظر جفاف الرياح الصحراوية الساخنة.",
      descEn: "Coat dry lips with organic local beeswax mixed with extra-virgin olive oil to lock down protective barriers against hot windstorms."
    },
    {
      titleAr: "ترطيب خصلات الشعر الصحراوي 🐪",
      titleEn: "Saharan Hair Shield 🐪",
      descAr: "افرد القليل من زيت السمسم أو الأرغان لتدعيم أطراف الشعر ومنع التقصف بفعل ندرة الرطوبة وجفاف الصحراء.",
      descEn: "Apply subtle argan or sesame oil coats onto dry hair ends before safaris to insulate cuticles from severe Saharan moisture loss."
    },
    {
      titleAr: "الترطيب العضوي الداخلي 💧",
      titleEn: "Thermoregulation Tea 💧",
      descAr: "اشرب شاي أوراق النعناع الصحراوي غير المغلي طويلاً مع قطرات من الليمون لمعادلة حرارة الأحشاء الداخلية وطرد السموم.",
      descEn: "Sip moderately warm local desert mint tea with drops of fresh lime to stimulate organic gut cooling and boost continuous hydration."
    }
  ],
  coastal: [
    {
      titleAr: "مكافحة تموج الشعر بفعل رطوبة البحر 🌊",
      titleEn: "Hair Care for Humid Weather 🌊",
      descAr: "رش خلاصة مغلي إكليل الجبل (الروزماري) الغني مع بضع قطرات من زيت اللوز الحلو لترطيب الشعر وبصمته المتألقة بدون فريز.",
      descEn: "Mist healthy rosemary-infused spray with sweet almond coat on hair ends to maintain shine and prevent high-humidity marine frizz."
    },
    {
      titleAr: "تنظيف الوجه من غبار الملح البحري 🧴",
      titleEn: "Saltwater Marine Calm 🧴",
      descAr: "بشرتك بحاجة للغسيل بماء دافئ مدعوم بخلاصة نبتة البابونج المهدئة لإزالة ترسبات ملح البحر وتهدئة احمرار الساحل المجهد.",
      descEn: "Soothe maritime salt stress by rinsing your face with chamomile-infused water to safely neutralize high mineral salts and redness."
    },
    {
      titleAr: "مكافحة اللمعان الدهني الرطب ✨",
      titleEn: "Matte Humid Solution ✨",
      descAr: "الرطوبة الزائدة تحفز الغدد؛ استخدم جل الصبار الطبيعي الخفيف مع قليل من بودرة النشا وعصير الليمون لحفظ التوازن اللطيف.",
      descEn: "High coastal humidity triggers oil glands; massage cool aloe vera gelets to sustain clear matte pores without thick artificial layers."
    },
    {
      titleAr: "طارد رطوبة الجسم وتصفية الدم 🍹",
      titleEn: "Coastal Citrus De-stresser 🍹",
      descAr: "تناول نقيع الحمضيات الطبيعية والليمون الطازج مع مكعبات ثلج لمقاومة التعب الرطب وتنشيط الخلايا الجسمية والمناعة.",
      descEn: "Hydrate with cold local citrus blends (with green lemons) to stimulate high-antioxidant recovery against humid heat lethargy."
    }
  ],
  mountain: [
    {
      titleAr: "درع مكثف لمواجهة صقيع الجبال ❄️",
      titleEn: "Extreme Cold Dry Wind Defence ❄️",
      descAr: "في مرتفعات جرجرة والبليدة الشتوية الباردة، استعمل زبدة الشيا العضوية الممزوجة بزيت المشمش لحماية تفاحتي الخدود من القشب.",
      descEn: "Shield delicate skin cheeks from biting mountain winds using thick shea butter and moisturizing apricot seed oils."
    },
    {
      titleAr: "واقي فوق بنفسجي في المرتفعات 🏔️",
      titleEn: "Altitude UV Radiation Defense 🏔️",
      descAr: "الأشعة في الجبال تكون مركزة لخلخلة الغلاف الجوي؛ احرص على كريم واقي SPF مضاعف حتى ولو كان الجو غائماً كلياً وضبابياً.",
      descEn: "High heights have thinner atmospheres that allow heavy UV; apply double titanium solar screens even in cloudy foggy slopes."
    },
    {
      titleAr: "تنشيط الخلايا ببخار مياه قالمة ♨️",
      titleEn: "Guelma Hot Springs Mineral Steam ♨️",
      descAr: "تحاكي ورشات الجمال حمام غولمة الطبيعي بإشعال بخار ماء عشبي ساخن لتدليك الوجه وإثارة رونق البشرة وإذابة الجيوب المتعبة.",
      descEn: "Replicate a pure Guelma hot-spring wellness session with face-steaming herbs to accelerate organic blood-flow in winter chills."
    },
    {
      titleAr: "فطور الدفء وحصانة الجبال 🍲",
      titleEn: "Hale Mountain Immune Booster 🍲",
      descAr: "تجرع شربات مغذية غنية بالكركم والزنجبيل البري وزعتر الجبال مع عسل السدر الصافي لتدفئة الشرايين والحد من النزلات الشتوية.",
      descEn: "Brew mountain wild thyme combined with organic ginger and dark forest honey to fuel deep warm body cells and dynamic circulation."
    }
  ]
};

function resolveClimateType(city?: string): {
  id: "desert" | "coastal" | "mountain";
  nameAr: string;
  nameEn: string;
  detailsAr: string;
  detailsEn: string;
} {
  const c = (city || "").toLowerCase();
  
  if (
    c.includes("algiers") || 
    c.includes("الجزائر") || 
    c.includes("oran") || 
    c.includes("وهران") || 
    c.includes("skikda") || 
    c.includes("سكيكدة") || 
    c.includes("bejaia") || 
    c.includes("بجاية") || 
    c.includes("annaba") || 
    c.includes("عنابة") || 
    c.includes("tipaza") || 
    c.includes("تيبازة") || 
    c.includes("jijel") || 
    c.includes("جيجل") ||
    c.includes("mostaganem") ||
    c.includes("مستغانم") ||
    c.includes("coastal") ||
    c.includes("coast")
  ) {
    return {
      id: "coastal",
      nameAr: "ساحلي رطب (البحر الأبيض المتوسط)",
      nameEn: "Humid Coastal Mediterranean",
      detailsAr: "يتمتع بمناخ متوسطي رطب وتأثير مالح من رذاذ البحر وشمس ساطعة على الشواطئ.",
      detailsEn: "Characterized by high sea humidity, salty sea sprays, and bright coastline solar rays."
    };
  }
  
  if (
    c.includes("ghardaia") || 
    c.includes("غرداية") || 
    c.includes("tamanrasset") || 
    c.includes("تمنراست") || 
    c.includes("djanet") || 
    c.includes("جانت") || 
    c.includes("el oued") || 
    c.includes("الوادي") || 
    c.includes("biskra") || 
    c.includes("بسكرة") || 
    c.includes("taghit") || 
    c.includes("تاغيت") || 
    c.includes("timimoun") || 
    c.includes("تيميمون") || 
    c.includes("desert") || 
    c.includes("صحراء") ||
    c.includes("oasis") ||
    c.includes("واحة") ||
    c.includes("touggourt") ||
    c.includes("ouargla") ||
    c.includes("ورقلة") ||
    c.includes("bechar") ||
    c.includes("بشار")
  ) {
    return {
      id: "desert",
      nameAr: "صحراوي جاف وحار للغاية",
      nameEn: "Arid Sahara Desert Heat",
      detailsAr: "رياح صحراوية دافئة جافة، أشعة شمس فائقة الوهج المنعكس على الصحراء الرملية، وتفاوت حراري بين الليل والنهار.",
      detailsEn: "Golden unshaded dunes, fast dehydrating dry winds, high solar reflectivity, and wide night-day temperatures."
    };
  }

  return {
    id: "mountain",
    nameAr: "جبلي قاري بارد / المرتفعات",
    nameEn: "Continental Highlands & Alpine Peak",
    detailsAr: "طقس جبلي جاف بارد، رياح صقيعية مفاجئة، وأشعة فوق بنفسجية مكثفة الوهج على القمم الجبلية المرتفعة.",
    detailsEn: "Brisk chilly winds, high-altitude UV rays, and chilly nights of Kabylie or Aurès highlands."
  };
}

export default function RegionalHub({ lang, activeSeasonTheme = "autumn", destinationCity }: RegionalHubProps) {
  const [selectedSeason, setSelectedSeason] = useState<"spring" | "summer" | "autumn" | "winter">(() => {
    if (["spring", "summer", "autumn", "winter"].includes(activeSeasonTheme)) {
      return activeSeasonTheme as "spring" | "summer" | "autumn" | "winter";
    }
    return "autumn";
  });

  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [bookmarkedNews, setBookmarkedNews] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("bookmarked_news");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeNewsModal, setActiveNewsModal] = useState<NewsCard | null>(null);
  const [toastMessage, setToastMessage] = useState<string>("");

  const [subscribedNotifications, setSubscribedNotifications] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("subscribed_hub_notifications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeAlerts, setActiveAlerts] = useState<Array<{
    id: string;
    title: string;
    body: string;
    time: string;
    type: "festival" | "news" | "health";
  }>>([]);

  const [climateCityOverride, setClimateCityOverride] = useState<string>("");

  const activeCity = climateCityOverride || destinationCity || (lang === "ar" ? "الجزائر" : "Algiers");
  const climateObj = useMemo(() => resolveClimateType(activeCity), [activeCity]);

  const playSyntheticChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
      
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      // browser audio constraints
    }
  };

  const handleToggleNotificationSubscription = (id: string, title: string, body: string, type: "festival" | "news" | "health") => {
    let updated: string[];
    const isSubscribed = subscribedNotifications.includes(id);
    if (isSubscribed) {
      updated = subscribedNotifications.filter(x => x !== id);
      showToast(lang === "ar" ? "🔔 تم إيقاف التنبيه لهذا العنصر" : "🔔 Alert disabled for this item");
      setActiveAlerts(prev => prev.filter(a => a.id !== id));
    } else {
      updated = [...subscribedNotifications, id];
      showToast(lang === "ar" ? "🔔 تم التشغيل! ترقب تنبيهاً محاكياً بعد 3 ثوانٍ..." : "🔔 Alerts enabled! Simulation incoming in 3s...");
      
      setTimeout(() => {
        playSyntheticChime();
        setActiveAlerts(prev => {
          if (prev.some(a => a.id === id)) return prev;
          return [
            ...prev,
            {
              id,
              title: lang === "ar" ? `تنبيه من فسحة الجزائر: ${title}` : `Fos7a Air-Alert: ${title}`,
              body,
              time: new Date().toLocaleTimeString(lang === "ar" ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" }),
              type
            }
          ];
        });
      }, 3000);
    }
    setSubscribedNotifications(updated);
    localStorage.setItem("subscribed_hub_notifications", JSON.stringify(updated));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  const handleToggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated: string[];
    if (bookmarkedNews.includes(id)) {
      updated = bookmarkedNews.filter(item => item !== id);
      showToast(lang === "ar" ? "تمت إزالة المقال من المحفوظات" : "Article removed from bookmarks");
    } else {
      updated = [...bookmarkedNews, id];
      showToast(lang === "ar" ? "تم حفظ المقال للرجوع إليه لاحقاً" : "Article saved to bookmarks for offline reading");
    }
    setBookmarkedNews(updated);
    localStorage.setItem("bookmarked_news", JSON.stringify(updated));
  };

  const handleShareArticle = (card: NewsCard, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = lang === "ar" ? `مقال رائع: ${card.titleAr}` : `Excellent Read: ${card.titleEn}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${text} - Shareable via Fos7a Algeria Travel Club`);
      showToast(lang === "ar" ? "نسخ رابط المقال إلى الحافظة!" : "Copied article link to clipboard!");
    } else {
      showToast(lang === "ar" ? "مشاركة المقال مفعلة!" : "Article sharing active!");
    }
  };

  // Filter festivals based on selected season, region filter and search query
  const filteredFestivals = useMemo(() => {
    return festivalsData.filter((fest) => {
      // Season filter
      if (fest.season !== selectedSeason) return false;

      // Region/Wilaya filter
      if (selectedRegionFilter !== "all") {
        const textToMatch = `${fest.locationAr} ${fest.locationEn}`.toLowerCase();
        if (selectedRegionFilter === "sahara" && !textToMatch.includes("غرداية") && !textToMatch.includes("تمنراست") && !textToMatch.includes("دجانet") && !textToMatch.includes("taghit") && !textToMatch.includes("biskra") && !textToMatch.includes("صحراء") && !textToMatch.includes("desert") && !textToMatch.includes("touggourt") && !textToMatch.includes("el oued")) {
          return false;
        }
        if (selectedRegionFilter === "coast" && !textToMatch.includes("سكيكدة") && !textToMatch.includes("oran") && !textToMatch.includes("وهران") && !textToMatch.includes("algiers") && !textToMatch.includes("الجزائر العاصمة") && !textToMatch.includes("bejaia") && !textToMatch.includes("ساحل") && !textToMatch.includes("beaches")) {
          return false;
        }
        if (selectedRegionFilter === "highlands" && !textToMatch.includes("سطيف") && !textToMatch.includes("مليانة") && !textToMatch.includes("djemila") && !textToMatch.includes("زكار") && !textToMatch.includes("boufarik") && !textToMatch.includes("tizi") && !textToMatch.includes("قبائل") && !textToMatch.includes("kabylie")) {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchTitle = (lang === "ar" ? fest.titleAr : fest.titleEn).toLowerCase();
        const matchLoc = (lang === "ar" ? fest.locationAr : fest.locationEn).toLowerCase();
        const matchDesc = (lang === "ar" ? fest.descAr : fest.descEn).toLowerCase();
        return matchTitle.includes(query) || matchLoc.includes(query) || matchDesc.includes(query);
      }

      return true;
    });
  }, [selectedSeason, selectedRegionFilter, searchQuery, lang]);

  const activeAdvisor = seasonalBeautyAdvisor[selectedSeason];

  return (
    <div className="space-y-8 animate-fadeIn" id="regional-hub-component">
      
      {/* Toast Notification Container */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-slate-900 border border-slate-800 text-white text-xs font-bold py-3 px-5 rounded-xl shadow-2xl flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simulated Active Alerts Multi-Notification Stack */}
      <div className="fixed top-20 right-6 z-50 space-y-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {activeAlerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 200, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 200, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-amber-200/60 shadow-amber-500/5 flex flex-col space-y-2 relative overflow-hidden"
            >
              {/* Dynamic decorative visual accent line based on type */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 animate-pulse" />
              
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600 animate-bounce">
                    <Bell className="w-4 h-4 fill-amber-500 text-amber-600" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-black tracking-wider text-amber-600">
                      {lang === "ar" ? "تنبيه سفر محاكي" : "Simulated Travel Alert"}
                    </span>
                    <h4 className="font-extrabold text-slate-800 text-xs leading-tight">
                      {alert.title}
                    </h4>
                  </div>
                </div>
                <button
                  onClick={() => setActiveAlerts(prev => prev.filter(a => a.id !== alert.id))}
                  className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 text-xs font-bold transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-slate-600 text-[11px] font-semibold leading-relaxed">
                {alert.body}
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-slate-50 text-[10px] text-slate-400">
                <span className="font-mono">{alert.time}</span>
                <span className="font-bold flex items-center gap-1 text-slate-500">
                  <Volume2 className="w-3 h-3 text-slate-400" />
                  {lang === "ar" ? "تنبيه صوتي تفاعلي" : "Synthetic Audio Active"}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Beautiful Season Banner */}
      <div className={`relative overflow-hidden rounded-3xl p-6 md:p-8 text-white shadow-xl bg-gradient-to-r ${
        selectedSeason === "spring" ? "from-amber-500 via-amber-600 to-orange-600" :
        selectedSeason === "summer" ? "from-sky-500 via-teal-600 to-emerald-700" :
        selectedSeason === "autumn" ? "from-indigo-600 via-indigo-700 to-slate-850" :
        "from-emerald-700 via-green-850 to-slate-900"
      }`}>
        <div className="absolute inset-0 bg-radial from-transparent to-black/30 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="bg-white/20 border border-white/30 text-white font-extrabold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
              <Sun className="w-3.5 h-3.5" />
              {lang === "ar" ? "نبض واستشارة الفصول المحلية" : "Dynamic Seasonal Tourism Advisory"}
            </span>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
              {lang === "ar" ? "ساحة الأحداث، والمهرجانات، وجمال الفصول" : "Festivals, Regional News & Seasonal Wellness Hub"}
            </h1>
            <p className="text-white/80 text-xs md:text-sm font-semibold leading-relaxed">
              {lang === "ar" 
                ? "دليلك الثقافي المتجدد لمهرجانات الجزائر الشعبية وأجندة الأخبار ونصائح الصحة والعناية بالمظهر استجابة للميزات الموسمية الفريدة."
                : "Your seasonal cultural manual detailing Algerian regional celebrations, sustainable travel columns, and safe beauty guides adapted to the environment."}
            </p>
          </div>

          {/* Quick Season Select Switcher */}
          <div className="bg-black/20 backdrop-blur-xs border border-white/10 p-1.5 rounded-2xl flex flex-row gap-1 self-start md:self-center">
            {(["spring", "summer", "autumn", "winter"] as const).map((s) => {
              const active = selectedSeason === s;
              const emoji = s === "spring" ? "🌸" : s === "summer" ? "☀️" : s === "autumn" ? "🍂" : "❄️";
              const label = lang === "ar" 
                ? (s === "spring" ? "الربيع" : s === "summer" ? "الصيف" : s === "autumn" ? "الخريف" : "الشتاء")
                : (s === "spring" ? "Spring" : s === "summer" ? "Summer" : s === "autumn" ? "Autumn" : "Winter");
              return (
                <button
                  key={s}
                  onClick={() => setSelectedSeason(s)}
                  className={`p-2 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
                    active ? "bg-white text-slate-900 shadow-sm" : "hover:bg-white/10 text-white"
                  }`}
                >
                  <span className="text-base leading-none">{emoji}</span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT & CENTER PANEL: Festivals & Region News */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Festivals Block Container */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-4">
              <div className="space-y-1">
                <h2 className="text-base md:text-lg font-black text-slate-800 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  {lang === "ar" ? "أجندة رقصات وتراث ومهرجانات الفصل" : "Festivals & Regional Celebrations Agenda"}
                </h2>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                  {lang === "ar" 
                    ? `مهرجانات ومواسم تقام خصيصاً في فصل ${selectedSeason === "spring" ? "الربيع" : selectedSeason === "summer" ? "الصيف" : selectedSeason === "autumn" ? "الخريف" : "الشتاء"}`
                    : `Cultural events hosted within the beautiful ${selectedSeason} season`}
                </p>
              </div>

              {/* Filters / Search box */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={lang === "ar" ? "بحث عن مهرجان..." : "Search festival..."}
                    className="w-full pl-8 pr-3 py-2 border border-slate-150 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-400 text-slate-800"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-2.5 top-2.5 w-3 h-3 text-slate-400" />
                  <select
                    value={selectedRegionFilter}
                    onChange={(e) => setSelectedRegionFilter(e.target.value)}
                    className="pl-7 pr-4 py-2 border border-slate-150 rounded-xl text-xs font-bold bg-white text-slate-700 focus:outline-hidden"
                  >
                    <option value="all">{lang === "ar" ? "كل الأقاليم" : "All regions"}</option>
                    <option value="sahara">{lang === "ar" ? "الصحراء الكبرى" : "Sahara desert"}</option>
                    <option value="coast">{lang === "ar" ? "الشريط الساحلي" : "Coastline"}</option>
                    <option value="highlands">{lang === "ar" ? "المرتفعات والأوراس" : "Highlands"}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Festivals List */}
            {filteredFestivals.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-150">
                <Calendar className="w-8 h-8 mx-auto text-slate-350 stroke-1 mb-2 animate-pulse" />
                <p className="text-xs font-bold">
                  {lang === "ar" ? "لا توجد مهرجانات مطابقة للبحث حالياً لهذا الفصل" : "No celebrations found matching constraints for this season"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredFestivals.map((fest) => (
                  <motion.div
                    key={fest.id}
                    layoutId={fest.id}
                    className="group border border-slate-100 hover:border-indigo-150 rounded-2xl p-4 bg-slate-50/40 hover:bg-white hover:shadow-xs transition-all duration-200 flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md text-white bg-gradient-to-r ${fest.imageTheme}`}>
                          {lang === "ar" ? fest.tagAr : fest.tagEn}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleNotificationSubscription(
                                fest.id,
                                lang === "ar" ? fest.titleAr : fest.titleEn,
                                lang === "ar" ? `مستعد لزيارة ${fest.locationAr}؟ ينطلق مهرجان "${fest.titleAr}" قريباً! يرجى الاستعداد بالبروتوكول الصحي ونقاط الزيارة.` : `Your trek to ${fest.locationEn} is on alert! "${fest.titleEn}" begins soon. Refresh your packing lists and health sprays.`,
                                "festival"
                              );
                            }}
                            className={`px-2 py-1 rounded-md text-[9px] font-black flex items-center gap-1 cursor-pointer transition-all ${
                              subscribedNotifications.includes(fest.id)
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200/40"
                            }`}
                            title={lang === "ar" ? "تفعيل التنبيهات" : "Get Notified"}
                          >
                            <Bell className={`w-2.5 h-2.5 ${subscribedNotifications.includes(fest.id) ? "fill-amber-500 text-amber-700 animate-pulse" : ""}`} />
                            <span>
                              {subscribedNotifications.includes(fest.id)
                                ? (lang === "ar" ? "تنبيه نشط" : "Alert On")
                                : (lang === "ar" ? "نبهني" : "Notify")}
                            </span>
                          </button>
                          <span className="text-[10px] text-indigo-600 font-extrabold flex items-center gap-1 shrink-0">
                            <Calendar className="w-3 h-3" />
                            {lang === "ar" ? fest.monthAr : fest.monthEn}
                          </span>
                        </div>
                      </div>
                      <h3 className="font-extrabold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                        {lang === "ar" ? fest.titleAr : fest.titleEn}
                      </h3>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-350" />
                        <span>{lang === "ar" ? fest.locationAr : fest.locationEn}</span>
                      </div>
                      <p className="text-slate-500 text-[11px] font-medium leading-relaxed">
                        {lang === "ar" ? fest.descAr : fest.descEn}
                      </p>
                    </div>

                    <div className="border-t border-slate-50 pt-2.5 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-semibold uppercase">
                        FOS7A • {fest.season.toUpperCase()} CELEBRATION
                      </span>
                      <button
                        onClick={() => {
                          showToast(lang === "ar" ? `تم تحديث المخطط بالمهرجان: ${fest.titleAr}` : `Injected ${fest.titleEn} into memory!`);
                        }}
                        className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Heart className="w-3 h-3 text-indigo-500 fill-indigo-50" />
                        {lang === "ar" ? "إقحام في المخطط" : "Add to Itinerary"}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Local Lifestyle News Column */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-5">
            <h2 className="text-base md:text-lg font-black text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              {lang === "ar" ? "عمود السياحة الإيكولوجية وأخبار المنطقة" : "Socio-Ecological News & Regional Travel Column"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {newsColumnData.map((card) => {
                const isSaved = bookmarkedNews.includes(card.id);
                return (
                  <div
                    key={card.id}
                    className="border border-slate-100 hover:border-slate-250 rounded-2xl p-4 bg-white hover:shadow-2xs transition-all flex flex-col justify-between space-y-3 cursor-pointer"
                    onClick={() => setActiveNewsModal(card)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[9px] font-bold">
                        <span className={`px-2 py-0.5 rounded-full ${card.colorClass}`}>
                          {lang === "ar" ? card.categoryAr : card.categoryEn}
                        </span>
                        <span className="text-slate-400">{lang === "ar" ? card.dateAr : card.dateEn}</span>
                      </div>
                      <h3 className="font-extrabold text-slate-800 text-xs line-clamp-2 leading-snug">
                        {lang === "ar" ? card.titleAr : card.titleEn}
                      </h3>
                      <p className="text-slate-500 text-[10.5px] font-medium leading-relaxed line-clamp-3">
                        {lang === "ar" ? card.excerptAr : card.excerptEn}
                      </p>
                    </div>

                    <div className="border-t border-slate-50 pt-2 flex items-center justify-between text-[10.5px] font-bold">
                      <span className="text-slate-400 font-mono text-[9px]">
                        {lang === "ar" ? card.readTimeAr : card.readTimeEn}
                      </span>
                      <div className="flex items-center gap-1.55">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleNotificationSubscription(
                              card.id,
                              lang === "ar" ? card.titleAr : card.titleEn,
                              lang === "ar" ? `مستجدات بيئية: ${card.excerptAr}` : `Sustainable eco-safari updates: ${card.excerptEn}`,
                              "news"
                            );
                          }}
                          className={`p-1 rounded-sm transition-colors cursor-pointer ${
                            subscribedNotifications.includes(card.id) ? "text-amber-600 bg-amber-50" : "text-slate-400 hover:text-amber-500 hover:bg-slate-50"
                          }`}
                          title={lang === "ar" ? "تفعيل التنبيهات للأخبار" : "Get News Alerts"}
                        >
                          <Bell className={`w-3.5 h-3.5 ${subscribedNotifications.includes(card.id) ? "fill-amber-500 text-amber-500 animate-pulse" : ""}`} />
                        </button>
                        <button
                          onClick={(e) => handleToggleBookmark(card.id, e)}
                          className="p-1 rounded-sm text-slate-400 hover:text-rose-500 hover:bg-slate-50 transition-colors"
                          title="Bookmark"
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "text-rose-500 fill-rose-500" : ""}`} />
                        </button>
                        <button
                          onClick={(e) => handleShareArticle(card, e)}
                          className="p-1 rounded-sm text-slate-400 hover:text-indigo-500 hover:bg-slate-50 transition-colors"
                          title="Share"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT PANEL: Seasonal Health & Beauty Advisor */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-white rounded-2xl border border-slate-100 p-5 md:p-6 shadow-xs space-y-4">
            
            {/* Header & Logo with dynamic theme decoration */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${
                  selectedSeason === "spring" ? "bg-amber-50 border-amber-100 text-amber-600" :
                  selectedSeason === "summer" ? "bg-teal-50 border-teal-100 text-teal-600" :
                  selectedSeason === "autumn" ? "bg-indigo-50 border-indigo-100 text-indigo-600" :
                  "bg-emerald-50 border-emerald-150 text-emerald-600"
                }`}>
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                    {lang === "ar" ? "استشارات العناية بالمظهر والصحة" : "Traveler Wellness Protocol"}
                  </span>
                  <h2 className="text-sm font-black text-slate-800">
                    {lang === "ar" ? "نصائح الصحة والجمال" : "Seasonal Health & Beauty"}
                  </h2>
                </div>
              </div>

              {/* Health/Beauty workshop subscriber toggle */}
              <button
                onClick={() => {
                  handleToggleNotificationSubscription(
                    `health-workshop-${selectedSeason}`,
                    lang === "ar" ? `ورشة عمل الصحة والجمال لـ ${selectedSeason === "spring" ? "الربيع" : selectedSeason === "summer" ? "الصيف" : selectedSeason === "autumn" ? "الخريف" : "الشتاء"}` : `${selectedSeason.toUpperCase()} Wellness Seminar details`,
                    lang === "ar" ? `مستعد للورشة؟ سنتعلم كيفية تركيب مقشرات طبيعية بمستخلص الورد التارقي ومراهم غبار الأوراس!` : `Learn natural rose water balance, eucalyptus steam recipes, and mountain hydration sunscreen protocols.`,
                    "health"
                  );
                }}
                className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                  subscribedNotifications.includes(`health-workshop-${selectedSeason}`)
                    ? "bg-amber-50 border-amber-200 text-amber-700 font-extrabold"
                    : "bg-slate-50 border-slate-150 text-slate-500 hover:text-slate-700"
                }`}
                title={lang === "ar" ? "تنبيهات ورش العمل" : "Workshop Alerts"}
              >
                <Bell className={`w-3.5 h-3.5 ${subscribedNotifications.includes(`health-workshop-${selectedSeason}`) ? "fill-amber-500 text-amber-600 animate-bounce" : ""}`} />
                <span className="text-[10px] hidden sm:inline font-bold">
                  {subscribedNotifications.includes(`health-workshop-${selectedSeason}`) ? (lang === "ar" ? "مشترك" : "Subscribed") : (lang === "ar" ? "تابع" : "Notify")}
                </span>
              </button>
            </div>

            {/* Sub advisory headline */}
            <div className={`p-3.5 rounded-xl border text-[11px] font-semibold leading-relaxed ${
              selectedSeason === "spring" ? "bg-amber-50/50 border-amber-100/40 text-amber-900" :
              selectedSeason === "summer" ? "bg-cyan-50/50 border-cyan-100/40 text-cyan-950" :
              selectedSeason === "autumn" ? "bg-indigo-50/50 border-indigo-100/40 text-indigo-900" :
              "bg-emerald-50/50 border-emerald-100/40 text-emerald-950"
            }`}>
              <h3 className="font-extrabold text-xs mb-1">
                {lang === "ar" ? activeAdvisor.titleAr : activeAdvisor.titleEn}
              </h3>
              <p className="opacity-95">
                {lang === "ar" ? activeAdvisor.descAr : activeAdvisor.descEn}
              </p>
            </div>

            {/* List of custom seasonal tips */}
            <div className="space-y-3.5 pt-1">
              {(lang === "ar" ? activeAdvisor.tipsAr : activeAdvisor.tipsEn).map((tip, index) => {
                const parts = tip.split(":");
                const boldPart = parts[0];
                const textPart = parts.slice(1).join(":");
                return (
                  <div key={index} className="flex gap-2.5 items-start text-xs text-slate-600">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 flex items-center justify-center ${
                      selectedSeason === "spring" ? "bg-amber-500" :
                      selectedSeason === "summer" ? "bg-teal-500" :
                      selectedSeason === "autumn" ? "bg-indigo-500" :
                      "bg-emerald-600"
                    }`} />
                    <div className="leading-relaxed font-semibold">
                      {boldPart && (
                        <span className="font-extrabold text-slate-800">
                          {boldPart}:
                        </span>
                      )}
                      <span> {textPart || boldPart}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interactive checkmark module */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150/50 space-y-2.5 text-xs">
              <h4 className="font-extrabold text-slate-800">
                {lang === "ar" ? "شيك ليس السلوكيات الصحية لرحلتك:" : "Verify Travel Wellness Checklist:"}
              </h4>
              {[
                { 
                  ar: "حقيبة السفر مزودة بواقيات مرطبات البشرة وشاش شتوي أو مراهم شمسية.", 
                  en: "Toiletry kit equipped with UV shields, thermal sprays or cold creams." 
                },
                { 
                  ar: "مطارة مياه متنقلة حافظة للبرودة والحرارة لضمان الترطيب.", 
                  en: "Insulated thermo flask to preserve clean drinking water temperatures." 
                },
                { 
                  ar: "قبعة واقية عريضة للرأس من أشعة شمس الظهيرة أو وشاح صحراوي قطني طويل (شاش/حايك) لعزل حرارة الرأس وحماية منابت الشعر وعروق الرقبة.", 
                  en: "Sun hat or classic cotton desert scarf (Cheche) for UV and head heat protection." 
                }
              ].map((c, i) => (
                <label key={i} className="flex items-start gap-2 cursor-pointer text-slate-500 select-none">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 rounded-sm text-indigo-600 border-slate-300 mt-0.5"
                  />
                  <span className="font-semibold leading-snug">{lang === "ar" ? c.ar : c.en}</span>
                </label>
              ))}
            </div>

            {/* Small local wisdom footer block */}
            <div className="text-center text-[10px] text-slate-400 font-bold italic pt-2 pb-0.5">
              {lang === "ar" 
                ? "« العقل السليم في الجسم السليم أثناء الكشف عن معالم التراث الجزائري المديد »"
                : "« Health and visual beauty align when traversing the spectacular Algerian heritage corridors »"}
            </div>

          </div>

          {/* New Panel: Wellness & Beauty Insights */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 md:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-50">
              <Sparkles className="w-5 h-5 text-rose-500 animate-pulse" />
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                  {lang === "ar" ? "بروتوكول موائمة مناخ الوجهة" : "Destination Climate Adaptation"}
                </span>
                <h3 className="text-sm font-black text-slate-800">
                  {lang === "ar" ? "استشارات الجمال وعناية المناخ" : "Wellness & Beauty Insights"}
                </h3>
              </div>
            </div>

            {/* Target Destination & Manual Tester Override */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>{lang === "ar" ? "الوجهة النشطة حالياً:" : "Current Target Destination:"}</span>
                <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md text-[10px]">
                  {climateCityOverride ? (lang === "ar" ? "محاكاة مخصصة" : "Manual Override") : (lang === "ar" ? "الرصد الذكي" : "Auto Detected")}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-150/40">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-xs font-extrabold text-slate-700 capitalize">
                  {activeCity}
                </span>
                <span className="text-slate-300 mx-1">|</span>
                <div className="text-[10.5px] font-semibold text-slate-500 leading-none truncate">
                  {lang === "ar" ? "المناخ:" : "Climate:"} <strong className="text-indigo-600 font-extrabold">{lang === "ar" ? climateObj.nameAr : climateObj.nameEn}</strong>
                </div>
              </div>

              {/* Climate Switcher for Testing */}
              <div className="pt-1">
                <p className="text-[10px] text-slate-400 font-extrabold mb-1.5 uppercase tracking-wide">
                  {lang === "ar" ? "اختبر مناخات المدن الأخرى مسبقاً:" : "Test Predefined Climates:"}
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { key: "Algiers", labelAr: "الجزائر (رطوبة ساحلية)", labelEn: "Algiers (Humid)" },
                    { key: "Ghardaia", labelAr: "غرداية (صحراء جافة)", labelEn: "Ghardaia (Arid)" },
                    { key: "Constantine", labelAr: "قسنطينة (برد جبلي)", labelEn: "Constantine (Cold)" }
                  ].map((preset) => {
                    const isSelected = activeCity.toLowerCase().includes(preset.key.toLowerCase());
                    return (
                      <button
                        key={preset.key}
                        onClick={() => {
                          setClimateCityOverride(preset.key);
                          showToast(lang === "ar" ? `🔄 تم تحويل المناخ لـ ${preset.labelAr}` : `🔄 Presetted climate to ${preset.labelEn}`);
                        }}
                        className={`py-1 px-1.5 text-[9.5px] font-bold rounded-lg border transition-all cursor-pointer text-center ${
                          isSelected 
                            ? "bg-indigo-600 text-white border-indigo-500 shadow-xs" 
                            : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {lang === "ar" ? preset.labelAr.split(" ")[0] : preset.labelEn.split(" ")[0]}
                      </button>
                    );
                  })}
                </div>
                {climateCityOverride && (
                  <button
                    onClick={() => {
                      setClimateCityOverride("");
                      showToast(lang === "ar" ? "🔄 تمت العودة للوجهة المفروضة تلقائياً" : "🔄 Reverted to auto itinerary target");
                    }}
                    className="mt-1 text-[9px] text-slate-400 hover:text-slate-600 font-bold underline block cursor-pointer"
                  >
                    {lang === "ar" ? "إلغاء المحاكاة والعودة لرحلتي" : "Reset simulated override"}
                  </button>
                )}
              </div>
            </div>

            {/* Climate details descriptive banner */}
            <div className="bg-gradient-to-r from-rose-50/50 to-orange-50/40 border border-orange-100/30 rounded-xl p-3 text-[11px] font-semibold text-slate-700 leading-relaxed">
              <span className="font-extrabold text-orange-700 block mb-0.5">
                {lang === "ar" ? "طبيعة بيئة المناخ:" : "Atmospheric Profile:"}
              </span>
              {lang === "ar" ? climateObj.detailsAr : climateObj.detailsEn}
            </div>

            {/* Micro Hydration Care Score Calculator Dashboard */}
            <div className="bg-slate-50 p-4 border border-slate-150/40 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>{lang === "ar" ? "مؤشر الرطوبة/الجفاف المتوقع:" : "Simulated Care Meter:"}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  climateObj.id === "desert" ? "bg-amber-100 text-amber-800 animate-pulse" :
                  climateObj.id === "coastal" ? "bg-teal-100 text-teal-800" :
                  "bg-blue-100 text-blue-800"
                }`}>
                  {climateObj.id === "desert" ? (lang === "ar" ? "جفاف حاد 85%" : "Sahara Dryness 85%") :
                   climateObj.id === "coastal" ? (lang === "ar" ? "رطوبة دهنية 90%" : "Coastal Humidity 90%") :
                   (lang === "ar" ? "قرصة برد 75%" : "Mountain Frost 75%")}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    climateObj.id === "desert" ? "bg-amber-500 w-[85%]" :
                    climateObj.id === "coastal" ? "bg-teal-500 w-[90%]" :
                    "bg-blue-500 w-[75%]"
                  }`} 
                />
              </div>
              <p className="text-[10px] leading-normal text-slate-500 font-semibold italic">
                {climateObj.id === "desert" ? 
                  (lang === "ar" ? "📌 ينصح بـ: دهونات شمعية دهنية، واقي SPF 50+ وبخاخ مائي لتبريد الوجه الشديد." : "📌 Recommendation: Beeswax/oil coatings, broad-spectrum SPF 50+, and recurrent rosewater sweeps.") :
                 climateObj.id === "coastal" ? 
                  (lang === "ar" ? "📌 ينصح بـ: تغذية مائية خفيفة، تونر إكليل الجبل لمنع تجعد الشعر وغسل رواسب ملح البحر." : "📌 Recommendation: Ultra-lightweight moisture, rosemary frizz defense, and fresh chamomile rinses.") :
                  (lang === "ar" ? "📌 ينصح بـ: زبدة الشيا ضد الصقيع، تغطية الرأس بشاش صوفي، ومشروب الزعتر الشافي للمناعة." : "📌 Recommendation: Whipped shea butter layer, wool woolen scarf wraps, and hot wild thyme internal teas.")}
              </p>
            </div>

            {/* Climate Specific Curated Care Tips */}
            <div className="space-y-3 pt-1">
              <h4 className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                {lang === "ar" ? "توصيات الجمال المتخصصة بالموقع:" : "Tailored Climate Care Tips:"}
              </h4>
              <div className="space-y-2.5">
                {climateCareTipsData[climateObj.id].map((tip, idx) => (
                  <div key={idx} className="border border-slate-100 hover:border-slate-200/50 p-3 rounded-xl bg-slate-50/30 hover:bg-white hover:shadow-3xs transition-all space-y-1">
                    <h5 className="font-extrabold text-slate-800 text-[11.5px] leading-tight">
                      {lang === "ar" ? tip.titleAr : tip.titleEn}
                    </h5>
                    <p className="text-slate-500 text-[10.5px] leading-relaxed">
                      {lang === "ar" ? tip.descAr : tip.descEn}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick action: Workshop seminar reminder trigger */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-400">
                {lang === "ar" ? "هل ترغب بتعلم دمج مراهم المناخ?" : "Want to attend bioclimatic workshops?"}
              </span>
              <button
                onClick={() => {
                  handleToggleNotificationSubscription(
                    `beauty-seminar-${climateObj.id}`,
                    lang === "ar" ? `ورشة عمل كيمياء الجمال لـ ${climateObj.id === "desert" ? "الصحراء" : climateObj.id === "coastal" ? "الساحل" : "المرتفعات"}` : `${climateObj.id.toUpperCase()} Bioclimatic Cosmetics Seminar`,
                    lang === "ar" ? `ورشة عمل محاكاة حية لصناعة واقيات ومراهم من الصبار، زيت الأرغان، ومطهرات رملية تفاعلية للطقس الحاد!` : `A simulated masterclass demonstrating customized cosmetic blends for severe atmospheric shifts. Get ready!`,
                    "health"
                  );
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-extrabold transition-all cursor-pointer ${
                  subscribedNotifications.includes(`beauty-seminar-${climateObj.id}`)
                    ? "bg-amber-600 text-white border-amber-500 hover:bg-amber-700 font-extrabold"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                <Bell className={`w-3 h-3 ${subscribedNotifications.includes(`beauty-seminar-${climateObj.id}`) ? "fill-amber-200" : ""}`} />
                <span>
                  {subscribedNotifications.includes(`beauty-seminar-${climateObj.id}`)
                    ? (lang === "ar" ? "تم الاشتراك" : "Subscribed")
                    : (lang === "ar" ? "نبهني بالورشة" : "Get Notified")}
                </span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* FULL-SCREEN DETAIL NEWS MODAL */}
      <AnimatePresence>
        {activeNewsModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 border border-slate-100 shadow-2xl relative"
            >
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${activeNewsModal.colorClass}`}>
                    {lang === "ar" ? activeNewsModal.categoryAr : activeNewsModal.categoryEn}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-lg md:text-xl">
                    {lang === "ar" ? activeNewsModal.titleAr : activeNewsModal.titleEn}
                  </h3>
                  <div className="text-[10px] font-bold text-slate-400">
                    {lang === "ar" ? activeNewsModal.dateAr : activeNewsModal.dateEn} • {lang === "ar" ? activeNewsModal.readTimeAr : activeNewsModal.readTimeEn}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveNewsModal(null)}
                  className="p-1 px-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-base font-extrabold"
                >
                  ✕
                </button>
              </div>

              <div className="text-slate-600 text-sm leading-relaxed font-semibold space-y-4">
                <p className="bg-slate-50/80 p-4 border @s s border-dashed border-slate-150 rounded-xl">
                  {lang === "ar" ? activeNewsModal.excerptAr : activeNewsModal.excerptEn}
                </p>
                <div className="whitespace-pre-line text-slate-700">
                  {lang === "ar" ? activeNewsModal.bodyAr : activeNewsModal.bodyEn}
                </div>
              </div>

              <div className="border-t border-slate-50 pt-4 flex justify-between items-center text-xs">
                <span className="text-[10px] font-black tracking-wider text-slate-400">
                  FOS7A TRAVEL CLUB PRESS • LIFESTYLE
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      handleToggleBookmark(activeNewsModal.id, e);
                    }}
                    className="p-2 px-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded-xl font-bold flex items-center gap-1 text-slate-700 cursor-pointer"
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${bookmarkedNews.includes(activeNewsModal.id) ? "text-rose-500 fill-rose-500" : ""}`} />
                    <span>{lang === "ar" ? "حفظ" : "Bookmark"}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      handleShareArticle(activeNewsModal, e);
                    }}
                    className="p-2 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{lang === "ar" ? "مشاركة" : "Share article"}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
