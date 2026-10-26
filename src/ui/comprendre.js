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
