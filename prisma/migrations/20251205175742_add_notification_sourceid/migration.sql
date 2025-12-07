-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "sourceId" TEXT,
ADD COLUMN     "sourceType" TEXT;

-- CreateTable
CREATE TABLE "documents_taches" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT,
    "url" TEXT NOT NULL,
    "tacheId" TEXT NOT NULL,
    "taille" DOUBLE PRECISION,
    "dateUpload" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadPar" TEXT,

    CONSTRAINT "documents_taches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_tache_to_document_tache" (
    "tacheId" TEXT NOT NULL,
    "docId" TEXT NOT NULL,

    CONSTRAINT "_tache_to_document_tache_pkey" PRIMARY KEY ("tacheId","docId")
);

-- CreateIndex
CREATE INDEX "notifications_sourceId_utilisateurId_type_idx" ON "notifications"("sourceId", "utilisateurId", "type");

-- AddForeignKey
ALTER TABLE "documents_taches" ADD CONSTRAINT "documents_taches_tacheId_fkey" FOREIGN KEY ("tacheId") REFERENCES "taches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
