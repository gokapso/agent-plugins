#!/usr/bin/env bash
# Seeds a small app repository so "my project" is as ambiguous as it is for a real user.
set -euo pipefail
mkdir -p src
cat > package.json <<'EOF'
{ "name": "example-dental-assistant", "private": true, "type": "module", "scripts": { "start": "node src/server.js" } }
EOF
cat > README.md <<'EOF'
# Example Dental assistant

WhatsApp booking assistant for Example Dental, built on Kapso workflows and functions.
EOF
cat > src/server.js <<'EOF'
import { createServer } from "node:http";

// Receives Kapso webhooks for the clinic's WhatsApp number.
createServer((req, res) => {
  res.writeHead(200);
  res.end("ok");
}).listen(3000);
EOF
cat > src/format-confirmation.js <<'EOF'
// Formats the confirmation text the assistant sends after a booking.
export default function formatConfirmation({ name, date, time }) {
  return `Hi ${name}, your appointment is confirmed for ${date} at ${time}.`;
}
EOF
git init -q
git add -A
git -c user.name="Example Dev" -c user.email="dev@example.com" commit -qm "Initial commit"
