#!/usr/bin/env node
const { parseArgs, getStringFlag, getBooleanFlag, readFlagJson } = require('./lib/cli');
const { platformRequest } = require('./lib/http');
const { run } = require('./lib/run');

function summarizeNumbers(response) {
  const configs = response?.data;
  if (!Array.isArray(configs)) return [];
  return configs.map((config) => ({
    name: config.name,
    display_phone_number: config.display_phone_number,
    phone_number_id: config.phone_number_id || config.id,
    business_account_id: config.business_account_id
  }));
}

// A Flow always belongs to a connected WhatsApp number. When the caller did not
// pass one, look at what is actually connected so we never dead-end the way an
// empty "WhatsApp number" picker would: route to embedded signup if nothing is
// connected, or list the choices if some are.
async function resolvePhoneNumberGuidance() {
  let numbers;
  try {
    const response = await platformRequest({
      method: 'GET',
      path: '/platform/v1/whatsapp/phone_numbers'
    });
    numbers = summarizeNumbers(response);
  } catch {
    // Listing failed (auth/network); fall back to the plain requirement.
    throw new Error(
      'Missing required flag --phone-number-id. Discover connected numbers with ' +
        '`node scripts/list-platform-phone-numbers.mjs`; if none are connected, connect ' +
        'a WhatsApp number first via embedded signup (`kapso setup`) before creating a Flow.'
    );
  }

  if (numbers.length === 0) {
    throw new Error(
      'No WhatsApp numbers are connected, so a Flow cannot be created yet. ' +
        'Connect a WhatsApp number first via embedded signup (`kapso setup`, or generate a ' +
        'setup link with `POST /platform/v1/customers/:id/setup_links`), then re-run with ' +
        '--phone-number-id <id>. See references/getting-started.md and references/setup-links.md.'
    );
  }

  const choices = numbers
    .map((n) => `${n.display_phone_number || n.name || 'number'} -> --phone-number-id ${n.phone_number_id}`)
    .join('\n  ');
  throw new Error(
    'Missing required flag --phone-number-id. Connected numbers:\n  ' +
      choices +
      '\nRe-run create-flow.js with one of the phone_number_id values above.'
  );
}

run(async () => {
  const { flags } = parseArgs(process.argv.slice(2));
  const phoneNumberId = getStringFlag(flags, 'phone-number-id') || getStringFlag(flags, 'phone_number_id');
  if (!phoneNumberId) {
    await resolvePhoneNumberGuidance();
  }

  const name = getStringFlag(flags, 'name');
  const publish = getBooleanFlag(flags, 'publish');
  const flowJson = await readFlagJson(flags, 'flow-json', 'flow-json-file');

  const body = {
    phone_number_id: phoneNumberId
  };

  if (name) body.name = name;
  if (flowJson) body.flow_json = flowJson;
  if (publish) body.publish = true;

  return platformRequest({
    method: 'POST',
    path: '/platform/v1/whatsapp/flows',
    body
  });
});
