-- AlterTable
ALTER TABLE "paiements" ADD COLUMN     "datePaiementAttendu" TIMESTAMP(3),
ADD COLUMN     "notificationEnvoyee" BOOLEAN NOT NULL DEFAULT false;
