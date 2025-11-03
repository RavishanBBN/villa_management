#!/bin/bash
# Halcyon Rest - Setup Automated Backups with Cron
# This script sets up daily automated database backups

echo "🔧 Setting up automated database backups..."
echo ""

# Get the absolute path to the backup script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-database.sh"

# Check if backup script exists
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "❌ Error: Backup script not found at $BACKUP_SCRIPT"
    exit 1
fi

# Make sure script is executable
chmod +x "$BACKUP_SCRIPT"

# Cron schedule options
echo "Select backup schedule:"
echo "1) Daily at 2:00 AM (recommended)"
echo "2) Daily at midnight"
echo "3) Twice daily (2:00 AM and 2:00 PM)"
echo "4) Weekly (Sunday at 2:00 AM)"
echo "5) Custom"
echo ""
read -p "Enter choice (1-5): " choice

case $choice in
    1)
        CRON_SCHEDULE="0 2 * * *"
        DESCRIPTION="Daily at 2:00 AM"
        ;;
    2)
        CRON_SCHEDULE="0 0 * * *"
        DESCRIPTION="Daily at midnight"
        ;;
    3)
        CRON_SCHEDULE="0 2,14 * * *"
        DESCRIPTION="Twice daily at 2:00 AM and 2:00 PM"
        ;;
    4)
        CRON_SCHEDULE="0 2 * * 0"
        DESCRIPTION="Weekly on Sunday at 2:00 AM"
        ;;
    5)
        echo "Enter custom cron schedule (e.g., '0 3 * * *' for 3 AM daily):"
        read -p "Schedule: " CRON_SCHEDULE
        DESCRIPTION="Custom schedule: $CRON_SCHEDULE"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

# Create cron job entry
CRON_JOB="$CRON_SCHEDULE cd $SCRIPT_DIR && ./backup-database.sh >> $SCRIPT_DIR/logs/backup.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "$BACKUP_SCRIPT"; then
    echo "⚠️  Backup cron job already exists. Removing old entry..."
    crontab -l 2>/dev/null | grep -v "$BACKUP_SCRIPT" | crontab -
fi

# Add new cron job
echo "📅 Adding cron job: $DESCRIPTION"
(crontab -l 2>/dev/null; echo "# Halcyon Rest - Automated Database Backup"; echo "$CRON_JOB") | crontab -

echo "✅ Automated backup configured successfully!"
echo ""
echo "📋 Backup Details:"
echo "   Schedule: $DESCRIPTION"
echo "   Script: $BACKUP_SCRIPT"
echo "   Logs: $SCRIPT_DIR/logs/backup.log"
echo ""
echo "📊 Current cron jobs:"
crontab -l | grep -A 1 "Halcyon Rest"
echo ""
echo "💡 Tips:"
echo "   - View logs: tail -f $SCRIPT_DIR/logs/backup.log"
echo "   - List backups: ls -lh $SCRIPT_DIR/backups/"
echo "   - Remove automation: crontab -e (then delete the Halcyon Rest entry)"
echo "   - Test backup now: $BACKUP_SCRIPT"
echo ""
echo "🎉 Setup complete!"
