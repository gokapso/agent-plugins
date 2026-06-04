const DEFAULT_GRAPH_VERSION = 'v24.0';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function normalizeBaseUrl(raw) {
  const trimmed = raw.replace(/\/+$/, '');
  const metaMatch = trimmed.match(/^(.*)\/meta(?:\/whatsapp)?\/v\d+\.\d+$/);
  if (metaMatch) return metaMatch[1];
  if (trimmed.endsWith('/platform/v1')) return trimmed.slice(0, -'/platform/v1'.length);
  return trimmed;
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

function normalizeGraphVersion(version) {
  if (!version) return DEFAULT_GRAPH_VERSION;
  return version.startsWith('v') ? version : `v${version}`;
}

function getConfig() {
  const baseUrl = normalizeBaseUrl(requireEnv('KAPSO_API_BASE_URL'));
  validateBaseUrl(baseUrl);
  return {
    baseUrl,
    apiKey: requireEnv('KAPSO_API_KEY'),
    graphVersion: normalizeGraphVersion(process.env.META_GRAPH_VERSION)
  };
}

module.exports = {
  getConfig
};
