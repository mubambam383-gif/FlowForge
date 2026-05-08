import { GoogleGenAI } from "@google/genai";

export class AiDiagnostics {
  private static getClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not defined");
    return new GoogleGenAI({ apiKey });
  }

  static async analyzeFailure(context: {
    url: string;
    method: string;
    requestBody?: any;
    responseStatus?: number;
    responseBody?: any;
    validationErrors?: string[];
    error?: string;
  }) {
    const ai = this.getClient();

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
      1. Identify the root cause (e.g., auth failure, schema mismatch, rate limit).
      2. Provide a 2-sentence human-readable explanation.
      3. Suggest a specific code or config fix.
      4. Format as JSON: { "rootCause": string, "explanation": string, "suggestedFix": string, "confidence": number }
    `;

    try {
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      const text = result.text || "";
      // Extract JSON if model adds markdown wrappers
      const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text;
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error('AI Diagnostics failed:', e);
      return {
        rootCause: "Analysis Failed",
        explanation: "Unable to process failure context at this time.",
        suggestedFix: "Check manual logs or retry diagnostic.",
        confidence: 0
      };
    }
  }
}
