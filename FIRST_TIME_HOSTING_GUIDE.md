# First Time Hosting Guide for ssgzone.in

## Complete Setup Checklist

### ✅ Step 1: Domain Update (COMPLETED)
- [x] Updated all configuration files to use ssgzone.in
- [x] Updated Docker compose files
- [x] Updated DNS service configuration
- [x] Updated documentation

### 🔧 Step 2: DNS Configuration (NEXT)

#### What you need:
1. **Your server IP address** (from your hosting provider)
2. **Access to your domain registrar** (where you bought ssgzone.in)

#### DNS Records to Add:

```
# Basic Domain Records
Type: A     | Name: @        | Value: YOUR_SERVER_IP    | TTL: 3600
Type: A     | Name: mail     | Value: YOUR_SERVER_IP    | TTL: 3600
Type: A     | Name: admin    | Value: YOUR_SERVER_IP    | TTL: 3600
Type: A     | Name: webmail  | Value: YOUR_SERVER_IP    | TTL: 3600

# Mail Exchange Record
Type: MX    | Name: @        | Value: 10 mail.ssgzone.in | TTL: 3600

# Wildcard for SaaS subdomains
Type: A     | Name: *.lms    | Value: YOUR_SERVER_IP    | TTL: 3600
Type: A     | Name: *.rupyo  | Value: YOUR_SERVER_IP    | TTL: 3600
Type: MX    | Name: *.lms    | Value: 10 mail.ssgzone.in | TTL: 3600
Type: MX    | Name: *.rupyo  | Value: 10 mail.ssgzone.in | TTL: 3600

# Email Security (Add after mail server is running)
Type: TXT   | Name: @        | Value: v=spf1 include:ssgzone.in ~all | TTL: 3600
Type: TXT   | Name: _dmarc   | Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@ssgzone.in | TTL: 3600
```

### 🖥️ Step 3: Server Setup

#### Minimum Server Requirements:
- **RAM:** 8GB minimum, 16GB recommended
- **Storage:** 50GB minimum, 100GB+ recommended
- **CPU:** 4 cores minimum
- **OS:** Ubuntu 20.04+ or CentOS 8+

#### Server Setup Commands:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Reboot to apply Docker group changes
sudo reboot
```

### 🔐 Step 4: SSL Certificate Setup

#### Option A: Let's Encrypt (Free, Recommended)
```bash
# Install Certbot
sudo apt install certbot -y

# Generate certificates for your domains
sudo certbot certonly --standalone -d ssgzone.in
sudo certbot certonly --standalone -d mail.ssgzone.in
sudo certbot certonly --standalone -d admin.ssgzone.in
sudo certbot certonly --standalone -d webmail.ssgzone.in

# Copy certificates to your project
sudo cp /etc/letsencrypt/live/ssgzone.in/fullchain.pem ./config/ssl/certs/ssgzone.in.crt
sudo cp /etc/letsencrypt/live/ssgzone.in/privkey.pem ./config/ssl/private/ssgzone.in.key
sudo chown $USER:$USER ./config/ssl/certs/ssgzone.in.crt
sudo chown $USER:$USER ./config/ssl/private/ssgzone.in.key
```

#### Option B: Self-Signed (Testing Only)
```bash
# Create SSL directories
mkdir -p config/ssl/certs config/ssl/private

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout config/ssl/private/ssgzone.in.key \
  -out config/ssl/certs/ssgzone.in.crt \
  -subj "/C=IN/ST=State/L=City/O=Organization/CN=ssgzone.in"
```

### 🔑 Step 5: Generate DKIM Keys

```bash
# Create DKIM directory
mkdir -p config/dkim

# Generate DKIM key pair
openssl genrsa -out config/dkim/ssgzone.in.private 2048
openssl rsa -in config/dkim/ssgzone.in.private -pubout -out config/dkim/ssgzone.in.public

# Display public key for DNS record
echo "Add this TXT record to DNS:"
echo "Name: default._domainkey"
echo "Value: v=DKIM1; k=rsa; p=$(grep -v '^-' config/dkim/ssgzone.in.public | tr -d '\n')"
```

### 🚀 Step 6: Deploy Application

```bash
# Clone your updated code
git clone [your-repository-url]
cd SSGhub

# Set up environment variables
cp .env.example .env

# Edit .env file with your settings
nano .env

# Generate secure secrets
./GENERATE_SECRETS.cmd  # Windows
# or
./generate_secrets.sh   # Linux

# Start services
docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d

# Check if services are running
docker-compose ps
```

### 🔍 Step 7: Verify Setup

#### Check Services:
```bash
# Check if all containers are running
docker-compose ps

# Check logs
docker-compose logs api-gateway
docker-compose logs mail-server

# Test API
curl http://localhost:4000/health
```

#### Test Email:
1. **Create test SaaS application:**
```bash
curl -X POST http://YOUR_SERVER_IP:4000/api/v1/saas/register \
  -H "Content-Type: application/json" \
  -d '{"saas_name": "Test LMS", "saas_slug": "lms"}'
```

2. **Create test tenant:**
```bash
curl -X POST http://YOUR_SERVER_IP:4000/api/v1/tenant/provision \
  -H "Content-Type: application/json" \
  -H "X-API-Key: [API_KEY_FROM_STEP_1]" \
  -d '{"saas_slug": "lms", "company_name": "Test Company", "tenant_slug": "test"}'
```

3. **Create test user:**
```bash
curl -X POST http://YOUR_SERVER_IP:4000/api/v1/user/create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: [API_KEY_FROM_STEP_1]" \
  -d '{"tenant_slug": "test", "saas_slug": "lms", "first_name": "Test", "last_name": "User", "password": "testpass123"}'
```

### 🔧 Step 8: Configure Email Client

Use these settings to test with any email client:

**SMTP (Sending):**
- Server: mail.ssgzone.in
- Port: 587
- Security: STARTTLS
- Username: test.user@test.lms.ssgzone.in
- Password: testpass123

**IMAP (Receiving):**
- Server: mail.ssgzone.in
- Port: 993
- Security: SSL/TLS
- Username: test.user@test.lms.ssgzone.in
- Password: testpass123

### 🛡️ Step 9: Security Hardening

```bash
# Install firewall
sudo ufw enable
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 25    # SMTP
sudo ufw allow 587   # SMTP Submission
sudo ufw allow 993   # IMAPS
sudo ufw allow 995   # POP3S

# Install fail2ban
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Set up automatic updates
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure unattended-upgrades
```

### 📊 Step 10: Monitoring Setup

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Monitor Docker containers
docker stats

# Set up log rotation
sudo nano /etc/logrotate.d/docker-containers
```

### 🔄 Step 11: Backup Setup

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec postgres pg_dump -U ssghub ssghub_mail > $BACKUP_DIR/db_backup_$DATE.sql

# Backup mail data
tar -czf $BACKUP_DIR/mail_backup_$DATE.tar.gz ./mail_data

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x backup.sh

# Add to crontab for daily backups
echo "0 2 * * * /path/to/your/backup.sh" | crontab -
```

## Troubleshooting Common Issues

### DNS Not Resolving
```bash
# Check DNS propagation
nslookup ssgzone.in
dig ssgzone.in MX

# Wait 24-48 hours for full propagation
```

### SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in config/ssl/certs/ssgzone.in.crt -text -noout

# Renew Let's Encrypt certificates
sudo certbot renew
```

### Email Not Working
```bash
# Check mail server logs
docker-compose logs mail-server

# Test SMTP connection
telnet mail.ssgzone.in 587

# Check DNS records
dig ssgzone.in MX
dig ssgzone.in TXT
```

### Performance Issues
```bash
# Check resource usage
docker stats
htop

# Scale services if needed
docker-compose up -d --scale api-gateway=2
```

## Support Resources

- **Documentation:** Check `/docs` folder
- **Logs:** `docker-compose logs [service-name]`
- **Health Check:** `http://your-server-ip:4000/health`
- **Admin Panel:** `http://admin.ssgzone.in`

## Next Steps After Setup

1. **Test thoroughly** with different email clients
2. **Monitor performance** and resource usage
3. **Set up monitoring alerts** (optional)
4. **Configure backup automation**
5. **Plan for scaling** as usage grows

Remember: This is a production system handling email, so always test changes in a staging environment first!