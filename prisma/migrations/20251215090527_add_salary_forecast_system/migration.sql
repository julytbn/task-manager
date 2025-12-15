-- AlterTable
ALTER TABLE "utilisateurs" ADD COLUMN     "tarifHoraire" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "previsions_salaires" (
    "id" TEXT NOT NULL,
    "employeId" TEXT NOT NULL,
    "mois" INTEGER NOT NULL,
    "annee" INTEGER NOT NULL,
    "montantPrevu" DOUBLE PRECISION NOT NULL,
    "montantNotifie" DOUBLE PRECISION,
    "dateNotification" TIMESTAMP(3),
    "dateGeneration" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "previsions_salaires_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "previsions_salaires_employeId_idx" ON "previsions_salaires"("employeId");

-- CreateIndex
CREATE INDEX "previsions_salaires_mois_annee_idx" ON "previsions_salaires"("mois", "annee");

-- CreateIndex
CREATE UNIQUE INDEX "previsions_salaires_employeId_mois_annee_key" ON "previsions_salaires"("employeId", "mois", "annee");

-- AddForeignKey
ALTER TABLE "previsions_salaires" ADD CONSTRAINT "previsions_salaires_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
