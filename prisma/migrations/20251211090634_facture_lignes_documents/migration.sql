-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "siren" TEXT,
ADD COLUMN     "siret" TEXT;

-- AlterTable
ALTER TABLE "factures" ADD COLUMN     "montantEnLettres" TEXT,
ADD COLUMN     "signatureUrl" TEXT;

-- CreateTable
CREATE TABLE "facture_lignes" (
    "id" TEXT NOT NULL,
    "factureId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "intervenant" TEXT,
    "montantAPayer" DOUBLE PRECISION NOT NULL,
    "montantGlobal" DOUBLE PRECISION NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facture_lignes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facture_documents" (
    "id" TEXT NOT NULL,
    "factureId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "obligatoire" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "uploadedUrl" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facture_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "facture_lignes_factureId_idx" ON "facture_lignes"("factureId");

-- CreateIndex
CREATE INDEX "facture_documents_factureId_idx" ON "facture_documents"("factureId");

-- AddForeignKey
ALTER TABLE "facture_lignes" ADD CONSTRAINT "facture_lignes_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "factures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facture_documents" ADD CONSTRAINT "facture_documents_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "factures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
