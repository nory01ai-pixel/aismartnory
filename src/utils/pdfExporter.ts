/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from "jspdf";
import { Itinerary, FlightMock, HotelMock } from "../types";

export function hasArabic(text: string): boolean {
  if (!text) return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

// Draw Arabic text in high definition natively using temporary canvas rendering
export function drawArabicCanvasText(
  doc: jsPDF,
  text: string,
  x: number, // in mm
  y: number, // in mm
  fontSize: number, // in pt
  style: "bold" | "normal" | "italic",
  color: [number, number, number],
  align: "right" | "left" = "right"
) {
  try {
    const canvas = document.createElement("canvas");
    const scale = 4; // ultra sharp render
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      // Fallback
      doc.setFont("helvetica", style);
      doc.text(text, x, y);
      return;
    }

    let fontStyle = "";
    if (style === "bold") fontStyle = "bold ";
    if (style === "italic") fontStyle = "italic ";
    const canvasFont = `${fontStyle}${fontSize * scale}px "Cairo", "Amiri", "Inter", "Segoe UI", Tahoma, Arial, sans-serif`;
    ctx.font = canvasFont;

    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const padding = 16;

    canvas.width = textWidth + padding * 2;
    canvas.height = (fontSize * scale * 1.6) + padding * 2;

    // Reset properties after canvas resize
    ctx.font = canvasFont;
    ctx.textBaseline = "middle";
    ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    
    // Enable perfect native RTL
    ctx.direction = "rtl";
    ctx.textAlign = "right";

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const textX = canvas.width - padding;
    ctx.fillText(text, textX, canvas.height / 2);

    const imgData = canvas.toDataURL("image/png");

    const mmWidth = (canvas.width / scale) * 0.264583;
    const mmHeight = (canvas.height / scale) * 0.264583;

    let targetX = x;
    if (align === "right") {
      targetX = x - mmWidth + (padding / scale) * 0.264583;
    } else {
      targetX = x - (padding / scale) * 0.264583;
    }
    const targetY = y - (mmHeight / 2);

    doc.addImage(imgData, "PNG", targetX, targetY, mmWidth, mmHeight, undefined, "FAST");
  } catch (err) {
    console.error("Arabic canvas rendering fallback:", err);
    doc.setFont("helvetica", style);
    doc.text(text, x, y);
  }
}

// Custom Arabic Word wrap measured symmetrically
export function wrapArabicText(
  text: string,
  maxWidthMm: number,
  fontSize: number,
  style: "bold" | "normal" | "italic" = "normal"
): string[] {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return [text];

    let fontStyle = "";
    if (style === "bold") fontStyle = "bold ";
    if (style === "italic") fontStyle = "italic ";
    ctx.font = `${fontStyle}${fontSize * 4}px "Cairo", "Amiri", "Inter", "Segoe UI", Tahoma, Arial, sans-serif`;

    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = "";

    const maxWidthPx = maxWidthMm * 3.7795 * 4; // Scale 4

    for (const word of words) {
      if (!word) continue;
      const testLine = currentLine ? currentLine + " " + word : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidthPx) {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          lines.push(testLine);
          currentLine = "";
        }
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  } catch (err) {
    console.error("wrapArabicText failing fallback:", err);
    return [text];
  }
}

export function exportItineraryToPDF(
  englishItinerary: Itinerary,
  arabicItinerary: Itinerary,
  flight: FlightMock | null | undefined,
  hotel: HotelMock | null | undefined
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageHeight = 297;
  const pageWidth = 210;
  const marginX = 15;
  const printWidth = pageWidth - (marginX * 2);

  let y = 15;

  const ensureSpace = (needed: number, isArabicSection: boolean) => {
    if (y + needed > pageHeight - 20) {
      doc.addPage();
      y = 15;
      
      // Page Header & Footer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      
      const headerTitle = isArabicSection ? "وكالة التخطيط الذكي للرحلات" : "AI Smart Travel Agency";
      const subTitle = isArabicSection ? "برنامج الرحلة الإرشادية" : "Bespoke Travel Guide & Roadmap";
      
      if (isArabicSection) {
        drawText(headerTitle, pageWidth - marginX, 10, 8, "normal", [150, 150, 150], "right");
        drawText(`صفحة ${doc.getNumberOfPages()}`, marginX, 10, 8, "normal", [150, 150, 150], "left");
      } else {
        drawText(headerTitle, marginX, 10, 8, "normal", [150, 150, 150], "left");
        drawText(`Page ${doc.getNumberOfPages()}`, pageWidth - marginX - 15, 10, 8, "normal", [150, 150, 150], "left");
      }
      
      doc.setDrawColor(240, 240, 240);
      doc.line(marginX, 12, pageWidth - marginX, 12);
      y = 18;
    }
  };

  const drawText = (
    text: string,
    xPos: number,
    yPos: number,
    fontSize: number,
    style: "bold" | "normal" | "italic" = "normal",
    color: [number, number, number] = [30, 41, 59],
    align: "left" | "right" = "left"
  ) => {
    if (!text) return;
    if (hasArabic(text)) {
      drawArabicCanvasText(doc, text, xPos, yPos, fontSize, style, color, align);
    } else {
      doc.setFont("helvetica", style);
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(text, xPos, yPos);
    }
  };

  const drawWrapText = (
    text: string,
    xPos: number,
    fontSize: number,
    style: "bold" | "normal" | "italic" = "normal",
    color: [number, number, number] = [71, 85, 105],
    width = printWidth,
    align: "left" | "right" = "left"
  ) => {
    if (!text) return;
    if (hasArabic(text)) {
      const lines = wrapArabicText(text, width, fontSize, style);
      const isRTL = align === "right";
      const actualX = isRTL ? xPos + width : xPos;
      for (const line of lines) {
        ensureSpace(5, true);
        drawArabicCanvasText(doc, line, actualX, y, fontSize, style, color, align);
        y += 5;
      }
    } else {
      doc.setFont("helvetica", style);
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);
      const lines = doc.splitTextToSize(text, width);
      for (const line of lines) {
        ensureSpace(5, false);
        doc.text(line, xPos, y);
        y += 5;
      }
    }
  };

  // Render Section (Modular)
  const drawItinerarySection = (itinerary: Itinerary, isAr: boolean) => {
    y = 15;
    
    // --- SPECIAL BANNER FOR ARABIC SECTION ---
    if (isAr) {
      ensureSpace(20, true);
      doc.setFillColor(79, 70, 229); // Royal indigo bg for section separation
      doc.rect(marginX, y, printWidth, 12, "F");
      drawText("الترجمة العربية المعتمدة للرحلة / ARABIC OFFICIAL TRANSLATION", marginX + (printWidth/2), y + 7.5, 9.5, "bold", [255, 255, 255], "right");
      y += 18;
    }

    // --- MAIN HEADER BANNER ---
    ensureSpace(35, isAr);
    doc.setFillColor(30, 41, 59); // Dark navy
    doc.rect(marginX, y, printWidth, 26, "F");
    
    doc.setDrawColor(79, 70, 229); // Indigo line accent
    doc.setLineWidth(1);
    doc.line(marginX, y, marginX + printWidth, y);

    if (isAr) {
      drawText("وكالة التخطيط الذكي للرحلات", marginX + printWidth - 6, y + 8, 11, "bold", [165, 180, 252], "right");
      const destCombined = `${itinerary.destinationName} (${itinerary.country})`;
      drawText(destCombined, marginX + printWidth - 6, y + 17, 15, "bold", [255, 255, 255], "right");
    } else {
      drawText("AI SMART TRAVEL AGENCY", marginX + 6, y + 8, 11, "bold", [165, 180, 252], "left");
      const destCombined = `${itinerary.destinationName}, ${itinerary.country}`;
      drawText(destCombined.toUpperCase(), marginX + 6, y + 17, 16, "bold", [255, 255, 255], "left");
    }

    y += 32;

    // --- META PROFILE SPECIFICATIONS ---
    ensureSpace(48, isAr);
    doc.setFillColor(248, 250, 252); // Soft slate 50
    doc.rect(marginX, y, printWidth, 42, "F");
    doc.setDrawColor(226, 232, 240); // border
    doc.setLineWidth(0.3);
    doc.rect(marginX, y, printWidth, 42, "S");

    // We align left or right depending on lang
    if (isAr) {
      const rightCol = marginX + printWidth - 6;
      const leftCol = marginX + (printWidth / 2) - 6;

      drawText(`مدة الرحلة: ${itinerary.tripDurationDays} أيام`, rightCol, y + 8, 9, "bold", [30, 41, 59], "right");
      drawText(`فئة الميزانية: ${itinerary.targetBudgetLevel}`, rightCol, y + 16, 9, "normal", [71, 85, 105], "right");
      drawText(`فئة المسافرين: ${itinerary.travelerType}`, rightCol, y + 24, 9, "normal", [71, 85, 105], "right");
      drawText(`غرض الرحلة: ${itinerary.tripPurpose || "سياحة واستكشاف"}`, rightCol, y + 32, 8, "normal", [71, 85, 105], "right");

      drawText(`تاريخ المغادرة المخطط: ${itinerary.departureDate || "مرن"}`, leftCol, y + 8, 9, "normal", [71, 85, 105], "right");
      drawText(`الميزانية المخصصة: ${itinerary.allocatedBudgetAmount || "مرنة"}`, leftCol, y + 16, 9, "normal", [71, 85, 105], "right");
      drawText(`وسيلة التنقل المفضلة: ${itinerary.transitMode || "طائرة"}`, leftCol, y + 24, 9, "normal", [71, 85, 105], "right");
      drawText(`نوع الإقامة المختار: ${itinerary.lodgingType || "فندق"}`, leftCol, y + 32, 8, "normal", [71, 85, 105], "right");
    } else {
      const leftCol = marginX + 6;
      const rightCol = marginX + (printWidth / 2) + 6;

      drawText(`Trip Duration: ${itinerary.tripDurationDays} Days`, leftCol, y + 8, 9, "bold", [30, 41, 59], "left");
      drawText(`Budget Level: ${itinerary.targetBudgetLevel}`, leftCol, y + 16, 9, "normal", [71, 85, 105], "left");
      drawText(`Traveler Profile: ${itinerary.travelerType}`, leftCol, y + 24, 9, "normal", [71, 85, 105], "left");
      drawText(`Main Purpose: ${itinerary.tripPurpose || "Tourism"}`, leftCol, y + 32, 8, "normal", [71, 85, 105], "left");

      drawText(`Planned Date: ${itinerary.departureDate || "Flexible"}`, rightCol, y + 8, 9, "normal", [71, 85, 105], "left");
      drawText(`Budget Cap: ${itinerary.allocatedBudgetAmount || "Flexible"}`, rightCol, y + 16, 9, "normal", [71, 85, 105], "left");
      drawText(`Transit Mode: ${itinerary.transitMode || "Standard Plane / Flight"}`, rightCol, y + 24, 9, "normal", [71, 85, 105], "left");
      drawText(`Lodging Pref: ${itinerary.lodgingType || "Hotel"}`, rightCol, y + 32, 8, "normal", [71, 85, 105], "left");
    }

    y += 48;

    // --- METEOROLOGY & TIMING RECOMMENDATIONS ---
    if (itinerary.climateAdvisoryAlert) {
      const linesCount = hasArabic(itinerary.climateAdvisoryAlert) 
        ? wrapArabicText(itinerary.climateAdvisoryAlert, printWidth - 10, 8).length
        : doc.splitTextToSize(itinerary.climateAdvisoryAlert, printWidth - 10).length;
      const boxHeight = 12 + (linesCount * 5) + 4;

      ensureSpace(boxHeight + 5, isAr);
      const currentY = y;
      
      doc.setFillColor(254, 243, 199); // Amber 100 bg
      doc.rect(marginX, currentY, printWidth, boxHeight, "F");
      doc.setDrawColor(245, 158, 11); // Amber 500 border
      doc.setLineWidth(0.4);
      doc.rect(marginX, currentY, printWidth, boxHeight, "S");

      if (isAr) {
        drawText("🌦️ التنبيهات الجوية وتوجيهات الطقس الموسمية", marginX + printWidth - 5, currentY + 6, 9.5, "bold", [180, 83, 9], "right");
        y += 11;
        drawWrapText(itinerary.climateAdvisoryAlert, marginX + 5, 8, "normal", [120, 53, 4], printWidth - 10, "right");
      } else {
        drawText("🌦️ METEOROLOGY & TIMING RECOMMENDATIONS", marginX + 5, currentY + 6, 9.5, "bold", [180, 83, 9], "left");
        y += 11;
        drawWrapText(itinerary.climateAdvisoryAlert, marginX + 5, 8.5, "normal", [120, 53, 4], printWidth - 10, "left");
      }
      y = currentY + boxHeight + 6;
    }

    // --- ACTIVE LOCAL EXPOS & EVENTS ---
    if (itinerary.localEventsAndExpos && itinerary.localEventsAndExpos.length > 0) {
      ensureSpace(20, isAr);
      if (isAr) {
        drawText("📅 الفعاليات الثقافية والمعارض النشطة لهذه الفترة", marginX + printWidth, y, 10.5, "bold", [79, 70, 229], "right");
      } else {
        drawText("📅 ACTIVE LOCAL EXPOS, TRADE FAIRS & FESTIVALS", marginX, y, 10.5, "bold", [79, 70, 229], "left");
      }
      y += 3;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(marginX, y, marginX + printWidth, y);
      y += 6;

      for (const expo of itinerary.localEventsAndExpos) {
        ensureSpace(20, isAr);
        doc.setFillColor(249, 250, 251);
        doc.rect(marginX, y, printWidth, 14, "F");
        doc.setDrawColor(226, 232, 240);
        doc.rect(marginX, y, printWidth, 14, "S");

        if (isAr) {
          drawText(`🎪 ${expo.name}`, marginX + printWidth - 4, y + 5, 8.5, "bold", [30, 41, 59], "right");
          drawText(`تاريخ: ${expo.date}`, marginX + 4, y + 5, 8, "italic", [100, 116, 139], "left");
          drawText(`نصيحة الحضور: ${expo.advisabilityNote}`, marginX + printWidth - 4, y + 10, 8, "normal", [71, 85, 105], "right");
        } else {
          drawText(`🎪 ${expo.name}`, marginX + 4, y + 5, 8.5, "bold", [30, 41, 59], "left");
          drawText(`Date: ${expo.date}`, marginX + printWidth - 4, y + 5, 8, "italic", [100, 116, 139], "right");
          drawText(`Advice: ${expo.advisabilityNote}`, marginX + 4, y + 10, 8, "normal", [71, 85, 105], "left");
        }
        y += 18;
      }
    }

    // --- FLIGHT MATRIX ---
    if (flight) {
      ensureSpace(35, isAr);
      doc.setFillColor(239, 246, 255); // Blue 50
      doc.rect(marginX, y, printWidth, 26, "F");
      doc.setDrawColor(59, 130, 246); // Blue 500 border
      doc.setLineWidth(0.6);
      doc.rect(marginX, y, printWidth, 26, "S");

      if (isAr) {
        drawText("✈️ الرحلة الجوية المختارة والمقترحة من الوكالة", marginX + printWidth - 5, y + 6, 9.5, "bold", [29, 78, 216], "right");
        drawText(`شركة الطيران: ${flight.airline} (${flight.flightNumber})`, marginX + printWidth - 6, y + 13, 8.5, "bold", [30, 41, 59], "right");
        drawText(`مواعيد الطيران: ${flight.departureTime} -> ${flight.arrivalTime} (${flight.duration})`, marginX + printWidth - 6, y + 20, 8, "normal", [71, 85, 105], "right");
        
        drawText(`طبيعة الرحلة: ${flight.stops === 0 ? "رحلة مباشرة" : `توقف عدد ${flight.stops}`}`, marginX + 6, y + 13, 8.5, "normal", [71, 85, 105], "left");
        drawText(`السعر التقديري: $${flight.priceUSD}`, marginX + 6, y + 20, 9, "bold", [22, 101, 52], "left");
      } else {
        drawText("✈️ CONFIRMED SELECTED FLIGHT SELECTION", marginX + 5, y + 6, 9.5, "bold", [29, 78, 216], "left");
        drawText(`Airline: ${flight.airline} (${flight.flightNumber})`, marginX + 6, y + 13, 8.5, "bold", [30, 41, 59], "left");
        drawText(`Timings: ${flight.departureTime} -> ${flight.arrivalTime} (${flight.duration})`, marginX + 6, y + 20, 8, "normal", [71, 85, 105], "left");
        
        drawText(`Stops: ${flight.stops === 0 ? "Direct" : `${flight.stops} Stops`}`, marginX + printWidth - 6, y + 13, 8.5, "normal", [71, 85, 105], "right");
        drawText(`Estimated Airfare Cost: $${flight.priceUSD}`, marginX + printWidth - 6, y + 20, 9, "bold", [22, 101, 52], "right");
      }
      y += 32;
    }

    // --- ACCOMMODATION / HOTEL SELECTION ---
    if (hotel) {
      ensureSpace(45, isAr);
      doc.setFillColor(255, 251, 235); // Gold amber 50
      doc.rect(marginX, y, printWidth, 34, "F");
      doc.setDrawColor(245, 158, 11); // Amber 500
      doc.setLineWidth(0.6);
      doc.rect(marginX, y, printWidth, 34, "S");

      if (isAr) {
        drawText("🏨 الإقامة وفندق حجز المحطة النشط", marginX + printWidth - 5, y + 6, 9.5, "bold", [146, 64, 14], "right");
        drawText(`${hotel.name}`, marginX + printWidth - 6, y + 13, 9, "bold", [30, 41, 59], "right");
        drawText(`★ تصنيف ${hotel.stars} نجوم   (التقييم العام: ${hotel.rating}/5 من أصل ${hotel.reviews} تقييم)`, marginX + printWidth - 6, y + 19, 8, "normal", [71, 85, 105], "right");
        drawText(`العنوان الجغرافي: ${hotel.address}`, marginX + printWidth - 6, y + 25, 8, "italic", [100, 116, 139], "right");
        drawText(`السعر المعتمد: $${hotel.priceUSD} / ليلة`, marginX + 6, y + 13, 9, "bold", [22, 101, 52], "left");
        drawText(`المميزات والخدمات: ${hotel.amenities.slice(0, 3).join(" • ")}`, marginX + 6, y + 30, 7.5, "normal", [100, 116, 139], "left");
      } else {
        drawText("🏨 CONFIRMED RESERVATION ACCOMMODATION", marginX + 5, y + 6, 9.5, "bold", [146, 64, 14], "left");
        drawText(`${hotel.name}`, marginX + 6, y + 13, 9, "bold", [30, 41, 59], "left");
        drawText(`★ ${hotel.stars} Stars   (Rating: ${hotel.rating}/5 from ${hotel.reviews} reviews)`, marginX + 6, y + 19, 8, "normal", [71, 85, 105], "left");
        drawText(`Address: ${hotel.address}`, marginX + 6, y + 25, 8, "italic", [100, 116, 139], "left");
        drawText(`Est. Rate: $${hotel.priceUSD} / Night`, marginX + printWidth - 6, y + 13, 9, "bold", [22, 101, 52], "right");
        drawText(`Amenities: ${hotel.amenities.slice(0, 3).join(", ")}`, marginX + 6, y + 30, 7.5, "normal", [100, 116, 139], "left");
      }
      y += 40;
    }

    // --- ESTIMATED TRANSIT GROUND SCHEDULES ---
    if (itinerary.estimatedTransitSchedules && itinerary.estimatedTransitSchedules.length > 0) {
      ensureSpace(30, isAr);
      if (isAr) {
        drawText("🚌 التوقيت التقريبي وخطوط النقل البري والبين-ولائي", marginX + printWidth, y, 10.5, "bold", [79, 70, 229], "right");
      } else {
        drawText("🚌 ESTIMATED GROUND TRANSPORT DEPARTURE TIMETABLES", marginX, y, 10.5, "bold", [79, 70, 229], "left");
      }
      y += 3;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(marginX, y, marginX + printWidth, y);
      y += 6;

      for (const schedule of itinerary.estimatedTransitSchedules) {
        ensureSpace(24, isAr);
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, y, printWidth, 18, "F");
        doc.setDrawColor(226, 232, 240);
        doc.rect(marginX, y, printWidth, 18, "S");

        if (isAr) {
          drawText(`وسيلة النقل: ${schedule.transportMethod}`, marginX + printWidth - 4, y + 5, 8.5, "bold", [30, 41, 59], "right");
          drawText(`أوقات الرحلات: ${schedule.departureDayTime}`, marginX + printWidth - 4, y + 10, 8, "normal", [71, 85, 105], "right");
          drawText(`المحطة: ${schedule.stationName} | التسعيرة: ${schedule.frequencyAndPrice}`, marginX + printWidth - 4, y + 14, 7.5, "normal", [100, 116, 139], "right");
          if (schedule.contactPhone) {
            drawText(`الهاتف: ${schedule.contactPhone}`, marginX + 4, y + 10, 8, "bold", [79, 70, 229], "left");
          }
        } else {
          drawText(`Transit: ${schedule.transportMethod}`, marginX + 4, y + 5, 8.5, "bold", [30, 41, 59], "left");
          drawText(`Timings: ${schedule.departureDayTime}`, marginX + 4, y + 10, 8, "normal", [71, 85, 105], "left");
          drawText(`Station: ${schedule.stationName} | Fare: ${schedule.frequencyAndPrice}`, marginX + 4, y + 14, 7.5, "normal", [100, 116, 139], "left");
          if (schedule.contactPhone) {
            drawText(`Phone: ${schedule.contactPhone}`, marginX + printWidth - 4, y + 10, 8, "bold", [79, 70, 229], "right");
          }
        }
        y += 22;
      }
      y += 4;
    }

    // --- MISSION SCHEDULING DETAILS ---
    if (itinerary.administrativeMissionDetails && itinerary.administrativeMissionDetails.destinationsList && itinerary.administrativeMissionDetails.destinationsList.length > 0) {
      ensureSpace(30, isAr);
      if (isAr) {
        drawText("💼 تفاصيل المهمات الاستشفائية والإجراءات الإدارية المنسقة", marginX + printWidth, y, 10.5, "bold", [190, 24, 74], "right");
      } else {
        drawText("💼 MISSION WORKFLOW GUIDELINES", marginX, y, 10.5, "bold", [190, 24, 74], "left");
      }
      y += 3;
      doc.setDrawColor(244, 63, 94);
      doc.setLineWidth(0.5);
      doc.line(marginX, y, marginX + printWidth, y);
      y += 6;

      if (itinerary.administrativeMissionDetails.missionOverview) {
        ensureSpace(15, isAr);
        drawWrapText(itinerary.administrativeMissionDetails.missionOverview, marginX, 8, "italic", [71, 85, 105], printWidth, isAr ? "right" : "left");
        y += 2;
      }

      for (const dest of itinerary.administrativeMissionDetails.destinationsList) {
        ensureSpace(28, isAr);
        doc.setFillColor(255, 241, 242); // Rose 50
        doc.rect(marginX, y, printWidth, 23, "F");
        doc.setDrawColor(244, 63, 94); // Rose 500
        doc.rect(marginX, y, printWidth, 23, "S");

        if (isAr) {
          drawText(`🏥 المكتب / المركز العلاجي: ${dest.name}`, marginX + printWidth - 4, y + 5, 8.5, "bold", [159, 18, 57], "right");
          drawText(`الانتظار المتوقع: ${dest.estimatedQueueTime}`, marginX + 4, y + 5, 8, "bold", [159, 18, 57], "left");
          drawText(`توجيه التنقل والوصول: ${dest.transitAdvice}`, marginX + printWidth - 4, y + 10, 7.5, "normal", [71, 85, 105], "right");
          drawText(`الوثائق والملفات المرافقة: ${dest.documentsRequired.join(" ، ")}`, marginX + printWidth - 4, y + 14, 7.5, "italic", [100, 116, 139], "right");
          drawText(`رقم الهاتف: ${dest.phoneNumber || "غير متوفر"}  |  العنوان: ${dest.address || "غير متوفر"}`, marginX + printWidth - 4, y + 18, 7.5, "bold", [136, 19, 55], "right");
        } else {
          drawText(`🏥 Office/Clinic: ${dest.name}`, marginX + 4, y + 5, 8.5, "bold", [159, 18, 57], "left");
          drawText(`Est. Wait: ${dest.estimatedQueueTime}`, marginX + printWidth - 4, y + 5, 8, "bold", [159, 18, 57], "right");
          drawText(`Transit advice: ${dest.transitAdvice}`, marginX + 4, y + 10, 7.5, "normal", [71, 85, 105], "left");
          drawText(`Documents required: ${dest.documentsRequired.join(", ")}`, marginX + 4, y + 14, 7.5, "italic", [100, 116, 139], "left");
          drawText(`Contact Tel: ${dest.phoneNumber || "N/A"}  |  Address: ${dest.address || "N/A"}`, marginX + 4, y + 18, 7.5, "bold", [136, 19, 55], "left");
        }
        y += 27;
      }
      y += 4;
    }

    // --- NEARBY PLACES AND COMFORT BOARD ---
    if (itinerary.nearbyPlacesAndUtilities) {
      ensureSpace(30, isAr);
      if (isAr) {
        drawText("📍 الخدمات والمرافق الأساسية المجاورة الموصى بها", marginX + printWidth, y, 10.5, "bold", [79, 70, 229], "right");
      } else {
        drawText("📍 LOCAL ESSENTIAL SERVICES & CONVENIENCE PLACES", marginX, y, 10.5, "bold", [79, 70, 229], "left");
      }
      y += 3;
      doc.setDrawColor(226, 232, 240);
      doc.line(marginX, y, marginX + printWidth, y);
      y += 6;

      const items: string[] = [];
      const n = itinerary.nearbyPlacesAndUtilities;
      if (isAr) {
        if (n.restaurantsAndCafes && n.restaurantsAndCafes.length > 0) {
          items.push(`المطاعم والمقاهي: ${n.restaurantsAndCafes.map(x => `${x.name} (${x.type} - ${x.description})`).join(" | ")}`);
        }
        if (n.mosquesAndRestrooms && n.mosquesAndRestrooms.length > 0) {
          items.push(`المساجد ودور المياه العامة: ${n.mosquesAndRestrooms.map(x => `${x.name} (المرافق العامة: ${x.hasPublicRestroom ? "نعم" : "لا"} - نصيحة: ${x.prayerTimesTransitAdvice})`).join(" | ")}`);
        }
        if (n.medicalServices && n.medicalServices.length > 0) {
          items.push(`الخدمات الطبية وعيادات الطوارئ: ${n.medicalServices.map(x => `${x.name} (${x.type} - ${x.description})`).join(" | ")}`);
        }
        if (n.nearbyAlternativeLodgings && n.nearbyAlternativeLodgings.length > 0) {
          items.push(`خيارات إقامة بديلة: ${n.nearbyAlternativeLodgings.map(x => `${x.name} (${x.type} - السعر التقريبي: ${x.priceEstimateLocal})`).join(" | ")}`);
        }
        if (n.businessAndPrintingServices && n.businessAndPrintingServices.length > 0) {
          items.push(`خدمات الطباعة والمكتبات: ${n.businessAndPrintingServices.map(x => `${x.name} (${x.type} - ${x.description})`).join(" | ")}`);
        }
      } else {
        if (n.restaurantsAndCafes && n.restaurantsAndCafes.length > 0) {
          items.push(`Restaurants & Cafes: ${n.restaurantsAndCafes.map(x => `${x.name} (${x.type} - ${x.description})`).join(" | ")}`);
        }
        if (n.mosquesAndRestrooms && n.mosquesAndRestrooms.length > 0) {
          items.push(`Mosques & Public Restrooms: ${n.mosquesAndRestrooms.map(x => `${x.name} (Restroom: ${x.hasPublicRestroom ? "Yes" : "No"} - Advice: ${x.prayerTimesTransitAdvice})`).join(" | ")}`);
        }
        if (n.medicalServices && n.medicalServices.length > 0) {
          items.push(`Emergency Medical Clinics/Pharmacies: ${n.medicalServices.map(x => `${x.name} (${x.type} - ${x.description})`).join(" | ")}`);
        }
        if (n.nearbyAlternativeLodgings && n.nearbyAlternativeLodgings.length > 0) {
          items.push(`Alternative Lodgings: ${n.nearbyAlternativeLodgings.map(x => `${x.name} (${x.type} - Rate: ${x.priceEstimateLocal})`).join(" | ")}`);
        }
        if (n.businessAndPrintingServices && n.businessAndPrintingServices.length > 0) {
          items.push(`Printing & Business Kiosks: ${n.businessAndPrintingServices.map(x => `${x.name} (${x.type} - ${x.description})`).join(" | ")}`);
        }
      }

      for (const item of items) {
        ensureSpace(12, isAr);
        drawWrapText(item, marginX + 2, 7.5, "normal", [71, 85, 105], printWidth - 5, isAr ? "right" : "left");
        y += 2;
      }
      y += 4;
    }

    // --- THE DAILY ROADMAP AGENDA ---
    ensureSpace(20, isAr);
    if (isAr) {
      drawText("📅 الجدول اليومي المفصل والأنشطة الإرشادية", marginX + printWidth, y, 11, "bold", [79, 70, 229], "right");
    } else {
      drawText("📅 DETAILED DAILY SCHEDULE ROADMAP", marginX, y, 11, "bold", [79, 70, 229], "left");
    }
    y += 3;
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.5);
    doc.line(marginX, y, marginX + printWidth, y);
    y += 6;

    for (const day of itinerary.days) {
      ensureSpace(18, isAr);
      doc.setFillColor(241, 245, 249); // slate 100 bg
      doc.rect(marginX, y, printWidth, 8, "F");
      
      if (isAr) {
        drawText(`اليوم ${day.dayNumber} : ${day.theme}`, marginX + printWidth - 4, y + 5.5, 9, "bold", [30, 41, 59], "right");
      } else {
        drawText(`DAY ${day.dayNumber} : ${day.theme}`, marginX + 4, y + 5.5, 9, "bold", [30, 41, 59], "left");
      }
      y += 12;

      for (const activity of day.activities) {
        ensureSpace(20, isAr);
        
        // Marker
        doc.setFillColor(79, 70, 229);
        if (isAr) {
          doc.rect(marginX + printWidth - 3.5, y + 1, 1.5, 5, "F");
          drawText(`${activity.title}`, marginX + printWidth - 6, y + 5, 8.5, "bold", [30, 41, 59], "right");
          
          const amPm = activity.timeOfDay === "Morning" ? "صباحاً" : activity.timeOfDay === "Afternoon" ? "بعد الظهر" : activity.timeOfDay === "Evening" ? "مساءً" : activity.timeOfDay;
          const subHeader = `التوقيت: ${amPm} (${activity.durationHours} ساعات) ${activity.estimatedCostUSD > 0 ? `| التكلفة التقديرية: $${activity.estimatedCostUSD}` : ""}`;
          drawText(subHeader, marginX + printWidth - 6, y + 9, 7.5, "italic", [100, 116, 139], "right");
        } else {
          doc.rect(marginX + 2, y + 1, 1.5, 5, "F");
          drawText(`${activity.title}`, marginX + 6, y + 5, 8.5, "bold", [30, 41, 59], "left");
          
          const subHeader = `Time: ${activity.timeOfDay} (${activity.durationHours} hrs) ${activity.estimatedCostUSD > 0 ? `| Est. Cost: $${activity.estimatedCostUSD}` : ""}`;
          drawText(subHeader, marginX + 6, y + 9, 7.5, "italic", [100, 116, 139], "left");
        }
        
        y += 13;
        
        drawWrapText(activity.description, marginX + 6, 8, "normal", [71, 85, 105], printWidth - 12, isAr ? "right" : "left");
        
        if (activity.locationName) {
          ensureSpace(6, isAr);
          if (isAr) {
            drawText(`📍 موقع المعلم: ${activity.locationName}`, marginX + printWidth - 6, y, 7.5, "normal", [79, 70, 229], "right");
          } else {
            drawText(`📍 Location: ${activity.locationName}`, marginX + 6, y, 7.5, "normal", [79, 70, 229], "left");
          }
          y += 5;
        }
        y += 3;
      }
      y += 2;
    }

    y += 4;

    // --- HIGHLY RATED LODGING RECOMMENDATIONS ---
    ensureSpace(30, isAr);
    if (isAr) {
      drawText("🏨 ترشيحات إضافية لخيارات الإقامة والفنادق", marginX + printWidth, y, 10.5, "bold", [79, 70, 229], "right");
    } else {
      drawText("🏨 HIGHLY RATED LODGING SUGGESTIONS", marginX, y, 10.5, "bold", [79, 70, 229], "left");
    }
    y += 3;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(marginX, y, marginX + printWidth, y);
    y += 6;

    for (const suggestedHotel of itinerary.suggestedHotels) {
      const recText = isAr 
        ? `ميزة الترشيح: ${suggestedHotel.reasonForRecommendation}`
        : `Recommendation Value: ${suggestedHotel.reasonForRecommendation}`;

      const linesCount = hasArabic(recText) 
        ? wrapArabicText(recText, printWidth - 8, 7.5).length
        : doc.splitTextToSize(recText, printWidth - 8).length;
      
      const boxHeight = 14 + (linesCount * 4.5) + 3;

      ensureSpace(boxHeight + 4, isAr);
      const currentY = y;
      
      doc.setFillColor(252, 252, 253);
      doc.rect(marginX, currentY, printWidth, boxHeight, "F");
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.rect(marginX, currentY, printWidth, boxHeight, "S");

      if (isAr) {
        drawText(`${suggestedHotel.name} - ★ تصنيف ${suggestedHotel.stars} نجوم`, marginX + printWidth - 4, currentY + 5, 8.5, "bold", [30, 41, 59], "right");
        drawText(`التكلفة الليلة: $${suggestedHotel.pricePerNightUSD}/ليلة`, marginX + 4, currentY + 5, 8, "bold", [22, 101, 52], "left");
        drawText(`الهاتف: ${suggestedHotel.phoneNumber || "N/A"}  |  العنوان: ${suggestedHotel.address || "N/A"}`, marginX + printWidth - 4, currentY + 10, 7.5, "italic", [71, 85, 105], "right");
        
        y += 14;
        drawWrapText(recText, marginX + 4, 7.5, "normal", [100, 116, 139], printWidth - 8, "right");
      } else {
        drawText(`${suggestedHotel.name} - ★ ${suggestedHotel.stars} Stars`, marginX + 4, currentY + 5, 8.5, "bold", [30, 41, 59], "left");
        drawText(`Price Estimate: $${suggestedHotel.pricePerNightUSD}/night`, marginX + printWidth - 4, currentY + 5, 8, "bold", [22, 101, 52], "right");
        drawText(`Tel: ${suggestedHotel.phoneNumber || "N/A"}  |  Address: ${suggestedHotel.address || "N/A"}`, marginX + 4, currentY + 10, 7.5, "italic", [71, 85, 105], "left");
        
        y += 14;
        drawWrapText(recText, marginX + 4, 7.5, "normal", [100, 116, 139], printWidth - 8, "left");
      }
      y = currentY + boxHeight + 4;
    }

    y += 3;

    // --- CUSTOMIZED PACKING CHECKLIST ---
    ensureSpace(28, isAr);
    if (isAr) {
      drawText("🎒 قائمة التجهيز والحقائب الذكية المقترحة", marginX + printWidth, y, 10.5, "bold", [79, 70, 229], "right");
    } else {
      drawText("🎒 CUSTOMIZED CATEGORIZED PACKING CHECKLIST", marginX, y, 10.5, "bold", [79, 70, 229], "left");
    }
    y += 3;
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, y, marginX + printWidth, y);
    y += 6;

    for (const cat of itinerary.customPackingList) {
      ensureSpace(18, isAr);
      if (isAr) {
        drawText(`• تصنيف: ${cat.category.toUpperCase()}`, marginX + printWidth, y, 9, "bold", [79, 70, 229], "right");
      } else {
        drawText(`• ${cat.category.toUpperCase()}`, marginX, y, 9, "bold", [79, 70, 229], "left");
      }
      y += 5;

      const halfLen = Math.ceil(cat.items.length / 2);
      for (let i = 0; i < halfLen; i++) {
        ensureSpace(5, isAr);
        const item1 = cat.items[i];
        const item2 = cat.items[i + halfLen] || "";

        if (isAr) {
          drawText(`[ ]  ${item1}`, marginX + printWidth - 4, y, 8, "normal", [71, 85, 105], "right");
          if (item2) {
            drawText(`[ ]  ${item2}`, marginX + printWidth - 90, y, 8, "normal", [71, 85, 105], "right");
          }
        } else {
          drawText(`[ ]  ${item1}`, marginX + 4, y, 8, "normal", [71, 85, 105], "left");
          if (item2) {
            drawText(`[ ]  ${item2}`, marginX + 90, y, 8, "normal", [71, 85, 105], "left");
          }
        }
        y += 4.5;
      }
      y += 3;
    }

    y += 5;

    // --- CULTURE & SAFETIES LOCAL TRAVEL TIPS ---
    if (itinerary.localTravelTips && itinerary.localTravelTips.length > 0) {
      ensureSpace(25, isAr);
      if (isAr) {
        drawText("💡 توجيهات الأمان والنصائح الثقافية المحلية هام", marginX + printWidth, y, 10.5, "bold", [79, 70, 229], "right");
      } else {
        drawText("💡 CULTURE & SAFETIES LOCAL TRAVEL TIPS", marginX, y, 10.5, "bold", [79, 70, 229], "left");
      }
      y += 3;
      doc.setDrawColor(226, 232, 240);
      doc.line(marginX, y, marginX + printWidth, y);
      y += 6;

      for (const tip of itinerary.localTravelTips) {
        ensureSpace(10, isAr);
        drawWrapText(`- ${tip}`, marginX + 2, 8, "normal", [71, 85, 105], printWidth - 5, isAr ? "right" : "left");
        y += 1;
      }
    }

    // --- PREMIUM PACKAGES ADD-ONS ---
    if ((itinerary.insurancePolicy && itinerary.insurancePolicy.enabled) || (itinerary.fos7aSponsorship && itinerary.fos7aSponsorship.enabled)) {
      ensureSpace(35, isAr);
      if (isAr) {
        drawText("🌟 باقات الخدمات الإضافية الملحقة النشطة", marginX + printWidth, y, 10.5, "bold", [79, 70, 229], "right");
      } else {
        drawText("🌟 OPTIONAL ACTIVE PREMIUM ADD-ONS & BENEFITS", marginX, y, 10.5, "bold", [79, 70, 229], "left");
      }
      y += 3;
      doc.setDrawColor(79, 70, 229);
      doc.setLineWidth(0.5);
      doc.line(marginX, y, marginX + printWidth, y);
      y += 6;

      if (itinerary.insurancePolicy && itinerary.insurancePolicy.enabled) {
        ensureSpace(20, isAr);
        const plc = itinerary.insurancePolicy;
        const geoZone = plc.zone === "local" ? "تأمين محلي بالجزائر" : plc.zone === "mena" ? "منطقة شمال أفريقيا والشرق الأوسط" : plc.zone === "europe" ? "أوروبا (شينغن)" : "تغطية عالمية شاملة";
        const tier = plc.type === "basic" ? "باقة أساسية اقتصادية" : plc.type === "premium" ? "باقة رفاهية معززة" : "باقة في آي بي شاملة";
        const age = plc.ageGroup === "youth" ? "شباب (<25 سنة)" : plc.ageGroup === "adult" ? "بالغ (25-59 سنة)" : "فئة عمرية 60+ سنة";

        if (isAr) {
          drawText("🛡️ وثيقة التأمين الصحي وتأمين السفر التفاعلي الذكي", marginX + printWidth - 2, y, 9, "bold", [30, 41, 59], "right");
          y += 4.5;
          drawText(`- فئة بوليصة التأمين: ${tier}`, marginX + printWidth - 6, y, 8, "normal", [71, 85, 105], "right");
          y += 4;
          drawText(`- عدد الأيام المؤمنة: ${plc.days} أيام مغطاة دولياً ومحلياً`, marginX + printWidth - 6, y, 8, "normal", [71, 85, 105], "right");
          y += 4;
          drawText(`- المنطقة الجغرافية المستحقة: ${geoZone}  |  المجموعة العمرية: ${age}`, marginX + printWidth - 6, y, 8, "normal", [71, 85, 105], "right");
          y += 4;
          drawText(`- قيمة القسط المستحق المدفوع: $${plc.premiumUSD.toFixed(2)} USD`, marginX + printWidth - 6, y, 8.5, "bold", [21, 128, 61], "right");
        } else {
          drawText("🛡️ Interactive Travel Insurance Policy Details", marginX + 2, y, 9, "bold", [30, 41, 59], "left");
          y += 4.5;
          drawText(`- Coverage Package Tier: ${plc.type}`, marginX + 6, y, 8, "normal", [71, 85, 105], "left");
          y += 4;
          drawText(`- Insured Days Duration: ${plc.days} active travel days`, marginX + 6, y, 8, "normal", [71, 85, 105], "left");
          y += 4;
          drawText(`- Geographical Zone: ${plc.zone}  |  Age Group: ${plc.ageGroup}`, marginX + 6, y, 8, "normal", [71, 85, 105], "left");
          y += 4;
          drawText(`- Guaranteed Premium Value: $${plc.premiumUSD.toFixed(2)} USD`, marginX + 6, y, 8.5, "bold", [21, 128, 61], "left");
        }
        y += 6;
      }

      if (itinerary.fos7aSponsorship && itinerary.fos7aSponsorship.enabled) {
        ensureSpace(25, isAr);
        const sp = itinerary.fos7aSponsorship;
        const thme = sp.tripTheme === "cultural" ? "استكشاف ثقافي وتاريخي" : sp.tripTheme === "sahara" ? "رحلات صحراوية وتخييم ذهبي" : sp.tripTheme === "mountain" ? "نزهة جبلية واستكشاف الغابات" : sp.tripTheme === "coastal" ? "سياحة ساحلية واستجمام بحري" : "مهمة إدارية وعلاجية خاصة";
        const cfg = sp.travelConfig === "solo" ? "مسافر فردي مستقل" : sp.travelConfig === "group" ? "مجموعة سياحية منظمة" : sp.travelConfig === "family" ? "عائلية ترفيهية" : sp.travelConfig === "couple" ? "رحلة هادئة لزوجين" : "رحلة عرسان جديدة";

        if (isAr) {
          drawText("⚡ طلب التكفل والرعاية الكاملة للرحلة - وكالة فسحة ديزاد", marginX + printWidth - 2, y, 9, "bold", [30, 41, 59], "right");
          y += 4.5;
          drawText(`- هيئة المجموعات المفضلة: ${cfg}`, marginX + printWidth - 6, y, 8, "normal", [71, 85, 105], "right");
          y += 4;
          drawText(`- النمط والموضوع الثقافي المختار: ${thme}`, marginX + printWidth - 6, y, 8, "normal", [71, 85, 105], "right");
          y += 4;
          drawText(`- ولاية الانطلاق الجغرافية: ولاية ${sp.departureWilaya || "الجزائر"}  |  تضمين تذاكر الإياب والعودة: ${sp.includeReturn ? "نعم، خدمة شاملة دقيقة" : "لا، ذهاب فقط"}`, marginX + printWidth - 6, y, 8, "normal", [71, 85, 105], "right");
          y += 4;
          drawText(`- الميزانية المحددة للرحل بالدينار: من ${sp.estimatedMinDZD?.toLocaleString()} دج إلى ${sp.estimatedMaxDZD?.toLocaleString()} دج`, marginX + printWidth - 6, y, 8.5, "bold", [79, 70, 229], "right");
          if (sp.submitted) {
            y += 4;
            drawText("  [ الحالة: تم إرسال طلب التكفل بنجاح إلى وكلاء خدمة فسحة ديزاد للمراجعة والاتصال بكم ]", marginX + printWidth - 6, y, 7.5, "bold", [14, 116, 144], "right");
          }
        } else {
          drawText("⚡ Fos7a DZ Agency Premium Unlimited Support", marginX + 2, y, 9, "bold", [30, 41, 59], "left");
          y += 4.5;
          drawText(`- Requested Group Setup: ${sp.travelConfig}`, marginX + 6, y, 8, "normal", [71, 85, 105], "left");
          y += 4;
          drawText(`- Preferred Custom Itinerary Theme: ${sp.tripTheme}`, marginX + 6, y, 8, "normal", [71, 85, 105], "left");
          y += 4;
          drawText(`- Origin Outpost: Departure from ${sp.departureWilaya || "Algiers"} Wilaya`, marginX + 6, y, 8, "normal", [71, 85, 105], "left");
          y += 4;
          drawText(`- Bespoke Services Estimated Budget: ${sp.estimatedMinDZD?.toLocaleString()} - ${sp.estimatedMaxDZD?.toLocaleString()} DZD`, marginX + 6, y, 8.5, "bold", [79, 70, 229], "left");
        }
        y += 6;
      }
    }

    // --- FOOTER SIGN OFF ---
    ensureSpace(23, isAr);
    y += 8;
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, y, marginX + printWidth, y);
    y += 5;
    if (isAr) {
      drawText("شكراً لكم لاختياركم وكالة التخطيط الذكي للرحلات. تمنياتنا لكم برحلة آمنة ومريحة!", marginX + printWidth, y, 8, "italic", [100, 116, 139], "right");
      drawText(`تاريخ الإصدار والطباعة المرجعي: ${new Date().toLocaleDateString("ar-DZ")}`, marginX + printWidth, y + 4, 7.5, "normal", [148, 163, 184], "right");
    } else {
      drawText("Thank you for choosing AI Smart Travel Agency. Have a safe journey!", marginX, y, 8, "italic", [100, 116, 139], "left");
      drawText(`Generated on: ${new Date().toLocaleDateString()}`, marginX, y + 4, 7, "normal", [148, 163, 184], "left");
    }
  };

  // 1. Draw English section first
  drawItinerarySection(englishItinerary, false);

  // 2. Clear divider and add page breakout for Arabic section translation
  doc.addPage();
  drawItinerarySection(arabicItinerary, true);

  // 3. Save PDF file cleanly
  const sanitizedDest = englishItinerary.destinationName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`bilingual_itinerary_${sanitizedDest}.pdf`);
}
