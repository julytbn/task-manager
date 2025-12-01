-- CreateEnum
CREATE TYPE "TypeNotification" AS ENUM ('INFO', 'EQUIPE', 'TACHE', 'ALERTE', 'SUCCES');

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "TypeNotification" NOT NULL DEFAULT 'INFO',
    "lien" TEXT,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
