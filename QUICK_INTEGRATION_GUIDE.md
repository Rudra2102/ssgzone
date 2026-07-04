# SSGzone Quick Integration Guide
## Developer Quick Reference

---

## 🚀 5-Minute Integration

### 1. Register Your SaaS App
```bash
curl -X POST https://api.ssgzone.in/v1/saas-apps \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "PEMS",
    "slug": "pems",
    "webhook_url": "https://your-app.com/webhook/ssgzone"
  }'
```

#### ⚠️ Webhook URL Setup:
**Pehle apne SaaS app mein webhook endpoint banayein:**

```javascript
// Step 1: Apne app mein webhook endpoint create karein
app.post('/webhook/ssgzone', (req, res) => {
  const { event, data } = req.body;
  
  // SSGzone se aane wale events handle karein
  console.log('SSGzone Event:', event, data);
  
  res.status(200).send('OK');
});
```

```python
# Python/Flask example
@app.route('/webhook/ssgzone', methods=['POST'])
def handle_ssgzone_webhook():
    data = request.json
    event = data.get('event')
    
    # Handle SSGzone events
    print(f'SSGzone Event: {event}')
    
    return 'OK', 200
```

**Agar webhook ready nahi hai toh:**
- Webhook URL field ko empty chhod sakte hain
- Baad mein update kar sakte hain jab endpoint ready ho
- Testing ke liye sandbox environment use karein

### 2. Get API Credentials
```json
{
  "app_id": "app_xxxxxxxxxx",
  "api_key": "ssg_live_xxxxxxxxxx", 
  "api_secret": "ssg_secret_xxxxxxxxxx"
}
```

### 3. Create Tenant
```bash
curl -X POST https://api.ssgzone.in/v1/tenants \
  -H "Authorization: Bearer API_KEY" \
  -d '{
    "company_name": "NABC Institute",
    "slug": "nabc",
    "admin_email": "admin@nabc.pems.ssgzone.in"
  }'
```

---

## 📧 Email Integration

### Send Email
```javascript
// Node.js
const response = await fetch('https://api.ssgzone.in/v1/email/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tenant_id: 'nabc',
    from: 'noreply@nabc.pems.ssgzone.in',
    to: 'user@nabc.pems.ssgzone.in',
    subject: 'Welcome to PEMS',
    html: '<h1>Welcome!</h1><p>Your account is ready.</p>'
  })
});
```

```python
# Python
import requests

response = requests.post('https://api.ssgzone.in/v1/email/send', 
  headers={'Authorization': f'Bearer {API_KEY}'},
  json={
    'tenant_id': 'nabc',
    'from': 'noreply@nabc.pems.ssgzone.in',
    'to': 'user@nabc.pems.ssgzone.in',
    'subject': 'Welcome to PEMS',
    'html': '<h1>Welcome!</h1><p>Your account is ready.</p>'
  }
)
```

---

## 📱 WhatsApp Integration

### Send WhatsApp Message
```javascript
const whatsappResponse = await fetch('https://api.ssgzone.in/v1/whatsapp/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tenant_id: 'nabc',
    to: '+919876543210',
    template: 'welcome_message',
    data: {
      name: 'Rahul Kumar',
      company: 'NABC Institute'
    }
  })
});
```

---

## 🔗 Essential API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/v1/email/send` | Send email |
| POST | `/v1/whatsapp/send` | Send WhatsApp |
| POST | `/v1/tenants/{id}/users` | Create user |
| GET | `/v1/tenants/{id}/stats` | Get tenant stats |
| POST | `/v1/webhooks/verify` | Verify webhook |

---

## 🎯 Webhook Events

### Handle Incoming Webhooks
```javascript
app.post('/webhook/ssgzone', (req, res) => {
  const { event, data } = req.body;
  
  switch(event) {
    case 'email.delivered':
      console.log(`Email delivered: ${data.message_id}`);
      break;
    case 'whatsapp.read':
      console.log(`WhatsApp read: ${data.message_id}`);
      break;
    case 'user.created':
      console.log(`New user: ${data.email}`);
      break;
  }
  
  res.status(200).send('OK');
});
```

---

## 🔐 Authentication

### API Key Usage
```javascript
const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
  'X-Tenant-ID': 'nabc' // Optional: for tenant-specific requests
};
```

---

## 📊 Common Use Cases

### 1. User Registration Email
```javascript
// When user registers in your SaaS app
await ssgzone.email.send({
  tenant_id: tenant.slug,
  from: `noreply@${tenant.slug}.${saas_app.slug}.ssgzone.in`,
  to: user.email,
  template: 'user_welcome',
  data: { name: user.name, login_url: 'https://app.com/login' }
});
```

### 2. WhatsApp Notification
```javascript
// Send WhatsApp for important updates
await ssgzone.whatsapp.send({
  tenant_id: tenant.slug,
  to: user.phone,
  template: 'payment_reminder',
  data: { amount: '₹5000', due_date: '2024-01-15' }
});
```

### 3. Bulk Email Campaign
```javascript
// Send to multiple users
const users = await getActiveUsers(tenant_id);
for (const user of users) {
  await ssgzone.email.send({
    tenant_id: tenant.slug,
    from: `marketing@${tenant.slug}.${saas_app.slug}.ssgzone.in`,
    to: user.email,
    template: 'monthly_newsletter',
    data: { name: user.name }
  });
}
```

---

## ⚡ Performance Tips

### 1. Batch Operations
```javascript
// Instead of individual calls, use batch
await ssgzone.email.sendBatch({
  tenant_id: 'nabc',
  messages: [
    { to: 'user1@nabc.pems.ssgzone.in', template: 'welcome' },
    { to: 'user2@nabc.pems.ssgzone.in', template: 'welcome' }
  ]
});
```

### 2. Async Processing
```javascript
// Use queues for high-volume sending
const emailQueue = new Queue('email-queue');
emailQueue.add('send-email', { tenant_id, email_data });
```

---

## 🐛 Error Handling

### Common Error Codes
```javascript
try {
  await ssgzone.email.send(emailData);
} catch (error) {
  switch(error.code) {
    case 'RATE_LIMIT_EXCEEDED':
      // Retry after delay
      break;
    case 'INVALID_TENANT':
      // Check tenant configuration
      break;
    case 'QUOTA_EXCEEDED':
      // Upgrade tenant plan
      break;
  }
}
```

---

## 🧪 Testing

### Sandbox Environment
```javascript
const ssgzone = new SSGzone({
  apiKey: 'ssg_test_xxxxxxxxxx',
  environment: 'sandbox' // Uses test endpoints
});
```

### Test Email Addresses
- `test@sandbox.ssgzone.in` - Always delivers
- `bounce@sandbox.ssgzone.in` - Always bounces
- `spam@sandbox.ssgzone.in` - Marked as spam

---

## 📱 Mobile Integration

### Deep Links for Mobile App
```javascript
// Generate mobile app deep link
const deepLink = `ssgzone://tenant/${tenant.slug}/email/${email_id}`;
```

---

## 🔧 Environment Variables

```bash
# .env file
SSGZONE_API_KEY=ssg_live_xxxxxxxxxx
SSGZONE_API_SECRET=ssg_secret_xxxxxxxxxx
SSGZONE_WEBHOOK_SECRET=whk_xxxxxxxxxx
SSGZONE_ENVIRONMENT=production
```

---

## 📞 Quick Support

- **Slack**: #ssgzone-integration
- **Email**: dev@ssgzone.in  
- **Docs**: https://docs.ssgzone.in
- **Status**: https://status.ssgzone.in

---

**🎯 Pro Tip: Start with sandbox environment, test thoroughly, then switch to production with proper error handling and monitoring.**