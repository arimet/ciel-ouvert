// Explanations shown under "Le ciel du moment", one per probable cloud family.
const ATLAS = 'https://cloudatlas.wmo.int/en/'
const t = (text, url) => ({ text, reviewed: true, source: url })

export default {
  cumulonimbus: t('Le nuage d’orage : une tour de plusieurs kilomètres de haut, dont le sommet s’étale souvent en enclume. Il donne averses, éclairs et parfois grêle.', `${ATLAS}cumulonimbus-cb.html`),
  fog: t('Un nuage dont la base touche le sol : on parle de brouillard quand on voit à moins d’un kilomètre. Par nuit claire et vent faible, il se forme souvent en fin de nuit et se dissipe dans la matinée.', 'https://meteofrance.com/comprendre-la-meteo/nuages/le-brouillard'),
  nimbostratus: t('Une couche grise et épaisse qui cache le soleil et donne une pluie ou une neige plus ou moins continue.', `${ATLAS}nimbostratus-ns.html`),
  stratus: t('Une couche basse et grise, à la base assez uniforme. C’est le nuage de la bruine.', `${ATLAS}stratus-st.html`),
  stratocumulus: t('Des bancs bas, gris ou blanchâtres, faits de grosses masses ou de rouleaux avec des parties sombres. Ils peuvent donner un peu de pluie ou de neige.', `${ATLAS}stratocumulus-sc.html`),
  cumulus: t('Des nuages bas, séparés, aux contours nets, qui gonflent vers le haut. S’ils grandissent beaucoup, ils peuvent donner des averses.', `${ATLAS}cumulus-cu.html`),
  altostratus: t('Un voile gris à l’étage moyen, à travers lequel on devine parfois le soleil comme derrière un verre dépoli.', `${ATLAS}altostratus-as.html`),
  altocumulus: t('Des bancs de petits galets ou de rouleaux à l’étage moyen, entre 2 et 7 km environ.', `${ATLAS}altocumulus-ac.html`),
  cirrostratus: t('Un voile blanc très haut, fait de cristaux de glace, qui dessine parfois un halo autour du soleil.', `${ATLAS}cirrostratus-cs.html`),
  cirrus: t('Des filaments blancs très hauts, faits de cristaux de glace.', `${ATLAS}cirrus-ci.html`),
  clear: t('Peu ou pas de nuages selon le modèle météo.', 'https://open-meteo.com/en/docs'),
}
