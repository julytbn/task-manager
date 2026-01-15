-- AlterTable
ALTER TABLE "factures" ADD COLUMN     "pro_forma_id" TEXT;

-- AddForeignKey
ALTER TABLE "factures" ADD CONSTRAINT "factures_pro_forma_id_fkey" FOREIGN KEY ("pro_forma_id") REFERENCES "pro_formas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
