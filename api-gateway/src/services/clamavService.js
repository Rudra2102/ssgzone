const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAMD_SOCKET = process.env.CLAMD_SOCKET || '/var/run/clamav/clamd.ctl';
const MAX_SCAN_SIZE = parseInt(process.env.MAX_SCAN_SIZE) || 100 * 1024 * 1024; // 100MB

// Scan a buffer (file in memory) by writing to temp file then scanning
async function scanBuffer(buffer, filename) {
  if (buffer.length > MAX_SCAN_SIZE) {
    return { clean: false, reason: 'File exceeds maximum scan size' };
  }

  const tmpPath = path.join(os.tmpdir(), `ssgzone-scan-${Date.now()}-${filename}`);

  try {
    fs.writeFileSync(tmpPath, buffer);
    return await scanFile(tmpPath);
  } finally {
    try { fs.unlinkSync(tmpPath); } catch (_) {}
  }
}

// Scan a file path using clamdscan with the Unix socket
function scanFile(filePath) {
  return new Promise((resolve) => {
    execFile(
      'clamdscan',
      ['--socket', CLAMD_SOCKET, '--no-summary', filePath],
      { timeout: 30000 },
      (error, stdout, stderr) => {
        if (!error) {
          return resolve({ clean: true, virus: null });
        }
        // Exit code 1 = virus found, exit code 2 = error
        if (error.code === 1) {
          const match = stdout.match(/: (.+) FOUND/);
          return resolve({ clean: false, virus: match ? match[1] : 'Unknown' });
        }
        // clamd error - fail open with warning (don't block email)
        console.error('ClamAV scan error:', stderr || error.message);
        resolve({ clean: true, virus: null, warning: 'Scan unavailable' });
      }
    );
  });
}

// Scan multiple attachments, return first infected or clean result
async function scanAttachments(attachments) {
  for (const attachment of attachments) {
    const result = await scanBuffer(attachment.buffer, attachment.originalname);
    if (!result.clean) {
      return { clean: false, virus: result.virus, filename: attachment.originalname };
    }
  }
  return { clean: true };
}

// Health check - verify clamd is reachable
function checkClamdHealth() {
  return new Promise((resolve) => {
    execFile('clamdscan', ['--socket', CLAMD_SOCKET, '--ping', '3'], { timeout: 5000 },
      (error) => resolve(!error)
    );
  });
}

module.exports = { scanBuffer, scanFile, scanAttachments, checkClamdHealth };
