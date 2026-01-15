-- CreateTable
CREATE TABLE "objectifs_employes" (
    "id" TEXT NOT NULL,
    "employeId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "valeurCible" DOUBLE PRECISION NOT NULL,
    "valeurActuelle" DOUBLE PRECISION NOT NULL,
    "progression" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "derniereMiseAJour" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "objectifs_employes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "objectifs_employes_employeId_idx" ON "objectifs_employes"("employeId");
