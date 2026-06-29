const { getConfig } = require('./env');

const DEFAULT_TIMEOUT_MS = 30000;

class RequestError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

// Resolve the per-request timeout. Without a bound, a slow or hung Meta/Platform
// call leaves the script spinning forever with no feedback. Override with
// KAPSO_HTTP_TIMEOUT_MS (milliseconds); 0 or invalid falls back to the default.
function getTimeoutMs() {
  const raw = process.env.KAPSO_HTTP_TIMEOUT_MS;
  if (!raw) return DEFAULT_TIMEOUT_MS;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

function buildUrl(baseUrl, path, query) {
  const trimmed = baseUrl.replace(/\/+$/, '');
  const safePath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${trimmed}${safePath}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

function isFormData(body) {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

function isBlob(body) {
  return typeof Blob !== 'undefined' && body instanceof Blob;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && value.constructor === Object;
}

async function request({ baseUrl, path, method, query, body, headers }) {
  const config = getConfig();
  const url = buildUrl(baseUrl, path, query);
  const finalHeaders = new Headers(headers || {});
  finalHeaders.set('X-API-Key', config.apiKey);

  let finalBody = body;

  if (body !== undefined && body !== null) {
    if (isPlainObject(body)) {
      finalBody = JSON.stringify(body);
      if (!finalHeaders.has('Content-Type')) {
        finalHeaders.set('Content-Type', 'application/json');
      }
    } else if (typeof body === 'string') {
      finalBody = body;
    } else if (isFormData(body) || isBlob(body)) {
      finalBody = body;
    }
  }

  const timeoutMs = getTimeoutMs();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: finalBody,
      signal: controller.signal
    });
  } catch (error) {
    if (error && error.name === 'AbortError') {
      throw new RequestError(
        `Request timed out after ${timeoutMs}ms (set KAPSO_HTTP_TIMEOUT_MS to adjust)`,
        408,
        { timedOut: true, url }
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }

  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  const parsed = contentType.includes('application/json') ? safeJson(text) : text;

  if (!response.ok) {
    throw new RequestError(`Request failed (${response.status})`, response.status, parsed);
  }

  return parsed;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function metaBaseUrl() {
  const config = getConfig();
  return `${config.baseUrl}/meta/whatsapp/${config.graphVersion}`;
}

function platformBaseUrl() {
  const config = getConfig();
  return config.baseUrl;
}

async function metaRequest(options) {
  return request({ baseUrl: metaBaseUrl(), ...options });
}

async function platformRequest(options) {
  return request({ baseUrl: platformBaseUrl(), ...options });
}

module.exports = {
  RequestError,
  metaRequest,
  platformRequest
};
