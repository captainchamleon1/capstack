-- One-time local setup for Equitr (run as postgres superuser)
-- Creates role + database matching .env.example

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'equitr') THEN
    CREATE ROLE equitr LOGIN PASSWORD 'equitr';
  END IF;
END
$$;

SELECT 'CREATE DATABASE equitr OWNER equitr'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'equitr')\gexec

GRANT ALL PRIVILEGES ON DATABASE equitr TO equitr;
