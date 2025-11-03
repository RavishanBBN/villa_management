-- Halcyon Rest Database Initialization Script
-- This script creates the database and user if they don't exist

-- Create database user (run this as postgres superuser)
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'halcyon_user') THEN
      CREATE ROLE halcyon_user LOGIN PASSWORD 'Vn@851015';
   END IF;
END
$do$;

-- Create database
SELECT 'CREATE DATABASE halcyon_rest_db OWNER halcyon_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'halcyon_rest_db')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE halcyon_rest_db TO halcyon_user;

-- Connect to the database
\c halcyon_rest_db

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO halcyon_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO halcyon_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO halcyon_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO halcyon_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO halcyon_user;

-- Success message
\echo 'Database halcyon_rest_db created successfully!'
\echo 'User halcyon_user granted all privileges!'
