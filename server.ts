import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8"));

const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  app.all("/wh/:slug", async (req, res) => {
    const { slug } = req.params;
    console.log(`[Webhook] Received for slug: ${slug}, method: ${req.method}`);
    
    try {
      // Find the user ID from the slug (format: user-UID_PART)
      // For simplicity in the lab, we expect slug like "user-ABC12345"
      if (slug.startsWith('user-')) {
        // We'll need a way to map the short UID to the full UID
        // But for this demo, let's assume the slug IS the identifier we use in the path
        // OR better: we write to a collection where the frontend can find it.
        // Let's use the slug as the collection identifier for now or look up the user.
        
        // Actually, for the lab, the frontend listens to `users/${user.uid}/webhooks/main/events`
        // We can pass the full UID in the slug for this demo purposes
        // WebhookLab.tsx: setWebhookUrl(`${baseUrl}/wh/${user.uid}`);
        
        await addDoc(collection(db, `users/${slug.replace('user-', '')}/webhooks/main/events`), {
          method: req.method,
          headers: req.headers,
          body: req.body,
          receivedAt: Date.now(), // Firestore serverTimestamp is better but we want number for now as per frontend
          createdAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.error("Firestore write error in webhook:", e);
    }
    
    res.status(200).json({ status: "received", timestamp: new Date().toISOString() });
  });

  // Proxy endpoint to bypass CORS for API testing
  app.all("/api/proxy", async (req, res) => {
    const { url, method, headers, body } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      const response = await fetch(url, {
        method: method || "GET",
        headers: headers || {},
        body: method !== "GET" ? JSON.stringify(body) : undefined,
      });

      const responseData = await response.text();
      let parsedData;
      try {
        parsedData = JSON.parse(responseData);
      } catch (e) {
        parsedData = responseData;
      }

      res.status(response.status).json({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: parsedData,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[FlowForge] Server running on http://localhost:${PORT}`);
  });
}

startServer();
