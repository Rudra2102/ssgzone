const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { initChatSocket } = require('./websocket/chatSocket');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const saasRoutes = require('./routes/saas');
const saasAdminRoutes = require('./routes/saas-admin');
const tenantRoutes = require('./routes/tenant');
const userRoutes = require('./routes/user');
const tenantAdminRoutes = require('./routes/tenant-admin');
const superAdminRoutes = require('./routes/super-admin');
const adminRoutes = require('./routes/admin');
const webmailRoutes = require('./routes/webmail');
const communicationRoutes = require('./routes/communication');
const dashboardRoutes = require('./routes/dashboard');
const storageRoutes = require('./routes/storage');
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

// Security middleware
app.use(helmet({ frameguard: false }));
app.use(cors());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint working' });
});

// API routes
app.use('/api/saas-admin', saasAdminRoutes);
app.use('/api/v1/super-admin', superAdminRoutes);
app.use('/api/v1/tenant-admin', tenantAdminRoutes);
app.use('/api/v1/saas', saasRoutes);
app.use('/api/v1/tenant', tenantRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/webmail', webmailRoutes);
app.use('/api/v1/communication', communicationRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/storage', storageRoutes);
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

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling']
});
initChatSocket(io);
httpServer.listen(PORT, () => {
  console.log(`SSGzone API Gateway running on port ${PORT}`);
  console.log(`Socket.io WebSocket server active on port ${PORT}`);
  // Start scheduled jobs
  // retentionJob.start();
  // gdprDeletionJob.start();
});

module.exports = app;