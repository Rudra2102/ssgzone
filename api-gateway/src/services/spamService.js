const net = require('net');

const SPAMD_HOST = process.env.SPAMD_HOST || 'localhost';
const SPAMD_PORT = parseInt(process.env.SPAMD_PORT) || 783;
const SPAM_THRESHOLD = parseFloat(process.env.SPAM_THRESHOLD) || 5.0;
const TIMEOUT_MS = 15000;

// Send raw email content to spamd and parse response
function checkSpam(rawEmail) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(SPAMD_PORT, SPAMD_HOST);
    const chunks = [];
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      socket.destroy();
      // Fail open - don't block email if spamd is slow
      resolve({ isSpam: false, score: 0, threshold: SPAM_THRESHOLD, warning: 'spamd timeout' });
    }, TIMEOUT_MS);

    socket.on('connect', () => {
      const content = Buffer.isBuffer(rawEmail) ? rawEmail : Buffer.from(rawEmail);
      const request = [
        `REPORT SPAMC/1.5`,
        `Content-length: ${content.length}`,
        `User: ssgzone`,
        ``,
        ``
      ].join('\r\n');

      socket.write(request);
      socket.write(content);
      socket.end();
    });

    socket.on('data', (chunk) => chunks.push(chunk));

    socket.on('end', () => {
      if (timedOut) return;
      clearTimeout(timer);

      const response = Buffer.concat(chunks).toString();
      resolve(parseResponse(response));
    });

    socket.on('error', (err) => {
      if (timedOut) return;
      clearTimeout(timer);
      // Fail open on connection error
      console.error('spamd connection error:', err.message);
      resolve({ isSpam: false, score: 0, threshold: SPAM_THRESHOLD, warning: 'spamd unavailable' });
    });
  });
}

function parseResponse(response) {
  const lines = response.split('\r\n');

  // Parse: Spam: True ; 8.3 / 5.0
  const spamLine = lines.find(l => l.startsWith('Spam:'));
  if (!spamLine) {
    return { isSpam: false, score: 0, threshold: SPAM_THRESHOLD, warning: 'unparseable response' };
  }

  const match = spamLine.match(/Spam:\s+(True|False)\s*;\s*([\d.]+)\s*\/\s*([\d.]+)/i);
  if (!match) {
    return { isSpam: false, score: 0, threshold: SPAM_THRESHOLD, warning: 'unparseable score' };
  }

  const isSpam = match[1].toLowerCase() === 'true';
  const score = parseFloat(match[2]);
  const threshold = parseFloat(match[3]);

  // Extract report rules if present
  const reportStart = response.indexOf('\r\n\r\n');
  const report = reportStart > -1 ? response.slice(reportStart + 4).trim() : '';

  return { isSpam, score, threshold, report };
}

// Check if spamd is reachable
function checkSpamdHealth() {
  return new Promise((resolve) => {
    const socket = net.createConnection(SPAMD_PORT, SPAMD_HOST);
    const timer = setTimeout(() => { socket.destroy(); resolve(false); }, 3000);

    socket.on('connect', () => {
      clearTimeout(timer);
      socket.write('PING SPAMC/1.5\r\n\r\n');
    });

    socket.on('data', (data) => {
      clearTimeout(timer);
      socket.destroy();
      resolve(data.toString().includes('PONG'));
    });

    socket.on('error', () => { clearTimeout(timer); resolve(false); });
  });
}

module.exports = { checkSpam, checkSpamdHealth, SPAM_THRESHOLD };
