-- One-time local setup for CapStack (run as postgres superuser)
-- Creates role + database matching .env.example

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'capstack') THEN
    CREATE ROLE capstack LOGIN PASSWORD 'capstack';
  END IF;
END
$$;

SELECT 'CREATE DATABASE capstack OWNER capstack'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'capstack')\gexec

GRANT ALL PRIVILEGES ON DATABASE capstack TO capstack;
