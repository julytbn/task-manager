/*
  Warnings:

  - You are about to drop the column `categoryId` on the `services` table. All the data in the column will be lost.
  - You are about to drop the `service_categories` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "services" DROP CONSTRAINT "services_categoryId_fkey";

-- AlterTable
ALTER TABLE "services" DROP COLUMN "categoryId";

-- DropTable
DROP TABLE "service_categories";
