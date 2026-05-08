import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { supabase } from '../lib/supabase';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

export interface ValidationReport {
    isValid: boolean;
    errors: string[];
    schemaMatch?: boolean;
    statusMatch?: boolean;
    timingMatch?: boolean;
}

export interface RequestSettings {
    timeout?: number;
    retries?: number;
    expectedStatus?: number[];
    expectedSchema?: any;
    maxDurationMs?: number;
}

export interface RequestExecutionResult {
    status: number;
    statusText: string;
    headers: any;
    body: any;
    durationMs: number;
    validation: ValidationReport;
}

export class RequestEngine {
    static async execute(
        config: AxiosRequestConfig,
        settings: RequestSettings = {},
        metadata: { requestId?: string; workspaceId?: string; userId: string }
    ): Promise<RequestExecutionResult> {
        const startTime = performance.now();
        let response: AxiosResponse | null = null;
        let error: any = null;
        let retriesLeft = settings.retries || 0;

        const attemptRequest = async (): Promise<AxiosResponse> => {
            try {
                return await axios({
                    ...config,
                    timeout: settings.timeout || 30000,
                    validateStatus: () => true, // Catch all statuses manually
                });
            } catch (err: any) {
                if (retriesLeft > 0) {
                    retriesLeft--;
                    return await attemptRequest();
                }
                throw err;
            }
        };

        try {
            response = await attemptRequest();
        } catch (err: any) {
            error = err;
        }

        const endTime = performance.now();
        const durationMs = Math.round(endTime - startTime);

        // Validation logic
        const validation = this.validateResponse(response, settings, durationMs);

        // Logging to Supabase
        await this.logExecution({
            requestId: metadata.requestId,
            userId: metadata.userId,
            workspaceId: metadata.workspaceId,
            method: config.method || 'GET',
            url: config.url || '',
            requestHeaders: config.headers,
            requestBody: config.data,
            responseStatus: response?.status,
            responseHeaders: response?.headers,
            responseBody: response?.data,
            durationMs,
            validationResults: validation,
            error: error?.message,
        });

        if (error && !response) {
            throw error;
        }

        return {
            status: response?.status || 0,
            statusText: response?.statusText || 'Error',
            headers: response?.headers || {},
            body: response?.data,
            durationMs,
            validation,
        };
    }

    private static validateResponse(
        response: AxiosResponse | null,
        settings: RequestSettings,
        durationMs: number
    ): ValidationReport {
        const errors: string[] = [];
        let statusMatch = true;
        let schemaMatch = true;
        let timingMatch = true;

        if (!response) {
            return { isValid: false, errors: ['No response received'] };
        }

        // Status Validation
        if (settings.expectedStatus && settings.expectedStatus.length > 0) {
            if (!settings.expectedStatus.includes(response.status)) {
                statusMatch = false;
                errors.push(`Expected status ${settings.expectedStatus.join(', ')} but got ${response.status}`);
            }
        }

        // Schema Validation
        if (settings.expectedSchema) {
            try {
                const validate = ajv.compile(settings.expectedSchema);
                const valid = validate(response.data);
                if (!valid) {
                    schemaMatch = false;
                    validate.errors?.forEach(err => {
                        errors.push(`Schema Error: ${err.instancePath} ${err.message}`);
                    });
                }
            } catch (err: any) {
                errors.push(`Schema compilation failed: ${err.message}`);
            }
        }

        // Timing Validation
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

    private static async logExecution(logData: any) {
        try {
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
            if (error) console.error('Failed to log request execution:', error);
        } catch (e) {
            console.error('Logging error:', e);
        }
    }
}
