# SSGhub Mail Setup Checklist for ssgzone.in

## Phase 1: Code Updates ✅ COMPLETED
- [x] Updated .env files to use ssgzone.in
- [x] Updated Docker compose files
- [x] Updated DNS service configuration
- [x] Updated README and documentation
- [x] Updated QUICK_START guide

## Phase 2: DNS Configuration 🔄 IN PROGRESS
- [ ] Get server IP address from hosting provider
- [ ] Login to domain registrar (where you bought ssgzone.in)
- [ ] Add A record: @ → YOUR_SERVER_IP
- [ ] Add A record: mail → YOUR_SERVER_IP
- [ ] Add A record: admin → YOUR_SERVER_IP
- [ ] Add A record: webmail → YOUR_SERVER_IP
- [ ] Add MX record: @ → 10 mail.ssgzone.in
- [ ] Add wildcard A records: *.lms → YOUR_SERVER_IP
- [ ] Add wildcard A records: *.rupyo → YOUR_SERVER_IP
- [ ] Add wildcard MX records: *.lms → 10 mail.ssgzone.in
- [ ] Add wildcard MX records: *.rupyo → 10 mail.ssgzone.in
- [ ] Wait 24-48 hours for DNS propagation
- [ ] Verify DNS with: `nslookup ssgzone.in`

## Phase 3: Server Setup ⏳ PENDING
- [ ] Get hosting server (8GB+ RAM, 50GB+ storage)
- [ ] Install Ubuntu 20.04+ or CentOS 8+
- [ ] Install Docker and Docker Compose
- [ ] Clone updated SSGhub code
- [ ] Set up firewall (ports 22, 80, 443, 25, 587, 993, 995)

## Phase 4: SSL Certificates ⏳ PENDING
- [ ] Install Certbot for Let's Encrypt
- [ ] Generate SSL certificate for ssgzone.in
- [ ] Generate SSL certificate for mail.ssgzone.in
- [ ] Generate SSL certificate for admin.ssgzone.in
- [ ] Generate SSL certificate for webmail.ssgzone.in
- [ ] Copy certificates to config/ssl/ directory

## Phase 5: Email Security ⏳ PENDING
- [ ] Generate DKIM key pair
- [ ] Add DKIM public key to DNS (TXT record)
- [ ] Add SPF record to DNS: v=spf1 include:ssgzone.in ~all
- [ ] Add DMARC record to DNS: v=DMARC1; p=quarantine; rua=mailto:dmarc@ssgzone.in

## Phase 6: Application Deployment ⏳ PENDING
- [ ] Configure environment variables in .env
- [ ] Generate secure secrets
- [ ] Start services with docker-compose
- [ ] Verify all containers are running
- [ ] Check service logs for errors

## Phase 7: Testing ⏳ PENDING
- [ ] Test API health endpoint
- [ ] Create test SaaS application
- [ ] Create test tenant
- [ ] Create test user mailbox
- [ ] Test SMTP sending (port 587)
- [ ] Test IMAP receiving (port 993)
- [ ] Test webmail interface
- [ ] Send test email between accounts

## Phase 8: Production Hardening ⏳ PENDING
- [ ] Install and configure fail2ban
- [ ] Set up automated backups
- [ ] Configure log rotation
- [ ] Set up monitoring alerts
- [ ] Test disaster recovery procedures

## Phase 9: Go Live ⏳ PENDING
- [ ] Update DNS TTL to lower values (300-600 seconds)
- [ ] Announce service availability
- [ ] Monitor performance and logs
- [ ] Document any issues and solutions

## Quick Commands for Verification

### Check DNS Resolution:
```bash
nslookup ssgzone.in
dig ssgzone.in MX
dig ssgzone.in TXT
```

### Check Services:
```bash
docker-compose ps
curl http://localhost:4000/health
```

### Check SSL:
```bash
openssl s_client -connect mail.ssgzone.in:587 -starttls smtp
```

### Test Email:
```bash
telnet mail.ssgzone.in 587
```

## Important Notes:
- DNS changes take 24-48 hours to propagate globally
- Always test in staging before production changes
- Keep backups of configuration files
- Monitor logs during initial deployment
- Have rollback plan ready

## Files Created/Updated:
- ✅ All .env files updated
- ✅ Docker compose files updated  
- ✅ DNS service configuration updated
- ✅ Documentation updated
- ✅ DNS_SETUP_GUIDE.md created
- ✅ FIRST_TIME_HOSTING_GUIDE.md created
- ✅ This checklist created

## Next Immediate Action:
**Configure DNS records at your domain registrar using the DNS_SETUP_GUIDE.md**