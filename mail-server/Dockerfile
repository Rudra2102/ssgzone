FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    openssl \
    ca-certificates

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY src/ ./src/
COPY config/ ./config/

# Create mail directories
RUN mkdir -p /var/mail/attachments && \
    mkdir -p /var/mail/queue

# Create non-root user
RUN addgroup -g 1001 -S mailuser && \
    adduser -S mailuser -u 1001 -G mailuser

# Set permissions
RUN chown -R mailuser:mailuser /app /var/mail
USER mailuser

# Expose ports
EXPOSE 25 587 143 993

CMD ["node", "src/server.js"]