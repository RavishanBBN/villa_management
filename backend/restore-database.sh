#!/bin/bash
# Halcyon Rest - Database Restore Script
# Usage: ./restore-database.sh <backup_file.sql.gz>

set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Configuration
DB_NAME="${DB_NAME:-halcyon_rest_db}"
DB_USER="${DB_USER:-halcyon_user}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Check if backup file provided
if [ -z "$1" ]; then
    echo "❌ Error: No backup file specified"
    echo "Usage: $0 <backup_file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -lh backups/*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will replace the current database!"
echo "🗄️  Database: $DB_NAME"
echo "📁 Restore from: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 0
fi

# Create a safety backup before restore
echo "💾 Creating safety backup before restore..."
SAFETY_BACKUP="backups/pre_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
export PGPASSWORD="$DB_PASS"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$SAFETY_BACKUP"
echo "✅ Safety backup created: $SAFETY_BACKUP"

# Decompress if needed
RESTORE_FILE="$BACKUP_FILE"
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "🗜️  Decompressing backup..."
    RESTORE_FILE="/tmp/restore_temp_$(date +%s).sql"
    gunzip -c "$BACKUP_FILE" > "$RESTORE_FILE"
fi

# Restore database
echo "🔄 Restoring database..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$RESTORE_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully!"
    
    # Clean up temp file
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        rm -f "$RESTORE_FILE"
    fi
    
    echo ""
    echo "🎉 Restore completed!"
    echo "📁 Restored from: $BACKUP_FILE"
    echo "💾 Safety backup: $SAFETY_BACKUP"
    
    exit 0
else
    echo "❌ Database restore failed!"
    echo "💾 Original database preserved in: $SAFETY_BACKUP"
    
    # Clean up temp file
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        rm -f "$RESTORE_FILE"
    fi
    
    exit 1
fi

unset PGPASSWORD
