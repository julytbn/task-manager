-- AlterTable
ALTER TABLE "factures" ADD COLUMN     "serviceId" TEXT;

-- AddForeignKey
ALTER TABLE "factures" ADD CONSTRAINT "factures_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;
