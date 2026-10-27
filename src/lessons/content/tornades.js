// Facts from Keraunos, the French tornado and thunderstorm observatory (see `sources`).
const far = { x: .62, intensity: 1 }

export default {
  id: 'tornades',
  title: 'Les tornades',
  reviewed: true,
  steps: [
    {
      title: 'Une tornade, c’est quoi ?',
      photo: 'tornade',
      text: 'Un tourbillon de vent violent, d’axe vertical, qui relie le sol à la base d’un nuage d’orage. On le voit grâce à l’entonnoir de condensation qui descend du nuage, et aux débris soulevés au sol. L’entonnoir n’a pas besoin de toucher le sol pour que ce soit une tornade.',
      anchor: 'storm',
    },
    {
      title: 'Le vent qui tourne avec l’altitude',
      photo: 'cisaillement',
      text: 'Il faut de l’instabilité, et un vent qui change de direction et de force avec l’altitude : le cisaillement. Entre deux vents différents, l’air se met à rouler sur lui-même, comme un tube couché.',
      anchor: 'storm',
      diagrams: [
        { type: 'arrow', from: [.15, .48], to: [.45, .48], text: 'vent faible près du sol' },
        { type: 'arrow', from: [.85, .2], to: [.45, .2], text: 'vent fort en altitude' },
      ],
    },
    {
      title: 'La supercellule',
      photo: 'supercellule',
      text: 'Le courant ascendant de l’orage redresse ce tube et le met à la verticale : l’orage entier tourne. C’est une supercellule, avec un mésocyclone d’une dizaine de kilomètres. Il faut en plus qu’une rotation se forme vers 1 à 2 km d’altitude : c’est pourquoi la plupart des supercellules ne donnent pas de tornade.',
      anchor: 'storm', sky: { low: { height: 7000 } },
      diagrams: [{ type: 'arrow', from: [.4, .45], to: [.6, .25], text: 'mésocyclone' }],
    },
    {
      title: 'L’entonnoir descend',
      photo: 'entonnoir',
      text: 'Sous le courant ascendant, la rotation se resserre et s’accélère jusqu’au sol. L’entonnoir s’approche de la plaine : les arbres le cachent tant qu’il passe derrière eux.',
      anchor: 'storm',
      tornado: { ...far, disparity: [.04, .16], duration: 12 },
    },
    {
      title: 'Et en France ?',
      photo: 'tornade-france',
      text: 'On estime qu’il se produit entre 40 et 50 tornades par an en France. Plus de 9 sur 10 sont faibles ou très faibles. La majorité ne vient d’ailleurs pas d’une supercellule : ce sont des tornades plus courtes, rarement fortes.',
      anchor: 'storm',
      tornado: { ...far, disparity: .16 },
    },
  ],
  sources: [
    { label: 'Keraunos, formation d’une tornade', url: 'https://www.keraunos.org/recherche/comprendre-les-orages-pedagogie-vulgarisation/tornades-trombes-tubas/comment-se-forme-une-tornade.html' },
    { label: 'Keraunos, supercellules', url: 'https://www.keraunos.org/recherche/comprendre-les-orages-pedagogie-vulgarisation/les-structures-orageuses/orages-supercellulaires-supercellule.html' },
    { label: 'Keraunos, chiffres clés', url: 'https://www.keraunos.org/climatologie/les-tornades-en-france/tornade-france-records-chiffres-cles-cas-marquants.html' },
    { label: 'Keraunos, intensité', url: 'https://www.keraunos.org/climatologie/les-tornades-en-france/intensite-des-tornades-en-france.html' },
  ],
}
