# DigitalOcean Setup Guide for SSGhub Mail

## Step 1: DigitalOcean Account Setup

### 1.1 Sign Up
1. Go to **https://www.digitalocean.com**
2. Click **"Sign up"**
3. Enter your email and create password
4. Verify your email address
5. Add payment method (credit card required)

### 1.2 Get $200 Free Credit
- Use referral link: **https://m.do.co/c/[referral-code]**
- Or apply promo code during signup
- You get $200 credit valid for 60 days

## Step 2: Create Your Server (Droplet)

### 2.1 Create New Droplet
1. Click **"Create"** → **"Droplets"**
2. Choose **Ubuntu 22.04 LTS**
3. Select **Basic Plan**
4. Choose **Regular Intel** CPU
5. Select **$48/month** (8GB RAM, 4 CPUs, 160GB SSD)

### 2.2 Server Configuration
```
Operating System: Ubuntu 22.04 LTS
Plan: Basic
CPU: Regular Intel
Size: $48/month
- 8 GB Memory
- 4 Intel vCPUs  
- 160 GB SSD Disk
- 5 TB Transfer
```

### 2.3 Additional Options
1. **Datacenter Region:** Choose closest to your users
   - Bangalore, India (recommended for India)
   - Singapore (good for Asia)
   - New York (good for global)

2. **Authentication:** 
   - Select **"Password"**
   - Create strong root password (save it safely!)

3. **Hostname:** `ssgzone-mail-server`

4. Click **"Create Droplet"**

## Step 3: Get Your Server Details

### 3.1 Note Down Server Info
After droplet creation (takes 2-3 minutes):
```
Server IP: [COPY THIS - e.g., 164.90.xxx.xxx]
Username: root
Password: [YOUR_PASSWORD]
```

### 3.2 Test Connection
**Windows (using PuTTY):**
1. Download PuTTY from https://putty.org
2. Open PuTTY
3. Enter your server IP
4. Port: 22
5. Click "Open"
6. Login as: `root`
7. Password: [YOUR_PASSWORD]

**Windows (using built-in SSH):**
```cmd
ssh root@YOUR_SERVER_IP
```

## Step 4: Initial Server Setup

### 4.1 Update System
```bash
apt update && apt upgrade -y
```

### 4.2 Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### 4.3 Install Docker Compose
```bash
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 4.4 Install Git
```bash
apt install git -y
```

### 4.5 Create Swap File (Important for 8GB RAM)
```bash
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

## Step 5: Configure DNS at DigitalOcean

### 5.1 Add Domain to DigitalOcean
1. Go to **Networking** → **Domains**
2. Click **"Add Domain"**
3. Enter: `ssgzone.in`
4. Select your droplet
5. Click **"Add Domain"**

### 5.2 Add DNS Records
Click on `ssgzone.in` domain, then add these records:

```
Type: A     | Name: @        | Value: YOUR_SERVER_IP    | TTL: 3600
Type: A     | Name: mail     | Value: YOUR_SERVER_IP    | TTL: 3600
Type: A     | Name: admin    | Value: YOUR_SERVER_IP    | TTL: 3600
Type: A     | Name: webmail  | Value: YOUR_SERVER_IP    | TTL: 3600
Type: A     | Name: *.lms    | Value: YOUR_SERVER_IP    | TTL: 3600
Type: A     | Name: *.rupyo  | Value: YOUR_SERVER_IP    | TTL: 3600

Type: MX    | Name: @        | Value: mail.ssgzone.in   | Priority: 10
Type: MX    | Name: *.lms    | Value: mail.ssgzone.in   | Priority: 10
Type: MX    | Name: *.rupyo  | Value: mail.ssgzone.in   | Priority: 10
```

### 5.3 Update Domain Nameservers
At your domain registrar (where you bought ssgzone.in):
1. Change nameservers to:
   - `ns1.digitalocean.com`
   - `ns2.digitalocean.com`
   - `ns3.digitalocean.com`

## Step 6: Deploy SSGhub Mail

### 6.1 Clone Your Code
```bash
cd /root
git clone https://github.com/YOUR_USERNAME/SSGhub.git
cd SSGhub
```

### 6.2 Set Up Environment
```bash
cp .env.example .env
nano .env
```

**Update these values in .env:**
```bash
# Replace with your server IP
DB_PASSWORD=your_secure_db_password_123
JWT_SECRET=your_jwt_secret_key_here_32_chars
ENCRYPTION_KEY=your_32_character_encryption_key

# Domain is already set to ssgzone.in
DOMAIN=ssgzone.in
```

### 6.3 Generate SSL Certificates
```bash
# Install Certbot
apt install certbot -y

# Generate certificates (do this after DNS propagates - wait 2-4 hours)
certbot certonly --standalone -d ssgzone.in
certbot certonly --standalone -d mail.ssgzone.in
certbot certonly --standalone -d admin.ssgzone.in
certbot certonly --standalone -d webmail.ssgzone.in

# Copy certificates
mkdir -p config/ssl/certs config/ssl/private
cp /etc/letsencrypt/live/ssgzone.in/fullchain.pem config/ssl/certs/ssgzone.in.crt
cp /etc/letsencrypt/live/ssgzone.in/privkey.pem config/ssl/private/ssgzone.in.key
```

### 6.4 Generate DKIM Keys
```bash
mkdir -p config/dkim
openssl genrsa -out config/dkim/ssgzone.in.private 2048
openssl rsa -in config/dkim/ssgzone.in.private -pubout -out config/dkim/ssgzone.in.public

# Display DKIM public key for DNS
echo "Add this TXT record to DNS:"
echo "Name: default._domainkey"
echo "Value: v=DKIM1; k=rsa; p=$(grep -v '^-' config/dkim/ssgzone.in.public | tr -d '\n')"
```

### 6.5 Configure Firewall
```bash
ufw enable
ufw allow 22     # SSH
ufw allow 80     # HTTP
ufw allow 443    # HTTPS
ufw allow 25     # SMTP
ufw allow 587    # SMTP Submission
ufw allow 993    # IMAPS
ufw allow 995    # POP3S
```

### 6.6 Start Services
```bash
# Start in production mode
docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d

# Check if all services are running
docker-compose ps

# Check logs
docker-compose logs api-gateway
docker-compose logs mail-server
```

## Step 7: Verify Setup

### 7.1 Check Services
```bash
# Test API
curl http://localhost:4000/health

# Check if ports are open
netstat -tlnp | grep -E ':(25|587|993|995|4000)'
```

### 7.2 Test DNS Resolution
```bash
# From your local computer
nslookup ssgzone.in
nslookup mail.ssgzone.in
dig ssgzone.in MX
```

### 7.3 Create Test Account
```bash
# Create SaaS application
curl -X POST http://localhost:4000/api/v1/saas/register \
  -H "Content-Type: application/json" \
  -d '{"saas_name": "Test LMS", "saas_slug": "lms"}'

# Note the API key from response, then create tenant
curl -X POST http://localhost:4000/api/v1/tenant/provision \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"saas_slug": "lms", "company_name": "Test Company", "tenant_slug": "test"}'

# Create user
curl -X POST http://localhost:4000/api/v1/user/create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"tenant_slug": "test", "saas_slug": "lms", "first_name": "Test", "last_name": "User", "password": "testpass123"}'
```

## Step 8: Access Your Services

### 8.1 Service URLs
- **API:** `http://YOUR_SERVER_IP:4000`
- **Admin Portal:** `http://YOUR_SERVER_IP:4001`
- **Webmail:** `http://YOUR_SERVER_IP:4002`

### 8.2 Email Client Settings
**SMTP (Sending):**
- Server: `mail.ssgzone.in`
- Port: `587`
- Security: `STARTTLS`
- Username: `test.user@test.lms.ssgzone.in`
- Password: `testpass123`

**IMAP (Receiving):**
- Server: `mail.ssgzone.in`
- Port: `993`
- Security: `SSL/TLS`
- Username: `test.user@test.lms.ssgzone.in`
- Password: `testpass123`

## Step 9: Add Email Security DNS Records

After DKIM key generation, add these to DigitalOcean DNS:

```
Type: TXT   | Name: @                | Value: v=spf1 include:ssgzone.in ~all
Type: TXT   | Name: _dmarc           | Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@ssgzone.in
Type: TXT   | Name: default._domainkey | Value: [DKIM_PUBLIC_KEY_FROM_STEP_6.4]
```

## Troubleshooting

### DNS Not Working
```bash
# Check if DNS has propagated
dig @8.8.8.8 ssgzone.in
# Wait 2-24 hours for full propagation
```

### Services Not Starting
```bash
# Check logs
docker-compose logs
# Check disk space
df -h
# Check memory
free -h
```

### SSL Certificate Issues
```bash
# Make sure DNS is working first
# Then retry certificate generation
certbot certonly --standalone -d ssgzone.in --force-renewal
```

## Monthly Costs
- **Droplet:** $48/month (8GB RAM, 4 CPU, 160GB SSD)
- **Bandwidth:** Included (5TB/month)
- **DNS:** Free
- **Total:** ~$48/month

## Backup Setup
```bash
# Create backup script
cat > /root/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p /backups
docker-compose exec postgres pg_dump -U ssghub ssghub_mail > /backups/db_$DATE.sql
tar -czf /backups/mail_$DATE.tar.gz /root/SSGhub
find /backups -name "*.sql" -mtime +7 -delete
find /backups -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /root/backup.sh
echo "0 2 * * * /root/backup.sh" | crontab -
```

Your SSGhub Mail platform will be live at `ssgzone.in`! 🚀