#!/bin/bash
# SSL Certificate Setup Script for SSGhub Mail

# Create SSL directories
mkdir -p /etc/ssl/certs
mkdir -p /etc/ssl/private
mkdir -p /etc/dkim

# Generate self-signed certificate for development
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/ssghub.com.key \
  -out /etc/ssl/certs/ssghub.com.crt \
  -subj "/C=US/ST=CA/L=San Francisco/O=SSGhub/CN=*.ssghub.com"

# Generate DKIM key pair
openssl genrsa -out /etc/dkim/ssghub.com.private 2048
openssl rsa -in /etc/dkim/ssghub.com.private -pubout -out /etc/dkim/ssghub.com.public

# Set proper permissions
chmod 600 /etc/ssl/private/ssghub.com.key
chmod 644 /etc/ssl/certs/ssghub.com.crt
chmod 600 /etc/dkim/ssghub.com.private
chmod 644 /etc/dkim/ssghub.com.public

echo "SSL certificates and DKIM keys generated successfully"
echo "For production, replace with certificates from a trusted CA"
echo ""
echo "DKIM Public Key (add to DNS):"
cat /etc/dkim/ssghub.com.public | grep -v "BEGIN\|END" | tr -d '\n'