-- CreateTable
CREATE TABLE "enum_statuts_taches" (
    "id" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "enum_statuts_taches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enum_priorites" (
    "id" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "enum_priorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enum_statuts_projets" (
    "id" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "enum_statuts_projets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enum_categories_services" (
    "id" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "enum_categories_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enum_types_clients" (
    "id" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "enum_types_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enum_statuts_factures" (
    "id" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "enum_statuts_factures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enum_statuts_paiements" (
    "id" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "enum_statuts_paiements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enum_moyens_paiement" (
    "id" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "enum_moyens_paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enum_types_notifications" (
    "id" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "enum_types_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "enum_statuts_taches_cle_key" ON "enum_statuts_taches"("cle");

-- CreateIndex
CREATE UNIQUE INDEX "enum_priorites_cle_key" ON "enum_priorites"("cle");

-- CreateIndex
CREATE UNIQUE INDEX "enum_statuts_projets_cle_key" ON "enum_statuts_projets"("cle");

-- CreateIndex
CREATE UNIQUE INDEX "enum_categories_services_cle_key" ON "enum_categories_services"("cle");

-- CreateIndex
CREATE UNIQUE INDEX "enum_types_clients_cle_key" ON "enum_types_clients"("cle");

-- CreateIndex
CREATE UNIQUE INDEX "enum_statuts_factures_cle_key" ON "enum_statuts_factures"("cle");

-- CreateIndex
CREATE UNIQUE INDEX "enum_statuts_paiements_cle_key" ON "enum_statuts_paiements"("cle");

-- CreateIndex
CREATE UNIQUE INDEX "enum_moyens_paiement_cle_key" ON "enum_moyens_paiement"("cle");

-- CreateIndex
CREATE UNIQUE INDEX "enum_types_notifications_cle_key" ON "enum_types_notifications"("cle");
