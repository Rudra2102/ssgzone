# SSGzone Mail - SaaS Integration Guide

## Overview

SSGzone Mail provides automatic user and tenant creation through API integration. When a new company or employee is created in your SaaS application, they automatically get SSGzone Mail accounts with auto-generated credentials.

## Authentication Flow

```
SaaS Application
    ↓
Create Tenant/User API Call
    ↓
SSGzone Validates SaaS Credentials
    ↓
Creates Tenant/User in Database
    ↓
Generates Temporary Password + JWT Token
    ↓
Returns Credentials to SaaS
    ↓
SaaS Stores Token/Password
    ↓
User Receives Login Credentials
    ↓
User Logs In (via Token or Password)
```

## API Endpoints

### 1. Create Tenant (Company)

**Endpoint:** `POST /api/v1/saas/integration/create-tenant`

**Purpose:** Create a new tenant company in SSGzone when a company is created in SaaS

**Authentication:** SaaS App ID + Secret Key

**Request:**
```json
{
  "saas_app_id": "app_123",
  "saas_app_secret": "secret_key_xyz",
  "tenant_data": {
    "company_name": "Acme Corporation",
    "company_slug": "acme-corp",
    "admin_email": "admin@acmecorp.com",
    "admin_name": "John Doe",
    "admin_phone": "+1-555-0123",
    "company_website": "https://acmecorp.com",
    "industry": "Technology",
    "employees_count": 50
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tenant created successfully",
  "data": {
    "tenant_id": "tenant_abc123",
    "tenant_name": "Acme Corporation",
    "tenant_slug": "acme-corp",
    "admin_email": "admin@acmecorp.com",
    "admin_username": "acme-corp_admin",
    "temporary_password": "Tr0pic@lSunset#2024",
    "login_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "login_url": "https://ssgzone.in/login?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "instructions": {
      "step1": "Use the temporary_password to login for the first time",
      "step2": "Change password immediately after first login",
      "step3": "Or use login_token for direct auto-login (valid for 7 days)",
      "step4": "Share login credentials with tenant admin"
    }
  }
}
```

### 2. Create User (Employee)

**Endpoint:** `POST /api/v1/saas/integration/create-user`

**Purpose:** Create a new user/employee in SSGzone when an employee is added in SaaS

**Authentication:** SaaS App ID + Secret Key

**Request:**
```json
{
  "saas_app_id": "app_123",
  "saas_app_secret": "secret_key_xyz",
  "tenant_slug": "acme-corp",
  "user_data": {
    "email": "john.smith@acmecorp.com",
    "first_name": "John",
    "last_name": "Smith",
    "employee_id": "EMP_001",
    "department": "Engineering",
    "designation": "Senior Developer"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user_id": "user_xyz789",
    "email": "john.smith@acmecorp.com",
    "username": "john_smith_a1b2c",
    "temporary_password": "SecurePass@2024#",
    "login_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "login_url": "https://ssgzone.in/login?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "instructions": {
      "step1": "Use the temporary_password to login for the first time",
      "step2": "Change password immediately after first login",
      "step3": "Or use login_token for direct auto-login (valid for 7 days)",
      "step4": "Share login credentials with employee"
    }
  }
}
```

### 3. Token-Based Login

**Endpoint:** `POST /api/v1/saas/integration/token-login`

**Purpose:** Auto-login using JWT token (no password needed)

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_xyz789",
      "email": "john.smith@acmecorp.com",
      "username": "john_smith_a1b2c",
      "first_name": "John",
      "last_name": "Smith",
      "role": "user",
      "type": "user"
    }
  }
}
```

## Implementation Steps

### Step 1: Register Your SaaS Application

Contact SSGzone admin to register your SaaS application and get:
- `saas_app_id` - Unique identifier for your app
- `saas_app_secret` - Secret key for authentication

### Step 2: Store Credentials Securely

Store these credentials in your SaaS backend environment variables:
```
SSGZONE_APP_ID=app_123
SSGZONE_APP_SECRET=secret_key_xyz
SSGZONE_API_URL=https://api.ssgzone.in
```

### Step 3: Call Create Tenant API

When a new company is created in your SaaS:

```javascript
// Node.js Example
const createTenant = async (companyData) => {
  const response = await fetch(
    `${process.env.SSGZONE_API_URL}/api/v1/saas/integration/create-tenant`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        saas_app_id: process.env.SSGZONE_APP_ID,
        saas_app_secret: process.env.SSGZONE_APP_SECRET,
        tenant_data: {
          company_name: companyData.name,
          company_slug: companyData.slug,
          admin_email: companyData.adminEmail,
          admin_name: companyData.adminName,
          company_website: companyData.website,
          industry: companyData.industry,
          employees_count: companyData.employeeCount
        }
      })
    }
  );

  const result = await response.json();
  
  if (result.success) {
    // Store in your database
    await db.companies.update(companyData.id, {
      ssgzone_tenant_id: result.data.tenant_id,
      ssgzone_admin_token: result.data.login_token,
      ssgzone_admin_password: result.data.temporary_password
    });

    // Send credentials to admin
    await sendEmail(result.data.admin_email, {
      subject: 'Your SSGzone Mail Account',
      body: `
        Welcome to SSGzone Mail!
        
        Username: ${result.data.admin_username}
        Temporary Password: ${result.data.temporary_password}
        
        Or login directly: ${result.data.login_url}
        
        Please change your password after first login.
      `
    });
  }
};
```

### Step 4: Call Create User API

When a new employee is added to a company:

```javascript
const createUser = async (employeeData, companySlug) => {
  const response = await fetch(
    `${process.env.SSGZONE_API_URL}/api/v1/saas/integration/create-user`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        saas_app_id: process.env.SSGZONE_APP_ID,
        saas_app_secret: process.env.SSGZONE_APP_SECRET,
        tenant_slug: companySlug,
        user_data: {
          email: employeeData.email,
          first_name: employeeData.firstName,
          last_name: employeeData.lastName,
          employee_id: employeeData.id,
          department: employeeData.department,
          designation: employeeData.designation
        }
      })
    }
  );

  const result = await response.json();
  
  if (result.success) {
    // Store in your database
    await db.employees.update(employeeData.id, {
      ssgzone_user_id: result.data.user_id,
      ssgzone_login_token: result.data.login_token,
      ssgzone_password: result.data.temporary_password
    });

    // Send credentials to employee
    await sendEmail(result.data.email, {
      subject: 'Your SSGzone Mail Account',
      body: `
        Welcome to SSGzone Mail!
        
        Email: ${result.data.email}
        Username: ${result.data.username}
        Temporary Password: ${result.data.temporary_password}
        
        Or login directly: ${result.data.login_url}
        
        Please change your password after first login.
      `
    });
  }
};
```

### Step 5: Handle User Deletion

When a user is deleted in SaaS, disable their SSGzone account:

```javascript
const disableUser = async (ssgzoneUserId) => {
  // Call SSGzone API to disable user
  // (API endpoint to be created)
};
```

## Security Considerations

1. **Store Secrets Securely**
   - Never expose `saas_app_secret` in frontend code
   - Use environment variables
   - Rotate secrets regularly

2. **Validate Responses**
   - Always check `success` field
   - Handle errors appropriately
   - Log failed API calls

3. **Token Management**
   - Tokens expire after 7 days
   - Store tokens securely
   - Don't expose tokens in URLs (use POST instead)

4. **Password Management**
   - Temporary passwords are one-time use
   - Users must change password on first login
   - Never store temporary passwords in logs

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Invalid SaaS credentials | Wrong app_id or secret | Verify credentials in environment |
| Tenant not found | Invalid tenant_slug | Check tenant_slug spelling |
| User already exists | Email already registered | Use different email or update existing user |
| Missing required fields | Incomplete request data | Verify all required fields are present |
| Invalid or expired token | Token expired or tampered | Request new token from create-tenant/user API |

### Error Response Example

```json
{
  "success": false,
  "error": "Invalid SaaS credentials",
  "details": "The provided app_id and secret_key do not match"
}
```

## Testing

### Test Credentials

For testing, use:
```
saas_app_id: test_app_123
saas_app_secret: test_secret_xyz
```

### Test Requests

```bash
# Create Tenant
curl -X POST https://api.ssgzone.in/api/v1/saas/integration/create-tenant \
  -H "Content-Type: application/json" \
  -d '{
    "saas_app_id": "test_app_123",
    "saas_app_secret": "test_secret_xyz",
    "tenant_data": {
      "company_name": "Test Company",
      "company_slug": "test-company",
      "admin_email": "admin@testcompany.com",
      "admin_name": "Test Admin"
    }
  }'

# Create User
curl -X POST https://api.ssgzone.in/api/v1/saas/integration/create-user \
  -H "Content-Type: application/json" \
  -d '{
    "saas_app_id": "test_app_123",
    "saas_app_secret": "test_secret_xyz",
    "tenant_slug": "test-company",
    "user_data": {
      "email": "john@testcompany.com",
      "first_name": "John",
      "last_name": "Doe"
    }
  }'
```

## Support

For integration support:
- Email: integration@ssgzone.in
- Documentation: https://docs.ssgzone.in
- API Status: https://status.ssgzone.in
