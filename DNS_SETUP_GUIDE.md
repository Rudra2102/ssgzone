# DNS Setup Guide for ssgzone.in

## Required DNS Records

### 1. Main Domain Records (ssgzone.in)

```
Type: A
Name: @
Value: YOUR_SERVER_IP
TTL: 3600

Type: A  
Name: mail
Value: YOUR_SERVER_IP
TTL: 3600

Type: MX
Name: @
Value: 10 mail.ssgzone.in
TTL: 3600
```

### 2. Wildcard Subdomain Records

```
Type: A
Name: *.lms
Value: YOUR_SERVER_IP
TTL: 3600

Type: A
Name: *.rupyo  
Value: YOUR_SERVER_IP
TTL: 3600

Type: MX
Name: *.lms
Value: 10 mail.ssgzone.in
TTL: 3600

Type: MX
Name: *.rupyo
Value: 10 mail.ssgzone.in  
TTL: 3600
```

### 3. Email Security Records

```
Type: TXT
Name: @
Value: v=spf1 include:ssgzone.in ~all
TTL: 3600

Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@ssgzone.in
TTL: 3600

Type: TXT
Name: default._domainkey
Value: [DKIM_PUBLIC_KEY] (Generated after server setup)
TTL: 3600
```

### 4. Web Interface Records

```
Type: CNAME
Name: admin
Value: ssgzone.in
TTL: 3600

Type: CNAME  
Name: webmail
Value: ssgzone.in
TTL: 3600
```

## Step-by-Step DNS Setup

### For Domain Registrar (where you bought ssgzone.in):

1. **Login to your domain registrar's control panel**
2. **Find DNS Management/DNS Zone Editor**
3. **Add each record above one by one**
4. **Replace YOUR_SERVER_IP with your actual server IP**

### Common Registrars:
- **GoDaddy**: DNS Management → DNS Records
- **Namecheap**: Domain List → Manage → Advanced DNS  
- **Cloudflare**: DNS → Records
- **Google Domains**: DNS → Custom Records

## Verification Commands

After adding DNS records, verify with these commands:

```bash
# Check A record
nslookup ssgzone.in

# Check MX record  
nslookup -type=MX ssgzone.in

# Check TXT record
nslookup -type=TXT ssgzone.in
```

## Important Notes

- DNS changes can take 24-48 hours to propagate globally
- Start with basic A and MX records first
- Add security records (SPF, DKIM, DMARC) after mail server is running
- Test with a subdomain first (e.g., test.lms.ssgzone.in)