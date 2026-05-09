import { GoogleGenAI } from '@google/genai';
import { handleOptions, setCorsHeaders } from './_lib/cors';

export default async function handler(req: any, res: any) {
  if (handleOptions(req, res)) return;
  setCorsHeaders(res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  const context = req.body || {};
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
As an expert API Reliability Engineer, analyze this integration failure and provide a root cause and solution.

CONTEXT:
URL: ${context.url}
Method: ${context.method}
${context.requestBody ? `Request: ${JSON.stringify(context.requestBody)}` : ''}

FAILURE DATA:
Status: ${context.responseStatus}
Error: ${context.error || 'None'}
Validation Failures: ${context.validationErrors?.join(', ') || 'None'}
Response Payload: ${JSON.stringify(context.responseBody)}

INSTRUCTIONS:
1. Identify the root cause, for example auth failure, schema mismatch, rate limit, DNS, CORS, or timeout.
2. Provide a 2-sentence human-readable explanation.
3. Suggest a specific code or config fix.
4. Return only JSON in this shape: { "rootCause": string, "explanation": string, "suggestedFix": string, "confidence": number }
`;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    const text = result.text || '';
    const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text;
    return res.status(200).json(JSON.parse(jsonStr));
  } catch (error) {
    console.error('AI diagnostics failed:', error);
    return res.status(500).json({
      rootCause: 'Analysis Failed',
      explanation: 'Unable to process failure context at this time.',
      suggestedFix: 'Check server logs, verify GEMINI_API_KEY, or retry diagnostic.',
      confidence: 0,
    });
  }
}
