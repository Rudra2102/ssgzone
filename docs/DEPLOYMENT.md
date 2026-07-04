# SSGhub Mail Deployment Guide

## Prerequisites

### System Requirements
- **OS:** Ubuntu 20.04+ or CentOS 8+
- **RAM:** Minimum 8GB, Recommended 16GB+
- **Storage:** Minimum 100GB SSD
- **CPU:** 4+ cores
- **Network:** Static IP with reverse DNS

### Software Dependencies
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+
- Node.js 18+
- SSL Certificate for ssghub.com

## Quick Start with Docker

### 1. Clone Repository
```bash
git clone https://github.com/ssghub/mail-platform.git
cd mail-platform
```

### 2. Environment Configuration
```bash
cp .env.example .env
# Edit .env with your configuration
nano .env
```

### 3. Start Services
```bash
docker-compose up -d
```

### 4. Initialize Database
```bash
docker-compose exec postgres psql -U ssghub -d ssghub_mail -f /docker-entrypoint-initdb.d/01_schema.sql
```

## Production Deployment

### 1. DNS Configuration

#### Primary Domain Setup
Configure these DNS records for `ssghub.com`:

```
; MX Records
ssghub.com.                IN MX 10 mail.ssghub.com.

; A Records
mail.ssghub.com.           IN A    YOUR_SERVER_IP
api.ssghub.com.            IN A    YOUR_SERVER_IP
admin.ssghub.com.          IN A    YOUR_SERVER_IP
webmail.ssghub.com.        IN A    YOUR_SERVER_IP

; TXT Records (SPF)
ssghub.com.                IN TXT  "v=spf1 ip4:YOUR_SERVER_IP ~all"

; DKIM Record
default._domainkey.ssghub.com. IN TXT "v=DKIM1; k=rsa; p=YOUR_DKIM_PUBLIC_KEY"

; DMARC Record
_dmarc.ssghub.com.         IN TXT  "v=DMARC1; p=quarantine; rua=mailto:dmarc@ssghub.com"
```

#### Wildcard Subdomain Setup
For automatic tenant provisioning:
```
*.lms.ssghub.com.          IN CNAME mail.ssghub.com.
*.rupyo.ssghub.com.        IN CNAME mail.ssghub.com.
```

### 2. SSL Certificate Setup

#### Using Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificates
sudo certbot --nginx -d ssghub.com -d *.ssghub.com -d mail.ssghub.com -d api.ssghub.com -d admin.ssghub.com -d webmail.ssghub.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Nginx Configuration

```nginx
# /etc/nginx/sites-available/ssghub-mail
server {
    listen 80;
    server_name ssghub.com *.ssghub.com;
    return 301 https://$server_name$request_uri;
}

# API Gateway
server {
    listen 443 ssl http2;
    server_name api.ssghub.com;
    
    ssl_certificate /etc/letsencrypt/live/ssghub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ssghub.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3005;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Admin Portal
server {
    listen 443 ssl http2;
    server_name admin.ssghub.com;
    
    ssl_certificate /etc/letsencrypt/live/ssghub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ssghub.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Webmail Client
server {
    listen 443 ssl http2;
    server_name webmail.ssghub.com;
    
    ssl_certificate /etc/letsencrypt/live/ssghub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ssghub.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. Firewall Configuration

```bash
# UFW Setup
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 25/tcp      # SMTP
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 587/tcp     # SMTP Submission
sudo ufw allow 993/tcp     # IMAPS
sudo ufw allow 995/tcp     # POP3S
sudo ufw enable
```

### 5. Database Optimization

#### PostgreSQL Configuration
```sql
-- /etc/postgresql/15/main/postgresql.conf
shared_buffers = 2GB
effective_cache_size = 6GB
maintenance_work_mem = 512MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 64MB
min_wal_size = 1GB
max_wal_size = 4GB
```

### 6. Monitoring Setup

#### Prometheus & Grafana
```yaml
# monitoring/docker-compose.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      
  grafana:
    image: grafana/grafana
    ports:
      - "3005:3005"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=secure_password
```

### 7. Backup Strategy

#### Database Backup
```bash
#!/bin/bash
# /opt/ssghub/backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/ssghub"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -h localhost -U ssghub ssghub_mail | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Mail data backup
tar -czf $BACKUP_DIR/mail_$DATE.tar.gz /var/mail

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 sync $BACKUP_DIR s3://ssghub-backups/
```

#### Cron Setup
```bash
# Daily backup at 2 AM
0 2 * * * /opt/ssghub/backup.sh
```

## Security Hardening

### 1. System Security
```bash
# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Install fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban

# Configure fail2ban for mail services
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
```

### 2. Application Security
- Enable rate limiting
- Implement IP whitelisting for admin access
- Use strong passwords and 2FA
- Regular security updates
- Log monitoring and alerting

## Performance Tuning

### 1. Mail Server Optimization
```bash
# Increase file descriptor limits
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Optimize kernel parameters
echo "net.core.rmem_max = 134217728" >> /etc/sysctl.conf
echo "net.core.wmem_max = 134217728" >> /etc/sysctl.conf
echo "net.ipv4.tcp_rmem = 4096 65536 134217728" >> /etc/sysctl.conf
echo "net.ipv4.tcp_wmem = 4096 65536 134217728" >> /etc/sysctl.conf
```

### 2. Database Performance
- Regular VACUUM and ANALYZE
- Index optimization
- Connection pooling
- Query optimization

## Troubleshooting

### Common Issues

#### 1. DNS Propagation
```bash
# Check DNS propagation
dig MX ssghub.com
dig TXT ssghub.com
nslookup mail.ssghub.com
```

#### 2. Mail Delivery Issues
```bash
# Check mail logs
tail -f /var/log/mail.log

# Test SMTP connection
telnet mail.ssghub.com 25

# Check SPF/DKIM
dig TXT ssghub.com
dig TXT default._domainkey.ssghub.com
```

#### 3. Performance Issues
```bash
# Check system resources
htop
iotop
netstat -tulpn

# Database performance
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
```

## Maintenance

### Regular Tasks
- **Daily:** Monitor logs and system resources
- **Weekly:** Database maintenance (VACUUM, ANALYZE)
- **Monthly:** Security updates and patches
- **Quarterly:** Performance review and optimization

### Update Procedure
1. Backup all data
2. Test updates in staging environment
3. Schedule maintenance window
4. Apply updates with rollback plan
5. Verify all services are working
6. Monitor for 24 hours post-update

## Support
- **Documentation:** https://docs.ssghub.com
- **Support Email:** support@ssghub.com
- **Emergency:** +1-XXX-XXX-XXXX