const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Test working' });
});

// Super admin login route
app.post('/api/v1/super-admin/auth/login', (req, res) => {
  res.json({ success: true, message: 'Login endpoint working' });
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});