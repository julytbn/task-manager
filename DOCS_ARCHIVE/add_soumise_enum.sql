-- Ajouter SOUMISE à la table enumStatutTache
INSERT INTO "enumStatutTache" (cle, label, ordre, actif, dateCreation, dateModification)
VALUES ('SOUMISE', 'Soumise', 4, true, NOW(), NOW())
ON CONFLICT (cle) DO NOTHING;

-- Vérifier que c'est bien inséré
SELECT * FROM "enumStatutTache" ORDER BY ordre;
