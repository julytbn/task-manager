/*
  Warnings:

  - You are about to drop the column `avecTVA` on the `charges` table. All the data in the column will be lost.
  - You are about to drop the column `clientId` on the `charges` table. All the data in the column will be lost.
  - You are about to drop the column `montantTVA` on the `charges` table. All the data in the column will be lost.
  - You are about to drop the column `tauxTVA` on the `charges` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `charges` table. All the data in the column will be lost.
  - You are about to drop the column `categorie` on the `documents_clients` table. All the data in the column will be lost.
  - You are about to drop the column `chargeDetaileeId` on the `documents_clients` table. All the data in the column will be lost.
  - You are about to drop the column `chargeId` on the `documents_clients` table. All the data in the column will be lost.
  - You are about to drop the column `dateCreation` on the `documents_clients` table. All the data in the column will be lost.
  - You are about to drop the column `dateDocument` on the `documents_clients` table. All the data in the column will be lost.
  - You are about to drop the column `dateModification` on the `documents_clients` table. All the data in the column will be lost.
  - You are about to drop the column `dossierComptableId` on the `documents_clients` table. All the data in the column will be lost.
  - You are about to drop the column `entreeId` on the `documents_clients` table. All the data in the column will be lost.
  - You are about to drop the column `montant` on the `documents_clients` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `documents_clients` table. All the data in the column will be lost.
  - The `type` column on the `documents_clients` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `type` on the `facture_lignes` table. All the data in the column will be lost.
  - You are about to drop the column `pro_forma_id` on the `factures` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `pro_forma_lignes` table. All the data in the column will be lost.
  - You are about to drop the `charges_detaillees` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `dossiers_comptables` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `entrees_clients` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lignes_factures` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `objectifs_employes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `situations_financieres` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "RegimeFiscal" AS ENUM ('AVEC_TVA', 'SANS_TVA', 'TPU');

-- DropForeignKey
ALTER TABLE "charges" DROP CONSTRAINT "charges_clientId_fkey";

-- DropForeignKey
ALTER TABLE "charges_detaillees" DROP CONSTRAINT "charges_detaillees_dossierComptableId_fkey";

-- DropForeignKey
ALTER TABLE "dossiers_comptables" DROP CONSTRAINT "dossiers_comptables_clientId_fkey";

-- DropForeignKey
ALTER TABLE "entrees_clients" DROP CONSTRAINT "entrees_clients_clientId_fkey";

-- DropForeignKey
ALTER TABLE "entrees_clients" DROP CONSTRAINT "entrees_clients_dossierComptableId_fkey";

-- DropForeignKey
ALTER TABLE "factures" DROP CONSTRAINT "factures_pro_forma_id_fkey";

-- DropForeignKey
ALTER TABLE "lignes_factures" DROP CONSTRAINT "lignes_factures_entreeClientId_fkey";

-- DropForeignKey
ALTER TABLE "situations_financieres" DROP CONSTRAINT "situations_financieres_dossierComptableId_fkey";

-- DropIndex
DROP INDEX "charges_clientId_idx";

-- DropIndex
DROP INDEX "charges_type_idx";

-- DropIndex
DROP INDEX "documents_clients_categorie_idx";

-- DropIndex
DROP INDEX "documents_clients_clientId_idx";

-- DropIndex
DROP INDEX "documents_clients_dateDocument_idx";

-- DropIndex
DROP INDEX "documents_clients_dossierComptableId_idx";

-- DropIndex
DROP INDEX "documents_clients_type_idx";

-- AlterTable
ALTER TABLE "abonnements" ADD COLUMN     "serviceId" TEXT;

-- AlterTable
ALTER TABLE "charges" DROP COLUMN "avecTVA",
DROP COLUMN "clientId",
DROP COLUMN "montantTVA",
DROP COLUMN "tauxTVA",
DROP COLUMN "type";

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "regimeFiscal" "RegimeFiscal";

-- AlterTable
ALTER TABLE "documents_clients" DROP COLUMN "categorie",
DROP COLUMN "chargeDetaileeId",
DROP COLUMN "chargeId",
DROP COLUMN "dateCreation",
DROP COLUMN "dateDocument",
DROP COLUMN "dateModification",
DROP COLUMN "dossierComptableId",
DROP COLUMN "entreeId",
DROP COLUMN "montant",
DROP COLUMN "notes",
DROP COLUMN "type",
ADD COLUMN     "type" TEXT;

-- AlterTable
ALTER TABLE "facture_lignes" DROP COLUMN IF EXISTS "type";

-- AlterTable
ALTER TABLE "factures" DROP COLUMN "pro_forma_id";

-- AlterTable
ALTER TABLE "pro_forma_lignes" DROP COLUMN IF EXISTS "type";

-- DropTable
DROP TABLE "charges_detaillees";

-- DropTable
DROP TABLE "dossiers_comptables";

-- DropTable
DROP TABLE "entrees_clients";

-- DropTable
DROP TABLE "lignes_factures";

-- DropTable
DROP TABLE "objectifs_employes";

-- DropTable
DROP TABLE "situations_financieres";

-- DropEnum
DROP TYPE "CategorieEntree";

-- DropEnum
DROP TYPE "TypeCharge";

-- DropEnum
DROP TYPE "TypeDocument";

-- AddForeignKey
ALTER TABLE "abonnements" ADD CONSTRAINT "abonnements_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;
