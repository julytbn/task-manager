-- CreateEnum
CREATE TYPE "TypeClient" AS ENUM ('PARTICULIER', 'ENTREPRISE', 'ORGANISATION');

-- CreateEnum
CREATE TYPE "CategorieService" AS ENUM ('COMPTABILITE', 'AUDIT_FISCALITE', 'MARKETING', 'COMMUNICATION', 'REDACTION_GESTION_PROJET', 'DEMARRAGE_ADMINISTRATIF', 'FORMATION', 'COACHING', 'ETUDE_MARCHE', 'CONCEPTION_IMPRESSION', 'IMMOBILIER');

-- CreateEnum
CREATE TYPE "StatutProjet" AS ENUM ('PROPOSITION', 'EN_ATTENTE', 'EN_COURS', 'TERMINE', 'EN_RETARD', 'ANNULE');

-- CreateEnum
CREATE TYPE "StatutTache" AS ENUM ('A_FAIRE', 'EN_COURS', 'EN_REVISION', 'TERMINE', 'ANNULE');

-- CreateEnum
CREATE TYPE "Priorite" AS ENUM ('BASSE', 'MOYENNE', 'HAUTE', 'URGENTE');

-- CreateEnum
CREATE TYPE "StatutFacture" AS ENUM ('BROUILLON', 'EN_ATTENTE', 'PARTIELLEMENT_PAYEE', 'PAYEE', 'RETARD', 'ANNULEE');

-- CreateEnum
CREATE TYPE "StatutPaiement" AS ENUM ('EN_ATTENTE', 'CONFIRME', 'REFUSE', 'REMBOURSE');

-- CreateEnum
CREATE TYPE "MoyenPaiement" AS ENUM ('ESPECES', 'CHEQUE', 'VIREMENT_BANCAIRE', 'CARTE_BANCAIRE', 'MOBILE_MONEY', 'PAYPAL', 'AUTRE');

-- CreateEnum
CREATE TYPE "RoleUtilisateur" AS ENUM ('ADMIN', 'MANAGER', 'EMPLOYE', 'CONSULTANT');

-- CreateEnum
CREATE TYPE "TypeSouhait" AS ENUM ('ANNIVERSAIRE', 'BONNE_ANNEE', 'FETE', 'AUTRE');

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "entreprise" TEXT,
    "adresse" TEXT,
    "type" "TypeClient" NOT NULL DEFAULT 'PARTICULIER',
    "dateNaissance" TIMESTAMP(3),
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "categorie" "CategorieService" NOT NULL,
    "prix" DOUBLE PRECISION,
    "dureeEstimee" INTEGER,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projets" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "clientId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "statut" "StatutProjet" NOT NULL DEFAULT 'EN_COURS',
    "budget" DOUBLE PRECISION,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "dateEcheance" TIMESTAMP(3),
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taches" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "projetId" TEXT NOT NULL,
    "serviceId" TEXT,
    "assigneAId" TEXT,
    "statut" "StatutTache" NOT NULL DEFAULT 'A_FAIRE',
    "priorite" "Priorite" NOT NULL DEFAULT 'MOYENNE',
    "dateEcheance" TIMESTAMP(3),
    "heuresEstimees" DOUBLE PRECISION,
    "heuresReelles" DOUBLE PRECISION,
    "facturable" BOOLEAN NOT NULL DEFAULT true,
    "estPayee" BOOLEAN NOT NULL DEFAULT false,
    "montant" DOUBLE PRECISION,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,
    "factureId" TEXT,

    CONSTRAINT "taches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paiements" (
    "id" TEXT NOT NULL,
    "tacheId" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "factureId" TEXT,
    "montant" DOUBLE PRECISION NOT NULL,
    "moyenPaiement" "MoyenPaiement" NOT NULL,
    "reference" TEXT,
    "datePaiement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateReception" TIMESTAMP(3),
    "statut" "StatutPaiement" NOT NULL DEFAULT 'EN_ATTENTE',
    "notes" TEXT,
    "preuvePaiement" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paiements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factures" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "projetId" TEXT,
    "statut" "StatutFacture" NOT NULL DEFAULT 'EN_ATTENTE',
    "montant" DOUBLE PRECISION NOT NULL,
    "tauxTVA" DOUBLE PRECISION NOT NULL DEFAULT 0.18,
    "montantTotal" DOUBLE PRECISION NOT NULL,
    "dateEmission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateEcheance" TIMESTAMP(3),
    "datePaiement" TIMESTAMP(3),
    "notes" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "factures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "role" "RoleUtilisateur" NOT NULL DEFAULT 'EMPLOYE',
    "departement" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "dateNaissance" TIMESTAMP(3),
    "motDePasse" TEXT,
    "emailVerifie" TIMESTAMP(3),
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "souhaits" (
    "id" TEXT NOT NULL,
    "type" "TypeSouhait" NOT NULL,
    "message" TEXT NOT NULL,
    "clientId" TEXT,
    "utilisateurId" TEXT,
    "dateEnvoi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "envoye" BOOLEAN NOT NULL DEFAULT false,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "souhaits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "services_nom_key" ON "services"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "factures_numero_key" ON "factures"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- AddForeignKey
ALTER TABLE "projets" ADD CONSTRAINT "projets_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projets" ADD CONSTRAINT "projets_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taches" ADD CONSTRAINT "taches_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taches" ADD CONSTRAINT "taches_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taches" ADD CONSTRAINT "taches_assigneAId_fkey" FOREIGN KEY ("assigneAId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taches" ADD CONSTRAINT "taches_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "factures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_tacheId_fkey" FOREIGN KEY ("tacheId") REFERENCES "taches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "factures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factures" ADD CONSTRAINT "factures_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factures" ADD CONSTRAINT "factures_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "souhaits" ADD CONSTRAINT "souhaits_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "souhaits" ADD CONSTRAINT "souhaits_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
