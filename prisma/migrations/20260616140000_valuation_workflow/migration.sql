-- Analyst role and client submission workflow for 409A valuations

ALTER TABLE "User" ADD COLUMN "isAnalyst" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Valuation" ADD COLUMN "clientNotes" TEXT;
ALTER TABLE "Valuation" ADD COLUMN "submittedAt" TIMESTAMP(3);
ALTER TABLE "Valuation" ADD COLUMN "submittedById" TEXT;
ALTER TABLE "Valuation" ADD COLUMN "submittedByName" TEXT;
