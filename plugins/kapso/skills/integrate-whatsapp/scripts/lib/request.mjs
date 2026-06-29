import { metaProxyConfig } from './env.mjs';

const DEFAULT_TIMEOUT_MS = 30000;

// Resolve the per-request timeout. Without a bound, a slow or hung Meta call
// leaves the script spinning forever with no feedback. Override with
// KAPSO_HTTP_TIMEOUT_MS (milliseconds); 0 or invalid falls back to the default.
function getTimeoutMs() {
  const raw = process.env.KAPSO_HTTP_TIMEOUT_MS;
  if (!raw) return DEFAULT_TIMEOUT_MS;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

function buildUrl(path, query) {
  const { baseUrl, graphVersion } = metaProxyConfig();
  const cleanedPath = path.replace(/^\/+/, '');
  const url = new URL(`${baseUrl}/${graphVersion}/${cleanedPath}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      url.searchParams.set(key, String(value));
    });
  }

  return url;
}

function shouldParseJson(contentType) {
  return contentType && contentType.toLowerCase().includes('application/json');
}

export async function metaProxyRequest({ method, path, query, headers, body }) {
  const { apiKey } = metaProxyConfig();
  const url = buildUrl(path, query);
  const finalHeaders = new Headers(headers || {});

  finalHeaders.set('X-API-Key', apiKey);

  if (body && !(body instanceof FormData) && !finalHeaders.has('Content-Type')) {
    finalHeaders.set('Content-Type', 'application/json');
  }

  const timeoutMs = getTimeoutMs();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body,
      signal: controller.signal
    });
  } catch (error) {
    if (error && error.name === 'AbortError') {
      return {
        ok: false,
        status: 408,
        url: url.toString(),
        timedOut: true,
        data: {
          error: `Request timed out after ${timeoutMs}ms (set KAPSO_HTTP_TIMEOUT_MS to adjust)`
        }
      };
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }

  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  let data = text;

  if (text && shouldParseJson(contentType)) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    url: url.toString(),
    data
  };
}
