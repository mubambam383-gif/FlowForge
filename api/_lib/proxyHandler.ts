import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { getSupabaseAdmin } from './supabaseAdmin';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const blockedHeaderNames = new Set([
  'host',
  'connection',
  'content-length',
  'accept-encoding',
  'cookie',
  'set-cookie',
]);

function sanitizeHeaders(headers: Record<string, unknown> = {}) {
  return Object.fromEntries(
    Object.entries(headers)
      .filter(([key]) => !blockedHeaderNames.has(key.toLowerCase()))
      .map(([key, value]) => [key, String(value)]),
  );
}

function validateResponse(responseData: unknown, status: number, settings: any = {}, durationMs: number) {
  const errors: string[] = [];
  let statusMatch = true;
  let schemaMatch = true;
  let timingMatch = true;

  if (Array.isArray(settings.expectedStatus) && settings.expectedStatus.length > 0) {
    if (!settings.expectedStatus.includes(status)) {
      statusMatch = false;
      errors.push(`Expected status ${settings.expectedStatus.join(', ')} but got ${status}`);
    }
  }

  if (settings.expectedSchema) {
    try {
      const validate = ajv.compile(settings.expectedSchema);
      const valid = validate(responseData);
      if (!valid) {
        schemaMatch = false;
        validate.errors?.forEach((err) => {
          errors.push(`Schema Error: ${err.instancePath} ${err.message}`);
        });
      }
    } catch (err: any) {
      schemaMatch = false;
      errors.push(`Schema compilation failed: ${err.message}`);
    }
  }

  if (settings.maxDurationMs && durationMs > settings.maxDurationMs) {
    timingMatch = false;
    errors.push(`Response time (${durationMs}ms) exceeded maximum expected duration (${settings.maxDurationMs}ms)`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    statusMatch,
    schemaMatch,
    timingMatch,
  };
}

async function logExecution(logData: any) {
  const supabase = getSupabaseAdmin();
  if (!supabase || !logData.userId) return;

  const { error } = await supabase.from('request_logs').insert({
    request_id: logData.requestId,
    user_id: logData.userId,
    workspace_id: logData.workspaceId,
    method: logData.method,
    url: logData.url,
    request_headers: logData.requestHeaders,
    request_body: logData.requestBody,
    response_status: logData.responseStatus,
    response_headers: logData.responseHeaders,
    response_body: logData.responseBody,
    duration_ms: logData.durationMs,
    validation_results: logData.validationResults,
    error: logData.error,
  });

  if (error) {
    console.error('Failed to log proxied request:', error);
  }
}

export async function handleProxyRequest(payload: any) {
  const { url, method = 'GET', headers = {}, body, settings = {}, metadata = {} } = payload || {};

  if (!url) {
    return { statusCode: 400, body: { error: 'URL is required' } };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return { statusCode: 400, body: { error: 'URL must be a valid absolute URL.' } };
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return { statusCode: 400, body: { error: 'Only HTTP and HTTPS URLs are supported.' } };
  }

  const requestMethod = String(method).toUpperCase();
  const startTime = performance.now();
  let responseStatus = 0;
  let responseHeaders: Record<string, string> = {};
  let responseBody: unknown = null;
  let responseStatusText = 'Error';
  let validation = { isValid: false, errors: ['No response received'] };
  let requestError: string | undefined;

  try {
    const shouldSendBody = !['GET', 'HEAD'].includes(requestMethod);
    const attempts = Math.max(1, Number(settings.retries || 0) + 1);
    let response: Response | null = null;
    let lastError: any = null;

    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        response = await fetch(parsedUrl.toString(), {
          method: requestMethod,
          headers: sanitizeHeaders(headers),
          body: shouldSendBody && body !== undefined ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(settings.timeout || 30000),
        });
        break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!response) throw lastError;

    responseStatus = response.status;
    responseStatusText = response.statusText;
    responseHeaders = Object.fromEntries(response.headers.entries());

    const responseText = await response.text();
    try {
      responseBody = responseText ? JSON.parse(responseText) : null;
    } catch {
      responseBody = responseText;
    }
  } catch (err: any) {
    requestError = err.message || 'Request failed';
  }

  const durationMs = Math.round(performance.now() - startTime);
  validation = validateResponse(responseBody, responseStatus, settings, durationMs);
  if (requestError) {
    validation = { isValid: false, errors: [requestError] };
  }

  await logExecution({
    requestId: metadata.requestId,
    userId: metadata.userId,
    workspaceId: metadata.workspaceId,
    method: requestMethod,
    url: parsedUrl.toString(),
    requestHeaders: headers,
    requestBody: body,
    responseStatus,
    responseHeaders,
    responseBody,
    durationMs,
    validationResults: validation,
    error: requestError,
  });

  if (requestError) {
    return {
      statusCode: 502,
      body: {
        error: requestError,
        status: 0,
        statusText: 'Error',
        headers: {},
        body: requestError,
        durationMs,
        validation,
      },
    };
  }

  return {
    statusCode: 200,
    body: {
      status: responseStatus,
      statusText: responseStatusText,
      headers: responseHeaders,
      body: responseBody,
      durationMs,
      validation,
    },
  };
}
