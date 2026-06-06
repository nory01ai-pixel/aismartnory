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
var import_cors = __toESM(require("cors"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_genai = require("@google/genai");
import_dotenv.default.config();
var app = (0, import_express.default)();
app.use((0, import_cors.default)({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"]
}));
app.use(import_express.default.json());
var apiKey = process.env.GEMINI_API_KEY;
var ai = new import_genai.GoogleGenAI({ apiKey });
app.post("/chat", async (req, res) => {
  try {
    const { messages, currentTripContext, lang } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }
    const lastMessage = messages[messages.length - 1]?.text || "";
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: lastMessage
    });
    res.json({ text: response.text });
  } catch (error) {
    console.error("Gemini Execution Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});
app.get("/", (req, res) => {
  res.send("AI Travel Agency Server for Fosha DZ is Live and Ready!");
});
var PORT = process.env.PORT || 3e3;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running smoothly on port ${PORT}`);
});
//# sourceMappingURL=server.cjs.map
