-- CreateEnum
CREATE TYPE "StatutAbonnement" AS ENUM ('ACTIF', 'SUSPENDU', 'EN_RETARD', 'ANNULE', 'TERMINE');

-- AlterTable
ALTER TABLE "factures" ADD COLUMN     "abonnementId" TEXT;

-- CreateTable
CREATE TABLE "abonnements" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "clientId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "frequence" "FrequencePaiement" NOT NULL DEFAULT 'MENSUEL',
    "statut" "StatutAbonnement" NOT NULL DEFAULT 'ACTIF',
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "dateProchainFacture" TIMESTAMP(3) NOT NULL,
    "dernierPaiement" TIMESTAMP(3),
    "notificationEnvoyee" BOOLEAN NOT NULL DEFAULT false,
    "nombrePaiementsEffectues" INTEGER NOT NULL DEFAULT 0,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "abonnements_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "factures" ADD CONSTRAINT "factures_abonnementId_fkey" FOREIGN KEY ("abonnementId") REFERENCES "abonnements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonnements" ADD CONSTRAINT "abonnements_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonnements" ADD CONSTRAINT "abonnements_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
