-- CreateEnum
CREATE TYPE "FrequencePaiement" AS ENUM ('PONCTUEL', 'MENSUEL', 'TRIMESTRIEL', 'SEMESTRIEL', 'ANNUEL');

-- AlterTable
ALTER TABLE "projets" ADD COLUMN     "frequencePaiement" "FrequencePaiement" NOT NULL DEFAULT 'PONCTUEL';
