import { searchCommunes } from '../places/communes.js'

// Commune autocomplete: "Nom (dép.)" suggestions, ↑/↓/Entrée/Échap, 200 ms debounce.
export function mountSearch(input, list, onPick) {
  let results = [], active = -1, timer = 0, query = 0

  const close = () => {
    list.hidden = true
    input.setAttribute('aria-expanded', 'false')
    input.removeAttribute('aria-activedescendant')
    active = -1
  }
  const render = () => {
    list.replaceChildren(...results.map((c, i) => {
      const li = document.createElement('li')
      li.id = `commune-${i}`
      li.role = 'option'
      li.ariaSelected = String(i === active)
      li.textContent = `${c.name} (${c.department})`
      li.onpointerdown = e => { e.preventDefault(); pick(i) }
      return li
    }))
    list.hidden = results.length === 0
    input.setAttribute('aria-expanded', String(!list.hidden))
    if (active >= 0) input.setAttribute('aria-activedescendant', `commune-${active}`)
  }
  const pick = i => {
    const c = results[i]
    if (!c) return
    input.value = c.name
    close()
    input.blur()
    onPick(c)
  }

  input.addEventListener('input', () => {
    clearTimeout(timer)
    timer = setTimeout(async () => {
      const id = ++query
      try {
        const found = await searchCommunes(input.value)
        if (id !== query) return
        results = found; active = found.length ? 0 : -1
        render()
      } catch {
        results = []; render()
      }
    }, 200)
  })
  input.addEventListener('keydown', e => {
    if (list.hidden) return
    if (e.key === 'ArrowDown') { active = (active + 1) % results.length; render(); e.preventDefault() }
    else if (e.key === 'ArrowUp') { active = (active - 1 + results.length) % results.length; render(); e.preventDefault() }
    else if (e.key === 'Enter') { pick(active); e.preventDefault() }
    else if (e.key === 'Escape') close()
  })
  input.addEventListener('blur', close)
  input.addEventListener('focus', () => input.select())
}
