# SSGhub Mail Integration Guide

## Quick Integration Overview

### What You Need:
1. **API Key** - Get from SSGhub Mail after registering your SaaS
2. **API Endpoint** - `http://YOUR_SERVER_IP:4000` or `https://api.ssgzone.in`
3. **Your Software Details** - Name and slug (e.g., "My LMS" → slug: "lms")

## Step 1: Register Your Software

### Option A: Using API
```bash
curl -X POST http://YOUR_SERVER_IP:4000/api/v1/saas/register \
  -H "Content-Type: application/json" \
  -d '{
    "saas_name": "My Learning Management System",
    "saas_slug": "lms"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "saas_slug": "lms",
    "api_key": "sk_live_abc123xyz789...",
    "status": "active"
  }
}
```

**SAVE THIS API KEY - You'll need it for all requests!**

### Option B: Using Admin Portal
1. Go to `http://YOUR_SERVER_IP:4001`
2. Login as admin
3. Navigate to "SaaS Applications"
4. Click "Add New"
5. Enter name and slug
6. Copy the generated API key

## Step 2: Integration Code Examples

### Node.js / Express Integration

#### Install SDK:
```bash
npm install axios
```

#### Create Mail Service:
```javascript
// services/mailService.js
const axios = require('axios');

class MailService {
  constructor() {
    this.apiKey = 'YOUR_API_KEY';
    this.baseUrl = 'http://YOUR_SERVER_IP:4000';
    this.saasSlug = 'lms'; // Your SaaS slug
  }

  // Create email account when user signs up
  async createUserEmail(tenantSlug, firstName, lastName, password) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/v1/user/create`, {
        tenant_slug: tenantSlug,
        saas_slug: this.saasSlug,
        first_name: firstName,
        last_name: lastName,
        password: password
      }, {
        headers: { 'X-API-Key': this.apiKey }
      });
      
      return response.data.data.email;
    } catch (error) {
      console.error('Email creation failed:', error.response?.data);
      throw error;
    }
  }

  // Create tenant (company/organization)
  async createTenant(companyName, tenantSlug) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/v1/tenant/provision`, {
        saas_slug: this.saasSlug,
        company_name: companyName,
        tenant_slug: tenantSlug
      }, {
        headers: { 'X-API-Key': this.apiKey }
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Tenant creation failed:', error.response?.data);
      throw error;
    }
  }

  // Suspend user email
  async suspendUser(email) {
    try {
      await axios.post(`${this.baseUrl}/api/v1/user/suspend`, {
        email: email
      }, {
        headers: { 'X-API-Key': this.apiKey }
      });
    } catch (error) {
      console.error('User suspension failed:', error.response?.data);
      throw error;
    }
  }

  // Delete user email
  async deleteUser(email) {
    try {
      await axios.delete(`${this.baseUrl}/api/v1/user/delete`, {
        data: { email: email },
        headers: { 'X-API-Key': this.apiKey }
      });
    } catch (error) {
      console.error('User deletion failed:', error.response?.data);
      throw error;
    }
  }
}

module.exports = new MailService();
```

#### Usage in Your Application:
```javascript
// routes/users.js
const mailService = require('./services/mailService');

// When user registers
app.post('/register', async (req, res) => {
  const { firstName, lastName, companySlug, password } = req.body;
  
  try {
    // Create user in your database first
    const user = await YourUserModel.create({
      firstName,
      lastName,
      companySlug
    });
    
    // Create email account
    const email = await mailService.createUserEmail(
      companySlug,
      firstName,
      lastName,
      password
    );
    
    // Update user with email
    user.email = email;
    await user.save();
    
    res.json({ 
      success: true, 
      email: email,
      message: `Email created: ${email}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// When company/organization registers
app.post('/company/register', async (req, res) => {
  const { companyName, companySlug } = req.body;
  
  try {
    const tenant = await mailService.createTenant(companyName, companySlug);
    
    res.json({ 
      success: true, 
      domain: tenant.domain,
      message: `Email domain created: ${tenant.domain}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### PHP / Laravel Integration

#### Create Mail Service:
```php
<?php
// app/Services/MailService.php
namespace App\Services;

use Illuminate\Support\Facades\Http;

class MailService
{
    private $apiKey;
    private $baseUrl;
    private $saasSlug;

    public function __construct()
    {
        $this->apiKey = env('SSGHUB_API_KEY');
        $this->baseUrl = env('SSGHUB_API_URL', 'http://YOUR_SERVER_IP:4000');
        $this->saasSlug = env('SSGHUB_SAAS_SLUG', 'lms');
    }

    public function createUserEmail($tenantSlug, $firstName, $lastName, $password)
    {
        $response = Http::withHeaders([
            'X-API-Key' => $this->apiKey,
            'Content-Type' => 'application/json'
        ])->post("{$this->baseUrl}/api/v1/user/create", [
            'tenant_slug' => $tenantSlug,
            'saas_slug' => $this->saasSlug,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'password' => $password
        ]);

        return $response->json()['data']['email'];
    }

    public function createTenant($companyName, $tenantSlug)
    {
        $response = Http::withHeaders([
            'X-API-Key' => $this->apiKey,
            'Content-Type' => 'application/json'
        ])->post("{$this->baseUrl}/api/v1/tenant/provision", [
            'saas_slug' => $this->saasSlug,
            'company_name' => $companyName,
            'tenant_slug' => $tenantSlug
        ]);

        return $response->json()['data'];
    }

    public function suspendUser($email)
    {
        Http::withHeaders([
            'X-API-Key' => $this->apiKey
        ])->post("{$this->baseUrl}/api/v1/user/suspend", [
            'email' => $email
        ]);
    }
}
```

#### Add to .env:
```env
SSGHUB_API_KEY=your_api_key_here
SSGHUB_API_URL=http://YOUR_SERVER_IP:4000
SSGHUB_SAAS_SLUG=lms
```

#### Usage in Controller:
```php
<?php
// app/Http/Controllers/UserController.php
namespace App\Http\Controllers;

use App\Services\MailService;

class UserController extends Controller
{
    protected $mailService;

    public function __construct(MailService $mailService)
    {
        $this->mailService = $mailService;
    }

    public function register(Request $request)
    {
        // Create user in your database
        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'company_slug' => $request->company_slug
        ]);

        // Create email account
        $email = $this->mailService->createUserEmail(
            $request->company_slug,
            $request->first_name,
            $request->last_name,
            $request->password
        );

        $user->email = $email;
        $user->save();

        return response()->json([
            'success' => true,
            'email' => $email
        ]);
    }
}
```

### Python / Django Integration

#### Create Mail Service:
```python
# services/mail_service.py
import requests

class MailService:
    def __init__(self):
        self.api_key = 'YOUR_API_KEY'
        self.base_url = 'http://YOUR_SERVER_IP:4000'
        self.saas_slug = 'lms'
        self.headers = {
            'X-API-Key': self.api_key,
            'Content-Type': 'application/json'
        }

    def create_user_email(self, tenant_slug, first_name, last_name, password):
        data = {
            'tenant_slug': tenant_slug,
            'saas_slug': self.saas_slug,
            'first_name': first_name,
            'last_name': last_name,
            'password': password
        }
        
        response = requests.post(
            f'{self.base_url}/api/v1/user/create',
            json=data,
            headers=self.headers
        )
        
        return response.json()['data']['email']

    def create_tenant(self, company_name, tenant_slug):
        data = {
            'saas_slug': self.saas_slug,
            'company_name': company_name,
            'tenant_slug': tenant_slug
        }
        
        response = requests.post(
            f'{self.base_url}/api/v1/tenant/provision',
            json=data,
            headers=self.headers
        )
        
        return response.json()['data']

    def suspend_user(self, email):
        requests.post(
            f'{self.base_url}/api/v1/user/suspend',
            json={'email': email},
            headers=self.headers
        )

mail_service = MailService()
```

#### Usage in Views:
```python
# views.py
from django.http import JsonResponse
from .services.mail_service import mail_service

def register_user(request):
    first_name = request.POST.get('first_name')
    last_name = request.POST.get('last_name')
    company_slug = request.POST.get('company_slug')
    password = request.POST.get('password')
    
    # Create user in your database
    user = User.objects.create(
        first_name=first_name,
        last_name=last_name,
        company_slug=company_slug
    )
    
    # Create email account
    email = mail_service.create_user_email(
        company_slug,
        first_name,
        last_name,
        password
    )
    
    user.email = email
    user.save()
    
    return JsonResponse({
        'success': True,
        'email': email
    })
```

## Step 3: Common Integration Scenarios

### Scenario 1: LMS (Learning Management System)
```
School registers → Create tenant: school.lms.ssgzone.in
Student enrolls → Create email: john.doe@school.lms.ssgzone.in
Teacher joins → Create email: jane.smith@school.lms.ssgzone.in
```

### Scenario 2: HRMS (HR Management System)
```
Company registers → Create tenant: company.hrms.ssgzone.in
Employee joins → Create email: first.last@company.hrms.ssgzone.in
Employee leaves → Suspend/Delete email
```

### Scenario 3: Multi-tenant SaaS
```
Client signs up → Create tenant: client.yourapp.ssgzone.in
User added → Create email: user@client.yourapp.ssgzone.in
```

## Step 4: Email Format Structure

Your users will get emails in this format:
```
firstname.lastname@company.yourapp.ssgzone.in
```

**Examples:**
- `john.doe@nabc.lms.ssgzone.in`
- `jane.smith@techcorp.hrms.ssgzone.in`
- `amit.kumar@school123.lms.ssgzone.in`

## Step 5: Embed Webmail (Optional)

Add webmail to your application:

```html
<!-- In your application's HTML -->
<iframe 
  src="http://YOUR_SERVER_IP:4002?email=user@company.lms.ssgzone.in" 
  width="100%" 
  height="600px"
  frameborder="0">
</iframe>
```

## Complete API Reference

### Create Tenant
```
POST /api/v1/tenant/provision
Headers: X-API-Key: YOUR_API_KEY
Body: {
  "saas_slug": "lms",
  "company_name": "NABC School",
  "tenant_slug": "nabc"
}
```

### Create User
```
POST /api/v1/user/create
Headers: X-API-Key: YOUR_API_KEY
Body: {
  "tenant_slug": "nabc",
  "saas_slug": "lms",
  "first_name": "John",
  "last_name": "Doe",
  "password": "secure_password"
}
```

### Suspend User
```
POST /api/v1/user/suspend
Headers: X-API-Key: YOUR_API_KEY
Body: {
  "email": "john.doe@nabc.lms.ssgzone.in"
}
```

### Delete User
```
DELETE /api/v1/user/delete
Headers: X-API-Key: YOUR_API_KEY
Body: {
  "email": "john.doe@nabc.lms.ssgzone.in"
}
```

### Get User Info
```
GET /api/v1/user/info?email=john.doe@nabc.lms.ssgzone.in
Headers: X-API-Key: YOUR_API_KEY
```

## Testing Your Integration

### Test Script (Node.js):
```javascript
const axios = require('axios');

const API_KEY = 'YOUR_API_KEY';
const BASE_URL = 'http://YOUR_SERVER_IP:4000';

async function testIntegration() {
  try {
    // 1. Create tenant
    console.log('Creating tenant...');
    const tenant = await axios.post(`${BASE_URL}/api/v1/tenant/provision`, {
      saas_slug: 'lms',
      company_name: 'Test School',
      tenant_slug: 'testschool'
    }, {
      headers: { 'X-API-Key': API_KEY }
    });
    console.log('Tenant created:', tenant.data.data.domain);

    // 2. Create user
    console.log('Creating user...');
    const user = await axios.post(`${BASE_URL}/api/v1/user/create`, {
      tenant_slug: 'testschool',
      saas_slug: 'lms',
      first_name: 'Test',
      last_name: 'User',
      password: 'testpass123'
    }, {
      headers: { 'X-API-Key': API_KEY }
    });
    console.log('User created:', user.data.data.email);

    console.log('✅ Integration test successful!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testIntegration();
```

## Next Steps

1. **Register your SaaS** and get API key
2. **Choose integration code** for your tech stack
3. **Test with sample data** first
4. **Integrate into user registration flow**
5. **Add email management features** (suspend, delete, etc.)

Your users will automatically get professional email addresses when they sign up! 🎉