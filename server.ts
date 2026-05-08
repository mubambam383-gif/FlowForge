import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  app.all("/wh/:slug", async (req, res) => {
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
  app.all("/m/:serverSlug/*", async (req, res) => {
    const { serverSlug } = req.params;
    const path = '/' + req.params[0];
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
