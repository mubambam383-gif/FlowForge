import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { requireSupabaseAdmin } from "./api/_lib/supabaseAdmin";
import { handleProxyRequest } from "./api/_lib/proxyHandler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.all("/wh/:slug", async (req, res) => {
    const supabase = requireSupabaseAdmin(res);
    if (!supabase) return;

    const { slug } = req.params;
    console.log(`[Webhook] Received for slug: ${slug}, method: ${req.method}`);
    
    try {
      if (slug.startsWith('user-')) {
        const userId = slug.replace('user-', '');
        
        const { error } = await supabase.from('webhook_events').insert({
          user_id: userId,
          payload: {
            method: req.method,
            headers: req.headers,
            body: req.body
          },
          source: req.headers['x-simulation'] as string || 'default'
        });
        
        if (error) throw error;
      }
    } catch (e) {
      console.error("Supabase write error in webhook:", e);
    }
    
    res.status(200).json({ status: "received", timestamp: new Date().toISOString() });
  });

  // Mock Server Engine
  app.all(["/m/:serverSlug", "/m/:serverSlug/*"], async (req, res) => {
    const supabase = requireSupabaseAdmin(res);
    if (!supabase) return;

    const { serverSlug } = req.params;
    const path = req.params[0] ? '/' + req.params[0] : '/';
    const method = req.method;

    console.log(`[MockServer] Request for ${serverSlug} at ${path} [${method}]`);

    try {
      // Find the mock server
      const { data: server, error: serverError } = await supabase
        .from('mock_servers')
        .select('id, is_active')
        .eq('slug', serverSlug)
        .single();

      if (serverError || !server) {
        return res.status(404).json({ error: "Mock server not found" });
      }

      if (!server.is_active) {
        return res.status(403).json({ error: "Mock server is inactive" });
      }

      // Find the endpoint
      const { data: endpoint, error: endpointError } = await supabase
        .from('mock_endpoints')
        .select('*')
        .eq('mock_server_id', server.id)
        .eq('path', path)
        .eq('method', method)
        .single();

      if (endpointError || !endpoint) {
        return res.status(404).json({ 
          error: "No endpoint defined for this path and method",
          suggestion: "Use the Mock Server Dashboard to add this route."
        });
      }

      // Simulate delay
      if (endpoint.delay_ms > 0) {
        await new Promise(resolve => setTimeout(resolve, endpoint.delay_ms));
      }

      // Set headers
      if (endpoint.response_headers) {
        Object.entries(endpoint.response_headers).forEach(([key, value]) => {
          res.setHeader(key, value as string);
        });
      }

      res.status(endpoint.response_status || 200).json(endpoint.response_body || {});
    } catch (e) {
      console.error("[MockServer] Error:", e);
      res.status(500).json({ error: "Internal server error in Mock Engine" });
    }
  });

  // Proxy endpoint to bypass CORS for API testing
  app.post("/api/proxy", async (req, res) => {
    const result = await handleProxyRequest(req.body);
    res.status(result.statusCode).json(result.body);
  });

  app.post("/api/diagnose", async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
    }

    const context = req.body || {};
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
As an expert API Reliability Engineer, analyze this integration failure and provide a root cause and solution.

CONTEXT:
URL: ${context.url}
Method: ${context.method}
${context.requestBody ? `Request: ${JSON.stringify(context.requestBody)}` : ""}

FAILURE DATA:
Status: ${context.responseStatus}
Error: ${context.error || "None"}
Validation Failures: ${context.validationErrors?.join(", ") || "None"}
Response Payload: ${JSON.stringify(context.responseBody)}

INSTRUCTIONS:
Return only JSON in this shape: { "rootCause": string, "explanation": string, "suggestedFix": string, "confidence": number }
`;

    try {
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      const text = result.text || "";
      const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text;
      res.status(200).json(JSON.parse(jsonStr));
    } catch (error) {
      console.error("AI diagnostics failed:", error);
      res.status(500).json({
        rootCause: "Analysis Failed",
        explanation: "Unable to process failure context at this time.",
        suggestedFix: "Check server logs, verify GEMINI_API_KEY, or retry diagnostic.",
        confidence: 0,
      });
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
