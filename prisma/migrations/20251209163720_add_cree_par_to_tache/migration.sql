/*
  Warnings:

  - You are about to drop the column `frequencePaiement` on the `projets` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "projets" DROP COLUMN "frequencePaiement";

-- AlterTable
ALTER TABLE "taches" ADD COLUMN     "creeParId" TEXT;

-- AddForeignKey
ALTER TABLE "taches" ADD CONSTRAINT "taches_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
