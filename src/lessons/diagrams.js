// In-scene diagrams for lessons, in screen fractions (x from left, y from top).
// Lines and arrows live in a stretched SVG; labels are HTML so text never distorts.
const SVG = 'http://www.w3.org/2000/svg'

export function drawDiagrams(el, diagrams = [], inset = null) {
  const svg = document.createElementNS(SVG, 'svg')
  svg.setAttribute('viewBox', '0 0 100 100')
  svg.setAttribute('preserveAspectRatio', 'none')
  svg.innerHTML = '<defs><marker id="head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs>'
  const labels = []
  for (const d of diagrams) {
    const [x1, y1] = d.from.map(v => v * 100)
    if (d.type === 'arrow' || d.type === 'line') {
      const [x2, y2] = d.to.map(v => v * 100)
      const line = document.createElementNS(SVG, 'line')
      Object.entries({ x1, y1, x2, y2, 'vector-effect': 'non-scaling-stroke' }).forEach(([k, v]) => line.setAttribute(k, v))
      line.setAttribute('class', d.type)
      if (d.type === 'arrow') line.setAttribute('marker-end', 'url(#head)')
      svg.append(line)
    }
    if (d.text) {
      const label = document.createElement('span')
      label.className = 'diagram-label'
      label.textContent = d.text
      const [lx, ly] = d.type === 'label' ? d.from : d.to ?? d.from
      label.style.left = `${lx * 100}%`
      label.style.top = `${ly * 100}%`
      labels.push(label)
    }
  }
  const children = [svg, ...labels]
  if (inset) {
    const fig = document.createElement('figure')
    fig.className = 'inset'
    fig.innerHTML = `<img src="${import.meta.env.BASE_URL + inset.src}" alt=""><figcaption></figcaption>`
    fig.querySelector('figcaption').textContent = inset.credit
    children.push(fig)
  }
  el.replaceChildren(...children)
}
