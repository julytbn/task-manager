/*
  Warnings:

  - A unique constraint covering the columns `[abonnementId,dateEmission]` on the table `factures` will be added. If there are existing duplicate values, this will fail.
  - Made the column `factureId` on table `paiements` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "documents_clients" DROP CONSTRAINT "documents_clients_clientId_fkey";

-- DropForeignKey
ALTER TABLE "membres_equipes" DROP CONSTRAINT "membres_equipes_equipeId_fkey";

-- DropForeignKey
ALTER TABLE "membres_equipes" DROP CONSTRAINT "membres_equipes_utilisateurId_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_utilisateurId_fkey";

-- DropForeignKey
ALTER TABLE "paiements" DROP CONSTRAINT "paiements_factureId_fkey";

-- DropForeignKey
ALTER TABLE "paiements" DROP CONSTRAINT "paiements_projetId_fkey";

-- DropForeignKey
ALTER TABLE "paiements" DROP CONSTRAINT "paiements_tacheId_fkey";

-- Nettoyer les paiements sans facture
DELETE FROM "paiements" WHERE "factureId" IS NULL;

-- Supprimer les doublons de (abonnementId, dateEmission) en gardant le premier
DELETE FROM "factures" f1 WHERE 
  "abonnementId" IS NOT NULL AND 
  "dateEmission" IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM "factures" f2 
    WHERE f2."abonnementId" = f1."abonnementId" 
    AND f2."dateEmission" = f1."dateEmission" 
    AND f2."id" < f1."id"
  );

-- AlterTable
ALTER TABLE "paiements" ALTER COLUMN "tacheId" DROP NOT NULL,
ALTER COLUMN "projetId" DROP NOT NULL,
ALTER COLUMN "factureId" SET NOT NULL;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "categoryId" TEXT;

-- CreateTable
CREATE TABLE "service_categories" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_categories_nom_key" ON "service_categories"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "factures_abonnementId_dateEmission_key" ON "factures"("abonnementId", "dateEmission");

-- AddForeignKey
ALTER TABLE "documents_clients" ADD CONSTRAINT "documents_clients_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "service_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "factures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_tacheId_fkey" FOREIGN KEY ("tacheId") REFERENCES "taches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membres_equipes" ADD CONSTRAINT "membres_equipes_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "equipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membres_equipes" ADD CONSTRAINT "membres_equipes_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
