#!/bin/bash

echo "========================================"
echo "SSGhub Mail Platform Setup"
echo "========================================"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}ERROR: Docker is not installed${NC}"
    echo "Please install Docker from https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}ERROR: Docker Compose is not installed${NC}"
    echo "Please install Docker Compose from https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}Docker and Docker Compose are available${NC}"
echo

# Check if running as root (not recommended)
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}WARNING: Running as root is not recommended${NC}"
    echo "Consider creating a dedicated user for SSGhub Mail"
    echo
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo
    echo -e "${YELLOW}IMPORTANT: Please edit .env file with your configuration${NC}"
    echo "Press Enter to continue after editing .env file..."
    read -r
fi

# Create necessary directories
echo "Creating directories..."
mkdir -p data/{postgres,redis,mail}
mkdir -p logs
mkdir -p ssl
echo -e "${GREEN}Directories created successfully${NC}"
echo

# Set proper permissions
echo "Setting permissions..."
chmod 755 data
chmod 755 logs
chmod 700 ssl
echo -e "${GREEN}Permissions set successfully${NC}"
echo

# Build and start services
echo "Building and starting services..."
docker-compose up -d --build

if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Failed to start services${NC}"
    exit 1
fi

echo
echo "Waiting for services to start..."
sleep 30

# Check service status
echo "Checking service status..."
docker-compose ps

# Wait for database to be ready
echo
echo "Waiting for database to be ready..."
until docker-compose exec -T postgres pg_isready -U ssghub -d ssghub_mail; do
    echo "Database is not ready yet, waiting..."
    sleep 5
done

echo -e "${GREEN}Database is ready!${NC}"

# Initialize database (if needed)
echo "Checking if database needs initialization..."
DB_TABLES=$(docker-compose exec -T postgres psql -U ssghub -d ssghub_mail -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
if [ "$DB_TABLES" -lt 5 ]; then
    echo "Initializing database..."
    docker-compose exec -T postgres psql -U ssghub -d ssghub_mail -f /docker-entrypoint-initdb.d/01_schema.sql
    echo -e "${GREEN}Database initialized successfully${NC}"
else
    echo -e "${GREEN}Database already initialized${NC}"
fi

echo
echo "========================================"
echo -e "${GREEN}Setup Complete!${NC}"
echo "========================================"
echo
echo "Services are running on:"
echo "- API Gateway: http://localhost:3005"
echo "- Admin Portal: http://localhost:3001"
echo "- Webmail Client: http://localhost:3002"
echo "- PostgreSQL: localhost:5432"
echo "- Redis: localhost:6379"
echo
echo "Mail server ports:"
echo "- SMTP: 25"
echo "- SMTP Submission: 587"
echo "- IMAP: 143"
echo "- IMAPS: 993"
echo
echo "Next steps:"
echo "1. Access Admin Portal at http://localhost:3001"
echo "2. Register your first SaaS application"
echo "3. Create tenants and users"
echo "4. Configure DNS records for production"
echo
echo "Useful commands:"
echo "- Stop services: docker-compose down"
echo "- View logs: docker-compose logs -f"
echo "- Restart services: docker-compose restart"
echo "- Update services: docker-compose pull && docker-compose up -d"
echo
echo "For production deployment, see docs/DEPLOYMENT.md"
echo