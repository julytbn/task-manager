/*
  Warnings:

  - The `type` column on the `documents_clients` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `dateModification` to the `documents_clients` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TypeDocument" AS ENUM ('ENTREE', 'CHARGE', 'AUTRE');

-- AlterTable
ALTER TABLE "documents_clients" ADD COLUMN     "categorie" TEXT,
ADD COLUMN     "chargeId" TEXT,
ADD COLUMN     "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dateDocument" TIMESTAMP(3),
ADD COLUMN     "dateModification" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "entreeId" TEXT,
ADD COLUMN     "montant" DOUBLE PRECISION,
ADD COLUMN     "notes" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "TypeDocument";

-- CreateIndex
CREATE INDEX "documents_clients_type_idx" ON "documents_clients"("type");

-- CreateIndex
CREATE INDEX "documents_clients_categorie_idx" ON "documents_clients"("categorie");

-- CreateIndex
CREATE INDEX "documents_clients_dateDocument_idx" ON "documents_clients"("dateDocument");

-- CreateIndex
CREATE INDEX "documents_clients_clientId_idx" ON "documents_clients"("clientId");
