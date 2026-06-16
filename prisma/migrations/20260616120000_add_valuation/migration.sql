-- CreateTable
CREATE TABLE "Valuation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "valuationDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "method" TEXT NOT NULL,
    "dlomMethod" TEXT NOT NULL DEFAULT 'finnerty',
    "concludedFmv" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "marketableCommonPerShare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "equityValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dlomValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "volatility" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeToLiquidity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "riskFreeRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dividendYield" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "holdingPeriod" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "inputs" TEXT,
    "result" TEXT,
    "preparedById" TEXT,
    "preparedByName" TEXT,
    "reviewedById" TEXT,
    "reviewedByName" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "adoptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Valuation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Valuation_companyId_createdAt_idx" ON "Valuation"("companyId", "createdAt");

-- AddForeignKey
ALTER TABLE "Valuation" ADD CONSTRAINT "Valuation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
