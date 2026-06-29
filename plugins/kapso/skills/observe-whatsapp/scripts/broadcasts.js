const { hasHelpFlag, parseFlags } = require('./lib/triage/args');
const { kapsoConfigFromEnv, kapsoRequest } = require('./lib/triage/kapso-api');

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
          usage: [
            'List broadcasts:   node scripts/broadcasts.js [--status <draft|sending|completed|failed>] [--phone-number-id <id>] [--created-after <iso>] [--created-before <iso>] [--per-page <n>] [--page <n>]',
            'Get one broadcast: node scripts/broadcasts.js --broadcast-id <id>',
            'List recipients:   node scripts/broadcasts.js --broadcast-id <id> --recipients [--failed-only] [--per-page <n>] [--page <n>]'
          ],
          notes: [
            'Broadcast data lives in the platform API, not PostHog analytics.',
            'Failed recipients carry error_message and error_details (Meta error payload with numeric code).',
            'Map error codes (e.g. 131049 marketing cap) using references/message-debugging-reference.md.',
            '--failed-only filters the returned recipients client-side (the API has no status filter).'
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
    const broadcastId = flags['broadcast-id'];
    const wantsRecipients = flags.recipients === true || flags.recipients === 'true';

    if (wantsRecipients && (!broadcastId || broadcastId === true)) {
      throw new Error('--recipients requires --broadcast-id <id>');
    }

    const config = kapsoConfigFromEnv();

    if (wantsRecipients) {
      const params = new URLSearchParams();
      if (flags['per-page']) params.set('per_page', flags['per-page']);
      if (flags.page) params.set('page', flags.page);

      const suffix = params.toString();
      const path = `/platform/v1/whatsapp/broadcasts/${encodeURIComponent(broadcastId)}/recipients${
        suffix ? `?${suffix}` : ''
      }`;
      const response = await kapsoRequest(config, path);

      const failedOnly = flags['failed-only'] === true || flags['failed-only'] === 'true';
      if (failedOnly && response && Array.isArray(response.data)) {
        const filtered = response.data.filter((recipient) => isFailedRecipient(recipient));
        console.log(
          JSON.stringify(
            { ok: true, broadcast_id: broadcastId, failed_only: true, data: filtered, meta: response.meta },
            null,
            2
          )
        );
        return 0;
      }

      console.log(JSON.stringify({ ok: true, broadcast_id: broadcastId, data: response }, null, 2));
      return 0;
    }

    if (broadcastId && broadcastId !== true) {
      const path = `/platform/v1/whatsapp/broadcasts/${encodeURIComponent(broadcastId)}`;
      const data = await kapsoRequest(config, path);
      console.log(JSON.stringify({ ok: true, data }, null, 2));
      return 0;
    }

    const params = new URLSearchParams();
    if (flags.status) params.set('status', flags.status);
    if (flags['phone-number-id']) params.set('phone_number_id', flags['phone-number-id']);
    if (flags['created-after']) params.set('created_after', flags['created-after']);
    if (flags['created-before']) params.set('created_before', flags['created-before']);
    if (flags['per-page']) params.set('per_page', flags['per-page']);
    if (flags.page) params.set('page', flags.page);

    const suffix = params.toString();
    const data = await kapsoRequest(
      config,
      `/platform/v1/whatsapp/broadcasts${suffix ? `?${suffix}` : ''}`
    );

    console.log(JSON.stringify({ ok: true, data }, null, 2));
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify(err('Command failed', { message }), null, 2));
    return 1;
  }
}

function isFailedRecipient(recipient) {
  if (!recipient || typeof recipient !== 'object') return false;
  if (recipient.failed_at) return true;
  if (recipient.error_message || recipient.error_details) return true;
  const status = String(recipient.status || '').toLowerCase();
  return status === 'failed';
}

main().then((code) => process.exit(code));
