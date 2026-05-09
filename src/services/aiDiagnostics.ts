export class AiDiagnostics {
  static async analyzeFailure(context: {
    url: string;
    method: string;
    requestBody?: any;
    responseStatus?: number;
    responseBody?: any;
    validationErrors?: string[];
    error?: string;
  }) {
    try {
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'AI diagnostics failed');
      }

      return result;
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
