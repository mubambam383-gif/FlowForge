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

export interface RequestConfig {
    method?: string;
    url?: string;
    data?: any;
    headers?: Record<string, unknown>;
}

export class RequestEngine {
    static async execute(
        config: RequestConfig,
        settings: RequestSettings = {},
        metadata: { requestId?: string; workspaceId?: string; userId: string }
    ): Promise<RequestExecutionResult> {
        const response = await fetch('/api/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: config.url,
                method: config.method || 'GET',
                headers: config.headers || {},
                body: config.data,
                settings,
                metadata,
            }),
        });

        const result = await response.json();
        if (!response.ok && !result.validation) {
            throw new Error(result.error || 'Request failed');
        }

        return {
            status: result.status || 0,
            statusText: result.statusText || 'Error',
            headers: result.headers || {},
            body: result.body,
            durationMs: result.durationMs || 0,
            validation: result.validation || { isValid: false, errors: [result.error || 'Request failed'] },
        };
    }
}
