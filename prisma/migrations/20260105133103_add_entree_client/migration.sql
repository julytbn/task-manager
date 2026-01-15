-- CreateEnum
CREATE TYPE "CategorieEntree" AS ENUM ('VENTES_PRODUITS', 'SERVICES_RENDUS', 'LOYERS_RECUS', 'INTERETS_PLACEMENTS', 'SUBVENTIONS', 'AUTRES_REVENUS');

-- CreateTable
CREATE TABLE "entrees_clients" (
    "id" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "categorie" "CategorieEntree" NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,
    "justificatifUrl" TEXT,
    "notes" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entrees_clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "entrees_clients_categorie_idx" ON "entrees_clients"("categorie");

-- CreateIndex
CREATE INDEX "entrees_clients_date_idx" ON "entrees_clients"("date");

-- CreateIndex
CREATE INDEX "entrees_clients_clientId_idx" ON "entrees_clients"("clientId");

-- AddForeignKey
ALTER TABLE "entrees_clients" ADD CONSTRAINT "entrees_clients_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
