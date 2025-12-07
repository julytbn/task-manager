/*
  Warnings:

  - The `frequencePaiement` column on the `projets` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "projets" DROP COLUMN "frequencePaiement",
ADD COLUMN     "frequencePaiement" "FrequencePaiement" NOT NULL DEFAULT 'PONCTUEL';
