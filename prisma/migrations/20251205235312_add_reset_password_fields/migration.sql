/*
  Warnings:

  - A unique constraint covering the columns `[resetPasswordToken]` on the table `utilisateurs` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "utilisateurs" ADD COLUMN     "resetPasswordExpires" TIMESTAMP(3),
ADD COLUMN     "resetPasswordToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_resetPasswordToken_key" ON "utilisateurs"("resetPasswordToken");
