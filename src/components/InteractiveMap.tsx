/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { Itinerary, FlightMock, HotelMock } from "../types";
import { Compass, MapPin, Plane, Star, ZoomIn, Info } from "lucide-react";

// Ensure Coordinate type is explicitly defined
export interface Coordinate {
  lat: number;
  lng: number;
}

interface InteractiveMapProps {
  lang: "ar" | "en";
  destinationName: string;
  country: string;
  originName?: string;
  flights: FlightMock[];
  hotels: HotelMock[];
  selectedFlight: FlightMock | null;
  selectedHotel: HotelMock | null;
  onSelectFlight?: (flight: FlightMock) => void;
  onSelectHotel?: (hotel: HotelMock) => void;
  transitMode?: string;
}

// Deterministic coordinate lookup & generator
export function resolveCoordinates(cityName: string, countryName: string): Coordinate {
  const city = (cityName || "").toLowerCase().trim();
  const country = (countryName || "").toLowerCase().trim();

  // Selected major tourism cities (and fallbacks)
  if (city.includes("constantine") || city.includes("قسنطينة") || city.includes("كونستانتين")) {
    return { lat: 36.365, lng: 6.6147 };
  }
  if (city.includes("algiers") || city.includes("الجزائر العاصمة") || city.includes("البهجة")) {
    return { lat: 36.7538, lng: 3.0588 };
  }
  if (city.includes("ghardaia") || city.includes("غرداية")) {
    return { lat: 32.4909, lng: 3.6738 };
  }
  if (city.includes("djanet") || city.includes("جانت")) {
    return { lat: 24.555, lng: 9.485 };
  }
  if (city.includes("taghit") || city.includes("تاغيت")) {
    return { lat: 30.9167, lng: -2.0333 };
  }
  if (city.includes("oran") || city.includes("وهران")) {
    return { lat: 35.6971, lng: -0.6308 };
  }
  if (city.includes("bejaia") || city.includes("بجاية")) {
    return { lat: 36.7511, lng: 5.0567 };
  }
  if (city.includes("jijel") || city.includes("جيجل")) {
    return { lat: 36.8122, lng: 5.766 };
  }
  if (city.includes("annaba") || city.includes("عنابة")) {
    return { lat: 36.9000, lng: 7.7667 };
  }
  if (city.includes("tlemcen") || city.includes("تلمسان")) {
    return { lat: 34.8783, lng: -1.315 };
  }
  if (city.includes("paris") || city.includes("باريس")) {
    return { lat: 48.8566, lng: 2.3522 };
  }
  if (city.includes("london") || city.includes("لندن")) {
    return { lat: 51.5074, lng: -0.1278 };
  }
  if (city.includes("rome") || city.includes("روما")) {
    return { lat: 41.9028, lng: 12.4964 };
  }
  if (city.includes("istanbul") || city.includes("اسطنبول")) {
    return { lat: 41.0082, lng: 28.9784 };
  }
  if (city.includes("dubai") || city.includes("دبي")) {
    return { lat: 25.2048, lng: 55.2708 };
  }
  if (city.includes("tokyo") || city.includes("طوكيو")) {
    return { lat: 35.6762, lng: 139.6503 };
  }
  if (city.includes("makkah") || city.includes("مكة")) {
    return { lat: 21.4225, lng: 39.8262 };
  }
  if (city.includes("madinah") || city.includes("المدينة")) {
    return { lat: 24.4672, lng: 39.6112 };
  }

  // Fallback hash function
  let hash = 0;
  const combined = city + country;
  for (let i = 0; i < combined.length; i++) {
    hash = combined.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate within standard bounds around northern hemisphere & Mediterranean
  const lat = 20 + Math.abs(hash % 30); // 20 - 50 deg north
  const lng = -10 + Math.abs((hash >> 3) % 70); // -10 - 60 deg east

  return { lat, lng };
}

export interface Stopover {
  name: string;
  lat: number;
  lng: number;
  desc: string;
  type: string;
}

export const modeConfigs: { [key: string]: { color: string; weight: number; dashArray?: string; labelAr: string; labelEn: string; icon: string } } = {
  Plane: {
    color: "#4f46e5", // Indigo
    weight: 3,
    dashArray: "8, 6",
    labelAr: "مسار الرحلة الجوية",
    labelEn: "Outbound Flight Path",
    icon: "✈️"
  },
  Car: {
    color: "#10b981", // Emerald Green
    weight: 4,
    labelAr: "طريق بري سريع (السيار)",
    labelEn: "Overland Highway Route",
    icon: "🚗"
  },
  Taxi: {
    color: "#06b6d4", // Cyan
    weight: 4,
    labelAr: "مسار خدمة سيارات الأجرة المشتركة",
    labelEn: "Taxi Shared Route Corridor",
    icon: "🚖"
  },
  Bus: {
    color: "#f59e0b", // Amber Orange
    weight: 4.5,
    dashArray: "4, 4",
    labelAr: "خط الحافلات السريعة الجهوية",
    labelEn: "Regional Bus Transit Route",
    icon: "🚌"
  },
  Train: {
    color: "#8b5cf6", // Purple Rail
    weight: 4,
    dashArray: "12, 5, 2, 5",
    labelAr: "خط السكة الحديدية السريعة",
    labelEn: "Express Rail Track",
    icon: "🚊"
  }
};

export function getOverlandRoute(origin: Coordinate, dest: Coordinate, mode: string): Coordinate[] {
  const points: Coordinate[] = [origin];
  const count = 8;
  for (let i = 1; i < count; i++) {
    const t = i / count;
    // Linear interpolation
    const lat = origin.lat + (dest.lat - origin.lat) * t;
    const lng = origin.lng + (dest.lng - origin.lng) * t;
    
    // Add deviation to simulate winding roads/rails
    let dev = Math.sin(t * Math.PI) * 0.15;
    if (mode === "Train") {
      dev = Math.sin(t * Math.PI) * 0.05;
    } else if (mode === "Bus") {
      dev = Math.sin(t * Math.PI + 0.3) * 0.18;
    } else {
      dev = Math.sin(t * Math.PI - 0.2) * 0.16;
    }
    
    const dLat = dest.lat - origin.lat;
    const dLng = dest.lng - origin.lng;
    const len = Math.sqrt(dLat * dLat + dLng * dLng) || 1;
    
    // Perpendicular unit vector (-dLng, dLat)
    const pLat = -dLng / len;
    const pLng = dLat / len;
    
    points.push({
      lat: lat + pLat * dev * (dest.lat > origin.lat ? 1 : -1) * (len * 0.25),
      lng: lng + pLng * dev * (dest.lat > origin.lat ? 1 : -1) * (len * 0.25)
    });
  }
  points.push(dest);
  return points;
}

export function getTransitSVG(mode: string, width = 18, height = 18, strokeWidth = 2.5): string {
  switch (mode) {
    case "Plane":
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
        </svg>
      `;
    case "Train":
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="3" width="16" height="14" rx="2"/>
          <path d="M4 11h16"/>
          <path d="M12 3v8"/>
          <path d="M8 17l-3 3"/>
          <path d="M16 17l3 3"/>
        </svg>
      `;
    case "Bus":
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 6V4c0-.6.4-1 1-1h6c.6 0 1 .4 1 1v2"/>
          <rect x="4" y="6" width="16" height="12" rx="2"/>
          <path d="M4 12h16"/>
          <circle cx="8" cy="18" r="2"/>
          <circle cx="16" cy="18" r="2"/>
        </svg>
      `;
    case "Taxi":
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
          <circle cx="7" cy="17" r="2"/>
          <path d="M9 17h6"/>
          <circle cx="17" cy="17" r="2"/>
          <path d="M10 2v3" />
        </svg>
      `;
    case "fuel":
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 22h12M4 22V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v18M14 13h6a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-3"/>
          <path d="M9 6H7v2h2zm10 3a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
        </svg>
      `;
    case "Car":
    default:
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
          <circle cx="7" cy="17" r="2"/>
          <path d="M9 17h6"/>
          <circle cx="17" cy="17" r="2"/>
        </svg>
      `;
  }
}

export default function InteractiveMap({
  lang,
  destinationName,
  country,
  originName = "Algiers",
  flights,
  hotels,
  selectedFlight,
  selectedHotel,
  onSelectFlight,
  onSelectHotel,
  transitMode
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const fitCoordinatesRef = useRef<any[]>([]);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const [localTransitMode, setLocalTransitMode] = useState<string>(transitMode || "Plane");

  const [userGPSCoords, setUserGPSCoords] = useState<Coordinate | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");

  const triggerGPSLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGpsError(lang === "ar" ? "تحديد الموقع الجغرافي للـ GPS غير مدعوم في متصفحك." : "GPS Geolocation is not supported in this browser.");
      return;
    }
    setGpsLoading(true);
    setGpsError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserGPSCoords(coords);
        setGpsLoading(false);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([coords.lat, coords.lng], 14, { animate: true });
        }
      },
      (err) => {
        console.warn("GPS failed:", err);
        setGpsLoading(false);
        setGpsError(
          lang === "ar" 
            ? "تعذر تحديد الموقع الجغرافي بدقة. يرجى تفعيل الـ GPS وإعطاء الصلاحية." 
            : "Could not fetch GPS location. Please verify signals and permissions are allowed."
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const resetMapViewportBounds = () => {
    if (mapInstanceRef.current && fitCoordinatesRef.current && fitCoordinatesRef.current.length > 0) {
      mapInstanceRef.current.fitBounds(fitCoordinatesRef.current, {
        padding: [60, 60],
        maxZoom: 15,
        animate: true,
        duration: 1.2
      });
    }
  };

  // Sync with prop when it is set or updated by parent
  useEffect(() => {
    if (transitMode) {
      setLocalTransitMode(transitMode);
    }
  }, [transitMode]);

  // Dynamic Leaflet Loader
  useEffect(() => {
    // Check if Leaflet is already present
    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    // Append standard CSS
    const linkId = "leaflet-css-cdn";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Append standard Script
    const scriptId = "leaflet-js-cdn";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => {
        setLeafletLoaded(true);
      };
      script.onerror = () => {
        setLoadError(true);
      };
      document.body.appendChild(script);
    } else {
      // Script tag exists, wait for load
      const checkInterval = setInterval(() => {
        if ((window as any).L) {
          setLeafletLoaded(true);
          clearInterval(checkInterval);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }
  }, []);

  // Main Map Painter
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Resolve coords
    const destCoords = resolveCoordinates(destinationName, country);
    const originCoords = resolveCoordinates(originName, "Algeria");

    // Clear old instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Create fresh instance with default zoom level centering both locations or destination
    const zoomLevel = 4;
    const map = L.map(mapContainerRef.current, {
      center: [destCoords.lat, destCoords.lng],
      zoom: zoomLevel,
      scrollWheelZoom: false, // Prevents scroll traps in scrolling webpages
      zoomControl: true
    });
    mapInstanceRef.current = map;

    // CartoDB Voyager Tile layer representing clean, beautiful luxury aesthetics
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19
    }).addTo(map);

    // Prepare arrays and layers for automatic boundary fitting
    const fitMarkers: any[] = [];

    // 1. Plot Origin Node Icon (Dynamically matches select transitMode)
    const originColorMap: { [key: string]: string } = {
      Plane: "bg-amber-500 text-slate-950 ring-amber-500/25 hover:bg-amber-400",
      Train: "bg-purple-600 text-white ring-purple-500/25 hover:bg-purple-550",
      Bus: "bg-amber-600 text-white ring-amber-600/25 hover:bg-amber-500",
      Taxi: "bg-cyan-500 text-slate-950 ring-cyan-500/25 hover:bg-cyan-400",
      Car: "bg-emerald-600 text-white ring-emerald-500/25 hover:bg-emerald-550"
    };
    const originClasses = originColorMap[localTransitMode] || originColorMap["Car"];
    const originSVGHtml = getTransitSVG(localTransitMode, 18, 18, 2.5);

    const originIcon = L.divIcon({
      html: `
        <div class="${originClasses} rounded-full p-2 border-2 border-slate-900 shadow-xl w-10 h-10 flex items-center justify-center transform hover:scale-115 active:scale-95 transition-all cursor-pointer font-bold ring-4">
          ${originSVGHtml}
        </div>
      `,
      className: "custom-leaflet-icon-origin",
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
    const originMarker = L.marker([originCoords.lat, originCoords.lng], { icon: originIcon })
      .addTo(map)
      .bindPopup(`
        <div class="p-2 space-y-1 font-sans text-xs">
          <p class="font-extrabold text-slate-800">${lang === "ar" ? "نقطة انطلاق الرحلة" : "Flight Outbound Origin"}</p>
          <p class="text-indigo-650 font-bold">${originName}</p>
        </div>
      `);
    fitMarkers.push([originCoords.lat, originCoords.lng]);

    // 2. Plot Destination Node Icon
    const destIcon = L.divIcon({
      html: `
        <div class="bg-indigo-600 text-white rounded-full p-2 border-2 border-white shadow-lg w-10 h-10 flex items-center justify-center transform hover:scale-110 active:scale-95 hover:bg-indigo-700 transition-all cursor-pointer ring-4 ring-indigo-500/10">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3.5" fill="currentColor"/>
          </svg>
        </div>
      `,
      className: "custom-leaflet-icon-destination",
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
    L.marker([destCoords.lat, destCoords.lng], { icon: destIcon })
      .addTo(map)
      .bindPopup(`
        <div class="p-2.5 space-y-1.5 font-sans text-xs">
          <p class="font-black text-indigo-700">${lang === "ar" ? "وجهة السفر الرئيسية" : "Main Holiday Destination"}</p>
          <div class="p-1 px-2 rounded bg-indigo-50 border border-indigo-100 font-extrabold text-slate-800 text-center text-sm">
            ${destinationName}, ${country}
          </div>
        </div>
      `);
    fitMarkers.push([destCoords.lat, destCoords.lng]);

    // 3. Draw route lines dynamically depending on active localTransitMode
    if (localTransitMode === "Plane") {
      // Draw flight route line (Geodesic curved simulation or straight fallback)
      const flightRouteCoords = [[originCoords.lat, originCoords.lng], [destCoords.lat, destCoords.lng]];
      const flightPath = L.polyline(flightRouteCoords, {
        color: "#4f46e5", // Indigo-600
        weight: 3,
        opacity: 0.85,
        dashArray: "8, 6",
        className: "flight-route-polyline cursor-pointer"
      }).addTo(map);

      const mainFlight = selectedFlight || (flights && flights.length > 0 ? flights[0] : null);
      if (mainFlight) {
        const durationHtml = lang === "ar" 
          ? `<div class="p-2 font-sans text-xs space-y-1">
               <div class="font-extrabold text-indigo-700 flex items-center gap-1">✈️ ${mainFlight.airline}</div>
               <div class="text-slate-650 font-bold">⏱️ المدة المتوقعة: <span class="text-indigo-900 font-extrabold">${mainFlight.duration}</span></div>
               <div class="text-[10px] text-slate-500 font-semibold">${mainFlight.flightNumber} • ${mainFlight.departureTime} &rarr; ${mainFlight.arrivalTime}</div>
             </div>`
          : `<div class="p-2 font-sans text-xs space-y-1">
               <div class="font-extrabold text-indigo-700 flex items-center gap-1">✈️ ${mainFlight.airline}</div>
               <div class="text-slate-650 font-bold">⏱️ Travel Duration: <span class="text-indigo-900 font-extrabold">${mainFlight.duration}</span></div>
               <div class="text-[10px] text-slate-500 font-semibold">${mainFlight.flightNumber} • ${mainFlight.departureTime} &rarr; ${mainFlight.arrivalTime}</div>
             </div>`;

        flightPath.bindTooltip(durationHtml, {
          sticky: true,
          direction: "top",
          className: "custom-leaflet-flight-tooltip bg-white border border-indigo-150/70 shadow-lg rounded-xl"
        });
      }

      // Plot simple customized midpoint marker for flight highlight
      const midLat = (originCoords.lat + destCoords.lat) / 2;
      const midLng = (originCoords.lng + destCoords.lng) / 2;
      const midIcon = L.divIcon({
        html: `
          <div class="bg-indigo-650 text-white rounded-full w-9 h-9 flex items-center justify-center border-2 border-white shadow-lg transform hover:scale-115 select-none z-40 ring-4 ring-indigo-500/20">
            <span class="transform rotate-45 inline-block text-white">
              ${getTransitSVG("Plane", 16, 16, 2.5)}
            </span>
          </div>
        `,
        className: "custom-leaflet-icon-flight-midpoint",
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
      
      // Bind tooltip with active flights lists summary
      L.marker([midLat, midLng], { icon: midIcon })
        .addTo(map)
        .bindPopup(`
          <div class="p-2 space-y-1 max-w-[200px] text-xs font-sans">
            <p class="font-extrabold text-slate-800">${lang === "ar" ? "مسار تذكرة الطيران" : "Outbound Flight Path"}</p>
            <p class="text-[10px] text-slate-500 font-semibold">${originName} &rarr; ${destinationName}</p>
            ${selectedFlight ? `
              <div class="mt-2 p-1.5 rounded-lg bg-indigo-50 border border-blue-105 font-bold">
                <p class="text-indigo-900">${selectedFlight.airline}</p>
                <p class="text-emerald-700 mt-0.5">$${selectedFlight.priceUSD}</p>
              </div>
            ` : `<p class="text-slate-400 text-[10px] italic mt-1">${lang === "ar" ? "انقر بالأسفل لمشاهدة التذاكر في القائمة" : "Review flights below to filter prices"}</p>`}
          </div>
        `);
    } else {
      // 3b. Draw alternative overland winding route instead of default flight path
      // Plot flight path as faded thin reference route
      const flightRouteCoords = [[originCoords.lat, originCoords.lng], [destCoords.lat, destCoords.lng]];
      L.polyline(flightRouteCoords, {
        color: "#94a3b8", // Slate-400 reference
        weight: 1.5,
        opacity: 0.35,
        dashArray: "4, 6",
        className: "flight-route-faded-reference"
      }).addTo(map);

      // Construct overland custom path
      const overlandCoords = getOverlandRoute(originCoords, destCoords, localTransitMode);
      const cfg = modeConfigs[localTransitMode] || modeConfigs["Car"];
      const pathLatLngs = overlandCoords.map(c => [c.lat, c.lng]);

      if (localTransitMode === "Train") {
        // --- 1. Train Lines (Railway track effect with high distinction) ---
        // 1a. Base bedding line (wider, dark charcoal style representing gravel or tracks bed)
        L.polyline(pathLatLngs, {
          color: "#334155", // Charcoal bedding
          weight: 7,
          opacity: 0.9,
          className: "train-path-bedding"
        }).addTo(map);

        // 1b. The parallel tracks outer bounds / sleeper boards layer (dashed black)
        L.polyline(pathLatLngs, {
          color: "#1e293b", // Slate-900 sleeper boards
          weight: 5,
          opacity: 1.0,
          dashArray: "4, 6",
          className: "train-path-sleepers"
        }).addTo(map);

        // 1c. Center main track rail line (thin glowing purple line representing high-speed rail tracks)
        const trainMainPath = L.polyline(pathLatLngs, {
          color: "#8b5cf6", // Express Purple route color
          weight: 2,
          opacity: 1.0,
          className: "train-path-rails cursor-pointer"
        }).addTo(map);

        // Bind interactive popup detailing train line
        trainMainPath.bindPopup(`
          <div class="p-2.5 space-y-1 text-xs font-sans">
            <p class="font-extrabold text-slate-900 flex items-center gap-1.5 leading-none">
              <span>🚊</span>
              <span>${lang === "ar" ? "خط السكك الحديدية السريع" : "National Express Railway Network"}</span>
            </p>
            <p class="text-[10px] text-indigo-600 font-extrabold mt-1">${originName} &harr; ${destinationName}</p>
            <p class="text-[10.5px] text-slate-600 leading-normal mt-1">
              ${lang === "ar" 
                ? "يتم تشغيل هذا المسار عبر قطارات حديثة مبردة ومريحة مصممة للأجواء الصحراوية والمناظر الجبلية الوعرة." 
                : "A multi-track long distance express rail cruiser traversing high plain mountain curves, fully optimized with air-conditioned wagons."}
            </p>
          </div>
        `);
      } else if (localTransitMode === "Bus") {
        // --- 2. Bus Routes (High-contrast transit highway lane) ---
        // 2a. Base highway asphalt/lane (thick orange-amber base)
        L.polyline(pathLatLngs, {
          color: "#f59e0b", // Amber Base
          weight: 7,
          opacity: 0.8,
          className: "bus-path-base"
        }).addTo(map);

        // 2b. Foreground dash pattern representing regular commuter steps
        const busMainPath = L.polyline(pathLatLngs, {
          color: "#ffffff", // High-contrast white dashes
          weight: 2.5,
          opacity: 1.0,
          dashArray: "6, 12",
          className: "bus-path-dashes cursor-pointer"
        }).addTo(map);

        // Bind interactive popup detailing regional bus route corridor
        busMainPath.bindPopup(`
          <div class="p-2.5 space-y-1 text-xs font-sans">
            <p class="font-extrabold text-amber-950 flex items-center gap-1.5 leading-none">
              <span>🚌</span>
              <span>${lang === "ar" ? "مسار الحافلات الإقليمية السريعة" : "Intercity Coach Transit Corridor"}</span>
            </p>
            <p class="text-[10px] text-amber-700 font-extrabold mt-1">${originName} &harr; ${destinationName}</p>
            <p class="text-[10.5px] text-slate-600 leading-normal mt-1">
              ${lang === "ar" 
                ? "خط حافلات متكامل للرحلات البعيدة، موزع على محطات استراحة متميزة ومعتمدة للتزود بالوقود والوجبات الخفيفة والتقليدية." 
                : "Scheduled express bus system designed for economic inter-city commuting, fully catered with dedicated food rest layover terminals."}
            </p>
          </div>
        `);
      } else {
        // --- 3. Car / Taxi Paths (Standard Asphalt Highways with center striping) ---
        const color = cfg.color; // color of selected driving mode (Emerald Green for Car, Cyan for Taxi)

        // 3a. Deep slate asphalt roadbed surface
        L.polyline(pathLatLngs, {
          color: "#334155", // Slate grey asphalt
          weight: 7,
          opacity: 0.9,
          className: "car-path-asphalt"
        }).addTo(map);

        // 3b. Glowing outer guide rails representing highway safety edges
        L.polyline(pathLatLngs, {
          color: color, // Mode primary color limit line
          weight: 4.5,
          opacity: 0.85,
          className: "car-path-shoulders"
        }).addTo(map);

        // 3c. Yellow dash center divider line for distinct dual carriageway impression
        const carMainPath = L.polyline(pathLatLngs, {
          color: "#facc15", // Yellow center lines
          weight: 1.5,
          opacity: 1.0,
          dashArray: "8, 12",
          className: "car-path-divider cursor-pointer"
        }).addTo(map);

        // Bind interactive popup detailing highway
        carMainPath.bindPopup(`
          <div class="p-2.5 space-y-1 text-xs font-sans">
            <p class="font-extrabold text-slate-900 flex items-center gap-1.5 leading-none">
              <span>${localTransitMode === "Taxi" ? "🚖" : "🚗"}</span>
              <span>${lang === "ar" ? "مسار الطرق الوطنية السريعة" : "National Highway Expressway Route"}</span>
            </p>
            <p class="text-[10px] text-emerald-600 font-extrabold mt-1">${originName} &harr; ${destinationName}</p>
            <p class="text-[10.5px] text-slate-600 leading-normal mt-1">
              ${lang === "ar" 
                ? "الربط المباشر المفتوح عبر أحدث الطرق السيّارة والمسارات الوطنية، مثالية ومفضلة لقيادة مرنة وحرية تامة في مواعيد التحرك." 
                : "Open high-speed express route mapping via clean national arterials. Highly recommended for a self-paced independent driving travel experience."}
            </p>
          </div>
        `);
      }

      // Generate dynamic stopovers
      const isAlgiersToGhardaia = 
        (originName?.toLowerCase().includes("algiers") || originName?.includes("الجزائر")) &&
        (destinationName.toLowerCase().includes("ghardaia") || destinationName.includes("غرداية"));

      let stopovers: Stopover[] = [];
      if (isAlgiersToGhardaia) {
        if (localTransitMode === "Train") {
          stopovers = [
            {
              name: lang === "ar" ? "محطة الجلفة الرئيسية للسكك الحديدية" : "Djelfa Main Passenger Rail Station",
              lat: 34.6721,
              lng: 3.2512,
              desc: lang === "ar" ? "محطة تبادلية حديثة لربط الشمال بالهضاب العليا والجنوب الكبير." : "State-of-the-art regional interchange linking northern rails to high plateaus.",
              type: "train"
            },
            {
              name: lang === "ar" ? "محطة الأغواط للمسافرين والشحن" : "Laghouat Passenger & Cargo Terminal",
              lat: 33.8015,
              lng: 2.8651,
              desc: lang === "ar" ? "بوابة النقل الحديدي للجنوب، تقدم رحلات منتظمة ومريحة مبردة." : "The main industrial and transit rail hub of the Laghouat oasis region.",
              type: "train"
            }
          ];
        } else if (localTransitMode === "Bus") {
          stopovers = [
            {
              name: lang === "ar" ? "محطة الحافلات الجهوية بالبويرة" : "Bouira Regional Bus Station",
              lat: 36.3711,
              lng: 3.8965,
              desc: lang === "ar" ? "نقطة استراحة مفضلة للحافلات المتجهة جنوباً لتناول الشاي والوجبات السريعة." : "Popular roadside express coach terminal offering rest and tea snacks.",
              type: "bus"
            },
            {
              name: lang === "ar" ? "المحطة البرية المتكاملة بالجلفة" : "Djelfa Integrated Bus Station",
              lat: 34.6812,
              lng: 3.2655,
              desc: lang === "ar" ? "المحطة المركزية للخطوط الطويلة الرابطة بين العاصمة وواحات الصحراء." : "Central gateway bus depot connecting long-range desert lines to the capital.",
              type: "bus"
            }
          ];
        } else {
          stopovers = [
            {
              name: lang === "ar" ? "مجمع استراحة المخرج الجنوبي (المدية)" : "Medea South Expressway Service Station",
              lat: 36.2625,
              lng: 2.7544,
              desc: lang === "ar" ? "مجمع متكامل يحتوي على خدمات الوقود، متجر مأكولات ومقاهي مريحة." : "Expressway gas station facility with convenience standard stores and clean dining cafes.",
              type: "car"
            },
            {
              name: lang === "ar" ? "واحة استراحة الجلفة والطريق الوطني 1" : "Djelfa Roadside Oasis & Service Hub",
              lat: 34.6555,
              lng: 3.2421,
              desc: lang === "ar" ? "أكبر تجمع خدمي للمسافرين بالسيارات على الطريق الوطني رقم 1 للراحة وتعبئة الوقود." : "Great service complex directly on National Route 1, ideal for fuel refilling and food.",
              type: "car"
            }
          ];
        }
      } else {
        const pt3 = overlandCoords[Math.min(3, overlandCoords.length - 1)];
        const pt6 = overlandCoords[Math.min(6, overlandCoords.length - 1)];
        
        if (localTransitMode === "Train") {
          stopovers = [
            {
              name: lang === "ar" ? "محطة التبادل الحديدي الإقليمية" : "Regional Railway Interchange Hub",
              lat: pt3.lat,
              lng: pt3.lng,
              desc: lang === "ar" ? "محطة فرعية لتنظيم مسارات القطار وتغيير الرحلات." : "An intermediary junction facilitating quick rail line transfers.",
              type: "train"
            },
            {
              name: lang === "ar" ? "محطة توقف القطار السريع الساحلية" : "Scenic Mountain Rail Station",
              lat: pt6.lat,
              lng: pt6.lng,
              desc: lang === "ar" ? "محطة متوسطة تقدم إطلالات طبيعية خلابة للمسافرين." : "Suburban terminal overlooking beautiful scenery and local mountains.",
              type: "train"
            }
          ];
        } else if (localTransitMode === "Bus") {
          stopovers = [
            {
              name: lang === "ar" ? "موقف حافلات الأقاليم المشترك" : "Intercity Coach Stop",
              lat: pt3.lat,
              lng: pt3.lng,
              desc: lang === "ar" ? "ساحة توقف منظمة لخطوط النقل البري السريعة." : "Scheduled layover node for regional intercity shuttle routes.",
              type: "bus"
            },
            {
              name: lang === "ar" ? "بوابة عبور النقل العمومي" : "Public Transit Gate Terminal",
              lat: pt6.lat,
              lng: pt6.lng,
              desc: lang === "ar" ? "محطة استراحة جهوية متكاملة مخصصة للحافلات والركاب." : "Well-equipped countryside station featuring diner cafes and restrooms.",
              type: "bus"
            }
          ];
        } else {
          stopovers = [
            {
              name: lang === "ar" ? "استراحة الطريق الوطني السريع" : "Expressway Service Junction",
              lat: pt3.lat,
              lng: pt3.lng,
              desc: lang === "ar" ? "محطة وقود وخدمات صيانة صالحة للمسافرين براً على مدار 24 ساعة." : "Full service station featuring fuel, automated convenience storage, and mechanical assistance.",
              type: "car"
            },
            {
              name: lang === "ar" ? "مطل بانورامي ومكان استراحة" : "Scenic National Highway Outlook",
              lat: pt6.lat,
              lng: pt6.lng,
              desc: lang === "ar" ? "مكان وقوف آمن ومريح لالتقاط الصور ومشاهدة معالم الطبيعة." : "Safe designated high latitude outlook point, perfect for photos and dynamic sights.",
              type: "car"
            }
          ];
        }
      }

      // Draw stopovers
      stopovers.forEach((stop, idx) => {
        let stopHtml = "";
        let stopColor = "bg-slate-700";
        if (stop.type === "train") {
          stopColor = "bg-purple-600";
          stopHtml = getTransitSVG("Train", 14, 14, 2.5);
        } else if (stop.type === "bus") {
          stopColor = "bg-amber-500";
          stopHtml = getTransitSVG("Bus", 14, 14, 2.5);
        } else {
          stopColor = "bg-emerald-600";
          stopHtml = getTransitSVG("fuel", 14, 14, 2.5);
        }

        const stopIcon = L.divIcon({
          html: `
            <div class="${stopColor} text-white rounded-full p-1 border border-white shadow-xl w-7 h-7 flex items-center justify-center transform hover:scale-120 transition-all cursor-pointer">
              ${stopHtml}
            </div>
          `,
          className: `custom-leaflet-icon-stopover-${idx}`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        L.marker([stop.lat, stop.lng], { icon: stopIcon })
          .addTo(map)
          .bindPopup(`
            <div class="p-2 space-y-1 font-sans text-xs max-w-[190px]">
              <div class="flex items-center gap-1 font-bold text-slate-800">
                <span class="inline-block text-slate-650">
                  ${stop.type === "train" ? getTransitSVG("Train", 12, 12, 2.5) : stop.type === "bus" ? getTransitSVG("Bus", 12, 12, 2.5) : getTransitSVG("Car", 12, 12, 2.5)}
                </span>
                <span class="font-bold text-[10px] text-slate-500 uppercase">${lang === "ar" ? "نقطة توقف مخصصة" : "Suggested Trip Stop"}</span>
              </div>
              <h6 class="font-extrabold text-slate-950 text-xs">${stop.name}</h6>
              <p class="text-[10px] text-slate-550 leading-relaxed">${stop.desc}</p>
            </div>
          `);

        fitMarkers.push([stop.lat, stop.lng]);
      });

      // Interactive mid-point vehicle representation
      const midIndex = Math.floor(overlandCoords.length / 2);
      const midOverland = overlandCoords[midIndex];
      const overlandMidIcon = L.divIcon({
        html: `
          <div class="bg-slate-900 border border-slate-200 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transform hover:scale-115 active:scale-95 transition-all select-none z-50">
            ${getTransitSVG(localTransitMode, 14, 14, 2.5)}
          </div>
        `,
        className: "custom-leaflet-icon-overland-midpoint",
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      L.marker([midOverland.lat, midOverland.lng], { icon: overlandMidIcon })
        .addTo(map)
        .bindPopup(`
          <div class="p-2 space-y-1 max-w-[200px] text-xs font-sans">
            <p class="font-extrabold text-slate-800">${lang === "ar" ? cfg.labelAr : cfg.labelEn}</p>
            <p class="text-[10px] text-slate-500 font-semibold">${originName} ${lang === "ar" ? "&larr;" : "&rarr;"} ${destinationName}</p>
            <div class="mt-2 p-1.5 rounded-lg bg-slate-50 border border-slate-150 font-bold text-slate-750">
              ${lang === "ar" ? "مسار بديل نشط يمر بنقاط استراحة مجهزة على مستوى الطريق" : "Active overland transit route corridor with live structured rest areas plotted."}
            </div>
          </div>
        `);
    }

    // 4. Plot Hotel Pins cleanly offset around the destination coordinate in a beautiful orbit
    let hotelLatSaved = destCoords.lat;
    let hotelLngSaved = destCoords.lng;

    if (hotels && hotels.length > 0) {
      hotels.forEach((hotel, idx) => {
        // Orbit math to offset hotel pins clearly so they are all distinct and perfectly interactive
        const angle = (idx * Math.PI) / 2; // Split into 4 clean quadrants
        const radius = 0.006 + idx * 0.002; // Slipped radius expansion
        const hotelLat = destCoords.lat + Math.sin(angle) * radius;
        const hotelLng = destCoords.lng + Math.cos(angle) * radius;

        if (selectedHotel && selectedHotel.name === hotel.name) {
          hotelLatSaved = hotelLat;
          hotelLngSaved = hotelLng;
        }

        const isHotelSelected = selectedHotel && selectedHotel.name === hotel.name;

        const hotelIcon = L.divIcon({
          html: isHotelSelected 
            ? `
              <div class="bg-rose-600 text-white rounded-xl p-2 border-2 border-yellow-300 shadow-2xl w-10 h-10 flex items-center justify-center transform hover:scale-115 active:scale-95 transition-all cursor-pointer ring-4 ring-rose-500/30 animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white">
                  <path d="M3 21h18"/>
                  <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/>
                  <path d="M9 7h1v2H9z"/>
                  <path d="M9 11h1v2H9z"/>
                  <path d="M9 15h1v2H9z"/>
                  <path d="M14 7h1v2h-1z"/>
                  <path d="M14 11h1v2h-1z"/>
                  <path d="M14 15h1v2h-1z"/>
                </svg>
              </div>
            `
            : `
              <div class="bg-indigo-950 text-white rounded-lg p-2 border border-slate-200 shadow-md w-8 h-8 flex items-center justify-center transform hover:scale-115 hover:bg-indigo-900 transition-all cursor-pointer ring-2 ring-indigo-950/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-100">
                  <path d="M3 21h18"/>
                  <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/>
                  <path d="M9 7h1v2H9z"/>
                  <path d="M9 11h1v2H9z"/>
                  <path d="M9 15h1v2H9z"/>
                  <path d="M14 7h1v2h-1z"/>
                  <path d="M14 11h1v2h-1z"/>
                  <path d="M14 15h1v2h-1z"/>
                </svg>
              </div>
            `,
          className: `custom-leaflet-icon-hotel-${idx}`,
          iconSize: isHotelSelected ? [40, 40] : [32, 32],
          iconAnchor: isHotelSelected ? [20, 20] : [16, 16]
        });

        // Unique dynamic ID binding for inline popup triggers
        const popupContentId = `map-select-hotel-${idx}`;

        const hotelMarker = L.marker([hotelLat, hotelLng], { icon: hotelIcon })
          .addTo(map)
          .bindPopup(`
            <div class="p-3 space-y-1.5 font-sans text-xs min-w-[200px]">
              <div class="flex items-start justify-between gap-1">
                <span class="text-[9px] bg-indigo-50 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded border border-indigo-100">
                  ${hotel.stars} ${lang === "ar" ? "نجوم" : "Stars"}
                </span>
                <span class="text-amber-500 font-bold flex items-center gap-0.5 text-[10px]">
                  ★ ${hotel.rating}
                </span>
              </div>
              <h5 class="font-extrabold text-slate-800 text-sm leading-tight">${hotel.name}</h5>
              <p class="text-[10px] text-slate-400 font-medium truncate">${hotel.address}</p>
              <div class="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
                <div>
                  <span class="text-[9px] text-slate-400 font-semibold block">${lang === "ar" ? "السعر / الليلة" : "Rate/Night"}</span>
                  <span class="font-black text-indigo-600 text-sm">$${hotel.priceUSD}</span>
                </div>
                <button
                  id="${popupContentId}"
                  type="button"
                  class="px-2.5 py-1 rounded bg-slate-900 hover:bg-indigo-600 text-white text-[10px] font-bold cursor-pointer transition-colors"
                >
                  ${isHotelSelected ? (lang === "ar" ? "موصى به وعملي" : "✓ Selected") : (lang === "ar" ? "أختر الإقامة" : "Select Stay")}
                </button>
              </div>
            </div>
          `);

        // Handle inner popup buttons beautifully using direct DOM events listeners in popups open callback
        hotelMarker.on("popupopen", () => {
          setTimeout(() => {
            const btn = document.getElementById(popupContentId);
            if (btn) {
              btn.addEventListener("click", (e) => {
                e.preventDefault();
                onSelectHotel && onSelectHotel(hotel);
                // Highlight choice and bounce automatically!
                hotelMarker.closePopup();
              });
            }
          }, 100);
        });

        if (isHotelSelected) {
          hotelMarker.openPopup();
        }

        fitMarkers.push([hotelLat, hotelLng]);
      });
    }

    // 5. Draw Parking markers for Car Mode / Rental Cars option
    if (localTransitMode === "Car") {
      const parkings = [
        {
          name: lang === "ar" ? "موقف سيارات الفندق والنزلاء" : "Hotel Guest Parking Garage",
          lat: hotelLatSaved !== destCoords.lat ? (hotelLatSaved + 0.0012) : (destCoords.lat + 0.0015),
          lng: hotelLngSaved !== destCoords.lng ? (hotelLngSaved + 0.0012) : (destCoords.lng - 0.0015),
          desc: lang === "ar" ? "موقف سيارات ذكي وآمن مخصص لنزلاء الفندق مع حراسة وتأمين متكامل على مدار الساعة." : "Secure gated smart parking for hotel guests. 24/7 fully monitored under guard watch.",
          capacity: lang === "ar" ? "80 سيارة" : "80 vehicles",
          price: lang === "ar" ? "مجاني تماماً للنزلاء" : "Complimentary for guests"
        },
        {
          name: lang === "ar" ? "موقف ساحة البلدية والترفيه المركزي" : "Municipal Central Square Parking",
          lat: destCoords.lat + 0.0045,
          lng: destCoords.lng - 0.0035,
          desc: lang === "ar" ? "موقف سيارات بلدي مجهز ومراقب بالكاميرات، يقع بالقرب من المعالم السياحية ومحطات النقل." : "High capacity smart municipal parking. Close to main parks, restaurants, and downtown sights.",
          capacity: lang === "ar" ? "350 سيارة" : "350 vehicles",
          price: lang === "ar" ? "150 دج / الساعة" : "150 DZD (~$1.1) / hr"
        },
        {
          name: lang === "ar" ? "ساحة وقوف وسط المدينة والأسواق" : "Downtown Public Souk & Bazaar Lot",
          lat: destCoords.lat - 0.0035,
          lng: destCoords.lng + 0.0055,
          desc: lang === "ar" ? "موقف وقوف خارجي محمي ومناسب للوقوف لفترات طويلة للتسوق وتناول طعام العشاء." : "Convenient secure outdoor lot, perfect for long-duration stays near the local souks and cafes.",
          capacity: lang === "ar" ? "120 سيارة" : "120 vehicles",
          price: lang === "ar" ? "100 دج / يوم كاملاً" : "100 DZD / entire day"
        }
      ];

      parkings.forEach((park) => {
        const pIcon = L.divIcon({
          html: `
            <div class="bg-blue-600 text-white rounded-full p-2 border-2 border-white shadow-lg w-9 h-9 flex items-center justify-center transform hover:scale-110 hover:bg-blue-700 transition-all cursor-pointer ring-4 ring-blue-500/15 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" class="text-white">
                <path d="M9 17V5h6a4 4 0 0 1 0 8H9" />
              </svg>
            </div>
          `,
          className: "custom-leaflet-icon-parking",
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        L.marker([park.lat, park.lng], { icon: pIcon })
          .addTo(map)
          .bindPopup(`
            <div class="p-2.5 space-y-1.5 font-sans text-xs min-w-[210px]">
              <div class="flex items-center gap-1.5 text-blue-600 font-bold block">
                <span class="text-sm">🚗</span>
                <span class="font-bold text-[10px] uppercase tracking-wide">${lang === "ar" ? "موقف سيارات متاح" : "Parking Space Detected"}</span>
              </div>
              <h5 class="font-black text-slate-800 text-xs leading-snug">${park.name}</h5>
              <p class="text-[10px] text-slate-500 leading-relaxed">${park.desc}</p>
              <div class="flex items-center justify-between text-[9px] pt-1.5 border-t border-slate-100 mt-1 text-slate-600 font-semibold gap-2">
                <span>📋 ${park.capacity}</span>
                <span class="text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-black">${park.price}</span>
              </div>
            </div>
          `);

        fitMarkers.push([park.lat, park.lng]);
      });
    }

    // User GPS Positioning PIN Draw
    if (userGPSCoords) {
      const gpsIcon = L.divIcon({
        html: `
          <div class="relative w-10 h-10 flex items-center justify-center">
            <span class="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 animate-ping"></span>
            <div class="bg-indigo-600 text-white rounded-full p-2.5 border-2 border-white shadow-xl relative w-8 h-8 flex items-center justify-center font-bold text-xs ring-4 ring-indigo-500/20">
              📍
            </div>
          </div>
        `,
        className: "custom-leaflet-icon-gps-live",
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      L.marker([userGPSCoords.lat, userGPSCoords.lng], { icon: gpsIcon })
        .addTo(map)
        .bindPopup(`
          <div class="p-2 space-y-1 font-sans text-xs">
            <p class="font-extrabold text-indigo-700">${lang === "ar" ? "موقعك الفعلي عبر الـ GPS" : "Your Real-time GPS Position"}</p>
            <p class="text-[10px] font-mono text-slate-500">${userGPSCoords.lat.toFixed(5)}, ${userGPSCoords.lng.toFixed(5)}</p>
          </div>
        `);

      fitMarkers.push([userGPSCoords.lat, userGPSCoords.lng]);
    }

    // Nearby Restrooms / Washrooms seeding
    const baseCenter = userGPSCoords || destCoords;
    const seededRestrooms = [
      {
        nameAr: "دورة مياه عمومية ذكية",
        nameEn: "Hi-Tech Public Restroom",
        lat: baseCenter.lat + 0.0035,
        lng: baseCenter.lng - 0.0025,
        distanceAr: "على بعد 150 متر تقريباً",
        distanceEn: "Approx 150m away",
        cleanliness: "9.8/10 ✨"
      },
      {
        nameAr: "مرافق صحية عامة ونظيفة",
        nameEn: "Sanitized Public Washrooms",
        lat: baseCenter.lat - 0.0028,
        lng: baseCenter.lng + 0.0040,
        distanceAr: "على بعد 300 متر تقريباً",
        distanceEn: "Approx 300m away",
        cleanliness: "9.5/10 ✨"
      }
    ];

    seededRestrooms.forEach((toilet) => {
      const washroomIcon = L.divIcon({
        html: `
          <div class="bg-sky-50 border-2 border-sky-400 rounded-lg p-1.5 flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer font-bold">
            🚽
          </div>
        `,
        className: "custom-leaflet-icon-toilet-node",
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      L.marker([toilet.lat, toilet.lng], { icon: washroomIcon })
        .addTo(map)
        .bindPopup(`
          <div class="p-2 space-y-1 text-xs font-sans max-w-[200px]">
            <div class="flex items-center gap-1.5 font-extrabold text-blue-700">
              <span class="text-sm">🚽</span>
              <span>${lang === "ar" ? toilet.nameAr : toilet.nameEn}</span>
            </div>
            <p class="text-[10px] text-slate-500 font-semibold leading-none">${lang === "ar" ? toilet.distanceAr : toilet.distanceEn}</p>
            <div class="flex items-center justify-between text-[9px] font-extrabold text-indigo-700 bg-indigo-50/50 rounded px-1.5 py-0.5 mt-1">
              <span>🧻 ${lang === "ar" ? "جاهز ومطهر كلياً" : "Sanitized & Stocked"}</span>
              <span>${toilet.cleanliness}</span>
            </div>
          </div>
        `);
    });

    // Automatically fit map viewport beautifully to encompass all coordinates (origin + destination + hotels + parkings)
    if (fitMarkers.length > 0) {
      fitCoordinatesRef.current = fitMarkers;
      map.fitBounds(fitMarkers, {
        padding: [50, 50],
        maxZoom: 15,
        animate: true,
        duration: 1.5
      });
    }

  }, [leafletLoaded, destinationName, country, originName, flights, hotels, selectedFlight, selectedHotel, localTransitMode, userGPSCoords]);

  return (
    <div className="space-y-4">
      {/* Visual Header line */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl">
        <div className="space-y-1">
          <h4 className="text-sm md:text-base font-black text-slate-800 flex items-center gap-2">
            <Compass className="w-5.5 h-5.5 text-indigo-600 animate-spin-slow" />
            <span>{lang === "ar" ? "خريطة السفر والمسارات التفاعلية" : "Interactive Flight Route & Hotel Map"}</span>
          </h4>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            {lang === "ar"
              ? `شاهد مسار رحلتك الجوية من ${originName} وتوزيع خيارات الفنادق المفضلة ومواقف السيارات في ${destinationName}`
              : `Visualize coordinates, transit flight routes starting from ${originName}, hotels, and parking slots in ${destinationName}`}
          </p>
        </div>

        {/* Dynamic Transport Selector / paths toggle */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200/80 self-start sm:self-auto shrink-0 shadow-xs">
          {[
            { id: "Plane", icon: "✈️", labelAr: "طيران", labelEn: "Flight", colorClass: "bg-slate-900 text-white" },
            { id: "Car", icon: "🚗", labelAr: "سيارة / كراء", labelEn: "Car & Parking", colorClass: "bg-emerald-600 text-white" },
            { id: "Taxi", icon: "🚖", labelAr: "أجرة", labelEn: "Taxi Shared", colorClass: "bg-cyan-600 text-white" },
            { id: "Bus", icon: "🚌", labelAr: "حافلة خطوط", labelEn: "Bus Line", colorClass: "bg-amber-500 text-white" },
            { id: "Train", icon: "🚊", labelAr: "قطار سكة", labelEn: "Train Rail", colorClass: "bg-purple-600 text-white" }
          ].map((modeOption) => {
            const isActive = localTransitMode === modeOption.id;
            return (
              <button
                key={modeOption.id}
                type="button"
                onClick={() => setLocalTransitMode(modeOption.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                  isActive 
                    ? `${modeOption.colorClass} shadow-sm` 
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <span>{modeOption.icon}</span>
                <span>{lang === "ar" ? modeOption.labelAr : modeOption.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Map Container Canvas viewport */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-150/80 bg-slate-100/55 shadow-sm h-[320px] md:h-[400px]">
        {loadError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-2">
            <Info className="w-8 h-8 text-rose-500" />
            <p className="text-xs text-rose-600 font-bold uppercase">{lang === "ar" ? "خطأ في تحميل الخريطة" : "Map Loading Failure"}</p>
            <p className="text-[11px] text-slate-400 font-medium max-w-xs leading-normal">
              {lang === "ar" ? "فشل الاتصال بالخادم الجغرافي الخارجي للتحميل. يرجى التحقق من اتصالك بالإنترنت." : "Failed to sync OpenStreetMap coordinate buffers. Please review your active internet connection."}
            </p>
          </div>
        ) : !leafletLoaded ? (
          // Visual elegant loading skeleton
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-slate-50/80">
            <div className="w-8 h-8 border-3 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400 font-extrabold tracking-wide uppercase">
              {lang === "ar" ? "جاري مزامنة مرئيات الخريطة الجغرافية..." : "Synthesizing geographical map vectors..."}
            </p>
          </div>
        ) : null}

        {/* The actual Leaflet container div */}
        <div 
          ref={mapContainerRef} 
          className="w-full h-full z-10" 
          id="leaflet-coordinate-chart"
        />

        {/* Reset Map Viewport Bounds Button & Real-time GPS Tracker overlay */}
        {leafletLoaded && !loadError && (
          <div className="absolute top-3.5 right-3.5 z-30 flex flex-col sm:flex-row gap-2">
            {gpsError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-sm max-w-xs">
                <span>⚠️ {gpsError}</span>
              </div>
            )}
            
            <button
              onClick={triggerGPSLocation}
              disabled={gpsLoading}
              title={lang === "ar" ? "تحديد موقعي الفعلي وجلب أقرب دورات مياه" : "Determine my real location & find closets toilets"}
              type="button"
              className={`border rounded-xl px-3 py-2 text-[11px] font-black tracking-wide flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer ${
                userGPSCoords 
                  ? "bg-emerald-600 border-emerald-700 text-white hover:bg-emerald-500" 
                  : "bg-indigo-600 border-indigo-700 text-white hover:bg-indigo-500 disabled:bg-slate-300"
              }`}
            >
              {gpsLoading ? (
                <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <span className="text-[12px]">📍</span>
              )}
              <span>
                {lang === "ar" 
                  ? (userGPSCoords ? "تم تحديد موقعك (GPS)" : "تحديد موقعي الآن") 
                  : (userGPSCoords ? "GPS Active" : "Find My GPS Location")}
              </span>
            </button>

            <button
              onClick={resetMapViewportBounds}
              title={lang === "ar" ? "أعد تركيز زاوية الخريطة تلقائياً لتناسب المسار" : "Reset view bounds automatically"}
              type="button"
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-indigo-600 rounded-xl px-3 py-2 text-[11px] font-black tracking-wide flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer hover:border-indigo-200"
            >
              <ZoomIn className="w-3.5 h-3.5 text-indigo-600" />
              <span>{lang === "ar" ? "إعادة ضبط الخريطة" : "Reset Map View"}</span>
            </button>
          </div>
        )}

        {/* Mini watermark control on screen corner for premium visuals */}
        {leafletLoaded && (
          <div className="absolute bottom-2 left-2 z-30 bg-white/85 backdrop-blur-sm border border-slate-200/90 rounded-lg px-2 py-1 text-[9px] font-extrabold text-slate-600 flex items-center gap-1 shadow-sm leading-none">
            <Compass className="w-3 h-3 text-indigo-500 animate-spin-slow" />
            <span>Leaflet Real-time Engines</span>
          </div>
        )}
      </div>

      {/* Interactive Parking Details Panel */}
      {localTransitMode === "Car" && (
        <div className="bg-blue-50/40 border border-blue-100/60 rounded-2xl p-4 md:p-5 space-y-3.5 font-sans">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
              <span className="text-lg">🚗</span>
              <span className="font-extrabold text-slate-800">{lang === "ar" ? "مواقف السيارات والباركينق القريبة" : "Nearby Parking Spaces & Garages"}</span>
            </div>
            <span className="text-[10px] bg-blue-100 text-blue-850 font-black px-2.5 py-0.5 rounded-full uppercase">
              {lang === "ar" ? "نشط - سيارة خاصة والكراء" : "Active - Private/Rental Vehicles"}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-normal font-semibold">
            {lang === "ar"
              ? "قمنا بتحديد ورصد 3 مواقف سيارات آمنة ومراقبة قريبة ومجاورة لمكان الإقامة أو مركز التنقل لتوفير أقصى درجات الراحة."
              : "We identified and mapped 3 secure surveilled parking slots near your hotel block or touring hotspots for absolute ease of access."}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                name: lang === "ar" ? "موقف سيارات الفندق والنزلاء" : "Hotel Guest Parking Garage",
                desc: lang === "ar" ? "موقف مخصص ومحمي مجانًا لنزلاء الفندق مع حراسة وتأمين متكامل على مدار الساعة." : "Secure gated smart parking for hotel guests. 24/7 fully monitored under guard watch.",
                capacity: lang === "ar" ? "80 سيارة" : "80 spaces",
                price: lang === "ar" ? "مجاني للنزلاء" : "Complimentary",
                benefit: lang === "ar" ? "بجوار الفندق مباشرة" : "Direct hotel access",
                icon: "🏨"
              },
              {
                name: lang === "ar" ? "موقف ساحة البلدية والترفيه المركزي" : "Municipal Central Square Parking",
                desc: lang === "ar" ? "موقف سيارات بلدي مجهز ومراقب بالكاميرات، يقع بالقرب من المعالم السياحية والأسواق." : "High capacity smart municipal parking. Close to main parks, restaurants, and downtown sights.",
                capacity: lang === "ar" ? "350 سيارة" : "350 spaces",
                price: lang === "ar" ? "150 دج / الساعة" : "150 DZD/hr",
                benefit: lang === "ar" ? "وسط المدينة مركز المعالم" : "Central sights hub",
                icon: "🏢"
              },
              {
                name: lang === "ar" ? "ساحة وقوف وسط المدينة والأسواق" : "Downtown Public Souk & Bazaar Lot",
                desc: lang === "ar" ? "موقف وقوف خارجي محمي ومناسب للوقوف لفترات طويلة للتسوق وتناول طعام العشاء." : "Convenient secure outdoor lot, perfect for long-duration stays near the local souks and cafes.",
                capacity: lang === "ar" ? "120 سيارة" : "120 spaces",
                price: lang === "ar" ? "100 دج / يوم" : "100 DZD/day",
                benefit: lang === "ar" ? "قريب من أسواق التجزئة" : "Bazaar shopping area",
                icon: "📍"
              }
            ].map((p, idx) => (
              <div key={idx} className="bg-white border border-blue-100 p-3.5 rounded-xl shadow-xs hover:border-blue-200 hover:shadow-sm transition-all flex flex-col justify-between gap-3 text-xs">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <span className="text-sm">{p.icon}</span>
                    <span className="font-extrabold">{p.name}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-normal">{p.desc}</p>
                </div>
                
                <div className="space-y-2 pt-2 border-t border-slate-50">
                  <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400">
                    <span>📋 {p.capacity}</span>
                    <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-black">{p.price}</span>
                  </div>
                  <div className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-extrabold w-max">
                    ✓ {p.benefit}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Restrooms / Toilets Finder Subpanel */}
      <div className="bg-sky-50/40 border border-sky-100/60 rounded-2xl p-4 md:p-5 space-y-3.5 font-sans" id="dynamic-toilet-finder-subpanel">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sky-900 font-bold text-sm">
            <span>🚽</span>
            <span className="font-extrabold text-slate-800">
              {lang === "ar" ? "رصد دورات المياه والمراحيض القريبة" : "Nearby Toilets & Restrooms Finder"}
            </span>
          </div>
          <span className="text-[10px] bg-sky-100 text-sky-800 rounded px-2 py-0.5 font-extrabold uppercase">
            {lang === "ar" ? "نشط تلقائياً" : "Active & Cached"}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-normal font-semibold">
          {lang === "ar"
            ? "نظام رصد وتحديد دورات المياه العامة المعقمة والمطهرة القريبة من تجمعك أو موقعك الجغرافي المسجل حالياً للحفاظ على سلامتك وراحتك الفورية:"
            : "Locally cached sanitarily checked restrooms with direct coordinate trackers. Kept clean under municipal review near your current position:"}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              name: lang === "ar" ? "دورة مياه عمومية ذكية ومعقمة" : "Smart Public Restroom (Sanitized)",
              desc: lang === "ar" ? "دورة مياه آلية ذاتية التعقيم والطهي، تدعم حركية الكراسي المتحركة ومغاسل نظيفة وجافة متكاملة." : "Fully self-cleaning smart cabin, features accessible access ramp and dried automated washbasins.",
              proximity: lang === "ar" ? "على بعد 150 متر فقط" : "Under 150 meters away",
              rating: "4.8 / 5.0 ★",
              status: lang === "ar" ? "مفتوحة ومتاحة مجاناً" : "Open • Free Access",
              icon: "🚻"
            },
            {
              name: lang === "ar" ? "مجمع مرافق صحية - سنترال تاون" : "Central Hub Washrooms Block",
              desc: lang === "ar" ? "مجموعة غرف صحية عمومية عائلية مخصصة للرجال والنساء والأطفال تحت رعاية النظافة المستمرة." : "Dedicated child/adult sanitary block with ongoing cleanliness supervision. Safe for traveling families.",
              proximity: lang === "ar" ? "على بعد 300 متر تقريباً" : "Approx 300 meters away",
              rating: "4.5 / 5.0 ★",
              status: lang === "ar" ? "مفتوحة (مرافق متكاملة)" : "Open • Full Facilities",
              icon: "🚾"
            }
          ].map((toilet, idx) => (
            <div key={idx} className="bg-white border border-sky-100 p-3.5 rounded-xl shadow-xs hover:border-sky-200 hover:shadow-sm transition-all flex flex-col justify-between gap-3 text-xs">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <span className="text-sm">{toilet.icon}</span>
                  <span className="font-extrabold">{toilet.name}</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-normal">{toilet.desc}</p>
              </div>
              
              <div className="space-y-2 pt-2 border-t border-slate-50">
                <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400">
                  <span>📍 {toilet.proximity}</span>
                  <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-black">{toilet.rating}</span>
                </div>
                <div className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-extrabold w-max">
                  ✓ {toilet.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
