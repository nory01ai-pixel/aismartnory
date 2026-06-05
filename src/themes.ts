export interface ThemeConfig {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  seasonAr: string;
  seasonEn: string;
  primaryColor: string;
  bgColor: string;
  descriptionAr: string;
  descriptionEn: string;
}

export interface RegionalOverlay {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  regionAr: string;
  regionEn: string;
  cssClass: string;
  descriptionAr: string;
  descriptionEn: string;
}

export const themes: ThemeConfig[] = [
  {
    id: "autumn",
    nameAr: "الخريف الهادئ الكلاسيكي",
    nameEn: "Autumn Classic Slate",
    icon: "🍂",
    seasonAr: "الخريف / الافتراضي",
    seasonEn: "Autumn / Default",
    primaryColor: "#4f46e5", // Indigo-600
    bgColor: "#f8fafc",
    descriptionAr: "ثيم النبلاء الأزرق الهادئ بروح التفكير والهدوء الخريفي.",
    descriptionEn: "Quiet indigo and slate tones reflecting reflective thinking and classical elegance."
  },
  {
    id: "spring",
    nameAr: "الربيع الذهبي الصحراوي",
    nameEn: "Sahara Golden Spring",
    icon: "☀️",
    seasonAr: "الربيع / الواحات",
    seasonEn: "Spring / Oasis",
    primaryColor: "#d97706", // Amber-600
    bgColor: "#fefdfa",
    descriptionAr: "يرمز للون كثبان رمال غرداية الذهبية وتراث متليلي الشعانبة الأصيل في فصل الربيع.",
    descriptionEn: "Warm golden saffron sands reflecting the stunning dunes of Ghardaia and the sun of Metlili."
  },
  {
    id: "summer",
    nameAr: "الصيف المتوسطي الأزرق",
    nameEn: "Mediterranean Summer",
    icon: "🌊",
    seasonAr: "الصيف / الساحل",
    seasonEn: "Summer / Seaside",
    primaryColor: "#0d9488", // Teal-600
    bgColor: "#f0fdfa",
    descriptionAr: "مستوحى من شواطئ الجزائر الفيروزية الساحرة ونسيم البحر الأبيض المتوسط المتجدد.",
    descriptionEn: "Turquoise ocean breeze reflecting the scenic, sunlit coastlines of Algiers and Oran."
  },
  {
    id: "winter",
    nameAr: "الشتاء الجبلي الكابلي",
    nameEn: "Mountain Kabylie Winter",
    icon: "🌲",
    seasonAr: "الشتاء / الغابات",
    seasonEn: "Winter / Pine Peaks",
    primaryColor: "#059669", // Emerald-600
    bgColor: "#f0fdf4",
    descriptionAr: "مستوحى من جبال جرجرة الخضراء المكللة بالثلوج وغابات الأرز الأطلسي العريقة.",
    descriptionEn: "Lush evergreen pine and sage woodland colors capture the majestic cedar peaks of Djurdjura."
  },
  {
    id: "festive",
    nameAr: "عيد الثورة والأعياد الوطنية",
    nameEn: "Patriotic Revolution Festive",
    icon: "🇩🇿",
    seasonAr: "المناسبات الوطنية / الأعياد",
    seasonEn: "Festivity / Celebrations",
    primaryColor: "#dc2626", // Red-600
    bgColor: "#fafdf7",
    descriptionAr: "ثيم أحمر وأخضر وطني رمزي للاحتفاء بمهد الثورات وبطولات الشعب الجزائري العظيم.",
    descriptionEn: "Algerian banner tones-vibrant emerald green and crimson red celebrating local freedom and folk heritage."
  }
];

export const regionalBackgrounds: RegionalOverlay[] = [
  {
    id: "none",
    nameAr: "بدون خلفية إضافية (خفيفة جداً)",
    nameEn: "Clean Minimal View",
    icon: "✨",
    regionAr: "افتراضي",
    regionEn: "Default View",
    cssClass: "bg-overlay-none",
    descriptionAr: "خلفية نظيفة وناعمة خالية من الزخرفة لضمان أقصى درجات التركيز وقراءة سهلة.",
    descriptionEn: "Smooth, undisturbed blank background for pristine content clarity."
  },
  {
    id: "dunes",
    nameAr: "تموجات الكثبان الذهبية (الشعانبة وغرداية)",
    nameEn: "Desert Dunes Ripple (Metlili & Ghardaia)",
    icon: "🏜️",
    regionAr: "شمال الصحراء والواحات",
    regionEn: "Sahara Oasis Regions",
    cssClass: "bg-overlay-dunes",
    descriptionAr: "تموجات خطية ترمز لرمال متليلي الشعانبة العريقة وكثبان وادي ميزاب الخالدة.",
    descriptionEn: "Warm wavy contours reminiscent of Ghardaia oases and Sahara heritage trails."
  },
  {
    id: "mosaic",
    nameAr: "فسيفساء الزخرفة الأندلسية (قصبة الجزائر)",
    nameEn: "Andalusian Casbah Mosaic Tiles",
    icon: "🕌",
    regionAr: "الجزائر العاصمة والمدن العتيقة",
    regionEn: "Algiers & Historic Casbahs",
    cssClass: "bg-overlay-mosaic",
    descriptionAr: "نقوش هندسية دقيقة من وحي القصور العاصمية والفسيفساء الزليجية الإسلامية العتيقة.",
    descriptionEn: "Delicate geometric star patterns echoing Algiers historic tile arts and archways."
  },
  {
    id: "kabyle",
    nameAr: "نساج الحلية الأمازيغية (القبائل الأوراس والجرجرة)",
    nameEn: "Berber Tribe Geometric Loom",
    icon: "🔱",
    regionAr: "مرتفعات القبائل والأوراس",
    regionEn: "Kabylie Alpine Peaks",
    cssClass: "bg-overlay-kabyle",
    descriptionAr: "زخارف مثلثة منقوشة ترمز للفضة القبائلية والنساج الصوفي التقليدي العريق (الفوطة).",
    descriptionEn: "Authentic triangular and diamond structures inspired by heritage silver-smithing."
  },
  {
    id: "tassili",
    nameAr: "نقوش حجر التاسيلي الأثرية والنجوم",
    nameEn: "Prehistoric Tassili Caves & Stars",
    icon: "🌌",
    regionAr: "الهقار والطاسيلي (أقاصي الجنوب)",
    regionEn: "Deep Hoggar & Desert Trails",
    cssClass: "bg-overlay-tassili",
    descriptionAr: "خلفية بلون كوني غامض مع لمسات لرموز النقوش والرسوم الصخرية في كهوف التاسيلي ناجر.",
    descriptionEn: "Magical dark celestial cues honoring the ancient rock-art engravings of prehistoric times."
  }
];
