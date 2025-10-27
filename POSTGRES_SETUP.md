# PostgreSQL Setup Guide

## Step 1: Create PostgreSQL Database

Run the following command to set up the database:

```bash
sudo -u postgres psql -f /home/ben/bidding-marketplace/setup_postgres.sql
```

**OR** if you prefer to do it manually:

```bash
# Switch to postgres user
sudo -u postgres psql

# Then run these commands in the PostgreSQL prompt:
CREATE DATABASE bidding_marketplace;
CREATE USER bidding_user WITH PASSWORD 'bidding_password123';
ALTER ROLE bidding_user SET client_encoding TO 'utf8';
ALTER ROLE bidding_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE bidding_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE bidding_marketplace TO bidding_user;

# Connect to the database
\c bidding_marketplace

# Grant schema privileges
GRANT ALL ON SCHEMA public TO bidding_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bidding_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bidding_user;

# Exit postgres
\q
```

## Step 2: Run Django Migrations

After setting up the PostgreSQL database, run migrations:

```bash
cd /home/ben/bidding-marketplace
source venv/bin/activate
python manage.py migrate
```

## Step 3: Create Superuser

```bash
python manage.py createsuperuser
```

## Step 4: Start the Server

```bash
python manage.py runserver
```

## Troubleshooting

### Connection Error
If you get a connection error, check PostgreSQL is running:
```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
```

### Authentication Error
If you get authentication errors, you may need to edit PostgreSQL's pg_hba.conf:
```bash
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

Change the line:
```
local   all             all                                     peer
```

To:
```
local   all             all                                     md5
```

Then restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

## Environment Variables

Your database credentials are stored in `.env`:
- DB_NAME=bidding_marketplace
- DB_USER=bidding_user
- DB_PASSWORD=bidding_password123
- DB_HOST=localhost
- DB_PORT=5432

**IMPORTANT**: Change the DB_PASSWORD before going to production!
