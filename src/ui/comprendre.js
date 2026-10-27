import { PHOTOS } from '../lessons/photos.js'
import { creditHtml } from './caption.js'

// Panels: "Pourquoi ce ciel ?" next to the weather, the lesson list over the plain.
// Texts and lessons appear only once reviewed (drafts are flagged in dev).
export function renderSkyOfTheMoment(el, { families, texts }) {
  el.replaceChildren(section('Le ciel du moment', skyOfTheMoment(families, texts)))
}

export function renderLessons(el, { lessons, onLesson }) {
  el.replaceChildren(section('Comprendre un phénomène', lessonList(lessons, onLesson)))
}

function build(tag, props, children) {
  const node = Object.assign(document.createElement(tag), props)
  node.append(...children)
  return node
}

function section(title, body) {
  return build('section', {}, [build('h2', { textContent: title }, []), body])
}

function skyOfTheMoment(families, texts) {
  if (!families) return build('p', { className: 'muted', textContent: 'Chargement de la météo…' }, [])
  if (!families.length) return build('p', { className: 'muted', textContent: 'Les explications sont en cours de relecture.' }, [])
  const items = families.map(f => {
    const t = texts[f.key]
    return build('li', {}, [
      ...(PHOTOS[f.key] ? [photo(PHOTOS[f.key])] : []),
      build('p', { className: 'phrase', textContent: f.phrase }, []),
      t ? build('p', { textContent: t.text }, []) : build('p', { className: 'muted', textContent: 'Explication en cours de relecture.' }, []),
    ])
  })
  return build('ul', { className: 'families' }, items)
}

function lessonList(lessons, onLesson) {
  if (!lessons.length) return build('p', { className: 'muted', textContent: 'Les leçons sont en cours de relecture.' }, [])
  return build('ul', { className: 'lessons' }, lessons.map(l => build('li', {}, [
    build('button', { type: 'button', onclick: () => onLesson(l) }, [l.title, ...(l.reviewed ? [] : [build('span', { className: 'draft', textContent: ' brouillon' }, [])])]),
  ])))
}

// One lesson step in the panel: position, text, navigation, sources at the end.
export function renderLesson(el, { step, index, lesson, onPrev, onNext, onStop }) {
  const last = index === lesson.steps.length - 1
  const dots = build('ol', { className: 'dots', ariaLabel: `Étape ${index + 1} sur ${lesson.steps.length}` },
    lesson.steps.map((_, i) => build('li', { className: i === index ? 'on' : '' }, [])))
  const nav = build('div', { className: 'lesson-nav' }, [
    build('button', { type: 'button', textContent: '←', ariaLabel: 'Étape précédente', disabled: index === 0, onclick: onPrev }, []),
    dots,
    last
      ? build('button', { type: 'button', textContent: 'Terminer', onclick: onStop }, [])
      : build('button', { type: 'button', textContent: '→', ariaLabel: 'Étape suivante', onclick: onNext }, []),
  ])
  const sources = last && lesson.sources.length
    ? build('p', { className: 'sources' }, ['Sources : ', ...lesson.sources.flatMap((s, i) => [
      ...(i ? [', '] : []), build('a', { href: s.url, target: '_blank', rel: 'noopener', textContent: s.label }, [])])])
    : ''
  el.scrollTop = 0
  el.replaceChildren(build('div', { className: 'lesson' }, [
    build('header', {}, [
      build('h2', { textContent: lesson.title }, []),
      build('button', { type: 'button', className: 'quit', textContent: 'Quitter', onclick: onStop }, []),
    ]),
    ...(PHOTOS[step.photo] ? [photo(PHOTOS[step.photo])] : []),
    build('h3', { textContent: step.title }, []),
    build('p', { textContent: step.text }, []),
    sources,
    nav,
  ]))
}

// A Commons photo of what the text explains, with its credit.
function photo({ src, alt, credit }) {
  const fig = build('figure', { className: 'photo' }, [build('img', { src: import.meta.env.BASE_URL + src, alt, loading: 'lazy', decoding: 'async' }, [])])
  fig.append(build('figcaption', { innerHTML: creditHtml(credit) }, []))
  return fig
}
