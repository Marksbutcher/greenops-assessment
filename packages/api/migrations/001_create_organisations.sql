-- 001_create_organisations.sql
-- Organisation entity for assessment instances

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  sector VARCHAR(100) NOT NULL,
  size_band VARCHAR(50) NOT NULL,
  region VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_organisations_name ON organisations(name);
