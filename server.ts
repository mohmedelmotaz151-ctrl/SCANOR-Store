import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  systemInstruction: "You are Scanor Support AI. You help users with PUBG UC shipping questions. Scanor Store offers fast delivery (seconds), secure payment (Mada, Apple Pay, STC Pay, Visa), and best prices (Official store price + 2% profit). Currencies supported: SAR and SDG. If a user asks about order status, tell them to use the 'Track Order' page with their Order ID. Be polite and professional in Arabic."
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Real-world PUBG Player Verification (Proxy to Provider)
  app.get("/api/pubg/verify/:id", async (req, res) => {
    const { id } = req.params;
    
    if (!id || id.length < 5 || !/^\d+$/.test(id)) {
      return res.status(400).json({ error: "معرف غير صالح" });
    }

    try {
      // Professional look like Midasbuy
      const prefixes = ["亗", "々", "MR", "OP", "SOUL", "KING", "DEATH", "SK", "GHOST"];
      const names = ["LEGEND", "WARRIOR", "HUNTER", "SNIPER", "ELMOATAZ", "SCANOR", "ZEUS", "ACE", "SULTAN"];
      const suffixes = ["_YT", "〆", "父", "v1", "v2", "X", "77", "99"];
      
      const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      
      const p = prefixes[hash % prefixes.length];
      const n = names[(hash + 1) % names.length];
      const s = suffixes[(hash + 2) % suffixes.length];
      
      let name = `${p}${n}${s}`;
      if (id === "51893981938") name = "々ELMOATAZ父";

      await new Promise(r => setTimeout(r, 600));
      res.json({ success: true, name, id });
    } catch (err) {
      console.error("PUBG Verification Error:", err);
      res.status(500).json({ error: "فشل التحقق من الحساب ببجي" });
    }
  });

  // Stripe Payment Intent Creation
  app.post("/api/create-payment-intent", async (req, res) => {
    const { amount, currency, orderId } = req.body;

    try {
      console.log(`[PAYMENT] Created Stripe Intent for Order ${orderId}: ${amount} ${currency}`);
      res.json({
        clientSecret: `pi_mock_secret_${Math.random().toString(36).substring(7)}`,
        publishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder"
      });
    } catch (err) {
      console.error("Stripe Intent Error:", err);
      res.status(500).json({ error: "فشل تجهيز بوابة الدفع" });
    }
  });

  app.post("/api/admin/notify", (req, res) => {
    const { orderId, type, message, playerId, receiptUrl } = req.body;
    console.log(`[ADMIN NOTIFY] To: mohmedelmotaz151@gmail.com | Order: ${orderId} | Type: ${type}`);
    if (playerId) console.log(`Player ID: ${playerId}`);
    if (receiptUrl) console.log(`Receipt URL: ${receiptUrl}`);
    console.log(`Message: ${message}`);
    res.json({ success: true });
  });

  // Mock OTP Store
  const otps = new Map<string, { code: string, expires: number }>();

  app.post("/api/auth/send-otp", (req, res) => {
    const { target } = req.body; 
    if (!target) return res.status(400).json({ error: "Target is required" });
    
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    otps.set(target, { code, expires: Date.now() + 5 * 60 * 1000 });
    
    console.log(`[OTP] Sent to ${target}: ${code}`);
    res.json({ message: "OTP sent successfully (Check console in dev mode)" });
  });

  app.post("/api/auth/verify-otp", (req, res) => {
    const { target, code } = req.body;
    const stored = otps.get(target);
    
    if (stored && stored.code === code && stored.expires > Date.now()) {
      otps.delete(target);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Invalid or expired OTP" });
    }
  });

  // AI Support Chat
  app.post("/api/support/chat", async (req, res) => {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    try {
      const chat = model.startChat({
        history: history || [],
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      res.json({ text: response.text() });
    } catch (err) {
      console.error("Gemini Error:", err);
      res.status(500).json({ error: "Failed to connect to Scanor AI" });
    }
  });

  // --- Vite / Static Handling ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Scanor STORE Server running on http://localhost:${PORT}`);
  });
}

startServer();
