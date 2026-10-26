// Rules turning Open-Meteo cloud cover per altitude into probable cloud genres.
// Weather models give cover by layer, never the genre: every result is an estimate.
// To be reviewed by Anthony before publication.
//
// | condition                                   | genre          | layer    |
// | weather code 95-99                          | cumulonimbus   | vertical |
// | weather code 45 or 48                       | fog            | none     |
// | precipitation >= 0.5 mm and low >= 80 %     | nimbostratus   | low      |
// | weather code 51-57 and low >= 60 %          | stratus        | low      |
// | low >= 60 %                                 | stratocumulus  | low      |
// | 10 % <= low < 60 %                          | cumulus        | low      |
// | mid >= 80 %                                 | altostratus    | mid      |
// | 30 % <= mid < 80 %                          | altocumulus    | mid      |
// | high >= 70 %                                | cirrostratus   | high     |
// | 20 % <= high < 70 %                         | cirrus         | high     |
// | none of the above                           | clear          | none     |

// Set to true once Anthony has reviewed this table; until then production hides the phrases.
export const RULES_REVIEWED = false

const PHRASES = {
  cumulonimbus: 'Probablement un cumulonimbus, le nuage d’orage.',
  fog: 'Probablement du brouillard, un nuage posé au sol.',
  nimbostratus: 'Probablement des nimbostratus, la couche grise et épaisse qui donne une pluie continue.',
  stratus: 'Probablement des stratus, une couche basse et uniforme.',
  stratocumulus: 'Probablement des stratocumulus, des nuages bas en rouleaux ou en bancs.',
  cumulus: 'Probablement des cumulus, les nuages bas en boules de coton.',
  altostratus: 'Probablement des altostratus, un voile gris à moyenne altitude.',
  altocumulus: 'Probablement des altocumulus, des petits nuages en galets à moyenne altitude.',
  cirrostratus: 'Probablement des cirrostratus, un voile blanc très haut.',
  cirrus: 'Probablement des cirrus, des filaments de glace très hauts.',
  clear: 'Probablement un ciel dégagé.',
}

const family = (key, layer) => ({ key, layer, phrase: PHRASES[key] })

export function probableCloudFamilies(w) {
  if (w.weatherCode >= 95 && w.weatherCode <= 99) return [family('cumulonimbus', 'vertical')]
  if (w.weatherCode === 45 || w.weatherCode === 48) return [family('fog', 'none')]
  const out = []
  if (w.precipitation >= .5 && w.cloudLow >= 80) out.push(family('nimbostratus', 'low'))
  else if (w.weatherCode >= 51 && w.weatherCode <= 57 && w.cloudLow >= 60) out.push(family('stratus', 'low'))
  else if (w.cloudLow >= 60) out.push(family('stratocumulus', 'low'))
  else if (w.cloudLow >= 10) out.push(family('cumulus', 'low'))
  if (w.cloudMid >= 80) out.push(family('altostratus', 'mid'))
  else if (w.cloudMid >= 30) out.push(family('altocumulus', 'mid'))
  if (w.cloudHigh >= 70) out.push(family('cirrostratus', 'high'))
  else if (w.cloudHigh >= 20) out.push(family('cirrus', 'high'))
  return out.length ? out : [family('clear', 'none')]
}
