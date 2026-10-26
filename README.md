# Ciel ouvert

Le vrai ciel du moment au-dessus de la place de votre commune, et de quoi le comprendre.

On tape le nom d'une commune française : on se retrouve debout sur une place, sous le ciel qu'il fait en ce moment. La photo est réelle ; le ciel est calculé en 3D (atmosphère et nuages volumétriques), avec le soleil à sa vraie position. L'onglet « Comprendre » explique le ciel affiché et propose quatre leçons : les types de nuages, les orages, les tornades, la pluie, la neige et le brouillard.

## Lancer en local

```bash
npm install
npm run dev
```

Tests : `npm test`. Poids du premier chargement : `node tools/check-budget.mjs` (limite 5 Mo).

URL de relecture : `?scene=<id>&anchor=<clear|cloudy|rain|storm|fog|sunset|night>`, et pour les places régionales `&sign=<nom>`.

## Ajouter une scène

1. Choisir une photo libre (CC0, CC BY, CC BY-SA) sur Wikimedia Commons : prise à hauteur d'homme, avec au moins un quart de ciel.
2. `node tools/prepare-scene.mjs <id> <url-ou-fichier>` : produit `public/scenes/<id>/photo.webp` et la carte de profondeur `depth.png`.
3. Ajouter l'entrée dans `src/places/catalog.json` : code INSEE (ville) ou code région, position et direction de la prise de vue, crédits, fenêtres éclairées la nuit.

## Données et crédits

- Météo : [Open-Meteo](https://open-meteo.com/) ; communes : [API Géo](https://geo.api.gouv.fr/).
- Ciel : [@takram/three-atmosphere et @takram/three-clouds](https://github.com/takram-design-engineering/three-geospatial).
- Profondeur : Depth Anything V2.
- Photos : Wikimedia Commons, auteurs et licences indiqués sous chaque scène et dans `src/places/catalog.json`.
- Leçons : Atlas international des nuages (OMM), Météo-France, Keraunos, MétéoSuisse, IRM ; sources citées à la fin de chaque leçon.
