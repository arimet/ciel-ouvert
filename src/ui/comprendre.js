// "Comprendre" panel: the sky of the moment, then the guided lessons.
// Texts and lessons appear only once reviewed (drafts are flagged in dev).
export function renderComprendre(el, { families, texts, lessons, onLesson }) {
  el.replaceChildren(
    section('Le ciel du moment', skyOfTheMoment(families, texts)),
    section('Leçons', lessonList(lessons, onLesson)),
  )
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
  el.replaceChildren(build('div', { className: 'lesson' }, [
    build('header', {}, [
      build('h2', { textContent: lesson.title }, []),
      build('button', { type: 'button', className: 'quit', textContent: 'Quitter', onclick: onStop }, []),
    ]),
    build('h3', { textContent: step.title }, []),
    build('p', { textContent: step.text }, []),
    sources,
    nav,
  ]))
}
