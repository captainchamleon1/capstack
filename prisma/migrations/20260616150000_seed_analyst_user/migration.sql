-- Provision default Equitr analyst account (idempotent)
INSERT INTO "User" ("id", "email", "passwordHash", "name", "isAnalyst", "createdAt", "updatedAt")
VALUES (
  'clseedanalyst00000000001',
  'analyst@equitr.com',
  '$2b$12$Mzk3f7oQjACbwvAlqDHuNOrlaNIWUK/7pLfZAw3BcueOy7jq.NfHq',
  'Equitr Analyst',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO UPDATE SET
  "isAnalyst" = true,
  "name" = EXCLUDED."name",
  "updatedAt" = CURRENT_TIMESTAMP;
