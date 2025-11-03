#!/bin/bash
# Database Setup Script for Halcyon Rest
# This script sets up the PostgreSQL database

echo "🏨 Halcyon Rest - Database Setup Script"
echo "========================================"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed!"
    echo "Please install PostgreSQL first:"
    echo "  Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "  Mac: brew install postgresql"
    exit 1
fi

echo "✅ PostgreSQL found"
echo ""

# Check if PostgreSQL service is running
if ! pg_isready -q; then
    echo "⚠️  PostgreSQL service is not running"
    echo "Starting PostgreSQL service..."
    sudo service postgresql start
    sleep 2
fi

echo "✅ PostgreSQL service is running"
echo ""

# Run initialization script
echo "📦 Creating database and user..."
echo ""

sudo -u postgres psql -f src/database/init.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database setup completed successfully!"
    echo ""
    echo "📝 Database Details:"
    echo "   Database: halcyon_rest_db"
    echo "   User: halcyon_user"
    echo "   Host: localhost"
    echo "   Port: 5432"
    echo ""
    echo "🚀 You can now run: npm start"
else
    echo ""
    echo "❌ Database setup failed!"
    echo "Please check the error messages above"
    exit 1
fi
