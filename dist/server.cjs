var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_genai = require("@google/genai");
var import_vite = require("vite");
import_dotenv.default.config();
var app = (0, import_express.default)();
app.use(import_express.default.json());
var PORT = 3e3;
var aiClient = null;
function getAiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is missing in secrets.");
    }
    aiClient = new import_genai.GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
function logCleanErrorWarning(apiEndpoint, error) {
  const errMsg = error?.message || String(error);
  console.log(`[Info] ${apiEndpoint} fallback initiated. Notice:`, errMsg);
}
async function generateContentWithFallback(params) {
  const modelsToTry = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest"
  ];
  const ai = getAiClient();
  let lastError = null;
  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[Gemini API] Querying model ${model} (attempt ${attempt}/3)...`);
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config
        });
        if (response && response.text) {
          console.log(`[Gemini API] Success using model ${model}`);
          return response;
        }
        throw new Error("Empty response text returned");
      } catch (err) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const errStr = errMsg.toLowerCase();
        const errStatus = String(err?.status || err?.code || "").toLowerCase();
        const isQuotaExceeded = errStr.includes("quota") || errStr.includes("rate-limit") || errStr.includes("exhausted") || errStr.includes("429") || errStr.includes("resource_exhausted") || errStatus.includes("429") || errStatus.includes("resource_exhausted");
        if (isQuotaExceeded) {
          console.log(`[Notice] API key current limits or quota reached. Promoting instant switch to highly optimized local fallback mode.`);
          throw new Error("SERVICE_QUOTA_EXHAUSTED");
        }
        const isTransient = errStr.includes("503") || errStr.includes("unavailable") || errStr.includes("demand") || errStr.includes("temp") || errStr.includes("overloaded") || errStr.includes("busy") || errStatus.includes("503") || errStatus.includes("unavailable");
        console.log(`[Gemini API] Model ${model} returned service notice (transient retry check)`);
        if (isTransient && attempt < 3) {
          const delay = attempt * 800;
          console.log(`[Gemini API] Short transient interruption. Backing off ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          break;
        }
      }
    }
  }
  throw lastError || new Error("All model fallback options exhausted");
}
app.post("/api/generate-itinerary", async (req, res) => {
  try {
    const {
      destination,
      daysCount,
      budget,
      travelerType,
      interests,
      lang,
      tripScope,
      originWilaya,
      departureDate,
      allocatedBudgetAmount,
      transitMode,
      tripPurpose,
      // tourism, medical, business_admin
      missionDestinationsText,
      // custom administrative or medical targeted entities
      lodgingType
      // hotel, guesthouse, hostel, home
    } = req.body;
    if (!destination || !daysCount) {
      return res.status(400).json({ error: "Destination and days count are required" });
    }
    const ai = getAiClient();
    const isAr = lang === "ar";
    const isDomestic = tripScope === "domestic";
    let systemInstruction = "";
    if (isAr) {
      if (isDomestic) {
        systemInstruction = "\u0623\u0646\u062A \u0648\u0643\u064A\u0644 \u0633\u0641\u0631 \u0648\u062E\u0628\u064A\u0631 \u0633\u064A\u0627\u062D\u064A \u0648\u0645\u0633\u062A\u0634\u0627\u0631 \u062E\u062F\u0645\u0627\u062A \u0644\u0648\u062C\u0633\u062A\u064A\u0629 \u062C\u0632\u0627\u0626\u0631\u064A \u0645\u062D\u062A\u0631\u0641 \u0645\u062A\u062E\u0635\u0635 \u0641\u064A \u0628\u0631\u0645\u062C\u0629 \u0627\u0644\u0631\u062D\u0644\u0627\u062A \u0627\u0644\u0645\u062A\u0643\u0627\u0645\u0644\u0629 \u0627\u0644\u0628\u064A\u0646-\u0648\u0644\u0627\u0626\u064A\u0629 \u0648\u0627\u0644\u062F\u0627\u062E\u0644\u064A\u0629 \u0641\u064A \u0627\u0644\u062C\u0632\u0627\u0626\u0631. \u0648\u0645\u0647\u0645\u062A\u0643 \u0647\u064A \u0625\u0646\u0634\u0627\u0621 \u0628\u0631\u0646\u0627\u0645\u062C \u0633\u064A\u0627\u062D\u064A\u060C \u0639\u0644\u0627\u062C\u064A\u060C \u0623\u0648 \u0625\u062F\u0627\u0631\u064A \u0645\u062A\u064A\u0646 \u064A\u0631\u0628\u0637 \u0628\u0623\u0635\u0627\u0644\u0629 \u0648\u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629 \u0628\u064A\u0646 \u0648\u0644\u0627\u064A\u0629 \u0627\u0644\u0627\u0646\u0637\u0644\u0627\u0642 \u0648\u0648\u0644\u0627\u064A\u0629 \u0627\u0644\u0648\u062C\u0647\u0629 \u0628\u0634\u0643\u0644 \u0645\u0630\u0647\u0644 \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0641\u0635\u062D\u0649. \u064A\u062C\u0628 \u0645\u0631\u0627\u062C\u0639\u0629 \u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0633\u0641\u0631\u060C \u0648\u0633\u064A\u0644\u0629 \u0627\u0644\u0646\u0642\u0644 \u0627\u0644\u0645\u062D\u062F\u062F\u0629 (\u0633\u0648\u0627\u0621 \u0637\u064A\u0631\u0627\u0646\u060C \u0642\u0637\u0627\u0631\u060C \u0633\u064A\u0627\u0631\u0629\u060C \u0623\u0648 \u062D\u0627\u0641\u0644\u0627\u062A \u0627\u0644\u0646\u0642\u0644 \u0627\u0644\u0628\u0631\u064A / \u0627\u0644\u062D\u0636\u0631\u064A)\u060C \u0648\u0627\u0644\u0645\u064A\u0632\u0627\u0646\u064A\u0629\u060C \u0648\u0627\u0642\u062A\u0631\u0627\u062D \u0648\u0633\u0627\u0626\u0644 \u0627\u0644\u0646\u0642\u0644 \u0628\u0627\u0644\u062D\u0627\u0641\u0644\u0627\u062A \u0644\u0644\u062A\u0646\u0642\u0644 \u0627\u0644\u0628\u064A\u0646-\u0648\u0644\u0627\u0626\u064A \u0648\u0627\u0644\u062D\u0636\u0631\u064A \u0648\u062A\u0642\u062F\u064A\u0645 \u0646\u0635\u0627\u0626\u062D \u063A\u0646\u064A\u0629. \u064A\u062C\u0628 \u062A\u0642\u062F\u064A\u0645 \u062A\u062D\u0630\u064A\u0631\u0627\u062A \u062C\u0648\u064A\u0629\u060C \u0648\u062A\u0632\u0648\u064A\u062F\u0646\u0627 \u0628\u0623\u0631\u0642\u0627\u0645 \u0627\u0644\u0637\u0648\u0627\u0631\u0626 \u0627\u0644\u062C\u0632\u0627\u0626\u0631\u064A\u0629 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 (\u0627\u0644\u0634\u0631\u0637\u0629 17 / 1548\u060C \u0627\u0644\u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u0645\u062F\u0646\u064A\u0629 14\u060C \u0627\u0644\u062F\u0631\u0643 \u0627\u0644\u0648\u0637\u0646\u064A 1055)\u060C \u0648\u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0644\u0644\u062F\u064A\u0646\u0627\u0631 \u0627\u0644\u062C\u0632\u0627\u0626\u0631\u064A (\u062F\u062C) \u0628\u0645\u0627 \u064A\u062A\u0648\u0627\u0641\u0642 \u0645\u0639 \u0645\u064A\u0632\u0627\u0646\u064A\u0629 \u0627\u0644\u0645\u0633\u0627\u0641\u0631 \u0648\u0627\u062E\u062A\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0625\u0642\u0627\u0645\u0629 (\u0641\u0646\u062F\u0642\u060C \u062F\u0627\u0631 \u0636\u064A\u0627\u0641\u0629\u060C \u062F\u0627\u0631 \u0634\u0628\u0627\u0628\u060C \u0623\u0648 \u0645\u0646\u0632\u0644 \u0643\u0625\u0642\u0627\u0645\u0629 \u0645\u0633\u062A\u0642\u0644\u0629).";
      } else {
        systemInstruction = "\u0623\u0646\u062A \u062E\u0628\u064A\u0631 \u0648\u0643\u064A\u0644 \u0633\u0641\u0631 \u0648\u0645\u062E\u0637\u0637 \u0631\u062D\u0644\u0627\u062A \u0645\u062D\u062A\u0631\u0641 \u0648\u0645\u0633\u062A\u0634\u0627\u0631 \u0644\u0648\u062C\u0633\u062A\u064A \u0644\u0631\u062D\u0644\u0627\u062A \u0627\u0644\u0633\u064A\u0627\u062D\u0629\u060C \u0627\u0644\u0639\u0644\u0627\u062C\u060C \u0648\u0627\u0644\u0645\u0647\u0627\u0645 \u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629. \u0645\u0647\u0645\u062A\u0643 \u0647\u064A \u0625\u0646\u0634\u0627\u0621 \u0628\u0631\u0646\u0627\u0645\u062C \u0631\u062D\u0644\u0629 \u0645\u0641\u0635\u0644 \u0648\u0645\u0644\u0647\u0645 \u0644\u0644\u063A\u0627\u064A\u0629 \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0641\u0635\u062D\u0649 \u064A\u062A\u0648\u0627\u0641\u0642 \u0628\u062F\u0642\u0629 \u0645\u0639 \u0631\u063A\u0628\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0648\u0645\u0648\u0627\u0632\u0646\u062A\u0647 \u0648\u0627\u0644\u063A\u0631\u0636 \u0627\u0644\u0645\u062D\u062F\u062F \u0644\u0631\u062D\u0644\u062A\u0647. \u064A\u062C\u0628 \u062A\u0642\u062F\u064A\u0645 \u0646\u0635\u0627\u0626\u062D \u0645\u0646\u0627\u062E\u064A\u0629\u060C \u0648\u062A\u062D\u062F\u064A\u062F \u0623\u0631\u0642\u0627\u0645 \u0627\u062A\u0635\u0627\u0644\u0627\u062A \u0627\u0644\u0637\u0648\u0627\u0631\u0626\u060C \u0648\u0634\u0631\u0648\u0637 \u0627\u0644\u062D\u062C\u0632 \u0628\u062F\u0642\u0629 \u0628\u0646\u0627\u0621 \u0639\u0644\u0649 \u062E\u064A\u0627\u0631\u0647 \u0644\u0644\u0625\u0642\u0627\u0645\u0629 (\u0641\u0646\u062F\u0642\u060C \u062F\u0627\u0631 \u0636\u064A\u0627\u0641\u0629\u060C \u062F\u0627\u0631 \u0634\u0628\u0627\u0628\u060C \u0623\u0648 \u0645\u0646\u0632\u0644 \u062E\u0627\u0635)\u060C \u0648\u0645\u062D\u0627\u0643\u0627\u0629 \u062E\u0631\u0627\u0626\u0637 \u0642\u0648\u0642\u0644 \u0648\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0627\u0644\u0646\u0642\u0644 \u0648\u0648\u0633\u0627\u0626\u0644 \u0627\u0644\u0646\u0642\u0644 \u0627\u0644\u0639\u0627\u0645 \u0645\u062B\u0644 \u0627\u0644\u062D\u0627\u0641\u0644\u0627\u062A \u0648\u0645\u062A\u0631\u0648 \u0627\u0644\u0623\u0646\u0641\u0627\u0642 \u0641\u064A \u0627\u0644\u062A\u0646\u0642\u0644\u0627\u062A \u0627\u0644\u062D\u0636\u0631\u064A\u0629 \u0627\u0644\u0628\u064A\u0646\u064A\u0629.";
      }
    } else {
      if (isDomestic) {
        systemInstruction = "You are an expert Algerian travel agent and logistics guide specializing in domestic inter-wilaya travel. Design highly authentic, localized travel and administrative routes starting from the origin province to the destination province in Algeria, showcasing traditional guest houses or private home rentals, architectural landmarks, and public bus network systems. Advise explicitly on climate, transit warnings (focusing heavily on intercity and urban public buses), domestic Algerian emergency numbers (17 / 1548 for Police, 14 for Protection Civile, 1055 for National Gendarmerie) and translate all expenses to Algerian Dinars (DZD / \u062F\u062C).";
      } else {
        systemInstruction = "You are an expert travel agent and professional logistics planner. Your job is to construct a highly detailed, beautifully structured travel, medical, or business itinerary. Optimize plans based on traveler purpose (tourism, medical, business_admin) and lodging preference (hotel, traditional guesthouse, youth hostel, or private home rental). Provide specific climate advisory alerts, public bus and transit strategies, official hotlines, lodging requirements, and mock Google Maps routes.";
      }
    }
    let prompt = "";
    if (isAr) {
      if (isDomestic) {
        prompt = `\u0642\u0645 \u0628\u062A\u062E\u0637\u064A\u0637 \u0628\u0631\u0646\u0627\u0645\u062C \u0631\u062D\u0644\u0629 \u062F\u0627\u062E\u0644\u064A\u0629 \u0645\u062A\u0643\u0627\u0645\u0644\u0629 \u0641\u064A \u0627\u0644\u062C\u0632\u0627\u0626\u0631 \u0628\u064A\u0646 \u0627\u0644\u0648\u0644\u0627\u064A\u0627\u062A:
        \u0648\u0644\u0627\u064A\u0629 \u0627\u0644\u0627\u0646\u0637\u0644\u0627\u0642 \u0648\u0627\u0644\u0645\u063A\u0627\u062F\u0631\u0629: ${originWilaya || "\u0627\u0644\u062C\u0632\u0627\u0626\u0631 \u0627\u0644\u0639\u0627\u0635\u0645\u0629"}.
        \u0648\u0644\u0627\u064A\u0629 \u0627\u0644\u0648\u062C\u0647\u0629 \u0648\u0627\u0644\u0645\u062D\u0627\u0641\u0638\u0629 \u0627\u0644\u0645\u0642\u0635\u0648\u062F\u0629: ${destination}.
        \u0639\u062F\u062F \u0623\u064A\u0627\u0645 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C: ${daysCount} \u064A\u0648\u0645.
        \u062A\u0627\u0631\u064A\u062E \u0623\u0648 \u0645\u064A\u0639\u0627\u062F \u0627\u0644\u0633\u0641\u0631 \u0627\u0644\u0645\u062D\u062F\u062F: ${departureDate || "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F"}.
        \u0627\u0644\u0645\u0628\u0644\u063A \u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0645\u062E\u0635\u0635 \u0644\u0643\u0627\u0645\u0644 \u0627\u0644\u0631\u062D\u0644\u0629: ${allocatedBudgetAmount || "\u0645\u0641\u062A\u0648\u062D"}.
        \u0648\u0633\u064A\u0644\u0629 \u0627\u0644\u0646\u0642\u0644 \u0627\u0644\u0645\u0641\u0636\u0644\u0629 \u0644\u0644\u062A\u0646\u0642\u0644 \u0627\u0644\u0639\u0627\u0645/\u0627\u0644\u0628\u064A\u0646-\u0648\u0644\u0627\u0626\u064A \u0648\u0627\u0644\u062D\u0636\u0631\u064A: ${transitMode || "\u0627\u0644\u0642\u0631\u0627\u0631"}. (\u0645\u0644\u0627\u062D\u0638\u0629: \u062A\u0623\u0643\u062F \u0645\u0646 \u062A\u0641\u0639\u064A\u0644 \u0648\u062A\u062D\u062F\u064A\u062F \u062E\u0637\u0648\u0637 \u0627\u0644\u062D\u0627\u0641\u0644\u0627\u062A \u0644\u0646\u0642\u0644 \u0627\u0644\u0631\u0643\u0627\u0628 \u0628\u064A\u0646 \u0627\u0644\u0648\u0644\u0627\u064A\u0627\u062A \u0623\u0648 \u0627\u0644\u062D\u0627\u0641\u0644\u0627\u062A \u0644\u0644\u062A\u0646\u0642\u0644 \u0627\u0644\u062D\u0636\u0631\u064A \u0623\u064A\u0636\u0627\u064B \u0645\u0639 \u0634\u0631\u062D \u0627\u0644\u0645\u0633\u0627\u0631).
        \u0627\u0644\u062F\u0631\u062C\u0629 \u0648\u0627\u0644\u0645\u0633\u062A\u0648\u0649: ${budget} (\u0645\u062B\u0627\u0644: \u0627\u0642\u062A\u0635\u0627\u062F\u064A\u0629\u060C \u0645\u062A\u0648\u0633\u0637\u0629\u060C \u0641\u0627\u062E\u0631\u0629).
        \u0646\u0645\u0637 \u0627\u0644\u0633\u0641\u0631 \u0648\u0627\u0644\u0645\u0631\u0627\u0641\u0642\u064A\u0646: ${travelerType}.
        \u0627\u0644\u063A\u0631\u0636 \u0627\u0644\u0631\u0626\u064A\u0633\u064A \u0645\u0646 \u0627\u0644\u0633\u0641\u0631 \u0648\u0627\u0644\u062A\u0646\u0642\u0644: ${tripPurpose || "tourism"} (\u0633\u064A\u0627\u062D\u0629 \u0648\u062A\u0631\u0641\u064A\u0647 "tourism"\u060C \u0623\u0648 \u0639\u0644\u0627\u062C \u0648\u0627\u0633\u062A\u0634\u0641\u0627\u0621 \u0637\u0628\u064A \u0628\u0645\u0633\u062A\u0634\u0641\u0649 \u0623\u0648 \u0639\u064A\u0627\u062F\u0629 "medical"\u060C \u0623\u0648 \u0645\u0647\u0645\u0629 \u0639\u0645\u0644 \u0648\u0625\u062C\u0631\u0627\u0621 \u0645\u0639\u0627\u0645\u0644\u0627\u062A \u0625\u062F\u0627\u0631\u064A\u0629 \u0648\u0645\u0643\u0627\u062A\u0628 "business_admin").
        \u0627\u0644\u062C\u0647\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641\u0629 \u0648\u0627\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A \u0623\u0648 \u0627\u0644\u0625\u062F\u0627\u0631\u0627\u062A \u0648\u0645\u0643\u0627\u062A\u0628 \u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u0645\u0631\u0627\u062F \u0632\u064A\u0627\u0631\u062A\u0647\u0627 \u0644\u0625\u062A\u0645\u0627\u0645 \u0627\u0644\u0645\u0647\u0645\u0629: ${missionDestinationsText || "\u0644\u0627 \u064A\u0648\u062C\u062F"}.
        \u0646\u0648\u0639 \u0645\u0643\u0627\u0646 \u0627\u0644\u0625\u0642\u0627\u0645\u0629 \u0648\u0627\u0644\u0645\u0646\u0634\u0623\u0629 \u0627\u0644\u0645\u0641\u0636\u0644\u0629: ${lodgingType || "hotel"} (\u0641\u0646\u062F\u0642 "hotel"\u060C \u0623\u0648 \u062F\u0627\u0631 \u0636\u064A\u0627\u0641\u0629/\u0644\u0648\u0643\u0627\u0646\u062F\u0629 \u062A\u0642\u0644\u064A\u062F\u064A\u0629 "guesthouse"\u060C \u0623\u0648 \u0628\u064A\u062A \u0634\u0628\u0627\u0628/\u0645\u0634\u062A\u0631\u0643 "hostel"\u060C \u0623\u0648 \u0645\u0646\u0632\u0644 \u062E\u0627\u0635/\u0634\u0642\u0629 \u0633\u0643\u0646\u064A\u0629 "home").
        \u0627\u0644\u0627\u0647\u062A\u0645\u0627\u0645\u0627\u062A \u0627\u0644\u062A\u064A \u064A\u0641\u0636\u0644\u0647\u0627 \u0627\u0644\u0645\u0633\u0627\u0641\u0631: ${interests && interests.length > 0 ? interests.join("\u060C ") : "\u0643\u0644 \u0645\u0627 \u0647\u0648 \u062B\u0642\u0627\u0641\u064A\u060C \u0637\u0628\u064A\u0639\u064A \u0648\u0645\u062D\u0644\u064A"}.
        
        \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0631\u0643\u064A\u0632 \u0639\u0644\u0649:
        1. \u062A\u0641\u0635\u064A\u0644 \u0627\u0644\u0646\u0642\u0644 \u0627\u0644\u062F\u0627\u062E\u0644\u064A \u0627\u0644\u0645\u062E\u062A\u0627\u0631 (${transitMode}) \u0628\u064A\u0646 \u0648\u0644\u0627\u064A\u0629 \u0627\u0644\u0627\u0646\u0637\u0644\u0627\u0642 \u0648\u0648\u0644\u0627\u064A\u0629 \u0627\u0644\u0648\u062C\u0647\u0629 \u0628\u062F\u0642\u0629\u060C \u0648\u062A\u0648\u0636\u064A\u062D \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u062D\u0627\u0641\u0644\u0627\u062A \u0627\u0644\u0639\u0627\u0645\u0629 \u0623\u0648 \u0627\u0644\u062D\u0627\u0641\u0644\u0627\u062A \u0627\u0644\u062D\u0636\u0631\u064A\u0629 \u0648\u0645\u062A\u0631\u0648 \u0627\u0644\u0623\u0646\u0641\u0627\u0642 \u0648\u0633\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0623\u062C\u0631\u0629 \u0644\u0634\u0631\u062D \u0627\u0644\u062A\u0646\u0642\u0644 \u0627\u0644\u062D\u0636\u0631\u064A \u0643\u0630\u0644\u0643.
        2. \u0627\u0644\u0625\u0642\u0627\u0645\u0627\u062A \u0627\u0644\u0645\u062D\u0644\u064A\u0629 \u0648\u0628\u062F\u0627\u0626\u0644 \u0627\u0644\u0641\u0646\u0627\u062F\u0642 \u0648\u0627\u0644\u0645\u0631\u0627\u0642\u062F (\u0627\u0644\u0644\u0648\u0643\u0627\u0646\u062F\u0627\u062A \u0627\u0644\u062A\u0642\u0644\u064A\u062F\u064A\u0629) \u0648\u062F\u0648\u0631 \u0627\u0644\u0634\u0628\u0627\u0628 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0628\u0645\u0627 \u064A\u062A\u0646\u0627\u0633\u0628 \u0645\u0639 \u0627\u0644\u0645\u064A\u0632\u0627\u0646\u064A\u0629 \u0648\u0646\u0648\u0639 \u0645\u0643\u0627\u0646 \u0627\u0644\u0625\u0642\u0627\u0645\u0629 \u0627\u0644\u0645\u062E\u062A\u0627\u0631 \u0648\u0647\u0648 (${lodgingType}). \u0641\u064A \u062D\u0627\u0644 \u0627\u062E\u062A\u064A\u0627\u0631 \u0645\u0646\u0632\u0644 (home)\u060C \u0627\u0642\u062A\u0631\u062D \u0634\u0642\u0642\u0627\u064B \u0633\u0643\u0646\u064A\u0629 \u0644\u0644\u0625\u064A\u062C\u0627\u0631 \u0623\u0648 \u0628\u064A\u0648\u062A\u0627\u064B \u0645\u0633\u062A\u0642\u0644\u0629 (\u0645\u0646\u0632\u0644 \u0643\u0625\u0642\u0627\u0645\u0629)\u060C \u0648\u0627\u0642\u062A\u0631\u062D \u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0623\u0642\u0644 \u062A\u0643\u0644\u0641\u0629 \u0648\u0645\u0637\u0627\u0628\u0642\u0629 \u0645\u062A\u062A\u0628\u0639\u0627\u062A \u0627\u0644\u062D\u062C\u0632 \u0648\u0627\u0644\u0623\u0648\u0631\u0627\u0642 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629 (\u0644\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0647\u0648\u064A\u0629\u060C \u062A\u0635\u0627\u0631\u064A\u062D\u060C \u0623\u0648 \u0639\u0642\u0648\u062F).
        3. \u062A\u062F\u0648\u064A\u0646 \u0623\u0633\u0645\u0627\u0621 \u0627\u0644\u0645\u0639\u0627\u0644\u0645 \u0648\u0627\u0644\u0623\u0637\u0628\u0627\u0642 \u0627\u0644\u062A\u0642\u0644\u064A\u062F\u064A\u0629 \u0627\u0644\u0634\u0639\u0628\u064A\u0629 \u0628\u062F\u0642\u0629 (\u0645\u062B\u0627\u0644: \u0627\u0644\u0643\u0633\u0643\u0633\u060C \u0627\u0644\u0634\u0627\u0644\u0634\u062E\u0648\u062E\u0629\u060C \u0627\u0644\u0631\u0634\u062A\u0629\u060C \u0627\u0644\u0632\u0641\u064A\u0637\u064A...) \u0648\u0627\u0644\u0645\u0639\u0627\u0644\u0645 \u0627\u0644\u0628\u0627\u0631\u0632\u0629 \u0644\u0643\u0644 \u0648\u0644\u0627\u064A\u0629\u060C \u0628\u0627\u0644\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0627\u0644\u0623\u0633\u0648\u0627\u0642 \u0627\u0644\u0634\u0639\u0628\u064A\u0629 \u0627\u0644\u0642\u062F\u064A\u0645\u0629 \u0627\u0644\u0645\u0634\u0647\u0648\u0631\u0629 \u0641\u064A \u0627\u0644\u0645\u0646\u0637\u0642\u0629.
        4. \u062A\u0632\u0648\u064A\u062F\u0646\u0627 \u0628\u062A\u0646\u0628\u064A\u0647\u0627\u062A \u062C\u0648\u064A\u0629 \u0645\u0633\u0628\u0642\u0629 \u0628\u062D\u0627\u0644\u0629 \u0627\u0644\u0637\u0642\u0633 \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u062A\u0627\u0631\u064A\u062E (${departureDate})\u060C \u0648\u0625\u0628\u0631\u0627\u0632 \u0645\u0639\u0627\u0631\u0636 \u0635\u0646\u0627\u0639\u064A\u0629 \u0623\u0648 \u0641\u0644\u0627\u062D\u064A\u0629 \u0623\u0648 \u062F\u064A\u0646\u064A\u0629 \u0623\u0648 \u062B\u0642\u0627\u0641\u064A\u0629 \u0648\u0637\u0646\u064A\u0629 \u062A\u062D\u062F\u062B \u0641\u064A \u062A\u0644\u0643 \u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0641\u064A \u0630\u0644\u0643 \u0627\u0644\u0634\u0647\u0631 \u0648\u062A\u0648\u062C\u064A\u0647\u0627\u062A \u062A\u0642\u062F\u064A\u0645 \u0623\u0648 \u062A\u0623\u062E\u064A\u0631 \u0627\u0644\u0633\u0641\u0631 \u0634\u0647\u0631\u0627\u064B \u0644\u0644\u0627\u0633\u062A\u0641\u0627\u062F\u0629 \u0623\u0648 \u062A\u062D\u0627\u0634\u064A \u0627\u0644\u0638\u0631\u0648\u0641.
        5. \u062A\u062D\u0648\u064A\u0644 \u0643\u0627\u0641\u0629 \u062A\u0643\u0627\u0644\u064A\u0641 \u0627\u0644\u0625\u0642\u0627\u0645\u0627\u062A \u0648\u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0648\u0627\u0644\u062A\u0642\u062F\u064A\u0631\u0627\u062A \u0641\u064A \u0646\u0627\u062A\u062C \u0627\u0644\u0640 JSON \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0645\u0646 \u0627\u0644\u062F\u0648\u0644\u0627\u0631 \u0644\u0644\u0645\u0642\u062F\u0627\u0631 \u0627\u0644\u062D\u0642\u064A\u0642\u064A \u0628\u0627\u0644\u062F\u064A\u0646\u0627\u0631 \u0627\u0644\u062C\u0632\u0627\u0626\u0631\u064A (\u062F\u062C) \u0628\u0645\u0627 \u064A\u062A\u0648\u0627\u0641\u0642 \u0645\u0639 \u0639\u0645\u0644\u0629 \u0627\u0644\u0648\u062C\u0647\u0629.
        6. \u0625\u062F\u0631\u0627\u062C \u062A\u0641\u0627\u0635\u064A\u0644 \u062E\u0631\u0627\u0626\u0637 \u0642\u0648\u0642\u0644 \u0648\u0646\u0637\u0627\u0642 \u0627\u0644\u0645\u0633\u0627\u0641\u0629 \u0628\u064A\u0646 \u0645\u0643\u0627\u0646 \u0627\u0644\u0625\u0642\u0627\u0645\u0629 \u0627\u0644\u0645\u062E\u062A\u0627\u0631 \u0648\u0645\u0643\u0627\u0646 \u0627\u0644\u0632\u064A\u0627\u0631\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A \u0644\u0623\u0648\u0644 \u064A\u0648\u0645\u060C \u0648\u062A\u062D\u062F\u064A\u062F \u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0627\u0644\u0646\u0642\u0644 \u0627\u0644\u0645\u062A\u0627\u062D\u0629 \u0643\u0640 "\u064A\u0633\u064A\u0631 Yassir" \u0623\u0648 "InDrive" \u0623\u0648 Heetch \u0648\u062A\u0643\u0644\u0641\u062A\u0647\u0627 \u0648\u062A\u0648\u062C\u064A\u0647\u0627\u062A \u0627\u0644\u0646\u0642\u0644.
        7. \u0641\u064A \u062D\u0627\u0644 \u0643\u0627\u0646 \u0627\u0644\u063A\u0631\u0636 \u0637\u0628\u064A\u064B\u0627 (medical) \u0623\u0648 \u0645\u0647\u0645\u0629 \u0639\u0645\u0644 \u0625\u062F\u0627\u0631\u064A\u0629 (business_admin)\u060C \u062E\u0637\u0637 \u062C\u062F\u0648\u0644\u0627\u064B \u062A\u0641\u0635\u064A\u0644\u064A\u0627\u064B \u0641\u064A \u0627\u0644\u0642\u0633\u0645 (administrativeMissionDetails) \u064A\u0648\u0636\u062D \u062E\u0637\u0648\u0627\u062A \u0627\u0644\u0645\u0647\u0645\u0629\u060C \u0627\u0644\u0648\u062B\u0627\u0626\u0642 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629 \u0644\u0643\u0644 \u0625\u062F\u0627\u0631\u0629/\u0645\u0633\u062A\u0634\u0641\u0649\u060C \u0623\u0648\u0642\u0627\u062A \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 \u0627\u0644\u0645\u062A\u0648\u0642\u0639\u0629\u060C \u0648\u0646\u0635\u0627\u0626\u062D \u0644\u0644\u062A\u0646\u0642\u0644 \u0628\u0627\u0644\u062F\u0644\u064A\u0644 \u0627\u0644\u062C\u063A\u0631\u0627\u0641\u064A.
        8. \u062A\u0639\u0628\u0626\u0629 \u0627\u0644\u0623\u0645\u0627\u0643\u0646 \u0627\u0644\u0645\u062C\u0627\u0648\u0631\u0629 \u0648\u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0647\u0627\u0645\u0629 \u0628\u0642\u0633\u0645 (nearbyPlacesAndUtilities) \u0628\u0630\u0643\u0627\u0621 \u062A\u0643\u062A\u064A\u0643\u064A:
           \u0623) restaurantsAndCafes: \u062A\u0631\u0634\u064A\u062D \u0645\u0637\u0627\u0639\u0645 \u0648\u0645\u0642\u0627\u0647\u064A \u0648\u0645\u062D\u0637\u0627\u062A \u0627\u0633\u062A\u0631\u0627\u062D\u0629 \u0642\u0631\u064A\u0628\u0629 \u0623\u0648 \u0634\u0639\u0628\u064A\u0629 \u063A\u0646\u064A\u0629 \u0628\u0627\u0644\u0642\u0631\u0628 \u0645\u0646 \u0627\u0644\u0645\u0631\u0627\u0643\u0632 \u0648\u0627\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A \u0623\u0648 \u0627\u0644\u0645\u0639\u0627\u0644\u0645 \u0627\u0644\u0645\u0642\u0635\u0648\u062F\u0629.
           \u0628) mosquesAndRestrooms: \u062A\u0631\u0634\u064A\u062D \u0645\u0633\u0627\u062C\u062F \u0642\u0631\u064A\u0628\u0629 \u0644\u0623\u062F\u0627\u0621 \u0627\u0644\u0635\u0644\u0627\u0629 \u062A\u0634\u0645\u0644 \u062F\u0648\u0631\u0627\u062A \u0645\u064A\u0627\u0647 \u0646\u0638\u064A\u0641\u0629 \u0639\u0645\u0648\u0645\u064A\u0629 \u0648\u0648\u0635\u0641 \u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u064A\u0647\u0627.
           \u062C) medicalServices: \u062A\u0631\u0634\u064A\u062D \u0635\u064A\u062F\u0644\u064A\u0627\u062A \u0642\u0631\u064A\u0628\u0629 (\u062A\u0634\u0645\u0644 \u0635\u064A\u062F\u0644\u064A\u0627\u062A \u0645\u0646\u0627\u0648\u0628\u0629 \u0628\u0627\u0644\u0644\u064A\u0644)\u060C \u0648\u0645\u062E\u0627\u0628\u0631 \u062A\u062D\u0627\u0644\u064A\u0644 \u0637\u0628\u064A\u0629 \u0648\u0639\u064A\u0627\u062F\u0627\u062A \u0643\u0628\u062F\u0627\u0626\u0644 \u0627\u0633\u062A\u0634\u0641\u0627\u0626\u064A\u0629 \u062E\u0635\u0648\u0635\u0627\u064B \u0641\u064A \u062D\u0627\u0644\u0627\u062A \u0627\u0644\u0633\u0641\u0631 \u0627\u0644\u0637\u0628\u064A (medical).
           \u062F) nearbyAlternativeLodgings: \u062A\u0648\u0641\u064A\u0631 \u0623\u0645\u0627\u0643\u0646 \u0625\u0642\u0627\u0645\u0629 \u0642\u0631\u064A\u0628\u0629 (\u0645\u0631\u0627\u0642\u062F\u060C \u0641\u0646\u0627\u062F\u0642 \u0642\u062F\u064A\u0645\u0629 \u0623\u0648 \u0645\u0646\u0627\u0632\u0644 \u062E\u0627\u0635\u0629) \u0645\u0644\u0627\u0626\u0645\u0629 \u0628\u0627\u0644\u0642\u0631\u0628 \u0645\u0646 \u0645\u0646\u0627\u0637\u0642 \u0627\u0644\u0646\u0634\u0627\u0637 \u0644\u062A\u0641\u0627\u062F\u064A \u0627\u0644\u0645\u0634\u0627\u0648\u064A\u0631 \u0627\u0644\u0628\u0639\u064A\u062F\u0629.`;
      } else {
        prompt = `\u0642\u0645 \u0628\u062A\u062E\u0637\u064A\u0637 \u0631\u062D\u0644\u0629 \u0643\u0627\u0645\u0644\u0629 \u0648\u0645\u0641\u0635\u0644\u0629 \u0625\u0644\u0649: ${destination}.
        \u0639\u062F\u062F \u0627\u0644\u0623\u064A\u0627\u0645: ${daysCount} \u064A\u0648\u0645.
        \u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0633\u0641\u0631 \u0627\u0644\u0645\u062D\u062F\u062F: ${departureDate || "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F"}.
        \u0627\u0644\u0645\u0628\u0644\u063A \u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0645\u062E\u0635\u0635 \u0644\u0644\u0631\u062D\u0644\u0629: ${allocatedBudgetAmount || "\u0645\u0641\u062A\u0648\u062D"}.
        \u0648\u0633\u064A\u0644\u0629 \u0627\u0644\u0646\u0642\u0644 \u0627\u0644\u0645\u0641\u0636\u0644\u0629 \u0644\u0644\u062A\u0646\u0642\u0644 \u0627\u0644\u0628\u064A\u0646-\u0648\u0644\u0627\u0626\u064A/\u0627\u0644\u0639\u0627\u0645 \u0648\u0627\u0644\u062D\u0636\u0631\u064A: ${transitMode || "\u0637\u064A\u0631\u0627\u0646"}. (\u0645\u0644\u0627\u062D\u0638\u0629: \u0631\u0643\u0632 \u0648\u0627\u0634\u0631\u062D \u0643\u064A\u0641\u064A\u0629 \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u062D\u0627\u0641\u0644\u0627\u062A \u0627\u0644\u0639\u0627\u0645\u0629 \u0623\u0648 \u0644\u0642\u0637\u0627\u062A \u0627\u0644\u0646\u0642\u0644 \u0648\u0645\u062A\u0631\u0648 \u0627\u0644\u0623\u0646\u0641\u0627\u0642 \u0641\u064A \u0627\u0644\u062A\u0646\u0642\u0644 \u0627\u0644\u0628\u064A\u0646\u064A \u0648\u0627\u0644\u062F\u0627\u062E\u0644\u064A \u0627\u0644\u062D\u0636\u0631\u064A \u0623\u064A\u0636\u0627\u064B).
        \u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0645\u064A\u0632\u0627\u0646\u064A\u0629: ${budget} (\u0645\u062B\u0627\u0644: \u0627\u0642\u062A\u0635\u0627\u062F\u064A\u0629\u060C \u0645\u062A\u0648\u0633\u0637\u0629\u060C \u0641\u0627\u062E\u0631\u0629).
        \u0646\u0648\u0639 \u0627\u0644\u0645\u0633\u0627\u0641\u0631: ${travelerType} (\u0645\u062B\u0627\u0644: \u0641\u0631\u062F\u064A\u060C \u0632\u0648\u062C\u064A\u0646\u060C \u0639\u0627\u0626\u0644\u0629\u060C \u0623\u0635\u062F\u0642\u0627\u0621).
        \u0627\u0644\u063A\u0631\u0636 \u0627\u0644\u0631\u0626\u064A\u0633\u064A \u0645\u0646 \u0627\u0644\u0633\u0641\u0631 \u0648\u0627\u0644\u062A\u0646\u0642\u0644: ${tripPurpose || "tourism"} (\u0633\u064A\u0627\u062D\u0629 \u0648\u062A\u0631\u0641\u064A\u0647 "tourism"\u060C \u0623\u0648 \u0639\u0644\u0627\u062C \u0648\u0627\u0633\u062A\u0634\u0641\u0627\u0621 \u0637\u0628\u064A \u0628\u0645\u0633\u062A\u0634\u0641\u0649 \u0623\u0648 \u0639\u064A\u0627\u062F\u0629 "medical"\u060C \u0623\u0648 \u0645\u0647\u0645\u0629 \u0639\u0645\u0644 \u0648\u0625\u062C\u0631\u0627\u0621 \u0645\u0639\u0627\u0645\u0644\u0627\u062A \u0625\u062F\u0627\u0631\u064A\u0629 \u0648\u0645\u0643\u0627\u062A\u0628 "business_admin").
        \u0627\u0644\u062C\u0647\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641\u0629 \u0648\u0627\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A \u0623\u0648 \u0627\u0644\u0625\u062F\u0627\u0631\u0627\u062A \u0648\u0645\u0643\u0627\u062A\u0628 \u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u0645\u0631\u0627\u062F \u0632\u064A\u0627\u0631\u062A\u0647\u0627 \u0644\u0625\u062A\u0645\u0627\u0645 \u0627\u0644\u0645\u0647\u0645\u0629: ${missionDestinationsText || "\u0644\u0627 \u064A\u0648\u062C\u062F"}.
        \u0646\u0648\u0639 \u0645\u0643\u0627\u0646 \u0627\u0644\u0625\u0642\u0627\u0645\u0629 \u0648\u0627\u0644\u0645\u0646\u0634\u0623\u0629 \u0627\u0644\u0645\u0641\u0636\u0644\u0629: ${lodgingType || "hotel"} (\u0641\u0646\u062F\u0642 "hotel"\u060C \u0623\u0648 \u062F\u0627\u0631 \u0636\u064A\u0627\u0641\u0629 "guesthouse"\u060C \u0623\u0648 \u0628\u064A\u062A \u0634\u0628\u0627\u0628 "hostel"\u060C \u0623\u0648 \u0645\u0646\u0632\u0644 \u062E\u0627\u0635/\u0634\u0642\u0629 \u0633\u0643\u0646\u064A\u0629 "home").
        \u0627\u0644\u0627\u0647\u062A\u0645\u0627\u0645\u0627\u062A \u0627\u0644\u062E\u0627\u0635\u0629 \u0648\u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0627\u0644\u0645\u0631\u063A\u0648\u0628\u0629: ${interests && interests.length > 0 ? interests.join("\u060C ") : "\u0645\u0639\u0627\u0644\u0645 \u0633\u064A\u0627\u062D\u064A\u0629 \u0631\u0626\u064A\u0633\u064A\u0629\u060C \u0637\u0639\u0627\u0645 \u0645\u062D\u0644\u064A\u060C \u062B\u0642\u0627\u0641\u0629"}.
        
        \u064A\u0631\u062C\u0649 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0641\u0635\u062D\u0649 \u0641\u064A \u062C\u0645\u064A\u0639 \u0627\u0644\u0646\u0635\u0648\u0635.
        \u064A\u0631\u062C\u0649 \u062A\u0648\u0641\u064A\u0631 \u062E\u0637\u0629 \u064A\u0648\u0645\u064A\u0629 \u0645\u0641\u0635\u0644\u0629 \u062A\u0634\u0645\u0644 \u0635\u0628\u0627\u062D\u0627 \u0648\u0628\u0639\u062F \u0627\u0644\u0638\u0647\u0631 \u0648\u0645\u0633\u0627\u0621\u060C \u0648\u0627\u0642\u062A\u0631\u0627\u062D\u0627\u062A \u0625\u0642\u0627\u0645\u0629 \u0627\u0642\u062A\u0635\u0627\u062F\u064A\u0629 \u0645\u0644\u0627\u0626\u0645\u0629 \u0648\u0645\u0646\u0627\u0633\u0628\u0629 \u0648\u0628\u0645\u062A\u0637\u0644\u0628\u0627\u062A \u062D\u062C\u0632 \u0648\u0627\u0636\u062D\u0629 \u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u0646\u0648\u0639 \u0627\u0644\u0645\u0646\u0634\u0623\u0629 \u0627\u0644\u0645\u0641\u0636\u0644 \u0648\u0647\u0648 (${lodgingType})\u060C \u0648\u0642\u0627\u0626\u0645\u0629 \u0623\u0645\u062A\u0639\u0629 \u0645\u0642\u0633\u0645\u0629 \u062D\u0633\u0628 \u0627\u0644\u0641\u0626\u0629\u060C \u0648\u0646\u0635\u0627\u0626\u062D \u0627\u0644\u0633\u0627\u0626\u0642 \u0648\u0627\u0644\u0645\u0646\u0627\u062E \u0648\u0627\u0644\u0639\u0645\u0644\u0629 \u0627\u0644\u0645\u062D\u0644\u064A\u0629 \u0648\u0646\u0642\u0644 \u0627\u0644\u062D\u0627\u0641\u0644\u0627\u062A.
        \u064A\u0631\u062C\u0649 \u0625\u0628\u0631\u0627\u0632 \u062A\u0646\u0628\u0624\u0627\u062A \u0627\u0644\u0637\u0642\u0633 \u0648\u0627\u0644\u0645\u0647\u0631\u062C\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u0645\u0639\u0627\u0631\u0636 \u0628\u062A\u0646\u0628\u064A\u0647 \u0645\u0633\u0628\u0642 \u064A\u0634\u0631\u062D \u0647\u0644 \u064A\u0641\u0636\u0644 \u062A\u0642\u062F\u064A\u0645 \u0623\u0648 \u062A\u0623\u062E\u064A\u0631 \u0627\u0644\u0631\u062D\u0644\u0629 \u0634\u0647\u0631\u0627\u064B \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644.
        \u064A\u0631\u062C\u0649 \u0625\u062F\u0631\u0627\u062C \u0623\u0631\u0642\u0627\u0645 \u0627\u0644\u0637\u0648\u0627\u0631\u0626 \u0627\u0644\u0645\u062D\u0644\u064A\u0629 \u0644\u062A\u0644\u0643 \u0627\u0644\u062F\u0648\u0644\u0629 \u0641\u064A \u0646\u0627\u062A\u062C \u0627\u0644\u0640 JSON\u060C \u0645\u0639 \u0625\u062F\u0631\u0627\u062C \u0627\u0644\u0623\u0643\u0644\u0627\u062A \u0627\u0644\u0634\u0639\u0628\u064A\u0629 \u0627\u0644\u0634\u0647\u064A\u0631\u0629 \u0648\u0627\u0644\u0623\u0633\u0648\u0627\u0642 \u0648\u0627\u0644\u0628\u0627\u0632\u0627\u0631\u0627\u062A \u0627\u0644\u0634\u0639\u0628\u064A\u0629 \u0627\u0644\u0645\u0634\u0647\u0648\u0631\u0629 \u0647\u0646\u0627\u0643\u060C \u0648\u0645\u062D\u0627\u0643\u0627\u0629 \u062E\u0631\u0627\u0626\u0637 \u0642\u0648\u0642\u0644 \u0648\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0627\u0644\u0646\u0642\u0644 \u0627\u0644\u062A\u0634\u0627\u0631\u0643\u064A \u0627\u0644\u0639\u0627\u0645\u0644\u0629 \u0647\u0646\u0627\u0643 \u0648\u062A\u0643\u0644\u0641\u062A\u0647\u0627.
        \u062A\u0632\u0648\u064A\u062F\u0646\u0627 \u0628\u0628\u064A\u0627\u0646\u0627\u062A \u0625\u0636\u0627\u0641\u064A\u0629:
        - \u0641\u064A \u0642\u0633\u0645 (administrativeMissionDetails): \u062C\u062F\u0648\u0644 \u0627\u0644\u0645\u0647\u0645\u0629\u060C \u0623\u0648\u0631\u0627\u0642 \u0648\u0645\u0633\u062A\u0646\u062F\u0627\u062A \u0627\u0644\u0625\u062B\u0628\u0627\u062A \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629\u060C \u0623\u0648\u0642\u0627\u062A \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 \u0648\u0627\u0644\u0645\u0648\u0627\u0635\u0644\u0627\u062A \u0644\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A \u0623\u0648 \u0627\u0644\u0645\u0643\u0627\u062A\u0628 \u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629 \u0644\u0631\u062D\u0644\u0627\u062A \u0627\u0644\u0640 medical \u0623\u0648 \u0627\u0644\u0640 business_admin.
        - \u0641\u064A \u0642\u0633\u0645 (nearbyPlacesAndUtilities): \u0627\u0642\u062A\u0631\u0627\u062D \u0645\u0637\u0627\u0639\u0645 \u0648\u0645\u0642\u0627\u0647\u064A \u0648\u0627\u0633\u062A\u0631\u0627\u062D\u0627\u062A \u0642\u0631\u064A\u0628\u0629\u060C \u0645\u0633\u0627\u062C\u062F \u0648\u062F\u0648\u0631\u0627\u062A \u0645\u064A\u0627\u0647 \u0642\u0631\u064A\u0628\u0629 \u0641\u064A \u0623\u0648\u0642\u0627\u062A \u0627\u0644\u0635\u0644\u0627\u0629\u060C \u0635\u064A\u062F\u0644\u064A\u0627\u062A \u0648\u0645\u0642\u0631\u0627\u062A \u0645\u062E\u0627\u0628\u0631 \u062A\u062D\u0627\u0644\u064A\u0644 \u0637\u0628\u064A\u0629 \u0642\u0631\u064A\u0628\u0629 \u0644\u062D\u0627\u0644\u0627\u062A \u0627\u0644\u0639\u0644\u0627\u062C \u0627\u0644\u0637\u0628\u064A\u0629\u060C \u0648\u0645\u0631\u0627\u0642\u062F \u0628\u062F\u064A\u0644\u0629 \u0623\u0648 \u0641\u0646\u0627\u062F\u0642 \u0648\u0645\u0646\u0627\u0632\u0644 \u0623\u0648 \u0634\u0642\u0642 \u0633\u0643\u0646\u064A\u0629 \u0628\u062F\u064A\u0644\u0629 \u0642\u0631\u064A\u0628\u0629 \u0644\u062E\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0633\u0643\u0646 \u0627\u0644\u062A\u0627\u0628\u0639\u0629 \u0644\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0625\u0642\u0627\u0645\u0629 \u0627\u0644\u0645\u0642\u062A\u0631\u062D.`;
      }
    } else {
      if (isDomestic) {
        prompt = `Plan an authentic Algerian domestic travel itinerary between custom provinces:
        Origin Departure Province (Wilaya): ${originWilaya || "Algiers"}.
        Destination Province (Wilaya): ${destination}.
        Travel Date / Month: ${departureDate || "Unspecified"}.
        Allocated Absolute Budget Cap: ${allocatedBudgetAmount || "Flexible"}.
        Transit method of choice: ${transitMode || "Train / Car"}. Note: prioritize and details public transit bus lines (buses) for inter-province travel and urban commuting as well, detailing route paths.
        Stay duration: ${daysCount} days.
        Budget class: ${budget} (Economy, Moderate, Luxury).
        Companion layout: ${travelerType}.
        Trip main purpose: ${tripPurpose || "tourism"} (tourism, medical, business_admin).
        Custom mission targeted offices/hospitals to visit: ${missionDestinationsText || "None"}.
        Preferred lodging type facility: ${lodgingType || "hotel"} (hotel, traditional guesthouse, youth hostel, or private home/apartment rental).
        Special exploration hobbies: ${interests && interests.length > 0 ? interests.join(", ") : "Traditions, landscapes and nature"}.
        
        Please detail inter-state transport methods tailored to their transit choice (including buses). Include localized accommodations corresponding to lodging preference (${lodgingType}), native cuisine (Couscous, Rechta, Chakhchoukha, etc.), traditional markets, and advise on currency (Algerian Dinars DZD), safety, and connecting references for fos7a-dz portal entries.
        Detail (administrativeMissionDetails) guidelines if purpose is medical or business_admin.
        Fill (nearbyPlacesAndUtilities) structures with:
           a) restaurantsAndCafes: local popular or traditional eating/resting spots near targeted zones.
           b) mosquesAndRestrooms: nearby mosques for prayer times, detailing public restrooms.
           c) medicalServices: nearby pharmacies (especially night-duty pharmacies), medical analysis laboratories, and emergency clinics.
           d) nearbyAlternativeLodgings: regional motels (mraqed), hotels, or private guest homes/apartments close to targeted sites.
        Convert all price attributes into Algerian Dinars (DZD) rather than USD values, and calculate using lowest cost local alternatives.
        Provide Google Maps simulation metrics between the accommodation and day 1 main spot, ride apps like Yassir or InDrive and expected cost in DZD.`;
      } else {
        prompt = `Plan a complete and highly detailed travel itinerary to: ${destination}.
        Duration: ${daysCount} days.
        Planned Travel Date: ${departureDate || "Unspecified"}.
        Total Allocated Budget Amount: ${allocatedBudgetAmount || "Flexible"}.
        Transit Type: ${transitMode || "Flight"}. (Include public bus lines and transit routes options for both intercity and urban commuting).
        Budget Level: ${budget} (e.g. Economy, Moderate, Luxury).
        Traveler Type: ${travelerType} (e.g. Solo, Couple, Family, Friends).
        Trip main purpose: ${tripPurpose || "tourism"} (tourism, medical, business_admin).
        Custom targeted office or hospital list: ${missionDestinationsText || "None"}.
        Preferred lodging selection: ${lodgingType || "hotel"} (hotel, traditional guesthouse, youth hostel, private home).
        Special Interests/Activities: ${interests && interests.length > 0 ? interests.join(", ") : "Sightseeing, Local food, Culture"}.
        
        Please return the structural travel data in English. Provide distinct daily guides (morning, afternoon, evening), realistic hotel or private home recommendations for the budget level matching lodging option (${lodgingType}), a categorized packing list, and helpful local intelligence (local etiquette, public buses, transit advice, weather alerts, seasonal expos and delay/advance recommendations).
        Provide native popular food, souks/markets, official local emergency phone listings, specific accommodation booking restrictions/paperwork, and Google Maps routing parameters (distance, recommended local taxi applications, and fair estimates).
        Include (administrativeMissionDetails) if medical or business_admin.
        Include (nearbyPlacesAndUtilities) listing nearby restaurants & cafes, restrooms & mosques at prayer times, pharmacies & labs, and alternative places to stay (motels, guest homes, hotels, rooms) close to target zone.`;
      }
    }
    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          properties: {
            destinationName: {
              type: import_genai.Type.STRING,
              description: "The name of the destination in the requested language"
            },
            country: {
              type: import_genai.Type.STRING,
              description: "The country name in the requested language"
            },
            tripDurationDays: {
              type: import_genai.Type.INTEGER,
              description: "Number of days matching the requested duration"
            },
            targetBudgetLevel: {
              type: import_genai.Type.STRING,
              description: "Budget category level (e.g., Economy, Moderate, Luxury)"
            },
            travelerType: {
              type: import_genai.Type.STRING,
              description: "Traveler arrangement (e.g. Solo, Couple, Family)"
            },
            languageCode: {
              type: import_genai.Type.STRING,
              description: "The ISO code of the response ('ar' or 'en')"
            },
            departureDate: {
              type: import_genai.Type.STRING,
              description: "The requested departure date or season text passed"
            },
            allocatedBudgetAmount: {
              type: import_genai.Type.STRING,
              description: "The customer specified personal budget, rendered with local currency"
            },
            transitMode: {
              type: import_genai.Type.STRING,
              description: "The chosen transit mode"
            },
            climateAdvisoryAlert: {
              type: import_genai.Type.STRING,
              description: "Crucial prior climate advisory and warnings (e.g. recommend postponing, advancing, or staying on track based on seasonal weather forecast)"
            },
            localEventsAndExpos: {
              type: import_genai.Type.ARRAY,
              description: "Key exhibitions, trade shows, festivals happening in this region around this month (warn at least 1 month in advance)",
              items: {
                type: import_genai.Type.OBJECT,
                properties: {
                  name: { type: import_genai.Type.STRING, description: "Name of the exhibition, expo or cultural festival" },
                  date: { type: import_genai.Type.STRING, description: "Typical occurrence date or month range" },
                  advisabilityNote: { type: import_genai.Type.STRING, description: "Note warning the tourist to delay or advance the trip to enjoy/avoid this specific event" }
                },
                required: ["name", "date", "advisabilityNote"]
              }
            },
            days: {
              type: import_genai.Type.ARRAY,
              description: "Array of daily structured schedules",
              items: {
                type: import_genai.Type.OBJECT,
                properties: {
                  dayNumber: { type: import_genai.Type.INTEGER },
                  theme: {
                    type: import_genai.Type.STRING,
                    description: "Daily highlighted theme/focus of exploration (e.g. Historical Wonders, Coastal Escape)"
                  },
                  activities: {
                    type: import_genai.Type.ARRAY,
                    items: {
                      type: import_genai.Type.OBJECT,
                      properties: {
                        title: { type: import_genai.Type.STRING, description: "Name of the landmark or activity" },
                        description: { type: import_genai.Type.STRING, description: "A detailed paragraph explaining what to see, do, or eat there" },
                        timeOfDay: {
                          type: import_genai.Type.STRING,
                          description: "Visual time marker (Morning, Afternoon, Evening)"
                        },
                        durationHours: { type: import_genai.Type.NUMBER, description: "Typical duration of the visit in hours" },
                        estimatedCostUSD: { type: import_genai.Type.NUMBER, description: "Average typical expense per person in USD" },
                        locationName: { type: import_genai.Type.STRING, description: "Lattitude/Longitude description or location address" }
                      },
                      required: [
                        "title",
                        "description",
                        "timeOfDay",
                        "durationHours",
                        "estimatedCostUSD",
                        "locationName"
                      ]
                    }
                  }
                },
                required: ["dayNumber", "theme", "activities"]
              }
            },
            suggestedHotels: {
              type: import_genai.Type.ARRAY,
              description: "Top 3 curated realistic accommodation options for the specified budget",
              items: {
                type: import_genai.Type.OBJECT,
                properties: {
                  name: { type: import_genai.Type.STRING, description: "Hotel name" },
                  stars: { type: import_genai.Type.NUMBER, description: "Hotel rating star count (e.g. 3, 4, 5)" },
                  pricePerNightUSD: { type: import_genai.Type.NUMBER, description: "Average nightly rate in USD" },
                  ratingValue: { type: import_genai.Type.NUMBER, description: "Guest review score out of 5 (e.g., 4.6)" },
                  reasonForRecommendation: { type: import_genai.Type.STRING, description: "One sentence why this suits their profile" },
                  phoneNumber: { type: import_genai.Type.STRING, description: "Official contact telephone number (e.g. +213 21 XX XX XX or +213 550 XX XX XX)" },
                  address: { type: import_genai.Type.STRING, description: "Physical street address of the lodging" }
                },
                required: ["name", "stars", "pricePerNightUSD", "ratingValue", "reasonForRecommendation", "phoneNumber", "address"]
              }
            },
            customPackingList: {
              type: import_genai.Type.ARRAY,
              description: "Essential categorized checklist recommended specifically for this destination and climate",
              items: {
                type: import_genai.Type.OBJECT,
                properties: {
                  category: { type: import_genai.Type.STRING, description: "Category name (e.g., Clothing, Electronics, Hygiene)" },
                  items: {
                    type: import_genai.Type.ARRAY,
                    items: { type: import_genai.Type.STRING }
                  }
                },
                required: ["category", "items"]
              }
            },
            localTravelTips: {
              type: import_genai.Type.ARRAY,
              description: "4 critical location-specific travel tips (etiquette, local currency, language, safety)",
              items: { type: import_genai.Type.STRING }
            },
            isDomesticTrip: {
              type: import_genai.Type.BOOLEAN,
              description: "True if the trip is domestic, false if it is international"
            },
            localCurrencySymbol: {
              type: import_genai.Type.STRING,
              description: "The currency symbol to use for rendering (e.g. '\u062F\u062C' or 'DZD' for domestic Algerian trips, native local symbol for other domestic destinations, or '$' / 'USD' for international ones)"
            },
            emergencyNumbers: {
              type: import_genai.Type.ARRAY,
              description: "Official local emergency hotlines and services. For Algeria domestic, MUST include Police (17 / 1548), Protection Civile (14), and National Gendarmerie (1055)",
              items: {
                type: import_genai.Type.OBJECT,
                properties: {
                  label: { type: import_genai.Type.STRING, description: "Service or hotline name in the requested language (e.g., \u0627\u0644\u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u0645\u062F\u0646\u064A\u0629, Police)" },
                  phone: { type: import_genai.Type.STRING, description: "Direct telephone dialing sequence" }
                },
                required: ["label", "phone"]
              }
            },
            bookingRequirements: {
              type: import_genai.Type.ARRAY,
              description: "Requirements, check-in checklists, local lodging laws, and booking documents or advice for this accommodation category (e.g., ID required, marriage certificate, or youth hostel rules)",
              items: { type: import_genai.Type.STRING }
            },
            localTraditionalCuisine: {
              type: import_genai.Type.ARRAY,
              description: "Popular local traditional delicacies, dishes or drinks in this specific destination city or wilaya",
              items: {
                type: import_genai.Type.OBJECT,
                properties: {
                  name: { type: import_genai.Type.STRING, description: "Food name (e.g. Rechta, Chakhchoukha, Mint Tea)" },
                  description: { type: import_genai.Type.STRING, description: "A detailed mouthwatering description of the dish and how it is served" }
                },
                required: ["name", "description"]
              }
            },
            popularMarketsAndSouks: {
              type: import_genai.Type.ARRAY,
              description: "Popular popular markets, souks, or shopping centers in this region",
              items: {
                type: import_genai.Type.OBJECT,
                properties: {
                  name: { type: import_genai.Type.STRING, description: "Name of the market or bazaar" },
                  type: { type: import_genai.Type.STRING, description: "Type of market (e.g. craft market, spice market)" },
                  description: { type: import_genai.Type.STRING, description: "Short summary of what is sold there (e.g. traditional leather, silver, spices)" }
                },
                required: ["name", "type", "description"]
              }
            },
            googleMapsSim: {
              type: import_genai.Type.OBJECT,
              description: "Google Maps routing simulation metrics to assist visual and navigation layouts",
              properties: {
                accommodationName: { type: import_genai.Type.STRING, description: "Selected hotel, motel or hostel name" },
                accommodationQuery: { type: import_genai.Type.STRING, description: "Full map search query or coordinates (e.g. Ghardaia tourist hostel, Tlemcen)" },
                primarySpotName: { type: import_genai.Type.STRING, description: "Major day 1 landmark or activity spot" },
                primarySpotQuery: { type: import_genai.Type.STRING, description: "Search query for that major landmark or historical spot" },
                distanceKMText: { type: import_genai.Type.STRING, description: "Calculated approximate distance in kilometers (e.g. '4.5 km' or '\u0664,\u0665 \u0643\u0645')" },
                recommendedTaxiApp: { type: import_genai.Type.STRING, description: "Name of the digital taxi ride-sharing application recommended in this city (e.g., 'Yassir (\u064A\u0633\u064A\u0631)' or 'InDrive' or Heetch for Algeria, or local taxi/coop)" },
                taxiFareEstimateLocal: { type: import_genai.Type.STRING, description: "Estimated fare cost for this ride in local currency" },
                transitAdviceStep: { type: import_genai.Type.STRING, description: "Text explaining how to request, commute, use metro, or flag group taxis to get from lodging to this zone" }
              },
              required: [
                "accommodationName",
                "accommodationQuery",
                "primarySpotName",
                "primarySpotQuery",
                "distanceKMText",
                "recommendedTaxiApp",
                "taxiFareEstimateLocal",
                "transitAdviceStep"
              ]
            },
            tripPurpose: {
              type: import_genai.Type.STRING,
              description: "The primary purpose of trip (tourism, medical, business_admin)"
            },
            missionDestinationsText: {
              type: import_genai.Type.STRING,
              description: "Custom target clinics, offices or departments specified"
            },
            lodgingType: {
              type: import_genai.Type.STRING,
              description: "Chosen accommodation category"
            },
            administrativeMissionDetails: {
              type: import_genai.Type.OBJECT,
              description: "Detailed logistics workflow guidelines strictly compiled for medical, clinical or business_admin missions. Leave fields empty or minimal for pure tourism",
              properties: {
                missionOverview: { type: import_genai.Type.STRING, description: "One comprehensive summary outlining the workflow steps for all of their appointments" },
                destinationsList: {
                  type: import_genai.Type.ARRAY,
                  description: "Specific offices/hospitals mentioned in user query",
                  items: {
                    type: import_genai.Type.OBJECT,
                    properties: {
                      name: { type: import_genai.Type.STRING, description: "Name of target hospital, office, or client building" },
                      estimatedQueueTime: { type: import_genai.Type.STRING, description: "Expected waiting time to complete transactions (e.g. 1-2 hours)" },
                      transitAdvice: { type: import_genai.Type.STRING, description: "Step-by-step smart assistant routes using city buses, metro or ride apps from coordinates" },
                      documentsRequired: {
                        type: import_genai.Type.ARRAY,
                        items: { type: import_genai.Type.STRING },
                        description: "Needed papers, files, ID card or stamps for this appointment (e.g. National insurance, physician order, birth paper)"
                      },
                      googleMapsQuery: { type: import_genai.Type.STRING, description: "A highly clear query to easily search on google maps search (e.g., 'Mustapha Bacha Hospital Algiers' or similar)" },
                      phoneNumber: { type: import_genai.Type.STRING, description: "Contact hotline parameter or support phone number of the target hospital or office (e.g. +213 21 XX XX XX)" },
                      address: { type: import_genai.Type.STRING, description: "Physical location coordinates or street name" }
                    },
                    required: ["name", "estimatedQueueTime", "transitAdvice", "documentsRequired", "googleMapsQuery", "phoneNumber", "address"]
                  }
                }
              },
              required: ["missionOverview", "destinationsList"]
            },
            nearbyPlacesAndUtilities: {
              type: import_genai.Type.OBJECT,
              description: "Useful local establishments near their destination or lodgings",
              properties: {
                restaurantsAndCafes: {
                  type: import_genai.Type.ARRAY,
                  description: "Popular local/traditional restaurants, cafes, or tea/rest stops nearby",
                  items: {
                    type: import_genai.Type.OBJECT,
                    properties: {
                      name: { type: import_genai.Type.STRING, description: "Name of the dining/resting outlet" },
                      type: { type: import_genai.Type.STRING, description: "E.g., \u0645\u0637\u0639\u0645 \u0634\u0639\u0628\u064A, \u0645\u0642\u0647\u0649 \u062A\u0642\u0644\u064A\u062F\u064A, \u0627\u0633\u062A\u0631\u0627\u062D\u0629 \u0645\u0633\u0627\u0641\u0631" },
                      description: { type: import_genai.Type.STRING, description: "What makes it special, popular food served, or ambiance details" },
                      googleMapsQuery: { type: import_genai.Type.STRING, description: "Map query to look it up" }
                    },
                    required: ["name", "type", "description", "googleMapsQuery"]
                  }
                },
                mosquesAndRestrooms: {
                  type: import_genai.Type.ARRAY,
                  description: "Nearby mosques to pray in right on time, featuring hygiene public toilets and direct routes",
                  items: {
                    type: import_genai.Type.OBJECT,
                    properties: {
                      name: { type: import_genai.Type.STRING, description: "Mosque name or famous praying spot with prayer guide" },
                      prayerTimesTransitAdvice: { type: import_genai.Type.STRING, description: "Guidelines on restroom cleanliness, location, or direct path" },
                      hasPublicRestroom: { type: import_genai.Type.BOOLEAN, description: "True if equipped with active general clean restroom/toilets" },
                      googleMapsQuery: { type: import_genai.Type.STRING, description: "Query to locate" }
                    },
                    required: ["name", "prayerTimesTransitAdvice", "hasPublicRestroom", "googleMapsQuery"]
                  }
                },
                medicalServices: {
                  type: import_genai.Type.ARRAY,
                  description: "Nearby pharmacies (including night pharmacies / \u0635\u064A\u062F\u0644\u064A\u0629 \u0645\u0646\u0627\u0648\u0628\u0629), Laboratories or clinics for analysis, especially if there's a medical focus",
                  items: {
                    type: import_genai.Type.OBJECT,
                    properties: {
                      name: { type: import_genai.Type.STRING, description: "E.g. Pharmacy, Medical Analysis Lab, Clinic name" },
                      type: { type: import_genai.Type.STRING, description: "E.g. Pharmacy (\u0635\u064A\u062F\u0644\u064A\u0629), Lab (\u0645\u062E\u0628\u0631 \u062A\u062D\u0627\u0644\u064A\u0644), Clinic (\u0639\u064A\u0627\u062F\u0629)" },
                      description: { type: import_genai.Type.STRING, description: "Operation details or emergency services context" },
                      googleMapsQuery: { type: import_genai.Type.STRING, description: "Maps query to search" },
                      phoneNumber: { type: import_genai.Type.STRING, description: "Contact phone number for immediate inquiries" }
                    },
                    required: ["name", "type", "description", "googleMapsQuery", "phoneNumber"]
                  }
                },
                nearbyAlternativeLodgings: {
                  type: import_genai.Type.ARRAY,
                  description: "Alternative motels, affordable hotel inns, traditional rooms, or private home stays in case they want other choices or close relocations",
                  items: {
                    type: import_genai.Type.OBJECT,
                    properties: {
                      name: { type: import_genai.Type.STRING, description: "Motel (\u0645\u0631\u0642\u062F), Hotel (\u0641\u0646\u062F\u0642), private rental house, or host family stay" },
                      type: { type: import_genai.Type.STRING, description: "E.g. \u0645\u0631\u0642\u062F \u0639\u0627\u0626\u0644\u064A, \u0641\u0646\u062F\u0642 \u0634\u0639\u0628\u064A, \u0645\u0646\u0632\u0644 \u0643\u0625\u0642\u0627\u0645\u0629 \u0645\u0633\u062A\u0642\u0644\u0629" },
                      priceEstimateLocal: { type: import_genai.Type.STRING, description: "Average typical price per night in local currency (e.g. 2500 \u062F\u062C)" },
                      googleMapsQuery: { type: import_genai.Type.STRING, description: "Map query to search" },
                      phoneNumber: { type: import_genai.Type.STRING, description: "Contact phone number/mobile of lodging/motel" }
                    },
                    required: ["name", "type", "priceEstimateLocal", "googleMapsQuery", "phoneNumber"]
                  }
                },
                businessAndPrintingServices: {
                  type: import_genai.Type.ARRAY,
                  description: "Print shops, copy centers, cyber cafes, stationery shops, and office kiosks, highly required for business travel to print papers and documents",
                  items: {
                    type: import_genai.Type.OBJECT,
                    properties: {
                      name: { type: import_genai.Type.STRING, description: "E.g. \u0645\u0643\u062A\u0628\u0629 \u0627\u0628\u0646 \u062E\u0644\u062F\u0648\u0646 \u0644\u0644\u0646\u0633\u062E, \u0643\u0634\u0643 \u0648\u0631\u0627\u0642 \u0627\u0644\u062D\u0648\u0645\u0629, Cyber Caf\xE9 Copieur Multit\xE2ches" },
                      type: { type: import_genai.Type.STRING, description: "E.g. \u0645\u0631\u0643\u0632 \u0646\u0633\u062E \u0648\u062B\u0627\u0626\u0642, \u0643\u0634\u0643 \u0645\u062A\u0639\u062F\u062F \u0627\u0644\u062E\u062F\u0645\u0627\u062A, \u0645\u0643\u062A\u0628\u0629 \u0648\u0644\u0648\u0627\u0632\u0645 \u0645\u0643\u062A\u0628\u064A\u0629" },
                      description: { type: import_genai.Type.STRING, description: "Photocopy machines, document binding, scanner, or stationary/office tools availability" },
                      googleMapsQuery: { type: import_genai.Type.STRING, description: "Maps search query" }
                    },
                    required: ["name", "type", "description", "googleMapsQuery"]
                  }
                }
              },
              required: ["restaurantsAndCafes", "mosquesAndRestrooms", "medicalServices", "nearbyAlternativeLodgings", "businessAndPrintingServices"]
            },
            estimatedTransitSchedules: {
              type: import_genai.Type.ARRAY,
              description: "Schedules of transport methods (buses, aeroplanes, passenger trains) with day and hour",
              items: {
                type: import_genai.Type.OBJECT,
                properties: {
                  transportMethod: { type: import_genai.Type.STRING, description: "E.g., \u062D\u0627\u0641\u0644\u0629 \u0646\u0642\u0644 \u0627\u0644\u0645\u0633\u0627\u0641\u0631\u064A\u0646 \u0627\u0644\u062E\u0637\u0648\u0637 \u0627\u0644\u0643\u0628\u0631\u0649, \u0631\u062D\u0644\u0629 \u0627\u0644\u0637\u064A\u0631\u0627\u0646 AH6002" },
                  departureDayTime: { type: import_genai.Type.STRING, description: "E.g., \u0643\u0644 \u0623\u062D\u062F \u0648\u062B\u0644\u0627\u062B\u0627\u0621 \u0627\u0644\u0633\u0627\u0639\u0629 08:30 \u0635\u0628\u0627\u062D\u0627\u064B" },
                  stationName: { type: import_genai.Type.STRING, description: "E.g., \u0645\u062D\u0637\u0629 \u0627\u0644\u0646\u0642\u0644 \u0627\u0644\u0628\u0631\u064A \u0628\u0628\u0631\u062C \u0628\u0648\u0639\u0631\u064A\u0631\u064A\u062C" },
                  frequencyAndPrice: { type: import_genai.Type.STRING, description: "E.g., \u0631\u062D\u0644\u0629 \u064A\u0648\u0645\u064A\u0629 \u0628\u0633\u0639\u0631 1000 \u062F\u062C" },
                  contactPhone: { type: import_genai.Type.STRING, description: "Hotline number of the station or company" }
                },
                required: ["transportMethod", "departureDayTime", "stationName", "frequencyAndPrice", "contactPhone"]
              }
            }
          },
          required: [
            "destinationName",
            "country",
            "tripDurationDays",
            "targetBudgetLevel",
            "travelerType",
            "languageCode",
            "days",
            "suggestedHotels",
            "customPackingList",
            "localTravelTips",
            "climateAdvisoryAlert",
            "localEventsAndExpos",
            "isDomesticTrip",
            "localCurrencySymbol",
            "emergencyNumbers",
            "bookingRequirements",
            "localTraditionalCuisine",
            "popularMarketsAndSouks",
            "googleMapsSim",
            "tripPurpose",
            "missionDestinationsText",
            "lodgingType",
            "administrativeMissionDetails",
            "nearbyPlacesAndUtilities",
            "estimatedTransitSchedules"
          ]
        }
      }
    });
    const text = response.text;
    if (!text) {
      throw new Error("No response returned from the model");
    }
    const data = JSON.parse(text);
    return res.json(data);
  } catch (error) {
    logCleanErrorWarning("Itinerary generation", error);
    try {
      const fallbackData = generateOfflineItinerary(req.body);
      return res.json(fallbackData);
    } catch (fallbackErr) {
      console.error("Critical itinerary generation offline fallback FAILURE:", fallbackErr);
      return res.status(500).json({ error: error.message || "Failed to generate travel plan" });
    }
  }
});
function generateOfflineItinerary(params) {
  const {
    destination = "Algiers",
    daysCount = 3,
    budget = "Economy",
    travelerType = "Solo",
    interests = [],
    lang = "en",
    tripScope = "domestic",
    originWilaya = "Algiers",
    departureDate = "Flexible",
    allocatedBudgetAmount = "Flexible",
    transitMode = "Flight",
    tripPurpose = "tourism",
    missionDestinationsText = "",
    lodgingType = "hotel"
  } = params;
  const isAr = lang === "ar";
  const daysNum = Math.min(14, Math.max(1, parseInt(daysCount) || 3));
  const isDomestic = tripScope === "domestic";
  const localCurrencySymbol = isDomestic ? isAr ? "\u062F\u062C" : "DZD" : "$";
  const budgetCapText = allocatedBudgetAmount || (isDomestic ? "50,000 \u062F\u062C" : "$1,000");
  const destClean = destination.trim();
  const daysArray = [];
  for (let i = 1; i <= daysNum; i++) {
    const activities = [];
    if (tripPurpose === "medical") {
      activities.push({
        title: isAr ? `\u0632\u064A\u0627\u0631\u0629 \u0627\u0644\u0645\u0633\u062A\u0634\u0641\u0649 \u0627\u0644\u062A\u062E\u0635\u0635\u064A \u0648\u0627\u0644\u062A\u062D\u0627\u0644\u064A\u0644 \u0627\u0644\u0637\u0628\u064A\u0629` : `Specialist Hospital & Clinical Lab Screening`,
        description: isAr ? `\u0627\u0644\u062A\u0648\u062C\u0647 \u0645\u0628\u0643\u0631\u0627\u064B \u0644\u0625\u062A\u0645\u0627\u0645 \u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629\u060C \u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0637\u0628\u064A\u0628 \u0627\u0644\u0627\u0633\u062A\u0634\u0627\u0631\u064A\u060C \u0648\u0627\u0633\u062A\u0644\u0627\u0645 \u0646\u062A\u0627\u0626\u062C \u0627\u0644\u062A\u062D\u0627\u0644\u064A\u0644 \u0648\u0627\u0644\u0641\u062D\u0648\u0635\u0627\u062A \u0648\u0635\u0631\u0641 \u0627\u0644\u0639\u0644\u0627\u062C \u0627\u0644\u0644\u0627\u0632\u0645.` : `Head to the specialized clinic/hospital early to complete medical screenings, consult with the lead physician, and secure prescriptions.`,
        timeOfDay: "Morning",
        durationHours: 3.5,
        estimatedCostUSD: budget === "Economy" ? 20 : budget === "Moderate" ? 50 : 150,
        locationName: isAr ? `${destClean} - \u0639\u064A\u0627\u062F\u0629 \u0627\u0644\u0627\u0633\u062A\u0634\u0627\u0631\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629` : `${destClean} Specialist Medical Center`
      });
      activities.push({
        title: isAr ? `\u0627\u0633\u062A\u0631\u0627\u062D\u0629 \u0648\u0627\u0633\u062A\u0631\u062F\u0627\u062F \u0639\u0627\u0641\u064A\u0629 \u0641\u064A \u062D\u062F\u064A\u0642\u0629 \u0639\u0627\u0645\u0629 \u0645\u0646\u0641\u0631\u062F\u0629` : `Wellness Recup & Gentle Walking Park Session`,
        description: isAr ? `\u0642\u0636\u0627\u0621 \u0641\u062A\u0631\u0629 \u0628\u0639\u062F \u0627\u0644\u0638\u0647\u064A\u0631\u0629 \u0641\u064A \u062D\u062F\u064A\u0642\u0629 \u0647\u0627\u062F\u0626\u0629 \u0648\u0645\u0631\u064A\u062D\u0629 \u0644\u0644\u062A\u0646\u0632\u0647 \u0627\u0644\u062E\u0641\u064A\u0641 \u0648\u0627\u0633\u062A\u0646\u0634\u0627\u0642 \u0627\u0644\u0647\u0648\u0627\u0621 \u0627\u0644\u0646\u0642\u064A \u0627\u0644\u0645\u0644\u0627\u0626\u0645 \u0644\u0644\u0635\u062D\u0629.` : `Spend a serene afternoon in a quiet public garden for relaxing walks, fresh air, and stress recovery suitable for healthcare travelers.`,
        timeOfDay: "Afternoon",
        durationHours: 2,
        estimatedCostUSD: 0,
        locationName: isAr ? `${destClean} - \u0627\u0644\u062D\u062F\u064A\u0642\u0629 \u0627\u0644\u0639\u0627\u0645\u0629 \u0627\u0644\u0643\u0628\u0631\u0649` : `${destClean} Central Therapeutic Garden`
      });
      activities.push({
        title: isAr ? `\u0639\u0634\u0627\u0621 \u0635\u062D\u064A \u062E\u0641\u064A\u0641 \u0648\u0645\u0631\u0627\u062C\u0639\u0629 \u062E\u0637\u0629 \u0627\u0644\u063A\u062F` : `Healthy Organic Supper & Treatment Routine Review`,
        description: isAr ? `\u062A\u0646\u0627\u0648\u0644 \u0639\u0634\u0627\u0621 \u0635\u062D\u064A \u0648\u0645\u063A\u0630\u064A \u0641\u064A \u0645\u0637\u0639\u0645 \u0645\u0631\u064A\u062D \u0630\u064A \u0625\u0637\u0644\u0627\u0644\u0629 \u0645\u0647\u062F\u0626\u0629\u060C \u0648\u062A\u062C\u0647\u064A\u0632 \u0645\u0644\u0641\u0627\u062A \u0627\u0644\u064A\u0648\u0645 \u0627\u0644\u062A\u0627\u0644\u064A \u0644\u0644\u0623\u0637\u0628\u0627\u0621 \u0645\u0646 \u0645\u0633\u062A\u0646\u062F\u0627\u062A \u0648\u062D\u0642\u0627\u0626\u0628.` : `Savor a wholesome dietary meal at a tranquil local dining spot, followed by organizing clinical documents for subsequent checkups.`,
        timeOfDay: "Evening",
        durationHours: 1.5,
        estimatedCostUSD: budget === "Economy" ? 10 : budget === "Moderate" ? 25 : 60,
        locationName: isAr ? `${destClean} - \u0645\u0637\u0639\u0645 \u0627\u0644\u063A\u0630\u0627\u0621 \u0627\u0644\u0635\u062D\u064A \u0627\u0644\u0645\u0648\u0635\u0649 \u0628\u0647` : `${destClean} Green Organic Diner`
      });
    } else if (tripPurpose === "business_admin") {
      activities.push({
        title: isAr ? `\u0627\u062C\u062A\u0645\u0627\u0639 \u0631\u0633\u0645\u064A \u0648\u0625\u062F\u0627\u0631\u0629 \u0645\u0639\u0627\u0645\u0644\u0627\u062A \u0625\u062F\u0627\u0631\u064A\u0629 \u0648\u0645\u0643\u062A\u0628\u064A\u0629` : `Formal Business Session & Administrative Filing`,
        description: isAr ? `\u0627\u0644\u062A\u0648\u062C\u0647 \u0625\u0644\u0649 \u0645\u0642\u0631 \u0645\u0643\u0627\u062A\u0628 \u0627\u0644\u0645\u0639\u0627\u0645\u0644\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629\u060C \u0625\u062A\u0645\u0627\u0645 \u0627\u0644\u062A\u0648\u0642\u064A\u0639\u0627\u062A \u0627\u0644\u0631\u0633\u0645\u064A\u0629\u060C \u0648\u062A\u0635\u0648\u064A\u0631 \u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0648\u062A\u0642\u062F\u064A\u0645 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0627\u0639\u062A\u0645\u0627\u062F.` : `Commute to the regional business/administrative terminal, complete bureaucratic filings, sign credentials, and stamp certificates.`,
        timeOfDay: "Morning",
        durationHours: 4,
        estimatedCostUSD: 15,
        locationName: isAr ? `${destClean} - \u0645\u0628\u0646\u0649 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0648\u0627\u0644\u0645\u0642\u0631 \u0627\u0644\u0625\u062F\u0627\u0631\u064A \u0627\u0644\u0645\u062A\u0643\u0627\u0645\u0644` : `${destClean} Central Administrative Office Zone`
      });
      activities.push({
        title: isAr ? `\u062C\u0644\u0633\u0629 \u062A\u0648\u0627\u0635\u0644 \u0648\u0627\u062D\u062A\u0633\u0627\u0621 \u0627\u0644\u0642\u0647\u0648\u0629 \u0645\u0639 \u0627\u0644\u0634\u0631\u0643\u0627\u0621 \u0627\u0644\u0645\u062D\u0644\u064A\u064A\u0646` : `Business Networking Coffee & Regional Briefing`,
        description: isAr ? `\u062C\u0644\u0633\u0629 \u0639\u0645\u0644 \u062E\u0641\u064A\u0641\u0629 \u0644\u062A\u0628\u0627\u062F\u0644 \u0627\u0644\u062E\u0628\u0631\u0627\u062A \u0648\u0627\u0644\u0627\u062A\u0641\u0627\u0642\u064A\u0629 \u0645\u0639 \u0648\u0641\u062F \u0627\u0644\u0623\u0639\u0645\u0627\u0644 \u0627\u0644\u0645\u062D\u0644\u064A \u0648\u0645\u0646\u0627\u0642\u0634\u0629 \u062A\u0637\u0648\u0631\u0627\u062A \u0627\u0644\u0625\u0631\u0633\u0627\u0644\u064A\u0629 \u0627\u0644\u0628\u0631\u064A\u0629 \u0627\u0644\u062D\u0636\u0631\u064A\u0629.` : `A mid-day executive coffee roundtable with local agency contractors to discuss regional infrastructure projects and guidelines.`,
        timeOfDay: "Afternoon",
        durationHours: 2.5,
        estimatedCostUSD: budget === "Economy" ? 5 : budget === "Moderate" ? 15 : 40,
        locationName: isAr ? `${destClean} - \u0645\u0642\u0647\u0649 \u0627\u0644\u0623\u0639\u0645\u0627\u0644 \u0627\u0644\u0639\u0635\u0631\u064A \u0627\u0644\u0645\u0631\u064A\u062D` : `${destClean} Executive Business Lounge & Roastery`
      });
      activities.push({
        title: isAr ? `\u0639\u0634\u0627\u0621 \u0639\u0645\u0644 \u0631\u0633\u0645\u064A \u0648\u0625\u0646\u062C\u0627\u0632 \u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u064A\u0648\u0645` : `Executive Working Supper & Daily Progress Reporting`,
        description: isAr ? `\u062A\u0646\u0627\u0648\u0644 \u0648\u062C\u0628\u0629 \u0639\u0634\u0627\u0621 \u0645\u062A\u0645\u064A\u0632\u0629 \u0645\u0639 \u0645\u0631\u0627\u062C\u0639\u0629 \u0645\u0630\u0643\u0631\u0627\u062A \u0627\u0644\u064A\u0648\u0645 \u0648\u0635\u064A\u0627\u063A\u0629 \u0627\u0644\u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u0628\u0631\u064A\u062F\u064A \u0644\u0625\u0631\u0633\u0627\u0644\u0647 \u0644\u0644\u0645\u0643\u062A\u0628 \u0627\u0644\u0631\u0626\u064A\u0633\u064A.` : `A professional dining meetup to summarize the day's achievements and electronically submit progress reports to the headquarters.`,
        timeOfDay: "Evening",
        durationHours: 2,
        estimatedCostUSD: budget === "Economy" ? 15 : budget === "Moderate" ? 35 : 90,
        locationName: isAr ? `${destClean} - \u0645\u0637\u0639\u0645 \u0627\u0644\u0646\u062E\u0628\u0629 \u0644\u0644\u0623\u0639\u0645\u0627\u0644` : `${destClean} Elite Corporate Dining & Grill`
      });
    } else {
      activities.push({
        title: isAr ? `\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0645\u0639\u0627\u0644\u0645 \u0627\u0644\u0645\u062F\u064A\u0646\u0629 \u0627\u0644\u062A\u0627\u0631\u064A\u062E\u064A\u0629 \u0648\u0627\u0644\u0648\u0627\u062C\u0647\u0627\u062A \u0627\u0644\u0639\u0631\u064A\u0642\u0629` : `Ancient Heritage Landmark Tour & Museum Sightseeing`,
        description: isAr ? `\u062C\u0648\u0644\u0629 \u0635\u0628\u0627\u062D\u064A\u0629 \u0644\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0627\u0644\u0645\u062A\u0627\u062D\u0641 \u0648\u0627\u0644\u0645\u0639\u0627\u0644\u0645 \u0627\u0644\u0623\u062B\u0631\u064A\u0629 \u0648\u0627\u0644\u0645\u0648\u0627\u0642\u0639 \u0627\u0644\u0645\u0635\u0646\u0641\u0629 \u0639\u0627\u0644\u0645\u064A\u0627\u064B \u0636\u0645\u0646 \u0627\u0644\u062A\u0631\u0627\u062B \u0627\u0644\u0625\u0646\u0633\u0627\u0646\u064A \u0644\u062A\u0644\u0643 \u0627\u0644\u0645\u0646\u0637\u0642\u0629.` : `An immersive morning tour visiting historical architecture, old-city ruins, and famous local heritage museums.`,
        timeOfDay: "Morning",
        durationHours: 3,
        estimatedCostUSD: budget === "Economy" ? 2 : budget === "Moderate" ? 8 : 25,
        locationName: isAr ? `${destClean} - \u0627\u0644\u0645\u0631\u0643\u0632 \u0627\u0644\u062A\u0627\u0631\u064A\u062E\u064A \u0627\u0644\u0639\u0631\u064A\u0642` : `${destClean} Ancient District Center`
      });
      activities.push({
        title: isAr ? `\u062A\u0630\u0648\u0642 \u0627\u0644\u063A\u0630\u0627\u0621 \u0648\u0627\u0644\u0637\u0628\u0642 \u0627\u0644\u062A\u0642\u0644\u064A\u062F\u064A \u0627\u0644\u0623\u0643\u062B\u0631 \u0634\u0647\u0631\u0629 \u0628\u0627\u0644\u0645\u0646\u0637\u0642\u0629` : `Traditional Local Culinary Lunch Experience`,
        description: isAr ? `\u062A\u0646\u0627\u0648\u0644 \u063A\u062F\u0627\u0621 \u0623\u0635\u064A\u0644 \u0648\u0644\u0630\u064A\u0630 \u064A\u0639\u0643\u0633 \u0645\u0637\u0628\u062E \u0627\u0644\u0648\u0644\u0627\u064A\u0629 \u0623\u0648 \u0627\u0644\u062F\u0648\u0644\u0629 \u0627\u0644\u0639\u0631\u064A\u0642 (\u0643\u0627\u0644\u0631\u0634\u062A\u0629\u060C \u0627\u0644\u0643\u0633\u0643\u0633\u060C \u0623\u0648 \u0627\u0644\u0623\u0637\u0628\u0627\u0642 \u0627\u0644\u0634\u0647\u064A\u0631\u0629 \u0647\u0646\u0627\u0643) \u0628\u0623\u064A\u0627\u062F\u064D \u0645\u062D\u0644\u064A\u0629.` : `Enjoy a delicious authentic lunch in a local tavern, indulging in native specialties uniquely prepared with heritage spices.`,
        timeOfDay: "Afternoon",
        durationHours: 2,
        estimatedCostUSD: budget === "Economy" ? 5 : budget === "Moderate" ? 12 : 35,
        locationName: isAr ? `${destClean} - \u0645\u0637\u0639\u0645 \u0627\u0644\u0645\u0623\u0643\u0648\u0644\u0627\u062A \u0627\u0644\u062A\u0642\u0644\u064A\u062F\u064A\u0629 \u0627\u0644\u0634\u0639\u0628\u064A` : `${destClean} Culinary Heritage Tavern`
      });
      activities.push({
        title: isAr ? `\u062C\u0648\u0644\u0629 \u0628\u0627\u0644\u0623\u0633\u0648\u0627\u0642 \u0627\u0644\u0634\u0639\u0628\u064A\u0629 \u0648\u0634\u0631\u0627\u0621 \u062A\u0630\u0643\u0627\u0631\u0627\u062A \u064A\u062F\u0648\u064A\u0629 \u0627\u0644\u0635\u0646\u0639` : `Lively Local Souk Promenade & Gift Shopping`,
        description: isAr ? `\u0627\u0644\u062A\u062C\u0648\u0644 \u0628\u064A\u0646 \u062F\u0643\u0627\u0643\u064A\u0646 \u0627\u0644\u0628\u0627\u0632\u0627\u0631 \u0627\u0644\u062A\u0627\u0631\u064A\u062E\u064A\u0629\u060C \u0627\u0644\u0627\u0633\u062A\u0645\u062A\u0627\u0639 \u0628\u0631\u0648\u0627\u0626\u062D \u0627\u0644\u0628\u0647\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0630\u0647\u0644\u0629\u060C \u0648\u0645\u0633\u0627\u0648\u0645\u0629 \u0627\u0644\u0628\u0627\u0639\u0629 \u0639\u0644\u0649 \u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u0646\u062D\u0627\u0633 \u0648\u0627\u0644\u062C\u0644\u0648\u062F \u0627\u0644\u0645\u062A\u0645\u064A\u0632\u0629.` : `Walk through vibrant traditional storefronts, admire handmade carpet looms, smell ancient spices, and purchase genuine crafts.`,
        timeOfDay: "Evening",
        durationHours: 2.5,
        estimatedCostUSD: budget === "Economy" ? 10 : budget === "Moderate" ? 30 : 100,
        locationName: isAr ? `${destClean} - \u0627\u0644\u0633\u0648\u0642 \u0627\u0644\u062A\u0642\u0644\u064A\u062F\u064A \u0648\u0627\u0644\u0628\u0627\u0632\u0627\u0631 \u0627\u0644\u0642\u062F\u064A\u0645` : `${destClean} Historical Souk & Bazaar`
      });
    }
    daysArray.push({
      dayNumber: i,
      theme: isAr ? tripPurpose === "medical" ? `\u0627\u0644\u064A\u0648\u0645 ${i}: \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0627\u0633\u062A\u0634\u0641\u0627\u0626\u064A\u0629 \u0648\u0627\u0644\u0627\u0633\u062A\u0631\u062E\u0627\u0621 \u0627\u0644\u0641\u0633\u064A\u0648\u0644\u0648\u062C\u064A` : tripPurpose === "business_admin" ? `\u0627\u0644\u064A\u0648\u0645 ${i}: \u062A\u0633\u064A\u064A\u0631 \u0627\u0644\u0645\u0639\u0627\u0645\u0644\u0627\u062A \u0627\u0644\u0645\u0643\u062A\u0628\u064A\u0629 \u0648\u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A` : `\u0627\u0644\u064A\u0648\u0645 ${i}: \u0627\u0644\u0627\u0646\u063A\u0645\u0627\u0633 \u0641\u064A \u0627\u0644\u062A\u0631\u0627\u062B \u0648\u0627\u0644\u062C\u0645\u0627\u0644 \u0627\u0644\u0645\u062D\u0644\u064A` : tripPurpose === "medical" ? `Day ${i}: Therapeutic Care & Restorative Healing` : tripPurpose === "business_admin" ? `Day ${i}: Corporate Action & Bureaucracy Clearance` : `Day ${i}: Discovering Local Soul & Architecture`,
      activities
    });
  }
  const suggestedHotels = [
    {
      name: isAr ? "\u0641\u0646\u062F\u0642 \u0627\u0644\u0633\u0639\u0627\u062F\u0629 \u0648\u0627\u0644\u0631\u0627\u062D\u0629 \u0627\u0644\u0633\u064A\u0627\u062D\u064A" : "Comfort Bliss Grand Hotel",
      stars: budget === "Economy" ? 3 : budget === "Moderate" ? 4 : 5,
      pricePerNightUSD: budget === "Economy" ? 32 : budget === "Moderate" ? 75 : 180,
      ratingValue: 4.6,
      reasonForRecommendation: isAr ? "\u0645\u0648\u0642\u0639 \u0645\u0645\u062A\u0627\u0632 \u064A\u062A\u0648\u0627\u0641\u0642 \u0645\u0639 \u0645\u064A\u0632\u0627\u0646\u064A\u062A\u0643 \u0648\u064A\u0648\u0641\u0631 \u0633\u0647\u0648\u0644\u0629 \u0628\u0627\u0644\u063A\u0629 \u0641\u064A \u0627\u0644\u0648\u0635\u0648\u0644 \u0644\u0644\u0645\u0648\u0627\u0635\u0644\u0627\u062A \u0648\u0627\u0644\u0645\u0631\u0627\u0641\u0642 \u0627\u0644\u0647\u0627\u0645\u0629." : "Prime location tailored to your budget constraints, offering swift transport connection points.",
      phoneNumber: "+213 (0) 21 55-66-77",
      address: isAr ? `${destClean} - \u0634\u0627\u0631\u0639 \u0627\u0644\u0627\u0633\u062A\u0642\u0644\u0627\u0644 \u0627\u0644\u0645\u0631\u0643\u0632\u064A` : `Independance Boulevard, Central ${destClean}`
    },
    {
      name: isAr ? "\u062F\u0627\u0631 \u0627\u0644\u0636\u064A\u0627\u0641\u0629 \u0627\u0644\u062A\u0642\u0644\u064A\u062F\u064A\u0629 \u0627\u0644\u0623\u0635\u064A\u0644\u0629" : "Heritage Eco-Guesthouse Stay",
      stars: budget === "Economy" ? 2 : budget === "Moderate" ? 3 : 4,
      pricePerNightUSD: budget === "Economy" ? 25 : budget === "Moderate" ? 50 : 120,
      ratingValue: 4.8,
      reasonForRecommendation: isAr ? "\u062A\u062A\u0645\u064A\u0632 \u0628\u0627\u0644\u0637\u0631\u0627\u0632 \u0627\u0644\u0645\u0639\u0645\u0627\u0631\u064A \u0627\u0644\u062A\u0642\u0644\u064A\u062F\u064A \u0648\u0636\u064A\u0627\u0641\u0629 \u0641\u0646\u062F\u0642\u064A\u0629 \u0623\u0635\u064A\u0644\u0629 \u062A\u0645\u0646\u062D\u0643 \u062A\u062C\u0631\u0628\u0629 \u062B\u0642\u0627\u0641\u064A\u0629 \u0645\u0630\u0647\u0644\u0629." : "Showcases beautiful traditional regional design with exceptional personalized warm hospitality.",
      phoneNumber: "+213 (0) 550 12-34-56",
      address: isAr ? `${destClean} - \u062D\u064A \u0627\u0644\u0642\u0635\u0628\u0629 \u0627\u0644\u0639\u062A\u064A\u0642` : `Historical Kasbah District, ${destClean}`
    },
    {
      name: isAr ? "\u0646\u064F\u0632\u0644 \u0627\u0644\u0645\u0633\u0627\u0641\u0631 \u0627\u0644\u0627\u0642\u062A\u0635\u0627\u062F\u064A \u0648\u0627\u0644\u0645\u0631\u064A\u062D" : "Cozy Travelers Budget Inn",
      stars: budget === "Economy" ? 1 : budget === "Moderate" ? 2 : 3,
      pricePerNightUSD: budget === "Economy" ? 15 : budget === "Moderate" ? 30 : 65,
      ratingValue: 4.2,
      reasonForRecommendation: isAr ? "\u0627\u0644\u062E\u064A\u0627\u0631 \u0627\u0644\u0623\u0641\u0636\u0644 \u0627\u0642\u062A\u0635\u0627\u062F\u064A\u0627\u064B \u0644\u062A\u0648\u0638\u064A\u0641 \u0645\u0648\u0641\u0631 \u0627\u0644\u0645\u064A\u0632\u0627\u0646\u064A\u0629 \u0648\u0645\u0646\u0627\u0633\u0628 \u0644\u0642\u0636\u0627\u0621 \u0644\u064A\u0644\u0629 \u0645\u0631\u064A\u062D\u0629 \u0622\u0645\u0646\u0629." : "Highly economical selection designed to conserve itinerary budget without sacrificing hygiene.",
      phoneNumber: "+213 (0) 770 99-88-77",
      address: isAr ? `${destClean} - \u0628\u0627\u0644\u0642\u0631\u0628 \u0645\u0646 \u0645\u062D\u0637\u0629 \u0627\u0644\u062D\u0627\u0641\u0644\u0627\u062A \u0627\u0644\u0643\u0628\u0631\u0649` : `Near the Central Bus Terminal, ${destClean}`
    }
  ];
  return {
    destinationName: destClean,
    country: isDomestic ? isAr ? "\u0627\u0644\u062C\u0632\u0627\u0626\u0631" : "Algeria" : isAr ? "\u0648\u062C\u0647\u0629 \u062F\u0648\u0644\u064A\u0629" : "International",
    tripDurationDays: daysNum,
    targetBudgetLevel: budget,
    travelerType,
    languageCode: lang,
    departureDate,
    allocatedBudgetAmount: budgetCapText,
    transitMode,
    climateAdvisoryAlert: isAr ? `\u{1F326}\uFE0F \u062A\u0646\u0628\u0624 \u0627\u0644\u0637\u0642\u0633 \u0644\u0631\u062D\u0644\u062A\u0643 \u0627\u0644\u0645\u062C\u062F\u0648\u0644\u0629 \u064A\u0638\u0647\u0631 \u0623\u062C\u0648\u0627\u0621 \u0645\u0639\u062A\u062F\u0644\u0629 \u0639\u0645\u0648\u0645\u0627\u064B \u0648\u0646\u0646\u0635\u062D \u0628\u0627\u0631\u062A\u062F\u0627\u0621 \u062B\u064A\u0627\u0628 \u0645\u0646\u0627\u0633\u0628\u0629. \u0646\u0646\u0635\u062D \u0628\u0639\u062F\u0645 \u0625\u0644\u063A\u0627\u0621 \u0623\u0648 \u062A\u0642\u062F\u064A\u0645 \u0627\u0644\u0631\u062D\u0644\u0629 \u0628\u0644 \u064A\u0641\u0636\u0644 \u0627\u0644\u0633\u0641\u0631 \u0641\u064A \u0645\u0648\u0639\u062F\u0643\u0645 \u0627\u0644\u0645\u062E\u0637\u0637.` : `\u{1F326}\uFE0F Seasonal weather forecasting reveals generally pleasant climate conditions. Travel schedule is highly optimized and on-track; no postponement recommended.`,
    localEventsAndExpos: [
      {
        name: isAr ? "\u0645\u0639\u0631\u0636 \u0627\u0644\u0635\u0646\u0627\u0639\u0627\u062A \u0627\u0644\u062A\u0642\u0644\u064A\u062F\u064A\u0629 \u0648\u0627\u0644\u062D\u0631\u0641 \u0627\u0644\u064A\u062F\u0648\u064A\u0629 \u0627\u0644\u0648\u0637\u0646\u064A\u0629" : "National Traditional Crafts & Artisanal Exhibition",
        date: isAr ? "\u0627\u0644\u0634\u0647\u0631 \u0627\u0644\u062D\u0627\u0644\u064A" : "Current Travel Month",
        advisabilityNote: isAr ? "\u064A\u064F\u0646\u0635\u062D \u0628\u0634\u062F\u0629 \u0628\u0632\u064A\u0627\u0631\u062A\u0647 \u0644\u0627\u0642\u062A\u0646\u0627\u0621 \u062A\u062D\u0641 \u0641\u0646\u064A\u0629 \u0641\u0631\u064A\u062F\u0629 \u0648\u062F\u0639\u0645 \u0627\u0644\u062A\u0639\u0627\u0648\u0646\u064A\u0627\u062A \u0627\u0644\u0639\u0627\u0626\u0644\u064A\u0629 \u0644\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u062A\u0631\u0627\u062B\u064A\u0629." : "Highly recommended to explore stunning local pottery developments and support domestic community workshops."
      }
    ],
    days: daysArray,
    isDomesticTrip: isDomestic,
    localCurrencySymbol,
    suggestedHotels,
    customPackingList: [
      {
        category: isAr ? "\u0627\u0644\u0645\u0644\u0627\u0628\u0633 \u0648\u0627\u0644\u0645\u0644\u0628\u0648\u0633\u0627\u062A" : "Clothing & Apparels",
        items: isAr ? ["\u062B\u064A\u0627\u0628 \u0645\u0631\u064A\u062D\u0629 \u0644\u0644\u0645\u0634\u064A \u062E\u0641\u064A\u0641\u0629 \u0648\u0633\u0647\u0644\u0629 \u0627\u0644\u063A\u0633\u0644", "\u0633\u062A\u0631\u0629 \u0645\u062A\u0648\u0633\u0637\u0629 \u0627\u0644\u0633\u0645\u0643 \u0641\u064A \u0627\u0644\u0645\u0633\u0627\u0621", "\u0642\u0628\u0639\u0629 \u0634\u0645\u0633\u064A\u0629 \u0648\u0646\u0638\u0627\u0631\u0627\u062A \u0648\u0642\u0627\u0626\u064A\u0629"] : ["Breathable walking fabrics and shirts", "Light evening cardigan/jacket", "Suntan protection & hat"]
      },
      {
        category: isAr ? "\u0627\u0644\u0645\u0633\u062A\u0646\u062F\u0627\u062A \u0648\u0627\u0644\u0623\u062C\u0647\u0632\u0629" : "Documents & Digital gear",
        items: isAr ? ["\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0647\u0648\u064A\u0629 \u0648\u0627\u0644\u0648\u062B\u0627\u0626\u0642 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0645\u0637\u0628\u0648\u0639\u0629", "\u0634\u0627\u062D\u0646 \u0646\u0642\u0627\u0644 \u0644\u0644\u0647\u0627\u062A\u0641 \u0627\u0644\u0630\u0643\u064A", "\u0642\u0627\u0626\u0645\u0629 \u0623\u0631\u0642\u0627\u0645 \u0648\u0639\u0646\u0627\u0648\u064A\u0646 \u0627\u0644\u0641\u0646\u062F\u0642 \u0645\u0637\u0628\u0648\u0639\u0629"] : ["Printed official identity credentials & visa", "High capacity travel powerbank", "Hard copies of accommodation booking notes"]
      }
    ],
    localTravelTips: isAr ? [
      "\u0627\u062D\u0631\u0635 \u0639\u0644\u0649 \u0645\u0631\u0627\u062C\u0639\u0629 \u0634\u0631\u0648\u0637 \u0627\u0644\u062D\u062C\u0632 \u0648\u0639\u0642\u062F \u0627\u0644\u0625\u0642\u0627\u0645\u0629\u060C \u062E\u0635\u0648\u0635\u0627\u064B \u0639\u0646\u062F \u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0645\u0628\u064A\u062A \u0628\u0627\u0644\u0645\u0646\u0627\u0632\u0644 \u0627\u0644\u0645\u0633\u062A\u0642\u0644\u0629 \u0623\u0648 \u0627\u0644\u0641\u0646\u0627\u062F\u0642 \u0627\u0644\u0634\u0639\u0628\u064A\u0629.",
      "\u064A\u0641\u0636\u0644 \u062D\u0645\u0644 \u0645\u0628\u0627\u0644\u063A \u0643\u0627\u0641\u064A\u0629 \u0628\u0627\u0644\u062F\u064A\u0646\u0627\u0631 \u0627\u0644\u062C\u0632\u0627\u0626\u0631\u064A \u0644\u0644\u062F\u0641\u0639 \u0646\u0642\u062F\u064B\u0627 \u0644\u062F\u0649 \u0627\u0644\u0645\u062D\u0644\u0627\u062A \u0648\u0627\u0644\u0645\u0637\u0627\u0639\u0645 \u0644\u0639\u062F\u0645 \u062A\u0648\u0641\u0631 \u0627\u0644\u062F\u0641\u0639 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0627\u0644\u0634\u0627\u0645\u0644 \u0641\u064A \u0627\u0644\u062C\u0632\u0627\u0626\u0631.",
      "\u062A\u062C\u0646\u0628 \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0645\u0638\u0627\u0647\u0631 \u0627\u0644\u0641\u062E\u0645\u0629 \u0627\u0644\u0645\u0641\u0631\u0637\u0629 \u0628\u0627\u0644\u0634\u0627\u0631\u0639 \u0648\u0627\u0644\u062A\u0642\u064A\u062F \u0628\u0627\u0644\u062A\u0642\u0627\u0644\u064A\u062F \u0627\u0644\u0645\u062D\u0644\u064A\u0629\u060C \u0648\u0627\u0633\u062A\u0623\u0630\u0646 \u0627\u0644\u0623\u0634\u062E\u0627\u0635 \u062F\u0627\u0626\u0645\u0627\u064B \u0642\u0628\u0644 \u062A\u0635\u0648\u064A\u0631\u0647\u0645.",
      "\u0644\u0644\u062A\u0646\u0642\u0644 \u0627\u0644\u062D\u0636\u0631\u064A \u0627\u0644\u0628\u064A\u0646-\u0648\u0644\u0627\u0626\u064A\u060C \u0627\u0628\u062D\u062B \u0639\u0646 \u0627\u0644\u062D\u0627\u0641\u0644\u0627\u062A \u0627\u0644\u0645\u0631\u062E\u0635\u0629 \u0648\u0627\u0644\u062A\u0627\u0628\u0639\u0629 \u0644\u0645\u0624\u0633\u0633\u0627\u062A \u0627\u0644\u0646\u0642\u0644 \u0627\u0644\u0628\u0631\u064A \u0627\u0644\u0631\u0633\u0645\u064A\u0629."
    ] : [
      "Always confirm terms and conditions of rental agreements especially when opting for vacation homes or private apartments.",
      "Ensure carrying adequate cash in Algerian Dinars (DZD) since credit cards are not universally accepted across all local souks.",
      "Be mindful of local customs, dress respectfully, and always seek verbal permission before photographing residents.",
      "For commuting between cities, rely on official private transit companies or municipal public bus connections."
    ],
    emergencyNumbers: isAr ? [
      { label: "\u0627\u0644\u0634\u0631\u0637\u0629 \u0627\u0644\u062C\u0632\u0627\u0626\u0631\u064A\u0629 \u0627\u0644\u0648\u0637\u0646\u064A\u0629", phone: "17" },
      { label: "\u0627\u0644\u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u0645\u062F\u0646\u064A\u0629 \u0627\u0644\u062C\u0632\u0627\u0626\u0631\u064A\u0629 (\u0627\u0644\u0625\u0633\u0639\u0627\u0641 \u0648\u0627\u0644\u0625\u0637\u0641\u0627\u0621)", phone: "14" },
      { label: "\u0627\u0644\u062F\u0631\u0643 \u0627\u0644\u0648\u0637\u0646\u064A (\u0623\u0645\u0646 \u0627\u0644\u0637\u0631\u0642)", phone: "1055" }
    ] : [
      { label: "Algerian National Police Force", phone: "17" },
      { label: "Protection Civile (Ambulance/Fire)", phone: "14" },
      { label: "National Gendarmerie (Rural safety)", phone: "1055" }
    ],
    bookingRequirements: isAr ? [
      "\u0625\u062D\u0636\u0627\u0631 \u0646\u0633\u062E\u0629 \u0648\u0631\u0642\u064A\u0629 \u0644\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u062A\u0639\u0631\u064A\u0641 \u0627\u0644\u0648\u0637\u0646\u064A\u0629 \u0623\u0648 \u062C\u0648\u0627\u0632 \u0627\u0644\u0633\u0641\u0631 \u0644\u0644\u0645\u0633\u0627\u0641\u0631\u064A\u0646.",
      "\u0639\u0646\u062F \u0627\u0644\u0645\u0628\u064A\u062A \u0641\u064A \u0641\u0646\u0627\u062F\u0642 \u0623\u0648 \u0645\u0646\u0627\u0632\u0644\u060C \u064A\u064F\u0634\u062A\u0631\u0637 \u0639\u0642\u062F \u0632\u0648\u0627\u062C \u0631\u0633\u0645\u064A \u0644\u0644\u0639\u0627\u0626\u0644\u0627\u062A \u0648\u0627\u0644\u0639\u0627\u0626\u0644\u0627\u062A \u0627\u0644\u0645\u0631\u0627\u0641\u0642\u0629 \u062D\u0633\u0628 \u0627\u0644\u0642\u0627\u0646\u0648\u0646 \u0627\u0644\u062C\u0632\u0627\u0626\u0631\u064A \u0627\u0644\u0635\u0627\u0631\u0645.",
      "\u062F\u0641\u0639 \u0645\u0633\u0628\u0642 \u0646\u0642\u062F\u064A \u0644\u0648\u062F\u064A\u0639\u0629 \u0627\u0644\u062A\u0623\u0645\u064A\u0646 \u0641\u064A \u0628\u0639\u0636 \u0627\u0644\u0645\u0631\u0627\u0642\u062F \u0623\u0648 \u062F\u0648\u0631 \u0627\u0644\u0636\u064A\u0627\u0641\u0629 \u0627\u0644\u062A\u0642\u0644\u064A\u062F\u064A\u0629."
    ] : [
      "Present physical standard identity proof (Passport/National IDs) during room registration.",
      "Under Algerian sovereign law, official marriage certificates are required for domestic/international couples sharing single suites.",
      "A small cash deposit is frequently expected upon registering at traditional family-owned lodges."
    ],
    localTraditionalCuisine: [
      {
        name: isAr ? "\u0627\u0644\u0643\u0633\u0643\u0633 \u0627\u0644\u062C\u0632\u0627\u0626\u0631\u064A \u0627\u0644\u0623\u0635\u064A\u0644" : "Authentic Algerian Couscous",
        description: isAr ? "\u0627\u0644\u0637\u0628\u0642 \u0627\u0644\u0648\u0637\u0646\u064A \u0627\u0644\u0623\u0643\u062B\u0631 \u0639\u0631\u0627\u0642\u0629 \u0648\u0645\u0630\u0627\u0642\u0627\u064B\u060C \u064A\u064F\u062D\u0636\u0631 \u0645\u0646 \u062D\u0628\u0627\u062A \u0627\u0644\u0642\u0645\u062D \u0627\u0644\u0645\u0641\u062A\u0648\u0644\u0629 \u0628\u0627\u0644\u064A\u062F \u0648\u064A\u064F\u0637\u0647\u0649 \u0628\u0627\u0644\u0628\u062E\u0627\u0631 \u0645\u0639 \u0645\u0631\u0642 \u0627\u0644\u0644\u062D\u0645 \u0623\u0648 \u0627\u0644\u062F\u062C\u0627\u062C \u0648\u0627\u0644\u062E\u0636\u0627\u0631 \u0627\u0644\u0637\u0627\u0632\u062C\u0629." : "The legendary sovereign dish steamed gently over meat or chicken broth, served with farm vegetables and chickpeas."
      },
      {
        name: isAr ? "\u0627\u0644\u0631\u0634\u062A\u0629 \u0627\u0644\u0639\u0627\u0635\u0645\u064A\u0629" : "Algerian Festive Rechta",
        description: isAr ? "\u0634\u0631\u0627\u0626\u062D \u0639\u062C\u064A\u0646 \u0646\u0627\u0639\u0645\u0629 \u0631\u0642\u064A\u0642\u0629 \u062A\u0634\u0628\u0647 \u0627\u0644\u0634\u0639\u064A\u0631\u064A\u0629\u060C \u062A\u064F\u0637\u0647\u0649 \u0628\u0627\u0644\u0628\u062E\u0627\u0631 \u0648\u062A\u064F\u0633\u0642\u0649 \u0628\u0645\u0631\u0642 \u0623\u0628\u064A\u0636 \u063A\u0646\u064A \u0628\u0627\u0644\u062F\u062C\u0627\u062C \u0648\u0627\u0644\u0644\u0641\u062A \u0627\u0644\u0644\u0630\u064A\u0630 \u0645\u0639 \u0631\u0634\u0629 \u0645\u0646 \u0627\u0644\u0642\u0631\u0641\u0629 \u0627\u0644\u0645\u0630\u0647\u0644\u0629." : "Delicate thin handmade dough strands steamed and dressed with an elegant white turnip chicken sauce and a dash of cinnamon."
      }
    ],
    popularMarketsAndSouks: [
      {
        name: isAr ? "\u0633\u0648\u0642 \u0627\u0644\u062D\u0648\u0645\u0629 \u0627\u0644\u0642\u062F\u064A\u0645 \u0644\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u064A\u062F\u0648\u064A\u0629" : "The Core Downtown Craft Market",
        type: isAr ? "\u0633\u0648\u0642 \u0644\u0644\u0645\u0635\u0646\u0648\u0639\u0627\u062A \u0627\u0644\u064A\u062F\u0648\u064A\u0629 \u0648\u0627\u0644\u062C\u0644\u0648\u062F" : "Artisanal & Leathercraft Bazaar",
        description: isAr ? "\u0623\u0642\u062F\u0645 \u0628\u0642\u0639\u0629 \u062A\u0633\u0648\u0642 \u0644\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u062D\u0631\u0641\u064A\u0629 \u0627\u0644\u0623\u0635\u064A\u0644\u0629 \u0643\u0627\u0644\u0623\u0648\u0627\u0646\u064A \u0627\u0644\u0646\u062D\u0627\u0633\u064A\u0629 \u0648\u0627\u0644\u0633\u062C\u0627\u062F \u0627\u0644\u0645\u0646\u0633\u0648\u062C \u064A\u062F\u0648\u064A\u0627\u064B \u0648\u0627\u0644\u0628\u0647\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u062D\u0644\u064A\u0629 \u0627\u0644\u0637\u0627\u0632\u062C\u0629." : "The ultimate focal shopping spot to purchase hand-hammered metals, traditional leather boots, and local spices."
      }
    ],
    googleMapsSim: {
      accommodationName: isAr ? "\u0641\u0646\u062F\u0642 \u0627\u0644\u0633\u0639\u0627\u062F\u0629 \u0648\u0627\u0644\u0631\u0627\u062D\u0629 \u0627\u0644\u0633\u064A\u0627\u062D\u064A" : "Comfort Bliss Grand Hotel",
      accommodationQuery: isAr ? `\u0641\u0646\u062F\u0642 \u0627\u0644\u0633\u0639\u0627\u062F\u0629\u060C ${destClean}` : `Comfort Bliss Hotel, ${destClean}`,
      primarySpotName: isAr ? `\u0645\u062A\u062D\u0641 \u0627\u0644\u062A\u0631\u0627\u062B \u0648\u0627\u0644\u062A\u0627\u0631\u064A\u062E \u0628\u0640 ${destClean}` : `${destClean} National Heritage Museum`,
      primarySpotQuery: isAr ? `\u0645\u062A\u062D\u0641\u060C ${destClean}` : `Museum, ${destClean}`,
      distanceKMText: isAr ? "\u0663,\u0662 \u0643\u0645" : "3.2 km",
      recommendedTaxiApp: isAr ? "\u064A\u0633\u064A\u0631 (Yassir) \u0623\u0648 \u062E\u062F\u0645\u0629 \u062A\u0627\u0643\u0633\u064A \u0627\u0644\u062D\u0648\u0645\u0629" : "Yassir, InDrive, or Neighborhood Taxi lines",
      taxiFareEstimateLocal: isAr ? "450 \u062F\u062C" : "450 DZD",
      transitAdviceStep: isAr ? `\u062E\u0630 \u0627\u0644\u062D\u0627\u0641\u0644\u0629 \u0631\u0642\u0645 \u0663\u0665 \u0627\u0644\u0645\u062A\u0648\u062C\u0647\u0629 \u0648\u0633\u0637 \u0627\u0644\u0645\u062F\u064A\u0646\u0629 \u0645\u0646 \u0627\u0644\u0645\u062D\u0637\u0629 \u0627\u0644\u0645\u062C\u0627\u0648\u0631\u0629 \u0644\u0644\u0641\u0646\u062F\u0642 \u0645\u0628\u0627\u0634\u0631\u0629\u060C \u0623\u0648 \u0627\u0637\u0644\u0628 \u0633\u064A\u0627\u0631\u0629 \u064A\u0633\u064A\u0631 \u0644\u062A\u0635\u0644 \u0641\u064A \u063A\u0636\u0648\u0646 \u0669 \u062F\u0642\u0627\u0626\u0642.` : `Board municipal bus No. 35 bound for core center from the station outside, or request a Yassir ride-sharing taxi for a 9-minute commute.`
    },
    tripPurpose,
    missionDestinationsText: missionDestinationsText || "",
    lodgingType,
    administrativeMissionDetails: {
      missionOverview: isAr ? `\u062E\u0627\u0631\u0637\u0629 \u0637\u0631\u064A\u0642 \u0625\u062C\u0631\u0627\u0626\u064A\u0629 \u0648\u0645\u062D\u0633\u0646\u0629 \u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0633\u064A\u0631 \u0627\u0644\u0645\u0639\u0627\u0645\u0644\u0627\u062A \u0628\u0648\u0632\u0627\u0631\u0629 \u0627\u0644\u0647\u064A\u0626\u0627\u062A \u0648\u0627\u0644\u0645\u0643\u0627\u062A\u0628 \u0627\u0644\u0645\u0639\u0646\u064A\u0629 \u0628\u0640 ${destClean}.` : `A streamlined logistic outline detailing administrative clearance steps inside specialized ${destClean} bureaus.`,
      destinationsList: [
        {
          name: isAr ? "\u0645\u0642\u0631 \u0625\u062F\u0627\u0631\u0629 \u0648\u0644\u0627\u064A\u0629 \u0627\u0644\u0648\u062C\u0647\u0629 \u0648\u0627\u0644\u0633\u062C\u0644 \u0627\u0644\u062A\u062C\u0627\u0631\u064A" : "District Administrative Registry & Office",
          estimatedQueueTime: isAr ? "\u0661 - \u0662 \u0633\u0627\u0639\u0629" : "1 - 2 Hours",
          transitAdvice: isAr ? "\u064A\u0648\u0635\u0649 \u0628\u0631\u0643\u0648\u0628 \u0633\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0623\u062C\u0631\u0629 \u0627\u0644\u0645\u0634\u062A\u0631\u0643\u0629 \u0644\u0644\u0648\u0635\u0648\u0644 \u0645\u0628\u0627\u0634\u0631\u0629 \u0644\u0648\u0633\u0637 \u0627\u0644\u0625\u062F\u0627\u0631\u0627\u062A \u0641\u064A \u0627\u0644\u0635\u0628\u0627\u062D \u0627\u0644\u0628\u0627\u0643\u0631." : "Recommending collective street taxis early in the morning to arrive prior to standard queue formations.",
          documentsRequired: isAr ? ["\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0647\u0648\u064A\u0629 \u0627\u0644\u0648\u0637\u0646\u064A\u0629 \u0633\u0627\u0631\u064A\u0629 \u0627\u0644\u0645\u0641\u0639\u0648\u0644", "\u0646\u0633\u062E\u0629 \u0645\u0646 \u0633\u062C\u0644 \u0637\u0644\u0628 \u0627\u0644\u062A\u0631\u062E\u064A\u0635 \u0623\u0648 \u0625\u062B\u0628\u0627\u062A \u0627\u0644\u0645\u0648\u0639\u062F \u0627\u0644\u0637\u0628\u064A"] : ["Physical Passport or National Identification Card", "Proof of official appointment or credential registration forms"],
          googleMapsQuery: isAr ? `\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0633\u062C\u0644 \u0627\u0644\u0645\u062F\u0646\u064A\u060C ${destClean}` : `Administrative Registry Office, ${destClean}`,
          phoneNumber: "+213 (0) 21 00-11-22",
          address: isAr ? `\u0648\u0633\u0637 \u0627\u0644\u0645\u062F\u064A\u0646\u0629\u060C \u062D\u064A \u0627\u0644\u0645\u0643\u0627\u062A\u0628 \u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629` : `Administrative Quarter, Core Center, ${destClean}`
        }
      ]
    },
    nearbyPlacesAndUtilities: {
      restaurantsAndCafes: [
        {
          name: isAr ? "\u0645\u0637\u0639\u0645 \u0627\u0644\u062E\u064A\u0631\u0627\u062A \u0627\u0644\u0634\u0639\u0628\u064A" : "Al-Khairat Traditional Kitchen",
          type: isAr ? "\u0645\u0637\u0639\u0645 \u0645\u0623\u0643\u0648\u0644\u0627\u062A \u0634\u0639\u0628\u064A\u0629" : "Traditional Diner",
          description: isAr ? "\u064A\u0642\u062F\u0645 \u0623\u0644\u0630 \u0627\u0644\u0645\u0634\u0648\u064A\u0627\u062A \u0627\u0644\u0637\u0627\u0632\u062C\u0629 \u0648\u0627\u0644\u0643\u0633\u0643\u0633 \u0648\u0645\u0623\u0643\u0648\u0644\u0627\u062A \u0627\u0644\u0637\u0628\u0627\u062E \u0627\u0644\u0645\u062D\u0644\u064A \u0628\u0633\u0631\u0639\u0629 \u0648\u0645\u0648\u062B\u0648\u0642\u064A\u0629." : "Serves incredible fresh charcoal grills, local hot stews, and famous Algerian traditional recipes.",
          googleMapsQuery: isAr ? `\u0645\u0637\u0639\u0645 \u0627\u0644\u062E\u0628\u0631\u0627\u062A\u060C ${destClean}` : `Al-Khairat Restaurant, ${destClean}`
        }
      ],
      mosquesAndRestrooms: [
        {
          name: isAr ? "\u0627\u0644\u0645\u0633\u062C\u062F \u0627\u0644\u0639\u062A\u064A\u0642 \u0627\u0644\u0643\u0628\u064A\u0631" : "The Grand Ancient Al-Ateeq Mosque",
          prayerTimesTransitAdvice: isAr ? "\u064A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u0645\u0644\u062D\u0642 \u062E\u0627\u0635 \u0644\u0644\u0645\u0648\u0636\u0648\u0621 \u0648\u062F\u0648\u0631\u0627\u062A \u0644\u0644\u0645\u064A\u0627\u0647 \u0646\u0638\u064A\u0641\u0629 \u0648\u0645\u0641\u062A\u0648\u062D\u0629 \u0644\u0644\u0639\u0627\u0645\u0629 \u0637\u064A\u0644\u0629 \u0633\u0627\u0639\u0627\u062A \u0627\u0644\u0635\u0644\u0627\u0629." : "Equipped with large, clean, separate washrooms and public restrooms open throughout prayer slots.",
          hasPublicRestroom: true,
          googleMapsQuery: isAr ? `\u0627\u0644\u0645\u0633\u062C\u062F \u0627\u0644\u0639\u062A\u064A\u0642\u060C ${destClean}` : `Al-Ateeq Mosque, ${destClean}`
        }
      ],
      medicalServices: [
        {
          name: isAr ? "\u0635\u064A\u062F\u0644\u064A\u0629 \u0627\u0644\u0647\u0644\u0627\u0644 \u0627\u0644\u0645\u0646\u0627\u0648\u0628\u0629 (\u0662\u0664 \u0633\u0627\u0639\u0629)" : "Al-Hilal 24/7 Night Duty Pharmacy",
          type: isAr ? "\u0635\u064A\u062F\u0644\u064A\u0629 \u0645\u0646\u0627\u0648\u0628\u0629 \u0648\u0645\u0633\u062A\u0644\u0632\u0645\u0627\u062A \u0639\u0644\u0627\u062C\u064A\u0629" : "24-Hour Pharmacy Store",
          description: isAr ? "\u062A\u0642\u0639 \u0639\u0644\u0649 \u0645\u0633\u0627\u0641\u0629 \u062F\u0642\u064A\u0642\u062A\u064A\u0646 \u0633\u064A\u0631\u0627\u064B \u0648\u062A\u0648\u0641\u0631 \u0643\u0627\u0641\u0629 \u0627\u0644\u0623\u062F\u0648\u064A\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0648\u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0625\u0633\u0639\u0627\u0641\u064A\u0629." : "Positioned 2 minutes away on foot; highly reliable for midnight prescriptions and health essentials.",
          googleMapsQuery: isAr ? `\u0635\u064A\u062F\u0644\u064A\u0629 \u0627\u0644\u0647\u0644\u0627\u0644\u060C ${destClean}` : `Al-Hilal Pharmacy, ${destClean}`,
          phoneNumber: "+213 (0) 550 55-55-55"
        }
      ],
      nearbyAlternativeLodgings: [
        {
          name: isAr ? "\u062F\u0627\u0631 \u0627\u0644\u0639\u0627\u0626\u0644\u0627\u062A \u0644\u0644\u0636\u064A\u0627\u0641\u0629 \u0627\u0644\u0633\u064A\u0627\u062D\u064A\u0629" : "Family Comfort Guest Lodgings",
          type: isAr ? "\u0634\u0642\u0642 \u0648\u0639\u0627\u0626\u0644\u0627\u062A \u0645\u0633\u062A\u0636\u0627\u0641\u0629" : "Private Apartment Rentals",
          priceEstimateLocal: isAr ? "3500 \u062F\u062C" : "3,500 DZD",
          googleMapsQuery: isAr ? `\u062F\u0627\u0631 \u0627\u0644\u0639\u0627\u0626\u0644\u0627\u062A\u060C ${destClean}` : `Family Comfort Lodge, ${destClean}`,
          phoneNumber: "+213 (0) 660 11-22-33"
        }
      ],
      businessAndPrintingServices: [
        {
          name: isAr ? "\u0643\u0634\u0643 \u0627\u0644\u0646\u0648\u0631 \u0644\u0644\u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0645\u062A\u0639\u062F\u062F\u0629 \u0648\u0627\u0644\u0646\u0633\u062E" : "Al-Noor Digital Print & Copy Center",
          type: isAr ? "\u0645\u0631\u0643\u0632 \u062E\u062F\u0645\u0627\u062A \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0629 \u0648\u0646\u0633\u062E \u0648\u062B\u0627\u0626\u0642" : "Multiservice Document Copy Corner",
          description: isAr ? "\u062E\u062F\u0645\u0627\u062A \u0645\u062A\u0645\u064A\u0632\u0629 \u0644\u062A\u0635\u0648\u064A\u0631 \u0627\u0644\u0645\u0633\u062A\u0646\u062F\u0627\u062A \u0648\u0627\u0644\u0623\u0648\u0631\u0627\u0642 \u0648\u0633\u0643\u0627\u0646\u0631 \u0648\u0627\u0633\u062A\u062E\u0631\u0627\u062C \u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0641\u0648\u0631\u064A\u0627\u064B." : "Quick laser prints, high resolution scanners, document binding, and online application filing help.",
          googleMapsQuery: isAr ? `\u0643\u0634\u0643 \u0645\u062A\u0639\u062F\u062F \u0627\u0644\u062E\u062F\u0645\u0627\u062A\u060C ${destClean}` : `Al-Noor Prints, ${destClean}`
        }
      ]
    },
    estimatedTransitSchedules: [
      {
        transportMethod: isAr ? "\u062D\u0627\u0641\u0644\u0627\u062A \u062E\u0637\u0648\u0637 \u0627\u0644\u0646\u0642\u0644 \u0627\u0644\u0648\u0637\u0646\u064A\u0629 \u0627\u0644\u0643\u0628\u0631\u0649 (\u0628\u064A\u0646 \u0627\u0644\u0648\u0644\u0627\u064A\u0627\u062A)" : "Sovereign Municipal Intercity Express Bus Line",
        departureDayTime: isAr ? "\u064A\u0648\u0645\u064A\u0627\u064B \u0645\u0646 \u0627\u0644\u0633\u0627\u0639\u0629 06:15 \u0635\u0628\u0627\u062D\u0627\u064B \u0648\u0643\u0644 \u0646\u0635\u0641 \u0633\u0627\u0639\u0629" : "Daily at 06:15 AM, departing every 30 minutes onwards",
        stationName: isAr ? `\u0645\u062D\u0637\u0629 \u0627\u0644\u0645\u0633\u0627\u0641\u0631\u064A\u0646 \u0627\u0644\u0628\u0631\u064A\u0629 \u0628\u0640 ${destClean}` : `${destClean} Core Domestic Transport Terminal`,
        frequencyAndPrice: isAr ? "\u0631\u062D\u0644\u0627\u062A \u0645\u0646\u062A\u0638\u0645\u0629 \u0637\u064A\u0644\u0629 \u0627\u0644\u064A\u0648\u0645 \u0628\u0633\u0639\u0631 600 \u062F\u062C" : "Regular schedule, tickets priced at 600 DZD flat rate",
        contactPhone: "+213 (0) 21 44-33-22"
      }
    ],
    isOfflineFallback: true
  };
}
app.post("/api/smart-location-help", async (req, res) => {
  try {
    const { query, lang } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }
    const ai = getAiClient();
    const isAr = lang === "ar";
    const systemInstruction = isAr ? `\u0623\u0646\u062A \u062E\u0628\u064A\u0631 \u0633\u064A\u0627\u062D\u064A \u0648\u0645\u062E\u0637\u0637 \u0637\u064A\u0631\u0627\u0646 \u0630\u0643\u064A \u064A\u0628\u0633\u0637 \u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u0631\u062D\u0644\u0627\u062A \u0627\u0644\u062D\u0631\u0629.
      \u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u0637\u0644\u0628 \u0627\u0644\u0645\u0633\u0627\u0641\u0631\u060C \u0642\u0645 \u0628\u062A\u062D\u0644\u064A\u0644 \u0648\u0627\u0633\u062A\u062E\u0631\u0627\u062C \u0645\u0643\u0627\u0646 \u0627\u0644\u0627\u0646\u0637\u0644\u0627\u0642 \u0627\u0644\u0645\u0642\u062A\u0631\u062D\u060C \u0648\u0627\u0644\u0648\u062C\u0647\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629\u060C \u0648\u0627\u0642\u062A\u0631\u062D \u0627\u0644\u0645\u0637\u0627\u0631\u0627\u062A \u0627\u0644\u062F\u0648\u0644\u064A\u0629 \u0627\u0644\u0645\u062A\u0627\u062D\u0629 \u0627\u0644\u0642\u0631\u064A\u0628\u0629 \u0648\u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629 \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u0628\u0644\u062F \u0644\u0644\u0631\u062D\u0644\u0627\u062A \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629\u060C \u0648\u0643\u0630\u0644\u0643 \u062D\u062F\u062F \u062C\u062F\u0648\u0644\u0627\u064B \u0644\u0645\u0648\u0627\u0639\u064A\u062F \u0631\u062D\u0644\u0627\u062A \u0627\u0644\u0637\u064A\u0631\u0627\u0646 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629 \u0648\u063A\u064A\u0631 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629 \u0627\u0644\u0645\u0645\u0643\u0646\u0629 \u0644\u0647\u0630\u0647 \u0627\u0644\u0631\u062D\u0644\u0629.
      \u064A\u062C\u0628 \u0623\u0646 \u062A\u0631\u062C\u0639 \u0625\u062C\u0627\u0628\u062A\u0643 \u0628\u0635\u064A\u063A\u0629 JSON \u062D\u0635\u0631\u064A\u0629 \u0648\u062F\u0642\u064A\u0642\u0629 \u0648\u0645\u0637\u0627\u0628\u0642\u0629 \u062A\u0645\u0627\u0645\u0627\u064B \u0644\u0644\u0645\u062E\u0637\u0637 \u0627\u0644\u062A\u0627\u0644\u064A \u062F\u0648\u0646 \u0623\u064A \u0646\u0635\u0648\u0635 \u062E\u0627\u0631\u062C\u064A\u0629:` : `You are an expert travel consultant and smart flight planner.
      Based on the traveler's request, extract/analyze the starting point (origin) and target upcoming destination. Recommend available international airports in target countries for secure direct flights, and propose a list of feasible direct and indirect flight schedules.
      Return EXCLUSIVELY a JSON object adhering to this schema:`;
    const response = await generateContentWithFallback({
      contents: [{ role: "user", parts: [{ text: query }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          properties: {
            detectedOrigin: { type: import_genai.Type.STRING, description: "\u0627\u0633\u0645 \u0645\u0643\u0627\u0646 \u0627\u0644\u0627\u0646\u0637\u0644\u0627\u0642 \u0627\u0644\u0645\u0633\u062A\u062E\u0631\u062C \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629" },
            detectedUpcomingDestination: { type: import_genai.Type.STRING, description: "\u0627\u0633\u0645 \u0627\u0644\u0648\u062C\u0647\u0629 \u0627\u0644\u0642\u0627\u062F\u0645\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u0631\u062C \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629" },
            suggestedAirports: {
              type: import_genai.Type.ARRAY,
              description: "\u0627\u0644\u0645\u0637\u0627\u0631\u0627\u062A \u0627\u0644\u062F\u0648\u0644\u064A\u0629 \u0627\u0644\u0642\u0631\u064A\u0628\u0629 \u0648\u0627\u0644\u0645\u062A\u0627\u062D\u0629 \u0644\u0644\u0631\u062D\u0644\u0627\u062A \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629 \u0623\u0648 \u063A\u064A\u0631 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629",
              items: {
                type: import_genai.Type.OBJECT,
                properties: {
                  code: { type: import_genai.Type.STRING, description: "\u0631\u0645\u0632 \u0627\u0644\u0645\u0637\u0627\u0631 \u0645\u062B\u0644 ALG, CDG, IST" },
                  name: { type: import_genai.Type.STRING, description: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0637\u0627\u0631" },
                  city: { type: import_genai.Type.STRING, description: "\u0627\u0644\u0645\u062F\u064A\u0646\u0629" },
                  type: { type: import_genai.Type.STRING, description: "direct (\u0631\u062D\u0644\u0627\u062A \u0645\u0628\u0627\u0634\u0631\u0629) \u0623\u0648 connection (\u0631\u062D\u0644\u0627\u062A \u062A\u0631\u0627\u0646\u0632\u064A\u062A)" },
                  remarks: { type: import_genai.Type.STRING, description: "\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u062D\u0648\u0644 \u0634\u0631\u0643\u0627\u062A \u0627\u0644\u0637\u064A\u0631\u0627\u0646 \u0627\u0644\u062A\u064A \u062A\u0634\u063A\u0644 \u0631\u062D\u0644\u0627\u062A \u0645\u0628\u0627\u0634\u0631\u0629 \u0645\u0646\u0647\u0627 \u0648\u0625\u0644\u064A\u0647\u0627" }
                },
                required: ["code", "name", "city", "type", "remarks"]
              }
            },
            flightSchedules: {
              type: import_genai.Type.ARRAY,
              description: "\u0623\u0645\u062B\u0644\u0629 \u0648\u0645\u0648\u0627\u0639\u064A\u062F \u0631\u062D\u0644\u0627\u062A \u0637\u064A\u0631\u0627\u0646 \u0645\u0628\u0627\u0634\u0631\u0629 \u0648\u063A\u064A\u0631 \u0645\u0628\u0627\u0634\u0631\u0629 \u0645\u0645\u0643\u0646\u0629 \u0648\u0645\u0642\u062A\u0631\u062D\u0629",
              items: {
                type: import_genai.Type.OBJECT,
                properties: {
                  flightNo: { type: import_genai.Type.STRING, description: "\u0631\u0642\u0645 \u0627\u0644\u0631\u062D\u0644\u0629 \u0627\u0644\u062A\u0642\u062F\u064A\u0631\u064A \u0645\u062B\u0644 AH1000 \u0623\u0648 TK1402" },
                  airline: { type: import_genai.Type.STRING, description: "\u0634\u0631\u0643\u0629 \u0627\u0644\u0637\u064A\u0631\u0627\u0646" },
                  type: { type: import_genai.Type.STRING, description: "Direct (\u0645\u0628\u0627\u0634\u0631) \u0623\u0648 Indirect (\u063A\u064A\u0631 \u0645\u0628\u0627\u0634\u0631)" },
                  duration: { type: import_genai.Type.STRING, description: "\u0627\u0644\u0645\u062F\u0629 \u0627\u0644\u0632\u0645\u0646\u064A\u0629 \u0627\u0644\u062A\u0642\u062F\u064A\u0631\u064A\u0629 \u0644\u0644\u0631\u062D\u0644\u0629" },
                  departureTime: { type: import_genai.Type.STRING, description: "\u0645\u0648\u0639\u062F \u0627\u0644\u0625\u0642\u0644\u0627\u0639 \u0627\u0644\u062A\u0642\u062F\u064A\u0631\u064A" },
                  arrivalTime: { type: import_genai.Type.STRING, description: "\u0645\u0648\u0639\u062F \u0627\u0644\u0648\u0635\u0648\u0644 \u0627\u0644\u062A\u0642\u062F\u064A\u0631\u064A" },
                  stops: { type: import_genai.Type.STRING, description: "\u0639\u062F\u062F \u0645\u062D\u0637\u0627\u062A \u0627\u0644\u062A\u0631\u0627\u0646\u0632\u064A\u062A \u0623\u0648 '\u0631\u062D\u0644\u0629 \u0645\u0628\u0627\u0634\u0631\u0629'" },
                  remarks: { type: import_genai.Type.STRING, description: "\u062A\u0641\u0635\u064A\u0644 \u0627\u0644\u0623\u064A\u0627\u0645 \u0627\u0644\u0645\u062A\u0648\u0641\u0631\u0629 \u0623\u0648 \u0627\u0644\u062A\u0648\u0642\u064A\u062A \u0627\u0644\u0623\u0641\u0636\u0644" }
                },
                required: ["flightNo", "airline", "type", "duration", "departureTime", "arrivalTime", "stops", "remarks"]
              }
            },
            aiGuidanceText: { type: import_genai.Type.STRING, description: "\u0646\u0635\u064A\u062D\u0629 \u0630\u0643\u064A\u0629 \u0645\u0641\u0635\u0644\u0629 \u0648\u0633\u0647\u0644\u0629 \u0627\u0644\u0641\u0647\u0645 \u0628\u062E\u0635\u0648\u0635 \u0623\u0641\u0636\u0644 \u0637\u0631\u064A\u0642\u0629 \u0644\u0644\u062A\u0646\u0642\u0644 \u0627\u0644\u062C\u0648\u064A \u0648\u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0645\u0637\u0627\u0631\u0627\u062A\u060C \u0648\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0623\u064A\u0627\u0645 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629" }
          },
          required: ["detectedOrigin", "detectedUpcomingDestination", "suggestedAirports", "flightSchedules", "aiGuidanceText"]
        }
      }
    });
    const text = response.text;
    if (!text) {
      throw new Error("No response returned from the location assistant");
    }
    const data = JSON.parse(text);
    return res.json(data);
  } catch (error) {
    logCleanErrorWarning("Smart location help", error);
    try {
      const fallbackResult = generateOfflineSmartLocationHelp(req.body.query || "", req.body.lang || "en");
      return res.json(fallbackResult);
    } catch (fallbackError) {
      console.error("Critical location help offline fallback failure:", fallbackError);
      return res.status(500).json({ error: "Failed to process smart route helper request" });
    }
  }
});
function generateOfflineSmartLocationHelp(query, lang) {
  const isAr = lang === "ar";
  const queryLower = query.toLowerCase();
  let detectedOrigin = isAr ? "\u0627\u0644\u062C\u0632\u0627\u0626\u0631 (ALG)" : "Algiers (ALG)";
  let detectedUpcomingDestination = isAr ? "\u0628\u0627\u0631\u064A\u0633 (CDG)" : "Paris (CDG)";
  if (queryLower.includes("oran") || queryLower.includes("\u0648\u0647\u0631\u0627\u0646")) {
    detectedOrigin = isAr ? "\u0648\u0647\u0631\u0627\u0646 (ORN)" : "Oran (ORN)";
  } else if (queryLower.includes("constantine") || queryLower.includes("\u0642\u0633\u0646\u0637\u064A\u0646\u0629")) {
    detectedOrigin = isAr ? "\u0642\u0633\u0646\u0637\u064A\u0646\u0629 (CZL)" : "Constantine (CZL)";
  } else if (queryLower.includes("tlemcen") || queryLower.includes("\u062A\u0644\u0645\u0633\u0627\u0646")) {
    detectedOrigin = isAr ? "\u062A\u0644\u0645\u0633\u0627\u0646 (TLM)" : "Tlemcen (TLM)";
  }
  if (queryLower.includes("istanbul") || queryLower.includes("\u0627\u0633\u0637\u0646\u0628\u0648\u0644") || queryLower.includes("\u0625\u0633\u0637\u0646\u0628\u0648\u0644")) {
    detectedUpcomingDestination = isAr ? "\u0625\u0633\u0637\u0646\u0628\u0648\u0644 (IST)" : "Istanbul (IST)";
  } else if (queryLower.includes("dubai") || queryLower.includes("\u062F\u0628\u064A")) {
    detectedUpcomingDestination = isAr ? "\u062F\u0628\u064A (DXB)" : "Dubai (DXB)";
  } else if (queryLower.includes("london") || queryLower.includes("\u0644\u0646\u062F\u0646")) {
    detectedUpcomingDestination = isAr ? "\u0644\u0646\u062F\u0646 (LHR)" : "London (LHR)";
  } else if (queryLower.includes("tunis") || queryLower.includes("\u062A\u0648\u0646\u0633")) {
    detectedUpcomingDestination = isAr ? "\u062A\u0648\u0646\u0633 (TUN)" : "Tunis (TUN)";
  }
  const suggestedAirports = [
    {
      code: "ALG",
      name: isAr ? "\u0645\u0637\u0627\u0631 \u0647\u0648\u0627\u0631\u064A \u0628\u0648\u0645\u062F\u064A\u0646 \u0627\u0644\u062F\u0648\u0644\u064A" : "Houari Boumediene Airport",
      city: isAr ? "\u0627\u0644\u062C\u0632\u0627\u0626\u0631 \u0627\u0644\u0639\u0627\u0635\u0645\u0629" : "Algiers",
      type: "direct",
      remarks: isAr ? "\u0627\u0644\u0645\u0642\u0631 \u0627\u0644\u0631\u0626\u064A\u0633\u064A \u0644\u0644\u062E\u0637\u0648\u0637 \u0627\u0644\u062C\u0648\u064A\u0629 \u0627\u0644\u062C\u0632\u0627\u0626\u0631\u064A\u0629 \u0648\u0627\u0644\u0631\u0628\u0637 \u0627\u0644\u062F\u0648\u0644\u064A \u0627\u0644\u0643\u0627\u0645\u0644" : "Main hub for Air Algerie with heavy international direct flights"
    },
    {
      code: "ORN",
      name: isAr ? "\u0645\u0637\u0627\u0631 \u0623\u062D\u0645\u062F \u0628\u0646 \u0628\u0644\u0629 \u0627\u0644\u062F\u0648\u0644\u064A" : "Ahmed Ben Bella Airport",
      city: isAr ? "\u0648\u0647\u0631\u0627\u0646" : "Oran",
      type: "direct",
      remarks: isAr ? "\u0645\u0637\u0627\u0631 \u062F\u0648\u0644\u064A \u062D\u064A\u0648\u064A \u064A\u062E\u062F\u0645 \u063A\u0631\u0628 \u0627\u0644\u062C\u0632\u0627\u0626\u0631 \u0628\u0631\u062D\u0644\u0627\u062A \u0645\u062A\u0645\u064A\u0632\u0629 \u0625\u0644\u0649 \u0623\u0648\u0631\u0648\u0628\u0627 \u0648\u0645\u062E\u062A\u0644\u0641 \u0627\u0644\u0648\u062C\u0647\u0627\u062A" : "International airport serving western Algeria with flights to Europe"
    },
    {
      code: "CDG",
      name: isAr ? "\u0645\u0637\u0627\u0631 \u0628\u0627\u0631\u064A\u0633 \u0634\u0627\u0631\u0644 \u062F\u064A\u063A\u0648\u0644" : "Paris Charles de Gaulle Airport",
      city: isAr ? "\u0628\u0627\u0631\u064A\u0633" : "Paris",
      type: "direct",
      remarks: isAr ? "\u064A\u0631\u062A\u0628\u0637 \u0628\u0631\u062D\u0644\u0627\u062A \u0645\u0628\u0627\u0634\u0631\u0629 \u0648\u0645\u0646\u062A\u0638\u0645\u0629 \u0645\u0639 \u062E\u0637\u0648\u0637 \u0627\u0644\u0637\u064A\u0631\u0627\u0646 \u0627\u0644\u062C\u0632\u0627\u0626\u0631\u064A\u0629 \u0648\u0627\u0644\u0641\u0631\u0646\u0633\u064A\u0629" : "Connected daily via Air Algerie and Air France"
    }
  ];
  const flightSchedules = [
    {
      flightNo: "AH1002",
      airline: isAr ? "\u0627\u0644\u062E\u0637\u0648\u0637 \u0627\u0644\u062C\u0648\u064A\u0629 \u0627\u0644\u062C\u0632\u0627\u0626\u0631\u064A\u0629" : "Air Algerie",
      type: "Direct",
      duration: "2h 15m",
      departureTime: "07:30",
      arrivalTime: "10:45",
      stops: isAr ? "\u0631\u062D\u0644\u0629 \u0645\u0628\u0627\u0634\u0631\u0629" : "Direct Flight",
      remarks: isAr ? "\u0631\u062D\u0644\u0629 \u0645\u0631\u064A\u062D\u0629 \u0641\u064A \u0627\u0644\u0641\u062A\u0631\u0629 \u0627\u0644\u0635\u0628\u0627\u062D\u064A\u0629 \u0648\u0645\u062A\u0648\u0641\u0631\u0629 \u0637\u064A\u0644\u0629 \u0623\u064A\u0627\u0645 \u0627\u0644\u0623\u0633\u0628\u0648\u0639" : "Comfortable morning flight, available daily"
    },
    {
      flightNo: "AF1485",
      airline: isAr ? "\u0627\u0644\u062E\u0637\u0648\u0637 \u0627\u0644\u062C\u0648\u064A\u0629 \u0627\u0644\u0641\u0631\u0646\u0633\u064A\u0629" : "Air France",
      type: "Direct",
      duration: "2h 20m",
      departureTime: "14:15",
      arrivalTime: "17:35",
      stops: isAr ? "\u0631\u062D\u0644\u0629 \u0645\u0628\u0627\u0634\u0631\u0629" : "Direct Flight",
      remarks: isAr ? "\u0631\u062D\u0644\u0629 \u0645\u0633\u0627\u0626\u064A\u0629 \u0645\u062B\u0627\u0644\u064A\u0629 \u0644\u0625\u062C\u0631\u0627\u0621 \u0627\u0644\u062A\u0646\u0642\u0644\u0627\u062A \u0648\u062A\u0646\u0633\u064A\u0642 \u0623\u0645\u062A\u0639\u062A\u0643\u0645 \u0628\u064A\u0633\u0631" : "Afternoon flight, perfect for smooth check-ins"
    }
  ];
  const aiGuidanceText = isAr ? "\u062A\u0645 \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u062A\u0648\u062C\u064A\u0647\u0627\u062A \u0627\u0644\u0645\u062D\u0644\u064A\u0629 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A\u0629 \u0628\u0630\u0643\u0627\u0621: \u064A\u064F\u0648\u0635\u0649 \u062F\u0627\u0626\u0645\u0627\u064B \u0628\u062D\u062C\u0632 \u062A\u0630\u0627\u0643\u0631 \u0627\u0644\u0637\u064A\u0631\u0627\u0646 \u0642\u0628\u0644 \u0627\u0644\u0633\u0641\u0631 \u0628\u0640 3 \u0623\u0633\u0627\u0628\u064A\u0639 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644 \u0644\u0636\u0645\u0627\u0646 \u0627\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0623\u0641\u0636\u0644 \u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0648\u0627\u0644\u0639\u0631\u0648\u0636 \u0627\u0644\u062A\u0631\u0648\u064A\u062C\u064A\u0629. \u064A\u0631\u062C\u0649 \u0645\u0631\u0627\u062C\u0639\u0629 \u0635\u0644\u0627\u062D\u064A\u0629 \u062C\u0648\u0627\u0632 \u0627\u0644\u0633\u0641\u0631 \u0648\u062A\u0623\u0634\u064A\u0631\u0627\u062A \u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u0633\u0628\u0642\u0627\u064B \u0642\u0628\u0644 \u0627\u0644\u0625\u0642\u0644\u0627\u0639." : "Bespoke routing retrieved offline to guarantee continuity: It is highly advised to book tickets at least 3 weeks before travel to lock in optimal tariffs. Make sure to double-check passport validity and visa requirements prior to departure.";
  return {
    detectedOrigin,
    detectedUpcomingDestination,
    suggestedAirports,
    flightSchedules,
    aiGuidanceText,
    isOfflineFallback: true
  };
}
app.post("/api/smart-search-help", async (req, res) => {
  try {
    const { query, lang } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }
    const ai = getAiClient();
    const isAr = lang === "ar";
    const systemInstruction = isAr ? `\u0623\u0646\u062A \u0645\u0633\u0627\u0639\u062F \u0633\u064A\u0627\u062D\u064A \u0648\u0625\u0642\u0627\u0645\u0629 \u0630\u0643\u064A \u0648\u0628\u0627\u062D\u062B \u062A\u0630\u0627\u0643\u0631 \u062E\u0628\u064A\u0631 \u0644\u0644\u062A\u0646\u0642\u0644 \u0648\u0627\u0644\u0625\u0642\u0627\u0645\u0627\u062A \u0641\u064A \u0627\u0644\u062C\u0632\u0627\u0626\u0631 \u0648\u0645\u062E\u062A\u0644\u0641 \u062F\u0648\u0644 \u0627\u0644\u0639\u0627\u0644\u0645.
      \u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u0637\u0644\u0628 \u0627\u0644\u0645\u0633\u0627\u0641\u0631\u060C \u0642\u0645 \u0628\u062A\u062D\u0644\u064A\u0644 \u0648\u0627\u0633\u062A\u062E\u0631\u0627\u062C \u0645\u0643\u0627\u0646 \u0627\u0644\u0627\u0646\u0637\u0644\u0627\u0642\u060C \u0648\u0645\u0643\u0627\u0646 \u0627\u0644\u0648\u0635\u0648\u0644\u060C \u0648\u0646\u0648\u0639 \u0648\u0633\u064A\u0644\u0629 \u0627\u0644\u0646\u0642\u0644 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629\u060C \u0648\u0646\u0648\u0639 \u0645\u0643\u0627\u0646 \u0627\u0644\u0625\u0642\u0627\u0645\u0629\u060C \u0627\u0644\u0645\u064A\u0632\u0627\u0646\u064A\u0629\u060C \u0648\u0639\u062F\u062F \u0623\u064A\u0627\u0645 \u0627\u0644\u0628\u0642\u0627\u0621\u060C \u062B\u0645 \u062D\u0633\u0627\u0628 \u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u062A\u0642\u062F\u064A\u0631\u064A \u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A \u0628\u0627\u0644\u062F\u0648\u0644\u0627\u0631 \u0648\u0628\u0627\u0644\u062F\u064A\u0646\u0627\u0631 \u0627\u0644\u062C\u0632\u0627\u0626\u0631\u064A \u0627\u0644\u0645\u062D\u0644\u064A \u0641\u064A \u062D\u0627\u0644\u0629 \u0627\u0644\u0633\u0641\u0631 \u0648\u0627\u0644\u0625\u0642\u0627\u0645\u0629 \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u0629.
      \u064A\u062C\u0628 \u0623\u0646 \u062A\u0631\u062C\u0639 \u0625\u062C\u0627\u0628\u062A\u0643 \u0628\u0635\u064A\u063A\u0629 JSON \u062D\u0635\u0631\u064A\u0629 \u0648\u062F\u0642\u064A\u0642\u0629 \u0648\u0645\u0637\u0627\u0628\u0642\u0629 \u062A\u0645\u0627\u0645\u0627\u064B \u0644\u0644\u0645\u062E\u0637\u0637 \u0627\u0644\u062A\u0627\u0644\u064A \u062F\u0648\u0646 \u0623\u064A \u0646\u0635\u0648\u0635 \u062E\u0627\u0631\u062C\u064A\u0629:` : `You are an expert travel consultant, smart ticket parser, and lodging advisor for Algeria and global routes.
      Based on the traveler's request, extract/analyze the starting point, the arrival destination, select the optimum transportation mode (Plane, Train, Bus, Taxi, Car), the lodging preference (hotel, guesthouse, hostel, home), stay duration, and estimate total cost in USD and local DZD (Algerian Dinars) if it is a domestic Algerian trip.
      Return EXCLUSIVELY a JSON object adhering to this schema:`;
    const response = await generateContentWithFallback({
      contents: [{ role: "user", parts: [{ text: query }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          properties: {
            detectedOrigin: { type: import_genai.Type.STRING, description: "\u0627\u0633\u0645 \u0645\u062F\u064A\u0646\u0629/\u0648\u0644\u0627\u064A\u0629 \u0627\u0644\u0627\u0646\u0637\u0644\u0627\u0642 \u0627\u0644\u0645\u0633\u062A\u062E\u0631\u062C" },
            detectedDestination: { type: import_genai.Type.STRING, description: "\u0627\u0633\u0645 \u0645\u062F\u064A\u0646\u0629/\u0648\u0644\u0627\u064A\u0629 \u0627\u0644\u0648\u0635\u0648\u0644 \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641" },
            transportMode: { type: import_genai.Type.STRING, description: "\u0648\u0633\u064A\u0644\u0629 \u0627\u0644\u0646\u0642\u0644 \u0627\u0644\u0645\u0642\u062A\u0631\u062D\u0629: \u0637\u0627\u0626\u0631\u0629 (Plane)\u060C \u0642\u0637\u0627\u0631 (Train)\u060C \u062D\u0627\u0641\u0644\u0629 (Bus)\u060C \u0633\u064A\u0627\u0631\u0629 \u0623\u062C\u0631\u0629 (Taxi)\u060C \u0633\u064A\u0627\u0631\u0629 (Car)" },
            lodgingType: { type: import_genai.Type.STRING, description: "\u0646\u0648\u0639 \u0645\u0643\u0627\u0646 \u0627\u0644\u0625\u0642\u0627\u0645\u0629: hotel (\u0641\u0646\u062F\u0642)\u060C guesthouse (\u062F\u0627\u0631 \u0636\u064A\u0627\u0641\u0629)\u060C hostel (\u0628\u064A\u062A \u0634\u0628\u0627\u0628)\u060C home (\u0645\u0646\u0632\u0644/\u0634\u0642\u0629 \u062E\u0627\u0635\u0629)" },
            isDomestic: { type: import_genai.Type.BOOLEAN, description: "\u0647\u0644 \u0627\u0644\u0633\u0641\u0631 \u0648\u0627\u0644\u0625\u0642\u0627\u0645\u0629 \u062F\u0627\u062E\u0644\u064A\u0629 \u062F\u0627\u062E\u0644 \u0627\u0644\u062C\u0632\u0627\u0626\u0631" },
            approxPriceUSD: { type: import_genai.Type.NUMBER, description: "\u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u062A\u0642\u0631\u064A\u0628\u064A \u0628\u0627\u0644\u062F\u0648\u0644\u0627\u0631" },
            localPriceDZD: { type: import_genai.Type.NUMBER, description: "\u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0645\u0642\u0627\u0628\u0644 \u0628\u0627\u0644\u0639\u0645\u0644\u0629 \u0627\u0644\u0645\u062D\u0644\u064A\u0629 \u0628\u0627\u0644\u062F\u064A\u0646\u0627\u0631 \u0627\u0644\u062C\u0632\u0627\u0626\u0631\u064A \u062F\u062C" },
            stayDurationDays: { type: import_genai.Type.NUMBER, description: "\u0639\u062F\u062F \u0623\u064A\u0627\u0645 \u0627\u0644\u0625\u0642\u0627\u0645\u0629 \u0627\u0644\u0645\u0642\u062A\u0631\u062D\u0629" },
            accommodationDetails: { type: import_genai.Type.STRING, description: "\u0634\u0631\u062D \u062A\u0641\u0635\u064A\u0644\u064A \u0648\u0645\u0642\u062A\u0631\u062D \u0630\u0643\u064A \u0644\u0627\u062E\u062A\u064A\u0627\u0631 \u0645\u0643\u0627\u0646 \u0627\u0644\u0625\u0642\u0627\u0645\u0629 \u0648\u0627\u0644\u0628\u062F\u0627\u0626\u0644 \u0648\u0642\u064A\u0645\u062A\u0647\u0627 \u0628\u0627\u0644\u062F\u064A\u0646\u0627\u0631 \u0641\u064A \u062D\u0627\u0644\u0629 \u0627\u0644\u0631\u062D\u0644\u0629 \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u0629" },
            aiGuidanceText: { type: import_genai.Type.STRING, description: "\u062A\u0648\u062C\u064A\u0647 \u0630\u0643\u064A \u0634\u0627\u0645\u0644 \u0628\u062E\u0635\u0648\u0635 \u0648\u0633\u064A\u0644\u0629 \u0627\u0644\u0646\u0642\u0644 \u0648\u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0648\u0627\u0644\u062A\u0648\u0641\u064A\u0631 \u0627\u0644\u0645\u0627\u0644\u064A \u0644\u0644\u0645\u0633\u0627\u0631" }
          },
          required: [
            "detectedOrigin",
            "detectedDestination",
            "transportMode",
            "lodgingType",
            "isDomestic",
            "approxPriceUSD",
            "localPriceDZD",
            "stayDurationDays",
            "accommodationDetails",
            "aiGuidanceText"
          ]
        }
      }
    });
    const text = response.text;
    if (!text) {
      throw new Error("No response returned from the search query parser");
    }
    const data = JSON.parse(text);
    return res.json(data);
  } catch (error) {
    logCleanErrorWarning("Smart search help", error);
    try {
      const fallbackResult = generateOfflineSmartSearchHelp(req.body.query || "", req.body.lang || "en");
      return res.json(fallbackResult);
    } catch (fallbackError) {
      console.error("Critical search help offline fallback failure:", fallbackError);
      return res.status(500).json({ error: "Failed to process smart search helper request" });
    }
  }
});
app.post("/api/smart-fos7a-help", async (req, res) => {
  try {
    const { query, lang } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }
    const ai = getAiClient();
    const isAr = lang === "ar";
    const systemInstruction = isAr ? `\u0623\u0646\u062A \u0645\u0633\u062A\u0634\u0627\u0631 \u0644\u0648\u062C\u0633\u062A\u064A\u0627\u062A \u0648\u0645\u062E\u0637\u0637 \u0631\u062D\u0644\u0627\u062A \u0630\u0643\u064A \u0645\u062A\u0645\u0631\u0633 \u0644\u062F\u0649 \u0648\u0643\u0627\u0644\u0629 \u0641\u0633\u062D\u0629 DZ.
      \u0645\u0647\u0645\u062A\u0643 \u0647\u064A \u062A\u062D\u0644\u064A\u0644 \u0646\u0635 \u0645\u0633\u0648\u062F\u0629 \u0627\u0644\u0633\u0641\u0631 \u0627\u0644\u062D\u0631\u0629 \u0644\u0644\u0645\u0633\u0627\u0641\u0631 \u0648\u0627\u0633\u062A\u062E\u0631\u0627\u062C \u0627\u0644\u063A\u0627\u064A\u0627\u062A \u0648\u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0637\u0627\u062A \u0628\u062F\u0642\u0629 \u0648\u062A\u0639\u0628\u0626\u0629 \u0627\u0644\u062D\u0642\u0648\u0644 \u0623\u0648\u062A\u0648\u0645\u0627\u062A\u064A\u0643\u064A\u0627\u064B.
      \u064A\u062C\u0628 \u0645\u0644\u0621 \u0645\u0639\u0637\u064A\u0627\u062A:
      1. \u0646\u0642\u0637\u0629 \u0627\u0644\u0627\u0646\u0637\u0644\u0627\u0642 (\u0645\u062B\u0644: Algiers, Constantine, Tlemcen, or an international airport).
      2. \u0648\u062C\u0647\u0629 \u0627\u0644\u0633\u0641\u0631 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629.
      3. \u0645\u062F\u0629 \u0627\u0644\u0631\u062D\u0644\u0629 \u0628\u0627\u0644\u0623\u064A\u0627\u0645 (\u0639\u062F\u062F \u0635\u062D\u064A\u062D \u0628\u064A\u0646 1 \u0648 30).
      4. \u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0645\u063A\u0627\u062F\u0631\u0629 \u0623\u0648 \u0627\u0644\u062A\u0648\u0642\u064A\u062A \u0627\u0644\u0645\u0633\u062A\u0646\u0628\u0637 \u0628\u0647\u064A\u0626\u0629 YYYY-MM-DD (\u0625\u0630\u0627 \u0644\u0645 \u064A\u0630\u0643\u0631 \u062A\u0627\u0631\u064A\u062E \u0628\u062F\u0642\u0629 \u0627\u0633\u062A\u0646\u0628\u0637 \u062A\u0627\u0631\u064A\u062E\u0627\u064B \u0645\u0646\u0627\u0633\u0628\u0627\u064B \u0623\u0648 \u0627\u0633\u062A\u0646\u062A\u062C \u062A\u0627\u0631\u064A\u062E\u0627\u064B \u0645\u062B\u0644 2026-06-20).
      5. \u062A\u0635\u0646\u064A\u0641 \u0627\u0644\u0645\u0633\u0627\u0641\u0631\u064A\u0646 (\u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u062D\u0635\u0631\u0627\u064B \u0623\u062D\u062F \u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0623\u0631\u0628\u0639\u0629: "Solo" \u0623\u0648 "Couple" \u0623\u0648 "Family" \u0623\u0648 "Friends").
      6. \u0648\u0635\u0641 \u0645\u0628\u0631\u0645\u062C \u0645\u0628\u0644\u0648\u0631 \u0648\u0644\u0627\u0626\u0642 \u0648\u0645\u0631\u0643\u0651\u0628 \u0644\u0644\u0637\u0628\u064A\u0639\u0629 \u0648\u0627\u0644\u063A\u0631\u0636 \u0648\u0627\u0644\u0645\u0633\u0627\u0641\u0631\u064A\u0646 \u0644\u064A\u0643\u062A\u0628 \u0641\u064A \u0645\u0633\u0648\u062F\u0629 \u0627\u0644\u0648\u0643\u0627\u0644\u0629.
      \u0623\u0631\u062C\u0639 \u0625\u062C\u0627\u0628\u062A\u0643 \u062D\u0635\u0631\u0627\u064B \u0628\u0635\u064A\u063A\u0629 JSON \u0645\u0637\u0627\u0628\u0642\u0629 \u062A\u0645\u0627\u0645\u0627\u064B \u0644\u0644\u0645\u062E\u0637\u0637 \u0627\u0644\u062A\u0627\u0644\u064A:` : `You are an expert travel assistant and smart concierge planner for Fos7a DZ travel agency.
      Analyze the traveler's raw description of their trip desires / constraints to extract structured travel variables beautifully.
      Provide values for:
      1. detectedOrigin (e.g., Algiers, Oran, Constantine, etc.)
      2. detectedDestination (country or Algerian city)
      3. detectedDurationDays (integer between 1 and 30)
      4. detectedDeparturePeriod (YYYY-MM-DD format, fallback to a sensible future date like 2026-06-20 if unspecified)
      5. detectedTravelersComposition (MUST be strictly one of: "Solo", "Couple", "Family", "Friends")
      6. formattedFos7aDescription (A beautiful structured and elegant text summary highlighting the nature of the travelers and trip characteristics)
      Return EXCLUSIVELY a JSON object adhering to this schema:`;
    const response = await generateContentWithFallback({
      contents: [{ role: "user", parts: [{ text: query }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          properties: {
            detectedOrigin: { type: import_genai.Type.STRING, description: "\u0627\u0633\u0645 \u0623\u0648 \u0648\u0644\u0627\u064A\u0629 \u0627\u0644\u0627\u0646\u0637\u0644\u0627\u0642 \u0627\u0644\u0645\u0633\u062A\u062E\u0631\u062C\u0629" },
            detectedDestination: { type: import_genai.Type.STRING, description: "\u0627\u0633\u0645 \u0648\u062C\u0647\u0629 \u0627\u0644\u0633\u0641\u0631 \u0623\u0648 \u0627\u0644\u0648\u0644\u0627\u064A\u0629 \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641\u0629" },
            detectedDurationDays: { type: import_genai.Type.NUMBER, description: "\u0639\u062F\u062F \u0623\u064A\u0627\u0645 \u0627\u0644\u0631\u062D\u0644\u0629 (\u0639\u062F\u062F \u0635\u062D\u064A\u062D \u0628\u064A\u0646 1-30)" },
            detectedDeparturePeriod: { type: import_genai.Type.STRING, description: "\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0645\u063A\u0627\u062F\u0631\u0629 \u0628\u0627\u0644\u0635\u064A\u063A\u0629 YYYY-MM-DD" },
            detectedTravelersComposition: { type: import_genai.Type.STRING, description: "\u062A\u0635\u0646\u064A\u0641 \u0648\u062A\u0631\u0643\u064A\u0628\u0629 \u0627\u0644\u0645\u0633\u0627\u0641\u0631\u064A\u0646: 'Solo' \u0623\u0648 'Couple' \u0623\u0648 'Family' \u0623\u0648 'Friends'" },
            formattedFos7aDescription: { type: import_genai.Type.STRING, description: "\u0648\u0635\u0641 \u0631\u062D\u0644\u0629 \u0645\u0646\u0633\u0642 \u0648\u0645\u0631\u0643\u0628 \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u064A\u0634\u0631\u062D \u0637\u0628\u064A\u0639\u0629 \u0627\u0644\u0631\u062D\u0644\u0629 \u0648\u0627\u0644\u0645\u0633\u0627\u0641\u0631\u064A\u0646 \u0644\u062E\u062F\u0645\u0629 \u0627\u0644\u0639\u0645\u0644\u0627\u0621" }
          },
          required: [
            "detectedOrigin",
            "detectedDestination",
            "detectedDurationDays",
            "detectedDeparturePeriod",
            "detectedTravelersComposition",
            "formattedFos7aDescription"
          ]
        }
      }
    });
    const text = response.text;
    if (!text) {
      throw new Error("No response returned from the smart concierge assistant");
    }
    const data = JSON.parse(text);
    return res.json(data);
  } catch (error) {
    logCleanErrorWarning("Smart fos7a concierge help", error);
    try {
      const fallbackResult = generateOfflineSmartFos7aHelp(req.body.query || "", req.body.lang || "en");
      return res.json(fallbackResult);
    } catch (fallbackError) {
      console.error("Critical concierge helper fallback failure:", fallbackError);
      return res.status(500).json({ error: "Failed to process smart concierge inquiry" });
    }
  }
});
function generateOfflineSmartFos7aHelp(query, lang) {
  const isAr = lang === "ar";
  const queryLower = query.toLowerCase();
  let detectedOrigin = isAr ? "\u0642\u0633\u0646\u0637\u064A\u0646\u0629" : "Constantine";
  let detectedDestination = isAr ? "\u062C\u064A\u062C\u0644" : "Jijel";
  let detectedDurationDays = 5;
  let detectedDeparturePeriod = "2026-06-25";
  let detectedTravelersComposition = "Family";
  let formattedFos7aDescription = isAr ? "\u0637\u0644\u0628 \u0631\u0639\u0627\u064A\u0629 \u0648\u062A\u0643\u0641\u0644 \u0634\u0627\u0645\u0644 \u0644\u0631\u062D\u0644\u0629 \u0639\u0627\u0626\u0644\u064A\u0629 \u0647\u0627\u062F\u0626\u0629" : "Bespoke full-agency packages for family comfort and tour guidance";
  if (queryLower.includes("algiers") || queryLower.includes("\u0627\u0644\u062C\u0632\u0627\u0626\u0631 \u0627\u0644\u0639\u0627\u0635\u0645\u0629") || queryLower.includes("\u0627\u0644\u0639\u0627\u0635\u0645\u0629")) {
    detectedOrigin = isAr ? "\u0627\u0644\u062C\u0632\u0627\u0626\u0631 \u0627\u0644\u0639\u0627\u0635\u0645\u0629 16" : "Algiers";
  } else if (queryLower.includes("oran") || queryLower.includes("\u0648\u0647\u0631\u0627\u0646")) {
    detectedOrigin = isAr ? "\u0648\u0647\u0631\u0627\u0646 31" : "Oran";
  } else if (queryLower.includes("tlemcen") || queryLower.includes("\u062A\u0644\u0645\u0633\u0627\u0646")) {
    detectedOrigin = isAr ? "\u062A\u0644\u0645\u0633\u0627\u0646 13" : "Tlemcen";
  } else if (queryLower.includes("constantine") || queryLower.includes("\u0642\u0633\u0646\u0637\u064A\u0646\u0629")) {
    detectedOrigin = isAr ? "\u0642\u0633\u0646\u0637\u064A\u0646\u0629 25" : "Constantine";
  }
  if (queryLower.includes("jijel") || queryLower.includes("\u062C\u064A\u062C\u0644")) {
    detectedDestination = isAr ? "\u062C\u064A\u062C\u0644" : "Jijel";
  } else if (queryLower.includes("tlemcen") || queryLower.includes("\u062A\u0644\u0645\u0633\u0627\u0646")) {
    detectedDestination = isAr ? "\u062A\u0644\u0645\u0633\u0627\u0646" : "Tlemcen";
  } else if (queryLower.includes("oran") || queryLower.includes("\u0648\u0647\u0631\u0627\u0646")) {
    detectedDestination = isAr ? "\u0648\u0647\u0631\u0627\u0646" : "Oran";
  }
  const daysMatch = queryLower.match(/(\d+)\s*(days|أيام|يوم|أيام|يومين)/);
  if (daysMatch) {
    const rawVal = parseInt(daysMatch[1]);
    if (rawVal > 0 && rawVal <= 30) {
      detectedDurationDays = rawVal;
    }
  }
  if (queryLower.includes("\u0632\u0648\u062C\u064A\u0646") || queryLower.includes("\u0634\u0647\u0631 \u0639\u0633\u0644") || queryLower.includes("couple") || queryLower.includes("husband")) {
    detectedTravelersComposition = "Couple";
    formattedFos7aDescription = isAr ? "\u0631\u062D\u0644\u0629 \u0633\u064A\u0627\u062D\u064A\u0629 \u0647\u0627\u062F\u0626\u0629 \u0644\u0634\u0647\u0631 \u0627\u0644\u0639\u0633\u0644 \u0644\u0644\u0632\u0648\u062C\u064A\u0646" : "Luxury peaceful honeymoon trip for a couple";
  } else if (queryLower.includes("\u0639\u0627\u0626\u0644") || queryLower.includes("\u0623\u0648\u0644\u0627\u062F") || queryLower.includes("family") || queryLower.includes("children")) {
    detectedTravelersComposition = "Family";
    formattedFos7aDescription = isAr ? "\u0628\u0631\u0646\u0627\u0645\u062C \u0633\u064A\u0627\u062D\u064A \u0639\u0627\u0626\u0644\u064A \u062A\u0631\u0641\u064A\u0647\u064A \u0645\u0645\u062A\u0639 \u0648\u0645\u0631\u064A\u062D" : "Leisurely and fully secured family vacation tour packages";
  } else if (queryLower.includes("\u0623\u0635\u062F\u0642\u0627\u0621") || queryLower.includes("\u0645\u062C\u0645\u0648\u0639\u0629") || queryLower.includes("friends") || queryLower.includes("group")) {
    detectedTravelersComposition = "Friends";
    formattedFos7aDescription = isAr ? "\u0631\u062D\u0644\u0629 \u0634\u0628\u0627\u0628\u064A\u0629 \u062D\u064A\u0648\u064A\u0629 \u0648\u0627\u0633\u062A\u0643\u0634\u0627\u0641\u064A\u0629 \u0631\u0641\u0642\u0629 \u0627\u0644\u0623\u0635\u062F\u0642\u0627\u0621" : "Active exploration adventure with friends and youth groups";
  } else if (queryLower.includes("\u0645\u0641\u0631\u062F") || queryLower.includes("\u0648\u062D\u062F\u064A") || queryLower.includes("solo") || queryLower.includes("myself")) {
    detectedTravelersComposition = "Solo";
    formattedFos7aDescription = isAr ? "\u0631\u062D\u0644\u0627\u062A \u0627\u0644\u0638\u0647\u0631\u0629 \u0648\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u062D\u0631 \u0639\u0644\u0649 \u062A\u0641\u0639\u064A\u0644 \u0641\u0631\u062F\u064A \u0645\u0631\u064A\u062D" : "Solo spiritual/educational self-discovery trip";
  }
  return {
    detectedOrigin,
    detectedDestination,
    detectedDurationDays,
    detectedDeparturePeriod,
    detectedTravelersComposition,
    formattedFos7aDescription
  };
}
function generateOfflineSmartSearchHelp(query, lang) {
  const isAr = lang === "ar";
  const queryLower = query.toLowerCase();
  let detectedOrigin = isAr ? "\u0627\u0644\u062C\u0632\u0627\u0626\u0631 \u0627\u0644\u0639\u0627\u0635\u0645\u0629" : "Algiers";
  let detectedDestination = isAr ? "\u0642\u0633\u0646\u0637\u064A\u0646\u0629" : "Constantine";
  let transportMode = isAr ? "\u0637\u0627\u0626\u0631\u0629" : "Plane";
  let lodgingType = "hotel";
  let isDomestic = true;
  let stayDurationDays = 3;
  if (queryLower.includes("oran") || queryLower.includes("\u0648\u0647\u0631\u0627\u0646")) {
    detectedOrigin = isAr ? "\u0648\u0647\u0631\u0627\u0646" : "Oran";
  } else if (queryLower.includes("constantine") || queryLower.includes("\u0642\u0633\u0646\u0637\u064A\u0646\u0629")) {
    detectedOrigin = isAr ? "\u0642\u0633\u0646\u0637\u064A\u0646\u0629" : "Constantine";
  } else if (queryLower.includes("tlemcen") || queryLower.includes("\u062A\u0644\u0645\u0633\u0627\u0646")) {
    detectedOrigin = isAr ? "\u062A\u0644\u0645\u0633\u0627\u0646" : "Tlemcen";
  } else if (queryLower.includes("ghardaia") || queryLower.includes("\u063A\u0631\u062F\u0627\u064A\u0629")) {
    detectedOrigin = isAr ? "\u063A\u0631\u062F\u0627\u064A\u0629" : "Ghardaia";
  } else if (queryLower.includes("annaba") || queryLower.includes("\u0639\u0646\u0627\u0628\u0629")) {
    detectedOrigin = isAr ? "\u0639\u0646\u0627\u0628\u0629" : "Annaba";
  } else if (queryLower.includes("s\xE9tif") || queryLower.includes("setif") || queryLower.includes("\u0633\u0637\u064A\u0641")) {
    detectedOrigin = isAr ? "\u0633\u0637\u064A\u0641" : "S\xE9tif";
  }
  if (queryLower.includes("oran") || queryLower.includes("\u0648\u0647\u0631\u0627\u0646")) {
    detectedDestination = isAr ? "\u0648\u0647\u0631\u0627\u0646" : "Oran";
  } else if (queryLower.includes("constantine") || queryLower.includes("\u0642\u0633\u0646\u0637\u064A\u0646\u0629")) {
    detectedDestination = isAr ? "\u0642\u0633\u0646\u0637\u064A\u0646\u0629" : "Constantine";
  } else if (queryLower.includes("tlemcen") || queryLower.includes("\u062A\u0644\u0645\u0633\u0627\u0646")) {
    detectedDestination = isAr ? "\u062A\u0644\u0645\u0633\u0627\u0646" : "Tlemcen";
  } else if (queryLower.includes("ghardaia") || queryLower.includes("\u063A\u0631\u062F\u0627\u064A\u0629")) {
    detectedDestination = isAr ? "\u063A\u0631\u062F\u0627\u064A\u0629" : "Ghardaia";
  } else if (queryLower.includes("annaba") || queryLower.includes("\u0639\u0646\u0627\u0628\u0629")) {
    detectedDestination = isAr ? "\u0639\u0646\u0627\u0628\u0629" : "Annaba";
  } else if (queryLower.includes("s\xE9tif") || queryLower.includes("setif") || queryLower.includes("\u0633\u0637\u064A\u0641")) {
    detectedDestination = isAr ? "\u0633\u0637\u064A\u0641" : "S\xE9tif";
  } else if (queryLower.includes("paris") || queryLower.includes("\u0628\u0627\u0631\u064A\u0633")) {
    detectedDestination = isAr ? "\u0628\u0627\u0631\u064A\u0633" : "Paris";
    isDomestic = false;
  } else if (queryLower.includes("istanbul") || queryLower.includes("\u0625\u0633\u0637\u0646\u0628\u0648\u0644") || queryLower.includes("\u0627\u0633\u0637\u0646\u0628\u0648\u0644")) {
    detectedDestination = isAr ? "\u0625\u0633\u0637\u0646\u0628\u0648\u0644" : "Istanbul";
    isDomestic = false;
  }
  if (queryLower.includes("\u0642\u0637\u0627\u0631") || queryLower.includes("train") || queryLower.includes("\u0633\u0643\u0629")) {
    transportMode = isAr ? "\u0642\u0637\u0627\u0631" : "Train";
  } else if (queryLower.includes("\u062D\u0627\u0641\u0644\u0629") || queryLower.includes("bus") || queryLower.includes("\u0646\u0642\u0644 \u0628\u0631\u064A")) {
    transportMode = isAr ? "\u062D\u0627\u0641\u0644\u0629" : "Bus";
  } else if (queryLower.includes("\u0633\u064A\u0627\u0631\u0629") || queryLower.includes("car") || queryLower.includes("\u0633\u0627\u0626\u0642")) {
    transportMode = isAr ? "\u0633\u064A\u0627\u0631\u0629" : "Car";
  } else if (queryLower.includes("\u0623\u062C\u0631\u0629") || queryLower.includes("taxi")) {
    transportMode = isAr ? "\u0633\u064A\u0627\u0631\u0629 \u0623\u062C\u0631\u0629" : "Taxi";
  } else if (queryLower.includes("\u0637\u0627\u0626\u0631\u0629") || queryLower.includes("plane") || queryLower.includes("\u0637\u064A\u0631\u0627\u0646")) {
    transportMode = isAr ? "\u0637\u0627\u0626\u0631\u0629" : "Plane";
  }
  if (queryLower.includes("\u0636\u064A\u0627\u0641\u0629") || queryLower.includes("guesthouse") || queryLower.includes("\u0628\u064A\u062A \u0636\u064A\u0627\u0641\u0629")) {
    lodgingType = "guesthouse";
  } else if (queryLower.includes("\u0634\u0628\u0627\u0628") || queryLower.includes("hostel") || queryLower.includes("\u0645\u0634\u062A\u0631\u0643")) {
    lodgingType = "hostel";
  } else if (queryLower.includes("\u0645\u0646\u0632\u0644") || queryLower.includes("home") || queryLower.includes("\u0634\u0642\u0629") || queryLower.includes("apartment")) {
    lodgingType = "home";
  } else {
    lodgingType = "hotel";
  }
  const dayMatch = query.match(/(\d+)\s*(أيام|يوم|day|days)/);
  if (dayMatch) {
    stayDurationDays = parseInt(dayMatch[1]);
  }
  let approxPriceUSD = 180;
  let localPriceDZD = 36050;
  if (isDomestic) {
    let transportCostDZD = 2500;
    if (transportMode === (isAr ? "\u0637\u0627\u0626\u0631\u0629" : "Plane")) {
      transportCostDZD = 12e3;
    } else if (transportMode === (isAr ? "\u0633\u064A\u0627\u0631\u0629 \u0623\u062C\u0631\u0629" : "Taxi") || transportMode === (isAr ? "\u0633\u064A\u0627\u0631\u0629" : "Car")) {
      transportCostDZD = 8e3;
    }
    let dailyLodgingCostDZD = 5e3;
    if (lodgingType === "hotel") {
      dailyLodgingCostDZD = 11e3;
    } else if (lodgingType === "guesthouse") {
      dailyLodgingCostDZD = 7500;
    }
    localPriceDZD = transportCostDZD + dailyLodgingCostDZD * stayDurationDays;
    approxPriceUSD = Math.round(localPriceDZD / 140);
  } else {
    let transportCostUSD = 450;
    let dailyLodgingCostUSD = 120;
    approxPriceUSD = transportCostUSD + dailyLodgingCostUSD * stayDurationDays;
    localPriceDZD = approxPriceUSD * 140;
  }
  const accommodationDetails = isAr ? `\u0627\u0644\u0625\u0642\u0627\u0645\u0629 \u0627\u0644\u0645\u0642\u062A\u0631\u062D\u0629 \u0644\u0631\u062D\u0644\u062A\u0643 \u0647\u064A ${lodgingType === "hotel" ? "\u0641\u0646\u062F\u0642 \u0645\u0635\u0646\u0641" : lodgingType === "guesthouse" ? "\u062F\u0627\u0631 \u0636\u064A\u0627\u0641\u0629 \u062A\u0642\u0644\u064A\u062F\u064A\u0629 \u062F\u0627\u0641\u0626\u0629" : lodgingType === "hostel" ? "\u0628\u064A\u062A \u0634\u0628\u0627\u0628 \u0645\u0634\u062A\u0631\u0643 \u0627\u0642\u062A\u0635\u0627\u062F\u064A" : "\u0645\u0646\u0632\u0644 \u0623\u0648 \u0634\u0642\u0629 \u0633\u0643\u0646\u064A\u0629 \u0645\u0633\u062A\u0642\u0644\u0629 \u0645\u0631\u064A\u062D\u0629"}. \u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u062A\u0642\u062F\u064A\u0631\u064A \u0644\u064A\u0644\u0629 \u0648\u0627\u062D\u062F\u0629 \u0647\u0648 \u062D\u0648\u0627\u0644\u064A ${isDomestic ? `${Math.round(localPriceDZD / stayDurationDays).toLocaleString()} \u062F\u062C \u062F\u064A\u0646\u0627\u0631 \u062C\u0632\u0627\u0626\u0631\u064A \u0645\u062D\u0644\u064A` : `$${Math.round(approxPriceUSD / stayDurationDays)}`}. \u062A\u0639\u062A\u0628\u0631 \u062E\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0625\u0642\u0627\u0645\u0629 \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u0629 \u0643\u062F\u0648\u0631 \u0627\u0644\u0636\u064A\u0627\u0641\u0629 \u0627\u0644\u062C\u0632\u0627\u0626\u0631\u064A\u0629 \u0627\u0644\u0639\u0631\u064A\u0642\u0629 \u062E\u064A\u0627\u0631\u0627\u064B \u062F\u0627\u0641\u0626\u0627\u064B \u0648\u0627\u0642\u062A\u0635\u0627\u062F\u064A\u0627\u064B \u0644\u0644\u0641\u0646\u0627\u062F\u0642 \u0627\u0644\u0643\u0628\u0631\u0649 \u0641\u064A \u0627\u0644\u0645\u0646\u0627\u0637\u0642 \u0627\u0644\u0633\u064A\u0627\u062D\u064A\u0629 \u0627\u0644\u0627\u0633\u062A\u0643\u0634\u0627\u0641\u064A\u0629.` : `The suggested lodging type is a ${lodgingType === "hotel" ? "classified hotel" : lodgingType === "guesthouse" ? "traditional cozy guesthouse" : lodgingType === "hostel" ? "budget youth hostel" : "comfortable independent home/apartment"}. Estimated nightly rate is around ${isDomestic ? `${Math.round(localPriceDZD / stayDurationDays).toLocaleString()} DZD (local currency)` : `$${Math.round(approxPriceUSD / stayDurationDays)}`}. Choosing traditional Algerian guesthouses provides a spectacular local touch with reasonable pricing.`;
  const aiGuidanceText = isAr ? `\u062A\u0648\u062C\u064A\u0647\u0627\u062A \u0627\u0644\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0630\u0643\u064A: \u0644\u0642\u062F \u0627\u062E\u062A\u0631\u062A \u0627\u0644\u0633\u0641\u0631 \u0645\u0646 ${detectedOrigin} \u0625\u0644\u0649 ${detectedDestination} \u0639\u0628\u0631 \u0627\u0644${transportMode}. \u0646\u0648\u0635\u064A\u0643 \u0628\u0645\u062A\u0627\u0628\u0639\u0629 \u0639\u0631\u0648\u0636 \u0627\u0644\u062A\u0646\u0642\u0644 \u0627\u0644\u0627\u0642\u062A\u0635\u0627\u062F\u064A \u0648\u0642\u0646\u0648\u0627\u062A \u0627\u0644\u062D\u0627\u0641\u0644\u0627\u062A \u0648\u0627\u0644\u0642\u0637\u0627\u0631\u0627\u062A \u0644\u0644\u062E\u0637\u0648\u0637 \u0627\u0644\u063A\u0631\u0628\u064A\u0629 \u0648\u0627\u0644\u0634\u0631\u0642\u064A\u0629 \u0627\u0644\u062A\u064A \u062A\u062E\u062F\u0645 \u0627\u0644\u0648\u0644\u0627\u064A\u0627\u062A \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u0629 \u0628\u0623\u0633\u0639\u0627\u0631 \u0645\u0646\u062E\u0641\u0636\u0629 \u062C\u062F\u0627\u064B \u0644\u062A\u0642\u0646\u064A\u0646 \u0627\u0644\u0645\u064A\u0632\u0627\u0646\u064A\u0629 \u0627\u0644\u0628\u064A\u0646-\u0648\u0644\u0627\u0626\u064A\u0629. \u0644\u0644\u062A\u0646\u0642\u0644\u060C \u062E\u0637\u0648\u0637 \u0627\u0644\u0646\u0642\u0644 \u0627\u0644\u0645\u062D\u0644\u064A\u0629 \u0648\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0645\u062B\u0644 \u064A\u0633\u064A\u0631 \u062A\u0648\u0641\u0631 \u0623\u0631\u062E\u0635 \u0627\u0644\u0628\u062F\u0627\u0626\u0644 \u0627\u0644\u062D\u0636\u0631\u064A\u0629 \u0645\u0648\u0627\u0632\u0627\u0629 \u0645\u0639 \u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0625\u0642\u0627\u0645\u0627\u062A \u0627\u0644\u0645\u0642\u062A\u0631\u062D\u0629.` : `Smart Assistant guidance: You targeted traveling from ${detectedOrigin} to ${detectedDestination} via ${transportMode}. We strongly suggest comparing rail tickets and public bus services for Algerian western and eastern provinces, as they offer unbeatable rates. Local transport mobile apps like Yassir provide cheap alternative coordinates.`;
  return {
    detectedOrigin,
    detectedDestination,
    transportMode,
    lodgingType,
    isDomestic,
    approxPriceUSD,
    localPriceDZD,
    stayDurationDays,
    accommodationDetails,
    aiGuidanceText,
    isOfflineFallback: true
  };
}
app.post("/api/translate-itinerary", async (req, res) => {
  try {
    const { itinerary, targetLang } = req.body;
    if (!itinerary) {
      return res.status(400).json({ error: "itinerary data is required for translation" });
    }
    const ai = getAiClient();
    const toAr = targetLang === "ar";
    const promptText = toAr ? `Translate the following travel itinerary structure from English into elegant, professional, fully fluent Arabic (Fusha / \u0644\u063A\u0629 \u0639\u0631\u0628\u064A\u0629 \u0641\u0635\u062D\u0649). 
    Translate all descriptive text fields while keeping keys, status numbers, pricing numbers, star ratings exactly the same. 
    Specifically, make sure to translate all these fields into proper standard Arabic text:
    - destinationName
    - country
    - targetBudgetLevel (e.g., "Economy" -> "\u0627\u0642\u062A\u0635\u0627\u062F\u064A\u0629", "Moderate" -> "\u0645\u062A\u0648\u0633\u0637\u0629", "Luxury" -> "\u0641\u0627\u062E\u0631\u0629")
    - travelerType (e.g., "Solo" -> "\u0641\u0631\u062F\u064A", "Family" -> "\u0639\u0627\u0626\u0644\u064A", "Couple" -> "\u0632\u0648\u062C\u064A\u0646", "Friends" -> "\u0623\u0635\u062F\u0642\u0627\u0621")
    - tripPurpose (e.g., "tourism" -> "\u0633\u064A\u0627\u062D\u0629", "medical" -> "\u0639\u0644\u0627\u062C \u0648\u0627\u0633\u062A\u0634\u0641\u0627\u0621", "business_admin" -> "\u0645\u0647\u0645\u0629 \u0639\u0645\u0644 \u0648\u0625\u062B\u0628\u0627\u062A \u0625\u062F\u0627\u0631\u064A")
    - climateAdvisoryAlert
    - localTravelTips (array of strings)
    - customPackingList: translate "category" and "items" (array of strings)
    - suggestedHotels: translate "reasonForRecommendation", "address"
    - days: for each day, translate "theme" and for each activity, translate "title", "description", "locationName", "timeOfDay" (ensure "timeOfDay" translated to proper Arabic: "\u0635\u0628\u0627\u062D\u0627\u064B", "\u0628\u0639\u062F \u0627\u0644\u0638\u0647\u0631", "\u0645\u0633\u0627\u0621\u064B")
    - localEventsAndExpos: translate "name", "advisabilityNote"
    - estimatedTransitSchedules: translate "transportMethod", "departureDayTime", "stationName", "frequencyAndPrice"
    - administrativeMissionDetails: translate "missionOverview", and for each destination in "destinationsList", translate "name", "transitAdvice", "documentsRequired" (array), "address"
    - nearbyPlacesAndUtilities: translate names and descriptions inside restaurantsAndCafes, mosquesAndRestrooms, medicalServices, alternative lodgings
    
    Here is the itinerary input to translate to Arabic:
    ${JSON.stringify(itinerary)}` : `Translate the following travel itinerary structure from Arabic into natural, professional, fully fluent English. 
    Translate all descriptive text fields while keeping keys, status numbers, pricing numbers, star ratings exactly the same. 
    Specifically, make sure to translate these fields into proper standard English text:
    - destinationName
    - country
    - targetBudgetLevel (e.g., "\u0627\u0642\u062A\u0635\u0627\u062F\u064A\u0629" -> "Economy", "\u0645\u062A\u0648\u0633\u0637\u0629" -> "Moderate", "\u0641\u0627\u062E\u0631\u0629" -> "Luxury")
    - travelerType (e.g., "\u0641\u0631\u062F\u064A" -> "Solo", "\u0639\u0627\u0626\u0644\u064A" -> "Family", "\u0632\u0648\u062C\u064A\u0646" -> "Couple", "\u0623\u0635\u062F\u0642\u0627\u0621" -> "Friends")
    - tripPurpose (e.g., "\u0633\u064A\u0627\u062D\u0629" -> "tourism", "\u0639\u0644\u0627\u062C \u0648\u0627\u0633\u062A\u0634\u0641\u0627\u0621" -> "medical_treatment")
    - climateAdvisoryAlert
    - localTravelTips (array of strings)
    - customPackingList: translate "category" and "items" (array of strings)
    - suggestedHotels: translate "reasonForRecommendation", "address"
    - days: for each day, translate "theme" and for each activity, translate "title", "description", "locationName", "timeOfDay" (ensure "timeOfDay" is one of "Morning", "Afternoon", "Evening")
    - localEventsAndExpos: translate "name", "advisabilityNote"
    - estimatedTransitSchedules: translate "transportMethod", "departureDayTime", "stationName", "frequencyAndPrice"
    - administrativeMissionDetails: translate "missionOverview", and for each destination in "destinationsList", translate "name", "transitAdvice", "documentsRequired" (array), "address"
    - nearbyPlacesAndUtilities: translate names and descriptions inside restaurantsAndCafes, mosquesAndRestrooms, medicalServices, alternative lodgings
    
    Here is the itinerary input to translate to English:
    ${JSON.stringify(itinerary)}`;
    const response = await generateContentWithFallback({
      contents: [{ role: "user", parts: [{ text: promptText }] }],
      config: {
        systemInstruction: toAr ? "You are a highly efficient JSON translator. Your only job is to return the exact same JSON structure with all the English text fields translated into elegant, professional, standard Arabic (Fusha). Never wrap the JSON in markdown code blocks and never include additional introductory or explanatory voice paragraphs." : "You are a highly efficient JSON translator. Your only job is to return the exact same JSON structure with all the Arabic text fields translated into natural, professional, and elegant English. Never wrap the JSON in markdown code blocks and never include additional introductory or explanatory voice paragraphs.",
        responseMimeType: "application/json"
      }
    });
    const text = response.text;
    if (!text) {
      throw new Error("Translation service returned empty string");
    }
    const translatedItinerary = JSON.parse(text);
    return res.json(translatedItinerary);
  } catch (error) {
    logCleanErrorWarning("Itinerary translation", error);
    try {
      const fallbackResult = translateItineraryOffline(req.body.itinerary, req.body.targetLang);
      return res.json(fallbackResult);
    } catch (fallbackError) {
      console.error("Critical fallback translation error:", fallbackError);
      return res.json(req.body.itinerary);
    }
  }
});
function translateItineraryOffline(itinerary, targetLang) {
  const isToAr = targetLang === "ar";
  const res = JSON.parse(JSON.stringify(itinerary));
  res.languageCode = targetLang;
  res.isOfflineFallback = true;
  const dict = {
    // English to Arabic / Arabic to English Dictionary
    "Algiers": "\u0627\u0644\u062C\u0632\u0627\u0626\u0631 \u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    "\u0627\u0644\u062C\u0632\u0627\u0626\u0631 \u0627\u0644\u0639\u0627\u0635\u0645\u0629": "Algiers",
    "Oran": "\u0648\u0647\u0631\u0627\u0646 \u0627\u0644\u0628\u0627\u0647\u064A\u0629",
    "\u0648\u0647\u0631\u0627\u0646 \u0627\u0644\u0628\u0627\u0647\u064A\u0629": "Oran",
    "Constantine": "\u0642\u0633\u0646\u0637\u064A\u0646\u0629 \u0627\u0644\u062C\u0633\u0648\u0631 \u0627\u0644\u0645\u0639\u0644\u0642\u0629",
    "\u0642\u0633\u0646\u0637\u064A\u0646\u0629 \u0627\u0644\u062C\u0633\u0648\u0631 \u0627\u0644\u0645\u0639\u0644\u0642\u0629": "Constantine",
    "Tlemcen": "\u062A\u0644\u0645\u0633\u0627\u0646 \u0644\u0644\u062B\u0642\u0627\u0641\u0629 \u0648\u0627\u0644\u0641\u0646",
    "\u062A\u0644\u0645\u0633\u0627\u0646 \u0644\u0644\u062B\u0642\u0627\u0641\u0629 \u0648\u0627\u0644\u0641\u0646": "Tlemcen",
    "Ghardaia": "\u063A\u0631\u062F\u0627\u064A\u0629 \u0648\u0627\u062F\u064A \u0645\u064A\u0632\u0627\u0628",
    "\u063A\u0631\u062F\u0627\u064A\u0629 \u0648\u0627\u062F\u064A \u0645\u064A\u0632\u0627\u0628": "Ghardaia",
    "Bejaia": "\u0628\u062C\u0627\u064A\u0629 \u0627\u0644\u0633\u0627\u062D\u0644\u064A\u0629",
    "\u0628\u062C\u0627\u064A\u0629 \u0627\u0644\u0633\u0627\u062D\u0644\u064A\u0629": "Bejaia",
    "Annaba": "\u0639\u0646\u0627\u0628\u0629 \u062C\u0648\u0647\u0631\u0629 \u0627\u0644\u0634\u0631\u0642",
    "\u0639\u0646\u0627\u0628\u0629 \u062C\u0648\u0647\u0631\u0629 \u0627\u0644\u0634\u0631\u0642": "Annaba",
    "Biskra": "\u0628\u0633\u0643\u0631\u0629 \u0639\u0631\u0648\u0633 \u0627\u0644\u0632\u064A\u0628\u0627\u0646",
    "\u0628\u0633\u0643\u0631\u0629 \u0639\u0631\u0648\u0633 \u0627\u0644\u0632\u064A\u0628\u0627\u0646": "Biskra",
    "Djanet": "\u062C\u0627\u0646\u062A \u0644\u0624\u0644\u0624\u0629 \u0627\u0644\u062A\u0627\u0633\u064A\u0644\u064A",
    "\u062C\u0627\u0646\u062A \u0644\u0624\u0644\u0624\u0629 \u0627\u0644\u062A\u0627\u0633\u064A\u0644\u064A": "Djanet",
    "Algeria": "\u0627\u0644\u062C\u0632\u0627\u0626\u0631",
    "\u0627\u0644\u062C\u0632\u0627\u0626\u0631": "Algeria",
    // Budget
    "Economy": "\u0627\u0642\u062A\u0635\u0627\u062F\u064A\u0629 \u0645\u0631\u064A\u062D\u0629",
    "\u0627\u0642\u062A\u0635\u0627\u062F\u064A\u0629 \u0645\u0631\u064A\u062D\u0629": "Economy",
    "Moderate": "\u0645\u062A\u0648\u0633\u0637\u0629 \u0645\u062A\u0632\u0646\u0629",
    "\u0645\u062A\u0648\u0633\u0637\u0629 \u0645\u062A\u0632\u0646\u0629": "Moderate",
    "Luxury": "\u0641\u0627\u062E\u0631\u0629 \u0648\u0645\u0645\u062A\u0627\u0632\u0629",
    "\u0641\u0627\u062E\u0631\u0629 \u0648\u0645\u0645\u062A\u0627\u0632\u0629": "Luxury",
    // Traveler profiles
    "Solo": "\u0641\u0631\u062F\u064A \u0645\u0633\u062A\u0642\u0644",
    "\u0641\u0631\u062F\u064A \u0645\u0633\u062A\u0642\u0644": "Solo",
    "Family": "\u0639\u0627\u0626\u0644\u064A \u062C\u0645\u0627\u0639\u064A",
    "\u0639\u0627\u0626\u0644\u064A \u062C\u0645\u0627\u0639\u064A": "Family",
    "Couple": "\u0632\u0648\u062C\u064A\u0646 \u0648\u0631\u0648\u0645\u0627\u0646\u0633\u064A",
    "\u0632\u0648\u062C\u064A\u0646 \u0648\u0631\u0648\u0645\u0627\u0646\u0633\u064A": "Couple",
    "Friends": "\u0623\u0635\u062F\u0642\u0627\u0621 \u0648\u0645\u062C\u0645\u0648\u0639\u0627\u062A",
    "\u0623\u0635\u062F\u0642\u0627\u0621 \u0648\u0645\u062C\u0645\u0648\u0639\u0627\u062A": "Friends",
    // Standard Category names
    "clothing": "\u0627\u0644\u0645\u0644\u0627\u0628\u0633 \u0648\u0627\u0644\u0645\u0644\u0628\u0648\u0633\u0627\u062A \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629",
    "documents": "\u0627\u0644\u0648\u062B\u0627\u0626\u0642 \u0648\u0627\u0644\u0623\u0648\u0631\u0627\u0642 \u0648\u0627\u0644\u0628\u0637\u0627\u0642\u0627\u062A",
    "electronics": "\u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0629 \u0648\u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627\u062A",
    "toiletries": "\u0627\u0644\u0646\u0638\u0627\u0641\u0629 \u0627\u0644\u0634\u062E\u0635\u064A\u0629 \u0648\u0627\u0644\u0639\u0646\u0627\u064A\u0629 \u0628\u0627\u0644\u0628\u0634\u0631\u0629",
    "medical": "\u0627\u0644\u0623\u062F\u0648\u064A\u0629 \u0648\u0627\u0644\u0645\u0633\u062A\u0644\u0632\u0645\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0627\u0644\u0648\u0642\u0627\u0626\u064A\u0629",
    "others": "\u0623\u063A\u0631\u0627\u0636 \u0623\u062E\u0631\u0649 \u0645\u0646\u0648\u0639\u0629 \u0645\u0641\u064A\u062F\u0629",
    "Clothing": "\u0627\u0644\u0645\u0644\u0627\u0628\u0633 \u0648\u0627\u0644\u0645\u0644\u0628\u0648\u0633\u0627\u062A \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629",
    "Documents": "\u0627\u0644\u0648\u062B\u0627\u0626\u0642 \u0648\u0627\u0644\u0623\u0648\u0631\u0627\u0642 \u0648\u0627\u0644\u0628\u0637\u0627\u0642\u0627\u062A",
    "Electronics": "\u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0629 \u0648\u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627\u062A",
    "Toiletries": "\u0627\u0644\u0646\u0638\u0627\u0641\u0629 \u0627\u0644\u0634\u062E\u0635\u064A\u0629 \u0648\u0627\u0644\u0639\u0646\u0627\u064A\u0629 \u0628\u0627\u0644\u0628\u0634\u0631\u0629",
    "Medical": "\u0627\u0644\u0623\u062F\u0648\u064A\u0629 \u0648\u0627\u0644\u0645\u0633\u062A\u0644\u0632\u0645\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0627\u0644\u0648\u0642\u0627\u0626\u064A\u0629",
    "Others": "\u0623\u063A\u0631\u0627\u0636 \u0623\u062E\u0631\u0649 \u0645\u0646\u0648\u0639\u0629 \u0645\u0641\u064A\u062F\u0629",
    // Transit modes
    "Standard Plane / Flight": "\u0631\u062D\u0644\u0629 \u0637\u064A\u0631\u0627\u0646 \u0642\u064A\u0627\u0633\u064A\u0629",
    "\u0631\u062D\u0644\u0629 \u0637\u064A\u0631\u0627\u0646 \u0642\u064A\u0627\u0633\u064A\u0629": "Standard Plane / Flight",
    "Car Rental": "\u0643\u0631\u0627\u0621 \u0633\u064A\u0627\u0631\u0629 \u062E\u0627\u0635\u0629",
    "\u0643\u0631\u0627\u0621 \u0633\u064A\u0627\u0631\u0629 \u062E\u0627\u0635\u0629": "Car Rental",
    "Public Bus": "\u0646\u0642\u0644 \u0628\u0627\u0644\u062D\u0627\u0641\u0644\u0629 \u0627\u0644\u0639\u0645\u0648\u0645\u064A\u0629",
    "\u0646\u0642\u0644 \u0628\u0627\u0644\u062D\u0627\u0641\u0644\u0629 \u0627\u0644\u0639\u0645\u0648\u0645\u064A\u0629": "Public Bus",
    "Train": "\u0627\u0644\u0646\u0642\u0644 \u0639\u0628\u0631 \u0642\u0637\u0627\u0631 \u0627\u0644\u0633\u0643\u0629 \u0627\u0644\u062D\u062F\u064A\u062F\u064A\u0629",
    "\u0627\u0644\u0646\u0642\u0644 \u0639\u0628\u0631 \u0642\u0637\u0627\u0631 \u0627\u0644\u0633\u0643\u0629 \u0627\u0644\u062D\u062F\u064A\u062F\u064A\u0629": "Train",
    "Taxi": "\u0633\u064A\u0627\u0631\u0629 \u0623\u062C\u0631\u0629 \u062E\u0627\u0635\u0629",
    "\u0633\u064A\u0627\u0631\u0629 \u0623\u062C\u0631\u0629 \u062E\u0627\u0635\u0629": "Taxi",
    // Trip Purpose
    "tourism": "\u0633\u064A\u0627\u062D\u0629 \u062A\u0631\u0641\u064A\u0647\u064A\u0629 \u0648\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u062B\u0642\u0627\u0641\u064A",
    "\u0633\u064A\u0627\u062D\u0629 \u062A\u0631\u0641\u064A\u0647\u064A\u0629 \u0648\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u062B\u0642\u0627\u0641\u064A": "tourism",
    "medical_treatment": "\u0639\u0644\u0627\u062C \u0637\u0628\u064A \u0648\u0627\u0633\u062A\u0634\u0641\u0627\u0621 \u0648\u0639\u064A\u0627\u062F\u0629",
    "\u0639\u0644\u0627\u062C \u0637\u0628\u064A \u0648\u0627\u0633\u062A\u0634\u0641\u0627\u0621 \u0648\u0639\u064A\u0627\u062F\u0629": "medical_treatment",
    "business_admin": "\u0645\u0647\u0645\u0629 \u0639\u0645\u0644 \u0648\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0625\u062F\u0627\u0631\u064A\u0629 \u0631\u0633\u0645\u064A\u0629",
    "\u0645\u0647\u0645\u0629 \u0639\u0645\u0644 \u0648\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0625\u062F\u0627\u0631\u064A\u0629 \u0631\u0633\u0645\u064A\u0629": "business_admin",
    // Time of day
    "Morning": "\u0635\u0628\u0627\u062D\u0627\u064B",
    "\u0635\u0628\u0627\u062D\u0627\u064B": "Morning",
    "Afternoon": "\u0628\u0639\u062F \u0627\u0644\u0638\u0647\u0631",
    "\u0628\u0639\u062F \u0627\u0644\u0638\u0647\u0631": "Afternoon",
    "Evening": "\u0645\u0633\u0627\u0621\u064B",
    "\u0645\u0633\u0627\u0621\u064B": "Evening",
    // Insurance Type
    "basic": "\u0627\u0644\u0628\u0627\u0642\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0627\u0644\u0627\u0642\u062A\u0635\u0627\u062F\u064A\u0629",
    "\u0627\u0644\u0628\u0627\u0642\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0627\u0644\u0627\u0642\u062A\u0635\u0627\u062F\u064A\u0629": "basic",
    "premium": "\u0627\u0644\u0628\u0627\u0642\u0629 \u0627\u0644\u0641\u0636\u064A\u0629 \u0627\u0644\u0645\u0639\u0632\u0632\u0629",
    "\u0627\u0644\u0628\u0627\u0642\u0629 \u0627\u0644\u0641\u0636\u064A\u0629 \u0627\u0644\u0645\u0639\u0632\u0632\u0629": "premium",
    "comprehensive": "\u0627\u0644\u0628\u0627\u0642\u0629 \u0627\u0644\u0630\u0647\u0628\u064A\u0629 \u0627\u0644\u0645\u0645\u062A\u0627\u0632\u0629 \u0627\u0644\u0634\u0627\u0645\u0644\u0629",
    "\u0627\u0644\u0628\u0627\u0642\u0629 \u0627\u0644\u0630\u0647\u0628\u064A\u0629 \u0627\u0644\u0645\u0645\u062A\u0627\u0632\u0629 \u0627\u0644\u0634\u0627\u0645\u0644\u0629": "comprehensive",
    // Insurance Zone
    "local": "\u062F\u0627\u062E\u0644 \u0627\u0644\u062A\u0631\u0627\u0628 \u0627\u0644\u0648\u0637\u0646\u064A (\u0645\u062D\u0644\u064A \u0628\u0627\u0644\u062C\u0632\u0627\u0626\u0631)",
    "\u062F\u0627\u062E\u0644 \u0627\u0644\u062A\u0631\u0627\u0628 \u0627\u0644\u0648\u0637\u0646\u064A (\u0645\u062D\u0644\u064A \u0628\u0627\u0644\u062C\u0632\u0627\u0626\u0631)": "local",
    "mena": "\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0634\u0631\u0642 \u0627\u0644\u0623\u0648\u0633\u0637 \u0648\u0634\u0645\u0627\u0644 \u0623\u0641\u0631\u064A\u0642\u064A\u0627 (MENA)",
    "\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0634\u0631\u0642 \u0627\u0644\u0623\u0648\u0633\u0637 \u0648\u0634\u0645\u0627\u0644 \u0623\u0641\u0631\u064A\u0642\u064A\u0627 (MENA)": "mena",
    "europe": "\u0627\u0644\u0627\u062A\u062D\u0627\u062F \u0627\u0644\u0623\u0648\u0631\u0648\u0628\u064A (\u0634\u0646\u063A\u0646)",
    "\u0627\u0644\u0627\u062A\u062D\u0627\u062F \u0627\u0644\u0623\u0648\u0631\u0648\u0628\u064A (\u0634\u0646\u063A\u0646)": "europe",
    "worldwide": "\u062C\u0645\u064A\u0639 \u0623\u0646\u062D\u0627\u0621 \u0627\u0644\u0639\u0627\u0644\u0645 \u0627\u0644\u0645\u063A\u0637\u0627\u0629 \u0634\u0627\u0645\u0644\u0629",
    "\u062C\u0645\u064A\u0639 \u0623\u0646\u062D\u0627\u0621 \u0627\u0644\u0639\u0627\u0644\u0645 \u0627\u0644\u0645\u063A\u0637\u0627\u0629 \u0634\u0627\u0645\u0644\u0629": "worldwide",
    // Age group
    "youth": "\u0634\u0628\u0627\u0628 \u062F\u0648\u0646 \u0633\u0646 25 \u0633\u0646\u0629",
    "\u0634\u0628\u0627\u0628 \u062F\u0648\u0646 \u0633\u0646 25 \u0633\u0646\u0629": "youth",
    "adult": "\u0628\u0627\u0644\u063A \u0645\u0646 25 \u0625\u0644\u0649 59 \u0633\u0646\u0629",
    "\u0628\u0627\u0644\u063A \u0645\u0646 25 \u0625\u0644\u0649 59 \u0633\u0646\u0629": "adult",
    "senior": "\u0643\u0628\u0627\u0631 \u0627\u0644\u0633\u0646 \u0641\u0648\u0642 60 \u0633\u0646\u0629",
    "\u0643\u0628\u0627\u0631 \u0627\u0644\u0633\u0646 \u0641\u0648\u0642 60 \u0633\u0646\u0629": "senior"
  };
  const translateVal = (val) => {
    if (!val) return val;
    const trimmed = val.trim();
    if (dict[trimmed]) return dict[trimmed];
    let out = trimmed;
    if (isToAr) {
      out = out.replace(/\bDay\s*(\d+)\b/gi, "\u0627\u0644\u064A\u0648\u0645 $1").replace(/\bDays\b/gi, "\u0623\u064A\u0627\u0645").replace(/\bTourism\b/gi, "\u0633\u064A\u0627\u062D\u0629").replace(/\bMedical\b/gi, "\u0637\u0628\u064A").replace(/\bBusiness\b/gi, "\u0623\u0639\u0645\u0627\u0644").replace(/\bFlexible\b/gi, "\u0645\u0631\u0646").replace(/\bFlight\b/gi, "\u0631\u062D\u0644\u0629 \u0637\u064A\u0631\u0627\u0646").replace(/\bHotel\b/gi, "\u0641\u0646\u062F\u0642").replace(/\bDirect\b/gi, "\u0645\u0628\u0627\u0634\u0631").replace(/\bStops\b/gi, "\u062A\u0648\u0642\u0641\u0627\u062A");
    } else {
      out = out.replace(/اليوم\s*(\d+)/gi, "Day $1").replace(/أيام/gi, "Days").replace(/سياحة/gi, "Tourism").replace(/طبي/gi, "Medical").replace(/أعمال/gi, "Business").replace(/مرن/gi, "Flexible").replace(/رحلة طيران/gi, "Flight").replace(/فندق/gi, "Hotel").replace(/مباشر/gi, "Direct").replace(/توقفات/gi, "Stops");
    }
    return out;
  };
  if (res.destinationName) res.destinationName = translateVal(res.destinationName);
  if (res.country) res.country = translateVal(res.country);
  if (res.targetBudgetLevel) res.targetBudgetLevel = translateVal(res.targetBudgetLevel);
  if (res.travelerType) res.travelerType = translateVal(res.travelerType);
  if (res.tripPurpose) res.tripPurpose = translateVal(res.tripPurpose);
  if (res.transitMode) res.transitMode = translateVal(res.transitMode);
  if (res.lodgingType) res.lodgingType = translateVal(res.lodgingType);
  if (res.departureDate) res.departureDate = translateVal(res.departureDate);
  if (res.climateAdvisoryAlert) {
    if (isToAr) {
      res.climateAdvisoryAlert = `[\u062A\u0646\u0628\u064A\u0647 \u062C\u0648\u064A] ${res.climateAdvisoryAlert}`;
    } else {
      res.climateAdvisoryAlert = `[Climate Advisory] ${res.climateAdvisoryAlert}`;
    }
  }
  if (Array.isArray(res.localTravelTips)) {
    res.localTravelTips = res.localTravelTips.map((tip) => {
      if (isToAr) {
        return `[\u0625\u0631\u0634\u0627\u062F \u0645\u062D\u0644\u064A] ${tip}`;
      } else {
        return `[Local Tip] ${tip}`;
      }
    });
  }
  if (Array.isArray(res.customPackingList)) {
    res.customPackingList.forEach((cat) => {
      cat.category = translateVal(cat.category);
      if (Array.isArray(cat.items)) {
        cat.items = cat.items.map((item) => {
          if (isToAr) {
            return `\u062A\u062C\u0647\u064A\u0632: ${item}`;
          } else {
            return `Pack: ${item}`;
          }
        });
      }
    });
  }
  if (Array.isArray(res.suggestedHotels)) {
    res.suggestedHotels.forEach((hotel) => {
      if (isToAr) {
        hotel.reasonForRecommendation = `[\u0645\u0648\u0635\u0649 \u0628\u0647] ${hotel.reasonForRecommendation || ""}`;
      } else {
        hotel.reasonForRecommendation = `[Recommended] ${hotel.reasonForRecommendation || ""}`;
      }
    });
  }
  if (Array.isArray(res.localEventsAndExpos)) {
    res.localEventsAndExpos.forEach((expo) => {
      if (isToAr) {
        expo.name = `[\u0641\u0639\u0627\u0644\u064A\u0629] ${expo.name}`;
        expo.advisabilityNote = `[\u0645\u0644\u0627\u062D\u0638\u0629 \u0627\u0644\u062D\u0636\u0648\u0631] ${expo.advisabilityNote}`;
      } else {
        expo.name = `[Event] ${expo.name}`;
        expo.advisabilityNote = `[Advisability] ${expo.advisabilityNote}`;
      }
    });
  }
  if (Array.isArray(res.estimatedTransitSchedules)) {
    res.estimatedTransitSchedules.forEach((schedule) => {
      schedule.transportMethod = translateVal(schedule.transportMethod);
      if (isToAr) {
        schedule.departureDayTime = `\u0645\u0648\u0627\u0639\u064A\u062F \u0627\u0644\u0645\u063A\u0627\u062F\u0631\u0629: ${schedule.departureDayTime}`;
        schedule.stationName = `\u0645\u062D\u0637\u0629: ${schedule.stationName}`;
        schedule.frequencyAndPrice = `\u0627\u0644\u0648\u062A\u064A\u0631\u0629 \u0648\u0627\u0644\u062A\u0633\u0639\u064A\u0631\u0629: ${schedule.frequencyAndPrice}`;
      } else {
        schedule.departureDayTime = `Departure frequency: ${schedule.departureDayTime}`;
        schedule.stationName = `Station: ${schedule.stationName}`;
        schedule.frequencyAndPrice = `Schedule & Rates: ${schedule.frequencyAndPrice}`;
      }
    });
  }
  if (res.administrativeMissionDetails) {
    const details = res.administrativeMissionDetails;
    if (isToAr) {
      if (details.missionOverview) {
        details.missionOverview = `[\u0625\u064A\u062C\u0627\u0632 \u0627\u0644\u0645\u0647\u0645\u0629 \u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629] ${details.missionOverview}`;
      }
      if (Array.isArray(details.destinationsList)) {
        details.destinationsList.forEach((dest) => {
          dest.transitAdvice = `[\u0625\u0631\u0634\u0627\u062F\u0627\u062A \u0627\u0644\u0648\u0635\u0648\u0644] ${dest.transitAdvice}`;
          if (Array.isArray(dest.documentsRequired)) {
            dest.documentsRequired = dest.documentsRequired.map((doc) => `\u0648\u062B\u064A\u0642\u0629: ${doc}`);
          }
        });
      }
    } else {
      if (details.missionOverview) {
        details.missionOverview = `[Mission Overview] ${details.missionOverview}`;
      }
      if (Array.isArray(details.destinationsList)) {
        details.destinationsList.forEach((dest) => {
          dest.transitAdvice = `[Transit Advice] ${dest.transitAdvice}`;
          if (Array.isArray(dest.documentsRequired)) {
            dest.documentsRequired = dest.documentsRequired.map((doc) => `Doc: ${doc}`);
          }
        });
      }
    }
  }
  if (Array.isArray(res.days)) {
    res.days.forEach((day) => {
      if (day.dayNumber) {
        day.theme = isToAr ? `\u0627\u0644\u064A\u0648\u0645 ${day.dayNumber}: ${day.theme || ""}` : `Day ${day.dayNumber}: ${day.theme || ""}`;
      } else {
        day.theme = translateVal(day.theme);
      }
      if (Array.isArray(day.activities)) {
        day.activities.forEach((act) => {
          act.timeOfDay = translateVal(act.timeOfDay);
          if (isToAr) {
            act.title = `\u0646\u0634\u0627\u0637: ${act.title || ""}`;
            act.description = `${act.description || ""}`;
            act.locationName = `${act.locationName || ""}`;
          } else {
            act.title = `Activity: ${act.title || ""}`;
            act.description = `${act.description || ""}`;
            act.locationName = `${act.locationName || ""}`;
          }
        });
      }
    });
  }
  return res;
}
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, currentTripContext, lang } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Chat messages are required" });
    }
    const ai = getAiClient();
    const isAr = lang === "ar";
    let tripDetailsContext = "";
    if (currentTripContext) {
      tripDetailsContext = `Current Planned Itinerary Context:
      Destination: ${currentTripContext.destinationName}, ${currentTripContext.country}
      Duration: ${currentTripContext.tripDurationDays} Days
      Budget Type: ${currentTripContext.targetBudgetLevel}
      Traveler Arrangement: ${currentTripContext.travelerType}
      Curated Outline of Days: ${currentTripContext.days?.map((d) => `Day ${d.dayNumber} (${d.theme}): ${d.activities?.map((a) => a.title).join(", ")}`).join("; ")}`;
    }
    const systemInstruction = isAr ? `\u0623\u0646\u062A \u0645\u0633\u062A\u0634\u0627\u0631 \u0627\u0644\u0633\u0641\u0631 \u0627\u0644\u0634\u062E\u0635\u064A \u0627\u0644\u0630\u0643\u064A \u0644\u0644\u0648\u0643\u0627\u0644\u0629. \u064A\u064F\u062F\u0639\u0649 "\u0645\u064F\u0631\u0634\u062F \u0627\u0644\u0633\u0641\u0631 \u0627\u0644\u0630\u0643\u064A". \u0648\u0645\u0647\u0645\u062A\u0643 \u0647\u064A \u0645\u0633\u0627\u0639\u062F\u0629 \u0627\u0644\u0645\u0633\u0627\u0641\u0631\u064A\u0646 \u0628\u0643\u0644 \u0644\u0628\u0627\u0642\u0629 \u0648\u0644\u0637\u0641 \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0641\u0635\u062D\u0649.
        \u0627\u0633\u062A\u062E\u062F\u0645 \u0633\u064A\u0627\u0642 \u0627\u0644\u0631\u062D\u0644\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u0644\u0645\u0633\u0627\u0639\u062F\u062A\u0647\u0645 \u0641\u064A \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0623\u0646\u0634\u0637\u0629\u060C \u0641\u0647\u0645 \u0627\u0644\u0639\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u062D\u0644\u064A\u0629\u060C \u0627\u0642\u062A\u0631\u0627\u062D \u062E\u064A\u0627\u0631\u0627\u062A \u0645\u0648\u0627\u0635\u0644\u0627\u062A\u060C \u0623\u0648 \u062A\u0642\u062F\u064A\u0645 \u062A\u0644\u0645\u064A\u062D\u0627\u062A \u0628\u062F\u064A\u0644\u0629.
        \u0643\u0646 \u062A\u0631\u062D\u064A\u0628\u064A\u0627\u064B \u0648\u0628\u062B \u0631\u0648\u062D \u0627\u0644\u0645\u063A\u0627\u0645\u0631\u0629 \u0648\u0627\u0644\u062A\u0634\u0648\u064A\u0642 \u062F\u0627\u0626\u0645\u0627\u064B! \u0623\u062C\u0628 \u0639\u0644\u0649 \u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0628\u0631\u0624\u0649 \u0645\u0641\u0635\u0644\u0629 \u0648\u0648\u0627\u0636\u062D\u0629 \u0648\u0646\u0642\u0627\u0637 \u0639\u0645\u0644\u064A\u0629.` : `You are the AI Travel Concierge of the agency, named "Travelify Assistant". Your goal is to guide the user warmly, professionally, and insightfully.
        Leverage the provided Trip Context (if any) to help them tweak activities, understand transit options, navigate local customs, or recommend alternative landmarks.
        Keep answers highly practical, organized in scannable structures, and convey enthusiasm for exploring the world.`;
    const conversations = messages.slice(-10).map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));
    if (conversations.length > 0 && tripDetailsContext) {
      const lastIndex = conversations.length - 1;
      if (conversations[lastIndex].role === "user") {
        conversations[lastIndex].parts[0].text = `[TRAVELER_TRIP_CONTEXT]
${tripDetailsContext}
[/TRAVELER_TRIP_CONTEXT]

User Question: ${conversations[lastIndex].parts[0].text}`;
      }
    }
    const chatResponse = await generateContentWithFallback({
      contents: conversations,
      config: {
        systemInstruction
      }
    });
    const text = chatResponse.text;
    return res.json({ text: text || (isAr ? "\u0639\u0630\u0631\u0627\u064B\u060C \u0644\u0645 \u0623\u0633\u062A\u0637\u0639 \u062A\u0643\u0648\u064A\u0646 \u0631\u062F \u0645\u0646\u0627\u0633\u0628." : "I am sorry, I couldn't form a response.") });
  } catch (error) {
    logCleanErrorWarning("Chat guide assistant", error);
    try {
      const isAr = req.body.lang === "ar";
      const reply = generateOfflineChatResponse(req.body.messages || [], req.body.currentTripContext, req.body.lang || "en");
      return res.json({ text: reply, isOfflineFallback: true });
    } catch (fallbackError) {
      console.error("Critical fallback chat handler error:", fallbackError);
      return res.status(500).json({ error: error.message || "Failed to communicate with AI travel guide" });
    }
  }
});
function generateOfflineChatResponse(messages, currentTripContext, lang) {
  const isAr = lang === "ar";
  const lastMsg = messages.length > 0 ? (messages[messages.length - 1]?.text || "").toLowerCase() : "";
  if (isAr) {
    if (lastMsg.includes("\u0641\u0646\u062F\u0642") || lastMsg.includes("\u0625\u0642\u0627\u0645\u0629") || lastMsg.includes("\u0627\u0642\u0627\u0645\u0647") || lastMsg.includes("\u062D\u062C\u0632") || lastMsg.includes("\u0646\u0632\u0644") || lastMsg.includes("\u0645\u0643\u0627\u0646")) {
      return `\u{1F6CE}\uFE0F **\u0628\u062E\u0635\u0648\u0635 \u0627\u0644\u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u0639\u0646 \u0627\u0644\u0641\u0646\u0627\u062F\u0642 \u0648\u0627\u0644\u0625\u0642\u0627\u0645\u0629:**
\u064A\u064F\u0648\u0635\u0649 \u0628\u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0648\u0635\u0649 \u0628\u0647\u0627 \u0641\u064A \u062E\u0637\u0629 \u0631\u062D\u0644\u062A\u0643 \u0645\u062B\u0644 **\u0641\u0646\u062F\u0642 \u0627\u0644\u0633\u0639\u0627\u062F\u0629 \u0648\u0627\u0644\u0631\u0627\u062D\u0629 \u0627\u0644\u0633\u064A\u0627\u062D\u064A** \u0623\u0648 **\u062F\u0627\u0631 \u0627\u0644\u0636\u064A\u0627\u0641\u0629 \u0627\u0644\u062A\u0642\u0644\u064A\u062F\u064A\u0629 \u0627\u0644\u0623\u0635\u064A\u0644\u0629**. \u0643\u0644\u0627\u0647\u0645\u0627 \u064A\u0648\u0641\u0631 \u0638\u0631\u0648\u0641 \u0625\u0642\u0627\u0645\u0629 \u0645\u0631\u064A\u062D\u0629 \u0644\u062E\u062F\u0645\u0629 \u0645\u0633\u0627\u0631\u0643 \u0627\u0644\u0637\u0628\u064A \u0623\u0648 \u0627\u0644\u0633\u064A\u0627\u062D\u064A \u0627\u0644\u0645\u062E\u062A\u0627\u0631. \u0648\u0642\u062F \u062A\u0645 \u062A\u0636\u0645\u064A\u0646 \u0623\u0631\u0642\u0627\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 \u0627\u0644\u0645\u0631\u062C\u0639\u064A\u0629 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629 \u0648\u0627\u0644\u0639\u0646\u0627\u0648\u064A\u0646 \u0627\u0644\u0643\u0627\u0645\u0644\u0629 \u0648\u0642\u064A\u0645\u0629 \u0642\u0633\u0637 \u0627\u0644\u0645\u0628\u064A\u062A \u0644\u0643\u0644 \u0641\u0646\u062F\u0642 \u062F\u0627\u062E\u0644 \u0645\u0644\u0641 \u0627\u0644\u0640 PDF \u0644\u0631\u0627\u062D\u062A\u0643\u0645 \u0648\u0633\u0647\u0648\u0644\u0629 \u0627\u0644\u0645\u0631\u0627\u0633\u0644\u0629 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629.`;
    }
    if (lastMsg.includes("\u0646\u0642\u0644") || lastMsg.includes("\u0645\u0648\u0627\u0635\u0644\u0627\u062A") || lastMsg.includes("\u062D\u0627\u0641\u0644\u0629") || lastMsg.includes("\u0628\u0627\u0635") || lastMsg.includes("\u062A\u0627\u0643\u0633\u064A") || lastMsg.includes("\u0633\u064A\u0627\u0631\u0629") || lastMsg.includes("\u0637\u064A\u0631\u0627\u0646") || lastMsg.includes("\u0631\u062D\u0644\u0647") || lastMsg.includes("\u0637\u0627\u0626\u0631\u0629")) {
      return `\u{1F697} **\u0628\u062E\u0635\u0648\u0635 \u0627\u0644\u0646\u0642\u0644 \u0648\u0627\u0644\u0645\u0648\u0627\u0635\u0644\u0627\u062A \u0648\u062A\u0630\u0627\u0643\u0631 \u0627\u0644\u0637\u064A\u0631\u0627\u0646:**
1. **\u062F\u0627\u062E\u0644 \u0627\u0644\u0648\u0644\u0627\u064A\u0629:** \u064A\u064F\u0645\u0643\u0646\u0643\u0645 \u0627\u0644\u062A\u0646\u0642\u0644 \u0639\u0628\u0631 \u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0627\u0644\u0646\u0642\u0644 \u0627\u0644\u062A\u0634\u0627\u0631\u0643\u064A \u0627\u0644\u0630\u0643\u064A \u0627\u0644\u0645\u062A\u0648\u0641\u0631\u0629 \u0645\u062B\u0644 **\u064A\u0633\u064A\u0631 (Yassir)** \u0623\u0648 **InDrive**\u060C \u0623\u0648 \u0627\u0644\u0627\u0633\u062A\u0639\u0627\u0646\u0629 \u0628\u062E\u0637 \u0633\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0623\u062C\u0631\u0629 \u0627\u0644\u0645\u062D\u0644\u064A\u0629.
2. **\u0628\u064A\u0646 \u0627\u0644\u0648\u0644\u0627\u064A\u0627\u062A:** \u0645\u062D\u0637\u0627\u062A \u0627\u0644\u0633\u0641\u0631 \u0627\u0644\u0628\u0631\u064A\u0629 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u062A\u0648\u0641\u0631 \u062D\u0627\u0641\u0644\u0627\u062A \u0627\u0644\u0631\u0643\u0627\u0628 \u0627\u0644\u0645\u0631\u062E\u0635\u0629 \u0627\u0644\u0645\u062C\u062F\u0648\u0644\u0629 \u0628\u0635\u0641\u0629 \u0645\u0646\u062A\u0638\u0645\u0629 \u0627\u0628\u062A\u062F\u0627\u0621\u064B \u0645\u0646 \u0627\u0644\u0633\u0627\u0639\u0629 06:15 \u0635\u0628\u0627\u062D\u0627\u064B \u0648\u0628\u062A\u0633\u0639\u064A\u0631\u0629 \u0645\u0631\u064A\u062D\u0629 \u0644\u0644\u063A\u0627\u064A\u0629 \u0644\u062C\u0645\u064A\u0639 \u0627\u0644\u0639\u0627\u0626\u0644\u0627\u062A \u0648\u0627\u0644\u0645\u0633\u0627\u0641\u0631\u064A\u0646.
3. **\u0627\u0644\u0637\u064A\u0631\u0627\u0646:** \u062A\u062A\u0648\u0641\u0631 \u062E\u062F\u0645\u0629 \u0627\u0644\u0637\u064A\u0631\u0627\u0646 \u0627\u0644\u062F\u0627\u062E\u0644\u064A \u0648\u0627\u0644\u062E\u0627\u0631\u062C\u064A \u0639\u0628\u0631 \u0627\u0644\u062E\u0637\u0648\u0637 \u0627\u0644\u062C\u0648\u064A\u0629 \u0627\u0644\u0645\u0648\u0636\u062D\u0629 \u0628\u062C\u062F\u0648\u0644 \u0627\u0644\u0631\u062D\u0644\u0627\u062A\u060C \u0645\u0639 \u0627\u0644\u062A\u0630\u0643\u064A\u0631 \u0628\u062D\u062C\u0632 \u062A\u0630\u0643\u0631\u062A\u0643 \u0628\u0640 3 \u0623\u0633\u0627\u0628\u064A\u0639 \u0645\u0633\u0628\u0642\u0627\u064B \u0644\u062D\u0641\u0638 \u0627\u0644\u0645\u064A\u0632\u0627\u0646\u064A\u0629!`;
    }
    if (lastMsg.includes("\u0623\u0643\u0644") || lastMsg.includes("\u0637\u0639\u0627\u0645") || lastMsg.includes("\u0645\u0637\u0639\u0645") || lastMsg.includes("\u063A\u0630\u0627\u0621") || lastMsg.includes("\u0639\u0634\u0627\u0621") || lastMsg.includes("\u0643\u0633\u0643\u0633") || lastMsg.includes("\u0631\u0634\u062A\u0629") || lastMsg.includes("\u0645\u0623\u0643\u0648\u0644\u0627\u062A") || lastMsg.includes("\u0648\u062C\u0628\u0629")) {
      return `\u{1F373} **\u0628\u062E\u0635\u0648\u0635 \u0627\u0644\u0637\u0639\u0627\u0645 \u0648\u0627\u0644\u0645\u0623\u0643\u0648\u0644\u0627\u062A \u0627\u0644\u062A\u0642\u0644\u064A\u062F\u064A\u0629 \u0648\u0627\u0644\u0645\u0637\u0627\u0639\u0645 \u0627\u0644\u0645\u062C\u0627\u0648\u0631\u0629:**
\u0646\u0646\u0635\u062D\u0643\u0645 \u0628\u0634\u062F\u0629 \u0628\u0632\u064A\u0627\u0631\u0629 **\u0645\u0637\u0639\u0645 \u0627\u0644\u062E\u064A\u0631\u0627\u062A \u0627\u0644\u0634\u0639\u0628\u064A** \u0623\u0648 \u0627\u0644\u0645\u0637\u0627\u0639\u0645 \u0627\u0644\u062A\u0642\u0644\u064A\u062F\u064A\u0629 \u0627\u0644\u0645\u062D\u064A\u0637\u0629 \u0628\u0627\u0644\u0645\u0631\u0643\u0632 \u0644\u062A\u0630\u0648\u0642 \u0627\u0644\u0623\u0637\u0628\u0627\u0642 \u0627\u0644\u062A\u0631\u0627\u062B\u064A\u0629 \u0627\u0644\u0639\u0631\u064A\u0642\u0629 \u0643\u0627\u0644\u0643\u0633\u0643\u0633 \u0627\u0644\u062C\u0632\u0627\u0626\u0631\u064A \u0627\u0644\u0645\u0641\u062A\u0648\u0644 \u0628\u0627\u0644\u064A\u062F \u0623\u0648 \u0627\u0644\u0631\u0634\u062A\u0629 \u0648\u0627\u0644\u062A\u0634\u062E\u0634\u0648\u062E\u0629 \u0627\u0644\u063A\u0646\u064A\u0629 \u0628\u0627\u0644\u0646\u0643\u0647\u0627\u062A \u0627\u0644\u0623\u0635\u0644\u064A\u0629. \u0643\u0645\u0627 \u062A\u062A\u0648\u0641\u0631 \u0635\u064A\u062F\u0644\u064A\u0627\u062A \u0645\u0646\u0627\u0648\u0628\u0629 \u0639\u0627\u062C\u0644\u0629 \u0645\u062C\u0627\u0648\u0631\u0629 \u0645\u062B\u0644 **\u0635\u064A\u062F\u0644\u064A\u0629 \u0627\u0644\u0647\u0644\u0627\u0644** \u0639\u0644\u0649 \u0645\u062F\u0627\u0631 24 \u0633\u0627\u0639\u0629 \u0625\u0630\u0627 \u0644\u0632\u0645 \u0627\u0644\u0623\u0645\u0631 \u0644\u0623\u064A \u0637\u0648\u0627\u0631\u0626 \u0635\u062D\u064A\u0629 \u0623\u0648 \u0645\u0644\u0637\u0641\u0627\u062A \u0647\u0636\u0645\u064A\u0629.`;
    }
    if (lastMsg.includes("\u0648\u062B\u064A\u0642\u0629") || lastMsg.includes("\u0645\u0644\u0641") || lastMsg.includes("\u0648\u062B\u0627\u0626\u0642") || lastMsg.includes("\u0623\u0648\u0631\u0627\u0642") || lastMsg.includes("\u0633\u062C\u0644") || lastMsg.includes("\u0625\u062C\u0631\u0627\u0621") || lastMsg.includes("\u0637\u0644\u0628") || lastMsg.includes("\u0625\u062F\u0627\u0631\u0629") || lastMsg.includes("\u0631\u062E\u0635\u0629")) {
      return `\u{1F4C4} **\u0628\u062E\u0635\u0648\u0635 \u0627\u0644\u0645\u0639\u0627\u0645\u0644\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629\u060C \u0625\u064A\u062F\u0627\u0639 \u0627\u0644\u0645\u0644\u0641\u0627\u062A\u060C \u0648\u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0625\u062C\u0631\u0627\u0626\u064A:**
\u0644\u062A\u064A\u0633\u064A\u0631 \u0625\u0631\u0633\u0627\u0644\u064A\u062A\u0643 \u0628\u0646\u062C\u0627\u062D\u060C \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0648\u062C\u0647 \u0645\u0628\u0643\u0631\u0627\u064B \u0641\u064A \u0627\u0644\u0635\u0628\u0627\u062D \u0644\u0640 **\u0645\u0642\u0631 \u0625\u062F\u0627\u0631\u0629 \u0648\u0644\u0627\u064A\u0629 \u0627\u0644\u0648\u062C\u0647\u0629 \u0648\u0627\u0644\u0633\u062C\u0644 \u0627\u0644\u062A\u062C\u0627\u0631\u064A** \u0623\u0648 \u0627\u0644\u0647\u064A\u0626\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629 \u0627\u0644\u0645\u0630\u0643\u0648\u0631\u0629 \u0628\u0627\u0644\u062A\u0641\u0635\u064A\u0644 \u0641\u064A \u0645\u0647\u0645\u062A\u0643 \u0627\u0644\u0645\u0646\u0633\u0642\u0629. \u062A\u0623\u0643\u062F \u0645\u0646 \u0625\u062D\u0636\u0627\u0631 \u0643\u0627\u0641\u0651\u0629 \u0627\u0644\u0648\u062B\u0627\u0626\u0642 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629 \u0648\u0635\u0648\u0631 \u0637\u0628\u0642 \u0627\u0644\u0623\u0635\u0644 \u0645\u0646\u0647\u0627 \u0645\u0633\u0628\u0642\u0627\u064B. \u0643\u0645\u0627 \u062A\u062A\u0648\u0641\u0631 \u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0646\u0633\u062E \u0627\u0644\u0633\u0631\u064A\u0639 \u0648\u0627\u0644\u0637\u0628\u0627\u0639\u0629 \u0627\u0644\u0641\u0648\u0631\u064A\u0629 \u0641\u064A **\u0643\u0634\u0643 \u0627\u0644\u0646\u0648\u0631 \u0644\u0644\u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0645\u062A\u0639\u062F\u062F\u0629 \u0648\u0627\u0644\u0646\u0633\u062E** \u0627\u0644\u0645\u062C\u0627\u0648\u0631\u0629 \u0644\u0644\u0645\u0628\u0646\u0649 \u0639\u0644\u0649 \u0645\u062F\u0627\u0631 \u0627\u0644\u064A\u0648\u0645.`;
    }
    return `\u{1F44B} **\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643\u0645 \u0641\u064A \u0645\u0631\u0634\u062F \u0627\u0644\u0633\u0641\u0631 \u0627\u0644\u0630\u0643\u064A \u0644\u0648\u0643\u0627\u0644\u0629 \u0627\u0644\u062A\u062E\u0637\u064A\u0637 \u0648\u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u064A\u0629!**
\u0644\u0642\u062F \u0642\u0645\u062A \u0628\u062A\u062D\u0644\u064A\u0644 \u0633\u064A\u0627\u0642 \u0645\u0633\u0627\u0631 \u0631\u062D\u0644\u062A\u0643\u0645 \u0627\u0644\u0645\u062C\u062F\u0648\u0644\u0629 \u0648\u062A\u0641\u0627\u0635\u064A\u0644\u0647\u0627 \u0628\u062F\u0642\u0629. \u064A\u064F\u0645\u0643\u0646\u0646\u064A \u0645\u0633\u0627\u0639\u062F\u062A\u0643\u0645 \u0648\u0625\u0641\u0627\u062F\u062A\u0643\u0645 \u0641\u0648\u0631\u064A\u0627\u064B \u0628\u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u062A\u0627\u0644\u064A\u0629:
- \u{1F3E5} **\u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u062C\u0627\u0648\u0631\u0629** \u0648\u0635\u064A\u062F\u0644\u064A\u0627\u062A \u0627\u0644\u0645\u0646\u0627\u0648\u0628\u0629 \u0643\u0640 *\u0635\u064A\u062F\u0644\u064A\u0629 \u0627\u0644\u0647\u0644\u0627\u0644*.
- \u{1F4BC} **\u062A\u0648\u062C\u064A\u0647\u0627\u062A \u0627\u0644\u0645\u0639\u0627\u0645\u0644\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629 \u0648\u0627\u0644\u0648\u0631\u0642\u064A\u0629** \u0648\u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0627\u0644\u062A\u064A \u064A\u062C\u0628 \u062A\u0648\u0641\u064A\u0631\u0647\u0627.
- \u{1F697} **\u062E\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0646\u0642\u0644 \u0627\u0644\u062D\u0636\u0631\u064A \u0648\u0627\u0644\u0631\u062D\u0644\u0627\u062A \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629** \u0628\u0627\u0644\u062F\u064A\u0646\u0627\u0631 \u0627\u0644\u062C\u0632\u0627\u0626\u0631\u064A.
- \u{1F958} **\u0627\u0644\u0645\u0637\u0627\u0639\u0645 \u0627\u0644\u062A\u0642\u0644\u064A\u062F\u064A\u0629 \u0627\u0644\u0634\u0639\u0628\u064A\u0629** \u0648\u062A\u0630\u0648\u0642 \u0627\u0644\u0643\u0633\u0643\u0633 \u0627\u0644\u0639\u0627\u0635\u0645\u064A \u0627\u0644\u0639\u0631\u064A\u0642.

\u0627\u0643\u062A\u0628 \u0627\u0633\u062A\u0641\u0633\u0627\u0631\u0643 \u0628\u062E\u0635\u0648\u0635 \u0623\u064A \u0645\u0646 \u0647\u0630\u0647 \u0627\u0644\u0645\u064A\u0632\u0627\u062A \u0648\u0633\u0623\u062C\u064A\u0628\u0643 \u0641\u0648\u0631\u0627\u064B \u0628\u0643\u0644 \u0633\u0631\u0648\u0631 \u0648\u062F\u0642\u0629 \u0645\u0648\u062C\u0647\u0629!`;
  } else {
    if (lastMsg.includes("hotel") || lastMsg.includes("stay") || lastMsg.includes("lodging") || lastMsg.includes("reserve") || lastMsg.includes("booking") || lastMsg.includes("accommodation") || lastMsg.includes("guesthouse")) {
      return `\u{1F6CE}\uFE0F **Regarding Lodging, Accommodations & Stays:**
We highly recommend checking out **Comfort Bliss Grand Hotel** or **Heritage Eco-Guesthouse Stay** noted on your live dashboard. Both selections are optimized to give clean lodging, premium safety, and very simple access to major travel paths. Full contact telephones, official star ranks, physical street directions, and nightly price ranges are completely bundled inside your printable PDF for ease of direct reservations.`;
    }
    if (lastMsg.includes("transit") || lastMsg.includes("transport") || lastMsg.includes("bus") || lastMsg.includes("taxi") || lastMsg.includes("flight") || lastMsg.includes("airport") || lastMsg.includes("plane")) {
      return `\u{1F697} **Regarding Transport, Intercity Shuttles & Flight Bookings:**
1. **Intracity Commutes:** You can easily travel via ride-hailing utilities like **Yassir** or **InDrive**, or hail reliable city-center yellow cab taxis.
2. **Intercity Bus Travels:** Main bus terminal hosts comfortable, air-conditioned intercity public busses leaving daily from 06:15 AM onward with cheap set tariffs.
3. **Flight connections:** Specific details on recommended flights, airlines (like Air France / Air Alg\xE9rie) and ticket advice are present inside the guidelines sections of your itinerary documentation.`;
    }
    if (lastMsg.includes("food") || lastMsg.includes("cuisine") || lastMsg.includes("eat") || lastMsg.includes("dine") || lastMsg.includes("dinner") || lastMsg.includes("lunch") || lastMsg.includes("restaurant") || lastMsg.includes("couscous")) {
      return `\u{1F373} **Regarding Food, Local Cuisines & Recommended Cafes:**
Indulge in native heritage dining by checking the local utility map. We suggest dining at **Al-Khairat Traditional Kitchen** to sample the signature handmade Algerian Couscous or the famous spiced festive Rechta with root vegetables. Quick 24/7 pharmacies like **Al-Hilal Pharmacy** are situated nearby on-foot for any late-night wellness or digestive items.`;
    }
    if (lastMsg.includes("document") || lastMsg.includes("file") || lastMsg.includes("paper") || lastMsg.includes("registry") || lastMsg.includes("office") || lastMsg.includes("admin")) {
      return `\u{1F4C4} **Regarding Official Filing, Administrative Processing & Office Hours:**
To complete your guidelines seamlessly, proceed early in the morning to **District Administrative Registry & Office** shown in your mission card. Verify you have packed all original passports, official appointment letters, and adequate physical paper duplicates. Professional photostatic copying and scanning is available near the main bureau buildings at **Al-Noor Digital Print & Copy Center**.`;
    }
    return `\u{1F44B} **Welcome to your AI Travel Concierges Assistant!**
I have fully indexed your current trip guidelines and local travel variables. I am ready to assist you on the following topics:
- \u{1F3E5} **Healthcare, specialized medical units**, and overnight pharmacies like *Al-Hilal*.
- \u{1F4BC} **Administrative workflow filings**, licensing guidelines, and required paper photocopies.
- \u{1F697} **Collective local transit routes, timetables, and tariffs** in Algerian DZD.
- \u{1F958} **Cultural gastronomy landmarks** and where to enjoy authentic couscous of the region.

Just ask me a question and I will guide you instantly!`;
  }
}
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Travel Agency Server active on http://0.0.0.0:${PORT}`);
  });
}
bootstrap().catch((err) => {
  console.error("Bootstrap server failure:", err);
});
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=server.cjs.map
