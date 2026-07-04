const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
// const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

console.log('Loading routes...');
const saasRoutes = require('./routes/saas');
const tenantRoutes = require('./routes/tenant');
const userRoutes = require('./routes/user');
const tenantAdminRoutes = require('./routes/tenant-admin');
console.log('Loading super-admin routes...');
const superAdminRoutes = require('./routes/super-admin');
console.log('Super-admin routes loaded successfully');
const adminRoutes = require('./routes/admin');
const webmailRoutes = require('./routes/webmail');
const oauthRoutes = require('./routes/oauth');
const groupsRoutes = require('./routes/groups');
const { router: autoresponderRoutes } = require('./routes/autoresponder');
// const webhooksRoutes = require('./routes/webhooks');
// const searchRoutes = require('./routes/search');
// const attachmentsRoutes = require('./routes/attachments');
// const retentionRoutes = require('./routes/retention');
// const metricsRoutes = require('./routes/metrics');
// const { router: signaturesRoutes } = require('./routes/signatures');
// const exportRoutes = require('./routes/export'); // Optional - Calendar service dependency
// const dmarcRoutes = require('./routes/dmarc');
// const auditRoutes = require('./routes/audit');
// const migrationRoutes = require('./routes/migration');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');
const { checkAPIUsage } = require('./middleware/usageRateLimit');
const { csrfProtection } = require('./middleware/security');
// const retentionJob = require('./jobs/retentionJob');
// const gdprDeletionJob = require('./jobs/gdprDeletionJob');

const app = express();
const PORT = process.env.API_PORT || 4000;

// Trust proxy for nginx (disabled)
// app.set('trust proxy', 1);

// Security middleware
// app.use(helmet());
app.use(cors());

// Rate limiting (disabled for debugging)
// Usage-based rate limiting (disabled for debugging)
// CSRF protection for state-changing operations (skip for auth routes)

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
// app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint working' });
});

// API routes
console.log('Registering super-admin routes...');
try {
  app.use('/api/v1/super-admin', superAdminRoutes);
  console.log('Super-admin routes registered successfully');
} catch (error) {
  console.error('Error registering super-admin routes:', error);
}
app.use('/api/v1/tenant-admin', tenantAdminRoutes);
app.use('/api/v1/saas', saasRoutes);
app.use('/api/v1/tenant', tenantRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/webmail', webmailRoutes);
// app.use('/api/v1/oauth', oauthRoutes);
// app.use('/api/v1/groups', groupsRoutes);
// app.use('/api/v1/autoresponder', autoresponderRoutes);
// app.use('/api/v1/webhooks', webhooksRoutes);
// app.use('/api/v1/search', searchRoutes);
// app.use('/api/v1/attachments', attachmentsRoutes);
// app.use('/api/v1/retention', retentionRoutes);
// app.use('/api/v1/metrics', metricsRoutes);
// app.use('/api/v1/signatures', signaturesRoutes);
// app.use('/api/v1/export', exportRoutes);
// app.use('/api/v1/dmarc', dmarcRoutes);
// app.use('/api/v1/audit', auditRoutes);
// app.use('/api/v1/migration', migrationRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`SSGzone API Gateway running on port ${PORT}`);
  
  // Start scheduled jobs
  // retentionJob.start();
  // gdprDeletionJob.start();
});

module.exports = app;