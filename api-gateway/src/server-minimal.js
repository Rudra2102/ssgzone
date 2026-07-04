const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

console.log('Starting minimal server...');

// Test route
app.get('/test', (req, res) => {
  console.log('Test route hit');
  res.json({ message: 'Test working' });
});

// Super admin login route
app.post('/api/v1/super-admin/auth/login', (req, res) => {
  console.log('Login route hit');
  res.json({ success: true, message: 'Login endpoint working' });
});

app.listen(PORT, () => {
  console.log(`Minimal server running on port ${PORT}`);
});

module.exports = app;