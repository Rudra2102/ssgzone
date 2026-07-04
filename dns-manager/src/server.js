const express = require('express');
const CloudflareService = require('./services/CloudflareService');
const Route53Service = require('./services/Route53Service');
require('dotenv').config();

const app = express();
const PORT = process.env.DNS_PORT || 3005;

app.use(express.json());

const cloudflare = new CloudflareService();
const route53 = new Route53Service();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'DNS Manager' });
});

// Create DNS records for new tenant
app.post('/dns/provision/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const { domain, records } = req.body;
    
    let result;
    if (provider === 'cloudflare') {
      result = await cloudflare.createRecords(domain, records);
    } else if (provider === 'route53') {
      result = await route53.createRecords(domain, records);
    } else {
      return res.status(400).json({ error: 'Unsupported DNS provider' });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify DNS propagation
app.get('/dns/verify/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    const dns = require('dns').promises;
    
    const [mx, txt] = await Promise.all([
      dns.resolveMx(domain).catch(() => []),
      dns.resolveTxt(domain).catch(() => [])
    ]);
    
    res.json({
      success: true,
      data: { mx, txt, propagated: mx.length > 0 }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`DNS Manager running on port ${PORT}`);
});

module.exports = app;