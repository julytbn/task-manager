-- AddForeignKey
ALTER TABLE "pro_forma_lignes" ADD CONSTRAINT "pro_forma_lignes_proFormaId_fkey" FOREIGN KEY ("proFormaId") REFERENCES "pro_formas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
