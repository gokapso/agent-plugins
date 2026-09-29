const { kapsoConfigFromEnv, kapsoRequest } = require('./lib/triage/kapso-api');

const PERIODS = new Set(['24h', '7d', '30d', 'context']);
const SOURCE_ALIASES = new Map([
  ['all', 'all'],
  ['api', 'external_api_log'],
  ['external_api_log', 'external_api_log'],
  ['messages', 'whatsapp_message_event'],
  ['message', 'whatsapp_message_event'],
  ['whatsapp_message_event', 'whatsapp_message_event'],
  ['functions', 'functions'],
  ['function', 'functions'],
  ['function_invocation_event', 'function_invocation_event'],
  ['function_log_event', 'function_log_event'],
  ['flow', 'flow_event'],
  ['flows', 'flow_event'],
  ['workflow', 'flow_event'],
  ['workflows', 'flow_event'],
  ['flow_event', 'flow_event'],
  ['meta', 'whatsapp_webhook_event'],
  ['whatsapp_webhook_event', 'whatsapp_webhook_event'],
  ['webhook', 'webhook_delivery'],
  ['webhooks', 'webhook_delivery'],
  ['webhook_delivery', 'webhook_delivery']
]);

function ok(data) {
  return { ok: true, data };
}

function err(message, details) {
  return { ok: false, error: { message, details } };
}

async function main() {
  const argv = process.argv.slice(2);
  if (hasHelpFlag(argv)) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          usage:
            'node scripts/log-search.js [--query <text>] [--period <24h|7d|30d|context>] [--source <all|api|meta|messages|workflows|functions|webhooks>] [--problems-only true|false] [--limit <n>] [--cursor <token>] [--around <iso8601>] [--highlight-event-id <id>] [--highlight-resource-id <id>] [--filter <key=value> ...] [--filters-json <json>]',
          notes: [
            'Uses GET /platform/v1/log_search when no filters are provided.',
            'Uses POST /platform/v1/log_search when --filter or --filters-json is provided.',
            'Use --period context with --around to fetch nearby events.'
          ],
          examples: [
            'node scripts/log-search.js --query wamid.ABC123 --period 24h --limit 10',
            'node scripts/log-search.js --source api --problems-only true --filter response_status=500 --filter endpoint_contains=/messages',
            'node scripts/log-search.js --source workflows --filter flow_execution_id=exec_123 --limit 20'
          ],
          env: ['KAPSO_API_BASE_URL', 'KAPSO_API_KEY']
        },
        null,
        2
      )
    );
    return 0;
  }

  try {
    const flags = parseFlags(argv);
    const request = buildSearchRequest(flags);
    const config = kapsoConfigFromEnv();
    const data = await executeSearch(config, request);

    console.log(JSON.stringify(ok(data), null, 2));
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify(err('Command failed', { message }), null, 2));
    return 1;
  }
}

function hasHelpFlag(argv) {
  return argv.includes('--help') || argv.includes('-h');
}

function parseFlags(argv) {
  const flags = {};
  const filters = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) {
      throw new Error(`Unexpected positional argument: ${arg}`);
    }

    const trimmed = arg.slice(2);
    const eqIndex = trimmed.indexOf('=');
    const key = eqIndex >= 0 ? trimmed.slice(0, eqIndex) : trimmed;
    let value;

    if (eqIndex >= 0) {
      value = trimmed.slice(eqIndex + 1);
    } else {
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) {
        value = true;
      } else {
        value = next;
        index += 1;
      }
    }

    if (key === 'filter') {
      filters.push(requiredValue(key, value));
    } else if (Object.hasOwn(flags, key)) {
      throw new Error(`Duplicate --${key} flag`);
    } else {
      flags[key] = value;
    }
  }

  if (filters.length > 0) {
    flags.filter = filters;
  }

  return flags;
}

function buildSearchRequest(flags) {
  const filters = filtersFromFlags(flags);
  const body = {};

  setString(body, 'query', flags.query);
  setPeriod(body, flags.period);
  setSource(body, flags.source);
  setBoolean(body, 'problems_only', flags['problems-only'] ?? flags['errors-only']);
  setInteger(body, 'limit', flags.limit);
  setString(body, 'cursor', flags.cursor);
  setString(body, 'around', flags.around);
  setString(body, 'highlight_event_id', flags['highlight-event-id']);
  setString(body, 'highlight_resource_id', flags['highlight-resource-id']);

  if (Object.keys(filters).length > 0) {
    body.filters = filters;
  }

  return {
    body,
    hasFilters: Object.hasOwn(body, 'filters')
  };
}

function filtersFromFlags(flags) {
  const filters = {};

  if (flags['filters-json'] !== undefined) {
    const parsed = parseFiltersJson(requiredValue('filters-json', flags['filters-json']));
    Object.assign(filters, parsed);
  }

  for (const entry of flags.filter || []) {
    const separatorIndex = entry.indexOf('=');
    if (separatorIndex <= 0) {
      throw new Error(`Invalid filter "${entry}". Use "--filter key=value".`);
    }

    const key = entry.slice(0, separatorIndex).trim();
    const value = entry.slice(separatorIndex + 1).trim();
    if (!key || !value) {
      throw new Error(`Invalid filter "${entry}". Use "--filter key=value".`);
    }
    if (Object.hasOwn(filters, key)) {
      throw new Error(`Duplicate filter "${key}". Pass each filter key only once.`);
    }

    filters[key] = parseFilterValue(value);
  }

  return filters;
}

function parseFiltersJson(value) {
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch (error) {
    throw new Error(`Invalid --filters-json value: ${error.message}`);
  }

  if (Array.isArray(parsed)) {
    return parsed.reduce((filters, entry) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        throw new Error('--filters-json array entries must be objects with key and value');
      }
      if (!Object.hasOwn(entry, 'key') || !Object.hasOwn(entry, 'value')) {
        throw new Error('--filters-json array entries must include key and value');
      }
      filters[String(entry.key)] = parseFilterValue(entry.value);
      return filters;
    }, {});
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('--filters-json must be an object or array of {key, value} entries');
  }

  return Object.entries(parsed).reduce((filters, [key, value]) => {
    filters[key] = parseFilterValue(value);
    return filters;
  }, {});
}

function parseFilterValue(value) {
  if (typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }

  const stringValue = String(value).trim();
  if (/^-?\d+$/.test(stringValue)) {
    return Number.parseInt(stringValue, 10);
  }
  if (stringValue === 'true') {
    return true;
  }
  if (stringValue === 'false') {
    return false;
  }

  return stringValue;
}

function setString(body, key, rawValue) {
  if (rawValue === undefined) return;
  body[key] = requiredValue(key.replaceAll('_', '-'), rawValue);
}

function setPeriod(body, rawValue) {
  if (rawValue === undefined) return;
  const period = requiredValue('period', rawValue);
  if (!PERIODS.has(period)) {
    throw new Error(`Invalid --period value: ${period}`);
  }
  body.period = period;
}

function setSource(body, rawValue) {
  if (rawValue === undefined) return;
  const source = requiredValue('source', rawValue).toLowerCase();
  const normalized = SOURCE_ALIASES.get(source);
  if (!normalized) {
    throw new Error(`Invalid --source value: ${source}`);
  }
  body.source = normalized;
}

function setBoolean(body, key, rawValue) {
  if (rawValue === undefined) return;
  if (rawValue === true) {
    body[key] = true;
    return;
  }

  const value = String(rawValue).toLowerCase();
  if (['true', '1', 'yes'].includes(value)) {
    body[key] = true;
    return;
  }
  if (['false', '0', 'no'].includes(value)) {
    body[key] = false;
    return;
  }

  throw new Error(`Invalid boolean for --${key.replaceAll('_', '-')}: ${rawValue}`);
}

function setInteger(body, key, rawValue) {
  if (rawValue === undefined) return;
  const value = requiredValue(key, rawValue);
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0 || String(parsed) !== value) {
    throw new Error(`Invalid --${key} value: ${rawValue}`);
  }
  body[key] = parsed;
}

function requiredValue(key, value) {
  if (value === true || value === undefined || value === '') {
    throw new Error(`--${key} requires a value`);
  }
  return String(value);
}

async function executeSearch(config, request) {
  if (request.hasFilters) {
    return kapsoRequest(config, '/platform/v1/log_search', {
      method: 'POST',
      body: JSON.stringify(request.body)
    });
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(request.body)) {
    params.set(key, String(value));
  }

  const suffix = params.toString();
  return kapsoRequest(config, `/platform/v1/log_search${suffix ? `?${suffix}` : ''}`);
}

main().then((code) => process.exit(code));
