/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Maps a destination name or country to an inspiring, high-quality landscape image.
 * Uses curated, high-contrast Unsplash nature/landmark URLs as primaries, 
 * with a dynamic seed fallback that renders a beautiful unique travel scene for any location.
 */
export function getDestinationHeaderImage(destination: string, country: string): string {
  const destLower = (destination || "").toLowerCase();
  const countryLower = (country || "").toLowerCase();

  // Constantine (Algeria) - Stunning canyon suspension bridges / cliffs
  if (
    destLower.includes("constantine") || 
    destLower.includes("قسنطينة") || 
    destLower.includes("كونستانتين")
  ) {
    return "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80";
  }
  
  // Algiers (Algeria) - Notre Dame d'Afrique, sea view, whitewashed architectures
  if (
    destLower.includes("algiers") || 
    destLower.includes("الجزائر العاصمة") || 
    destLower.includes("البهجة") ||
    destLower.includes("algérois")
  ) {
    return "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80";
  }

  // Desert / Sahara (Djanet, Taghit, Tamanrasset, Ghardaia, Timimoun, etc.)
  if (
    destLower.includes("ghardaia") || destLower.includes("غرداية") ||
    destLower.includes("djanet") || destLower.includes("جانت") ||
    destLower.includes("taghit") || destLower.includes("تاغيت") ||
    destLower.includes("sahara") || destLower.includes("desert") || destLower.includes("صحراء") ||
    destLower.includes("tamanrasset") || destLower.includes("تمنراست") ||
    destLower.includes("adrar") || destLower.includes("أدرار") ||
    destLower.includes("timimoun") || destLower.includes("تيميمون") ||
    destLower.includes("bechar") || destLower.includes("بشار") ||
    destLower.includes("ouargla") || destLower.includes("ورقلة") ||
    destLower.includes("touggourt") || destLower.includes("تقرت") ||
    countryLower.includes("algeria") && (destLower.includes("sud") || destLower.includes("جنوب"))
  ) {
    return "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80";
  }

  // Coastal places (Oran, Bejaia, Jijel, Annaba, Skikda, Mostaganem, Tipaza)
  if (
    destLower.includes("oran") || destLower.includes("وهران") ||
    destLower.includes("bejaia") || destLower.includes("بجاية") ||
    destLower.includes("jijel") || destLower.includes("جيجل") ||
    destLower.includes("annaba") || destLower.includes("عنابة") ||
    destLower.includes("skikda") || destLower.includes("سكيكدة") ||
    destLower.includes("mostaganem") || destLower.includes("مستغانم") ||
    destLower.includes("tipaza") || destLower.includes("تيبازة") ||
    destLower.includes("sea") || destLower.includes("beach") || destLower.includes("بحر") || destLower.includes("شاطئ")
  ) {
    return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80";
  }

  // Tlemcen (Algeria) - Historic ruins / Andalusian aesthetics
  if (destLower.includes("tlemcen") || destLower.includes("تلمسان")) {
    return "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80";
  }

  // Paris / France
  if (
    destLower.includes("paris") || 
    destLower.includes("باريس") || 
    countryLower.includes("france") || 
    countryLower.includes("فرنسا")
  ) {
    return "https://images.unsplash.com/photo-1499856871958-5b9647a64060?auto=format&fit=crop&w=1200&q=80";
  }

  // London / UK
  if (
    destLower.includes("london") || 
    destLower.includes("لندن") || 
    countryLower.includes("united kingdom") || 
    countryLower.includes("uk") ||
    countryLower.includes("بريطانيا")
  ) {
    return "https://images.unsplash.com/photo-1513635269975-59663e0ca1ad?auto=format&fit=crop&w=1200&q=80";
  }

  // Rome / Italy
  if (
    destLower.includes("rome") || 
    destLower.includes("روما") || 
    destLower.includes("venice") ||
    destLower.includes("فلورنسا") ||
    countryLower.includes("italy") || 
    countryLower.includes("إيطاليا")
  ) {
    return "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80";
  }

  // Istanbul / Turkey
  if (
    destLower.includes("istanbul") || 
    destLower.includes("اسطنبول") || 
    countryLower.includes("turkey") || 
    countryLower.includes("تركيا")
  ) {
    return "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1200&q=80";
  }

  // Dubai / UAE
  if (
    destLower.includes("dubai") || 
    destLower.includes("دبي") || 
    countryLower.includes("emirates") || 
    countryLower.includes("الإمارات") ||
    countryLower.includes("dubai")
  ) {
    return "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80";
  }

  // Saudi Arabia / Holy Sites
  if (
    destLower.includes("makkah") || destLower.includes("مكة") || 
    destLower.includes("madinah") || destLower.includes("المدينة") || 
    countryLower.includes("saudi") || countryLower.includes("السعودية")
  ) {
    return "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=1200&q=80";
  }

  // Tokyo / Japan
  if (
    destLower.includes("tokyo") || 
    destLower.includes("طوكيو") || 
    countryLower.includes("japan") || 
    countryLower.includes("اليابان")
  ) {
    return "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80";
  }

  // General Scenic Travel default (vintage compass, maps, exploration roadtrip)
  return `https://picsum.photos/seed/${encodeURIComponent(destination || "scenic")}/1200/500`;
}
