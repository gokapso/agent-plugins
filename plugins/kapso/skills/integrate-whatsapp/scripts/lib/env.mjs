function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function normalizeMetaBase(raw) {
  const trimmed = raw.replace(/\/+$/, '');
  if (trimmed.endsWith('/platform/v1')) {
    return `${trimmed.slice(0, -'/platform/v1'.length)}/meta/whatsapp`;
  }
  const metaMatch = trimmed.match(/^(.*)\/meta\/whatsapp(?:\/v\d+\.\d+)?$/);
  if (metaMatch) {
    return `${metaMatch[1]}/meta/whatsapp`;
  }
  const rawMetaMatch = trimmed.match(/^(.*)\/meta$/);
  if (rawMetaMatch) {
    return `${rawMetaMatch[1]}/meta/whatsapp`;
  }
  return `${trimmed}/meta/whatsapp`;
}

function normalizeGraphVersion(value) {
  if (!value) return 'v24.0';
  return value.startsWith('v') ? value : `v${value}`;
}

function isLocalhost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname === '::1' || hostname === '[::1]';
}

function validateBaseUrl(baseUrl, label) {
  let parsed;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new Error(`Invalid ${label}.`);
  }
  if (parsed.username || parsed.password) {
    throw new Error(`${label} must not include credentials.`);
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`${label} must use http or https.`);
  }
  if (!process.env.KAPSO_API_ALLOW_LOCALHOST && isLocalhost(parsed.hostname)) {
    throw new Error(
      `${label} points to localhost (${parsed.hostname}). ` +
      'Set KAPSO_API_ALLOW_LOCALHOST=true if this is intentional.'
    );
  }
  if (
    parsed.protocol === 'http:' &&
    !(process.env.KAPSO_API_ALLOW_LOCALHOST && isLocalhost(parsed.hostname)) &&
    process.env.KAPSO_API_ALLOW_INSECURE_HTTP !== 'true'
  ) {
    throw new Error(
      `${label} must use https. ` +
      'Set KAPSO_API_ALLOW_INSECURE_HTTP=true only for trusted development hosts.'
    );
  }
}

export function metaProxyConfig() {
  const rawBase = process.env.KAPSO_META_BASE_URL || requireEnv('KAPSO_API_BASE_URL');
  const baseUrl = normalizeMetaBase(rawBase);
  const baseLabel = process.env.KAPSO_META_BASE_URL ? 'KAPSO_META_BASE_URL' : 'KAPSO_API_BASE_URL';
  validateBaseUrl(baseUrl, baseLabel);
  const apiKey = requireEnv('KAPSO_API_KEY');
  const graphVersion = normalizeGraphVersion(process.env.META_GRAPH_VERSION || 'v24.0');

  return {
    baseUrl,
    apiKey,
    graphVersion
  };
}
