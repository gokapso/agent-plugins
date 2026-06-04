function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function normalizeBaseUrl(raw) {
  return raw.replace(/\/+$/, '');
}

function isLocalhost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname === '::1' || hostname === '[::1]';
}

function validateBaseUrl(baseUrl) {
  let parsed;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new Error('Invalid KAPSO_API_BASE_URL.');
  }
  if (parsed.username || parsed.password) {
    throw new Error('KAPSO_API_BASE_URL must not include credentials.');
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('KAPSO_API_BASE_URL must use http or https.');
  }
  if (!process.env.KAPSO_API_ALLOW_LOCALHOST && isLocalhost(parsed.hostname)) {
    throw new Error(
      `KAPSO_API_BASE_URL points to localhost (${parsed.hostname}). ` +
      'Set KAPSO_API_ALLOW_LOCALHOST=true if this is intentional.'
    );
  }
  if (
    parsed.protocol === 'http:' &&
    !(process.env.KAPSO_API_ALLOW_LOCALHOST && isLocalhost(parsed.hostname)) &&
    process.env.KAPSO_API_ALLOW_INSECURE_HTTP !== 'true'
  ) {
    throw new Error(
      'KAPSO_API_BASE_URL must use https. ' +
      'Set KAPSO_API_ALLOW_INSECURE_HTTP=true only for trusted development hosts.'
    );
  }
}

function kapsoConfigFromEnv() {
  const baseUrl = normalizeBaseUrl(requireEnv('KAPSO_API_BASE_URL'));
  validateBaseUrl(baseUrl);
  return {
    baseUrl,
    apiKey: requireEnv('KAPSO_API_KEY')
  };
}

async function kapsoRequest(config, path, init = {}) {
  const url = `${config.baseUrl}${path}`;
  if (process.env.KAPSO_DEBUG_URLS === 'true') {
    console.error(`[kapso-debug] ${init.method || 'GET'} ${url}`);
  }
  const headers = new Headers(init.headers || undefined);
  headers.set('X-API-Key', config.apiKey);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...init, headers });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Kapso API request failed (status=${response.status}) body=${text}`);
  }

  return text ? JSON.parse(text) : {};
}

module.exports = {
  kapsoConfigFromEnv,
  kapsoRequest
};
