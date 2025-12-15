-- RemoveConstraint with CASCADE to handle dependencies
ALTER TABLE "pro_formas" DROP CONSTRAINT IF EXISTS "pro_formas_pkey" CASCADE;

-- DropColumn
ALTER TABLE "pro_formas" DROP COLUMN IF EXISTS "tauxTVA";
ALTER TABLE "pro_formas" DROP COLUMN IF EXISTS "montantTotal";

-- DropColumn
ALTER TABLE "factures" DROP COLUMN IF EXISTS "tauxTVA";
ALTER TABLE "factures" DROP COLUMN IF EXISTS "montantTotal";

-- RenameColumn & UpdateColumn
ALTER TABLE "pro_forma_lignes" RENAME COLUMN "montantAPayer" TO "montant";
ALTER TABLE "pro_forma_lignes" DROP COLUMN IF EXISTS "montantGlobal";

-- FactureLines
ALTER TABLE "facture_lignes" RENAME COLUMN "montantAPayer" TO "montant";
ALTER TABLE "facture_lignes" DROP COLUMN IF EXISTS "montantGlobal";

-- Recreate Constraints if needed
ALTER TABLE "pro_formas" ADD CONSTRAINT "pro_formas_pkey" PRIMARY KEY ("id");
