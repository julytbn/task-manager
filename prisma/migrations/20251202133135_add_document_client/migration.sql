-- CreateTable
CREATE TABLE "documents_clients" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT,
    "url" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "taille" DOUBLE PRECISION,
    "dateUpload" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadPar" TEXT,

    CONSTRAINT "documents_clients_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "documents_clients" ADD CONSTRAINT "documents_clients_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
