# SSGzone Mail - Independent Email Service Platform

## Overview
SSGzone Mail is an API-first, scalable email service platform that provides custom, dedicated email accounts for multi-tenant SaaS applications using the ssgzone.in domain.

## Email Structure
```
username@tenant_slug.saas_slug.ssgzone.in
```

### Examples
- `amit.shah@nabc.lms.ssgzone.in`
- `ajay.singh@abcdevelopers.rupyo.ssgzone.in`

## Architecture Components

### 1. API Gateway (`/api-gateway`)
- RESTful API for SaaS integration
- Authentication & authorization
- Rate limiting & monitoring

### 2. Mail Server (`/mail-server`)
- SMTP/IMAP/POP3 protocols
- Mail routing & delivery
- Security & spam filtering

### 3. Admin Portal (`/admin-portal`)
- System administration dashboard
- Domain & DNS management
- Analytics & monitoring

### 4. Webmail Client (`/webmail-client`)
- Embeddable webmail interface
- API for SaaS integration
- Mobile-responsive design

### 5. DNS Manager (`/dns-manager`)
- Automated DNS record management
- MX, SPF, DKIM configuration
- Subdomain provisioning

### 6. Database (`/database`)
- Multi-tenant data structure
- User & domain management
- Audit logs & analytics

## Quick Start
1. Configure environment variables
2. Set up database
3. Start services
4. Register first SaaS application

## API Documentation
See `/docs/api.md` for complete API reference.