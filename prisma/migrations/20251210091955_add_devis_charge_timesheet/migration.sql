-- CreateEnum
CREATE TYPE "StatutDevis" AS ENUM ('BROUILLON', 'ENVOYE', 'ACCEPTE', 'REFUSE', 'ANNULE');

-- CreateEnum
CREATE TYPE "CategorieCharge" AS ENUM ('SALAIRES_CHARGES_SOCIALES', 'LOYER_IMMOBILIER', 'UTILITIES', 'MATERIEL_EQUIPEMENT', 'TRANSPORT_DEPLACEMENT', 'FOURNITURES_BUREAUTIQUE', 'MARKETING_COMMUNICATION', 'ASSURANCES', 'TAXES_IMPOTS', 'AUTRES_CHARGES');

-- CreateEnum
CREATE TYPE "StatutTimeSheet" AS ENUM ('EN_ATTENTE', 'VALIDEE', 'REJETEE', 'CORRIGEE');

-- AlterTable
ALTER TABLE "projets" ADD COLUMN     "devisId" TEXT;

-- CreateTable
CREATE TABLE "devis" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "titre" TEXT,
    "description" TEXT,
    "montant" DOUBLE PRECISION NOT NULL,
    "tauxTVA" DOUBLE PRECISION NOT NULL DEFAULT 0.18,
    "montantTotal" DOUBLE PRECISION NOT NULL,
    "statut" "StatutDevis" NOT NULL DEFAULT 'BROUILLON',
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateEnvoi" TIMESTAMP(3),
    "dateAccept" TIMESTAMP(3),
    "dateRefus" TIMESTAMP(3),
    "notes" TEXT,
    "dateModification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devis_services" (
    "id" TEXT NOT NULL,
    "devisId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL DEFAULT 1,
    "prix" DOUBLE PRECISION,
    "dateAjout" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devis_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charges" (
    "id" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "categorie" "CategorieCharge" NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projetId" TEXT,
    "employeId" TEXT,
    "justificatifUrl" TEXT,
    "notes" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timesheets" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "regularHrs" INTEGER NOT NULL,
    "overtimeHrs" INTEGER,
    "sickHrs" INTEGER,
    "vacationHrs" INTEGER,
    "description" TEXT,
    "statut" "StatutTimeSheet" NOT NULL DEFAULT 'EN_ATTENTE',
    "employeeId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,
    "validePar" TEXT,

    CONSTRAINT "timesheets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "devis_numero_key" ON "devis"("numero");

-- CreateIndex
CREATE INDEX "devis_clientId_idx" ON "devis"("clientId");

-- CreateIndex
CREATE INDEX "devis_statut_idx" ON "devis"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "devis_services_devisId_serviceId_key" ON "devis_services"("devisId", "serviceId");

-- CreateIndex
CREATE INDEX "charges_categorie_idx" ON "charges"("categorie");

-- CreateIndex
CREATE INDEX "charges_date_idx" ON "charges"("date");

-- CreateIndex
CREATE INDEX "charges_projetId_idx" ON "charges"("projetId");

-- CreateIndex
CREATE INDEX "timesheets_projectId_idx" ON "timesheets"("projectId");

-- CreateIndex
CREATE INDEX "timesheets_employeeId_idx" ON "timesheets"("employeeId");

-- CreateIndex
CREATE INDEX "timesheets_date_idx" ON "timesheets"("date");

-- AddForeignKey
ALTER TABLE "projets" ADD CONSTRAINT "projets_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "devis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devis" ADD CONSTRAINT "devis_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devis_services" ADD CONSTRAINT "devis_services_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "devis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devis_services" ADD CONSTRAINT "devis_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "taches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_validePar_fkey" FOREIGN KEY ("validePar") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
