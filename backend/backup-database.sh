#!/bin/bash
# Halcyon Rest - Automated Database Backup Script
# Usage: ./backup-database.sh [backup_name]

set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_NAME="${DB_NAME:-halcyon_rest_db}"
DB_USER="${DB_USER:-halcyon_user}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="${1:-backup_${TIMESTAMP}}"
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

echo "🔄 Starting database backup..."
echo "📅 Timestamp: $(date)"
echo "🗄️  Database: $DB_NAME"
echo "📁 Backup location: $BACKUP_FILE"

# Perform backup
export PGPASSWORD="$DB_PASS"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --verbose \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    -f "$BACKUP_FILE" 2>&1 | tee "${BACKUP_DIR}/backup_${TIMESTAMP}.log"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "✅ Database dump completed successfully"
    
    # Compress backup
    echo "🗜️  Compressing backup..."
    gzip -f "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        BACKUP_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
        echo "✅ Backup compressed: $COMPRESSED_FILE ($BACKUP_SIZE)"
        
        # Create backup metadata
        cat > "${COMPRESSED_FILE}.meta" << EOF
{
    "backup_date": "$(date -Iseconds)",
    "database": "$DB_NAME",
    "size": "$BACKUP_SIZE",
    "filename": "$(basename $COMPRESSED_FILE)",
    "retention_days": $RETENTION_DAYS
}
EOF
        
        # Clean up old backups
        echo "🧹 Cleaning up backups older than $RETENTION_DAYS days..."
        find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
        find "$BACKUP_DIR" -name "*.meta" -type f -mtime +$RETENTION_DAYS -delete
        find "$BACKUP_DIR" -name "*.log" -type f -mtime +$RETENTION_DAYS -delete
        
        echo "📊 Current backups:"
        ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "No backups found"
        
        echo ""
        echo "🎉 Backup completed successfully!"
        echo "📁 Backup file: $COMPRESSED_FILE"
        echo "💾 Size: $BACKUP_SIZE"
        
        # Send notification (optional - requires mail command)
        if command -v mail &> /dev/null; then
            echo "Database backup completed successfully on $(hostname)" | \
                mail -s "✅ Halcyon Rest Backup Success" "${EMAIL_USER:-admin@halcyonrest.com}"
        fi
        
        exit 0
    else
        echo "❌ Failed to compress backup"
        exit 1
    fi
else
    echo "❌ Database backup failed!"
    
    # Send error notification (optional)
    if command -v mail &> /dev/null; then
        echo "Database backup FAILED on $(hostname)" | \
            mail -s "❌ Halcyon Rest Backup Failed" "${EMAIL_USER:-admin@halcyonrest.com}"
    fi
    
    exit 1
fi

unset PGPASSWORD
