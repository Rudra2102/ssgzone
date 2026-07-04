const crypto = require('crypto');

class DkimService {
  static generateDkimKeys() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    // Extract public key for DNS record
    const publicKeyBase64 = publicKey
      .replace(/-----BEGIN PUBLIC KEY-----/, '')
      .replace(/-----END PUBLIC KEY-----/, '')
      .replace(/\n/g, '');

    return {
      privateKey,
      publicKey: publicKeyBase64,
      dnsRecord: `v=DKIM1; k=rsa; p=${publicKeyBase64}`
    };
  }

  static async setupDkimForDomain(domain) {
    const dkimKeys = this.generateDkimKeys();
    
    // Store private key securely (in production, use proper key management)
    // For now, we'll return the DNS record to be created
    
    return {
      selector: 'default',
      domain: domain,
      dnsRecord: {
        type: 'TXT',
        name: `default._domainkey.${domain}`,
        value: dkimKeys.dnsRecord,
        ttl: 3600
      },
      privateKey: dkimKeys.privateKey
    };
  }
}

module.exports = DkimService;