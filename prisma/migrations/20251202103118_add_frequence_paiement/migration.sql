/*
  Warnings:

  - The `frequencePaiement` column on the `projets` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "projets" ADD COLUMN     "montantEstime" DOUBLE PRECISION,
DROP COLUMN "frequencePaiement",
ADD COLUMN     "frequencePaiement" TEXT NOT NULL DEFAULT 'PONCTUEL';
