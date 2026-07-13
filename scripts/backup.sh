#!/bin/bash
# SSGzone Automated Backup Script
# Backs up PostgreSQL database to MinIO
# Cron: 0 2 * * * /opt/ssgzone/scripts/backup.sh

set -euo pipefail

DB_NAME="ssgzone_mail"
DB_USER="postgres"
DB_HOST="localhost"
MINIO_ALIAS="ssgzone-local"
MINIO_BUCKET="ssgzone-backups"
BACKUP_DIR="/tmp/ssgzone-backups"
RETENTION_DAYS=30
LOG_FILE="/var/log/ssgzone-backup.log"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="ssgzone_mail_${TIMESTAMP}.sql.gz"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

mkdir -p "$BACKUP_DIR"
log "Starting backup: $BACKUP_FILE"

# Dump and compress
if pg_dump -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/$BACKUP_FILE"; then
  BACKUP_SIZE=$(du -sh "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
  log "Dump complete: $BACKUP_SIZE"
else
  log "ERROR: pg_dump failed"
  exit 1
fi

# Upload to MinIO
if /home/ssgzone/minio/bin/mc cp "$BACKUP_DIR/$BACKUP_FILE" "$MINIO_ALIAS/$MINIO_BUCKET/db/$BACKUP_FILE" >> "$LOG_FILE" 2>&1; then
  log "Uploaded: $MINIO_BUCKET/db/$BACKUP_FILE"
else
  log "ERROR: MinIO upload failed"
  exit 1
fi

# Cleanup local temp
rm -f "$BACKUP_DIR/$BACKUP_FILE"

# Remove old backups from MinIO
/home/ssgzone/minio/bin/mc rm --recursive --force --older-than "${RETENTION_DAYS}d" \
  "$MINIO_ALIAS/$MINIO_BUCKET/db/" >> "$LOG_FILE" 2>&1 || true

log "Backup completed successfully"
