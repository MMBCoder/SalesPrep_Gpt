'use strict';

// HTTP statuses that warrant a retry
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
// HTTP statuses that are permanent failures — never retry
const PERMANENT_STATUSES = new Set([400, 401, 403, 404]);
// Node.js network error codes that warrant a retry
const RETRYABLE_CODES = new Set(['ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED', 'ENOTFOUND', 'UND_ERR_CONNECT_TIMEOUT']);

const MAX_RETRIES = 4; // up to 5 total attempts
const BASE_DELAY_MS = 1000;

function isRetryable(err) {
  const status = err.status;
  if (PERMANENT_STATUSES.has(status)) return false;
  if (RETRYABLE_STATUSES.has(status)) return true;
  if (RETRYABLE_CODES.has(err.code)) return true;
  // OpenAI SDK-specific connection/timeout error names
  if (err.name === 'APIConnectionTimeoutError') return true;
  if (err.name === 'APIConnectionError') return true;
  return false;
}

function buildUserMessage(err) {
  const status = err.status;
  if (status === 401) return 'Authentication failed — the OpenAI API key was rejected.';
  if (status === 403) return 'Access denied by OpenAI — check API key permissions.';
  if (status === 429) return 'Rate limit reached — please try again in a moment.';
  if (status >= 500 && status <= 504) return 'OpenAI service is temporarily unavailable — please retry shortly.';
  if (err.name === 'APIConnectionTimeoutError' || err.message?.includes('timeout'))
    return 'Request timed out after 90 seconds — please try again.';
  if (RETRYABLE_CODES.has(err.code))
    return 'Network connection lost — please check connectivity and try again.';
  return `OpenAI request failed: ${err.message}`;
}

function log(entry) {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), ...entry }));
}

function requestIdFromResponse(res) {
  return res?._request_id || 'unknown';
}

function requestIdFromError(err) {
  return err.headers?.['x-request-id'] || err.request_id || 'unknown';
}

class OpenAIWrapper {
  constructor(client) {
    this.client = client;
  }

  async chatComplete(params) {
    const callStart = Date.now();
    let attempt = 0;
    let lastErr;

    while (attempt <= MAX_RETRIES) {
      const attemptStart = Date.now();
      try {
        const res = await this.client.chat.completions.create(params);
        const requestId = requestIdFromResponse(res);

        log({
          endpoint: 'chat.completions',
          model: params.model,
          duration_ms: Date.now() - callStart,
          status: 'success',
          request_id: requestId,
          retries: attempt,
          success: true,
        });

        return { data: res, requestId };
      } catch (err) {
        lastErr = err;
        const requestId = requestIdFromError(err);
        const retryable = isRetryable(err);

        log({
          endpoint: 'chat.completions',
          model: params.model,
          attempt_duration_ms: Date.now() - attemptStart,
          total_duration_ms: Date.now() - callStart,
          status: 'error',
          http_status: err.status ?? null,
          error_type: err.type || err.name || null,
          error_code: err.code || null,
          error_message: err.message,
          request_id: requestId,
          retries: attempt,
          retryable,
          success: false,
        });

        if (!retryable || attempt >= MAX_RETRIES) break;

        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        console.log(`⟳ OpenAI retry ${attempt + 1}/${MAX_RETRIES} in ${delay}ms — status=${err.status ?? err.code} msg="${err.message}"`);
        await new Promise(r => setTimeout(r, delay));
        attempt++;
      }
    }

    // Normalize into a single error with a clean user-facing message
    const normalized = new Error(buildUserMessage(lastErr));
    normalized.userMessage = buildUserMessage(lastErr);
    normalized.status = lastErr.status ?? null;
    normalized.errorType = lastErr.type || lastErr.name || null;
    normalized.errorCode = lastErr.code || null;
    normalized.requestId = requestIdFromError(lastErr);
    normalized.retriesAttempted = attempt;
    normalized.originalError = lastErr;
    throw normalized;
  }

  async healthCheck() {
    const start = Date.now();
    try {
      const res = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
      });
      return {
        success: true,
        latency_ms: Date.now() - start,
        model: 'gpt-4o-mini',
        request_id: requestIdFromResponse(res),
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        success: false,
        latency_ms: Date.now() - start,
        error: err.message,
        http_status: err.status ?? null,
        error_type: err.type || err.name || null,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

module.exports = OpenAIWrapper;
