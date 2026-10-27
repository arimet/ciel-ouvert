// Facts from Météo-France, Keraunos, MétéoSuisse, IRM and the WMO atlas (see `sources`).
export default {
  id: 'orages',
  title: 'Les orages',
  reviewed: true,
  steps: [
    {
      title: 'L’air chaud monte',
      text: 'Le soleil chauffe le sol, qui chauffe l’air juste au-dessus. Cet air se dilate, devient plus léger et monte.',
      anchor: 'clear', sky: { coverage: .2 },
      diagrams: [
        { type: 'arrow', from: [.3, .6], to: [.3, .38] },
        { type: 'arrow', from: [.7, .6], to: [.7, .38], text: 'air chaud et humide' },
      ],
    },
    {
      title: 'Un cumulus naît',
      text: 'En montant, l’air se refroidit. S’il est assez humide, sa vapeur se condense en gouttelettes : un cumulus apparaît. La condensation libère de la chaleur, ce qui garde l’air du nuage plus chaud que l’air autour : il continue de monter.',
      anchor: 'clear', sky: { coverage: .4, low: { height: 1500 } },
      diagrams: [{ type: 'arrow', from: [.5, .55], to: [.5, .3], text: 'condensation' }],
    },
    {
      title: 'Il grandit',
      text: 'Si l’air est instable, le nuage grandit tant qu’il reste plus chaud que l’air qui l’entoure. Quand ses gouttelettes du sommet se changent en cristaux de glace, le cumulus devient un cumulonimbus.',
      anchor: 'cloudy', sky: { coverage: .5, low: { altitude: 800, height: 4000, densityScale: .4 } },
    },
    {
      title: 'Le cumulonimbus',
      text: 'En France, son sommet monte souvent vers 10 à 12 km, parfois jusqu’à 15 km. Il bute alors sur la tropopause, une couche que l’air du nuage ne peut pas traverser : le sommet s’étale en enclume.',
      anchor: 'storm', sky: { low: { height: 7000 } },
      inset: { src: 'insets/cumulonimbus-enclume.webp', credit: 'Enclume de cumulonimbus · Shellparakeet, CC0' },
    },
    {
      title: 'L’électricité',
      text: 'Dans le nuage, des particules de glace (grésil et cristaux) se heurtent sans cesse. Ces collisions électrisent le nuage, et les courants d’air séparent les charges positives et négatives. Quand l’écart devient trop grand, un éclair jaillit.',
      anchor: 'storm',
    },
    {
      title: 'Le tonnerre',
      text: 'L’éclair chauffe l’air à environ 30 000 °C en quelques millièmes de seconde. L’air se dilate brutalement : c’est le bruit du tonnerre. Le son parcourt un kilomètre en environ 3 secondes : comptez les secondes entre l’éclair et le tonnerre, divisez par 3, vous avez la distance en kilomètres. À 30 secondes ou moins, l’orage est à moins de 10 km : mettez-vous à l’abri, la foudre peut tomber jusque-là.',
      anchor: 'storm',
    },
    {
      title: 'La grêle',
      text: 'Les courants ascendants emportent des gouttes au-dessus du niveau où l’air passe sous 0 °C. Elles gèlent et grossissent en captant l’eau du nuage, en couches de glace tantôt opaques, tantôt transparentes. Plus le courant est fort, plus le grêlon reste longtemps en l’air et grossit. Moins d’un cumulonimbus sur dix donne de la grêle au sol.',
      anchor: 'storm',
      diagrams: [{ type: 'line', from: [0, .3], to: [1, .3] }, { type: 'label', from: [.8, .3], text: 'air sous 0 °C' }],
    },
  ],
  sources: [
    { label: 'Météo-France, les cumulonimbus', url: 'https://meteofrance.com/comprendre-la-meteo/orages/les-cumulonimbus' },
    { label: 'Keraunos, formation d’un orage', url: 'https://www.keraunos.org/recherche/comprendre-les-orages-pedagogie-vulgarisation/les-orages-generalites/comment-se-forme-un-orage.html' },
    { label: 'MétéoSuisse, chaleur latente', url: 'https://www.meteosuisse.admin.ch/portrait/meteosuisse-blog/fr/2025/05/cape.html' },
    { label: 'Météo-France, foudre et tonnerre', url: 'https://meteofrance.com/meteo-a-z/foudre-eclair-et-tonnerre-quelles-differences' },
    { label: 'IRM, se protéger de la foudre', url: 'https://www.meteo.be/fr/infos/faq/comment-se-proteger-contre/comment-se-proteger-de-la-foudre' },
    { label: 'Météo-France, la grêle', url: 'https://meteofrance.com/comprendre-la-meteo/orages/la-grele' },
    { label: 'OMM, grêle', url: 'https://cloudatlas.wmo.int/en/hail.html' },
  ],
}
