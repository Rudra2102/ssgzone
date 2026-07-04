# Quick DigitalOcean Setup Checklist

## Phase 1: Account Setup (15 minutes)
- [ ] Go to digitalocean.com
- [ ] Sign up with email/password
- [ ] Verify email
- [ ] Add credit card
- [ ] Apply $200 free credit code

## Phase 2: Create Server (10 minutes)
- [ ] Click "Create" → "Droplets"
- [ ] Choose Ubuntu 22.04 LTS
- [ ] Select $48/month plan (8GB RAM, 4 CPU)
- [ ] Choose datacenter (Bangalore/Singapore)
- [ ] Set hostname: `ssgzone-mail-server`
- [ ] Create strong root password
- [ ] Click "Create Droplet"
- [ ] **SAVE SERVER IP:** `___.___.___.___ `

## Phase 3: DNS Setup (20 minutes)
- [ ] Go to Networking → Domains
- [ ] Add domain: `ssgzone.in`
- [ ] Add A record: @ → YOUR_SERVER_IP
- [ ] Add A record: mail → YOUR_SERVER_IP
- [ ] Add A record: admin → YOUR_SERVER_IP
- [ ] Add A record: webmail → YOUR_SERVER_IP
- [ ] Add MX record: @ → mail.ssgzone.in (priority 10)
- [ ] **At domain registrar:** Change nameservers to DigitalOcean

## Phase 4: Server Setup (30 minutes)
Connect to server:
```bash
ssh root@YOUR_SERVER_IP
```

Run these commands:
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Git
apt install git -y

# Create swap
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

## Phase 5: Deploy Application (20 minutes)
```bash
# Clone code
cd /root
git clone https://github.com/YOUR_USERNAME/SSGhub.git
cd SSGhub

# Setup environment
cp .env.example .env
nano .env
# Update DB_PASSWORD, JWT_SECRET, ENCRYPTION_KEY

# Configure firewall
ufw enable
ufw allow 22,80,443,25,587,993,995

# Start services
docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d

# Check status
docker-compose ps
```

## Phase 6: SSL & Security (Wait 2-4 hours for DNS first)
```bash
# Install Certbot
apt install certbot -y

# Generate certificates (after DNS propagates)
certbot certonly --standalone -d ssgzone.in
certbot certonly --standalone -d mail.ssgzone.in

# Copy certificates
mkdir -p config/ssl/certs config/ssl/private
cp /etc/letsencrypt/live/ssgzone.in/fullchain.pem config/ssl/certs/ssgzone.in.crt
cp /etc/letsencrypt/live/ssgzone.in/privkey.pem config/ssl/private/ssgzone.in.key

# Generate DKIM
mkdir -p config/dkim
openssl genrsa -out config/dkim/ssgzone.in.private 2048
openssl rsa -in config/dkim/ssgzone.in.private -pubout -out config/dkim/ssgzone.in.public

# Restart services
docker-compose restart
```

## Phase 7: Test Everything (15 minutes)
```bash
# Test API
curl http://localhost:4000/health

# Create test account
curl -X POST http://localhost:4000/api/v1/saas/register \
  -H "Content-Type: application/json" \
  -d '{"saas_name": "Test LMS", "saas_slug": "lms"}'
```

## Quick Access URLs
- **API:** `http://YOUR_SERVER_IP:4000`
- **Admin:** `http://YOUR_SERVER_IP:4001`
- **Webmail:** `http://YOUR_SERVER_IP:4002`

## Test Email Settings
- **Server:** `mail.ssgzone.in`
- **SMTP Port:** `587`
- **IMAP Port:** `993`
- **Username:** `test.user@test.lms.ssgzone.in`

## Important Notes
- DNS takes 2-24 hours to propagate
- SSL certificates need DNS to work first
- Monthly cost: ~$48
- Keep server IP and passwords safe
- Set up backups after everything works

## Emergency Commands
```bash
# Check logs
docker-compose logs

# Restart services
docker-compose restart

# Check disk space
df -h

# Check memory
free -h
```

**Total Setup Time: ~2 hours + DNS wait time**