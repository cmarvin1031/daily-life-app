#!/usr/bin/env node
// One-time helper: obtains the Google OAuth *refresh token* that the
// sync-google-calendar Edge Function needs (README.md, "Google Calendar sync").
// Equivalent to the OAuth Playground flow, but self-contained:
//
//   1. In Google Cloud -> Credentials -> your OAuth client, add
//      http://localhost:53682/callback under "Authorized redirect URIs".
//   2. Run:  node scripts/get-google-refresh-token.mjs
//   3. Paste the Client ID and Client secret when prompted, approve in the
//      browser tab that opens, and copy the refresh token it prints.
//
// Nothing is stored or sent anywhere except to Google's token endpoint.
// Needs Node 18+ (for built-in fetch).

import http from 'node:http';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { exec } from 'node:child_process';

const PORT = 53682;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

// Reads a line without echoing it, so the secret doesn't end up in terminal
// scrollback or screenshots. Falls back to a visible prompt when stdin isn't
// a terminal (e.g. piped input).
function askHidden(promptText) {
  if (!stdin.isTTY) {
    const rl = readline.createInterface({ input: stdin, output: stdout });
    return rl.question(promptText).finally(() => rl.close());
  }
  return new Promise((resolve) => {
    stdout.write(promptText);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let value = '';
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '0003') process.exit(1); // Ctrl+C
        if (ch === '\r' || ch === '\n') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          stdout.write('\n');
          resolve(value);
          return;
        }
        if (ch === '007f' || ch === '\b') value = value.slice(0, -1); // Backspace (DEL on most terminals)
        else value += ch;
      }
    };
    stdin.on('data', onData);
  });
}

const rl = readline.createInterface({ input: stdin, output: stdout });
const clientId = (await rl.question('Google OAuth Client ID: ')).trim();
rl.close();
const clientSecret = (await askHidden('Google OAuth Client secret (hidden as you type): ')).trim();

if (!clientId || !clientSecret) {
  console.error('Both values are required.');
  process.exit(1);
}

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.search = new URLSearchParams({
  client_id: clientId,
  redirect_uri: REDIRECT_URI,
  response_type: 'code',
  scope: SCOPE,
  access_type: 'offline', // <- this is what makes Google issue a refresh token
  prompt: 'consent', //     <- and this guarantees one even if you've approved before
}).toString();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  if (url.pathname !== '/callback') {
    res.writeHead(404).end();
    return;
  }

  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  if (error || !code) {
    res.end(`Authorization failed: ${error || 'no code returned'}. You can close this tab.`);
    console.error(`\nAuthorization failed: ${error || 'no code returned'}`);
    server.close();
    process.exit(1);
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });
  const tokens = await tokenRes.json();

  if (!tokenRes.ok || !tokens.refresh_token) {
    res.end('Token exchange failed. See the terminal.');
    console.error('\nToken exchange failed:', JSON.stringify(tokens, null, 2));
    server.close();
    process.exit(1);
  }

  res.end('All done — you can close this tab and go back to the terminal.');
  console.log('\n✓ Success. Your refresh token (paste it into the GOOGLE_REFRESH_TOKEN secret in Supabase):\n');
  console.log(tokens.refresh_token);
  console.log('\nTreat it like a password. It does not expire unless you revoke access at myaccount.google.com/permissions.');
  server.close();
});

server.listen(PORT, () => {
  console.log(`\nOpening Google's consent screen in your browser. If it doesn't open, visit:\n\n${authUrl.href}\n`);
  console.log('Waiting for you to approve...');
  const cmd =
    process.platform === 'win32'
      ? `start "" "${authUrl.href}"`
      : process.platform === 'darwin'
        ? `open "${authUrl.href}"`
        : `xdg-open "${authUrl.href}"`;
  exec(cmd, () => {}); // best effort; the URL is printed above regardless
});
