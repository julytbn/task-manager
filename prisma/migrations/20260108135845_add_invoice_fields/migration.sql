-- AlterTable
ALTER TABLE "charges" ADD COLUMN     "avecTVA" BOOLEAN DEFAULT false,
ADD COLUMN     "montantTVA" DOUBLE PRECISION,
ADD COLUMN     "tauxTVA" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "documents_clients" ADD COLUMN     "chargeDetaileeId" TEXT,
ADD COLUMN     "dossierComptableId" TEXT;

-- AlterTable
ALTER TABLE "entrees_clients" ADD COLUMN     "dossierComptableId" TEXT,
ADD COLUMN     "montantHT" DOUBLE PRECISION,
ADD COLUMN     "montantTVA" DOUBLE PRECISION,
ADD COLUMN     "sourceType" TEXT;

-- CreateTable
CREATE TABLE "dossiers_comptables" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "mois" INTEGER NOT NULL,
    "annee" INTEGER NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'EN_COURS',
    "totalEntrees" DOUBLE PRECISION,
    "totalChargesHT" DOUBLE PRECISION,
    "totalChargesTVA" DOUBLE PRECISION,
    "totalTVA" DOUBLE PRECISION,
    "resultat" DOUBLE PRECISION,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateValidation" TIMESTAMP(3),
    "dateModification" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "dossiers_comptables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charges_detaillees" (
    "id" TEXT NOT NULL,
    "dossierComptableId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "fournisseur" TEXT NOT NULL,
    "montantHT" DOUBLE PRECISION NOT NULL,
    "avecTVA" BOOLEAN NOT NULL DEFAULT false,
    "tauxTVA" DOUBLE PRECISION,
    "montantTVA" DOUBLE PRECISION,
    "montantTTC" DOUBLE PRECISION NOT NULL,
    "categorie" "CategorieCharge" NOT NULL,
    "description" TEXT,
    "justificatifUrl" TEXT,
    "notes" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charges_detaillees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "situations_financieres" (
    "id" TEXT NOT NULL,
    "dossierComptableId" TEXT NOT NULL,
    "totalEntrees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalChargesHT" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalChargesTVA" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalChargesAvecTVA" DOUBLE PRECISION,
    "totalChargesSansTVA" DOUBLE PRECISION,
    "nombreChargesAvecTVA" INTEGER DEFAULT 0,
    "nombreChargesSansTVA" INTEGER DEFAULT 0,
    "resultat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTVA" DOUBLE PRECISION DEFAULT 0,
    "chargesParJour" JSONB,
    "chargesParCategorie" JSONB,
    "chargesParFournisseur" JSONB,
    "dateGeneration" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "situations_financieres_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dossiers_comptables_clientId_idx" ON "dossiers_comptables"("clientId");

-- CreateIndex
CREATE INDEX "dossiers_comptables_mois_annee_idx" ON "dossiers_comptables"("mois", "annee");

-- CreateIndex
CREATE INDEX "dossiers_comptables_statut_idx" ON "dossiers_comptables"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "dossiers_comptables_clientId_mois_annee_key" ON "dossiers_comptables"("clientId", "mois", "annee");

-- CreateIndex
CREATE INDEX "charges_detaillees_date_idx" ON "charges_detaillees"("date");

-- CreateIndex
CREATE INDEX "charges_detaillees_avecTVA_idx" ON "charges_detaillees"("avecTVA");

-- CreateIndex
CREATE INDEX "charges_detaillees_dossierComptableId_idx" ON "charges_detaillees"("dossierComptableId");

-- CreateIndex
CREATE INDEX "charges_detaillees_categorie_idx" ON "charges_detaillees"("categorie");

-- CreateIndex
CREATE UNIQUE INDEX "situations_financieres_dossierComptableId_key" ON "situations_financieres"("dossierComptableId");

-- CreateIndex
CREATE INDEX "documents_clients_dossierComptableId_idx" ON "documents_clients"("dossierComptableId");

-- CreateIndex
CREATE INDEX "entrees_clients_dossierComptableId_idx" ON "entrees_clients"("dossierComptableId");

-- AddForeignKey
ALTER TABLE "entrees_clients" ADD CONSTRAINT "entrees_clients_dossierComptableId_fkey" FOREIGN KEY ("dossierComptableId") REFERENCES "dossiers_comptables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossiers_comptables" ADD CONSTRAINT "dossiers_comptables_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges_detaillees" ADD CONSTRAINT "charges_detaillees_dossierComptableId_fkey" FOREIGN KEY ("dossierComptableId") REFERENCES "dossiers_comptables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "situations_financieres" ADD CONSTRAINT "situations_financieres_dossierComptableId_fkey" FOREIGN KEY ("dossierComptableId") REFERENCES "dossiers_comptables"("id") ON DELETE CASCADE ON UPDATE CASCADE;
