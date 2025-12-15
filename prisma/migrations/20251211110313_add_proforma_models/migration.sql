-- CreateEnum
CREATE TYPE "StatutProForma" AS ENUM ('EN_COURS', 'ACCEPTEE', 'REJETEE', 'FACTUREE', 'EXPIREE');

-- CreateTable
CREATE TABLE "pro_formas" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "projetId" TEXT,
    "montant" DOUBLE PRECISION NOT NULL,
    "tauxTVA" DOUBLE PRECISION NOT NULL DEFAULT 0.18,
    "montantTotal" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "statut" "StatutProForma" NOT NULL DEFAULT 'EN_COURS',
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateValidation" TIMESTAMP(3),
    "dateEcheance" TIMESTAMP(3),
    "dateConversion" TIMESTAMP(3),
    "creePar" TEXT,
    "notes" TEXT,

    CONSTRAINT "pro_formas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pro_forma_lignes" (
    "id" TEXT NOT NULL,
    "proFormaId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "montantAPayer" DOUBLE PRECISION NOT NULL,
    "montantGlobal" DOUBLE PRECISION NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pro_forma_lignes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pro_formas_numero_key" ON "pro_formas"("numero");

-- CreateIndex
CREATE INDEX "pro_formas_statut_idx" ON "pro_formas"("statut");

-- CreateIndex
CREATE INDEX "pro_formas_clientId_idx" ON "pro_formas"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "pro_formas_clientId_numero_key" ON "pro_formas"("clientId", "numero");

-- CreateIndex
CREATE INDEX "pro_forma_lignes_proFormaId_idx" ON "pro_forma_lignes"("proFormaId");

-- AddForeignKey
ALTER TABLE "pro_formas" ADD CONSTRAINT "pro_formas_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pro_formas" ADD CONSTRAINT "pro_formas_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pro_forma_lignes" ADD CONSTRAINT "pro_forma_lignes_proFormaId_fkey" FOREIGN KEY ("proFormaId") REFERENCES "pro_formas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
