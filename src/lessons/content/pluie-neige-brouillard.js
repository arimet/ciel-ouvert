// Facts from Météo-France, the WMO atlas, MétéoSuisse and IRM (see `sources`).
export default {
  id: 'pluie-neige-brouillard',
  title: 'Pluie, neige, brouillard',
  reviewed: true,
  steps: [
    {
      title: 'Des gouttelettes aux gouttes',
      text: 'Un nuage est fait de gouttelettes minuscules, trop légères pour tomber. En se rencontrant, elles s’agglomèrent et s’alourdissent. Sous nos latitudes, le haut des nuages est sous 0 °C : des cristaux de glace y grossissent aux dépens des gouttelettes.',
      anchor: 'cloudy', sky: { coverage: .6 },
    },
    {
      title: 'La pluie',
      text: 'Devenues assez lourdes, ces particules tombent. Le plus souvent, la glace fond en traversant l’air plus doux près du sol : il pleut.',
      anchor: 'rain',
    },
    {
      title: 'La neige',
      text: 'Si l’air reste froid jusqu’en bas, à 0 °C ou à peine au-dessus près du sol, les flocons n’ont pas le temps de fondre : il neige.',
      anchor: 'cloudy', sky: { coverage: .8 }, effects: { snow: .9, tint: [.85, .87, .9] },
      diagrams: [{ type: 'line', from: [0, .62], to: [1, .62] }, { type: 'label', from: [.8, .62], text: 'air à 0 °C jusqu’au sol' }],
    },
    {
      title: 'Une nuit claire',
      text: 'Par nuit claire et vent faible, le sol se refroidit plus vite que l’air au-dessus. Il refroidit à son tour l’air à son contact.',
      anchor: 'night', time: 'night',
    },
    {
      title: 'Le brouillard',
      text: 'L’air près du sol, refroidi, ne peut plus garder toute sa vapeur : elle se condense, généralement en fin de nuit. Le brouillard est un nuage posé au sol ; on en parle quand on voit à moins d’un kilomètre. Il se dissipe dans la matinée, par le bas, sous l’effet du soleil.',
      anchor: 'fog', time: 'dawn',
    },
  ],
  sources: [
    { label: 'Météo-France, les précipitations', url: 'https://meteofrance.com/actualites-et-dossiers/comprendre-la-meteo/les-precipitations-pluie-neige-grele' },
    { label: 'OMM, cumulus (cristaux et gouttelettes)', url: 'https://cloudatlas.wmo.int/en/physical-constitution-cumulus.html' },
    { label: 'MétéoSuisse, limite pluie-neige', url: 'https://www.meteosuisse.admin.ch/portrait/meteosuisse-blog/fr/2025/11/neige-ou-pas-de-neige.html' },
    { label: 'Météo-France, le brouillard', url: 'https://meteofrance.com/comprendre-la-meteo/nuages/le-brouillard' },
    { label: 'IRM, le brouillard', url: 'https://www.meteo.be/fr/infos/actualite/quand-les-nuages-touchent-la-terre-comprendre-le-phenomene-du-brouillard' },
  ],
}
