# 🏨 Halcyon Rest - Complete Setup Guide

## 📋 Prerequisites Installation

### 1. Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Verify Installation
```bash
psql --version
# Should show: psql (PostgreSQL) 12.x or higher
```

---

## 🚀 Step-by-Step Setup

### Step 1: Database Setup

#### Option A: Automated Setup (Recommended)
```bash
cd backend
chmod +x setup-database.sh
./setup-database.sh
```

#### Option B: Manual Setup
```bash
# Switch to postgres user
sudo -u postgres psql

# Run these commands in PostgreSQL:
CREATE ROLE halcyon_user LOGIN PASSWORD 'Vn@851015';
CREATE DATABASE halcyon_rest_db OWNER halcyon_user;
GRANT ALL PRIVILEGES ON DATABASE halcyon_rest_db TO halcyon_user;

# Exit PostgreSQL
\q
```

### Step 2: Initialize Database Tables
```bash
cd backend

# Start the backend server (this will auto-create tables)
npm start

# The server will use Sequelize to sync models and create tables
```

### Step 3: Create Super Admin User
```bash
cd backend
npm run create-admin

# Follow the prompts to create your admin account
```

### Step 4: Seed Initial Data (Optional)
```bash
cd backend
npm run db:seed
```

---

## 🖥️ Running the Application

### Backend Server
```bash
cd backend
npm run dev     # Development mode with auto-reload
# OR
npm start       # Production mode
```
**Backend runs on:** http://localhost:3001

### Frontend Application
```bash
cd frontend
npm start
```
**Frontend runs on:** http://localhost:3000

---

## 📱 Mobile App Setup (Optional)

### Android
```bash
cd mobile

# Install dependencies
npm install

# Start Metro bundler
npx react-native start

# In another terminal, run on Android
npx react-native run-android
```

### iOS (Mac only)
```bash
cd mobile

# Install pods
cd ios && pod install && cd ..

# Run on iOS
npx react-native run-ios
```

---

## ✅ Verification Checklist

### Backend Verification
- [ ] PostgreSQL is installed and running
- [ ] Database `halcyon_rest_db` exists
- [ ] User `halcyon_user` can connect
- [ ] Backend starts without errors on port 3001
- [ ] API endpoint http://localhost:3001/api/health returns 200
- [ ] Super admin user created

### Frontend Verification
- [ ] Frontend starts without errors on port 3000
- [ ] Login page loads
- [ ] Can log in with admin credentials
- [ ] Dashboard displays correctly
- [ ] All tabs are accessible

---

## 🔧 Troubleshooting

### Database Connection Issues

**Error: "ECONNREFUSED"**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start if not running
sudo systemctl start postgresql
```

**Error: "role does not exist"**
```bash
# Create the user manually
sudo -u postgres createuser -P halcyon_user
# Enter password: Vn@851015
```

**Error: "database does not exist"**
```bash
# Create database manually
sudo -u postgres createdb -O halcyon_user halcyon_rest_db
```

### Port Already in Use

**Backend port 3001 in use:**
```bash
# Find and kill process
lsof -ti:3001 | xargs kill -9

# Or change port in backend/.env
PORT=3002
```

**Frontend port 3000 in use:**
```bash
# Start on different port
PORT=3001 npm start
```

### Module Not Found Errors

**Backend:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

**Frontend:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 🌐 Deployment to Production

### 1. Environment Configuration
```bash
# Backend .env
NODE_ENV=production
DB_HOST=your-db-server.com
JWT_SECRET=your-super-strong-secret
CORS_ORIGIN=https://yourdomain.com
```

### 2. Build Frontend
```bash
cd frontend
npm run build
```

### 3. Deploy with PM2 (Recommended)
```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
pm2 start src/server.js --name halcyon-backend

# Serve frontend build
pm2 serve frontend/build 3000 --name halcyon-frontend

# Save PM2 configuration
pm2 save
pm2 startup
```

### 4. Setup Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📊 Database Management Commands

```bash
# Backup database
pg_dump -U halcyon_user -d halcyon_rest_db > backup_$(date +%Y%m%d).sql

# Restore database
psql -U halcyon_user -d halcyon_rest_db < backup_20240101.sql

# Reset database (WARNING: Deletes all data)
cd backend
npm run db:reset

# Run migrations only
npm run db:migrate

# Seed data only
npm run db:seed
```

---

## 🔐 Security Checklist

- [ ] Change all default passwords in `.env`
- [ ] Generate strong JWT secrets
- [ ] Enable HTTPS/SSL in production
- [ ] Set up firewall rules
- [ ] Configure database backups
- [ ] Enable rate limiting
- [ ] Set up monitoring and alerts
- [ ] Restrict CORS origins in production
- [ ] Use environment-specific configurations

---

## 📞 Support & Resources

### Documentation Files
- `MASTER_TODO_LIST.md` - Complete task list
- `INVENTORY_COMPLETE.md` - Inventory system guide
- `frontend/QUICKSTART.md` - Frontend setup guide
- `mobile/TESTING_GUIDE.md` - Mobile testing guide

### Useful Commands
```bash
# View backend logs
cd backend
npm run dev

# View all PM2 processes
pm2 list

# Monitor PM2 processes
pm2 monit

# View PostgreSQL logs
sudo journalctl -u postgresql
```

---

## 🎯 Quick Start (Development)

For the fastest setup, run these commands in order:

```bash
# 1. Install PostgreSQL (if not installed)
sudo apt install postgresql postgresql-contrib

# 2. Start PostgreSQL
sudo systemctl start postgresql

# 3. Setup database
cd backend
chmod +x setup-database.sh
./setup-database.sh

# 4. Start backend
npm start

# 5. In another terminal, create admin user
cd backend
npm run create-admin

# 6. In another terminal, start frontend
cd frontend
npm start

# 7. Open browser to http://localhost:3000
```

**Done! 🎉**

---

## 📝 Default Credentials

After running `npm run create-admin`, use the credentials you created.

**Default Database:**
- Database: `halcyon_rest_db`
- Username: `halcyon_user`
- Password: `Vn@851015`
- Host: `localhost`
- Port: `5432`

---

**Last Updated:** 2024-10-23
**Version:** 1.0.0
