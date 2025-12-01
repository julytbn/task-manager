-- AlterTable
ALTER TABLE "projets" ADD COLUMN     "equipeId" TEXT;

-- AlterTable
ALTER TABLE "taches" ADD COLUMN     "equipeId" TEXT;

-- CreateTable
CREATE TABLE "equipes" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "objectifs" TEXT,
    "dateEcheance" TIMESTAMP(3),
    "leadId" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membres_equipes" (
    "id" TEXT NOT NULL,
    "equipeId" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "role" TEXT,
    "dateAjout" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membres_equipes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "membres_equipes_equipeId_utilisateurId_key" ON "membres_equipes"("equipeId", "utilisateurId");

-- AddForeignKey
ALTER TABLE "projets" ADD CONSTRAINT "projets_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "equipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taches" ADD CONSTRAINT "taches_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "equipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipes" ADD CONSTRAINT "equipes_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membres_equipes" ADD CONSTRAINT "membres_equipes_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "equipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membres_equipes" ADD CONSTRAINT "membres_equipes_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
