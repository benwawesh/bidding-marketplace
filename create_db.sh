#!/bin/bash
# Simple script to create PostgreSQL database

sudo -u postgres psql <<EOF
CREATE DATABASE bidding_marketplace;
CREATE USER bidding_user WITH PASSWORD 'bidding_password123';
ALTER ROLE bidding_user SET client_encoding TO 'utf8';
ALTER ROLE bidding_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE bidding_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE bidding_marketplace TO bidding_user;
\c bidding_marketplace
GRANT ALL ON SCHEMA public TO bidding_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO bidding_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO bidding_user;
EOF

echo "Database created successfully!"
