**Kekeli Group — Design System (Résumé)**

Palette principale
- Noir profond: `#000000` / `#111111`
- Or métallique: `#D4AF37` (principal), `#FFD700` (accents), `#C9A227` (ombres)
- Blanc cassé: `#F8F9FA`
- Gris anthracite: `#333333`

Polices
- Titres: `Playfair Display` (serif)
- Corps: `Montserrat` (sans)

Tokens Tailwind
- Couleurs exposées dans `tailwind.config.ts` sous `gold`, `black`, `offwhite`, `anthracite`.
- Border radius: `sm: 4px`, `md: 8px`
- Shadow subtle: `0 2px 8px rgba(2,6,23,0.06)`

Composants clés
- `components/ui/StatCard.tsx`: carte statistique (taille 300x200). Utiliser pour KPI.
- `components/ui/Table.tsx`: tableau réutilisable. Entêtes en noir + texte doré.

Layouts
- `Sidebar`: fond noir, icônes dorées, largeur 250px (repliable mobile)
- `TopNavbar`: barre fixe en haut, recherche centrée, notifications à droite
- `Main`: `bg-offwhite` avec marges 30px

Interactions
- Transitions 0.3s ease
- Notifications: toast bas droit (fond noir, texte doré)

Usage rapide
- Importer classes Tailwind: `bg-offwhite`, `text-gold`, `border-gold`, etc.
- Pour boutons primaires: `bg-gold text-black rounded-sm px-4 py-2`

Prochaines étapes
1. Implémenter `Sidebar` visuellement (250px, icônes dorées)
2. Mettre à jour `TopNavbar` pour utiliser la recherche et la cloche (déjà modifié)
3. Migrer `app/taches/page.tsx` et `app/projets/page.tsx` pour utiliser `Table` avec colonnes définies
4. Ajouter polices via `<link>` dans `_document` ou config Next.js

Notes
- Les composants fournis sont des squelettes; adapter les données et intégration auth/notifications.
