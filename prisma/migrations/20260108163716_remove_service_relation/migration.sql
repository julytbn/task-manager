/*
  Warnings:

  - You are about to drop the column `serviceId` on the `abonnements` table. All the data in the column will be lost.
  - You are about to drop the column `sourceType` on the `entrees_clients` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "abonnements" DROP CONSTRAINT "abonnements_serviceId_fkey";

-- AlterTable
ALTER TABLE "abonnements" DROP COLUMN "serviceId";

-- AlterTable
ALTER TABLE "entrees_clients" DROP COLUMN "sourceType",
ADD COLUMN     "montantTTC" DOUBLE PRECISION,
ADD COLUMN     "tauxTVA" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "lignes_factures" (
    "id" TEXT NOT NULL,
    "entreeClientId" TEXT NOT NULL,
    "reference" TEXT,
    "description" TEXT NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL,
    "prixUnitaireHT" DOUBLE PRECISION NOT NULL,
    "totalHT" DOUBLE PRECISION NOT NULL,
    "totalTVA" DOUBLE PRECISION,
    "totalTTC" DOUBLE PRECISION,
    "tauxTVA" DOUBLE PRECISION,

    CONSTRAINT "lignes_factures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lignes_factures_entreeClientId_idx" ON "lignes_factures"("entreeClientId");

-- AddForeignKey
ALTER TABLE "lignes_factures" ADD CONSTRAINT "lignes_factures_entreeClientId_fkey" FOREIGN KEY ("entreeClientId") REFERENCES "entrees_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
