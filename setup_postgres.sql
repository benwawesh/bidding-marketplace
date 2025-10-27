-- PostgreSQL Database Setup Script for Bidding Marketplace
-- Run this script as the postgres user

-- Create database
CREATE DATABASE bidding_marketplace;

-- Create user
CREATE USER bidding_user WITH PASSWORD 'bidding_password123';

-- Grant privileges
ALTER ROLE bidding_user SET client_encoding TO 'utf8';
ALTER ROLE bidding_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE bidding_user SET timezone TO 'UTC';

-- Grant all privileges on the database
GRANT ALL PRIVILEGES ON DATABASE bidding_marketplace TO bidding_user;

-- Connect to the database and grant schema privileges
\c bidding_marketplace
GRANT ALL ON SCHEMA public TO bidding_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bidding_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bidding_user;
