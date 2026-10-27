// Every statement comes from the WMO International Cloud Atlas pages listed in `sources`.
const ATLAS = 'https://cloudatlas.wmo.int/en/'
const off = { height: 0 } // disables a cloud layer

export default {
  id: 'nuages',
  title: 'Les types de nuages',
  reviewed: true,
  steps: [
    {
      title: 'Trois étages',
      text: 'Les nuages se rangent par étages. Dans les régions tempérées comme la France, l’étage bas va du sol à environ 2 km, l’étage moyen d’environ 2 à 7 km, l’étage haut d’environ 5 à 13 km. Les étages se chevauchent : ce sont des repères, pas des frontières.',
      anchor: 'clear',
      diagrams: [
        { type: 'label', from: [.3, .2], text: 'Étage haut · 5 à 13 km' },
        { type: 'line', from: [0, .28], to: [1, .28] },
        { type: 'label', from: [.3, .38], text: 'Étage moyen · 2 à 7 km' },
        { type: 'line', from: [0, .46], to: [1, .46] },
        { type: 'label', from: [.3, .56], text: 'Étage bas · 0 à 2 km' },
      ],
    },
    {
      title: 'Cumulus',
      text: 'Des nuages séparés, denses, aux contours nets, qui gonflent vers le haut en dômes ou en tours dont le sommet ressemble souvent à un chou-fleur. Les parties éclairées par le soleil sont d’un blanc éclatant, la base est plus sombre et presque horizontale. Ils sont faits surtout de gouttelettes d’eau.',
      anchor: 'clear', sky: { coverage: .38 },
    },
    {
      title: 'Stratocumulus',
      text: 'Des bancs ou une couche grise ou blanchâtre, presque toujours avec des parties sombres, faits de grosses masses arrondies ou de rouleaux. Ce sont des gouttelettes d’eau. Ils peuvent donner un peu de pluie ou de neige.',
      anchor: 'cloudy', sky: { coverage: .6, low: { altitude: 900, height: 700, densityScale: .35, coverageFilterWidth: .4 } },
    },
    {
      title: 'Stratus',
      text: 'Une couche généralement grise, à la base assez uniforme. À travers elle, le contour du soleil se voit nettement. C’est le nuage de la bruine.',
      anchor: 'cloudy', sky: { coverage: .95, exposure: 8, low: { altitude: 300, height: 300, densityScale: .3, shapeAmount: .3, shapeDetailAmount: .3, coverageFilterWidth: .9 }, mid: off },
    },
    {
      title: 'Nimbostratus',
      text: 'Une couche grise, souvent sombre, assez épaisse pour cacher complètement le soleil. Elle donne une pluie ou une neige plus ou moins continue, qui atteint le sol dans la plupart des cas. On le classe dans l’étage moyen, mais il déborde presque toujours sur les deux autres.',
      anchor: 'rain', sky: { coverage: .9, low: { altitude: 600, height: 3000, densityScale: .5, coverageFilterWidth: .8 } },
    },
    {
      title: 'Altocumulus',
      text: 'À l’étage moyen, des bancs blancs ou gris faits de galets, de lamelles ou de rouleaux, souvent ombrés. Ce sont des gouttelettes d’eau. Leur pluie s’évapore en général avant d’atteindre le sol.',
      anchor: 'clear', sky: { coverage: .55, low: off, mid: { altitude: 3500, height: 500, densityScale: .25, coverageFilterWidth: .4 } },
    },
    {
      title: 'Altostratus',
      text: 'Un voile grisâtre ou bleuté, strié ou uniforme. Là où il est fin, on devine le soleil comme à travers un verre dépoli, sans halo. Il mêle gouttelettes et cristaux de glace et peut donner une pluie ou une neige continue.',
      anchor: 'cloudy', sky: { coverage: .85, low: off, mid: { altitude: 3000, height: 1500, densityScale: .15, shapeAmount: .3, coverageFilterWidth: .9 } },
    },
    {
      title: 'Cirrus',
      text: 'À l’étage haut, des filaments blancs et délicats, à l’aspect de cheveux ou à l’éclat soyeux. Ils sont faits presque uniquement de cristaux de glace. La 3D rend mal leurs fibres : la photo en montre de vrais.',
      anchor: 'clear', sky: { coverage: .45, low: off, mid: { altitude: 8000, height: 600, densityScale: .01, shapeAmount: .5, shapeDetailAmount: 0, coverageFilterWidth: .5 } },
      inset: { src: 'insets/cirrus.webp', credit: 'Cirrus · DR04, CC BY 3.0' },
    },
    {
      title: 'Cirrostratus',
      text: 'Un voile blanchâtre et transparent qui couvre tout ou partie du ciel. Il est parfois si fin que seul un halo autour du soleil trahit sa présence. Même sous ce voile, le soleil haut continue de faire des ombres.',
      anchor: 'clear', sky: { coverage: .9, low: off, mid: { altitude: 8000, height: 600, densityScale: .004, shapeAmount: .2, shapeDetailAmount: 0, coverageFilterWidth: .9 } },
    },
    {
      title: 'Cirrocumulus',
      text: 'De fins bancs blancs sans ombre, faits de tout petits grains ou de rides. Ce sont presque uniquement des cristaux de glace. Ses éléments sont si petits qu’on le rend mal en 3D : la photo en montre un vrai.',
      anchor: 'clear', sky: { coverage: .5, low: off, mid: { altitude: 7000, height: 300, densityScale: .05, coverageFilterWidth: .3 } },
      inset: { src: 'insets/cirrocumulus.webp', credit: 'Cirrocumulus · AnRo0002, CC0' },
    },
    {
      title: 'Cumulonimbus',
      text: 'Un nuage lourd et dense, immense en hauteur, en forme de montagne ou de tours. Son sommet s’aplatit presque toujours et s’étale souvent en enclume. Il donne les orages : averses, grésil, grêle.',
      anchor: 'storm',
      inset: { src: 'insets/cumulonimbus-enclume.webp', credit: 'Enclume de cumulonimbus · Shellparakeet, CC0' },
    },
  ],
  sources: [
    { label: 'OMM, étages', url: `${ATLAS}some-useful-concepts-levels.html` },
    { label: 'OMM, cumulus', url: `${ATLAS}cumulus-cu.html` },
    { label: 'stratocumulus', url: `${ATLAS}stratocumulus-sc.html` },
    { label: 'stratus', url: `${ATLAS}stratus-st.html` },
    { label: 'nimbostratus', url: `${ATLAS}nimbostratus-ns.html` },
    { label: 'altocumulus', url: `${ATLAS}altocumulus-ac.html` },
    { label: 'altostratus', url: `${ATLAS}altostratus-as.html` },
    { label: 'cirrus', url: `${ATLAS}cirrus-ci.html` },
    { label: 'cirrostratus', url: `${ATLAS}cirrostratus-cs.html` },
    { label: 'cirrocumulus', url: `${ATLAS}cirrocumulus-cc.html` },
    { label: 'cumulonimbus', url: `${ATLAS}cumulonimbus-cb.html` },
  ],
}
