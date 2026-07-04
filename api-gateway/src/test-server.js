const express = require('express');
const app = express();

app.use(express.json());

// Test if super-admin routes can be loaded
try {
  const superAdminRoutes = require('./routes/super-admin');
  app.use('/api/v1/super-admin', superAdminRoutes);
  console.log('✅ Super admin routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading super admin routes:', error.message);
  console.error('Stack:', error.stack);
}

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(4001, () => {
  console.log('Test server running on port 4001');
});