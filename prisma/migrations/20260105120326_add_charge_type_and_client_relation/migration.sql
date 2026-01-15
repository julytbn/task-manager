-- CreateEnum
CREATE TYPE "TypeCharge" AS ENUM ('ENTREPRISE', 'CLIENT', 'PROJET');

-- AlterTable
ALTER TABLE "charges" ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "type" "TypeCharge" NOT NULL DEFAULT 'ENTREPRISE';

-- CreateIndex
CREATE INDEX "charges_type_idx" ON "charges"("type");

-- CreateIndex
CREATE INDEX "charges_clientId_idx" ON "charges"("clientId");

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
