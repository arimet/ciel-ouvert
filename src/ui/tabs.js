// Two tabs over the same scene: "Météo" hides the panel, "Comprendre" opens it.
export function mountTabs(buttons, panel, onChange = () => {}) {
  const select = name => {
    for (const b of buttons) b.setAttribute('aria-selected', String(b.dataset.tab === name))
    panel.hidden = name !== 'comprendre'
    onChange(name)
  }
  for (const b of buttons) b.addEventListener('click', () => select(b.dataset.tab))
  return { select }
}
