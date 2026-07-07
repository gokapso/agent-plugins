const { kapsoConfigFromEnv, kapsoRequest } = require('./lib/triage/kapso-api');

function err(message, details) {
  return { ok: false, error: { message, details } };
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          usage: 'node scripts/log-search-catalog.js',
          env: ['KAPSO_API_BASE_URL', 'KAPSO_API_KEY']
        },
        null,
        2
      )
    );
    return 0;
  }

  try {
    const config = kapsoConfigFromEnv();
    const data = await kapsoRequest(config, '/platform/v1/log_search/catalog');
    console.log(JSON.stringify({ ok: true, data }, null, 2));
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify(err('Command failed', { message }), null, 2));
    return 1;
  }
}

main().then((code) => process.exit(code));
