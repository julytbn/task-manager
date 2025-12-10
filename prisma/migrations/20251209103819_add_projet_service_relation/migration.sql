/*
  Warnings:

  - You are about to drop the column `serviceId` on the `factures` table. All the data in the column will be lost.
  - You are about to drop the column `montantEstime` on the `projets` table. All the data in the column will be lost.
  - You are about to drop the column `serviceId` on the `projets` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "factures" DROP CONSTRAINT "factures_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "projets" DROP CONSTRAINT "projets_serviceId_fkey";

-- AlterTable
ALTER TABLE "factures" DROP COLUMN "serviceId";

-- AlterTable
ALTER TABLE "projets" DROP COLUMN "montantEstime",
DROP COLUMN "serviceId",
ADD COLUMN     "montantTotal" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "projet_services" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "montant" DOUBLE PRECISION,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "dateAjout" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projet_services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projet_services_projetId_serviceId_key" ON "projet_services"("projetId", "serviceId");

-- AddForeignKey
ALTER TABLE "projet_services" ADD CONSTRAINT "projet_services_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projet_services" ADD CONSTRAINT "projet_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
