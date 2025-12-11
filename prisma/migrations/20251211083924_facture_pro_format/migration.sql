/*
  Warnings:

  - You are about to drop the column `devisId` on the `projets` table. All the data in the column will be lost.
  - You are about to drop the `devis` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `devis_services` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "StatutFacture" ADD VALUE 'VALIDEE';

-- DropForeignKey
ALTER TABLE "devis" DROP CONSTRAINT "devis_clientId_fkey";

-- DropForeignKey
ALTER TABLE "devis_services" DROP CONSTRAINT "devis_services_devisId_fkey";

-- DropForeignKey
ALTER TABLE "devis_services" DROP CONSTRAINT "devis_services_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "projets" DROP CONSTRAINT "projets_devisId_fkey";

-- AlterTable
ALTER TABLE "factures" ADD COLUMN     "conditionsPaiement" TEXT,
ADD COLUMN     "dateEnvoi" TIMESTAMP(3),
ADD COLUMN     "dateValidation" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "reference" TEXT,
ADD COLUMN     "valideeParId" TEXT;

-- AlterTable
ALTER TABLE "projets" DROP COLUMN "devisId";

-- DropTable
DROP TABLE "devis";

-- DropTable
DROP TABLE "devis_services";

-- DropEnum
DROP TYPE "StatutDevis";

-- CreateIndex
CREATE INDEX "factures_statut_idx" ON "factures"("statut");

-- CreateIndex
CREATE INDEX "factures_clientId_idx" ON "factures"("clientId");

-- AddForeignKey
ALTER TABLE "factures" ADD CONSTRAINT "factures_valideeParId_fkey" FOREIGN KEY ("valideeParId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
